// src/constants/taskStatus.ts
// Extracted from the duplicated local definitions previously in
// hooks/useTaskStatus.ts, screens/technician/main/PaymentReceivedScreen.tsx,
// and screens/technician/main/TaskExecutionScreen.tsx.
// NOTE: the three original copies disagreed on casing ("Inactive" vs "InActive");
// this version standardizes on "InActive" (majority usage) — verify against the
// backend contract (matches Util/TaskStatus.java) before relying on it elsewhere.
export const TASK_STATUS_ID = {
  Completed: 1,
  Rejected: 2,
  Ongoing: 3,
  InActive: 4,
  OnHold: 5,
} as const;

export type TaskStatusId = (typeof TASK_STATUS_ID)[keyof typeof TASK_STATUS_ID];
