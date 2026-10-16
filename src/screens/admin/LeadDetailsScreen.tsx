import React, {useCallback, useEffect, useState} from 'react';
import {ms, sp} from '../../utils/responsive';
import {ensureSuccess} from '../../utils/apiResponse';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../../theme/theme';
import {InvoiceIcon, DeleteIcon, EnquiryIcon} from '../../components/FabIcons';
import SearchPickerModal from '../../components/SearchPickerModal';
import {OutlinedInput, OutlinedSelect} from '../../components/OutlinedInput';
import {getCurrentCountryCode, getCurrentUserId, getCurrentUserProfile} from '../../state/session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddTaskModal, {type AddTaskInitialValues} from './AddTaskModal';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from '../../components/AppModal';
import {
  type LeadListItem,
  type LeadDetailsResponse,
  type LeadStatusItem,
  type LeadStatusResponse,
} from './adminLegacyApiTypes';
import { getLeadstatusList, getLeadetailsByLeadId, updateLeadStatus as updateLeadStatusApi } from '../../api/lead/leadService';
import { showFailureMsg, showSuccessMsg, showToast } from '../../utils/toast';

import {useTranslation} from 'react-i18next';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
type LeadDetailsScreenProps = {
  /** Technician view: no Update Status / delete (Java LeadDetailsFragment). */
  technician?: boolean;
  userId: number;
  leadId: number;
  onBack: () => void;
  onUpdateStatus?: (lead: LeadListItem) => void;
  onEdit?: (lead: LeadListItem) => void;
  onDelete?: (lead: LeadListItem) => void;
};

const THEME_PRIMARY = COLORS.primary;

// Java LeadDetailsFragment: status text colour per lead status.
const getStatusColor = (status: string) => {
  const normalized = status.trim().toLowerCase();
  if (normalized.includes('inactive')) {
    return COLORS.lightGray;
  }
  if (normalized.includes('assign')) {
    return '#FBC02D'; // @color/task_ongoing_dark
  }
  if (normalized.includes('discussion')) {
    return '#03A9F4'; // @color/quantum_lightblue
  }
  if (normalized.includes('called')) {
    return COLORS.tagBlue;
  }
  if (normalized.includes('dormant')) {
    return '#D1395C'; // @color/dot_dark_screen1
  }
  if (normalized.includes('quote')) {
    return '#F98DA5'; // @color/dot_light_screen1
  }
  if (normalized.includes('convert')) {
    return COLORS.statusCompleted;
  }
  return THEME_PRIMARY;
};

// Java loads the photo with a person placeholder; show it when the path is missing or fails to load.
const PhotoSlot = ({url}: {url: string | null}) => {
  const [failed, setFailed] = useState(false);
  return (
    <View style={styles.photoSlot}>
      {url && !failed ? (
        <Image source={{uri: url}} style={styles.photoImage} resizeMode="contain" onError={() => setFailed(true)} />
      ) : (
        <Ionicons name="person-circle" size={ms(78)} color="#E1E3EE" />
      )}
    </View>
  );
};

