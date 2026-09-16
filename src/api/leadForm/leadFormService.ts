// src/api/leadForm/leadFormService.ts
// Auto-generated from URLConstant.java (LeadForm endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see leadForm.types.ts
import apiClient from '../apiClient';
import type { AddCustomerLeadInternalDTO, AddCustomerLeadInternalDTOResultData, LeadDetailsDTO, LeadDetailsDTOResultData } from './leadForm.types';

/**
 * Source: URLConstant.Lead.POST_EXTERNAL_LEAD_FORM
 * Endpoint: POST LeadForm/AddCustomerLead
 */
export const postExternalLeadForm = async (data?: Partial<LeadDetailsDTOResultData>): Promise<LeadDetailsDTO> => {
  const response = await apiClient.post('LeadForm/AddCustomerLead', data);
  return response.data;
};

/**
 * Source: URLConstant.Lead.POST_EXTERNAL_LEAD_FORM_BY_TECH
 * Endpoint: POST LeadForm/AddInternalCustomerLeadByTechnician
 */
export const postExternalLeadFormByTech = async (data?: Partial<AddCustomerLeadInternalDTOResultData>): Promise<AddCustomerLeadInternalDTO> => {
  const response = await apiClient.post('LeadForm/AddInternalCustomerLeadByTechnician', data);
  return response.data;
};
