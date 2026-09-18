// src/navigation/CustomDrawerContent.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Modal, Alert, PermissionsAndroid, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/theme';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import { attendanceCheckOut, getUserDetails } from '../api';
import type { UserDetailsResultData } from '../api/users/users.types';
import { authEvents, AUTH_CHANGED } from '../utils/authEvents';
import { ms, sp, scale } from '../utils/responsive';

const todayKey = () => {
  const today = new Date().toISOString().split('T')[0];
  return `checked_in_${today}`;
};

const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location Permission',
      message: 'FieldWeb needs your location to record check-out.',
      buttonPositive: 'OK',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

const getCurrentPosition = (): Promise<{ latitude: number; longitude: number }> =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error) => reject(new Error(error.message || 'Unable to get current location')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  });

export default function CustomDrawerContent({ navigation }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserDetailsResultData | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const isAdmin = role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'owner';
  // Route name differs per role — see DrawerNavigator (AdminTabs → AdminStack,
  // TechnicianTabs → TechnicianStack).
  const tabsRoute = isAdmin ? 'AdminTabs' : 'TechnicianTabs';

  useEffect(() => {
    const loadSession = async () => {
      const storedName   = await AsyncStorage.getItem('name');
      const storedPhone  = await AsyncStorage.getItem('username');
      const storedUserId = await AsyncStorage.getItem('uid');
      const storedRole   = await AsyncStorage.getItem('role');
      setName(storedName);
      setPhone(storedPhone);
      setUserId(storedUserId);
      setRole(storedRole);

      if (storedUserId) {
        try {
          // Source: HomeActivityNew.getUSerDetails() -> Api.getUserDetails(@Query("UserId"))
          // GET Users/GetUsersByUserId — confirmed against Java: query key is "UserId", not "UserID"
          const response = await getUserDetails({ UserId: Number(storedUserId) });
          if (response?.ResultData) {
            setProfile(response.ResultData);
          }
        } catch (e: any) {
          console.log('Failed to load profile:', e.message);
        }
      }
    };
    loadSession();
  }, []);

  const handleCheckOut = async () => {
    try {
      if (!userId) return;

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Location permission is required to check out.');
        return;
      }
      const { latitude, longitude } = await getCurrentPosition();

      // Source: HomeActivityNew.checkOut() -> Api.checkOut(UserId, Latitude, Longitude, CheckOutPlace)
      // POST Attendance/CheckOutAttendance (form-encoded). Java resolves CheckOutPlace via
      // MapUtils.getFullAddressFromLatLong (reverse geocoding) against a continuously-tracked
      // last-known location; this takes a live GPS fix instead and, since no reverse-geocoding
      // service is wired up here, falls back to raw coordinates for CheckOutPlace.
      const response = await attendanceCheckOut({
        UserId: Number(userId),
        Latitude: latitude,
        Longitude: longitude,
        CheckOutPlace: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      });
      if (response?.Code === '200') {
        await AsyncStorage.removeItem(todayKey());
        setShowCheckOutModal(false);
        Alert.alert('Checked Out Successfully');
      } else {
        Alert.alert(response?.Message || 'Checkout failed');
      }
    } catch (e: any) {
      Alert.alert(e.message);
    }
  };

  const handleLogout = async () => {
    try {
      // Source: SharedPrefManager.logout() — confirmed no network call; the Java app only
      // clears local session state, then opens the login screen. Besides token/user id it also
      // clears user group, zone, disclaimer flag, health-safety flags, app-tour flag, permission
      // flag, and country code/symbol — if any of those are tracked in AsyncStorage elsewhere in
      // this app (vs. Redux/context), they should be cleared here too under their real key names.
      await AsyncStorage.multiRemove(['token', 'uid', 'owner_id', 'name', 'username', 'role']);
      authEvents.emit(AUTH_CHANGED);
    } catch (err) {
      console.log('Logout error:', err);
    }
  };

  const AVATAR_SIZE = ms(68);

  return (
    <View style={[styles.container, { paddingTop: insets.top + ms(16) }]}>
      {/* Profile Row */}
      <View style={styles.profileRow}>
        <View style={[styles.profileWrapper, { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }]}>
          <Image
            source={
              profile?.Photo
                ? { uri: profile.Photo }
                : require('../../assets/images/image.png')
            }
            style={[styles.pfp, { borderRadius: AVATAR_SIZE / 2 }]}
            resizeMode="cover"
          />
          <Pressable
            style={styles.editProfile}
            onPress={() => {
              navigation.closeDrawer();
              navigation.navigate(tabsRoute, { screen: 'Profile' });
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="create-outline" size={scale(14)} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {profile?.FirstName} {profile?.LastName}
          </Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={scale(16)} color={COLORS.primary} />
            <Text style={styles.ratingText}>4.5</Text>
          </View>
          <Text style={styles.phone} numberOfLines={1}>
            {profile?.CountryCode ? `${profile.CountryCode} ` : '+91 '}
            {profile?.ContactNo ?? phone}
          </Text>
        </View>

        <Pressable
          style={styles.logoutButton}
          onPress={() => {
            navigation.closeDrawer();
            setShowLogoutModal(true);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="log-out-outline" size={scale(28)} color="#000000" />
        </Pressable>
      </View>

      {/* Drawer Items */}
      {(isAdmin
        ? [
            // These five render inside HomeActivityNewScreen as internal
            // sections (not their own stack screens), so they're opened via
            // a `drawerSection` param on the Home tab rather than `screen`.
            { icon: 'cube-outline',                   label: 'Item Inventory',   section: 'Item Inventory' },
            { icon: 'wallet-outline',                 label: 'Passbook',         section: 'Passbook' },
            { icon: 'construct-outline',              label: 'AMC',              section: 'AMC' },
            { icon: 'reader-outline',                 label: 'Services',         section: 'Services' },
            { icon: 'person-circle-outline',          label: 'Accounts',         section: 'Accounts' },
            { icon: 'people-outline',                 label: 'Leads',            section: 'Leads' },
            { icon: 'bar-chart-outline',              label: 'Brand Management', section: 'Brand Management' },
            { icon: 'chatbox-ellipses-outline',       label: 'FieldWeb AI',      screen: 'FieldWeb AI' },
            { icon: 'phone-portrait-outline',         label: 'Book App Demo',    section: 'Book App Demo' },
            { icon: 'settings-outline',               label: 'Settings',         screen: 'Settings' },
          ]
        : [
            { icon: 'cube-outline',                   label: 'Item Inventory',  screen: 'Issued Items' },
            { icon: 'cash-outline',                   label: 'Expenditure',     screen: 'Expenditure' },
            { icon: 'list-outline',                   label: 'Routine Service', screen: 'Routine Service' },
            { icon: 'chatbox-ellipses-outline',       label: 'FieldWeb AI',     screen: 'FieldWeb AI' },
            { icon: 'settings-outline',               label: 'Settings',        screen: 'Settings' },
            { icon: 'arrow-forward-circle-outline',   label: 'Check-Out',       screen: null },
          ]
      ).map(({ icon, label, screen, section }: any) => (
        <DrawerItem
          key={label}
          icon={icon}
          label={label}
          onPress={() => {
            // Close the drawer as soon as an item is picked, before
            // navigating or opening a modal, so it doesn't linger open
            // behind the destination screen/modal.
            navigation.closeDrawer();

            if (section) {
              // Drill Drawer -> AdminStack -> AdminTabsRoot -> Home, passing
              // which internal section HomeActivityNewScreen should show.
              navigation.navigate(tabsRoute, {
                screen: 'AdminTabsRoot',
                params: { screen: 'Home', params: { drawerSection: section } },
              });
              return;
            }
            if (screen) {
              navigation.navigate(tabsRoute, { screen });
              return;
            }
            setShowCheckOutModal(true);
          }}
        />
      ))}

      {/* Logout Modal */}
      <Modal transparent visible={showLogoutModal} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + ms(16) }]}>
            <Text style={styles.modalTitle}>Oh no! You are leaving...{'\n'}Are you sure?</Text>
            <Pressable
              style={styles.confirmBtn}
              onPress={async () => { setShowLogoutModal(false); await handleLogout(); }}
            >
              <Text style={styles.confirmText}>LOGOUT</Text>
            </Pressable>
            <Pressable onPress={() => setShowLogoutModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Check-Out Modal */}
      <Modal transparent visible={showCheckOutModal} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + ms(16) }]}>
            <Text style={styles.modalTitle}>Do you want to Check-Out for Today?</Text>
            <Pressable style={styles.confirmBtn} onPress={handleCheckOut}>
              <Text style={styles.confirmText}>CHECK-OUT</Text>
            </Pressable>
            <Pressable onPress={() => setShowCheckOutModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface DrawerItemProps {
  icon: string;
  label: string;
  onPress: () => void;
}

function DrawerItem({ icon, label, onPress }: DrawerItemProps) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      <Ionicons name={icon} size={scale(22)} color={COLORS.icon} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: ms(24),
    paddingBottom: ms(24),
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(24),
  },
  profileWrapper: {
    marginRight: ms(14),
    position: 'relative',
    overflow: 'visible',
  },
  pfp: {
    width: '100%',
    height: '100%',
  },
  editProfile: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: ms(22),
    height: ms(22),
    borderRadius: ms(11),
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: sp(18),
    fontWeight: '600',
    marginBottom: ms(2),
    color: COLORS.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    marginBottom: ms(2),
  },
  ratingText: {
    color: COLORS.primary,
    fontSize: sp(14),
  },
  phone: {
    color: '#007BFF',
    fontSize: sp(14),
  },
  logoutButton: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(8),
    backgroundColor: '#f4f4f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ms(12),
    gap: ms(16),
  },
  label: {
    fontSize: sp(16),
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    padding: ms(20),
    borderTopLeftRadius: ms(28),
    borderTopRightRadius: ms(28),
  },
  modalTitle: {
    fontSize: sp(18),
    fontWeight: '400',
    marginBottom: ms(8),
    paddingVertical: ms(12),
    textAlign: 'center',
    color: COLORS.textPrimary,
    lineHeight: sp(26),
  },
  confirmBtn: {
    padding: ms(10),
    borderRadius: ms(20),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    elevation: 4,
    minHeight: ms(50),
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: sp(18),
    color: '#8e8b8b',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: ms(20),
    paddingVertical: ms(8),
  },
  confirmText: {
    fontSize: sp(18),
    color: '#fff',
    fontWeight: '500',
  },
});