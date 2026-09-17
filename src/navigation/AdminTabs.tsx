// // src/navigation/AdminTabs.tsx
// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   StyleSheet,
//   ActivityIndicator,
//   Modal,
//   Pressable,
//   Text,
//   TouchableOpacity,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {
//   createBottomTabNavigator,
// } from '@react-navigation/bottom-tabs';
// import { DrawerActions, useNavigation } from '@react-navigation/native';
// import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import BottomTabBar from '../components/BottomTabBar';
// // Note: unlike TechnicianTabs, AppHeader isn't rendered here. Every admin tab
// // screen (AdminHomeScreen, MainTaskFragmentNewScreen, CRMScreen,
// // EmployeeManagementScreen) draws its own toolbar, each with different title,
// // filters, and actions — there's no single generic header that fits all four
// // without duplicating what the screen already draws. getAdminTabTitle below
// // is unused for that reason; it's kept for a future shared-header pass, not
// // wired up here.

// // Existing admin screens in the uploaded project
// import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
// import MainTaskFragmentNewScreen from '../screens/admin/MainTaskFragmentNewScreen';
// import CRMScreen from '../screens/admin/CRMScreen';
// import EmployeeManagementScreen from '../screens/admin/EmployeeManagementScreen';
// import AddTaskModal from '../screens/admin/AddTaskModal';
// import AddItemModal from '../screens/admin/AddItemModal';
// import AssignItemModal from '../screens/admin/AssignItemModal';
// import AddFieldworkerModal from '../screens/admin/AddFieldworkerModal';
// import ManageBalanceModal from '../screens/admin/ManageBalanceModal';

// import { COLORS } from '../theme/theme';
// import type { AdminStackParamList } from './AdminStack';

// export type AdminTabParamList = {
//   // Optional `drawerSection` lets CustomDrawerContent open a specific
//   // internal section of HomeActivityNewScreen (Leads, AMC, etc.) directly,
//   // the same way the technician drawer deep-links into a stack screen.
//   // `addAmcTrigger` mirrors `addEnquiryTrigger` on CRM below -- the shared
//   // FAB's "Add AMC" item sends it here from any tab.
//   Home: { drawerSection?: string; addAmcTrigger?: number } | undefined;
//   Task: undefined;
//   // Quick-add "Add Enquiry" lives on the Home tab but opens a CRM sheet, so
//   // the signal crosses routes as a param. Any changing value re-triggers it.
//   CRM: { addEnquiryTrigger?: number } | undefined;
//   Employee: undefined;
// };

// type QuickAddItem = {
//   key: string;
//   label: string;
//   icon: string;
// };

// const QUICK_ADD_ITEMS: QuickAddItem[] = [
//   { key: 'add_fieldworker', label: 'Add Fieldworker', icon: '🧑‍🔧' },
//   { key: 'add_task', label: 'Add Task', icon: '📝' },
//   { key: 'add_item', label: 'Add Item', icon: '📦' },
//   { key: 'assign_item', label: 'Assign Item', icon: '📤' },
//   { key: 'add_enquiry', label: 'Add Enquiry', icon: '❓' },
//   { key: 'add_amc', label: 'Add AMC', icon: '🔧' },
//   { key: 'manage_balance', label: 'Manage Balance', icon: '💱' },
// ];

// const Tab = createBottomTabNavigator<AdminTabParamList>();

// // Task, CRM and Employee all need the owner's id, which none of these
// // screens can look up on their own — they take it as a prop. `component=`
// // can't pass extra props (React Navigation only gives it route/navigation),
// // so each of those three is mounted via a `children` render function
// // instead, once the id has loaded.
// export default function AdminTabs() {
//   const [ownerId, setOwnerId] = useState<number | null>(null);
//   // Parent stack navigator — used to push TaskDetails from the Task tab,
//   // and to reach a sibling tab from the FAB below.
//   const rootNavigation =
//     useNavigation<NativeStackNavigationProp<AdminStackParamList>>();

