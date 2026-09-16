// src/api/notification/notificationService.ts
// Auto-generated from URLConstant.java (Notification endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see notification.types.ts
import apiClient from '../apiClient';
import type { Notification, NotificationResultData, RegisterDeviceId, RegisterDeviceIdResultData, UpdateNotificationIsRead } from './notification.types';

/**
 * Source: URLConstant.Notification.REGISTER_DEVICE_ID
 * Endpoint: POST Notification/RegisterDevice
 */
export const registerDeviceId = async (data?: Partial<RegisterDeviceIdResultData>): Promise<RegisterDeviceId> => {
  const response = await apiClient.post('Notification/RegisterDevice', data);
  return response.data;
};

/**
 * Source: URLConstant.Notification.GET_NOTIFICATION_LIST
 * Endpoint: GET Notification/NotificationList
 */
export const getNotificationList = async (params?: Record<string, any>): Promise<Notification> => {
  const response = await apiClient.get('Notification/NotificationList', { params });
  return response.data;
};

/**
 * Source: URLConstant.Notification.UPDATE_NOTIFICATION_IS_READ
 * Endpoint: POST Notification/UpdateNotificationIsReadStatus
 */
export const updateNotificationIsRead = async (data?: Partial<UpdateNotificationIsRead>): Promise<UpdateNotificationIsRead> => {
  const response = await apiClient.post('Notification/UpdateNotificationIsReadStatus', data);
  return response.data;
};
