import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HARDCODED_USER_ID } from '../config/hardcodedUser';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type Primitive = string | number | boolean | null | undefined;
type QueryParams = Record<string, Primitive>;
type FormFields = Record<string, Primitive>;
type HeadersMap = Record<string, string>;

type RequestOptions = {
  method?: HttpMethod;
  query?: QueryParams;
  form?: FormFields;
  body?: unknown;
  headers?: HeadersMap;
  skipAuth?: boolean;
};

export type TouchlessLoginRequest = {
  userName: string;
  password: string;
  preferredLanguage?: string;
  deviceId?: string;
};

export type TouchlessSignUpRequest = {
  emailId?: string;
  contactNo?: string;
  countryDetailsId: number;
};

export type VerifyMobileOtpRequest = {
  mobileNo: string;
  userId: number;
};

export type VerifyEmailOtpRequest = {
  emailId: string;
  userId: number;
};

type AddAMCProductLocation = {
  Address: string;
  CreatedBy: number;
  Description: string;
  Id: number;
  IsActive: boolean;
  Longitude: string;
  Name: string;
  PinCode: string;
  UpdatedBy: number;
  latitude: string;
};

type AddAMCProductCustomerDetail = {
  CreatedBy: number;
  CustomerDetailsid: number;
  CustomerName: string;
  EmailId: string;
  IsActive: boolean;
  LocationId: number;
  MobileNumber: string;
  OwnerId: number;
  UpdatedBy: number;
  UserId: number;
};

type AddAMCProductDetail = {
  CreatedBy: number;
  CustomerDetail: AddAMCProductCustomerDetail;
  CustomerId: number;
  CustomerLocationId: number;
  Location: AddAMCProductLocation;
  ProductBrand: string;
  ProductDetailsId: number;
  ProductName: string;
  ProductSerialNo: string;
  UnderWarranty: boolean;
  UpdatedBy: number;
  UserId: number;
};

type AddAMCRequest = {
  AMCAmount: number;
  AMCName: string;
  AMCNotes?: string;
  AMCSetReminderId?: number;
  AMCsId?: number;
  ActivationDate: string;
  ActivationTime: string;
  ContractDate: string;
  CreatedBy: number;
  ExpiryDate?: string;
  ProductDetail: AddAMCProductDetail;
  ProductId: number;
  ReceivedAmount: number;
  ServiceOccuranceId: number;
  TotalServices: number;
  UpdatedBy: number;
  UserId: number;
};

export type MultipleItemAssignedRequest = {
  ItemId: number;
  ItemIssuedId?: number;
  ItemName?: string;
  ItemQuantity: number;
  TempTechSrNo?: number;
  UsedItemQty?: number;
};

export type AddTaskDetailsRequest = {
  AMCServiceDetailsId?: number;
  Address: string;
  AudioFilePath?: string;
  BrandName?: string;
  City: string;
  ContactNo?: string;
  CountryDetailsId?: number;
  CreatedBy: number;
  CustomerDetailsid?: number;
  CustomerName?: string;
  CustomerTagId?: number;
  Description?: string;
  EnquiryId?: number;
  FSRId?: number;
  Id?: number;
  IsActive?: boolean;
  IsModelError?: boolean;
  IsSuccessful?: boolean;
  ItemId?: number;
  ItemQuantity?: number;
  LeadId?: number;
  LocDescription?: string;
  LocIsActive?: boolean;
  LocName?: string;
  LocationId?: number;
  Longitude?: string;
  ModelNumber?: string;
  MultipleItemAssigned?: MultipleItemAssignedRequest[];
  Name?: string;
  NewAddedTaskId?: number;
  OnHoldTaskId?: number;
  PaymentMode?: string;
  PaymentModeId?: number;
  PinCode: string;
  QuotationId?: number;
  ServiceId?: number;
  State: string;
  TaskDate: string;
  TaskStatus?: number;
  TaskTagId?: number;
  TaskType?: number;
  Time?: string;
  UpdatedBy: number;
  UserId: number;
  WagesPerHour?: number;
  latitude?: string;
};

export type UserTaskConfiguration = {
  isStateEnable?: boolean | string | null;
  isCityEnable?: boolean | string | null;
  isPincodeEnable?: boolean | string | null;
  isTaskTagEnable?: boolean | string | null;
  IsStateEnable?: boolean | string | null;
  IsCityEnable?: boolean | string | null;
  IsPincodeEnable?: boolean | string | null;
  IsTaskTagEnable?: boolean | string | null;
};

export type UserDetailsData = {
  firstName?: string | null;
  lastName?: string | null;
  contactNo?: string | null;
  email?: string | null;
  photo?: string | null;
  isTeleCmiEnabled?: string | boolean | null;
  taskConfigurationOBJ?: UserTaskConfiguration | null;
  FirstName?: string | null;
  LastName?: string | null;
  ContactNo?: string | null;
  Email?: string | null;
  Photo?: string | null;
  IsTeleCmiEnabled?: string | boolean | null;
  TaskConfigurationOBJ?: UserTaskConfiguration | null;
};

export type UserDetailsResponse = {
  resultData?: UserDetailsData | null;
  ResultData?: UserDetailsData | null;
};

export type TaskListItem = {
  id?: number;
  Id?: number;
  newTaskId?: string | null;
  NewTaskId?: string | null;
  newTaskID?: string | null;
  NewTaskID?: string | null;
  name?: string | null;
  Name?: string | null;
  description?: string | null;
  Description?: string | null;
  taskStatus?: string | null;
  TaskStatus?: string | null;
  taskStatusId?: number;
  TaskStatusId?: number;
  taskType?: string | null;
  TaskType?: string | null;
  taskTypeId?: number;
  TaskTypeId?: number;
  taskDate?: string | null;
  TaskDate?: string | null;
  taskTime?: string | null;
  TaskTime?: string | null;
  assignedTo?: string | null;
  AssignedTo?: string | null;
  customerName?: string | null;
  CustomerName?: string | null;
  contactNo?: string | null;
  ContactNo?: string | null;
  fullAddress?: string | null;
  FullAddress?: string | null;
  locationName?: string | null;
  LocationName?: string | null;
  locationDesc?: string | null;
  LocationDesc?: string | null;
  task_TagName?: string | null;
  Task_TagName?: string | null;
  taskTagName?: string | null;
  TaskTagName?: string | null;
  serviceName?: string | null;
  ServiceName?: string | null;
  paymentMode?: string | null;
  PaymentMode?: string | null;
  taskState?: number;
  TaskState?: number;
  estimatedAmount?: number | string | null;
  EstimatedAmount?: number | string | null;
  earnedAmount?: number | string | null;
  EarnedAmount?: number | string | null;
  startDateTime?: string | null;
  StartDateTime?: string | null;
  endDateTime?: string | null;
  EndDateTime?: string | null;
  startDate?: string | null;
  StartDate?: string | null;
  endDate?: string | null;
  EndDate?: string | null;
  landMark?: string | null;
  LandMark?: string | null;
  landmark?: string | null;
  Landmark?: string | null;
  responseCode?: string | null;
  ResponseCode?: string | null;
  satisfactionCode?: string | null;
  SatisfactionCode?: string | null;
  itemDetails?: TaskItemDetail[] | null;
  ItemDetails?: TaskItemDetail[] | null;
  multipleItemAssigned?: TaskItemDetail[] | null;
  MultipleItemAssigned?: TaskItemDetail[] | null;
};

export type TaskItemDetail = {
  itemId?: number | null;
  ItemId?: number | null;
  itemName?: string | null;
  ItemName?: string | null;
  issuedQty?: number | string | null;
  IssuedQty?: number | string | null;
  itemQuantity?: number | string | null;
  ItemQuantity?: number | string | null;
  usedQty?: number | string | null;
  UsedQty?: number | string | null;
  usedItemQty?: number | string | null;
  UsedItemQty?: number | string | null;
};

export type TaskDetailsResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: TaskListItem | TaskListItem[] | null;
  ResultData?: TaskListItem | TaskListItem[] | null;
};

export type TaskListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  pageIndex?: number;
  PageIndex?: number;
  pageSize?: number;
  PageSize?: number;
  recordCount?: number;
  RecordCount?: number;
  resultData?: TaskListItem[] | null;
  ResultData?: TaskListItem[] | null;
};

export type TaskTag = {
  taskTagId?: number;
  TaskTagId?: number;
  taskTagName?: string | null;
  TaskTagName?: string | null;
};

export type TaskTagResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: TaskTag[] | null;
  ResultData?: TaskTag[] | null;
};

export type EmployeeLookupItem = {
  UserGroupCodeId?: number;
  UserGroupName?: string | null;
  ZoneServiceId?: number;
  ZoneName?: string | null;
  AttendenceTypeId?: number;
  AttendenceTypeName?: string | null;
  LoginUserGroupCodeId?: number;
};

export type EmployeeLookupResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: EmployeeLookupItem[] | null;
  ResultData?: EmployeeLookupItem[] | null;
};

export type EmployeeListItem = {
  ProfileImage?: string | null;
  EmployeeNumber?: number;
  FirstNameM?: string | null;
  ContactM?: string | null;
  EmailId?: string | null;
  IsActive?: boolean;
  UserGroupName?: string | null;
  DesignationName?: string | null;
  ZoneName?: string | null;
  BatteryPercentage?: number | null;
  GPSOnOrOff?: boolean | null;
  Latitude?: string | null;
  Longitude?: string | null;
  CheckIn?: string | null;
  CheckOut?: string | null;
  AttendenceTypeName?: string | null;
  AttendenceTypeId?: number;
  UserGroupCodeId?: number;
  AssignZoneId?: number;
  TotalCount?: number;
};

export type EmployeeListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  pageIndex?: number;
  PageIndex?: number;
  pageSize?: number;
  PageSize?: number;
  recordCount?: number;
  RecordCount?: number;
  resultData?: EmployeeListItem[] | null;
  ResultData?: EmployeeListItem[] | null;
};

export type FieldworkerBulkInsertItem = {
  AE_FW_Contact: string;
  AE_FW_Firstname: string;
  AE_FW_Lastname: string;
  FieldWorkerAccess?: number;
  ManagerAccessFieldWorker?: number;
  TempTechSrNo?: number;
};

