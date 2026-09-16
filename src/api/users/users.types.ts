// src/api/users/users.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each Users endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/User/UsersList.java ----
export interface UsersList {
  ResultData?: UsersListResultData[];
  Message?: string;
  Code?: string;
}

export interface UsersListResultData {
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
  RoleId?: string;
  Id?: number;
  Temperature?: number;
  TemperatureUnitTypeId?: number;
  TemperatureUnitType?: string;
  AarogyaSetuStatusId?: number;
  ArogyaSetuStatus?: string;
  IsHealthFeaturesEnabled?: boolean;
  Description?: string;
  DOB?: string;
  GPSOnOrOff?: boolean;
  BatteryPercentage?: number;
  AadharCardNo?: string;
  CompanyServiceTypeId?: number;
  NoOfUsers?: number;
}

// ---- from DTO/User/AddTech.java ----
export interface AddTech {
  Message?: string;
  Code?: string;
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

// ---- from DTO/User/UpdateUser.java ----
export interface UpdateUser {
  Code?: string;
  ResultData?: UpdateUserResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
}

export interface UpdateUserResultData {
  ReferralCodesId?: number;
  CompanyGSTorPanNo?: string;
  CompanyServiceTypeId?: number;
  CompanyLogoName?: string;
  CompanyLogo?: string;
  CompanyWebsite?: string;
  CompanyContactNo?: number;
  CompanyAddress?: string;
  CompanyName?: string;
  CompanyId?: number;
  IsActive?: boolean;
  File?: string;
  FileName?: string;
  IsModelError?: boolean;
  IsSuccessful?: boolean;
  Address?: string;
  UpdatedBy?: number;
  ContactNo?: string;
  Email?: string;
  LastName?: string;
  UserId?: number;
  FirstName?: string;
  DOB?: string;
  CompanyCity?: string;
  AadharCardNo?: string;
  NoOfUsers?: string;
  IsMobileNoUpdate?: boolean;
  IsEmailIdUpdate?: boolean;
  IsResponseCode?: boolean;
  IsHappyCode?: boolean;
  LeadsEmail?: string;
  EmployeeDocumentBase64?: string;
  EmpDocumentType?: number;
  EmployeeDocumentName?: string;
  EmployeeDocumentFileType?: string;
}

// ---- from DTO/User/UpdateProfilePic.java ----
// NOTE: UpdateProfilePic.java only declares the response fields (Message/Code).
// The request body sent to Users/UploadPhoto — UserId/File/FileName — is built
// as a raw JSONObject client-side (see UpdateProfilePicAsyncTask#doInBackground),
// so those three request fields are added here as optional so the same
// interface can be reused for the POST payload.
export interface UpdateProfilePic {
  UserId?: number;
  File?: string;
  FileName?: string;
  Message?: string;
  Code?: string;
}

// ---- from DTO/ChangePassword.java ----
export interface ChangePassword {
  Message?: string;
  Code?: string;
}

// ---- from DTO/Delete/DeleteUserName.java ----
export interface DeleteUserName {
  Message?: string;
  Code?: string;
}

// ---- from DTO/User/AddBulkTech.java ----
export interface AddBulkTech {
  ResultData?: AddBulkTechResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface AddBulkTechResultData {
  IsMobileNo?: boolean;
  IsUserId?: boolean;
  TempTechSrNo?: number;
  CompanyName?: string;
  File?: string;
  FileName?: string;
  RoleGroup?: string;
  IsModelError?: boolean;
  IsSuccessful?: boolean;
  CreatedBy?: number;
  UserId?: number;
  Address?: string;
  ContactNo?: string;
  RoleId?: number;
  Email?: string;
  ConfirmPassword?: string;
  Password?: string;
  UserName?: string;
  LastName?: string;
  FirstName?: string;
  UserCountryCode?: number;
}

// ---- from DTO/User/TechnicianList.java ----
export interface TechnicianList {
  ResultData?: TechnicianListResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface TechnicianListResultData {
  TechFilePath?: string;
}

// ---- from DTO/User/AuthMobileEmail.java ----
export interface AuthMobileEmail {
  ResultData?: AuthMobileEmailResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface AuthMobileEmailResultData {
  OTP?: number;
}

// ---- from DTO/Delete/DeleteOwnerTechnician.java ----
export interface DeleteOwnerTechnician {
  ResultData?: DeleteOwnerTechnicianResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface DeleteOwnerTechnicianResultData {
  IsModelError?: boolean;
  IsSuccessful?: boolean;
  Id?: number;
}

// ---- from DTO/TravelPathHistory/TravelledPathHistory.java ----
export interface TravelledPathHistory {
  ResultData?: TravelledPathHistoryResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface TravelledPathHistoryResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserID?: number;
  TaskId?: number;
  LocAddress?: string;
  Longitude?: string;
  Latitude?: string;
  Id?: number;
}

// ---- from DTO/Task/CustomFieldDTO.java ----
export interface CustomFieldDTO {
  ResultData?: CustomFieldDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface CustomFieldDTOResultData {
  IsRequired?: boolean;
  FieldTypeName?: string;
  FieldTypeId?: number;
  UserValue?: string;
  Label?: string;
  InputId?: number;
  FieldId?: any;
  SerialNo?: number;
  TaskId?: number;
  isSyncDone?: string;
  UserId?: number;
  DropdownValue?: string[];
}

// ---- from DTO/Task/CustomFieldTypeDTO.java ----
export interface CustomFieldTypeDTO {
  ResultData?: CustomFieldTypeDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface CustomFieldTypeDTOResultData {
  Name?: string;
  Id?: number;
}

// ---- from DTO/Delete/DeleteEmp.java ----
export interface DeleteEmp {
  ResultData?: DeleteEmpResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface DeleteEmpResultData {
  IsModelError?: boolean;
  IsSuccessful?: boolean;
  Id?: number;
}