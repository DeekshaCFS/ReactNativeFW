// src/api/notification/notification.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each Notification endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/Notification/RegisterDeviceId.java ----
export interface RegisterDeviceId {
  ResultData?: RegisterDeviceIdResultData;
  Message?: string;
  Code?: string;
}

export interface RegisterDeviceIdResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  UserDeviceId?: string;
  ToInstanceDeviceId?: string;
  Id?: number;
}

// ---- from DTO/Notification/Notification.java ----
export interface Notification {
  ResultData?: NotificationResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface NotificationResultData {
  AMCServiceDetailDtoObj?: NotificationAMCServiceDetailDtoObj;
  NotificationCount?: number;
  CommonDateTime?: string;
  IsNotificationActive?: boolean;
  IsRead?: boolean;
  PaymentModeId?: number;
  PaymentMode?: string;
  EarningAmount?: number;
  TechAddTime?: string;
  TechAddDate?: string;
  TaskClosureStatus?: boolean;
  PaymentNotReceived?: boolean;
  TaskTime?: string;
  TaskDate?: string;
  TaskState?: number;
  TaskTypeId?: number;
  TaskType?: string;
  TaskStatusId?: number;
  TaskName?: string;
  TaskStatus?: string;
  TaskId?: number;
  NotificationDay?: string;
  OwnerId?: number;
  UserId?: number;
  LastName?: string;
  FirstName?: string;
  NotificationTime?: string;
  NotificationDate?: string;
  NotificationType?: string;
  Id?: number;
  IsRegistered?: boolean;
}

export interface NotificationAMCServiceDetailDtoObj {
  TaskDetails?: NotificationTaskDetails;
  AMCTypeName?: string;
  ActualAMCSeriveDate?: string;
  HoursNo?: number;
  DaysNo?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  ServiceOccuranceType?: string;
  AMCSetReminderType?: string;
  AMCSetReminderId?: number;
  TotalServices?: number;
  ServiceOccuranceId?: number;
  CustomerName?: string;
  ActivationTime?: string;
  ActivationDate?: string;
  AMCName?: string;
  AMCTypeId?: number;
  ServiceNo?: number;
  AMCServiceDate?: string;
  AMCsId?: number;
  AMCServiceDetailsId?: number;
}

export interface NotificationTaskDetails {
  TaskTime?: string;
  TaskDate?: string;
  TaskStatus?: number;
  TechnicianUserId?: string;
  TechnicianName?: string;
  TaskName?: string;
  TaskId?: number;
}

// ---- from DTO/Notification/UpdateNotificationIsRead.java ----
export interface UpdateNotificationIsRead {
  Message?: string;
  Code?: string;
  // Java source reuses Notification.RegisterDeviceId.ResultData directly
  ResultData?: RegisterDeviceIdResultData;
  TaskClosureStatus?: boolean;
  PaymentMode?: number;
  TaskState?: number;
  PaymentNotReceived?: boolean;
  TaskType?: number;
  TaskStatus?: number;
  NotificationType?: string;
  OwnerId?: number;
  UserId?: number;
  IsRead?: boolean;
  TaskId?: number;
  Id?: number;
  AMCServiceDetailsId?: number;
}
