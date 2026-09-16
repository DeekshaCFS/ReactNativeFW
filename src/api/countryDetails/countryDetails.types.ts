// src/api/countryDetails/countryDetails.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each CountryDetails endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/CountryList/GetCountryList.java ----
export interface GetCountryList {
  ResultData?: GetCountryListResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface GetCountryListResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  CountryFlag?: string;
  CountryCode?: string;
  CountryName?: string;
  CountryDetailsId?: number;
}

// ---- from DTO/CountryList/GetCountrySymbol.java ----
export interface GetCountrySymbol {
  ResultData?: GetCountrySymbolResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface GetCountrySymbolResultData {
  IsActive?: boolean;
  UserId?: number;
  CurrencySymbol?: string;
  CurrencyName?: string;
  CountryCode?: string;
  CountryName?: string;
  CountryDetailsId?: number;
}
