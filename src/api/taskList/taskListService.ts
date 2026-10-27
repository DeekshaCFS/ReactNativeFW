// src/api/taskList/taskListService.ts
// Auto-generated from URLConstant.java (TaskList endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see taskList.types.ts
import apiClient from '../apiClient';
import type { AddTask, AddTaskResultData, GetBeforeAfterOnHoldTaskImgDTO, GetBeforeAfterOnHoldTaskImgDTOResultData, GetPostedTaskDocDTO, GetPostedTaskDocDTOResultData, DocAttachmentType, QRGetScannedDTO, QRPostDataDTO, RejectedTaskDetailsDTO, RejectedTaskDetailsDTOResultData, TaskClosure, TaskClosureResultData, TasksList, TasksListResultData, UploadTaskDocDTO } from './taskList.types';

/**
 * Source: URLConstant.Task.ADD_TASK
 * Endpoint: POST TaskList/AddTaskDetails
 */
export const addTask = async (data?: Partial<AddTaskResultData>): Promise<AddTask> => {
  const response = await apiClient.post('TaskList/AddTaskDetails', data);
  return response.data;
};

/**
 * Source: URLConstant.Task.GET_TASK_CLOSURE_DETAILS
 * Endpoint: GET Tasklist/GetTaskClosureList
 */
export const getTaskClosureDetails = async (params?: Record<string, any>): Promise<TaskClosure> => {
  const response = await apiClient.get('Tasklist/GetTaskClosureList', { params });
  return response.data;
};

/**
 * Source: URLConstant.Task.GET_REJECTED_TASK_DETAILS
 * Endpoint: GET TaskList/GetTaskClosureList-1
 */
export const getRejectedTaskDetails = async (params?: Record<string, any>): Promise<RejectedTaskDetailsDTO> => {
  const response = await apiClient.get('TaskList/GetTaskClosureList-1', { params });
  return response.data;
};

/**
 * Source: URLConstant.Task.GET_TASK_LIST_SEARCH_NEW
 * Endpoint: GET TaskList/AllTasksListByUserId
 */
export const getTaskListSearchNew = async (params?: Record<string, any>): Promise<TasksList> => {
  const response = await apiClient.get('TaskList/AllTasksListByUserId', { params });
  return response.data;
};

/**
 * Source: URLConstant.Task.GET_DOC_ATTACHMENT_TYPE
 * Endpoint: GET TaskList/GetDocumentTypes
 * Response is a bare array, not the usual {Code, Message, ResultData} wrapper.
 */
export const getDocumentTypes = async (params?: Record<string, any>): Promise<DocAttachmentType[]> => {
  const response = await apiClient.get('TaskList/GetDocumentTypes', { params });
  return response.data;
};

/**
 * Source: URLConstant.Task.UPLOAD_TASK_DOC
 * Endpoint: POST TaskList/UploadPostTaskDocs
 */
export const uploadTaskDoc = async (data?: Partial<UploadTaskDocDTO>): Promise<UploadTaskDocDTO> => {
  const response = await apiClient.post('TaskList/UploadPostTaskDocs', data);
  return response.data;
};

/**
 * Source: URLConstant.Task.GET_TASK_DOC
 * Endpoint: GET TaskList/GetPostTaskDocs
 */
export const getTaskDoc = async (params?: Record<string, any>): Promise<GetPostedTaskDocDTO> => {
  const response = await apiClient.get('TaskList/GetPostTaskDocs', { params });
  return response.data;
};

/**
 * Source: URLConstant.Task.GET_BEFORE_AFTER_ONHOLD_TASK_IMG
 * Endpoint: GET TaskList/GetBeforeAfterAndHoldTaskFiles
 */
export const getBeforeAfterOnholdTaskImg = async (params?: Record<string, any>): Promise<GetBeforeAfterOnHoldTaskImgDTO> => {
  const response = await apiClient.get('TaskList/GetBeforeAfterAndHoldTaskFiles', { params });
  return response.data;
};

/**
 * Source: URLConstant.QRCodeScanner.GET_QR_SCANNED_DATA (TechQRCodeScannerHistroy.getQRScannedDetails)
 * Endpoint: GET TaskQRCodeScan/GetTaskQRCodeScan?taskId=
 * ResultData.Fields: [{ QRcodeScanNo: "Scan 1", FieldName, FieldValue }]
 */
export const getQRScannedData = async (params: { taskId: number }): Promise<QRGetScannedDTO> => {
  const response = await apiClient.get('TaskQRCodeScan/GetTaskQRCodeScan', { params });
  return response.data;
};

/**
 * Source: URLConstant.QRCodeScanner.POST_QR_SCANNED_DATA (TechQRCodeScannerHistroy.postQRScannedData)
 * Endpoint: POST TaskQRCodeScan/SaveTaskQRCodeScan
 * Note: Fields[].QRcodeScanNo is an int here, unlike the string form returned by the GET above.
 */
export const postQRScannedData = async (data: QRPostDataDTO): Promise<QRPostDataDTO> => {
  const response = await apiClient.post('TaskQRCodeScan/SaveTaskQRCodeScan', data);
  return response.data;
};
