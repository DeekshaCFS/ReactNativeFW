// src/api/signUp/signUpService.ts

import apiClient from '../apiClient';
import type {
  OTP, OTPResultData, RegisterOwner, RegisterOwnerResultData,
  TouchlessTempRegistration, TouchlessTempRegistrationRequest,
} from './signUp.types';

/**
 * Source: URLConstant.SignUp.GET_OTP_REGISTER
 * Endpoint: POST SignUp/TouchlessTempRegistration
 */
export const getOtpRegister = async (
  data: TouchlessTempRegistrationRequest,
): Promise<TouchlessTempRegistration> => {
  const body = new URLSearchParams();
  body.append('EmailId', data.EmailId ?? '');
  body.append('ContactNo', data.ContactNo ?? '');
  body.append('CountryDetailsId', String(data.CountryDetailsId ?? ''));

  const response = await apiClient.post('SignUp/TouchlessTempRegistration', body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
};
/**
 * Source: URLConstant.SignUp.GET_OTP
 * Endpoint: POST SignUp/TechOrOwnerSignUpOtp
 */
export const getOtp = async (data?: Partial<OTPResultData>): Promise<OTP> => {
  const response = await apiClient.post('SignUp/TechOrOwnerSignUpOtp', data);
  return response.data;
};

/**
 * Source: URLConstant.SignUp.GET_REGISTER
 * Endpoint: POST SignUp/RegisterOwner
 */
export const getRegister = async (data?: Partial<RegisterOwnerResultData>): Promise<RegisterOwner> => {
  const response = await apiClient.post('SignUp/RegisterOwner', data);
  return response.data;
};
