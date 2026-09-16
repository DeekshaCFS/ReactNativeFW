// src/api/customerInquiry/customerInquiry.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each CustomerInquiry endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/FOC/Enquiry/EnquiryList.java ----
export interface EnquiryList {
  ResultData?: EnquiryListResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface EnquiryListResultData {
  CountryCode?: string;
  CountryDetailsId?: number;
  CustomerTagId?: number;
  BuildingNumber?: string;
  BrandName?: string;
  ModelNumber?: string;
  ImageFileBase64Str2?: string;
  ImageFileName2?: string;
  PhotoPath2?: string;
  ImageFileBase64Str1?: string;
  ImageFileName1?: string;
  PhotoPath1?: string;
  ImageFileBase64Str?: string;
  ImageFileName?: string;
  PhotoPath?: string;
  ProductModelNo?: string;
  ProductBrandName?: string;
  EnquiryType?: string;
  InquiryCreatedDate?: string;
  PrefDate?: string;
  TaskTypeName?: string;
  ReferenceName?: string;
  ServiceName?: string;
  OwnerId?: number;
  UserId?: number;
  PinCode?: string;
  Address?: string;
  LocDescription?: string;
  Longitude?: string;
  latitude?: string;
  LocName?: string;
  EmailId?: string;
  MobileNumber?: string;
  CustomerName?: string;
  InquaryState?: number;
  UpdatedDate?: string;
  UpdatedBy?: string;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  TaskId?: number;
  ReferenceId?: number;
  TechnicalNote?: string;
  TechnicalProblem?: string;
  ServicesId?: number;
  PreferableTime?: string;
  PreferableDate?: string;
  TaskTypeId?: number;
  CustomerDetailsid?: number;
  LocationId?: number;
  EnquiryNo?: number;
  EnquiryId?: number;
  State?: string;
  City?: string;
}

// ---- from DTO/FOC/Enquiry/AddEnquiry.java ----
export interface AddEnquiry {
  ResultData?: AddEnquiryResultData;
  Message?: string;
  Code?: string;
}

export interface AddEnquiryResultData {
  TaskTypeName?: string;
  ReferenceName?: string;
  ServiceName?: string;
  OwnerId?: number;
  UserId?: number;
  PinCode?: string;
  State?: string;
  City?: string;
  Address?: string;
  LocDescription?: string;
  Longitude?: string;
  latitude?: string;
  LocName?: string;
  EmailId?: string;
  MobileNumber?: string;
  CustomerName?: string;
  InquaryState?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  TaskId?: number;
  ReferenceId?: number;
  TechnicalNote?: string;
  TechnicalProblem?: string;
  ServicesId?: number;
  PreferableDate?: string;
  PreferableTime?: string;
  TaskTypeId?: number;
  CustomerDetailsid?: number;
  LocationId?: number;
  EnquiryId?: number;
}

// ---- from DTO/FOC/Enquiry/ServiceType.java ----
export interface ServiceType {
  ResultData?: ServiceTypeResultData[];
  Message?: string;
  Code?: string;
}

export interface ServiceTypeResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  ServiceName?: string;
  Id?: number;
}

// ---- from DTO/FOC/Enquiry/ReferenceType.java ----
export interface ReferenceType {
  ResultData?: ReferenceTypeResultData[];
  Message?: string;
  Code?: string;
}

export interface ReferenceTypeResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  ReferenceName?: string;
  Id?: number;
}
