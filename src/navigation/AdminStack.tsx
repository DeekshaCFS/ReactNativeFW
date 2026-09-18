// src/navigation/AdminStack.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';

import AdminTabs, { AdminTabParamList } from './AdminTabs';

import AdminProfileScreen from '../screens/admin/drawer/AdminProfileScreen';
import EmployeeManagementScreen from '../screens/admin/EmployeeManagementScreen';
import TaskDetailsScreen from '../screens/admin/TaskDetailsScreen';
import type {TasksListResultData} from '../api/task/task.types';
import AMCDetailsScreen from '../screens/admin/AMCDetailsScreen';

// Header destinations (headset/notification icons on the shared AppHeader).
// Admin doesn't have its own versions of these, so it reuses the same
// generic screens the technician stack already registers under the same
// route names -- same reasoning as sharing AppHeader/BottomTabBar.
import NotificationScreen from '../screens/technician/main/NotificationScreen';
import HelpScreen from '../screens/technician/main/HelpScreen';
import HelpMessagesScreen from '../screens/technician/main/HelpMsgScreen';

import { COLORS } from '../theme/theme';

import DisclaimerModal from '../components/DisclaimerModal';
import AddFirstFieldworkerSheet from '../screens/admin/AddFirstFWSheet';

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

  // Task drill-down. Previously rendered inline by HomeActivityNewScreen via
  // its `selectedTaskDetail` state; now a real route so the Task tab can push
  // to it like any other screen.
  TaskDetails: {
    taskId: number;
    fallbackTask?: TasksListResultData | null;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
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

  useEffect(() => {
    AsyncStorage.getItem('uid').then((uid) => {
      if (uid) {
        setOwnerId(Number(uid));
      }
    });
  }, []);

  /**
   * Check whether the current admin has any fieldworkers.
   */
  const checkFieldworkerCount = useCallback(async () => {
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

  useEffect(() => {
    checkDisclaimer();
  }, [checkDisclaimer]);

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
      <Stack.Navigator
        screenOptions={headerOptions}
      >
        {/* Admin bottom tabs */}
        <Stack.Screen
          name="AdminTabsRoot"
          component={AdminTabs}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="Profile"
          component={AdminProfileScreen}
          options={{
            title: 'Profile',
          }}
        />

        <Stack.Screen
          name="Settings"
          options={{
            title: 'Settings',
          }}
        >
          {() =>
            ownerId === null ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <EmployeeManagementScreen ownerId={ownerId} />
            )
          }
        </Stack.Screen>

        <Stack.Screen name="TaskDetails" options={{headerShown: false}}>
          {({route, navigation}) =>
            ownerId === null ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <TaskDetailsScreen
                ownerId={ownerId}
                taskId={route.params.taskId}
                fallbackTask={route.params.fallbackTask}
                customerName={route.params.customerName}
                customerPhone={route.params.customerPhone}
                customerAddress={route.params.customerAddress}
                onBack={() => navigation.goBack()}
              />
            )
          }
        </Stack.Screen>

        <Stack.Screen name="AMCDetails" component={AMCDetailsScreen} />

        {/* Header icon destinations (headset / notification bell on the
            shared AppHeader) -- same routes and screens the technician
            stack uses. */}
        <Stack.Screen
          name="notification"
          component={NotificationScreen}
          options={{ title: 'Notification' }}
        />
        <Stack.Screen
          name="help"
          component={HelpScreen}
          options={{ title: 'Help & Support' }}
        />
        <Stack.Screen
          name="helpMessages"
          component={HelpMessagesScreen}
          options={{ title: 'Help & Support' }}
        />

      </Stack.Navigator>

      {/* Disclaimer */}
      <DisclaimerModal
        visible={!!disclaimerHtml}
        disclaimerHtml={disclaimerHtml ?? ''}
        loading={accepting}
        onAccept={handleAccept}
      />

      {/* First fieldworker */}
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});