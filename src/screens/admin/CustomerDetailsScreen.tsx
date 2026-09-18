import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  type EnquiryListItem,
  type EnquiryListResponse,
  type TaskListItem,
  type TaskListResponse,
  type AMCListItem,
  type AMCListResponse,
} from '../adminLegacyApiTypes';
import { getTaskListSearchNew } from '../../../api/taskList/taskListService';
import { getAmcServiceMonthList } from '../../../api/amc/amcService';
import { getEnquiryList } from '../../../api/customerInquiry/customerInquiryService';
import {
  CUSTOMER_ADDRESS_KEYS,
  CUSTOMER_NAME_KEYS,
  CUSTOMER_PHONE_KEYS,
  getEnquiryAddress,
  getEnquiryCustomerName,
  getEnquiryDate,
  getEnquiryDisplayNo,
  getEnquiryId,
  getEnquiryPhone,
  getNumberField,
  getStringField,
} from '../drawer/CRMScreen';
import TaskDetailsScreen from '../TaskDetailsScreen';

type CustomerDetailsScreenProps = {
  ownerId: number;
  customer: Record<string, unknown>;
  onBack: () => void;
  onEdit?: (customer: Record<string, unknown>) => void;
  onDelete?: (customer: Record<string, unknown>) => void;
};

type CustomerTabKey = 'task' | 'amc' | 'quotation' | 'invoice' | 'enquiry';

const THEME_PRIMARY = '#c3002f';

const TABS: {key: CustomerTabKey; label: string}[] = [
  {key: 'task', label: 'TASK'},
  {key: 'amc', label: 'AMC'},
  {key: 'quotation', label: 'QUOTATION'},
  {key: 'invoice', label: 'INVOICE'},
  {key: 'enquiry', label: 'ENQUIRY'},
];

const STATUS_OPTIONS = [
  {id: 0, label: 'Status'},
  {id: 1, label: 'Completed'},
  {id: 2, label: 'Rejected'},
  {id: 3, label: 'Ongoing'},
  {id: 4, label: 'InActive'},
  {id: 5, label: 'OnHold'},
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad2 = (value: number) => String(value).padStart(2, '0');

const normalizeText = (value: string) => value.trim().toLowerCase();

const normalizeDigits = (value: string) => value.replace(/\D/g, '');

const matchesCustomer = (
  record: Record<string, unknown>,
  nameKeys: string[],
  phoneKeys: string[],
  customerNameNorm: string,
  customerPhoneDigits: string,
) => {
  const itemName = normalizeText(getStringField(record, nameKeys));
  if (customerNameNorm && itemName && itemName.includes(customerNameNorm)) {
    return true;
  }
  const itemPhoneDigits = normalizeDigits(getStringField(record, phoneKeys));
  if (customerPhoneDigits && itemPhoneDigits) {
    const custTail = customerPhoneDigits.slice(-10);
    const itemTail = itemPhoneDigits.slice(-10);
    if (custTail && itemTail && custTail === itemTail) {
      return true;
    }
  }
  return false;
};

const TASK_NAME_KEYS = ['customerName', 'CustomerName'];
const TASK_PHONE_KEYS = ['contactNo', 'ContactNo'];
const AMC_NAME_KEYS = ['customerName', 'CustomerName', 'name', 'Name'];
const AMC_PHONE_KEYS: string[] = [];

const getString = (
  item: Record<string, unknown>,
  camelKey: string,
  pascalKey: string,
) => {
  const value = item[camelKey] ?? item[pascalKey];
  return typeof value === 'string' ? value.trim() : '';
};

const getTaskId = (item: TaskListItem) =>
  Number(item.id ?? item.Id) || 0;

const getTaskTitle = (item: TaskListItem) =>
  getString(item, 'name', 'Name') || `Task #${getTaskId(item) || '-'}`;

const getNewTaskId = (item: TaskListItem) =>
  getString(item, 'newTaskId', 'NewTaskId') ||
  getString(item, 'newTaskID', 'NewTaskID');

const getTaskStatus = (item: TaskListItem) =>
  getString(item, 'taskStatus', 'TaskStatus') || 'Unknown';

const getTaskDate = (item: TaskListItem) => getString(item, 'taskDate', 'TaskDate');

const getTaskTime = (item: TaskListItem) => getString(item, 'taskTime', 'TaskTime');

const getTaskAddress = (item: TaskListItem) =>
  getString(item, 'fullAddress', 'FullAddress') ||
  getString(item, 'locationName', 'LocationName') ||
  getString(item, 'locationDesc', 'LocationDesc');

const getTaskAssignedTo = (item: TaskListItem) =>
  getString(item, 'assignedTo', 'AssignedTo');

const parseDateRobust = (dateStr: string) => {
  if (!dateStr) {
    return new Date(NaN);
  }
  const isoLike = dateStr.replace(' ', 'T');
  const date = new Date(isoLike);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }
  return new Date(dateStr);
};

