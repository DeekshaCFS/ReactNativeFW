// src/screens/admin/TechnicianLiveMapScreen.tsx
//
// Single-technician live location map, opened from the "Track" button on
// each row in EmployeeManagementScreen.tsx. Mirrors Android's
// TechnicianGMapFragment (a dialog with one map + one marker + close
// button, no filters, no info window) -- see firebaseLiveLocation.ts for
// the data source.

import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import Modal from '../../components/AppModal';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../../theme/theme';
import {ms, sp} from '../../utils/responsive';
import {getLiveLocation, type LiveLocation} from '../../utils/firebaseLiveLocation';
import type {EmployeeListItem} from './adminLegacyApiTypes';

type Props = {
  visible: boolean;
  employee: EmployeeListItem | null;
  onClose: () => void;
};

const POLL_INTERVAL_MS = 5000;

const getEmployeeName = (item: EmployeeListItem) =>
  String(item.FirstNameM ?? '').trim() || `Employee ${item.EmployeeNumber ?? '-'}`;

const TechnicianLiveMapScreen: React.FC<Props> = ({visible, employee, onClose}) => {
  const [location, setLocation] = useState<LiveLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (!visible || !employee?.EmployeeNumber) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLocation(null);

    const poll = async () => {
      const result = await getLiveLocation(employee.EmployeeNumber!);
      if (cancelled) return;
      setLoading(false);
      if (result) {
        setLocation(result);
        mapRef.current?.animateToRegion(
          {
            latitude: result.latitude,
            longitude: result.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          500,
        );
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [visible, employee?.EmployeeNumber]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text numberOfLines={1} style={styles.headerTitle}>
            {employee ? getEmployeeName(employee) : 'Track'}
          </Text>
          <Pressable hitSlop={10} onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={sp(20)} color={COLORS.white} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : location ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}>
            <Marker
              coordinate={{latitude: location.latitude, longitude: location.longitude}}
              title={employee ? getEmployeeName(employee) : undefined}
            />
          </MapView>
        ) : (
          <View style={styles.centerContainer}>
            <Ionicons name="location-outline" size={sp(40)} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Location not available yet.</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: ms(16),
    paddingVertical: ms(14),
  },
  headerTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: sp(17),
    fontWeight: '700',
  },
  closeButton: {
    width: ms(28),
    height: ms(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: ms(10),
    color: COLORS.textMuted,
    fontSize: sp(14),
  },
});

export default TechnicianLiveMapScreen;
