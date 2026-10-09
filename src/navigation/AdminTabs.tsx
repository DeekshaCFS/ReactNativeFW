// src/navigation/AdminTabs.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppHeader, { HEADER_CONTENT_HEIGHT } from '../components/AppHeader';
import BottomTabBar, { QuickAction } from '../components/BottomTabBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Existing admin screens in the uploaded project
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import MainTaskFragmentNewScreen from '../screens/admin/MainTaskFragmentNewScreen';
import CRMScreen from '../screens/admin/CRMScreen';
import EmployeeManagementScreen from '../screens/admin/EmployeeManagementScreen';
import AddTaskModal from '../screens/admin/AddTaskModal';
import AddItemModal from '../screens/admin/AddItemModal';
import AssignItemModal from '../screens/admin/AssignItemModal';
import AddFieldworkerModal from '../screens/admin/AddFieldworkerModal';
import ManageBalanceModal from '../screens/admin/ManageBalanceModal';

import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import TaskDetailsScreen from '../screens/admin/TaskDetailsScreen';
import AdminSettingScreen from '../screens/admin/AdminSettingScreen';
import BankDetailsTaxScreen from '../screens/admin/BankDetailsTaxScreen';
import AMCDetailsScreen from '../screens/admin/AMCDetailsScreen';
import BookDemoScreen from '../screens/admin/BookDemoScreen';
import AdminNotificationScreen from '../screens/admin/AdminNotificationScreen';
import HelpChatScreen from '../screens/technician/main/HelpChatScreen';
import AIScreen from '../screens/technician/drawer/AIScreen';
import PrivacyPolicyScreen, { TERMS_AND_CONDITIONS_URL, FEEDBACK_URL } from '../screens/technician/drawer/PrivacyPolicyScreen';
import RefundPolicyScreen from '../screens/technician/drawer/RefundPolicy';
import AboutFieldwebScreen from '../screens/technician/drawer/AboutFieldweb';
import { unmountOnBlur, pushedScreenOptions } from './tabScreenHelpers';

import { COLORS } from '../theme/theme';
import type { AdminStackParamList } from './AdminStack';

