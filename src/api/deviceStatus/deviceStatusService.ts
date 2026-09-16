// src/api/deviceStatus/deviceStatusService.ts
// Auto-generated from URLConstant.java (DeviceStatus endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see deviceStatus.types.ts
import apiClient from '../apiClient';
import type { DeviceStatus, DeviceStatusResultData } from './deviceStatus.types';

/**
 * Source: URLConstant.DeviceStatus.ADD_UPDATE_DEVICE_STATUS
 * Endpoint: POST DeviceStatus/AddOrUpdateGPSBatteryStatus
 */
export const addUpdateDeviceStatus = async (data?: Partial<DeviceStatusResultData>): Promise<DeviceStatus> => {
  const response = await apiClient.post('DeviceStatus/AddOrUpdateGPSBatteryStatus', data);
  return response.data;
};
