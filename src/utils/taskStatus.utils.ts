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
/**
 * Java sends `(int)(System.currentTimeMillis() % Integer.MAX_VALUE)` as
 * UpdateTaskStatus.Time on every status change (accept, start, end, reject).
 */
export const nowAsJavaTime = (): number => Date.now() % 2147483647;

/**
 * Whole kilometres between two points (haversine, straight line).
 * Java posts the Google Directions leg distance in km as UpdateTaskStatus.TotalDistance
 * on accept; this is the offline approximation of that value.
 */
export const distanceInWholeKm = (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number => {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(to.latitude - from.latitude);
  const dLon = rad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(from.latitude)) * Math.cos(rad(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};
