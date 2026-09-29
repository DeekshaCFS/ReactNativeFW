// src/config/maps.ts
//
// Google Directions API key used by the owner task-tracking map
// (Java: R.string.direction_api_key, injected per build type from
// FW_Android/app/build.gradle -> DIRECTION_API_KEY). Left empty on purpose:
// fill it in (or wire it from a build-time env mechanism) before release.
// While empty, the tracking map draws a straight line and shows Distance /
// Time as "NA" -- the same as Java when the Directions call fails.
export const DIRECTIONS_API_KEY = '';
