// src/api/dashboard/dashboardService.ts
// Auto-generated from URLConstant.java (Dashboard endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see dashboard.types.ts
import apiClient from '../apiClient';
import type { GetDashboardDTO, GetDashboardDTOResultData, TaskStatusCount, TaskStatusCountResultData } from './dashboard.types';

/**
 * Source: URLConstant.Dashboard.GET_TASK_STATUS_COUNT_OWN_NEW
 * Endpoint: GET Dashboard/GetTaskDataForDashboard
 */
export const getTaskStatusCountOwnNew = async (params?: Record<string, any>): Promise<TaskStatusCount> => {
  const response = await apiClient.get('Dashboard/GetTaskDataForDashboard', { params });
  return response.data;
};

/**
 * Source: URLConstant.Dashboard.GET_TASK_STATUS_COUNT_TECH_NEW
 * Endpoint: GET Dashboard/TaskDataStatuswiseByUserIdV2
 */
export const getTaskStatusCountTechNew = async (params?: Record<string, any>): Promise<TaskStatusCount> => {
  const response = await apiClient.get('Dashboard/TaskDataStatuswiseByUserIdV2', { params });
  return response.data;
};

/**
 * Source: URLConstant.Dashboard.GET_DASHBOARD_DATA
 * Endpoint: GET Dashboard/GetDashboardData
 */
export const getDashboardData = async (params?: Record<string, any>): Promise<GetDashboardDTO> => {
  const response = await apiClient.get('Dashboard/GetDashboardData', { params });
  return response.data;
};
