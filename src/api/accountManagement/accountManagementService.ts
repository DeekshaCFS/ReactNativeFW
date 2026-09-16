// src/api/accountManagement/accountManagementService.ts
// Auto-generated from URLConstant.java (AccountManagement endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see accountManagement.types.ts
import apiClient from '../apiClient';
import type { DeleteInvoiceDetailsDTO, DownloadInvoicePdfDTO, DownloadInvoicePdfDTOResultData, InvoiceDetailsDTO, InvoiceDetailsDTOResultData, InvoiceFollowUpNotesDTO, InvoiceListDTO, InvoiceListDTOResultData, InvoicePaymentStatusDTO, InvoicePaymentStatusDTOResultData, SaveInvoicePaymentAmountDetailsDTO } from './accountManagement.types';

/**
 * Source: URLConstant.Accounts.GET_INVOICE_PDF
 * Endpoint: GET AccountManagement/GetInvoicePdfById
 */
export const getInvoicePdf = async (params?: Record<string, any>): Promise<DownloadInvoicePdfDTO> => {
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
 */
export const saveInvoicePaymmentDetails = async (data?: Partial<SaveInvoicePaymentAmountDetailsDTO>): Promise<SaveInvoicePaymentAmountDetailsDTO> => {
  const response = await apiClient.post('AccountManagement/SaveInvoicePaymentAmountDetails', data);
  return response.data;
};

/**
 * Source: URLConstant.Accounts.INVOICE_FOLLOW_UP_NOTES
 * Endpoint: POST AccountManagement/InvoiceFollowUp
 */
export const invoiceFollowUpNotes = async (data?: Partial<InvoiceFollowUpNotesDTO>): Promise<InvoiceFollowUpNotesDTO> => {
  const response = await apiClient.post('AccountManagement/InvoiceFollowUp', data);
  return response.data;
};
