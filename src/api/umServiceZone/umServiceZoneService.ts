// src/api/umServiceZone/umServiceZoneService.ts
// Auto-generated from URLConstant.java (UM_ServiceZone endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see umServiceZone.types.ts
import apiClient from '../apiClient';
import type { ManagerListByServZoneDTO, ManagerListByServZoneDTOResultData, ZoneListDTO, ZoneListDTOResultData } from './umServiceZone.types';

/**
 * Source: URLConstant.UserManagement.GET_ALL_ZONE_LIST
 * Endpoint: GET UM_ServiceZone/GetAllZoneListByUserId
 */
export const getAllZoneList = async (params?: Record<string, any>): Promise<ZoneListDTO> => {
  const response = await apiClient.get('UM_ServiceZone/GetAllZoneListByUserId', { params });
  return response.data;
};

/**
 * Source: URLConstant.UserManagement.GET_MANAGER_LIST_BY_SERVZONE
 * Endpoint: GET UM_ServiceZone/GetManagerListByServiceZone
 */
export const getManagerListByServzone = async (params?: Record<string, any>): Promise<ManagerListByServZoneDTO> => {
  const response = await apiClient.get('UM_ServiceZone/GetManagerListByServiceZone', { params });
  return response.data;
};
