// src/screens/admin/AMCDetailsScreen.tsx

import React, { useEffect, useState, useMemo } from 'react';
import {ms, sp, vs} from '../../utils/responsive';
import {ensureSuccess} from '../../utils/apiResponse';
import {formatAmount, sanitizeDecimalInput} from '../../utils/decimal';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getAmcReportDetails, getAmcDetailsForEdit, putAmcDetails, deleteAmc, getAmcRenewalDetails, renewAmcDetails, getServiceOccurrenceList, getReminderModeList, getAmcUpcomingValidation } from '../../api/amc/amcService';
import SearchPickerModal, { type PickerOption } from '../../components/SearchPickerModal';
import { getResultData, normalizeLookupOption } from './AMCDashboardScreen';
import type { AMCDetailsResultData, EditAMCDTOResultData, DeleteAMCResultData } from '../../api/amc/amc.types';
import { getCurrentCountryCode, getCurrentCurrencySymbol } from '../../state/session';
import { downloadAmcReport } from '../../api/report/reportService';
import type { AdminStackParamList } from '../../navigation/AdminStack';
import AddTaskModal, { type AddTaskInitialValues } from './AddTaskModal';

type AMCDetailsScreenProps = NativeStackScreenProps<AdminStackParamList, 'AMCDetails'>;

const THEME_PRIMARY = '#d30035';
const THEME_GRAY_TEXT = '#525760';
const GRAY = '#404040';
const THEME_BORDER = '#E5E7EB';
const SECTION_TITLE_COLOR = '#dc2626';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#d9e1e9',
    paddingHorizontal: ms(16),
    paddingVertical: ms(8),
    marginHorizontal: 15,
    marginTop: 2,
    borderRadius: ms(8),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: ms(4),
  },
  infoLabel: {
    fontSize: sp(13),
    color: '#1F2937',
    fontWeight: '600',
    flexBasis: '42%',
    flexShrink: 0,
  },
  infoValue: {
    fontSize: sp(13),
    fontWeight: '400',
    color: THEME_GRAY_TEXT,
    flex: 1,
    flexShrink: 1,
    textAlign: 'left',
  },
  statusText: {
    fontSize: sp(14),
    fontWeight: '700',
    color: '#16A34A',
  },
  statusTextInactive: {
    color: THEME_GRAY_TEXT,
  },
  statusValueActive: {
    color: '#16A34A',
    fontWeight: '600',
  },
  section: {
    marginHorizontal: ms(18),
    marginTop: ms(12),
    marginBottom: ms(8),
    paddingBottom: ms(8),
  },
  sectionTitle: {
    fontSize: sp(15),
    fontWeight: '700',
    color: SECTION_TITLE_COLOR,
    marginBottom: ms(8),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: ms(5),
  },
  serviceBlock: {
    marginTop: ms(10),
  },
  serviceSubTitle: {
    fontSize: sp(13),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: ms(4),
  },
  label: {
    fontSize: sp(14),
    fontWeight: '600',
    color: '#1F2937',
    flexBasis: '42%',
    flexShrink: 0,
  },
  value: {
    fontSize: sp(13),
    color: THEME_GRAY_TEXT,
    flex: 1,
    flexShrink: 1,
    textAlign: 'left',
  },
  headerToolbar: {
    flexDirection: 'row',
    gap: ms(12),
  },
  headerToolbarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: ms(16),
    backgroundColor: '#FFFFFF',
  },
  toolbarContainer: {
    flexDirection: 'row',
    flexShrink: 1,
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButton: {
    alignItems: 'center',
    paddingVertical: ms(8),
    paddingHorizontal: ms(8),
    minWidth: ms(44),
  },
  toolbarIcon: {
    fontSize: sp(24),
    marginBottom: ms(2),
  },
  toolbarButtonText: {
    fontSize: sp(11),
    color: THEME_PRIMARY,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ms(16),
  },
  errorText: {
    fontSize: sp(14),
    color: THEME_PRIMARY,
    textAlign: 'center',
    marginBottom: ms(16),
  },
  retryButton: {
    backgroundColor: THEME_PRIMARY,
    paddingHorizontal: ms(24),
    paddingVertical: ms(10),
    borderRadius: ms(6),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: sp(14),
    fontWeight: '600',
  },
  editModalRoot: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  editModalPanel: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: ms(560),
    borderTopLeftRadius: ms(18),
    borderTopRightRadius: ms(18),
    maxHeight: '92%',
    overflow: 'hidden',
  },
  editModalHeader: {
    alignItems: 'center',
    backgroundColor: GRAY,
    flexDirection: 'row',
    minHeight: ms(56),
    paddingHorizontal: ms(16),
  },
  editModalTitle: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: sp(18),
    fontWeight: '700',
  },
  editModalClose: {
    alignItems: 'center',
    height: ms(36),
    justifyContent: 'center',
    width: ms(36),
  },
  editModalCloseText: {
    color: '#FFFFFF',
    fontSize: sp(22),
    fontWeight: '700',
  },
  editFormScroll: {
    backgroundColor: '#FFFFFF',
  },
  editFormContent: {
    padding: ms(16),
    paddingBottom: ms(24),
  },
  editField: {
    marginBottom: ms(10),
  },
  // Java (dialog_add_amc_new.xml) pairs the date/number fields two to a row
  // (Activation Date+Time, Contract Date+No. of Services, etc.) instead of
  // stacking every field full-width -- this halves the form's height.
  editRow: {
    flexDirection: 'row',
    gap: ms(12),
    marginBottom: ms(10),
  },
  editFieldHalf: {
    flex: 1,
  },
  editSelectValue: {
    fontSize: sp(14),
    color: '#111827',
  },
  editSelectPlaceholder: {
    fontSize: sp(14),
    color: '#9CA3AF',
  },
  editSelectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editSelectText: {
    flex: 1,
    marginRight: ms(8),
  },
  editLabel: {
    color: '#374151',
    fontSize: sp(12),
    fontWeight: '700',
    marginBottom: ms(6),
  },
  editInput: {
    borderColor: GRAY,
    borderRadius: ms(20),
    borderWidth: ms(1),
    color: '#111827',
    fontSize: sp(14),
    minHeight: ms(40),
    paddingHorizontal: ms(12),
    paddingVertical: ms(7),
  },
  editToggleRow: {
    flexDirection: 'row',
    marginBottom: ms(12),
    gap: ms(100),
  },
  editToggle: {
    borderColor: '#000',
    borderRadius: ms(20),
    borderWidth: ms(1),
    flexDirection: 'row',
    height: ms(30),
    width: ms(180),
    overflow: 'hidden',
  },
  editToggleOption: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  editToggleOptionActive: {
    backgroundColor: '#000',
  },
  editToggleText: {
    color: '#374151',
    fontSize: sp(14),
    fontWeight: '700',
  },
  editToggleTextActive: {
    color: '#FFFFFF',
  },
  editSaveButton: {
    alignItems: 'center',
    backgroundColor: THEME_PRIMARY,
    borderRadius: ms(25),
    height: ms(46),
    justifyContent: 'center',
    marginTop: ms(6),
  },
  editSaveButtonDisabled: {
    opacity: 0.7,
  },
  editSaveButtonText: {
    color: '#FFFFFF',
    fontSize: sp(15),
    fontWeight: '700',
  },
  editCancelButton: {
    alignItems: 'center',
    height: ms(44),
    justifyContent: 'center',
    marginTop: ms(4),
  },
  editCancelButtonText: {
    color: THEME_PRIMARY,
    fontSize: sp(15),
    fontWeight: '700',
  },
  editLoadingPanel: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: ms(180),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: ms(20),
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    padding: ms(16),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(12),
  },
  modalTitle: {
    fontSize: sp(16),
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCloseIcon: {
    fontSize: sp(18),
    color: THEME_GRAY_TEXT,
  },
  modalEmptyText: {
    textAlign: 'center',
    color: THEME_GRAY_TEXT,
    paddingVertical: ms(20),
  },
  historyRow: {
    borderBottomWidth: ms(1),
    borderBottomColor: THEME_BORDER,
    paddingVertical: ms(10),
  },
  historyRowLabel: {
    fontSize: sp(12),
    fontWeight: '700',
    color: THEME_PRIMARY,
    marginBottom: ms(2),
  },
  historyRowValue: {
    fontSize: sp(13),
    color: '#1F2937',
  },
  saveButton: {
    backgroundColor: THEME_PRIMARY,
    borderRadius: ms(24),
    height: ms(46),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ms(14),
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: sp(14),
  },
});

