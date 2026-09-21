// src/screens/admin/AMCDashboardScreen.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {ms, sp} from '../../utils/responsive';
import {ensureSuccess} from '../../utils/apiResponse';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAmcTypeList, getServiceOccurrenceList, getReminderModeList, getAmcServiceMonthList, addAmc } from '../../api/amc/amcService';
import type {
  AMCTypeListResultData as AMCTypeItem,
  AMCListResultData as AMCListItem,
  ServiceOccurrenceListResultData,
  ReminderModeListResultData,
} from '../../api/amc/amc.types';
import { getCustomerList } from '../../api/customerList/customerListService';
import type { CustomerListResultData } from '../../api/customerList/customerList.types';

type AMCLookupItem =
  | ServiceOccurrenceListResultData
  | ReminderModeListResultData;
type CustomerLookupItem = CustomerListResultData;
import { getCurrentUserId } from '../../state/session';
import type { AdminStackParamList } from '../../navigation/AdminStack';

type AMCDashboardScreenProps = {
  ownerId: number;
  openAddAmcTrigger?: number;
  onAddAmcModalClose?: () => void;
};

type AMCTypeOption = {
  id: number;
  name: string;
};

type MonthOption = {
  month: number;
  year: number;
  label: string;
};

type AMCDateField = 'activation' | 'contract' | 'expiry';

type AddAMCDropdownKind = 'services' | 'occurrence' | 'reminder';

type AddAMCDropdownOption = {
  id: number;
  name: string;
};

type CustomerOption = {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  landmark: string;
  brandName: string;
  modelName: string;
  serialNo: string;
};

const THEME_PRIMARY = '#d30035';
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const getResultData = <T,>(response: {
  resultData?: T[] | null;
  ResultData?: T[] | null;
}) => response.resultData ?? response.ResultData ?? [];

const getStringValue = (item: object, keys: string[]) => {
  const record = item as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return '';
};

const getNumberValue = (item: object, keys: string[]) => {
  const record = item as Record<string, unknown>;
  for (const key of keys) {
    const parsed = Number(record[key]);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

const formatDateForApi = (month: number, day: number, year: number) =>
  `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}-${year}`;

const formatDateForAddAMC = (month: number, day: number, year: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const formatTimeForAddAMC = (date: Date) =>
  date
    .toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(/\s+/g, '')
    .trim();

const formatDateDDMMYYYY = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatListDate = (rawDate: string) => {
  if (!rawDate) {
    return '';
  }

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return rawDate.split('T')[0] ?? rawDate;
  }

  return formatDateDDMMYYYY(date);
};

const formatFormDate = (date: Date) => formatDateDDMMYYYY(date);

const formatCalculatedExpiryDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatFormTime = (date: Date) =>
  date
    .toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(/\s+/g, '')
    .trim();

const buildCalendarDays = (month: number, year: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: firstDay }, () => 0),
    ...Array.from({ length: totalDays }, (_, index) => index + 1),
  ];
};

const getLastDayOfMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const addMonthsClamped = (date: Date, months: number) => {
  const nextDate = new Date(date);
  const targetMonth = nextDate.getMonth() + months;
  const targetYear = nextDate.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const day = Math.min(
    nextDate.getDate(),
    getLastDayOfMonth(targetYear, normalizedMonth),
  );

  nextDate.setFullYear(targetYear, normalizedMonth, day);
  return nextDate;
};

const addYearsClamped = (date: Date, years: number) =>
  addMonthsClamped(date, years * 12);

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const calculateAMCExpiryDate = (
  activationDate: Date | null,
  serviceCount: AddAMCDropdownOption | null,
  occurrence: AddAMCDropdownOption | null,
) => {
  const noOfServices = Number(serviceCount?.name);
  const occurrenceId = Number(occurrence?.id);

  if (
    !activationDate ||
    !Number.isFinite(noOfServices) ||
    noOfServices <= 0 ||
    !Number.isFinite(occurrenceId) ||
    occurrenceId === 0
  ) {
    return null;
  }

  const serviceOffset = noOfServices - 1;

  switch (occurrenceId) {
    case 1:
      return addMonthsClamped(activationDate, serviceOffset);
    case 2:
      return addMonthsClamped(activationDate, serviceOffset * 3);
    case 3:
      return addYearsClamped(activationDate, serviceOffset);
    case 4:
      return addMonthsClamped(activationDate, serviceOffset * 6);
    case 5:
      return addMonthsClamped(activationDate, serviceOffset * 4);
    case 6:
      return addDays(activationDate, serviceOffset * 15);
    case 7:
      return addDays(activationDate, serviceOffset * 7);
    case 8:
      return addMonthsClamped(activationDate, serviceOffset * 2);
    case 9:
      return addDays(activationDate, serviceOffset);
    case 10:
      return addDays(activationDate, serviceOffset * 2);
    default:
      return null;
  }
};

const buildMonthOptions = (): MonthOption[] => {
  const now = new Date();
  const year = now.getFullYear();
  return MONTH_LABELS.map((label, index) => ({
    month: index + 1,
    year,
    label: `${label} ${year}`,
  }));
};

const normalizeAMCType = (item: AMCTypeItem): AMCTypeOption | null => {
  const id = Number(item.AMCTypeId);
  const name = String(item.AMCTypeName ?? '').trim();
  if (!Number.isFinite(id) || !name) {
    return null;
  }

  return { id, name };
};

const normalizeLookupOption = (
  item: AMCLookupItem,
  index: number,
): AddAMCDropdownOption | null => {
  const fallbackId = Number(
    Object.values(item).find(
      value => typeof value === 'number' || /^\d+$/.test(String(value)),
    ),
  );
  const id =
    getNumberValue(item, [
      'id',
      'Id',
      'ID',
      'amcServiceOccuranceTypeId',
      'AMCServiceOccuranceTypeId',
      'AMCServiceOccuranceTypeID',
      'amcServiceOccuranceId',
      'AMCServiceOccuranceId',
      'AMCServiceOccuranceID',
      'amcServiceOccurrenceTypeId',
      'AMCServiceOccurrenceTypeId',
      'AMCServiceOccurrenceTypeID',
      'serviceOccuranceTypeId',
      'ServiceOccuranceTypeId',
      'ServiceOccuranceTypeID',
      'occurrenceId',
      'OccurrenceId',
      'OccurrenceID',
      'occuranceId',
      'OccuranceId',
      'OccuranceID',
      'reminderId',
      'ReminderId',
      'ReminderID',
      'amcSetReminderId',
      'AMCSetReminderId',
      'AMCSetReminderID',
      'setReminderId',
      'SetReminderId',
      'SetReminderID',
    ]) ||
    (Number.isFinite(fallbackId) ? fallbackId : 0) ||
    index + 1;
  const name =
    getStringValue(item, [
      'name',
      'Name',
      'amcServiceOccuranceTypeName',
      'AMCServiceOccuranceTypeName',
      'amcServiceOccuranceName',
      'AMCServiceOccuranceName',
      'amcServiceOccurrenceTypeName',
      'AMCServiceOccurrenceTypeName',
      'serviceOccuranceTypeName',
      'ServiceOccuranceTypeName',
      'serviceOccuranceName',
      'ServiceOccuranceName',
      'occurrenceName',
      'OccurrenceName',
      'occuranceName',
      'OccuranceName',
      'reminderName',
      'ReminderName',
      'amcSetReminderName',
      'AMCSetReminderName',
      'amcSetRemindersName',
      'AMCSetRemindersName',
      'setReminderName',
      'SetReminderName',
      'reminder',
      'Reminder',
    ]) ||
    Object.values(item).find(
      value => typeof value === 'string' && value.trim(),
    );

  if (!name) {
    return null;
  }

  return { id, name: String(name).trim() };
};

