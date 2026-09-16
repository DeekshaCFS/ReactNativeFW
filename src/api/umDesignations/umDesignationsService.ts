// src/api/umDesignations/umDesignationsService.ts
// Auto-generated from URLConstant.java (UM_Designations endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see umDesignations.types.ts
import apiClient from '../apiClient';
import type { DesignationDTO, DesignationDTOResultData, DesignationTypeDTO, DesignationTypeDTOResultData } from './umDesignations.types';

/**
 * Source: URLConstant.UserManagement.GET_DESIGNATION_TYPE
 * Endpoint: GET UM_Designations/DesignationTypeList
 */
export const getDesignationType = async (params?: Record<string, any>): Promise<DesignationTypeDTO> => {
  const response = await apiClient.get('UM_Designations/DesignationTypeList', { params });
  return response.data;
};

/**
 * Source: URLConstant.UserManagement.GET_ALL_DESIGNATION
 * Endpoint: GET UM_Designations/GetDesignationAndZoneList
 */
export const getAllDesignation = async (params?: Record<string, any>): Promise<DesignationDTO> => {
  const response = await apiClient.get('UM_Designations/GetDesignationAndZoneList', { params });
  return response.data;
};