export type AddBulkFieldworkerRequestItem = {
  Accessby?: number;
  Allocatedby?: number;
  CreatedBy: number;
  DesignationId?: number;
  EmpDocType?: number;
  EmpDocumentType?: number;
  EmployeeNumber?: number;
  FieldworkerBulkInsertArray: FieldworkerBulkInsertItem[];
  LocationId?: number;
  ManagerId?: number;
  RoleAutoId?: number;
  ServiceZoneMId?: number;
  ServicezoneId?: number;
  TempTechSrNo?: number;
  UserGroupCode?: number;
  UserId: number;
};

export type AddBulkFieldworkerResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: unknown;
  ResultData?: unknown;
};

export type LeaveListItem = {
  ProfileImageUrl?: string | null;
  LeaveID?: number;
  LeaveStatusId?: number;
  LeaveStatusName?: string | null;
  UserID?: number;
  UserName?: string | null;
  FirstName?: string | null;
  LastName?: string | null;
  UserDesignation?: string | null;
  Zone?: string | null;
  ZoneManager?: string | null;
  ContactNo?: string | null;
  EmailId?: string | null;
  LeaveStartDate?: string | null;
  LeaveEndDate?: string | null;
  LeaveCreatedDate?: string | null;
  LeaveTypeId?: number;
  LeaveType?: string | null;
  ReasonOfLeave?: string | null;
  CommentsByApprover?: string | null;
  IsApproved?: boolean;
  ActionedBy?: number | null;
  ApproverName?: string | null;
  ApproverDesignation?: string | null;
  NoOfDays?: number;
};

export type LeaveListResultData = {
  LeaveCounts?: {
    ApprovedLeaveCount?: number;
    RejectedLeaveCount?: number;
    PendingLeaveCount?: number;
  } | null;
  LeaveDetails?: LeaveListItem[] | null;
};

export type LeaveListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  pageIndex?: number;
  PageIndex?: number;
  pageSize?: number;
  PageSize?: number;
  recordCount?: number;
  RecordCount?: number;
  resultData?: LeaveListResultData | null;
  ResultData?: LeaveListResultData | null;
};

export type ItemGroupItem = {
  itemGroupId?: number;
  ItemGroupId?: number;
  id?: number;
  Id?: number;
  itemGroupName?: string | null;
  ItemGroupName?: string | null;
  name?: string | null;
  Name?: string | null;
};

export type ItemGroupListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: ItemGroupItem[] | null;
  ResultData?: ItemGroupItem[] | null;
};

export type ItemUnitTypeItem = {
  itemUnitTypeId?: number;
  ItemUnitTypeId?: number;
  unitId?: number;
  UnitId?: number;
  id?: number;
  Id?: number;
  itemUnitTypeName?: string | null;
  ItemUnitTypeName?: string | null;
  unitName?: string | null;
  UnitName?: string | null;
  name?: string | null;
  Name?: string | null;
};

export type ItemUnitTypeListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: ItemUnitTypeItem[] | null;
  ResultData?: ItemUnitTypeItem[] | null;
};

export type AddItemRequest = {
  HSNCode?: string;
  ImageFileBase64Str?: string;
  ImageFileName?: string;
  ItemGroupId?: number;
  ItemGroupName?: string;
  ItemUnitTypeId?: number;
  PurchasePrice?: string;
  SalesPrice?: string;
  SerialNumber?: string;
  CreatedBy: number;
  Description?: string;
  Id?: number;
  IsModelError?: boolean;
  IsSuccessful?: boolean;
  ItemType?: number;
  Name: string;
  Quantity?: number;
  UpdatedBy: number;
};

export type AssignItemRequest = {
  Id?: number;
  ItemId: number;
  UserId: number;
  Quantity: number;
  TransactionType?: number;
  OwnerId?: number;
  IsActive?: boolean;
  IsModelError?: boolean;
  IsSuccessful?: boolean;
  CreatedBy: number;
  UpdatedBy: number;
};

export type ItemInventoryListItem = {
  id?: number;
  Id?: number;
  ownerId?: number | null;
  OwnerId?: number | null;
  createdDate?: string | null;
  CreatedDate?: string | null;
  updatedBy?: string | null;
  UpdatedBy?: string | null;
  serialNumber?: string | null;
  SerialNumber?: string | null;
  hsnCode?: string | null;
  HSNCode?: string | null;
  itemGroupName?: string | null;
  ItemGroupName?: string | null;
  itemGroupId?: number | null;
  ItemGroupId?: number | null;
  purchasePrice?: number | string | null;
  PurchasePrice?: number | string | null;
  salesPrice?: number | string | null;
  SalesPrice?: number | string | null;
  unAssignedQuantity?: number | string | null;
  UnAssignedQuantity?: number | string | null;
  userId?: number;
  UserId?: number;
  itemId?: number;
  ItemId?: number;
  name?: string | null;
  Name?: string | null;
  itemName?: string | null;
  ItemName?: string | null;
  description?: string | null;
  Description?: string | null;
  note?: string | null;
  Note?: string | null;
  quantity?: number | string | null;
  Quantity?: number | string | null;
  availableQuantity?: number | string | null;
  AvailableQuantity?: number | string | null;
  availableQty?: number | string | null;
  AvailableQty?: number | string | null;
  assignedQuantity?: number | string | null;
  AssignedQuantity?: number | string | null;
  issuedQuantity?: number | string | null;
  IssuedQuantity?: number | string | null;
  issuedQty?: number | string | null;
  IssuedQty?: number | string | null;
  usedQuantity?: number | string | null;
  UsedQuantity?: number | string | null;
  usedQty?: number | string | null;
  UsedQty?: number | string | null;
  usedItemDetailsDtoObj?: {
    avlQty?: number | string | null;
    AvlQty?: number | string | null;
    assignedQty?: number | string | null;
    AssignedQty?: number | string | null;
    usedQty?: number | string | null;
    UsedQty?: number | string | null;
  } | null;
  UsedItemDetailsDtoObj?: {
    avlQty?: number | string | null;
    AvlQty?: number | string | null;
    assignedQty?: number | string | null;
    AssignedQty?: number | string | null;
    usedQty?: number | string | null;
    UsedQty?: number | string | null;
  } | null;
  unitName?: string | null;
  UnitName?: string | null;
  unit?: string | null;
  Unit?: string | null;
  itemUnit?: string | null;
  ItemUnit?: string | null;
  itemUnitName?: string | null;
  ItemUnitName?: string | null;
  itemUnitTypeName?: string | null;
  ItemUnitTypeName?: string | null;
  image?: string | null;
  Image?: string | null;
  imageUrl?: string | null;
  ImageUrl?: string | null;
  itemImage?: string | null;
  ItemImage?: string | null;
  itemImageUrl?: string | null;
  ItemImageUrl?: string | null;
  itemImagePath?: string | null;
  ItemImagePath?: string | null;
  totalCount?: number;
  TotalCount?: number;
};

export type ItemInventoryListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  pageIndex?: number;
  PageIndex?: number;
  pageSize?: number;
  PageSize?: number;
  recordCount?: number;
  RecordCount?: number;
  resultData?: ItemInventoryListItem[] | ItemInventoryListItem | null;
  ResultData?: ItemInventoryListItem[] | ItemInventoryListItem | null;
};

export type AssignedItemListItem = {
  id?: number;
  Id?: number;
  itemId?: number;
  ItemId?: number;
  userId?: number;
  UserId?: number;
  taskId?: number | string | null;
  TaskId?: number | string | null;
  newTaskID?: string | null;
  NewTaskID?: string | null;
  name?: string | null;
  Name?: string | null;
  firstName?: string | null;
  FirstName?: string | null;
  lastName?: string | null;
  LastName?: string | null;
  employeeName?: string | null;
  EmployeeName?: string | null;
  fieldWorkerName?: string | null;
  FieldWorkerName?: string | null;
  userName?: string | null;
  UserName?: string | null;
  quantity?: number | string | null;
  Quantity?: number | string | null;
  issuedQuantity?: number | string | null;
  IssuedQuantity?: number | string | null;
  assignedQuantity?: number | string | null;
  AssignedQuantity?: number | string | null;
  purchasePrice?: number | string | null;
  PurchasePrice?: number | string | null;
};

export type AssignedItemListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: AssignedItemListItem[] | AssignedItemListItem | null;
  ResultData?: AssignedItemListItem[] | AssignedItemListItem | null;
};

export type UsedItemListItem = {
  id?: number;
  Id?: number;
  itemId?: number;
  ItemId?: number;
  userId?: number;
  UserId?: number;
  taskId?: number | string | null;
  TaskId?: number | string | null;
  newTaskID?: string | null;
  NewTaskID?: string | null;
  itemName?: string | null;
  ItemName?: string | null;
  name?: string | null;
  Name?: string | null;
  firstName?: string | null;
  FirstName?: string | null;
  lastName?: string | null;
  LastName?: string | null;
  employeeName?: string | null;
  EmployeeName?: string | null;
  fieldWorkerName?: string | null;
  FieldWorkerName?: string | null;
  userName?: string | null;
  UserName?: string | null;
  usedQty?: number | string | null;
  UsedQty?: number | string | null;
  usedQuantity?: number | string | null;
  UsedQuantity?: number | string | null;
  quantity?: number | string | null;
  Quantity?: number | string | null;
  purchasePrice?: number | string | null;
  PurchasePrice?: number | string | null;
};

export type UsedItemListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: UsedItemListItem[] | UsedItemListItem | null;
  ResultData?: UsedItemListItem[] | UsedItemListItem | null;
};

export type FocRequestListItem = {
  id?: number;
  Id?: number;
  FocRequestId?: number;
  focRequestId?: number;
  FOCRequestId?: number;
  focRequestedID?: number;
  FOCRequestedID?: number;
  requestNo?: string | null;
  RequestNo?: string | null;
  focRequestNo?: string | null;
  FOCRequestNo?: string | null;
  focReqNo?: string | null;
  FOCReqNo?: string | null;
  issue?: string | boolean | number | null;
  Issue?: string | boolean | number | null;
  isIssue?: string | boolean | number | null;
  IsIssue?: string | boolean | number | null;
  isAnyIssue?: string | boolean | number | null;
  IsAnyIssue?: string | boolean | number | null;
  issueType?: string | null;
  IssueType?: string | null;
  FOCStatusName?: string | null;
  focStatusName?: string | null;
  FocStatusName?: string | null;
  statusName?: string | null;
  StatusName?: string | null;
  date?: string | null;
  Date?: string | null;
  createdDate?: string | null;
  CreatedDate?: string | null;
  requestDate?: string | null;
  RequestDate?: string | null;
  focDate?: string | null;
  FOCDate?: string | null;
  notes?: string | null;
  Notes?: string | null;
  note?: string | null;
  Note?: string | null;
  remarks?: string | null;
  Remarks?: string | null;
  description?: string | null;
  Description?: string | null;
  employeeName?: string | null;
  EmployeeName?: string | null;
  userName?: string | null;
  UserName?: string | null;
  taskId?: string | number | null;
  TaskId?: string | number | null;
  newTaskID?: string | null;
  NewTaskID?: string | null;
  taskType?: string | null;
  TaskType?: string | null;
  FOC_ItemList?: Array<{
    ItemRequestStatusTagName?: string | null;
    ItemDescription?: string | null;
    ProductDescription?: string | null;
    ItemRequestName?: string | null;
    DescribeIssue?: string | null;
    FieldWorkerDescribeIssue?: string | null;
  }> | null;
  totalCount?: number;
  TotalCount?: number;
};

