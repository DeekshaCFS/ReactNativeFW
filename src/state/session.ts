import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type UserDetailsResultData,
  type UserDetailsTaskConfigurationOBJ,
} from '../api/users/users.types';
import {HARDCODED_USER_ID} from '../config/hardcodedUser';

const STORAGE_KEY_USER_TOKEN = 'userToken';
const STORAGE_KEY_USER_ID = 'userId';

export type SessionUserProfile = {
  details: UserDetailsResultData | null;
  mobileOrEmail: string;
  userFirstName: string;
  teleCmiModuleFlag: string;
  taskConfiguration: {
    isStateEnable: boolean;
    isCityEnable: boolean;
    isPincodeEnable: boolean;
    isTaskTagEnable: boolean;
  };
};

let currentPreferredLanguage = 'English';
let currentUserId = HARDCODED_USER_ID;
let currentCountryDetailsId = 1;
let currentUserProfile: SessionUserProfile = {
  details: null,
  mobileOrEmail: '',
  userFirstName: '',
  teleCmiModuleFlag: 'false',
  taskConfiguration: {
    isStateEnable: false,
    isCityEnable: false,
    isPincodeEnable: false,
    isTaskTagEnable: false,
  },
};

const toBoolean = (value: boolean | string | null | undefined) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.trim().toLowerCase() === 'true';
  }

  return false;
};

const getSafeString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const normalizeTaskConfiguration = (
  taskConfigurationOBJ: UserDetailsTaskConfigurationOBJ | null | undefined,
) => ({
  isStateEnable: toBoolean(taskConfigurationOBJ?.IsStateEnable),
  isCityEnable: toBoolean(taskConfigurationOBJ?.IsCityEnable),
  isPincodeEnable: toBoolean(taskConfigurationOBJ?.IsPincodeEnable),
  isTaskTagEnable: toBoolean(taskConfigurationOBJ?.IsTaskTagEnable),
});

export const setCurrentUserId = (userId: number | null | undefined) => {
  const parsedUserId = Number(userId);
  if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
    return;
  }

  currentUserId = parsedUserId;
};

export const getCurrentUserId = () => currentUserId;

export const setCurrentPreferredLanguage = (language: string | null | undefined) => {
  const trimmedLanguage = language?.trim();
  if (!trimmedLanguage) {
    return;
  }

  currentPreferredLanguage = trimmedLanguage;
};

export const getCurrentPreferredLanguage = () => currentPreferredLanguage;

export const setCurrentCountryDetailsId = (
  countryDetailsId: number | null | undefined,
) => {
  const parsedCountryDetailsId = Number(countryDetailsId);
  if (!Number.isFinite(parsedCountryDetailsId) || parsedCountryDetailsId <= 0) {
    return;
  }

  currentCountryDetailsId = parsedCountryDetailsId;
};

// 1 = India, anything else = NRI (matches AddTechListAdapter.java country check).
export const getCurrentCountryDetailsId = () => currentCountryDetailsId;

export const isIndiaCountryDetailsId = () => currentCountryDetailsId === 1;

export const setCurrentUserProfile = (userDetails: UserDetailsResultData | null | undefined) => {
  const details = userDetails ?? null;
  const contactNo = getSafeString(details?.ContactNo);
  const email = getSafeString(details?.Email);
  const firstName = getSafeString(details?.FirstName);

  currentUserProfile = {
    details,
    mobileOrEmail: contactNo || email,
    userFirstName: firstName,
    teleCmiModuleFlag: toBoolean(details?.IsTeleCmiEnabled) ? 'true' : 'false',
    taskConfiguration: normalizeTaskConfiguration(details?.TaskConfigurationOBJ),
  };
};

export const getCurrentUserProfile = () => currentUserProfile;

export const clearCurrentUserId = () => {
  currentUserId = HARDCODED_USER_ID;
  currentCountryDetailsId = 1;
  currentUserProfile = {
    details: null,
    mobileOrEmail: '',
    userFirstName: '',
    teleCmiModuleFlag: 'false',
    taskConfiguration: {
      isStateEnable: false,
      isCityEnable: false,
      isPincodeEnable: false,
      isTaskTagEnable: false,
    },
  };
};

export const persistLoggedInUserId = async (
  userId: number | null | undefined,
) => {
  const parsedUserId = Number(userId);
  if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
    return;
  }

  try {
    await AsyncStorage.setItem(STORAGE_KEY_USER_ID, String(parsedUserId));
  } catch {
    // ignore storage failures
  }
};

export type RestoredSession = {
  userId: number;
  token: string;
};

export const restoreSavedSession =
  async (): Promise<RestoredSession | null> => {
    try {
      const [token, savedUserId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_USER_TOKEN),
        AsyncStorage.getItem(STORAGE_KEY_USER_ID),
      ]);

      const parsedUserId = Number(savedUserId);
      if (!token || !Number.isFinite(parsedUserId) || parsedUserId <= 0) {
        return null;
      }

      currentUserId = parsedUserId;
      return {userId: parsedUserId, token};
    } catch {
      return null;
    }
  };

export const logoutAndClearSession = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEY_USER_TOKEN,
      STORAGE_KEY_USER_ID,
    ]);
  } catch {
    // ignore storage failures
  }
  clearCurrentUserId();
};