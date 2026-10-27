// src/screens/admin/LeadListScreen.tsx

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ms, sp, useAppHeaderHeight} from '../../utils/responsive';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from '../../components/AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../../theme/theme';
import {
  type LeadListItem,
  type LeadListResponse,
  type LeadStatusItem,
  type LeadStatusResponse,
} from './adminLegacyApiTypes';
import { getLeadstatusList, getAllLEADList, deleteLeadDetails } from '../../api/lead/leadService';
import LeadDetailsScreen from './LeadDetailsScreen';
import AddLeadModal from './AddLeadModal';
import { showFailureMsg, showSuccessMsg, showToast } from '../../utils/toast';

import {useTranslation} from 'react-i18next';
import {encryptUserId} from './crmShared';
import { tr } from '../../i18n/tr';
type LeadListScreenProps = {
  userId: number;
  // Technician's own leads (Java: LeadsFragmentForTechnician) submit through
  // the technician add-lead endpoint, which zeroes Created/UpdatedBy and
  // sends UserId instead -- everything else (list, filters, detail view) is
  // identical to the admin/owner flow.
  technician?: boolean;
};

type LeadStatusOption = {
  id: number;
  label: string;
};

const PAGE_START = 1;
// Java URLConstant.Base.LEADFORM_LINK (BuildConfig.GETLEADFORM) for the QA server this app talks to.
const LEAD_FORM_LINK = 'http://192.169.3.8/LeadForm/LeadForm?Node=';
const THEME_PRIMARY = COLORS.primary;
const HEADER_PRIMARY = '#d0003f';
const ALL_STATUS: LeadStatusOption = {id: 0, label: 'Select Lead Status'};

const getResultData = <T,>(response: {
  resultData?: T[] | null;
  ResultData?: T[] | null;
}) => response.resultData ?? response.ResultData ?? [];

const getCode = (response: {code?: string; Code?: string}) =>
  String(response.code ?? response.Code ?? '');

const getMessage = (response: {message?: string; Message?: string}) =>
  String(response.message ?? response.Message ?? '').trim();

const isSuccessOrNoData = (
  response: LeadListResponse | LeadStatusResponse,
) => {
  const code = getCode(response);
  return code === '200' || code === '500' || code === '';
};

const getStringValue = (
  item: LeadListItem,
  keys: Array<keyof LeadListItem>,
) => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return '';
};

