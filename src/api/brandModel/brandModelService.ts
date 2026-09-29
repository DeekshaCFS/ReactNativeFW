// src/api/brandModel/brandModelService.ts
// Mirrors Java's BrandManagement / ModelManagement / SerialNumber / task
// warranty-type endpoints (Api.java, URLConstant.java).
import apiClient from '../apiClient';

export type BrandItem = {
  BrandId?: number;
  BrandName?: string;
  Description?: string;
  ImagePath?: string;
  IsActive?: boolean;
  OwnerId?: number;
  UserID?: number;
};
export type ModelItem = {
  ModelId?: number;
  ModelName?: string;
  BrandId?: number;
  BrandName?: string;
  Description?: string;
  ImagePath?: string;
  IsActive?: boolean;
  OwnerId?: number;
  UserID?: number;
};
export type SerialNoItem = {
  SerialNoId?: number;
  SerialNo?: string;
  ModelId?: number;
  ModelName?: string;
  BrandId?: number;
  BrandName?: string;
  OwnerId?: number;
  UserID?: number;
};
export type WarrantyTypeItem = { WarrantyTypeId?: number; WarrantyTypeName?: string };

type ListResponse<T> = { ResultData?: T[] | null; Message?: string; Code?: string };
type ItemResponse<T> = { ResultData?: T | null; Message?: string; Code?: string };

export type BrandUpsertData = {
  BrandId?: number;
  BrandName: string;
  Description?: string;
  ImageFileName?: string;
  ImageFileBase64Str?: string;
  OwnerId: number;
  UserID: number;
  CreatedBy: number;
  UpdatedBy: number;
};

export type ModelUpsertData = {
  ModelId?: number;
  ModelName: string;
  BrandId: number;
  Description?: string;
  ImageFileName?: string;
  ImageFileBase64Str?: string;
  OwnerId: number;
  UserID: number;
  CreatedBy: number;
  UpdatedBy: number;
};

export type SerialNoUpsertData = {
  SerialNoId?: number;
  SerialNo: string;
  BrandId: number;
  ModelId: number;
  OwnerId: number;
  UserID: number;
  CreatedBy: number;
  UpdatedBy: number;
};

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

// ── Brand CRUD (URLConstant.BrandManagement) ──

/** Source: URLConstant.BrandManagement.GET_BRAND_LIST — GET Brand/GetBrand */
export const getBrandList = async (params: { ownerId: number; pageSize?: number }): Promise<ListResponse<BrandItem>> => {
  const response = await apiClient.get('Brand/GetBrand', { params });
  return response.data;
};

/** Source: URLConstant.BrandManagement.ADD_BRAND — POST Brand/AddBrand */
export const addBrand = async (data: BrandUpsertData): Promise<ItemResponse<BrandItem>> => {
  const response = await apiClient.post('Brand/AddBrand', data);
  return response.data;
};

/** Source: URLConstant.BrandManagement.UPDATE_BRAND — PUT Brand/UpdateBrand */
export const updateBrand = async (data: BrandUpsertData): Promise<ItemResponse<BrandItem>> => {
  const response = await apiClient.put('Brand/UpdateBrand', data);
  return response.data;
};

/** Source: URLConstant.BrandManagement.DELETE_BRAND — DELETE Brand/DeleteBrand */
export const deleteBrand = async (params: { BrandId: number; ownerId: number }): Promise<ItemResponse<BrandItem>> => {
  const response = await apiClient.delete('Brand/DeleteBrand', { params });
  return response.data;
};

// ── Model CRUD (URLConstant.ModelManagement) ──

/** Source: URLConstant.ModelManagement.GET_MODEL_LIST — GET Model/GetModel */
export const getModelList = async (params: {
  BrandId: number;
  ownerId: number;
  pageSize?: number;
}): Promise<ListResponse<ModelItem>> => {
  const response = await apiClient.get('Model/GetModel', { params });
  return response.data;
};

/** Source: URLConstant.ModelManagement.ADD_MODEL — POST Model/AddModel */
export const addModel = async (data: ModelUpsertData): Promise<ItemResponse<ModelItem>> => {
  const response = await apiClient.post('Model/AddModel', data);
  return response.data;
};

/** Source: URLConstant.ModelManagement.UPDATE_MODEL — PUT Model/UpdateModel */
export const updateModel = async (data: ModelUpsertData): Promise<ItemResponse<ModelItem>> => {
  const response = await apiClient.put('Model/UpdateModel', data);
  return response.data;
};

/** Source: URLConstant.ModelManagement.DELETE_MODEL — DELETE Model/DeleteModel (cascades serial numbers server-side) */
export const deleteModel = async (params: { ModelId: number; ownerId: number }): Promise<ItemResponse<ModelItem>> => {
  const response = await apiClient.delete('Model/DeleteModel', { params });
  return response.data;
};

// ── Serial Number CRUD (URLConstant.SerialNumber) ──

/** Source: URLConstant.SerialNumber.GET_SERIAL_NUMBER_LIST — GET SERIALNUMBER/GetSerialNo */
export const getSerialNoList = async (params: {
  BrandId: number;
  ModelId: number;
  ownerId: number;
}): Promise<ListResponse<SerialNoItem>> => {
  const response = await apiClient.get('SERIALNUMBER/GetSerialNo', { params });
  return response.data;
};

/** Source: URLConstant.SerialNumber.ADD_SERIAL_NUMBER — POST SERIALNUMBER/AddSerialNo */
export const addSerialNo = async (data: SerialNoUpsertData): Promise<ItemResponse<SerialNoItem>> => {
  const response = await apiClient.post('SERIALNUMBER/AddSerialNo', data);
  return response.data;
};

/** Source: URLConstant.SerialNumber.UPDATE_SERIAL_NUMBER — PUT SERIALNUMBER/UpdateSerialNo */
export const updateSerialNo = async (data: SerialNoUpsertData): Promise<ItemResponse<SerialNoItem>> => {
  const response = await apiClient.put('SERIALNUMBER/UpdateSerialNo', data);
  return response.data;
};

/** Source: URLConstant.SerialNumber.DELETE_SERIAL_NUMBER — DELETE SERIALNUMBER/DeleteSerialNo */
export const deleteSerialNo = async (params: { SerialNoId: number; ownerId: number }): Promise<ItemResponse<SerialNoItem>> => {
  const response = await apiClient.delete('SERIALNUMBER/DeleteSerialNo', { params });
  return response.data;
};
