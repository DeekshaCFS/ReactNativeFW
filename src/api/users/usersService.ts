// src/api/users/usersService.ts

import apiClient from '../apiClient';
import type { AddBulkTech, AddBulkTechResultData, AddTech, AuthMobileEmail, AuthMobileEmailResultData, ChangePassword, CustomFieldDTO, CustomFieldDTOResultData, CustomFieldTypeDTO, CustomFieldTypeDTOResultData, DeleteEmp, DeleteEmpResultData, DeleteOwnerTechnician, DeleteOwnerTechnicianResultData, DeleteUserName, TechnicianList, TechnicianListResultData, TravelledPathHistory, TravelledPathHistoryResultData, UpdateProfilePic, UpdateUser, UpdateUserResultData, UserDetails, UserDetailsResultData, UsersList, UsersListResultData } from './users.types';

/**
 * Source: URLConstant.Users.GET_ALL_USER_LIST
 * Endpoint: GET Users/AllUsersList
 */
export async function getAllUsersList(params: {
  OwnerId: number;
  PinCode?: string;
  RoleId?: number;
  OnlyList?: boolean;
}) {
  const response = await apiClient.get('Users/AllUsersList', { params });
  return response.data;
}

/**
 * Source: URLConstant.Users.ADD_USER
 * Endpoint: POST Users/TempRegistration
 */
export const addUser = async (data?: Partial<AddTech>): Promise<AddTech> => {
  const response = await apiClient.post('Users/TempRegistration', data);
  return response.data;
};

/**
 * Source: URLConstant.Users.GET_USER_DETAILS
 * Endpoint: GET Users/GetUsersByUserId
 */
export const getUserDetails = async (params?: Record<string, any>): Promise<UserDetails> => {
  const response = await apiClient.get('Users/GetUsersByUserId', { params });
  return response.data;
};

/**
 * Source: URLConstant.Users.UPDATE_USER
 * Endpoint: POST Users/UpdateUser
 */
export const updateUser = async (data?: Partial<UpdateUserResultData>): Promise<UpdateUser> => {
  const response = await apiClient.post('Users/UpdateUser', data);
  return response.data;
};

/**
 * Source: URLConstant.Users.UPDATE_PROFILE_PIC
 * Endpoint: POST Users/UploadPhoto
 */
export const updateProfilePic = async (data?: Partial<UpdateProfilePic>): Promise<UpdateProfilePic> => {
  const response = await apiClient.post('Users/UploadPhoto', data);
  return response.data;
};

/**
 * Source: URLConstant.Users.CHANGE_PASSWORD
 * Endpoint: POST Users/UpdatePassword
 */
export const changePassword = async (data?: Partial<ChangePassword>): Promise<ChangePassword> => {
  const response = await apiClient.post('Users/UpdatePassword', data);
  return response.data;
};

/**
 * Source: URLConstant.Users.DELETE_USER
 * Endpoint: GET Users/DeleteUser
 */
export const deleteUser = async (params?: Record<string, any>): Promise<DeleteUserName> => {
  const response = await apiClient.get('Users/DeleteUser', { params });
  return response.data;
};

/**
 * Source: URLConstant.Users.DELETE_TEMP_REG
 * Endpoint: GET Users/DeleteTempRegistration
 */
export const deleteTempReg = async (params?: Record<string, any>): Promise<DeleteUserName> => {
  const response = await apiClient.get('Users/DeleteTempRegistration', { params });
  return response.data;
};

/**
 * Source: URLConstant.Users.ADD_BULK_USERS
 * Endpoint: POST Users/AddBulkUsersForMobile
 */
export const addBulkUsers = async (data?: Partial<AddBulkTechResultData>): Promise<AddBulkTech> => {
  const response = await apiClient.post('Users/AddBulkUsersForMobile', data);
  return response.data;
};

/**
 * Source: URLConstant.Users.ADD_BULK_USERS_VALIDATION
 * Endpoint: POST Users/AddBulkUsersValidation
 */
