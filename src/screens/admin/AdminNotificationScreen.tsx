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
import {ActivityIndicator, FlatList, RefreshControl, Text} from 'react-native';
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
import { showFailureMsg, showToast } from '../../utils/toast';
import { useTranslation } from 'react-i18next';
import { tr } from '../../i18n/tr';
import { nseg } from '../../i18n/notifText';

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
            title: tr('Rejected'),
            color: COLORS.alertRed,
            icon: 'reject',
            subtitle: nseg('Task {{b_task}} has rejected by {{b_who}}.', {b_task: task, b_who: who}),
            action: 'reassign',
            viewDetails: true,
          };
        case STATUS.ON_GOING: {
          const state = n.TaskState;
          const mode = n.PaymentModeId;
          let tail: string | null = null;
          if (state === STATE.NOT_STARTED) {
            tail = 'Task {{b_task}} is accepted by {{b_who}}.';
          } else if (state === STATE.STARTED_NOT_ENDED) {
            tail = 'Task {{b_task}} is in progress by {{b_who}}.';
          } else if (state === STATE.ENDED_NO_PAYMENT && mode === PAYMENT_AMC) {
            tail = 'Task {{b_task}} is completed by {{b_who}} and is waiting for closure.';
          } else if (state === STATE.ENDED_NO_PAYMENT && mode === PAYMENT_RATE) {
            tail = 'Task {{b_task}} is completed by {{b_who}} and is waiting for payment.';
          } else if (state === STATE.PAYMENT_RECEIVED && mode === PAYMENT_RATE) {
            tail = 'Task {{b_task}} is completed by {{b_who}} and is waiting for closure.';
          }
          return {
            title: tr('Ongoing'),
            color: COLORS.statusOngoing,
            icon: 'ongoing',
            subtitle: tail ? nseg(tail, {b_task: task, b_who: who}) : [],
          };
        }
        case STATUS.COMPLETED:
          return {
            title: tr('Completed'),
            color: COLORS.statusCompleted,
            icon: 'completed',
            subtitle: nseg('Task {{b_task}} is completed by {{b_who}}.', {b_task: task, b_who: who}),
          };
        case STATUS.IN_ACTIVE:
          return {
            title: tr('InActive'),
            color: COLORS.tagBlue,
            icon: 'inactive',
            subtitle: nseg('Task {{b_task}} is assign to you.', {b_task: task}),
          };
        case STATUS.ONHOLD:
          return {
            title: tr('OnHold'),
            color: COLORS.textBlack,
            icon: 'ongoing',
            subtitle: nseg('Task {{b_task}} is put on hold by {{b_who}}.', {b_task: task, b_who: who}),
          };
        default:
          return null;
      }
    case 'UserInfo':
      return {
        title: tr('Info'),
        color: COLORS.statusCompleted,
        addTechIcon: true,
        subtitle: nseg('New technician {{b_who}} is added into your technician list.', {b_who: who}),
        action: 'assign',
      };
    case 'Earning':
      return {
        title: tr('Earnings'),
        color: COLORS.statusCompleted,
        icon: 'earnings',
        // Java prints the raw EarningAmount ("Rs 1000.65"), not the 3-decimal money format.
        subtitle: nseg('Technician {{b_who}} earned {{b_amount}} for the task {{b_task}}.', {
          b_who: who,
          b_amount: `Rs ${n.EarningAmount ?? 0}`,
          b_task: task,
        }),
      };
    case 'AMC': {
      const amc = n.AMCServiceDetailDtoObj;
      return {
        title: tr('AMC Reminder'),
        color: COLORS.alertRed,
        icon: 'amc',
        subtitle: nseg('You have a {{kind}} {{b_amc}} AMC for {{b_cust}}', {
          kind: `${amc?.AMCTypeName ?? ''} ${amc?.ServiceOccuranceType ?? ''}`.trim(),
          b_amc: String(amc?.AMCName ?? ''),
          b_cust: String(amc?.CustomerName ?? ''),
        }),
        viewDetails: true,
      };
    }
    case 'FOC':
      return {title: tr('Requested Items'), color: COLORS.tagBlue, icon: 'requestedItems', subtitle: htmlToSegments(task)};
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
  const { t } = useTranslation();
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
        showFailureMsg(error instanceof Error ? error.message : tr('Unable to load notifications.'));
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
        showToast(t('rn_task_details_are_not_available'));
        return;
      }
      setTaskFormValues(buildTaskFormValues(task as never, 'reassign'));
    } catch (error) {
      showFailureMsg(error instanceof Error ? error.message : tr('Unable to load the task.'));
    }
  };

  const openAssign = (n: NotificationResultData) => {
    if (!n.IsRegistered) {
      showFailureMsg(t('rn_you_can_not_assign_task_to_this_technician'));
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
          ListEmptyComponent={<Text style={styles.empty}>{t('rn_no_notifications_found')}</Text>}
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
