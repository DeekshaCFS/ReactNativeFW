// src/api/healthAndSafety/healthAndSafety.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each HealthAndSafety endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/HealthAndSaftey/HealthAndSafety.java ----
export interface HealthAndSafety {
  ResultData?: HealthAndSafetyResultData;
  Message?: string;
  Code?: string;
}

export interface HealthAndSafetyResultData {
  IsTodayHealthStatus?: HealthAndSafetyIsTodayHealthStatus;
  IsHealthFeaturesEnabled?: boolean;
}

export interface HealthAndSafetyIsTodayHealthStatus {
  isHealthAndSafetyValuesAddedForToday?: boolean;
}

// ---- from DTO/HealthAndSaftey/BodyTempUnitType.java ----
export interface BodyTempUnitType {
  ResultData?: BodyTempUnitTypeResultData[];
  Message?: string;
  Code?: string;
}

export interface BodyTempUnitTypeResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  Description?: string;
  TemperatureUnitType?: string;
  Id?: number;
}

// ---- from DTO/HealthAndSaftey/ArogyaSetuStatusList.java ----
export interface ArogyaSetuStatusList {
  ResultData?: ArogyaSetuStatusListResultData[];
  Message?: string;
  Code?: string;
}

export interface ArogyaSetuStatusListResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  Description?: string;
  ArogyaSetuStatus?: string;
  Id?: number;
}

// ---- from DTO/HealthAndSaftey/AddHealthAndSafetyStatus.java ----
export interface AddHealthAndSafetyStatus {
  ResultData?: AddHealthAndSafetyStatusResultData;
  Message?: string;
  Code?: string;
}

export interface AddHealthAndSafetyStatusResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  AarogyaSetuStatusId?: number;
  TemperatureUnitTypeId?: number;
  Temperature?: number;
  Id?: number;
}

// ---- from DTO/HealthAndSaftey/GetHealthAndSafetyStatus.java ----
export interface GetHealthAndSafetyStatus {
  ResultData?: GetHealthAndSafetyStatusResultData[];
  Message?: string;
  Code?: string;
}

export interface GetHealthAndSafetyStatusResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  Description?: string;
  AarogyaSetuStatus?: string;
  AarogyaSetuStatusId?: number;
  TemperatureUnitType?: string;
  TemperatureUnitTypeId?: number;
  Temperature?: number;
  Id?: number;
}

// ---- from DTO/HealthAndSaftey/UpdateHealthAndSafetyStatus.java ----
export interface UpdateHealthAndSafetyStatus {
  ResultData?: UpdateHealthAndSafetyStatusResultData;
  Message?: string;
  Code?: string;
}

export interface UpdateHealthAndSafetyStatusResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  AarogyaSetuStatusId?: number;
  TemperatureUnitTypeId?: number;
  Temperature?: number;
  Id?: number;
}
