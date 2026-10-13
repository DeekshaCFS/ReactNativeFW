// src/utils/completeLogin.ts
//
// Shared tail of every successful login (OTP verify, biometric/MPIN unlock, post-signup setup):
// persists the session, loads the profile name/contact, and tells RootNavigator to swap to the app.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authEvents, AUTH_CHANGED } from './authEvents';
import { getProfileDetails } from '../api/users/usersService';
import { urlLogin } from '../api/auth/loginService';
import { getAndroidId } from './deviceId';
import { setCurrentUserId, persistLoggedInUserId } from '../state/session';

export type LoginSession = {
  userId: number;
  token: string;
  role: string;
  ownerId: number;
  mobile: string;
};

export const completeLogin = async (s: LoginSession) => {
  setCurrentUserId(s.userId);
  await persistLoggedInUserId(s.userId);
  await AsyncStorage.multiSet([
    ['uid',      String(s.userId)],
    ['token',    s.token],
    ['role',     s.role],
    ['username', s.mobile],
    ['owner_id', String(s.ownerId)],
  ]);
  authEvents.emit(AUTH_CHANGED);
  try {
    const response = await getProfileDetails({ UserId: s.userId });
    const profile = response?.ResultData;
    if (profile) {
      const fullName    = `${profile.FirstName ?? ''} ${profile.LastName ?? ''}`.trim();
      const contact     = profile.ContactNo ?? s.mobile;
      const countryCode = profile.CountryCode || (contact.length === 10 ? '+91' : '+1');
      await AsyncStorage.multiSet([
        ['name', fullName], ['contact', contact], ['country_code', countryCode],
      ]);
    }
  } catch {
    // profile is re-fetched by the app; don't fail the login over it
  }
};

// Java doTouchlessBioMetricLogin (LoginTouchlessActivity.userBioMetricAuth): same request as the OTP
// login, but the token is used straight away -- no OTP screen. Returns null when the server
// doesn't know the account (caller sends the user to Signup).
// TODO: confirm the endpoint -- the Java Api.doTouchlessBioMetricLogin URL isn't in the local
// FW_Android copy, so this reuses Login/UserLoginMobile.
export const fetchBiometricSession = async (loginId: string): Promise<LoginSession | null> => {
  const androidId = await getAndroidId();
  const response = await urlLogin({
    UserName: loginId, Password: '', AndroidID: androidId, UserPreferredLanguage: 'en',
  });
  const r = response?.ResultData;
  if (response?.Code !== '200' || !r?.Token) return null;
  return {
    userId: r.UserID ?? 0, token: r.Token, role: r.UserGroupName ?? '',
    ownerId: r.OwnerId ?? 0, mobile: loginId,
  };
};