const normalizeCustomerOption = (
  item: CustomerLookupItem,
  index: number,
): CustomerOption | null => {
  const fallbackId = Number(
    Object.values(item).find(
      value => typeof value === 'number' || /^\d+$/.test(String(value)),
    ),
  );
  const id =
    getNumberValue(item, [
      'customerId',
      'CustomerId',
      'CustomerID',
      'id',
      'Id',
      'ID',
    ]) ||
    (Number.isFinite(fallbackId) ? fallbackId : 0) ||
    index + 1;
  const name = getStringValue(item, [
    'customerName',
    'CustomerName',
    'name',
    'Name',
    'fullName',
    'FullName',
  ]);

  if (!name) {
    return null;
  }

  return {
    id,
    name,
    phone: getStringValue(item, [
      'customerNumber',
      'CustomerNumber',
      'customerMobileNumber',
      'CustomerMobileNumber',
      'customerMobileNo',
      'CustomerMobileNo',
      'contactNo',
      'ContactNo',
      'contactNumber',
      'ContactNumber',
      'mobileNo',
      'MobileNo',
      'mobileNumber',
      'MobileNumber',
      'Mobile',
      'mobile',
      'phone',
      'Phone',
      'phoneNo',
      'PhoneNo',
      'phoneNumber',
      'PhoneNumber',
      'primaryMobile',
      'PrimaryMobile',
      'primaryMobileNumber',
      'PrimaryMobileNumber',
    ]),
    email: getStringValue(item, ['emailId', 'EmailId', 'email', 'Email']),
    address: getStringValue(item, [
      'address',
      'Address',
      'customerAddress',
      'CustomerAddress',
      'fullAddress',
      'FullAddress',
    ]),
    landmark: getStringValue(item, [
      'landmark',
      'Landmark',
      'landMark',
      'LandMark',
      'customerLandmark',
      'CustomerLandmark',
    ]),
    brandName: getStringValue(item, [
      'brandName',
      'BrandName',
      'brand',
      'Brand',
      'productBrand',
      'ProductBrand',
    ]),
    modelName: getStringValue(item, [
      'modelName',
      'ModelName',
      'modelNo',
      'ModelNo',
      'modelNumber',
      'ModelNumber',
      'productModel',
      'ProductModel',
    ]),
    serialNo: getStringValue(item, [
      'serialNo',
      'SerialNo',
      'serialNumber',
      'SerialNumber',
      'productSerialNo',
      'ProductSerialNo',
    ]),
  };
};

const filterCustomerOptions = (customers: CustomerOption[], query: string) => {
  const searchTerm = query.trim().toLowerCase();
  if (searchTerm.length < 2) {
    return [];
  }

  return customers
    .filter(option => option.name.toLowerCase().includes(searchTerm))
    .slice(0, 20);
};

const getAMCKey = (item: AMCListItem, index: number) => {
  const id = String(item.AMCsId ?? item.AMCServiceDetailsId ?? '');
  // Combine ID with index to ensure uniqueness even if IDs are duplicated
  return id ? `${id}-${index}` : String(index);
};

const getAMCTitle = (item: AMCListItem) =>
  getStringValue(item as Record<string, unknown>, [
    'customerName',
    'CustomerName',
    'name',
    'Name',
    'amcName',
    'AMCName',
  ]) || 'AMC';

const getAMCServiceType = (item: AMCListItem) =>
  getStringValue(item as Record<string, unknown>, [
    'serviceType',
    'ServiceType',
    'amcTypeName',
    'AMCTypeName',
    'servicetype',
    'amctypename',
    'service_type',
    'Service_Type',
    'amc_type_name',
    'AMC_Type_Name',
  ]);

const getAMCFieldWorker = (item: AMCListItem) =>
  item.TaskDetails?.TechnicianName?.trim() ||
  getStringValue(item as Record<string, unknown>, [
    'fieldWorkerName',
    'FieldWorkerName',
    'technicianName',
    'TechnicianName',
    'userName',
    'UserName',
    'fieldworkername',
    'technicianname',
    'username',
    'field_worker_name',
    'Field_Worker_Name',
    'technician_name',
    'Technician_Name',
    'user_name',
    'User_Name',
    'fieldWorker',
    'FieldWorker',
    'technician',
    'Technician',
  ]);

const getAMCTaskId = (item: AMCListItem) =>
  (item.TaskDetails?.TaskId ? String(item.TaskDetails.TaskId) : '') ||
  getStringValue(item as Record<string, unknown>, [
    'taskId',
    'TaskId',
    'newTaskID',
    'NewTaskID',
    'taskid',
    'newtaskid',
    'task_id',
    'Task_Id',
    'new_task_id',
    'New_Task_Id',
    'taskID',
    'task_ID',
  ]);

const getAMCRawDate = (item: AMCListItem) =>
  item.TaskDetails?.TaskDate ||
  getStringValue(item as Record<string, unknown>, [
    'taskDate',
    'TaskDate',
    'date',
    'Date',
    'amcDate',
    'AMCDate',
    'amcServiceDate',
    'AMCServiceDate',
  ]);

const getAMCTime = (item: AMCListItem, index: number) =>
  item.TaskDetails?.TaskTime ||
  getStringValue(item as Record<string, unknown>, [
    'taskTime',
    'TaskTime',
    'serviceTime',
    'ServiceTime',
    'time',
    'Time',
  ]) || (index === 0 ? '03:00 am' : '02:00 am');

const getAMCServiceDetailsId = (item: AMCListItem) =>
  getNumberValue(item as Record<string, unknown>, [
    'amcServiceDetailsId',
    'AMCServiceDetailsId',
  ]);

const getAMCsId = (item: AMCListItem) =>
  getNumberValue(item as Record<string, unknown>, [
    'amCsId',
    'AMCsId',
    'id',
    'Id',
  ]);

const getContactNo = (item: AMCListItem) =>
  getStringValue(item as Record<string, unknown>, [
    'contactNo',
    'ContactNo',
    'contact',
    'Contact',
    'customerNumber',
    'CustomerNumber',
    'mobileNo',
    'MobileNo',
  ]);

const formatTimeLabel = (rawTime: string) => {
  const date = new Date(rawTime);
  if (!Number.isNaN(date.getTime())) {
    return date
      .toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      .toLowerCase();
  }

  return rawTime;
};

const getCompletedServiceCount = (item: AMCListItem) =>
  getNumberValue(item as Record<string, unknown>, [
    'completedServiceCount',
    'CompletedServiceCount',
    'currentServiceCount',
    'CurrentServiceCount',
    'serviceCount',
    'ServiceCount',
    'serviceCompletedCount',
    'ServiceCompletedCount',
    'noOfServiceCompleted',
    'NoOfServiceCompleted',
    'ServiceNo',
  ]);

const getTotalServiceCount = (item: AMCListItem) => {
  const total = getNumberValue(item as Record<string, unknown>, [
    'totalServiceCount',
    'TotalServiceCount',
    'noOfServices',
    'NoOfServices',
    'totalServices',
    'TotalServices',
    'totalAMCService',
    'TotalAMCService',
  ]);

  return total > 0 ? total : 12;
};

