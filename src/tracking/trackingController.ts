// src/tracking/trackingController.ts
//
// Task Acceptance tracking. Replaces the Java app's task alarm:
//   - setupAlarm(120000) in TaskDialogNew / MainTaskFragmentNew on accept  -> startTaskTracking()
//   - cancelAlarm() in AlertDialog on check-out                            -> stopTaskTracking()
// The native TrackingForegroundService owns the timing; the JS side (trackingHeadlessTask.ts) posts the data.

import { NativeModules, Platform, PermissionsAndroid } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { requestLocationPermission } from '../utils/locationPermision';

export type TrackingNative = {
  start(userId: string, taskId: number): Promise<boolean>;
  stop(): Promise<boolean>;
  reportLocation(timestampMs: string, latitude: number, longitude: number): Promise<boolean>;
};

// Android only (TrackingModule.kt). iOS has no equivalent yet.
export const trackingNative: TrackingNative | undefined = NativeModules.FWTracking;

/** Best effort: tracking still runs in the foreground when these are refused, so a denial is not an error. */
const requestOptionalPermissions = async (): Promise<void> => {
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    try {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    } catch {}
  }
  try {
    const background = await check(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
    if (background !== RESULTS.GRANTED) {
      await request(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
    }
  } catch {}
};

/** Call as soon as the technician accepts a task. Safe to call again while tracking is already running. */
export async function startTaskTracking(userId: number, taskId: number): Promise<boolean> {
  if (Platform.OS !== 'android' || !trackingNative) return false;

  const granted = await requestLocationPermission();
  if (!granted) return false;

  await requestOptionalPermissions();

  try {
    return await trackingNative.start(String(userId), taskId);
  } catch (error) {
    console.log('[tracking] start failed:', error);
    return false;
  }
}

/** Call when the technician checks out (attendance check-out, as Java's AlertDialog does). */
export async function stopTaskTracking(): Promise<void> {
  if (Platform.OS !== 'android' || !trackingNative) return;
  try {
    await trackingNative.stop();
  } catch (error) {
    console.log('[tracking] stop failed:', error);
  }
}