const formatTaskDateTime = (item: TaskListItem) => {
  const taskDate = getTaskDate(item);
  if (!taskDate) {
    return '';
  }
  const date = parseDateRobust(taskDate);
  if (Number.isNaN(date.getTime())) {
    return taskDate;
  }
  const dateLabel = `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
  const time = getTaskTime(item).split('.')[0];
  if (!time) {
    return dateLabel;
  }
  const [hourRaw = '0', minuteRaw = '0'] = time.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return dateLabel;
  }
  const suffix = hour >= 12 ? 'pm' : 'am';
  const hour12 = hour % 12 || 12;
  return `${dateLabel} ${pad2(hour12)}:${pad2(minute)} ${suffix}`;
};

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

const getAMCId = (item: AMCListItem, index: number) =>
  String(item.id ?? item.Id ?? item.amCsId ?? item.AMCsId ?? index);

const getAMCName = (item: AMCListItem) =>
  getStringField(item as Record<string, unknown>, [
    'amcName', 'AMCName',
  ]) || 'AMC';

const getAMCServiceType = (item: AMCListItem) =>
  getStringField(item as Record<string, unknown>, [
    'serviceType', 'ServiceType', 'amcTypeName', 'AMCTypeName',
  ]);

const getAMCDate = (item: AMCListItem) =>
  getStringField(item as Record<string, unknown>, [
    'amcDate', 'AMCDate', 'date', 'Date', 'amcServiceDate', 'AMCServiceDate',
  ]);

const CustomerDetailsScreen = ({
  ownerId,
  customer,
  onBack,
  onEdit,
  onDelete,
}: CustomerDetailsScreenProps) => {
  const customerName = getStringField(customer, CUSTOMER_NAME_KEYS) || 'Customer';
  const customerPhone = getStringField(customer, CUSTOMER_PHONE_KEYS);
  const customerAddress = getStringField(customer, CUSTOMER_ADDRESS_KEYS) || 'NA';

  const customerNameNorm = normalizeText(customerName);
  const customerPhoneDigits = normalizeDigits(customerPhone);

  const [activeTab, setActiveTab] = useState<CustomerTabKey>('task');
  const [selectedTask, setSelectedTask] = useState<TaskListItem | null>(null);

  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(STATUS_OPTIONS[0]);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const now = useMemo(() => new Date(), []);
  const [monthYear, setMonthYear] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const [monthModalVisible, setMonthModalVisible] = useState(false);

  const [amcItems, setAmcItems] = useState<AMCListItem[]>([]);
  const [isLoadingAmc, setIsLoadingAmc] = useState(false);
  const [amcError, setAmcError] = useState('');
  const [hasLoadedAmc, setHasLoadedAmc] = useState(false);

  const [enquiries, setEnquiries] = useState<EnquiryListItem[]>([]);
  const [isLoadingEnquiries, setIsLoadingEnquiries] = useState(false);
  const [enquiryError, setEnquiryError] = useState('');
  const [hasLoadedEnquiries, setHasLoadedEnquiries] = useState(false);

  const fetchTasks = useCallback(async () => {
    setIsLoadingTasks(true);
    setTaskError('');
    try {
      const response = (await getTaskListSearchNew({
        UserId: ownerId,
        searchparam: customerName,
        TaskStatusID: selectedStatus.id,
        TaskMonth: monthYear.month,
        TaskYear: monthYear.year,
        pageIndex: 1,
        AllData: true,
      })) as TaskListResponse;
      const list = response.resultData ?? response.ResultData ?? [];
      const filtered = list.filter(item =>
        matchesCustomer(
          item as Record<string, unknown>,
          TASK_NAME_KEYS,
          TASK_PHONE_KEYS,
          customerNameNorm,
          customerPhoneDigits,
        ),
      );
      setTasks(filtered.length > 0 ? filtered : list);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load tasks.';
      setTaskError(message);
      setTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [ownerId, customerName, selectedStatus.id, monthYear.month, monthYear.year, customerNameNorm, customerPhoneDigits]);

  const fetchAmc = useCallback(async () => {
    setIsLoadingAmc(true);
    setAmcError('');
    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
      const response = (await getAmcServiceMonthList({
        OwnerId: ownerId,
        Date: dateStr,
        AMCTypeId: 0,
      })) as AMCListResponse;
      const list = response.resultData ?? response.ResultData ?? [];
      const filtered = list.filter(item =>
        matchesCustomer(
          item as Record<string, unknown>,
          AMC_NAME_KEYS,
          AMC_PHONE_KEYS,
          customerNameNorm,
          customerPhoneDigits,
        ),
      );
      setAmcItems(filtered);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load AMC records.';
      setAmcError(message);
      setAmcItems([]);
    } finally {
      setIsLoadingAmc(false);
      setHasLoadedAmc(true);
    }
  }, [ownerId, customerNameNorm, customerPhoneDigits]);

  const fetchEnquiries = useCallback(async () => {
    setIsLoadingEnquiries(true);
    setEnquiryError('');
    try {
      const response = (await getEnquiryList({
        UserId: ownerId,
      })) as EnquiryListResponse;
      const data = response as unknown as Record<string, unknown>;
      const list =
        (data.resultData as EnquiryListItem[] | undefined) ??
        (data.ResultData as EnquiryListItem[] | undefined) ??
        [];
      const filtered = list.filter(item => {
        const name = normalizeText(getEnquiryCustomerName(item));
        const phoneDigits = normalizeDigits(getEnquiryPhone(item));
        if (customerNameNorm && name.includes(customerNameNorm)) {
          return true;
        }
        if (customerPhoneDigits && phoneDigits) {
          return phoneDigits.slice(-10) === customerPhoneDigits.slice(-10);
        }
        return false;
      });
      setEnquiries(filtered);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load enquiries.';
      setEnquiryError(message);
      setEnquiries([]);
    } finally {
      setIsLoadingEnquiries(false);
      setHasLoadedEnquiries(true);
    }
  }, [ownerId, customerNameNorm, customerPhoneDigits]);

  useEffect(() => {
    if (activeTab === 'task') {
      fetchTasks();
    }
  }, [activeTab, fetchTasks]);

  useEffect(() => {
    if (activeTab === 'amc' && !hasLoadedAmc) {
      fetchAmc();
    }
  }, [activeTab, hasLoadedAmc, fetchAmc]);

  useEffect(() => {
    if (activeTab === 'enquiry' && !hasLoadedEnquiries) {
      fetchEnquiries();
    }
  }, [activeTab, hasLoadedEnquiries, fetchEnquiries]);

  const renderTaskCard = ({item}: {item: TaskListItem}) => {
    const status = getTaskStatus(item);
    const newTaskId = getNewTaskId(item);
    const address = getTaskAddress(item);
    const assignedTo = getTaskAssignedTo(item);
    const dateTime = formatTaskDateTime(item);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => setSelectedTask(item)}
      >
        <View style={styles.cardTopRow}>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: getStatusColor(status)},
            ]}
          >
            <Text style={styles.statusBadgeText}>{status.toUpperCase()}</Text>
          </View>
          {dateTime ? <Text style={styles.cardDate}>{dateTime}</Text> : null}
        </View>
        <View style={styles.taskTitleRow}>
          <Text style={styles.taskTitle} numberOfLines={1}>
            {getTaskTitle(item)}
          </Text>
          {newTaskId ? (
            <Text style={styles.taskId}> [{newTaskId}]</Text>
          ) : null}
        </View>
        {address ? (
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            {address}
          </Text>
        ) : null}
        {assignedTo ? (
          <Text style={styles.cardSubtitle}>{assignedTo}</Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderAmcCard = ({item}: {item: AMCListItem}) => {
    const serviceType = getAMCServiceType(item);
    const date = getAMCDate(item);
    return (
      <View style={styles.card}>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {getAMCName(item)}
        </Text>
        {serviceType ? (
          <Text style={styles.cardSubtitle}>{serviceType}</Text>
        ) : null}
        {date ? <Text style={styles.cardSubtitle}>{date}</Text> : null}
      </View>
    );
  };

  const renderEnquiryCard = ({item}: {item: EnquiryListItem}) => {
    const displayNo = getEnquiryDisplayNo(item);
    const address = getEnquiryAddress(item);
    const date = getEnquiryDate(item);
    return (
      <View style={styles.card}>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {displayNo ? `ENQUIRY #${displayNo}` : 'ENQUIRY'}
        </Text>
        {address ? (
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            {address}
          </Text>
        ) : null}
        {date ? <Text style={styles.cardSubtitle}>{date}</Text> : null}
      </View>
    );
  };

  const renderEmpty = (message: string) => (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  const monthLabel = `${MONTH_NAMES[monthYear.month - 1]?.slice(0, 3)} ${monthYear.year}`;

  if (selectedTask) {
    return (
      <TaskDetailsScreen
        ownerId={ownerId}
        taskId={getTaskId(selectedTask)}
        fallbackTask={selectedTask}
        customerName={customerName}
        customerPhone={customerPhone}
        customerAddress={customerAddress}
        onBack={() => setSelectedTask(null)}
      />
    );
  }

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

      <View style={styles.infoCard}>
        <View style={styles.infoRows}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cust Name</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {customerName}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile No.</Text>
            <Text style={styles.infoValue}>{customerPhone || 'NA'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cust Address</Text>
            <Text style={styles.infoValue} numberOfLines={3}>
              {customerAddress}
            </Text>
          </View>
        </View>
        <View style={styles.infoActionsCol}>
          <TouchableOpacity
            style={styles.infoIconButton}
            onPress={() => onEdit?.(customer)}
          >
            <Text style={styles.infoIconText}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.infoIconButton}
            onPress={() => onDelete?.(customer)}
          >
            <Text style={styles.infoIconText}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab.key ? styles.tabButtonTextActive : null,
              ]}
            >
              {tab.label}
            </Text>
            {activeTab === tab.key ? (
              <View style={styles.tabButtonUnderline} />
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'task' ? (
        <View style={styles.filterRow}>
          <Pressable
            style={styles.filterControl}
            onPress={() => setStatusModalVisible(true)}
          >
            <Text style={styles.filterLabel}>{selectedStatus.label}</Text>
            <Text style={styles.filterChevron}>⌄</Text>
          </Pressable>
          <Pressable
            style={styles.filterControl}
            onPress={() => setMonthModalVisible(true)}
          >
            <Text style={styles.filterLabel}>{monthLabel}</Text>
            <Text style={styles.filterChevron}>⌄</Text>
          </Pressable>
        </View>
      ) : null}

      {activeTab === 'task' ? (
        isLoadingTasks ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={THEME_PRIMARY} size="large" />
          </View>
        ) : taskError ? (
          renderEmpty(taskError)
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item, index) => String(getTaskId(item) || index)}
            renderItem={renderTaskCard}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => renderEmpty('No tasks found.')}
          />
        )
      ) : activeTab === 'amc' ? (
        isLoadingAmc ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={THEME_PRIMARY} size="large" />
          </View>
        ) : amcError ? (
          renderEmpty(amcError)
        ) : (
          <FlatList
            data={amcItems}
            keyExtractor={(item, index) => getAMCId(item, index)}
            renderItem={renderAmcCard}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => renderEmpty('No AMC records found.')}
          />
        )
      ) : activeTab === 'enquiry' ? (
        isLoadingEnquiries ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={THEME_PRIMARY} size="large" />
          </View>
        ) : enquiryError ? (
          renderEmpty(enquiryError)
        ) : (
          <FlatList
            data={enquiries}
            keyExtractor={(item, index) => String(getEnquiryId(item) || index)}
            renderItem={renderEnquiryCard}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => renderEmpty('No enquiries found.')}
          />
        )
      ) : (
        renderEmpty('No records found.')
      )}

      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setStatusModalVisible(false)}
        >
          <Pressable style={styles.modalPanel}>
            <Text style={styles.modalTitle}>Select Status</Text>
            <ScrollView>
              {STATUS_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedStatus(option);
                    setStatusModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={monthModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMonthModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setMonthModalVisible(false)}
        >
          <Pressable style={styles.modalPanel}>
            <Text style={styles.modalTitle}>Select Month</Text>
            <ScrollView>
              {MONTH_NAMES.map((name, index) => (
                <TouchableOpacity
                  key={name}
                  style={styles.modalItem}
                  onPress={() => {
                    setMonthYear(prev => ({...prev, month: index + 1}));
                    setMonthModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {name} {monthYear.year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  infoCard: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: THEME_PRIMARY,
  },
  infoRows: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME_PRIMARY,
    width: 100,
  },
  infoValue: {
    fontSize: 13,
    color: '#3c3c3c',
    flex: 1,
  },
  infoActionsCol: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 8,
  },
  infoIconButton: {
    borderWidth: 1,
    borderColor: THEME_PRIMARY,
    borderRadius: 4,
    padding: 4,
    marginVertical: 4,
  },
  infoIconText: {
    color: THEME_PRIMARY,
    fontSize: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8a8a8a',
  },
  tabButtonTextActive: {
    color: THEME_PRIMARY,
  },
  tabButtonUnderline: {
    marginTop: 6,
    height: 2,
    width: '80%',
    backgroundColor: THEME_PRIMARY,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterLabel: {
    fontSize: 13,
    color: THEME_PRIMARY,
    fontWeight: '600',
  },
  filterChevron: {
    fontSize: 13,
    color: THEME_PRIMARY,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  cardDate: {
    fontSize: 11,
    color: '#8a8a8a',
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  taskId: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1565c0',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    color: '#8a8a8a',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: '80%',
    maxHeight: '60%',
    padding: 12,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemText: {
    fontSize: 13,
    color: '#1F2937',
  },
});

export default CustomerDetailsScreen;