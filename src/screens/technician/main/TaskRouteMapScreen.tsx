// src/screens/technician/main/TaskRouteMapScreen.tsx
//
// Java StartTaskTrackingFragmentNew (start_task_tracking_frag.xml): the map fills the screen, a
// collapsible task card floats under the app header, START NAVIGATION / Skip sit at the bottom
// and, once navigation was started or skipped, the "Have you reached your destination?" card.
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, LayoutAnimation, Linking, Alert, Platform, Image,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { ms, sp, useAppHeaderHeight } from '../../../utils/responsive';
import { GetAllTaskListDTOResultData as Task } from '../../../api/task/task.types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TechnicianStackParamList } from '../../../navigation/TechStack';
import { requestLocationPermission, getCurrentPosition, Coordinates } from '../../../utils/locationPermision';
import { fetchDrivingRoute, DrivingRoute } from '../../../utils/routing';
import { getCurrentUserProfile } from '../../../state/session';
import { placeTeleCmiCall } from '../../../utils/teleCmiCall';
import { FieldWebLocationPin, FieldWebTechMarker } from '../../../components/MapMarkers';
import { FIELDWEB_MAP_STYLE } from '../../../config/mapStyle';

type Props = NativeStackScreenProps<TechnicianStackParamList, 'TaskRouteMap'>;

