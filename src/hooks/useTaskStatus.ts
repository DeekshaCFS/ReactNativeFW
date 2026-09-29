// src/hooks/useTaskStatus.ts

import { useState, useCallback, useRef } from 'react';
import { GetAllTaskListDTOResultData as Task } from '../api/task/task.types';
import { getTaskListValidate, updateTaskStatus as updateTaskStatusApi, postOnHoldTASKDetails } from '../api';
import { TASK_STATUS_ID } from '../constants/taskStatus';
import { nowAsJavaTime, distanceInWholeKm } from '../utils/taskStatus.utils';
import { fetchDrivingRoute } from '../utils/routing';
import { requestLocationPermission, getCurrentPosition, Coordinates } from '../utils/locationPermision';

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
  /**
   * True when the last accept/reject failed because the server no longer has the task
   * (ValidateTaskDetails -> 201 "No Data Found."). Java sends the user back to Home to
   * refresh; callers should do the same. A function (ref read) so it is current right
   * after the awaited call, before React re-renders.
   */
  wasTaskUnavailable: () => boolean;
  acceptTask: (task: Task, userId: number, responseCode?: string, isResume?: boolean) => Promise<Task | null>;
  /**
   * OnHold -> Ongoing. Java (TechDashboardFragmentNew.updateTask) validates the task, then
   * posts OnHoldTaskDetails with TaskStatus=3 and the note "OnHold To On-going" -- it does
   * not go through UpdateTaskStatus. Resolves to the task ready to continue (started
   * state), or null on failure.
   */
  resumeTask: (task: Task, userId: number) => Promise<Task | null>;
  rejectTask: (
    task: Task,
    userId: number,
    reason: string,
    photos?: { uri: string; base64?: string }[],
    note?: string
  ) => Promise<boolean>;
}

// Best-effort distance from the technician to the task location, in whole km
// (Java sends this as TotalDistance on accept). Never blocks or fails the accept.
const distanceToTaskKm = async (task: Task): Promise<number> => {
  try {
    const lat = parseFloat(task.Latitude ?? '');
    const lng = parseFloat(task.Longitude ?? '');
    if (!lat || !lng) return 0;

    const granted = await requestLocationPermission();
    if (!granted) return 0;

    const here = await Promise.race<Coordinates | null>([
      getCurrentPosition(),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 5000)),
    ]);
    if (!here) return 0;

    const destination = { latitude: lat, longitude: lng };
    // Java posts the Google Directions leg distance; use the road route when available
    // and fall back to the straight-line distance.
    const route = await fetchDrivingRoute(here, destination, 4000);
    return route ? Math.round(route.distanceKm) : distanceInWholeKm(here, destination);
  } catch {
    return 0;
  }
};

// After an ambiguous 500, confirm via ValidateTaskDetails whether the task really is Ongoing.
const taskIsOngoing = async (task: Task, userId: number): Promise<boolean> => {
  try {
    const check = await getTaskListValidate({
      Userid: userId,
      TaskId: task.Id,
      NewTaskId: task.NewTaskId ?? '',
    });
    return check?.Code === '200' && check?.ResultData?.TaskStatus === TASK_STATUS_ID.Ongoing;
  } catch {
    return false;
  }
};

export function useTaskStatus(): UseTaskStatusReturn {
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const taskUnavailableRef = useRef(false);
  const wasTaskUnavailable = useCallback(() => taskUnavailableRef.current, []);

  const acceptTask = useCallback(
    async (task: Task, userId: number, responseCode?: string, isResume = false): Promise<Task | null> => {
      setActionState('loading');
      setErrorMessage(null);
      taskUnavailableRef.current = false;

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
        taskUnavailableRef.current =
          validation?.Code === '201' && validation?.Message?.toLowerCase() === 'no data found.';
        setActionState('error');
        setErrorMessage(
          taskUnavailableRef.current
            ? 'This task is no longer available.'
            : validation?.Message ?? 'Task could not be validated',
        );
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
        const totalDistance = await distanceToTaskKm(task);

        const res = await updateTaskStatusApi({
          TaskId: task.Id,
          UserId: userId,
          TaskStatus: TASK_STATUS_ID.Ongoing,
          TaskState: isResume ? 1 : 0,   // STARTED_NOT_ENDED vs NOT_STARTED
          TotalDistance: totalDistance,
          RejectedTaskNotes: '',
          Time: nowAsJavaTime(),
        });

        // Java only proceeds on Code "200"; anything else is surfaced, not swallowed.
        if (res?.Code !== '200') {
          setActionState('error');
          setErrorMessage(res?.Message ?? 'Failed to accept task');
          return null;
        }
      } catch (err: any) {
        const status = err?.status ?? err?.response?.status;

        // A 500 can come back even though the write went through. Don't assume:
        // ask the server for the task's real status before deciding.
        if (status === 500 && (await taskIsOngoing(task, userId))) {
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

  const resumeTask = useCallback(
    async (task: Task, userId: number): Promise<Task | null> => {
      setActionState('loading');
      setErrorMessage(null);
      taskUnavailableRef.current = false;

      try {
        const validation = await getTaskListValidate({
          Userid: userId,
          TaskId: task.Id,
          NewTaskId: task.NewTaskId ?? '',
        });

        if (validation?.Code !== '200') {
          taskUnavailableRef.current =
            validation?.Code === '201' && validation?.Message?.toLowerCase() === 'no data found.';
          setActionState('error');
          setErrorMessage(
            taskUnavailableRef.current
              ? 'This task is no longer available.'
              : validation?.Message ?? 'Task could not be validated',
          );
          return null;
        }

        const res = await postOnHoldTASKDetails({
          TaskId: task.Id,
          UserId: userId,
          OnHoldNotes: 'OnHold To On-going',
          TaskStatus: TASK_STATUS_ID.Ongoing,
        });

        if (res?.Code !== '200') {
          setActionState('error');
          setErrorMessage(res?.Message ?? 'Failed to resume task');
          return null;
        }

        setActionState('idle');
        // A task can only be put on hold after it was started, so it resumes as
        // STARTED_NOT_ENDED (Java's countdown screen shows "continue" for that state).
        return { ...task, TaskStatus: 'Ongoing', TaskStatusId: TASK_STATUS_ID.Ongoing, TaskState: 1 };
      } catch (err: any) {
        setActionState('error');
        setErrorMessage(err?.message ?? 'Failed to resume task');
        return null;
      }
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
      taskUnavailableRef.current = false;

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
        taskUnavailableRef.current =
          validation?.Code === '201' && validation?.Message?.toLowerCase() === 'no data found.';
        setActionState('error');
        setErrorMessage(
          taskUnavailableRef.current
            ? 'This task is no longer available.'
            : validation?.Message ?? 'Task could not be validated',
        );
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

        const res = await updateTaskStatusApi({
          TaskId: task.Id,
          UserId: userId,
          TaskStatus: TASK_STATUS_ID.Rejected,
          TaskState: 0,
          TotalDistance: 0,
          RejectedTaskNotes: note ? `${reason} – ${note}` : reason,
          Time: nowAsJavaTime(),
          ...(Task_Rejected_Image_Dtls.length ? { Task_Rejected_Image_Dtls } : {}),
        });

        if (res?.Code !== '200') {
          setActionState('error');
          setErrorMessage(res?.Message ?? 'Failed to reject task');
          return false;
        }

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

  return { actionState, errorMessage, wasTaskUnavailable, acceptTask, resumeTask, rejectTask };
}