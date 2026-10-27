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

// Java posts Lead/UpdateLeadStatus as a JSON @Body (AddCustomerLeadInternalDTO
// .ResultData), not form-encoded: the lead's own fields go back alongside the
// new LeadStatusId, and the follow-up note travels in FollowUpNotes.
export type UpdateLeadStatusRequest = {
  UserId: number;
  OwnerId: number;
  LeadId: number;
  LeadStatusId: number;
  LeadStatus: number;
  FollowUpNotes: string;
  Description?: string;
  CustomerName?: string;
  MobileNumber?: string;
  Address?: string;
  LocName?: string;
  LocationId?: number;
  ServiceName?: string;
  ServicesId?: number;
  CreatedBy?: number;
  UpdatedBy?: number;
  IsActive?: boolean;
};

/**
 * Source: URLConstant.Lead.UPDATE_LEAD_STATUS
 * Endpoint: POST Lead/UpdateLeadStatus
 */
export const updateLeadStatus = async (data: UpdateLeadStatusRequest): Promise<LeadStatusListDTO> => {
  const response = await apiClient.post('Lead/UpdateLeadStatus', data);
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