// src/screens/admin/TaskDetailsScreen.tsx

import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {getTaskById} from '../../api/task/taskService';
import type {
  TasksList,
  TasksListResultData,
  TasksListMultipleItemAssigned,
} from '../../api/task/task.types';
import type {TaskListItem} from './adminLegacyApiTypes';
import {getStringField} from './CRMScreen';

type TaskDetailsTask = TasksListResultData | TaskListItem;

type TaskDetailsScreenProps = {
  ownerId: number;
  taskId: number;
  fallbackTask?: TaskDetailsTask | null;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  onBack: () => void;
};

const THEME_PRIMARY = '#c3002f';

const getString = (
  item: Record<string, unknown>,
  camelKey: string,
  pascalKey: string,
) => {
  const value = item[camelKey] ?? item[pascalKey];
  return typeof value === 'string' ? value.trim() : '';
};

const getTaskId = (item: TaskDetailsTask) => Number(item.Id) || 0;

const getNewTaskId = (item: TaskDetailsTask) =>
  getString(item as Record<string, unknown>, 'newTaskId', 'NewTaskId') ||
  getString(item as Record<string, unknown>, 'newTaskID', 'NewTaskID');

const getTaskStatus = (item: TaskDetailsTask) =>
  getString(item as Record<string, unknown>, 'taskStatus', 'TaskStatus') ||
  'Unknown';

const getStatusColor = (status: string) => {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'ongoing') {
    return '#FF9800';
  }
  if (normalized === 'completed') {
    return '#18a957';
  }
  if (normalized === 'rejected') {
    return '#d32f2f';
  }
  if (normalized === 'inactive') {
    return '#7E8794';
  }
  if (normalized === 'onhold') {
    return '#9c27b0';
  }
  return THEME_PRIMARY;
};

const getFieldworkerAvailability = (status: string) => {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'inactive') {
    return 'is currently Absent or Unavailable';
  }
  if (normalized === 'onhold') {
    return 'is currently On Hold';
  }
  if (normalized === 'ongoing') {
    return 'is currently working on this task';
  }
  if (normalized === 'completed') {
    return 'has completed this task';
  }
  if (normalized === 'rejected') {
    return 'has rejected this task';
  }
  return '';
};

const NA = 'NA';

const valueOrNA = (value: string) => (value ? value : NA);

const getIssuedQty = (item: TasksListMultipleItemAssigned) => {
  const value = item.ItemQuantity;
  return value === undefined || value === null ? NA : String(value);
};

const getUsedQty = (item: TasksListMultipleItemAssigned) => {
  const value = item.UsedItemQty;
  return value === undefined || value === null ? NA : String(value);
};

const getItemName = (item: TasksListMultipleItemAssigned) =>
  getStringField(item as Record<string, unknown>, ['itemName', 'ItemName']) ||
  'Item';

const openWhatsapp = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return;
  }
  Linking.openURL(`https://wa.me/${digits}`).catch(() => {});
};

const openCall = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return;
  }
  Linking.openURL(`tel:${digits}`).catch(() => {});
};

