// src/navigation/TechnicianTabs.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';

import AppHeader from '../components/AppHeader';
import { usePassbookTabOrder } from '../state/passbookTabOrder';
import BottomTabBar, { QuickAction } from '../components/BottomTabBar';
import AddQuoteModal from '../screens/admin/AddQuoteModal';

import HomeScreen from '../screens/technician/main/HomeScreen';
import TaskScreen from '../screens/technician/main/TaskScreen';
import AttendanceScreen from '../screens/technician/main/AttendanceScreen';
import PassbookScreen from '../screens/technician/main/PassbookScreen';

import TaskTrackingScreen from '../screens/technician/main/TaskTrackingScreen';
import TaskExecutionScreen from '../screens/technician/main/TaskExecutionScreen';
import TaskRouteMapScreen from '../screens/technician/main/TaskRouteMapScreen';
import TaskClosureScreen from '../screens/technician/main/TaskClosureScreen';
import TaskSummaryScreen from '../screens/technician/main/TaskSummaryScreen';
import PaymentReceivedScreen from '../screens/technician/main/PaymentReceivedScreen';
import LeaveScreen from '../screens/technician/main/LeaveScreen';
import ItemRequestScreen from '../screens/technician/main/ItemRequestScreen';
import TaskInputScreen from '../screens/technician/main/TaskInputScreen';
import QRScanHistoryScreen from '../screens/technician/main/QRScanHistoryScreen';
import NotificationScreen from '../screens/technician/main/NotificationScreen';
import HelpChatScreen from '../screens/technician/main/HelpChatScreen';
import SyncOfflineScreen from '../screens/technician/main/SyncOfflineScreen';
import AMCDetailsScreen from '../screens/technician/main/AMCDetailsScreen';
import TechProfileScreen from '../screens/technician/drawer/TechProfileScreen';
import IssuedItems from '../screens/technician/drawer/IssuedItems';
import RequestedItems from '../screens/technician/drawer/RequestedItems';
import FOCDetailsScreen from '../screens/technician/drawer/FOCDetailsScreen';
import LeadsScreen from '../screens/technician/drawer/LeadsScreen';
import ExpenditureScreen from '../screens/technician/drawer/ExpenditureScreen';
import ServiceScreen from '../screens/technician/drawer/ServiceScreen';
import AIScreen from '../screens/technician/drawer/AIScreen';
import SettingScreen from '../screens/technician/drawer/SettingScreen';
import PrivacyPolicyScreen, { TERMS_AND_CONDITIONS_URL } from '../screens/technician/drawer/PrivacyPolicyScreen';
import RefundPolicyScreen from '../screens/technician/drawer/RefundPolicy';
import AboutFieldwebScreen from '../screens/technician/drawer/AboutFieldweb';
import AMCListScreen from '../screens/technician/drawer/AMCListScreen';
import { unmountOnBlur, pushedScreenOptions } from './tabScreenHelpers';
import { requestLocationPermission } from '../utils/locationPermision';
import { putLiveLocation } from '../utils/firebaseLiveLocation';

export type TechnicianTabParamList = {
  Home: undefined;
  Task: undefined;
  Attendance: undefined;
  Passbook: undefined;
};

const Tab = createBottomTabNavigator<TechnicianTabParamList>();

const MAIN_TABS = ['Home', 'Task', 'Attendance', 'Passbook'];

