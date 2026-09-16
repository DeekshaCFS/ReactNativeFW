// src/api/umEmployeeList/umEmployeeListService.ts
// Auto-generated from URLConstant.java (UM_EmployeeList endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see umEmployeeList.types.ts
import apiClient from '../apiClient';
import type { AddBulkFWDTO, AddBulkFWDTOResultData, EditEmpDTO, EditEmpDTOResultData, EmployListDTO, EmployListDTOResultData, KYC_List_DTO, KYC_List_DTOResultData, UpdateEmpDetails, UpdateEmpDetailsResultData } from './umEmployeeList.types';

/**
 * Source: URLConstant.Users.GET_ALL_EMP_LIST
 * Endpoint: GET UM_EmployeeList/AllEmployeeListByUserIdAndSearchParam
 */
export const getAllEmpList = async (params?: Record<string, any>): Promise<EmployListDTO> => {
  const response = await apiClient.get('UM_EmployeeList/AllEmployeeListByUserIdAndSearchParam', { params });
  return response.data;
};

/**
 * Source: URLConstant.UserManagement.POST_BULK_FW
 * Endpoint: POST UM_EmployeeList/AddEmployeeDetailsForUMList
 */
export async function addBulkFieldworkers(payload: Array<{
  UserId: number;
  CreatedBy: number;
  UserGroupCode: number; // 2 = fieldworker
  ServicezoneId: number;
  DesignationId: number;
  FieldworkerBulkInsertArray: Array<{
    AE_FW_Firstname: string;
    AE_FW_Lastname: string;
    AE_FW_Contact: string;
  }>;
}>) {
  const response = await apiClient.post('UM_EmployeeList/AddEmployeeDetailsForUMList', payload);
  return response.data;
}

/**
 * Source: URLConstant.UserManagement.GET_KYC_LIST
 * Endpoint: GET UM_EmployeeList/GetDocumentTypeListByUserId
 */
export const getKycList = async (params?: Record<string, any>): Promise<KYC_List_DTO> => {
  const response = await apiClient.get('UM_EmployeeList/GetDocumentTypeListByUserId', { params });
  return response.data;
};

/**
 * Source: URLConstant.UserManagement.UPDATE_EMP_DETAILS
 * Endpoint: POST UM_EmployeeList/UpdateEmployeeDetails
 */
export const updateEmpDetails = async (data?: Partial<UpdateEmpDetailsResultData>): Promise<UpdateEmpDetails> => {
  const response = await apiClient.post('UM_EmployeeList/UpdateEmployeeDetails', data);
  return response.data;
};

/**
 * Source: URLConstant.UserManagement.GET_EMP_DETAILS_FOR_EDIT
 * Endpoint: GET UM_EmployeeList/GetEmployeeDetailsForUpdate
 */
export const getEmpDetailsForEdit = async (params?: Record<string, any>): Promise<EditEmpDTO> => {
  const response = await apiClient.get('UM_EmployeeList/GetEmployeeDetailsForUpdate', { params });
  return response.data;
};
