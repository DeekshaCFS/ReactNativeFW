// src/tracking/trackingController.ts
//
// Task Acceptance tracking, Android and iOS.
//   startTaskTracking  -> on accept        (Java: setupAlarm(120000))
//   stopTaskTracking   -> on check-out     (Java: cancelAlarm())
// Android: TrackingForegroundService + headless JS task (index.js).
// iOS:     FWTracking.swift emits "FWTrackingTick" events (trackingEvents.ts).

import { NativeModules, Platform, PermissionsAndroid } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { requestLocationPermission } from '../utils/locationPermision';

export type TrackingNative = {
  start(userId: string, taskId: number): Promise<boolean>;
  stop(): Promise<boolean>;
  reportLocation(timestampMs: string, latitude: number, longitude: number): Promise<boolean>;
};

export const trackingNative: TrackingNative | undefined = NativeModules.FWTracking;

/** Android only, best effort: tracking still runs when these are refused. */
const requestOptionalAndroidPermissions = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;
  if (Number(Platform.Version) >= 33) {
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

/** Call as soon as the technician accepts a task. Safe to call again while already running. */
export async function startTaskTracking(userId: number, taskId: number): Promise<boolean> {
  if (!trackingNative) return false;

  const granted = await requestLocationPermission();
  if (!granted) return false;

  await requestOptionalAndroidPermissions();

  try {
    return await trackingNative.start(String(userId), taskId);
  } catch (error) {
    console.log('[tracking] start failed:', error);
    return false;
  }
}

/** Call when the technician checks out. */
export async function stopTaskTracking(): Promise<void> {
  if (!trackingNative) return;
  try {
    await trackingNative.stop();
  } catch (error) {
    console.log('[tracking] stop failed:', error);
  }
}