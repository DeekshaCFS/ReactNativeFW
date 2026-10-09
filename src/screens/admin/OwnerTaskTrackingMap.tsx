// src/screens/admin/OwnerTaskTrackingMap.tsx
//
// Top of Java's OwnerTaskTrackingFragmentNew (owner_task_tracking_fragment_new):
//  - isTechnicianPresent(): Attendance/GetTodayAttandanceIsExist. When the
//    fieldworker hasn't checked in, the map is replaced by
//    "<name> is currently Absent or Unavailable".
//  - Otherwise a 300dp map with the task (field) location pin. For Ongoing tasks
//    it also follows the fieldworker's live Firebase location and draws the
//    route; a white 30dp card over the map shows Distance / Time.
// The map itself reuses the technician route map's pieces (FIELDWEB_MAP_STYLE,
// FieldWebLocationPin / FieldWebTechMarker, black polyline, fetchDrivingRoute).
import React, {useEffect, useRef, useState} from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from 'react-native-maps';
import {attendanceCheck} from '../../api/attendance/attendanceService';
import {getLiveLocation} from '../../utils/firebaseLiveLocation';
import {fetchDrivingRoute, type DrivingRoute} from '../../utils/routing';
import {FieldWebLocationPin, FieldWebTechMarker} from '../../components/MapMarkers';
import {FIELDWEB_MAP_STYLE} from '../../config/mapStyle';
import {COLORS} from '../../theme/theme';
import {ms, sp, vs} from '../../utils/responsive';

type Props = {
  technicianId: number;
  technicianName: string;
  isOngoing: boolean;
  fieldLatitude: number;
  fieldLongitude: number;
  taskName?: string;
  customerName?: string;
};

type Point = {latitude: number; longitude: number};

const LIVE_POLL_MS = 10000;

const OwnerTaskTrackingMap: React.FC<Props> = ({
  technicianId,
  technicianName,
  isOngoing,
  fieldLatitude,
  fieldLongitude,
  taskName,
  customerName,
}) => {
  const [present, setPresent] = useState<boolean | null>(null);
  const [tech, setTech] = useState<Point | null>(null);
  const [route, setRoute] = useState<DrivingRoute | null>(null);
  const [routeFailed, setRouteFailed] = useState(false);
  const destination: Point = {latitude: fieldLatitude, longitude: fieldLongitude};
  const hasDestination = !!fieldLatitude && !!fieldLongitude;
  const destinationMarkerRef = useRef<React.ComponentRef<typeof Marker> | null>(null);

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

  // Route + Distance / Time between the technician and the task (same helper as the
  // technician route map; falls back to a straight line and "NA").
  useEffect(() => {
    if (!tech || !hasDestination) {
      return;
    }
    let active = true;
    fetchDrivingRoute(tech, destination).then(result => {
      if (!active) {
        return;
      }
      setRoute(result);
      setRouteFailed(!result);
    });
    return () => {
      active = false;
    };
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

  const distanceText = routeFailed || !route ? 'NA' : route.distanceText;
  const durationText = routeFailed || !route ? 'NA' : route.durationText;

  return (
    <View style={styles.mapWrap}>
      {present && hasDestination ? (
        <MapView
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          customMapStyle={FIELDWEB_MAP_STYLE}
          showsUserLocation={false}
          showsMyLocationButton={false}
          zoomControlEnabled
          onMapReady={() => destinationMarkerRef.current?.showCallout()}
          initialRegion={{
            latitude: (tech ?? destination).latitude,
            longitude: (tech ?? destination).longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}>
          <Marker
            ref={destinationMarkerRef}
            coordinate={destination}
            anchor={{x: 0.5, y: 0.5}}
            title={taskName ?? ''}
            description={customerName ?? ''}>
            <FieldWebLocationPin size={ms(35)} />
          </Marker>
          {tech ? (
            <Marker coordinate={tech} anchor={{x: 0.5, y: 0.5}}>
              <FieldWebTechMarker size={ms(40)} />
            </Marker>
          ) : null}
          {tech ? (
            <Polyline
              coordinates={route?.coordinates ?? [tech, destination]}
              strokeColor="#000000"
              strokeWidth={5}
              geodesic
            />
          ) : null}
        </MapView>
      ) : (
        <View style={styles.mapPlaceholder} />
      )}
      {/* linear_distance: white 10dp-radius card, 30dp tall, weights 0.2 / 0.3 / 0.2 / 0.4 */}
      <View style={styles.distanceCard} pointerEvents="none">
        <Text style={[styles.distanceLabel, styles.col2]}>Distance</Text>
        <Text style={[styles.distanceValue, styles.col3]} numberOfLines={1}>
          {distanceText}
        </Text>
        <Text style={[styles.distanceLabel, styles.col2]}>Time</Text>
        <Text style={[styles.distanceValue, styles.col4]} numberOfLines={1}>
          {durationText}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapWrap: {width: '100%', height: ms(300), backgroundColor: COLORS.white, borderTopLeftRadius: ms(30), borderTopRightRadius: ms(30), overflow: 'hidden'},
  map: {...StyleSheet.absoluteFill},
  mapPlaceholder: {...StyleSheet.absoluteFill, backgroundColor: '#EDE9E0'},
  distanceCard: {
    position: 'absolute',
    top: ms(10),
    left: ms(10),
    right: ms(10),
    height: ms(30),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(5),
    backgroundColor: COLORS.white,
    borderRadius: ms(10),
    elevation: 8,
    zIndex: 10,
  },
  distanceLabel: {fontSize: sp(14), color: COLORS.textBlack},
  distanceValue: {fontSize: sp(14), color: COLORS.statusRejected},
  col2: {flex: 0.2},
  col3: {flex: 0.3},
  col4: {flex: 0.4},
  absent: {alignItems: 'center', paddingVertical: vs(20)},
  absentName: {fontSize: sp(16), color: '#fff', fontWeight: '700'},
  absentText: {fontSize: sp(12), color: '#fff', marginTop: vs(4)},
});

export default OwnerTaskTrackingMap;
