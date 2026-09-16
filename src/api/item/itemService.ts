// src/api/item/itemService.ts
// Auto-generated from URLConstant.java (Item endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see item.types.ts
import apiClient from '../apiClient';
import type { AddDeductUsedItem, AddItem, AllItemIssueList, AllItemIssueListResultData, DeleteItem, DeleteItemPortal, DeleteItemPortalResultData, EditItem, EditItemResultData, GetUsedItemList, GetUsedItemListResultData, IssueItem, IssueItemResultData, ItemIssueList, ItemIssueListResultData, ItemUnitType, ItemUnitTypeResultData, ItemsList, ItemsListResultData, ReturnItem, TechWiseItemList, TechWiseItemListResultData, UnAssignItem } from './item.types';

/**
 * Source: URLConstant.Item.GET_ALL_ITEM_ISSUE_LIST
 * Endpoint: GET Item/GetAllAssignedItemsListForAdmin
 */
export const getAllItemIssueList = async (params?: Record<string, any>): Promise<AllItemIssueList> => {
  const response = await apiClient.get('Item/GetAllAssignedItemsListForAdmin', { params });
  return response.data;
};

/**
 * Source: URLConstant.Item.GET_ITEM_ISSUE_LIST_BY_USERID
 * Endpoint: GET Item/GetAssignedItemsListByUserId
 */
export const getItemIssueListByUserid = async (params?: Record<string, any>): Promise<ItemIssueList> => {
  const response = await apiClient.get('Item/GetAssignedItemsListByUserId', { params });
  return response.data;
};

/**
 * Source: URLConstant.Item.GET_USED_ITEM_ISSUE_LIST_BY_USERID
 * Endpoint: GET Item/GetAssignedItemsListForFieldWorker
 */
export const getUsedItemIssueListByUserid = async (params?: Record<string, any>): Promise<ItemIssueList> => {
  const response = await apiClient.get('Item/GetAssignedItemsListForFieldWorker', { params });
  return response.data;
};

/**
 * Source: URLConstant.Item.ADD_ITEM
 * Endpoint: POST Item/AddItem
 */
export const addItem = async (data?: Partial<AddItem>): Promise<AddItem> => {
  const response = await apiClient.post('Item/AddItem', data);
  return response.data;
};

/**
 * Source: URLConstant.Item.GET_ALL_ITEM_ASSIGNED_UNASSIGNED
 * Endpoint: GET Item/AllItemListAssignAndUnAssignV2
 */
export const getAllItemAssignedUnassigned = async (params?: Record<string, any>): Promise<ItemsList> => {
  const response = await apiClient.get('Item/AllItemListAssignAndUnAssignV2', { params });
  return response.data;
};

/**
 * Source: URLConstant.Item.GET_ALL_LARGE_ITEM_LIST
 * Endpoint: GET Item/AllItemListAssignAndUnAssign
 */
export const getAllLargeItemList = async (params?: Record<string, any>): Promise<ItemsList> => {
  const response = await apiClient.get('Item/AllItemListAssignAndUnAssign', { params });
  return response.data;
};

/**
 * Source: URLConstant.Item.GET_LARGE_ITEM_ASSIGNED_UNASSIGNED
 * Endpoint: GET Item/AllItemList
 */
export const getLargeItemAssignedUnassigned = async (params?: Record<string, any>): Promise<ItemsList> => {
  const response = await apiClient.get('Item/AllItemList', { params });
  return response.data;
};

/**
 * Source: URLConstant.Item.ISSUE_ITEM
 * Endpoint: POST Item/AssignItem
 */
export const issueItem = async (data?: Partial<IssueItemResultData>): Promise<IssueItem> => {
  const response = await apiClient.post('Item/AssignItem', data);
  return response.data;
};

/**
 * Source: URLConstant.Item.ADD_USED_ITEM
 * Endpoint: POST Item/AddUsedItem
 */
export const addUsedItem = async (data?: Partial<AddDeductUsedItem>): Promise<AddDeductUsedItem> => {
  const response = await apiClient.post('Item/AddUsedItem', data);
  return response.data;
};

/**
 * Source: URLConstant.Item.DEDUCT_USED_ITEM
 * Endpoint: POST Item/DeductUsedItem
 */
export const deductUsedItem = async (data?: Partial<AddDeductUsedItem>): Promise<AddDeductUsedItem> => {
  const response = await apiClient.post('Item/DeductUsedItem', data);
  return response.data;
};

/**
 * Source: URLConstant.Item.RETURN_ITEM
 * Endpoint: POST Item/UnAssignItemPortal
 */
export const returnItem = async (data?: Partial<ReturnItem>): Promise<ReturnItem> => {
  const response = await apiClient.post('Item/UnAssignItemPortal', data);
  return response.data;
};

/**
 * Source: URLConstant.Item.UNASSIGNED_ITEM
 * Endpoint: POST Item/UnAssignItem
 */
export const unassignedItem = async (data?: Partial<UnAssignItem>): Promise<UnAssignItem> => {
  const response = await apiClient.post('Item/UnAssignItem', data);
  return response.data;
};

/**
 * Source: URLConstant.Item.EDIT_ITEM
 * Endpoint: POST Item/UpdateEditItemByItemId
 */
export const editItem = async (data?: Partial<EditItemResultData>): Promise<EditItem> => {
  const response = await apiClient.post('Item/UpdateEditItemByItemId', data);
  return response.data;
};

/**
 * Source: URLConstant.Item.DELETE_ITEM
 * Endpoint: GET Item/DeleteItem
 */
export const deleteItem = async (params?: Record<string, any>): Promise<DeleteItem> => {
  const response = await apiClient.get('Item/DeleteItem', { params });
  return response.data;
};

/**
 * Source: URLConstant.Item.GET_ITEM_UNIT_TYPE
 * Endpoint: GET Item/GetItemUnitTypes
 */
export const getItemUnitType = async (params?: Record<string, any>): Promise<ItemUnitType> => {
  const response = await apiClient.get('Item/GetItemUnitTypes', { params });
  return response.data;
};

/**
 * Source: URLConstant.Item.GET_ALL_ASSIGN_ITEMLIST_TECHWISE
 * Endpoint: GET Item/GetAllAssignedItemList
 */
export const getAllAssignItemlistTechwise = async (params?: Record<string, any>): Promise<TechWiseItemList> => {
  const response = await apiClient.get('Item/GetAllAssignedItemList', { params });
  return response.data;
};

/**
 * Source: URLConstant.Item.GET_DELETE_ITEM_PORTAL
 * Endpoint: GET Item/DeleteItemPortal
 */
export const getDeleteItemPortal = async (params?: Record<string, any>): Promise<DeleteItemPortal> => {
  const response = await apiClient.get('Item/DeleteItemPortal', { params });
  return response.data;
};

/**
 * Source: URLConstant.Item.GET_USED_ITEMLIST
 * Endpoint: GET Item/GetUsedItemList
 */
export const getUsedItemlist = async (params?: Record<string, any>): Promise<GetUsedItemList> => {
  const response = await apiClient.get('Item/GetUsedItemList', { params });
  return response.data;
};