// Screens that used to be pushed on the stack above the tabs. They live in the
// tab navigator now (hidden from the bar, see BottomTabBar visibleTabs) so the
// shared tab bar shows under them. Route names are unchanged, so every existing
// navigation.navigate('X', ...) call keeps working. Upload Documents stays in
// TechStack on purpose (no tab bar there).
const PUSHED_SCREENS: {
  name: string;
  component: React.ComponentType<any>;
  title: string;
  initialParams?: object;
}[] = [
  { name: 'TaskRouteMap', component: unmountOnBlur(TaskRouteMapScreen), title: 'Route' },
  { name: 'TaskExecution', component: unmountOnBlur(TaskExecutionScreen), title: 'Task' },
  { name: 'TaskTracking', component: unmountOnBlur(TaskTrackingScreen), title: 'Tasks' },
  { name: 'TaskClosure', component: unmountOnBlur(TaskClosureScreen), title: 'Task Details' },
  { name: 'TaskSummary', component: unmountOnBlur(TaskSummaryScreen), title: 'Summary Details' },
  { name: 'PaymentReceived', component: unmountOnBlur(PaymentReceivedScreen), title: 'Task' },
  { name: 'ItemRequest', component: unmountOnBlur(ItemRequestScreen), title: 'Task Details' },
  { name: 'TaskInput', component: unmountOnBlur(TaskInputScreen), title: 'Task Details' },
  { name: 'QRScanHistory', component: unmountOnBlur(QRScanHistoryScreen), title: 'Scan Item QR' },
  { name: 'Leave', component: unmountOnBlur(LeaveScreen), title: 'Attendance' },
  { name: 'notification', component: unmountOnBlur(NotificationScreen), title: 'Notification' },
  { name: 'help', component: unmountOnBlur(HelpChatScreen), title: 'Help & Support' },
  { name: 'SyncOffline', component: unmountOnBlur(SyncOfflineScreen), title: 'Sync Offline Data' },
  { name: 'Profile', component: unmountOnBlur(TechProfileScreen), title: 'Profile' },
  { name: 'Issued Items', component: unmountOnBlur(IssuedItems), title: 'Item Inventory' },
  { name: 'Requested Items', component: unmountOnBlur(RequestedItems), title: 'Item Inventory' },
  { name: 'FOCDetails', component: unmountOnBlur(FOCDetailsScreen), title: 'Item Inventory' },
  { name: 'Leads', component: unmountOnBlur(LeadsScreen), title: 'Leads' },
  { name: 'Expenditure', component: unmountOnBlur(ExpenditureScreen), title: 'Expenditure' },
  { name: 'Routine Service', component: unmountOnBlur(ServiceScreen), title: 'Routine Service' },
  { name: 'FieldWeb AI', component: unmountOnBlur(AIScreen), title: 'FieldWeb AI' },
  { name: 'Settings', component: unmountOnBlur(SettingScreen), title: 'Settings' },
  { name: 'PrivacyPolicy', component: unmountOnBlur(PrivacyPolicyScreen), title: 'Privacy Policy' },
  {
    name: 'TermsAndConditions',
    component: unmountOnBlur(PrivacyPolicyScreen),
    title: 'Terms & Conditions',
    initialParams: { url: TERMS_AND_CONDITIONS_URL },
  },
  { name: 'RefundPolicy', component: unmountOnBlur(RefundPolicyScreen), title: 'Refund Policy' },
  { name: 'AboutFieldweb', component: unmountOnBlur(AboutFieldwebScreen), title: 'About FieldWeb' },
  { name: 'AMC', component: unmountOnBlur(AMCListScreen), title: 'AMC' },
  { name: 'AMCDetails', component: unmountOnBlur(AMCDetailsScreen), title: 'AMC Details' },
];

// Java shows these sheets under the plain "FieldWeb" header with no bottom navigation.
const SHEET_SCREENS = ['TaskRouteMap', 'ItemRequest', 'TaskInput'];

// Tab.Screen's typed name only accepts the four tab names; these are dynamic.
const PushedTabScreen = Tab.Screen as any;

export default function TechnicianTabs() {
  // Java opens Passbook/Expenditure in one tab host: from the Passbook bottom tab it is titled
  // "Passbook" with Passbook highlighted; from the drawer it stays on Home ("FieldWeb").
  const passbookTabOrder = usePassbookTabOrder();
  const watchIdRef = useRef<number | null>(null);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [isAddQuoteModalOpen, setIsAddQuoteModalOpen] = useState(false);
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState(false);

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
      icon: 'fab-quote',
      label: 'Add Quote',
      onPress: () => setIsAddQuoteModalOpen(true),
    },
    {
      icon: 'fab-invoice',
      label: 'Add Invoice',
      onPress: () => setIsAddInvoiceModalOpen(true),
    },
    {
      icon: 'fab-lead',
      label: 'Add Lead',
      // Java (CommonDialog.linear_add_lead) opens the Leads screen; its "+ Lead" button adds one.
      route: 'Leads',
    },
  ];

  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName="Home"
        // Back from any pushed-style screen returns to Home.
        backBehavior="initialRoute"
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
              {/* Pushed-style screens show their own back-arrow header. */}
              {/* Leave is the Leaves sub-tab of Attendance in Java: same header + tab. */}
              {(MAIN_TABS.includes(currentRoute) || currentRoute === 'Leave' || currentRoute === 'Expenditure' || currentRoute === 'Leads' || SHEET_SCREENS.includes(currentRoute)) && (
                <AppHeader
                  title={currentRoute === 'Expenditure'
                    ? (passbookTabOrder === 'passbookFirst' ? 'Passbook' : 'FieldWeb')
                    : currentRoute === 'Leads' || SHEET_SCREENS.includes(currentRoute)
                      ? 'FieldWeb'
                      : getTitle(currentRoute)}
                  navigation={props.navigation as any}
                />
              )}

              {/* Java hides the bottom navigation on the route map. */}
              {!SHEET_SCREENS.includes(currentRoute) && (
              <BottomTabBar
                {...props}
                visibleTabs={MAIN_TABS}
                activeAlias={{
                  Leave: 'Attendance',
                  Expenditure: passbookTabOrder === 'passbookFirst' ? 'Passbook' : 'Home',
                  Leads: 'Home',
                }}
                quickActions={quickActions}
              />
              )}
            </>
          );
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Task" component={TaskScreen} />
        <Tab.Screen name="Attendance" component={AttendanceScreen} />
        <Tab.Screen name="Passbook" component={PassbookScreen} />

        {PUSHED_SCREENS.map(({ name, component, title, initialParams }) => (
          <PushedTabScreen
            key={name}
            name={name}
            component={component}
            initialParams={initialParams}
            options={({ navigation }: any) =>
              name === 'Leave' || name === 'Expenditure' || name === 'Leads' || SHEET_SCREENS.includes(name)
                ? { headerShown: false }
                : pushedScreenOptions(title, navigation)}
          />
        ))}
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
    case 'Leave':
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