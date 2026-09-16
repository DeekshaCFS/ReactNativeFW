// src/api/services/servicesService.ts
// Auto-generated from URLConstant.java (Services endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see services.types.ts
import apiClient from '../apiClient';
import type { AddUpdateServiceCategoryDTO, AddUpdateServiceCategoryDTOResultData, AddUpdateServiceSubCategoryDTO, AddUpdateServiceSubCategoryDTOResultData, DeleteServiceCategoryListDTO, DeleteServiceCategoryListDTOResultData, DeleteServiceSubCategoryListDTO, DeleteServiceSubCategoryListDTOResultData, EnquiryServiceTypeDTO, EnquiryServiceTypeDTOResultData, ServiceCategoryListDTO, ServiceCategoryListDTOResultData, ServiceListInsideSubCategoryDTO, ServiceListInsideSubCategoryDTOResultData, ServiceSubCategoryListDTO, ServiceSubCategoryListDTOResultData, ServiceTypeListDTO, ServiceTypeListDTOResultData } from './services.types';

/**
 * Source: URLConstant.Services.GET_ServiceTypeList
 * Endpoint: GET Services/GetServiceTypeList
 */
export const getServiceTypeList = async (params?: Record<string, any>): Promise<ServiceTypeListDTO> => {
  const response = await apiClient.get('Services/GetServiceTypeList', { params });
  return response.data;
};

/**
 * Source: URLConstant.Services.GET_DELETE_SERVICE
 * Endpoint: GET Services/DeleteServiceType
 */
export const getDeleteService = async (params?: Record<string, any>): Promise<DeleteServiceCategoryListDTO> => {
  const response = await apiClient.get('Services/DeleteServiceType', { params });
  return response.data;
};

/**
 * Source: URLConstant.Services.POST_ServiceTypeList
 * Endpoint: POST Services/AddServiceType
 */
export const postServiceTypeList = async (data?: Partial<ServiceTypeListDTOResultData>): Promise<ServiceTypeListDTO> => {
  const response = await apiClient.post('Services/AddServiceType', data);
  return response.data;
};

/**
 * Source: URLConstant.Services.UPDATE_ServiceTypeList
 * Endpoint: POST Services/UpdateServiceTypeDetails
 */
export const updateServiceTypeList = async (data?: Partial<ServiceTypeListDTOResultData>): Promise<ServiceTypeListDTO> => {
  const response = await apiClient.post('Services/UpdateServiceTypeDetails', data);
  return response.data;
};

/**
 * Source: URLConstant.Services.GET_EnquiryServiceTypeList
 * Endpoint: GET Services/GetEnqServiceTypeList
 */
export const getEnquiryServiceTypeList = async (params?: Record<string, any>): Promise<EnquiryServiceTypeDTO> => {
  const response = await apiClient.get('Services/GetEnqServiceTypeList', { params });
  return response.data;
};

/**
 * Source: URLConstant.Services.GET_ServiceCategoryList
 * Endpoint: GET Services/GetServiceCategoryListByUserId
 */
export const getServiceCategoryList = async (params?: Record<string, any>): Promise<ServiceCategoryListDTO> => {
  const response = await apiClient.get('Services/GetServiceCategoryListByUserId', { params });
  return response.data;
};

/**
 * Source: URLConstant.Services.GET_ServiceSubCategoryList
 * Endpoint: GET Services/GetSubCategoryAndServiceListByCategoryId
 */
export const getServiceSubCategoryList = async (params?: Record<string, any>): Promise<ServiceSubCategoryListDTO> => {
  const response = await apiClient.get('Services/GetSubCategoryAndServiceListByCategoryId', { params });
  return response.data;
};

/**
 * Source: URLConstant.Services.GET_Service_Inside_SubCategoryList
 * Endpoint: GET Services/GetServiceListBySubCategoryId
 */
export const getServiceInsideSubCategoryList = async (params?: Record<string, any>): Promise<ServiceListInsideSubCategoryDTO> => {
  const response = await apiClient.get('Services/GetServiceListBySubCategoryId', { params });
  return response.data;
};

/**
 * Source: URLConstant.Services.POST_ServiceCategoryList
 * Endpoint: POST Services/AddUpdateServiceCategory
 */
export const postServiceCategoryList = async (data?: Partial<AddUpdateServiceCategoryDTOResultData>): Promise<AddUpdateServiceCategoryDTO> => {
  const response = await apiClient.post('Services/AddUpdateServiceCategory', data);
  return response.data;
};

/**
 * Source: URLConstant.Services.POST_Service_Sub_CategoryList
 * Endpoint: POST Services/AddUpdateServiceSubCategory
 */
export const postServiceSubCategoryList = async (data?: Partial<AddUpdateServiceSubCategoryDTOResultData>): Promise<AddUpdateServiceSubCategoryDTO> => {
  const response = await apiClient.post('Services/AddUpdateServiceSubCategory', data);
  return response.data;
};

/**
 * Source: URLConstant.Services.DELETE_ServiceCategoryList
 * Endpoint: POST Services/DeleteServiceTypeCategoryList
 */
export const deleteServiceCategoryList = async (data?: Partial<DeleteServiceCategoryListDTOResultData>): Promise<DeleteServiceCategoryListDTO> => {
  const response = await apiClient.post('Services/DeleteServiceTypeCategoryList', data);
  return response.data;
};

/**
 * Source: URLConstant.Services.DELETE_ServiceSubCategoryList
 * Endpoint: POST Services/DeleteServiceSubCategoryList
 */
export const deleteServiceSubCategoryList = async (data?: Partial<DeleteServiceSubCategoryListDTOResultData>): Promise<DeleteServiceSubCategoryListDTO> => {
  const response = await apiClient.post('Services/DeleteServiceSubCategoryList', data);
  return response.data;
};
