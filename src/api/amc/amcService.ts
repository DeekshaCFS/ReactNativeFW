// src/api/amc/amcService.ts
// Auto-generated from URLConstant.java (AMCs endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see amc.types.ts
import apiClient from '../apiClient';
import type { AMCDashboardCount, AMCDashboardCountResultData, AMCDetails, AMCDetailsResultData, AMCList, AMCListResultData, AMCTypeList, AMCTypeListResultData, AddAMC, CRMAMCkList, CRMAMCkListResultData, DeleteAMC, DeleteAMCResultData, EditAMCDTO, EditAMCDTOResultData, ReminderModeList, ReminderModeListResultData, ServiceOccurrenceList, ServiceOccurrenceListResultData } from './amc.types';

/**
 * Source: URLConstant.AMC.GET_SERVICE_OCCURRENCE_LIST
 * Endpoint: GET AMCs/GetAMCServiceOccuranceType
 */
export const getServiceOccurrenceList = async (params?: Record<string, any>): Promise<ServiceOccurrenceList> => {
  const response = await apiClient.get('AMCs/GetAMCServiceOccuranceType', { params });
  return response.data;
};

/**
 * Source: URLConstant.AMC.GET_REMINDER_MODE_LIST
 * Endpoint: GET AMCs/GetAMCSetReminders
 */
export const getReminderModeList = async (params?: Record<string, any>): Promise<ReminderModeList> => {
  const response = await apiClient.get('AMCs/GetAMCSetReminders', { params });
  return response.data;
};

/**
 * Source: URLConstant.AMC.ADD_AMC
 * Endpoint: POST AMCs/AddAMC
 */
export const addAmc = async (data?: Partial<AddAMC>): Promise<AddAMC> => {
  const response = await apiClient.post('AMCs/AddAMC', data);
  return response.data;
};

/**
 * Source: URLConstant.AMC.GET_AMC_SERVICE_LIST
 * Endpoint: POST AMCs/AMCDashboardDetails
 */
export const getAmcServiceList = async (data?: Partial<AMCListResultData>): Promise<AMCList> => {
  const response = await apiClient.post('AMCs/AMCDashboardDetails', data);
  return response.data;
};

/**
 * Source: URLConstant.AMC.GET_AMC_TYPE_LIST
 * Endpoint: GET AMCs/GetAMCType
 */
export const getAmcTypeList = async (params?: Record<string, any>): Promise<AMCTypeList> => {
  const response = await apiClient.get('AMCs/GetAMCType', { params });
  return response.data;
};

/**
 * Source: URLConstant.AMC.GET_AMC_SERVICE_MONTH_LIST
 * Endpoint: GET AMCs/AMCDashboardDetailsWebV2
 */
export const getAmcServiceMonthList = async (params?: Record<string, any>): Promise<AMCList> => {
  const response = await apiClient.get('AMCs/AMCDashboardDetailsWebV2', { params });
  return response.data;
};

/**
 * Source: URLConstant.AMC.GET_AMC_REPORT_DETAILS
 * Endpoint: GET AMCs/AMCReportDetails
 * NOTE: this is the "view AMC details" call (matches Java's AMCDetailsFragment.getAMCDetailsTask,
 * which calls Api.getAMCDetails(OwnerId, AMCsId, AMCServiceDetailsId) against this exact URL).
 * The original generated return type was AMCList, which doesn't match — the response is the
 * richer AMCDetails shape (service history, task details, product/customer info).
 */
export const getAmcReportDetails = async (params?: Record<string, any>): Promise<AMCDetails> => {
  const response = await apiClient.get('AMCs/AMCReportDetails', { params });
  return response.data;
};

/**
 * Source: URLConstant.AMC.GET_AMC_DASHBOARD_COUNT_DETAILS
 * Endpoint: GET AMCs/AMCDashboardDetailsV2WithFilter
 */
export const getAmcDashboardCountDetails = async (params?: Record<string, any>): Promise<AMCDashboardCount> => {
  const response = await apiClient.get('AMCs/AMCDashboardDetailsV2WithFilter', { params });
  return response.data;
};

/**
 * Source: URLConstant.AMC.GET_CRM_AMCLIST
 * Endpoint: GET AMCs/CRMGetAMCList
 */
export const getCrmAmclist = async (params?: Record<string, any>): Promise<CRMAMCkList> => {
  const response = await apiClient.get('AMCs/CRMGetAMCList', { params });
  return response.data;
};

/**
 * Source: URLConstant.AMC.DELETE_AMC
 * Endpoint: POST AMCs/DeleteAMCListByUserId
 */
export const deleteAmc = async (data?: Partial<DeleteAMCResultData>): Promise<DeleteAMC> => {
  const response = await apiClient.post('AMCs/DeleteAMCListByUserId', data);
  return response.data;
};

/**
 * Source: URLConstant.AMC.PUT_AMC_DETAILS
 * Endpoint: POST AMCs/PutAMC
 */
export const putAmcDetails = async (data?: Partial<EditAMCDTOResultData>): Promise<EditAMCDTO> => {
  const response = await apiClient.post('AMCs/PutAMC', data);
  return response.data;
};

/**
 * Source: URLConstant.AMC.GET_AMC_DETAILS_FOR_EDIT
 * Endpoint: GET AMCs/GetAMCDetails
 * NOTE: this is the edit-form prefetch call (matches Java's AMCDetailsFragment.getAMCDetailsForEdit,
 * used only when the user taps "Edit"). The original generated return type was AMCDetails, which
 * doesn't match — the response is the leaner EditAMCDTO shape (editable fields only, no service
 * history / task details). For the view screen, use getAmcReportDetails instead.
 */
export const getAmcDetailsForEdit = async (params?: Record<string, any>): Promise<EditAMCDTO> => {
  const response = await apiClient.get('AMCs/GetAMCDetails', { params });
  return response.data;
};

/**
 * Source: URLConstant.AMC.GET_AMC_RENEWAL_DETAILS
 * Endpoint: GET AMCs/GetAMCRenewalDetails
 */
export const getAmcRenewalDetails = async (params?: Record<string, any>): Promise<{
  ResultData?: Array<Record<string, unknown>> | null;
  Message?: string;
  Code?: string;
}> => {
  const response = await apiClient.get('AMCs/GetAMCRenewalDetails', { params });
  return response.data;
};

/**
 * Source: URLConstant.AMC.RENEW_AMC_DETAILS
 * Endpoint: POST AMCs/AddAMCRenewal
 */
export const renewAmcDetails = async (data?: Record<string, unknown>): Promise<{
  Message?: string;
  Code?: string;
}> => {
  const response = await apiClient.post('AMCs/AddAMCRenewal', data);
  return response.data;
};
