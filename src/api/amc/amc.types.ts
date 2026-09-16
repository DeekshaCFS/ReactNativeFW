// src/api/amc/amc.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each AMCs endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/AMC/ServiceOccurrenceList.java ----
export interface ServiceOccurrenceList {
  ResultData?: ServiceOccurrenceListResultData[];
  Message?: string;
  Code?: string;
}

export interface ServiceOccurrenceListResultData {
  ServiceOccuranceType?: string;
  ServiceOccuranceId?: number;
}

// ---- from DTO/AMC/ReminderModeList.java ----
export interface ReminderModeList {
  ResultData?: ReminderModeListResultData[];
  Message?: string;
  Code?: string;
}

export interface ReminderModeListResultData {
  AMCSetReminderType?: string;
  AMCSetReminderId?: number;
}

// ---- from DTO/AMC/AddAMC.java ----
export interface AddAMC {
  ProductDetail?: AddAMCProductDetail;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  AMCSetReminderId?: number;
  TotalServices?: number;
  AMCNotes?: string;
  AMCAmount?: number;
  ActivationTime?: string;
  ActivationDate?: string;
  ContractDate?: string;
  ExpiryDate?: string;
  ProductId?: number;
  ServiceOccuranceId?: number;
  AMCName?: string;
  UserId?: number;
  AMCsId?: number;
  ReceivedAmount?: number;
  Message?: string;
  Code?: string;
}

export interface AddAMCProductDetail {
  Location?: AddAMCLocation;
  CustomerDetail?: AddAMCCustomerDetail;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UnderWarranty?: boolean;
  CustomerId?: number;
  CustomerLocationId?: number;
  ProductBrand?: string;
  ProductSerialNo?: string;
  ProductName?: string;
  UserId?: number;
  ProductDetailsId?: number;
}

export interface AddAMCLocation {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  PinCode?: string;
  Address?: string;
  Description?: string;
  Longitude?: string;
  latitude?: string;
  Name?: string;
  Id?: number;
}

export interface AddAMCCustomerDetail {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  OwnerId?: number;
  UserId?: number;
  IsActive?: boolean;
  LocationId?: number;
  EmailId?: string;
  MobileNumber?: string;
  CustomerName?: string;
  CustomerDetailsid?: number;
}

