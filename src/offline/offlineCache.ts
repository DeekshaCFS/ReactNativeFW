// src/offline/offlineCache.ts
//
// Read-through cache for lookups the task flow needs while the network is gone (FSR
// checkpoint categories, HNG flag). Fetch while online, remember the answer, and serve the
// remembered one when the call fails.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllchkpointCategory } from '../api/fsrManagement/fsrManagementService';
import { getCustomFieldData } from '../api/users/usersService';
import { isNetworkAvailable } from './networkQuality';

const PREFIX = 'offline_cache:';

export const cachedFetch = async <T>(key: string, fetcher: () => Promise<T>): Promise<{ data: T; fromCache: boolean }> => {
  try {
    const data = await fetcher();
    AsyncStorage.setItem(PREFIX + key, JSON.stringify(data)).catch(() => {});
    return { data, fromCache: false };
  } catch (err) {
    try {
      const raw = await AsyncStorage.getItem(PREFIX + key);
      if (raw) return { data: JSON.parse(raw) as T, fromCache: true };
    } catch {
      // fall through to the original error
    }
    throw err;
  }
};

// ── FSR checkpoint prefetch ─────────────────────────────────────────────────────────────────
// Java only loads the FSR checklist when the sheet is opened (and needs a connection for it).
// To let the checklist open offline for a task that was accepted offline, it is downloaded
// ahead of time for the tasks the technician can see, whenever a task list loads online.

export const fsrCacheKey = (userId: number | string, taskId: number | string) => `fsr:${userId}:${taskId}`;

export const customFieldsCacheKey = (userId: number | string, taskId: number | string) => `customFields:${userId}:${taskId}`;

/** Re-read a task's Task Input fields into the cache (e.g. right after the technician saved them). */
export const refreshCustomFieldsCache = async (userId: number, taskId: number) => {
  try {
    const data = await getCustomFieldData({ UserId: userId, TaskId: taskId });
    await AsyncStorage.setItem(PREFIX + customFieldsCacheKey(userId, taskId), JSON.stringify(data));
  } catch {
    // best effort
  }
};

const prefetched = new Set<string>();

export const prefetchFsrForTasks = async (
  userId: number,
  tasks: { Id?: number; FSRId?: number; TaskStatus?: string }[],
) => {
  if (!userId) return;
  const todo = tasks.filter(
    t =>
      t.Id != null &&
      t.TaskStatus !== 'Completed' &&
      t.TaskStatus !== 'Rejected' &&
      !prefetched.has(fsrCacheKey(userId, t.Id)),
  );
  if (todo.length === 0 || !(await isNetworkAvailable())) return;

  // Two at a time so a long list does not hog the connection.
  for (let i = 0; i < todo.length; i += 2) {
    await Promise.all(
      todo.slice(i, i + 2).map(async t => {
        const key = fsrCacheKey(userId, t.Id as number);
        try {
          // Which Task Input fields are mandatory: lets the offline closure enforce them.
          await refreshCustomFieldsCache(userId, t.Id as number);
          if ((t.FSRId ?? 0) > 0) {
            const data = await getAllchkpointCategory({ UserId: userId, TaskId: t.Id });
            await AsyncStorage.setItem(PREFIX + key, JSON.stringify(data));
          }
          prefetched.add(key);
        } catch {
          // best effort -- it is fetched again when the sheet opens
        }
      }),
    );
  }
};
