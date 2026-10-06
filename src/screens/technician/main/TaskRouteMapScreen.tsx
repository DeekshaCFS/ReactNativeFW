// src/screens/technician/main/TaskRouteMapScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, LayoutAnimation, Linking, Alert, Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp, hp } from '../../../utils/responsive';
import { GetAllTaskListDTOResultData as Task } from '../../../api/task/task.types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TechnicianStackParamList } from '../../../navigation/TechStack';
import { requestLocationPermission, getCurrentPosition, Coordinates } from '../../../utils/locationPermision';
import { fetchDrivingRoute, DrivingRoute } from '../../../utils/routing';

type Props = NativeStackScreenProps<TechnicianStackParamList, 'TaskRouteMap'>;

export default function TaskRouteMapScreen({ navigation, route }: Props) {
  const { task: initialTask } = route.params;

  const [task, setTask] = useState<Task>(initialTask);
  const [showPrompt, setShowPrompt] = useState(false);
  const [cardExpanded, setCardExpanded] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(null);

  // Source: TechnTaskRouteMapFragment.getLastLocation() — requests location
  // permission and reads the technician's current position as soon as the
  // screen loads, so it's ready for the "my location" marker/centering once
  // the live map (currently a placeholder below) is wired in.
  useEffect(() => {
    (async () => {
      const granted = await requestLocationPermission();
      if (!granted) return;
      try {
        const position = await getCurrentPosition();
        setCurrentPosition(position);
      } catch (error) {
        console.log('[TaskRouteMapScreen] Unable to get current location:', error);
      }
    })();
  }, []);

  const mapRef = useRef<MapView | null>(null);

  // Real driving route + distance/time (Java: fetchRoute -> Directions API). Falls back to
  // the straight line and "—" if the router is unreachable.
  const [route_, setRoute] = useState<DrivingRoute | null>(null);

  const destination = task.Latitude && task.Longitude
    ? { latitude: parseFloat(task.Latitude), longitude: parseFloat(task.Longitude) }
    : null;

  useEffect(() => {
    if (currentPosition && destination) {
      mapRef.current?.fitToCoordinates([currentPosition, destination], {
        edgePadding: { top: vs(160), right: scale(60), bottom: vs(200), left: scale(60) },
        animated: true,
      });
    }
    // destination is derived from task.Latitude/Longitude each render; depend on those primitives instead of the object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPosition, task.Latitude, task.Longitude]);

  useEffect(() => {
    if (!currentPosition || !destination) return;
    let cancelled = false;
    fetchDrivingRoute(currentPosition, destination).then(r => {
      if (!cancelled) setRoute(r);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPosition, task.Latitude, task.Longitude]);

  const chevronRotation = useRef(new Animated.Value(0));

  const toggleCard = (forceExpand?: boolean) => {
    const shouldExpand = forceExpand !== undefined ? forceExpand : !cardExpanded;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCardExpanded(shouldExpand);
    Animated.timing(chevronRotation.current, {
      toValue: shouldExpand ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const chevronDeg = chevronRotation.current.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const handleStartNavigation = async () => {
    const lat = task.Latitude ? parseFloat(task.Latitude) : 0;
    const lng = task.Longitude ? parseFloat(task.Longitude) : 0;

    if (!lat || !lng) {
      Alert.alert('Unable to find destination', 'Google Map is unable to find this destination.');
      return;
    }

    const nativeNavUrl = `google.navigation:q=${lat},${lng}`;
    const webFallbackUrl = `https://maps.google.com/maps?daddr=${lat},${lng}`;

    try {
      const canOpenNative = await Linking.canOpenURL(nativeNavUrl);
      if (canOpenNative) {
        await Linking.openURL(nativeNavUrl);
      } else {
        await Linking.openURL(webFallbackUrl);
      }
    } catch {
      Alert.alert('Maps Unavailable', 'Please install a maps application to continue.');
      return;
    }

    toggleCard(true);
    setShowPrompt(true);
  };

  const handleSkip = () => {
    toggleCard(true);
    setShowPrompt(true);
  };

  const handleYes = () => {
    setShowPrompt(false);
    // replace, not push: back from Execution must not return to a stale map (Java has no
    // back stack between these steps, and reject / on-hold would land here otherwise).
    navigation.navigate('TaskExecution', { task });
  };

  const handleCall = () => {
    const phone = task.ContactNo ?? task.TechContactNo;
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const address = [
    task.FullAddress,
    task.CityName,
    task.State,
    task.CountryName,
  ].filter(Boolean).join(', ') || '—';

  useEffect(() => {
    if (route.params?.task) {
      setTask(route.params.task);
    }
  }, [route.params?.task]);

  useEffect(() => {
    if (!task.Latitude && !task.Longitude) {
      Alert.alert(
        'No Location Found',
        'This task does not have a location set. Do you want to proceed without navigation?',
        [
          {
            text: 'Not Yet',
            style: 'cancel',
            onPress: () => navigation.navigate('Task'),
          },
          {
            text: 'Yes, Proceed',
            onPress: () => {
              const taskWithFallbackCoords = { ...task, Latitude: '0.00', Longitude: '0.00' };
              navigation.navigate('TaskExecution', { task: taskWithFallbackCoords });
            },
          },
        ],
        { cancelable: false }
      );
    }
  }, []);

  return (
    <View style={styles.root}>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation
        showsMyLocationButton
        initialRegion={{
          latitude: (currentPosition ?? destination)?.latitude ?? 20.5937,
          longitude: (currentPosition ?? destination)?.longitude ?? 78.9629,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}>
        {destination && (
          <Marker
            coordinate={destination}
            title={task.Name ?? 'Destination'}
            description={address}
          />
        )}
        {currentPosition && destination && (
          <Polyline
            coordinates={route_?.coordinates ?? [currentPosition, destination]}
            strokeColor="#000000"
            strokeWidth={2}
          />
        )}
      </MapView>

      {/* Floating Task Card */}
      <View style={styles.taskCard}>

        <Pressable style={styles.taskCardHeader} onPress={() => toggleCard()} hitSlop={8}>
          <View style={styles.taskNameRow}>
            <Text style={styles.taskName} numberOfLines={cardExpanded ? undefined : 1}>
              {task.Name ?? '—'}
            </Text>
          </View>
          <Animated.View style={{ transform: [{ rotate: chevronDeg }] }}>
            <Ionicons name="chevron-down" size={sp(20)} color="#111827" />
          </Animated.View>
        </Pressable>

        {cardExpanded && (
          <View style={styles.taskCardBody}>

            <DetailRow label="Address" value={address} />

            {task.LocationDesc ? (
              <DetailRow label="Landmark" value={task.LocationDesc ?? 'NA'} />
            ) : null}

            <View style={styles.twoColRow}>
              <View style={styles.twoColItem}>
                <Text style={styles.detailLabel}>Distance</Text>
                <Text style={styles.detailValuePrimary}>{route_?.distanceText ?? '—'}</Text>
              </View>
              <View style={styles.twoColItem}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValuePrimary}>{route_?.durationText ?? '—'}</Text>
              </View>
            </View>

            <DetailRow label="Instructions" value={task.Description ?? 'NA'} />
            <DetailRow label="Customer Name" value={task.CustomerName ?? '—'} />

            <View style={styles.mobileRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Mobile Number</Text>
                <Text style={styles.detailValue}>{task.ContactNo ?? '—'}</Text>
              </View>
              <Pressable style={styles.callBtn} onPress={handleCall}>
                <Ionicons name="call" size={sp(20)} color={COLORS.primary} />
              </Pressable>
            </View>

          </View>
        )}
      </View>

      {/* Floating action buttons */}
      {!showPrompt && (
        <View style={styles.floatingActions}>
          <Pressable style={styles.startBtn} onPress={handleStartNavigation}>
            <Text style={styles.startBtnText}>START NAVIGATION</Text>
          </Pressable>
          <Pressable style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </Pressable>
        </View>
      )}

      {/* Destination prompt */}
      {showPrompt && (
        <View style={styles.promptCard}>
          <Text style={styles.promptText}>Have you reached your destination?</Text>
          <View style={styles.promptBtns}>
            <Pressable style={styles.yesBtn} onPress={handleYes}>
              <Text style={styles.yesBtnText}>YES</Text>
            </Pressable>
            <Pressable style={styles.noBtn} onPress={() => setShowPrompt(false)}>
              <Text style={styles.noBtnText}>NO</Text>
            </Pressable>
          </View>
        </View>
      )}

    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#eeeeee' },

  map: {
    ...StyleSheet.absoluteFill,
  },

  taskCard: {
    position: 'absolute',
    top: vs(16),
    left: scale(16),
    right: scale(16),
    backgroundColor: '#fff',
    borderRadius: scale(15),
    paddingHorizontal: scale(20),
    paddingVertical: vs(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 10,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskNameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskName: {
    flex: 1,
    fontSize: sp(17),
    fontWeight: '700',
    color: '#111827',
  },
  taskCardBody: {
    marginTop: vs(12),
    gap: vs(14),
  },
  detailRow: { gap: vs(2) },
  detailLabel: {
    fontSize: sp(12),
    fontWeight: '500',
    color: '#9CA3AF',
  },
  detailValue: {
    fontSize: sp(14),
    color: '#111827',
    fontWeight: '400',
  },
  detailValuePrimary: {
    fontSize: sp(14),
    color: COLORS.primary,
    fontWeight: '700',
  },
  twoColRow: { flexDirection: 'row', gap: scale(32) },
  twoColItem: { gap: vs(2) },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  callBtn: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(12),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  floatingActions: {
    position: 'absolute',
    bottom: vs(20),
    left: scale(24),
    right: scale(24),
    alignItems: 'center',
    gap: vs(12),
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60%',
    height: vs(50),
    borderRadius: scale(26),
    backgroundColor: COLORS.primary,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  startBtnText: { color: '#fff', fontSize: sp(17), fontWeight: '600', letterSpacing: 0.5 },
  skipBtn: {
    paddingVertical: vs(5),
    paddingHorizontal: scale(24),
  },
  skipBtnText: {
    color: COLORS.primary,
    fontSize: sp(18),
    fontWeight: '500',
  },

  promptCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    paddingHorizontal: scale(28),
    paddingTop: vs(20),
    paddingBottom: vs(20),
    gap: vs(15),
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  promptText: {
    fontSize: sp(18),
    fontWeight: '500',
    textAlign: 'center',
    color: '#111827',
  },
  promptBtns: { flexDirection: 'row', gap: scale(12) },
  yesBtn: {
    flex: 1, height: vs(45), borderRadius: scale(27),
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  yesBtnText: { color: '#fff', fontWeight: '700', fontSize: sp(18) },
  noBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  noBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: sp(18) },
});