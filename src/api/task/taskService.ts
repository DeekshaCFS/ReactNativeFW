// src/api/task/taskService.ts
// Auto-generated from URLConstant.java (Task endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see task.types.ts
import apiClient from '../apiClient';
import type { AddPhotoBeforeTask, AddPhotoBeforeTaskResultData, AddTaskRoutineService, AddTaskRoutineServiceResultData, CRMTaskList, CRMTaskListResultData, DeActiveTasksList, DeActiveTasksListResultData, GetAllTaskListDTO, GetAllTaskListDTOResultData, GetLiveLocation, GetLiveLocationResultData, LocationUpdateToServer, OnHoldTaskDetails, ReassignTask, ReassignTaskDTO, ReassignTaskResultData, TagList, TagListResultData, TaskClosure, TaskClosureResultData, TaskValidateDTO, TaskValidateDTOResultData, TasksList, TasksListResultData, UpdateReIssuedItems, UpdateReIssuedItemsResultData, UpdateTask, UpdateTaskResultData, UpdateTaskStatus, GetBeforeAfterOnHoldTaskImgDTO } from './task.types';

/**
 * Source: URLConstant.Task.GET_ALLT_TASK
 * Endpoint: GET Task/TaskListAdmin
 */
export const getAlltTask = async (params?: Record<string, any>): Promise<GetAllTaskListDTO> => {
  const response = await apiClient.get('Task/TaskListAdmin', { params });
  return response.data;
};

/**
 * Source: URLConstant.Task.ADD_TASK_ROUTINE_SERVICE
 * Endpoint: POST Task/TechSelfTaskCreation
 */
export const addTaskRoutineService = async (data?: Partial<AddTaskRoutineServiceResultData>): Promise<AddTaskRoutineService> => {
  const response = await apiClient.post('Task/TechSelfTaskCreation', data);
  return response.data;
};

/**
 * Source: URLConstant.Task.UPDATE_TASK_STATUS
 * Endpoint: POST Task/UpdateTaskStatus
 */
export const updateTaskStatus = async (data?: Partial<UpdateTaskStatus>): Promise<UpdateTaskStatus> => {
  const response = await apiClient.post('Task/UpdateTaskStatus', data);
  return response.data;
};

/**
 * Source: URLConstant.Task.DEACTIVATE_TASK
 * Endpoint: GET Task/DeActivatTaskByTaskID
 */
export const deactivateTask = async (params?: Record<string, any>): Promise<DeActiveTasksList> => {
  const response = await apiClient.get('Task/DeActivatTaskByTaskID', { params });
  return response.data;
};

/**
 * Source: URLConstant.Task.ACTIVATE_TASK
 * Endpoint: GET Task/ActivatTaskByTaskID
 */
export const activateTask = async (params?: Record<string, any>): Promise<DeActiveTasksList> => {
  const response = await apiClient.get('Task/ActivatTaskByTaskID', { params });
  return response.data;
};

/**
 * Source: URLConstant.Task.GET_DEACTIVATE_TASK
 * Endpoint: GET Task/DeActiveTaskList
 */
export const getDeactivateTask = async (params?: Record<string, any>): Promise<DeActiveTasksList> => {
  const response = await apiClient.get('Task/DeActiveTaskList', { params });
  return response.data;
};

/**
 * Source: URLConstant.Task.ADD_LIVE_LOCATION
 * Endpoint: POST Task/AddLiveLocation
 */
export const addLiveLocation = async (data?: Partial<LocationUpdateToServer>): Promise<LocationUpdateToServer> => {
  const response = await apiClient.post('Task/AddLiveLocation', data);
  return response.data;
};

/**
 * Source: URLConstant.Task.GET_LIVE_LOCATION
 * Endpoint: GET Task/GetLiveLocation
 */
export const getLiveLocation = async (params?: Record<string, any>): Promise<GetLiveLocation> => {
  const response = await apiClient.get('Task/GetLiveLocation', { params });
  return response.data;
};

/**
 * Source: URLConstant.Task.REASSIGN_TASK
 * Endpoint: POST Task/ReAssignTaskByTaskID
 */
export const reassignTask = async (data?: Partial<ReassignTaskResultData>): Promise<ReassignTask> => {
  const response = await apiClient.post('Task/ReAssignTaskByTaskID', data);
  return response.data;
};

/**
 * Source: URLConstant.Task.REASSIGN_TASK_NEW
 * Endpoint: POST Task/ReassignTask
 */
export const reassignTaskNew = async (data?: Partial<ReassignTaskDTO>): Promise<ReassignTaskDTO> => {
  const response = await apiClient.post('Task/ReassignTask', data);
  return response.data;
};

