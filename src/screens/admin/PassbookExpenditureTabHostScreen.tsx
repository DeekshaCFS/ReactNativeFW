import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ms, sp} from '../../utils/responsive';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  type ExpenseTechnicianItem,
  type ExpenseTechnicianListResponse,
  type MonthlyPassbookData,
  type MonthlyPassbookItem,
  type MonthlyPassbookResponse,
  type PassbookSummaryData,
  type TodayPassbookResponse,
  type YearlyPassbookResponse,
} from './adminLegacyApiTypes';
import { getTodayPassbook, getMonthlyPassbook, getYearlyPassbook } from '../../api/passbook/passbookService';
import { getExpenseUserList } from '../../api/expenditure/expenditureService';
import ManageBalanceModal from './ManageBalanceModal';

type PassbookExpenditureTabHostScreenProps = {
  userId: number;
};

type MainTab = 'passbook' | 'expenditure';
type PassbookPeriod = 'today' | 'monthly' | 'yearly';

type PassbookValues = {
  estimated: number;
  earnings: number;
  credit: number;
  expenses: number;
  received: number;
  remaining: number;
};

const THEME_PRIMARY = '#c3002f';
const LIGHT_PRIMARY = '#ffc3cf';
const DEFAULT_PROFILE_ICON = require('../../../assets/images/image.png');

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

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const emptyPassbookValues: PassbookValues = {
  estimated: 0,
  earnings: 0,
  credit: 0,
  expenses: 0,
  received: 0,
  remaining: 0,
};

const getCode = (response: {code?: string; Code?: string}) =>
  String(response.code ?? response.Code ?? '');

const getMessage = (response: {message?: string; Message?: string}) =>
  String(response.message ?? response.Message ?? '').trim();

const getFriendlyPassbookError = (error: unknown) => {
  const message = error instanceof Error ? error.message.trim() : '';
  
  if (!message) {
    return 'Unable to load passbook data. Please try again.';
  }
  
  if (message.toLowerCase().includes('network')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }
  
  if (message.toLowerCase() === 'request failed') {
    return 'Server error. Please try again later.';
  }

  return message;
};

