import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ms, sp} from '../../utils/responsive';
import BackBar from '../../components/BackBar';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {HEADER_CONTENT_HEIGHT} from '../../components/AppHeader';
import {DeleteIcon} from '../../components/FabIcons';
import {COLORS} from '../../theme/theme';
import {getCurrentCurrencySymbol} from '../../state/session';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  Platform,
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
  getEnquiryCustomerName,
  getEnquiryDate,
  getEnquiryDisplayNo,
  getEnquiryId,
  styles as crmStyles,
  getNumberField,
  getStringField,
} from './crmShared';
import TaskDetailsScreen from './TaskDetailsScreen';

import {useTranslation} from 'react-i18next';
import { tr } from '../../i18n/tr';
type CustomerDetailsScreenProps = {
  ownerId: number;
  customer: Record<string, unknown>;
  onBack: () => void;
  onEdit?: (customer: Record<string, unknown>) => void;
  onDelete?: (customer: Record<string, unknown>) => void;
  /** Enquiry card actions (Java reuses the CRM enquiry adapter here). */
  onEnquiryPress?: (enquiry: EnquiryListItem) => void;
  onEnquiryEdit?: (enquiry: EnquiryListItem) => void;
  onEnquiryCall?: (enquiry: EnquiryListItem) => void;
  onEnquiryWhatsapp?: (enquiry: EnquiryListItem) => void;
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

// crm_amc_list_new / quotation_list / invoice_list adapters.
const toRecord = (item: unknown) => item as Record<string, unknown>;

// yyyy-MM-dd[THH:mm:ss] -> dd-MM-yyyy (DateUtils.convertDateFormat in the Java adapters).
const toListDate = (raw: string) => {
  const day = raw.split('T')[0];
  const match = day.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : raw;
};

// Java: "Rs." -> rupee sign, otherwise the country's own symbol, always 3 decimals.
const listMoney = (value: number, alwaysRupee = false) => {
  const symbol = getCurrentCurrencySymbol();
  const prefix = alwaysRupee || !symbol || symbol === 'Rs.' ? '₹' : symbol;
  return `${prefix} ${value.toFixed(3)}`;
};

const getListStatusName = (item: unknown) => {
  const record = toRecord(item);
  const nested = (record.status ?? record.Status) as Record<string, unknown> | undefined;
  return (
    (nested && getStringField(nested, ['statusName', 'StatusName'])) ||
    getStringField(record, ['statusName', 'StatusName'])
  );
};

const QUOTE_STATUS: Record<string, {label: string; color: string}> = {
  Assigned: {label: 'Assigned', color: '#FBC02D'},
  'Not Assigned': {label: 'Not Assigned', color: '#6E41BF'},
  Lost: {label: 'Lost', color: '#C3002F'},
  'Task Completed': {label: 'Task Completed', color: '#03DE73'},
};

const INVOICE_STATUS: Record<string, {label: string; color: string}> = {
  Paid: {label: 'Paid', color: '#03DE73'},
  UnPaid: {label: 'UnPaid', color: '#C3002F'},
  'Partial Paid': {label: 'Partial Paid', color: '#FF9B00'},
};

const CustomerDetailsScreen = ({
  ownerId,
  customer,
  onBack,
  onEnquiryPress,
  onEnquiryEdit,
  onEnquiryCall,
  onEnquiryWhatsapp,
  onEdit,
  onDelete,
}: CustomerDetailsScreenProps) => {
  const {t} = useTranslation();
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
    const record = toRecord(item);
    const activation = getStringField(record, ['activationDate', 'ActivationDate']);
    const isActive = record.isActive ?? record.IsActive;
    const active = isActive === true || isActive === 'true' || isActive === 1;
    return (
      <View style={styles.listCard}>
        <View style={styles.amcInner}>
          <View style={styles.amcRow}>
            <Text style={styles.amcName} numberOfLines={1}>
              {getAMCName(item)}
            </Text>
            <Text style={[styles.amcStatus, {color: active ? '#03DE73' : COLORS.darkGray}]}>
              {active ? tr('Active') : tr('DeActive')}
            </Text>
          </View>
          <View style={styles.amcRow}>
            <Text style={[styles.amcText, {flex: 1.5}]}>{t('rn_acti_date')}</Text>
            <Text style={[styles.amcText, {flex: 1.2}]}>{activation ? toListDate(activation) : ''}</Text>
            <View style={{flex: 0.5}} />
            <Text style={[styles.amcText, {flex: 1.5}]}>{t('no_of_services')}</Text>
            <Text style={[styles.amcText, {flex: 0.5, textAlign: 'right'}]}>
              {getStringField(record, ['totalServices', 'TotalServices'])}
            </Text>
          </View>
          <View style={styles.amcRow}>
            <Text style={[styles.amcText, {flex: 1.5}]}>{t('service_occurrence')}</Text>
            <Text style={[styles.amcText, {flex: 1.2}]}>
              {getStringField(record, ['serviceOccuranceType', 'ServiceOccuranceType'])}
            </Text>
            <View style={{flex: 0.5}} />
            <Text style={[styles.amcText, {flex: 1.5}]}>{t('service_left')}</Text>
            <Text style={[styles.amcText, {flex: 0.5, textAlign: 'right'}]}>
              {getStringField(record, ['amcServicesLeftCount', 'AMCServicesLeftCount'])}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderQuotationCard = ({item}: {item: Record<string, unknown>}) => {
    const status = QUOTE_STATUS[getListStatusName(item)];
    const created = getStringField(item, ['createdDate', 'CreatedDate']);
    const customerObj = (item.customer ?? item.Customer) as Record<string, unknown> | undefined;
    const customerName =
      (customerObj && getStringField(customerObj, ['customerName', 'CustomerName'])) ||
      getStringField(item, ['customerName', 'CustomerName']);
    const id = getNumberField(item, ['id', 'Id']);
    return (
      <TouchableOpacity
        style={styles.listCard}
        activeOpacity={0.8}
        onPress={() => setSelectedQuotation(item)}
      >
        <View>
          {status ? (
            <View style={[styles.docRibbon, {backgroundColor: status.color}]}>
              <Text style={styles.docRibbonText}>{tr(status.label)}</Text>
            </View>
          ) : (
            <View style={styles.docRibbonSpacer} />
          )}
          <Text style={[styles.docId, {fontSize: sp(11)}]}>[QUO{id}]</Text>
          <Text style={[styles.docDate, {fontSize: sp(12)}]}>{created ? toListDate(created) : ''}</Text>
        </View>
        <View style={styles.docBody}>
          <View style={{flex: 0.65}}>
            <Text style={styles.docName} numberOfLines={2}>
              {getStringField(item, ['quoteName', 'QuoteName'])}
            </Text>
            <View style={styles.docLine}>
              <Text style={styles.docLabel}>{t('rn_customer')}</Text>
              <Text style={[styles.docValue, {color: COLORS.primary}]}>{customerName}</Text>
            </View>
          </View>
          <View style={styles.docRight}>
            <Text style={styles.docLabel}>{t('amount') + ' :'} </Text>
            <Text style={[styles.docValue, styles.docBold, {color: '#4CAF50'}]}>
              {listMoney(getNumberField(item, ['grandTotalAmount', 'GrandTotalAmount']))}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderInvoiceCard = ({item}: {item: Record<string, unknown>}) => {
    const statusName = getListStatusName(item);
    const status = INVOICE_STATUS[statusName];
    const created = getStringField(item, ['createdDate', 'CreatedDate']);
    const id = getNumberField(item, ['id', 'Id']);
    const total = getNumberField(item, ['invoiceAmount', 'InvoiceAmount']);
    const pending = getNumberField(item, ['remainingAmount', 'RemainingAmount']);
    const isPaid = statusName === 'Paid';
    const isUnpaid = statusName === 'UnPaid';
    const isPartial = statusName === 'Partial Paid';
    const totalLabel = isPaid ? 'Paid Amount :' : isUnpaid ? 'Pending Amount :' : 'Total Amount :';
    return (
      <TouchableOpacity
        style={styles.listCard}
        activeOpacity={0.8}
        onPress={() => setSelectedInvoice(item)}
      >
        <View>
          {status ? (
            <View style={[styles.docRibbon, {backgroundColor: status.color}]}>
              <Text style={styles.docRibbonText}>{tr(status.label)}</Text>
            </View>
          ) : (
            <View style={styles.docRibbonSpacer} />
          )}
          <Text style={[styles.docId, {fontSize: sp(12)}]}>[INV{id}]</Text>
          <Text style={[styles.docDate, {fontSize: sp(11)}]}>{created ? toListDate(created) : ''}</Text>
        </View>
        <View style={styles.docBody}>
          <View style={{flex: 0.6}}>
            <Text style={styles.docName} numberOfLines={2}>
              {getStringField(item, ['quoteTaskName', 'QuoteTaskName'])}
            </Text>
            <View style={styles.docLine}>
              <Text style={styles.docLabel}>{t('rn_cust_name')}</Text>
              <Text style={[styles.docValue, {color: COLORS.primary}]}>
                {getStringField(item, ['customerName', 'CustomerName'])}
              </Text>
            </View>
            <View style={styles.docLine}>
              <Text style={[styles.docLabel, isUnpaid ? {color: '#FF4A4A'} : null]}>{totalLabel}</Text>
              <Text
                style={[
                  styles.docValue,
                  styles.docBold,
                  {color: isUnpaid ? COLORS.primary : '#4CAF50'},
                ]}
              >
                {listMoney(total, true)}
              </Text>
            </View>
          </View>
          {isPartial ? (
            <View style={[styles.docRight, {flex: 0.4, justifyContent: 'flex-start'}]}>
              <Text style={[styles.docLabel, {color: '#FF9B00'}]}>{t('rn_pending_amt')} </Text>
              <Text style={[styles.docValue, styles.docBold, {color: COLORS.primary}]}>
                {listMoney(pending)}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  // Same card as the CRM Enquiries tab (enquirylists_custom_new): blue ribbon, name + date, then
  // the address with edit / WhatsApp / call glyphs.
  const renderEnquiryCard = ({item}: {item: EnquiryListItem}) => {
    const displayNo = getEnquiryDisplayNo(item);
    const name = getEnquiryCustomerName(item);
    const address = getEnquiryAddress(item);
    const date = getEnquiryDate(item);
    return (
      <TouchableOpacity
        style={crmStyles.card}
        activeOpacity={0.8}
        onPress={() => onEnquiryPress?.(item)}
      >
        <View style={crmStyles.cardRibbon}>
          <Text style={crmStyles.cardRibbonText}>
            {displayNo ? `ENQUIRY #${displayNo}` : tr('ENQUIRY')}
          </Text>
        </View>
        <View style={crmStyles.cardBody}>
          <View style={crmStyles.cardTitleRow}>
            <Text style={crmStyles.cardTitle} numberOfLines={1}>
              {name}
            </Text>
            {date ? <Text style={crmStyles.cardDateText}>{date}</Text> : null}
          </View>
          <View style={crmStyles.cardAddressRow}>
            <Text style={crmStyles.cardSubtitle} numberOfLines={2}>
              {address}
            </Text>
            <TouchableOpacity
              style={crmStyles.cardIconButton}
              onPress={() => onEnquiryEdit?.(item)}
            >
              <Ionicons name="create-outline" style={crmStyles.cardIconText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={crmStyles.cardIconButton}
              onPress={() => onEnquiryWhatsapp?.(item)}
            >
              <Ionicons name="logo-whatsapp" style={crmStyles.cardIconText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={crmStyles.cardIconButton}
              onPress={() => onEnquiryCall?.(item)}
            >
              <Ionicons name="call-outline" style={crmStyles.cardIconText} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const insets = useSafeAreaInsets();
  // Java has no on-screen back control here (hardware back returns to the list). Android does
  // the same; iOS has no hardware back so it keeps a back bar.
  useEffect(() => {
    if (Platform.OS !== 'android' || selectedQuotation || selectedInvoice || selectedTask) {
      return undefined;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => subscription.remove();
  }, [onBack, selectedQuotation, selectedInvoice, selectedTask]);

  // Java's empty lists show the "NO RESULT FOUND !" illustration; real errors stay as text.
  const renderEmpty = (message: string) => (
    <View style={styles.emptyBox}>
      {message.startsWith('No ') ? (
        <Image
          source={require('../../../assets/images/noresultfound.png')}
          style={styles.emptyImage}
          resizeMode="contain"
        />
      ) : (
        <Text style={styles.emptyText}>{message}</Text>
      )}
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
      {Platform.OS === 'ios' ? (
        <BackBar onBack={onBack} underAppHeader />
      ) : (
        <View style={{height: insets.top + HEADER_CONTENT_HEIGHT}} />
      )}

      {/* fragment_crm_task_amc_tabhost: three weighted rows (label .4 / value .6 / action .4) */}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{t('rn_cust_name_2')}</Text>
        <Text style={styles.infoValue}>{customerName}</Text>
        <TouchableOpacity style={styles.infoAction} onPress={() => onEdit?.(customer)}>
          <Ionicons name="create-outline" size={ms(20)} color={THEME_PRIMARY} />
        </TouchableOpacity>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{t('mobile_no_title')}</Text>
        <Text style={styles.infoValue}>{formatPhoneWithCountryCode(customerPhone) || 'NA'}</Text>
        <TouchableOpacity style={styles.infoAction} onPress={() => onDelete?.(customer)}>
          <DeleteIcon size={ms(20)} color={THEME_PRIMARY} />
        </TouchableOpacity>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{t('rn_cust_address')}</Text>
        <Text style={styles.infoValue}>{customerAddress}</Text>
        <View style={styles.infoAction} />
      </View>
      <View style={styles.infoDivider} />

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsRow}
        >
          {TABS.map(tab => {
            const selected = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[styles.tabButton, selected ? styles.tabButtonActive : null]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabButtonText, selected ? styles.tabButtonTextActive : null]}>
                  {tr(tab.label)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {activeTab === 'task' ? (
        <View style={styles.filterRow}>
          <Pressable
            style={styles.filterControl}
            onPress={() => setStatusModalVisible(true)}
          >
            <Text style={styles.filterLabel}>{tr(selectedStatus.label)}</Text>
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
            contentContainerStyle={styles.docListContent}
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
            contentContainerStyle={styles.enquiryListContent}
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
          renderItem={renderQuotationCard}
          contentContainerStyle={styles.docListContent}
          ListEmptyComponent={() => renderEmpty('No quotations found.')}
        />
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item, index) => String(getNumberField(item, ['id', 'Id']) || index)}
          renderItem={renderInvoiceCard}
          contentContainerStyle={styles.docListContent}
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
            <Text style={styles.modalTitle}>{t('select_status')}</Text>
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
                  <Text style={styles.modalItemText}>{tr(option.label)}</Text>
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
            <Text style={styles.modalTitle}>{t('rn_select_month')}</Text>
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
  // Shared card chrome of crm_amc_list_new / quotation_list / invoice_list.
  docListContent: {
    paddingHorizontal: ms(8),
    paddingTop: ms(8),
    paddingBottom: ms(24),
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(10),
    margin: ms(8),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
  },
  amcInner: {
    marginHorizontal: ms(10),
  },
  amcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: ms(8),
  },
  amcName: {
    flex: 1,
    fontSize: sp(12),
    fontWeight: '700',
    color: COLORS.ink,
  },
  amcStatus: {
    flex: 1,
    textAlign: 'right',
    fontSize: sp(12),
    fontWeight: '700',
  },
  amcText: {
    fontSize: sp(12),
    color: COLORS.ink,
  },
  docRibbon: {
    alignSelf: 'flex-start',
    paddingHorizontal: ms(15),
    paddingVertical: ms(3),
    borderRadius: ms(10),
  },
  docRibbonText: {
    color: '#FFFFFF',
    fontSize: sp(9),
  },
  docRibbonSpacer: {
    height: ms(18),
  },
  docId: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ms(5),
    textAlign: 'center',
    fontWeight: '700',
    color: '#1976D2',
  },
  docDate: {
    position: 'absolute',
    right: ms(8),
    top: ms(5),
    fontWeight: '700',
    color: '#000000',
  },
  docBody: {
    flexDirection: 'row',
    marginHorizontal: ms(10),
    marginTop: ms(5),
    marginBottom: ms(14),
  },
  docName: {
    fontSize: sp(16),
    fontWeight: '700',
    color: COLORS.ink,
    paddingLeft: ms(5),
    marginBottom: ms(1),
  },
  docLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ms(5),
  },
  docLabel: {
    fontSize: sp(12),
    color: COLORS.ink,
    paddingLeft: ms(5),
  },
  docValue: {
    fontSize: sp(12),
    paddingLeft: ms(10),
  },
  docBold: {
    fontWeight: '700',
  },
  docRight: {
    flex: 0.35,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
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
  // Java: TableRow margin 5dp, 15sp text, primary labels / light_gray values, red 1dp divider.
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: ms(5),
  },
  infoLabel: {
    flex: 0.4,
    fontSize: sp(15),
    color: COLORS.primary,
  },
  infoValue: {
    flex: 0.6,
    fontSize: sp(15),
    color: COLORS.lightGray,
  },
  infoAction: {
    flex: 0.4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: ms(20),
  },
  infoDivider: {
    height: ms(1),
    margin: ms(5),
    backgroundColor: COLORS.primary,
  },
  // TabLayout (auto mode): white bar, selected tab tinted with a 4dp primary indicator.
  tabsScroll: {
    flexGrow: 0,
    backgroundColor: '#FFFFFF',
  },
  tabsRow: {
    flexGrow: 1,
  },
  tabButton: {
    flexGrow: 1,
    paddingHorizontal: ms(10),
    height: ms(48),
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: ms(4),
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: COLORS.tabSelector,
    borderBottomColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: sp(14),
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  tabButtonTextActive: {
    color: COLORS.primary,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    borderBottomWidth: ms(1),
    borderBottomColor: '#EEEEEE',
  },
  filterControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
  },
  filterLabel: {
    fontSize: sp(16),
    color: THEME_PRIMARY,
  },
  filterChevron: {
    fontSize: sp(20),
    color: THEME_PRIMARY,
  },
  // Java: the enquiry cards carry their own 8dp margin, no extra list padding.
  enquiryListContent: {
    paddingHorizontal: ms(8),
    paddingTop: ms(8),
    paddingBottom: ms(24),
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: ms(30),
  },
  emptyImage: {
    width: ms(200),
    height: ms(200),
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