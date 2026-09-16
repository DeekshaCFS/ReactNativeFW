// src/api/paymentTransaction/paymentTransaction.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each PaymentTransaction endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/Account/PaymentTransactionTypeDTO.java ----
export interface PaymentTransactionTypeDTO {
  ResultData?: PaymentTransactionTypeDTOResultData[];
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface PaymentTransactionTypeDTOResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  UserId?: number;
  IsActive?: boolean;
  PaymentTransactionTypeDescription?: string;
  PaymentTransactionTypeName?: string;
  PaymentTransactionTypeId?: number;
}
