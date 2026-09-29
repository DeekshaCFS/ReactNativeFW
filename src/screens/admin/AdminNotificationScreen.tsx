// src/screens/admin/AdminNotificationScreen.tsx
//
// Owner-side port of Java's NotificationFragment + NotificationListAdapter
// (item_notification_new). Loads Notification/NotificationList for the owner
// and renders each row by NotificationType / TaskStatusId with the same
// titles, colours, sub-titles and actions as the Java adapter:
//   - Task Rejected: "Re-Assign" + "View Details"
//   - AMC reminder:  due date + service n/total, "View Details" (marks read)
//   - UserInfo:      "Assign Task" (only for registered fieldworkers)
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  getNotificationList,
  updateNotificationIsRead,
} from '../../api/notification/notificationService';
import type {NotificationResultData} from '../../api/notification/notification.types';
import {countUnread, setUnreadCount} from '../../state/notificationBadge';
import {getTaskById} from '../../api/task/taskService';
import type {AdminStackParamList} from '../../navigation/AdminStack';
import AddTaskModal, {buildTaskFormValues, type AddTaskInitialValues} from './AddTaskModal';
import {formatAmount} from '../../utils/decimal';
import {ms, sp, vs} from '../../utils/responsive';

type Props = {ownerId: number};

// Util/TaskStatus.java, Util/TaskState.java, Constant.PaymentMode ids.
const STATUS = {COMPLETED: 1, REJECTED: 2, ON_GOING: 3, IN_ACTIVE: 4, ONHOLD: 5};
const STATE = {NOT_STARTED: 0, STARTED_NOT_ENDED: 1, ENDED_NO_PAYMENT: 2, PAYMENT_RECEIVED: 3};
const PAYMENT_AMC = 1;
const PAYMENT_RATE = 2;

type Segment = {text: string; bold?: boolean};
type RowModel = {
  title: string;
  color: string;
  subtitle: Segment[];
  action?: 'reassign' | 'assign';
  viewDetails?: boolean;
};

const b = (text: string): Segment => ({text, bold: true});
const t = (text: string): Segment => ({text});

const buildRow = (n: NotificationResultData): RowModel | null => {
  const task = String(n.TaskName ?? '');
  const who = `${n.FirstName ?? ''} ${n.LastName ?? ''}`.trim();
  switch (n.NotificationType) {
    case 'Task':
      switch (n.TaskStatusId) {
        case STATUS.REJECTED:
          return {
            title: 'Rejected',
            color: '#D32F2F',
            subtitle: [t('Task '), b(task), t(' has rejected by '), b(who), t('.')],
            action: 'reassign',
            viewDetails: true,
          };
        case STATUS.ON_GOING: {
          const state = n.TaskState;
          const mode = n.PaymentModeId;
          let tail: Segment[] = [];
          if (state === STATE.NOT_STARTED) {
            tail = [t(' is accepted by '), b(who), t('.')];
          } else if (state === STATE.STARTED_NOT_ENDED) {
            tail = [t(' is in progress by '), b(who), t('.')];
          } else if (state === STATE.ENDED_NO_PAYMENT && mode === PAYMENT_AMC) {
            tail = [t(' is completed by '), b(who), t(' and is waiting for closure.')];
          } else if (state === STATE.ENDED_NO_PAYMENT && mode === PAYMENT_RATE) {
            tail = [t(' is completed by '), b(who), t(' and is waiting for payment.')];
          } else if (state === STATE.PAYMENT_RECEIVED && mode === PAYMENT_RATE) {
            tail = [t(' is completed by '), b(who), t(' and is waiting for closure.')];
          }
          return {
            title: 'Ongoing',
            color: '#F57C00',
            subtitle: tail.length ? [t('Task '), b(task), ...tail] : [],
          };
        }
        case STATUS.COMPLETED:
          return {
            title: 'Completed',
            color: '#2E7D32',
            subtitle: [t('Task '), b(task), t(' is completed by '), b(who), t('.')],
          };
        case STATUS.IN_ACTIVE:
          return {
            title: 'InActive',
            color: '#1565C0',
            subtitle: [t('Task '), b(task), t(' is assign to you.')],
          };
        case STATUS.ONHOLD:
          return {
            title: 'OnHold',
            color: '#000000',
            subtitle: [t('Task '), b(task), t(' is put on hold by '), b(who), t('.')],
          };
        default:
          return null;
      }
    case 'UserInfo':
      return {
        title: 'Info',
        color: '#2E7D32',
        subtitle: [t('New technician '), b(who), t(' is added into your technician list.')],
        action: 'assign',
      };
    case 'Earning':
      return {
        title: 'Earnings',
        color: '#2E7D32',
        subtitle: [
          t('Technician '),
          b(who),
          t(' earned '),
          b(`Rs ${formatAmount(n.EarningAmount)}`),
          t(' for the task '),
          b(task),
          t('.'),
        ],
      };
    case 'AMC': {
      const amc = n.AMCServiceDetailDtoObj;
      return {
        title: 'AMC Reminder',
        color: '#D32F2F',
        subtitle: [
          t(`You have a ${amc?.AMCTypeName ?? ''} ${amc?.ServiceOccuranceType ?? ''} `),
          b(String(amc?.AMCName ?? '')),
          t(' AMC for '),
          b(String(amc?.CustomerName ?? '')),
        ],
        viewDetails: true,
      };
    }
    case 'FOC':
      return {title: 'Requested Items', color: '#1565C0', subtitle: [t(task)]};
    default:
      return null;
  }
};

