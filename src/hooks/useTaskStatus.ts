// src/hooks/useTaskStatus.ts

import { useState, useCallback } from 'react';
import { GetAllTaskListDTOResultData as Task } from '../api/task/task.types';
import { getTaskListValidate, updateTaskStatus as updateTaskStatusApi } from '../api';
import { TASK_STATUS_ID } from '../constants/taskStatus';

type ActionState = 'idle' | 'loading' | 'error';

export class TaskStatusAmbiguousError extends Error {
  constructor(message = 'Server error — task state is unknown') {
    super(message);
    this.name = 'TaskStatusAmbiguousError';
  }
}

interface UseTaskStatusReturn {
  actionState: ActionState;
  errorMessage: string | null;
  acceptTask: (task: Task, userId: number, responseCode?: string, isResume?: boolean) => Promise<Task | null>;
  rejectTask: (
    task: Task,
    userId: number,
    reason: string,
    photos?: { uri: string; base64?: string }[],
    note?: string
  ) => Promise<boolean>;
}

const nowAsJavaTime = () => Date.now() % 2147483647;

export function useTaskStatus(): UseTaskStatusReturn {
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const acceptTask = useCallback(
    async (task: Task, userId: number, responseCode?: string, isResume = false): Promise<Task | null> => {
      setActionState('loading');
      setErrorMessage(null);

      let validation;
      try {
        validation = await getTaskListValidate({
          Userid: userId,
          TaskId: task.Id,
          NewTaskId: task.NewTaskId ?? '',
        });
      } catch (err: any) {
        setActionState('error');
        setErrorMessage(err?.message ?? 'Failed to validate task');
        return null;
      }

      if (validation?.Code !== '200') {
        setActionState('error');
        setErrorMessage(validation?.Message ?? 'Task could not be validated');
        return null;
      }

      if (task.ResponseCode && Number(task.ResponseCode) !== 0) {
        if (!responseCode || Number(responseCode) !== Number(task.ResponseCode)) {
          setActionState('error');
          setErrorMessage('Please enter a valid response code');
          return null;
        }
      }

      try {
        const staticDistance = 0;

        await updateTaskStatusApi({
          TaskId: task.Id,
          UserId: userId,
          TaskStatus: TASK_STATUS_ID.Ongoing,
          TaskState: isResume ? 1 : 0,   // STARTED_NOT_ENDED vs NOT_STARTED
          TotalDistance: staticDistance,
          RejectedTaskNotes: '',
          Time: nowAsJavaTime(),
        });
      } catch (err: any) {
        const status = err?.status ?? err?.response?.status;

        if (status === 500) {
          setActionState('idle');
          return { ...task, TaskStatus: 'Ongoing', TaskStatusId: TASK_STATUS_ID.Ongoing, TaskState: isResume ? 1 : 0 };
        }

        setActionState('error');
        setErrorMessage(err?.message ?? 'Failed to accept task');
        return null;
      }

      setActionState('idle');
      return { ...task, TaskStatus: 'Ongoing', TaskStatusId: TASK_STATUS_ID.Ongoing, TaskState: isResume ? 1 : 0 };
    },
    []
  );

  const rejectTask = useCallback(
    async (
      task: Task,
      userId: number,
      reason: string,
      photos?: { uri: string; base64?: string }[],
      note?: string
    ): Promise<boolean> => {
      setActionState('loading');
      setErrorMessage(null);

      let validation;
      try {
        validation = await getTaskListValidate({
          Userid: userId,
          TaskId: task.Id,
          NewTaskId: task.NewTaskId ?? '',
        });
      } catch (err: any) {
        setActionState('error');
        setErrorMessage(err?.message ?? 'Failed to validate task');
        return false;
      }

      if (validation?.Code !== '200') {
        setActionState('error');
        setErrorMessage(validation?.Message ?? 'Task could not be validated');
        return false;
      }

      try {
        const Task_Rejected_Image_Dtls = (photos ?? [])
          .filter(p => !!p?.base64)
          .map(p => ({
            ImagePath: p.base64,
            TaskId: task.Id,
            RejectedBy: userId,
          }));

        await updateTaskStatusApi({
          TaskId: task.Id,
          UserId: userId,
          TaskStatus: TASK_STATUS_ID.Rejected,
          TaskState: 0,
          TotalDistance: 0,
          RejectedTaskNotes: note ? `${reason} – ${note}` : reason,
          Time: nowAsJavaTime(),
          ...(Task_Rejected_Image_Dtls.length ? { Task_Rejected_Image_Dtls } : {}),
        });

        setActionState('idle');
        return true;
      } catch (err: any) {
        setActionState('error');
        setErrorMessage(err?.message ?? 'Failed to reject task');
        return false;
      }
    },
    []
  );

  return { actionState, errorMessage, acceptTask, rejectTask };
}