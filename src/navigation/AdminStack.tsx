// src/navigation/AdminStack.tsx

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import ToastHost from '../components/ToastHost';

import AdminTabs, { AdminTabParamList } from './AdminTabs';

import type {TasksListResultData} from '../api/task/task.types';

// Header destinations (headset / bell on the shared AppHeader) live in AdminTabs:
// help reuses the technician HelpChatScreen, notification has AdminNotificationScreen.

// Settings destinations (Privacy/Refund/About rows) -- same reuse pattern
// as the header destinations above; these screens are role-agnostic.

// Drawer destinations. AIScreen is role-agnostic (Java's OpenAIFragment is the
// same for owner and technician); BookDemoScreen ports BookDemoFragment.

import { COLORS } from '../theme/theme';

import DisclaimerModal from '../components/DisclaimerModal';
import AddFirstFieldworkerSheet from '../screens/admin/AddFirstFWSheet';

import CheckInGate from '../components/CheckInGate';
import { isSubAdmin } from '../utils/userRole';

import { getAllUsersList } from '../api/users/usersService';
import { addBulkFieldworkers } from '../api/umEmployeeList/umEmployeeListService';

import {
  getUserDisclaimer,
  acceptDisclaimer,
  isDisclaimerAcceptedResponse,
} from '../api/userDisclaimer/userDisclaimerService';

