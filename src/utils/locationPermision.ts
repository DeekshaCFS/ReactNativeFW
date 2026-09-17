// src/utils/locationPermission.ts
//
// Cross-platform current-location + permission helper.
//
// Mirrors the `getLastLocation()` / `getAddressFromLocation()` boilerplate
// repeated across the Java app's fragments — every one of the following
// requests ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION as soon as its view
// loads, reads the last known location, then reverse-geocodes it:
//   - FieldWeb/Admin/ExpenseDetailsFragmentNew.java
//   - FieldWeb/Admin/ItemInventoryFragment.java
//   - FieldWeb/Admin/OwnerItemInventoryFragmentNew.java
//   - FieldWeb/LeadManagement/LeadManagementFragment.java
//   - FieldWeb/Task/TaskClosureFragmentNew.java
//   - FieldWeb/TechRouteTaskMap/TechnTaskRouteMapFragment.java
//   - FieldWeb/ServiceManagement/ServiceCategoryFragment.java
// (BaseActivity.java / RuntimePermissionActivity.java do the same thing at
// app-launch scope; that's already mirrored by LoginScreen.tsx's
// `requestLocationPermission`, which this file intentionally does not
// duplicate — screens should import from here instead.)
//
// Uses `react-native-permissions` (already used in LoginScreen.tsx) so the
// prompt is handled on both Android and iOS — the Java `checkSelfPermission`
// calls only ever covered Android. Uses `react-native-geolocation-service`
// (already used in CustomDrawerContent.tsx) to read the fix, in place of
// FusedLocationProviderClient. Reverse geocoding has no on-device
// equivalent to Android's `Geocoder` in RN, so it goes through Nominatim
// (OpenStreetMap) — the same free, no-API-key service already used for
// forward geocoding in AddTaskModal.tsx's `geocodeAddress`.

import { Platform } from 'react-native';
import { request, check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';

export type Coordinates = { latitude: number; longitude: number };

/**
 * Requests fine-location access (Android) / "when in use" location (iOS).
 * Equivalent to a Java fragment's
 * `ActivityCompat.checkSelfPermission(...) / requestPermissions(...)` pair.
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const permission = Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

    const existing = await check(permission);
    if (existing === RESULTS.GRANTED) return true;

    const result = await request(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.log('[locationPermission] permission request failed:', error);
    return false;
  }
}

/**
 * Reads the device's current position.
 * Equivalent to `fusedLocationProviderClient.getLastLocation()`.
 */
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error) => reject(new Error(error.message || 'Unable to get current location')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  });
}

/**
 * Reverse-geocodes coordinates into a human-readable address.
 * Equivalent to a Java fragment's `getAddressFromLocation()`.
 * Returns null (mirroring the Java "Phone GPS is OFF" fallback) on failure.
 */
export async function getAddressFromCoordinates(latitude: number, longitude: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      { headers: { Accept: 'application/json' } },
    );
    const result = await response.json();
    return result?.display_name ?? null;
  } catch (error) {
    console.log('[locationPermission] reverse geocode failed:', error);
    return null;
  }
}

/**
 * Convenience wrapper matching a Java fragment's full onViewCreated flow:
 * request permission -> get last location -> resolve address. Resolves to
 * null fields instead of throwing when permission is denied or the fix
 * fails, so callers can render gracefully (mirroring "Phone GPS is OFF").
 */
export async function getCurrentLocationAndAddress(): Promise<{
  coords: Coordinates | null;
  address: string | null;
}> {
  const granted = await requestLocationPermission();
  if (!granted) return { coords: null, address: null };

  try {
    const coords = await getCurrentPosition();
    const address = await getAddressFromCoordinates(coords.latitude, coords.longitude);
    return { coords, address };
  } catch (error) {
    console.log('[locationPermission] getCurrentLocationAndAddress failed:', error);
    return { coords: null, address: null };
  }
}