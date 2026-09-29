// src/screens/admin/OwnerTaskTrackingMap.tsx
//
// Top of Java's OwnerTaskTrackingFragmentNew (owner_task_tracking_fragment_new):
//  - isTechnicianPresent(): Attendance/GetTodayAttandanceIsExist. When the
//    fieldworker hasn't checked in, the map is replaced by
//    "<name> is currently Absent or Unavailable".
//  - Otherwise a map with the task (field) location marker. For Ongoing tasks
//    it also follows the fieldworker's live Firebase location and draws the
//    route + Distance / Time from the Google Directions API.
import React, {useEffect, useState} from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import MapView, {Marker, Polyline, PROVIDER_GOOGLE, type LatLng} from 'react-native-maps';
import {attendanceCheck} from '../../api/attendance/attendanceService';
import {getLiveLocation} from '../../utils/firebaseLiveLocation';
import {DIRECTIONS_API_KEY} from '../../config/maps';
import {ms, sp, vs} from '../../utils/responsive';

type Props = {
  technicianId: number;
  technicianName: string;
  isOngoing: boolean;
  fieldLatitude: number;
  fieldLongitude: number;
};

const LIVE_POLL_MS = 10000;

// Standard Google encoded-polyline decoder (the format is defined with bit ops).
/* eslint-disable no-bitwise */
const decodePolyline = (encoded: string): LatLng[] => {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    for (const axis of ['lat', 'lng'] as const) {
      let result = 0;
      let shift = 0;
      let byte: number;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 'lat') {
        lat += delta;
      } else {
        lng += delta;
      }
    }
    points.push({latitude: lat / 1e5, longitude: lng / 1e5});
  }
  return points;
};
/* eslint-enable no-bitwise */

const OwnerTaskTrackingMap: React.FC<Props> = ({
  technicianId,
  technicianName,
  isOngoing,
  fieldLatitude,
  fieldLongitude,
}) => {
  const [present, setPresent] = useState<boolean | null>(null);
  const [tech, setTech] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [distance, setDistance] = useState('NA');
  const [duration, setDuration] = useState('NA');
  const destination: LatLng = {latitude: fieldLatitude, longitude: fieldLongitude};
  const hasDestination = !!fieldLatitude && !!fieldLongitude;

  useEffect(() => {
    let active = true;
    attendanceCheck({UserId: technicianId})
      .then(response => {
        if (active) {
          setPresent(
            response?.Code === '200' &&
              String(response?.Message ?? '').toLowerCase() === 'attendance already added.',
          );
        }
      })
      .catch(() => active && setPresent(false));
    return () => {
      active = false;
    };
  }, [technicianId]);

  // Live fieldworker location (Java: Firebase ValueEventListener on the user node).
  useEffect(() => {
    if (!present || !isOngoing) {
      return;
    }
    let active = true;
    const poll = async () => {
      const loc = await getLiveLocation(technicianId);
      if (active && loc) {
        setTech(loc);
      }
    };
    poll();
    const timer = setInterval(poll, LIVE_POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [present, isOngoing, technicianId]);

  // Route + Distance / Time (Java: getDirections(origin, destination, mode, apiKey)).
  useEffect(() => {
    if (!tech || !hasDestination) {
      return;
    }
    if (!DIRECTIONS_API_KEY) {
      setRoute([tech, destination]);
      return;
    }
    const url =
      'https://maps.googleapis.com/maps/api/directions/json' +
      `?origin=${tech.latitude},${tech.longitude}` +
      `&destination=${fieldLatitude},${fieldLongitude}&mode=driving&key=${DIRECTIONS_API_KEY}`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        const first = data?.routes?.[0];
        const leg = first?.legs?.[0];
        if (!first || !leg) {
          setDistance('NA');
          setDuration('NA');
          return;
        }
        setRoute(decodePolyline(String(first.overview_polyline?.points ?? '')));
        setDistance(String(leg.distance?.text ?? 'NA'));
        setDuration(String(leg.duration?.text ?? 'NA'));
      })
      .catch(() => {
        setDistance('NA');
        setDuration('NA');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tech?.latitude, tech?.longitude, fieldLatitude, fieldLongitude]);

  if (present === false) {
    return (
      <View style={styles.absent}>
        <Text style={styles.absentName}>{technicianName || 'Fieldworker Name'}</Text>
        <Text style={styles.absentText}>is currently Absent or Unavailable</Text>
      </View>
    );
  }

  return (
    <View>
      {tech ? (
        <View style={styles.distanceRow}>
          <Text style={styles.distanceLabel}>Distance</Text>
          <Text style={styles.distanceValue}>{distance}</Text>
          <Text style={styles.distanceLabel}>Time</Text>
          <Text style={styles.distanceValue}>{duration}</Text>
        </View>
      ) : null}
      {present && hasDestination ? (
        <MapView
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={{...destination, latitudeDelta: 0.08, longitudeDelta: 0.08}}
          zoomControlEnabled
          toolbarEnabled>
          <Marker coordinate={destination} pinColor="red" />
          {tech ? <Marker coordinate={tech} pinColor="blue" title={technicianName} /> : null}
          {route.length > 1 ? <Polyline coordinates={route} strokeWidth={4} strokeColor="#1a73e8" /> : null}
        </MapView>
      ) : (
        <View style={styles.mapPlaceholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  map: {height: vs(240), width: '100%'},
  mapPlaceholder: {height: vs(40)},
  distanceRow: {flexDirection: 'row', alignItems: 'center', gap: ms(8), padding: ms(10), backgroundColor: '#fff'},
  distanceLabel: {fontSize: sp(12), color: '#5f6368'},
  distanceValue: {fontSize: sp(13), color: '#20283A', fontWeight: '700', marginRight: ms(12)},
  absent: {alignItems: 'center', paddingVertical: vs(20)},
  absentName: {fontSize: sp(16), color: '#fff', fontWeight: '700'},
  absentText: {fontSize: sp(12), color: '#fff', marginTop: vs(4)},
});

export default OwnerTaskTrackingMap;
