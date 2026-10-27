// src/config/maps.ts
//
// Directions and Places share one key, kept in the git-ignored ./mapsKey.ts.
import { Platform } from 'react-native';
import { GOOGLE_API_KEY } from './mapsKey';
//
// Google Directions API key used by the owner task-tracking map
// (Java: R.string.direction_api_key, injected per build type from
// FW_Android/app/build.gradle -> DIRECTION_API_KEY). Left empty on purpose:
// fill it in (or wire it from a build-time env mechanism) before release.
// While empty, the tracking map draws a straight line and shows Distance /
// Time as "NA" -- the same as Java when the Directions call fails.
export const DIRECTIONS_API_KEY = GOOGLE_API_KEY;

// Google Places API key used by the address search (Java: R.string.place_api_key, injected per
// build type from FW_Android/app/build.gradle -> PLACE_API_KEY). Left empty on purpose, like
// DIRECTIONS_API_KEY above: fill it in (or wire it from a build-time env mechanism) before
// release. While empty, the address search has no suggestions to offer and lets the person
// confirm the text they typed (lat/long stay 0).
export const PLACES_API_KEY = GOOGLE_API_KEY;

// A Google key restricted to "Android apps" only accepts web-service calls (Places / Directions
// over HTTP) that identify the calling app with these headers. The RN app is a different app
// from the Java one (own package + signing cert), so ITS package name and SHA-1 must be added to
// the key's Android restrictions in Google Cloud Console (Credentials -> the key -> Android apps).
// The cert below is android/app/debug.keystore, which build.gradle uses for debug AND release;
// when a real release keystore is set up, replace it with that keystore's SHA-1.
export const ANDROID_PACKAGE = 'com.fieldwebapp';
export const ANDROID_CERT_SHA1 = '5E8F16062EA3CD2C4A0D547876BAA6F38CABF625';

export const googleApiHeaders = (): Record<string, string> =>
  Platform.OS === 'android'
    ? { 'X-Android-Package': ANDROID_PACKAGE, 'X-Android-Cert': ANDROID_CERT_SHA1 }
    : {};
