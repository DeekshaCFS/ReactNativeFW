// src/api/accountManagement/accountManagementService.ts
// Auto-generated from URLConstant.java (AccountManagement endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see accountManagement.types.ts
import apiClient from '../apiClient';
import type { DeleteInvoiceDetailsDTO, DownloadInvoicePdfDTO, DownloadInvoicePdfDTOResultData, GetInvoicePdfParams, InvoiceDetailsDTO, InvoiceDetailsDTOResultData, InvoiceFollowUpNotesDTO, InvoiceFollowUpRequest, InvoiceListDTO, InvoiceListDTOResultData, InvoicePaymentStatusDTO, InvoicePaymentStatusDTOResultData, SaveInvoicePaymentAmountDetailsDTO, SaveInvoicePaymentRequest } from './accountManagement.types';

/**
 * Source: URLConstant.Accounts.GET_INVOICE_PDF
 * Endpoint: GET AccountManagement/GetInvoicePdfById
 * NOTE: the Java query params are UserId + lower-case "invoiceId" — passing
 * "InvoiceId" (capital I) here 404s/returns nothing from the backend.
 */
export const getInvoicePdf = async (params: GetInvoicePdfParams): Promise<DownloadInvoicePdfDTO> => {
  const response = await apiClient.get('AccountManagement/GetInvoicePdfById', { params });
  return response.data;
};

/**
 * Source: URLConstant.Accounts.GET_INVOICEDETAILS_BY_INVOICE_ID
 * Endpoint: GET AccountManagement/GetInvoiceViewDetailsByInvoiceId
 */
export const getInvoicedetailsByInvoiceId = async (params?: Record<string, any>): Promise<InvoiceDetailsDTO> => {
  const response = await apiClient.get('AccountManagement/GetInvoiceViewDetailsByInvoiceId', { params });
  return response.data;
};

/**
 * Source: URLConstant.Accounts.GET_INVOICE_LIST
 * Endpoint: GET AccountManagement/GetInvoiceListSearch
 */
export const getInvoiceList = async (params?: Record<string, any>): Promise<InvoiceListDTO> => {
  const response = await apiClient.get('AccountManagement/GetInvoiceListSearch', { params });
  return response.data;
};

/**
 * Source: URLConstant.Accounts.GET_CRM_INVOICE_LIST
 * Endpoint: GET AccountManagement/GetInvoiceListByCustomerId
 */
export const getCrmInvoiceList = async (params?: Record<string, any>): Promise<InvoiceListDTO> => {
  const response = await apiClient.get('AccountManagement/GetInvoiceListByCustomerId', { params });
  return response.data;
};

/**
 * Source: URLConstant.Accounts.DELETE_INVOICE_DETAILS
 * Endpoint: DELETE AccountManagement/DeleteInvoiceByInvoiceId
 */
export const deleteInvoiceDetails = async (params?: Record<string, any>): Promise<DeleteInvoiceDetailsDTO> => {
  const response = await apiClient.delete('AccountManagement/DeleteInvoiceByInvoiceId', { params });
  return response.data;
};

/**
 * Source: URLConstant.Accounts.GET_INVOICE_PAYMENT_STATUS
 * Endpoint: GET AccountManagement/GetPaymentStatusByInvoiceId
 */
export const getInvoicePaymentStatus = async (params?: Record<string, any>): Promise<InvoicePaymentStatusDTO> => {
  const response = await apiClient.get('AccountManagement/GetPaymentStatusByInvoiceId', { params });
  return response.data;
};

/**
 * Source: URLConstant.Accounts.SAVE_INVOICE_PAYMMENT_DETAILS
 * Endpoint: POST AccountManagement/SaveInvoicePaymentAmountDetails
 * Java's Api.updatePayment() is @FormUrlEncoded — posting JSON here was a
 * silent no-op on the backend (same fix pattern as leadService.ts).
 */
export const saveInvoicePaymmentDetails = async (data: SaveInvoicePaymentRequest): Promise<SaveInvoicePaymentAmountDetailsDTO> => {
  const body = new URLSearchParams();
  body.append('Id', String(data.Id));
  body.append('InvoiceId', String(data.InvoiceId));
  body.append('Amount', String(data.Amount));
  body.append('CreatedBy', String(data.CreatedBy));
  body.append('UserId', String(data.UserId));
  body.append('PaymentTransactionType', data.PaymentTransactionType);
  body.append('IsActive', String(data.IsActive));

  const response = await apiClient.post('AccountManagement/SaveInvoicePaymentAmountDetails', body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
};

/**
 * Source: URLConstant.Accounts.INVOICE_FOLLOW_UP_NOTES
 * Endpoint: POST AccountManagement/InvoiceFollowUp
 * Java's Api.followUpNotes() is @FormUrlEncoded with misspelled field names
 * ("StatuiId", "FolowUpDate") that must be sent exactly as-is.
 */
export const invoiceFollowUpNotes = async (data: InvoiceFollowUpRequest): Promise<InvoiceFollowUpNotesDTO> => {
  const body = new URLSearchParams();
  body.append('InvoiceId', String(data.InvoiceId));
  body.append('StatuiId', String(data.StatuiId));
  body.append('UserId', String(data.UserId));
  body.append('FolowUpDate', data.FolowUpDate);
  body.append('Notes', data.Notes);

  const response = await apiClient.post('AccountManagement/InvoiceFollowUp', body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
};