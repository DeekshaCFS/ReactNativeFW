// src/api/report/reportService.ts
// Auto-generated from URLConstant.java (Report endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see report.types.ts
import apiClient from '../apiClient';
import type { DownloadReport, SendReport } from './report.types';

/**
 * Source: URLConstant.Report.SEND_EMAIL_REPORT
 * Endpoint: GET Report/SendEmailToCustomerPDFReport
 */
export const sendEmailReport = async (params?: Record<string, any>): Promise<SendReport> => {
  const response = await apiClient.get('Report/SendEmailToCustomerPDFReport', { params });
  return response.data;
};

/**
 * Source: URLConstant.Report.DOWNLOAD_REPORT
 * Endpoint: GET Report/GenerateReportPDF
 */
export const downloadReport = async (params?: Record<string, any>): Promise<DownloadReport> => {
  const response = await apiClient.get('Report/GenerateReportPDF', { params });
  return response.data;
};

/**
 * Source: URLConstant.Report.DOWNLOAD_AMC_REPORT
 * Endpoint: GET Report/AMCReportPDF
 */
export const downloadAmcReport = async (params?: Record<string, any>): Promise<DownloadReport> => {
  const response = await apiClient.get('Report/AMCReportPDF', { params });
  return response.data;
};