type EditFormData = {
  amcName: string;
  customerName: string;
  customerNumber: string;
  customerEmail: string;
  address: string;
  landmark: string;
  pinCode: string;
  productBrand: string;
  productName: string;
  serialNumber: string;
  underWarranty: boolean;
  activationDate: string;
  activationTime: string;
  contractDate: string;
  totalServices: string;
  amcAmount: string;
  receivedAmount: string;
  expiryDate: string;
  note: string;
  occurrenceId: number;
  reminderId: number;
};

const OCCURRENCE_ID_PATHS = [
  'ServiceOccuranceId',
  'ServiceOccuranceID',
  'ServiceOccurrenceId',
  'ServiceOccurrenceID',
  'AMCServiceOccuranceId',
  'AMCServiceOccuranceID',
  'AMCServiceOccuranceTypeId',
  'AMCServiceOccuranceTypeID',
  'ServiceOccuranceTypeId',
  'ServiceOccuranceTypeID',
];
const REMINDER_ID_PATHS = [
  'AMCSetReminderId',
  'AMCSetReminderID',
  'AMCSetReminderModeId',
  'AMCSetReminderModeID',
  'AMCSetReminderTypeId',
  'AMCSetReminderTypeID',
  'ReminderId',
  'ReminderID',
];
// Util/TaskStatus.java codes -> Constant.TaskCategories names (ServiceListAdapter).
const SERVICE_STATUS_LABELS: Record<number, string> = {1: 'Completed', 2: 'Rejected', 3: 'Ongoing', 4: 'InActive'};
const SERVICE_COUNT_OPTIONS: PickerOption[] = Array.from({length: 20}, (_, i) => ({id: i + 1, label: String(i + 1)}));

