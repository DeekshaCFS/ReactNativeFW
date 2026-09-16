// src/api/userPermission/userPermission.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each UserPermission endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/UserPermission/UserPermissionDTO.java ----
export interface UserPermissionDTO {
  ResultData?: UserPermissionDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface UserPermissionDTOResultData {
  UserID?: number;
  UserGroupName?: string;
  UserGroupCodeID?: number;
  IsActive?: boolean;
  Permissioncode?: string;
  PermissionMasterID?: number;
  PermissionAccessID?: number;
}
