// src/screens/admin/AccountsScreen.tsx

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import TabStrip from '../../components/TabStrip';
import UnderlineSearch from '../../components/UnderlineSearch';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {BackHandler} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {getQuotationList} from '../../api/quotation/quotationService';
import type {QuotationListDTOResultData} from '../../api/quotation/quotation.types';
import {getInvoiceList} from '../../api/accountManagement/accountManagementService';
import type {InvoiceListDTOResultData} from '../../api/accountManagement/accountManagement.types';
import AddQuoteModal from './AddQuoteModal';
import QuotationDetailsScreen from './QuotationDetailsScreen';
import InvoiceDetailsScreen from './InvoiceDetailsScreen';
import {scale, sp, vs} from '../../utils/responsive';
import {formatAmount} from '../../utils/decimal';

import {useTranslation} from 'react-i18next';
const THEME_PRIMARY = '#c3002f';
const HEADER_PRIMARY = '#a80030';
const BLUE_CODE = '#1877F2';
const CORAL_NAME = '#E4574E';
const GREEN_AMOUNT = '#1fb327';
const GREEN_500 = '#4CAF50';
const BADGE_PURPLE = '#6C4BA5';
const BADGE_ORANGE = '#F4A62A';
const BADGE_GREEN = '#2E7D32';

type AccountsTab = 'quotation' | 'invoice';

type StatusOption = {
  id: number;
  label: string;
};

const QUOTATION_STATUS_OPTIONS: StatusOption[] = [
  {id: 0, label: 'Select Status'},
  // Java AccountsQuotationFragment spinner -> StatusId mapping.
  {id: 2, label: 'Not Assigned'},
  {id: 1, label: 'Assigned'},
  {id: 5, label: 'Task Completed'},
  {id: 4, label: 'Lost'},
];

const INVOICE_STATUS_OPTIONS: StatusOption[] = [
  {id: 0, label: 'Select Status'},
  // Java AccountsInvoiceFragment spinner -> StatusId mapping.
  {id: 3, label: 'Follow Up'},
  {id: 6, label: 'Un-Paid'},
  {id: 7, label: 'Partial-Paid'},
  {id: 8, label: 'Paid'},
];

const PAGE_START = 1;

const getQuoteId = (item: QuotationListDTOResultData) => Number(item.Id ?? 0);

const getQuoteCode = (item: QuotationListDTOResultData) =>
  item.Id ? `QUO${item.Id}` : '';

const getQuoteTitle = (item: QuotationListDTOResultData) =>
  String(item.QuoteName ?? '').trim() || 'Quote';

const getQuoteStatusName = (item: QuotationListDTOResultData) => {
  const status = item.Status;
  const statusName = String(status?.StatusName ?? '').trim();
  if (statusName) {
    return statusName;
  }
  const statusId = Number(item.StatusId ?? 0);
  return statusId === 1 ? 'Not Assigned' : 'Assigned';
};

const getQuoteCustomerName = (item: QuotationListDTOResultData) => {
  const customer = item.Customer;
  return String(customer?.CustomerName ?? '').trim() || '-';
};

const getQuoteAmount = (item: QuotationListDTOResultData) =>
  Number(item.GrandTotalAmount ?? item.TotalAmount ?? 0);

const getQuoteDate = (item: QuotationListDTOResultData) => {
  const raw = String(item.QuoteTime ?? item.CreatedDate ?? '').trim();
  if (!raw) {
    return '';
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw.split('T')[0];
  }
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}-${month}-${year}`;
};

const getInvoiceId = (item: InvoiceListDTOResultData) => Number(item.Id ?? 0);

const getInvoiceCode = (item: InvoiceListDTOResultData) =>
  item.Id ? `INV${item.Id}` : String(item.InvoiceCode ?? '').trim();

const getInvoiceTitle = (item: InvoiceListDTOResultData) =>
  String(item.QuoteTaskName ?? item.CustomerName ?? '').trim() || 'Invoice';

const getInvoiceCustomerName = (item: InvoiceListDTOResultData) =>
  String(item.CustomerName ?? '').trim() || '-';

const getInvoiceStatusName = (item: InvoiceListDTOResultData) =>
  String(item.StatusName ?? '').trim() || '-';

const getInvoiceAmount = (item: InvoiceListDTOResultData) =>
  Number(item.InvoiceAmount ?? 0);

const getInvoiceDate = (item: InvoiceListDTOResultData) => {
  const raw = String((item as any).CreatedDate ?? item.InvoiceDate ?? '').trim();
  if (!raw) {
    return '';
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw.split('T')[0];
  }
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}-${month}-${year}`;
};

