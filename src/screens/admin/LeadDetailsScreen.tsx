import React, {useCallback, useEffect, useState} from 'react';
import {ms, sp} from '../../utils/responsive';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  type LeadListItem,
  type LeadDetailsResponse,
  type LeadStatusItem,
  type LeadStatusResponse,
} from './adminLegacyApiTypes';
import { getLeadstatusList, getLeadetailsByLeadId, updateLeadStatus as updateLeadStatusApi } from '../../api/lead/leadService';

type LeadDetailsScreenProps = {
  userId: number;
  leadId: number;
  onBack: () => void;
  onUpdateStatus?: (lead: LeadListItem) => void;
  onEdit?: (lead: LeadListItem) => void;
  onDelete?: (lead: LeadListItem) => void;
};

const THEME_PRIMARY = '#c3002f';

const getStatusColor = (status: string) => {
  const normalized = status.trim().toLowerCase();
  if (normalized.includes('discussion')) {
    return '#06a9ee';
  }
  if (normalized.includes('inactive')) {
    return '#9ca3af';
  }
  if (normalized.includes('assign')) {
    return '#ffc12c';
  }
  if (normalized.includes('close') || normalized.includes('complete')) {
    return '#18a957';
  }
  if (normalized.includes('reject') || normalized.includes('cancel')) {
    return '#d32f2f';
  }

  return THEME_PRIMARY;
};

