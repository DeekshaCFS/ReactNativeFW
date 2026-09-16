// src/api/task/task.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each Task endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/Task/GetAllTaskListDTO.java ----
export interface GetAllTaskListDTO {
  ResultData?: GetAllTaskListDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface GetAllTaskListDTOResultData {
  SerialNo?: string;
  Task_Rejected_Image_Dtls?: GetAllTaskListDTOTask_Rejected_Image_Dtls[];
  TaskAddress?: GetAllTaskListDTOTaskAddress;
  CustomeFieldDTO?: GetAllTaskListDTOCustomeFieldDTO[];
  RatingRemark?: string;
  TaskClosureDetailsId?: number;
  OnHoldTaskRemarks?: string;
  RejectedTaskRemarks?: string;
  TechZone?: string;
  ToTechAddress?: string;
  TimeConsumed?: string;
  TaskEndTime?: string;
  TaskEndDate?: string;
  TaskStartTime?: string;
  TaskStartDate?: string;
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
  CreatorWithDetails?: GetAllTaskListDTOCreatorWithDetails;
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
  OnHoldTaskDtos?: GetAllTaskListDTOOnHoldTaskDtos;
  DeviceInfoList?: GetAllTaskListDTODeviceInfoList[];
  MultipleItemAssigned?: GetAllTaskListDTOMultipleItemAssigned[];
  RejectedTaskNotes?: string;
  DistanceUnitType?: string;
  RoundDistanceTravelled?: string;
  DistanceTravelled?: string;
  AudioFilePath?: string;
  PreDeviceInfoDto?: GetAllTaskListDTOPreDeviceInfoDto;
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
  UpdatedBy?: number;
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

export interface GetAllTaskListDTOTask_Rejected_Image_Dtls {
  UpdatedBy?: number;
  UpdatedDate?: string;
  CreatedBy?: number;
  CreatedDate?: string;
  IsActive?: boolean;
  RejectedDate?: string;
  RejectedBy?: number;
  ReasonForRejection?: string;
  ImagePath?: string;
  TaskId?: number;
  Rej_Id?: number;
}

export interface GetAllTaskListDTOTaskAddress {
  State?: string;
  City?: string;
  PinCode?: string;
  Notes?: string;
  RepNo?: string;
  RepName?: string;
  LandMarkPACI?: string;
  Address?: string;
  StreetBuildingFlat?: string;
  AddressName?: string;
  AddressId?: number;
}

export interface GetAllTaskListDTOCustomeFieldDTO {
  DropdownValue?: string[];
  IsRequired?: boolean;
  FieldTypeName?: string;
  FieldTypeId?: number;
  UserValue?: string;
  Label?: string;
  InputId?: number;
  FieldId?: any;
  SerialNo?: number;
}

export interface GetAllTaskListDTOCreatorWithDetails {
  ShortCreatedByFandLName?: string;
  ZoneName?: string;
  DesigationName?: string;
  UserGroupCode?: string;
  UserID?: number;
  CreatedByFandLName?: string;
}

export interface GetAllTaskListDTOOnHoldTaskDtos {
  TaskStatus?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  Images?: GetAllTaskListDTOImages[];
  Pick3?: string;
  Pick2?: string;
  Pick1?: string;
  OnHoldNotes?: string;
  UserId?: number;
  TaskId?: number;
  Id?: number;
}

export interface GetAllTaskListDTOImages {
  Base64File?: string;
  FileExtension?: string;
  ConvertedFileName?: string;
  OriginalFileName?: string;
  FilePath?: string;
  FileId?: number;
}

export interface GetAllTaskListDTODeviceInfoList {
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

export interface GetAllTaskListDTOMultipleItemAssigned {
  PurchasePrice?: number;
  SalesPrice?: number;
  UsedItemQty?: number;
  ItemName?: string;
  ItemIssuedId?: number;
  ItemQuantity?: number;
  ItemId?: number;
}

export interface GetAllTaskListDTOPreDeviceInfoDto {
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

// ---- from DTO/Task/AddTaskRoutineService.java ----
export interface AddTaskRoutineService {
  ResultData?: AddTaskRoutineServiceResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface AddTaskRoutineServiceResultData {
  lstSelectedCheckpoint?: AddTaskRoutineServiceLstSelectedCheckpoint[];
  FSRId?: number;
  ModelNumber?: string;
  BrandName?: string;
  QuotationId?: number;
  LeadId?: number;
  OnHoldTaskId?: number;
  MultipleItemAssigned?: AddTaskRoutineServiceMultipleItemAssigned[];
  Base64AudioString?: string;
  NewAddedTaskId?: number;
  AudioFilePath?: string;
  CustomerDetailsid?: number;
  AMCServiceDetailsId?: number;
  PaymentModeId?: number;
  PaymentMode?: string;
  ItemQuantity?: number;
  IsModelError?: boolean;
  IsSuccessful?: boolean;
  LocIsActive?: boolean;
  PinCode?: string;
  Address?: string;
  LocDescription?: string;
  Longitude?: string;
  latitude?: string;
  LocName?: string;
  UpdatedBy?: number;
  CreatedBy?: number;
  IsActive?: boolean;
  ItemId?: number;
  UserId?: number;
  WagesPerHour?: number;
  ContactNo?: string;
  CustomerName?: string;
  LocationId?: number;
  Time?: string;
  TaskDate?: string;
  TaskType?: number;
  TaskStatus?: number;
  Description?: string;
  Name?: string;
  Id?: number;
}

export interface AddTaskRoutineServiceLstSelectedCheckpoint {
  IsActive?: boolean;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  InputTextId?: number;
  CheckpointId?: number;
  CategoryId?: number;
  FSRId?: number;
  SelectedCheckpointId?: number;
}

export interface AddTaskRoutineServiceMultipleItemAssigned {
  UsedItemQty?: number;
  ItemName?: string;
  ItemIssuedId?: number;
  ItemQuantity?: number;
  ItemId?: number;
}

// ---- from DTO/Task/UpdateTaskStatus.java ----
export interface UpdateTaskStatus {
  Task_Rejected_Image_Dtls?: UpdateTaskStatusTask_Rejected_Image_Dtls[];
  Message?: string;
  Code?: string;
  RejectedTaskNotes?: string;
  TotalDistance?: number;
  TaskState?: number;
  Time?: number;
  TaskStatus?: number;
  UserId?: number;
  TaskId?: number;
  NewTaskId?: string;
  isSyncDone?: string;
}

export interface UpdateTaskStatusTask_Rejected_Image_Dtls {
  UpdatedBy?: number;
  UpdatedDate?: string;
  CreatedBy?: number;
  CreatedDate?: string;
  IsActive?: boolean;
  RejectedDate?: string;
  RejectedBy?: number;
  ReasonForRejection?: string;
  ImagePath?: string;
  TaskId?: number;
  Rej_Id?: number;
}

// ---- from DTO/Task/DeActiveTasksList.java ----
export interface DeActiveTasksList {
  ResultData?: DeActiveTasksListResultData[];
  Message?: string;
  Code?: string;
}

export interface DeActiveTasksListResultData {
  TechLongitude?: string;
  TechLatitude?: string;
  Photo?: string;
  ItemName?: string;
  ItemId?: number;
  IsActive?: boolean;
  WagesPerHours?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
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
  CustomerName?: string;
  TaskDate?: string;
  TaskType?: string;
  TaskTypeId?: number;
  TaskStatusId?: number;
  TaskStatus?: string;
  Description?: string;
  Name?: string;
  Id?: number;
  StartDate?: number;
  EndDate?: number;
  PaymentNotReceived?: boolean;
  FullAddress?: string;
  TaskState?: number;
}

// ---- from DTO/User/LocationUpdateToServer.java ----
export interface LocationUpdateToServer {
  Message?: string;
  Code?: string;
}

// ---- from DTO/User/GetLiveLocation.java ----
export interface GetLiveLocation {
  ResultData?: GetLiveLocationResultData[];
  Message?: string;
  Code?: string;
}

export interface GetLiveLocationResultData {
  UpdatedDateTime?: string;
  Longitude?: string;
  Latitude?: string;
  UserId?: number;
  Id?: number;
}

// ---- from DTO/Task/ReassignTask.java ----
export interface ReassignTask {
  ResultData?: ReassignTaskResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface ReassignTaskResultData {
  OnHoldTaskId?: number;
  MultipleItemAssigned?: ReassignTaskMultipleItemAssigned[];
  Base64AudioString?: string;
  NewAddedTaskId?: number;
  AudioFilePath?: string;
  CustomerDetailsid?: number;
  AMCServiceDetailsId?: number;
  PaymentModeId?: number;
  PaymentMode?: string;
  ItemQuantity?: number;
  IsModelError?: boolean;
  IsSuccessful?: boolean;
  LocIsActive?: boolean;
  PinCode?: string;
  Address?: string;
  LocDescription?: string;
  Longitude?: string;
  latitude?: string;
  LocName?: string;
  UpdatedBy?: number;
  CreatedBy?: number;
  IsActive?: boolean;
  ItemId?: number;
  UserId?: number;
  WagesPerHour?: number;
  ContactNo?: string;
  CustomerName?: string;
  LocationId?: number;
  Time?: string;
  TaskDate?: string;
  TaskType?: number;
  TaskStatus?: number;
  Description?: string;
  Name?: string;
  Id?: number;
}

export interface ReassignTaskMultipleItemAssigned {
  UsedItemQty?: number;
  ItemName?: string;
  ItemIssuedId?: number;
  ItemQuantity?: number;
  ItemId?: number;
}

// ---- from DTO/Task/ReassignTaskDTO.java ----
export interface ReassignTaskDTO {
  State?: string;
  City?: string;
  TaskTagId?: number;
  NewTaskId?: string;
  ServiceId?: number;
  CountryDetailsId?: number;
  CustomerTagId?: number;
  BuildingNumber?: string;
  lstSelectedCheckpoint?: ReassignTaskDTOLstSelectedCheckpoint[];
  FSRId?: number;
  ModelNumber?: string;
  BrandName?: string;
  QuotationId?: number;
  LeadId?: number;
  OnHoldTaskId?: number;
  MultipleItemAssigned?: ReassignTaskDTOMultipleItemAssigned[];
  Base64AudioString?: string;
  NewAddedTaskId?: number;
  AudioFilePath?: string;
  CustomerDetailsid?: number;
  AMCServiceDetailsId?: number;
  PaymentModeId?: number;
  PaymentMode?: string;
  ItemQuantity?: number;
  IsModelError?: boolean;
  IsSuccessful?: boolean;
  LocIsActive?: boolean;
  PinCode?: string;
  Address?: string;
  LocDescription?: string;
  Longitude?: string;
  latitude?: string;
  LocName?: string;
  UpdatedBy?: number;
  CreatedBy?: number;
  IsActive?: boolean;
  ItemId?: number;
  UserId?: number;
  WagesPerHour?: number;
  ContactNo?: string;
  CustomerName?: string;
  LocationId?: number;
  Time?: string;
  TaskDate?: string;
  TaskType?: number;
  TaskStatus?: number;
  Description?: string;
  Name?: string;
  EnquiryId?: number;
  Id?: number;
  ResultData?: string;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface ReassignTaskDTOLstSelectedCheckpoint {
  IsActive?: boolean;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  InputTextId?: number;
  CheckpointId?: number;
  CategoryId?: number;
  FSRId?: number;
  SelectedCheckpointId?: number;
}

export interface ReassignTaskDTOMultipleItemAssigned {
  PurchasePrice?: number;
  SalesPrice?: number;
  UsedItemQty?: number;
  ItemName?: string;
  ItemIssuedId?: number;
  ItemQuantity?: number;
  ItemId?: number;
}

// ---- from DTO/Task/TasksList.java ----
export interface TasksList {
  ResultData?: TasksListResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface TasksListResultData {
  OnHoldTaskDtos?: TasksListOnHoldTaskDtos;
  DeviceInfoList?: TasksListDeviceInfoList[];
  MultipleItemAssigned?: TasksListMultipleItemAssigned[];
  RejectedTaskNotes?: string;
  DistanceUnitType?: string;
  RoundDistanceTravelled?: string;
  DistanceTravelled?: string;
  AudioFilePath?: string;
  PreDeviceInfoDto?: TasksListPreDeviceInfoDto;
  FirstNameLastName?: string;
  TaskClosureStatus?: boolean;
  DateTimeStr?: string;
  PaymentModeId?: number;
  PaymentMode?: string;
  Task_TagName?: string;
  Task_TagId?: number;
  TechContactNo?: string;
  EarningAmount?: number;
  Quantity?: number;
  FullAddress?: string;
  PaymentNotReceived?: boolean;
  EndDate?: number;
  StartDate?: number;
  TechLongitude?: string;
  TechLatitude?: string;
  OwnerId?: number;
  Photo?: string;
  ItemName?: string;
  ItemId?: number;
  IsActive?: boolean;
  WagesPerHours?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
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
  TaskDate?: any;
  TaskType?: string;
  TaskTypeId?: number;
  TaskState?: number;
  TaskStatusId?: number;
  TaskStatus?: any;
  Description?: string;
  Name?: string;
  Id?: number;
  FSRId?: number;
  FSRName?: string;
  BrandName?: string;
  ModelNumber?: string;
  QuotationId?: number;
  ResponseCode?: number;
  HappyCode?: number;
  NewTaskId?: string;
  State?: string;
  CityName?: string;
  PinCode?: string;
}

export interface TasksListOnHoldTaskDtos {
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

export interface TasksListDeviceInfoList {
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

export interface TasksListMultipleItemAssigned {
  ItemName?: string;
  ItemQuantity?: number;
  ItemId?: number;
  ItemIssuedId?: number;
  UsedItemQty?: number;
  SalesPrice?: number;
  PurchasePrice?: number;
}

export interface TasksListPreDeviceInfoDto {
  Images?: TasksListImages[];
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

export interface TasksListImages {
  Base64File?: string;
  FileExtension?: string;
  ConvertedFileName?: string;
  OriginalFileName?: string;
  FilePath?: string;
  FileId?: number;
}

// ---- from DTO/Task/TaskClosure.java ----
export interface TaskClosure {
  Code?: string;
  ResultData?: TaskClosureResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
}

export interface TaskClosureResultData {
  DocPath?: string;
  Tsk_Doc_Extension?: string;
  Tsk_Doc_Name?: string;
  Tsk_Doc_Base64?: string;
  TaskAddress?: TaskClosureTaskAddress;
  CustomeFieldDTO?: TaskClosureCustomeFieldDTO[];
  Task_Excess_Amount_Dtls?: TaskClosureTask_Excess_Amount_Dtls[];
  SelectedCheckpointList?: TaskClosureSelectedCheckpointList[];
  RatingRemark?: string;
  CustomerImage?: string;
  TechSignatureImage?: string;
  TechImage?: string;
  PaymentTransactionType?: string;
  MultipleItemAssigned?: TaskClosureMultipleItemAssigned[];
  UsedItemDetailsDto?: TaskClosureUsedItemDetailsDto[];
  AfterImages?: TaskClosureAfterImages[];
  FieldPhoto2?: string;
  FieldPhoto1?: string;
  PreDeviceInfoDto?: TaskClosurePreDeviceInfoDto;
  TaskStatus?: number;
  TaskState?: number;
  UpdatedDate?: string;
  UpdatedBy?: string;
  CreatedDate?: string;
  CreatedBy?: string;
  TechnicalNotedto?: TaskClosureTechnicalNotedto[];
  DeviceInfoList?: TaskClosureDeviceInfoList[];
  RatingBar?: number;
  WorkModeType?: string;
  MobileNo?: number;
  RatingBarId?: number;
  WorkModeId?: number;
  FieldPhoto?: string;
  CustomerSignatureImage?: string;
  SignedBy?: string;
  TaskId?: number;
  UserId?: number;
  Id?: number;
  isSyncDone?: string;
}

export interface TaskClosureTaskAddress {
  State?: string;
  City?: string;
  PinCode?: string;
  Notes?: string;
  RepNo?: string;
  RepName?: string;
  LandMarkPACI?: string;
  Address?: string;
  StreetBuildingFlat?: string;
  AddressName?: string;
  AddressId?: number;
}

export interface TaskClosureCustomeFieldDTO {
  DropdownValue?: string[];
  IsRequired?: boolean;
  FieldTypeName?: string;
  FieldTypeId?: number;
  UserValue?: string;
  Label?: string;
  InputId?: number;
  FieldId?: number;
  SerialNo?: number;
}

export interface TaskClosureTask_Excess_Amount_Dtls {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Excess_Amount?: number;
  Excess_Amount_Des?: string;
  TaskId?: number;
  Excess_Amount_Id?: number;
}

export interface TaskClosureSelectedCheckpointList {
  IsActive?: boolean;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  InputTextId?: number;
  CheckpointId?: number;
  CategoryId?: number;
  FSRId?: number;
  SelectedCheckpointId?: number;
  isSyncDone?: string;
  TaskId?: number;
}

export interface TaskClosureMultipleItemAssigned {
  isSyncDone?: string;
  PurchasePrice?: number;
  SalesPrice?: number;
  UsedItemQty?: number;
  ItemName?: string;
  ItemIssuedId?: number;
  ItemQuantity?: number;
  ItemId?: number;
  TaskId?: number;
}

export interface TaskClosureUsedItemDetailsDto {
  Notes?: string;
  UpdatedDate?: string;
  UpdateBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  UsedQty?: number;
  AssignedQty?: number;
  AvlQty?: number;
  TaskId?: number;
  ItemIssuedId?: number;
  ItemId?: number;
  Id?: number;
}

export interface TaskClosureAfterImages {
  Base64File?: string;
  FileExtension?: string;
  ConvertedFileName?: string;
  OriginalFileName?: string;
  FilePath?: string;
  FileId?: number;
}

export interface TaskClosurePreDeviceInfoDto {
  Images?: TaskClosureImages[];
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
  isSyncDone?: string;
}

export interface TaskClosureImages {
  Base64File?: string;
  FileExtension?: string;
  ConvertedFileName?: string;
  OriginalFileName?: string;
  FilePath?: string;
  FileId?: number;
}

export interface TaskClosureTechnicalNotedto {
  UpdatedDate?: string;
  UpdatedBy?: string;
  CreatedDate?: string;
  CreatedBy?: string;
  UserId?: string;
  TaskClosureDetailsId?: number;
  TechnicalNote1?: string;
  Id?: number;
  isSyncDone?: string;
}

export interface TaskClosureDeviceInfoList {
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
  isSyncDone?: string;
}

// ---- from DTO/Task/UpdateTask.java ----
export interface UpdateTask {
  ResultData?: UpdateTaskResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface UpdateTaskResultData {
  State?: string;
  City?: string;
  TaskTagId?: number;
  NewTaskId?: string;
  ServiceId?: number;
  CountryDetailsId?: number;
  CustomerTagId?: number;
  BuildingNumber?: string;
  lstSelectedCheckpoint?: UpdateTaskLstSelectedCheckpoint[];
  FSRId?: number;
  ModelNumber?: string;
  BrandName?: string;
  QuotationId?: number;
  LeadId?: number;
  OnHoldTaskId?: number;
  MultipleItemAssigned?: UpdateTaskMultipleItemAssigned[];
  Base64AudioString?: string;
  NewAddedTaskId?: number;
  AudioFilePath?: string;
  CustomerDetailsid?: number;
  AMCServiceDetailsId?: number;
  PaymentModeId?: number;
  PaymentMode?: string;
  ItemQuantity?: number;
  IsModelError?: boolean;
  IsSuccessful?: boolean;
  LocIsActive?: boolean;
  PinCode?: string;
  Address?: string;
  LocDescription?: string;
  Longitude?: string;
  latitude?: string;
  LocName?: string;
  UpdatedBy?: number;
  CreatedBy?: number;
  IsActive?: boolean;
  ItemId?: number;
  UserId?: number;
  WagesPerHour?: number;
  ContactNo?: string;
  CustomerName?: string;
  LocationId?: number;
  Time?: string;
  TaskDate?: string;
  TaskType?: number;
  TaskStatus?: number;
  Description?: string;
  Name?: string;
  Id?: number;
}

export interface UpdateTaskLstSelectedCheckpoint {
  IsActive?: boolean;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  InputTextId?: number;
  CheckpointId?: number;
  CategoryId?: number;
  FSRId?: number;
  SelectedCheckpointId?: number;
}

export interface UpdateTaskMultipleItemAssigned {
  PurchasePrice?: number;
  SalesPrice?: number;
  UsedItemQty?: number;
  ItemName?: string;
  ItemIssuedId?: number;
  ItemQuantity?: number;
  ItemId?: number;
}

// ---- from DTO/Task/TaskValidateDTO.java ----
export interface TaskValidateDTO {
  ResultData?: TaskValidateDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface TaskValidateDTOResultData {
  TaskStatus?: number;
  TaskTime?: string;
  TaskDate?: string;
  LocationId?: number;
  CustomerDetailsId?: number;
  NewTaskId?: string;
  UserId?: number;
  TaskId?: number;
}

// ---- from DTO/Task/AddPhotoBeforeTask.java ----
export interface AddPhotoBeforeTask {
  ResultData?: AddPhotoBeforeTaskResultData;
  Images?: AddPhotoBeforeTaskImages[];
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
  Code?: string;
  Message?: string;
}

export interface AddPhotoBeforeTaskImages {
  Base64File?: string;
  FileExtension?: string;
  ConvertedFileName?: string;
  OriginalFileName?: string;
  FilePath?: string;
  FileId?: number;
}

export interface AddPhotoBeforeTaskResultData {
  isSyncDone?: string;
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

// ---- from DTO/CRMTask/CRMTaskList.java ----
export interface CRMTaskList {
  ResultData?: CRMTaskListResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface CRMTaskListResultData {
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
  CreatorWithDetails?: CRMTaskListCreatorWithDetails;
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
  OnHoldTaskDtos?: CRMTaskListOnHoldTaskDtos;
  DeviceInfoList?: CRMTaskListDeviceInfoList[];
  MultipleItemAssigned?: CRMTaskListMultipleItemAssigned[];
  RejectedTaskNotes?: string;
  DistanceUnitType?: string;
  RoundDistanceTravelled?: string;
  DistanceTravelled?: string;
  AudioFilePath?: string;
  PreDeviceInfoDto?: CRMTaskListPreDeviceInfoDto;
  FirstNameLastName?: string;
  TaskClosureStatus?: boolean;
  DateTimeStr?: string;
  PaymentModeId?: number;
  PaymentMode?: string;
  TechContactNo?: string;
  EarningAmount?: number;
  EndTime?: number;
  StartTime?: number;
  Quantity?: number;
  FullAddress?: string;
  PaymentNotReceived?: boolean;
  EndDate?: number;
  StartDate?: number;
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

export interface CRMTaskListCreatorWithDetails {
  ZoneName?: string;
  DesigationName?: string;
  UserGroupCode?: string;
  CreatedByFandLName?: string;
}

export interface CRMTaskListOnHoldTaskDtos {
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

export interface CRMTaskListDeviceInfoList {
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

export interface CRMTaskListMultipleItemAssigned {
  PurchasePrice?: number;
  SalesPrice?: number;
  UsedItemQty?: number;
  ItemName?: string;
  ItemIssuedId?: number;
  ItemQuantity?: number;
  ItemId?: number;
}

export interface CRMTaskListPreDeviceInfoDto {
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

// ---- from DTO/Task/OnHoldTaskDetails.java ----
export interface OnHoldTaskDetails {
  Images?: OnHoldTaskDetailsImages[];
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
  Code?: string;
  Message?: string;
}

export interface OnHoldTaskDetailsImages {
  Base64File?: string;
  FileExtension?: string;
  ConvertedFileName?: string;
  OriginalFileName?: string;
  FilePath?: string;
  FileId?: number;
}

// ---- from DTO/Task/TagList.java ----
export interface TagList {
  ResultData?: TagListResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface TagListResultData {
  UserId?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  TaskTagDescription?: string;
  TaskTagName?: any;
  TaskTagId?: number;
}

// ---- from DTO/FOC/UpdateReIssuedItems.java ----
export interface UpdateReIssuedItems {
  ResultData?: UpdateReIssuedItemsResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface UpdateReIssuedItemsResultData {
  MultipleItemAssigned?: UpdateReIssuedItemsMultipleItemAssigned[];
  CreatedBy?: number;
  FieldWorkerUserId?: number;
  TaskId?: number;
}

export interface UpdateReIssuedItemsMultipleItemAssigned {
  PurchasePrice?: number;
  SalesPrice?: number;
  UsedItemQty?: number;
  ItemName?: string;
  ItemIssuedId?: number;
  ItemQuantity?: number;
  ItemId?: number;
}

// ---- from DTO/Task/GetBeforeAfterOnHoldTaskImgDTO.java ----
export interface GetBeforeAfterOnHoldTaskImgDTO {
  ResultData?: GetBeforeAfterOnHoldTaskImgDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface GetBeforeAfterOnHoldTaskImgDTOResultData {
  FileLists?: GetBeforeAfterOnHoldTaskImgDTOFileLists[];
  ForAfterTasks?: boolean;
  ForBeforeTasks?: boolean;
  ForOnHoldTasks?: boolean;
  TaskId?: number;
  UserId?: number;
}

export interface GetBeforeAfterOnHoldTaskImgDTOFileLists {
  Base64File?: string;
  FileExtension?: string;
  ConvertedFileName?: string;
  OriginalFileName?: string;
  FilePath?: string;
  FileId?: number;
}