// src/api/umEmployeeList/umEmployeeList.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each UM_EmployeeList endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/User/EmployListDTO.java ----
export interface EmployListDTO {
  ResultData?: EmployListDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface EmployListDTOResultData {
  AttendenceDate?: string;
  UserGroupCodeId?: number;
  AttendenceTypeId?: number;
  AssignZoneId?: number;
  ModifiedDate?: string;
  AttendenceTypeName?: string;
  CheckOut?: string;
  CheckIn?: string;
  Longitude?: number;
  Latitude?: number;
  GPSOnOrOff?: boolean;
  BatteryPercentage?: number;
  ZoneName?: string;
  DesignationName?: string;
  UserGroupName?: string;
  IsActive?: boolean;
  EmailId?: string;
  ContactM?: string;
  FirstNameM?: string;
  EmployeeNumber?: number;
  ProfileImage?: string;
}

// ---- from DTO/UM/AddBulkFWDTO.java ----
export interface AddBulkFWDTO {
  ResultData?: AddBulkFWDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface AddBulkFWDTOResultData {
  FieldworkerBulkInsertArray?: AddBulkFWDTOFieldworkerBulkInsertArray[];
  ManagerId?: number;
  ServicezoneId?: number;
  UserId?: number;
  UserGroupCode?: number;
  UserGroupName?: string;
  Tasklist?: AddBulkFWDTOTasklist[];
  EmpDocument?: string;
  JoiningDate?: string;
  EmpDocumentType?: number;
  ContactNo?: string;
  SLAAttachmentFile?: AddBulkFWDTOSLAAttachmentFile;
  EmployeeNumber?: number;
  EmpDOJ?: string;
  EmpDOJNullable?: string;
  LandMark?: string;
  EmpDocType?: number;
  EmpDoc?: string;
  EmpAddress?: string;
  RoleAutoId?: number;
  Accessby?: number;
  LocName?: string;
  DesigationName?: string;
  EmailId?: string;
  CreatedBy?: number;
  CreatedDate?: string;
  Allocatedby?: number;
  LastName?: string;
  FristName?: string;
  ContactM?: string;
  LastnameM?: string;
  FirstnameM?: string;
  ServiceZoneMId?: number;
  LocationId?: number;
  DesignationId?: number;
  TempTechSrNo?: number;
}

export interface AddBulkFWDTOFieldworkerBulkInsertArray {
  AE_ZoneName?: string;
  ManagerAccessFieldWorker?: number;
  FieldWorkerAccess?: number;
  AE_FW_Contact?: string;
  AE_FW_Lastname?: string;
  AE_FW_Firstname?: string;
  TempTechSrNo?: number;
}

export interface AddBulkFWDTOTasklist {
  DesigationTypeId?: number;
  ZoneDescription?: string;
  Active?: boolean;
  UpdatedBy?: number;
  UpdatedDate?: string;
  CreatedBy?: number;
  CreatedDate?: string;
  DesigationName?: string;
  DesigationId?: number;
}

export interface AddBulkFWDTOSLAAttachmentFile {
  InputStream?: AddBulkFWDTOInputStream;
  FileName?: string;
  ContentType?: string;
  ContentLength?: number;
}

export interface AddBulkFWDTOInputStream {
  WriteTimeout?: number;
  ReadTimeout?: number;
  Position?: number;
  Length?: number;
  CanWrite?: boolean;
  CanTimeout?: boolean;
  CanSeek?: boolean;
  CanRead?: boolean;
}

// ---- from DTO/UM/KYC_List_DTO.java ----
export interface KYC_List_DTO {
  ResultData?: KYC_List_DTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface KYC_List_DTOResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  UserId?: number;
  DocTypeName?: string;
  DocTypeId?: number;
}

// ---- from DTO/UM/UpdateEmpDetails.java ----
export interface UpdateEmpDetails {
  ResultData?: UpdateEmpDetailsResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface UpdateEmpDetailsResultData {
  Pincode?: string;
  State?: string;
  City?: string;
  AttendanceDate?: string;
  GPSOnOrOff?: boolean;
  ManagerId?: number;
  Longitude?: string;
  Latitude?: string;
  CheckOut?: string;
  CheckIn?: string;
  BatteryPercentage?: number;
  AttendenceTypeName?: string;
  AttendanceTypeId?: number;
  EmployeeDocumentFileType?: string;
  EmployeeDocumentName?: string;
  EmployeeDocumentBase64?: string;
  ProfileImage?: string;
  UserId?: number;
  UserGroupCode?: number;
  UserGroupName?: string;
  Tasklist?: UpdateEmpDetailsTasklist[];
  EmpDocument?: string;
  JoiningDate?: string;
  EmpDocumentType?: number;
  ContactNo?: string;
  SLAAttachmentFile?: UpdateEmpDetailsSLAAttachmentFile;
  EmployeeNumber?: number;
  EmpDOJ?: string;
  EmpDOJNullable?: string;
  LandMark?: string;
  EmpDocType?: number;
  EmpDoc?: string;
  EmpAddress?: string;
  RoleAutoId?: number;
  Accessby?: number;
  LocName?: string;
  DesigationName?: string;
  EmailId?: string;
  CreatedBy?: number;
  CreatedDate?: string;
  Allocatedby?: number;
  LastName?: string;
  FristName?: string;
  ContactM?: string;
  LastnameM?: string;
  FirstnameM?: string;
  ServiceZoneMId?: number;
  LocationId?: number;
  DesignationId?: number;
}

export interface UpdateEmpDetailsTasklist {
  DesigationTypeId?: number;
  ZoneDescription?: string;
  Active?: boolean;
  UpdatedBy?: number;
  UpdatedDate?: string;
  CreatedBy?: number;
  CreatedDate?: string;
  DesigationName?: string;
  DesigationId?: number;
}

export interface UpdateEmpDetailsSLAAttachmentFile {
  InputStream?: UpdateEmpDetailsInputStream;
  FileName?: string;
  ContentType?: string;
  ContentLength?: number;
}

export interface UpdateEmpDetailsInputStream {
  WriteTimeout?: number;
  ReadTimeout?: number;
  Position?: number;
  Length?: number;
  CanWrite?: boolean;
  CanTimeout?: boolean;
  CanSeek?: boolean;
  CanRead?: boolean;
}

// ---- from DTO/UM/EditEmpDTO.java ----
export interface EditEmpDTO {
  ResultData?: EditEmpDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface EditEmpDTOResultData {
  RoleAutoId?: number;
  UserGroupCodeId?: number;
  ManagerId?: number;
  ContactNo?: string;
  EmpDocument?: string;
  EmpDocType?: number;
  EmailId?: string;
  JoiningDate?: string;
  LandMark?: string;
  EmpAddress?: string;
  ServiceZoneMId?: number;
  DesignationId?: number;
  LastnameM?: string;
  FirstnameM?: string;
  EmployeeNumber?: number;
}
