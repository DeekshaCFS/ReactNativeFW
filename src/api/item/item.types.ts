// src/api/item/item.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each Item endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/Item/AllItemIssueList.java ----
export interface AllItemIssueList {
  ResultData?: AllItemIssueListResultData[];
  Message?: string;
  Code?: string;
}

export interface AllItemIssueListResultData {
  IsActive?: boolean;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  AssignedTo?: string;
  UserId?: number;
  ItemType?: string;
  ItemTypeId?: number;
  Quantity?: number;
  Description?: string;
  Name?: string;
  Id?: number;
  TechPhoto?: string;
}

// ---- from DTO/Item/ItemIssueList.java ----
export interface ItemIssueList {
  ResultData?: ItemIssueListResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface ItemIssueListResultData {
  TaskId?: number;
  ItemId?: number;
  PurchasePrice?: number;
  SalesPrice?: number;
  ItemImagePath?: string;
  TechPhoto?: string;
  OwnerId?: number;
  IsActive?: boolean;
  UpdatedDate?: string;
  UpdatedBy?: string;
  CreatedDate?: string;
  CreatedBy?: string;
  AssignedTo?: string;
  UserId?: number;
  ItemType?: string;
  ItemTypeId?: number;
  Quantity?: number;
  Description?: string;
  Name?: string;
  Id?: number;
}

// ---- from DTO/Item/AddItem.java ----
export interface AddItem {
  ResultData?: AddItemResultdata;
  Message?: string;
  Code?: string;
}

export interface AddItemResultdata {
  ItemType?: number;
  Quantity?: number;
  Description?: string;
  Name?: string;
  IsModelError?: boolean;
  IsSuccessful?: boolean;
  UpdatedBy?: number;
  CreatedBy?: number;
  Id?: number;
  ItemUnitTypeId?: number;
  SalesPrice?: string;
  PurchasePrice?: string;
  ItemImagePath?: string;
  ImageFileName?: string;
  ImageFileBase64Str?: string;
}

// ---- from DTO/Item/ItemsList.java ----
export interface ItemsList {
  ResultData?: ItemsListResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface ItemsListResultData {
  TaskId?: number;
  UsedItemDetailsDtoObj?: ItemsListUsedItemDetailsDtoObj;
  ImageFileBase64Str?: string;
  ImageFileName?: string;
  ItemImagePath?: string;
  PurchasePrice?: number;
  SalesPrice?: number;
  ItemUnitTypeName?: string;
  ItemUnitTypeId?: number;
  TechFullName?: string;
  ItemId?: number;
  UnAssignedQuantity?: number;
  AssignedQuantity?: number;
  UserId?: number;
  OwnerId?: number;
  IsActive?: boolean;
  UpdatedDate?: string;
  UpdatedBy?: string;
  CreatedDate?: string;
  CreatedBy?: number;
  ItemType?: string;
  ItemTypeId?: number;
  Quantity?: number;
  Description?: string;
  Name?: string;
  Id?: number;
}

export interface ItemsListUsedItemDetailsDtoObj {
  Notes?: string;
  UpdatedDate?: string;
  UpdateBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  UsedQty?: number;
  AssignedQty?: number;
  AvlQty?: number;
  TaskId?: number;
  ItemIssuedId?: number;
  ItemId?: number;
  Id?: number;
}

// ---- from DTO/Item/IssueItem.java ----
export interface IssueItem {
  ResultData?: IssueItemResultData;
  Message?: string;
  Code?: string;
}

export interface IssueItemResultData {
  IsModelError?: boolean;
  IsSuccessful?: boolean;
  UpdatedBy?: number;
  CreatedBy?: number;
  IsActive?: boolean;
  Quantity?: number;
  TransactionType?: number;
  ItemId?: number;
  UserId?: number;
  Id?: number;
  OwnerId?: number;
}

// ---- from DTO/Item/AddDeductUsedItem.java ----
export interface AddDeductUsedItem {
  Notes?: string;
  UpdatedDate?: string;
  UpdateBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  UsedQty?: number;
  AssignedQty?: number;
  AvlQty?: number;
  TaskId?: number;
  ItemIssuedId?: number;
  ItemId?: number;
  Id?: number;
  Message?: string;
  Code?: string;
}

// ---- from DTO/Item/ReturnItem.java ----
export interface ReturnItem {
  Notes?: string;
  CreatedBy?: number;
  TaskId?: number;
  ItemIssuedId?: number;
  Quantity?: number;
  ItemId?: number;
  UserId?: number;
}

// ---- from DTO/Item/UnAssignItem.java ----
export interface UnAssignItem {
  Message?: string;
  Code?: string;
}

// ---- from DTO/Item/EditItem.java ----
export interface EditItem {
  ResultData?: EditItemResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface EditItemResultData {
  ImageFileBase64Str?: string;
  ImageFileName?: string;
  ItemImagePath?: string;
  PurchasePrice?: number;
  SalesPrice?: number;
  ItemUnitTypeId?: number;
  ItemType?: number;
  Quantity?: number;
  Description?: string;
  Name?: string;
  IsModelError?: boolean;
  IsSuccessful?: boolean;
  UpdatedBy?: number;
  CreatedBy?: number;
  Id?: number;
}

// ---- from DTO/Delete/DeleteItem.java ----
export interface DeleteItem {
  Message?: string;
  Code?: string;
}

// ---- from DTO/Item/ItemUnitType.java ----
export interface ItemUnitType {
  ResultData?: ItemUnitTypeResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface ItemUnitTypeResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  UnitTypeDescription?: string;
  UnitTypeName?: string;
  ItemUnitTypeId?: number;
}

// ---- from DTO/Item/TechWiseItemList.java ----
export interface TechWiseItemList {
  ResultData?: TechWiseItemListResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface TechWiseItemListResultData {
  TaskId?: number;
  UsedItemDetailsDtoObj?: TechWiseItemListUsedItemDetailsDtoObj;
  ImageFileBase64Str?: string;
  ImageFileName?: string;
  ItemImagePath?: string;
  PurchasePrice?: number;
  SalesPrice?: number;
  ItemUnitTypeName?: string;
  ItemUnitTypeId?: number;
  TechFullName?: string;
  ItemId?: number;
  UnAssignedQuantity?: number;
  AssignedQuantity?: number;
  UserId?: number;
  OwnerId?: number;
  IsActive?: boolean;
  UpdatedDate?: string;
  UpdatedBy?: string;
  CreatedDate?: string;
  CreatedBy?: number;
  ItemType?: string;
  ItemTypeId?: number;
  Quantity?: number;
  Description?: string;
  Name?: string;
  Id?: number;
}

export interface TechWiseItemListUsedItemDetailsDtoObj {
  Notes?: string;
  UpdatedDate?: string;
  UpdateBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  UsedQty?: number;
  AssignedQty?: number;
  AvlQty?: number;
  TaskId?: number;
  ItemIssuedId?: number;
  ItemId?: number;
  Id?: number;
}

// ---- from DTO/Item/DeleteItemPortal.java ----
export interface DeleteItemPortal {
  ResultData?: DeleteItemPortalResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface DeleteItemPortalResultData {
  Name?: string;
  Id?: number;
}

// ---- from DTO/Item/GetUsedItemList.java ----
export interface GetUsedItemList {
  ResultData?: GetUsedItemListResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface GetUsedItemListResultData {
  ItemIssuedQuantity?: number;
  PurchasePrice?: number;
  SalesPrice?: number;
  ItemName?: string;
  TechFullName?: string;
  TaskName?: string;
  Notes?: string;
  UpdatedDate?: string;
  UpdateBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  UsedQty?: number;
  CurrentAssignedQty?: number;
  AssignedQty?: number;
  AvlQty?: number;
  TaskId?: number;
  ItemIssuedId?: number;
  ItemId?: number;
  Id?: number;
}
