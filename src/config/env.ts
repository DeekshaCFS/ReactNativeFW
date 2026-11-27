import Config from 'react-native-config';

export type AppEnv = 'uat' | 'prod';

const read = (key: string): string => (Config[key] ?? '').trim();
const flag = (key: string): boolean => read(key).toLowerCase() === 'true';

// Anything that is not an explicit APP_ENV=uat is treated as prod.
export const APP_ENV: AppEnv = read('APP_ENV') === 'uat' ? 'uat' : 'prod';
export const IS_PROD = APP_ENV === 'prod';

// Read a value only in UAT; in prod it is always empty.
const uatOnly = (key: string): string => (IS_PROD ? '' : read(key));

const requireUrl = (key: string): string => {
  const value = read(key).replace(/\/+$/, '');
  if (!value) throw new Error(`[env] ${key} is not set (APP_ENV=${APP_ENV}). Check .env.${APP_ENV}.`);
  if (IS_PROD && !value.startsWith('https://')) {
    throw new Error(`[env] ${key} must be https:// in prod, got "${value}".`);
  }
  return value;
};

export const API_BASE_URL = requireUrl('API_BASE_URL');   // e.g. http://192.169.3.8/API/api
export const WEB_BASE_URL = requireUrl('WEB_BASE_URL');   // e.g. http://192.169.3.8

export const FIREBASE_DB_URL =
  read('FIREBASE_DB_URL').replace(/\/+$/, '') || 'https://fieldwebrelease.firebaseio.com';

// ---- UAT-only switches (forced off in prod) ----
export const SHOW_QA_OTP = !IS_PROD && flag('SHOW_QA_OTP');
export const STATIC_PG_API_KEY = uatOnly('PG_STATIC_API_KEY');
export const STATIC_PG_SECRET_KEY = uatOnly('PG_STATIC_SECRET_KEY');
export const BIOMETRIC_ENROLL_WITHOUT_OTP = !IS_PROD && flag('BIOMETRIC_ENROLL_WITHOUT_OTP');

// ---- Per-environment values ----
export const GOOGLE_API_KEY = read('GOOGLE_API_KEY');
export const ANDROID_CERT_SHA1 = read('ANDROID_CERT_SHA1');