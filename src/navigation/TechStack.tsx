// src/navigation/TechnicianStack.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';

import TechnicianTabs, { TechnicianTabParamList } from './TechnicianTabs';

import TaskTrackingScreen from '../screens/technician/main/TaskTrackingScreen';
import TaskExecutionScreen from '../screens/technician/main/TaskExecutionScreen';
import TaskRouteMapScreen from '../screens/technician/main/TaskRouteMapScreen';
import TaskClosureScreen from '../screens/technician/main/TaskClosureScreen';
import TaskSummaryScreen from '../screens/technician/main/TaskSummaryScreen';
import PaymentReceivedScreen from '../screens/technician/main/PaymentReceivedScreen';
import LeaveScreen from '../screens/technician/main/LeaveScreen';

import ItemRequestScreen from '../screens/technician/main/ItemRequestScreen';
import TaskInputScreen from '../screens/technician/main/TaskInputScreen';

import AddQuoteScreen from '../screens/technician/main/AddQuoteScreen';
import AddInvoiceScreen from '../screens/technician/main/AddInvoiceScreen';
import AddLeadScreen from '../screens/technician/main/AddLeadScreen';

import NotificationScreen from '../screens/technician/main/NotificationScreen';
import HelpScreen from '../screens/technician/main/HelpScreen';
import HelpMessagesScreen from '../screens/technician/main/HelpMsgScreen';

import TechProfileScreen from '../screens/technician/drawer/TechProfileScreen';
import IssuedItems from '../screens/technician/drawer/IssuedItems';
import RequestedItems from '../screens/technician/drawer/RequestedItems';
import ExpenditureScreen from '../screens/technician/drawer/ExpenditureScreen';
import ServiceScreen from '../screens/technician/drawer/ServiceScreen';
import AIScreen from '../screens/technician/drawer/AIScreen';
import SettingScreen from '../screens/technician/drawer/SettingScreen';
import PrivacyPolicyScreen from '../screens/technician/drawer/PrivacyPolicyScreen';
import RefundPolicyScreen from '../screens/technician/drawer/RefundPolicy';
import AboutFieldwebScreen from '../screens/technician/drawer/AboutFieldweb';
import AMCListScreen from '../screens/technician/drawer/AMCListScreen';
import AMCDetailsScreen from '../screens/technician/main/AMCDetailsScreen';

import { COLORS } from '../theme/theme';

// Every screen name below is unchanged from before, so every existing
// navigation.navigate('X', {...}) call site in your screens keeps working
// with zero edits — react-navigation resolves 'X' by walking up through
// parent navigators until it finds a matching screen name.
export type TechnicianStackParamList = {
  TechnicianTabsRoot: NavigatorScreenParams<TechnicianTabParamList>;
  Leave: undefined;
  AddQuote: undefined;
  AddInvoice: undefined;
  AddLead: undefined;
  notification: undefined;
  help: undefined;
  helpMessages: undefined;
  Profile: undefined;
  'Issued Items': undefined;
  'Requested Items': undefined;
  ItemRequest: { routeTask?: any };
  TaskInput: { routeTask: any };
  Expenditure: undefined;
  'Routine Service': undefined;
  'FieldWeb AI': undefined;
  Settings: undefined;
  PrivacyPolicy: undefined;
  RefundPolicy: undefined;
  AboutFieldweb: undefined;
  AMC: undefined;
  AMCDetails: { amcsId: number; amcServiceDetailsId?: number };
  TaskRouteMap: { task: any };
  TaskExecution: { task: any };
  TaskTracking: { task: any; autoReject?: boolean; resumeOnHold?: boolean };
  PaymentReceived: { task: any; elapsedSeconds?: number };
  TaskClosure: { task: any; elapsedSeconds?: number };
  TaskSummary: { task: any; elapsedSeconds?: number; payload: any; preview: any };
};

const Stack = createNativeStackNavigator<TechnicianStackParamList>();

const headerOptions = {
  headerStyle: { backgroundColor: COLORS.primary },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' as const },
};

export default function TechnicianStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      {/* The tab bar itself — draws its own AppHeader/BottomTabBar, so no
          native header here to avoid a double header. */}
      <Stack.Screen
        name="TechnicianTabsRoot"
        component={TechnicianTabs}
        options={{ headerShown: false }}
      />

      {/* Task flow — pushed on top of the tab bar, native back gesture works */}
      <Stack.Screen name="TaskRouteMap" component={TaskRouteMapScreen} options={{ title: 'Route' }} />
      <Stack.Screen name="TaskExecution" component={TaskExecutionScreen} options={{ title: 'Task' }} />
      <Stack.Screen name="TaskTracking" component={TaskTrackingScreen} options={{ title: 'Tasks' }} />
      <Stack.Screen name="TaskClosure" component={TaskClosureScreen} options={{ title: 'Task Details' }} />
      <Stack.Screen name="TaskSummary" component={TaskSummaryScreen} options={{ title: 'Task Details' }} />
      <Stack.Screen name="PaymentReceived" component={PaymentReceivedScreen} options={{ title: 'Payment' }} />
      <Stack.Screen name="ItemRequest" component={ItemRequestScreen} options={{ title: 'Task Details' }} />
      <Stack.Screen name="TaskInput" component={TaskInputScreen} options={{ title: 'Task Details' }} />

      <Stack.Screen name="Leave" component={LeaveScreen} options={{ title: 'Attendance' }} />

      {/* Quick-action FAB destinations */}
      <Stack.Screen name="AddQuote" component={AddQuoteScreen} options={{ title: 'Add Quote' }} />
      <Stack.Screen name="AddInvoice" component={AddInvoiceScreen} options={{ title: 'Add Invoice' }} />
      <Stack.Screen name="AddLead" component={AddLeadScreen} options={{ title: 'Add Lead' }} />

      {/* Header icon / misc */}
      <Stack.Screen name="notification" component={NotificationScreen} options={{ title: 'Notification' }} />
      <Stack.Screen name="help" component={HelpScreen} options={{ title: 'Help & Support' }} />
      <Stack.Screen name="helpMessages" component={HelpMessagesScreen} options={{ title: 'Help & Support' }} />

      {/* Drawer destinations */}
      <Stack.Screen name="Profile" component={TechProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="Issued Items" component={IssuedItems} options={{ title: 'Item Inventory' }} />
      <Stack.Screen name="Requested Items" component={RequestedItems} options={{ title: 'Item Inventory' }} />
      <Stack.Screen name="Expenditure" component={ExpenditureScreen} options={{ title: 'Expenditure' }} />
      <Stack.Screen name="Routine Service" component={ServiceScreen} options={{ title: 'Routine Service' }} />
      <Stack.Screen name="FieldWeb AI" component={AIScreen} options={{ title: 'FieldWeb AI' }} />
      <Stack.Screen name="Settings" component={SettingScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="RefundPolicy" component={RefundPolicyScreen} options={{ title: 'Refund Policy' }} />
      <Stack.Screen name="AboutFieldweb" component={AboutFieldwebScreen} options={{ title: 'About FieldWeb' }} />
      <Stack.Screen name="AMC" component={AMCListScreen} options={{ title: 'AMC' }} />
      <Stack.Screen name="AMCDetails" component={AMCDetailsScreen} options={{ title: 'AMC Details' }} />
    </Stack.Navigator>
  );
}