/**
 * Source: URLConstant.Task.GET_TASK_BY_ID
 * Endpoint: GET Task/TaskListByTaskId
 */
export const getTaskById = async (params?: Record<string, any>): Promise<TasksList> => {
  const response = await apiClient.get('Task/TaskListByTaskId', { params });
  return response.data;
};

/**
 * Source: URLConstant.Task.ADD_TASK_CLOSURE
 * Endpoint: POST Task/AddTaskClosureDetails
 */
export const addTaskClosure = async (data?: Partial<TaskClosureResultData>): Promise<TaskClosure> => {
  const response = await apiClient.post('Task/AddTaskClosureDetails', data);
  return response.data;
};

/**
 * Source: URLConstant.Task.UPDATE_TASK
 * Endpoint: POST Task/UpdateTaskDetailsByTaskID
 */
export const updateTask = async (data?: Partial<UpdateTaskResultData>): Promise<UpdateTask> => {
  const response = await apiClient.post('Task/UpdateTaskDetailsByTaskID', data);
  return response.data;
};

/**
 * Source: URLConstant.Task.GET_TODAY_TASK_LIST
 * Endpoint: GET Task/TodayTaskListNew
 */
export const getTodayTaskList = async (params?: Record<string, any>): Promise<TasksList> => {
  const response = await apiClient.get('Task/TodayTaskListNew', { params });
  return response.data;
};

/**
 * Source: URLConstant.Task.GET_TASK_LIST_VALIDATE
 * Endpoint: GET Task/ValidateTaskDetails
 */
export const getTaskListValidate = async (params?: Record<string, any>): Promise<TaskValidateDTO> => {
  const response = await apiClient.get('Task/ValidateTaskDetails', { params });
  return response.data;
};

/**
 * Source: URLConstant.Task.ADD_PHOTO_BEFORE_TASK
 * Endpoint: POST Task/AddPreDeviceInfoDetails
 */
export const addPhotoBeforeTask = async (data?: Partial<AddPhotoBeforeTaskResultData>): Promise<AddPhotoBeforeTask> => {
  const response = await apiClient.post('Task/AddPreDeviceInfoDetails', data);
  return response.data;
};

/**
 * Source: URLConstant.Task.GET_CRM_TASKLIST
 * Endpoint: GET Task/CRMGetTaskListSearchByParam
 */
export const getCrmTasklist = async (params?: Record<string, any>): Promise<CRMTaskList> => {
  const response = await apiClient.get('Task/CRMGetTaskListSearchByParam', { params });
  return response.data;
};

/**
 * Source: URLConstant.Task.POST_OnHoldTASKDetails
 * Endpoint: POST Task/OnHoldTaskDetails
 */
export const postOnHoldTASKDetails = async (data?: Partial<OnHoldTaskDetails>): Promise<OnHoldTaskDetails> => {
  const response = await apiClient.post('Task/OnHoldTaskDetails', data);
  return response.data;
};

/**
 * Source: URLConstant.Task.GET_TASK_TAG_LIST
 * Endpoint: GET Task/GetTaskTagList
 */
export const getTaskTagList = async (params?: Record<string, any>): Promise<TagList> => {
  const response = await apiClient.get('Task/GetTaskTagList', { params });
  return response.data;
};

/**
 * Source: URLConstant.Task.UPDATE_REISSUED_ITEMS
 * Endpoint: POST Task/UpdateReIssuedItems
 */
export const updateReissuedItems = async (data?: Partial<UpdateReIssuedItemsResultData>): Promise<UpdateReIssuedItems> => {
  const response = await apiClient.post('Task/UpdateReIssuedItems', data);
  return response.data;
};

/**
 * Source: URLConstant.Task.GET_TASK_IMAGES
 * Endpoint: GET Task/GetAllTaskListTaskIdWise
 */
export const getTaskImages = async (params?: Record<string, any>): Promise<TasksList> => {
  const response = await apiClient.get('Task/GetAllTaskListTaskIdWise', { params });
  return response.data;
};

/**
 * Source: URLConstant.Task.GET_BEFORE_AFTER_ONHOLD_TASK_IMG
 * Endpoint: GET TaskList/GetBeforeAfterAndHoldTaskFiles
 */
export const getBeforeAfterOnHoldTaskImages = async (params: {
  userId: number;
  taskId: any;
  onHoldImages?: boolean;
  beforeImages?: boolean;
  afterImages?: boolean;
}): Promise<GetBeforeAfterOnHoldTaskImgDTO> => {
  const response = await apiClient.get('TaskList/GetBeforeAfterAndHoldTaskFiles', { params });
  return response.data;
};