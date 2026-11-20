// src/utils/activityRecognition.ts
//
// Java TechDashboardFragmentNew asks for ACTIVITY_RECOGNITION when the dashboard is created,
// on Android 10 (Q) and later. The Java app ignores the result. Here the prompt is shown once
// per install: the flag is in AsyncStorage, so a reinstall or a data wipe asks again.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const ASKED_KEY = 'activity_permission_asked';
let inFlight: Promise<void> | null = null;

export function requestActivityRecognitionPermission(): Promise<void> {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 29) return Promise.resolve();
  if (!inFlight) {
    inFlight = run().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function run(): Promise<void> {
  try {
    if ((await AsyncStorage.getItem(ASKED_KEY)) === '1') return;
    const status = await check(PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION);
    if (status !== RESULTS.GRANTED) {
      await request(PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION);
    }
    await AsyncStorage.setItem(ASKED_KEY, '1');
  } catch (error) {
    console.log('[activityRecognition] request failed:', error);
  }
}