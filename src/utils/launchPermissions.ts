// src/utils/launchPermissions.ts
//
// First-launch location step, run once after the splash (Java RuntimePermissionActivity):
// "Use Your Location" disclosure, then the system location prompt, then login.
// The flag is in AsyncStorage, so a reinstall or a data wipe runs it again.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestLocationPermission } from './locationPermision';

const LOCATION_ONBOARDING_KEY = 'location_onboarding_done';

export async function runLocationOnboarding(): Promise<void> {
  try {
    if ((await AsyncStorage.getItem(LOCATION_ONBOARDING_KEY)) === '1') return;
    // Shows the disclosure only when location is not granted yet, then the system prompt.
    await requestLocationPermission();
    await AsyncStorage.setItem(LOCATION_ONBOARDING_KEY, '1');
  } catch (error) {
    console.log('[launchPermissions] location onboarding failed:', error);
  }
}