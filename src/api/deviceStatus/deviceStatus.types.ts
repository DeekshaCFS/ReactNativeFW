// src/api/deviceStatus/deviceStatus.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each DeviceStatus endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/DeviceStatus/DeviceStatus.java ----
export interface DeviceStatus {
  ResultData?: DeviceStatusResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface DeviceStatusResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  BatteryPercentage?: number;
  GPSOnOrOff?: boolean;
  Id?: number;
}
