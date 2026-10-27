// src/utils/firebaseLiveLocation.ts
//
// Talks directly to the same Firebase Realtime Database the Android app
// already uses for live technician tracking (FieldWeb/Admin/
// TechnicianGMapFragment.java reads, Util/GoogleMapUtils/
// LocationUpdatesService.java writes) -- root-level node keyed by the
// technician's numeric user id, with "lat"/"lng" children. The project's
// database rules allow unauthenticated read/write (confirmed: no
// FirebaseAuth usage and no database.rules.json anywhere in the Android
// repo), so we hit the plain REST API instead of adding the
// @react-native-firebase native SDK for two numeric fields.

const FIREBASE_DB_URL = 'https://fieldwebrelease.firebaseio.com';

export type LiveLocation = {
  latitude: number;
  longitude: number;
};

/**
 * Reads a technician's last-known location. Returns null if the node has
 * no lat/lng yet (technician hasn't pushed a location since opening the
 * app) or the request fails.
 */
export async function getLiveLocation(userId: number): Promise<LiveLocation | null> {
  try {
    const response = await fetch(`${FIREBASE_DB_URL}/${userId}.json`);
    const data = await response.json();
    if (!data || data.lat == null || data.lng == null) {
      return null;
    }
    const latitude = Number(data.lat);
    const longitude = Number(data.lng);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return null;
    }
    return {latitude, longitude};
  } catch {
    return null;
  }
}

/**
 * Pushes the technician's current location. Uses PATCH (not PUT) so it
 * doesn't clobber the "step" field Android's LocationUpdatesService also
 * writes to the same node.
 */
export async function putLiveLocation(userId: number, latitude: number, longitude: number): Promise<void> {
  try {
    await fetch(`${FIREBASE_DB_URL}/${userId}.json`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({lat: latitude, lng: longitude}),
    });
  } catch {
    // Best-effort; a dropped location update isn't worth surfacing to the technician.
  }
}
