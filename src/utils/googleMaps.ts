// src/utils/googleMaps.ts
//
// Google Maps web services used by the app (Java: Geocoder / Directions API / Places):
//  - googleGeocode:        address text -> coordinates (Geocoding API)
//  - googleReverseGeocode: coordinates  -> address
//  - googleDirections:     driving route geometry + distance / duration (Directions API)
// All calls send the app-identity headers (X-Android-Package / X-Android-Cert) so a key restricted
// to Android apps accepts them -- see config/maps.ts. Every helper resolves to null on any failure
// (no key, REQUEST_DENIED, network...) so callers can fall back to the keyless services they used
// before; the Google status is logged to the console to make a key / restriction problem visible.
import { PLACES_API_KEY, googleApiHeaders } from '../config/maps';

export type LatLng = { latitude: number; longitude: number };

const GEOCODE = 'https://maps.googleapis.com/maps/api/geocode/json';
const DIRECTIONS = 'https://maps.googleapis.com/maps/api/directions/json';

async function getJson(url: string, timeoutMs = 8000): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: googleApiHeaders(), signal: controller.signal });
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const statusOk = (label: string, data: any): boolean => {
  if (data?.status === 'OK') return true;
  if (data?.status && data.status !== 'ZERO_RESULTS') {
    // e.g. REQUEST_DENIED: the key's Android restriction does not list this app, or the API is off
    console.warn(`${label}:`, data.status, data.error_message ?? '');
  }
  return false;
};

export async function googleGeocode(address: string): Promise<(LatLng & { formattedAddress: string }) | null> {
  const query = address.trim();
  if (!PLACES_API_KEY || !query) return null;
  const data = await getJson(`${GEOCODE}?address=${encodeURIComponent(query)}&key=${PLACES_API_KEY}`);
  if (!statusOk('Google geocode', data)) return null;
  const top = data.results?.[0];
  const loc = top?.geometry?.location;
  if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') return null;
  return { latitude: loc.lat, longitude: loc.lng, formattedAddress: top.formatted_address ?? query };
}

export async function googleReverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  if (!PLACES_API_KEY) return null;
  const data = await getJson(`${GEOCODE}?latlng=${latitude},${longitude}&key=${PLACES_API_KEY}`);
  if (!statusOk('Google reverse geocode', data)) return null;
  return data.results?.[0]?.formatted_address ?? null;
}

/** Google's encoded polyline -> coordinates. */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

export type GoogleRoute = {
  coordinates: LatLng[];
  distanceKm: number;
  durationMin: number;
  distanceText: string;
  durationText: string;
};

export async function googleDirections(from: LatLng, to: LatLng): Promise<GoogleRoute | null> {
  if (!PLACES_API_KEY) return null;
  const data = await getJson(
    `${DIRECTIONS}?origin=${from.latitude},${from.longitude}&destination=${to.latitude},${to.longitude}&mode=driving&key=${PLACES_API_KEY}`,
  );
  if (!statusOk('Google directions', data)) return null;
  const route = data.routes?.[0];
  const leg = route?.legs?.[0];
  const encoded = route?.overview_polyline?.points;
  if (!leg || !encoded) return null;
  return {
    coordinates: decodePolyline(encoded),
    distanceKm: (leg.distance?.value ?? 0) / 1000,
    durationMin: (leg.duration?.value ?? 0) / 60,
    distanceText: leg.distance?.text ?? 'NA',
    durationText: leg.duration?.text ?? 'NA',
  };
}

/** Keyless fallback used when Google is unavailable (OpenStreetMap Nominatim). */
async function nominatimGeocode(address: string): Promise<LatLng | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      { headers: { Accept: 'application/json' } },
    );
    const results = await response.json();
    const first = Array.isArray(results) ? results[0] : null;
    if (first?.lat && first?.lon) return { latitude: Number(first.lat), longitude: Number(first.lon) };
  } catch {
    // fall through
  }
  return null;
}

/** Address -> coordinates: Google first, OpenStreetMap as the fallback. */
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const query = address.trim();
  if (!query) return null;
  const google = await googleGeocode(query);
  if (google) return { latitude: google.latitude, longitude: google.longitude };
  return nominatimGeocode(query);
}

// ── Places (address search) ─────────────────────────────────────────────────────────────────────
// Google projects created recently only have "Places API (New)" enabled; the old
// /maps/api/place endpoints answer REQUEST_DENIED ("legacy API ... not enabled"). So the new API is
// tried first and the legacy one is the fallback for projects that still have it.
export type PlacePrediction = { placeId: string; primary: string; secondary: string; full: string };
export type PlaceDetails = { address: string; name: string; latitude: number; longitude: number };

const PLACES_NEW = 'https://places.googleapis.com/v1';
const PLACES_LEGACY = 'https://maps.googleapis.com/maps/api/place';

export async function placesAutocomplete(input: string): Promise<PlacePrediction[]> {
  const text = input.trim();
  if (!PLACES_API_KEY || !text) return [];
  try {
    const response = await fetch(`${PLACES_NEW}/places:autocomplete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': PLACES_API_KEY, ...googleApiHeaders() },
      body: JSON.stringify({ input: text }),
    });
    const data = await response.json();
    if (response.ok) {
      return (data?.suggestions ?? [])
        .map((s: any) => s?.placePrediction)
        .filter((p: any) => p?.placeId)
        .map((p: any) => ({
          placeId: p.placeId,
          primary: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
          secondary: p.structuredFormat?.secondaryText?.text ?? '',
          full: p.text?.text ?? '',
        }));
    }
    console.warn('Places autocomplete (new):', data?.error?.status, data?.error?.message ?? '');
  } catch (error) {
    console.warn('Places autocomplete (new) failed:', error);
  }

  // legacy fallback
  const data = await getJson(`${PLACES_LEGACY}/autocomplete/json?input=${encodeURIComponent(text)}&key=${PLACES_API_KEY}`);
  if (!statusOk('Places autocomplete (legacy)', data)) return [];
  return (data.predictions ?? []).map((p: any) => ({
    placeId: p.place_id,
    primary: p.structured_formatting?.main_text ?? p.description,
    secondary: p.structured_formatting?.secondary_text ?? '',
    full: p.description,
  }));
}

export async function placeDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!PLACES_API_KEY || !placeId) return null;
  try {
    const response = await fetch(`${PLACES_NEW}/places/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': PLACES_API_KEY,
        'X-Goog-FieldMask': 'displayName,formattedAddress,location',
        ...googleApiHeaders(),
      },
    });
    const data = await response.json();
    if (response.ok) {
      return {
        address: data?.formattedAddress ?? '',
        name: data?.displayName?.text ?? '',
        latitude: Number(data?.location?.latitude) || 0,
        longitude: Number(data?.location?.longitude) || 0,
      };
    }
    console.warn('Place details (new):', data?.error?.status, data?.error?.message ?? '');
  } catch (error) {
    console.warn('Place details (new) failed:', error);
  }

  const data = await getJson(
    `${PLACES_LEGACY}/details/json?place_id=${encodeURIComponent(placeId)}&fields=name,formatted_address,geometry&key=${PLACES_API_KEY}`,
  );
  if (!statusOk('Place details (legacy)', data)) return null;
  const r = data.result;
  return {
    address: r?.formatted_address ?? '',
    name: r?.name ?? '',
    latitude: Number(r?.geometry?.location?.lat) || 0,
    longitude: Number(r?.geometry?.location?.lng) || 0,
  };
}