//   // Quick-add FAB. Previously owned by AdminHomeScreen and only reachable
//   // from the Home tab; lifted here so it's rendered once, above the
//   // Tab.Navigator, and stays visible across all four tabs -- the same
//   // reasoning that put BottomTabBar at this level instead of inside a
//   // screen.
//   const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
//   const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
//   const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
//   const [isAssignItemModalOpen, setIsAssignItemModalOpen] = useState(false);
//   const [isAddFieldworkerModalOpen, setIsAddFieldworkerModalOpen] = useState(false);
//   const [isManageBalanceModalOpen, setIsManageBalanceModalOpen] = useState(false);

//   useEffect(() => {
//     AsyncStorage.getItem('uid').then((uid) => {
//       if (uid) {
//         setOwnerId(Number(uid));
//       }
//     });
//   }, []);

//   if (ownerId === null) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//       </View>
//     );
//   }

//   const handleQuickAddItemPress = (item: QuickAddItem) => {
//     setIsQuickAddModalOpen(false);
//     if (item.key === 'add_task') {
//       setIsAddTaskModalOpen(true);
//     } else if (item.key === 'add_item') {
//       setIsAddItemModalOpen(true);
//     } else if (item.key === 'assign_item') {
//       setIsAssignItemModalOpen(true);
//     } else if (item.key === 'add_fieldworker') {
//       setIsAddFieldworkerModalOpen(true);
//     } else if (item.key === 'manage_balance') {
//       setIsManageBalanceModalOpen(true);
//     } else if (item.key === 'add_enquiry') {
//       rootNavigation.navigate('AdminTabsRoot', {
//         screen: 'CRM',
//         params: { addEnquiryTrigger: Date.now() },
//       });
//     } else if (item.key === 'add_amc') {
//       // No hidden-mount trick from here: AMC's add-flow only exists inside
//       // AdminHomeScreen's AMC section, so this jumps there directly (same
//       // as tapping AMC in the drawer) instead of opening an overlay over
//       // whichever tab you're currently on.
//       rootNavigation.navigate('AdminTabsRoot', {
//         screen: 'Home',
//         params: { drawerSection: 'AMC', addAmcTrigger: Date.now() },
//       });
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Tab.Navigator
//         initialRouteName="Home"
//         screenOptions={{ headerShown: false }}
//         tabBar={(props) => <BottomTabBar {...props} quickActions={[]} />}
//       >
//         <Tab.Screen name="Home" component={AdminHomeScreen} />

//         {/* month/year are deliberately NOT passed: the screen owns its own
//             month picker when uncontrolled. See MainTaskFragmentNewScreen. */}
//         <Tab.Screen name="Task">
//           {({ navigation }) => (
//             <MainTaskFragmentNewScreen
//               userId={ownerId}
//               onMenuPress={() =>
//                 navigation.dispatch(DrawerActions.openDrawer())
//               }
//               onTaskSelect={(task) => {
//                 const record = task as Record<string, unknown>;
//                 rootNavigation.navigate('TaskDetails', {
//                   taskId: Number(record.id ?? record.Id) || 0,
//                   fallbackTask: task,
//                   customerName: getRecordString(record, 'customerName', 'CustomerName'),
//                   customerPhone: getRecordString(record, 'contactNo', 'ContactNo'),
//                   customerAddress: getRecordString(record, 'fullAddress', 'FullAddress'),
//                 });
//               }}
//             />
//           )}
//         </Tab.Screen>

//         <Tab.Screen name="CRM">
//           {({ navigation, route }) => (
//             <CRMScreen
//               ownerId={ownerId}
//               onMenuPress={() =>
//                 navigation.dispatch(DrawerActions.openDrawer())
//               }
//               openAddEnquiryTrigger={route.params?.addEnquiryTrigger}
//             />
//           )}
//         </Tab.Screen>

//         <Tab.Screen name="Employee">
//           {({ navigation }) => (
//             <EmployeeManagementScreen
//               ownerId={ownerId}
//               onMenuPress={() =>
//                 navigation.dispatch(DrawerActions.openDrawer())
//               }
//             />
//           )}
//         </Tab.Screen>
//       </Tab.Navigator>

//       <TouchableOpacity
//         style={styles.fab}
//         onPress={() => setIsQuickAddModalOpen(true)}
//       >
//         <Text style={styles.fabText}>+</Text>
//       </TouchableOpacity>

