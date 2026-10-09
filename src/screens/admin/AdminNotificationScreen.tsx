// src/screens/admin/AdminNotificationScreen.tsx
//
// Owner-side port of Java's NotificationFragment + NotificationListAdapter
// (item_notification_new). Loads Notification/NotificationList for the owner
// and renders each row by NotificationType / TaskStatusId with the same
// titles, colours, sub-titles and actions as the Java adapter:
//   - Task Rejected: "Re-Assign" + "View Details"
//   - AMC reminder:  due date + service n/total, "View Details" (marks read)
//   - UserInfo:      "Assign Task" (only for registered fieldworkers)
// The card/sheet visuals are shared with the technician screen (NotificationCard).
import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Alert, FlatList, RefreshControl, Text} from 'react-native';
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
import {COLORS} from '../../theme/theme';
import {AddTechIcon} from '../../components/JavaIcons';
import {ms} from '../../utils/responsive';
import type {NotificationIconName} from '../../components/NotificationIcons';
import {
  NotificationCard,
  NotificationSheet,
  notificationListStyles as styles,
  type NotificationCardAction,
  type NotificationSegment as Segment,
} from '../../components/NotificationCard';

type Props = {ownerId: number};

// Util/TaskStatus.java, Util/TaskState.java, Constant.PaymentMode ids.
const STATUS = {COMPLETED: 1, REJECTED: 2, ON_GOING: 3, IN_ACTIVE: 4, ONHOLD: 5};
const STATE = {NOT_STARTED: 0, STARTED_NOT_ENDED: 1, ENDED_NO_PAYMENT: 2, PAYMENT_RECEIVED: 3};
const PAYMENT_AMC = 1;
const PAYMENT_RATE = 2;

type RowModel = {
  title: string;
  color: string;
  icon?: NotificationIconName;
  addTechIcon?: boolean;
  subtitle: Segment[];
  action?: 'reassign' | 'assign';
  viewDetails?: boolean;
};

const b = (text: string): Segment => ({text, bold: true});
const t = (text: string): Segment => ({text});

// Java renders TaskName with Html.fromHtml for Requested Items: <b> -> bold, <br> -> newline.
const htmlToSegments = (html: string): Segment[] => {
  const out: Segment[] = [];
  let bold = false;
  html.split(/(<[^>]+>)/g).forEach(part => {
    if (!part) {
      return;
    }
    const tag = /^<\s*(\/?)\s*([a-z0-9]+)[^>]*>$/i.exec(part);
    if (!tag) {
      out.push({text: part, bold});
      return;
    }
    const name = tag[2].toLowerCase();
    if (name === 'b' || name === 'strong') {
      bold = !tag[1];
    } else if (name === 'br' || (name === 'p' && tag[1])) {
      out.push({text: '\n'});
    }
  });
  return out;
};

const buildRow = (n: NotificationResultData): RowModel | null => {
  const task = String(n.TaskName ?? '');
  const who = `${n.FirstName ?? ''} ${n.LastName ?? ''}`.trim();
  switch (n.NotificationType) {
    case 'Task':
      switch (n.TaskStatusId) {
        case STATUS.REJECTED:
          return {
            title: 'Rejected',
            color: COLORS.alertRed,
            icon: 'reject',
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
            color: COLORS.statusOngoing,
            icon: 'ongoing',
            subtitle: tail.length ? [t('Task '), b(task), ...tail] : [],
          };
        }
        case STATUS.COMPLETED:
          return {
            title: 'Completed',
            color: COLORS.statusCompleted,
            icon: 'completed',
            subtitle: [t('Task '), b(task), t(' is completed by '), b(who), t('.')],
          };
        case STATUS.IN_ACTIVE:
          return {
            title: 'InActive',
            color: COLORS.tagBlue,
            icon: 'inactive',
            subtitle: [t('Task '), b(task), t(' is assign to you.')],
          };
        case STATUS.ONHOLD:
          return {
            title: 'OnHold',
            color: COLORS.textBlack,
            icon: 'ongoing',
            subtitle: [t('Task '), b(task), t(' is put on hold by '), b(who), t('.')],
          };
        default:
          return null;
      }
    case 'UserInfo':
      return {
        title: 'Info',
        color: COLORS.statusCompleted,
        addTechIcon: true,
        subtitle: [t('New technician '), b(who), t(' is added into your technician list.')],
        action: 'assign',
      };
    case 'Earning':
      return {
        title: 'Earnings',
        color: COLORS.statusCompleted,
        icon: 'earnings',
        subtitle: [
          t('Technician '),
          b(who),
          t(' earned '),
          // Java prints the raw EarningAmount ("Rs 1000.65"), not the 3-decimal money format.
          b(`Rs ${n.EarningAmount ?? 0}`),
          t(' for the task '),
          b(task),
          t('.'),
        ],
      };
    case 'AMC': {
      const amc = n.AMCServiceDetailDtoObj;
      return {
        title: 'AMC Reminder',
        color: COLORS.alertRed,
        icon: 'amc',
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
      return {title: 'Requested Items', color: COLORS.tagBlue, icon: 'requestedItems', subtitle: htmlToSegments(task)};
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
    const actions: NotificationCardAction[] = [];
    if (row.action) {
      actions.push({
        label: row.action === 'reassign' ? 'Re-Assign' : 'Assign Task',
        onPress: () => (row.action === 'reassign' ? openReassign(item) : openAssign(item)),
      });
    }
    if (row.viewDetails) {
      actions.push({label: 'View Details', onPress: () => openDetails(item)});
    }
    return (
      <NotificationCard
        icon={row.icon}
        iconNode={row.addTechIcon ? <AddTechIcon size={ms(24)} color={COLORS.textBlack} /> : undefined}
        title={row.title}
        color={row.color}
        isNew={!item.IsRead}
        when={formatWhen(item)}
        subtitle={row.subtitle}
        amc={
          amc
            ? {
                dueDate: String(amc.AMCServiceDate ?? '').split('T')[0],
                service: `${amc.ServiceNo ?? 0}/${amc.TotalServices ?? 0}`,
              }
            : undefined
        }
        actions={actions}
      />
    );
  };

  return (
    <NotificationSheet underAppHeader>
      {loading ? (
        <ActivityIndicator style={styles.loader} color={COLORS.primary} size="large" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.Id ?? index}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
    </NotificationSheet>
  );
};

export default AdminNotificationScreen;