// ---- from DTO/AMC/AMCList.java ----
export interface AMCList {
  ResultData?: AMCListResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface AMCListResultData {
  TaskDetails?: AMCListTaskDetails;
  AMCTypeName?: string;
  ActualAMCSeriveDate?: string;
  HoursNo?: number;
  DaysNo?: number;
  UpdatedDate?: string;
  UpdatedBy?: string;
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
  AMCAmount?: number;
  IsActive?: boolean;
  AMCName?: string;
  AMCTypeId?: number;
  ServiceNo?: number;
  AMCServiceDate?: string;
  AMCsId?: number;
  AMCServiceDetailsId?: number;
}

export interface AMCListTaskDetails {
  TaskTime?: string;
  TaskDate?: string;
  TaskStatus?: number;
  TechnicianUserId?: number;
  TechnicianName?: string;
  TaskName?: string;
  TaskId?: number;
}

// ---- from DTO/AMC/AMCTypeList.java ----
export interface AMCTypeList {
  ResultData?: AMCTypeListResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface AMCTypeListResultData {
  UpdatedDate?: string;
  UpdatedBy?: string;
  CreatedDate?: string;
  CreatedBy?: string;
  AMCTypeName?: string;
  AMCTypeId?: number;
}

// ---- from DTO/AMC/AMCDashboardCount.java ----
export interface AMCDashboardCount {
  ResultData?: AMCDashboardCountResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface AMCDashboardCountResultData {
  TotalCompleted?: number;
  TotalExpired?: number;
  TotalRenewal?: number;
  TotalUpcomming?: number;
}

// ---- from DTO/CRMTask/CRMAMCkList.java ----
export interface CRMAMCkList {
  ResultData?: CRMAMCkListResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface CRMAMCkListResultData {
  AMCServiceDate?: string;
  MobileNumber?: string;
  CustomerName?: string;
  AMCServicesLeftCount?: number;
  CustomerId?: number;
  ProductDetailsId?: number;
  UserId?: number;
  TotalServices1?: number;
  TotalServices?: number;
  ServiceOccuranceType?: string;
  ServiceOccuranceId?: number;
  ProductId?: number;
  IsActive?: boolean;
  CreatedBy?: number;
  AMCSetReminderType?: string;
  AMCSetReminderId?: number;
  ActivationTime?: string;
  ActivationDate?: string;
  AMCName?: string;
  AMCsId?: number;
}

// ---- from DTO/AMC/DeleteAMC.java ----
export interface DeleteAMC {
  ResultData?: DeleteAMCResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface DeleteAMCResultData {
  Id?: number;
  UserId?: number;
}

// ---- from DTO/AMC/EditAMCDTO.java ----
export interface EditAMCDTO {
  ResultData?: EditAMCDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface EditAMCDTOResultData {
  ProductDetail?: EditAMCDTOProductDetail;
  ReceivedAmount?: number;
  IsActive?: boolean;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  AMCSetReminderId?: number;
  TotalServices?: number;
  AMCNotes?: string;
  AMCAmount?: number;
  ActivationTime?: string;
  ActivationDate?: string;
  ContractDate?: string;
  ExpiryDate?: string;
  ProductId?: number;
  ServiceOccuranceId?: number;
  AMCName?: string;
  UserId?: number;
  AMCsId?: number;
}

export interface EditAMCDTOProductDetail {
  Location?: EditAMCDTOLocation;
  CustomerDetail?: EditAMCDTOCustomerDetail;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UnderWarranty?: boolean;
  CustomerId?: number;
  CustomerLocationId?: number;
  ProductBrand?: string;
  ProductSerialNo?: string;
  ProductName?: string;
  UserId?: number;
  ProductDetailsId?: number;
}

export interface EditAMCDTOLocation {
  BuildingNumber?: string;
  State?: string;
  SecondaryDescription?: string;
  SecondaryAddress?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  PinCode?: string;
  Address?: string;
  Description?: string;
  Longitude?: string;
  latitude?: string;
  Name?: string;
  Id?: number;
}

export interface EditAMCDTOCustomerDetail {
  CustomerTagId?: number;
  CountryDetailsId?: number;
  BrandName?: string;
  ModelNumber?: string;
  SecondaryInstructions?: string;
  SecondaryMobileNumber?: string;
  SecondaryEmailId?: string;
  Instructions?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  OwnerId?: number;
  UserId?: number;
  IsActive?: boolean;
  LocationId?: number;
  EmailId?: string;
  MobileNumber?: string;
  CustomerName?: string;
  CustomerDetailsid?: number;
}

// ---- from DTO/AMC/AMCDetails.java ----
export interface AMCDetails {
  ResultData?: AMCDetailsResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface AMCDetailsResultData {
  AMCServiceDetailDto?: AMCDetailsAMCServiceDetailDto[];
  TaskDetails?: AMCDetailsTaskDetails[];
  ProductDetail?: AMCDetailsProductDetail;
  ServiceOccuranceType?: string;
  AMCSetReminderType?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  AMCSetReminderId?: number;
  TotalServices?: number;
  AMCNotes?: string;
  AMCAmount?: number;
  ActivationTime?: string;
  ActivationDate?: string;
  ContractDate?: string;
  ExpiryDate?: string;
  LastAMCServiceDate?: string;
  ProductId?: number;
  ServiceOccuranceId?: number;
  AMCName?: string;
  UserId?: number;
  AMCsId?: number;
  IsActive?: boolean;
  IsUpcomingServiceActive?: boolean;
  UpcomingAmcsServiceDate?: string;
  UpcomingAmcsServiceTime?: string;
  ReceivedAmt?: number;
}

export interface AMCDetailsAMCServiceDetailDto {
  TaskDetails?: AMCDetailsTaskDetails;
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
  RemainingAmount?: number;
}

export interface AMCDetailsTaskDetails {
  TaskTime?: string;
  TaskDate?: string;
  TaskStatus?: number;
  TechnicianUserId?: string;
  TechnicianName?: string;
  TaskName?: string;
  TaskId?: number;
}

export interface AMCDetailsProductDetail {
  CustomerLocationInfoDto?: AMCDetailsCustomerLocationInfoDto;
  CustomerDetailInfoDto?: AMCDetailsCustomerDetailInfoDto;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UnderWarranty?: boolean;
  CustomerId?: number;
  CustomerLocationId?: number;
  ProductBrand?: string;
  ProductSerialNo?: string;
  ProductName?: string;
  UserId?: number;
  ProductDetailsId?: number;
}

export interface AMCDetailsCustomerLocationInfoDto {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  PinCode?: string;
  Address?: string;
  Description?: string;
  Longitude?: string;
  latitude?: string;
  Name?: string;
  Id?: number;
}

export interface AMCDetailsCustomerDetailInfoDto {
  Address?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  LocationId?: number;
  EmailId?: string;
  MobileNumber?: string;
  CustomerName?: string;
  CustomerDetailsid?: number;
}
