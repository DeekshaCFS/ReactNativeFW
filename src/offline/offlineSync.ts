// src/offline/offlineSync.ts
//
// Java: SyncData/SyncOfflineDataFragment. Posts what was stored on the device for one task,
// in the same order Java does, removing each part once the server accepted it.
//
// Stage 1 handles the accept (UpdateTaskStatus). The remaining Java steps are added here as
// the matching offline sections are introduced:
//   accept -> custom fields -> before photos -> FOC request -> closure -> documents

import { updateTaskStatus as updateTaskStatusApi } from '../api';
import { getPendingTask, removePendingTask } from './offlineStore';

export type SyncResult = { ok: boolean; message: string };

export const syncPendingTask = async (taskId: number): Promise<SyncResult> => {
  const task = await getPendingTask(taskId);
  if (!task) return { ok: true, message: 'Nothing to sync.' };

  try {
    if (task.accept) {
      const res = await updateTaskStatusApi(task.accept);
      if (res?.Code !== '200') {
        return { ok: false, message: res?.Message || 'Failed to sync the task status.' };
      }
    }

    await removePendingTask(taskId);
    return { ok: true, message: 'Task updated successfully.' };
  } catch (err: any) {
    return { ok: false, message: err?.response?.data?.Message || err?.message || 'Sync failed.' };
  }
};
