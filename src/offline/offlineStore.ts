// src/offline/offlineStore.ts
//
// Java: FieldWeb/Database/DatabaseHandler -- the SQLite tables that hold task work done on
// a poor connection (acceptTask1_tbl, SummaryDetails_tbl, ...), each row flagged isSyncDone=0
// until it is posted from the Sync screen.
//
// Here the same data is kept as one JSON record per task (a "pending task"), with one optional
// section per Java table group, written to a file in the app's private storage. Photos and
// documents are stored as base64 inside the record, so there is no separate file bookkeeping.

import RNFS from 'react-native-fs';
import type { UpdateTaskStatus } from '../api/task/task.types';

const STORE_PATH = `${RNFS.DocumentDirectoryPath}/offline_pending_tasks.json`;

/** acceptTask1_tbl row: the UpdateTaskStatus body that was never posted. */
export type PendingAccept = Partial<UpdateTaskStatus> & {
  TaskId: number;
  UserId: number;
  TaskStatus: number;
  TaskState: number;
};

export type PendingTask = {
  taskId: number;
  newTaskId: string;
  userId: number;
  taskName?: string;
  createdAt: number;
  /** "0" = pending, mirrors Java's isSyncDone. */
  isSyncDone: '0';
  accept?: PendingAccept;
};

type Store = { version: 1; tasks: PendingTask[] };

let memory: Store | null = null;
// Writes are chained so two quick saves cannot interleave and corrupt the file.
let writeChain: Promise<void> = Promise.resolve();

const load = async (): Promise<Store> => {
  if (memory) return memory;
  try {
    if (await RNFS.exists(STORE_PATH)) {
      const parsed = JSON.parse(await RNFS.readFile(STORE_PATH, 'utf8'));
      if (parsed && Array.isArray(parsed.tasks)) {
        memory = { version: 1, tasks: parsed.tasks };
        return memory;
      }
    }
  } catch {
    // A corrupt file is treated as empty rather than blocking the app.
  }
  memory = { version: 1, tasks: [] };
  return memory;
};

const persist = (store: Store) => {
  const snapshot = JSON.stringify(store);
  writeChain = writeChain.then(() => RNFS.writeFile(STORE_PATH, snapshot, 'utf8')).catch(() => {});
  return writeChain;
};

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

/** Subscribe to changes (Sync screen refresh). Returns the unsubscribe function. */
export const subscribeOffline = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export const getPendingTasks = async (userId?: number): Promise<PendingTask[]> => {
  const { tasks } = await load();
  return userId == null ? [...tasks] : tasks.filter(t => t.userId === userId);
};

export const getPendingTask = async (taskId: number): Promise<PendingTask | undefined> =>
  (await load()).tasks.find(t => t.taskId === taskId);

export const hasPendingData = async (userId?: number) => (await getPendingTasks(userId)).length > 0;

/** Insert or merge a section into the pending record of a task. */
export const savePendingTask = async (
  base: Pick<PendingTask, 'taskId' | 'newTaskId' | 'userId' | 'taskName'>,
  sections: Partial<Pick<PendingTask, 'accept'>>,
) => {
  const store = await load();
  const existing = store.tasks.find(t => t.taskId === base.taskId);
  if (existing) {
    Object.assign(existing, sections);
  } else {
    store.tasks.push({ ...base, createdAt: Date.now(), isSyncDone: '0', ...sections });
  }
  await persist(store);
  notify();
};

export const removePendingTask = async (taskId: number) => {
  const store = await load();
  store.tasks = store.tasks.filter(t => t.taskId !== taskId);
  await persist(store);
  notify();
};

/** Java: "Clear All Records" -> deleteNotSyncedRows on every offline table. */
export const clearPendingTasks = async (userId?: number) => {
  const store = await load();
  store.tasks = userId == null ? [] : store.tasks.filter(t => t.userId !== userId);
  await persist(store);
  notify();
};
