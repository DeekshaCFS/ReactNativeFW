// src/api/focItemRequest/focItemRequest.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each FOC_Item_Request endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/FOC/GetFOCList.java ----
export interface GetFOCList {
  ResultData?: GetFOCListResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface GetFOCListResultData {
  ChangedByDesigationName?: string;
  FOC_ItemList?: GetFOCListFOC_ItemList[];
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: any;
  CreatedBy?: number;
  FOCUserID?: number;
  CustomerDetailsId?: number;
  Notes?: string;
  IsAnyIssue?: boolean;
  IsItemRecieved?: boolean;
  IsActive?: boolean;
  ChangedByName?: string;
  ChangedBy?: number;
  FOCStatusName?: string;
  FocStatusTagId?: number;
  TaskStatus?: string;
  NewTaskID?: string;
  TaskName?: string;
  TaskId?: number;
  SourceName?: string;
  SourceTypeId?: number;
  FocRequestId?: number;
  AdminId?: number;
  AssignZoneId?: number;
  OwnerId?: number;
  EmailID?: string;
  ZoneName?: string;
  DesigationName?: string;
  UserGroupCode?: string;
  MobileNo?: string;
  UserID?: number;
  Address?: string;
  LandMark?: string;
  EmpDOJ?: string;
  Photo?: string;
  LastName?: string;
  FirstName?: string;
  EmployeeNumber?: number;
}

export interface GetFOCListFOC_ItemList {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  ExistingItemId?: number;
  IsExistingItem?: boolean;
  DescribeIssue?: string;
  IsAnyIssue?: boolean;
  IsItemRecieved?: boolean;
  IsActive?: boolean;
  ItemRequestStatusTagId?: number;
  AttachmentDocFileName?: string;
  AttachmentDoc?: string;
  AttachmentTypeName?: string;
  AttachmentTypeID?: number;
  ItemRequestInstall_date?: string;
  ItemRequestInvoice_Date?: string;
  ItemRequestQty?: number;
  ItemRequestName?: string;
  FocRequestId?: number;
  ItemRequestId?: number;
  FieldWorkerDescribeIssue?: string;
  ItemRequestStatusTagName?: string;
  ProductID?: string;
}

// ---- from DTO/FOC/GetFOCStatusTagList.java ----
export interface GetFOCStatusTagList {
  ResultData?: GetFOCStatusTagListResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface GetFOCStatusTagListResultData {
  UserId?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  FocStatusTagDescription?: string;
  FocStatusName?: string;
  FocStatusId?: number;
}

// ---- from DTO/FOC/GetFOCAttachmentListDTO.java ----
export interface GetFOCAttachmentListDTO {
  ResultData?: GetFOCAttachmentListDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface GetFOCAttachmentListDTOResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  UserId?: number;
  Description?: string;
  AttachmentTypeName?: string;
  AttachmentTypeID?: number;
}

// ---- from DTO/FOC/AddFocDTO.java ----
export interface AddFocDTO {
  ResultData?: AddFocDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface AddFocDTOResultData {
  FOC_Item_Request_Details?: AddFocDTOFOC_Item_Request_Details[];
  isSyncDone?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  CustomerDetailsId?: number;
  Notes?: string;
  IsAnyIssue?: boolean;
  IsItemRecieved?: boolean;
  IsActive?: boolean;
  ChangedBy?: number;
  FocStatusTagId?: number;
  TaskId?: number;
  SourceName?: string;
  SourceTypeId?: number;
  FocRequestId?: number;
}

export interface AddFocDTOFOC_Item_Request_Details {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  ExistingItemId?: number;
  IsExistingItem?: boolean;
  DescribeIssue?: string;
  IsAnyIssue?: boolean;
  IsItemRecieved?: boolean;
  IsActive?: boolean;
  ItemRequestStatusTagId?: number;
  AttachmentDocFileName?: string;
  AttachmentDoc?: string;
  AttachmentTypeName?: string;
  AttachmentTypeID?: number;
  ItemRequestInstall_date?: string;
  ItemRequestInvoice_Date?: string;
  ItemRequestQty?: number;
  ItemRequestName?: string;
  FocRequestId?: number;
  ItemRequestId?: number;
  TempFocSerialNumber?: number;
  ProductID?: string;
  ItemDescription?: string;
  TaskId?: number;
  isSyncDone?: string;
}

// ---- from DTO/FOC/FOC_UpdateItemRequestDTO.java ----
export interface FOC_UpdateItemRequestDTO {
  ResultData?: FOC_UpdateItemRequestDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface FOC_UpdateItemRequestDTOResultData {
  FOC_Item_Request_Details?: FOC_UpdateItemRequestDTOFOC_Item_Request_Details[];
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  CustomerDetailsId?: number;
  Notes?: string;
  IsAnyIssue?: boolean;
  IsItemRecieved?: boolean;
  IsActive?: boolean;
  ChangedBy?: number;
  FocStatusTagId?: number;
  TaskId?: number;
  SourceName?: string;
  SourceTypeId?: number;
  FocRequestId?: number;
}

export interface FOC_UpdateItemRequestDTOFOC_Item_Request_Details {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  ExistingItemId?: number;
  IsExistingItem?: boolean;
  DescribeIssue?: string;
  IsAnyIssue?: boolean;
  IsItemRecieved?: boolean;
  IsActive?: boolean;
  ItemRequestStatusTagId?: number;
  AttachmentDocFileName?: string;
  AttachmentDoc?: string;
  AttachmentTypeName?: string;
  AttachmentTypeID?: number;
  ItemRequestInstall_date?: string;
  ItemRequestInvoice_Date?: string;
  ItemRequestQty?: number;
  ItemRequestName?: string;
  FocRequestId?: number;
  ItemRequestId?: number;
  FieldWorkerDescribeIssue?: string;
}

// ---- from DTO/FOC/GetDeleteFOCReqItem.java ----
export interface GetDeleteFOCReqItem {
  Message?: string;
  Code?: string;
}
