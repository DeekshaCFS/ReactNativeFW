// src/screens/admin/AMCDetailsScreen.tsx

import React, { useEffect, useState, useMemo } from 'react';
import {ms, sp, vs} from '../../utils/responsive';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getAmcReportDetails, getAmcDetailsForEdit, putAmcDetails, deleteAmc } from '../../api/amc/amcService';
import type { EditAMCDTOResultData, DeleteAMCResultData } from '../../api/amc/amc.types';
import { downloadAmcReport } from '../../api/report/reportService';
import type { AdminStackParamList } from '../../navigation/AdminStack';
import AddTaskModal, { type AddTaskInitialValues } from './AddTaskModal';

type AMCDetailsScreenProps = NativeStackScreenProps<AdminStackParamList, 'AMCDetails'>;

const THEME_PRIMARY = '#d30035';
const THEME_LIGHT_BG = '#F3F4F6';
const THEME_GRAY_TEXT = '#6B7280';
const THEME_BORDER = '#E5E7EB';
const SECTION_TITLE_COLOR = '#dc2626';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    backgroundColor: THEME_PRIMARY,
    paddingHorizontal: ms(16),
    paddingTop: ms(12),
    paddingBottom: ms(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: sp(18),
    fontWeight: '600',
    marginLeft: ms(12),
  },
  headerRight: {
    flexDirection: 'row',
    gap: ms(16),
  },
  headerIcon: {
    fontSize: sp(20),
    color: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: ms(80),
  },
  infoCard: {
    backgroundColor: '#E8EDF2',
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    marginHorizontal: 0,
    marginTop: 0,
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
    color: THEME_GRAY_TEXT,
    flex: 1,
    flexShrink: 1,
    textAlign: 'left',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingVertical: ms(4),
    paddingHorizontal: ms(12),
    borderRadius: ms(12),
    marginBottom: ms(16),
    marginTop: ms(12),
    marginHorizontal: ms(16),
  },
  statusText: {
    color: '#065F46',
    fontSize: sp(12),
    fontWeight: '600',
  },
  section: {
    marginHorizontal: ms(16),
    marginTop: ms(16),
    marginBottom: ms(12),
    paddingBottom: ms(12),
    borderBottomWidth: ms(1),
    borderBottomColor: THEME_BORDER,
  },
  sectionTitle: {
    fontSize: sp(13),
    fontWeight: '700',
    color: SECTION_TITLE_COLOR,
    marginBottom: ms(10),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: ms(6),
  },
  label: {
    fontSize: sp(13),
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
  toolbarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderBottomWidth: ms(1),
    borderBottomColor: THEME_BORDER,
    paddingVertical: ms(8),
    backgroundColor: '#FFFFFF',
  },
  toolbarButton: {
    alignItems: 'center',
    paddingVertical: ms(8),
    paddingHorizontal: ms(8),
    minWidth: ms(50),
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
    backgroundColor: THEME_PRIMARY,
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
    marginBottom: ms(12),
  },
  editLabel: {
    color: '#374151',
    fontSize: sp(12),
    fontWeight: '700',
    marginBottom: ms(6),
  },
  editInput: {
    borderColor: '#D1D5DB',
    borderRadius: ms(6),
    borderWidth: ms(1),
    color: '#111827',
    fontSize: sp(14),
    minHeight: ms(42),
    paddingHorizontal: ms(12),
    paddingVertical: ms(8),
  },
  editTextArea: {
    minHeight: ms(76),
    textAlignVertical: 'top',
  },
  editToggleRow: {
    marginBottom: ms(12),
  },
  editToggle: {
    borderColor: '#D1D5DB',
    borderRadius: ms(6),
    borderWidth: ms(1),
    flexDirection: 'row',
    height: ms(42),
    overflow: 'hidden',
  },
  editToggleOption: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  editToggleOptionActive: {
    backgroundColor: THEME_PRIMARY,
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
    borderRadius: ms(6),
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
});

interface AMCReportData {
  amcName?: string;
  contactNo?: string;
  status?: string;
  customerName?: string;
  customerNumber?: string;
  customerEmail?: string;
  address?: string;
  landmark?: string;
  productBrand?: string;
  productName?: string;
  serialNumber?: string;
  serviceAmount?: string;
  remainingAmount?: string;
  underWarranty?: string;
  activationDate?: string;
  contractDate?: string;
  expiryDate?: string;
  noOfServices?: number;
  serviceCompleted?: number;
  reminder?: string;
  occurrence?: string;
  note?: string;
  [key: string]: unknown;
}

