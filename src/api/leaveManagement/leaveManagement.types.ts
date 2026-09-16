// src/api/leaveManagement/leaveManagement.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each LeaveManagement endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/LeaveManagement/GetLeaveTypesDTO.java ----
export interface GetLeaveTypesDTO {
  ResultData?: GetLeaveTypesDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface GetLeaveTypesDTOResultData {
  Name?: string;
  Id?: number;
}

// ---- from DTO/LeaveManagement/ApplyForLeaveDTO.java ----
export interface ApplyForLeaveDTO {
  Reason?: string;
  LeaveTypeId?: number;
  EndDate?: string;
  StartDate?: string;
  UserId?: number;
  LeaveId?: number;
  ResultData?: string;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

// ---- request body for POST Leave/AllLeavesListByUserId (see Api.java#getAllEmployeeLeavesList) ----
export interface GetAllLeavesListRequest {
  UserId: number;
  PageNumber: number;
  PageSize: number;
  LeaveStatusId: number;
  IsPersonal: boolean;
  IsExportData: boolean;
  MonthYear: string;
  SearchParams: string;
  ZoneId: number;
}

// ---- from DTO/LeaveManagement/GetAllLeavesListDTO.java ----
export interface GetAllLeavesListDTO {
  ResultData?: GetAllLeavesListDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface GetAllLeavesListDTOResultData {
  LeaveDetails?: GetAllLeavesListDTOLeaveDetails[];
  LeaveCounts?: GetAllLeavesListDTOLeaveCounts;
}

export interface GetAllLeavesListDTOLeaveDetails {
  FirstName?: string;
  LastName?: string;
  NoOfDays?: number;
  ApproverDesignation?: string;
  ApproverName?: string;
  ActionedBy?: number;
  IsApproved?: boolean;
  CommentsByApprover?: string;
  ReasonOfLeave?: string;
  LeaveType?: string;
  LeaveCreatedDate?: string;
  LeaveEndDate?: string;
  LeaveStartDate?: string;
  EmailId?: string;
  ContactNo?: string;
  ZoneManager?: string;
  Zone?: string;
  UserDesignation?: string;
  UserName?: string;
  UserID?: number;
  LeaveStatusName?: string;
  LeaveStatusId?: number;
  LeaveID?: number;
  LeaveTypeId?: number;
  ProfileImageUrl?: string;
  ResultData?: string;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface GetAllLeavesListDTOLeaveCounts {
  PendingLeaveCount?: number;
  RejectedLeaveCount?: number;
  ApprovedLeaveCount?: number;
}

// ---- from DTO/LeaveManagement/DeleteLeaveDTO.java ----
export interface DeleteLeaveDTO {
  ResultData?: string;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

// ---- from DTO/LeaveManagement/LeavaBalanceSummaryDTO.java ----
export interface LeavaBalanceSummaryDTO {
  ResultData?: LeavaBalanceSummaryDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface LeavaBalanceSummaryDTOResultData {
  RemainingLeaves?: number;
  LeavesTaken?: number;
  TotalLeaves?: number;
  LeaveTypeName?: string;
  LeaveTypeId?: number;
}
