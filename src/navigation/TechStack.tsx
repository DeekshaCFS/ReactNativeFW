// src/navigation/TechnicianStack.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';

import TechnicianTabs, { TechnicianTabParamList } from './TechnicianTabs';

import PrivacyPolicyScreen from '../screens/technician/drawer/PrivacyPolicyScreen';
import DocumentUploadScreen from '../screens/technician/main/DocumentUploadScreen';

import { COLORS } from '../theme/theme';

// Route-name map for every technician screen. Most of them are registered in
// TechnicianTabs (hidden from the tab bar so the shared bar shows under them);
// only the Upload Documents sheet is a stack screen here,
// because they must NOT show the tab bar. Names are unchanged, so every existing
// navigation.navigate('X', {...}) call site keeps working — react-navigation
// resolves 'X' by walking the navigator tree until it finds a matching name.
export type TechnicianStackParamList = {
  TechnicianTabsRoot: NavigatorScreenParams<TechnicianTabParamList>;
  // Tab screens (see TechnicianTabs), so screens can navigate to them directly.
  Home: undefined;
  Task: undefined;
  Attendance: undefined;
  Passbook: undefined;
  Leave: undefined;
  notification: undefined;
  help: undefined;
  Profile: undefined;
  'Issued Items': undefined;
  'Requested Items': undefined;
  FOCDetails: { focRequest: any };
  Leads: undefined;
  ItemRequest: { routeTask?: any };
  TaskInput: { routeTask: any };
  QRScanHistory: { task: any };
  Expenditure: undefined;
  'Routine Service': undefined;
  'FieldWeb AI': undefined;
  Settings: undefined;
  PrivacyPolicy: undefined;
  TermsAndConditions: { url?: string } | undefined;
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
  DocumentUpload: { task: any };
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
      {/* The tab navigator draws its own AppHeader / back-arrow header and the
          BottomTabBar, so no native header here to avoid a double header. */}
      <Stack.Screen
        name="TechnicianTabsRoot"
        component={TechnicianTabs}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="DocumentUpload"
        component={DocumentUploadScreen}
        options={{
          title: 'Upload Documents',
          headerShown: false,
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}
