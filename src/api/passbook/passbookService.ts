// src/api/passbook/passbookService.ts
// Auto-generated from URLConstant.java (Passbook endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see passbook.types.ts
import apiClient from '../apiClient';
import type { DailyPassbook, DailyPassbookResultData, EarningDashboard, EarningDashboardResultData, MonthlyPassbook, MonthlyPassbookResultData, TodayPassbook, TodayPassbookResultData, UpdatePassbook, UpdateTaskWithEarnedAmount, UpdateTaskWithEarnedAmountRequest, WeeklyPassbook, WeeklyPassbookResultData, YearlyPassbook, YearlyPassbookResultData } from './passbook.types';

/**
 * Source: URLConstant.Passbook.GET_TODAY_PASSBOOK
 * Endpoint: GET Passbook/GetTodaysPassbookByUserId
 */
export const getTodayPassbook = async (params?: Record<string, any>): Promise<TodayPassbook> => {
  const response = await apiClient.get('Passbook/GetTodaysPassbookByUserId', { params });
  return response.data;
};

/**
 * Source: URLConstant.Passbook.GET_DAILY_PASSBOOK
 * Endpoint: GET Passbook/GetDailyOfCurrentWeekPassbook
 */
export const getDailyPassbook = async (params?: Record<string, any>): Promise<DailyPassbook> => {
  const response = await apiClient.get('Passbook/GetDailyOfCurrentWeekPassbook', { params });
  return response.data;
};

/**
 * Source: URLConstant.Passbook.GET_WEEKLY_PASSBOOK
 * Endpoint: GET Passbook/GetWeeklyPassbook
 */
export const getWeeklyPassbook = async (params?: Record<string, any>): Promise<WeeklyPassbook> => {
  const response = await apiClient.get('Passbook/GetWeeklyPassbook', { params });
  return response.data;
};

/**
 * Source: URLConstant.Passbook.GET_MONTHLY_PASSBOOK_NEW
 * Endpoint: GET Passbook/GetMonthlyPassbookV2
 */
export const getMonthlyPassbookNew = async (params?: Record<string, any>): Promise<MonthlyPassbook> => {
  const response = await apiClient.get('Passbook/GetMonthlyPassbookV2', { params });
  return response.data;
};

/**
 * Source: URLConstant.Passbook.GET_MONTHLY_PASSBOOK
 * Endpoint: GET Passbook/GetMonthlyPassbookV2
 */
export const getMonthlyPassbook = async (params?: Record<string, any>): Promise<MonthlyPassbook> => {
  const response = await apiClient.get('Passbook/GetMonthlyPassbookV2', { params });
  return response.data;
};

/**
 * Source: URLConstant.Passbook.GET_YEARLY_PASSBOOK
 * Endpoint: GET Passbook/GetYearlyPassbookV2
 */
export const getYearlyPassbook = async (params?: Record<string, any>): Promise<YearlyPassbook> => {
  const response = await apiClient.get('Passbook/GetYearlyPassbookV2', { params });
  return response.data;
};

/**
 * Source: URLConstant.Passbook.UPDATE_PASSBOOK
 * Endpoint: POST Passbook/AddPassbook
 */
export const updatePassbook = async (data?: Partial<UpdatePassbook>): Promise<UpdatePassbook> => {
  const response = await apiClient.post('Passbook/AddPassbook', data);
  return response.data;
};

/**
 * Source: URLConstant.Passbook.UPDATE_TASK_WITH_EARNED_AMOUNT
 * Endpoint: POST Passbook/UpdateTaskStatusWithEarnedAmount
 */
export const updateTaskWithEarnedAmount = async (data: UpdateTaskWithEarnedAmountRequest): Promise<UpdateTaskWithEarnedAmount> => {
  const response = await apiClient.post('Passbook/UpdateTaskStatusWithEarnedAmount', data);
  return response.data;
};

/**
 * Source: URLConstant.Passbook.GET_PASSBOOK_FOR_DASHBOARD
 * Endpoint: GET Passbook/GetPassbookDetailsForDashboard
 */
export const getPassbookForDashboard = async (params?: Record<string, any>): Promise<EarningDashboard> => {
  const response = await apiClient.get('Passbook/GetPassbookDetailsForDashboard', { params });
  return response.data;
};