export type FocRequestListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  pageIndex?: number;
  PageIndex?: number;
  pageNumber?: number;
  PageNumber?: number;
  pageSize?: number;
  PageSize?: number;
  recordCount?: number;
  RecordCount?: number;
  resultData?: FocRequestListItem[] | null;
  ResultData?: FocRequestListItem[] | null;
};

export type FocStatusTag = {
  focStatusId?: number;
  FocStatusId?: number;
  FOCStatusId?: number;
  focStatusName?: string | null;
  FocStatusName?: string | null;
  FOCStatusName?: string | null;
};

export type FocStatusTagResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: FocStatusTag[] | null;
  ResultData?: FocStatusTag[] | null;
};

export type LeadStatusItem = {
  leadStatusId?: number;
  LeadStatusId?: number;
  leadStatusID?: number;
  LeadStatusID?: number;
  id?: number;
  Id?: number;
  leadStatusName?: string | null;
  LeadStatusName?: string | null;
  statusName?: string | null;
  StatusName?: string | null;
  name?: string | null;
  Name?: string | null;
};

export type LeadStatusResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: LeadStatusItem[] | null;
  ResultData?: LeadStatusItem[] | null;
};

export type LeadServiceTypeItem = {
  serviceTypeId?: number;
  ServiceTypeId?: number;
  serviceTypeID?: number;
  ServiceTypeID?: number;
  id?: number;
  Id?: number;
  serviceTypeName?: string | null;
  ServiceTypeName?: string | null;
  serviceName?: string | null;
  ServiceName?: string | null;
  name?: string | null;
  Name?: string | null;
};

export type LeadServiceTypeResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: LeadServiceTypeItem[] | null;
  ResultData?: LeadServiceTypeItem[] | null;
};

export type AddCustomerLeadRequest = {
  Address: string;
  City: string;
  CreatedBy: number;
  CustomerDetailsid: number;
  CustomerName: string;
  Description?: string;
  ImageFileBase64Str?: string;
  ImageFileBase64Str1?: string;
  ImageFileBase64Str2?: string;
  ImageFileName?: string;
  ImageFileName1?: string;
  ImageFileName2?: string;
  IsActive: boolean;
  LeadId: number;
  LeadNo: number;
  LeadState: number;
  LeadStatus: number;
  LeadStatusId: number;
  LocDescription?: string;
  LocName?: string;
  LocationId: number;
  Longitude?: string;
  MobileNumber: string;
  OTP: number;
  OwnerId: number;
  PinCode: string;
  ReferenceId: number;
  ServiceName?: string;
  ServicesId: number;
  State: string;
  TaskId: number;
  UpdatedBy: number;
  UserId: number;
  latitude?: string;
};

export type LeadListItem = {
  leadId?: number;
  LeadId?: number;
  leadID?: number;
  LeadID?: number;
  id?: number;
  Id?: number;
  newLeadId?: string | null;
  NewLeadId?: string | null;
  newLeadID?: string | null;
  NewLeadID?: string | null;
  leadNo?: string | null;
  LeadNo?: string | null;
  name?: string | null;
  Name?: string | null;
  leadName?: string | null;
  LeadName?: string | null;
  customerName?: string | null;
  CustomerName?: string | null;
  description?: string | null;
  Description?: string | null;
  requirement?: string | null;
  Requirement?: string | null;
  serviceName?: string | null;
  ServiceName?: string | null;
  leadStatus?: string | null;
  LeadStatus?: string | null;
  leadStatusName?: string | null;
  LeadStatusName?: string | null;
  statusName?: string | null;
  StatusName?: string | null;
  leadStatusId?: number;
  LeadStatusId?: number;
  leadStatusID?: number;
  LeadStatusID?: number;
  createdDate?: string | null;
  CreatedDate?: string | null;
  leadDate?: string | null;
  LeadDate?: string | null;
  date?: string | null;
  Date?: string | null;
  createdOn?: string | null;
  CreatedOn?: string | null;
  createdTime?: string | null;
  CreatedTime?: string | null;
  leadTime?: string | null;
  LeadTime?: string | null;
  mobileNo?: string | null;
  MobileNo?: string | null;
  mobileNumber?: string | null;
  MobileNumber?: string | null;
  contactNo?: string | null;
  ContactNo?: string | null;
  phoneNo?: string | null;
  PhoneNo?: string | null;
  phoneNumber?: string | null;
  PhoneNumber?: string | null;
  totalCount?: number;
  TotalCount?: number;
};

export type LeadListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  pageIndex?: number;
  PageIndex?: number;
  pageSize?: number;
  PageSize?: number;
  recordCount?: number;
  RecordCount?: number;
  resultData?: LeadListItem[] | null;
  ResultData?: LeadListItem[] | null;
};

export type LeadDetailsResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: LeadListItem | null;
  ResultData?: LeadListItem | null;
};

export type PassbookSummaryData = {
  earningAmount?: number | string | null;
  EarningAmount?: number | string | null;
  earning?: number | string | null;
  Earning?: number | string | null;
  earned?: number | string | null;
  Earned?: number | string | null;
  estimated?: number | string | null;
  Estimated?: number | string | null;
  credit?: number | string | null;
  Credit?: number | string | null;
  expenses?: number | string | null;
  Expenses?: number | string | null;
  return?: number | string | null;
  Return?: number | string | null;
  deduction?: number | string | null;
  Deduction?: number | string | null;
  balance?: number | string | null;
  Balance?: number | string | null;
  opening?: number | string | null;
  Opening?: number | string | null;
};

export type MonthlyPassbookItem = PassbookSummaryData & {
  month?: string | null;
  Month?: string | null;
  year?: string | number | null;
  Year?: string | number | null;
};

export type MonthlyPassbookData = {
  monthlyALlDataList?: MonthlyPassbookItem[] | null;
  MonthlyALlDataList?: MonthlyPassbookItem[] | null;
  monthlyAllDataList?: MonthlyPassbookItem[] | null;
  MonthlyAllDataList?: MonthlyPassbookItem[] | null;
  totalCredit?: number | string | null;
  TotalCredit?: number | string | null;
  totalDeduction?: number | string | null;
  TotalDeduction?: number | string | null;
  totalOpening?: number | string | null;
  TotalOpening?: number | string | null;
  totalEarned?: number | string | null;
  TotalEarned?: number | string | null;
  totalEstimated?: number | string | null;
  TotalEstimated?: number | string | null;
  totalExpenses?: number | string | null;
  TotalExpenses?: number | string | null;
};

export type YearlyPassbookData = MonthlyPassbookData & {
  getYearlyData?: PassbookSummaryData[] | null;
  GetYearlyData?: PassbookSummaryData[] | null;
};

export type TodayPassbookResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: PassbookSummaryData | null;
  ResultData?: PassbookSummaryData | null;
};

export type MonthlyPassbookResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: MonthlyPassbookData | null;
  ResultData?: MonthlyPassbookData | null;
};

export type YearlyPassbookResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: YearlyPassbookData | null;
  ResultData?: YearlyPassbookData | null;
};

export type ExpenseTechnicianItem = {
  userId?: number;
  UserId?: number;
  firstName?: string | null;
  FirstName?: string | null;
  lastName?: string | null;
  LastName?: string | null;
  name?: string | null;
  Name?: string | null;
  userName?: string | null;
  UserName?: string | null;
  employeeName?: string | null;
  EmployeeName?: string | null;
  role?: string | null;
  Role?: string | null;
  userGroupName?: string | null;
  UserGroupName?: string | null;
  remainingBalance?: number | string | null;
  RemainingBalance?: number | string | null;
  balance?: number | string | null;
  Balance?: number | string | null;
  profileImage?: string | null;
  ProfileImage?: string | null;
  photo?: string | null;
  Photo?: string | null;
};

export type ExpenseTechnicianListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: ExpenseTechnicianItem[] | null;
  ResultData?: ExpenseTechnicianItem[] | null;
};

export type AMCTypeItem = {
  amcTypeId?: number;
  AMCTypeId?: number;
  amcTypeName?: string | null;
  AMCTypeName?: string | null;
};

export type AMCTypeResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: AMCTypeItem[] | null;
  ResultData?: AMCTypeItem[] | null;
};

export type AMCLookupItem = Record<string, unknown>;

export type AMCLookupResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: AMCLookupItem[] | null;
  ResultData?: AMCLookupItem[] | null;
};

export type CustomerLookupItem = Record<string, unknown>;

export type CustomerLookupResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: CustomerLookupItem[] | null;
  ResultData?: CustomerLookupItem[] | null;
};

export type StateItem = Record<string, unknown>;

export type StateListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: StateItem[] | null;
  ResultData?: StateItem[] | null;
};

export type CityItem = Record<string, unknown>;

export type CityListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: CityItem[] | null;
  ResultData?: CityItem[] | null;
};

export type UpdateCustomerDetailsRequest = {
  Address: string;
  BrandName?: string;
  BuildingNumber?: string;
  City: string;
  CountryDetailsId?: number;
  CreatedBy: number;
  CustomerDetailsid: number;
  CustomerGroupId?: number;
  CustomerName: string;
  CustomerTagId?: number;
  Description?: string;
  EmailId?: string;
  Instructions?: string;
  IsActive: boolean;
  LocationId?: number;
  MobileNumber: string;
  ModelNumber?: string;
  PinCode: string;
  SecondaryAddress?: string;
  SecondaryDescription?: string;
  SecondaryEmailId?: string;
  SecondaryInstructions?: string;
  SecondaryMobileNumber?: string;
  State: string;
  UpdatedBy: number;
};

