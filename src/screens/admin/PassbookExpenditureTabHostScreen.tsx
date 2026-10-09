import TabStrip from '../../components/TabStrip';
import PassbookSummary from '../../components/PassbookSummary';
import {usePassbook} from '../../hooks/usePassbook';
import MonthYearPickerDialog from '../../components/MonthYearPickerDialog';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ms, sp} from '../../utils/responsive';
import {formatAmount} from '../../utils/decimal';
import {
  ActivityIndicator,

  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from '../../components/AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  type ExpenseTechnicianItem,
  type ExpenseTechnicianListResponse,
} from './adminLegacyApiTypes';
import { getExpenseUserList } from '../../api/expenditure/expenditureService';
import ManageBalanceModal from './ManageBalanceModal';
import TechnicianExpenseDetailsModal from './TechnicianExpenseDetailsModal';

type PassbookExpenditureTabHostScreenProps = {
  userId: number;
};

type MainTab = 'passbook' | 'expenditure';

const THEME_PRIMARY = '#c3002f';
const LIGHT_PRIMARY = '#ffc3cf';
const DEFAULT_PROFILE_ICON = require('../../../assets/images/image.png');

const getCode = (response: {code?: string; Code?: string}) =>
  String(response.code ?? response.Code ?? '');

const getMessage = (response: {message?: string; Message?: string}) =>
  String(response.message ?? response.Message ?? '').trim();

const isSuccessOrNoData = (response: ExpenseTechnicianListResponse) => {
  const code = getCode(response);
  return code === '200' || code === '';
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value: number) => `₹ ${formatAmount(value)}`;

