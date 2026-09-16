// src/api/fsrManagement/fsrManagement.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each FSRManagement endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/FSR/FSRBindListDTO.java ----
export interface FSRBindListDTO {
  ResultData?: FSRBindListDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface FSRBindListDTOResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  FSRName?: string;
  FSRId?: number;
}

// ---- from DTO/FSR/RoutineServiceCustomerListDTO.java ----
export interface RoutineServiceCustomerListDTO {
  ResultData?: RoutineServiceCustomerListDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface RoutineServiceCustomerListDTOResultData {
  ModelNumber?: string;
  BrandName?: string;
  SecondaryDescription?: string;
  SecondaryAddress?: string;
  Instructions?: string;
  Longitude?: string;
  latitude?: string;
  Description?: string;
  PinCode?: string;
  Address?: string;
  SecondaryInstructions?: string;
  SecondaryMobileNumber?: string;
  SecondaryEmailId?: string;
  UpdatedDate?: string;
  UpdatedBy?: string;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  LocationId?: number;
  EmailId?: string;
  MobileNumber?: string;
  CustomerName?: string;
  CustomerDetailsid?: number;
}

// ---- from DTO/FSR/GetAllFSR_ChkPoint_WithCategory.java ----
export interface GetAllFSR_ChkPoint_WithCategory {
  ResultData?: GetAllFSR_ChkPoint_WithCategoryResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface GetAllFSR_ChkPoint_WithCategoryResultData {
  lstInputTextCategoryDTo?: GetAllFSR_ChkPoint_WithCategoryLstInputTextCategoryDTo[];
  lstSelectedCheckpointDTo?: GetAllFSR_ChkPoint_WithCategoryLstSelectedCheckpointDTo[];
  lstCheckpointStatusDTo?: GetAllFSR_ChkPoint_WithCategoryLstCheckpointStatusDTo[];
  lstInputTextForm?: GetAllFSR_ChkPoint_WithCategoryLstInputTextForm[];
  lstFSRCategories?: GetAllFSR_ChkPoint_WithCategoryLstFSRCategories[];
  IsInputText?: boolean;
  IsFSR?: boolean;
  InputTextDescription?: string;
  InputTextName?: string;
  InputtextId?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  FSRName?: string;
  FSRId?: number;
  IsCheckpoint?: boolean;
  IsInputTextCategory?: boolean;
}

export interface GetAllFSR_ChkPoint_WithCategoryLstInputTextCategoryDTo {
  InputTextId?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Name?: string;
  InputTextCategoryId?: number;
}

export interface GetAllFSR_ChkPoint_WithCategoryLstSelectedCheckpointDTo {
  IsActive?: boolean;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  InputTextId?: number;
  CheckpointId?: number;
  CategoryId?: number;
  FSRId?: number;
  SelectedCheckpointId?: number;
}

export interface GetAllFSR_ChkPoint_WithCategoryLstCheckpointStatusDTo {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  CheckpointStatusName?: string;
  CheckpointStatusId?: number;
}

export interface GetAllFSR_ChkPoint_WithCategoryLstInputTextForm {
  lstInputTextCategoryDtos?: GetAllFSR_ChkPoint_WithCategoryLstInputTextCategoryDtos[];
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Description?: string;
  Name?: string;
  Id?: number;
}

export interface GetAllFSR_ChkPoint_WithCategoryLstInputTextCategoryDtos {
  InputTextId?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Name?: string;
  InputTextCategoryId?: number;
}

export interface GetAllFSR_ChkPoint_WithCategoryLstFSRCategories {
  lstCheckpointDTo?: GetAllFSR_ChkPoint_WithCategoryLstCheckpointDTo[];
  CategoryDescription?: string;
  FSRId?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  CategoryName?: string;
  CategoryId?: number;
}

export interface GetAllFSR_ChkPoint_WithCategoryLstCheckpointDTo {
  CheckpointDescription?: string;
  CheckpointName?: string;
  FSRCategoryId?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  CheckpointId?: number;
}

// ---- from DTO/FSR/AllChkPointInputFormDTO.java ----
export interface AllChkPointInputFormDTO {
  ResultData?: AllChkPointInputFormDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface AllChkPointInputFormDTOResultData {
  lstInputText?: AllChkPointInputFormDTOLstInputText[];
  lstFSRManagement?: AllChkPointInputFormDTOLstFSRManagement[];
}

export interface AllChkPointInputFormDTOLstInputText {
  lstInputTextCategoryDtos?: AllChkPointInputFormDTOLstInputTextCategoryDtos[];
  IsInputText?: boolean;
  IsFSR?: boolean;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Name?: string;
  Id?: number;
}

export interface AllChkPointInputFormDTOLstInputTextCategoryDtos {
  Description?: string;
  InputTextId?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Name?: string;
  InputTextCategoryId?: number;
}

export interface AllChkPointInputFormDTOLstFSRManagement {
  lstInputTextCategoryDTo?: AllChkPointInputFormDTOLstInputTextCategoryDTo[];
  lstSelectedCheckpointDTo?: AllChkPointInputFormDTOLstSelectedCheckpointDTo[];
  lstCheckpointStatusDTo?: AllChkPointInputFormDTOLstCheckpointStatusDTo[];
  lstInputTextForm?: AllChkPointInputFormDTOLstInputTextForm[];
  lstFSRCategories?: AllChkPointInputFormDTOLstFSRCategories[];
  IsInputText?: boolean;
  IsFSR?: boolean;
  InputTextName?: string;
  InputtextId?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  FSRName?: string;
  FSRId?: number;
}

export interface AllChkPointInputFormDTOLstInputTextCategoryDTo {
  Description?: string;
  InputTextId?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Name?: string;
  InputTextCategoryId?: number;
}

export interface AllChkPointInputFormDTOLstSelectedCheckpointDTo {
  IsActive?: boolean;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  InputTextId?: number;
  CheckpointId?: number;
  CategoryId?: number;
  FSRId?: number;
  SelectedCheckpointId?: number;
}

export interface AllChkPointInputFormDTOLstCheckpointStatusDTo {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  CheckpointStatusName?: string;
  CheckpointStatusId?: number;
}

export interface AllChkPointInputFormDTOLstInputTextForm {
  lstInputTextCategoryDtos?: AllChkPointInputFormDTOLstInputTextCategoryDtos[];
  IsInputText?: boolean;
  IsFSR?: boolean;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Name?: string;
  Id?: number;
}

export interface AllChkPointInputFormDTOLstFSRCategories {
  lstCheckpointDTo?: AllChkPointInputFormDTOLstCheckpointDTo[];
  CategoryDescription?: string;
  FSRId?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  CategoryName?: string;
  CategoryId?: number;
}

export interface AllChkPointInputFormDTOLstCheckpointDTo {
  SelectedCheckpointStatus?: AllChkPointInputFormDTOSelectedCheckpointStatus;
  CheckpointDescription?: string;
  CheckpointName?: string;
  FSRCategoryId?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  CheckpointId?: number;
}

export interface AllChkPointInputFormDTOSelectedCheckpointStatus {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  CheckpointStatusName?: string;
  CheckpointStatusId?: number;
}

// ---- from DTO/FSR/GetChkPointsStatusName.java ----
export interface GetChkPointsStatusName {
  ResultData?: GetChkPointsStatusNameResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface GetChkPointsStatusNameResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  CheckpointStatusName?: string;
  CheckpointStatusId?: number;
}

// ---- from DTO/FSR/SaveSelectedChkPointData.java ----
export interface SaveSelectedChkPointData {
  ResultData?: SaveSelectedChkPointDataResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface SaveSelectedChkPointDataResultData {
  InputTextCategoryId?: number;
  InputtextDescription?: string;
  TaskId?: number;
  IsActive?: boolean;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  InputTextId?: number;
  CheckpointStatusId?: number;
  CheckpointId?: number;
  CategoryId?: number;
  FSRId?: number;
  SelectedCheckpointId?: number;
}
