// src/api/paymentGateway/paymentGatewayService.ts
// Auto-generated from URLConstant.java (PaymentGateWay endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see paymentGateway.types.ts
import apiClient from '../apiClient';
import type { AddUpdateOnlinePayment, PGDetailsDTO, PGDetailsDTOResultData } from './paymentGateway.types';

/**
 * Source: URLConstant.PaymentGateway.POST_ONLINE_PAYMENT_DATA
 * Endpoint: POST OnlinePayment/Add-Update-OnlinePaymentLog
 */
export const postOnlinePaymentData = async (data?: Partial<AddUpdateOnlinePayment>): Promise<AddUpdateOnlinePayment> => {
  const response = await apiClient.post('OnlinePayment/Add-Update-OnlinePaymentLog', data);
  return response.data;
};

/**
 * Source: URLConstant.PaymentGateway.GET_PG_ACTIVATION_STATUS
 * Endpoint: GET OnlinePayment/GetPaymentGetwayDetails
 */
export const getPgActivationStatus = async (params?: Record<string, any>): Promise<PGDetailsDTO> => {
  const response = await apiClient.get('OnlinePayment/GetPaymentGetwayDetails', { params });
  return response.data;
};
