// src/api/paymentTransaction/paymentTransactionService.ts
// Auto-generated from URLConstant.java (PaymentTransaction endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see paymentTransaction.types.ts
import apiClient from '../apiClient';
import type { PaymentTransactionTypeDTO, PaymentTransactionTypeDTOResultData } from './paymentTransaction.types';

/**
 * Source: URLConstant.Accounts.TRANSACTION_TPYE
 * Endpoint: GET PaymentTransaction/GetPaymentTransactionTypeList
 */
export const transactionTpye = async (params?: Record<string, any>): Promise<PaymentTransactionTypeDTO> => {
  const response = await apiClient.get('PaymentTransaction/GetPaymentTransactionTypeList', { params });
  return response.data;
};
