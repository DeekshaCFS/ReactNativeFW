// src/tracking/trackingController.ts
//
// Task Acceptance tracking, Android and iOS.
//   startTaskTracking  -> on accept        (Java: setupAlarm(120000))
//   stopTaskTracking   -> on check-out     (Java: cancelAlarm())
// Android: TrackingForegroundService + headless JS task (index.js).
// iOS:     FWTracking.swift emits "FWTrackingTick" events (trackingEvents.ts).

import { NativeModules, Platform, PermissionsAndroid } from 'react-native';
import { check, request, openSettings, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { requestLocationPermission } from '../utils/locationPermision';
import { showFailureMsg } from '../utils/toast';

export type TrackingNative = {
  start(userId: string, taskId: number): Promise<boolean>;
  stop(): Promise<boolean>;
  reportLocation(timestampMs: string, latitude: number, longitude: number): Promise<boolean>;
};

export const trackingNative: TrackingNative | undefined = NativeModules.FWTracking;

/**
 * Android. Java (RuntimePermissionActivity) does not let the technician in until fine, coarse and
 * background location are all granted, so tracking needs background location too.
 * Returns false when it is not granted.
 */
const requestAndroidPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  if (Number(Platform.Version) >= 33) {
    try {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    } catch {}
  }

  // Background location only exists from Android 10 (API 29).
  if (Number(Platform.Version) < 29) return true;

  try {
    const current = await check(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
    if (current === RESULTS.GRANTED) return true;

    const result = await request(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
    if (result === RESULTS.GRANTED) return true;

    // Android 11+ sends the user to Settings ("Allow all the time") instead of a dialog.
    if (result === RESULTS.BLOCKED || result === RESULTS.DENIED) {
      await openSettings();
    }
    return false;
  } catch {
    return false;
  }
};

/** Call as soon as the technician accepts a task. Safe to call again while already running. */
export async function startTaskTracking(userId: number, taskId: number): Promise<boolean> {
  if (!trackingNative) return false;

  const granted = await requestLocationPermission();
  if (!granted) return false;

  if (!(await requestAndroidPermissions())) {
    showFailureMsg('Please allow location "All the time" in Settings so task tracking can run in the background.');
    return false;
  }

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