// src/screens/technician/main/NotificationScreen.tsx
//
// Technician (fieldworker) port of Java's NotificationFragment + NotificationListAdapter.
// Loads Notification/NotificationList for the logged-in user and renders each row by
// NotificationType / TaskStatusId with the fieldworker wording from the adapter:
//   InActive   "Task X is assign to you."
//   Completed  "Task X is completed by you."
//   OnHold     "Task X is put on hold by <name>."
//   Ongoing    "... is completed by you please collect cash" (Rate, ended, unpaid)
//   Earning    "You have earned Rs N for the task X."
//   AMC        reminder with due date, service n/total and "View Details"
// Tapping a task notification loads the task (TaskListByTaskId), marks the notification
// read (UpdateNotificationIsReadStatus) and opens the task the same way the task lists do.
// Owner-only actions (Re-Assign / Assign Task) are intentionally not shown.

import React, { useCallback, useEffect, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../../theme/theme';
import type { NotificationIconName } from '../../../components/NotificationIcons';
import {
  NotificationCard,
  NotificationSheet,
  notificationListStyles as styles,
  type NotificationSegment as Segment,
} from '../../../components/NotificationCard';
import {
  getNotificationList,
  updateNotificationIsRead,
} from '../../../api/notification/notificationService';
import type { NotificationResultData } from '../../../api/notification/notification.types';
import { getTaskById } from '../../../api/task/taskService';
import type { TasksListResultData as Task } from '../../../api/task/task.types';
import { useOpenTask } from '../../../hooks/useOpenTask';
import { countUnread, decrementUnreadCount, setUnreadCount } from '../../../state/notificationBadge';

// Util/TaskStatus.java, Util/TaskState.java, Constant.PaymentMode.
const STATUS = { COMPLETED: 1, REJECTED: 2, ON_GOING: 3, IN_ACTIVE: 4, ONHOLD: 5 };
const STATE = { ENDED_NO_PAYMENT: 2 };
const PAYMENT_RATE = 2;

type RowModel = {
  title: string;
  color: string;
  icon: NotificationIconName;
  subtitle: Segment[];
};

const b = (text: string): Segment => ({ text, bold: true });
const t = (text: string): Segment => ({ text });

const buildRow = (n: NotificationResultData): RowModel | null => {
  const task = String(n.TaskName ?? '');
  const who = `${n.FirstName ?? ''} ${n.LastName ?? ''}`.trim();

  switch (n.NotificationType) {
    case 'Task':
      switch (n.TaskStatusId) {
        case STATUS.IN_ACTIVE:
          return { title: 'InActive', color: COLORS.tagBlue, icon: 'inactive', subtitle: [t('Task '), b(task), t(' is assign to you.')] };
        case STATUS.COMPLETED:
          return { title: 'Completed', color: COLORS.statusCompleted, icon: 'completed', subtitle: [t('Task '), b(task), t(' is completed by you.')] };
        case STATUS.ONHOLD:
          return {
            title: 'OnHold',
            color: COLORS.textBlack,
            icon: 'ongoing',
            subtitle: [t('Task '), b(task), t(' is put on hold by '), b(who), t('.')],
          };
        case STATUS.REJECTED:
          return {
            title: 'Rejected',
            color: COLORS.alertRed,
            icon: 'reject',
            subtitle: [t('Task '), b(task), t(' has rejected by '), b(who), t('.')],
          };
        case STATUS.ON_GOING:
          return {
            title: 'Ongoing',
            color: COLORS.statusOngoing,
            icon: 'ongoing',
            // Java shows a sub-title only for the technician when payment must be collected.
            subtitle:
              n.TaskState === STATE.ENDED_NO_PAYMENT && n.PaymentModeId === PAYMENT_RATE
                ? [t('Task '), b(task), t(' is completed by you please collect cash')]
                : [],
          };
        default:
          return null;
      }
    case 'Earning':
      return {
        title: 'Earnings',
        color: COLORS.statusCompleted,
        icon: 'earnings',
        subtitle: [
          t('You have earned '),
          // Java prints the raw EarningAmount ("Rs 1000.65").
          b(`Rs ${n.EarningAmount ?? 0}`),
          t(' for the task '),
          b(task),
          t('.'),
        ],
      };
    case 'AMC': {
      const amc = n.AMCServiceDetailDtoObj;
      if (!amc) return null;
      return {
        title: 'AMC Reminder',
        color: COLORS.alertRed,
        icon: 'amc',
        subtitle: [
          t(`You have a ${amc.AMCTypeName ?? ''} ${amc.ServiceOccuranceType ?? ''} `),
          b(String(amc.AMCName ?? '')),
          t(' AMC for '),
          b(String(amc.CustomerName ?? '')),
        ],
      };
    }
    case 'FOC':
      return { title: 'Requested Items', color: COLORS.tagBlue, icon: 'requestedItems', subtitle: htmlToSegments(task) };
    default:
      // UserInfo ("new technician added") is an owner notification.
      return null;
  }
};

// Java renders TaskName with Html.fromHtml for Requested Items: <b> -> bold, <br> -> newline.
const htmlToSegments = (html: string): Segment[] => {
  const out: Segment[] = [];
  let bold = false;
  html.split(/(<[^>]+>)/g).forEach(part => {
    if (!part) return;
    const tag = /^<\s*(\/?)\s*([a-z0-9]+)[^>]*>$/i.exec(part);
    if (!tag) { out.push({ text: part, bold }); return; }
    const name = tag[2].toLowerCase();
    if (name === 'b' || name === 'strong') bold = !tag[1];
    else if (name === 'br' || (name === 'p' && tag[1])) out.push({ text: '\n' });
  });
  return out;
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

export default function NotificationScreen() {
  const navigation = useNavigation<any>();

  const [userId, setUserId] = useState<number | null>(null);
  const [items, setItems] = useState<NotificationResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Same routing as tapping a task in Home / the Task tab. An InActive task past the
  // accept window opens the reject-only sheet, as in the lists.
  const openTask = useOpenTask(navigation, {
    onLateInactive: task => navigation.navigate('TaskTracking', { task, autoReject: true }),
  });

  useEffect(() => {
    AsyncStorage.getItem('uid').then(v => setUserId(v ? Number(v) : null));
  }, []);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!userId) return;
      isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        const response = await getNotificationList({ UserId: userId });
        const list = Array.isArray(response?.ResultData) ? response.ResultData : [];
        setItems(list);
        setUnreadCount(countUnread(list));
      } catch (error) {
        Alert.alert('Notification', error instanceof Error ? error.message : 'Unable to load notifications.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const markLocallyRead = (n: NotificationResultData) => {
    if (!n.IsRead) decrementUnreadCount();
    setItems(prev => prev.map(i => (i === n ? { ...i, IsRead: true } : i)));
  };

  // Java: setUpdateNotificationIsReadData(task) -- built from the task once it is loaded.
  const markTaskNotificationRead = (n: NotificationResultData, task: Task) =>
    updateNotificationIsRead({
      TaskId: task.Id,
      IsRead: true,
      UserId: userId ?? undefined,
      OwnerId: task.OwnerId,
      NotificationType: n.NotificationType,
      TaskStatus: task.TaskStatusId as any,
      TaskType: task.TaskTypeId as any,
      TaskState: task.TaskState,
      PaymentMode: task.PaymentModeId as any,
      TaskClosureStatus: task.TaskClosureStatus,
      ...(task.PaymentNotReceived != null ? { PaymentNotReceived: task.PaymentNotReceived as any } : {}),
    } as any).catch(() => {});

  const openTaskNotification = async (n: NotificationResultData) => {
    if (!userId || !n.TaskId) return;
    try {
      const response = await getTaskById({ UserId: userId, TaskID: n.TaskId });
      const task = (Array.isArray(response?.ResultData) ? response.ResultData[0] : response?.ResultData) as Task | undefined;
      if (!task) {
        Alert.alert('Notification', response?.Message || 'Task details are not available.');
        return;
      }
      markTaskNotificationRead(n, task);
      markLocallyRead(n);
      openTask(task);
    } catch (error) {
      Alert.alert('Notification', error instanceof Error ? error.message : 'Unable to load the task.');
    }
  };

  const handleRowPress = (n: NotificationResultData) => {
    switch (n.NotificationType) {
      case 'Task':
        openTaskNotification(n);
        break;
      case 'Earning':
        // Java: navigateToHomePassbookFragment()
        markLocallyRead(n);
        navigation.navigate('Passbook');
        break;
      default:
        break;
    }
  };

  const renderItem = ({ item }: { item: NotificationResultData }) => {
    const row = buildRow(item);
    if (!row) return null;
    const amc = item.NotificationType === 'AMC' ? item.AMCServiceDetailDtoObj : undefined;
    const tappable = item.NotificationType === 'Task' || item.NotificationType === 'Earning';

    return (
      <NotificationCard
        icon={row.icon}
        title={row.title}
        color={row.color}
        isNew={!item.IsRead}
        when={formatWhen(item)}
        subtitle={row.subtitle}
        amc={
          amc
            ? {
                dueDate: String(amc.AMCServiceDate ?? '').split('T')[0],
                service: (amc.ServiceNo ?? 0) + '/' + (amc.TotalServices ?? 0),
              }
            : undefined
        }
        onPress={tappable ? () => handleRowPress(item) : undefined}
      />
    );
  };

  return (
    <NotificationSheet>
      {loading ? (
        <ActivityIndicator style={styles.loader} color={COLORS.primary} size="large" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => item.Id + '-' + index}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          ListEmptyComponent={<Text style={styles.empty}>No notifications found.</Text>}
        />
      )}
    </NotificationSheet>
  );
}
