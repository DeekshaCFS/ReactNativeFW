// src/api/attendance/attendanceService.ts
// Auto-generated from URLConstant.java (Attendance endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see attendance.types.ts
import apiClient from '../apiClient';
import type { AddAttendance, AddAttendanceResultData, AttendanceCheck, CheckOut, CheckOutRequest, OwnDateAttendance, OwnDateAttendanceResultData, TechMonthlyAttendance, TechMonthlyAttendanceResultData } from './attendance.types';

/**
 * Source: URLConstant.Attendance.ADD_ATTENDANCE
 * Endpoint: POST Attendance/AddAttendance
 */
export const addAttendance = async (data?: Partial<AddAttendanceResultData>): Promise<AddAttendance> => {
  const response = await apiClient.post('Attendance/AddAttendance', data);
  return response.data;
};

/**
 * Source: URLConstant.Attendance.GET_ATTENDANCE_TECH_MONTHLY
 * Endpoint: GET Attendance/GetAttendanceRecords
 */
export const getAttendanceTechMonthly = async (params?: Record<string, any>): Promise<TechMonthlyAttendance> => {
  const response = await apiClient.get('Attendance/GetAttendanceRecords', { params });
  return response.data;
};

/**
 * Source: URLConstant.Attendance.GET_ATTENDANCE_OWNER_MONTHLY
 * Endpoint: GET Attendance/GetAttendanceMonthlyForAdmin
 */
export const getAttendanceOwnerMonthly = async (params?: Record<string, any>): Promise<OwnDateAttendance> => {
  const response = await apiClient.get('Attendance/GetAttendanceMonthlyForAdmin', { params });
  return response.data;
};

/**
 * Source: URLConstant.Attendance.ATTENDANCE_CHECK
 * Endpoint: GET Attendance/GetTodayAttandanceIsExist
 */
export const attendanceCheck = async (params?: Record<string, any>): Promise<AttendanceCheck> => {
  const response = await apiClient.get('Attendance/GetTodayAttandanceIsExist', { params });
  return response.data;
};

/**
 * Source: URLConstant.Attendance.ATTENDANCE_CHECK_OUT
 * Endpoint: POST Attendance/CheckOutAttendance
 */
export const attendanceCheckOut = async (data?: Partial<CheckOutRequest>): Promise<CheckOut> => {
  const response = await apiClient.post('Attendance/CheckOutAttendance', data);
  return response.data;
};