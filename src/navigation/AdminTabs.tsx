// src/navigation/AdminTabs.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  Employee: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

// Task, CRM and Employee all need the owner's id, which none of these
// screens can look up on their own — they take it as a prop. `component=`
// can't pass extra props (React Navigation only gives it route/navigation),
// so each of those three is mounted via a `children` render function
// instead, once the id has loaded.
export default function AdminTabs() {
  const [ownerId, setOwnerId] = useState<number | null>(null);
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

  useEffect(() => {
    AsyncStorage.getItem('uid').then((uid) => {
      if (uid) {
        setOwnerId(Number(uid));
      }
    });
  }, []);

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
        screenOptions={{ headerShown: false }}
        tabBar={(props) => {
          const currentRoute = props.state.routes[props.state.index];
          const homeParams =
            currentRoute.name === 'Home'
              ? (currentRoute.params as AdminTabParamList['Home'])
              : undefined;
          const title =
            currentRoute.name === 'Home'
              ? homeParams?.currentSectionTitle ?? 'FieldWeb'
              : getAdminTabTitle(currentRoute.name as keyof AdminTabParamList);

          return (
            <>
              <AppHeader title={title} navigation={props.navigation as any} />
              <BottomTabBar {...props} quickActions={quickActions} />
            </>
          );
        }}
      >
        <Tab.Screen name="Home" component={AdminHomeScreen} />

        {/* month/year are deliberately NOT passed: the screen owns its own
            month picker when uncontrolled. See MainTaskFragmentNewScreen. */}
        <Tab.Screen name="Task">
          {() => (
            <MainTaskFragmentNewScreen
              userId={ownerId}
              onTaskSelect={(task) => {
                const record = task as Record<string, unknown>;
                rootNavigation.navigate('TaskDetails', {
                  taskId: Number(record.id ?? record.Id) || 0,
                  fallbackTask: task,
                  customerName: getRecordString(record, 'customerName', 'CustomerName'),
                  customerPhone: getRecordString(record, 'contactNo', 'ContactNo'),
                  customerAddress: getRecordString(record, 'fullAddress', 'FullAddress'),
                });
              }}
            />
          )}
        </Tab.Screen>

        <Tab.Screen name="CRM">
          {({ route }) => (
            <CRMScreen
              ownerId={ownerId}
              openAddEnquiryTrigger={route.params?.addEnquiryTrigger}
            />
          )}
        </Tab.Screen>

        <Tab.Screen name="Employee">
          {() => (
            <EmployeeManagementScreen
              ownerId={ownerId}
              contentTopOffset={headerOffset}
            />
          )}
        </Tab.Screen>
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