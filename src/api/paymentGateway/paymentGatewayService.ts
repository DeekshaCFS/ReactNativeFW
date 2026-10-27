// src/api/paymentGateway/paymentGatewayService.ts
// Endpoints used by the Android app (URLConstant.PaymentGateway).
import apiClient from '../apiClient';
import type { AddUpdateOnlinePayment, PGDetailsDTO } from './paymentGateway.types';

/**
 * Source: URLConstant.PaymentGateway.POST_ONLINE_PAYMENT_DATA (Java)
 * Endpoint: POST OnlinePayment/Add-Update-OnlinePaymentLog
 * Logs successful payments (IsSuccess: true) and failed ones (IsSuccess: false), as Java does.
 */
export const postOnlinePaymentData = async (
  data?: Partial<AddUpdateOnlinePayment>,
): Promise<AddUpdateOnlinePayment> => {
  const response = await apiClient.post('OnlinePayment/Add-Update-OnlinePaymentLog', data);
  return response.data;
};

/**
 * Source: URLConstant.PaymentGateway.GET_PG_ACTIVATION_STATUS
 * Endpoint: GET OnlinePayment/GetPaymentGetwayDetails
 * Returns APIKey and SecretKey for the user. Call only when a payment needs them; do not cache.
 */
export const getPgActivationStatus = async (params?: Record<string, any>): Promise<PGDetailsDTO> => {
  const response = await apiClient.get('OnlinePayment/GetPaymentGetwayDetails', { params });
  return response.data;
};