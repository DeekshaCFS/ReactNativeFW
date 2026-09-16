// src/api/services/services.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each Services endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/ServiceManagement/ServiceTypeListDTO.java ----
export interface ServiceTypeListDTO {
  ResultData?: ServiceTypeListDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface ServiceTypeListDTOResultData {
  UserId?: number;
  ServiceTypeSubCategoryId?: number;
  ImageFileBase64Str2?: string;
  ImageFileName2?: string;
  PhotoPath2?: string;
  ImageFileBase64Str1?: string;
  ImageFileName1?: string;
  PhotoPath1?: string;
  ImageFileBase64Str?: string;
  ImageFileName?: string;
  PhotoPath?: string;
  ContactNo?: number;
  Price?: number;
  Description?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  ServiceName?: string;
  Id?: number;
}

// ---- from DTO/ServiceManagement/DeleteServiceCategoryListDTO.java ----
export interface DeleteServiceCategoryListDTO {
  ResultData?: DeleteServiceCategoryListDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface DeleteServiceCategoryListDTOResultData {
  UserId?: number;
  ServiceTypeSubCategoryId?: number;
  ImageFileBase64Str2?: string;
  ImageFileName2?: string;
  PhotoPath2?: string;
  ImageFileBase64Str1?: string;
  ImageFileName1?: string;
  PhotoPath1?: string;
  ImageFileBase64Str?: string;
  ImageFileName?: string;
  PhotoPath?: string;
  ContactNo?: number;
  Price?: number;
  Description?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  ServiceName?: string;
  Id?: number;
}

// ---- from DTO/ServiceManagement/EnquiryServiceTypeDTO.java ----
export interface EnquiryServiceTypeDTO {
  ResultData?: EnquiryServiceTypeDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface EnquiryServiceTypeDTOResultData {
  Price?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  ServiceName?: string;
  Id?: number;
  Qty?: number;
}

// ---- from DTO/ServiceManagement/ServiceCategoryListDTO.java ----
export interface ServiceCategoryListDTO {
  ResultData?: ServiceCategoryListDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface ServiceCategoryListDTOResultData {
  lstServiceTypeSubcategories?: ServiceCategoryListDTOLstServiceTypeSubcategories[];
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  UserId?: number;
  ServiceTypeCategoryImage?: string;
  ServiceTypeCategoryDescription?: string;
  ServiceTypeCategoryName?: string;
  ServiceTypeCategoryId?: number;
}

export interface ServiceCategoryListDTOLstServiceTypeSubcategories {
  lstServiceType?: ServiceCategoryListDTOLstServiceType[];
  ServiceTypeCategoryId?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  UserId?: number;
  SubCategoryImageFileBase64Str?: string;
  SubCategoryImageName?: string;
  ServiceTypeSubCategoryImage?: string;
  ServiceTypeSubCategoryDescription?: string;
  ServiceTypeSubCategoryName?: string;
  ServiceTypeSubCategoryId?: number;
}

export interface ServiceCategoryListDTOLstServiceType {
  ServiceTypeSubCategoryId?: number;
  ImageFileBase64Str2?: string;
  ImageFileName2?: string;
  PhotoPath2?: string;
  ImageFileBase64Str1?: string;
  ImageFileName1?: string;
  PhotoPath1?: string;
  ImageFileBase64Str?: string;
  ImageFileName?: string;
  PhotoPath?: string;
  ContactNo?: number;
  Price?: number;
  Description?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  ServiceName?: string;
  Id?: number;
}

// ---- from DTO/ServiceManagement/ServiceSubCategoryListDTO.java ----
export interface ServiceSubCategoryListDTO {
  ResultData?: ServiceSubCategoryListDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface ServiceSubCategoryListDTOResultData {
  lstServiceType?: ServiceSubCategoryListDTOLstServiceType[];
  ServiceTypeCategoryId?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  UserId?: number;
  SubCategoryImageFileBase64Str?: string;
  SubCategoryImageName?: string;
  ServiceTypeSubCategoryImage?: string;
  ServiceTypeSubCategoryDescription?: string;
  ServiceTypeSubCategoryName?: string;
  ServiceTypeSubCategoryId?: number;
}

export interface ServiceSubCategoryListDTOLstServiceType {
  ServiceTypeSubCategoryId?: number;
  ImageFileBase64Str2?: string;
  ImageFileName2?: string;
  PhotoPath2?: string;
  ImageFileBase64Str1?: string;
  ImageFileName1?: string;
  PhotoPath1?: string;
  ImageFileBase64Str?: string;
  ImageFileName?: string;
  PhotoPath?: string;
  ContactNo?: string;
  Price?: number;
  Description?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  ServiceName?: string;
  Id?: number;
}

// ---- from DTO/ServiceManagement/ServiceListInsideSubCategoryDTO.java ----
export interface ServiceListInsideSubCategoryDTO {
  ResultData?: ServiceListInsideSubCategoryDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface ServiceListInsideSubCategoryDTOResultData {
  UserId?: number;
  ServiceTypeSubCategoryId?: number;
  ImageFileBase64Str2?: string;
  ImageFileName2?: string;
  PhotoPath2?: string;
  ImageFileBase64Str1?: string;
  ImageFileName1?: string;
  PhotoPath1?: string;
  ImageFileBase64Str?: string;
  ImageFileName?: string;
  PhotoPath?: string;
  ContactNo?: number;
  Price?: number;
  Description?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  ServiceName?: string;
  Id?: number;
}

// ---- from DTO/ServiceManagement/AddUpdateServiceCategoryDTO.java ----
export interface AddUpdateServiceCategoryDTO {
  ResultData?: AddUpdateServiceCategoryDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface AddUpdateServiceCategoryDTOResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  UserId?: number;
  CategoryImageFileBase64Str?: string;
  CategoryImageFileName?: string;
  ServiceTypeCategoryImage?: string;
  ServiceTypeCategoryDescription?: string;
  ServiceTypeCategoryName?: string;
  ServiceTypeCategoryId?: number;
}

// ---- from DTO/ServiceManagement/AddUpdateServiceSubCategoryDTO.java ----
export interface AddUpdateServiceSubCategoryDTO {
  ResultData?: AddUpdateServiceSubCategoryDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface AddUpdateServiceSubCategoryDTOResultData {
  lstServiceType?: AddUpdateServiceSubCategoryDTOLstServiceType[];
  ServiceCount?: number;
  ServiceTypeCategoryId?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  UserId?: number;
  SubCategoryImageFileBase64Str?: string;
  SubCategoryImageName?: string;
  ServiceTypeSubCategoryImage?: string;
  ServiceTypeSubCategoryDescription?: string;
  ServiceTypeSubCategoryName?: string;
  ServiceTypeSubCategoryId?: number;
}

export interface AddUpdateServiceSubCategoryDTOLstServiceType {
  ServiceTypeSubCategoryId?: number;
  ImageFileBase64Str2?: string;
  ImageFileName2?: string;
  PhotoPath2?: string;
  ImageFileBase64Str1?: string;
  ImageFileName1?: string;
  PhotoPath1?: string;
  ImageFileBase64Str?: string;
  ImageFileName?: string;
  PhotoPath?: string;
  ContactNo?: number;
  Price?: number;
  Description?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  ServiceName?: string;
  Id?: number;
}

// ---- from DTO/ServiceManagement/DeleteServiceSubCategoryListDTO.java ----
export interface DeleteServiceSubCategoryListDTO {
  ResultData?: DeleteServiceSubCategoryListDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface DeleteServiceSubCategoryListDTOResultData {
  UserId?: number;
  ServiceTypeSubCategoryId?: number;
  ImageFileBase64Str2?: string;
  ImageFileName2?: string;
  PhotoPath2?: string;
  ImageFileBase64Str1?: string;
  ImageFileName1?: string;
  PhotoPath1?: string;
  ImageFileBase64Str?: string;
  ImageFileName?: string;
  PhotoPath?: string;
  ContactNo?: number;
  Price?: number;
  Description?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  ServiceName?: string;
  Id?: number;
}
