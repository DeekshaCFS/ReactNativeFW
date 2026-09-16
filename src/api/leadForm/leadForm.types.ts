// src/api/leadForm/leadForm.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each LeadForm endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/LeadManagement/LeadDetailsDTO.java ----
export interface LeadDetailsDTO {
  ResultData?: LeadDetailsDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface LeadDetailsDTOResultData {
  PhotoPath2?: string;
  PhotoPath1?: string;
  PhotoPath?: string;
  LeadStatusLogObj?: LeadDetailsDTOLeadStatusLogObj[];
  LeadStatusId?: number;
  PrefDate?: string;
  ReferenceName?: string;
  ServiceName?: string;
  OwnerId?: number;
  UserId?: number;
  AudioFilePath?: string;
  AssignedTo?: string;
  FollowUpNotes?: string;
  PinCode?: string;
  Address?: string;
  LocDescription?: string;
  Longitude?: string;
  latitude?: string;
  LocName?: string;
  OTP?: number;
  LeadTime?: string;
  LeadDate?: string;
  ServicesId?: number;
  Description?: string;
  MobileNumber?: string;
  CustomerName?: string;
  LeadSource?: string;
  LeadStatus?: string;
  LeadState?: number;
  LeadType?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  TaskId?: number;
  ReferenceId?: number;
  CustomerDetailsid?: number;
  LocationId?: number;
  LeadNo?: number;
  LeadId?: number;
  State?: string;
  City?: string;
}

export interface LeadDetailsDTOLeadStatusLogObj {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  LeadNotes?: string;
  LeadStatusName?: string;
  LeadStatusId?: number;
  UserId?: number;
  LeadId?: number;
  Id?: number;
}

// ---- from DTO/LeadManagement/AddCustomerLeadInternalDTO.java ----
export interface AddCustomerLeadInternalDTO {
  ResultData?: AddCustomerLeadInternalDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface AddCustomerLeadInternalDTOResultData {
  ImageFileBase64Str2?: string;
  ImageFileName2?: string;
  PhotoPath2?: string;
  ImageFileBase64Str1?: string;
  ImageFileName1?: string;
  PhotoPath1?: string;
  ImageFileBase64Str?: string;
  ImageFileName?: string;
  PhotoPath?: string;
  FollowUpNotes?: string;
  LeadStatusId?: number;
  PrefDate?: string;
  ReferenceName?: string;
  ServiceName?: string;
  OwnerId?: number;
  UserId?: number;
  PinCode?: string;
  State?: string;
  City?: string;
  Address?: string;
  LocDescription?: string;
  Longitude?: string;
  latitude?: string;
  LocName?: string;
  OTP?: number;
  LeadTime?: string;
  LeadDate?: string;
  ServicesId?: number;
  Description?: string;
  MobileNumber?: string;
  CustomerName?: string;
  LeadStatus?: number;
  LeadState?: number;
  LeadType?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  TaskId?: number;
  ReferenceId?: number;
  CustomerDetailsid?: number;
  LocationId?: number;
  LeadNo?: number;
  LeadId?: number;
}