const AMCDetailsScreen: React.FC<AMCDetailsScreenProps> = ({ route, navigation }) => {
  const { amcItem, amcServiceDetailsId, amcsId, ownerId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amcData, setAmcData] = useState<AMCDetailsResultData | null>(null);
  
  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  // History (Java: amcHistoryDialog, fed by GetAMCRenewalDetails) and Renew
  // (Java: AMCDialog with fromWhere="Renewal", posts AddAMCRenewal).
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyRows, setHistoryRows] = useState<Record<string, unknown>[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [renewModalVisible, setRenewModalVisible] = useState(false);
  const [renewActivationDate, setRenewActivationDate] = useState('');
  const [renewContractDate, setRenewContractDate] = useState('');
  const [renewExpiryDate, setRenewExpiryDate] = useState('');
  const [isRenewing, setIsRenewing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);
  const [occurrenceOptions, setOccurrenceOptions] = useState<PickerOption[]>([]);
  const [reminderOptions, setReminderOptions] = useState<PickerOption[]>([]);
  const [editPicker, setEditPicker] = useState<'services' | 'occurrence' | 'reminder' | null>(null);
  const [editSourceData, setEditSourceData] = useState<Record<string, unknown> | null>(null);

  // Toolbar action state (Call / WhatsApp / Download / Add task / Delete)
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [isDeletingAmc, setIsDeletingAmc] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [addTaskInitialValues, setAddTaskInitialValues] = useState<AddTaskInitialValues | null>(null);

  useEffect(() => {
    fetchAMCDetails();
  }, [amcServiceDetailsId, amcsId, ownerId]);

  const fetchAMCDetails = async () => {
    if (!ownerId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getAmcReportDetails({
        OwnerId: ownerId,
        AMCsId: amcsId,
        AMCServiceDetailsId: amcServiceDetailsId,
      });

      const data = response.ResultData;

      if (data && typeof data === 'object') {
        setAmcData(data);
      } else {
        setError('No data received from server');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load AMC details';
      setError(message);
      console.warn('[AMC Details Error]', err);
    } finally {
      setLoading(false);
    }
  };

  const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
    return path.split('.').reduce((current: any, part) => current?.[part], obj);
  };

  const getFirstValue = (obj: Record<string, unknown>, paths: string[]): unknown => {
    for (const path of paths) {
      const value = getNestedValue(obj, path);
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        return value;
      }
    }
    return undefined;
  };

  const formatDate = (rawDate: unknown): string => {
    if (!rawDate) return 'NA';
    const dateStr = String(rawDate);
    try {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return dateStr;
      // en-GB gives DD/MM/YYYY; the rest of the app (EmployeeManagementScreen,
      // profile screens, etc.) normalizes this to DD-MM-YYYY, so match that.
      return date.toLocaleDateString('en-GB').replace(/\//g, '-');
    } catch {
      return dateStr;
    }
  };

  const toDateInputValue = (rawDate: unknown): string => {
    if (!rawDate) return '';
    const dateText = String(rawDate);
    if (/^\d{4}-\d{2}-\d{2}/.test(dateText)) {
      return dateText.slice(0, 10);
    }

    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toApiDateValue = (dateText: string, fallback: unknown): string => {
    const trimmedDate = dateText.trim();
    const normalizedDate = trimmedDate
      ? toDateInputValue(trimmedDate) || trimmedDate.slice(0, 10)
      : toDateInputValue(fallback);
    if (!normalizedDate) {
      return new Date().toISOString();
    }

    return `${normalizedDate}T00:00:00`;
  };

  const toNumberValue = (value: unknown, fallback = 0): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ?parsed  : fallback;
  };

  const toRecord = (value: unknown): Record<string, unknown> => {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  };

  const toEditableText = (value: string): string => {
    const trimmed = value.trim();
    return trimmed.toUpperCase() === 'NA' ? '' : trimmed;
  };

  const getNumberFromPaths = (
    obj: Record<string, unknown>,
    paths: string[],
    fallback = 0,
  ): number => toNumberValue(getFirstValue(obj, paths), fallback);

  const buildEditFormData = (data: Record<string, unknown>): EditFormData => ({
    amcName: String(getFirstValue(data, ['AMCName', 'amcName']) || ''),
    customerName: String(getFirstValue(data, [
      'ProductDetail.CustomerDetail.CustomerName',
      'ProductDetail.CustomerDetailInfoDto.CustomerName',
      'CustomerName',
    ]) || ''),
    customerNumber: String(getFirstValue(data, [
      'ProductDetail.CustomerDetail.MobileNumber',
      'ProductDetail.CustomerDetailInfoDto.MobileNumber',
      'MobileNumber',
    ]) || ''),
    customerEmail: String(getFirstValue(data, [
      'ProductDetail.CustomerDetail.EmailId',
      'ProductDetail.CustomerDetailInfoDto.EmailId',
      'EmailId',
    ]) || ''),
    address: String(getFirstValue(data, [
      'ProductDetail.Location.Address',
      'ProductDetail.CustomerLocationInfoDto.Address',
      'Address',
    ]) || ''),
    landmark: String(getFirstValue(data, [
      'ProductDetail.Location.Name',
      'ProductDetail.Location.Description',
      'ProductDetail.CustomerLocationInfoDto.City',
      'ProductDetail.CustomerLocationInfoDto.Description',
      'landmark',
    ]) || ''),
    pinCode: String(getFirstValue(data, [
      'ProductDetail.Location.PinCode',
      'ProductDetail.CustomerLocationInfoDto.PinCode',
      'PinCode',
    ]) || ''),
    productBrand: String(getFirstValue(data, ['ProductDetail.ProductBrand', 'ProductBrand']) || ''),
    productName: String(getFirstValue(data, ['ProductDetail.ProductName', 'ProductName']) || ''),
    serialNumber: String(getFirstValue(data, ['ProductDetail.ProductSerialNo', 'ProductSerialNo']) || ''),
    underWarranty: Boolean(getFirstValue(data, ['ProductDetail.UnderWarranty', 'UnderWarranty'])),
    activationDate: toDateInputValue(getFirstValue(data, ['ActivationDate'])),
    activationTime: String(getFirstValue(data, ['ActivationTime']) || ''),
    contractDate: toDateInputValue(getFirstValue(data, ['ContractDate'])),
    totalServices: String(getFirstValue(data, ['TotalServices']) || ''),
    amcAmount: String(getFirstValue(data, ['AMCAmount', 'AMCAmountValue']) ?? ''),
    receivedAmount: String(getFirstValue(data, ['ReceivedAmount', 'ReceivedAmt']) ?? ''),
    expiryDate: toDateInputValue(getFirstValue(data, ['ExpiryDate'])),
    note: String(getFirstValue(data, ['AMCNotes', 'Note']) || ''),
    occurrenceId: getNumberFromPaths(data, OCCURRENCE_ID_PATHS),
    reminderId: getNumberFromPaths(data, REMINDER_ID_PATHS),
  });

  const updateEditField = <K extends keyof EditFormData>(
    key: K,
    value: EditFormData[K],
  ) => {
    setEditFormData(current => (current ? { ...current, [key]: value } : current));
  };

  const submitRenewal = async () => {
    if (!renewActivationDate.trim() || !renewContractDate.trim()) {
      Alert.alert('Renew AMC', 'Please enter activation and contract dates.');
      return;
    }
    const sourceData = (amcData || amcItem || {}) as Record<string, unknown>;
    const productDetail = toRecord(getFirstValue(sourceData, ['ProductDetail', 'productDetail']));
    const customerDetail = toRecord(getFirstValue(productDetail, ['CustomerDetail', 'customerDetail']));
    const locationDetail = toRecord(getFirstValue(productDetail, ['Location', 'location']));
    setIsRenewing(true);
    try {
      ensureSuccess(
        await renewAmcDetails({
          AMCsId: 0,
          RenewalAMCsId: amcsId,
          RootAMCsId: amcsId,
          AMCName: String(getFirstValue(sourceData, ['AMCName']) ?? ''),
          AMCAmount: toNumberValue(getFirstValue(sourceData, ['AMCAmount'])),
          ReceivedAmount: 0,
          AMCNotes: String(getFirstValue(sourceData, ['AMCNotes']) ?? ''),
          AMCSetReminderId: toNumberValue(getFirstValue(sourceData, ['AMCSetReminderId'])),
          ServiceOccuranceId: toNumberValue(getFirstValue(sourceData, ['ServiceOccuranceId'])),
          TotalServices: toNumberValue(getFirstValue(sourceData, ['TotalServices'])),
          ActivationDate: renewActivationDate.trim(),
          ContractDate: renewContractDate.trim(),
          ExpiryDate: renewExpiryDate.trim() || undefined,
          CreatedBy: ownerId,
          UpdatedBy: ownerId,
          UserId: ownerId,
          CustomerId: toNumberValue(getFirstValue(productDetail, ['CustomerId'])),
          CustomerDetailsid: toNumberValue(getFirstValue(customerDetail, ['CustomerDetailsid'])),
          CustomerName: String(getFirstValue(customerDetail, ['CustomerName']) ?? ''),
          MobileNumber: String(getFirstValue(customerDetail, ['MobileNumber']) ?? ''),
          EmailId: String(getFirstValue(customerDetail, ['EmailId']) ?? ''),
          Address: String(getFirstValue(locationDetail, ['Address']) ?? ''),
          PinCode: String(getFirstValue(locationDetail, ['PinCode']) ?? ''),
          LocationId: toNumberValue(getFirstValue(locationDetail, ['Id'])),
          ProductDetailsId: toNumberValue(getFirstValue(productDetail, ['ProductDetailsId'])),
          ProductName: String(getFirstValue(productDetail, ['ProductName']) ?? ''),
          ProductBrand: String(getFirstValue(productDetail, ['ProductBrand']) ?? ''),
          ProductSerialNo: String(getFirstValue(productDetail, ['ProductSerialNo']) ?? ''),
          UnderWarranty: Boolean(getFirstValue(productDetail, ['UnderWarranty'])),
        }),
      );
      Alert.alert('Renew AMC', 'AMC renewed successfully.');
      setRenewModalVisible(false);
      fetchAMCDetails();
    } catch (error) {
      Alert.alert('Renew AMC', error instanceof Error ? error.message : 'Unable to renew AMC.');
    } finally {
      setIsRenewing(false);
    }
  };

  // Occurrence / Reminder options for the edit form -- same lists the Add AMC
  // form uses (AMCDialog.editAMC receives serviceOccTypeList + reminderModeList).
  const loadEditLookups = async () => {
    if (occurrenceOptions.length && reminderOptions.length) {
      return;
    }
    try {
      const [occurrenceResponse, reminderResponse] = await Promise.all([
        getServiceOccurrenceList(),
        getReminderModeList(),
      ]);
      const toOptions = (rows: unknown[]) =>
        rows
          .map((row, index) => normalizeLookupOption(row as never, index))
          .filter((o): o is {id: number; name: string} => Boolean(o))
          .map(o => ({id: o.id, label: o.name}));
      setOccurrenceOptions(toOptions(getResultData(occurrenceResponse)));
      setReminderOptions(toOptions(getResultData(reminderResponse)));
    } catch (err) {
      console.warn('[AMC Edit Lookup Error]', err);
    }
  };

  const openEditModal = async () => {
    const editAmcsId = toNumberValue(amcsId || getFirstValue((amcData || amcItem || {}) as Record<string, unknown>, ['AMCsId', 'amCsId', 'Id', 'id']));
    const userId = ownerId || toNumberValue(getFirstValue((amcData || amcItem || {}) as Record<string, unknown>, ['UserId', 'userId']));

    if (!editAmcsId || !userId) {
      Alert.alert('Error', 'No data available for editing');
      return;
    }

    setEditLoading(true);
    try {
      const response = await getAmcDetailsForEdit({
        UserId: userId,
        AMCsId: editAmcsId,
      });
      const fetchedData = response.ResultData ? (response.ResultData as unknown as Record<string, unknown>) : (amcData as Record<string, unknown>);

      if (!fetchedData) {
        Alert.alert('Error', 'No edit data received from server');
        return;
      }

      setEditSourceData(fetchedData);
      setEditFormData(buildEditFormData(fetchedData));
      loadEditLookups();
      setEditModalVisible(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load AMC edit data';
      Alert.alert('Error', message);
    } finally {
      setEditLoading(false);
    }
  };

  const saveAMCChanges = async () => {
    const sourceData = (editSourceData || amcData) as Record<string, unknown> | null;
    if (!editFormData || !sourceData) return;

    setEditLoading(true);
    try {
      const sourceRecord = sourceData as Record<string, unknown>;
      const productDetail = toRecord(getNestedValue(sourceRecord, 'ProductDetail'));
      const customerDetail = toRecord(
        getFirstValue(sourceData, [
          'ProductDetail.CustomerDetail',
          'ProductDetail.CustomerDetailInfoDto',
          'CustomerDetail',
          'CustomerDetailInfoDto',
        ]),
      );
      const locationDetail = toRecord(
        getFirstValue(sourceData, [
          'ProductDetail.Location',
          'ProductDetail.CustomerLocationInfoDto',
          'Location',
          'CustomerLocationInfoDto',
        ]),
      );
      const userId = ownerId || toNumberValue(getFirstValue(sourceData, ['UserId', 'ProductDetail.UserId']));
      const amcId = getNumberFromPaths(sourceRecord, ['AMCsId', 'amCsId', 'Id', 'id'], toNumberValue(amcsId));
      const customerId = getNumberFromPaths(sourceRecord, [
        'ProductDetail.CustomerId',
        'ProductDetail.CustomerDetail.CustomerDetailsid',
        'ProductDetail.CustomerDetail.CustomerDetailsId',
        'ProductDetail.CustomerDetailInfoDto.CustomerDetailsid',
        'ProductDetail.CustomerDetailInfoDto.CustomerDetailsId',
      ]);
      const customerLocationId = getNumberFromPaths(sourceRecord, [
        'ProductDetail.CustomerLocationId',
        'ProductDetail.Location.Id',
        'ProductDetail.Location.LocationId',
        'ProductDetail.CustomerLocationInfoDto.Id',
        'ProductDetail.CustomerLocationInfoDto.LocationId',
        'ProductDetail.CustomerLocationInfoDto.CustomerLocationId',
      ]);
      const productId = getNumberFromPaths(sourceRecord, [
        'ProductId',
        'ProductDetail.ProductDetailsId',
        'ProductDetail.ProductId',
      ]);
      const reminderId = editFormData.reminderId || getNumberFromPaths(sourceRecord, REMINDER_ID_PATHS);
      const occurrenceId = editFormData.occurrenceId || getNumberFromPaths(sourceRecord, OCCURRENCE_ID_PATHS);

      if (toNumberValue(editFormData.receivedAmount) > toNumberValue(editFormData.amcAmount)) {
        Alert.alert('Error', 'Received amount cannot be greater than service amount !');
        return;
      }

      const missingFields = [
        !amcId ? 'AMC id' : '',
        !customerId ? 'Customer id' : '',
        !customerLocationId ? 'Customer location id' : '',
        !productId ? 'Product id' : '',
        !reminderId ? 'Reminder id' : '',
        !occurrenceId ? 'Occurrence id' : '',
      ].filter(Boolean);

      if (missingFields.length > 0) {
        Alert.alert('Error', `Unable to update AMC. Missing ${missingFields.join(', ')}.`);
        return;
      }

      const payload: Partial<EditAMCDTOResultData> = {
        AMCAmount: toNumberValue(editFormData.amcAmount),
        AMCName: toEditableText(editFormData.amcName),
        AMCNotes: toEditableText(editFormData.note),
        AMCSetReminderId: reminderId,
        AMCsId: amcId,
        ActivationDate: toApiDateValue(editFormData.activationDate, getFirstValue(sourceData, ['ActivationDate'])),
        ActivationTime: editFormData.activationTime.trim() || String(getFirstValue(sourceData, ['ActivationTime']) || '00:00'),
        ContractDate: toApiDateValue(editFormData.contractDate, getFirstValue(sourceData, ['ContractDate'])),
        CreatedBy: toNumberValue(getFirstValue(sourceData, ['CreatedBy'])),
        CreatedDate: toApiDateValue(String(getFirstValue(sourceData, ['CreatedDate']) || ''), new Date().toISOString()),
        ExpiryDate: toApiDateValue(editFormData.expiryDate, getFirstValue(sourceData, ['ExpiryDate'])),
        ProductDetail: {
          CreatedBy: toNumberValue(productDetail.CreatedBy),
          CustomerId: customerId,
          CustomerLocationId: customerLocationId,
          CustomerDetail: {
            CreatedBy: toNumberValue(customerDetail.CreatedBy),
            CreatedDate: toApiDateValue(String(customerDetail.CreatedDate || getFirstValue(sourceData, ['CreatedDate']) || ''), new Date().toISOString()),
            CustomerDetailsid: customerId,
            CustomerName: toEditableText(editFormData.customerName),
            EmailId: toEditableText(editFormData.customerEmail),
            IsActive: true,
            LocationId: toNumberValue(customerDetail.LocationId),
            MobileNumber: toEditableText(editFormData.customerNumber),
            OwnerId: toNumberValue(customerDetail.OwnerId),
            UpdatedBy: toNumberValue(customerDetail.UpdatedBy),
            UserId: toNumberValue(customerDetail.UserId, userId),
          },
          Location: {
            Address: toEditableText(editFormData.address),
            CreatedBy: toNumberValue(locationDetail.CreatedBy),
            Description: toEditableText(String(locationDetail.Description || editFormData.landmark)),
            Id: customerLocationId,
            IsActive: true,
            Longitude: String(locationDetail.Longitude || ''),
            Name: '',
            PinCode: editFormData.pinCode.trim(),
            UpdatedBy: toNumberValue(locationDetail.UpdatedBy),
            latitude: String(locationDetail.latitude || locationDetail.Latitude || ''),
          },
          ProductBrand: toEditableText(editFormData.productBrand),
          ProductDetailsId: productId,
          ProductName: toEditableText(editFormData.productName),
          ProductSerialNo: toEditableText(editFormData.serialNumber),
          UnderWarranty: editFormData.underWarranty,
          UpdatedBy: toNumberValue(productDetail.UpdatedBy),
          UserId: toNumberValue(productDetail.UserId),
        },
        ProductId: productId,
        ReceivedAmount: toNumberValue(editFormData.receivedAmount),
        ServiceOccuranceId: occurrenceId,
        TotalServices: parseInt(editFormData.totalServices, 10) || 0,
        UpdatedBy: userId,
        UserId: userId,
      };

      ensureSuccess(await putAmcDetails(payload));

      Alert.alert('Success', 'AMC updated successfully');
      setEditModalVisible(false);
      setEditSourceData(null);
      // Refresh the details
      fetchAMCDetails();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update AMC';
      console.warn('[AMC Update Error]', err);
      Alert.alert('Error', message);
    } finally {
      setEditLoading(false);
    }
  };

  const details = useMemo(() => {
    // Prioritize amcData from API, fallback to amcItem from navigation
    const dataSource = amcData || amcItem;
    
    if (!dataSource) {
      return null;
    }

    const data = dataSource as Record<string, unknown>;

    // Helper to get nested values
    const getValue = (paths: string[]): string => {
      for (const path of paths) {
        const value = getNestedValue(data, path);
        if (value !== null && value !== undefined) {
          const strVal = String(value).trim();
          if (strVal && strVal !== 'null' && strVal !== 'undefined') {
            return strVal;
          }
        }
      }
      return 'NA';
    };

    const getBooleanLabel = (value: unknown): string => {
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      if (typeof value === 'number') {
        return value === 1 ? 'Yes' : 'No';
      }
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1') {
          return 'Yes';
        }
        if (normalized === 'false' || normalized === '0') {
          return 'No';
        }
      }
      return 'NA';
    };

    const getStatusText = (): string => {
      const status = getNestedValue(data, 'IsActive');
      if (typeof status === 'boolean') {
        return status ? 'Active' : 'Inactive';
      }
      if (typeof status === 'number') {
        return status === 1 ? 'Active' : 'Inactive';
      }
      if (typeof status === 'string') {
        const normalizedStatus = status.trim().toLowerCase();
        if (normalizedStatus === 'true' || normalizedStatus === '1') {
          return 'Active';
        }
        if (normalizedStatus === 'false' || normalizedStatus === '0') {
          return 'Inactive';
        }
        if (normalizedStatus) {
          return status.trim();
        }
      }
      return 'NA';
    };

    const serviceTasks = (Array.isArray(data.TaskDetails) ? data.TaskDetails : []) as Array<{
      TaskDate?: string;
      TaskTime?: string;
      TaskStatus?: number;
      TechnicianName?: string;
    }>;

    // Java (AMCDetailsFragment.setData): both "Contact No" and "Customer
    // Number" are the same CustomerDetailInfoDto.MobileNumber, DISPLAYED
    // prefixed with the session's country code ("+<code> <number>") -- same
    // split TaskDetailsScreen uses: the raw number for the `tel:` call
    // intent, the decorated one for display, and code-no-plus for WhatsApp.
    const countryCode = getCurrentCountryCode();
    const rawMobile = getValue(['ProductDetail.CustomerDetailInfoDto.MobileNumber', 'MobileNumber']);
    const hasMobile = rawMobile && rawMobile !== 'NA';
    const mobileDisplay =
      hasMobile && countryCode ? `+${countryCode} ${rawMobile}` : rawMobile;
    const mobileWhatsapp =
      hasMobile && countryCode ? `${countryCode}${rawMobile}` : rawMobile;

    // Java prefixes amounts with the session's currency symbol ("₹" for
    // Rs., else the raw symbol) -- see AMCDetailsFragment.setData().
    const currencySymbol = getCurrentCurrencySymbol();
    const amountPrefix = currencySymbol === 'Rs.' ? '₹' : currencySymbol;
    const formatCurrencyAmount = (value: string) =>
      value === 'NA' ? value : amountPrefix ? `${amountPrefix} ${value}` : value;

    // Calculate remaining amount
    let remainingAmt = 'NA';
    const totalAmount = getNestedValue(data, 'AMCAmount');
    const receivedAmount = getNestedValue(data, 'ReceivedAmt');
    if (typeof totalAmount === 'number' && typeof receivedAmount === 'number') {
      const remaining = totalAmount - receivedAmount;
      remainingAmt = formatCurrencyAmount(formatAmount(remaining));
    }
    const serviceAmountRaw = getValue(['AMCAmount', 'ServiceAmount']);
    const serviceAmount = formatCurrencyAmount(
      serviceAmountRaw === 'NA' ? serviceAmountRaw : formatAmount(serviceAmountRaw),
    );

    const extractedDetails = {
      amcName: getValue(['AMCName', 'ProductDetail.ProductName']),
      contactNo: rawMobile,
      contactNoDisplay: mobileDisplay,
      contactNoWhatsapp: mobileWhatsapp,
      status: getStatusText(),
      customerName: getValue(['ProductDetail.CustomerDetailInfoDto.CustomerName', 'CustomerName']),
      customerNumber: mobileDisplay,
      customerEmail: getValue(['ProductDetail.CustomerDetailInfoDto.EmailId', 'EmailId']),
      address: getValue(['ProductDetail.CustomerLocationInfoDto.Address', 'ProductDetail.CustomerDetailInfoDto.Address']),
      // Java: AMCDetailsFragment reads Landmark from
      // ProductDetail.CustomerLocationInfoDto.Description (not City/landmark,
      // which this endpoint doesn't return).
      landmark: getValue(['ProductDetail.CustomerLocationInfoDto.Description', 'landmark']),
      productBrand: getValue(['ProductDetail.ProductBrand', 'BrandName']),
      productName: getValue(['ProductDetail.ProductName', 'ModelName']),
      serialNumber: getValue(['ProductDetail.ProductSerialNo', 'SerialNumber']),
      serviceAmount,
      remainingAmount: remainingAmt,
      underWarranty: getBooleanLabel(getNestedValue(data, 'ProductDetail.UnderWarranty') ?? getNestedValue(data, 'Warranty')),
      activationDate: formatDate(getNestedValue(data, 'ActivationDate')),
      contractDate: formatDate(getNestedValue(data, 'ContractDate')),
      expiryDate: formatDate(getNestedValue(data, 'ExpiryDate')),
      noOfServices: getValue(['TotalServices', 'ServiceCount']),
      // Java (AMCDetailsFragment.setTaskDetails) counts TaskDetails with TaskStatus == COMPLETED (1).
      serviceCompleted: serviceTasks.length
        ? String(serviceTasks.filter(t => Number(t.TaskStatus) === 1).length)
        : getValue(['AMCServiceDetailDto', 'ServiceCompleted']),
      reminder: getValue(['AMCSetReminderType', 'ReminderMode']),
      occurrence: getValue(['ServiceOccuranceType', 'OccurrenceType']),
      note: getValue(['AMCNotes', 'Note']),
      serviceTasks,
    };

    return extractedDetails;
  }, [amcData, amcItem]);

  // ---- Toolbar actions (migrated from AMCDetailsFragment.java) ----

  const getRawRecord = (): Record<string, unknown> =>
    (amcData || amcItem || {}) as Record<string, unknown>;

  const getResolvedAmcId = (): number =>
    toNumberValue(amcsId || getFirstValue(getRawRecord(), ['AMCsId', 'amCsId', 'Id', 'id']));

  const getResolvedUserId = (): number =>
    toNumberValue(ownerId || getFirstValue(getRawRecord(), ['UserId', 'userId']));

  const handleCallPress = () => {
    const phone = String(details?.contactNo || '').trim();
    if (!phone || phone.toUpperCase() === 'NA') {
      Alert.alert('Call', 'Contact number is not available');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call', 'Unable to open the dialer');
    });
  };

  const handleWhatsAppPress = () => {
    const phone = String(details?.contactNoWhatsapp || '').trim();
    if (!phone || phone.toUpperCase() === 'NA') {
      Alert.alert('WhatsApp', 'Contact number is not available');
      return;
    }
    const digits = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${digits}`).catch(() => {
      Alert.alert('WhatsApp', 'Unable to open WhatsApp');
    });
  };

  const handleDownloadPress = async () => {
    const downloadAmcId = getResolvedAmcId();
    const userId = getResolvedUserId();

    if (!downloadAmcId) {
      Alert.alert('Download', 'AMC report is not available');
      return;
    }

    setIsDownloadingReport(true);
    try {
      const response = await downloadAmcReport({ AMCsId: downloadAmcId, UserId: userId });
      if (response.Code === '200' && response.Message) {
        await Linking.openURL(response.Message);
      } else {
        Alert.alert('Download Failed', response.Message || 'Could not generate the AMC report.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not download the report.';
      Alert.alert('Error', message);
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const confirmDeleteAmc = async () => {
    const deleteAmcId = getResolvedAmcId();
    const userId = getResolvedUserId();

    if (!deleteAmcId) {
      Alert.alert('Delete AMC', 'AMC id is not available.');
      return;
    }

    setIsDeletingAmc(true);
    try {
      // The live endpoint (AMCs/DeleteAMCListByUserId) expects a JSON array of
      // {Id, UserId} entries, matching the Java call's List<DeleteAMC.ResultData>.
      const response = await deleteAmc(([{ Id: deleteAmcId, UserId: userId }] as unknown) as Partial<DeleteAMCResultData>);
      if (response.Code === '200') {
        Alert.alert('Deleted', response.Message || 'AMC deleted successfully.');
        navigation.goBack();
      } else {
        Alert.alert('Delete Failed', response.Message || 'Could not delete this AMC.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete this AMC.';
      Alert.alert('Error', message);
    } finally {
      setIsDeletingAmc(false);
    }
  };

  const handleDeletePress = () => {
    Alert.alert('Delete AMC', 'Do you want to delete this AMC? It wil delete all AMC history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: confirmDeleteAmc },
    ]);
  };

  // Java (AMCDetailsFragment add-task icon) replaced its local expired /
  // upcoming-date checks with the server's AMCs/GetUpcommingValidationFromAmcId:
  // only "allow to task assing" opens Add Task; any other message is shown.
  const handleAddTaskPress = async () => {
    const sourceRecord = getRawRecord();
    const validationAmcId = toNumberValue(
      amcsId || getFirstValue(sourceRecord, ['AMCsId', 'amCsId', 'Id', 'id']),
    );
    try {
      const validation = await getAmcUpcomingValidation({OwnerId: ownerId, AMCId: validationAmcId});
      const message = String(validation?.Message ?? '');
      if (validation?.Code !== '200' || message.toLowerCase() !== 'allow to task assing') {
        Alert.alert('Add Task', message || 'Can not add task at this moment');
        return;
      }
    } catch (err) {
      Alert.alert('Add Task', err instanceof Error ? err.message : 'Can not add task at this moment');
      return;
    }

    const customerId = getNumberFromPaths(sourceRecord, [
      'ProductDetail.CustomerId',
      'ProductDetail.CustomerDetailInfoDto.CustomerDetailsid',
      'ProductDetail.CustomerDetailInfoDto.CustomerDetailsId',
      'ProductDetail.CustomerDetail.CustomerDetailsid',
      'ProductDetail.CustomerDetail.CustomerDetailsId',
    ]);

    setAddTaskInitialValues({
      title: String(getFirstValue(sourceRecord, ['AMCName', 'ProductDetail.ProductName']) || details?.amcName || ''),
      address: String(details?.address || ''),
      state: '',
      city: String(details?.landmark || ''),
      pinCode: '',
      landmark: String(details?.landmark || 'NA'),
      customerName: String(details?.customerName || ''),
      customerNumber: String(details?.customerNumber || ''),
      taskTagId: 0,
      taskTagName: '',
      customerId,
      productBrand: String(details?.productBrand || ''),
      modelNumber: String(details?.serialNumber || ''),
      amcServiceDetailsId: toNumberValue(amcServiceDetailsId),
    });
    setIsAddTaskModalOpen(true);
  };

  const renderEditInput = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    options?: { keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'phone-pad' | 'email-address'; multiline?: boolean; half?: boolean },
  ) => (
    <View style={options?.half ? styles.editFieldHalf : styles.editField}>
      <Text style={styles.editLabel}>{label}</Text>
      <TextInput
        style={[styles.editInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor="#9CA3AF"
        keyboardType={options?.keyboardType || 'default'}
        multiline={options?.multiline}
      />
    </View>
  );

  const renderEditSelect = (label: string, value: string, onPress: () => void, half?: boolean) => (
    <View style={half ? styles.editFieldHalf : styles.editField}>
      <Text style={styles.editLabel}>{label}</Text>
      <Pressable style={[styles.editInput, styles.editSelectInput]} onPress={onPress}>
        <Text
          style={[value ? styles.editSelectValue : styles.editSelectPlaceholder, styles.editSelectText]}
          numberOfLines={1}
        >
          {value || label}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#6B7280" />
      </Pressable>
    </View>
  );

  const editPickerConfig =
    editPicker === 'services'
      ? {title: 'No. of Services', options: SERVICE_COUNT_OPTIONS}
      : editPicker === 'occurrence'
        ? {title: 'Occurrence', options: occurrenceOptions}
        : editPicker === 'reminder'
          ? {title: 'Reminder', options: reminderOptions}
          : null;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_PRIMARY} />
          <Text style={{ marginTop: vs(10), color: THEME_GRAY_TEXT }}>Loading AMC Details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchAMCDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!details) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No AMC data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Status + toolbar, one row (matches Java: "Active" label and the
          action icons share the bar directly under the header). */}
      <View style={styles.toolbarRow}>
        {details.status ? (
          <Text
            style={[
              styles.statusText,
              details.status.toLowerCase() !== 'active' ? styles.statusTextInactive : null,
            ]}
          >
            {details.status}
          </Text>
        ) : <View />}
          <Pressable style={styles.toolbarButton} onPress={openEditModal} disabled={editLoading}>
            <Ionicons name="create-outline" size={24} color={THEME_PRIMARY} />
          </Pressable>
          <Pressable style={styles.toolbarButton} onPress={handleWhatsAppPress}>
            <Ionicons name="logo-whatsapp" size={24} color={THEME_PRIMARY} />
          </Pressable>
          <Pressable style={styles.toolbarButton} onPress={handleCallPress}>
            <Ionicons name="call-outline" size={24} color={THEME_PRIMARY} />
          </Pressable>
          <Pressable style={styles.toolbarButton} onPress={handleDownloadPress} disabled={isDownloadingReport}>
            <Ionicons name="download-outline" size={24} color={THEME_PRIMARY} />
          </Pressable>
          <Pressable style={styles.toolbarButton} onPress={handleAddTaskPress}>
            <Ionicons name="add" size={24} color={THEME_PRIMARY} />
          </Pressable>
          <Pressable style={styles.toolbarButton} onPress={handleDeletePress} disabled={isDeletingAmc}>
            <Ionicons name="trash-outline" size={24} color={THEME_PRIMARY} />
          </Pressable>
      </View>

      <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: vs(20) }}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>AMC Name</Text>
            <Text style={styles.infoValue}>{details.amcName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contact No</Text>
            <Text style={styles.infoValue}>{details.contactNoDisplay}</Text>
          </View>
        </View>

        {/* Customer Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name</Text>
            <Text style={styles.value}>{details.customerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Number</Text>
            <Text style={styles.value}>{details.customerNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Email</Text>
            <Text style={styles.value}>{details.customerEmail}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>{details.address}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Landmark</Text>
            <Text style={styles.value}>{details.landmark}</Text>
          </View>
        </View>

        {/* Product Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Product Brand</Text>
            <Text style={styles.value}>{details.productBrand}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Product Name</Text>
            <Text style={styles.value}>{details.productName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Serial Number</Text>
            <Text style={styles.value}>{details.serialNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Service Amount</Text>
            <Text style={styles.value}>{details.serviceAmount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Remaining Amount</Text>
            <Text style={styles.value}>{details.remainingAmount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Under Warranty</Text>
            <Text style={styles.value}>{details.underWarranty}</Text>
          </View>
        </View>

        {/* AMC Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AMC Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Activation Date</Text>
            <Text style={styles.value}>{details.activationDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contract Date</Text>
            <Text style={styles.value}>{details.contractDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Expiry Date</Text>
            <Text style={styles.value}>{details.expiryDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>No. of Services</Text>
            <Text style={styles.value}>{details.noOfServices}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Service Completed</Text>
            <Text style={styles.value}>{details.serviceCompleted}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reminder</Text>
            <Text style={styles.value}>{details.reminder}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Occurrence</Text>
            <Text style={styles.value}>{details.occurrence}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text
              style={[
                styles.value,
                details.status.toLowerCase() === 'active' ? styles.statusValueActive : null,
              ]}
            >
              {details.status}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Note</Text>
            <Text style={styles.value}>{details.note}</Text>
          </View>
        </View>

        {/* Services Details: each scheduled AMC service gets its own
            sub-heading with Fieldworker Name/Date/Time/Status rows
            (Java ServiceListAdapter -- item_service_details.xml). */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {details.serviceTasks.length ? 'Services Details' : 'Services Details : NA'}
          </Text>
          {details.serviceTasks.map((task, index) => (
            <View key={index} style={styles.serviceBlock}>
              <Text style={styles.serviceSubTitle}>{`Services ${index + 1}`}</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Fieldworker Name</Text>
                <Text style={styles.value}>{task.TechnicianName || 'NA'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{String(task.TaskDate ?? '').split('T')[0] || 'NA'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Time</Text>
                <Text style={styles.value}>{task.TaskTime || 'NA'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Status</Text>
                <Text style={styles.value}>{SERVICE_STATUS_LABELS[Number(task.TaskStatus)] ?? 'NA'}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={historyVisible} animationType="fade" transparent onRequestClose={() => setHistoryVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>AMC History</Text>
              <Pressable onPress={() => setHistoryVisible(false)} hitSlop={10}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </Pressable>
            </View>
            {isHistoryLoading ? (
              <ActivityIndicator color={THEME_PRIMARY} style={{marginVertical: vs(24)}} />
            ) : historyRows.length === 0 ? (
              <Text style={styles.modalEmptyText}>No renewal history found.</Text>
            ) : (
              <ScrollView style={{maxHeight: vs(360)}}>
                {historyRows.map((row, index) => (
                  <View key={index} style={styles.historyRow}>
                    <Text style={styles.historyRowLabel}>Sr.No {index + 1}</Text>
                    <Text style={styles.historyRowValue}>
                      {String(row.ActivationDate ?? row.activationDate ?? '-')}
                    </Text>
                    <Text style={styles.historyRowValue}>
                      Rs.Amount {formatAmount(row.AMCAmount ?? row.amcAmount)}
                    </Text>
                    <Text style={styles.historyRowValue}>
                      Rs.Received {formatAmount(row.ReceivedAmount ?? row.receivedAmount)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={renewModalVisible} animationType="slide" transparent onRequestClose={() => setRenewModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Renew AMC</Text>
              <Pressable onPress={() => setRenewModalVisible(false)} hitSlop={10}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.label}>Activation Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.editInput}
              value={renewActivationDate}
              onChangeText={setRenewActivationDate}
              placeholder="YYYY-MM-DD"
            />
            <Text style={styles.label}>Contract Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.editInput}
              value={renewContractDate}
              onChangeText={setRenewContractDate}
              placeholder="YYYY-MM-DD"
            />
            <Text style={styles.label}>Expiry Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.editInput}
              value={renewExpiryDate}
              onChangeText={setRenewExpiryDate}
              placeholder="YYYY-MM-DD"
            />
            <Pressable style={styles.saveButton} onPress={submitRenewal} disabled={isRenewing}>
              <Text style={styles.saveButtonText}>{isRenewing ? 'RENEWING...' : 'RENEW'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.editModalRoot}>
          <View style={styles.editModalPanel}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Update AMC</Text>
              <Pressable
                style={styles.editModalClose}
                onPress={() => setEditModalVisible(false)}
                disabled={editLoading}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            {editFormData ? (
              <ScrollView
                style={styles.editFormScroll}
                contentContainerStyle={styles.editFormContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Same field order as dialog_add_amc_new.xml (AMCDialog.editAMC). */}
                {renderEditInput('AMC Name *', editFormData.amcName, value => updateEditField('amcName', value))}
                {renderEditInput('Customer Name *', editFormData.customerName, value => updateEditField('customerName', value))}
                {renderEditInput('Customer Number *', editFormData.customerNumber, value => updateEditField('customerNumber', value), { keyboardType: 'phone-pad' })}
                {renderEditInput('Email ID', editFormData.customerEmail, value => updateEditField('customerEmail', value), { keyboardType: 'email-address' })}
                {renderEditInput('Address *', editFormData.address, value => updateEditField('address', value), { multiline: true })}
                {renderEditInput('Landmark *', editFormData.landmark, value => updateEditField('landmark', value))}
                {renderEditInput('Brand Name *', editFormData.productBrand, value => updateEditField('productBrand', value))}
                {renderEditInput('Model Name *', editFormData.productName, value => updateEditField('productName', value))}
                {renderEditInput('Serial No. *', editFormData.serialNumber, value => updateEditField('serialNumber', value))}

                <View style={styles.editToggleRow}>
                  <Text style={styles.editLabel}>Under Warranty</Text>
                  <View style={styles.editToggle}>
                    <Pressable
                      style={[styles.editToggleOption, !editFormData.underWarranty ? styles.editToggleOptionActive : null]}
                      onPress={() => updateEditField('underWarranty', false)}
                    >
                      <Text style={[styles.editToggleText, !editFormData.underWarranty ? styles.editToggleTextActive : null]}>NO</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.editToggleOption, editFormData.underWarranty ? styles.editToggleOptionActive : null]}
                      onPress={() => updateEditField('underWarranty', true)}
                    >
                      <Text style={[styles.editToggleText, editFormData.underWarranty ? styles.editToggleTextActive : null]}>Yes</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.editRow}>
                  {renderEditInput('Activation Date *', editFormData.activationDate, value => updateEditField('activationDate', value), { half: true })}
                  {renderEditInput('Time *', editFormData.activationTime, value => updateEditField('activationTime', value), { half: true })}
                </View>
                <View style={styles.editRow}>
                  {renderEditInput('Contract Date *', editFormData.contractDate, value => updateEditField('contractDate', value), { half: true })}
                  {renderEditSelect('No. of Services', editFormData.totalServices, () => setEditPicker('services'), true)}
                </View>
                <View style={styles.editRow}>
                  {renderEditSelect(
                    'Occurrence',
                    occurrenceOptions.find(o => o.id === editFormData.occurrenceId)?.label ?? '',
                    () => setEditPicker('occurrence'),
                    true,
                  )}
                  {editFormData.underWarranty
                    ? null
                    : renderEditInput('Service Amount *', editFormData.amcAmount, value => updateEditField('amcAmount', sanitizeDecimalInput(value)), { keyboardType: 'decimal-pad', half: true })}
                </View>
                <View style={styles.editRow}>
                  {renderEditInput('Expiry Date', editFormData.expiryDate, value => updateEditField('expiryDate', value), { half: true })}
                  {renderEditSelect(
                    'Reminder',
                    reminderOptions.find(o => o.id === editFormData.reminderId)?.label ?? '',
                    () => setEditPicker('reminder'),
                    true,
                  )}
                </View>
                {editFormData.underWarranty
                  ? null
                  : renderEditInput('Received Amount', editFormData.receivedAmount, value => updateEditField('receivedAmount', sanitizeDecimalInput(value)), { keyboardType: 'decimal-pad' })}
                {renderEditInput('Note', editFormData.note, value => updateEditField('note', value), { multiline: true })}

                <Pressable
                  style={[styles.editSaveButton, editLoading ? styles.editSaveButtonDisabled : null]}
                  onPress={saveAMCChanges}
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.editSaveButtonText}>UPDATE</Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.editCancelButton}
                  onPress={() => setEditModalVisible(false)}
                  disabled={editLoading}
                >
                  <Text style={styles.editCancelButtonText}>Cancel</Text>
                </Pressable>
              </ScrollView>
            ) : (
              <View style={styles.editLoadingPanel}>
                <ActivityIndicator color={THEME_PRIMARY} />
              </View>
            )}
            {editPickerConfig ? (
              <SearchPickerModal
                visible
                title={editPickerConfig.title}
                options={editPickerConfig.options}
                onClose={() => setEditPicker(null)}
                onSelect={option => {
                  if (editPicker === 'services') {
                    updateEditField('totalServices', String(option.id));
                  } else if (editPicker === 'occurrence') {
                    updateEditField('occurrenceId', option.id);
                  } else if (editPicker === 'reminder') {
                    updateEditField('reminderId', option.id);
                  }
                  setEditPicker(null);
                }}
              />
            ) : null}
          </View>
        </View>
      </Modal>

      <AddTaskModal
        visible={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        ownerId={ownerId || 0}
        initialValues={addTaskInitialValues}
      />
    </SafeAreaView>
  );
};

export default AMCDetailsScreen;