export type CustomerTagItem = Record<string, unknown>;

export type CustomerTagListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: CustomerTagItem[] | null;
  ResultData?: CustomerTagItem[] | null;
};

export type EnquiryListItem = Record<string, unknown>;

export type EnquiryListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: EnquiryListItem[] | null;
  ResultData?: EnquiryListItem[] | null;
};

export type AdvanceServiceItem = Record<string, unknown> & {
  children?: AdvanceServiceItem[] | null;
  Children?: AdvanceServiceItem[] | null;
};

export type AdvanceServiceResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: AdvanceServiceItem[] | null;
  ResultData?: AdvanceServiceItem[] | null;
};

export type QuoteBindItem = Record<string, unknown>;

export type QuoteBindListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: QuoteBindItem[] | null;
  ResultData?: QuoteBindItem[] | null;
};

export type FSRBindItem = Record<string, unknown>;

export type FSRBindListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: FSRBindItem[] | null;
  ResultData?: FSRBindItem[] | null;
};

export type AddEnquiryRequest = {
  CustomerDetailsid?: number;
  CustomerName: string;
  MobileNumber: string;
  EnquiryDate: string;
  EnquiryTime: string;
  Address: string;
  State: string;
  City: string;
  PinCode: string;
  Landmark: string;
  ServiceTypeId?: number;
  ServiceTypeName?: string;
  TaskTagId?: number;
  TaskTagName?: string;
  TechnicalProblem?: string;
  SpecialInstruction?: string;
  ImageFileBase64Str?: string;
  ImageFileName?: string;
  ImageFileBase64Str1?: string;
  ImageFileName1?: string;
  ImageFileBase64Str2?: string;
  ImageFileName2?: string;
  UserId: number;
  CreatedBy: number;
  UpdatedBy: number;
  IsActive?: boolean;
};

export type UpdateCustomerInquiryRequest = {
  Address: string;
  CreatedBy: number;
  CustomerDetailsid?: number;
  CustomerName: string;
  EnquiryId: number;
  ImageFileBase64Str?: string;
  ImageFileBase64Str1?: string;
  ImageFileBase64Str2?: string;
  ImageFileName?: string;
  ImageFileName1?: string;
  ImageFileName2?: string;
  InquaryState?: number;
  IsActive?: boolean;
  LocDescription?: string;
  LocName?: string;
  LocationId?: number;
  Longitude?: string;
  MobileNumber: string;
  OwnerId: number;
  PinCode?: string;
  PreferableDate: string;
  PreferableTime: string;
  ReferenceId?: number;
  ServicesId?: number;
  TaskId?: number;
  TaskTagId?: number;
  TaskTagName?: string;
  TaskTypeId?: number;
  TechnicalNote?: string;
  TechnicalProblem?: string;
  UpdatedBy: number;
  UserId: number;
};

export type AMCListItem = {
  id?: number;
  Id?: number;
  amCsId?: number;
  AMCsId?: number;
  amcServiceDetailsId?: number;
  AMCServiceDetailsId?: number;
  customerName?: string | null;
  CustomerName?: string | null;
  name?: string | null;
  Name?: string | null;
  amcName?: string | null;
  AMCName?: string | null;
  serviceType?: string | null;
  ServiceType?: string | null;
  amcTypeName?: string | null;
  AMCTypeName?: string | null;
  fieldWorkerName?: string | null;
  FieldWorkerName?: string | null;
  technicianName?: string | null;
  TechnicianName?: string | null;
  userName?: string | null;
  UserName?: string | null;
  taskId?: number | string | null;
  TaskId?: number | string | null;
  newTaskID?: string | null;
  NewTaskID?: string | null;
  taskDate?: string | null;
  TaskDate?: string | null;
  taskTime?: string | null;
  TaskTime?: string | null;
  date?: string | null;
  Date?: string | null;
  amcDate?: string | null;
  AMCDate?: string | null;
  amcServiceDate?: string | null;
  AMCServiceDate?: string | null;
  serviceTime?: string | null;
  ServiceTime?: string | null;
  completedServiceCount?: number | string | null;
  CompletedServiceCount?: number | string | null;
  currentServiceCount?: number | string | null;
  CurrentServiceCount?: number | string | null;
  serviceCompletedCount?: number | string | null;
  ServiceCompletedCount?: number | string | null;
  noOfServiceCompleted?: number | string | null;
  NoOfServiceCompleted?: number | string | null;
  serviceCount?: number | string | null;
  ServiceCount?: number | string | null;
  totalServiceCount?: number | string | null;
  TotalServiceCount?: number | string | null;
  noOfServices?: number | string | null;
  NoOfServices?: number | string | null;
  totalServices?: number | string | null;
  TotalServices?: number | string | null;
  totalAMCService?: number | string | null;
  TotalAMCService?: number | string | null;
  totalCount?: number;
  TotalCount?: number;
};

export type AMCListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: AMCListItem[] | null;
  ResultData?: AMCListItem[] | null;
};

export type QuotationCustomerLocation = {
  address?: string | null;
  Address?: string | null;
  buildingFlatNumber?: string | null;
  BuildingFlatNumber?: string | null;
  landmark?: string | null;
  Landmark?: string | null;
};

export type QuotationCustomer = {
  customerName?: string | null;
  CustomerName?: string | null;
  mobileNumber?: string | null;
  MobileNumber?: string | null;
  locationList?: QuotationCustomerLocation | null;
  LocationList?: QuotationCustomerLocation | null;
};

export type QuotationStatus = {
  id?: number;
  Id?: number;
  statusName?: string | null;
  StatusName?: string | null;
};

export type QuotationServiceItem = {
  serviceTypeId?: number | null;
  ServiceTypeId?: number | null;
  serviceTypeName?: string | null;
  ServiceTypeName?: string | null;
  quantity?: number | string | null;
  Quantity?: number | string | null;
  price?: number | string | null;
  Price?: number | string | null;
};

export type QuotationItemLine = {
  itemId?: number | null;
  ItemId?: number | null;
  itemName?: string | null;
  ItemName?: string | null;
  quantity?: number | string | null;
  Quantity?: number | string | null;
  price?: number | string | null;
  Price?: number | string | null;
};

export type QuotationListItem = {
  id?: number;
  Id?: number;
  quoteCode?: string | null;
  QuoteCode?: string | null;
  quoteName?: string | null;
  QuoteName?: string | null;
  quoteTime?: string | null;
  QuoteTime?: string | null;
  validityDate?: string | null;
  ValidityDate?: string | null;
  extraItem?: string | null;
  ExtraItem?: string | null;
  extraAmount?: number | string | null;
  ExtraAmount?: number | string | null;
  termCondition?: string | null;
  TermCondition?: string | null;
  totalAmount?: number | string | null;
  TotalAmount?: number | string | null;
  grandTotalAmount?: number | string | null;
  GrandTotalAmount?: number | string | null;
  customerId?: number | null;
  CustomerId?: number | null;
  statusId?: number | null;
  StatusId?: number | null;
  customer?: QuotationCustomer | null;
  Customer?: QuotationCustomer | null;
  status?: QuotationStatus | null;
  Status?: QuotationStatus | null;
  quoteServiceList?: QuotationServiceItem[] | null;
  QuoteServiceList?: QuotationServiceItem[] | null;
  quoteItemList?: QuotationItemLine[] | null;
  QuoteItemList?: QuotationItemLine[] | null;
  createdDate?: string | null;
  CreatedDate?: string | null;
};

export type QuotationListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  pageIndex?: number;
  PageIndex?: number;
  pageSize?: number;
  PageSize?: number;
  recordCount?: number;
  RecordCount?: number;
  resultData?: QuotationListItem[] | null;
  ResultData?: QuotationListItem[] | null;
};

export type InvoiceListItem = {
  id?: number;
  Id?: number;
  invoiceCode?: string | null;
  InvoiceCode?: string | null;
  invoiceDate?: string | null;
  InvoiceDate?: string | null;
  quotationId?: number | null;
  QuotationId?: number | null;
  quoteTaskId?: number | null;
  QuoteTaskId?: number | null;
  customerId?: number | null;
  CustomerId?: number | null;
  invoiceAmount?: number | string | null;
  InvoiceAmount?: number | string | null;
  quoteTaskName?: string | null;
  QuoteTaskName?: string | null;
  customerName?: string | null;
  CustomerName?: string | null;
  statusName?: string | null;
  StatusName?: string | null;
  statusId?: number | null;
  StatusId?: number | null;
  remainingAmount?: number | string | null;
  RemainingAmount?: number | string | null;
  totalRecord?: number | null;
  TotalRecord?: number | null;
};

export type InvoiceListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  pageIndex?: number;
  PageIndex?: number;
  pageSize?: number;
  PageSize?: number;
  recordCount?: number;
  RecordCount?: number;
  resultData?: InvoiceListItem[] | null;
  ResultData?: InvoiceListItem[] | null;
};

export type SaveQuotationServiceRequest = {
  ServiceTypeId?: number;
  ServiceTypeName?: string;
  Quantity?: number;
  Price?: number;
};

export type SaveQuotationItemRequest = {
  ItemId?: number;
  ItemName?: string;
  Quantity?: number;
  Price?: number;
};

export type SaveQuotationNonOwnerRequest = {
  UserId: number;
  QuoteName: string;
  QuoteTime?: string;
  ValidityDate?: string;
  CustomerName: string;
  Address: string;
  BuildingFlatNumber?: string;
  Landmark: string;
  PhoneNumber: string;
  ExtraItem?: string;
  ExtraAmount?: number;
  TermCondition?: string;
  TotalAmount?: number;
  GrandTotalAmount?: number;
  QuoteServiceList?: SaveQuotationServiceRequest[];
  QuoteItemList?: SaveQuotationItemRequest[];
  CreatedBy?: number;
};

export type QuotationTaxItem = {
  id?: number;
  Id?: number;
  discount?: number | string | null;
  Discount?: number | string | null;
  discountAmounnt?: number | string | null;
  DiscountAmounnt?: number | string | null;
  tax?: number | string | null;
  Tax?: number | string | null;
  taxAmount?: number | string | null;
  TaxAmount?: number | string | null;
  taxName?: string | null;
  TaxName?: string | null;
};

