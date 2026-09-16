// src/api/companyDetails/companyDetails.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each CompanyDetails endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/User/CompanyDetails.java ----
export interface CompanyDetails {
  ResultData?: CompanyDetailsResultData;
  Message?: string;
  Code?: string;
}

export interface CompanyDetailsResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  Activity?: string;
  CompanyLogo?: string;
  CompanyWebsite?: string;
  CompanyStatus?: boolean;
  CompanyDomain?: string;
  CIN?: string;
  RegistrationNo?: string;
  ContactNo?: number;
  Address?: string;
  CompanyName?: string;
  Id?: number;
}
