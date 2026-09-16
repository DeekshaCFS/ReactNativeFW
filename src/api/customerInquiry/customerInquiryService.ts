// src/api/customerInquiry/customerInquiryService.ts
// Auto-generated from URLConstant.java (CustomerInquiry endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see customerInquiry.types.ts
import apiClient from '../apiClient';
import type { AddEnquiry, AddEnquiryResultData, EnquiryList, EnquiryListResultData, ReferenceType, ReferenceTypeResultData, ServiceType, ServiceTypeResultData } from './customerInquiry.types';

/**
 * Source: URLConstant.CustomerEnquiry.GET_ENQUIRY_LIST
 * Endpoint: GET CustomerInquiry/GetAllEnquiryListForMobile
 */
export const getEnquiryList = async (params?: Record<string, any>): Promise<EnquiryList> => {
  const response = await apiClient.get('CustomerInquiry/GetAllEnquiryListForMobile', { params });
  return response.data;
};

/**
 * Source: URLConstant.CustomerEnquiry.ADD_ENQUIRY
 * Endpoint: POST CustomerInquiry/AddCustomerInquiry
 */
export const addEnquiry = async (data?: Partial<AddEnquiryResultData>): Promise<AddEnquiry> => {
  const response = await apiClient.post('CustomerInquiry/AddCustomerInquiry', data);
  return response.data;
};

/**
 * Source: URLConstant.CustomerEnquiry.UPDATE_ENQUIRY
 * Endpoint: POST CustomerInquiry/UpdateCustomerInquiry
 */
export const updateEnquiry = async (data?: Partial<AddEnquiryResultData>): Promise<AddEnquiry> => {
  const response = await apiClient.post('CustomerInquiry/UpdateCustomerInquiry', data);
  return response.data;
};

/**
 * Source: URLConstant.CustomerEnquiry.GET_SERVICE_TYPE
 * Endpoint: GET CustomerInquiry/ServiceTypeList
 */
export const getServiceType = async (params?: Record<string, any>): Promise<ServiceType> => {
  const response = await apiClient.get('CustomerInquiry/ServiceTypeList', { params });
  return response.data;
};

/**
 * Source: URLConstant.CustomerEnquiry.GET_REFERENCE_TYPE
 * Endpoint: GET CustomerInquiry/ReferenceTypeList
 */
export const getReferenceType = async (params?: Record<string, any>): Promise<ReferenceType> => {
  const response = await apiClient.get('CustomerInquiry/ReferenceTypeList', { params });
  return response.data;
};

/**
 * Source: URLConstant.CustomerEnquiry.GET_CRM_ENQUIRY_LIST
 * Endpoint: GET CustomerInquiry/GetEnquiryListByCustomerId
 */
export const getCrmEnquiryList = async (params?: Record<string, any>): Promise<EnquiryList> => {
  const response = await apiClient.get('CustomerInquiry/GetEnquiryListByCustomerId', { params });
  return response.data;
};
