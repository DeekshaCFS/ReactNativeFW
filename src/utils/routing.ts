// src/utils/routing.ts
//
// Driving route between two points: the geometry to draw plus distance and duration.
// Java (StartTaskTrackingFragmentNew.fetchRoute) calls the Google Directions API and
// draws the decoded polyline, showing the first leg's distance. The RN app has no
// Directions key, so this uses the public OSRM router -- keyless, like the Nominatim
// geocoding already used in locationPermision.ts. Swap the URL for Google Directions
// if a key becomes available; the return shape would stay the same.

export type LatLng = { latitude: number; longitude: number };

export interface DrivingRoute {
  coordinates: LatLng[];
  distanceKm: number;
  durationMin: number;
  /** e.g. "15.3 km" (Google's leg.distance.text style) */
  distanceText: string;
  /** e.g. "24 mins" / "1 hr 5 mins" */
  durationText: string;
}

const formatDuration = (minutes: number): string => {
  const total = Math.max(1, Math.round(minutes));
  if (total < 60) return `${total} min${total === 1 ? '' : 's'}`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} mins`;
};

/**
 * Resolves to null on any failure (network, no route, timeout) so callers can fall back
 * to a straight line / straight-line distance instead of blocking the task flow.
 */
export async function fetchDrivingRoute(
  from: LatLng,
  to: LatLng,
  timeoutMs = 8000,
): Promise<DrivingRoute | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
      `?overview=full&geometries=geojson`;

    const response = await fetch(url, { signal: controller.signal });
    const json = await response.json();
    const route = json?.routes?.[0];
    if (json?.code !== 'Ok' || !route?.geometry?.coordinates?.length) return null;

    const distanceKm = route.distance / 1000;
    const durationMin = route.duration / 60;

    return {
      // GeoJSON is [lon, lat]
      coordinates: route.geometry.coordinates.map(([lon, lat]: [number, number]) => ({
        latitude: lat,
        longitude: lon,
      })),
      distanceKm,
      durationMin,
      distanceText: `${distanceKm.toFixed(1)} km`,
      durationText: formatDuration(durationMin),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