export const addBulkUsersValidation = async (data?: Partial<AddBulkTechResultData>): Promise<AddBulkTech> => {
  const response = await apiClient.post('Users/AddBulkUsersValidation', data);
  return response.data;
};

/**
 * Source: URLConstant.Users.DOWNLOAD_TECH_LIST
 * Endpoint: GET Users/GetAllTechnicianListDownloadForMobile
 */
export const downloadTechList = async (params?: Record<string, any>): Promise<TechnicianList> => {
  const response = await apiClient.get('Users/GetAllTechnicianListDownloadForMobile', { params });
  return response.data;
};

/**
 * Source: URLConstant.Users.GET_PROFILE_DETAILS
 * Endpoint: GET Users/GetProfileDetails
 */
export const getProfileDetails = async (params?: Record<string, any>): Promise<UserDetails> => {
  const response = await apiClient.get('Users/GetProfileDetails', { params });
  return response.data;
};

/**
 * Source: URLConstant.Users.AUTHENTICATE_EMAIL
 * Endpoint: GET Users/IsTechEmailIdExistForUpdateProfile
 */
export const authenticateEmail = async (params?: Record<string, any>): Promise<AuthMobileEmail> => {
  const response = await apiClient.get('Users/IsTechEmailIdExistForUpdateProfile', { params });
  return response.data;
};

/**
 * Source: URLConstant.Users.AUTHENTICATE_MOBILE
 * Endpoint: GET Users/IsMobileNoExistForUpdateProfile
 */
export const authenticateMobile = async (params?: Record<string, any>): Promise<AuthMobileEmail> => {
  const response = await apiClient.get('Users/IsMobileNoExistForUpdateProfile', { params });
  return response.data;
};

/**
 * Source: URLConstant.Users.DELETE_ACCOUNT
 * Endpoint: GET Users/DeleteLoginCredentials
 */
export const deleteAccount = async (params?: Record<string, any>): Promise<DeleteOwnerTechnician> => {
  const response = await apiClient.get('Users/DeleteLoginCredentials', { params });
  return response.data;
};

/**
 * Source: URLConstant.Users.TRAVELLED_PATH_HISTORY
 * Endpoint: POST Users/AddPathTravelledHistory
 */
export const travelledPathHistory = async (data?: Partial<TravelledPathHistoryResultData>): Promise<TravelledPathHistory> => {
  const response = await apiClient.post('Users/AddPathTravelledHistory', data);
  return response.data;
};

/**
 * Source: URLConstant.Users.GET_CUSTOM_FIELD_DATA
 * Endpoint: GET Users/Get-CF-FieldDefinitions
 */
export const getCustomFieldData = async (params?: Record<string, any>): Promise<CustomFieldDTO> => {
  const response = await apiClient.get('Users/Get-CF-FieldDefinitions', { params });
  return response.data;
};

/**
 * Source: URLConstant.Users.GET_CUSTOM_FIELD_TYPES
 * Endpoint: GET Users/Get-CF-FieldTypes
 */
export const getCustomFieldTypes = async (params?: Record<string, any>): Promise<CustomFieldTypeDTO> => {
  const response = await apiClient.get('Users/Get-CF-FieldTypes', { params });
  return response.data;
};

/**
 * Source: URLConstant.Users.POST_TASK_CUSTOM_FIELD
 * Endpoint: POST Users/Add-Update-CF-FieldDefinitions
 */
export const postTaskCustomField = async (
  params: { UserId: number; TaskId: number },
  data: CustomFieldDTOResultData[],
): Promise<CustomFieldDTO> => {
  const response = await apiClient.post('Users/Add-Update-CF-FieldDefinitions', data, { params });
  return response.data;
};

/**
 * Source: URLConstant.UserManagement.DELETE_EMP_ACCOUNT
 * Endpoint: POST Users/DeleteLoginCredentialsList
 */
export const deleteEmpAccount = async (data?: Partial<DeleteEmpResultData>): Promise<DeleteEmp> => {
  const response = await apiClient.post('Users/DeleteLoginCredentialsList', data);
  return response.data;
};
