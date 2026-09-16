// src/api/leaveManagement/leaveManagementService.ts
// Auto-generated from URLConstant.java (LeaveManagement endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see leaveManagement.types.ts
import apiClient from '../apiClient';
import type { ApplyForLeaveDTO, DeleteLeaveDTO, GetAllLeavesListDTO, GetAllLeavesListRequest, GetLeaveTypesDTO, GetLeaveTypesDTOResultData, LeavaBalanceSummaryDTO, LeavaBalanceSummaryDTOResultData } from './leaveManagement.types';

/**
 * Source: URLConstant.LeaveManagement.GET_LEAVE_TYPES_LIST
 * Endpoint: GET Leave/GetLeaveTypes
 */
export const getLeaveTypesList = async (params?: Record<string, any>): Promise<GetLeaveTypesDTO> => {
  const response = await apiClient.get('Leave/GetLeaveTypes', { params });
  return response.data;
};

/**
 * Source: URLConstant.LeaveManagement.POST_LEAVE_DETAILS
 * Endpoint: POST Leave/LeaveRequest
 */
export const postLeaveDetails = async (data?: Partial<ApplyForLeaveDTO>): Promise<ApplyForLeaveDTO> => {
  const response = await apiClient.post('Leave/LeaveRequest', data);
  return response.data;
};

/**
 * Source: URLConstant.LeaveManagement.GET_ALL_EMPLOYEE_LEAVE_LIST
 * Endpoint: POST Leave/AllLeavesListByUserId
 *
 * @FormUrlEncoded on the Java side (see the GetAllLeavesListRequest comment
 * in leaveManagement.types.ts) — was posting a plain JSON body, which the
 * live endpoint silently ignores. Same fix as expenditureService/leadService.
 */
export const getAllEmployeeLeaveList = async (data: GetAllLeavesListRequest): Promise<GetAllLeavesListDTO> => {
  const body = new URLSearchParams();
  body.append('UserId', String(data.UserId));
  body.append('PageNumber', String(data.PageNumber));
  body.append('PageSize', String(data.PageSize));
  body.append('LeaveStatusId', String(data.LeaveStatusId));
  body.append('IsPersonal', String(data.IsPersonal));
  body.append('IsExportData', String(data.IsExportData));
  body.append('MonthYear', data.MonthYear ?? '');
  body.append('SearchParams', data.SearchParams ?? '');
  body.append('ZoneId', String(data.ZoneId));

  const response = await apiClient.post('Leave/AllLeavesListByUserId', body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
};

/**
 * Source: URLConstant.LeaveManagement.POST_LEAVE_APPROV_REJECT
 * Endpoint: POST Leave/Approve-Reject-Leave
 */
export const postLeaveApprovReject = async (data?: Partial<ApplyForLeaveDTO>): Promise<ApplyForLeaveDTO> => {
  const response = await apiClient.post('Leave/Approve-Reject-Leave', data);
  return response.data;
};

/**
 * Source: URLConstant.LeaveManagement.DELETE_LEAVE
 * Endpoint: GET Leave/DeleteLeaveDetails
 */
export const deleteLeave = async (params?: Record<string, any>): Promise<DeleteLeaveDTO> => {
  const response = await apiClient.get('Leave/DeleteLeaveDetails', { params });
  return response.data;
};

/**
 * Source: URLConstant.LeaveManagement.LEAVE_BAL_SUMMARY
 * Endpoint: GET Leave/GetLeaveBalanceSummary
 */
export const leaveBalSummary = async (params?: Record<string, any>): Promise<LeavaBalanceSummaryDTO> => {
  const response = await apiClient.get('Leave/GetLeaveBalanceSummary', { params });
  return response.data;
};