// src/types/react-native-razorpay.d.ts
// react-native-razorpay ships no TypeScript declarations. Delete this file if a future
// version of the library includes its own types.
declare module 'react-native-razorpay' {
  export interface CheckoutOptions {
    key: string;
    amount: number; // paise
    currency?: string;
    name?: string;
    description?: string;
    order_id?: string;
    prefill?: { contact?: string; email?: string; name?: string };
    theme?: { color?: string };
    [key: string]: unknown;
  }

  export interface SuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  const RazorpayCheckout: {
    open(options: CheckoutOptions): Promise<SuccessResponse>;
  };
  export default RazorpayCheckout;
}