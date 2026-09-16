// src/api/userPermission/userPermissionService.ts
// Auto-generated from URLConstant.java (UserPermission endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see userPermission.types.ts
import apiClient from '../apiClient';
import type { UserPermissionDTO, UserPermissionDTOResultData } from './userPermission.types';

/**
 * Source: URLConstant.UserPermission.USER_PERMISSIONS
 * Endpoint: GET UserPermission/GetUserPermission
 */
export const userPermissions = async (params?: Record<string, any>): Promise<UserPermissionDTO> => {
  const response = await apiClient.get('UserPermission/GetUserPermission', { params });
  return response.data;
};
