// src/payments/razorpayCheckout.ts
// Mirrors Java PaymentActivity: fetch keys -> create order (Razorpay Orders API, Basic auth)
// -> open Checkout -> return success / cancelled / failed.
// The Razorpay secret stays inside this function and is never stored or logged.
import axios from 'axios';
import RazorpayCheckout from 'react-native-razorpay';
import { getPgActivationStatus } from '../api/paymentGateway/paymentGatewayService';
import { DEV_PG_KEYS } from './devPgKeys';

const RAZORPAY_ORDERS_URL = 'https://api.razorpay.com/v1/orders';
const PAYMENT_CANCELED = 0; // Java Checkout.PAYMENT_CANCELED; confirm against the react-native-razorpay README

export interface GatewayPaymentResult {
  paymentId: string;
  orderId: string;
  signature: string;
}

export type GatewayOutcome =
  | { status: 'success'; result: GatewayPaymentResult }
  | { status: 'cancelled' }
  | { status: 'failed'; orderId?: string; message: string; raw: string };

export const runRazorpayCheckout = async (params: {
  taskId: number;
  userId: number;
  amountRupees: number;
  description: string;
  contact: string;
  appName?: string; // Java used "Hansgrohee"
}): Promise<GatewayOutcome> => {
  // 1) Keys. Java getPG_ActivationStatus() reads the same fields.
  const pg = __DEV__ && DEV_PG_KEYS
    ? { ResultData: DEV_PG_KEYS }
    : await getPgActivationStatus({ UserId: params.userId });

  const keyId = pg.ResultData?.APIKey;
  const keySecret = pg.ResultData?.SecretKey;
  if (!keyId || !keySecret) {
    throw new Error('Online payment is not configured for this account.');
  }

  const amountPaise = Math.round(params.amountRupees * 100);

  // 2) Order. Java getGenerateOrderID(): POST orders with Basic auth.
  let orderId: string;
  try {
    const res = await axios.post(
      RAZORPAY_ORDERS_URL,
      { amount: amountPaise, currency: 'INR', receipt: `receipt_${Date.now()}` },
      {
        // axios builds the Basic auth header itself, so btoa is not needed here.
        auth: { username: keyId, password: keySecret },
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      },
    );
    orderId = res.data?.id;
    if (!orderId) throw new Error('Order creation failed');
  } catch (err: any) {
    // Do not include the request config here: it carries the auth header.
    throw new Error(err?.response?.data?.error?.description || 'Order creation failed');
  }

  // 3) Checkout. Java startPayment().
  try {
    const data = await RazorpayCheckout.open({
      key: keyId,
      amount: amountPaise,
      currency: 'INR',
      name: params.appName ?? 'Hansgrohee',
      description: params.description,
      order_id: orderId,
      prefill: { contact: params.contact },
    });

    return {
      status: 'success',
      result: {
        paymentId: data.razorpay_payment_id,
        orderId: data.razorpay_order_id,
        signature: data.razorpay_signature,
      },
    };
  } catch (err: any) {
    if (err?.code === PAYMENT_CANCELED) {
      return { status: 'cancelled' };
    }
    return {
      status: 'failed',
      orderId,
      message: err?.description || err?.error?.description || err?.message || 'Payment failed',
      raw: JSON.stringify(err ?? {}),
    };
  }
};