const LeadDetailsScreen = ({
  technician = false,
  userId,
  leadId,
  onBack,
  onUpdateStatus,
  onEdit,
  onDelete,
}: LeadDetailsScreenProps) => {
  const {t} = useTranslation();
  const [lead, setLead] = useState<LeadListItem | null>(null);
  // Java: the terms icon opens Add Task prefilled from the lead (TaskDialogNew.addTaskFromLeadDetailsTech).
  const [addTaskValues, setAddTaskValues] = useState<AddTaskInitialValues | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [taskOwnerId, setTaskOwnerId] = useState(userId);
  useEffect(() => {
    if (technician) {
      AsyncStorage.getItem('owner_id').then(v => setTaskOwnerId(Number(v) || userId));
    }
  }, [technician, userId]);

  const getStringValue = (item: any, keys: string[]) => {
    for (const key of keys) {
      const value = item[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
      // LeadDetailsDTO.ResultData fields are Java Strings, but the API can send numeric
      // values (e.g. MobileNumber) which Gson stringifies.
      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }
    }
    return '';
  };

  const getNumberValue = (item: any, keys: string[]) => {
    for (const key of keys) {
      const value = item[key];
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return 0;
  };

  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusOptions, setStatusOptions] = useState<LeadStatusItem[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [updateNotes, setUpdateNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const getLookupResultData = useCallback(<T,>(response: unknown): T[] => {
    if (Array.isArray(response)) {
      return response as T[];
    }
    if (response && typeof response === 'object') {
      const data = response as Record<string, unknown>;
      const commonKeys = [
        'resultData',
        'ResultData',
        'data',
        'Data',
        'leadDetails',
        'LeadDetails',
        'items',
        'Items',
      ];
      for (const key of commonKeys) {
        const value = data[key];
        if (Array.isArray(value)) {
          return value as T[];
        }
      }
      for (const value of Object.values(data)) {
        if (Array.isArray(value)) {
          return value as T[];
        }
      }
    }
    return [];
  }, []);

  const loadStatusOptions = useCallback(async () => {
    try {
      const response = (await getLeadstatusList()) as LeadStatusResponse;
      const list = getLookupResultData<LeadStatusItem>(response);
      const filtered = list.filter(item => {
        const sName = getStringValue(item, [
          'LeadStatusName',
          'leadStatusName',
          'Name',
          'name',
          'statusName',
          'StatusName',
        ]).toLowerCase();
        return !['inactive', 'assigned', 'converted'].includes(sName);
      });
      setStatusOptions(filtered);
    } catch (error) {
      console.error('Error loading status options:', error);
    }
  }, [getLookupResultData]);

  const handleStatusUpdate = async () => {
    if (!selectedStatusId) {
      showFailureMsg('Please select a lead status.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const rec = (lead ?? {}) as Record<string, unknown>;
      const pick = (...keys: string[]) => {
        for (const key of keys) {
          if (rec[key] !== undefined && rec[key] !== null) {
            return rec[key];
          }
        }
        return undefined;
      };
      const response = ensureSuccess(await updateLeadStatusApi({
        LeadId: leadId,
        LeadStatusId: selectedStatusId,
        LeadStatus: selectedStatusId,
        UserId: userId,
        OwnerId: userId,
        CreatedBy: userId,
        UpdatedBy: userId,
        IsActive: true,
        // The lead's own Description stays as is; the note is FollowUpNotes.
        FollowUpNotes: updateNotes || 'Updated from app',
        Description: String(pick('Description', 'description') ?? ''),
        CustomerName: String(pick('CustomerName', 'customerName') ?? ''),
        MobileNumber: String(pick('MobileNumber', 'mobileNumber') ?? ''),
        Address: String(pick('Address', 'address') ?? ''),
        LocName: String(pick('LocName', 'locName') ?? ''),
        LocationId: Number(pick('LocationId', 'locationId') ?? 0),
        ServiceName: String(pick('ServiceName', 'serviceName') ?? ''),
        ServicesId: Number(pick('ServicesId', 'servicesId') ?? 0),
      }));

      // Based on Api.ts, request returns the parsed JSON response
      // Usually success is indicated by the absence of error or a specific field
      if (response) {
        showSuccessMsg('Lead status updated successfully.');
        setStatusModalVisible(false);
        setUpdateNotes('');
        setSelectedStatusId(null);
        loadDetails(); // Refresh details and history
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update lead status.';
      showFailureMsg(message || 'Update Failed');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [onBack]);

  const getHistoryData = useCallback((response: any): any[] => {
    if (!response || typeof response !== 'object') return [];
    
    // Look for common history keys
    const historyKeys = [
      'LeadStatusLogObj',
      'leadFollowUp',
      'LeadFollowUp',
      'leadHistory',
      'LeadHistory',
      'followUpList',
      'FollowUpList',
      'history',
      'History',
      'followup',
      'Followup',
    ];

    for (const key of historyKeys) {
      if (Array.isArray(response[key])) {
        return response[key];
      }
    }

    // Check if the response itself is an object and might have nested array
    if (response.resultData && typeof response.resultData === 'object') {
       for (const key of historyKeys) {
         if (Array.isArray(response.resultData[key])) {
           return response.resultData[key];
         }
       }
    }

    return [];
  }, []);

  const loadDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getLeadetailsByLeadId({
        UserId: userId,
        LeadId: leadId,
      });

      const list = getLookupResultData<LeadListItem>(response);
      if (list && list.length > 0) {
        setLead(list[0]);
        // Prioritize non-empty history from either root or the lead item
        const h1 = getHistoryData(response);
        const h2 = getHistoryData(list[0]);
        setHistory(h1.length > 0 ? h1 : h2);
      } else if (response && typeof response === 'object' && !Array.isArray(response)) {
        // Fallback: maybe it's not in an array but the object itself
        const leadObj = response as LeadListItem;
        setLead(leadObj);
        setHistory(getHistoryData(response));
      } else {
        throw new Error('No lead details found.');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load lead details.';
      showFailureMsg(message);
      onBack();
    } finally {
      setIsLoading(false);
    }
  }, [leadId, userId, onBack, getLookupResultData, getHistoryData]);

  useEffect(() => {
    loadDetails();
    loadStatusOptions();
  }, [loadDetails, loadStatusOptions]);

  const getLeadTitle = (item: LeadListItem) =>
    getStringValue(item, [
      'customerName',
      'CustomerName',
      'customername',
      'name',
      'Name',
      'fullName',
      'FullName',
    ]) || 'Lead Details';

  const getLeadDisplayId = (item: LeadListItem) => {
    const rawId = getStringValue(item, [
      'newLeadId',
      'NewLeadId',
      'leadNo',
      'LeadNo',
      'leadId',
      'LeadId',
    ]);
    return rawId ? (rawId.toLowerCase().startsWith('ld') ? rawId : `Ld${rawId}`) : '';
  };

  const getLeadPhone = (item: LeadListItem) =>
    getStringValue(item, [
      'mobileNo',
      'MobileNo',
      'mobileno',
      'mobileNumber',
      'MobileNumber',
      'contactNo',
      'ContactNo',
      'phoneNo',
      'PhoneNo',
    ]);

  const getLeadAddress = (item: LeadListItem) =>
    getStringValue(item, [
      'address',
      'Address',
      'customerAddress',
      'CustomerAddress',
      'description',
      'Description',
    ]) || 'NA';

  const getLeadStatus = (item: LeadListItem) =>
    getStringValue(item, [
      'leadStatusName',
      'LeadStatusName',
      'leadStatus',
      'LeadStatus',
      'statusName',
      'StatusName',
    ]) || 'InActive';

  const getLeadLandmark = (item: LeadListItem) =>
    getStringValue(item, [
      'locDescription',
      'LocDescription',
      'landmark',
      'Landmark',
      'landMark',
      'LandMark',
      'customerLandmark',
      'CustomerLandmark',
    ]) || 'NA';

  const getServiceType = (item: LeadListItem) =>
    getStringValue(item, [
      'serviceName',
      'ServiceName',
      'serviceType',
      'ServiceType',
      'serviceTypeName',
      'ServiceTypeName',
    ]) || 'NA';

  const parseDateRobust = (dateStr: string) => {
    if (!dateStr || dateStr.startsWith('0001-01-01')) {
      return new Date(NaN);
    }

    const trimmed = dateStr.trim();

    // Try common ISO-like patterns first and preserve the date portion.
    const isoRegex = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
    const isoMatch = trimmed.match(isoRegex);
    if (isoMatch) {
      const [, year, month, day, hour = '0', minute = '0', second = '0'] = isoMatch;
      const y = Number(year);
      if (y < 1900) {
        return new Date(NaN);
      }

      return new Date(
        y,
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
      );
    }

    // Try YYYY/MM/DD formats.
    const ymdSlashMatch = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
    if (ymdSlashMatch) {
      const [, year, month, day] = ymdSlashMatch;
      const y = Number(year);
      if (y < 1900) {
        return new Date(NaN);
      }
      return new Date(y, Number(month) - 1, Number(day));
    }

    // Try DD-MM-YYYY or DD/MM/YYYY.
    const dmyMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      const y = Number(year);
      if (y < 1900) {
        return new Date(NaN);
      }
      return new Date(y, Number(month) - 1, Number(day));
    }

    // Fallback to generic parsing.
    const fallbackDate = new Date(trimmed);
    if (!Number.isNaN(fallbackDate.getTime()) && fallbackDate.getFullYear() > 1900) {
      return fallbackDate;
    }

    return new Date(NaN);
  };

  const getCoordinate = (item: LeadListItem, keys: string[]) => {
    const val = getStringValue(item, keys);
    const num = Number(val);
    return Number.isFinite(num) && Math.abs(num) > 0 ? num : null;
  };

  const formatLeadDateTime = (item: LeadListItem) => {
    const rawDate = getStringValue(item, [
      'leadDate',
      'LeadDate',
      'createdDate',
      'CreatedDate',
      'date',
      'Date',
      'createdOn',
      'CreatedOn',
    ]);
    const rawTime = getStringValue(item, [
      'leadTime',
      'LeadTime',
      'createdTime',
      'CreatedTime',
    ]);

    if (!rawDate && !rawTime) {
      return 'NA';
    }

    let dateLabel = '';
    let timeLabel = '';

    // 1. Handle Date (prioritize rawDate)
    if (rawDate) {
      const trimmedDate = rawDate.trim();
      const dMatch = trimmedDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dMatch && dMatch[1] !== '0001') {
        dateLabel = `${dMatch[3]}-${dMatch[2]}-${dMatch[1]}`;
      } else {
        const d = parseDateRobust(trimmedDate);
        if (!Number.isNaN(d.getTime())) {
          dateLabel = `${String(d.getDate()).padStart(2, '0')}-${String(
            d.getMonth() + 1,
          ).padStart(2, '0')}-${d.getFullYear()}`;
        } else {
          // If prioritized field is 0001-01-01, try fallback fields
          const fallbackKeys = [
            'createdDate',
            'CreatedDate',
            'date',
            'Date',
            'createdOn',
            'CreatedOn',
          ];
          for (const key of fallbackKeys) {
            const val = (item as any)[key];
            if (
              typeof val === 'string' &&
              val.trim() &&
              !val.startsWith('0001-01-01')
            ) {
              const fd = parseDateRobust(val);
              if (!Number.isNaN(fd.getTime())) {
                dateLabel = `${String(fd.getDate()).padStart(2, '0')}-${String(
                  fd.getMonth() + 1,
                ).padStart(2, '0')}-${fd.getFullYear()}`;
                break;
              }
            }
          }
        }
      }
    }

    // 2. Handle Time (prioritize rawTime, fallback to rawDate T part)
    let timeToParse = '';
    if (rawTime && rawTime.trim().length > 0 && !rawTime.startsWith('00:00:00')) {
      timeToParse = rawTime.trim();
    } else if (rawDate && rawDate.includes('T')) {
      const tPart = rawDate.split('T')[1];
      if (tPart && !tPart.startsWith('00:00:00')) {
        timeToParse = tPart;
      }
    }

    if (timeToParse) {
      const tMatch = timeToParse.match(/^(\d{1,2}):(\d{2})/);
      if (tMatch) {
        let h = Number(tMatch[1]);
        const m = Number(tMatch[2]);
        const sfx = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        timeLabel = `${String(h12).padStart(2, '0')}:${String(m).padStart(
          2,
          '0',
        )} ${sfx}`;
      }
    }

    if (!dateLabel) {
      return timeLabel || 'NA';
    }
    return timeLabel ? `${dateLabel}  ${timeLabel}` : dateLabel;
  };

  const openAddTask = async (item: LeadListItem) => {
    const rec = item as Record<string, unknown>;
    // The in-memory profile is empty after a cold start/reload; Home keeps the name in storage.
    const storedName = technician ? await AsyncStorage.getItem('name') : null;
    const str = (...keys: string[]) => getStringValue(item, keys);
    setAddTaskValues({
      title: '',
      address: str('address', 'Address'),
      state: str('state', 'State'),
      city: str('city', 'City'),
      pinCode: str('pinCode', 'PinCode'),
      landmark: str('locDescription', 'LocDescription'),
      customerName: str('customerName', 'CustomerName'),
      customerNumber: str('mobileNumber', 'MobileNumber'),
      taskTagId: 0,
      taskTagName: '',
      customerId: getNumberValue(rec, ['customerDetailsid', 'CustomerDetailsid']) || undefined,
      leadId,
      latitude: str('latitude', 'Latitude'),
      longitude: str('longitude', 'Longitude'),
      // Java (technician): the assignee is the logged-in user.
      ...(technician
        ? {
            assignedFieldworkerId: getCurrentUserId(),
            assignedFieldworkerName:
              getCurrentUserProfile().userFirstName ||
              `${getCurrentUserProfile().details?.FirstName ?? ""} ${getCurrentUserProfile().details?.LastName ?? ""}`.trim() ||
              storedName ||
              "Me",
            lockAssignedFieldworker: true,
          }
        : {}),
    });
    setIsAddTaskOpen(true);
  };

  const openCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`).catch(() => {
      showToast('Unable to open dialer.');
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={THEME_PRIMARY} size="large" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  if (!lead) return null;

  const phone = getLeadPhone(lead);
  const status = getLeadStatus(lead);
  const dateTime = formatLeadDateTime(lead);
  const lat = getCoordinate(lead, ['latitude', 'Latitude', 'lat', 'Lat']);
  const lng = getCoordinate(lead, ['longitude', 'Longitude', 'lng', 'Lng', 'long', 'Long']);

  // Java: "+<countryCode> XXXXXXXXXX" when the TeleCMI module masks numbers, else the real number.
  const masked = getCurrentUserProfile().teleCmiModuleFlag === 'true';
  const countryCode = getCurrentCountryCode();
  const numberLabel = masked || (technician && !phone)
    ? `+${countryCode} XXXXXXXXXX`
    : phone
      ? `+${countryCode} ${phone}`
      : 'NA';
  const photoPaths = [
    getStringValue(lead, ['PhotoPath', 'photopath', 'photoPath']),
    getStringValue(lead, ['PhotoPath1', 'photopath1', 'photoPath1']),
    getStringValue(lead, ['PhotoPath2', 'photopath2', 'photoPath2']),
  ];
  const hasPhotos = photoPaths.some(path => Boolean(path && path.trim() && path.trim().toUpperCase() !== 'NA'));
  const photoUrl = (path: string) =>
    path.startsWith('http')
      ? path
      : `http://192.169.3.8/API/${path.startsWith('/') ? path.slice(1) : path}`;
  const notes =
    getStringValue(lead, ['Description', 'description', 'notes', 'Notes', 'requirement', 'Requirement']) || '-NA-';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Java: 200dp map inside the card, 30dp rounded top corners */}
        <View style={styles.mapMock}>
          {lat && lng ? (
            <MapView
              style={styles.mapImage}
              provider={PROVIDER_GOOGLE}
              initialRegion={{latitude: lat, longitude: lng, latitudeDelta: 0.1, longitudeDelta: 0.1}}
              toolbarEnabled={false}
            >
              <Marker
                coordinate={{latitude: lat, longitude: lng}}
                title={getLeadTitle(lead)}
                description={getServiceType(lead)}
                ref={m => {
                  setTimeout(() => m?.showCallout(), 600);
                }}
              />
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderText}>Map location not available</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, {color: getStatusColor(status)}]}>{status}</Text>
            <View style={styles.actionRow}>
              {!technician && (
                <TouchableOpacity style={styles.updateStatusBtn} onPress={() => setStatusModalVisible(true)}>
                  <Text style={styles.updateStatusBtnText}>Update Status</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.iconBtn} onPress={() => openAddTask(lead)}>
                <InvoiceIcon size={ms(22)} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => openCall(phone)}>
                <Image source={require('../../../assets/images/ic_phone.png')} style={styles.phoneIcon} />
              </TouchableOpacity>
              {!technician && (
                <TouchableOpacity style={styles.iconBtn} onPress={() => onDelete?.(lead)}>
                  <DeleteIcon size={ms(20)} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

        </View>
        <ScrollView style={{flex: 1}} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Lead Details</Text>
          <View style={styles.details}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('customer_name')}</Text>
              <Text style={styles.fieldValue}>{getLeadTitle(lead)}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Date & Time</Text>
              <Text style={styles.fieldValue}>{dateTime}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('customer_number')}</Text>
              <Text style={styles.fieldValue}>{numberLabel}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('customer_address')}</Text>
              <Text style={styles.fieldValue}>{getLeadAddress(lead)}</Text>
            </View>
            <View style={[styles.fieldRow, {marginBottom: ms(10)}]}>
              <Text style={styles.fieldLabel}>{t('landmark')}</Text>
              <Text style={styles.fieldValue}>{getLeadLandmark(lead)}</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, {marginTop: ms(10), marginBottom: ms(12)}]}>{t('services_details')}</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{t('service_type')}</Text>
            <Text style={styles.fieldValue}>{getServiceType(lead)}</Text>
          </View>

          {hasPhotos && (
            <>
              <Text style={[styles.sectionTitle, {marginTop: ms(20)}]}>Attached Photos</Text>
              <View style={styles.photoRow}>
                {photoPaths.map((path, index) => (
                  <View key={index} style={{flex: 1}}>
                    <PhotoSlot url={path && path.trim() && path.trim().toUpperCase() !== 'NA' ? photoUrl(path) : null} />
                  </View>
                ))}
              </View>
            </>
          )}

          <Text style={[styles.sectionTitle, {marginTop: ms(10), marginBottom: ms(5)}]}>Follow up History</Text>
          <ScrollView style={{height: ms(100)}} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {(history && history.length > 0
            ? history
            : [{LeadStatusName: status, LeadDate: undefined, LeadNotes: undefined}]
          ).map((item: any, index: number) => {
            const hStatus =
              getStringValue(item, [
                'LeadStatusName',
                'leadStatusName',
                'statusName',
                'StatusName',
                'leadStatus',
                'LeadStatus',
              ]) || 'InActive';
            const hDate = history && history.length > 0 ? formatLeadDateTime(item) : dateTime;
            const hNotes =
              getStringValue(item, [
                'LeadNotes',
                'leadNotes',
                'description',
                'Description',
                'notes',
                'Notes',
                'requirement',
                'Requirement',
              ]) || '-NA-';

            return (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyIndex, {color: getStatusColor(hStatus)}]}>
                    {index + 1}. {hStatus}
                  </Text>
                  <Text style={[styles.historyDate, {color: getStatusColor(hStatus)}]}>{hDate}</Text>
                </View>
                <Text style={styles.historyNotes}>{hNotes}</Text>
              </View>
            );
          })}
          </ScrollView>

          <Text style={[styles.sectionTitle, {marginTop: ms(10), marginBottom: ms(12)}]}>{t('notes')}</Text>
          <Text style={styles.notesText}>{notes}</Text>
        </View>
        </ScrollView>
      </View>

      <AddTaskModal
        visible={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        ownerId={taskOwnerId}
        initialValues={addTaskValues}
      />

      {/* Update Lead Status sheet -- Java update_lead_status.xml (gradient_addtask header, spinner pill,
          100dp notes pill, rounded_button_new Update, red Cancel) */}
      <Modal
        visible={statusModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('update_lead_status')}</Text>
              <Pressable onPress={() => setStatusModalVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={ms(30)} color="#fff" />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalBody}>
              <OutlinedSelect
                style={styles.statusPill}
                label="Select Lead Status"
                value={statusOptions
                  .map(item => ({
                    id: getNumberValue(item, ['Id', 'id', 'LeadStatusId', 'leadStatusId']),
                    name: getStringValue(item, ['LeadStatusName', 'leadStatusName', 'Name', 'name', 'statusName', 'StatusName']),
                  }))
                  .find(o => o.id === selectedStatusId)?.name ?? 'Select Lead Status'}
                chevron
                onPress={() => setStatusPickerOpen(true)}
              />

              <OutlinedInput
                style={styles.notesPill}
                placeholder={t('notes')}
                placeholderTextColor={COLORS.lightGray}
                multiline={true}
                value={updateNotes}
                onChangeText={setUpdateNotes}
              />

              <TouchableOpacity
                style={[
                  styles.updateBtn,
                  isUpdatingStatus && styles.updateBtnDisabled,
                ]}
                onPress={handleStatusUpdate}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <View style={styles.updateBtnIcon}>
                      <EnquiryIcon size={ms(30)} color="#fff" />
                    </View>
                    <Text style={styles.updateBtnText}>{t('update')}</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setStatusModalVisible(false)}>
                <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SearchPickerModal
        visible={statusPickerOpen}
        title="Select Lead Status"
        hideSearch
        options={statusOptions.map((item, index) => ({
          id: getNumberValue(item, ['Id', 'id', 'LeadStatusId', 'leadStatusId']) || index,
          label:
            getStringValue(item, ['LeadStatusName', 'leadStatusName', 'Name', 'name', 'statusName', 'StatusName']) ||
            'Unknown Status',
        }))}
        onSelect={o => {
          setSelectedStatusId(o.id);
          setStatusPickerOpen(false);
        }}
        onClose={() => setStatusPickerOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: ms(12),
    color: '#666',
    fontSize: sp(14),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(16),
    paddingTop: Platform.OS === 'ios' ? 48 : 12,
    paddingBottom: ms(12),
  },
  backButton: {
    padding: ms(8),
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: sp(24),
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: sp(20),
    fontWeight: '700',
    marginLeft: ms(8),
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    color: '#FFFFFF',
    fontSize: sp(22),
    marginLeft: ms(16),
  },
  content: {
    flex: 1,
    marginTop: ms(11),
    backgroundColor: COLORS.white,
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
  },
  contentInner: {
    paddingBottom: ms(100),
  },
  mapMock: {
    height: ms(200),
    backgroundColor: '#E5E7EB',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    color: COLORS.lightGray,
    fontSize: sp(14),
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: COLORS.white,
    paddingHorizontal: ms(20),
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: ms(20),
    marginBottom: ms(10),
  },
  statusLabel: {
    fontSize: sp(14),
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateStatusBtn: {
    backgroundColor: COLORS.statusOnHold,
    height: ms(25),
    paddingHorizontal: ms(10),
    borderRadius: ms(34),
    marginRight: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateStatusBtnText: {
    color: COLORS.white,
    fontSize: sp(11.4),
  },
  iconBtn: {
    marginLeft: ms(20),
  },
  phoneIcon: {
    width: ms(24),
    height: ms(24),
    resizeMode: 'contain',
  },
  sectionTitle: {
    fontSize: sp(13.3),
    fontWeight: '700',
    color: COLORS.ink,
  },
  details: {
    marginTop: ms(12),
    marginBottom: ms(10),
  },
  fieldRow: {
    flexDirection: 'row',
    marginTop: ms(4),
  },
  fieldLabel: {
    flex: 0.4,
    fontSize: sp(14.2),
    color: COLORS.ink,
  },
  fieldValue: {
    flex: 0.6,
    fontSize: sp(14.2),
    color: COLORS.lightGray,
  },
  photoRow: {
    flexDirection: 'row',
    gap: ms(20),
    marginTop: ms(20),
    marginBottom: ms(20),
  },
  photoSlot: {
    height: ms(100),
    backgroundColor: COLORS.white,
    borderWidth: ms(1),
    borderColor: COLORS.lightGray,
    borderRadius: ms(15),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  historyItem: {
    marginTop: ms(3),
    marginHorizontal: ms(5),
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyIndex: {
    fontSize: sp(12.3),
    fontWeight: '700',
  },
  historyDate: {
    fontSize: sp(11.4),
  },
  historyNotes: {
    fontSize: sp(12.3),
    color: COLORS.lightGray,
  },
  notesText: {
    fontSize: sp(14.2),
    color: COLORS.lightGray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: ms(560),
    borderTopLeftRadius: ms(25),
    borderTopRightRadius: ms(25),
    overflow: 'hidden',
    maxHeight: '90%',
  },
  // gradient_addtask header: #353935, 20dp corners, 60dp tall, 22sp white title
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.statusOnHold,
    height: ms(60),
    paddingHorizontal: ms(20),
    borderRadius: ms(20),
  },
  modalTitle: {
    fontSize: sp(21),
    color: '#FFFFFF',
  },
  modalBody: {
    paddingHorizontal: ms(20),
    paddingTop: ms(20),
    paddingBottom: ms(10),
  },
  // Java bg_spinner / TextInputLayoutStyle: outlined pill, light-gray stroke
  statusPill: {
    height: ms(40),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: ms(34),
    paddingHorizontal: ms(18),
    marginBottom: ms(16),
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  notesPill: {
    height: ms(100),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: ms(34),
    paddingHorizontal: ms(18),
    paddingTop: ms(14),
    fontSize: sp(15),
    color: COLORS.ink,
    textAlignVertical: 'top',
    marginBottom: ms(16),
    backgroundColor: '#fff',
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: ms(52),
    backgroundColor: COLORS.statusOnHold,
    borderRadius: ms(34),
    marginTop: ms(10),
    marginBottom: ms(20),
    elevation: 4,
  },
  updateBtnIcon: {
    position: 'absolute',
    left: ms(15),
  },
  updateBtnDisabled: {
    opacity: 0.6,
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontSize: sp(17),
  },
  cancelBtn: {
    alignItems: 'center',
    marginBottom: ms(20),
  },
  cancelBtnText: {
    color: COLORS.primary,
    fontSize: sp(17),
  },
});

export default LeadDetailsScreen;