export default function TaskRouteMapScreen({ navigation, route }: Props) {
  const { task: initialTask } = route.params;
  const headerHeight = useAppHeaderHeight();

  const [task, setTask] = useState<Task>(initialTask);
  const [showPrompt, setShowPrompt] = useState(false);
  const [cardExpanded, setCardExpanded] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(null);

  // Source: TechnTaskRouteMapFragment.getLastLocation() — requests location
  // permission and reads the technician's current position as soon as the
  // screen loads (the origin of the route and of the technician marker).
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
  const destinationMarkerRef = useRef<React.ComponentRef<typeof Marker> | null>(null);

  // Real driving route + distance/time (Java: fetchRoute -> Directions API). Falls back to
  // the straight line and "NA" if the router is unreachable.
  const [route_, setRoute] = useState<DrivingRoute | null>(null);
  const [routeFailed, setRouteFailed] = useState(false);

  const destination = task.Latitude && task.Longitude
    ? { latitude: parseFloat(task.Latitude), longitude: parseFloat(task.Longitude) }
    : null;

  // Custom (SVG) marker children are rasterised after their first layout; keep tracking view
  // changes briefly so they are not captured blank, then stop for performance.
  const [tracksViews, setTracksViews] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setTracksViews(false), 1500);
    return () => clearTimeout(t);
  }, [currentPosition]);

  useEffect(() => {
    if (currentPosition && destination) {
      mapRef.current?.fitToCoordinates([currentPosition, destination], {
        edgePadding: { top: ms(100), right: ms(40), bottom: ms(100), left: ms(40) },
        animated: true,
      });
    }
    // destination is derived from task.Latitude/Longitude each render; depend on those primitives instead of the object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPosition, task.Latitude, task.Longitude]);

  useEffect(() => {
    if (!currentPosition || !destination) return;
    let cancelled = false;
    setRouteFailed(false);
    fetchDrivingRoute(currentPosition, destination).then(r => {
      if (cancelled) return;
      setRoute(r);
      setRouteFailed(!r);
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

  const customerNumber = task.ContactNo && task.ContactNo.trim() ? task.ContactNo : 'NA';
  // Java: with the TeleCMI module on, the customer's number is hidden.
  const masked = getCurrentUserProfile().teleCmiModuleFlag === 'true';

  const handleCall = () => {
    const phone = task.ContactNo ?? task.TechContactNo;
    // Java: TeleCMI module on -> bridged call (number stays hidden); otherwise the dialer.
    if (masked) placeTeleCmiCall(phone);
    else if (phone && phone.trim()) Linking.openURL(`tel:${phone}`);
    else Alert.alert('Unavailable', 'Contact number is not available.');
  };

  const address = task.FullAddress || task.LocationName || '';

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

  const isOngoing = task.TaskStatus === 'Ongoing';

  return (
    <View style={styles.root}>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={FIELDWEB_MAP_STYLE}
        // Java: my-location button off, zoom controls on; the technician is drawn as a marker.
        showsUserLocation={false}
        showsMyLocationButton={false}
        zoomControlEnabled
        onMapReady={() => destinationMarkerRef.current?.showCallout()}
        initialRegion={{
          latitude: (currentPosition ?? destination)?.latitude ?? 20.5937,
          longitude: (currentPosition ?? destination)?.longitude ?? 78.9629,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}>
        {destination && (
          <Marker
            ref={destinationMarkerRef}
            coordinate={destination}
            anchor={{ x: 0.5, y: 0.5 }}
            title={task.Name ?? ''}
            description={task.CustomerName ?? ''}
            tracksViewChanges={tracksViews}
          >
            <FieldWebLocationPin size={ms(35)} />
          </Marker>
        )}
        {isOngoing && currentPosition && (
          <Marker
            coordinate={currentPosition}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={tracksViews}
          >
            <FieldWebTechMarker size={ms(40)} />
          </Marker>
        )}
        {currentPosition && destination && (
          <Polyline
            coordinates={route_?.coordinates ?? [currentPosition, destination]}
            strokeColor="#000000"
            strokeWidth={5}
            geodesic
          />
        )}
      </MapView>

      {/* Floating Task Card (card_view: 14dp side margins, 10dp radius, 10dp padding) */}
      <View style={[styles.taskCard, { top: headerHeight + ms(11) }]}>

        <Pressable style={styles.taskCardHeader} onPress={() => toggleCard()} hitSlop={8}>
          <Text style={styles.taskName} numberOfLines={cardExpanded ? undefined : 1}>
            {task.Name ?? ''}
          </Text>
          <Animated.View style={{ transform: [{ rotate: chevronDeg }] }}>
            <Ionicons name="chevron-down" size={sp(24)} color={COLORS.ink} />
          </Animated.View>
        </Pressable>

        {cardExpanded && (
          <View>
            <View style={styles.block}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{address}</Text>
            </View>

            <View style={[styles.block, { marginBottom: ms(10) }]}>
              <Text style={styles.label}>Landmark</Text>
              <Text style={styles.value}>{task.LocationDesc || 'NA'}</Text>
            </View>

            <View style={styles.distanceBlock}>
              <View style={styles.distanceRow}>
                <Text style={[styles.label, styles.distanceCol]}>Distance</Text>
                <Text style={[styles.label, styles.distanceCol]}>Time</Text>
              </View>
              <View style={styles.distanceRow}>
                <Text style={[styles.distanceValue, styles.distanceCol]}>
                  {routeFailed || !route_ ? 'NA' : route_.distanceText}
                </Text>
                <Text style={[styles.distanceValue, styles.distanceCol]}>
                  {routeFailed || !route_ ? 'NA' : route_.durationText}
                </Text>
              </View>
            </View>

            <Text style={styles.label}>Instructions</Text>
            <Text style={styles.description}>{task.Description || 'NA'}</Text>

            <Text style={styles.label}>Customer Name</Text>
            <Text style={styles.value}>{task.CustomerName || 'NA'}</Text>

            <View style={styles.mobileRow}>
              <View>
                <Text style={[styles.label, { marginTop: ms(10) }]}>Mobile Number</Text>
                <Text style={styles.value}>{masked ? 'XXXXXXXXXX' : customerNumber}</Text>
              </View>
              <Pressable style={styles.callBtn} onPress={handleCall}>
                <Image source={require('../../../../assets/images/ic_phone.png')} style={styles.callIcon} />
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* button_start_navigation (90dp margins, 5dp above) + btnSkipNav (100dp margins, bottom) */}
      {!showPrompt && (
        <>
          <Pressable style={styles.startBtn} onPress={handleStartNavigation}>
            <Text style={styles.startBtnText}>START NAVIGATION</Text>
          </Pressable>
          <Pressable style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </Pressable>
        </>
      )}

      {/* linear_destination: 30dp-radius card at the bottom */}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#eeeeee' },

  map: {
    ...StyleSheet.absoluteFill,
  },

  taskCard: {
    position: 'absolute',
    left: ms(14),
    right: ms(14),
    backgroundColor: '#fff',
    borderRadius: ms(10),
    padding: ms(10),
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
  taskName: {
    flex: 1,
    fontSize: sp(16),
    fontWeight: 'bold',
    color: COLORS.ink,
  },

  // Java's TextViews default to 14sp; labels are bold light_gray, values background_gray.
  block: { marginTop: ms(10) },
  label: { fontSize: sp(14), fontWeight: 'bold', color: COLORS.lightGray },
  value: { fontSize: sp(14), color: COLORS.ink },
  description: { fontSize: sp(12), color: COLORS.ink, marginBottom: ms(10) },
  // weightSum 1, columns of 0.4
  distanceBlock: { marginTop: ms(5), marginBottom: ms(10) },
  distanceRow: { flexDirection: 'row' },
  distanceCol: { width: '40%' },
  distanceValue: { fontSize: sp(14), color: COLORS.primary },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  callBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(8),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIcon: { width: ms(22), height: ms(22), tintColor: COLORS.primary },

  startBtn: {
    position: 'absolute',
    left: ms(90),
    right: ms(90),
    bottom: ms(48) + ms(5),
    height: ms(48),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(34),
    backgroundColor: COLORS.primary,
    elevation: 2,
  },
  startBtnText: { color: '#fff', fontSize: sp(16), fontWeight: '500' },
  skipBtn: {
    position: 'absolute',
    left: ms(100),
    right: ms(100),
    bottom: 0,
    height: ms(48),
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: { color: COLORS.primary, fontSize: sp(16), fontWeight: '500' },

  promptCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    paddingTop: ms(15),
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  promptText: { fontSize: sp(14), textAlign: 'center', color: COLORS.ink },
  promptBtns: { flexDirection: 'row', paddingHorizontal: ms(15), paddingTop: ms(3), paddingBottom: ms(4) },
  yesBtn: {
    flex: 1,
    marginVertical: ms(10),
    height: ms(48),
    borderRadius: ms(34),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yesBtnText: { color: '#fff', fontSize: sp(18), fontWeight: '500' },
  noBtn: { flex: 1, marginVertical: ms(10), alignItems: 'center', justifyContent: 'center' },
  noBtnText: { color: COLORS.primary, fontSize: sp(18), fontWeight: '500' },
});
