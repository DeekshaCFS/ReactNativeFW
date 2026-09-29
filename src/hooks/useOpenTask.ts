// src/hooks/useOpenTask.ts
//
// Single implementation of "what happens when the technician taps a task", shared by
// Home (today's tasks) and the Task tab. Ports the tap handlers of the Java app's
// TechDashboardFragmentNew.recyclerViewOperations() / MainTaskFragmentNew (FIELDWORKER
// branch), which route on TaskStatus + TaskState:
//
//   state 0/1  InActive  -> accept (or "too early" / late-reject by date)
//   state 0/1  Ongoing   -> route map -> countdown
//   state 0/1  OnHold    -> resume prompt
//   state 2    Rate mode -> Payment if closure done, else Closure   (AMC -> Closure)
//   state 3    closure not done -> Closure, else "completed" message

import { useCallback } from 'react';
import { Alert } from 'react-native';
import type { TasksListResultData as Task } from '../api/task/task.types';

// Java: a task more than this many days in the past can no longer be accepted, only rejected.
const MAX_ACCEPT_AGE_DAYS = 3;

const isRateMode = (task: Task) =>
  (task.PaymentMode ?? '').toLowerCase() === 'rate' && task.PaymentModeId === 2;

interface Options {
  /**
   * Called for an InActive task older than MAX_ACCEPT_AGE_DAYS (Java:
   * TaskDialogNew.rejectInactive_OldTaskAtFW). The screen decides how to collect the
   * rejection reason and photos.
   */
  onLateInactive: (task: Task) => void;
}

export function useOpenTask(navigation: any, { onLateInactive }: Options) {
  return useCallback(
    (task: Task) => {
      // ── Terminal states ──
      if (task.TaskStatus === 'Completed') {
        Alert.alert('Task Completed', 'This task has already been completed.');
        return;
      }
      if (task.TaskStatus === 'Rejected') {
        Alert.alert('Task Rejected', 'This task has been rejected.');
        return;
      }

      const goToClosureOrPayment = () => {
        // Java: Rate + closure already submitted -> Payment; otherwise (Rate without
        // closure, or AMC) -> Closure.
        if (isRateMode(task) && task.TaskClosureStatus === true) {
          navigation.navigate('PaymentReceived', { task });
        } else {
          navigation.navigate('TaskClosure', { task });
        }
      };

      // ── Ongoing ──
      if (task.TaskStatus === 'Ongoing') {
        switch (task.TaskState) {
          case 0: // NOT_STARTED
          case 1: // STARTED_NOT_ENDED
            navigation.navigate('TaskRouteMap', { task });
            break;
          case 2: // ENDED_NO_PAYMENT
            goToClosureOrPayment();
            break;
          case 3: // PAYMENT_RECEIVED
            if (task.TaskClosureStatus !== true) {
              navigation.navigate('TaskClosure', { task });
            } else {
              Alert.alert('Task Completed', 'This task is completed and payment is received.');
            }
            break;
          case 4: // TASK_CLOSURE
            Alert.alert('Task Closed', 'This task has already been closed.');
            break;
          default:
            navigation.navigate('TaskRouteMap', { task });
        }
        return;
      }

      // ── Not started (InActive / OnHold) ──
      if (task.TaskState === 0 || task.TaskState === 1) {
        if (task.TaskStatus === 'InActive') {
          const taskDate = new Date(task.TaskDate ?? '');
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          taskDate.setHours(0, 0, 0, 0);
          const diffDays = Math.round((today.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));

          if (taskDate > today) {
            Alert.alert('Too Early', "It's too early to accept this task!");
            return;
          }
          if (diffDays > MAX_ACCEPT_AGE_DAYS) {
            onLateInactive(task);
            return;
          }

          navigation.navigate('TaskTracking', { task });
          return;
        }

        if (task.TaskStatus === 'OnHold') {
          navigation.navigate('TaskTracking', { task, resumeOnHold: true });
          return;
        }
      }

      // ── Any other status that has already ended work ──
      if (task.TaskState === 2) {
        goToClosureOrPayment();
        return;
      }
      if (task.TaskState === 3) {
        if (!task.TaskClosureStatus) {
          navigation.navigate('TaskClosure', { task });
        } else {
          Alert.alert('Task Completed', 'This task is completed and payment is received.');
        }
      }
    },
    [navigation, onLateInactive],
  );
}
