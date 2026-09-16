// src/api/auth/login.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each Login endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/User/RegisterUser.java ----
export interface RegisterUser {
  ResultData?: RegisterUserResultData;
  Message?: string;
  Code?: string;
}

export interface RegisterUserResultData {
  File?: string;
  FileName?: string;
  RoleGroup?: string;
  IsModelError?: boolean;
  IsSuccessful?: boolean;
  CreatedBy?: number;
  UserId?: number;
  ContactNo?: string;
  RoleId?: number;
  Email?: string;
  ConfirmPassword?: string;
  Password?: string;
  UserName?: string;
  LastName?: string;
  FirstName?: string;
  CompanyName?: string;
  CompanyAddress?: string;
  CompanyContactNo?: number;
  CompanyWebsite?: string;
  CompanyLogo?: string;
  CompanyLogoName?: string;
  CompanyGSTorPanNo?: string;
  referralCode?: string;
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

// ---- from DTO/ForgotPassword.java ----
export interface ForgotPassword {
  Message?: string;
  Code?: string;
}

// ---- from DTO/User/LanguageList.java ----
export interface LanguageList {
  language?: string;
  languageCode?: string;
  Code?: string;
  Message?: string;
}

// ---- from DTO/User/UserDetails.java ----
export interface UserDetails {
  ResultData?: UserDetailsResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface UserDetailsResultData {
  ownerAccountDetailsDto?: UserDetailsOwnerAccountDetailsDto;
  lstOwnerDynamicFieldDtos?: UserDetailsLstOwnerDynamicFieldDtos[];
  lstOwnerTaxDetailsDtos?: UserDetailsLstOwnerTaxDetailsDtos[];
  CountryCode?: string;
  CurrencySymbol?: string;
  CountryDetailsId?: number;
  SkillName?: string;
  SocialId?: string;
  WhatsappAPIKey?: string;
  DIDNumber?: string;
  IsTeleCmiEnabled?: string;
  OwnerLastName?: string;
  OwnerFirstName?: string;
  AadharCardNo?: string;
  NoOfUsers?: string;
  ProgressBarPercentage?: string;
  BatteryPercentage?: number;
  GPSOnOrOff?: boolean;
  CompanyCity?: string;
  DOB?: string;
  ReferralCodeName?: string;
  ReferralCodesId?: number;
  CompanyGSTorPanNo?: string;
  CompanyServiceTypeId?: number;
  CompanyLogo?: string;
  CompanyWebsite?: string;
  CompanyContactNo?: number;
  CompanyAddress?: string;
  CompanyName?: string;
  CompanyId?: number;
  CheckOutPlace?: string;
  ModifiedDate?: string;
  IsRegistered?: boolean;
  CheckOutTime?: string;
  Description?: string;
  IsHealthFeaturesEnabled?: boolean;
  ArogyaSetuStatus?: string;
  AarogyaSetuStatusId?: number;
  TemperatureUnitType?: string;
  TemperatureUnitTypeId?: number;
  Temperature?: number;
  AttendanceMarkedTime?: string;
  AttendanceMarkedPlace?: string;
  TechLongitude?: string;
  TechLatitude?: string;
  UserID?: number;
  AttendanceId?: number;
  Attendance?: string;
  OwnerId?: number;
  Photo?: string;
  IsActive?: boolean;
  UserName?: string;
  Address?: string;
  Email?: string;
  ContactNo?: string;
  MiddleName?: string;
  LastName?: string;
  FirstName?: string;
  Role?: string;
  RoleId?: number;
  Id?: number;
  IsResponseCode?: boolean;
  IsHappyCode?: boolean;
  LeadsEmail?: string;
  EmpDocType?: number;
  EmpDocument?: string;
  CRMLoginURL?: string;
  TaskConfigurationOBJ?: UserDetailsTaskConfigurationOBJ;
}

export interface UserDetailsOwnerAccountDetailsDto {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  UserId?: number;
  QRCodeImage?: string;
  QRCodeImageFileBase64Str?: string;
  QRCodeImageFileName?: string;
  CurrencySymbolId?: number;
  PaymentLink?: string;
  UPI_Id?: string;
  BranchAddress?: string;
  AccountNumber?: string;
  IFSC_Code?: string;
  BankName?: string;
  OwnerAccountDetailId?: number;
}

export interface UserDetailsLstOwnerDynamicFieldDtos {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  UserId?: number;
  DynamicFieldDescription?: string;
  DynamicFieldName?: string;
  DynamicFieldId?: number;
}

export interface UserDetailsLstOwnerTaxDetailsDtos {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  UserId?: number;
  TaxPercentage?: number;
  TaxName?: string;
  TaxDetailId?: number;
}

export interface UserDetailsTaskConfigurationOBJ {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsTaskTagEnable?: boolean;
  IsPincodeEnable?: boolean;
  IsCityEnable?: boolean;
  IsStateEnable?: boolean;
  UserID?: number;
  TaskConfigID?: number;
}

// ---- from DTO/FWUser.java (actual response for Login/UserLoginMobile — NOT UserDetails) ----
export interface TouchlessLoginResponse {
  ResultData?: TouchlessLoginResultData;
  Message?: string;
  Code?: string;
}

export interface TouchlessLoginResultData {
  UserGroupName?: string;
  UserID?: number;
  Token?: string;
  IsForgotPassword?: boolean;
  UserPreferredLanguage?: string;
  OTP?: string;          // note: string on the wire, despite being numeric
  CountryDetailsId?: number;
  UserGroupCode?: number;
  AssignZoneId?: number;
  AdminId?: number;
  OwnerId?: number;
}

// request payload for Login/UserLoginMobile
export interface TouchlessLoginRequest {
  UserName: string;
  Password: string;       // always sent empty for OTP login
  AndroidID: string;
  UserPreferredLanguage: string;
}