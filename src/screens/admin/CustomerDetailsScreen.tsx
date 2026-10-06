import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ms, sp} from '../../utils/responsive';
import BackBar from '../../components/BackBar';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from '../../components/AppModal';
import {
  type EnquiryListItem,
  type TaskListItem,
  type TaskListResponse,
  type AMCListItem,
  type AMCListResponse,
} from './adminLegacyApiTypes';
import { getCrmTasklist } from '../../api/task/taskService';
import { getCrmAmclist } from '../../api/amc/amcService';
import { getCrmEnquiryList } from '../../api/customerInquiry/customerInquiryService';
import { getCrmQuotationList } from '../../api/quotation/quotationService';
import { getCrmInvoiceList } from '../../api/accountManagement/accountManagementService';
import { formatAmount } from '../../utils/decimal';
import QuotationDetailsScreen from './QuotationDetailsScreen';
import InvoiceDetailsScreen from './InvoiceDetailsScreen';
import {
  CUSTOMER_ADDRESS_KEYS,
  CUSTOMER_NAME_KEYS,
  CUSTOMER_PHONE_KEYS,
  formatPhoneWithCountryCode,
  getEnquiryAddress,
  getEnquiryDate,
  getEnquiryDisplayNo,
  getEnquiryId,
  getNumberField,
  getStringField,
} from './crmShared';
import TaskDetailsScreen from './TaskDetailsScreen';

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

  // Java passes the customer's CustomerDetailsid to every CRM tab endpoint.
  const customerId = getNumberField(customer, [
    'customerDetailsid',
    'CustomerDetailsid',
    'CustomerDetailsId',
    'customerId',
    'CustomerId',
  ]);

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

  const [quotations, setQuotations] = useState<Record<string, unknown>[]>([]);
  const [invoices, setInvoices] = useState<Record<string, unknown>[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [docsError, setDocsError] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<Record<string, unknown> | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Record<string, unknown> | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoadingTasks(true);
    setTaskError('');
    try {
      const response = (await getCrmTasklist({
        UserId: ownerId,
        searchparam: '',
        TaskStatusID: selectedStatus.id,
        TaskTypeID: 0,
        pageIndex: 1,
        TaskMonth: monthYear.month,
        TaskYear: monthYear.year,
        CustomerDetailsId: customerId,
      })) as unknown as TaskListResponse;
      setTasks(response.resultData ?? response.ResultData ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load tasks.';
      setTaskError(message);
      setTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [ownerId, customerId, selectedStatus.id, monthYear.month, monthYear.year]);

  const fetchAmc = useCallback(async () => {
    setIsLoadingAmc(true);
    setAmcError('');
    try {
      const response = (await getCrmAmclist({
        UserId: ownerId,
        CustomerDetailsId: customerId,
        pageIndex: 1,
      })) as unknown as AMCListResponse;
      setAmcItems(response.resultData ?? response.ResultData ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load AMC records.';
      setAmcError(message);
      setAmcItems([]);
    } finally {
      setIsLoadingAmc(false);
      setHasLoadedAmc(true);
    }
  }, [ownerId, customerId]);

  const fetchEnquiries = useCallback(async () => {
    setIsLoadingEnquiries(true);
    setEnquiryError('');
    try {
      const response = (await getCrmEnquiryList({
        UserId: ownerId,
        pageIndex: 1,
        CustomerId: customerId,
      })) as unknown as Record<string, unknown>;
      setEnquiries(
        ((response.resultData ?? response.ResultData) as EnquiryListItem[] | undefined) ?? [],
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load enquiries.';
      setEnquiryError(message);
      setEnquiries([]);
    } finally {
      setIsLoadingEnquiries(false);
      setHasLoadedEnquiries(true);
    }
  }, [ownerId, customerId]);

  // Quotation / Invoice: CRMQuotationFragment + CRMCustomerInvoice.
  const fetchDocs = useCallback(
    async (kind: 'quotation' | 'invoice') => {
      setIsLoadingDocs(true);
      setDocsError('');
      try {
        const params = {UserId: ownerId, pageIndex: 1, CustomerId: customerId};
        const response = (kind === 'quotation'
          ? await getCrmQuotationList(params)
          : await getCrmInvoiceList(params)) as unknown as Record<string, unknown>;
        const list = ((response.resultData ?? response.ResultData) as Record<string, unknown>[] | undefined) ?? [];
        (kind === 'quotation' ? setQuotations : setInvoices)(Array.isArray(list) ? list : []);
      } catch (error) {
        setDocsError(error instanceof Error ? error.message : 'Unable to load records.');
        (kind === 'quotation' ? setQuotations : setInvoices)([]);
      } finally {
        setIsLoadingDocs(false);
      }
    },
    [ownerId, customerId],
  );

  useEffect(() => {
    if (activeTab === 'quotation' || activeTab === 'invoice') {
      fetchDocs(activeTab);
    }
  }, [activeTab, fetchDocs]);

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

  if (selectedQuotation) {
    return (
      <QuotationDetailsScreen
        ownerId={ownerId}
        quotationId={getNumberField(selectedQuotation, ['id', 'Id'])}
        onBack={() => setSelectedQuotation(null)}
        onDeleted={() => {
          setSelectedQuotation(null);
          fetchDocs('quotation');
        }}
      />
    );
  }

  if (selectedInvoice) {
    return (
      <InvoiceDetailsScreen
        ownerId={ownerId}
        invoiceId={getNumberField(selectedInvoice, ['id', 'Id'])}
        initialTaskName={getStringField(selectedInvoice, ['quoteTaskName', 'QuoteTaskName'])}
        onBack={() => setSelectedInvoice(null)}
        onDeleted={() => {
          setSelectedInvoice(null);
          fetchDocs('invoice');
        }}
      />
    );
  }

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
        underAppHeader
      />
    );
  }

  return (
    <View style={styles.screen}>
      <BackBar onBack={onBack} underAppHeader />

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
            <Text style={styles.infoValue}>{formatPhoneWithCountryCode(customerPhone) || 'NA'}</Text>
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
            <Ionicons name="chevron-down" style={styles.filterChevron} />
          </Pressable>
          <Pressable
            style={styles.filterControl}
            onPress={() => setMonthModalVisible(true)}
          >
            <Text style={styles.filterLabel}>{monthLabel}</Text>
            <Ionicons name="chevron-down" style={styles.filterChevron} />
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
      ) : isLoadingDocs ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={THEME_PRIMARY} size="large" />
        </View>
      ) : docsError ? (
        renderEmpty(docsError)
      ) : activeTab === 'quotation' ? (
        <FlatList
          data={quotations}
          keyExtractor={(item, index) => String(getNumberField(item, ['id', 'Id']) || index)}
          renderItem={({item}) => (
            <TouchableOpacity style={styles.docCard} onPress={() => setSelectedQuotation(item)}>
              <Text style={styles.docTitle} numberOfLines={1}>
                {getStringField(item, ['quoteName', 'QuoteName'])}{' '}
                <Text style={styles.docId}>[QUO{getNumberField(item, ['id', 'Id'])}]</Text>
              </Text>
              <Text style={styles.docSub} numberOfLines={1}>
                {getStringField(item, ['customerName', 'CustomerName'])}
              </Text>
              <Text style={styles.docAmount}>
                Rs. {formatAmount(getNumberField(item, ['grandTotalAmount', 'GrandTotalAmount']))}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => renderEmpty('No quotations found.')}
        />
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item, index) => String(getNumberField(item, ['id', 'Id']) || index)}
          renderItem={({item}) => (
            <TouchableOpacity style={styles.docCard} onPress={() => setSelectedInvoice(item)}>
              <Text style={styles.docTitle} numberOfLines={1}>
                {getStringField(item, ['quoteTaskName', 'QuoteTaskName'])}{' '}
                <Text style={styles.docId}>[INV{getNumberField(item, ['id', 'Id'])}]</Text>
              </Text>
              <Text style={styles.docSub} numberOfLines={1}>
                {getStringField(item, ['customerName', 'CustomerName'])}
              </Text>
              <Text style={styles.docAmount}>
                Total: Rs. {formatAmount(getNumberField(item, ['invoiceAmount', 'InvoiceAmount']))}
                {'   '}Pending: Rs. {formatAmount(getNumberField(item, ['remainingAmount', 'RemainingAmount']))}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => renderEmpty('No invoices found.')}
        />
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
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(10),
    padding: ms(12),
    marginBottom: ms(10),
  },
  docTitle: {fontSize: sp(14), fontWeight: '700', color: '#20283A'},
  docId: {fontSize: sp(12), fontWeight: '400', color: '#5f6368'},
  docSub: {fontSize: sp(12), color: '#5f6368', marginTop: ms(2)},
  docAmount: {fontSize: sp(13), color: '#20283A', marginTop: ms(4)},
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: THEME_PRIMARY,
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    padding: ms(4),
  },
  headerIconText: {
    color: '#FFFFFF',
    fontSize: sp(18),
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: ms(16),
  },
  infoCard: {
    flexDirection: 'row',
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    borderBottomWidth: ms(2),
    borderBottomColor: THEME_PRIMARY,
  },
  infoRows: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    marginVertical: ms(4),
  },
  infoLabel: {
    fontSize: sp(13),
    fontWeight: '700',
    color: THEME_PRIMARY,
    width: ms(100),
  },
  infoValue: {
    fontSize: sp(13),
    color: '#3c3c3c',
    flex: 1,
  },
  infoActionsCol: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: ms(8),
  },
  infoIconButton: {
    borderWidth: ms(1),
    borderColor: THEME_PRIMARY,
    borderRadius: ms(4),
    padding: ms(4),
    marginVertical: ms(4),
  },
  infoIconText: {
    color: THEME_PRIMARY,
    fontSize: sp(14),
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: ms(1),
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: ms(10),
  },
  tabButtonText: {
    fontSize: sp(11),
    fontWeight: '600',
    color: '#8a8a8a',
  },
  tabButtonTextActive: {
    color: THEME_PRIMARY,
  },
  tabButtonUnderline: {
    marginTop: ms(6),
    height: ms(2),
    width: '80%',
    backgroundColor: THEME_PRIMARY,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: ms(16),
    paddingVertical: ms(10),
  },
  filterControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
  },
  filterLabel: {
    fontSize: sp(13),
    color: THEME_PRIMARY,
    fontWeight: '600',
  },
  filterChevron: {
    fontSize: sp(13),
    color: THEME_PRIMARY,
  },
  listContent: {
    paddingHorizontal: ms(16),
    paddingBottom: ms(24),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(8),
    borderWidth: ms(1),
    borderColor: '#E5E7EB',
    padding: ms(12),
    marginBottom: ms(10),
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(6),
  },
  statusBadge: {
    borderRadius: ms(4),
    paddingHorizontal: ms(8),
    paddingVertical: ms(2),
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: sp(10),
    fontWeight: '700',
  },
  cardDate: {
    fontSize: sp(11),
    color: '#8a8a8a',
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  taskTitle: {
    fontSize: sp(14),
    fontWeight: '700',
    color: '#1F2937',
  },
  taskId: {
    fontSize: sp(13),
    fontWeight: '600',
    color: '#1565c0',
  },
  cardSubtitle: {
    fontSize: sp(12),
    color: '#6B7280',
    marginTop: ms(4),
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(40),
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(40),
  },
  emptyText: {
    fontSize: sp(13),
    color: '#8a8a8a',
    textAlign: 'center',
    paddingHorizontal: ms(24),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(8),
    width: '100%',
    maxWidth: ms(360),
    maxHeight: '60%',
    padding: ms(12),
  },
  modalTitle: {
    fontSize: sp(14),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: ms(8),
  },
  modalItem: {
    paddingVertical: ms(10),
    borderBottomWidth: ms(1),
    borderBottomColor: '#F0F0F0',
  },
  modalItemText: {
    fontSize: sp(13),
    color: '#1F2937',
  },
});

export default CustomerDetailsScreen;