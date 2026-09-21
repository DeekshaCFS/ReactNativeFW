// src/api/brandModel/brandModelService.ts
// Mirrors Java's BrandManagement / ModelManagement / SerialNumber / task
// warranty-type endpoints (Api.java, URLConstant.java).
import apiClient from '../apiClient';

export type BrandItem = { BrandId?: number; BrandName?: string };
export type ModelItem = { ModelId?: number; ModelName?: string; BrandId?: number; BrandName?: string };
export type SerialNoItem = {
  SerialNoId?: number;
  SerialNo?: string;
  ModelId?: number;
  BrandId?: number;
};
export type WarrantyTypeItem = { WarrantyTypeId?: number; WarrantyTypeName?: string };

type ListResponse<T> = { ResultData?: T[] | null; Message?: string; Code?: string };

/** Source: URLConstant.BrandManagement.GET_BRAND_LIST_SEARCH — GET Brand/SearchBrand */
export const searchBrands = async (params: { ownerId: number; search: string }): Promise<ListResponse<BrandItem>> => {
  const response = await apiClient.get('Brand/SearchBrand', { params });
  return response.data;
};

/** Source: URLConstant.ModelManagement.GET_MODEL_LIST_SEARCH — GET Model/SearchModel */
export const searchModels = async (params: {
  ownerId: number;
  BrandId: number;
  search: string;
}): Promise<ListResponse<ModelItem>> => {
  const response = await apiClient.get('Model/SearchModel', { params });
  return response.data;
};

/** Source: URLConstant.SerialNumber.GET_SERIAL_NUMBER_SEARCH_LIST — GET SERIALNUMBER/SearchSerialNo */
export const searchSerialNumbers = async (params: {
  BrandId: number;
  ModelId: number;
  ownerId: number;
  search: string;
}): Promise<ListResponse<SerialNoItem>> => {
  const response = await apiClient.get('SERIALNUMBER/SearchSerialNo', { params });
  return response.data;
};

/** Source: URLConstant.TaskList.GET_TASK_WARRANTY_TYPE — GET TaskList/Task_WarrantyType */
export const getTaskWarrantyTypeList = async (params: {
  ownerid: number;
}): Promise<ListResponse<WarrantyTypeItem>> => {
  const response = await apiClient.get('TaskList/Task_WarrantyType', { params });
  return response.data;
};
