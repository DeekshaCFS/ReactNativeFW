// src/api/signUp/signUp.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each SignUp endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/OTP.java ----
export interface OTP {
  ResultData?: OTPResultData;
  Message?: string;
  Code?: string;
}

export interface OTPResultData {
  Otp?: number;
}

// ---- from DTO/RegisterHere/TouchlessTempRegistration.java ----
export interface TouchlessTempRegistration {
  ResultData?: TouchlessTempRegistrationResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface TouchlessTempRegistrationResultData {
  NoOfUsers?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  LastName?: string;
  FirstName?: string;
  CountryDetailsId?: number;
  OTP?: number;
  EmailOrContactNo?: string;
  TouchlessSignupId?: number;
}

// ---- from DTO/RegisterHere/RegisterOwner.java ----
export interface RegisterOwner {
  ResultData?: RegisterOwnerResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface RegisterOwnerResultData {
  LgModel?: RegisterOwnerLgModel;
  LoginOutPut?: RegisterOwnerLoginOutPut;
  NoOfUsers?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  LastName?: string;
  FirstName?: string;
  CountryDetailsId?: number;
  OTP?: number;
  EmailOrContactNo?: string;
  TouchlessSignupId?: number;
  CompanyName?: string;
  EmailId?: string;
  ContactNo?: string;
}

export interface RegisterOwnerLgModel {
  PortalDeviceId?: string;
  UserPreferredLanguage?: string;
  UserID?: number;
  AndroidID?: string;
  Password?: string;
  UserName?: string;
}

export interface RegisterOwnerLoginOutPut {
  NoOfUsers?: number;
  CountryDetailsId?: number;
  IsAppTourCompleted?: boolean;
  OTP?: number;
  PortalDeviceId?: string;
  UserPreferredLanguage?: string;
  IsForgotPassword?: boolean;
  UserGroupName?: string;
  UserID?: number;
  Token?: string;
  UserGroupCode?: number;
  AssignZoneId?: number;
}

// ---- request payload for SignUp/TouchlessTempRegistration ----
// (Source: URLConstant.SignUp.GET_OTP_REGISTER — args passed to doTouchlessSignUp)
export interface TouchlessTempRegistrationRequest {
  EmailId: string;
  ContactNo: string;
  CountryDetailsId: number;
}
