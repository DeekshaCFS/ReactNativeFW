// src/config/maps.ts
//
// Directions and Places share one key, kept in the git-ignored ./mapsKey.ts.
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