export type QuotationDetailItemLine = {
  id?: number;
  Id?: number;
  itemId?: number | null;
  ItemId?: number | null;
  itemName?: string | null;
  ItemName?: string | null;
  quantity?: number | string | null;
  Quantity?: number | string | null;
  unitPrice?: number | string | null;
  UnitPrice?: number | string | null;
  totalPrice?: number | string | null;
  TotalPrice?: number | string | null;
  hsnCode?: string | null;
  HSNCode?: string | null;
};

export type QuotationDetailServiceLine = {
  id?: number;
  Id?: number;
  serviceId?: number | null;
  ServiceId?: number | null;
  serviceName?: string | null;
  ServiceName?: string | null;
  quantity?: number | string | null;
  Quantity?: number | string | null;
  price?: number | string | null;
  Price?: number | string | null;
  totalPrice?: number | string | null;
  TotalPrice?: number | string | null;
};

export type QuotationDetails = {
  id?: number;
  Id?: number;
  quoteCode?: string | null;
  QuoteCode?: string | null;
  quoteName?: string | null;
  QuoteName?: string | null;
  quoteTime?: string | null;
  QuoteTime?: string | null;
  validityDate?: string | null;
  ValidityDate?: string | null;
  extraItem?: string | null;
  ExtraItem?: string | null;
  extraAmount?: number | string | null;
  ExtraAmount?: number | string | null;
  termCondition?: string | null;
  TermCondition?: string | null;
  totalAmount?: number | string | null;
  TotalAmount?: number | string | null;
  grandTotalAmount?: number | string | null;
  GrandTotalAmount?: number | string | null;
  customerId?: number | null;
  CustomerId?: number | null;
  statusId?: number | null;
  StatusId?: number | null;
  createdDate?: string | null;
  CreatedDate?: string | null;
  customer?: QuotationCustomer | null;
  Customer?: QuotationCustomer | null;
  status?: QuotationStatus | null;
  Status?: QuotationStatus | null;
  quoteItemList?: QuotationDetailItemLine[] | null;
  QuoteItemList?: QuotationDetailItemLine[] | null;
  quoteServiceList?: QuotationDetailServiceLine[] | null;
  QuoteServiceList?: QuotationDetailServiceLine[] | null;
  quoteTaxList?: QuotationTaxItem[] | null;
  QuoteTaxList?: QuotationTaxItem[] | null;
};

export type QuotationDetailsResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: QuotationDetails | null;
  ResultData?: QuotationDetails | null;
};

export type QuotationPdfData = {
  quotationId?: number | null;
  QuotationId?: number | null;
  quotationPdfPath?: string | null;
  QuotationPdfPath?: string | null;
};

export type QuotationPdfResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: QuotationPdfData | null;
  ResultData?: QuotationPdfData | null;
};

export type InvoiceDetailItemLine = {
  itemId?: number | null;
  ItemId?: number | null;
  itemName?: string | null;
  ItemName?: string | null;
  hsnCode?: string | null;
  HSNCode?: string | null;
  quantity?: number | string | null;
  Quantity?: number | string | null;
  unitPrice?: number | string | null;
  UnitPrice?: number | string | null;
  totalPrice?: number | string | null;
  TotalPrice?: number | string | null;
};

export type InvoiceDetailServiceLine = {
  serviceId?: number | null;
  ServiceId?: number | null;
  serviceName?: string | null;
  ServiceName?: string | null;
  quantity?: number | string | null;
  Quantity?: number | string | null;
  price?: number | string | null;
  Price?: number | string | null;
  totalPrice?: number | string | null;
  TotalPrice?: number | string | null;
};

export type InvoicePaymentItem = {
  id?: number;
  Id?: number;
  amount?: number | string | null;
  Amount?: number | string | null;
  paymentTransactionType?: string | null;
  PaymentTransactionType?: string | null;
  paymentDate?: string | null;
  PaymentDate?: string | null;
};

export type InvoiceDetails = {
  customerName?: string | null;
  CustomerName?: string | null;
  mobileNumber?: string | null;
  MobileNumber?: string | null;
  custAddress?: string | null;
  CustAddress?: string | null;
  landmark?: string | null;
  Landmark?: string | null;
  buildingNumber?: string | null;
  BuildingNumber?: string | null;
  invoiceCode?: string | null;
  InvoiceCode?: string | null;
  invoiceAmount?: number | string | null;
  InvoiceAmount?: number | string | null;
  extraAmount?: number | string | null;
  ExtraAmount?: number | string | null;
  invoiceDateTime?: string | null;
  InvoiceDateTime?: string | null;
  subTotalAmount?: number | string | null;
  SubTotalAmount?: number | string | null;
  discount?: number | string | null;
  Discount?: number | string | null;
  discountAmounnt?: number | string | null;
  DiscountAmounnt?: number | string | null;
  tax?: number | string | null;
  Tax?: number | string | null;
  taxAmount?: number | string | null;
  TaxAmount?: number | string | null;
  grandTotalAmount?: number | string | null;
  GrandTotalAmount?: number | string | null;
  receivedAmount?: number | string | null;
  ReceivedAmount?: number | string | null;
  remainingAmount?: number | string | null;
  RemainingAmount?: number | string | null;
  termCondition?: string | null;
  TermCondition?: string | null;
  quotationId?: number | null;
  QuotationId?: number | null;
  quotationCode?: string | null;
  QuotationCode?: string | null;
  quoteTaskName?: string | null;
  QuoteTaskName?: string | null;
  itemList?: InvoiceDetailItemLine[] | null;
  ItemList?: InvoiceDetailItemLine[] | null;
  serviceList?: InvoiceDetailServiceLine[] | null;
  ServiceList?: InvoiceDetailServiceLine[] | null;
  paymentList?: InvoicePaymentItem[] | null;
  PaymentList?: InvoicePaymentItem[] | null;
};

export type InvoiceDetailsResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: InvoiceDetails | null;
  ResultData?: InvoiceDetails | null;
};

export type TouchlessApiConfig = {
  baseUrl: string;
  endpoints?: Partial<TouchlessEndpoints>;
};

type TouchlessEndpoints = {
  login: string;
  signUpOtp: string;
  verifyMobileOtp: string;
  verifyEmailOtp: string;
  userDetails: string;
  dashboardData: string;
  dashboardEarning: string;
  dashboardAmc: string;
  amcReportDetails: string;
  todayPassbook: string;
  monthlyPassbook: string;
  yearlyPassbook: string;
  expenseTechnicianList: string;
  addCredit: string;
  addDeduction: string;
  addAMC: string;
  putAMC: string;
  amcDetailsForEdit: string;
  amcTypes: string;
  amcServiceOccurrenceTypes: string;
  amcReminderModes: string;
  customerList: string;
  updateCustomerDetails: string;
  customerTagList: string;
  stateList: string;
  cityList: string;
  dashboardAmcWeb: string;
  taskList: string;
  taskDetails: string;
  addTaskDetails: string;
  taskTags: string;
  employeeLookup: string;
  employeeList: string;
  leaveList: string;
  itemInventoryList: string;
  itemListV2: string;
  itemList: string;
  assignedItemList: string;
  usedItemList: string;
  itemGroupList: string;
  itemUnitTypeList: string;
  addItem: string;
  assignItem: string;
  focRequestList: string;
  focStatusTags: string;
  leadStatusList: string;
  leadList: string;
  leadServiceTypeList: string;
  leadDetails: string;
  updateLeadStatus: string;
  addCustomerLead: string;
  enquiryList: string;
  addEnquiry: string;
  updateEnquiry: string;
  advanceServiceList: string;
  quoteBindList: string;
  fsrBindList: string;
  quotationList: string;
  invoiceListSearch: string;
  saveQuotationNonOwner: string;
  quotationDetails: string;
  invoiceDetails: string;
  quotationPdf: string;
  deleteQuotation: string;
  deleteInvoice: string;
  addBulkFieldworkers: string;
};

