// src/api/umServiceZone/umServiceZone.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each UM_ServiceZone endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/UM/ZoneListDTO.java ----
export interface ZoneListDTO {
  ResultData?: ZoneListDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface ZoneListDTOResultData {
  Pincode?: string;
  State?: string;
  City?: string;
  DesignationId?: number;
  Description?: string;
  Longitude?: string;
  latitude?: string;
  ZoneAddress?: string;
  UpdateDate?: string;
  Updateby?: number;
  CreateDate?: string;
  Createdby?: number;
  Active?: boolean;
  UsereIid?: number;
  ZoneName?: string;
  EmpID?: number;
  ZoneServiceId?: number;
}

// ---- from DTO/UM/ManagerListByServZoneDTO.java ----
export interface ManagerListByServZoneDTO {
  ResultData?: ManagerListByServZoneDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface ManagerListByServZoneDTOResultData {
  AssignZoneId?: number;
  ContactNo?: string;
  LastName?: string;
  FirstName?: string;
  EmployeeNumber?: number;
}
