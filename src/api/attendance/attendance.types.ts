// src/api/attendance/attendance.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each Attendance endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/User/AddAttendance.java ----
export interface AddAttendance {
  ResultData?: AddAttendanceResultData;
  Message?: string;
  Code?: string;
}

export interface AddAttendanceResultData {
  IsModelError?: boolean;
  IsSuccessful?: boolean;
  UpdatedBy?: number;
  CreatedBy?: number;
  AttendanceTypeId?: number;
  AttendanceDate?: string;
  UserId?: number;
  Id?: number;
  AttendanceMarkedPlace?: string;
  Latitude?: string;
  Longitude?: string;
}

// ---- from DTO/Attendance/TechMonthlyAttendance.java ----
export interface TechMonthlyAttendance {
  ResultData?: TechMonthlyAttendanceResultData[];
  Message?: string;
  Code?: string;
}

export interface TechMonthlyAttendanceResultData {
  UserId?: number;
  AttendanceTypeId?: number;
  Attendance?: string;
  Date?: string;
  CheckIn?: string;
  CheckOut?: string;
}

// ---- from DTO/Attendance/OwnDateAttendance.java ----
export interface OwnDateAttendance {
  ResultData?: OwnDateAttendanceResultData;
  Message?: string;
  Code?: string;
}

export interface OwnDateAttendanceResultData {
  IdleCount?: number;
  PresentCount?: number;
  AbsentCount?: number;
  LeaveCount?: number;
  Date?: string;
}

// ---- from DTO/AttendanceCheck.java ----
export interface AttendanceCheck {
  Message?: string;
  Code?: string;
}

// ---- from DTO/Attendance/CheckOut.java ----
export interface CheckOut {
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

// ---- request payload for Attendance/CheckOutAttendance ----
// Source: Api.java — checkOut(@Field("UserId"), @Field("Latitude"), @Field("Longitude"), @Field("CheckOutPlace"))
// Form-encoded, NOT the same shape as the CheckOut response above — the auto-generated service
// previously (incorrectly) typed the request as Partial<CheckOut>, which doesn't declare any of
// these fields.
export interface CheckOutRequest {
  UserId?: number;
  Latitude?: number;
  Longitude?: number;
  CheckOutPlace?: string;
}