const getExpenseString = (
  item: ExpenseTechnicianItem,
  keys: Array<keyof ExpenseTechnicianItem>,
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

const getExpenseNumber = (
  item: ExpenseTechnicianItem,
  keys: Array<keyof ExpenseTechnicianItem>,
) => {
  for (const key of keys) {
    const parsed = toNumber(item[key]);
    if (parsed !== 0 || item[key] === 0 || item[key] === '0') {
      return parsed;
    }
  }

  return 0;
};

const getTechnicianId = (item: ExpenseTechnicianItem) =>
  getExpenseNumber(item, ['userId', 'UserId']);

const getTechnicianName = (item: ExpenseTechnicianItem) => {
  const fullName = `${getExpenseString(item, ['firstName', 'FirstName'])} ${getExpenseString(
    item,
    ['lastName', 'LastName'],
  )}`.trim();

  return (
    getExpenseString(item, ['employeeName', 'EmployeeName', 'userName', 'UserName']) ||
    getExpenseString(item, ['name', 'Name']) ||
    fullName ||
    'Fieldworker'
  );
};

const getTechnicianRole = (item: ExpenseTechnicianItem) =>
  getExpenseString(item, ['role', 'Role', 'userGroupName', 'UserGroupName']) ||
  'Fieldworker';

const getTechnicianBalance = (item: ExpenseTechnicianItem) =>
  getExpenseNumber(item, [
    'remainingBalance',
    'RemainingBalance',
    'balance',
    'Balance',
  ]);

const getTechnicianPhoto = (item: ExpenseTechnicianItem) =>
  getExpenseString(item, ['profileImage', 'ProfileImage', 'photo', 'Photo']);

const PassbookExpenditureTabHostScreen = ({
  userId,
}: PassbookExpenditureTabHostScreenProps) => {
  const [activeTab, setActiveTab] = useState<MainTab>('passbook');
  const [expenseTechnician, setExpenseTechnician] = useState<{id: number; name: string} | null>(null);
  const passbook = usePassbook(userId);

  const [technicians, setTechnicians] = useState<ExpenseTechnicianItem[]>([]);
  const [expenseSearch, setExpenseSearch] = useState('');
  const [isExpenseLoading, setIsExpenseLoading] = useState(false);
  const [expenseError, setExpenseError] = useState('');
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceModalMode, setBalanceModalMode] = useState<'add' | 'deduct'>('add');
  const [balanceModalTechnicianId, setBalanceModalTechnicianId] = useState<number | null>(null);
  const latestExpenseRequestId = useRef(0);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    // Show exactly 2 years: current year and the previous year
    return [currentYear, currentYear - 1];
  }, []);

  const openBalanceModal = (
    mode: 'add' | 'deduct',
    technicianId: number | null = null,
  ) => {
    setBalanceModalMode(mode);
    setBalanceModalTechnicianId(technicianId);
    setIsBalanceModalOpen(true);
  };

  const closeBalanceModal = () => {
    setIsBalanceModalOpen(false);
  };

  const handleBalanceModalSuccess = () => {
    loadExpenseTechnicians(true);
  };

  const loadExpenseTechnicians = useCallback(
    async (refreshing = false) => {
      if (!refreshing) {
        setIsExpenseLoading(true);
      }
      setExpenseError('');
      const requestId = latestExpenseRequestId.current + 1;
      latestExpenseRequestId.current = requestId;

      try {
        const response = (await getExpenseUserList({ OwnerId: userId })) as ExpenseTechnicianListResponse;

        if (requestId !== latestExpenseRequestId.current) {
          return;
        }

        if (!isSuccessOrNoData(response)) {
          throw new Error(getMessage(response) || 'Unable to load expenditure.');
        }

        setTechnicians(response.resultData ?? response.ResultData ?? []);
      } catch (error) {
        if (requestId !== latestExpenseRequestId.current) {
          return;
        }
        setTechnicians([]);
        setExpenseError(
          error instanceof Error ? error.message : 'Unable to load expenditure.',
        );
      } finally {
        if (requestId === latestExpenseRequestId.current) {
          setIsExpenseLoading(false);
        }
      }
    },
    [userId],
  );

  useEffect(() => {
    if (activeTab === 'expenditure' && technicians.length === 0 && !expenseError) {
      loadExpenseTechnicians();
    }
  }, [
    activeTab,
    expenseError,
    loadExpenseTechnicians,
    technicians.length,
  ]);

  const filteredTechnicians = useMemo(() => {
    const query = expenseSearch.trim().toLowerCase();
    if (!query) {
      return technicians;
    }

    return technicians.filter(item =>
      getTechnicianName(item).toLowerCase().includes(query),
    );
  }, [expenseSearch, technicians]);

  const renderPassbook = () => (
    <PassbookSummary
      period={passbook.period}
      onSelectPeriod={passbook.selectPeriod}
      title={passbook.title}
      fields={passbook.fields}
      loading={passbook.loading}
      onPrev={() => passbook.shift(-1)}
      onNext={() => passbook.shift(1)}
      prevDisabled={passbook.period === 'today'}
      nextDisabled={passbook.period === 'today' || passbook.forwardBlocked}
    />
  );

  const renderTechnician = ({item}: {item: ExpenseTechnicianItem}) => {
    const photo = getTechnicianPhoto(item);
    return (
      <TouchableOpacity
        activeOpacity={0.78}
        style={styles.technicianCard}
        onPress={() =>
          // ExpenseTechnicianListFragment.onClick -> ExpenseDetailsFragment.
          setExpenseTechnician({id: getTechnicianId(item), name: getTechnicianName(item)})
        }>
        <Image
          source={photo ? {uri: photo} : DEFAULT_PROFILE_ICON}
          style={styles.technicianAvatar}
        />
        <View style={styles.technicianInfo}>
          <Text numberOfLines={1} style={styles.technicianName}>
            {getTechnicianName(item)}
          </Text>
          <Text numberOfLines={1} style={styles.technicianRole}>
            {getTechnicianRole(item)}
          </Text>
        </View>
        <Pressable
          style={styles.minusButton}
          onPress={() => openBalanceModal('deduct', getTechnicianId(item))}>
          <Text style={styles.minusText}>-</Text>
        </Pressable>
        <Text numberOfLines={1} style={styles.balanceText}>
          {formatMoney(getTechnicianBalance(item))}
        </Text>
        <Pressable
          style={styles.plusButton}
          onPress={() => openBalanceModal('add', getTechnicianId(item))}>
          <Text style={styles.plusText}>+</Text>
        </Pressable>
      </TouchableOpacity>
    );
  };

  const renderExpenditure = () => (
    <View style={styles.expenditurePane}>
      <View style={styles.expenseSearchRow}>
        <View style={styles.expenseSearchBox}>
          <Text style={styles.searchIcon}>Search</Text>
          <TextInput
            value={expenseSearch}
            onChangeText={setExpenseSearch}
            placeholder="Search"
            placeholderTextColor="#9CA3AF"
            style={styles.expenseSearchInput}
          />
          {expenseSearch ? (
            <Pressable hitSlop={10} onPress={() => setExpenseSearch('')}>
              <Text style={styles.searchClear}>x</Text>
            </Pressable>
          ) : null}
        </View>
        <Pressable
          style={styles.balanceButton}
          onPress={() => openBalanceModal('add')}>
          <Text style={styles.balanceButtonText}>+ Balance</Text>
        </Pressable>
      </View>

      {isExpenseLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={THEME_PRIMARY} />
          <Text style={styles.loadingText}>Loading expenditure...</Text>
        </View>
      ) : null}

      {expenseError ? <Text style={styles.errorText}>{expenseError}</Text> : null}

      <FlatList
        data={filteredTechnicians}
        keyExtractor={(item, index) => `${getTechnicianId(item) || index}-${index}`}
        renderItem={renderTechnician}
        contentContainerStyle={styles.technicianList}
        refreshControl={
          <RefreshControl
            refreshing={isExpenseLoading}
            colors={[THEME_PRIMARY]}
            tintColor={THEME_PRIMARY}
            onRefresh={() => loadExpenseTechnicians(true)}
          />
        }
        ListEmptyComponent={
          isExpenseLoading ? null : expenseError ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Unable to Load Expenditure</Text>
              <Text style={styles.emptyText}>{expenseError}</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Image
                source={require('../../../assets/images/noresultfound.png')}
                style={styles.emptyImage}
                resizeMode="contain"
              />
            </View>
          )
        }
      />
    </View>
  );

  return (
    <View style={styles.shell}>
      <TabStrip
        tabs={[
          {key: 'passbook', label: 'PASSBOOK'},
          {key: 'expenditure', label: 'EXPENDITURE'},
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />
      {activeTab === 'passbook' ? renderPassbook() : renderExpenditure()}

      {/* Java: Util/MonthYearPickerDialog (Monthly: current year and one before; Yearly: current and two before) */}
      <MonthYearPickerDialog
        visible={passbook.pickerFor !== null}
        yearOnly={passbook.pickerFor === 'yearly'}
        minYear={new Date().getFullYear() - (passbook.pickerFor === 'yearly' ? 2 : 1)}
        maxYear={new Date().getFullYear()}
        activatedMonth={new Date().getMonth()}
        activatedYear={new Date().getFullYear()}
        onCancel={passbook.cancelPicker}
        onConfirm={passbook.confirmPicker}
      />

      <TechnicianExpenseDetailsModal
        technician={expenseTechnician}
        onClose={() => setExpenseTechnician(null)}
      />
      <ManageBalanceModal
        visible={isBalanceModalOpen}
        userId={userId}
        initialMode={balanceModalMode}
        initialTechnicianId={balanceModalTechnicianId}
        onClose={closeBalanceModal}
        onSuccess={handleBalanceModalSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topTabBar: {
    height: ms(86),
    backgroundColor: '#F7F7F7',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 0,
    marginTop: ms(-30),
  },
  topTabButton: {
    minWidth: ms(200),
    height: ms(50),
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: ms(4),
    borderBottomColor: 'transparent',
  },
  topTabActive: {
    backgroundColor: '#FFF3F5',
    borderBottomColor: THEME_PRIMARY,
  },
  topTabText: {
    color: '#777777',
    fontSize: sp(15),
    fontWeight: '800',
  },
  topTabTextActive: {
    color: THEME_PRIMARY,
  },
  passbookScroll: {
    flexGrow: 1,
    paddingBottom: ms(112),
  },
  periodRow: {
    height: ms(72),
    paddingHorizontal: ms(8),
    paddingTop: ms(22),
    flexDirection: 'row',
    gap: ms(14),
  },
  periodButton: {
    flex: 1,
    height: ms(42),
    borderRadius: ms(8),
    borderWidth: ms(1),
    borderColor: '#E2E2E2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: THEME_PRIMARY,
    borderColor: THEME_PRIMARY,
  },
  periodText: {
    color: '#111111',
    fontSize: sp(19),
    fontWeight: '900',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  earningsPanel: {
    flex: 1,
    minHeight: ms(620),
    borderTopLeftRadius: ms(56),
    borderTopRightRadius: ms(56),
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  earningHeaderRow: {
    minHeight: ms(138),
    paddingHorizontal: ms(46),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodArrow: {
    color: '#111111',
    fontSize: sp(34),
    lineHeight: sp(36),
    fontWeight: '900',
  },
  earningTitleBlock: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: ms(18),
  },
  earningTitle: {
    color: '#222222',
    fontSize: sp(24),
    textAlign: 'center',
  },
  earningAmount: {
    marginTop: ms(8),
    color: '#111111',
    fontSize: sp(28),
    fontWeight: '900',
  },
  loadingRow: {
    paddingVertical: ms(16),
    alignItems: 'center',
  },
  loadingText: {
    marginTop: ms(7),
    color: '#4B5563',
    fontSize: sp(13),
  },
  errorText: {
    marginHorizontal: ms(22),
    marginBottom: ms(10),
    color: '#B42318',
    fontSize: sp(13),
    fontWeight: '700',
  },
  summaryCard: {
    minHeight: ms(440),
    marginTop: 0,
    paddingHorizontal: ms(44),
    paddingTop: ms(30),
    borderTopLeftRadius: ms(54),
    borderTopRightRadius: ms(54),
    backgroundColor: LIGHT_PRIMARY,
  },
  progressTrack: {
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: 'rgba(255,255,255,0.72)',
    overflow: 'hidden',
  },
  progressFill: {
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: THEME_PRIMARY,
  },
  estimatedRow: {
    marginTop: ms(32),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  estimatedText: {
    color: '#111111',
    fontSize: sp(16),
  },
  estimatedAmount: {
    fontWeight: '900',
  },
  progressText: {
    color: THEME_PRIMARY,
    fontSize: sp(16),
    fontWeight: '900',
  },
  summaryPrimaryRow: {
    marginTop: ms(44),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryPrimaryLabel: {
    color: '#111111',
    fontSize: sp(22),
    fontWeight: '900',
  },
  summaryPrimaryValue: {
    color: '#111111',
    fontSize: sp(21),
    fontWeight: '900',
  },
  summaryDivider: {
    height: ms(1),
    marginTop: ms(17),
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  summaryRow: {
    minHeight: ms(44),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: '#111111',
    fontSize: sp(18),
  },
  summaryValue: {
    color: '#111111',
    fontSize: sp(18),
    fontWeight: '900',
  },
  expenditurePane: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  expenseSearchRow: {
    minHeight: ms(74),
    paddingHorizontal: ms(20),
    paddingTop: ms(22),
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseSearchBox: {
    flex: 1,
    minHeight: ms(42),
    borderBottomWidth: ms(1),
    borderBottomColor: '#BBBBBB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    color: '#B9B9B9',
    fontSize: sp(13),
    fontWeight: '800',
    marginRight: ms(12),
  },
  expenseSearchInput: {
    flex: 1,
    minHeight: ms(42),
    paddingVertical: 0,
    color: '#111111',
    fontSize: sp(18),
  },
  searchClear: {
    color: '#555555',
    fontSize: sp(32),
    lineHeight: sp(34),
  },
  balanceButton: {
    height: ms(38),
    minWidth: ms(82),
    marginLeft: ms(10),
    borderRadius: ms(9),
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(8),
  },
  balanceButtonText: {
    color: '#FFFFFF',
    fontSize: sp(13),
    fontWeight: '900',
  },
  technicianList: {
    flexGrow: 1,
    paddingHorizontal: ms(18),
    paddingTop: ms(8),
    paddingBottom: ms(24),
  },
  technicianCard: {
    minHeight: ms(96),
    marginBottom: ms(14),
    borderRadius: ms(10),
    borderWidth: ms(1),
    borderColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(18),
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
  },
  technicianAvatar: {
    width: ms(58),
    height: ms(58),
    borderRadius: ms(29),
    backgroundColor: '#E8EAF5',
  },
  technicianInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: ms(24),
  },
  technicianName: {
    color: '#555555',
    fontSize: sp(15),
    fontWeight: '700',
  },
  technicianRole: {
    marginTop: ms(3),
    color: '#777777',
    fontSize: sp(11),
  },
  minusButton: {
    width: ms(25),
    height: ms(20),
    borderRadius: ms(7),
    borderWidth: ms(2),
    borderColor: THEME_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minusText: {
    color: THEME_PRIMARY,
    fontSize: sp(18),
    lineHeight: sp(15),
    fontWeight: '900',
  },
  balanceText: {
    width: ms(100),
    textAlign: 'center',
    color: '#666666',
    fontSize: sp(12),
  },
  plusButton: {
    width: ms(25),
    height: ms(20),
    borderRadius: ms(7),
    borderWidth: ms(2),
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    color: '#4CAF50',
    fontSize: sp(18),
    lineHeight: sp(15),
    fontWeight: '900',
  },
  emptyState: {
    flex: 1,
    minHeight: ms(320),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(24),
  },
  emptyImage: {
    width: ms(220),
    height: ms(220),
  },
  emptyTitle: {
    color: '#111827',
    fontSize: sp(18),
    fontWeight: '800',
  },
  emptyText: {
    marginTop: ms(8),
    color: '#6B7280',
    fontSize: sp(13),
    lineHeight: sp(19),
    textAlign: 'center',
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(28),
  },
  pickerPanel: {
    width: '100%',
    maxWidth: ms(340),
    borderRadius: ms(4),
    backgroundColor: '#FFFFFF',
    paddingTop: ms(28),
    overflow: 'hidden',
  },
  pickerTitle: {
    color: '#111111',
    fontSize: sp(22),
    fontWeight: '900',
    textAlign: 'center',
  },
  pickerBody: {
    flexDirection: 'row',
    gap: ms(16),
    paddingHorizontal: ms(44),
    paddingTop: ms(24),
    paddingBottom: ms(26),
  },
  pickerColumn: {
    flex: 1,
    minWidth: 0,
  },
  pickerColumnTitle: {
    color: '#6B7280',
    fontSize: sp(13),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: ms(8),
  },
  pickerList: {
    maxHeight: ms(176),
  },
  pickerItem: {
    height: ms(48),
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: ms(1),
    borderBottomWidth: ms(1),
    borderColor: 'transparent',
  },
  pickerItemSelected: {
    borderColor: '#888888',
  },
  pickerItemText: {
    color: '#B2B2B2',
    fontSize: sp(17),
  },
  pickerItemTextSelected: {
    color: '#444444',
  },
  pickerFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: ms(34),
    paddingBottom: ms(32),
    gap: ms(24),
  },
  pickerCancelButton: {
    minWidth: ms(92),
    height: ms(44),
    borderRadius: ms(2),
    backgroundColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  pickerCancelText: {
    color: '#222222',
    fontSize: sp(15),
    fontWeight: '800',
  },
  pickerOkButton: {
    minWidth: ms(92),
    height: ms(44),
    borderRadius: ms(2),
    backgroundColor: THEME_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  pickerOkText: {
    color: '#FFFFFF',
    fontSize: sp(15),
    fontWeight: '900',
  },
});

export default PassbookExpenditureTabHostScreen;