// src/screens/admin/adminLegacyApiTypes.ts
//
// Response/item shapes copied verbatim from the old src/api/Api.ts during its
// removal. These are pure descriptions of backend JSON (both camelCase and
// PascalCase variants, matching whichever casing a given endpoint happens to
// return) -- they carry no request logic, so they're safe to keep as-is
// while the *fetching* code underneath moves to the modular src/api/<domain>
// services. Do not add new types here; add them to the relevant
// src/api/<domain>/<domain>.types.ts instead.

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

export type EnquiryListItem = Record<string, unknown>;

export type EnquiryListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: EnquiryListItem[] | null;
  ResultData?: EnquiryListItem[] | null;
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

export type CityItem = Record<string, unknown>;

export type CityListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: CityItem[] | null;
  ResultData?: CityItem[] | null;
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

export type StateItem = Record<string, unknown>;

export type StateListResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: StateItem[] | null;
  ResultData?: StateItem[] | null;
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
  latitude?: string;
  Longitude?: string;
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

export type CustomerLookupItem = Record<string, unknown>;

export type CustomerLookupResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: CustomerLookupItem[] | null;
  ResultData?: CustomerLookupItem[] | null;
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

export type MonthlyPassbookResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: MonthlyPassbookData | null;
  ResultData?: MonthlyPassbookData | null;
};

export type TodayPassbookResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: PassbookSummaryData | null;
  ResultData?: PassbookSummaryData | null;
};

export type YearlyPassbookData = MonthlyPassbookData & {
  getYearlyData?: PassbookSummaryData[] | null;
  GetYearlyData?: PassbookSummaryData[] | null;
};

export type YearlyPassbookResponse = {
  code?: string;
  Code?: string;
  message?: string;
  Message?: string;
  resultData?: YearlyPassbookData | null;
  ResultData?: YearlyPassbookData | null;
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