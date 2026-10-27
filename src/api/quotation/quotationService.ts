// src/api/quotation/quotationService.ts
// Auto-generated from URLConstant.java (Quotation endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see quotation.types.ts
import apiClient from '../apiClient';
import type { CRMQuotationDTO, CRMQuotationDTOResultData, DeleteQuotationDetailsDTO, DownloadQuotationPdfDTO, DownloadQuotationPdfDTOResultData, QuotationDetailsDTO, QuotationDetailsDTOResultData, QuotationListDTO, QuotationListDTOResultData, QuoteBindListDTO, QuoteBindListDTOResultData, SaveQuotationDTO, SaveQuotationsNonOwnerDTO, SelfInvoiceCreateDTO, TaxDetails, TaxDetailsResultData, UpdateQuotationStatusDTO, UpdateQuotationStatusRequest } from './quotation.types';

/**
 * Source: URLConstant.Accounts.GET_QuotationList
 * Endpoint: GET Quotation/getquotationssearchbyparam
 */
export const getQuotationList = async (params?: Record<string, any>): Promise<QuotationListDTO> => {
  const response = await apiClient.get('Quotation/getquotationssearchbyparam', { params });
  return response.data;
};

/**
 * Source: URLConstant.Accounts.POST_QuotationDetails
 * Endpoint: POST Quotation/savequotations
 */
export const postQuotationDetails = async (data?: Partial<SaveQuotationDTO>): Promise<SaveQuotationDTO> => {
  const response = await apiClient.post('Quotation/savequotations', data);
  return response.data;
};

/**
 * Source: URLConstant.Accounts.UPDATE_QuotationDetails
 * Endpoint: POST Quotation/updatequotations
 */
export const updateQuotationDetails = async (data?: Partial<SaveQuotationDTO>): Promise<SaveQuotationDTO> => {
  const response = await apiClient.post('Quotation/updatequotations', data);
  return response.data;
};

/**
 * Source: URLConstant.Accounts.GET_QUOTATIONDETAILS_BY_QUOTE_ID
 * Endpoint: GET Quotation/getquotationsbyid
 */
export const getQuotationdetailsByQuoteId = async (params?: Record<string, any>): Promise<QuotationDetailsDTO> => {
  const response = await apiClient.get('Quotation/getquotationsbyid', { params });
  return response.data;
};

/**
 * Source: URLConstant.Accounts.GET_TAX_LIST
 * Endpoint: GET Quotation/gettaxlistforportal
 */
export const getTaxList = async (params?: Record<string, any>): Promise<TaxDetails> => {
  const response = await apiClient.get('Quotation/gettaxlistforportal', { params });
  return response.data;
};

/**
 * Source: URLConstant.Accounts.GET_QUOTATION_PDF
 * Endpoint: GET Quotation/getquotationpdfbyid
 */
export const getQuotationPdf = async (params?: Record<string, any>): Promise<DownloadQuotationPdfDTO> => {
  const response = await apiClient.get('Quotation/getquotationpdfbyid', { params });
  return response.data;
};

/**
 * Source: URLConstant.Accounts.DELETE_QUOTATION_DETAILS
 * Endpoint: DELETE Quotation/DeleteQuotationForMobile
 */
export const deleteQuotationDetails = async (params?: Record<string, any>): Promise<DeleteQuotationDetailsDTO> => {
  const response = await apiClient.delete('Quotation/DeleteQuotationForMobile', { params });
  return response.data;
};

/**
 * Source: URLConstant.Accounts.UPDATE_QUOTATION_STATUS
 * Endpoint: POST Quotation/UpdateQuotationStatus
 * Java's Api.updateQuotationStatus() is @FormUrlEncoded with fields
 * QuotationId/UserId/StatusId/Notes — posting a JSON body against it is a
 * no-op on the backend, so we build a urlencoded body instead (same fix
 * pattern as src/api/lead/leadService.ts#updateLeadStatus).
 */
export const updateQuotationStatus = async (data: UpdateQuotationStatusRequest): Promise<UpdateQuotationStatusDTO> => {
  const body = new URLSearchParams();
  body.append('QuotationId', String(data.QuotationId));
  body.append('UserId', String(data.UserId));
  body.append('StatusId', String(data.StatusId));
  body.append('Notes', data.Notes ?? '');

  const response = await apiClient.post('Quotation/UpdateQuotationStatus', body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
};

/**
 * Source: URLConstant.Accounts.GET_QUOTE_BIND_LIST
 * Endpoint: GET Quotation/GetQuoteBindList
 */
export const getQuoteBindList = async (params?: Record<string, any>): Promise<QuoteBindListDTO> => {
  const response = await apiClient.get('Quotation/GetQuoteBindList', { params });
  return response.data;
};

/**
 * Source: URLConstant.Accounts.POST_QuotationDetailsNonOwner
 * Endpoint: POST Quotation/SaveQuotationsNonOwner
 */
export const postQuotationDetailsNonOwner = async (data?: Partial<SaveQuotationsNonOwnerDTO>): Promise<SaveQuotationsNonOwnerDTO> => {
  const response = await apiClient.post('Quotation/SaveQuotationsNonOwner', data);
  return response.data;
};

/**
 * Source: URLConstant.Accounts.SELF_InvoiceCreation
 * Endpoint: POST Quotation/SelfInvoiceCreate
 */
export const selfInvoiceCreation = async (data?: Partial<SelfInvoiceCreateDTO>): Promise<SelfInvoiceCreateDTO> => {
  const response = await apiClient.post('Quotation/SelfInvoiceCreate', data);
  return response.data;
};

/**
 * Source: URLConstant.Accounts.GET_CRM_QUOTATION_LIST
 * Endpoint: GET Quotation/GetQuotationListByCustomerId
 */
export const getCrmQuotationList = async (params?: Record<string, any>): Promise<CRMQuotationDTO> => {
  const response = await apiClient.get('Quotation/GetQuotationListByCustomerId', { params });
  return response.data;
};