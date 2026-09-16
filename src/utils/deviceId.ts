// src/utils/deviceId.ts
import DeviceInfo from 'react-native-device-info';

// Mirrors legacy CommonFunction.getUniqueDeviceID() (Settings.Secure.ANDROID_ID).
// Swap the implementation here if you already have a device-id util elsewhere in the app.
export const getAndroidId = async (): Promise<string> => {
  try {
    return await DeviceInfo.getUniqueId();
  } catch {
    return 'ANDROID';
  }
};