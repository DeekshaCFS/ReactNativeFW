// src/config/qa.ts
//
// Java's QA build shows the OTP in a toast ("OTP IS::<otp>") right after the OTP is issued: from
// LoginTouchlessActivity (login) and again from VerifyOTPActivity (OTP screen). Turn this off for
// a production build.
export const SHOW_QA_OTP = true;
