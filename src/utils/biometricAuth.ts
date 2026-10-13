// src/utils/biometricAuth.ts
//
// Quick login without OTP: Fingerprint / Face (device PIN as fallback) -- port of the Java
// LoginTouchlessActivity / WelcomeActivity biometric flow.
//   - Java keeps a list of "biometric accounts" (the mobile/email ids that enabled it on this
//     device) and gates login behind BiometricPrompt (BIOMETRIC_WEAK | DEVICE_CREDENTIAL, so face
//     and the device PIN work). Same here: accounts live in AsyncStorage, the prompt is the native
//     FWBiometric module (android/.../BiometricAuthModule.kt).
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_ACCOUNTS = 'bio_accounts';

const { FWBiometric } = NativeModules as {
  FWBiometric?: {
    isAvailable(): Promise<boolean>;
    authenticate(title: string, subtitle: string, description: string): Promise<boolean>;
  };
};

export const normalizeId = (id: string) => id.trim().toLowerCase();

/** Java BiometricAuthHelper.isAuthenticationAvailable(). */
export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    return (await FWBiometric?.isAvailable()) ?? false;
  } catch {
    return false;
  }
};

/** Java authenticateBiometric(): resolves true only when the user authenticates. */
export const promptBiometric = async (description: string): Promise<boolean> => {
  try {
    return (await FWBiometric?.authenticate(
      'Biometric Login',
      'Use your fingerprint or face to continue',
      description,
    )) ?? false;
  } catch {
    return false; // cancelled or error
  }
};

export type AccountMethods = { biometric: boolean; mpin: boolean }; // mpin: unused, kept for stored data
type Accounts = Record<string, AccountMethods>;

const loadAccounts = async (): Promise<Accounts> => {
  try {
    const raw = await AsyncStorage.getItem(KEY_ACCOUNTS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveAccounts = async (accounts: Accounts) => {
  try {
    await AsyncStorage.setItem(KEY_ACCOUNTS, JSON.stringify(accounts));
  } catch {
    // ignore storage failures
  }
};

export const getAccountMethods = async (id: string): Promise<AccountMethods> => {
  const a = (await loadAccounts())[normalizeId(id)];
  return { biometric: !!a?.biometric, mpin: !!a?.mpin };
};

/** Java isContactNumOREmailIdExists(). */
export const isAccountEnabled = async (id: string) => {
  const m = await getAccountMethods(id);
  return m.biometric || m.mpin;
};

const patchAccount = async (id: string, patch: Partial<AccountMethods>) => {
  const accounts = await loadAccounts();
  const key = normalizeId(id);
  const current = accounts[key] ?? { biometric: false, mpin: false };
  const next = { ...current, ...patch };
  if (!next.biometric && !next.mpin) delete accounts[key];
  else accounts[key] = next;
  await saveAccounts(accounts);
};

/** Java addBiometricAccount() for the Fingerprint / Face option. */
export const addBiometricAccount = (id: string) => patchAccount(id, { biometric: true });

/** Forget this account's biometric login on this device. */
export const disableAccount = (id: string) => patchAccount(id, { biometric: false, mpin: false });