export type AdminStackParamList = {
  AdminTabsRoot: NavigatorScreenParams<AdminTabParamList>;

  Profile: undefined;
  Settings: undefined;
  BankDetailsTax: undefined;
  PrivacyPolicy: undefined;
  TermsAndConditions: { url?: string } | undefined;
  RefundPolicy: undefined;
  AboutFieldweb: undefined;

  // Drawer destinations (route names match the drawer labels).
  'FieldWeb AI': undefined;
  'Book App Demo': undefined;

  // Task drill-down. Previously rendered inline by HomeActivityNewScreen via
  // its `selectedTaskDetail` state; now a real route so the Task tab can push
  // to it like any other screen.
  TaskDetails: {
    taskId: number;
    fallbackTask?: TasksListResultData | null;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    /** See TaskDetailsScreen.source. */
    source?: 'crm' | 'taskList';
    /** Where the back button goes; when absent it pops the tab history. */
    returnTo?: {name: string; params?: Record<string, unknown>};
  };

  AMCDetails: {
    amcItem: Record<string, unknown>;
    amcServiceDetailsId: number;
    amcsId: number;
    ownerId: number;
  };

  // Header destinations
  help: undefined;
  notification: undefined;
  helpMessages: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

const headerOptions = {
  headerStyle: {
    backgroundColor: COLORS.primary,
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: '600' as const,
  },
};

export default function AdminStack() {
  const [disclaimerHtml, setDisclaimerHtml] = useState<string | null>(null);
  const [dcn, setDcn] = useState('');
  const [accepting, setAccepting] = useState(false);

  const [showAddFieldworkerSheet, setShowAddFieldworkerSheet] =
    useState(false);

  const [ownerId, setOwnerId] = useState<number | null>(null);

  // Sub-admin: daily check-in, and the disclaimer like Java HomeActivityNew
  // (SUBADMIN is in its checkDisclaimer guard). The "add first fieldworker"
  // sheet stays owner/admin-only, so it is skipped for sub-admin.
  const [roleChecked, setRoleChecked] = useState(false);
  const [subAdminUser, setSubAdminUser] = useState(false);
  const subAdminRef = useRef(false);

  useEffect(() => {
    AsyncStorage.multiGet(['role', 'group_id']).then(
      ([[, role], [, groupId]]) => {
        const sub = isSubAdmin(role, groupId);
        subAdminRef.current = sub;
        setSubAdminUser(sub);
        setRoleChecked(true);
      },
    );
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('uid').then((uid) => {
      if (uid) {
        setOwnerId(Number(uid));
      }
    });
  }, []);

  // AdminTabs needs the same id; passed down as a prop instead of letting it
  // do its own AsyncStorage read, so the two don't race/duplicate the lookup.
  const renderAdminTabs = useCallback(
    () => (
      <>
        <AdminTabs ownerId={ownerId} />
        {/* Native-stack screen: needs its own toast host above it (see withToastHost.tsx). */}
        <ToastHost />
      </>
    ),
    [ownerId],
  );

  /**
   * Check whether the current admin has any fieldworkers.
   */
  const checkFieldworkerCount = useCallback(async () => {
    // Owner/admin only; sub-admin never gets the first-fieldworker sheet.
    if (subAdminRef.current) {
      return;
    }
    try {
      const uid = await AsyncStorage.getItem('uid');

      if (!uid) {
        return;
      }

      const response = await getAllUsersList({
        OwnerId: Number(uid),
        PinCode: '',
        RoleId: 0,
        OnlyList: false,
      });

      const count = response?.ResultData?.length ?? 0;

      setShowAddFieldworkerSheet(count === 0);
    } catch (error) {
      console.log(
        'Unable to check fieldworker count:',
        error,
      );
    }
  }, []);

  /**
   * Check the disclaimer status.
   *
   * The first-fieldworker sheet is only checked after
   * the disclaimer has already been accepted.
   */
  const checkDisclaimer = useCallback(async () => {
    try {
      const uid = await AsyncStorage.getItem('uid');

      if (!uid) {
        return;
      }

      const response = await getUserDisclaimer(Number(uid));

      if (isDisclaimerAcceptedResponse(response)) {
        setDisclaimerHtml(null);

        await checkFieldworkerCount();
        return;
      }

      if (response?.ResultData) {
        setDisclaimerHtml(
          response.ResultData.DisclaimerHtml ?? '',
        );

        setDcn(
          response.ResultData.DCN ?? '',
        );
      }
    } catch (error) {
      console.log(
        'Unable to check disclaimer:',
        error,
      );
    }
  }, [checkFieldworkerCount]);

  // Runs for every role, sub-admin included (Java HomeActivityNew.checkDisclaimer).
  useEffect(() => {
    if (roleChecked) {
      checkDisclaimer();
    }
  }, [roleChecked, checkDisclaimer]);

  /**
   * Accept disclaimer.
   */
  const handleAccept = async () => {
    try {
      const uid = await AsyncStorage.getItem('uid');

      if (!uid) {
        return;
      }

      setAccepting(true);

      const response = await acceptDisclaimer({
        UserId: Number(uid),
        DCN: dcn,
      });

      if (isDisclaimerAcceptedResponse(response)) {
        setDisclaimerHtml(null);

        await checkFieldworkerCount();
      } else {
        await checkDisclaimer();
      }
    } catch (error) {
      console.log(
        'Unable to accept disclaimer:',
        error,
      );

      await checkDisclaimer();
    } finally {
      setAccepting(false);
    }
  };

  /**
   * Add the first fieldworker.
   */
  const handleAddFieldworker = async (data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  }) => {
    const uid = await AsyncStorage.getItem('uid');

    if (!uid) {
      throw new Error('User ID not found.');
    }

    const userId = Number(uid);

    const zoneId =
      await AsyncStorage.getItem('zone_id');

    const designationId =
      await AsyncStorage.getItem('user_group_id');

    const response = await addBulkFieldworkers([
      {
        UserId: userId,
        CreatedBy: userId,
        UserGroupCode: 2,

        ServicezoneId: zoneId
          ? Number(zoneId)
          : 0,

        DesignationId: designationId
          ? Number(designationId)
          : 0,

        FieldworkerBulkInsertArray: [
          {
            AE_FW_Firstname: data.firstName,
            AE_FW_Lastname: data.lastName,
            AE_FW_Contact: data.phoneNumber,
          },
        ],
      },
    ]);

    if (
      response?.Code === '200' ||
      response?.Code === 200
    ) {
      setShowAddFieldworkerSheet(false);
      return;
    }

    throw new Error(
      response?.Message ||
        'Could not add fieldworker.',
    );
  };

  return (
    <>
      <Stack.Navigator screenOptions={headerOptions}>
        {/* The tab navigator draws its own AppHeader / back-arrow header and the
            BottomTabBar (every other admin screen is registered there as a
            hidden tab), so no native header here. */}
        <Stack.Screen
          name="AdminTabsRoot"
          options={{
            headerShown: false,
          }}
        >
          {renderAdminTabs}
        </Stack.Screen>
      </Stack.Navigator>

      {/* Sub-admin daily check-in (Java checkAttendance / showAttendanceMarkDialog) */}
      {subAdminUser ? <CheckInGate /> : null}

      {/* Disclaimer (owner/admin only) */}
      <DisclaimerModal
        visible={!!disclaimerHtml}
        disclaimerHtml={disclaimerHtml ?? ''}
        loading={accepting}
        onAccept={handleAccept}
      />

      {/* First fieldworker (owner/admin only) */}
      <AddFirstFieldworkerSheet
        visible={showAddFieldworkerSheet}
        onClose={() =>
          setShowAddFieldworkerSheet(false)
        }
        onSubmit={handleAddFieldworker}
      />
    </>
  );
}