const getNumberValue = (
  item: LeadListItem | LeadStatusItem,
  keys: Array<keyof (LeadListItem & LeadStatusItem)>,
) => {
  for (const key of keys) {
    const value = item[key as keyof typeof item];
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return 0;
};

const normalizeStatus = (item: LeadStatusItem): LeadStatusOption => ({
  id: getNumberValue(item, [
    'leadStatusId',
    'LeadStatusId',
    'leadStatusID',
    'LeadStatusID',
    'id',
    'Id',
  ]),
  label:
    String(
      item.leadStatusName ??
        item.LeadStatusName ??
        item.statusName ??
        item.StatusName ??
        item.name ??
        item.Name ??
        '',
    ).trim() || 'Lead Status',
});

const getLeadId = (item: LeadListItem) =>
  getNumberValue(item, ['leadId', 'LeadId', 'leadID', 'LeadID', 'id', 'Id']);

const getLeadDisplayId = (item: LeadListItem) => {
  const rawId =
    getStringValue(item, [
      'newLeadId',
      'NewLeadId',
      'newLeadID',
      'NewLeadID',
      'leadNo',
      'LeadNo',
    ]) || String(getLeadId(item) || '');

  if (!rawId) {
    return '';
  }

  return rawId.toLowerCase().startsWith('ld') ? rawId : `Ld${rawId}`;
};

const getLeadTitle = (item: LeadListItem) =>
  getStringValue(item, [
    'customerName',
    'CustomerName',
    'leadName',
    'LeadName',
    'name',
    'Name',
  ]) || `Lead ${getLeadDisplayId(item) || '-'}`;

const getLeadDescription = (item: LeadListItem) =>
  getStringValue(item, [
    'serviceName',
    'ServiceName',
    'description',
    'Description',
    'requirement',
    'Requirement',
  ]);

const getLeadStatus = (item: LeadListItem) =>
  getStringValue(item, [
    'leadStatusName',
    'LeadStatusName',
    'leadStatus',
    'LeadStatus',
    'statusName',
    'StatusName',
  ]) || 'Assigned';

const getLeadPhone = (item: LeadListItem) =>
  getStringValue(item, [
    'mobileNo',
    'MobileNo',
    'mobileNumber',
    'MobileNumber',
    'contactNo',
    'ContactNo',
    'phoneNo',
    'PhoneNo',
    'phoneNumber',
    'PhoneNumber',
  ]);

const getLeadDateValue = (item: LeadListItem) =>
  getStringValue(item, [
    'leadDate',
    'LeadDate',
    'createdDate',
    'CreatedDate',
    'date',
    'Date',
    'createdOn',
    'CreatedOn',
  ]);

const getLeadTimeValue = (item: LeadListItem) =>
  getStringValue(item, [
    'leadTime',
    'LeadTime',
    'createdTime',
    'CreatedTime',
  ]);

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

const formatLeadDateTime = (item: LeadListItem) => {
  const rawDate = getLeadDateValue(item);
  const rawTime = getLeadTimeValue(item);

  if (!rawDate && !rawTime) {
    return '';
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
        dateLabel = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
      } else {
        // If prioritized field is 0001-01-01, try fallback fields
        const fallbackKeys = ['createdDate', 'CreatedDate', 'date', 'Date', 'createdOn', 'CreatedOn'];
        for (const key of fallbackKeys) {
          const val = (item as any)[key];
          if (typeof val === 'string' && val.trim() && !val.startsWith('0001-01-01')) {
            const fd = parseDateRobust(val);
            if (!Number.isNaN(fd.getTime())) {
              dateLabel = `${String(fd.getDate()).padStart(2, '0')}-${String(fd.getMonth() + 1).padStart(2, '0')}-${fd.getFullYear()}`;
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
      timeLabel = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${sfx}`;
    }
  }

  if (!dateLabel) {
    return timeLabel;
  }
  return timeLabel ? `${dateLabel}  ${timeLabel}` : dateLabel;
};

// Java LeadListAdapter: inactive/assigned/in discussion/called/dormant/quote sent/converted drawables.
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

const normalizePhone = (phone: string) => phone.replace(/[^\d+]/g, '');

const uniqueStatuses = (statuses: LeadStatusOption[]) => {
  const seen = new Set<number>();
  return statuses.filter(status => {
    if (!status.id || seen.has(status.id)) {
      return false;
    }
    seen.add(status.id);
    return true;
  });
};

const LeadListScreen = ({userId, technician = false}: LeadListScreenProps) => {
  const {t} = useTranslation();
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  const [statuses, setStatuses] = useState<LeadStatusOption[]>([]);
  const [selectedStatus, setSelectedStatus] =
    useState<LeadStatusOption>(ALL_STATUS);
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(PAGE_START);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLastPage, setIsLastPage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const headerHeight = useAppHeaderHeight();
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isLinkSheetOpen, setIsLinkSheetOpen] = useState(false);
  const latestRequestId = useRef(0);

  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const statusOptions = useMemo(
    () => [ALL_STATUS, ...statuses],
    [statuses],
  );

  const loadStatuses = useCallback(async () => {
    try {
      const response = (await getLeadstatusList()) as LeadStatusResponse;
      if (!isSuccessOrNoData(response)) {
        return;
      }

      const nextStatuses = getResultData<LeadStatusItem>(response)
        .map(normalizeStatus)
        .filter(status => status.id > 0 && status.label);
      setStatuses(uniqueStatuses(nextStatuses));
    } catch {
      setStatuses([]);
    }
  }, []);

  const fetchLeadPage = useCallback(
    async ({
      nextPage,
      replace,
      refreshing = false,
      searchParam = submittedSearch,
      leadStatusId = selectedStatus.id,
    }: {
      nextPage: number;
      replace: boolean;
      refreshing?: boolean;
      searchParam?: string;
      leadStatusId?: number;
    }) => {
      if (replace && !refreshing) {
        setIsInitialLoading(true);
      } else if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoadingMore(true);
      }

      setErrorMessage('');
      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;

      try {
        const response = (await getAllLEADList({
          UserId: userId,
          pageIndex: nextPage,
          SearchParam: searchParam,
          LeadStatusId: leadStatusId,
        })) as LeadListResponse;

        if (requestId !== latestRequestId.current) {
          return;
        }

        if (!isSuccessOrNoData(response)) {
          throw new Error(getMessage(response) || 'Unable to load leads.');
        }

        const nextLeads = getResultData<LeadListItem>(response);
        setLeads(previous => (replace ? nextLeads : [...previous, ...nextLeads]));
        setPageIndex(nextPage);
        setIsLastPage(nextLeads.length === 0);
      } catch (error) {
        if (requestId !== latestRequestId.current) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load leads right now.';
        setErrorMessage(message);
        if (replace) {
          setLeads([]);
          setIsLastPage(true);
        }
      } finally {
        if (requestId === latestRequestId.current) {
          setIsInitialLoading(false);
          setIsRefreshing(false);
          setIsLoadingMore(false);
        }
      }
    },
    [selectedStatus.id, submittedSearch, userId],
  );

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  useEffect(() => {
    fetchLeadPage({nextPage: PAGE_START, replace: true});
  }, [fetchLeadPage]);

  const openAddLeadModal = () => setIsAddLeadModalOpen(true);
  const closeAddLeadModal = () => setIsAddLeadModalOpen(false);

  const submitSearch = () => {
    setSubmittedSearch(searchText.trim());
  };

  const clearSearch = () => {
    setSearchText('');
    if (submittedSearch) {
      setSubmittedSearch('');
    }
  };

  const openCall = async (phone: string) => {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      showToast(t('rn_phone_number_unavailable'));
      return;
    }

    const url = `tel:${normalizedPhone}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch {
      showToast(t('rn_please_try_again_on_a_device'));
    }
  };

  const openWhatsapp = async (phone: string) => {
    const normalizedPhone = normalizePhone(phone).replace(/^\+/, '');
    if (!normalizedPhone) {
      showToast(t('rn_whatsapp_number_unavailable'));
      return;
    }

    const url = `https://wa.me/${normalizedPhone}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        showToast(t('rn_please_try_again_on_a_device'));
      }
    } catch {
      showToast(t('rn_please_try_again_later'));
    }
  };

  // Java CommonDialog.getLeadFormLink: share <LEADFORM_LINK><encrypted user id> through the system share sheet.
  const handleShareLeadFormLink = async () => {
    const url = LEAD_FORM_LINK + encryptUserId(userId);
    try {
      await Share.share({message: url, url, title: tr('FieldWeb : Lead Form')});
    } catch {
      showFailureMsg(t('rn_unable_to_share_the_link_right_now'));
    }
    setIsLinkSheetOpen(false);
  };

  const renderLead = ({item}: {item: LeadListItem}) => {
    const status = getLeadStatus(item);
    const phone = getLeadPhone(item);
    const leadId = getLeadDisplayId(item);
    const dateTime = formatLeadDateTime(item);

    return (
      <TouchableOpacity
        activeOpacity={0.78}
        style={styles.leadCard}
        onPress={() => setSelectedLeadId(getLeadId(item))}>
        <View style={[styles.statusRibbon, {backgroundColor: getStatusColor(status)}]}>
          <Text numberOfLines={1} style={styles.statusRibbonText}>
            {status.toUpperCase()}
          </Text>
        </View>

        {dateTime ? (
          <Text numberOfLines={1} style={styles.leadDateText}>
            {dateTime}
          </Text>
        ) : null}

        <View style={styles.leadBody}>
          <View style={styles.leadTitleRow}>
            <Text numberOfLines={1} style={styles.leadTitle}>
              {getLeadTitle(item)}
            </Text>
            {leadId ? (
              <Text numberOfLines={1} style={styles.leadIdText}>
                [{leadId}]
              </Text>
            ) : null}
          </View>
          <Text numberOfLines={1} style={styles.leadDescription}>
            {getLeadDescription(item) || 'Lead enquiry'}
          </Text>
        </View>

        <View style={styles.leadActions}>
          <Pressable
            hitSlop={10}
            style={styles.actionButton}
            onPress={() => openWhatsapp(phone)}>
            <Ionicons name="logo-whatsapp" size={ms(20)} color={COLORS.ink} />
          </Pressable>
          <Pressable
            hitSlop={10}
            style={styles.actionButton}
            onPress={() => openCall(phone)}>
            <Ionicons name="call-outline" size={ms(20)} color={COLORS.ink} />
          </Pressable>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (isInitialLoading) {
      return null;
    }

    if (errorMessage) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>!</Text>
          <Text style={styles.emptyTitle}>{t('rn_unable_to_load_leads')}</Text>
          <Text style={styles.emptyText}>{errorMessage}</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Image
          source={require('../../../assets/images/noresultfound.png')}
          style={styles.emptyImage}
          resizeMode="contain"
        />
      </View>
    );
  };

  if (selectedLeadId !== null) {
    return (
      <LeadDetailsScreen
        technician={technician}
        userId={userId}
        leadId={selectedLeadId}
        onBack={() => setSelectedLeadId(null)}
        onDelete={() => {
          // LeadDetailsFragment.deleteLeadDetailsDialog (delete_leaddetails_dialog).
          Alert.alert(
            '',
            t('delete_leaddetails'),
            [
              { text: tr('NO'), style: 'cancel' },
              {
                text: tr('Yes'),
                style: 'destructive',
                onPress: async () => {
                  try {
                    const response = await deleteLeadDetails({ UserId: userId, Id: selectedLeadId });
                    showSuccessMsg(response?.Message ?? 'Lead deleted.');
                    if (response?.Code === '200') {
                      setSelectedLeadId(null);
                      fetchLeadPage({ nextPage: PAGE_START, replace: true });
                    }
                  } catch (error) {
                    showFailureMsg(error instanceof Error ? error.message : tr('Unable to delete lead.'));
                  }
                },
              },
            ],
          );
        }}
      />
    );
  }

  return (
    <View style={styles.screen}>
      {/* The menu/title/notification row used to be drawn here; it's now
          the shared AppHeader rendered once by AdminTabs, above
          AdminHomeScreen (which this screen is embedded in). */}
      <Pressable
        style={styles.statusSelector}
        onPress={() => setIsStatusModalOpen(true)}>
        <Text numberOfLines={1} style={styles.statusSelectorText}>
          {selectedStatus.label}
        </Text>
        <Ionicons name="chevron-down" style={styles.statusSelectorChevron} />
      </Pressable>

      <View style={styles.panel}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={ms(22)} color={COLORS.lightGray} style={styles.searchIconGlyph} />
            <TextInput
              value={searchText}
              onChangeText={value => {
                const nextValue = value.slice(0, 35);
                setSearchText(nextValue);
                if (!nextValue.trim() && submittedSearch) {
                  setSubmittedSearch('');
                }
              }}
              onSubmitEditing={submitSearch}
              returnKeyType="search"
              placeholder={t('rn_search_by_customer_name_lead_id')}
              placeholderTextColor="#8f8f8f"
              style={styles.searchInput}
            />
            <Pressable hitSlop={12} onPress={clearSearch}>
              <Ionicons name="close" size={ms(24)} color={COLORS.lightGray} />
            </Pressable>
          </View>

          <Pressable style={styles.addButton} onPress={openAddLeadModal}>
            <Text style={styles.addButtonText}>{t('rn_lead')}</Text>
          </Pressable>

          {!technician && (
            <Pressable hitSlop={10} onPress={() => setIsLinkSheetOpen(true)}>
              <Ionicons name="link-outline" size={ms(26)} color={THEME_PRIMARY} />
            </Pressable>
          )}
        </View>

        {isInitialLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={THEME_PRIMARY} />
            <Text style={styles.loadingText}>{t('rn_loading_leads')}</Text>
          </View>
        ) : null}

        <FlatList
          data={leads}
          keyExtractor={(item, index) => `${getLeadId(item) || index}-${index}`}
          renderItem={renderLead}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.listFooter}>
                <ActivityIndicator color={THEME_PRIMARY} size="small" />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              colors={[THEME_PRIMARY]}
              tintColor={THEME_PRIMARY}
              onRefresh={() =>
                fetchLeadPage({
                  nextPage: PAGE_START,
                  replace: true,
                  refreshing: true,
                })
              }
            />
          }
          onEndReachedThreshold={0.35}
          onEndReached={() => {
            // Ignore the end-reached event an empty list fires on mount; it would race the first page.
            if (leads.length > 0 && !isInitialLoading && !isLoadingMore && !isLastPage) {
              fetchLeadPage({nextPage: pageIndex + 1, replace: false});
            }
          }}
        />
      </View>

      <Modal
        visible={isStatusModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsStatusModalOpen(false)}>
        {/* Java: native Spinner popup -- a plain menu card anchored under the status row, no dimming. */}
        <Pressable
          style={styles.spinnerBackdrop}
          onPress={() => setIsStatusModalOpen(false)}>
          <View style={[styles.spinnerMenu, {top: headerHeight + ms(6)}]}>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {statusOptions.map(status => (
                <TouchableOpacity
                  key={`${status.id}-${status.label}`}
                  style={styles.spinnerItem}
                  onPress={() => {
                    setSelectedStatus(status);
                    setIsStatusModalOpen(false);
                  }}>
                  <Text style={styles.spinnerItemText}>{status.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* diaolog_lead_form_link.xml: bottom card (30dp corners), 18sp message, red Copy & Share, red Cancel */}
      <Modal
        visible={isLinkSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsLinkSheetOpen(false)}>
        <Pressable style={styles.linkOverlay} onPress={() => setIsLinkSheetOpen(false)}>
          <Pressable style={styles.linkSheet} onPress={() => {}}>
            <Text style={styles.linkMessage}>{t('rn_click_on_below_button_to_copy_or_share_the')}</Text>
            <Pressable style={styles.linkShareBtn} onPress={handleShareLeadFormLink}>
              <Text style={styles.linkShareBtnText}>{t('click_to_copy')}</Text>
            </Pressable>
            <Pressable style={styles.linkCancel} onPress={() => setIsLinkSheetOpen(false)}>
              <Text style={styles.linkCancelText}>{t('cancel')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <AddLeadModal
        technician={technician}
        visible={isAddLeadModalOpen}
        onClose={closeAddLeadModal}
        onSuccess={() => fetchLeadPage({nextPage: PAGE_START, replace: true})}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  linkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  linkSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    padding: ms(20),
    paddingTop: ms(30),
  },
  linkMessage: {
    textAlign: 'center',
    fontSize: sp(17),
    color: COLORS.ink,
    marginBottom: ms(20),
  },
  linkShareBtn: {
    height: ms(50),
    borderRadius: ms(34),
    backgroundColor: THEME_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ms(10),
    marginBottom: ms(20),
    elevation: 4,
  },
  linkShareBtnText: {color: '#FFFFFF', fontSize: sp(17)},
  linkCancel: {alignItems: 'center', marginBottom: ms(10)},
  linkCancelText: {color: THEME_PRIMARY, fontSize: sp(17)},
  screen: {
    flex: 1,
    backgroundColor: THEME_PRIMARY,
  },
  toolbar: {
    height: ms(64),
    backgroundColor: HEADER_PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(20),
    elevation: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 3},
  },
  menuButton: {
    width: ms(40),
    height: ms(40),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: sp(12),
    lineHeight: sp(14),
    fontWeight: '900',
  },
  toolbarTitle: {
    flex: 1,
    marginLeft: ms(20),
    color: '#FFFFFF',
    fontSize: sp(24),
    fontWeight: '800',
  },
  toolbarActions: {
    width: ms(104),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toolbarActionText: {
    color: '#FFFFFF',
    fontSize: sp(12),
    fontWeight: '800',
  },
  statusSelector: {
    height: ms(52),
    backgroundColor: THEME_PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(12),
    paddingTop: ms(8),
  },
  statusSelectorText: {
    color: '#FFFFFF',
    fontSize: sp(16),
  },
  statusSelectorChevron: {
    marginLeft: ms(12),
    color: '#FFFFFF',
    fontSize: sp(20),
    lineHeight: sp(30),
    fontWeight: '900',
  },
  panel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    overflow: 'hidden',
  },
  searchRow: {
    minHeight: ms(52),
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: ms(23),
    paddingRight: ms(16),
    paddingTop: ms(10),
    gap: ms(12),
  },
  searchBox: {
    flex: 1,
    minWidth: 0,
    height: ms(40),
    borderBottomWidth: ms(1),
    borderBottomColor: COLORS.lightGray,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIconGlyph: { marginRight: ms(8) },
  searchIcon: {
    color: '#b9b9b9',
    fontSize: sp(12),
    fontWeight: '800',
    marginRight: ms(8),
  },
  searchInput: {
    flex: 1,
    height: ms(50),
    color: COLORS.ink,
    fontSize: sp(16),
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  clearText: {
    color: '#a7a7a7',
    fontSize: sp(28),
    lineHeight: sp(30),
  },
  addButton: {
    height: ms(30),
    width: ms(60),
    borderRadius: ms(10),
    backgroundColor: COLORS.textBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: sp(12),
  },
  linkButton: {
    height: ms(42),
    minWidth: ms(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    color: THEME_PRIMARY,
    fontSize: sp(13),
    fontWeight: '900',
  },
  loadingOverlay: {
    paddingVertical: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: ms(8),
    color: '#6b7280',
    fontSize: sp(13),
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: ms(18),
    paddingTop: ms(13),
    paddingBottom: ms(110),
  },
  // lead_list_owner.xml: 8dp-margin CardView radius 10; 9sp ribbon (15/3dp padding), 11sp date,
  // 16sp bold name in a 105dp box + 12sp bold id, 12sp description, 20dp whatsapp/phone icons.
  leadCard: {
    minHeight: ms(82),
    borderWidth: ms(1),
    borderColor: '#ededed',
    borderRadius: ms(10),
    backgroundColor: '#FFFFFF',
    marginBottom: ms(16),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 2},
  },
  statusRibbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderBottomRightRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(15),
    paddingVertical: ms(3),
    zIndex: 2,
  },
  statusRibbonText: {
    color: '#FFFFFF',
    fontSize: sp(9),
  },
  leadDateText: {
    position: 'absolute',
    top: ms(5),
    right: ms(8),
    maxWidth: ms(200),
    color: COLORS.ink,
    fontSize: sp(11),
    textAlign: 'right',
  },
  leadBody: {
    paddingTop: ms(26),
    paddingLeft: ms(10),
    paddingRight: ms(100),
    paddingBottom: ms(9),
  },
  leadTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  leadTitle: {
    width: ms(112),
    paddingLeft: ms(5),
    color: COLORS.ink,
    fontSize: sp(15),
    fontWeight: '700',
  },
  leadIdText: {
    paddingLeft: ms(10),
    color: COLORS.linkBlue,
    fontSize: sp(12),
    fontWeight: '700',
  },
  leadDescription: {
    marginTop: ms(5),
    paddingLeft: ms(5),
    color: COLORS.darkGray,
    fontSize: sp(12),
  },
  leadActions: {
    position: 'absolute',
    right: ms(18),
    bottom: ms(13),
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(36),
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappIcon: {
    color: '#111827',
    fontSize: sp(13),
    fontWeight: '900',
  },
  callIcon: {
    color: '#374151',
    fontSize: sp(13),
    fontWeight: '900',
  },
  listFooter: {
    paddingVertical: ms(16),
  },
  emptyState: {
    flex: 1,
    minHeight: ms(300),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(28),
  },
  emptyIcon: {
    width: ms(52),
    height: ms(52),
    borderRadius: ms(26),
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#f2f4f7',
    color: '#98a2b3',
    fontSize: sp(28),
    fontWeight: '800',
  },
  emptyImage: {
    width: ms(220),
    height: ms(220),
  },
  emptyTitle: {
    marginTop: ms(12),
    color: '#111827',
    fontSize: sp(17),
    fontWeight: '800',
  },
  emptyText: {
    marginTop: ms(6),
    color: '#667085',
    textAlign: 'center',
    fontSize: sp(13),
    lineHeight: sp(18),
  },
  spinnerBackdrop: {flex: 1},
  spinnerMenu: {
    position: 'absolute',
    left: ms(4),
    width: ms(176),
    maxHeight: '70%',
    backgroundColor: '#FAFAFA',
    borderRadius: ms(2),
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
  },
  spinnerItem: {height: ms(46.5), justifyContent: 'center', paddingHorizontal: ms(8)},
  spinnerItemText: {fontSize: sp(16), color: COLORS.textBlack},
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(22),
  },
  modalPanel: {
    width: '100%',
    maxWidth: ms(360),
    maxHeight: '76%',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(8),
    paddingVertical: ms(12),
  },
  modalTitle: {
    color: '#111827',
    fontSize: sp(18),
    fontWeight: '800',
    paddingHorizontal: ms(16),
    paddingBottom: ms(8),
  },
  modalItem: {
    minHeight: ms(46),
    justifyContent: 'center',
    paddingHorizontal: ms(16),
  },
  modalItemActive: {
    backgroundColor: '#fde7ee',
  },
  modalItemText: {
    color: '#1f2937',
    fontSize: sp(15),
    fontWeight: '600',
  },
  modalItemTextActive: {
    color: THEME_PRIMARY,
    fontWeight: '900',
  },
  modalSearchBox: {
    marginHorizontal: ms(16),
    marginBottom: ms(8),
    height: ms(40),
    borderWidth: ms(1),
    borderColor: '#d9d9d9',
    borderRadius: ms(20),
    paddingHorizontal: ms(16),
    justifyContent: 'center',
  },
  modalSearchInput: {
    height: ms(38),
    color: '#1F2937',
    fontSize: sp(14),
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  modalEmptyText: {
    paddingHorizontal: ms(16),
    paddingVertical: ms(16),
    color: '#667085',
    fontSize: sp(13),
  },
  addModalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  addModalPanel: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: ms(560),
    borderTopLeftRadius: ms(8),
    borderTopRightRadius: ms(8),
    maxHeight: '90%',
    overflow: 'hidden',
  },
  addModalHeader: {
    alignItems: 'center',
    backgroundColor: '#3a3f3a',
    flexDirection: 'row',
    minHeight: ms(56),
    paddingHorizontal: ms(20),
    justifyContent: 'space-between',
  },
  addModalTitle: {
    color: '#FFFFFF',
    fontSize: sp(20),
    fontWeight: '600',
  },
  addModalClose: {
    width: ms(32),
    height: ms(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addModalCloseText: {
    color: '#FFFFFF',
    fontSize: sp(26),
    fontWeight: '300',
    lineHeight: sp(28),
  },
  addFormScroll: {
    backgroundColor: '#FFFFFF',
  },
  addFormContent: {
    paddingHorizontal: ms(20),
    paddingTop: ms(20),
    paddingBottom: ms(24),
  },
  formInputShell: {
    height: ms(46),
    borderWidth: ms(1),
    borderColor: '#c9c9c9',
    borderRadius: ms(23),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(18),
    marginBottom: ms(18),
  },
  formInputShellMultiline: {
    height: ms(90),
    borderRadius: ms(20),
    alignItems: 'flex-start',
    paddingVertical: ms(12),
  },
  formInput: {
    flex: 1,
    height: ms(44),
    color: '#1F2937',
    fontSize: sp(15),
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  formInputMultiline: {
    height: '100%',
    textAlignVertical: 'top',
  },
  formTrailing: {
    marginLeft: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactIcon: {
    color: THEME_PRIMARY,
    fontSize: sp(13),
    fontWeight: '900',
  },
  formPairRow: {
    flexDirection: 'row',
    gap: ms(12),
  },
  formHalf: {
    flex: 1,
  },
  formSelectText: {
    flex: 1,
    color: '#9CA3AF',
    fontSize: sp(15),
  },
  formValueText: {
    color: '#1F2937',
  },
  formSelectArrow: {
    marginLeft: ms(8),
    color: '#1F2937',
    fontSize: sp(16),
    fontWeight: '800',
  },
  customerAutocompleteWrapper: {
    zIndex: 20,
  },
  customerSuggestionPanel: {
    position: 'absolute',
    top: ms(48),
    left: 0,
    right: 0,
    maxHeight: ms(210),
    backgroundColor: '#FFFFFF',
    borderWidth: ms(1),
    borderColor: '#D9D9D9',
    borderRadius: ms(8),
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 30,
  },
  customerSuggestionList: {
    maxHeight: ms(208),
  },
  customerSuggestionItem: {
    paddingHorizontal: ms(14),
    paddingVertical: ms(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEEE',
  },
  customerSuggestionName: {
    color: '#111111',
    fontSize: sp(15),
    fontWeight: '700',
  },
  customerSuggestionMeta: {
    marginTop: ms(3),
    color: '#777777',
    fontSize: sp(12),
  },
  customerSuggestionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ms(52),
    paddingHorizontal: ms(14),
  },
  customerSuggestionStatusText: {
    marginLeft: ms(8),
    color: '#777777',
    fontSize: sp(13),
  },
  photoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ms(18),
  },
  photoBox: {
    width: '31%',
    height: ms(76),
    borderWidth: ms(1),
    borderColor: '#c9c9c9',
    borderRadius: ms(8),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoIcon: {
    color: '#9CA3AF',
    fontSize: sp(13),
    fontWeight: '800',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: ms(2),
    right: ms(2),
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: '#FFFFFF',
    fontSize: sp(12),
    fontWeight: '800',
    lineHeight: sp(14),
  },
  submitLeadButton: {
    height: ms(48),
    borderRadius: ms(24),
    backgroundColor: '#3a3f3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ms(4),
  },
  submitLeadButtonDisabled: {
    opacity: 0.7,
  },
  submitLeadText: {
    color: '#FFFFFF',
    fontSize: sp(16),
    fontWeight: '800',
  },
  cancelLeadButton: {
    height: ms(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLeadText: {
    color: THEME_PRIMARY,
    fontSize: sp(15),
    fontWeight: '800',
  },
});

export default LeadListScreen;