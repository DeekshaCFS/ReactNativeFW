// src/api/customerList/customerList.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each CustomerList endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/Customer/CustomerList.java ----
export interface CustomerList {
  ResultData?: CustomerListResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface CustomerListResultData {
  CustomerTagName?: string;
  CustomerTagId?: number;
  CountryDetailsId?: number;
  BuildingNumber?: string;
  CountryCode?: string;
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
  State?: string;
  City?: string;
}

// ---- from DTO/CRMTask/AddCustDTO.java ----
export interface AddCustDTO {
  ResultData?: AddCustDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface AddCustDTOResultData {
  AddressList?: AddCustDTOAddressList[];
  State?: string;
  City?: string;
  CreatorWithDetails?: AddCustDTOCreatorWithDetails;
  CustomerGroupName?: string;
  CustomerGroupId?: number;
  CustomerTagName?: string;
  CustomerTagId?: number;
  CountryDetailsId?: number;
  BuildingNumber?: string;
  CountryCode?: string;
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

export interface AddCustDTOAddressList {
  State?: string;
  City?: string;
  PinCode?: string;
  Notes?: string;
  RepNo?: string;
  RepName?: string;
  LandMarkPACI?: string;
  Address?: string;
  StreetBuildingFlat?: string;
  AddressName?: string;
  AddressId?: number;
}

export interface AddCustDTOCreatorWithDetails {
  ShortCreatedByFandLName?: string;
  ZoneName?: string;
  DesigationName?: string;
  UserGroupCode?: string;
  UserID?: number;
  CreatedByFandLName?: string;
}

// ---- from DTO/CRMTask/UpdateCustDTO.java ----
export interface UpdateCustDTO {
  ResultData?: UpdateCustDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface UpdateCustDTOResultData {
  AddressList?: UpdateCustDTOAddressList[];
  State?: string;
  City?: string;
  CreatorWithDetails?: UpdateCustDTOCreatorWithDetails;
  CustomerGroupName?: string;
  CustomerGroupId?: number;
  CustomerTagName?: string;
  CustomerTagId?: number;
  CountryDetailsId?: number;
  BuildingNumber?: string;
  CountryCode?: string;
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

export interface UpdateCustDTOAddressList {
  State?: string;
  City?: string;
  PinCode?: string;
  Notes?: string;
  RepNo?: string;
  RepName?: string;
  LandMarkPACI?: string;
  Address?: string;
  StreetBuildingFlat?: string;
  AddressName?: string;
  AddressId?: number;
}

export interface UpdateCustDTOCreatorWithDetails {
  ShortCreatedByFandLName?: string;
  ZoneName?: string;
  DesigationName?: string;
  UserGroupCode?: string;
  UserID?: number;
  CreatedByFandLName?: string;
}

// ---- from DTO/CRMTask/DeleteCustDTO.java ----
export interface DeleteCustDTO {
  ResultData?: DeleteCustDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface DeleteCustDTOResultData {
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

// ---- from DTO/CRMTask/CRMCustomerTagList.java ----
export interface CRMCustomerTagList {
  ResultData?: CRMCustomerTagListResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface CRMCustomerTagListResultData {
  UserId?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  CustomerTagDescription?: string;
  CustomerTagName?: string;
  CustomerTagId?: number;
}

// ---- from DTO/StateCity/StateDTO.java ----
export interface StateDTO {
  ResultData?: StateDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface StateDTOResultData {
  Text?: string;
  Value?: number;
}

// ---- from DTO/StateCity/CityDTO.java ----
export interface CityDTO {
  ResultData?: CityDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface CityDTOResultData {
  Text?: string;
  Value?: number;
}
