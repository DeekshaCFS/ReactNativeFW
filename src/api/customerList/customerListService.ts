// src/api/customerList/customerListService.ts
// Auto-generated from URLConstant.java (CustomerList endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see customerList.types.ts
import apiClient from '../apiClient';
import type { AddCustDTO, AddCustDTOResultData, CRMCustomerTagList, CRMCustomerTagListResultData, CityDTO, CityDTOResultData, CustomerList, CustomerListResultData, DeleteCustDTO, DeleteCustDTOResultData, StateDTO, StateDTOResultData, UpdateCustDTO, UpdateCustDTOResultData } from './customerList.types';

/**
 * Source: URLConstant.Customer.GET_CUSTOMER_LIST
 * Endpoint: GET CustomerList/GetAllCustomerListForMobile
 */
export const getCustomerList = async (params?: Record<string, any>): Promise<CustomerList> => {
  const response = await apiClient.get('CustomerList/GetAllCustomerListForMobile', { params });
  return response.data;
};

/**
 * Source: URLConstant.Customer.ADD_CUSTOMER
 * Endpoint: POST CustomerList/AddCustomerDetails
 */
export const addCustomer = async (data?: Partial<AddCustDTOResultData>): Promise<AddCustDTO> => {
  const response = await apiClient.post('CustomerList/AddCustomerDetails', data);
  return response.data;
};

/**
 * Source: URLConstant.Customer.UPDATE_CUSTOMER_DETAILS
 * Endpoint: POST CustomerList/UpdateCustomerDetails
 */
export const updateCustomerDetails = async (data?: Partial<UpdateCustDTOResultData>): Promise<UpdateCustDTO> => {
  const response = await apiClient.post('CustomerList/UpdateCustomerDetails', data);
  return response.data;
};

/**
 * Source: URLConstant.Customer.DELETE_CUSTOMER_DETAILS
 * Endpoint: GET CustomerList/DeleteCustomerDetails
 */
export const deleteCustomerDetails = async (params?: Record<string, any>): Promise<DeleteCustDTO> => {
  const response = await apiClient.get('CustomerList/DeleteCustomerDetails', { params });
  return response.data;
};

/**
 * Source: URLConstant.Customer.GET_CUSTOMER_TAG_LIST
 * Endpoint: GET CustomerList/GetCRMCustomerTagList
 */
export const getCustomerTagList = async (params?: Record<string, any>): Promise<CRMCustomerTagList> => {
  const response = await apiClient.get('CustomerList/GetCRMCustomerTagList', { params });
  return response.data;
};

/**
 * Source: URLConstant.Customer.GET_STATE_LIST
 * Endpoint: GET CustomerList/Getstates
 */
export const getStateList = async (params?: Record<string, any>): Promise<StateDTO> => {
  const response = await apiClient.get('CustomerList/Getstates', { params });
  return response.data;
};

/**
 * Source: URLConstant.Customer.GET_CITY_LIST
 * Endpoint: GET CustomerList/GetCities
 */
export const getCityList = async (params?: Record<string, any>): Promise<CityDTO> => {
  const response = await apiClient.get('CustomerList/GetCities', { params });
  return response.data;
};