const TaskDetailsScreen = ({
  ownerId,
  taskId,
  fallbackTask,
  customerName,
  customerPhone,
  customerAddress,
  onBack,
}: TaskDetailsScreenProps) => {
  const [task, setTask] = useState<TaskDetailsTask | null>(fallbackTask ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const avatarRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotateLoop = Animated.loop(
      Animated.timing(avatarRotation, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    rotateLoop.start();
    return () => rotateLoop.stop();
  }, [avatarRotation]);

  const avatarRotationStyle = {
    transform: [
      {
        rotate: avatarRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  useEffect(() => {
    let isMounted = true;
    const fetchTaskDetails = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getTaskById({
          UserId: ownerId,
          TaskId: taskId,
        });
        const result: TasksList['ResultData'] = response?.ResultData ?? undefined;
        const item = Array.isArray(result) ? result[0] ?? null : result ?? null;
        if (isMounted && item) {
          setTask(item);
        }
      } catch (fetchError) {
        if (isMounted) {
          const message =
            fetchError instanceof Error
              ? fetchError.message
              : 'Unable to load task details.';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (taskId) {
      fetchTaskDetails();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [ownerId, taskId]);

  const record = (task ?? {}) as Record<string, unknown>;

  const status = task ? getTaskStatus(task) : '';
  const newTaskId = task ? getNewTaskId(task) : '';
  const displayTaskId = newTaskId || (taskId ? String(taskId) : '');

  const taskName = getStringField(record, ['name', 'Name']);
  const taskTag = getStringField(record, [
    'task_TagName',
    'Task_TagName',
    'taskTagName',
    'TaskTagName',
  ]);
  const paymentMode = getStringField(record, ['paymentMode', 'PaymentMode']);
  const employeeName = getStringField(record, ['assignedTo', 'AssignedTo']);

  const itemDetails =
    (record.itemDetails as TasksListMultipleItemAssigned[] | undefined) ??
    (record.ItemDetails as TasksListMultipleItemAssigned[] | undefined) ??
    (record.multipleItemAssigned as TasksListMultipleItemAssigned[] | undefined) ??
    (record.MultipleItemAssigned as TasksListMultipleItemAssigned[] | undefined) ??
    [];

  const custName =
    getStringField(record, ['customerName', 'CustomerName']) ||
    customerName ||
    '';
  const custPhone =
    getStringField(record, ['contactNo', 'ContactNo']) || customerPhone || '';
  const custAddress =
    getStringField(record, ['fullAddress', 'FullAddress']) ||
    customerAddress ||
    '';
  const landmark = getStringField(record, [
    'landMark',
    'LandMark',
    'landmark',
    'Landmark',
  ]);

  const responseCode = getStringField(record, ['responseCode', 'ResponseCode']);
  const satisfactionCode = getStringField(record, [
    'satisfactionCode',
    'SatisfactionCode',
  ]);
  const fieldworkerAvailability = getFieldworkerAvailability(status);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerIconButton}>
          <Text style={styles.headerIconText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerRightActions}>
          <Text style={styles.headerIconText}>🎧</Text>
          <Text style={styles.headerIconText}>🔔</Text>
        </View>
      </View>

      <View style={styles.avatarWrap}>
        <Animated.View style={[styles.avatarCircle, avatarRotationStyle]}>
          <Text style={styles.avatarIcon}>👤</Text>
        </Animated.View>
        {employeeName ? (
          <Text style={styles.avatarName}>{employeeName}</Text>
        ) : null}
        {fieldworkerAvailability ? (
          <Text style={styles.avatarAvailability}>
            {fieldworkerAvailability}
          </Text>
        ) : null}
      </View>

      {isLoading && !task ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={THEME_PRIMARY} size="large" />
        </View>
      ) : error && !task ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
        >
          <View style={styles.statusActionsRow}>
            <Text
              style={[styles.statusLabel, {color: getStatusColor(status)}]}
            >
              {status || NA}
            </Text>
            <View style={styles.actionIconsRow}>
              <TouchableOpacity
                style={styles.actionIconButton}
                onPress={() => openWhatsapp(custPhone)}
              >
                <Text style={styles.actionIconText}>💬</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionIconButton}
                onPress={() => openCall(custPhone)}
              >
                <Text style={styles.actionIconText}>📞</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.sectionHeading}>Task Details</Text>
            {displayTaskId ? (
              <Text style={styles.taskIdText}> [{displayTaskId}]</Text>
            ) : null}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Task Name</Text>
            <Text style={styles.fieldValue}>{valueOrNA(taskName)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Task Tag</Text>
            <Text style={styles.fieldValue}>{valueOrNA(taskTag)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Payment Mode</Text>
            <Text style={styles.fieldValue}>{valueOrNA(paymentMode)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Fieldworker</Text>
            <Text style={styles.fieldValue}>{valueOrNA(employeeName)}</Text>
          </View>

          <View style={styles.itemDetailsHeaderRow}>
            <Text style={[styles.sectionHeading, styles.itemNameHeading]}>
              Item Details
            </Text>
            <Text style={styles.itemColumnHeading}>Issued Qty</Text>
            <Text style={styles.itemColumnHeading}>Used Qty</Text>
          </View>
          {itemDetails.length > 0 ? (
            itemDetails.map((item, index) => (
              <View key={index} style={styles.itemDetailsRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {getItemName(item)}
                </Text>
                <Text style={styles.itemQty}>{getIssuedQty(item)}</Text>
                <Text style={styles.itemQty}>{getUsedQty(item)}</Text>
              </View>
            ))
          ) : null}

          <Text style={[styles.sectionHeading, styles.sectionSpacing]}>
            Customer Details
          </Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Customer Name</Text>
            <Text style={styles.fieldValue}>{valueOrNA(custName)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Customer Number</Text>
            <Text style={styles.fieldValue}>{valueOrNA(custPhone)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Address</Text>
            <Text style={styles.fieldValue}>{valueOrNA(custAddress)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Landmark</Text>
            <Text style={styles.fieldValue}>
              {landmark ? landmark : 'na'}
            </Text>
          </View>

          <Text style={[styles.sectionHeading, styles.sectionSpacing]}>
            Code's Detail
          </Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Response Code:</Text>
            <Text style={styles.fieldValue}>{valueOrNA(responseCode)}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Satisfaction Code:</Text>
            <Text style={styles.fieldValue}>
              {valueOrNA(satisfactionCode)}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME_PRIMARY,
  },
  header: {
    backgroundColor: THEME_PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    padding: 4,
  },
  headerIconText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 16,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 13,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  avatarWrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarIcon: {
    fontSize: 30,
    color: THEME_PRIMARY,
  },
  avatarName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  avatarAvailability: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  statusActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionIconsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  actionIconButton: {
    padding: 2,
  },
  actionIconText: {
    fontSize: 18,
    color: THEME_PRIMARY,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionSpacing: {
    marginTop: 16,
    marginBottom: 4,
  },
  taskIdText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1565c0',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#1F2937',
    flex: 1,
  },
  fieldValue: {
    fontSize: 13,
    color: '#9CA3AF',
    flex: 1,
    textAlign: 'left',
  },
  itemDetailsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  itemNameHeading: {
    flex: 1,
  },
  itemColumnHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    width: 80,
    textAlign: 'center',
  },
  itemDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemName: {
    fontSize: 13,
    color: '#1F2937',
    flex: 1,
  },
  itemQty: {
    fontSize: 13,
    color: '#9CA3AF',
    width: 80,
    textAlign: 'center',
  },
});

export default TaskDetailsScreen;