// src/offline/offlineSync.ts
//
// Java: SyncData/SyncOfflineDataFragment. Posts what was stored on the device for one task,
// in the same order Java does, removing each part once the server accepted it (so a retry after
// a later failure does not repost what already went through):
//   accept -> start/end -> before photos + note -> FSR checkpoints -> closure (tech notes,
//   devices, after photos, ...) -> payment -> documents

import { updateTaskStatus as updateTaskStatusApi } from '../api';
import { addPhotoBeforeTask, addTaskClosure } from '../api/task/taskService';
import { postChkpointData } from '../api/fsrManagement/fsrManagementService';
import { updateTaskWithEarnedAmount } from '../api/passbook/passbookService';
import { uploadTaskDoc } from '../api/taskList/taskListService';
import { getTaskListValidate } from '../api';
import { isNetworkAvailable } from './networkQuality';
import { getPendingTask, getPendingTasks, removePendingSection, removePendingTask } from './offlineStore';

export type SyncResult = { ok: boolean; message: string };

/**
 * True when the server no longer has the task (deleted by the admin): ValidateTaskDetails
 * answers 201 "No Data Found." -- the same signal the accept flow uses. Any other answer, or a
 * network failure, means "unknown" and the task is kept.
 */
const isTaskDeletedOnServer = async (taskId: number, newTaskId: string, userId: number): Promise<boolean> => {
  try {
    const res = await getTaskListValidate({ Userid: userId, TaskId: taskId, NewTaskId: newTaskId });
    return res?.Code === '201' && String(res?.Message ?? '').toLowerCase() === 'no data found.';
  } catch {
    return false;
  }
};

/**
 * Drops the stored work of tasks the admin has deleted so they disappear from the Sync screen.
 * Returns the task ids that were removed. Does nothing without a connection.
 */
export const purgeDeletedPendingTasks = async (userId?: number): Promise<{ taskId: number; newTaskId: string }[]> => {
  if (!(await isNetworkAvailable())) return [];
  const removed: { taskId: number; newTaskId: string }[] = [];
  for (const task of await getPendingTasks(userId)) {
    if (await isTaskDeletedOnServer(task.taskId, task.newTaskId, task.userId)) {
      await removePendingTask(task.taskId);
      removed.push({ taskId: task.taskId, newTaskId: task.newTaskId });
    }
  }
  return removed;
};

export const syncPendingTask = async (taskId: number): Promise<SyncResult> => {
  const task = await getPendingTask(taskId);
  if (!task) return { ok: true, message: 'Nothing to sync.' };

  if (await isTaskDeletedOnServer(task.taskId, task.newTaskId, task.userId)) {
    await removePendingTask(taskId);
    return { ok: false, message: 'This task was removed by the admin, so its offline data was cleared.' };
  }

  try {
    if (task.accept) {
      const res = await updateTaskStatusApi(task.accept);
      if (res?.Code !== '200') {
        return { ok: false, message: res?.Message || 'Failed to sync the task status.' };
      }
      await removePendingSection(taskId, 'accept');
    }

    if (task.statuses?.length) {
      for (const status of task.statuses) {
        const res = await updateTaskStatusApi(status);
        if (res?.Code !== '200') {
          return { ok: false, message: res?.Message || 'Failed to sync the task status.' };
        }
      }
      await removePendingSection(taskId, 'statuses');
    }

    if (task.beforePhotos) {
      const res = await addPhotoBeforeTask(task.beforePhotos);
      if (res?.Code !== '200') {
        return { ok: false, message: res?.Message || 'Failed to sync the before photos.' };
      }
      await removePendingSection(taskId, 'beforePhotos');
    }

    if (task.checkpoints?.length) {
      const res = await postChkpointData(task.checkpoints);
      if (res?.Code && res.Code !== '200') {
        return { ok: false, message: res.Message || 'Failed to sync the checkpoints.' };
      }
      await removePendingSection(taskId, 'checkpoints');
    }

    if (task.closure) {
      const res = await addTaskClosure(task.closure);
      if (res?.Code !== '200') {
        return { ok: false, message: res?.Message || 'Failed to sync the task closure.' };
      }
      await removePendingSection(taskId, 'closure');
    }

    if (task.payment) {
      const res = await updateTaskWithEarnedAmount(task.payment);
      if (res?.Code !== '200') {
        return { ok: false, message: res?.Message || 'Failed to sync the payment.' };
      }
      await removePendingSection(taskId, 'payment');
    }

    if (task.documents?.Files?.length) {
      const res = await uploadTaskDoc(task.documents);
      if (res?.Code && res.Code !== '200') {
        return { ok: false, message: res.Message || 'Failed to sync the documents.' };
      }
    }

    await removePendingTask(taskId);
    return { ok: true, message: 'Task updated successfully.' };
  } catch (err: any) {
    return { ok: false, message: err?.response?.data?.Message || err?.message || 'Sync failed.' };
  }
};
