// src/api/taskList/taskList.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each TaskList endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/Task/AddTask.java ----
export interface AddTask {
  ResultData?: AddTaskResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface AddTaskResultData {
  State?: string;
  City?: string;
  TaskTagId?: number;
  NewTaskId?: string;
  ServiceId?: number;
  CountryDetailsId?: number;
  CustomerTagId?: number;
  BuildingNumber?: string;
  lstSelectedCheckpoint?: AddTaskLstSelectedCheckpoint[];
  FSRId?: number;
  ModelNumber?: string;
  BrandName?: string;
  QuotationId?: number;
  LeadId?: number;
  OnHoldTaskId?: number;
  MultipleItemAssigned?: AddTaskMultipleItemAssigned[];
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
  EnquiryId?: number;
}

export interface AddTaskLstSelectedCheckpoint {
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

export interface AddTaskMultipleItemAssigned {
  UsedItemQty?: number;
  ItemName?: string;
  ItemIssuedId?: number;
  ItemQuantity?: number;
  ItemId?: number;
  TempTechSrNo?: number;
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

// ---- from DTO/Task/RejectedTaskDetailsDTO.java ----
export interface RejectedTaskDetailsDTO {
  ResultData?: RejectedTaskDetailsDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface RejectedTaskDetailsDTOResultData {
  DocPath?: string;
  TaskAddress?: RejectedTaskDetailsDTOTaskAddress;
  CustomeFieldDTO?: RejectedTaskDetailsDTOCustomeFieldDTO[];
  PaymentTransactionName?: string;
  PaymentProofImage?: string;
  Task_TagName?: string;
  Task_TagId?: number;
  NewTaskId?: string;
  ServiceName?: string;
  ServiceId?: number;
  WagesPerHoursOldBk?: number;
  Task_Excess_Amount_Dtls?: RejectedTaskDetailsDTOTask_Excess_Amount_Dtls[];
  CountryCode?: string;
  InvoiceCode?: string;
  InvoiceId?: number;
  QuotationCode?: string;
  QuotationId?: number;
  CurrencySymbol?: string;
  CountryDetailsId?: number;
  ModelNumber?: string;
  BrandName?: string;
  SelectedInputText?: RejectedTaskDetailsDTOSelectedInputText[];
  SelectedCheckpointList?: RejectedTaskDetailsDTOSelectedCheckpointList[];
  CustomerImage?: string;
  TechSignatureImage?: string;
  TechImage?: string;
  MultipleItemAssigned?: RejectedTaskDetailsDTOMultipleItemAssigned[];
  DistanceUnitType?: string;
  RoundDistanceTravelled?: string;
  DistanceTravelled?: string;
  AudioFilePath?: string;
  PreDeviceInfoDto?: RejectedTaskDetailsDTOPreDeviceInfoDto;
  CustomerEmailId?: string;
  MobileNo?: number;
  TechnicalNotedto?: RejectedTaskDetailsDTOTechnicalNotedto[];
  DeviceInfoList?: RejectedTaskDetailsDTODeviceInfoList[];
  RatingBar?: number;
  WorkModeType?: string;
  RatingBarId?: number;
  WorkModeId?: number;
  FieldPhoto2?: string;
  FieldPhoto1?: string;
  FieldPhoto?: string;
  SignedBy?: string;
  CustomerSignatureImage?: string;
  TaskClosureDetailsId?: number;
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
  CreatedBy?: string;
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
  CustomerDetailsid?: number;
  CustomerName?: string;
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

export interface RejectedTaskDetailsDTOTaskAddress {
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

export interface RejectedTaskDetailsDTOCustomeFieldDTO {
  IsRequired?: boolean;
  FieldTypeName?: string;
  FieldTypeId?: number;
  UserValue?: string;
  Label?: string;
  InputId?: number;
  FieldId?: number;
  SerialNo?: number;
}

export interface RejectedTaskDetailsDTOTask_Excess_Amount_Dtls {
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

export interface RejectedTaskDetailsDTOSelectedInputText {
  lstInputTextCategoryDtos?: RejectedTaskDetailsDTOLstInputTextCategoryDtos[];
  IsInputText?: boolean;
  IsFSR?: boolean;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Name?: string;
  Id?: number;
}

export interface RejectedTaskDetailsDTOLstInputTextCategoryDtos {
  Description?: string;
  InputTextId?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Name?: string;
  InputTextCategoryId?: number;
}

export interface RejectedTaskDetailsDTOSelectedCheckpointList {
  lstInputTextCategoryDTo?: RejectedTaskDetailsDTOLstInputTextCategoryDTo[];
  lstSelectedCheckpointDTo?: RejectedTaskDetailsDTOLstSelectedCheckpointDTo[];
  lstCheckpointStatusDTo?: RejectedTaskDetailsDTOLstCheckpointStatusDTo[];
  lstInputTextForm?: RejectedTaskDetailsDTOLstInputTextForm[];
  lstFSRCategories?: RejectedTaskDetailsDTOLstFSRCategories[];
  IsCheckpoint?: boolean;
  IsInputTextCategory?: boolean;
  IsInputText?: boolean;
  IsFSR?: boolean;
  InputTextName?: string;
  InputtextId?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  FSRName?: string;
  FSRId?: number;
}

export interface RejectedTaskDetailsDTOLstInputTextCategoryDTo {
  Description?: string;
  InputTextId?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Name?: string;
  InputTextCategoryId?: number;
}

export interface RejectedTaskDetailsDTOLstSelectedCheckpointDTo {
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

export interface RejectedTaskDetailsDTOLstCheckpointStatusDTo {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  CheckpointStatusName?: string;
  CheckpointStatusId?: number;
}

export interface RejectedTaskDetailsDTOLstInputTextForm {
  lstInputTextCategoryDtos?: RejectedTaskDetailsDTOLstInputTextCategoryDtos[];
  IsInputText?: boolean;
  IsFSR?: boolean;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Name?: string;
  Id?: number;
}

export interface RejectedTaskDetailsDTOLstFSRCategories {
  lstCheckpointDTo?: RejectedTaskDetailsDTOLstCheckpointDTo[];
  CategoryDescription?: string;
  FSRId?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  CategoryName?: string;
  CategoryId?: number;
}

export interface RejectedTaskDetailsDTOLstCheckpointDTo {
  SelectedCheckpointStatus?: RejectedTaskDetailsDTOSelectedCheckpointStatus;
  CheckpointDescription?: string;
  CheckpointName?: string;
  FSRCategoryId?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  CheckpointId?: number;
}

export interface RejectedTaskDetailsDTOSelectedCheckpointStatus {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  CheckpointStatusName?: string;
  CheckpointStatusId?: number;
}

export interface RejectedTaskDetailsDTOMultipleItemAssigned {
  PurchasePrice?: number;
  SalesPrice?: number;
  UsedItemQty?: number;
  ItemName?: string;
  ItemIssuedId?: number;
  ItemQuantity?: number;
  ItemId?: number;
}

export interface RejectedTaskDetailsDTOPreDeviceInfoDto {
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

export interface RejectedTaskDetailsDTOTechnicalNotedto {
  UpdatedDate?: string;
  UpdatedBy?: string;
  CreatedDate?: string;
  CreatedBy?: string;
  UserId?: string;
  TaskClosureDetailsId?: number;
  TechnicalNote1?: string;
  Id?: number;
}

export interface RejectedTaskDetailsDTODeviceInfoList {
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
  TaskDate?: string;
  TaskType?: string;
  TaskTypeId?: number;
  TaskState?: number;
  TaskStatusId?: number;
  TaskStatus?: string;
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

// ---- from DTO/Task/UploadTaskDocDTO.java ----
export interface UploadTaskDocDTO {
  ResultData?: string;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
  Base64File?: string;
  FileExtension?: string;
  ConvertedFileName?: string;
  OriginalFileName?: string;
  FilePath?: string;
  CustomerId?: number;
  TaskId?: number;
  UserId?: number;
  DocumentId?: number;
}

// ---- from DTO/Task/GetPostedTaskDocDTO.java ----
export interface GetPostedTaskDocDTO {
  ResultData?: GetPostedTaskDocDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface GetPostedTaskDocDTOResultData {
  Base64File?: string;
  FileExtension?: string;
  ConvertedFileName?: string;
  OriginalFileName?: string;
  FilePath?: string;
  CustomerId?: number;
  TaskId?: number;
  UserId?: number;
  DocumentId?: number;
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