//       <Modal
//         visible={isQuickAddModalOpen}
//         transparent
//         animationType="slide"
//         onRequestClose={() => setIsQuickAddModalOpen(false)}
//       >
//         <Pressable
//           style={styles.quickAddBackdrop}
//           onPress={() => setIsQuickAddModalOpen(false)}
//         >
//           <Pressable style={styles.quickAddPanel}>
//             <TouchableOpacity
//               style={styles.quickAddCloseButton}
//               onPress={() => setIsQuickAddModalOpen(false)}
//             >
//               <Text style={styles.quickAddCloseIcon}>✕</Text>
//             </TouchableOpacity>
//             {QUICK_ADD_ITEMS.map(item => (
//               <TouchableOpacity
//                 key={item.key}
//                 style={styles.quickAddItem}
//                 onPress={() => handleQuickAddItemPress(item)}
//               >
//                 <Text style={styles.quickAddItemIcon}>{item.icon}</Text>
//                 <Text style={styles.quickAddItemLabel}>{item.label}</Text>
//               </TouchableOpacity>
//             ))}
//           </Pressable>
//         </Pressable>
//       </Modal>

//       <AddTaskModal
//         visible={isAddTaskModalOpen}
//         onClose={() => setIsAddTaskModalOpen(false)}
//         ownerId={ownerId}
//       />

//       <AddItemModal
//         visible={isAddItemModalOpen}
//         onClose={() => setIsAddItemModalOpen(false)}
//         ownerId={ownerId}
//       />

//       <AssignItemModal
//         visible={isAssignItemModalOpen}
//         onClose={() => setIsAssignItemModalOpen(false)}
//         ownerId={ownerId}
//       />

//       <AddFieldworkerModal
//         visible={isAddFieldworkerModalOpen}
//         onClose={() => setIsAddFieldworkerModalOpen(false)}
//         ownerId={ownerId}
//       />

//       <ManageBalanceModal
//         visible={isManageBalanceModalOpen}
//         userId={ownerId}
//         onClose={() => setIsManageBalanceModalOpen(false)}
//       />
//     </View>
//   );
// }

// // Task rows come back with inconsistent casing depending on endpoint; this
// // mirrors the lookup HomeActivityNewScreen used to do inline.
// function getRecordString(
//   record: Record<string, unknown>,
//   camelKey: string,
//   pascalKey: string,
// ): string {
//   const value = record[camelKey] ?? record[pascalKey];
//   return typeof value === 'string' ? value : '';
// }

// export function getAdminTabTitle(
//   routeName: keyof AdminTabParamList,
// ): string {
//   switch (routeName) {
//     case 'Home':
//       return 'FieldWeb';
//     case 'Task':
//       return 'Tasks';
//     case 'CRM':
//       return 'CRM';
//     case 'Employee':
//       return 'Employee List';
//     default:
//       return 'FieldWeb';
//   }
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   fab: {
//     position: 'absolute',
//     bottom: 24,
//     alignSelf: 'center',
//     width: 62,
//     height: 62,
//     borderRadius: 31,
//     backgroundColor: COLORS.primary,
//     alignItems: 'center',
//     justifyContent: 'center',
//     elevation: 4,
//     shadowColor: '#000000',
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 3 },
//   },
//   fabText: {
//     color: '#FFFFFF',
//     fontSize: 36,
//     lineHeight: 40,
//     fontWeight: '300',
//   },
//   quickAddBackdrop: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.35)',
//     justifyContent: 'flex-end',
//   },
//   quickAddPanel: {
//     backgroundColor: '#FFFFFF',
//     borderTopLeftRadius: 16,
//     borderTopRightRadius: 16,
//     paddingHorizontal: 24,
//     paddingTop: 20,
//     paddingBottom: 32,
//   },
//   quickAddCloseButton: {
//     position: 'absolute',
//     top: 16,
//     right: 20,
//     zIndex: 1,
//     padding: 4,
//   },
//   quickAddCloseIcon: {
//     color: COLORS.primary,
//     fontSize: 18,
//     fontWeight: '700',
//   },
//   quickAddItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 14,
//   },
//   quickAddItemIcon: {
//     fontSize: 20,
//     color: COLORS.primary,
//     width: 32,
//   },
//   quickAddItemLabel: {
//     fontSize: 15,
//     fontWeight: '700',
//     color: '#1F2937',
//   },
// });

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