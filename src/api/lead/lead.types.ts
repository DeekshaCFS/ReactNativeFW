// src/api/lead/lead.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each Lead endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/LeadManagement/LeadListDTO.java ----
export interface LeadListDTO {
  ResultData?: LeadListDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface LeadListDTOResultData {
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
}

// ---- from DTO/LeadManagement/LeadStatusListDTO.java ----
export interface LeadStatusListDTO {
  ResultData?: LeadStatusListDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface LeadStatusListDTOResultData {
  IsActive?: boolean;
  Name?: string;
  Id?: number;
}

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

// ---- from DTO/LeadManagement/DeleteLeadDetailsDTO.java ----
export interface DeleteLeadDetailsDTO {
  ResultData?: DeleteLeadDetailsDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface DeleteLeadDetailsDTOResultData {
  FollowUpNotes?: string;
  LeadStatusId?: number;
  PrefDate?: string;
  ReferenceName?: string;
  ServiceName?: string;
  OwnerId?: number;
  UserId?: number;
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
  MobileNumber?: number;
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
