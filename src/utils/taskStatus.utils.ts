// src/utils/taskStatus.utils.ts

export type TaskStatusId = 1 | 2 | 3 | 4 | 5;

export interface TaskStatusMeta {
  label: string;
  // matches the keys you already use in your ribbon StyleSheet
  styleKey: 'ribbonCompleted' | 'ribbonOngoing' | 'ribbonRejected' | 'ribbonInactive' | 'ribbonOnHold';
}

export const TASK_STATUS_MAP: Record<TaskStatusId, TaskStatusMeta> = {
  1: { label: 'Completed', styleKey: 'ribbonCompleted' },
  2: { label: 'Rejected',  styleKey: 'ribbonRejected'  },
  3: { label: 'Ongoing',   styleKey: 'ribbonOngoing'   },
  4: { label: 'Inactive',  styleKey: 'ribbonInactive'  },
  5: { label: 'On Hold',   styleKey: 'ribbonOnHold'    },
};

//Task State id
//Completed: 3
//Inactive: 0
//Rejected: 0
//Ongoing: 0

export const getStatusMeta = (id?: number): TaskStatusMeta =>
  TASK_STATUS_MAP[(id ?? 4) as TaskStatusId] ?? TASK_STATUS_MAP[4];