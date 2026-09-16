// src/api/healthAndSafety/healthAndSafetyService.ts
// Auto-generated from URLConstant.java (HealthAndSafety endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see healthAndSafety.types.ts
import apiClient from '../apiClient';
import type { AddHealthAndSafetyStatus, AddHealthAndSafetyStatusResultData, ArogyaSetuStatusList, ArogyaSetuStatusListResultData, BodyTempUnitType, BodyTempUnitTypeResultData, GetHealthAndSafetyStatus, GetHealthAndSafetyStatusResultData, HealthAndSafety, HealthAndSafetyResultData, UpdateHealthAndSafetyStatus, UpdateHealthAndSafetyStatusResultData } from './healthAndSafety.types';

/**
 * Source: URLConstant.HealthAndSafteyDetails.GET_HEALTH_SAFETY_FEATURE_DETAILS
 * Endpoint: GET HealthAndSafety/IsHealthAndSafetyFeatureEnabled
 */
export const getHealthSafetyFeatureDetails = async (params?: Record<string, any>): Promise<HealthAndSafety> => {
  const response = await apiClient.get('HealthAndSafety/IsHealthAndSafetyFeatureEnabled', { params });
  return response.data;
};

/**
 * Source: URLConstant.HealthAndSafteyDetails.GET_BODY_TEMP_UNIT_TYPE
 * Endpoint: POST HealthAndSafety/GetBodyTemperatureUnitType
 */
export const getBodyTempUnitType = async (data?: Partial<BodyTempUnitTypeResultData>): Promise<BodyTempUnitType> => {
  const response = await apiClient.post('HealthAndSafety/GetBodyTemperatureUnitType', data);
  return response.data;
};

/**
 * Source: URLConstant.HealthAndSafteyDetails.GET_AROGYASETU_STATUS_LIST
 * Endpoint: POST HealthAndSafety/GetArogyaSetuStatusList
 */
export const getArogyasetuStatusList = async (data?: Partial<ArogyaSetuStatusListResultData>): Promise<ArogyaSetuStatusList> => {
  const response = await apiClient.post('HealthAndSafety/GetArogyaSetuStatusList', data);
  return response.data;
};

/**
 * Source: URLConstant.HealthAndSafteyDetails.ADD_HEALTH_STATUS
 * Endpoint: POST HealthAndSafety/AddHealthStatus
 */
export const addHealthStatus = async (data?: Partial<AddHealthAndSafetyStatusResultData>): Promise<AddHealthAndSafetyStatus> => {
  const response = await apiClient.post('HealthAndSafety/AddHealthStatus', data);
  return response.data;
};

/**
 * Source: URLConstant.HealthAndSafteyDetails.GET_HEALTH_AND_SAFETY_STATUS
 * Endpoint: GET HealthAndSafety/GetHealthAndSafetyStatus
 */
export const getHealthAndSafetyStatus = async (params?: Record<string, any>): Promise<GetHealthAndSafetyStatus> => {
  const response = await apiClient.get('HealthAndSafety/GetHealthAndSafetyStatus', { params });
  return response.data;
};

/**
 * Source: URLConstant.HealthAndSafteyDetails.UPDATE_HEALTH_AND_SAFETY_STATUS
 * Endpoint: POST HealthAndSafety/UpdateHealthAndSafetyStatus
 */
export const updateHealthAndSafetyStatus = async (data?: Partial<UpdateHealthAndSafetyStatusResultData>): Promise<UpdateHealthAndSafetyStatus> => {
  const response = await apiClient.post('HealthAndSafety/UpdateHealthAndSafetyStatus', data);
  return response.data;
};