const AMCDashboardScreen = ({
  ownerId,
  openAddAmcTrigger,
  onAddAmcModalClose,
}: AMCDashboardScreenProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const today = useMemo(() => new Date(), []);
  const monthOptions = useMemo(buildMonthOptions, []);
  const defaultMonth = monthOptions[today.getMonth()] ?? monthOptions[0];
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<AMCListItem[]>([]);
  const [amcTypes, setAmcTypes] = useState<AMCTypeOption[]>([
    { id: 0, name: 'Select AMC Type' },
  ]);
  const [selectedType, setSelectedType] = useState<AMCTypeOption>({
    id: 0,
    name: 'Select AMC Type',
  });
  const [selectedMonth, setSelectedMonth] = useState<MonthOption>(defaultMonth);
  const [search, setSearch] = useState('');
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [underWarranty, setUnderWarranty] = useState(true);
  const [activeDateField, setActiveDateField] = useState<AMCDateField | null>(
    null,
  );
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [activationDate, setActivationDate] = useState<Date | null>(null);
  const [contractDate, setContractDate] = useState<Date | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [serviceTime, setServiceTime] = useState<Date | null>(null);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(
    () => new Date(),
  );
  const [selectedClockTime, setSelectedClockTime] = useState(() => new Date());
  const [occurrenceOptions, setOccurrenceOptions] = useState<
    AddAMCDropdownOption[]
  >([]);
  const [reminderOptions, setReminderOptions] = useState<
    AddAMCDropdownOption[]
  >([]);
  const [selectedServiceCount, setSelectedServiceCount] =
    useState<AddAMCDropdownOption | null>(null);
  const [selectedOccurrence, setSelectedOccurrence] =
    useState<AddAMCDropdownOption | null>(null);
  const [selectedReminder, setSelectedReminder] =
    useState<AddAMCDropdownOption | null>(null);
  const [activeAddDropdown, setActiveAddDropdown] =
    useState<AddAMCDropdownKind | null>(null);
  const [addDropdownSearch, setAddDropdownSearch] = useState('');
  const [amcName, setAmcName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerLandmark, setCustomerLandmark] = useState('');
  const [brandName, setBrandName] = useState('');
  const [modelName, setModelName] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [note, setNote] = useState('');
  const [amcAmount, setAmcAmount] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allCustomerOptions, setAllCustomerOptions] = useState<
    CustomerOption[]
  >([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<
    CustomerOption[]
  >([]);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const latestRequestId = useRef(0);
  const latestCustomerRequestId = useRef(0);

  const serviceCountOptions = useMemo(
    () =>
      Array.from({ length: 20 }, (_, index) => ({
        id: index + 1,
        name: String(index + 1),
      })),
    [],
  );

  const loadAMCTypes = useCallback(async () => {
    try {
      const response = await getAmcTypeList();
      const options = getResultData(response)
        .map(normalizeAMCType)
        .filter((option): option is AMCTypeOption => {
          return Boolean(
            option &&
              option.id !== 1 &&
              option.name.toLowerCase() !== 'completed',
          );
        });

      setAmcTypes([{ id: 0, name: 'Select AMC Type' }, ...options]);
    } catch (error) {
      console.warn('[AMC Type Error]', error);
    }
  }, []);

  const loadAMCFormLookups = useCallback(async () => {
    try {
      const [occurrenceResponse, reminderResponse] = await Promise.all([
        getServiceOccurrenceList(),
        getReminderModeList(),
      ]);

      setOccurrenceOptions(
        getResultData(occurrenceResponse)
          .map(normalizeLookupOption)
          .filter((option): option is AddAMCDropdownOption => Boolean(option)),
      );
      setReminderOptions(
        getResultData(reminderResponse)
          .map(normalizeLookupOption)
          .filter((option): option is AddAMCDropdownOption => Boolean(option)),
      );
    } catch (error) {
      console.warn('[AMC Form Lookup Error]', error);
    }
  }, []);

  const loadAMCList = useCallback(
    async (refresh = false) => {
      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await getAmcServiceMonthList({
          OwnerId: ownerId || getCurrentUserId(),
          Date: formatDateForApi(
            selectedMonth.month,
            today.getDate(),
            selectedMonth.year,
          ),
          AMCTypeId: selectedType.id,
        });

        if (latestRequestId.current !== requestId) {
          return;
        }

        const amcData = getResultData(response);
        if (amcData && amcData.length > 0) {
          console.log('[AMC List Debug] First item fields:', Object.keys(amcData[0]));
          console.log('[AMC List Debug] Sample serviceType:', getAMCServiceType(amcData[0]));
          console.log('[AMC List Debug] Sample fieldWorker:', getAMCFieldWorker(amcData[0]));
          console.log('[AMC List Debug] Sample taskId:', getAMCTaskId(amcData[0]));
        }
        setItems(amcData);
      } catch (error) {
        if (latestRequestId.current !== requestId) {
          return;
        }

        const message =
          error instanceof Error ? error.message : 'Unable to load AMC data.';
        Alert.alert('AMC Error', message);
        setItems([]);
      } finally {
        if (latestRequestId.current === requestId) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [ownerId, selectedMonth.month, selectedMonth.year, selectedType.id, today],
  );

  const loadCustomerSuggestions = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length < 2) {
        setCustomerSuggestions([]);
        setIsCustomerLoading(false);
        return;
      }

      if (allCustomerOptions.length > 0) {
        const localMatches = filterCustomerOptions(allCustomerOptions, trimmedQuery);
        if (localMatches.length > 0) {
          setCustomerSuggestions(localMatches);
          setIsCustomerLoading(false);
          return;
        }
      }

      const requestId = latestCustomerRequestId.current + 1;
      latestCustomerRequestId.current = requestId;
      setIsCustomerLoading(true);

      try {
        const response =
          await getCustomerList({
            UserId: ownerId || getCurrentUserId(),
            CustomerTagId: 0,
            SearchParam: trimmedQuery,
          });

        if (latestCustomerRequestId.current !== requestId) {
          return;
        }

        let normalized = getResultData(response)
          .map(normalizeCustomerOption)
          .filter((option): option is CustomerOption => Boolean(option));

        if (normalized.length === 0) {
          const fallbackResponse =
            await getCustomerList({
              UserId: ownerId || getCurrentUserId(),
              CustomerTagId: 0,
            });

          if (latestCustomerRequestId.current !== requestId) {
            return;
          }

          normalized = getResultData(fallbackResponse)
            .map(normalizeCustomerOption)
            .filter((option): option is CustomerOption => Boolean(option));
        }

        setAllCustomerOptions(normalized);
        setCustomerSuggestions(filterCustomerOptions(normalized, trimmedQuery));
      } catch (error) {
        if (latestCustomerRequestId.current === requestId) {
          console.warn('[AMC Customer Lookup Error]', error);
          setCustomerSuggestions([]);
        }
      } finally {
        if (latestCustomerRequestId.current === requestId) {
          setIsCustomerLoading(false);
        }
      }
    },
    [allCustomerOptions, ownerId],
  );

  const resetAddAMCForm = () => {
    setAmcName('');
    setCustomerName('');
    setCustomerNumber('');
    setCustomerEmail('');
    setCustomerAddress('');
    setCustomerLandmark('');
    setBrandName('');
    setModelName('');
    setSerialNo('');
    setNote('');
    setAmcAmount('');
    setReceivedAmount('');
    setSelectedCustomerId(0);
    setUnderWarranty(true);
    setActivationDate(null);
    setContractDate(null);
    setExpiryDate(null);
    setServiceTime(null);
    setSelectedServiceCount(null);
    setSelectedOccurrence(null);
    setSelectedReminder(null);
    setActiveAddDropdown(null);
    setShowCustomerSuggestions(false);
  };

  const handleSubmitAddAMC = async () => {
    if (isSubmitting) {
      return;
    }

    const owner = ownerId || getCurrentUserId();

    if (!amcName.trim()) {
      Alert.alert('Validation', 'Please enter AMC Name.');
      return;
    }

    if (!customerName.trim()) {
      Alert.alert('Validation', 'Please enter Customer Name.');
      return;
    }

    if (!customerNumber.trim()) {
      Alert.alert('Validation', 'Please enter Customer Number.');
      return;
    }

    if (!customerAddress.trim()) {
      Alert.alert('Validation', 'Please enter Address.');
      return;
    }

    if (!customerLandmark.trim()) {
      Alert.alert('Validation', 'Please enter Landmark.');
      return;
    }

    if (!modelName.trim()) {
      Alert.alert('Validation', 'Please enter Model Name.');
      return;
    }

    if (!serialNo.trim()) {
      Alert.alert('Validation', 'Please enter Serial No.');
      return;
    }

    if (!activationDate) {
      Alert.alert('Validation', 'Please select Activation Date.');
      return;
    }

    if (!contractDate) {
      Alert.alert('Validation', 'Please select Contract Date.');
      return;
    }

    if (!serviceTime) {
      Alert.alert('Validation', 'Please select Service Time.');
      return;
    }

    if (!selectedServiceCount) {
      Alert.alert('Validation', 'Please select number of services.');
      return;
    }

    if (!selectedOccurrence) {
      Alert.alert('Validation', 'Please select occurrence.');
      return;
    }

    // Same rules as Java's AMCDialog: amount is required when the product is
    // out of warranty, and the received amount can't exceed it.
    const amcAmountValue = Number(amcAmount) || 0;
    const receivedAmountValue = Number(receivedAmount) || 0;
    if (!underWarranty && !amcAmount.trim()) {
      Alert.alert('Validation', 'Please enter service amount.');
      return;
    }
    if (receivedAmountValue > amcAmountValue) {
      Alert.alert('Validation', 'Received amount cannot be greater than service amount !');
      return;
    }

    try {
      setIsSubmitting(true);
      ensureSuccess(await addAmc({
        AMCAmount: amcAmountValue,
        AMCName: amcName.trim(),
        AMCNotes: note.trim(),
        AMCSetReminderId: selectedReminder ? Number(selectedReminder.id) : 0,
        AMCsId: 0,
        ActivationDate: formatDateForAddAMC(
          activationDate.getMonth() + 1,
          activationDate.getDate(),
          activationDate.getFullYear(),
        ),
        ActivationTime: formatTimeForAddAMC(serviceTime),
        ContractDate: formatDateForAddAMC(
          contractDate.getMonth() + 1,
          contractDate.getDate(),
          contractDate.getFullYear(),
        ),
        CreatedBy: owner,
        ExpiryDate: expiryDate
          ? formatDateForAddAMC(
              expiryDate.getMonth() + 1,
              expiryDate.getDate(),
              expiryDate.getFullYear(),
            )
          : undefined,
        ProductDetail: {
          CreatedBy: owner,
          CustomerDetail: {
            CreatedBy: owner,
            CustomerDetailsid: selectedCustomerId,
            CustomerName: customerName.trim(),
            EmailId: customerEmail.trim(),
            IsActive: true,
            LocationId: 0,
            MobileNumber: customerNumber.trim(),
            OwnerId: owner,
            UpdatedBy: owner,
            UserId: owner,
          },
          CustomerId: 0,
          CustomerLocationId: 0,
          Location: {
            Address: customerAddress.trim(),
            CreatedBy: owner,
            Description: customerLandmark.trim(),
            Id: 0,
            IsActive: true,
            Longitude: '',
            Name: '',
            PinCode: '',
            UpdatedBy: owner,
            latitude: '',
          },
          ProductBrand: brandName.trim(),
          ProductDetailsId: 0,
          ProductName: modelName.trim(),
          ProductSerialNo: serialNo.trim(),
          UnderWarranty: underWarranty,
          UpdatedBy: owner,
          UserId: owner,
        },
        ProductId: 0,
        ReceivedAmount: receivedAmountValue,
        ServiceOccuranceId: Number(selectedOccurrence.id),
        TotalServices: Number(selectedServiceCount.name),
        UpdatedBy: owner,
        UserId: owner,
      }));

      Alert.alert('Success', 'AMC added successfully.');
      setAddModalVisible(false);
      onAddAmcModalClose?.();
      resetAddAMCForm();
      loadAMCList(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to add AMC.';
      Alert.alert('AMC Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const preloadCustomers = useCallback(async () => {
    if (allCustomerOptions.length > 0 || isCustomerLoading) {
      return;
    }

    const requestId = latestCustomerRequestId.current + 1;
    latestCustomerRequestId.current = requestId;
    setIsCustomerLoading(true);

    try {
      const response =
        await getCustomerList({
          UserId: ownerId || getCurrentUserId(),
          CustomerTagId: 0,
          SearchParam: customerName,
        });

      if (latestCustomerRequestId.current !== requestId) {
        return;
      }

      const normalized = getResultData(response)
        .map(normalizeCustomerOption)
        .filter((option): option is CustomerOption => Boolean(option));
      setAllCustomerOptions(normalized);
      setCustomerSuggestions(filterCustomerOptions(normalized, customerName));
    } catch (error) {
      if (latestCustomerRequestId.current === requestId) {
        console.warn('[AMC Customer Lookup Error]', error);
      }
    } finally {
      if (latestCustomerRequestId.current === requestId) {
        setIsCustomerLoading(false);
      }
    }
  }, [allCustomerOptions.length, customerName, isCustomerLoading, ownerId]);

  useEffect(() => {
    loadAMCTypes();
  }, [loadAMCTypes]);

  useEffect(() => {
    loadAMCFormLookups();
  }, [loadAMCFormLookups]);

  useEffect(() => {
    loadAMCList();
  }, [loadAMCList]);

  useEffect(() => {
    if (addModalVisible) {
      preloadCustomers();
    }
  }, [addModalVisible, preloadCustomers]);

  useEffect(() => {
    if (openAddAmcTrigger) {
      setAddModalVisible(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAddAmcTrigger]);

  useEffect(() => {
    const query = customerName.trim();
    if (!showCustomerSuggestions || query.length < 2) {
      setCustomerSuggestions([]);
      setIsCustomerLoading(false);
      return;
    }

    if (allCustomerOptions.length > 0) {
      setCustomerSuggestions(filterCustomerOptions(allCustomerOptions, query));
      return;
    }

    const timeoutId = setTimeout(() => {
      loadCustomerSuggestions(query);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [
    allCustomerOptions,
    customerName,
    loadCustomerSuggestions,
    showCustomerSuggestions,
  ]);

  useEffect(() => {
    setExpiryDate(
      calculateAMCExpiryDate(
        activationDate,
        selectedServiceCount,
        selectedOccurrence,
      ),
    );
  }, [activationDate, selectedOccurrence, selectedServiceCount]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter(item => {
      const searchable = [
        getAMCTitle(item),
        getAMCServiceType(item),
        getAMCFieldWorker(item),
        getAMCTaskId(item),
        getAMCRawDate(item),
        getAMCTime(item, 0),
      ]
        .join(' ')
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [items, search]);

  const renderAMCItem = ({
    item,
    index,
  }: {
    item: AMCListItem;
    index: number;
  }) => {
    const serviceType = getAMCServiceType(item);
    const fieldWorker = getAMCFieldWorker(item);
    const taskId = getAMCTaskId(item);
    const date = formatListDate(getAMCRawDate(item));
    const completedCount = getCompletedServiceCount(item);
    const totalCount = getTotalServiceCount(item);

    const handleAMCPress = () => {
      const amcServiceDetailsId = getAMCServiceDetailsId(item);
      const amcsId = getAMCsId(item);
      const owner = ownerId || getCurrentUserId();
      // Navigate to AMC details screen with the selected item and IDs
      navigation.navigate('AMCDetails', { 
        amcItem: item as Record<string, unknown>,
        amcServiceDetailsId,
        amcsId,
        ownerId: owner,
      });
    };

    return (
      <Pressable style={styles.card} onPress={handleAMCPress}>
        <View style={styles.timeColumn}>
          <Text style={styles.timeText}>
            {formatTimeLabel(getAMCTime(item, index))}
          </Text>
          <View style={styles.timeline} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <View style={styles.titleBlock}>
              <Text numberOfLines={1} style={styles.typeText}>
                {serviceType || 'Service Type'}
              </Text>
              <Text numberOfLines={1} style={styles.customerText}>
                {getAMCTitle(item)}
              </Text>
              <Text style={styles.serviceLabel}>Service Type</Text>
            </View>
            <View style={styles.countBlock}>
              <Text style={styles.dateText}>{date}</Text>
              <Text style={styles.countText}>
                {completedCount}
                <Text style={styles.countSlash}>/</Text>
                <Text style={styles.countTotal}>{totalCount}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Fieldworker :</Text>
            <Text numberOfLines={1} style={styles.metaValue}>
              {fieldWorker || '-'}
            </Text>
            <Text style={styles.taskLabel}>Task ID :</Text>
            <Text numberOfLines={1} style={styles.taskValue}>
              {taskId || '-'}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderPickerModal = (
    visible: boolean,
    title: string,
    onClose: () => void,
    children: React.ReactNode,
  ) => (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalPanel} onPress={() => {}}>
          <Text style={styles.modalTitle}>{title}</Text>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );

  const renderFormInput = (
    placeholder: string,
    options: {
      half?: boolean;
      trailing?: React.ReactNode;
      value?: string;
      onChangeText?: (text: string) => void;
      onFocus?: () => void;
      keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'decimal-pad';
    } = {},
  ) => (
    <View
      style={[styles.formInputShell, options.half ? styles.formHalf : null]}
    >
      <TextInput
        style={styles.formInput}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={options.value}
        onChangeText={options.onChangeText}
        onFocus={options.onFocus}
        keyboardType={options.keyboardType ?? 'default'}
      />
      {options.trailing ? (
        <View style={styles.formTrailing}>{options.trailing}</View>
      ) : null}
    </View>
  );

  const renderPickerInput = (
    placeholder: string,
    value: string,
    onPress: () => void,
    options: { half?: boolean; trailing?: React.ReactNode } = {},
  ) => (
    <Pressable
      style={[styles.formInputShell, options.half ? styles.formHalf : null]}
      onPress={onPress}
    >
      <Text
        numberOfLines={1}
        style={[styles.formSelectText, value ? styles.formValueText : null]}
      >
        {value || placeholder}
      </Text>
      {options.trailing ? (
        <View style={styles.formTrailing}>{options.trailing}</View>
      ) : null}
    </Pressable>
  );

  const renderSelectField = (
    placeholder: string,
    value: string,
    onPress: () => void,
    half = false,
  ) => (
    <Pressable
      style={[styles.formInputShell, half ? styles.formHalf : null]}
      onPress={onPress}
    >
      <Text
        numberOfLines={1}
        style={[styles.formSelectText, value ? styles.formValueText : null]}
      >
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down" style={styles.formSelectArrow} />
    </Pressable>
  );

  const openAddDropdown = (kind: AddAMCDropdownKind) => {
    setActiveAddDropdown(kind);
    setAddDropdownSearch('');
  };

  const getActiveAddDropdownConfig = () => {
    if (activeAddDropdown === 'services') {
      return {
        title: 'Select No. of Services',
        options: serviceCountOptions,
        selected: selectedServiceCount,
      };
    }
    if (activeAddDropdown === 'occurrence') {
      return {
        title: 'Select Occurrence',
        options: occurrenceOptions,
        selected: selectedOccurrence,
      };
    }
    return {
      title: 'Select Reminder',
      options: reminderOptions,
      selected: selectedReminder,
    };
  };

  const handleAddDropdownSelect = (option: AddAMCDropdownOption) => {
    if (activeAddDropdown === 'services') {
      setSelectedServiceCount(option);
    } else if (activeAddDropdown === 'occurrence') {
      setSelectedOccurrence(option);
    } else if (activeAddDropdown === 'reminder') {
      setSelectedReminder(option);
    }

    setActiveAddDropdown(null);
  };

  const handleCustomerSelect = (customer: CustomerOption) => {
    setSelectedCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerNumber(customer.phone);
    setCustomerEmail(customer.email);
    setCustomerAddress(customer.address);
    setCustomerLandmark(customer.landmark);
    setBrandName(customer.brandName);
    setModelName(customer.modelName);
    setSerialNo(customer.serialNo);
    setCustomerSuggestions([]);
    setShowCustomerSuggestions(false);
  };

  const renderCustomerSuggestions = () => {
    const shouldShow =
      showCustomerSuggestions &&
      customerName.trim().length >= 2 &&
      (isCustomerLoading || customerSuggestions.length > 0);

    if (!shouldShow) {
      return null;
    }

    return (
      <View style={styles.customerSuggestionPanel}>
        {isCustomerLoading ? (
          <View style={styles.customerSuggestionStatus}>
            <ActivityIndicator color={THEME_PRIMARY} size="small" />
            <Text style={styles.customerSuggestionStatusText}>
              Loading customers...
            </Text>
          </View>
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={styles.customerSuggestionList}
          >
            {customerSuggestions.map(customer => (
              <Pressable
                key={`${customer.id}-${customer.name}`}
                style={styles.customerSuggestionItem}
                onPress={() => handleCustomerSelect(customer)}
              >
                <Text numberOfLines={1} style={styles.customerSuggestionName}>
                  {customer.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderAddDropdownModal = () => {
    if (!activeAddDropdown) {
      return null;
    }

    const config = getActiveAddDropdownConfig();
    const filteredOptions = config.options.filter(option =>
      option.name
        .toLowerCase()
        .includes(addDropdownSearch.trim().toLowerCase()),
    );

    return (
      <Modal
        transparent
        animationType="fade"
        visible
        onRequestClose={() => setActiveAddDropdown(null)}
      >
        <Pressable
          style={styles.searchDropdownBackdrop}
          onPress={() => setActiveAddDropdown(null)}
        >
          <Pressable style={styles.searchDropdownPanel} onPress={() => {}}>
            <Text style={styles.searchDropdownTitle}>{config.title}</Text>
            <TextInput
              style={styles.searchDropdownInput}
              placeholder="Search..."
              placeholderTextColor="#777777"
              value={addDropdownSearch}
              onChangeText={setAddDropdownSearch}
              autoFocus
            />
            <ScrollView
              style={styles.searchDropdownList}
              keyboardShouldPersistTaps="handled"
            >
              {filteredOptions.map(option => {
                const selected = option.id === config.selected?.id;
                return (
                  <Pressable
                    key={`${option.id}-${option.name}`}
                    style={[
                      styles.searchDropdownOption,
                      selected ? styles.searchDropdownOptionSelected : null,
                    ]}
                    onPress={() => handleAddDropdownSelect(option)}
                  >
                    <Text
                      style={[
                        styles.searchDropdownOptionText,
                        selected
                          ? styles.searchDropdownOptionTextSelected
                          : null,
                      ]}
                    >
                      {option.name}
                    </Text>
                  </Pressable>
                );
              })}
              {filteredOptions.length === 0 ? (
                <Text style={styles.searchDropdownEmpty}>No results found</Text>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  const openDatePicker = (field: AMCDateField) => {
    const existingDate =
      field === 'activation'
        ? activationDate
        : field === 'contract'
        ? contractDate
        : expiryDate;
    const nextDate = existingDate ?? new Date();
    setActiveDateField(field);
    setCalendarDate(nextDate);
    setSelectedCalendarDate(nextDate);
  };

  const confirmDatePicker = () => {
    if (activeDateField === 'activation') {
      setActivationDate(selectedCalendarDate);
    } else if (activeDateField === 'contract') {
      setContractDate(selectedCalendarDate);
    } else if (activeDateField === 'expiry') {
      setExpiryDate(selectedCalendarDate);
    }

    setActiveDateField(null);
  };

  const openTimePicker = () => {
    const nextTime = serviceTime ?? new Date();
    setSelectedClockTime(nextTime);
    setTimePickerVisible(true);
  };

  const confirmTimePicker = () => {
    setServiceTime(selectedClockTime);
    setTimePickerVisible(false);
  };

  const setClockHour = (hour: number) => {
    const nextTime = new Date(selectedClockTime);
    const isPM = nextTime.getHours() >= 12;
    nextTime.setHours((hour % 12) + (isPM ? 12 : 0));
    setSelectedClockTime(nextTime);
  };

  const toggleClockPeriod = (period: 'AM' | 'PM') => {
    const nextTime = new Date(selectedClockTime);
    const hour = nextTime.getHours();
    if (period === 'AM' && hour >= 12) {
      nextTime.setHours(hour - 12);
    } else if (period === 'PM' && hour < 12) {
      nextTime.setHours(hour + 12);
    }
    setSelectedClockTime(nextTime);
  };

  const renderCalendarDialog = () => {
    const visible = activeDateField !== null;
    const month = calendarDate.getMonth();
    const year = calendarDate.getFullYear();
    const days = buildCalendarDays(month, year);
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
      <Modal
        transparent
        animationType="fade"
        visible={visible}
        onRequestClose={() => setActiveDateField(null)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.dateDialog}>
            <View style={styles.dateDialogHeader}>
              <Text style={styles.dateDialogYear}>{year}</Text>
              <Text style={styles.dateDialogTitle}>
                {selectedCalendarDate.toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            </View>
            <View style={styles.calendarBody}>
              <View style={styles.calendarMonthRow}>
                <Pressable
                  hitSlop={10}
                  onPress={() => setCalendarDate(new Date(year, month - 1, 1))}
                >
                  <Text style={styles.calendarNav}>‹</Text>
                </Pressable>
                <Text style={styles.calendarMonthText}>
                  {MONTH_LABELS[month]} {year}
                </Text>
                <Pressable
                  hitSlop={10}
                  onPress={() => setCalendarDate(new Date(year, month + 1, 1))}
                >
                  <Text style={styles.calendarNav}>›</Text>
                </Pressable>
              </View>

              <View style={styles.calendarGrid}>
                {dayNames.map((dayName, index) => (
                  <Text key={`${dayName}-${index}`} style={styles.weekdayText}>
                    {dayName}
                  </Text>
                ))}
                {days.map((day, index) => {
                  const selected =
                    day > 0 &&
                    selectedCalendarDate.getDate() === day &&
                    selectedCalendarDate.getMonth() === month &&
                    selectedCalendarDate.getFullYear() === year;
                  return (
                    <Pressable
                      key={`${day}-${index}`}
                      disabled={!day}
                      style={styles.calendarDay}
                      onPress={() =>
                        setSelectedCalendarDate(new Date(year, month, day))
                      }
                    >
                      <View
                        style={[
                          styles.calendarDayInner,
                          selected ? styles.calendarDaySelected : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.calendarDayText,
                            selected ? styles.calendarDayTextSelected : null,
                          ]}
                        >
                          {day || ''}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.dialogActionRow}>
                <Pressable onPress={() => setActiveDateField(null)}>
                  <Text style={styles.dialogActionText}>CANCEL</Text>
                </Pressable>
                <Pressable onPress={confirmDatePicker}>
                  <Text style={styles.dialogActionText}>OK</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderTimeDialog = () => {
    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const selectedHour = selectedClockTime.getHours() % 12 || 12;
    const selectedMinute = selectedClockTime.getMinutes();
    const period = selectedClockTime.getHours() >= 12 ? 'PM' : 'AM';
    const clockHandRotation = `${selectedHour * 30}deg`;

    return (
      <Modal
        transparent
        animationType="fade"
        visible={timePickerVisible}
        onRequestClose={() => setTimePickerVisible(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.timeDialog}>
            <View style={styles.timeDialogHeader}>
              <Text style={styles.timeDisplay}>
                {selectedHour}:{String(selectedMinute).padStart(2, '0')}
              </Text>
              <View>
                <Pressable onPress={() => toggleClockPeriod('AM')}>
                  <Text
                    style={[
                      styles.periodText,
                      period === 'AM' ? styles.periodTextActive : null,
                    ]}
                  >
                    AM
                  </Text>
                </Pressable>
                <Pressable onPress={() => toggleClockPeriod('PM')}>
                  <Text
                    style={[
                      styles.periodText,
                      period === 'PM' ? styles.periodTextActive : null,
                    ]}
                  >
                    PM
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.clockBody}>
              <View style={styles.clockFace}>
                <View
                  style={[
                    styles.clockHand,
                    { transform: [{ rotate: clockHandRotation }] },
                  ]}
                />
                <View style={styles.clockCenterDot} />
                {hours.map((hour, index) => {
                  const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
                  const radius = 92;
                  const left = 112 + Math.cos(angle) * radius;
                  const top = 112 + Math.sin(angle) * radius;
                  const selected = hour === selectedHour;
                  return (
                    <Pressable
                      key={hour}
                      onPress={() => setClockHour(hour)}
                      style={[
                        styles.clockNumber,
                        { left: left - 18, top: top - 18 },
                        selected ? styles.clockNumberSelected : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.clockNumberText,
                          selected ? styles.clockNumberTextSelected : null,
                        ]}
                      >
                        {hour}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.timeActionRow}>
                <Text style={styles.keyboardIcon}>⌨</Text>
                <View style={styles.timeActionButtons}>
                  <Pressable onPress={() => setTimePickerVisible(false)}>
                    <Text style={styles.dialogActionText}>CANCEL</Text>
                  </Pressable>
                  <Pressable onPress={confirmTimePicker}>
                    <Text style={styles.dialogActionText}>OK</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderAddAMCModal = () => (
    <Modal
      transparent
      animationType="slide"
      visible={addModalVisible}
      onRequestClose={() => {
        setAddModalVisible(false);
        onAddAmcModalClose?.();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.addModalRoot}
      >
        <View style={styles.addModalPanel}>
          <View style={styles.addModalHeader}>
            <Text style={styles.addModalTitle}>Add AMC</Text>
            <Pressable
              hitSlop={10}
              onPress={() => {
                setAddModalVisible(false);
                onAddAmcModalClose?.();
                resetAddAMCForm();
              }}
              style={styles.addModalClose}
            >
              <Text style={styles.addModalCloseText}>x</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.addFormScroll}
            contentContainerStyle={styles.addFormContent}
            keyboardShouldPersistTaps="handled"
          >
            {renderFormInput('AMC Name *', {
              value: amcName,
              onChangeText: setAmcName,
            })}
            <View style={styles.customerAutocompleteWrapper}>
              {renderFormInput('Customer Name *', {
                value: customerName,
                onChangeText: text => {
                  setCustomerName(text);
                  setShowCustomerSuggestions(true);
                },
                onFocus: () => {
                  setShowCustomerSuggestions(true);
                  preloadCustomers();
                },
              })}
              {renderCustomerSuggestions()}
            </View>
            {renderFormInput('Customer Number *', {
              value: customerNumber,
              onChangeText: setCustomerNumber,
              keyboardType: 'phone-pad',
              trailing: <Text style={styles.contactIcon}>ID</Text>,
            })}
            {renderFormInput('Email ID', {
              value: customerEmail,
              onChangeText: setCustomerEmail,
              keyboardType: 'email-address',
            })}
            {renderFormInput('Address *', {
              value: customerAddress,
              onChangeText: setCustomerAddress,
            })}
            {renderFormInput('Landmark *', {
              value: customerLandmark,
              onChangeText: setCustomerLandmark,
            })}
            {renderFormInput('Brand Name', {
              value: brandName,
              onChangeText: setBrandName,
            })}
            {renderFormInput('Model Name *', {
              value: modelName,
              onChangeText: setModelName,
            })}
            {renderFormInput('Serial No. *', {
              value: serialNo,
              onChangeText: setSerialNo,
            })}

            <View style={styles.warrantyRow}>
              <Text style={styles.warrantyLabel}>Under Warranty</Text>
              <View style={styles.warrantyControl}>
                <Pressable
                  style={[
                    styles.warrantyOption,
                    !underWarranty ? styles.warrantyOptionActive : null,
                  ]}
                  onPress={() => setUnderWarranty(false)}
                >
                  <Text
                    style={[
                      styles.warrantyText,
                      !underWarranty ? styles.warrantyTextActive : null,
                    ]}
                  >
                    NO
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.warrantyOption,
                    underWarranty ? styles.warrantyOptionActive : null,
                  ]}
                  onPress={() => setUnderWarranty(true)}
                >
                  <Text
                    style={[
                      styles.warrantyText,
                      underWarranty ? styles.warrantyTextActive : null,
                    ]}
                  >
                    Yes
                  </Text>
                </Pressable>
              </View>
            </View>

            {renderFormInput(underWarranty ? 'Service Amount' : 'Service Amount *', {
              value: amcAmount,
              onChangeText: setAmcAmount,
              keyboardType: 'decimal-pad',
            })}
            {renderFormInput('Received Amount', {
              value: receivedAmount,
              onChangeText: setReceivedAmount,
              keyboardType: 'decimal-pad',
            })}

            <View style={styles.formPairRow}>
              {renderPickerInput(
                'Activation Date *',
                activationDate ? formatFormDate(activationDate) : '',
                () => openDatePicker('activation'),
                { half: true },
              )}
              {renderPickerInput(
                'Time *',
                serviceTime ? formatFormTime(serviceTime) : '',
                openTimePicker,
                {
                  half: true,
                  trailing: <Text style={styles.clockIcon}>◷</Text>,
                },
              )}
            </View>
            <View style={styles.formPairRow}>
              {renderPickerInput(
                'Contract Date *',
                contractDate ? formatFormDate(contractDate) : '',
                () => openDatePicker('contract'),
                { half: true },
              )}
              {renderSelectField(
                'No. of Services',
                selectedServiceCount?.name ?? '',
                () => openAddDropdown('services'),
                true,
              )}
            </View>
            {renderSelectField(
              'Occurrence',
              selectedOccurrence?.name ?? '',
              () => openAddDropdown('occurrence'),
            )}
            <View style={styles.formPairRow}>
              {renderPickerInput(
                'Expiry Date',
                expiryDate ? formatCalculatedExpiryDate(expiryDate) : '',
                () => openDatePicker('expiry'),
                { half: true },
              )}
              {renderSelectField(
                'Reminder',
                selectedReminder?.name ?? '',
                () => openAddDropdown('reminder'),
                true,
              )}
            </View>
            {renderFormInput('Note', {
              value: note,
              onChangeText: setNote,
            })}

            <Pressable
              style={styles.submitAMCButton}
              onPress={handleSubmitAddAMC}
            >
              <Text style={styles.submitAMCIcon}>+</Text>
              <Text style={styles.submitAMCText}>ADD</Text>
              <View style={styles.submitAMCRightSpace} />
            </Pressable>

            <Pressable
              style={styles.cancelAMCButton}
              onPress={() => {
                setAddModalVisible(false);
                onAddAmcModalClose?.();
                resetAddAMCForm();
              }}
            >
              <Text style={styles.cancelAMCText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* The menu/title/notification row used to be drawn here; it's now
            the shared AppHeader rendered once by AdminTabs, above
            AdminHomeScreen (which this screen is embedded in). */}
        <View style={styles.filterRow}>
          <Pressable
            style={styles.headerFilter}
            onPress={() => setTypeModalVisible(true)}
          >
            <Text numberOfLines={1} style={styles.headerFilterText}>
              {selectedType.name}
            </Text>
            <Ionicons name="chevron-down" style={styles.headerArrow} />
          </Pressable>

          <Pressable
            style={styles.headerFilter}
            onPress={() => setMonthModalVisible(true)}
          >
            <Text numberOfLines={1} style={styles.headerFilterText}>
              {selectedMonth.label}
            </Text>
            <Ionicons name="chevron-down" style={styles.headerArrow} />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>Search</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search AMC"
          placeholderTextColor="#8a8a8a"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} style={styles.clearButton}>
            <Text style={styles.clearText}>x</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={styles.addButton}
          onPress={() => setAddModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+AMC</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={THEME_PRIMARY} />
          <Text style={styles.loadingText}>Loading AMC...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={getAMCKey}
          renderItem={renderAMCItem}
          contentContainerStyle={[
            styles.listContent,
            filtered.length === 0 ? styles.emptyListContent : null,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadAMCList(true)}
              colors={[THEME_PRIMARY]}
              tintColor={THEME_PRIMARY}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyMark}>!</Text>
              <Text style={styles.emptyTitle}>No AMC records found</Text>
            </View>
          }
        />
      )}

      {renderPickerModal(
        typeModalVisible,
        'Select AMC Type',
        () => setTypeModalVisible(false),
        amcTypes.map(option => (
          <Pressable
            key={option.id}
            style={[
              styles.optionRow,
              option.id === selectedType.id ? styles.optionRowSelected : null,
            ]}
            onPress={() => {
              setSelectedType(option);
              setTypeModalVisible(false);
            }}
          >
            <Text
              style={[
                styles.optionText,
                option.id === selectedType.id
                  ? styles.optionTextSelected
                  : null,
              ]}
            >
              {option.name}
            </Text>
          </Pressable>
        )),
      )}

      {renderPickerModal(
        monthModalVisible,
        'Select Month',
        () => setMonthModalVisible(false),
        monthOptions.map(option => (
          <Pressable
            key={`${option.month}-${option.year}`}
            style={[
              styles.optionRow,
              option.month === selectedMonth.month &&
              option.year === selectedMonth.year
                ? styles.optionRowSelected
                : null,
            ]}
            onPress={() => {
              setSelectedMonth(option);
              setMonthModalVisible(false);
            }}
          >
            <Text
              style={[
                styles.optionText,
                option.month === selectedMonth.month &&
                option.year === selectedMonth.year
                  ? styles.optionTextSelected
                  : null,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        )),
      )}

      {renderAddAMCModal()}
      {renderAddDropdownModal()}
      {renderCalendarDialog()}
      {renderTimeDialog()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    backgroundColor: THEME_PRIMARY,
    paddingTop: ms(6),
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    height: ms(42),
    paddingHorizontal: ms(16),
  },
  menuButton: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: ms(30),
  },
  menuIcon: {
    color: '#FFFFFF',
    fontSize: sp(15),
  },
  toolbarTitle: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: sp(16),
    fontWeight: '700',
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: ms(18),
  },
  toolbarIcon: {
    color: '#FFFFFF',
    fontSize: sp(15),
    fontWeight: '700',
  },
  filterRow: {
    alignItems: 'center',
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: ms(36),
    justifyContent: 'space-between',
    paddingHorizontal: ms(16),
  },
  headerFilter: {
    alignItems: 'center',
    flexDirection: 'row',
    maxWidth: '48%',
  },
  headerFilterText: {
    color: '#FFFFFF',
    fontSize: sp(12),
    marginRight: ms(8),
  },
  headerArrow: {
    color: '#FFFFFF',
    fontSize: sp(12),
    fontWeight: '700',
  },
  searchRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E7E7E7',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: ms(42),
    paddingLeft: ms(18),
    paddingRight: ms(8),
  },
  searchIcon: {
    color: '#A2A2A2',
    fontSize: sp(10),
    marginRight: ms(6),
  },
  searchInput: {
    color: '#222222',
    flex: 1,
    fontSize: sp(14),
    height: ms(40),
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  clearButton: {
    alignItems: 'center',
    height: ms(28),
    justifyContent: 'center',
    width: ms(28),
  },
  clearText: {
    color: '#4E4E4E',
    fontSize: sp(16),
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#050505',
    borderRadius: ms(8),
    height: ms(28),
    justifyContent: 'center',
    marginLeft: ms(8),
    paddingHorizontal: ms(10),
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: sp(11),
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: ms(18),
  },
  emptyListContent: {
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    minHeight: ms(78),
  },
  timeColumn: {
    alignItems: 'center',
    width: ms(82),
  },
  timeText: {
    alignSelf: 'flex-start',
    color: '#101010',
    fontSize: sp(11),
    fontWeight: '700',
    marginLeft: ms(16),
    marginTop: ms(13),
  },
  timeline: {
    backgroundColor: '#8D99A6',
    borderRadius: ms(2),
    flex: 1,
    marginTop: ms(4),
    width: ms(3),
  },
  cardBody: {
    borderBottomColor: '#EEEEEE',
    borderBottomWidth: ms(1),
    flex: 1,
    justifyContent: 'center',
    paddingRight: ms(12),
    paddingVertical: ms(9),
  },
  cardTopRow: {
    flexDirection: 'row',
  },
  titleBlock: {
    flex: 1,
    paddingRight: ms(10),
  },
  typeText: {
    color: '#5B5B5B',
    fontSize: sp(11),
    marginBottom: ms(4),
  },
  customerText: {
    color: '#111111',
    fontSize: sp(12),
    fontWeight: '800',
    marginBottom: ms(5),
  },
  serviceLabel: {
    color: '#111111',
    fontSize: sp(9),
    fontWeight: '800',
  },
  countBlock: {
    alignItems: 'flex-end',
    minWidth: ms(58),
  },
  dateText: {
    color: '#B5B5B5',
    fontSize: sp(9),
    marginBottom: ms(8),
  },
  countText: {
    color: '#0C1733',
    fontSize: sp(17),
    fontWeight: '500',
  },
  countSlash: {
    color: '#0C1733',
    fontSize: sp(13),
    fontWeight: '600',
  },
  countTotal: {
    color: THEME_PRIMARY,
    fontSize: sp(13),
    fontWeight: '800',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: ms(8),
  },
  metaLabel: {
    color: '#111111',
    fontSize: sp(9),
    fontWeight: '800',
    marginRight: ms(4),
  },
  metaValue: {
    color: '#6F6F6F',
    flex: 1,
    fontSize: sp(9),
    marginRight: ms(8),
  },
  taskLabel: {
    color: '#111111',
    fontSize: sp(9),
    fontWeight: '800',
    marginRight: ms(4),
  },
  taskValue: {
    color: '#6F6F6F',
    fontSize: sp(9),
    minWidth: ms(48),
  },
  loadingRow: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#777777',
    fontSize: sp(13),
    marginTop: ms(8),
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: ms(24),
  },
  emptyMark: {
    color: '#B8B8B8',
    fontSize: sp(30),
    fontWeight: '800',
    marginBottom: ms(8),
  },
  emptyTitle: {
    color: '#777777',
    fontSize: sp(14),
    fontWeight: '700',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ms(22),
  },
  modalPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(8),
    width: '100%',
    maxWidth: ms(420),
    maxHeight: '75%',
    paddingVertical: ms(10),
  },
  modalTitle: {
    color: '#111111',
    fontSize: sp(16),
    fontWeight: '800',
    paddingHorizontal: ms(16),
    paddingVertical: ms(10),
  },
  optionRow: {
    paddingHorizontal: ms(16),
    paddingVertical: ms(13),
  },
  optionRowSelected: {
    backgroundColor: '#F8E6EA',
  },
  optionText: {
    color: '#222222',
    fontSize: sp(14),
  },
  optionTextSelected: {
    color: THEME_PRIMARY,
    fontWeight: '800',
  },
  addModalRoot: {
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  addModalPanel: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: ms(560),
    borderTopLeftRadius: ms(22),
    borderTopRightRadius: ms(22),
    maxHeight: '90%',
    overflow: 'hidden',
  },
  addModalHeader: {
    alignItems: 'center',
    backgroundColor: '#303530',
    borderBottomLeftRadius: ms(18),
    borderBottomRightRadius: ms(18),
    flexDirection: 'row',
    minHeight: ms(60),
    paddingHorizontal: ms(16),
  },
  addModalTitle: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: sp(22),
    fontWeight: '500',
  },
  addModalClose: {
    alignItems: 'center',
    height: ms(38),
    justifyContent: 'center',
    width: ms(38),
  },
  addModalCloseText: {
    color: '#FFFFFF',
    fontSize: sp(32),
    fontWeight: '300',
    lineHeight: sp(34),
  },
  addFormScroll: {
    backgroundColor: '#FFFFFF',
  },
  addFormContent: {
    paddingBottom: ms(18),
    paddingHorizontal: ms(16),
    paddingTop: ms(16),
  },
  formInputShell: {
    alignItems: 'center',
    borderColor: '#999999',
    borderRadius: ms(19),
    borderWidth: ms(1),
    flexDirection: 'row',
    height: ms(39),
    marginBottom: ms(18),
    paddingHorizontal: ms(14),
  },
  formInput: {
    color: '#1F2937',
    flex: 1,
    fontSize: sp(15),
    height: ms(38),
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  formTrailing: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: ms(8),
  },
  customerAutocompleteWrapper: {
    zIndex: 20,
  },
  customerSuggestionPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D9D9D9',
    borderRadius: ms(8),
    borderWidth: ms(1),
    elevation: 8,
    left: 0,
    maxHeight: ms(210),
    position: 'absolute',
    right: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    top: ms(43),
    zIndex: 30,
  },
  customerSuggestionList: {
    maxHeight: ms(208),
  },
  customerSuggestionItem: {
    borderBottomColor: '#EEEEEE',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: ms(14),
    paddingVertical: ms(10),
  },
  customerSuggestionName: {
    color: '#111111',
    fontSize: sp(15),
    fontWeight: '700',
  },
  customerSuggestionMeta: {
    color: '#777777',
    fontSize: sp(12),
    marginTop: ms(3),
  },
  customerSuggestionStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: ms(52),
    paddingHorizontal: ms(14),
  },
  customerSuggestionStatusText: {
    color: '#777777',
    fontSize: sp(13),
    marginLeft: ms(8),
  },
  contactIcon: {
    color: THEME_PRIMARY,
    fontSize: sp(15),
    fontWeight: '800',
  },
  warrantyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: ms(18),
    minHeight: ms(38),
  },
  warrantyLabel: {
    color: '#777777',
    flex: 1,
    fontSize: sp(13),
  },
  warrantyControl: {
    borderColor: '#70798A',
    borderRadius: ms(18),
    borderWidth: ms(1),
    flexDirection: 'row',
    height: ms(38),
    overflow: 'hidden',
    width: '50%',
  },
  warrantyOption: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  warrantyOptionActive: {
    backgroundColor: '#1E2738',
  },
  warrantyText: {
    color: '#1E2738',
    fontSize: sp(13),
    fontWeight: '700',
  },
  warrantyTextActive: {
    color: '#FFFFFF',
  },
  formPairRow: {
    flexDirection: 'row',
    gap: ms(10),
  },
  formHalf: {
    flex: 1,
  },
  formSelectText: {
    color: '#777777',
    flex: 1,
    fontSize: sp(15),
  },
  formValueText: {
    color: '#1F2937',
  },
  formSelectArrow: {
    color: '#1F2937',
    fontSize: sp(18),
    fontWeight: '800',
    marginLeft: ms(8),
  },
  clockIcon: {
    color: '#6B7280',
    fontSize: sp(18),
    fontWeight: '700',
  },
  submitAMCButton: {
    alignItems: 'center',
    backgroundColor: THEME_PRIMARY,
    borderRadius: ms(22),
    elevation: 4,
    flexDirection: 'row',
    height: ms(48),
    justifyContent: 'space-between',
    marginTop: ms(8),
    paddingHorizontal: ms(24),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  submitAMCIcon: {
    color: '#FFFFFF',
    fontSize: sp(28),
    fontWeight: '300',
    width: ms(44),
  },
  submitAMCText: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: sp(17),
    fontWeight: '800',
    textAlign: 'center',
  },
  submitAMCRightSpace: {
    width: ms(44),
  },
  cancelAMCButton: {
    alignItems: 'center',
    height: ms(52),
    justifyContent: 'center',
  },
  cancelAMCText: {
    color: THEME_PRIMARY,
    fontSize: sp(17),
    fontWeight: '800',
  },
  pickerOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: ms(24),
  },
  dateDialog: {
    backgroundColor: '#FFFFFF',
    elevation: 8,
    maxWidth: ms(420),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    width: '100%',
  },
  dateDialogHeader: {
    backgroundColor: '#C8142E',
    paddingHorizontal: ms(24),
    paddingVertical: ms(18),
  },
  dateDialogYear: {
    color: '#F5B3BC',
    fontSize: sp(16),
    fontWeight: '800',
  },
  dateDialogTitle: {
    color: '#FFFFFF',
    fontSize: sp(31),
    fontWeight: '800',
    marginTop: ms(4),
  },
  calendarBody: {
    paddingHorizontal: ms(28),
    paddingTop: ms(22),
  },
  calendarMonthRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ms(22),
  },
  calendarNav: {
    color: '#222222',
    fontSize: sp(36),
    fontWeight: '300',
    lineHeight: sp(38),
  },
  calendarMonthText: {
    color: '#222222',
    fontSize: sp(16),
    fontWeight: '800',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekdayText: {
    color: '#888888',
    fontSize: sp(14),
    fontWeight: '700',
    marginBottom: ms(18),
    textAlign: 'center',
    width: `${100 / 7}%`,
  },
  calendarDay: {
    alignItems: 'center',
    height: ms(42),
    justifyContent: 'center',
    marginBottom: ms(2),
    width: `${100 / 7}%`,
  },
  calendarDayInner: {
    alignItems: 'center',
    height: ms(42),
    justifyContent: 'center',
    width: ms(42),
  },
  calendarDaySelected: {
    backgroundColor: '#C8142E',
    borderRadius: ms(21),
  },
  calendarDayText: {
    color: '#444444',
    fontSize: sp(16),
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dialogActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: ms(34),
    justifyContent: 'flex-end',
    paddingBottom: ms(24),
    paddingTop: ms(22),
  },
  dialogActionText: {
    color: '#C8142E',
    fontSize: sp(15),
    fontWeight: '800',
  },
  timeDialog: {
    backgroundColor: '#FFFFFF',
    elevation: 8,
    maxWidth: ms(520),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    width: '100%',
  },
  timeDialogHeader: {
    alignItems: 'center',
    backgroundColor: '#C8142E',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: ms(118),
  },
  timeDisplay: {
    color: '#FFFFFF',
    fontSize: sp(54),
    fontWeight: '300',
    marginRight: ms(18),
  },
  periodText: {
    color: '#F5B3BC',
    fontSize: sp(19),
    fontWeight: '800',
    lineHeight: sp(30),
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  clockBody: {
    paddingBottom: ms(22),
    paddingHorizontal: ms(24),
    paddingTop: ms(22),
  },
  clockFace: {
    alignSelf: 'center',
    backgroundColor: '#EEEEEE',
    borderRadius: ms(112),
    height: ms(224),
    marginBottom: ms(14),
    width: ms(224),
  },
  clockHand: {
    backgroundColor: '#C8142E',
    height: ms(78),
    left: ms(111),
    position: 'absolute',
    top: ms(44),
    transform: [{ rotate: '30deg' }],
    width: ms(2),
  },
  clockCenterDot: {
    backgroundColor: '#C8142E',
    borderRadius: ms(5),
    height: ms(10),
    left: ms(107),
    position: 'absolute',
    top: ms(107),
    width: ms(10),
  },
  clockNumber: {
    alignItems: 'center',
    borderRadius: ms(18),
    height: ms(36),
    justifyContent: 'center',
    position: 'absolute',
    width: ms(36),
  },
  clockNumberSelected: {
    backgroundColor: '#C8142E',
  },
  clockNumberText: {
    color: '#333333',
    fontSize: sp(18),
  },
  clockNumberTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  timeActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keyboardIcon: {
    color: '#777777',
    fontSize: sp(22),
  },
  timeActionButtons: {
    flexDirection: 'row',
    gap: ms(34),
  },
  searchDropdownBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: ms(28),
  },
  searchDropdownPanel: {
    backgroundColor: '#FFFFFF',
    maxHeight: '62%',
    maxWidth: ms(540),
    paddingBottom: ms(20),
    paddingHorizontal: ms(22),
    paddingTop: ms(22),
    width: '100%',
  },
  searchDropdownTitle: {
    color: '#666666',
    fontSize: sp(22),
    fontWeight: '800',
    marginBottom: ms(14),
  },
  searchDropdownInput: {
    borderColor: '#FF4054',
    borderRadius: ms(8),
    borderWidth: ms(1),
    color: '#111111',
    fontSize: sp(19),
    height: ms(54),
    marginBottom: ms(16),
    paddingHorizontal: ms(14),
  },
  searchDropdownList: {
    maxHeight: ms(260),
  },
  searchDropdownOption: {
    justifyContent: 'center',
    minHeight: ms(54),
    paddingHorizontal: ms(10),
  },
  searchDropdownOptionSelected: {
    backgroundColor: '#F8E6EA',
  },
  searchDropdownOptionText: {
    color: '#111111',
    fontSize: sp(18),
  },
  searchDropdownOptionTextSelected: {
    color: THEME_PRIMARY,
    fontWeight: '800',
  },
  searchDropdownEmpty: {
    color: '#777777',
    fontSize: sp(16),
    paddingHorizontal: ms(10),
    paddingVertical: ms(18),
  },
});

export default AMCDashboardScreen;