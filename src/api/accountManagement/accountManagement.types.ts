// src/api/accountManagement/accountManagement.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each AccountManagement endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/Account/DownloadInvoicePdfDTO.java ----
export interface DownloadInvoicePdfDTO {
  ResultData?: DownloadInvoicePdfDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface DownloadInvoicePdfDTOResultData {
  InvoicePdfPath?: string;
  InvoiceId?: number;
}

// ---- from DTO/Account/InvoiceDetailsDTO.java ----
export interface InvoiceDetailsDTO {
  ResultData?: InvoiceDetailsDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface InvoiceDetailsDTOResultData {
  TaxName?: string;
  SLAUrl?: string;
  SLAAttachment?: string;
  QuoteTaxList?: InvoiceDetailsDTOQuoteTaxList[];
  ownerAccountDetails?: InvoiceDetailsDTOOwnerAccountDetails;
  lstOwnerDynamicField?: InvoiceDetailsDTOLstOwnerDynamicField[];
  IsOutSideIndia?: boolean;
  CountryCode?: string;
  BuildingNumber?: string;
  IsSelfInvoiceCreate?: boolean;
  TermCondition?: string;
  Task_Excess_Amount_Dtls?: InvoiceDetailsDTOTask_Excess_Amount_Dtls[];
  QuotationCode?: string;
  QuotationId?: number;
  ServiceList?: InvoiceDetailsDTOServiceList[];
  PaymentList?: InvoiceDetailsDTOPaymentList[];
  ItemList?: InvoiceDetailsDTOItemList[];
  RemainingAmount?: number;
  ReceivedAmount?: number;
  GrandTotalAmount?: number;
  TaxAmount?: number;
  Tax?: number;
  DiscountAmounnt?: number;
  Discount?: number;
  SubTotalAmount?: number;
  ValidTillDate?: string;
  InvoiceDateTime?: string;
  ExtraAmount?: number;
  InvoiceAmount?: number;
  InvoiceCode?: string;
  Landmark?: string;
  CustAddress?: string;
  MobileNumber?: string;
  CustomerName?: string;
  CIN?: string;
  CompanyLogo?: string;
  ContactNo?: number;
  CompanyAddress?: string;
  CompanyName?: string;
}

export interface InvoiceDetailsDTOQuoteTaxList {
  UpdatedDate?: string;
  TaxName?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  TaxAmount?: number;
  Tax?: number;
  WithoutTax?: number;
  DiscountAmounnt?: number;
  Discount?: number;
  QuotationId?: number;
  Id?: number;
}

export interface InvoiceDetailsDTOOwnerAccountDetails {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  UserId?: number;
  QRCodeImage?: string;
  QRCodeImageFileBase64Str?: string;
  QRCodeImageFileName?: string;
  CurrencySymbolId?: number;
  PaymentLink?: string;
  UPI_Id?: string;
  BranchAddress?: string;
  AccountNumber?: string;
  IFSC_Code?: string;
  BankName?: string;
  OwnerAccountDetailId?: number;
}

export interface InvoiceDetailsDTOLstOwnerDynamicField {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  UserId?: number;
  DynamicFieldDescription?: string;
  DynamicFieldName?: string;
  DynamicFieldId?: number;
}

export interface InvoiceDetailsDTOTask_Excess_Amount_Dtls {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Excess_Amount?: number;
  Excess_Amount_Des?: string;
  TaskId?: number;
  Excess_Amount_Id?: number;
}

export interface InvoiceDetailsDTOServiceList {
  Quantity?: number;
  TotalPrice?: number;
  Price?: number;
  ServiceName?: string;
  ServiceId?: number;
}

export interface InvoiceDetailsDTOPaymentList {
  PaymentDate?: string;
  PaymentTransactionType?: string;
  Amount?: number;
  Id?: number;
}

export interface InvoiceDetailsDTOItemList {
  TotalPrice?: number;
  UnitPrice?: number;
  Quantity?: number;
  ItemName?: string;
  ItemId?: number;
}

// ---- from DTO/Account/InvoiceListDTO.java ----
export interface InvoiceListDTO {
  ResultData?: InvoiceListDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface InvoiceListDTOResultData {
  RemainingAmount?: number;
  TotalRecord?: number;
  UpdatedBy?: number;
  UpdatedDate?: string;
  CreatedBy?: number;
  CreatedDate?: string;
  IsActive?: boolean;
  UserId?: number;
  StatusId?: number;
  StatusName?: string;
  CustomerName?: string;
  QuoteTaskName?: string;
  InvoiceAmount?: number;
  CustomerId?: number;
  QuoteTaskId?: number;
  QuotationId?: number;
  InvoiceDate?: string;
  InvoiceCode?: string;
  Id?: number;
}

// ---- from DTO/Account/DeleteInvoiceDetailsDTO.java ----
export interface DeleteInvoiceDetailsDTO {
  Message?: string;
  Code?: string;
}

// ---- from DTO/Account/InvoicePaymentStatusDTO.java ----
export interface InvoicePaymentStatusDTO {
  ResultData?: InvoicePaymentStatusDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface InvoicePaymentStatusDTOResultData {
  UpdatedBy?: number;
  UpdatedDate?: string;
  CreatedBy?: number;
  CreatedDate?: string;
  IsActive?: boolean;
  UserId?: number;
  RemainingAmount?: number;
  RecievedAmount?: number;
  TotalAmount?: number;
  InvoiceCode?: string;
  Id?: number;
}

// ---- from DTO/Account/SaveInvoicePaymentAmountDetailsDTO.java ----
export interface SaveInvoicePaymentAmountDetailsDTO {
  Message?: string;
  Code?: string;
}

// Request shape for AccountManagement/SaveInvoicePaymentAmountDetails.
// Java's Api.updatePayment() is @FormUrlEncoded with these exact field names.
// Id is the payment-record id (0 for a new payment entry).
export interface SaveInvoicePaymentRequest {
  Id: number;
  InvoiceId: number;
  Amount: number;
  CreatedBy: number;
  UserId: number;
  PaymentTransactionType: string;
  IsActive: boolean;
}

// ---- from DTO/Account/InvoiceFollowUpNotesDTO.java ----
export interface InvoiceFollowUpNotesDTO {
  Message?: string;
  Code?: string;
}

// Request shape for AccountManagement/InvoiceFollowUp.
// Java's Api.followUpNotes() is @FormUrlEncoded — note the backend's own
// field names are misspelled ("StatuiId", "FolowUpDate"); they must be sent
// exactly like this or the backend won't bind them.
export interface InvoiceFollowUpRequest {
  InvoiceId: number;
  StatuiId: number;
  UserId: number;
  FolowUpDate: string;
  Notes: string;
}

// Request shape for AccountManagement/GetInvoicePdfById.
// Java's Api.getInvoicePdf() query params are UserId + lower-case "invoiceId".
export interface GetInvoicePdfParams {
  UserId: number;
  invoiceId: number;
}