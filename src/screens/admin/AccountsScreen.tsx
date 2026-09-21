// src/screens/admin/AccountsScreen.tsx

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ms, sp} from '../../utils/responsive';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {getQuotationList} from '../../api/quotation/quotationService';
import type {QuotationListDTOResultData} from '../../api/quotation/quotation.types';
import {getInvoiceList} from '../../api/accountManagement/accountManagementService';
import type {InvoiceListDTOResultData} from '../../api/accountManagement/accountManagement.types';
import AddQuoteModal from './AddQuoteModal';
import QuotationDetailsScreen from './QuotationDetailsScreen';
import InvoiceDetailsScreen from './InvoiceDetailsScreen';

const THEME_PRIMARY = '#c3002f';
const HEADER_PRIMARY = '#a80030';
const BLUE_CODE = '#1877F2';
const CORAL_NAME = '#E4574E';
const GREEN_AMOUNT = '#2E7D32';
const BADGE_PURPLE = '#6C4BA5';
const BADGE_ORANGE = '#F4A62A';
const BADGE_GREEN = '#2E7D32';

type AccountsTab = 'quotation' | 'invoice';

type StatusOption = {
  id: number;
  label: string;
};

const QUOTATION_STATUS_OPTIONS: StatusOption[] = [
  {id: 0, label: 'All'},
  {id: 1, label: 'Assigned'},
  {id: 2, label: 'Not Assigned'},
];

const INVOICE_STATUS_OPTIONS: StatusOption[] = [
  {id: 0, label: 'All'},
  {id: 7, label: 'Partial Paid'},
  {id: 8, label: 'Paid'},
];

const PAGE_START = 1;

const getQuoteId = (item: QuotationListDTOResultData) => Number(item.Id ?? 0);

const getQuoteCode = (item: QuotationListDTOResultData) =>
  item.Id ? `Q${item.Id}` : '';

const getQuoteTitle = (item: QuotationListDTOResultData) =>
  String(item.QuoteName ?? '').trim() || 'Quote';

