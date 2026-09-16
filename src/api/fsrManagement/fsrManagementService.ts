// src/api/fsrManagement/fsrManagementService.ts
// Auto-generated from URLConstant.java (FSRManagement endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see fsrManagement.types.ts
import apiClient from '../apiClient';
import type { AllChkPointInputFormDTO, AllChkPointInputFormDTOResultData, FSRBindListDTO, FSRBindListDTOResultData, GetAllFSR_ChkPoint_WithCategory, GetAllFSR_ChkPoint_WithCategoryResultData, GetChkPointsStatusName, GetChkPointsStatusNameResultData, RoutineServiceCustomerListDTO, RoutineServiceCustomerListDTOResultData, SaveSelectedChkPointData, SaveSelectedChkPointDataResultData } from './fsrManagement.types';

/**
 * Source: URLConstant.FSR.GET_FSR_BIND_LIST
 * Endpoint: GET FSRManagement/GetAllFSRListByUserId
 */
export const getFsrBindList = async (params?: Record<string, any>): Promise<FSRBindListDTO> => {
  const response = await apiClient.get('FSRManagement/GetAllFSRListByUserId', { params });
  return response.data;
};

/**
 * Source: URLConstant.FSR.GET_ROUTINE_CUSTOMER_LIST
 * Endpoint: GET FSRManagement/GetCustomerDetailsByAssetIdOrCustomerNumber
 */
export const getRoutineCustomerList = async (params?: Record<string, any>): Promise<RoutineServiceCustomerListDTO> => {
  const response = await apiClient.get('FSRManagement/GetCustomerDetailsByAssetIdOrCustomerNumber', { params });
  return response.data;
};

/**
 * Source: URLConstant.FSR.GET_ALLCHKPOINT_CATEGORY
 * Endpoint: GET FSRManagement/GetAllCheckpointWithCategoriesAndInputFormByTaskId
 */
export const getAllchkpointCategory = async (params?: Record<string, any>): Promise<GetAllFSR_ChkPoint_WithCategory> => {
  const response = await apiClient.get('FSRManagement/GetAllCheckpointWithCategoriesAndInputFormByTaskId', { params });
  return response.data;
};

/**
 * Source: URLConstant.FSR.GET_ALL_CHKPOINT_INPUTFORM_DATA
 * Endpoint: GET FSRManagement/GetSavedSelectedCheckpoint
 */
export const getAllChkpointInputformData = async (params?: Record<string, any>): Promise<AllChkPointInputFormDTO> => {
  const response = await apiClient.get('FSRManagement/GetSavedSelectedCheckpoint', { params });
  return response.data;
};

/**
 * Source: URLConstant.FSR.GET_CHKPOINT_STATUS_NAME
 * Endpoint: GET FSRManagement/GetCheckpointStatusByUserId
 */
export const getChkpointStatusName = async (params?: Record<string, any>): Promise<GetChkPointsStatusName> => {
  const response = await apiClient.get('FSRManagement/GetCheckpointStatusByUserId', { params });
  return response.data;
};

/**
 * Source: URLConstant.FSR.POST_CHKPOINT_DATA
 * Endpoint: POST FSRManagement/SaveSelectedCheckpoint
 * NOTE: the Java client (Api.java) posts this as `@Body List<SaveSelectedChkPointData.ResultData>` —
 * an array, not a single object. The original generated signature took a single
 * Partial<SaveSelectedChkPointDataResultData>, which didn't match the real API contract.
 */
export const postChkpointData = async (
  data: Partial<SaveSelectedChkPointDataResultData>[],
): Promise<SaveSelectedChkPointData> => {
  const response = await apiClient.post('FSRManagement/SaveSelectedCheckpoint', data);
  return response.data;
};
