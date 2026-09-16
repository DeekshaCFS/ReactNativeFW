// src/api/auth/loginService.ts
// Auto-generated from URLConstant.java (Login endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see login.types.ts
import apiClient from '../apiClient';
import type { ForgotPassword, LanguageList, RegisterOwner, RegisterOwnerResultData, RegisterUser, RegisterUserResultData, UserDetails, UserDetailsResultData,TouchlessLoginRequest, TouchlessLoginResponse } from './login.types';

/**
 * Source: URLConstant.Login.URL_REGISTER_TECH
 * Endpoint: POST Login/RegisterUser
 */
export const urlRegisterTech = async (data?: Partial<RegisterUserResultData>): Promise<RegisterUser> => {
  const response = await apiClient.post('Login/RegisterUser', data);
  return response.data;
};

/**
 * Source: URLConstant.Login.URL_REGISTER_OWNER
 * Endpoint: POST Login/RegisterOwner
 */
export const urlRegisterOwner = async (data?: Partial<RegisterOwnerResultData>): Promise<RegisterOwner> => {
  const response = await apiClient.post('Login/RegisterOwner', data);
  return response.data;
};

/**
 * Source: URLConstant.Login.FORGOT_PASSWORD
 * Endpoint: POST Login/ForgottPassword
 */
export const forgotPassword = async (data?: Partial<ForgotPassword>): Promise<ForgotPassword> => {
  const response = await apiClient.post('Login/ForgottPassword', data);
  return response.data;
};

/**
 * Source: URLConstant.Login.USER_PREFER_LANGUAGE
 * Endpoint: GET Login/UserPreferredLanguage
 */
export const userPreferLanguage = async (params?: Record<string, any>): Promise<LanguageList> => {
  const response = await apiClient.get('Login/UserPreferredLanguage', { params });
  return response.data;
};

/**
 * Source: URLConstant.Login.URL_LOGIN
 * Endpoint: POST Login/UserLoginMobile
 * Response DTO: FWUser (not UserDetails)
 */
export const urlLogin = async (data: TouchlessLoginRequest): Promise<TouchlessLoginResponse> => {
  const response = await apiClient.post('Login/UserLoginMobile', data);
  return response.data;
};