// Java status backgrounds: Assigned #FBC02D, Not Assigned #6e41bf, Lost / UnPaid colorPrimaryDark,
// Task Completed / Paid green, Partial Paid orange.
const getBadgeColor = (statusLabel: string) => {
  const normalized = statusLabel.trim().toLowerCase().replace(/[\s-]/g, '');
  switch (normalized) {
    case 'assigned':
      return '#FBC02D';
    case 'notassigned':
      return '#6e41bf';
    case 'lost':
    case 'unpaid':
      return '#c3002f';
    case 'taskcompleted':
    case 'paid':
      return '#03de73';
    case 'partialpaid':
      return '#ff9b00';
    default:
      return '#6e41bf';
  }
};

type AccountsScreenProps = {
  ownerId: number;
};

const AccountsScreen = ({ownerId}: AccountsScreenProps) => {
  const {t} = useTranslation();
  const [activeTab, setActiveTab] = useState<AccountsTab>('quotation');
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StatusOption>(QUOTATION_STATUS_OPTIONS[0]);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusSelectorY, setStatusSelectorY] = useState(0);

  const [quotations, setQuotations] = useState<QuotationListDTOResultData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceListDTOResultData[]>([]);
  const [pageIndex, setPageIndex] = useState(PAGE_START);
  const [isLastPage, setIsLastPage] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddQuoteModalOpen, setIsAddQuoteModalOpen] = useState(false);
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(null);
  const [selectedQuotationStatus, setSelectedQuotationStatus] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [selectedInvoiceStatus, setSelectedInvoiceStatus] = useState<string>('');
  const [selectedInvoiceTaskName, setSelectedInvoiceTaskName] = useState<string>('');

  const navigation = useNavigation<any>();
  // Java toolbar titles on the detail pages.
  useEffect(() => {
    navigation.setParams({
      currentSectionTitle: selectedQuotationId !== null ? 'Quotation Details' : selectedInvoiceId !== null ? 'Invoice Details' : 'Accounts',
    });
  }, [selectedQuotationId, selectedInvoiceId, navigation]);

  // Back walks up one level: status picker -> list, details -> list. On the list itself
  // no listener is registered, so back keeps its normal behaviour (go to Home).
  const hasOverlay = isStatusModalOpen || selectedQuotationId !== null || selectedInvoiceId !== null;
  useEffect(() => {
    if (!hasOverlay) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isStatusModalOpen) {
        setIsStatusModalOpen(false);
      } else {
        setSelectedQuotationId(null);
        setSelectedInvoiceId(null);
      }
      return true;
    });
    return () => sub.remove();
  }, [hasOverlay, isStatusModalOpen]);

  const statusOptions = activeTab === 'quotation' ? QUOTATION_STATUS_OPTIONS : INVOICE_STATUS_OPTIONS;

  useEffect(() => {
    setSearchText('');
    setSubmittedSearch('');
    setSelectedStatus(statusOptions[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchPage = useCallback(
    async ({
      nextPage,
      replace,
      refreshing = false,
    }: {
      nextPage: number;
      replace: boolean;
      refreshing?: boolean;
    }) => {
      if (refreshing) {
        setIsRefreshing(true);
      } else if (replace) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        if (activeTab === 'quotation') {
          const response = await getQuotationList({
            UserId: ownerId,
            PageSize: 10,
            Pagenum: nextPage,
            StatusId: selectedStatus.id,
            SearchParam: submittedSearch,
          });
          const resultData = response.ResultData ?? [];
          setQuotations(prev => (replace ? resultData : [...prev, ...resultData]));
          setIsLastPage(resultData.length < 10);
        } else {
          const response = await getInvoiceList({
            UserId: ownerId,
            PageSize: 50,
            Pagenum: nextPage,
            StatusId: selectedStatus.id,
            SearchParam: submittedSearch,
          });
          const resultData = response.ResultData ?? [];
          setInvoices(prev => (replace ? resultData : [...prev, ...resultData]));
          setIsLastPage(resultData.length < 50);
        }
        setPageIndex(nextPage);
      } catch (error) {
        if (replace) {
          if (activeTab === 'quotation') {
            setQuotations([]);
          } else {
            setInvoices([]);
          }
        }
      } finally {
        setIsInitialLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [activeTab, ownerId, selectedStatus, submittedSearch],
  );

  useEffect(() => {
    fetchPage({nextPage: PAGE_START, replace: true});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedStatus, submittedSearch]);

  const submitSearch = () => {
    setSubmittedSearch(searchText.trim());
  };

  const clearSearch = () => {
    setSearchText('');
    setSubmittedSearch('');
  };

  // quotation_list.xml / invoice_list.xml: 8dp-margin card radius 10, flush top-left status ribbon (9sp),
  // centred bold blue id, bold date at the right, 16sp bold title, 12dp detail rows.
  const cardHeader = (statusLabel: string, code: string, date: string, idSize: number, dateSize: number) => (
    <View>
      <View style={[styles.badge, {backgroundColor: getBadgeColor(statusLabel)}]}>
        <Text style={styles.badgeText} numberOfLines={1}>
          {statusLabel.toUpperCase().replace('PARTIAL PAID', 'PARTIALPAID')}
        </Text>
      </View>
      <Text style={[styles.quoteCode, {fontSize: sp(idSize)}]} numberOfLines={1}>
        [{code}]
      </Text>
      <Text style={[styles.dateText, {fontSize: sp(dateSize)}]} numberOfLines={1}>
        {date}
      </Text>
    </View>
  );

  // Java QuotationListAdapter: 0.65 column (title, "Customer :" row) + 0.35 column ("Amount :" bottom-right).
  const renderQuotationCard = ({item}: {item: QuotationListDTOResultData}) => {
    const statusLabel = getQuoteStatusName(item);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => {
          setSelectedQuotationStatus(statusLabel);
          setSelectedQuotationId(getQuoteId(item));
        }}>
        {cardHeader(statusLabel, getQuoteCode(item), getQuoteDate(item), 11, 12)}
        <View style={styles.cardBody}>
          <View style={[styles.cardLeft, {flex: 0.65}]}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {getQuoteTitle(item)}
            </Text>
            <View style={styles.detailLine}>
              <Text style={styles.detailLabel} numberOfLines={1}>
                Customer :
              </Text>
              <Text style={[styles.detailValue, {color: THEME_PRIMARY}]} numberOfLines={1}>
                {getQuoteCustomerName(item)}
              </Text>
            </View>
          </View>
          <View style={[styles.cardRight, {flex: 0.35, marginRight: scale(2)}]}>
            <Text style={styles.detailLabel} numberOfLines={1}>
              Amount :{' '}
              <Text style={[styles.detailBold, {color: GREEN_500}]}>₹ {formatAmount(getQuoteAmount(item))}</Text>
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Java InvoiceListAdapter: 0.6 column (title, "Cust. Name :", amount row) + 0.4 column ("Pending Amt :", Partial Paid only).
  const renderInvoiceCard = ({item}: {item: InvoiceListDTOResultData}) => {
    const statusLabel = getInvoiceStatusName(item);
    const norm = statusLabel.trim().toLowerCase().replace(/[\s-]/g, '');
    const isPartial = norm === 'partialpaid';
    const isPaid = norm === 'paid';
    const isUnpaid = norm === 'unpaid';
    const amountLabel = isPaid ? 'Paid Amount :' : isPartial ? 'Total Amount :' : 'Pending Amount :';
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => {
          setSelectedInvoiceStatus(statusLabel);
          setSelectedInvoiceTaskName(getInvoiceTitle(item));
          setSelectedInvoiceId(getInvoiceId(item));
        }}>
        {cardHeader(statusLabel, getInvoiceCode(item), getInvoiceDate(item), 12, 11)}
        <View style={styles.cardBody}>
          <View style={[styles.cardLeft, {flex: 0.6}]}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {getInvoiceTitle(item)}
            </Text>
            <View style={styles.detailLine}>
              <Text style={styles.detailLabel} numberOfLines={1}>
                Cust. Name :
              </Text>
              <Text style={[styles.detailValue, {color: THEME_PRIMARY}]} numberOfLines={1}>
                {getInvoiceCustomerName(item)}
              </Text>
            </View>
            <View style={styles.detailLine}>
              <Text style={[styles.detailLabel, isUnpaid && {color: '#ff4a4a'}]} numberOfLines={1}>
                {amountLabel}
              </Text>
              <Text style={[styles.detailValue, styles.detailBold, {color: isUnpaid ? THEME_PRIMARY : GREEN_500}]} numberOfLines={1}>
                ₹ {formatAmount(getInvoiceAmount(item))}
              </Text>
            </View>
          </View>
          <View style={[styles.cardRight, {flex: 0.4, alignItems: 'flex-start'}]}>
            {isPartial ? (
              <Text style={[styles.pendingText, {color: '#ff9b00'}]} numberOfLines={1}>
                Pending Amt :{' '}
                <Text style={[styles.detailBold, {color: THEME_PRIMARY, fontSize: sp(12)}]}>
                  ₹ {formatAmount(Number((item as any).RemainingAmount ?? 0))}
                </Text>
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const listData = activeTab === 'quotation' ? quotations : invoices;

  const renderEmpty = () =>
    isInitialLoading ? null : (
      // Java: ic_noresultfound, 200x200, centred.
      <View style={styles.emptyBox}>
        <Image
          source={require('../../../assets/images/noresultfound.png')}
          style={styles.emptyImage}
          resizeMode="contain"
        />
      </View>
    );

  if (selectedQuotationId !== null) {
    return (
      <QuotationDetailsScreen
        ownerId={ownerId}
        quotationId={selectedQuotationId}
        initialStatusLabel={selectedQuotationStatus}
        onBack={() => setSelectedQuotationId(null)}
        onDeleted={() => {
          setSelectedQuotationId(null);
          fetchPage({nextPage: PAGE_START, replace: true});
        }}
        onUpdated={() => {
          setSelectedQuotationId(null);
          fetchPage({nextPage: PAGE_START, replace: true});
        }}
      />
    );
  }

  if (selectedInvoiceId !== null) {
    return (
      <InvoiceDetailsScreen
        ownerId={ownerId}
        invoiceId={selectedInvoiceId}
        initialStatusLabel={selectedInvoiceStatus}
        initialTaskName={selectedInvoiceTaskName}
        onBack={() => setSelectedInvoiceId(null)}
        onDeleted={() => {
          setSelectedInvoiceId(null);
          fetchPage({nextPage: PAGE_START, replace: true});
        }}
        onUpdated={() => {
          setSelectedInvoiceId(null);
          fetchPage({nextPage: PAGE_START, replace: true});
        }}
      />
    );
  }

  return (
    <View style={[styles.screen, {paddingTop: vs(11)}]}>
      {/* The menu/title/notification row used to be drawn here; it's now
          the shared AppHeader rendered once by AdminTabs, above
          AdminHomeScreen (which this screen is embedded in). */}
      <TabStrip
        tabs={[
          { key: 'quotation', label: 'QUOTATION' },
          { key: 'invoice', label: 'INVOICE' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <View style={styles.searchRow}>
        <UnderlineSearch
          value={searchText}
          onChangeText={v => {
            setSearchText(v);
            if (!v.trim() && submittedSearch) setSubmittedSearch('');
          }}
          onSubmitEditing={submitSearch}
          maxLength={10}
          fontSize={sp(16)}
          placeholder={activeTab === 'quotation' ? 'Customer Name,Quote Id' : 'Search By Invoice Id, Customer name'}
          style={styles.searchFlex}
        />
        <TouchableOpacity
          style={styles.addQuoteButton}
          onPress={() => (activeTab === 'quotation' ? setIsAddQuoteModalOpen(true) : setIsAddInvoiceModalOpen(true))}>
          <Text style={styles.addQuoteButtonText}>{activeTab === 'quotation' ? '+ Quote' : '+ Invoice'}</Text>
        </TouchableOpacity>
      </View>

      <Pressable
        style={styles.statusSelector}
        onLayout={e => setStatusSelectorY(e.nativeEvent.layout.y)}
        onPress={() => setIsStatusModalOpen(true)}>
        <Text style={styles.statusSelectorText} numberOfLines={1}>
          {selectedStatus.label}
        </Text>
        <Ionicons name="chevron-down" style={styles.statusSelectorChevron} />
      </Pressable>

      {isInitialLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={THEME_PRIMARY} size="large" />
        </View>
      ) : (
        <FlatList
          data={listData as (QuotationListDTOResultData | InvoiceListDTOResultData)[]}
          keyExtractor={(item, index) =>
            activeTab === 'quotation'
              ? String(getQuoteId(item as QuotationListDTOResultData) || index)
              : String(getInvoiceId(item as InvoiceListDTOResultData) || index)
          }
          renderItem={
            activeTab === 'quotation'
              ? (renderQuotationCard as any)
              : (renderInvoiceCard as any)
          }
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
              onRefresh={() => fetchPage({nextPage: PAGE_START, replace: true, refreshing: true})}
            />
          }
          onEndReachedThreshold={0.35}
          onEndReached={() => {
            if (!isInitialLoading && !isLoadingMore && !isLastPage) {
              fetchPage({nextPage: pageIndex + 1, replace: false});
            }
          }}
        />
      )}

      {isStatusModalOpen ? (
        // Java: a plain Spinner dropdown (simple_spinner_dropdown_item) anchored over the spinner,
        // no title and no dimmed backdrop.
        <Pressable style={styles.statusModalOverlay} onPress={() => setIsStatusModalOpen(false)}>
          <View style={[styles.statusModalSheet, {top: statusSelectorY}]}>
            {statusOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.statusModalItem}
                onPress={() => {
                  setSelectedStatus(option);
                  setSearchText('');
                  setSubmittedSearch('');
                  setIsStatusModalOpen(false);
                }}>
                <Text style={styles.statusModalItemText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      ) : null}

      <AddQuoteModal
        visible={isAddQuoteModalOpen}
        ownerId={ownerId}
        onClose={() => setIsAddQuoteModalOpen(false)}
        onSuccess={() => fetchPage({nextPage: PAGE_START, replace: true})}
      />
      <AddQuoteModal
        mode="invoice"
        visible={isAddInvoiceModalOpen}
        ownerId={ownerId}
        onClose={() => setIsAddInvoiceModalOpen(false)}
        onSuccess={() => fetchPage({nextPage: PAGE_START, replace: true})}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: HEADER_PRIMARY,
    paddingHorizontal: scale(12),
    paddingVertical: vs(14),
  },
  headerIconButton: {
    padding: scale(4),
  },
  headerIconText: {
    color: '#FFFFFF',
    fontSize: sp(18),
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: sp(18),
    fontWeight: '700',
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: scale(16),
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#eceef0',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: vs(12),
  },
  tabButtonText: {
    fontSize: sp(13),
    fontWeight: '700',
    color: '#8a8f98',
    letterSpacing: 0.5,
  },
  tabButtonTextActive: {
    color: THEME_PRIMARY,
  },
  tabButtonUnderline: {
    marginTop: vs(8),
    height: 2,
    width: '60%',
    backgroundColor: THEME_PRIMARY,
  },
  searchFlex: {flex: 1},
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: scale(20),
    paddingRight: scale(16),
    paddingTop: vs(15.5),
    gap: scale(12),
    backgroundColor: '#FFFFFF',
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f2f4',
    borderRadius: scale(20),
    paddingHorizontal: scale(12),
    height: vs(40),
    minHeight: vs(36),
  },
  searchIcon: {
    fontSize: sp(14),
    marginRight: scale(6),
    color: '#8a8f98',
  },
  searchInput: {
    flex: 1,
    fontSize: sp(13),
    color: '#222',
    padding: 0,
  },
  searchClearIcon: {
    fontSize: sp(14),
    color: '#8a8f98',
    paddingLeft: scale(6),
  },
  addQuoteButton: {
    backgroundColor: '#1c1c1e',
    width: scale(60),
    height: scale(30),
    borderRadius: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addQuoteButtonText: {
    color: '#FFFFFF',
    fontSize: sp(12),
  },
  statusSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: vs(10),
    backgroundColor: '#FFFFFF',
  },
  statusSelectorText: {
    fontSize: sp(16),
    color: '#000',
    marginRight: scale(20),
    flexShrink: 1,
  },
  statusSelectorChevron: {
    fontSize: sp(22),
    color: THEME_PRIMARY,
  },
  listContent: {
    padding: scale(12),
    paddingTop: vs(4),
    paddingBottom: vs(110),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(10),
    marginBottom: vs(14),
    marginHorizontal: scale(4),
    borderWidth: 1,
    borderColor: '#eeeeee',
    overflow: 'hidden',
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(8),
  },
  badge: {
    borderBottomRightRadius: scale(10),
    paddingHorizontal: scale(15),
    paddingVertical: vs(3),
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: sp(9),
  },
  quoteCode: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: vs(5),
    textAlign: 'center',
    color: BLUE_CODE,
    fontSize: sp(12),
    fontWeight: '700',
  },
  dateText: {
    position: 'absolute',
    right: scale(8),
    top: vs(5),
    color: '#535353',
    fontSize: sp(11),
    fontWeight: '700',
  },
  cardBody: {
    flexDirection: 'row',
    marginHorizontal: scale(10),
  },
  cardLeft: {
    marginTop: vs(5),
    marginBottom: vs(14),
  },
  cardRight: {
    marginTop: vs(5),
    marginBottom: vs(14),
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  cardTitle: {
    color: '#1d2536',
    fontSize: sp(16),
    fontWeight: '700',
    paddingLeft: scale(5),
    marginBottom: vs(1),
  },
  detailLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(5),
  },
  detailLabel: {
    color: '#1d2536',
    fontSize: sp(12),
    paddingLeft: scale(5),
  },
  detailValue: {
    fontSize: sp(12),
    paddingLeft: scale(10),
  },
  detailBold: {
    fontWeight: '700',
  },
  pendingText: {
    fontSize: sp(12),
  },
  emptyBox: {
    paddingTop: vs(60),
    alignItems: 'center',
  },
  emptyImage: {
    width: scale(200),
    height: scale(200),
    marginBottom: vs(30),
  },
  emptyText: {
    color: '#8a8f98',
    fontSize: sp(13),
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listFooter: {
    paddingVertical: vs(16),
    alignItems: 'center',
  },
  statusModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  statusModalSheet: {
    position: 'absolute',
    left: scale(10),
    minWidth: scale(150),
    backgroundColor: '#FAFAFA',
    borderRadius: 2,
    elevation: 8,
  },
  statusModalItem: {
    height: vs(48),
    justifyContent: 'center',
    paddingHorizontal: scale(8),
  },
  statusModalItemText: {
    fontSize: sp(16),
    color: '#000',
  },
});

export default AccountsScreen;