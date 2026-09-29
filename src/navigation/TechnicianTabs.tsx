// src/navigation/TechnicianTabs.tsx

import { View, StyleSheet } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';

import AppHeader from '../components/AppHeader';
import BottomTabBar, { QuickAction } from '../components/BottomTabBar';
import AddQuoteModal from '../screens/admin/AddQuoteModal';
import AddLeadModal from '../screens/admin/AddLeadModal';

import HomeScreen from '../screens/technician/main/HomeScreen';
import TaskScreen from '../screens/technician/main/TaskScreen';
import AttendanceScreen from '../screens/technician/main/AttendanceScreen';
import PassbookScreen from '../screens/technician/main/PassbookScreen';
import { requestLocationPermission } from '../utils/locationPermision';
import { putLiveLocation } from '../utils/firebaseLiveLocation';

export type TechnicianTabParamList = {
  Home: undefined;
  Task: undefined;
  Attendance: undefined;
  Passbook: undefined;
};

const Tab = createBottomTabNavigator<TechnicianTabParamList>();

export default function TechnicianTabs() {
  const watchIdRef = useRef<number | null>(null);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [isAddQuoteModalOpen, setIsAddQuoteModalOpen] = useState(false);
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('owner_id').then(v => setOwnerId(Number(v) || 0));
  }, []);

  // Pushes this technician's location to the same Firebase Realtime
  // Database node the Android app's admin-side live map reads from (see
  // firebaseLiveLocation.ts). Runs for as long as this tab navigator is
  // mounted, i.e. the whole logged-in technician session -- but only while
  // the app is foregrounded (watchPosition, like all JS timers, pauses
  // when the app backgrounds). Android's equivalent runs as a persistent
  // foreground Service so it keeps tracking in the background too; that's
  // a separate, larger native undertaking, not replicated here.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const uid = await AsyncStorage.getItem('uid');
      if (cancelled || !uid) return;

      const granted = await requestLocationPermission();
      if (cancelled || !granted) return;

      const userId = Number(uid);
      watchIdRef.current = Geolocation.watchPosition(
        position => {
          putLiveLocation(userId, position.coords.latitude, position.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true, distanceFilter: 20, interval: 5000 },
      );
    })();

    return () => {
      cancelled = true;
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // "Add Quote"/"Add Invoice" open the shared AddQuoteModal as an overlay
  // right here (same pattern as AdminTabs), instead of navigating to a
  // pushed screen -- the FAB should only ever present a sheet on top of
  // the current tab, never a full page transition.
  const quickActions: QuickAction[] = [
    {
      icon: 'cube-outline',
      label: 'Add Quote',
      onPress: () => setIsAddQuoteModalOpen(true),
    },
    {
      icon: 'document-text-outline',
      label: 'Add Invoice',
      onPress: () => setIsAddInvoiceModalOpen(true),
    },
    {
      icon: 'people-outline',
      label: 'Add Lead',
      onPress: () => setIsAddLeadModalOpen(true),
    },
  ];

  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
        tabBar={(props) => {
          const currentRoute =
            props.state.routes[props.state.index].name;

          // const hideTabBar =
          //   currentRoute === 'help' ||
          //   currentRoute === 'helpMessages' ||
          //   currentRoute === 'Settings' ||
          //   currentRoute === 'FieldWeb AI' ||
          //   currentRoute === 'PrivacyPolicy' ||
          //   currentRoute === 'RefundPolicy';

          return (
            <>
              <AppHeader
                title={getTitle(currentRoute)}
                navigation={props.navigation as any}
              />

              {/* {!hideTabBar && <BottomTabBar {...props} />} */}
              <BottomTabBar {...props} quickActions={quickActions} />
            </>
          );
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Task" component={TaskScreen} />
        <Tab.Screen name="Attendance" component={AttendanceScreen} />
        <Tab.Screen name="Passbook" component={PassbookScreen} />
      </Tab.Navigator>

      {ownerId !== null && (
        <AddQuoteModal
          technician
          visible={isAddQuoteModalOpen}
          ownerId={ownerId}
          onClose={() => setIsAddQuoteModalOpen(false)}
        />
      )}
      {ownerId !== null && (
        <AddQuoteModal
          technician
          mode="invoice"
          visible={isAddInvoiceModalOpen}
          ownerId={ownerId}
          onClose={() => setIsAddInvoiceModalOpen(false)}
        />
      )}

      <AddLeadModal
        technician
        visible={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
      />
    </View>
  );
}

//  function getTitle(state: any) {
//   const routeName = state.routes[state.index].name;

function getTitle(routeName: string) {
  switch (routeName) {
    case 'Home':
      return 'FieldWeb';
    case 'Task':
      return 'Tasks';
    case 'Attendance':
      return 'Attendance';
    case 'Passbook':
      return 'Passbook';
    default:
      return 'FieldWeb';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});