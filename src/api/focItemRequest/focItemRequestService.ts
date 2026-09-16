// src/api/focItemRequest/focItemRequestService.ts
// Auto-generated from URLConstant.java (FOC_Item_Request endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see focItemRequest.types.ts
import apiClient from '../apiClient';
import type { AddFocDTO, AddFocDTOResultData, FOC_UpdateItemRequestDTO, FOC_UpdateItemRequestDTOResultData, GetDeleteFOCReqItem, GetFOCAttachmentListDTO, GetFOCAttachmentListDTOResultData, GetFOCList, GetFOCListResultData, GetFOCStatusTagList, GetFOCStatusTagListResultData } from './focItemRequest.types';

/**
 * Source: URLConstant.FOC.GET_FOC_LIST
 * Endpoint: GET FOC_Item_Request/GET_FOC_List
 */
export const getFocList = async (params?: Record<string, any>): Promise<GetFOCList> => {
  const response = await apiClient.get('FOC_Item_Request/GET_FOC_List', { params });
  return response.data;
};

/**
 * Source: URLConstant.FOC.GET_FOC_STATUS_TAG_LIST
 * Endpoint: GET FOC_Item_Request/Get_Foc_Status_Tag_List
 */
export const getFocStatusTagList = async (params?: Record<string, any>): Promise<GetFOCStatusTagList> => {
  const response = await apiClient.get('FOC_Item_Request/Get_Foc_Status_Tag_List', { params });
  return response.data;
};

/**
 * Source: URLConstant.FOC.GET_FOC_ATTACHMENT_LIST
 * Endpoint: GET FOC_Item_Request/Get_FOC_Att_types_List
 */
export const getFocAttachmentList = async (params?: Record<string, any>): Promise<GetFOCAttachmentListDTO> => {
  const response = await apiClient.get('FOC_Item_Request/Get_FOC_Att_types_List', { params });
  return response.data;
};

/**
 * Source: URLConstant.FOC.POST_FOC_DETAILS
 * Endpoint: POST FOC_Item_Request/Add_FOC_Request_Details
 */
export const postFocDetails = async (data?: Partial<AddFocDTOResultData> & Record<string, any>): Promise<AddFocDTO> => {
  const response = await apiClient.post('FOC_Item_Request/Add_FOC_Request_Details', data);
  return response.data;
};

/**
 * Source: URLConstant.FOC.POST_ITEM_DETAILS_STATUS
 * Endpoint: POST FOC_Item_Request/FOC_Request_Details_Update_Status
 */
export const postItemDetailsStatus = async (data?: Partial<FOC_UpdateItemRequestDTOResultData>): Promise<FOC_UpdateItemRequestDTO> => {
  const response = await apiClient.post('FOC_Item_Request/FOC_Request_Details_Update_Status', data);
  return response.data;
};

/**
 * Source: URLConstant.FOC.GET_DELETE_FOC_REQUEST_ITEM
 * Endpoint: GET FOC_Item_Request/DeleteFOC_Request_Items_Details
 */
export const getDeleteFocRequestItem = async (params?: Record<string, any>): Promise<GetDeleteFOCReqItem> => {
  const response = await apiClient.get('FOC_Item_Request/DeleteFOC_Request_Items_Details', { params });
  return response.data;
};

/**
 * Source: URLConstant.FOC.GET_DELETE_FOC_REQUEST_SUB_ITEM
 * Endpoint: GET FOC_Item_Request/Delete_FOC_Request_Sub_Items
 */
export const getDeleteFocRequestSubItem = async (params?: Record<string, any>): Promise<GetDeleteFOCReqItem> => {
  const response = await apiClient.get('FOC_Item_Request/Delete_FOC_Request_Sub_Items', { params });
  return response.data;
};