const formatWhen = (n: NotificationResultData) => {
  const time = String(n.NotificationTime ?? '');
  switch (n.NotificationDay) {
    case 'Today':
      return `Today ${time}`;
    case 'YesterDay':
      return `Yesterday ${time}`;
    case 'Old':
      return `${n.NotificationDate ?? ''} ${time}`;
    default:
      return '';
  }
};

const AdminNotificationScreen: React.FC<Props> = ({ownerId}) => {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const [items, setItems] = useState<NotificationResultData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [taskFormValues, setTaskFormValues] = useState<AddTaskInitialValues | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        const response = await getNotificationList({UserId: ownerId});
        const list = Array.isArray(response?.ResultData) ? response.ResultData : [];
        setItems(list);
        setUnreadCount(countUnread(list));
      } catch (error) {
        Alert.alert('Notification', error instanceof Error ? error.message : 'Unable to load notifications.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [ownerId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const markRead = (n: NotificationResultData, extra?: Record<string, unknown>) =>
    updateNotificationIsRead({
      IsRead: true,
      UserId: n.NotificationType === 'UserInfo' ? n.UserId : ownerId,
      OwnerId: n.NotificationType === 'UserInfo' ? n.OwnerId : ownerId,
      NotificationType: n.NotificationType,
      ...extra,
    }).catch(() => {});

  const openReassign = async (n: NotificationResultData) => {
    try {
      const response = await getTaskById({UserId: ownerId, TaskID: n.TaskId});
      const task = Array.isArray(response?.ResultData) ? response.ResultData[0] : response?.ResultData;
      if (!task) {
        Alert.alert('Re-Assign', 'Task details are not available.');
        return;
      }
      setTaskFormValues(buildTaskFormValues(task as never, 'reassign'));
    } catch (error) {
      Alert.alert('Re-Assign', error instanceof Error ? error.message : 'Unable to load the task.');
    }
  };

  const openAssign = (n: NotificationResultData) => {
    if (!n.IsRegistered) {
      Alert.alert('Assign Task', 'You can not assign task to this technician.');
      return;
    }
    markRead(n);
    setTaskFormValues({
      title: '',
      address: '',
      state: '',
      city: '',
      pinCode: '',
      landmark: '',
      customerName: '',
      customerNumber: '',
      taskTagId: 0,
      taskTagName: '',
      assignedFieldworkerId: n.UserId,
      assignedFieldworkerName: `${n.FirstName ?? ''} ${n.LastName ?? ''}`.trim(),
    });
  };

  const openDetails = (n: NotificationResultData) => {
    if (n.NotificationType === 'AMC' && n.AMCServiceDetailDtoObj) {
      const amc = n.AMCServiceDetailDtoObj;
      markRead(n, {AMCServiceDetailsId: amc.AMCServiceDetailsId});
      navigation.navigate('AMCDetails', {
        amcItem: amc as Record<string, unknown>,
        amcServiceDetailsId: Number(amc.AMCServiceDetailsId) || 0,
        amcsId: Number(amc.AMCsId) || 0,
        ownerId,
      });
      return;
    }
    navigation.navigate('TaskDetails', {taskId: Number(n.TaskId) || 0, source: 'taskList'});
  };

  const renderItem = ({item}: {item: NotificationResultData}) => {
    const row = buildRow(item);
    if (!row) {
      return null;
    }
    const amc = item.NotificationType === 'AMC' ? item.AMCServiceDetailDtoObj : undefined;
    return (
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, {color: row.color}]}>{row.title}</Text>
          {item.IsRead ? null : <Text style={styles.newFlag}>New</Text>}
        </View>
        {row.subtitle.length ? (
          <Text style={styles.subtitle}>
            {row.subtitle.map((seg, i) => (
              <Text key={i} style={seg.bold ? styles.bold : null}>
                {seg.text}
              </Text>
            ))}
          </Text>
        ) : null}
        {amc ? (
          <View style={styles.amcRow}>
            <Text style={styles.amcText}>Due Date: {String(amc.AMCServiceDate ?? '').split('T')[0]}</Text>
            <Text style={styles.amcText}>
              Service: {amc.ServiceNo ?? 0}/{amc.TotalServices ?? 0}
            </Text>
          </View>
        ) : null}
        <View style={styles.footerRow}>
          <Text style={styles.time}>{formatWhen(item)}</Text>
          <View style={styles.actions}>
            {row.action ? (
              <Pressable
                onPress={() => (row.action === 'reassign' ? openReassign(item) : openAssign(item))}>
                <Text style={styles.actionText}>
                  {row.action === 'reassign' ? 'Re-Assign' : 'Assign Task'}
                </Text>
              </Pressable>
            ) : null}
            {row.viewDetails ? (
              <Pressable onPress={() => openDetails(item)}>
                <Text style={styles.actionText}>View Details</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {loading ? (
        <ActivityIndicator style={styles.loader} color="#c3002f" size="large" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.Id ?? index}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          ListEmptyComponent={<Text style={styles.empty}>No notifications found.</Text>}
        />
      )}
      <AddTaskModal
        visible={taskFormValues !== null}
        ownerId={ownerId}
        initialValues={taskFormValues}
        onClose={() => setTaskFormValues(null)}
        onSaved={() => load(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f5f6f8'},
  loader: {marginTop: vs(40)},
  list: {padding: ms(12), gap: vs(10)},
  card: {backgroundColor: '#fff', borderRadius: ms(10), padding: ms(12)},
  titleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  title: {fontSize: sp(15), fontWeight: '700'},
  newFlag: {fontSize: sp(11), color: '#fff', backgroundColor: '#c3002f', paddingHorizontal: ms(6), borderRadius: ms(8)},
  subtitle: {fontSize: sp(13), color: '#3c4043', marginTop: vs(4)},
  bold: {fontWeight: '700'},
  amcRow: {flexDirection: 'row', justifyContent: 'space-between', marginTop: vs(6)},
  amcText: {fontSize: sp(12), color: '#5f6368'},
  footerRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: vs(8)},
  time: {fontSize: sp(11), color: '#80868b'},
  actions: {flexDirection: 'row', gap: ms(14)},
  actionText: {fontSize: sp(13), color: '#c3002f', fontWeight: '700'},
  empty: {textAlign: 'center', color: '#80868b', marginTop: vs(40), fontSize: sp(13)},
});

export default AdminNotificationScreen;
