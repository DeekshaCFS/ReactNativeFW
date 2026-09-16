// src/api/companyDetails/companyDetailsService.ts
// Auto-generated from URLConstant.java (CompanyDetails endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see companyDetails.types.ts
import apiClient from '../apiClient';
import type { CompanyDetails, CompanyDetailsResultData } from './companyDetails.types';

/**
 * Source: URLConstant.CompanyDetails.CHANGE_COMPANY_DETAILS
 * Endpoint: POST CompanyDetails/UpdateComapnyDetails
 */
export const changeCompanyDetails = async (data?: Partial<CompanyDetailsResultData>): Promise<CompanyDetails> => {
  const response = await apiClient.post('CompanyDetails/UpdateComapnyDetails', data);
  return response.data;
};

/**
 * Source: URLConstant.CompanyDetails.GET_COMPANY_DETAILS
 * Endpoint: GET CompanyDetails/GetComapnyDetails
 */
export const getCompanyDetails = async (params?: Record<string, any>): Promise<CompanyDetails> => {
  const response = await apiClient.get('CompanyDetails/GetComapnyDetails', { params });
  return response.data;
};
