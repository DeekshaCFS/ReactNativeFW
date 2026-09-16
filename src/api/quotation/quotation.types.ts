// src/api/quotation/quotation.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each Quotation endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/Account/QuotationListDTO.java ----
export interface QuotationListDTO {
  ResultData?: QuotationListDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface QuotationListDTOResultData {
  QuoteServiceList?: QuotationListDTOQuoteServiceList[];
  QuoteTaxList?: QuotationListDTOQuoteTaxList[];
  QuoteItemList?: QuotationListDTOQuoteItemList[];
  Status?: QuotationListDTOStatus;
  Customer?: QuotationListDTOCustomer;
  SLAAttachmentFile?: QuotationListDTOSLAAttachmentFile;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  StatusId?: number;
  CustomerId?: number;
  GrandTotalAmount?: number;
  TotalAmount?: number;
  TermCondition?: string;
  ValidityDate?: string;
  QuoteTime?: string;
  QuoteName?: string;
  Id?: number;
}

export interface QuotationListDTOQuoteServiceList {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Price?: number;
  ServiceId?: number;
  QuotationId?: number;
  Id?: number;
}

export interface QuotationListDTOQuoteTaxList {
  UpdatedDate?: string;
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

export interface QuotationListDTOQuoteItemList {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  TotalPrice?: number;
  UnitPrice?: number;
  Quantity?: number;
  ItemId?: number;
  QuotationId?: number;
  Id?: number;
}

export interface QuotationListDTOStatus {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  ModuleId?: number;
  StatusName?: string;
  Id?: number;
}

export interface QuotationListDTOCustomer {
  LocationList?: QuotationListDTOLocationList;
  Instructions?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  OwnerId?: number;
  UserId?: number;
  IsActive?: boolean;
  LocationId?: number;
  EmailId?: string;
  MobileNumber?: string;
  CustomerName?: string;
  CustomerDetailsid?: number;
}

export interface QuotationListDTOLocationList {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  PinCode?: string;
  Address?: string;
  Description?: string;
  Longitude?: string;
  latitude?: string;
  Name?: string;
  Id?: number;
}

export interface QuotationListDTOSLAAttachmentFile {
  InputStream?: QuotationListDTOInputStream;
  FileName?: string;
  ContentType?: string;
  ContentLength?: number;
}

export interface QuotationListDTOInputStream {
  WriteTimeout?: number;
  ReadTimeout?: number;
  Position?: number;
  Length?: number;
  CanWrite?: boolean;
  CanTimeout?: boolean;
  CanSeek?: boolean;
  CanRead?: boolean;
}

// ---- from DTO/Account/SaveQuotationDTO.java ----
export interface SaveQuotationDTO {
  SLAAttachmentFileType?: string;
  SLAUrl?: string;
  QRUrl?: string;
  ownerAccountDetails?: SaveQuotationDTOOwnerAccountDetails;
  lstOwnerDynamicField?: SaveQuotationDTOLstOwnerDynamicField[];
  IsOutSideIndia?: boolean;
  CountryCode?: string;
  PaymentTransactionTypeId?: number;
  Self_Quot_Creator_Id?: number;
  Is_Self_Quot_Create?: boolean;
  Self_Inv_Creator_Id?: number;
  Is_Self_Inv_Create?: boolean;
  ReceivedAmount?: number;
  CountryDetailsId?: number;
  CurrencySymbol?: string;
  QuoteServiceList?: SaveQuotationDTOQuoteServiceList[];
  QuoteTaxList?: SaveQuotationDTOQuoteTaxList[];
  QuoteItemList?: SaveQuotationDTOQuoteItemList[];
  Customer?: SaveQuotationDTOCustomer;
  SLAAttachmentFile?: SaveQuotationDTOSLAAttachmentFile;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  StatusId?: number;
  CustomerId?: number;
  GrandTotalAmount?: number;
  TotalAmount?: number;
  TermCondition?: string;
  SLAAttachmentByte?: string;
  SLAAttachmentBase64?: string;
  SLAAttachmentName?: string;
  ValidityDate?: string;
  QuoteTime?: string;
  ExtraAmount?: number;
  ExtraItem?: string;
  QuoteName?: string;
  Id?: number;
}

export interface SaveQuotationDTOOwnerAccountDetails {
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

export interface SaveQuotationDTOLstOwnerDynamicField {
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

export interface SaveQuotationDTOQuoteServiceList {
  Quantity?: number;
  TotalPrice?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Price?: number;
  ServiceName?: string;
  ServiceId?: number;
  QuotationId?: number;
  Id?: number;
}

export interface SaveQuotationDTOQuoteTaxList {
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

export interface SaveQuotationDTOQuoteItemList {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  TotalPrice?: number;
  UnitPrice?: number;
  Quantity?: number;
  ItemName?: string;
  ItemId?: number;
  QuotationId?: number;
  Id?: number;
}

export interface SaveQuotationDTOCustomer {
  LocationList?: SaveQuotationDTOLocationList;
  CustomerTagId?: number;
  CountryDetailsId?: number;
  ModelNumber?: string;
  BrandName?: string;
  Instructions?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  OwnerId?: number;
  UserId?: number;
  IsActive?: boolean;
  LocationId?: number;
  EmailId?: string;
  MobileNumber?: string;
  CustomerName?: string;
  CustomerDetailsid?: number;
}

export interface SaveQuotationDTOLocationList {
  BuildingNumber?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  PinCode?: string;
  Address?: string;
  Description?: string;
  Longitude?: string;
  latitude?: string;
  Name?: string;
  Id?: number;
}

export interface SaveQuotationDTOSLAAttachmentFile {
  InputStream?: SaveQuotationDTOInputStream;
}

export interface SaveQuotationDTOInputStream {
  WriteTimeout?: number;
  ReadTimeout?: number;
  Position?: number;
}

// ---- from DTO/Account/QuotationDetailsDTO.java ----
export interface QuotationDetailsDTO {
  ResultData?: QuotationDetailsDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface QuotationDetailsDTOResultData {
  StatusName?: string;
  CustomerName?: string;
  QuoteServiceList?: QuotationDetailsDTOQuoteServiceList[];
  QuoteTaxList?: QuotationDetailsDTOQuoteTaxList[];
  QuoteItemList?: QuotationDetailsDTOQuoteItemList[];
  Status?: QuotationDetailsDTOStatus;
  Customer?: QuotationDetailsDTOCustomer;
  SLAAttachmentFile?: QuotationDetailsDTOSLAAttachmentFile;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  StatusId?: number;
  CustomerId?: number;
  GrandTotalAmount?: number;
  TotalAmount?: number;
  TermCondition?: string;
  SLAAttachment?: string;
  ValidityDate?: string;
  QuoteTime?: string;
  ExtraAmount?: number;
  ExtraItem?: string;
  QuoteName?: string;
  QuoteCode?: string;
  Id?: number;
}

export interface QuotationDetailsDTOQuoteServiceList {
  Quantity?: number;
  TotalPrice?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Price?: number;
  ServiceName?: string;
  ServiceId?: number;
  QuotationId?: number;
  Id?: number;
}

export interface QuotationDetailsDTOQuoteTaxList {
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

export interface QuotationDetailsDTOQuoteItemList {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  TotalPrice?: number;
  UnitPrice?: number;
  Quantity?: number;
  ItemName?: string;
  ItemId?: number;
  QuotationId?: number;
  Id?: number;
}

export interface QuotationDetailsDTOStatus {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  ModuleId?: number;
  StatusName?: string;
  Id?: number;
}

export interface QuotationDetailsDTOCustomer {
  LocationList?: QuotationDetailsDTOLocationList;
  CustomerTagId?: number;
  CountryDetailsId?: number;
  ModelNumber?: string;
  BrandName?: string;
  Instructions?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  OwnerId?: number;
  UserId?: number;
  IsActive?: boolean;
  LocationId?: number;
  EmailId?: string;
  MobileNumber?: string;
  CustomerName?: string;
  CustomerDetailsid?: number;
}

export interface QuotationDetailsDTOLocationList {
  BuildingNumber?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  PinCode?: string;
  Address?: string;
  Description?: string;
  Longitude?: string;
  latitude?: string;
  Name?: string;
  Id?: number;
  State?: string;
  City?: string;
}

export interface QuotationDetailsDTOSLAAttachmentFile {
  InputStream?: QuotationDetailsDTOInputStream;
  FileName?: string;
  ContentType?: string;
  ContentLength?: number;
}

export interface QuotationDetailsDTOInputStream {
  WriteTimeout?: number;
  ReadTimeout?: number;
  Position?: number;
  Length?: number;
  CanWrite?: boolean;
  CanTimeout?: boolean;
  CanSeek?: boolean;
  CanRead?: boolean;
}

// ---- from DTO/Account/TaxDetails.java ----
export interface TaxDetails {
  ResultData?: TaxDetailsResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface TaxDetailsResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  TaxPercentage?: number;
  TaxName?: string;
  Id?: number;
}

// ---- from DTO/Account/DownloadQuotationPdfDTO.java ----
export interface DownloadQuotationPdfDTO {
  ResultData?: DownloadQuotationPdfDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface DownloadQuotationPdfDTOResultData {
  QuotationPdfPath?: string;
  QuotationId?: number;
}

// ---- from DTO/Account/DeleteQuotationDetailsDTO.java ----
export interface DeleteQuotationDetailsDTO {
  Message?: string;
  Code?: string;
}

// ---- from DTO/Account/UpdateQuotationStatusDTO.java ----
export interface UpdateQuotationStatusDTO {
  Message?: string;
  Code?: string;
}

// ---- from DTO/Account/QuoteBindListDTO.java ----
export interface QuoteBindListDTO {
  ResultData?: QuoteBindListDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface QuoteBindListDTOResultData {
  QuoteName?: string;
  QuoteCode?: string;
  Id?: number;
}

// ---- from DTO/Account/SaveQuotationsNonOwnerDTO.java ----
export interface SaveQuotationsNonOwnerDTO {
  SLAAttachmentFileType?: string;
  SLAUrl?: string;
  QRUrl?: string;
  ownerAccountDetails?: SaveQuotationsNonOwnerDTOOwnerAccountDetails;
  lstOwnerDynamicField?: SaveQuotationsNonOwnerDTOLstOwnerDynamicField[];
  IsOutSideIndia?: boolean;
  CountryCode?: string;
  PaymentTransactionTypeId?: number;
  Self_Quot_Creator_Id?: number;
  Is_Self_Quot_Create?: boolean;
  Self_Inv_Creator_Id?: number;
  Is_Self_Inv_Create?: boolean;
  ReceivedAmount?: number;
  CountryDetailsId?: number;
  CurrencySymbol?: string;
  QuoteServiceList?: SaveQuotationsNonOwnerDTOQuoteServiceList[];
  QuoteTaxList?: SaveQuotationsNonOwnerDTOQuoteTaxList[];
  QuoteItemList?: SaveQuotationsNonOwnerDTOQuoteItemList[];
  Customer?: SaveQuotationsNonOwnerDTOCustomer;
  SLAAttachmentFile?: SaveQuotationsNonOwnerDTOSLAAttachmentFile;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  StatusId?: number;
  CustomerId?: number;
  GrandTotalAmount?: number;
  TotalAmount?: number;
  TermCondition?: string;
  SLAAttachmentByte?: string;
  SLAAttachmentBase64?: string;
  SLAAttachmentName?: string;
  ValidityDate?: string;
  QuoteTime?: string;
  ExtraAmount?: number;
  ExtraItem?: string;
  QuoteName?: string;
  Id?: number;
}

export interface SaveQuotationsNonOwnerDTOOwnerAccountDetails {
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

export interface SaveQuotationsNonOwnerDTOLstOwnerDynamicField {
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

export interface SaveQuotationsNonOwnerDTOQuoteServiceList {
  Quantity?: number;
  TotalPrice?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Price?: number;
  ServiceName?: string;
  ServiceId?: number;
  QuotationId?: number;
  Id?: number;
}

export interface SaveQuotationsNonOwnerDTOQuoteTaxList {
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

export interface SaveQuotationsNonOwnerDTOQuoteItemList {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  TotalPrice?: number;
  UnitPrice?: number;
  Quantity?: number;
  ItemName?: string;
  ItemId?: number;
  QuotationId?: number;
  Id?: number;
}

export interface SaveQuotationsNonOwnerDTOCustomer {
  LocationList?: SaveQuotationsNonOwnerDTOLocationList;
  CustomerTagId?: number;
  CountryDetailsId?: number;
  ModelNumber?: string;
  BrandName?: string;
  Instructions?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  OwnerId?: number;
  UserId?: number;
  IsActive?: boolean;
  LocationId?: number;
  EmailId?: string;
  MobileNumber?: string;
  CustomerName?: string;
  CustomerDetailsid?: number;
}

export interface SaveQuotationsNonOwnerDTOLocationList {
  BuildingNumber?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  PinCode?: string;
  Address?: string;
  Description?: string;
  Longitude?: string;
  latitude?: string;
  Name?: string;
  Id?: number;
}

export interface SaveQuotationsNonOwnerDTOSLAAttachmentFile {
  InputStream?: SaveQuotationsNonOwnerDTOInputStream;
}

export interface SaveQuotationsNonOwnerDTOInputStream {
  WriteTimeout?: number;
  ReadTimeout?: number;
  Position?: number;
}

// ---- from DTO/Account/SelfInvoiceCreateDTO.java ----
export interface SelfInvoiceCreateDTO {
  CountryCode?: string;
  PaymentTransactionTypeId?: number;
  Self_Quot_Creator_Id?: number;
  Is_Self_Quot_Create?: boolean;
  Self_Inv_Creator_Id?: number;
  Is_Self_Inv_Create?: boolean;
  ReceivedAmount?: number;
  CountryDetailsId?: number;
  CurrencySymbol?: string;
  QuoteServiceList?: SelfInvoiceCreateDTOQuoteServiceList[];
  QuoteTaxList?: SelfInvoiceCreateDTOQuoteTaxList[];
  QuoteItemList?: SelfInvoiceCreateDTOQuoteItemList[];
  Customer?: SelfInvoiceCreateDTOCustomer;
  SLAAttachmentFile?: SelfInvoiceCreateDTOSLAAttachmentFile;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  StatusId?: number;
  CustomerId?: number;
  GrandTotalAmount?: number;
  TotalAmount?: number;
  TermCondition?: string;
  ValidityDate?: string;
  QuoteTime?: string;
  ExtraAmount?: number;
  ExtraItem?: string;
  QuoteName?: string;
  Id?: number;
}

export interface SelfInvoiceCreateDTOQuoteServiceList {
  Quantity?: number;
  TotalPrice?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Price?: number;
  ServiceName?: string;
  ServiceId?: number;
  QuotationId?: number;
  Id?: number;
}

export interface SelfInvoiceCreateDTOQuoteTaxList {
  UpdatedDate?: string;
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

export interface SelfInvoiceCreateDTOQuoteItemList {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  TotalPrice?: number;
  UnitPrice?: number;
  Quantity?: number;
  ItemName?: string;
  ItemId?: number;
  QuotationId?: number;
  Id?: number;
}

export interface SelfInvoiceCreateDTOCustomer {
  LocationList?: SelfInvoiceCreateDTOLocationList;
  CustomerTagId?: number;
  CountryDetailsId?: number;
  ModelNumber?: string;
  BrandName?: string;
  Instructions?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  OwnerId?: number;
  UserId?: number;
  IsActive?: boolean;
  LocationId?: number;
  EmailId?: string;
  MobileNumber?: string;
  CustomerName?: string;
  CustomerDetailsid?: number;
}

export interface SelfInvoiceCreateDTOLocationList {
  BuildingNumber?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  PinCode?: string;
  Address?: string;
  Description?: string;
  Longitude?: string;
  latitude?: string;
  Name?: string;
  Id?: number;
}

export interface SelfInvoiceCreateDTOSLAAttachmentFile {
  InputStream?: SelfInvoiceCreateDTOInputStream;
}

export interface SelfInvoiceCreateDTOInputStream {
  WriteTimeout?: number;
  ReadTimeout?: number;
  Position?: number;
}

// ---- from DTO/CRM/CRMQuotationDTO.java ----
export interface CRMQuotationDTO {
  ResultData?: CRMQuotationDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface CRMQuotationDTOResultData {
  StatusName?: string;
  CustomerName?: string;
  QuoteServiceList?: CRMQuotationDTOQuoteServiceList[];
  QuoteTaxList?: CRMQuotationDTOQuoteTaxList[];
  QuoteItemList?: CRMQuotationDTOQuoteItemList[];
  Status?: CRMQuotationDTOStatus;
  Customer?: CRMQuotationDTOCustomer;
  SLAAttachmentFile?: CRMQuotationDTOSLAAttachmentFile;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  StatusId?: number;
  CustomerId?: number;
  GrandTotalAmount?: number;
  TotalAmount?: number;
  TermCondition?: string;
  ValidityDate?: string;
  QuoteTime?: string;
  ExtraAmount?: number;
  ExtraItem?: string;
  QuoteName?: string;
  QuoteCode?: string;
  Id?: number;
}

export interface CRMQuotationDTOQuoteServiceList {
  Quantity?: number;
  TotalPrice?: number;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  Price?: number;
  ServiceName?: string;
  ServiceId?: number;
  QuotationId?: number;
  Id?: number;
}

export interface CRMQuotationDTOQuoteTaxList {
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

export interface CRMQuotationDTOQuoteItemList {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  TotalPrice?: number;
  UnitPrice?: number;
  Quantity?: number;
  ItemName?: string;
  ItemId?: number;
  QuotationId?: number;
  Id?: number;
}

export interface CRMQuotationDTOStatus {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  ModuleId?: number;
  StatusName?: string;
  Id?: number;
}

export interface CRMQuotationDTOCustomer {
  LocationList?: CRMQuotationDTOLocationList;
  CustomerTagId?: number;
  CountryDetailsId?: number;
  ModelNumber?: string;
  BrandName?: string;
  Instructions?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  OwnerId?: number;
  UserId?: number;
  IsActive?: boolean;
  LocationId?: number;
  EmailId?: string;
  MobileNumber?: string;
  CustomerName?: string;
  CustomerDetailsid?: number;
}

export interface CRMQuotationDTOLocationList {
  BuildingNumber?: string;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  IsActive?: boolean;
  PinCode?: string;
  Address?: string;
  Description?: string;
  Longitude?: string;
  latitude?: string;
  Name?: string;
  Id?: number;
}

export interface CRMQuotationDTOSLAAttachmentFile {
  InputStream?: CRMQuotationDTOInputStream;
  FileName?: string;
  ContentType?: string;
  ContentLength?: number;
}

export interface CRMQuotationDTOInputStream {
  WriteTimeout?: number;
  ReadTimeout?: number;
  Position?: number;
  Length?: number;
  CanWrite?: boolean;
  CanTimeout?: boolean;
  CanSeek?: boolean;
  CanRead?: boolean;
}