type EditFormData = {
  amcName: string;
  customerName: string;
  customerNumber: string;
  customerEmail: string;
  address: string;
  landmark: string;
  productBrand: string;
  productName: string;
  serialNumber: string;
  underWarranty: boolean;
  activationDate: string;
  activationTime: string;
  contractDate: string;
  totalServices: string;
  expiryDate: string;
  note: string;
};

const AMCDetailsScreen: React.FC<AMCDetailsScreenProps> = ({ route, navigation }) => {
  const { amcItem, amcServiceDetailsId, amcsId, ownerId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amcData, setAmcData] = useState<AMCReportData | null>(null);
  
  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);
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
      console.log('[AMC Details] No ownerId provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[AMC Details] Fetching with params:', { ownerId, amcsId, amcServiceDetailsId });
      const response = await getAmcReportDetails({
        OwnerId: ownerId,
        AMCsId: amcsId,
        AMCServiceDetailsId: amcServiceDetailsId,
      });

      console.log('[AMC Details Full Response]', response);
      console.log('[AMC Details Response Type]', typeof response);
      console.log('[AMC Details Response Keys]', Object.keys(response || {}));
      console.log('[AMC Details Response JSON]', JSON.stringify(response, null, 2));

      const data = response.ResultData;

      if (data && typeof data === 'object') {
        setAmcData(data as unknown as AMCReportData);
        console.log('[AMC Data Loaded Successfully]', data);
      } else {
        console.log('[AMC Details] No valid data extracted from response');
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
      return date.toLocaleDateString('en-GB');
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
      'City',
    ]) || ''),
    productBrand: String(getFirstValue(data, ['ProductDetail.ProductBrand', 'ProductBrand']) || ''),
    productName: String(getFirstValue(data, ['ProductDetail.ProductName', 'ProductName']) || ''),
    serialNumber: String(getFirstValue(data, ['ProductDetail.ProductSerialNo', 'ProductSerialNo']) || ''),
    underWarranty: Boolean(getFirstValue(data, ['ProductDetail.UnderWarranty', 'UnderWarranty'])),
    activationDate: toDateInputValue(getFirstValue(data, ['ActivationDate'])),
    activationTime: String(getFirstValue(data, ['ActivationTime']) || ''),
    contractDate: toDateInputValue(getFirstValue(data, ['ContractDate'])),
    totalServices: String(getFirstValue(data, ['TotalServices']) || ''),
    expiryDate: toDateInputValue(getFirstValue(data, ['ExpiryDate'])),
    note: String(getFirstValue(data, ['AMCNotes', 'Note']) || ''),
  });

  const updateEditField = <K extends keyof EditFormData>(
    key: K,
    value: EditFormData[K],
  ) => {
    setEditFormData(current => (current ? { ...current, [key]: value } : current));
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
      setEditModalVisible(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load AMC edit data';
      Alert.alert('Error', message);
    } finally {
      setEditLoading(false);
    }
  };

  const saveAMCChanges = async () => {
    const sourceData = editSourceData || amcData;
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
      const reminderId = getNumberFromPaths(sourceRecord, [
        'AMCSetReminderId',
        'AMCSetReminderID',
        'AMCSetReminderModeId',
        'AMCSetReminderModeID',
        'AMCSetReminderTypeId',
        'AMCSetReminderTypeID',
        'ReminderId',
        'ReminderID',
      ]);
      const occurrenceId = getNumberFromPaths(sourceRecord, [
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
      ]);

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
        AMCAmount: toNumberValue(getFirstValue(sourceData, ['AMCAmount', 'AMCAmountValue'])),
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
            PinCode: String(locationDetail.PinCode || ''),
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
        ReceivedAmount: toNumberValue(getFirstValue(sourceData, ['ReceivedAmount', 'ReceivedAmt'])),
        ServiceOccuranceId: occurrenceId,
        TotalServices: parseInt(editFormData.totalServices, 10) || 0,
        UpdatedBy: toNumberValue(getFirstValue(sourceData, ['UpdatedBy'])),
        UserId: userId,
      };

      console.log('[AMC Update] Sending payload:', JSON.stringify(payload, null, 2));
      const response = await putAmcDetails(payload);
      console.log('[AMC Update Response]', response);

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
      console.log('[Details] No data source available');
      return null;
    }

    const data = dataSource as Record<string, unknown>;
    
    // Log available fields for debugging
    if (amcData) {
      console.log('[Details Fields Available (from API)]', Object.keys(data));
    }

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

    // Calculate remaining amount
    let remainingAmt = 'NA';
    const totalAmount = getNestedValue(data, 'AMCAmount');
    const receivedAmount = getNestedValue(data, 'ReceivedAmt');
    if (typeof totalAmount === 'number' && typeof receivedAmount === 'number') {
      const remaining = totalAmount - receivedAmount;
      remainingAmt = String(remaining);
    }

    const extractedDetails = {
      amcName: getValue(['AMCName', 'ProductDetail.ProductName']),
      contactNo: getValue(['ProductDetail.CustomerDetailInfoDto.MobileNumber', 'MobileNumber']),
      status: getStatusText(),
      customerName: getValue(['ProductDetail.CustomerDetailInfoDto.CustomerName', 'CustomerName']),
      customerNumber: getValue(['ProductDetail.CustomerDetailInfoDto.MobileNumber', 'MobileNumber']),
      customerEmail: getValue(['ProductDetail.CustomerDetailInfoDto.EmailId', 'EmailId']),
      address: getValue(['ProductDetail.CustomerLocationInfoDto.Address', 'ProductDetail.CustomerDetailInfoDto.Address']),
      landmark: getValue(['ProductDetail.CustomerLocationInfoDto.City', 'City']),
      productBrand: getValue(['ProductDetail.ProductBrand', 'BrandName']),
      productName: getValue(['ProductDetail.ProductName', 'ModelName']),
      serialNumber: getValue(['ProductDetail.ProductSerialNo', 'SerialNumber']),
      serviceAmount: getValue(['AMCAmount', 'ServiceAmount']),
      remainingAmount: remainingAmt,
      underWarranty: getValue(['ProductDetail.UnderWarranty', 'Warranty']),
      activationDate: formatDate(getNestedValue(data, 'ActivationDate')),
      contractDate: formatDate(getNestedValue(data, 'ContractDate')),
      expiryDate: formatDate(getNestedValue(data, 'ExpiryDate')),
      noOfServices: getValue(['TotalServices', 'ServiceCount']),
      serviceCompleted: getValue(['AMCServiceDetailDto', 'ServiceCompleted']),
      reminder: getValue(['AMCSetReminderType', 'ReminderMode']),
      occurrence: getValue(['ServiceOccuranceType', 'OccurrenceType']),
      note: getValue(['AMCNotes', 'Note']),
    };
    
    console.log('[Extracted Details]', extractedDetails);
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
    const phone = String(details?.contactNo || '').trim();
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
    Alert.alert('Delete AMC', 'Are you sure you want to delete this AMC?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: confirmDeleteAmc },
    ]);
  };

  const handleAddTaskPress = () => {
    const sourceRecord = getRawRecord();

    const amcTypeName = String(
      getFirstValue(sourceRecord, ['AMCTypeName']) ||
        getFirstValue((amcItem || {}) as Record<string, unknown>, ['AMCTypeName', 'amcTypeName']) ||
        '',
    ).trim();

    if (amcTypeName.toLowerCase() === 'expired') {
      Alert.alert('AMC Expired', 'AMC expired, can not add task');
      return;
    }

    const isUpcomingServiceActive = Boolean(getFirstValue(sourceRecord, ['IsUpcomingServiceActive']));
    const upcomingServiceDate = getFirstValue(sourceRecord, ['UpcomingAmcsServiceDate']);

    if (!isUpcomingServiceActive || !upcomingServiceDate) {
      Alert.alert('Add Task', 'Can not add task for the selected date');
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
    options?: { keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address'; multiline?: boolean },
  ) => (
    <View style={styles.editField}>
      <Text style={styles.editLabel}>{label}</Text>
      <TextInput
        style={[styles.editInput, options?.multiline ? styles.editTextArea : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor="#9CA3AF"
        keyboardType={options?.keyboardType || 'default'}
        multiline={options?.multiline}
      />
    </View>
  );

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
      {/* Toolbar Below Header */}
      <View style={styles.toolbarContainer}>
        <Pressable style={styles.toolbarButton} onPress={openEditModal} disabled={editLoading}>
          <Text style={styles.toolbarIcon}>✎</Text>
          <Text style={styles.toolbarButtonText}>{editLoading ? 'Loading' : 'Edit'}</Text>
        </Pressable>
        <Pressable style={styles.toolbarButton} onPress={handleWhatsAppPress}>
          <Text style={styles.toolbarIcon}>💬</Text>
          <Text style={styles.toolbarButtonText}>WhatsApp</Text>
        </Pressable>
        <Pressable style={styles.toolbarButton} onPress={handleCallPress}>
          <Text style={styles.toolbarIcon}>📞</Text>
          <Text style={styles.toolbarButtonText}>Call</Text>
        </Pressable>
        <Pressable style={styles.toolbarButton} onPress={handleDownloadPress} disabled={isDownloadingReport}>
          <Text style={styles.toolbarIcon}>⬇</Text>
          <Text style={styles.toolbarButtonText}>{isDownloadingReport ? 'Loading' : 'Download'}</Text>
        </Pressable>
        <Pressable style={styles.toolbarButton} onPress={handleAddTaskPress}>
          <Text style={styles.toolbarIcon}>➕</Text>
          <Text style={styles.toolbarButtonText}>Add</Text>
        </Pressable>
        <Pressable style={styles.toolbarButton} onPress={handleDeletePress} disabled={isDeletingAmc}>
          <Text style={styles.toolbarIcon}>🗑</Text>
          <Text style={styles.toolbarButtonText}>{isDeletingAmc ? 'Loading' : 'Delete'}</Text>
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
            <Text style={styles.infoValue}>{details.contactNo}</Text>
          </View>
        </View>

        {/* Status Badge */}
        {details.status && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{details.status}</Text>
          </View>
        )}

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
            <Text style={styles.value}>{details.status}</Text>
          </View>
        </View>

        {/* Services Details Section */}
        {details.note && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services Details: {details.note}</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.editModalRoot}>
          <View style={styles.editModalPanel}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Edit AMC</Text>
              <Pressable
                style={styles.editModalClose}
                onPress={() => setEditModalVisible(false)}
                disabled={editLoading}
              >
                <Text style={styles.editModalCloseText}>x</Text>
              </Pressable>
            </View>

            {editFormData ? (
              <ScrollView
                style={styles.editFormScroll}
                contentContainerStyle={styles.editFormContent}
                keyboardShouldPersistTaps="handled"
              >
                {renderEditInput('AMC Name', editFormData.amcName, value => updateEditField('amcName', value))}
                {renderEditInput('Customer Name', editFormData.customerName, value => updateEditField('customerName', value))}
                {renderEditInput('Customer Number', editFormData.customerNumber, value => updateEditField('customerNumber', value), { keyboardType: 'phone-pad' })}
                {renderEditInput('Customer Email', editFormData.customerEmail, value => updateEditField('customerEmail', value), { keyboardType: 'email-address' })}
                {renderEditInput('Address', editFormData.address, value => updateEditField('address', value), { multiline: true })}
                {renderEditInput('Landmark', editFormData.landmark, value => updateEditField('landmark', value))}
                {renderEditInput('Product Brand', editFormData.productBrand, value => updateEditField('productBrand', value))}
                {renderEditInput('Product Name', editFormData.productName, value => updateEditField('productName', value))}
                {renderEditInput('Serial Number', editFormData.serialNumber, value => updateEditField('serialNumber', value))}

                <View style={styles.editToggleRow}>
                  <Text style={styles.editLabel}>Under Warranty</Text>
                  <View style={styles.editToggle}>
                    <Pressable
                      style={[styles.editToggleOption, editFormData.underWarranty ? styles.editToggleOptionActive : null]}
                      onPress={() => updateEditField('underWarranty', true)}
                    >
                      <Text style={[styles.editToggleText, editFormData.underWarranty ? styles.editToggleTextActive : null]}>Yes</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.editToggleOption, !editFormData.underWarranty ? styles.editToggleOptionActive : null]}
                      onPress={() => updateEditField('underWarranty', false)}
                    >
                      <Text style={[styles.editToggleText, !editFormData.underWarranty ? styles.editToggleTextActive : null]}>No</Text>
                    </Pressable>
                  </View>
                </View>

                {renderEditInput('Activation Date (YYYY-MM-DD)', editFormData.activationDate, value => updateEditField('activationDate', value))}
                {renderEditInput('Activation Time', editFormData.activationTime, value => updateEditField('activationTime', value))}
                {renderEditInput('Contract Date (YYYY-MM-DD)', editFormData.contractDate, value => updateEditField('contractDate', value))}
                {renderEditInput('Expiry Date (YYYY-MM-DD)', editFormData.expiryDate, value => updateEditField('expiryDate', value))}
                {renderEditInput('Total Services', editFormData.totalServices, value => updateEditField('totalServices', value), { keyboardType: 'numeric' })}
                {renderEditInput('Notes', editFormData.note, value => updateEditField('note', value), { multiline: true })}

                <Pressable
                  style={[styles.editSaveButton, editLoading ? styles.editSaveButtonDisabled : null]}
                  onPress={saveAMCChanges}
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.editSaveButtonText}>Save</Text>
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