const isSuccessOrNoData = (
  response:
    | TodayPassbookResponse
    | MonthlyPassbookResponse
    | YearlyPassbookResponse
    | ExpenseTechnicianListResponse,
) => {
  const code = getCode(response);
  return code === '200' || code === '';
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getSummaryNumber = (
  item: PassbookSummaryData | MonthlyPassbookData | null | undefined,
  keys: string[],
) => {
  const record = item as Record<string, unknown> | null | undefined;
  if (!record) {
    return 0;
  }

  for (const key of keys) {
    const parsed = toNumber(record[key]);
    if (parsed !== 0 || record[key] === 0 || record[key] === '0') {
      return parsed;
    }
  }

  return 0;
};

const getTodayData = (response: TodayPassbookResponse) =>
  response.resultData ?? response.ResultData ?? null;

const getMonthlyData = (response: MonthlyPassbookResponse | YearlyPassbookResponse) =>
  response.resultData ?? response.ResultData ?? null;

const getMonthlyItems = (data: MonthlyPassbookData | null): MonthlyPassbookItem[] =>
  data?.monthlyALlDataList ??
  data?.MonthlyALlDataList ??
  data?.monthlyAllDataList ??
  data?.MonthlyAllDataList ??
  [];

const findMonthItem = (
  data: MonthlyPassbookData | null,
  month: number,
  year: number,
) => {
  const monthLabel = MONTH_LABELS[month - 1] ?? '';
  const monthName = MONTH_NAMES[month - 1] ?? '';
  const monthStr = String(month);

  return getMonthlyItems(data).find(item => {
    const itemMonth = String(item.month ?? item.Month ?? '').toLowerCase().trim();
    const itemYear = String(item.year ?? item.Year ?? '').trim();
    
    // Year must match exactly
    if (itemYear !== String(year)) {
      return false;
    }

    // Month can match by various formats
    if (!itemMonth) {
      return false;
    }

    // Try exact month number match
    if (itemMonth === monthStr) {
      return true;
    }

    // Try month label match (e.g., "jan", "feb")
    if (itemMonth.includes(monthLabel.toLowerCase())) {
      return true;
    }

    // Try full month name match (e.g., "january", "february")
    if (itemMonth.includes(monthName.toLowerCase())) {
      return true;
    }

    return false;
  });
};

const valuesFromToday = (data: PassbookSummaryData | null): PassbookValues => ({
  estimated: getSummaryNumber(data, ['earningAmount', 'EarningAmount']),
  earnings: getSummaryNumber(data, ['earningAmount', 'EarningAmount']),
  credit: getSummaryNumber(data, ['credit', 'Credit']),
  expenses: getSummaryNumber(data, ['expenses', 'Expenses']),
  received: getSummaryNumber(data, ['return', 'Return', 'deduction', 'Deduction']),
  remaining: getSummaryNumber(data, ['balance', 'Balance']),
});

const valuesFromMonthly = (
  data: MonthlyPassbookData | null,
  monthItem: MonthlyPassbookItem | undefined,
): PassbookValues => ({
  estimated:
    getSummaryNumber(monthItem, ['estimated', 'Estimated']) ||
    getSummaryNumber(data, ['totalEstimated', 'TotalEstimated']),
  earnings:
    getSummaryNumber(monthItem, ['earning', 'Earning', 'earned', 'Earned']) ||
    getSummaryNumber(data, ['totalEarned', 'TotalEarned']),
  credit: getSummaryNumber(data, ['totalCredit', 'TotalCredit']),
  expenses:
    getSummaryNumber(monthItem, ['expenses', 'Expenses']) ||
    getSummaryNumber(data, ['totalExpenses', 'TotalExpenses']),
  received: getSummaryNumber(data, ['totalDeduction', 'TotalDeduction']),
  remaining: getSummaryNumber(data, ['totalOpening', 'TotalOpening']),
});

const valuesFromYearly = (data: MonthlyPassbookData | null): PassbookValues => ({
  estimated: getSummaryNumber(data, ['totalEstimated', 'TotalEstimated']),
  earnings: getSummaryNumber(data, ['totalEarned', 'TotalEarned']),
  credit: getSummaryNumber(data, ['totalCredit', 'TotalCredit']),
  expenses: getSummaryNumber(data, ['totalExpenses', 'TotalExpenses']),
  received: getSummaryNumber(data, ['totalDeduction', 'TotalDeduction']),
  remaining: getSummaryNumber(data, ['totalOpening', 'TotalOpening']),
});

const formatMoney = (value: number) => `Rs. ${value}`;

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

const getDefaultMonthYear = () => {
  const date = new Date();
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
};

const PassbookExpenditureTabHostScreen = ({
  userId,
}: PassbookExpenditureTabHostScreenProps) => {
  const [activeTab, setActiveTab] = useState<MainTab>('passbook');
  const [period, setPeriod] = useState<PassbookPeriod>('today');
  const [passbookValues, setPassbookValues] =
    useState<PassbookValues>(emptyPassbookValues);
  const [passbookTitle, setPassbookTitle] = useState("Today's Earnings");
  const [selectedMonthYear, setSelectedMonthYear] = useState(getDefaultMonthYear);
  const [pendingMonth, setPendingMonth] = useState(selectedMonthYear.month);
  const [pendingYear, setPendingYear] = useState(selectedMonthYear.year);
  const [pickerMode, setPickerMode] = useState<Exclude<PassbookPeriod, 'today'>>(
    'monthly',
  );
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isPassbookLoading, setIsPassbookLoading] = useState(false);
  const [passbookError, setPassbookError] = useState('');
  const latestPassbookRequestId = useRef(0);

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

  const loadTodayPassbook = useCallback(
    async (refreshing = false) => {
      if (!refreshing) {
        setIsPassbookLoading(true);
      }
      setPassbookError('');
      const requestId = latestPassbookRequestId.current + 1;
      latestPassbookRequestId.current = requestId;

      try {
        const response = await getTodayPassbook({ UserId: userId }) as TodayPassbookResponse;

        if (requestId !== latestPassbookRequestId.current) {
          return;
        }

        if (!isSuccessOrNoData(response)) {
          throw new Error(getMessage(response) || 'Unable to load passbook.');
        }

        setPassbookValues(valuesFromToday(getTodayData(response)));
        setPassbookTitle("Today's Earnings");
      } catch (error) {
        if (requestId !== latestPassbookRequestId.current) {
          return;
        }
        setPassbookValues(emptyPassbookValues);
        setPassbookError(getFriendlyPassbookError(error));
      } finally {
        if (requestId === latestPassbookRequestId.current) {
          setIsPassbookLoading(false);
        }
      }
    },
    [userId],
  );

  const loadMonthlyPassbook = useCallback(
    async (month: number, year: number) => {
      setIsPassbookLoading(true);
      setPassbookError('');
      setPassbookTitle(`${MONTH_NAMES[month - 1] ?? 'Invalid'} ${year}'s Earnings`);
      const requestId = latestPassbookRequestId.current + 1;
      latestPassbookRequestId.current = requestId;

      try {
        const response = (await getMonthlyPassbook({
          UserId: userId,
          PassbookMonth: month,
          PassbookYear: year,
        })) as MonthlyPassbookResponse;

        if (requestId !== latestPassbookRequestId.current) {
          return;
        }

        if (!isSuccessOrNoData(response)) {
          throw new Error(getMessage(response) || 'Unable to load monthly passbook.');
        }

        const data = getMonthlyData(response);
        
        // Validate that we received data
        if (!data) {
          throw new Error('No data received from server. Please try again.');
        }
        
        const monthItem = findMonthItem(data, month, year);
        setPassbookValues(valuesFromMonthly(data, monthItem));
        setPassbookTitle(`${MONTH_NAMES[month - 1]} ${year}'s Earnings`);
      } catch (error) {
        if (requestId !== latestPassbookRequestId.current) {
          return;
        }
        setPassbookValues(emptyPassbookValues);
        setPassbookError(getFriendlyPassbookError(error));
      } finally {
        if (requestId === latestPassbookRequestId.current) {
          setIsPassbookLoading(false);
        }
      }
    },
    [userId],
  );

  const loadYearlyPassbook = useCallback(
    async (year: number) => {
      setIsPassbookLoading(true);
      setPassbookError('');
      setPassbookTitle(`${year}'s Earnings`);
      const requestId = latestPassbookRequestId.current + 1;
      latestPassbookRequestId.current = requestId;

      try {
        const response = (await getYearlyPassbook({ UserId: userId, PassbookYear: year })) as YearlyPassbookResponse;

        if (requestId !== latestPassbookRequestId.current) {
          return;
        }

        if (!isSuccessOrNoData(response)) {
          throw new Error(getMessage(response) || 'Unable to load yearly passbook.');
        }

        const data = getMonthlyData(response);
        
        // Validate that we received data
        if (!data) {
          throw new Error('No data received from server. Please try again.');
        }
        
        setPassbookValues(valuesFromYearly(data));
        setPassbookTitle(`${year}'s Earnings`);
      } catch (error) {
        if (requestId !== latestPassbookRequestId.current) {
          return;
        }
        setPassbookValues(emptyPassbookValues);
        setPassbookError(getFriendlyPassbookError(error));
      } finally {
        if (requestId === latestPassbookRequestId.current) {
          setIsPassbookLoading(false);
        }
      }
    },
    [userId],
  );

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
    loadTodayPassbook();
  }, [loadTodayPassbook]);

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

  const openPicker = (mode: Exclude<PassbookPeriod, 'today'>) => {
    setPickerMode(mode);
    setPendingMonth(selectedMonthYear.month);
    setPendingYear(selectedMonthYear.year);
    setIsPickerOpen(true);
  };

  const handlePeriodPress = (nextPeriod: PassbookPeriod) => {
    if (nextPeriod === 'today') {
      setPeriod('today');
      loadTodayPassbook();
      return;
    }

    openPicker(nextPeriod);
  };

  const applyPicker = () => {
    const nextMonthYear = {
      month: pendingMonth,
      year: pendingYear,
    };
    setSelectedMonthYear(nextMonthYear);
    setIsPickerOpen(false);

    if (pickerMode === 'monthly') {
      setPeriod('monthly');
      loadMonthlyPassbook(nextMonthYear.month, nextMonthYear.year);
    } else {
      setPeriod('yearly');
      loadYearlyPassbook(nextMonthYear.year);
    }
  };

  const filteredTechnicians = useMemo(() => {
    const query = expenseSearch.trim().toLowerCase();
    if (!query) {
      return technicians;
    }

    return technicians.filter(item =>
      getTechnicianName(item).toLowerCase().includes(query),
    );
  }, [expenseSearch, technicians]);

  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      passbookValues.estimated > 0
        ? Math.round((passbookValues.earnings / passbookValues.estimated) * 100)
        : 0,
    ),
  );

  const renderTopTabs = () => (
    <View style={styles.topTabBar}>
      {(['passbook', 'expenditure'] as MainTab[]).map(tab => {
        const selected = activeTab === tab;
        return (
          <Pressable
            key={tab}
            style={[styles.topTabButton, selected ? styles.topTabActive : null]}
            onPress={() => setActiveTab(tab)}>
            <Text style={[styles.topTabText, selected ? styles.topTabTextActive : null]}>
              {tab === 'passbook' ? 'PASSBOOK' : 'EXPENDITURE'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderPeriodButton = (buttonPeriod: PassbookPeriod, label: string) => {
    const selected = period === buttonPeriod;
    return (
      <Pressable
        style={[styles.periodButton, selected ? styles.periodButtonActive : null]}
        onPress={() => handlePeriodPress(buttonPeriod)}>
        <Text style={[styles.periodText, selected ? styles.periodTextActive : null]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  const renderPassbook = () => (
    <ScrollView contentContainerStyle={styles.passbookScroll}>
      <View style={styles.periodRow}>
        {renderPeriodButton('today', 'Today')}
        {renderPeriodButton('monthly', 'Monthly')}
        {renderPeriodButton('yearly', 'Yearly')}
      </View>

      <View style={styles.earningsPanel}>
        <View style={styles.earningHeaderRow}>
          <Pressable
            hitSlop={12}
            onPress={() => openPicker(period === 'yearly' ? 'yearly' : 'monthly')}>
            <Text style={styles.periodArrow}>{'<'}</Text>
          </Pressable>
          <View style={styles.earningTitleBlock}>
            <Text style={styles.earningTitle}>{passbookTitle}</Text>
            <Text style={styles.earningAmount}>{formatMoney(passbookValues.earnings)}</Text>
          </View>
          <Pressable
            hitSlop={12}
            onPress={() => openPicker(period === 'yearly' ? 'yearly' : 'monthly')}>
            <Text style={styles.periodArrow}>{'>'}</Text>
          </Pressable>
        </View>

        {isPassbookLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={THEME_PRIMARY} />
            <Text style={styles.loadingText}>Loading passbook...</Text>
          </View>
        ) : null}

        {passbookError ? (
          <Text style={styles.errorText}>{passbookError}</Text>
        ) : null}

        <View style={styles.summaryCard}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {width: `${progressPercent}%`}]} />
          </View>
          <View style={styles.estimatedRow}>
            <Text style={styles.estimatedText}>
              Estimated Earnings{' '}
              <Text style={styles.estimatedAmount}>
                {formatMoney(passbookValues.estimated)}
              </Text>
            </Text>
            <Text style={styles.progressText}>{progressPercent}%</Text>
          </View>

          <View style={styles.summaryPrimaryRow}>
            <Text style={styles.summaryPrimaryLabel}>Credit Given</Text>
            <Text style={styles.summaryPrimaryValue}>
              {formatMoney(passbookValues.credit)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={styles.summaryValue}>{formatMoney(passbookValues.expenses)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Received</Text>
            <Text style={styles.summaryValue}>{formatMoney(passbookValues.received)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining Amount</Text>
            <Text style={styles.summaryValue}>{formatMoney(passbookValues.remaining)}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderTechnician = ({item}: {item: ExpenseTechnicianItem}) => {
    const photo = getTechnicianPhoto(item);
    return (
      <TouchableOpacity
        activeOpacity={0.78}
        style={styles.technicianCard}
        onPress={() =>
          Alert.alert(
            getTechnicianName(item),
            `Balance: ${formatMoney(getTechnicianBalance(item))}`,
          )
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
      {renderTopTabs()}
      {activeTab === 'passbook' ? renderPassbook() : renderExpenditure()}

      <Modal
        transparent
        animationType="fade"
        visible={isPickerOpen}
        onRequestClose={() => setIsPickerOpen(false)}>
        <Pressable style={styles.pickerBackdrop} onPress={() => setIsPickerOpen(false)}>
          <Pressable style={styles.pickerPanel}>
            <Text style={styles.pickerTitle}>
              {pickerMode === 'monthly' ? 'Select Month & Year' : 'Select Year'}
            </Text>

            <View style={styles.pickerBody}>
              {pickerMode === 'monthly' ? (
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerColumnTitle}>Month</Text>
                  <ScrollView style={styles.pickerList}>
                    {MONTH_LABELS.map((label, index) => {
                      const month = index + 1;
                      const selected = pendingMonth === month;
                      return (
                        <Pressable
                          key={label}
                          style={[
                            styles.pickerItem,
                            selected ? styles.pickerItemSelected : null,
                          ]}
                          onPress={() => setPendingMonth(month)}>
                          <Text
                            style={[
                              styles.pickerItemText,
                              selected ? styles.pickerItemTextSelected : null,
                            ]}>
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColumnTitle}>Year</Text>
                <ScrollView style={styles.pickerList}>
                  {yearOptions.map(year => {
                    const selected = pendingYear === year;
                    return (
                      <Pressable
                        key={String(year)}
                        style={[
                          styles.pickerItem,
                          selected ? styles.pickerItemSelected : null,
                        ]}
                        onPress={() => setPendingYear(year)}>
                        <Text
                          style={[
                            styles.pickerItemText,
                            selected ? styles.pickerItemTextSelected : null,
                          ]}>
                          {year}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={styles.pickerFooter}>
              <Pressable
                style={styles.pickerCancelButton}
                onPress={() => setIsPickerOpen(false)}>
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.pickerOkButton} onPress={applyPicker}>
                <Text style={styles.pickerOkText}>OK</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
  },
  topTabButton: {
    minWidth: ms(132),
    height: ms(56),
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
    paddingBottom: ms(88),
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
    fontSize: sp(22),
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
    fontSize: sp(18),
    fontWeight: '900',
  },
  technicianRole: {
    marginTop: ms(3),
    color: '#777777',
    fontSize: sp(13),
  },
  minusButton: {
    width: ms(34),
    height: ms(28),
    borderRadius: ms(7),
    borderWidth: ms(2),
    borderColor: THEME_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minusText: {
    color: THEME_PRIMARY,
    fontSize: sp(24),
    lineHeight: sp(24),
    fontWeight: '900',
  },
  balanceText: {
    width: ms(130),
    textAlign: 'center',
    color: '#666666',
    fontSize: sp(16),
  },
  plusButton: {
    width: ms(34),
    height: ms(28),
    borderRadius: ms(7),
    borderWidth: ms(2),
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    color: '#4CAF50',
    fontSize: sp(23),
    lineHeight: sp(24),
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