// src/api/dashboard/dashboard.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each Dashboard endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/Task/TaskStatusCount.java ----
export interface TaskStatusCount {
  ResultData?: TaskStatusCountResultData[];
  Message?: string;
  Code?: string;
}

export interface TaskStatusCountResultData {
  Taskcount?: number;
  TaskStatusId?: number;
  Name?: string;
}

// ---- from DTO/Dashboard/GetDashboardDTO.java ----
export interface GetDashboardDTO {
  ResultData?: GetDashboardDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface GetDashboardDTOResultData {
  Attendance?: GetDashboardDTOAttendance;
  DateWiseTasksCount?: GetDashboardDTODateWiseTasksCount[];
  TasksCount?: GetDashboardDTOTasksCount[];
  TaskList?: GetDashboardDTOTaskList[];
}

export interface GetDashboardDTOAttendance {
  LeaveCount?: number;
  IdleCount?: number;
  PresentCount?: number;
  AbsentCount?: number;
  Date?: string;
}

export interface GetDashboardDTODateWiseTasksCount {
  TaskCreatedCount?: number;
  TaskCreatedDate?: string;
}

export interface GetDashboardDTOTasksCount {
  AvgCustomerRating?: string;
  AvgResolutionTime?: string;
  Taskcount?: number;
  TaskStatusId?: number;
  Name?: string;
}

export interface GetDashboardDTOTaskList {
  PaymentTransactionName?: string;
  PaymentProofImage?: string;
  QuotationName?: string;
  State?: string;
  FieldWorker_TAT?: string;
  Resolution_TAT?: string;
  Response_TAT?: string;
  CustomerTagName?: string;
  CustomerTagId?: number;
  TaskAcceptedDate?: string;
  TechnicalNotesDetails?: string;
  CountryName?: string;
  PinCode?: string;
  CityName?: string;
  PaymentModeName?: string;
  Task_TagName?: string;
  Task_TagId?: number;
  CreatorWithDetails?: GetDashboardDTOCreatorWithDetails;
  NewTaskId?: string;
  HappyCode?: number;
  ResponseCode?: number;
  ServiceName?: string;
  ServiceId?: number;
  CurrencySymbol?: string;
  CountryCode?: string;
  FSRName?: string;
  FSRId?: number;
  ModelNumber?: string;
  BrandName?: string;
  QuotationId?: number;
  WorkMode?: string;
  OnHoldTaskDtos?: GetDashboardDTOOnHoldTaskDtos;
  DeviceInfoList?: GetDashboardDTODeviceInfoList[];
  MultipleItemAssigned?: GetDashboardDTOMultipleItemAssigned[];
  RejectedTaskNotes?: string;
  DistanceUnitType?: string;
  RoundDistanceTravelled?: string;
  DistanceTravelled?: string;
  AudioFilePath?: string;
  PreDeviceInfoDto?: GetDashboardDTOPreDeviceInfoDto;
  FirstNameLastName?: string;
  TaskClosureStatus?: boolean;
  DateTimeStr?: string;
  PaymentModeId?: number;
  PaymentMode?: string;
  TechContactNo?: string;
  EarningAmount?: number;
  Quantity?: number;
  FullAddress?: string;
  PaymentNotReceived?: boolean;
  TechLongitude?: string;
  TechLatitude?: string;
  OwnerId?: number;
  Photo?: string;
  ItemName?: string;
  ItemId?: number;
  IsActive?: boolean;
  WagesPerHours?: number;
  UpdatedDate?: string;
  UpdatedBy?: string;
  CreatedDate?: string;
  CreatedBy?: number;
  Longitude?: string;
  Latitude?: string;
  LocationDesc?: string;
  Zipcode?: string;
  LocationName?: string;
  LocationId?: number;
  UserId?: number;
  AssignedTo?: string;
  TaskTime?: string;
  ContactNo?: string;
  CustomerEmailId?: string;
  CustomerName?: string;
  CustomerDetailsid?: number;
  TaskDate?: string;
  TaskType?: string;
  TaskTypeId?: number;
  TaskState?: number;
  TaskStatusId?: number;
  TaskStatus?: string;
  Description?: string;
  Name?: string;
  Id?: number;
}

export interface GetDashboardDTOCreatorWithDetails {
  ZoneName?: string;
  DesigationName?: string;
  UserGroupCode?: string;
  CreatedByFandLName?: string;
}

export interface GetDashboardDTOOnHoldTaskDtos {
  TaskStatus?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  Pick3?: string;
  Pick2?: string;
  Pick1?: string;
  OnHoldNotes?: string;
  UserId?: number;
  TaskId?: number;
  Id?: number;
}

export interface GetDashboardDTODeviceInfoList {
  DeviceReading?: number;
  UpdatedDate?: string;
  UpdatedBy?: string;
  CreatedDate?: string;
  CreatedBy?: string;
  UserId?: string;
  TaskClosureDetailsId?: number;
  DevicePhoto3?: string;
  DevicePhoto2?: string;
  DevicePhoto1?: string;
  ModelNumber?: string;
  DeviceName?: string;
  Id?: number;
}

export interface GetDashboardDTOMultipleItemAssigned {
  PurchasePrice?: number;
  SalesPrice?: number;
  UsedItemQty?: number;
  ItemName?: string;
  ItemIssuedId?: number;
  ItemQuantity?: number;
  ItemId?: number;
}

export interface GetDashboardDTOPreDeviceInfoDto {
  DeviceInfoImagePath2?: string;
  DeviceInfoImagePath1?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  TaskId?: number;
  DeviceInfoNotes?: string;
  DeviceInfoImagePath?: string;
  DeviceInfoImageName?: string;
  PreDeviceInfoId?: number;
}