const LeadDetailsScreen = ({
  userId,
  leadId,
  onBack,
  onUpdateStatus,
  onEdit,
  onDelete,
}: LeadDetailsScreenProps) => {
  const [lead, setLead] = useState<LeadListItem | null>(null);

  const getStringValue = (item: any, keys: string[]) => {
    for (const key of keys) {
      const value = item[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
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
      Alert.alert('Selection Required', 'Please select a lead status.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const response = await updateLeadStatusApi({
        LeadId: leadId,
        LeadStatusId: selectedStatusId,
        UserId: userId,
        Description: updateNotes || 'Updated from app',
      });

      // Based on Api.ts, request returns the parsed JSON response
      // Usually success is indicated by the absence of error or a specific field
      if (response) {
        Alert.alert('Success', 'Lead status updated successfully.');
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
      Alert.alert('Update Failed', message);
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
      Alert.alert('Error', message, [{text: 'OK', onPress: onBack}]);
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
        const sfx = h >= 12 ? 'pm' : 'am';
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
    return timeLabel ? `${dateLabel} ${timeLabel}` : dateLabel;
  };

  const openCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`).catch(() => {
      Alert.alert('Error', 'Unable to open dialer.');
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leads</Text>
        <View style={styles.headerIcons}>
          <Text style={styles.headerIcon}>🎧</Text>
          <Text style={styles.headerIcon}>🔔</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Map Mock */}
        <View style={styles.mapMock}>
          {lat && lng ? (
            <Image
              source={{uri: `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&markers=color:red%7C${lat},${lng}`}}
              style={styles.mapImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderText}>Map location not available</Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{status}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.updateStatusBtn} onPress={() => setStatusModalVisible(true)}>
                <Text style={styles.updateStatusBtnText}>Update Status</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => onEdit?.(lead)}>
                <Text style={styles.iconText}>📝</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => openCall(phone)}>
                <Text style={styles.iconText}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => onDelete?.(lead)}>
                <Text style={styles.iconText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lead Details</Text>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Customer Name</Text>
              <Text style={styles.fieldValue}>{getLeadTitle(lead)}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Date & Time</Text>
              <Text style={styles.fieldValue}>{dateTime}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Customer Number</Text>
              <Text style={styles.fieldValue}>{phone || 'NA'}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Customer Address</Text>
              <Text style={styles.fieldValue}>{getLeadAddress(lead)}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Landmark</Text>
              <Text style={styles.fieldValue}>{getLeadLandmark(lead)}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services Details</Text>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Service Type</Text>
              <Text style={styles.fieldValue}>{getServiceType(lead)}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attached Photos</Text>
            <View style={styles.photoRow}>
              {[
                getStringValue(lead, ['PhotoPath', 'photopath', 'photoPath']),
                getStringValue(lead, ['PhotoPath1', 'photopath1', 'photoPath1']),
                getStringValue(lead, ['PhotoPath2', 'photopath2', 'photoPath2']),
              ]
                .filter(path => Boolean(path && path.trim()))
                .map((path, index) => {
                  const baseUrl = 'http://192.169.3.8/API/';
                  const fullUrl = path
                    ? path.startsWith('http')
                      ? path
                      : `${baseUrl}${path.startsWith('/') ? path.slice(1) : path}`
                    : null;

                  if (!fullUrl) return null;

                  return (
                    <View key={index} style={styles.photoSlot}>
                      <Image
                        source={{uri: fullUrl}}
                        style={styles.photoImage}
                        resizeMode="cover"
                      />
                    </View>
                  );
                })}
            </View>
          </View>

          {history && history.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Follow up History</Text>
              {history.map((item, index) => {
                const hStatus = getStringValue(item, [
                  'LeadStatusName',
                  'leadStatusName',
                  'statusName',
                  'StatusName',
                  'leadStatus',
                  'LeadStatus',
                ]) || 'InActive';
                
                const hDate = formatLeadDateTime(item);
                const hNotes = getStringValue(item, [
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
                      <Text style={styles.historyDate}>{hDate}</Text>
                    </View>
                    <Text style={styles.historyNotes}>{hNotes}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Follow up History</Text>
              <View style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyIndex}>1. {status}</Text>
                  <Text style={styles.historyDate}>{dateTime}</Text>
                </View>
                <Text style={styles.historyNotes}>-NA-</Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>
              {getStringValue(lead, [
                'Description',
                'description',
                'notes',
                'Notes',
                'requirement',
                'Requirement',
              ]) || 'NA'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Update Lead Status Modal */}
      <Modal
        visible={statusModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Lead Status</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Select Lead Status</Text>
              <View style={styles.pickerContainer}>
                <ScrollView style={styles.statusOptionsList} nestedScrollEnabled={true}>
                  {statusOptions.map((item, index) => {
                    const sId = getNumberValue(item, [
                      'Id',
                      'id',
                      'LeadStatusId',
                      'leadStatusId',
                    ]);
                    const sName = getStringValue(item, [
                      'LeadStatusName',
                      'leadStatusName',
                      'Name',
                      'name',
                      'statusName',
                      'StatusName',
                    ]);

                    return (
                      <TouchableOpacity
                        key={sId || index}
                        style={[
                          styles.statusOptionItem,
                          selectedStatusId === sId && styles.statusOptionItemSelected,
                        ]}
                        onPress={() => setSelectedStatusId(sId)}
                      >
                        <Text
                          style={[
                            styles.statusOptionText,
                            selectedStatusId === sId && styles.statusOptionTextSelected,
                          ]}
                        >
                          {sName || 'Unknown Status'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Notes"
                placeholderTextColor="#999"
                multiline={true}
                numberOfLines={4}
                value={updateNotes}
                onChangeText={setUpdateNotes}
              />

              <TouchableOpacity
                style={[
                  styles.updateBtn,
                  (!selectedStatusId || isUpdatingStatus) && styles.updateBtnDisabled,
                ]}
                onPress={handleStatusUpdate}
                disabled={!selectedStatusId || isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.updateBtnText}>Update</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setStatusModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#F3F4F6',
  },
  contentInner: {
    paddingBottom: ms(100),
  },
  mapMock: {
    height: ms(200),
    backgroundColor: '#E5E7EB',
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
    color: '#9CA3AF',
    fontSize: sp(14),
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginTop: ms(-20),
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    padding: ms(20),
    minHeight: '100%',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(24),
  },
  statusLabel: {
    fontSize: sp(15),
    fontWeight: '600',
    color: '#6B7280',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateStatusBtn: {
    backgroundColor: '#374151',
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: ms(16),
    marginRight: ms(12),
  },
  updateStatusBtnText: {
    color: '#FFFFFF',
    fontSize: sp(12),
    fontWeight: '700',
  },
  iconBtn: {
    marginLeft: ms(16),
  },
  iconText: {
    fontSize: sp(18),
  },
  section: {
    marginBottom: ms(24),
  },
  sectionTitle: {
    fontSize: sp(16),
    fontWeight: '800',
    color: '#111827',
    marginBottom: ms(12),
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: ms(8),
  },
  fieldLabel: {
    flex: 1,
    fontSize: sp(14),
    color: '#4B5563',
    fontWeight: '600',
  },
  fieldValue: {
    flex: 1.2,
    fontSize: sp(14),
    color: '#374151',
    fontWeight: '500',
  },
  photoRow: {
    flexDirection: 'row',
    gap: ms(12),
  },
  photoSlot: {
    flex: 1,
    aspectRatio: 1.5,
    backgroundColor: '#FFFFFF',
    borderWidth: ms(1),
    borderColor: '#D1D5DB',
    borderRadius: ms(12),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    fontSize: sp(32),
    color: '#E5E7EB',
  },
  historyItem: {
    marginTop: ms(4),
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ms(4),
  },
  historyIndex: {
    fontSize: sp(13),
    fontWeight: '700',
    color: '#6B7280',
  },
  historyDate: {
    fontSize: sp(12),
    color: '#9CA3AF',
  },
  historyNotes: {
    fontSize: sp(13),
    color: '#9CA3AF',
    marginLeft: ms(14),
  },
  notesText: {
    fontSize: sp(14),
    color: '#6B7280',
    lineHeight: sp(20),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: ms(560),
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    paddingHorizontal: ms(20),
    paddingTop: ms(20),
    paddingBottom: Platform.OS === 'ios' ? ms(40) : ms(20),
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(20),
  },
  modalTitle: {
    fontSize: sp(18),
    fontWeight: '800',
    color: '#111827',
  },
  modalCloseText: {
    fontSize: sp(20),
    color: '#6B7280',
    fontWeight: '600',
    padding: ms(4),
  },
  modalBody: {
    gap: ms(12),
  },
  inputLabel: {
    fontSize: sp(14),
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: ms(4),
  },
  pickerContainer: {
    borderWidth: ms(1),
    borderColor: '#D1D5DB',
    borderRadius: ms(8),
    maxHeight: ms(200),
    overflow: 'hidden',
  },
  statusOptionsList: {
    width: '100%',
  },
  statusOptionItem: {
    paddingVertical: ms(12),
    paddingHorizontal: ms(16),
    borderBottomWidth: ms(1),
    borderBottomColor: '#F3F4F6',
  },
  statusOptionItemSelected: {
    backgroundColor: '#F3F4F6',
  },
  statusOptionText: {
    fontSize: sp(14),
    color: '#374151',
  },
  statusOptionTextSelected: {
    fontWeight: '700',
    color: THEME_PRIMARY,
  },
  notesInput: {
    borderWidth: ms(1),
    borderColor: '#D1D5DB',
    borderRadius: ms(8),
    padding: ms(12),
    fontSize: sp(14),
    color: '#374151',
    minHeight: ms(100),
    textAlignVertical: 'top',
  },
  updateBtn: {
    backgroundColor: '#374151',
    borderRadius: ms(8),
    paddingVertical: ms(14),
    alignItems: 'center',
    marginTop: ms(8),
  },
  updateBtnDisabled: {
    opacity: 0.6,
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontSize: sp(16),
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: ms(12),
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#DC2626',
    fontSize: sp(14),
    fontWeight: '600',
  },
});

export default LeadDetailsScreen;