export const DEFAULT_ENDPOINTS: TouchlessEndpoints = {
  // Was '/Login/DoTouchlessLogin' — that route doesn't exist on the backend.
  // The Java app's doTouchlessLogin() retrofit call actually posts to
  // URLConstant.Login.URL_LOGIN (see Api.java + old-rn-app/api/auth/loginService.ts).
  login: '/Login/UserLoginMobile',
  // Was '/SignUp/GetOTPRegister' — real path is URLConstant.SignUp.GET_OTP_REGISTER.
  signUpOtp: '/SignUp/TouchlessTempRegistration',
  // Was '/Users/AuthenticateMobile' / '/Users/AuthenticateEmail' — those routes
  // don't exist either. The Java retrofit methods are literally named
  // getMobileOTPVerified/getMobileOTPVerified-equivalent and point at these:
  verifyMobileOtp: '/Users/IsMobileNoExistForUpdateProfile',
  verifyEmailOtp: '/Users/IsTechEmailIdExistForUpdateProfile',
  userDetails: '/Users/GetUsersByUserId',
  dashboardData: '/Dashboard/GetDashboardData',
  dashboardEarning: '/Passbook/GetPassbookDetailsForDashboard',
  dashboardAmc: '/AMCs/AMCDashboardDetailsV2WithFilter',
  amcReportDetails: '/AMCs/AMCReportDetails',
  todayPassbook: '/Passbook/GetTodaysPassbookByUserId',
  monthlyPassbook: '/Passbook/GetMonthlyPassbookV2',
  yearlyPassbook: '/Passbook/GetYearlyPassbookV2',
  expenseTechnicianList: '/Expenditure/GetTechnicianList',

  taskList: '/TaskList/AllTasksListByUserId',
  taskDetails: '/Task/TaskListByTaskId',
  addTaskDetails: '/TaskList/AddTaskDetails',
  taskTags: '/Task/GetTaskTagList',
  employeeLookup: '/UM_Designations/GetDesignationAndZoneList',
  employeeList: '/UM_EmployeeList/AllEmployeeListByUserIdAndSearchParam',
  leaveList: '/Leave/AllLeavesListByUserId',
  itemInventoryList: '/Item/AllItemListAssignAndUnAssign',
  itemListV2: '/Item/AllItemListAssignAndUnAssignV2',
  itemList: '/Item/AllItemList',
  assignedItemList: '/Item/GetAllAssignedItemList',
  usedItemList: '/Item/GetUsedItemList',
  // NOTE: 'Item/GetAllItemGroups' has no equivalent anywhere in the Java
  // source or old-rn-app — "item group" isn't a feature of the original app.
  // getItemGroupList()/AddItemModal's group picker will 404 until either a
  // real backend endpoint is confirmed or the picker is rebuilt to derive
  // group names client-side from the existing item-list responses (which
  // already carry ItemGroupName on each item).
  itemGroupList: '/Item/GetAllItemGroups',
  itemUnitTypeList: '/Item/GetItemUnitTypes',
  addItem: '/Item/AddItem',
  assignItem: '/Item/AssignItem',
  focRequestList: '/FOC_Item_Request/GET_FOC_List',
  focStatusTags: '/FOC_Item_Request/Get_Foc_Status_Tag_List',
  leadStatusList: '/Lead/GetLeadStatusList',
  leadList: '/Lead/GetAllLeadList',
  leadServiceTypeList: '/Services/GetEnqServiceTypeList',
  leadDetails: '/Lead/GetLeadListByUserIdandLeadId',
  updateLeadStatus: '/Lead/UpdateLeadStatus',
  addCustomerLead: '/LeadForm/AddCustomerLead',
  addCredit: '/Expenditure/AddCredit',
  addDeduction: '/Expenditure/AddDeduction',
  amcTypes: '/AMCs/GetAMCType',
  amcServiceOccurrenceTypes: '/AMCs/GetAMCServiceOccuranceType',
  amcReminderModes: '/AMCs/GetAMCSetReminders',
  customerList: '/CustomerList/GetAllCustomerListForMobile',
  updateCustomerDetails: '/CustomerList/UpdateCustomerDetails',
  customerTagList: '/CustomerList/GetCRMCustomerTagList',
  stateList: '/CustomerList/Getstates',
  cityList: '/CustomerList/GetCities',
  dashboardAmcWeb: '/AMCs/AMCDashboardDetailsWebV2',
  addAMC: '/AMCs/AddAMC',
  putAMC: '/AMCs/PutAMC',
  amcDetailsForEdit: '/AMCs/GetAMCDetails',
  enquiryList: '/CustomerInquiry/GetAllEnquiryListForMobile',
  addEnquiry: '/CustomerInquiry/AddCustomerInquiry',
  updateEnquiry: '/CustomerInquiry/UpdateCustomerInquiry',
  // Was '/Services/GetAdvanceServiceListByUserId' — no such route in the Java
  // source. The service-type picker this feeds (CRMScreen/AddTaskModal) maps
  // to URLConstant.Services.GET_ServiceTypeList, which takes OwnerId/SearchParam/
  // pageIndex — see getAdvanceServiceList() below, updated to match.
  advanceServiceList: '/Services/GetServiceTypeList',
  quoteBindList: '/Quotation/GetQuoteBindList',
  fsrBindList: '/FSRManagement/GetAllFSRListByUserId',
  quotationList: '/Quotation/getquotationssearchbyparam',
  invoiceListSearch: '/AccountManagement/GetInvoiceListSearch',
  saveQuotationNonOwner: '/Quotation/SaveQuotationsNonOwner',
  quotationDetails: '/Quotation/getquotationsbyid',
  invoiceDetails: '/AccountManagement/GetInvoiceViewDetailsByInvoiceId',
  quotationPdf: '/Quotation/getquotationpdfbyid',
  deleteQuotation: '/Quotation/DeleteQuotationForMobile',
  deleteInvoice: '/AccountManagement/DeleteInvoiceByInvoiceId',
  addBulkFieldworkers: '/UM_EmployeeList/AddEmployeeDetailsForUMList',
};

const DEFAULT_BASE_URL = 'http://192.169.3.8/API/api/';
const REQUEST_TIMEOUT_MS = 20000;
export { HARDCODED_USER_ID };

const runtimeConfig: { baseUrl: string; endpoints: TouchlessEndpoints } = {
  baseUrl: DEFAULT_BASE_URL,
  endpoints: { ...DEFAULT_ENDPOINTS },
};

const sanitizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '');

