import TabStrip from '../../components/TabStrip';
import PassbookSummary from '../../components/PassbookSummary';
import {usePassbook} from '../../hooks/usePassbook';
import UnderlineSearch from '../../components/UnderlineSearch';
import {AddBalIcon, DecBalIcon} from '../../components/JavaIcons';
import {COLORS} from '../../theme/theme';
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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  type ExpenseTechnicianItem,
  type ExpenseTechnicianListResponse,
} from './adminLegacyApiTypes';
import { getExpenseUserList } from '../../api/expenditure/expenditureService';
import ManageBalanceModal from './ManageBalanceModal';
import TechnicianExpenseDetails from './TechnicianExpenseDetailsModal';

import {useTranslation} from 'react-i18next';
import { tr } from '../../i18n/tr';
type PassbookExpenditureTabHostScreenProps = {
  userId: number;
};

type MainTab = 'passbook' | 'expenditure';

const THEME_PRIMARY = '#c3002f';
const DEFAULT_PROFILE_ICON = require('../../../assets/images/profile_icon.png');

// Java: Picasso placeholder + error both use R.drawable.profile_icon.
const TechnicianAvatar = ({uri}: {uri?: string}) => {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      source={uri && !failed ? {uri} : DEFAULT_PROFILE_ICON}
      style={styles.technicianAvatar}
      onError={() => setFailed(true)}
    />
  );
};

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
  const {t} = useTranslation();
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
        <TechnicianAvatar uri={photo} />
        <View style={styles.technicianInfo}>
          <Text style={styles.technicianName}>{getTechnicianName(item)}</Text>
          <Text style={styles.technicianRole} numberOfLines={1}>
            {getTechnicianRole(item)}
          </Text>
        </View>
        <Pressable
          hitSlop={8}
          style={styles.balanceIcon}
          onPress={() => openBalanceModal('deduct', getTechnicianId(item))}>
          <DecBalIcon size={ms(30)} color={COLORS.statusRejected} />
        </Pressable>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.balanceText}>
          {formatMoney(getTechnicianBalance(item))}
        </Text>
        <Pressable
          hitSlop={8}
          style={styles.balanceIcon}
          onPress={() => openBalanceModal('add', getTechnicianId(item))}>
          <AddBalIcon size={ms(30)} color={COLORS.green500} />
        </Pressable>
      </TouchableOpacity>
    );
  };

  const renderExpenditure = () => (
    <View style={styles.expenditurePane}>
      <View style={styles.expenseSearchRow}>
        <UnderlineSearch
          value={expenseSearch}
          onChangeText={setExpenseSearch}
          placeholder={t('rn_search')}
          style={styles.expenseSearchBox}
        />
        <Pressable
          style={styles.balanceButton}
          onPress={() => openBalanceModal('add')}>
          <Text style={styles.balanceButtonText}>{t('plus_balance')}</Text>
        </Pressable>
      </View>

      {isExpenseLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={THEME_PRIMARY} />
          <Text style={styles.loadingText}>{t('rn_loading_expenditure')}</Text>
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
              <Text style={styles.emptyTitle}>{t('rn_unable_to_load_expenditure')}</Text>
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

  // Java ExpenseDetailsFragment replaces the list in place (toolbar + bottom bar stay).
  if (expenseTechnician) {
    return (
      <View style={styles.shell}>
        <TechnicianExpenseDetails
          technician={expenseTechnician}
          onClose={() => setExpenseTechnician(null)}
        />
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <TabStrip
        tabs={[
          {key: 'passbook', label: tr('PASSBOOK')},
          {key: 'expenditure', label: tr('EXPENDITURE')},
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
  expenditurePane: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  expenseSearchRow: {
    paddingHorizontal: ms(10),
    paddingTop: ms(15),
    paddingBottom: ms(5),
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseSearchBox: {
    flex: 1,
    marginRight: ms(10),
  },
  balanceButton: {
    height: ms(30),
    width: ms(70),
    borderRadius: ms(15),
    backgroundColor: COLORS.textBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceButtonText: {
    color: '#FFFFFF',
    fontSize: sp(12),
  },
  technicianList: {
    flexGrow: 1,
    paddingHorizontal: ms(5),
    paddingTop: ms(5),
    paddingBottom: ms(24),
  },
  technicianCard: {
    margin: ms(5),
    borderRadius: ms(10),
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ms(10),
    paddingRight: ms(10),
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
  },
  technicianAvatar: {
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    margin: ms(5),
  },
  technicianInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: ms(5),
  },
  technicianName: {
    color: COLORS.darkGray,
    fontSize: sp(16),
    fontWeight: '700',
    paddingLeft: ms(5),
  },
  technicianRole: {
    marginTop: ms(2),
    color: COLORS.authText,
    fontSize: sp(12),
    paddingLeft: ms(5),
  },
  balanceIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceText: {
    width: ms(100),
    textAlign: 'center',
    color: COLORS.darkGray,
    fontSize: sp(14),
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