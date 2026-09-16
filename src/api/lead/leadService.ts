// src/api/lead/leadService.ts
// Auto-generated from URLConstant.java (Lead endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see lead.types.ts
import apiClient from '../apiClient';
import type { DeleteLeadDetailsDTO, DeleteLeadDetailsDTOResultData, LeadDetailsDTO, LeadDetailsDTOResultData, LeadListDTO, LeadListDTOResultData, LeadStatusListDTO, LeadStatusListDTOResultData } from './lead.types';

/**
 * Source: URLConstant.Lead.GET_ALL_LEADList
 * Endpoint: GET Lead/GetAllLeadList
 */
export const getAllLEADList = async (params?: Record<string, any>): Promise<LeadListDTO> => {
  const response = await apiClient.get('Lead/GetAllLeadList', { params });
  return response.data;
};

/**
 * Source: URLConstant.Lead.GET_LEADSTATUS_List
 * Endpoint: GET Lead/GetLeadStatusList
 */
export const getLeadstatusList = async (params?: Record<string, any>): Promise<LeadStatusListDTO> => {
  const response = await apiClient.get('Lead/GetLeadStatusList', { params });
  return response.data;
};

/**
 * Source: URLConstant.Lead.GET_LEADETAILS_BY_LEAD_ID
 * Endpoint: GET Lead/GetLeadListByUserIdandLeadId
 */
export const getLeadetailsByLeadId = async (params?: Record<string, any>): Promise<LeadDetailsDTO> => {
  const response = await apiClient.get('Lead/GetLeadListByUserIdandLeadId', { params });
  return response.data;
};

// Java's Lead/UpdateLeadStatus is @FormUrlEncoded — see
// src/api/signUp/signUpService.ts for the same fix pattern.
export type UpdateLeadStatusRequest = {
  UserId: number;
  LeadId: number;
  LeadStatusId: number;
  Description?: string;
};

/**
 * Source: URLConstant.Lead.UPDATE_LEAD_STATUS
 * Endpoint: POST Lead/UpdateLeadStatus
 */
export const updateLeadStatus = async (data: UpdateLeadStatusRequest): Promise<LeadStatusListDTO> => {
  const body = new URLSearchParams();
  body.append('UserId', String(data.UserId));
  body.append('LeadId', String(data.LeadId));
  body.append('LeadStatusId', String(data.LeadStatusId));
  body.append('Description', data.Description ?? '');

  const response = await apiClient.post('Lead/UpdateLeadStatus', body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
};

/**
 * Source: URLConstant.Lead.DELETE_LEAD_DETAILS
 * Endpoint: GET Lead/DeleteILead
 */
export const deleteLeadDetails = async (params?: Record<string, any>): Promise<DeleteLeadDetailsDTO> => {
  const response = await apiClient.get('Lead/DeleteILead', { params });
  return response.data;
};