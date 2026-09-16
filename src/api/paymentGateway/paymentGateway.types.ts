// src/api/paymentGateway/paymentGateway.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each PaymentGateWay endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/OnlinePayment/AddUpdateOnlinePayment.java ----
export interface AddUpdateOnlinePayment {
  ResultData?: string;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
  UserId?: number;
  IsSuccess?: boolean;
  UserContact?: string;
  Response?: string;
  Signature?: string;
  OrderId?: string;
  PaymentId?: string;
  Amount?: number;
  TaskId?: number;
  OnlinePaymentLogId?: number;
}

// ---- from DTO/OnlinePayment/PGDetailsDTO.java ----
export interface PGDetailsDTO {
  ResultData?: PGDetailsDTOResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface PGDetailsDTOResultData {
  IsActive?: boolean;
  PaymentGatewayName?: string;
  UserId?: number;
  LoginId?: string;
  SecretKey?: string;
  APIKey?: string;
  PaymentGetwayId?: number;
}
