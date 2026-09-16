// src/api/umDesignations/umDesignations.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each UM_Designations endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/UM/DesignationTypeDTO.java ----
export interface DesignationTypeDTO {
  ResultData?: DesignationTypeDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface DesignationTypeDTOResultData {
  designations?: DesignationTypeDTODesignations[];
  DesigationTypeId?: number;
  Description?: string;
  Active?: number;
  UpdatedBy?: number;
  UpdatedDate?: string;
  CreatedBy?: number;
  CreatedDate?: string;
  DesigationName?: string;
  DesigationId?: number;
  UserGroupName?: string;
  UserGroupCodeId?: number;
}

export interface DesignationTypeDTODesignations {
  UserGroupName?: string;
  UserGroupCodeId?: number;
}

// ---- from DTO/UM/DesignationDTO.java ----
export interface DesignationDTO {
  ResultData?: DesignationDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface DesignationDTOResultData {
  LoginUserGroupCodeId?: number;
  AttendenceTypeName?: string;
  AttendenceTypeId?: number;
  ZoneName?: string;
  ZoneServiceId?: number;
  UserGroupName?: string;
  UserGroupCodeId?: number;
}