const getQuoteStatusName = (item: QuotationListDTOResultData) => {
  const status = item.Status;
  const statusName = String(status?.StatusName ?? '').trim();
  if (statusName) {
    return statusName;
  }
  const statusId = Number(item.StatusId ?? 0);
  return statusId === 1 ? 'Assigned' : 'Not Assigned';
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
  String(item.InvoiceCode ?? '').trim();

const getInvoiceTitle = (item: InvoiceListDTOResultData) =>
  String(item.QuoteTaskName ?? item.CustomerName ?? '').trim() || 'Invoice';

const getInvoiceCustomerName = (item: InvoiceListDTOResultData) =>
  String(item.CustomerName ?? '').trim() || '-';

const getInvoiceStatusName = (item: InvoiceListDTOResultData) =>
  String(item.StatusName ?? '').trim() || '-';

const getInvoiceAmount = (item: InvoiceListDTOResultData) =>
  Number(item.InvoiceAmount ?? 0);

const getInvoiceDate = (item: InvoiceListDTOResultData) => {
  const raw = String(item.InvoiceDate ?? '').trim();
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

const getBadgeColor = (statusLabel: string) => {
  const normalized = statusLabel.trim().toLowerCase();
  if (normalized === 'assigned' || normalized === 'paid') {
    return normalized === 'paid' ? BADGE_GREEN : BADGE_ORANGE;
  }
  if (normalized === 'partial paid') {
    return BADGE_ORANGE;
  }
  return BADGE_PURPLE;
};

type AccountsScreenProps = {
  ownerId: number;
};

const AccountsScreen = ({ownerId}: AccountsScreenProps) => {
  const [activeTab, setActiveTab] = useState<AccountsTab>('quotation');
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StatusOption>(QUOTATION_STATUS_OPTIONS[0]);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const [quotations, setQuotations] = useState<QuotationListDTOResultData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceListDTOResultData[]>([]);
  const [pageIndex, setPageIndex] = useState(PAGE_START);
  const [isLastPage, setIsLastPage] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddQuoteModalOpen, setIsAddQuoteModalOpen] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(null);
  const [selectedQuotationStatus, setSelectedQuotationStatus] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [selectedInvoiceStatus, setSelectedInvoiceStatus] = useState<string>('');
  const [selectedInvoiceTaskName, setSelectedInvoiceTaskName] = useState<string>('');

  const statusOptions = activeTab === 'quotation' ? QUOTATION_STATUS_OPTIONS : INVOICE_STATUS_OPTIONS;

  useEffect(() => {
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
        <View style={styles.cardTopRow}>
          <View style={[styles.badge, {backgroundColor: getBadgeColor(statusLabel)}]}>
            <Text style={styles.badgeText}>{statusLabel.toUpperCase()}</Text>
          </View>
          <Text style={styles.quoteCode}>[{getQuoteCode(item)}]</Text>
          <Text style={styles.dateText}>{getQuoteDate(item)}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {getQuoteTitle(item)}
        </Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.metaLabel}>
            Customer: <Text style={styles.metaCustomer}>{getQuoteCustomerName(item)}</Text>
          </Text>
          <Text style={styles.metaLabel}>
            Amount: <Text style={styles.metaAmount}>Rs. {getQuoteAmount(item)}</Text>
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderInvoiceCard = ({item}: {item: InvoiceListDTOResultData}) => {
    const statusLabel = getInvoiceStatusName(item);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => {
          setSelectedInvoiceStatus(statusLabel);
          setSelectedInvoiceTaskName(getInvoiceTitle(item));
          setSelectedInvoiceId(getInvoiceId(item));
        }}>
        <View style={styles.cardTopRow}>
          <View style={[styles.badge, {backgroundColor: getBadgeColor(statusLabel)}]}>
            <Text style={styles.badgeText}>{statusLabel.toUpperCase()}</Text>
          </View>
          <Text style={styles.quoteCode}>[{getInvoiceCode(item)}]</Text>
          <Text style={styles.dateText}>{getInvoiceDate(item)}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {getInvoiceTitle(item)}
        </Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.metaLabel}>
            Customer: <Text style={styles.metaCustomer}>{getInvoiceCustomerName(item)}</Text>
          </Text>
          <Text style={styles.metaLabel}>
            Amount: <Text style={styles.metaAmount}>Rs. {getInvoiceAmount(item)}</Text>
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const listData = activeTab === 'quotation' ? quotations : invoices;

  const renderEmpty = () =>
    isInitialLoading ? null : (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>
          No {activeTab === 'quotation' ? 'quotations' : 'invoices'} found.
        </Text>
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
      />
    );
  }

  return (
    <View style={styles.screen}>
      {/* The menu/title/notification row used to be drawn here; it's now
          the shared AppHeader rendered once by AdminTabs, above
          AdminHomeScreen (which this screen is embedded in). */}
      <View style={styles.tabsRow}>
        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('quotation')}>
          <Text
            style={[styles.tabButtonText, activeTab === 'quotation' ? styles.tabButtonTextActive : null]}>
            QUOTATION
          </Text>
          {activeTab === 'quotation' ? <View style={styles.tabButtonUnderline} /> : null}
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabButton} onPress={() => setActiveTab('invoice')}>
          <Text style={[styles.tabButtonText, activeTab === 'invoice' ? styles.tabButtonTextActive : null]}>
            INVOICE
          </Text>
          {activeTab === 'invoice' ? <View style={styles.tabButtonUnderline} /> : null}
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Text style={styles.searchIcon}>{'\uD83D\uDD0D'}</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Customer Name,Quote Id"
            placeholderTextColor="#9aa0a6"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={submitSearch}
            returnKeyType="search"
          />
          {searchText ? (
            <TouchableOpacity onPress={clearSearch}>
              <Text style={styles.searchClearIcon}>{'\u2715'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {activeTab === 'quotation' ? (
          <TouchableOpacity style={styles.addQuoteButton} onPress={() => setIsAddQuoteModalOpen(true)}>
            <Text style={styles.addQuoteButtonText}>+ Quote</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Pressable style={styles.statusSelector} onPress={() => setIsStatusModalOpen(true)}>
        <Text style={styles.statusSelectorText}>{selectedStatus.label}</Text>
        <Text style={styles.statusSelectorChevron}>{'\u2304'}</Text>
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
        <Pressable style={styles.statusModalOverlay} onPress={() => setIsStatusModalOpen(false)}>
          <View style={styles.statusModalSheet}>
            <Text style={styles.statusModalTitle}>Select Status</Text>
            {statusOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.statusModalItem,
                  option.id === selectedStatus.id ? styles.statusModalItemActive : null,
                ]}
                onPress={() => {
                  setSelectedStatus(option);
                  setIsStatusModalOpen(false);
                }}>
                <Text
                  style={[
                    styles.statusModalItemText,
                    option.id === selectedStatus.id ? styles.statusModalItemTextActive : null,
                  ]}>
                  {option.label}
                </Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: HEADER_PRIMARY,
    paddingHorizontal: ms(12),
    paddingVertical: ms(14),
  },
  headerIconButton: {
    padding: ms(4),
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
    gap: ms(16),
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: ms(1),
    borderBottomColor: '#eceef0',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: ms(12),
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
    marginTop: ms(8),
    height: ms(2),
    width: '60%',
    backgroundColor: THEME_PRIMARY,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(12),
    paddingVertical: ms(10),
    gap: ms(8),
    backgroundColor: '#FFFFFF',
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f2f4',
    borderRadius: ms(20),
    paddingHorizontal: ms(12),
    height: ms(40),
  },
  searchIcon: {
    fontSize: sp(14),
    marginRight: ms(6),
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
    paddingLeft: ms(6),
  },
  addQuoteButton: {
    backgroundColor: '#1c1c1e',
    paddingHorizontal: ms(14),
    height: ms(40),
    borderRadius: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addQuoteButtonText: {
    color: '#FFFFFF',
    fontSize: sp(13),
    fontWeight: '700',
  },
  statusSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(16),
    paddingVertical: ms(10),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: ms(1),
    borderBottomColor: '#eceef0',
  },
  statusSelectorText: {
    fontSize: sp(13),
    color: '#222',
    fontWeight: '600',
    marginRight: ms(6),
  },
  statusSelectorChevron: {
    fontSize: sp(14),
    color: '#8a8f98',
  },
  listContent: {
    padding: ms(12),
    paddingBottom: ms(24),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(8),
    padding: ms(12),
    marginBottom: ms(10),
    borderWidth: ms(1),
    borderColor: '#eceef0',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(8),
  },
  badge: {
    borderRadius: ms(4),
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: sp(9),
    fontWeight: '700',
  },
  quoteCode: {
    flex: 1,
    textAlign: 'right',
    color: BLUE_CODE,
    fontSize: sp(12),
    fontWeight: '700',
    marginRight: ms(8),
  },
  dateText: {
    color: '#8a8f98',
    fontSize: sp(11),
  },
  cardTitle: {
    color: '#111111',
    fontSize: sp(15),
    fontWeight: '700',
    marginBottom: ms(6),
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: '#6b7280',
    fontSize: sp(12),
  },
  metaCustomer: {
    color: CORAL_NAME,
    fontWeight: '600',
  },
  metaAmount: {
    color: GREEN_AMOUNT,
    fontWeight: '700',
  },
  emptyBox: {
    paddingTop: ms(60),
    alignItems: 'center',
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
    paddingVertical: ms(16),
    alignItems: 'center',
  },
  statusModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ms(40),
  },
  statusModalSheet: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: ms(360),
    borderRadius: ms(10),
    padding: ms(16),
  },
  statusModalTitle: {
    fontSize: sp(15),
    fontWeight: '700',
    color: '#111111',
    marginBottom: ms(12),
    textAlign: 'center',
  },
  statusModalItem: {
    paddingVertical: ms(12),
    borderRadius: ms(8),
    paddingHorizontal: ms(12),
  },
  statusModalItemActive: {
    backgroundColor: '#fdecef',
  },
  statusModalItemText: {
    fontSize: sp(14),
    color: '#222',
  },
  statusModalItemTextActive: {
    color: THEME_PRIMARY,
    fontWeight: '700',
  },
});

export default AccountsScreen;