const joinUrl = (baseUrl: string, endpoint: string) => {
  const normalizedBase = sanitizeBaseUrl(baseUrl);
  const normalizedPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${normalizedBase}${normalizedPath}`;
};

const appendQuery = (url: string, query?: QueryParams) => {
  if (!query) {
    return url;
  }

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    params.append(key, String(value));
  });

  const queryString = params.toString();
  if (!queryString) {
    return url;
  }

  // Clean up any trailing '?' or '&' that might be present in the base URL
  const cleanedUrl = url.replace(/[?&]+$/, '');

  return `${cleanedUrl}${cleanedUrl.includes('?') ? '&' : '?'}${queryString}`;
};

const encodeFormBody = (form: FormFields) =>
  Object.entries(form)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&');

const parseResponse = async <T>(response: Response): Promise<T> => {
  const rawText = await response.text();
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const data = rawText ? (isJson ? JSON.parse(rawText) : rawText) : null;

  if (!response.ok) {
    // Build a more informative error including status and response body (if any)
    const status = response.status;
    const statusText = response.statusText || '';
    const bodyText =
      typeof data === 'string' ? data : JSON.stringify(data ?? {});
    const messageFromBody =
      typeof data === 'string'
        ? data
        : (data as { message?: string } | null)?.message;

    const message =
      (messageFromBody && String(messageFromBody).trim()) ||
      `${status} ${statusText}` ||
      'Request failed';

    // Log full details to assist debugging on device/emulator
    try {
      console.warn('[API Response Error]', {
        status,
        statusText,
        url: response.url,
        body: bodyText,
      });
    } catch (e) {
      // ignore logging failures
    }

    throw new Error(`${message} (status=${status})`);
  }

  return data as T;
};

const request = async <T>(
  endpoint: string,
  { method = 'GET', query, form, body, headers, skipAuth }: RequestOptions = {},
): Promise<T> => {
  const url = appendQuery(joinUrl(runtimeConfig.baseUrl, endpoint), query);
  const requestHeaders: HeadersMap = {
    Accept: 'application/json',
    ...headers,
  };

  // Try to attach a Bearer token from AsyncStorage if available.
  if (!skipAuth) {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      if (storedToken) {
        requestHeaders['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch (e) {
      // ignore storage errors and proceed without Authorization header
    }
  }

  let requestBody: string | undefined;

  if (form) {
    requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
    requestBody = encodeFormBody(form);
  } else if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  try {
    const authHeader = requestHeaders['Authorization'];
    const maskedAuth = authHeader ? `${authHeader.slice(0, 10)}...` : null;
    console.log('[API Request]', method, url);
    console.log('[API Request Headers]', { Authorization: maskedAuth });
    if (requestBody) {
      console.log('[API Request Body]', requestBody);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: requestHeaders,
        // DELETE endpoints on this backend take their identifiers as query
        // params (e.g. Quotation/DeleteQuotationForMobile?Id=..&UserId=..),
        // same as GET — only POST/PUT send a body.
        body: method === 'GET' || method === 'DELETE' ? undefined : requestBody,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const result = await parseResponse<T>(response);
    console.log('[API Response]', url, result);
    return result;
  } catch (error) {
    console.warn('[API Error]', url, error);
    // Handle request timeout / abort specifically
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        'Request timed out. Please check your connection and the server is accessible.',
      );
    }
    // Handle network errors specifically
    if (error instanceof TypeError) {
      throw new Error(
        'Network connection failed. Please check your internet connection and the server is accessible.',
      );
    }
    throw error;
  }
};

export const configureTouchlessApi = (config: TouchlessApiConfig) => {
  runtimeConfig.baseUrl = sanitizeBaseUrl(config.baseUrl) || DEFAULT_BASE_URL;
  runtimeConfig.endpoints = {
    ...DEFAULT_ENDPOINTS,
    ...config.endpoints,
  };
};

export const getTouchlessApiConfig = () => ({
  baseUrl: runtimeConfig.baseUrl,
  endpoints: { ...runtimeConfig.endpoints },
});

const defaultDeviceId = `${Platform.OS}-react-native`;

export const touchlessApi = {
  async doTouchlessLogin<T = unknown>({
    userName,
    password,
    preferredLanguage = 'English',
    deviceId = defaultDeviceId,
  }: TouchlessLoginRequest) {
    return request<T>(runtimeConfig.endpoints.login, {
      method: 'POST',
      form: {
        UserName: userName,
        Password: password,
        AndroidID: deviceId,
        UserPreferredLanguage: preferredLanguage,
      },
    });
  },

  async doTouchlessSignUp<T = unknown>({
    emailId = '',
    contactNo = '',
    countryDetailsId,
  }: TouchlessSignUpRequest) {
    return request<T>(runtimeConfig.endpoints.signUpOtp, {
      method: 'POST',
      form: {
        EmailId: emailId,
        ContactNo: contactNo,
        CountryDetailsId: countryDetailsId,
      },
    });
  },

  async getMobileOTPVerified<T = unknown>({
    mobileNo,
    userId,
  }: VerifyMobileOtpRequest) {
    return request<T>(runtimeConfig.endpoints.verifyMobileOtp, {
      method: 'GET',
      query: {
        MobileNo: mobileNo,
        UserId: userId,
      },
    });
  },

  async getEmailOTPVerified<T = unknown>({
    emailId,
    userId,
  }: VerifyEmailOtpRequest) {
    return request<T>(runtimeConfig.endpoints.verifyEmailOtp, {
      method: 'GET',
      query: {
        EmailId: emailId,
        UserId: userId,
      },
    });
  },

  async getUserDetails<T = UserDetailsResponse>({
    userId,
  }: {
    userId: number;
  }) {
    return request<T>(runtimeConfig.endpoints.userDetails, {
      method: 'GET',
      query: {
        UserId: userId,
      },
    });
  },

  async getDashboardData<T = unknown>({
    userId,
    duration,
    pageIndex = 1,
  }: {
    userId: number;
    duration: string;
    pageIndex?: number;
  }) {
    return request<T>(runtimeConfig.endpoints.dashboardData, {
      method: 'GET',
      query: {
        UserId: userId,
        Duration: duration,
        pageIndex,
      },
    });
  },

  async getDashboardEarning<T = unknown>({
    userId,
    inputFilter,
  }: {
    userId: number;
    inputFilter: string;
  }) {
    return request<T>(runtimeConfig.endpoints.dashboardEarning, {
      method: 'GET',
      query: {
        UserId: userId,
        InputFilter: inputFilter,
      },
    });
  },

  async getDashboardAmcStatus<T = unknown>({
    ownerId,
    inputFilter,
    amcTypeId = 0,
  }: {
    ownerId: number;
    inputFilter: string;
    amcTypeId?: number;
  }) {
    return request<T>(runtimeConfig.endpoints.dashboardAmc, {
      method: 'GET',
      query: {
        OwnerId: ownerId,
        InputFilter: inputFilter,
        AMCTypeId: amcTypeId,
      },
    });
  },

  async getDashboardAmcWeb<T = unknown>({
    ownerId,
    date,
    amcTypeId = 0,
  }: {
    ownerId: number;
    date: string;
    amcTypeId?: number;
  }) {
    return request<T>(runtimeConfig.endpoints.dashboardAmcWeb, {
      method: 'GET',
      query: {
        OwnerId: ownerId,
        Date: date,
        AMCTypeId: amcTypeId,
      },
    });
  },

  async getAMCTypes<T = AMCTypeResponse>() {
    return request<T>(runtimeConfig.endpoints.amcTypes, {
      method: 'GET',
    });
  },

  async getAMCServiceOccurrenceTypes<T = AMCLookupResponse>() {
    return request<T>(runtimeConfig.endpoints.amcServiceOccurrenceTypes, {
      method: 'GET',
    });
  },

  async getAMCReminderModes<T = AMCLookupResponse>() {
    return request<T>(runtimeConfig.endpoints.amcReminderModes, {
      method: 'GET',
    });
  },

  async getAMCReportDetails<T = unknown>({
    ownerId,
    amcsId,
    amcServiceDetailsId,
  }: {
    ownerId: number;
    amcsId?: number;
    amcServiceDetailsId?: number;
  }) {
    return request<T>(runtimeConfig.endpoints.amcReportDetails, {
      method: 'GET',
      query: {
        OwnerId: ownerId,
        ...(amcsId !== undefined && { AMCsId: amcsId }),
        ...(amcServiceDetailsId !== undefined && { AMCServiceDetailsId: amcServiceDetailsId }),
      },
    });
  },

  async getAMCDetailsForEdit<T = unknown>({
    userId,
    amcsId,
  }: {
    userId: number;
    amcsId: number;
  }) {
    return request<T>(runtimeConfig.endpoints.amcDetailsForEdit, {
      method: 'GET',
      query: {
        UserId: userId,
        AMCsId: amcsId,
      },
    });
  },

  async getCustomerListForMobile<T = CustomerLookupResponse>({
    userId,
    customerTagId = 0,
  }: {
    userId: number;
    customerTagId?: number;
    searchParam?: string;
  }) {
    return request<T>(runtimeConfig.endpoints.customerList, {
      method: 'GET',
      query: {
        UserId: userId,
        CustomerTagId: customerTagId,
      },
    });
  },

  async updateCustomerDetails<T = unknown>(payload: UpdateCustomerDetailsRequest) {
    return request<T>(runtimeConfig.endpoints.updateCustomerDetails, {
      method: 'POST',
      body: payload,
    });
  },

  async getCustomerTagList<T = CustomerTagListResponse>({
    userId,
  }: {
    userId: number;
  }) {
    return request<T>(runtimeConfig.endpoints.customerTagList, {
      method: 'GET',
      query: {
        UserId: userId,
      },
    });
  },

  async getEnquiryList<T = EnquiryListResponse>({
    userId,
  }: {
    userId: number;
  }) {
    return request<T>(runtimeConfig.endpoints.enquiryList, {
      method: 'GET',
      query: {
        UserId: userId,
      },
    });
  },

  async getAdvanceServiceList<T = AdvanceServiceResponse>({
    userId,
    searchParam = '',
    pageIndex = 1,
  }: {
    userId: number;
    searchParam?: string;
    pageIndex?: number;
  }) {
    return request<T>(runtimeConfig.endpoints.advanceServiceList, {
      method: 'GET',
      query: {
        // Real endpoint (Services/GetServiceTypeList) takes OwnerId, not UserId.
        OwnerId: userId,
        SearchParam: searchParam,
        pageIndex,
      },
    });
  },

  async getQuoteBindList<T = QuoteBindListResponse>({
    userId,
    searchParam = '',
  }: {
    userId: number;
    searchParam?: string;
  }) {
    return request<T>(runtimeConfig.endpoints.quoteBindList, {
      method: 'GET',
      query: {
        UserId: userId,
        SearchParam: searchParam,
      },
    });
  },

  async getFSRBindList<T = FSRBindListResponse>({
    userId,
    searchParam = '',
  }: {
    userId: number;
    searchParam?: string;
  }) {
    return request<T>(runtimeConfig.endpoints.fsrBindList, {
      method: 'GET',
      query: {
        UserId: userId,
        SearchParam: searchParam,
      },
    });
  },

  async addEnquiry<T = unknown>(payload: AddEnquiryRequest) {
    return request<T>(runtimeConfig.endpoints.addEnquiry, {
      method: 'POST',
      body: payload,
    });
  },

  async updateEnquiry<T = unknown>(payload: UpdateCustomerInquiryRequest) {
    return request<T>(runtimeConfig.endpoints.updateEnquiry, {
      method: 'POST',
      body: payload,
    });
  },

  async getStateList<T = StateListResponse>() {
    return request<T>(runtimeConfig.endpoints.stateList, {
      method: 'GET',
    });
  },

  async getCityList<T = CityListResponse>({
    userId,
    stateId,
  }: {
    userId: number;
    stateId: number;
  }) {
    return request<T>(runtimeConfig.endpoints.cityList, {
      method: 'GET',
      query: {
        UserId: userId,
        StateId: stateId,
      },
    });
  },

  async getTodayPassbook<T = TodayPassbookResponse>({
    userId,
  }: {
    userId: number;
  }) {
    return request<T>(runtimeConfig.endpoints.todayPassbook, {
      method: 'GET',
      query: {
        UserId: userId,
      },
    });
  },

  async getMonthlyPassbook<T = MonthlyPassbookResponse>({
    userId,
    month,
    year,
  }: {
    userId: number;
    month: number;
    year: number;
  }) {
    return request<T>(runtimeConfig.endpoints.monthlyPassbook, {
      method: 'GET',
      query: {
        UserId: userId,
        PassbookMonth: month,
        PassbookYear: year,
      },
    });
  },

  async getYearlyPassbook<T = YearlyPassbookResponse>({
    userId,
    year,
  }: {
    userId: number;
    year: number;
  }) {
    return request<T>(runtimeConfig.endpoints.yearlyPassbook, {
      method: 'GET',
      query: {
        UserId: userId,
        PassbookYear: year,
      },
    });
  },

  async getExpenseTechnicianList<T = ExpenseTechnicianListResponse>({
    ownerId,
  }: {
    ownerId: number;
  }) {
    return request<T>(runtimeConfig.endpoints.expenseTechnicianList, {
      method: 'GET',
      query: {
        OwnerId: ownerId,
      },
    });
  },

  async addCredit<T = unknown>({
    amount,
    description,
    givenBy,
    receivedBy,
  }: {
    amount: number;
    description?: string;
    givenBy: number;
    receivedBy: number;
  }) {
    return request<T>(runtimeConfig.endpoints.addCredit, {
      method: 'POST',
      form: {
        Amount: amount,
        CredidDescription: description ?? '',
        GivenBy: givenBy,
        ReceivedBy: receivedBy,
      },
    });
  },

  async addDeduction<T = unknown>({
    amount,
    description,
    deductBy,
    userId,
  }: {
    amount: number;
    description?: string;
    deductBy: number;
    userId: number;
  }) {
    return request<T>(runtimeConfig.endpoints.addDeduction, {
      method: 'POST',
      form: {
        Amount: amount,
        Description: description ?? '',
        DeductBy: deductBy,
        UserId: userId,
      },
    });
  },

  async addAMC<T = unknown>(payload: AddAMCRequest) {
    return request<T>(runtimeConfig.endpoints.addAMC, {
      method: 'POST',
      body: payload,
    });
  },

  async putAMC<T = unknown>(payload: AddAMCRequest) {
    return request<T>(runtimeConfig.endpoints.putAMC, {
      method: 'POST',
      body: payload,
    });
  },

  async getTaskList<T = TaskListResponse>({
    userId,
    searchParam = '',
    statusId = 0,
    taskTypeId = 0,
    pageIndex = 1,
    month,
    year,
    taskTagId = 0,
    isAllData = false,
  }: {
    userId: number;
    searchParam?: string;
    statusId?: number;
    taskTypeId?: number;
    pageIndex?: number;
    month: number;
    year: number;
    taskTagId?: number;
    isAllData?: boolean;
  }) {
    return request<T>(runtimeConfig.endpoints.taskList, {
      method: 'GET',
      query: {
        UserId: userId,
        searchparam: searchParam,
        TaskStatusID: statusId,
        TaskTypeID: taskTypeId,
        pageIndex,
        TaskMonth: month,
        TaskYear: year,
        TaskTagId: taskTagId,
        AllData: isAllData,
      },
    });
  },

  async addTaskDetails<T = unknown>(payload: AddTaskDetailsRequest) {
    return request<T>(runtimeConfig.endpoints.addTaskDetails, {
      method: 'POST',
      body: payload,
    });
  },

  async getTaskDetails<T = TaskDetailsResponse>({
    userId,
    taskId,
  }: {
    userId: number;
    taskId: number;
  }) {
    return request<T>(runtimeConfig.endpoints.taskDetails, {
      method: 'GET',
      query: {
        UserId: userId,
        TaskId: taskId,
      },
    });
  },

  async getTaskTags<T = TaskTagResponse>({
    userId,
  }: {
    userId: number;
  }) {
    return request<T>(runtimeConfig.endpoints.taskTags, {
      method: 'GET',
      query: {
        UserId: userId,
      },
    });
  },

  async getEmployeeLookup<T = EmployeeLookupResponse>({
    userId,
  }: {
    userId: number;
  }) {
    return request<T>(runtimeConfig.endpoints.employeeLookup, {
      method: 'GET',
      query: {
        UserId: userId,
      },
    });
  },

  async getEmployeeList<T = EmployeeListResponse>({
    ownerId,
    pageIndex = 1,
    searchParam = '',
    employeeTypeId = 0,
    zoneId = 0,
    status = 0,
  }: {
    ownerId: number;
    pageIndex?: number;
    searchParam?: string;
    employeeTypeId?: number;
    zoneId?: number;
    status?: number;
  }) {
    return request<T>(runtimeConfig.endpoints.employeeList, {
      method: 'GET',
      query: {
        OwnerId: ownerId,
        pageIndex,
        SearchParam: searchParam,
        employeeTypeId,
        zoneId,
        status,
      },
    });
  },

  async getLeaveList<T = LeaveListResponse>({
    userId,
    pageNumber = 1,
    pageSize = 10,
    leaveStatusId = 0,
    isPersonal = false,
    isExportData = false,
    monthYear,
    searchParams = '',
    zoneId = 0,
  }: {
    userId: number;
    pageNumber?: number;
    pageSize?: number;
    leaveStatusId?: number;
    isPersonal?: boolean;
    isExportData?: boolean;
    monthYear: string;
    searchParams?: string;
    zoneId?: number;
  }) {
    return request<T>(runtimeConfig.endpoints.leaveList, {
      method: 'POST',
      form: {
        IsExportData: isExportData,
        IsPersonal: isPersonal,
        LeaveStatusId: leaveStatusId,
        MonthYear: monthYear,
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchParams: searchParams,
        UserId: userId,
        ZoneId: zoneId,
      },
    });
  },

  async getItemInventoryList<T = ItemInventoryListResponse>({
    ownerId,
    searchParam = '',
    pageIndex = 1,
  }: {
    ownerId: number;
    searchParam?: string;
    pageIndex?: number;
  }) {
    return request<T>(runtimeConfig.endpoints.itemInventoryList, {
      method: 'GET',
      query: {
        OwnerId: ownerId,
        SearchParam: searchParam,
        pageIndex,
      },
    });
  },

  async getItemListV2<T = ItemInventoryListResponse>({
    ownerId,
    searchParam = '',
  }: {
    ownerId: number;
    searchParam?: string;
  }) {
    return request<T>(runtimeConfig.endpoints.itemListV2, {
      method: 'GET',
      query: {
        OwnerId: ownerId,
        SearchParam: searchParam,
      },
    });
  },

  async getItemList<T = ItemInventoryListResponse>({
    ownerId,
    searchParam = '',
  }: {
    ownerId: number;
    searchParam?: string;
  }) {
    return request<T>(runtimeConfig.endpoints.itemList, {
      method: 'GET',
      query: {
        OwnerId: ownerId,
        SearchParam: searchParam,
      },
    });
  },

  async getAssignedItemList<T = AssignedItemListResponse>({
    itemId,
    ownerId,
  }: {
    itemId: number;
    ownerId: number;
  }) {
    return request<T>(runtimeConfig.endpoints.assignedItemList, {
      method: 'GET',
      query: {
        itemId,
        OwnerId: ownerId,
      },
    });
  },

  async getUsedItemList<T = UsedItemListResponse>({
    itemId,
    ownerId,
  }: {
    itemId: number;
    ownerId: number;
  }) {
    return request<T>(runtimeConfig.endpoints.usedItemList, {
      method: 'GET',
      query: {
        itemId,
        OwnerId: ownerId,
      },
    });
  },

  async getItemGroupList<T = ItemGroupListResponse>(
    {ownerId}: {ownerId?: number} = {},
  ) {
    return request<T>(runtimeConfig.endpoints.itemGroupList, {
      method: 'GET',
      skipAuth: true,
      query: {
        userId: ownerId,
      },
    });
  },

  async getItemUnitTypeList<T = ItemUnitTypeListResponse>(
    {ownerId}: {ownerId?: number} = {},
  ) {
    return request<T>(runtimeConfig.endpoints.itemUnitTypeList, {
      method: 'GET',
      skipAuth: true,
      query: {
        userId: ownerId,
      },
    });
  },

  async addItem<T = unknown>(payload: AddItemRequest) {
    return request<T>(runtimeConfig.endpoints.addItem, {
      method: 'POST',
      body: payload,
    });
  },

  async assignItem<T = unknown>(payload: AssignItemRequest) {
    return request<T>(runtimeConfig.endpoints.assignItem, {
      method: 'POST',
      body: payload,
    });
  },

  async addBulkFieldworkers<T = AddBulkFieldworkerResponse>(
    payload: AddBulkFieldworkerRequestItem,
  ) {
    return request<T>(runtimeConfig.endpoints.addBulkFieldworkers, {
      method: 'POST',
      body: [payload],
    });
  },

  async getFocRequestList<T = FocRequestListResponse>({
    ownerId,
    pageNumber = 1,
    pageSize = 10,
    zoneId = 0,
    issueTypeId = 0,
    focStatusId = 0,
    searchParam = '',
  }: {
    ownerId: number;
    pageNumber?: number;
    pageSize?: number;
    zoneId?: number;
    issueTypeId?: number;
    focStatusId?: number;
    searchParam?: string;
  }) {
    return request<T>(runtimeConfig.endpoints.focRequestList, {
      method: 'GET',
      query: {
        Pageindex: pageNumber,
        Pagesize: pageSize,
        ZoneId: zoneId,
        OwnerId: ownerId,
        IssueTypeID: issueTypeId,
        FOCStatusTagID: focStatusId,
        SearchParam: searchParam,
      },
    });
  },

  async getFocStatusTags<T = FocStatusTagResponse>() {
    return request<T>(runtimeConfig.endpoints.focStatusTags, {
      method: 'GET',
    });
  },

  async getLeadStatusList<T = LeadStatusResponse>() {
    return request<T>(runtimeConfig.endpoints.leadStatusList, {
      method: 'GET',
    });
  },

  async getLeadServiceTypeList<T = LeadServiceTypeResponse>({
    ownerId,
  }: {
    ownerId: number;
  }) {
    return request<T>(runtimeConfig.endpoints.leadServiceTypeList, {
      method: 'GET',
      query: {
        OwnerId: ownerId,
      },
    });
  },

  async addCustomerLead<T = unknown>(payload: AddCustomerLeadRequest) {
    return request<T>(runtimeConfig.endpoints.addCustomerLead, {
      method: 'POST',
      body: payload,
    });
  },

  async getLeadList<T = LeadListResponse>({
    userId,
    pageIndex = 1,
    searchParam = '',
    leadStatusId = 0,
  }: {
    userId: number;
    pageIndex?: number;
    searchParam?: string;
    leadStatusId?: number;
  }) {
    return request<T>(runtimeConfig.endpoints.leadList, {
      method: 'GET',
      query: {
        UserId: userId,
        pageIndex,
        SearchParam: searchParam,
        LeadStatusId: leadStatusId,
      },
    });
  },

  async getLeadDetails<T = LeadDetailsResponse>({
    userId,
    leadId,
  }: {
    userId: number;
    leadId: number;
  }) {
    return request<T>(runtimeConfig.endpoints.leadDetails, {
      method: 'GET',
      query: {
        UserId: userId,
        LeadId: leadId,
      },
    });
  },

  async updateLeadStatus<T = unknown>({
    userId,
    leadId,
    statusId,
    notes,
  }: {
    userId: number;
    leadId: number;
    statusId: number;
    notes: string;
  }) {
    return request<T>(runtimeConfig.endpoints.updateLeadStatus, {
      method: 'POST',
      form: {
        UserId: userId,
        LeadId: leadId,
        LeadStatusId: statusId,
        Description: notes,
      },
    });
  },

  async getQuotationList<T = QuotationListResponse>({
    userId,
    pageSize = 10,
    pageNum = 1,
    statusId = 0,
    searchParam = '',
  }: {
    userId: number;
    pageSize?: number;
    pageNum?: number;
    statusId?: number;
    searchParam?: string;
  }) {
    return request<T>(runtimeConfig.endpoints.quotationList, {
      method: 'GET',
      query: {
        UserId: userId,
        PageSize: pageSize,
        Pagenum: pageNum,
        StatusId: statusId,
        SearchParam: searchParam,
      },
    });
  },

  async getInvoiceList<T = InvoiceListResponse>({
    userId,
    pageSize = 50,
    pageNum = 1,
    statusId = 0,
    searchParam = '',
  }: {
    userId: number;
    pageSize?: number;
    pageNum?: number;
    statusId?: number;
    searchParam?: string;
  }) {
    return request<T>(runtimeConfig.endpoints.invoiceListSearch, {
      method: 'GET',
      query: {
        UserId: userId,
        PageSize: pageSize,
        Pagenum: pageNum,
        SearchParam: searchParam,
        StatusId: statusId,
      },
    });
  },

  async saveQuotationNonOwner<T = unknown>(payload: SaveQuotationNonOwnerRequest) {
    return request<T>(runtimeConfig.endpoints.saveQuotationNonOwner, {
      method: 'POST',
      body: payload,
    });
  },

  async getQuotationDetails<T = QuotationDetailsResponse>({
    quotationId,
    userId,
  }: {
    quotationId: number;
    userId: number;
  }) {
    return request<T>(runtimeConfig.endpoints.quotationDetails, {
      method: 'GET',
      query: {
        Id: quotationId,
        UserId: userId,
      },
    });
  },

  async getInvoiceDetails<T = InvoiceDetailsResponse>({
    invoiceId,
    userId,
  }: {
    invoiceId: number;
    userId: number;
  }) {
    return request<T>(runtimeConfig.endpoints.invoiceDetails, {
      method: 'GET',
      query: {
        InvoiceId: invoiceId,
        UserId: userId,
      },
    });
  },

  async getQuotationPdf<T = QuotationPdfResponse>({
    quotationId,
    userId,
  }: {
    quotationId: number;
    userId: number;
  }) {
    return request<T>(runtimeConfig.endpoints.quotationPdf, {
      method: 'GET',
      query: {
        Id: quotationId,
        UserId: userId,
      },
    });
  },

  async deleteQuotation<T = unknown>({
    quotationId,
    userId,
  }: {
    quotationId: number;
    userId: number;
  }) {
    // Real route (URLConstant.Accounts.DELETE_QUOTATION_DETAILS) is an
    // @DELETE with the id/user passed as query params, not a POST form body.
    return request<T>(runtimeConfig.endpoints.deleteQuotation, {
      method: 'DELETE',
      query: {
        Id: quotationId,
        UserId: userId,
      },
    });
  },

  async deleteInvoice<T = unknown>({
    invoiceId,
    userId,
  }: {
    invoiceId: number;
    userId: number;
  }) {
    // Same story: URLConstant.Accounts.DELETE_INVOICE_DETAILS is @DELETE
    // with query params (Id, UserId), not a POST form body.
    return request<T>(runtimeConfig.endpoints.deleteInvoice, {
      method: 'DELETE',
      query: {
        Id: invoiceId,
        UserId: userId,
      },
    });
  },
};

export default touchlessApi;