export type AdminTabParamList = {
  // Optional `drawerSection` lets CustomDrawerContent open a specific
  // internal section of HomeActivityNewScreen (Leads, AMC, etc.) directly,
  // the same way the technician drawer deep-links into a stack screen.
  // `addAmcTrigger` mirrors `addEnquiryTrigger` on CRM below -- the shared
  // FAB's "Add AMC" item sends it here from any tab. `currentSectionTitle`
  // is kept in sync by AdminHomeScreen so the shared AppHeader below can
  // show the active drawer section's name instead of a static "FieldWeb".
  Home:
    | {
        drawerSection?: string;
        addAmcTrigger?: number;
        currentSectionTitle?: string;
      }
    | undefined;
  Task: undefined;
  // Quick-add "Add Enquiry" lives on the Home tab but opens a CRM sheet, so
  // the signal crosses routes as a param. Any changing value re-triggers it.
  CRM: { addEnquiryTrigger?: number } | undefined;
  // `activeEmployeeTab` is reported back up by EmployeeManagementScreen
  // whenever its internal Employee/Leave sub-tab changes, so the header
  // title below can track it ("Attendance" while on the Leave sub-tab,
  // "Employee List" otherwise).
  // `attendanceEntry` is set when the dashboard's "Today's Attendance" card
  // is tapped: this app's product call is to land on the Employee List
  // *content* (not jump to Leave, unlike Java), but still show "Attendance"
  // as the header for that visit. Cleared on blur (see the Tab.Screen's
  // `listeners` below) so a later direct tap on the Employee tab bar icon
  // goes back to the normal "Employee List" title.
  Employee: { activeEmployeeTab?: 'employee' | 'leave'; attendanceEntry?: boolean } | undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

const MAIN_TABS = ['Home', 'Task', 'CRM', 'Employee'];

// Tab.Screen's typed name only accepts the four tab names; the screens that used
// to be pushed on the stack above the tabs are registered dynamically (hidden
// from the bar, see BottomTabBar visibleTabs) so the shared tab bar shows under
// them. Help stays in AdminStack on purpose (no tab bar there).
const PushedTabScreen = Tab.Screen as any;

type PushedScreen = {
  name: string;
  component: React.ComponentType<any>;
  title: string;
  initialParams?: object;
};

// Pushed screens that need no owner id; defined once at module level.
const STATIC_PUSHED_SCREENS: PushedScreen[] = [
  { name: 'Profile', component: unmountOnBlur(AdminProfileScreen), title: 'Profile' },
  { name: 'Settings', component: unmountOnBlur(AdminSettingScreen), title: 'Settings' },
  { name: 'PrivacyPolicy', component: unmountOnBlur(PrivacyPolicyScreen), title: 'Privacy Policy' },
  {
    name: 'TermsAndConditions',
    component: unmountOnBlur(PrivacyPolicyScreen),
    title: 'Terms & Conditions',
    initialParams: { url: TERMS_AND_CONDITIONS_URL },
  },
  {
    name: 'Feedback',
    component: unmountOnBlur(PrivacyPolicyScreen),
    title: 'Feedback',
    initialParams: { url: FEEDBACK_URL },
  },
  { name: 'RefundPolicy', component: unmountOnBlur(RefundPolicyScreen), title: 'Refund Policy' },
  { name: 'AboutFieldweb', component: unmountOnBlur(AboutFieldwebScreen), title: 'About FieldWeb' },
  { name: 'FieldWeb AI', component: unmountOnBlur(AIScreen), title: 'FieldWeb AI' },
  { name: 'Book App Demo', component: unmountOnBlur(BookDemoScreen), title: 'Book App Demo' },
  { name: 'AMCDetails', component: unmountOnBlur(AMCDetailsScreen), title: 'AMC' },
  // Java ChatFragment (tawk.to) opens under the normal toolbar, bottom bar visible.
  { name: 'help', component: unmountOnBlur(() => <HelpChatScreen underAppHeader />), title: 'Help & Support' },
];

// Screens that keep HomeActivityNew's own toolbar (hamburger + title + headset/bell)
// instead of the back-arrow push header.
const MAIN_HEADER_SCREENS = ['notification', 'help'];

// Task, CRM and Employee all need the owner's id, which none of these
// screens can look up on their own — they take it as a prop. `component=`
// can't pass extra props (React Navigation only gives it route/navigation),
// so each of those three is mounted via a `children` render function
// instead. Those render functions are wrapped in useCallback below so their
// identity stays stable across AdminTabs re-renders (e.g. opening a quick
// action modal) — otherwise React Navigation sees a "new" render prop each
// time and remounts the active tab's whole screen subtree.
export default function AdminTabs({ ownerId }: { ownerId: number | null }) {
  const insets = useSafeAreaInsets();
  const headerOffset = insets.top + HEADER_CONTENT_HEIGHT;
  // Parent stack navigator — used to push TaskDetails from the Task tab,
  // and to reach a sibling tab from the FAB's quick actions below.
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<AdminStackParamList>>();

  // Quick-add sheet content. Previously this was a second, hand-rolled FAB
  // + bottom sheet drawn here on top of BottomTabBar's own (disabled via
  // `quickActions={[]}`) FAB. Now it's just the action list handed to the
  // shared BottomTabBar, which owns the single FAB and its sheet — same
  // component the technician tabs use.
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAssignItemModalOpen, setIsAssignItemModalOpen] = useState(false);
  const [isAddFieldworkerModalOpen, setIsAddFieldworkerModalOpen] = useState(false);
  const [isManageBalanceModalOpen, setIsManageBalanceModalOpen] = useState(false);

  const openAddTaskModal = useCallback(() => setIsAddTaskModalOpen(true), []);

  const handleTaskSelect = useCallback(
    (task: Record<string, unknown>) => {
      // TaskDetails is a (hidden) tab screen now, so address it through the
      // stack route that hosts the tab navigator.
      (rootNavigation as any).navigate('AdminTabsRoot', {
        screen: 'TaskDetails',
        params: {
          taskId: Number(task.id ?? task.Id) || 0,
          fallbackTask: task,
          customerName: getRecordString(task, 'customerName', 'CustomerName'),
          customerPhone: getRecordString(task, 'contactNo', 'ContactNo'),
          customerAddress: getRecordString(task, 'fullAddress', 'FullAddress'),
          source: 'taskList',
        },
      });
    },
    [rootNavigation],
  );

  const openAddFieldworkerModal = useCallback(
    () => setIsAddFieldworkerModalOpen(true),
    [],
  );

  const renderHomeScreen = useCallback(
    () => <AdminHomeScreen onCreateTask={openAddTaskModal} />,
    [openAddTaskModal],
  );

  const renderTaskScreen = useCallback(
    () => (
      <MainTaskFragmentNewScreen
        userId={ownerId as number}
        onTaskSelect={(task) => handleTaskSelect(task as Record<string, unknown>)}
        onAddTask={openAddTaskModal}
      />
    ),
    [ownerId, handleTaskSelect, openAddTaskModal],
  );

  const renderCRMScreen = useCallback(
    ({ route }: { route: { params?: AdminTabParamList['CRM'] } }) => (
      <CRMScreen
        ownerId={ownerId as number}
        openAddEnquiryTrigger={route.params?.addEnquiryTrigger}
      />
    ),
    [ownerId],
  );

  const renderEmployeeScreen = useCallback(
    ({
      route,
      navigation,
    }: {
      route: { params?: AdminTabParamList['Employee'] };
      navigation: { setParams: (params: Partial<NonNullable<AdminTabParamList['Employee']>>) => void };
    }) => (
      <EmployeeManagementScreen
        ownerId={ownerId as number}
        contentTopOffset={headerOffset}
        onAddEmployee={openAddFieldworkerModal}
        onActiveTabChange={activeTab => {
          if (route.params?.activeEmployeeTab !== activeTab) {
            navigation.setParams({ activeEmployeeTab: activeTab });
          }
        }}
      />
    ),
    [ownerId, headerOffset, openAddFieldworkerModal],
  );

  // Pushed screens that take the owner id as a prop. Memoised on ownerId so the
  // component identities stay stable across AdminTabs re-renders (see the note
  // above about render props remounting the active screen).
  const pushedScreens = useMemo<PushedScreen[]>(
    () => [
      ...STATIC_PUSHED_SCREENS,
      {
        name: 'BankDetailsTax',
        title: 'Bank Details & Tax',
        component: unmountOnBlur(() => (
          <BankDetailsTaxScreen ownerId={ownerId as number} />
        )),
      },
      {
        name: 'notification',
        title: 'Notification',
        component: unmountOnBlur(() => (
          <AdminNotificationScreen ownerId={ownerId as number} />
        )),
      },
      {
        name: 'TaskDetails',
        title: 'Task Details',
        component: unmountOnBlur(({ route, navigation }: any) => (
          <TaskDetailsScreen
            ownerId={ownerId as number}
            taskId={route.params.taskId}
            fallbackTask={route.params.fallbackTask}
            customerName={route.params.customerName}
            customerPhone={route.params.customerPhone}
            customerAddress={route.params.customerAddress}
            source={route.params.source}
            onBack={() => navigation.goBack()}
            hideBackBar
          />
        )),
      },
    ],
    [ownerId],
  );

  if (ownerId === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const quickActions: QuickAction[] = [
    {
      icon: 'person-add-outline',
      label: 'Add Fieldworker',
      onPress: () => setIsAddFieldworkerModalOpen(true),
    },
    {
      icon: 'clipboard-outline',
      label: 'Add Task',
      onPress: () => setIsAddTaskModalOpen(true),
    },
    {
      icon: 'cube-outline',
      label: 'Add Item',
      onPress: () => setIsAddItemModalOpen(true),
    },
    {
      icon: 'share-outline',
      label: 'Assign Item',
      onPress: () => setIsAssignItemModalOpen(true),
    },
    {
      icon: 'help-circle-outline',
      label: 'Add Enquiry',
      onPress: () =>
        rootNavigation.navigate('AdminTabsRoot', {
          screen: 'CRM',
          params: { addEnquiryTrigger: Date.now() },
        }),
    },
    {
      icon: 'construct-outline',
      label: 'Add AMC',
      // No hidden-mount trick from here: AMC's add-flow only exists inside
      // AdminHomeScreen's AMC section, so this jumps there directly (same
      // as tapping AMC in the drawer) instead of opening an overlay over
      // whichever tab you're currently on.
      onPress: () =>
        rootNavigation.navigate('AdminTabsRoot', {
          screen: 'Home',
          params: { drawerSection: 'AMC', addAmcTrigger: Date.now() },
        }),
    },
    {
      icon: 'swap-horizontal-outline',
      label: 'Manage Balance',
      onPress: () => setIsManageBalanceModalOpen(true),
    },
  ];

  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName="Home"
        backBehavior="initialRoute"
        screenOptions={{ headerShown: false }}
        tabBar={(props) => {
          const currentRoute = props.state.routes[props.state.index];
          const homeParams =
            currentRoute.name === 'Home'
              ? (currentRoute.params as AdminTabParamList['Home'])
              : undefined;
          const employeeParams =
            currentRoute.name === 'Employee'
              ? (currentRoute.params as AdminTabParamList['Employee'])
              : undefined;
          // "Attendance" shows either because the dashboard card sent us here
          // (attendanceEntry, content still lands on Employee List) or the
          // user is on the Leave sub-tab directly; "Employee List" otherwise.
          const title =
            currentRoute.name === 'Home'
              ? homeParams?.currentSectionTitle ?? 'FieldWeb'
              : currentRoute.name === 'Employee' &&
                  employeeParams?.attendanceEntry
                ? 'Attendance'
                : currentRoute.name === 'notification'
                  ? 'Notification'
                  : currentRoute.name === 'help'
                    ? 'Help & Support'
                    : getAdminTabTitle(currentRoute.name as keyof AdminTabParamList);

          return (
            <>
              {/* Pushed-style screens show their own back-arrow header. */}
              {(MAIN_TABS.includes(currentRoute.name) || MAIN_HEADER_SCREENS.includes(currentRoute.name)) && (
                <AppHeader title={title} navigation={props.navigation as any} isAdmin />
              )}
              <BottomTabBar
                {...props}
                visibleTabs={MAIN_TABS}
                quickActions={quickActions}
              />
            </>
          );
        }}
      >
        <Tab.Screen name="Home">{renderHomeScreen}</Tab.Screen>

        {/* month/year are deliberately NOT passed: the screen owns its own
            month picker when uncontrolled. See MainTaskFragmentNewScreen. */}
        <Tab.Screen name="Task">{renderTaskScreen}</Tab.Screen>

        <Tab.Screen name="CRM">{renderCRMScreen}</Tab.Screen>

        <Tab.Screen
          name="Employee"
          // Clears attendanceEntry once this tab loses focus, so a later
          // direct tap on the Employee tab bar icon shows "Employee List"
          // rather than a stale "Attendance" left over from the dashboard visit.
          listeners={({ navigation }) => ({
            blur: () => navigation.setParams({ attendanceEntry: false }),
          })}
        >
          {renderEmployeeScreen}
        </Tab.Screen>

        {pushedScreens.map(({ name, component, title, initialParams }) => (
          <PushedTabScreen
            key={name}
            name={name}
            component={component}
            initialParams={initialParams}
            options={({ navigation }: any) =>
              MAIN_HEADER_SCREENS.includes(name)
                ? { headerShown: false }
                : pushedScreenOptions(title, navigation)}
          />
        ))}
      </Tab.Navigator>

      <AddTaskModal
        visible={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        ownerId={ownerId}
      />

      <AddItemModal
        visible={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        ownerId={ownerId}
      />

      <AssignItemModal
        visible={isAssignItemModalOpen}
        onClose={() => setIsAssignItemModalOpen(false)}
        ownerId={ownerId}
      />

      <AddFieldworkerModal
        visible={isAddFieldworkerModalOpen}
        onClose={() => setIsAddFieldworkerModalOpen(false)}
        ownerId={ownerId}
      />

      <ManageBalanceModal
        visible={isManageBalanceModalOpen}
        userId={ownerId}
        onClose={() => setIsManageBalanceModalOpen(false)}
      />
    </View>
  );
}

// Task rows come back with inconsistent casing depending on endpoint; this
// mirrors the lookup HomeActivityNewScreen used to do inline.
function getRecordString(
  record: Record<string, unknown>,
  camelKey: string,
  pascalKey: string,
): string {
  const value = record[camelKey] ?? record[pascalKey];
  return typeof value === 'string' ? value : '';
}

export function getAdminTabTitle(
  routeName: keyof AdminTabParamList,
): string {
  switch (routeName) {
    case 'Home':
      return 'FieldWeb';
    case 'Task':
      return 'Tasks';
    case 'CRM':
      return 'CRM';
    case 'Employee':
      return 'Employee List';
    default:
      return 'FieldWeb';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});