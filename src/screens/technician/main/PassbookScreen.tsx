// src/screens/technician/main/PassbookScreen.tsx
//
// Port of Java's HomePassbookFragmentNew (layout home_passbook_fragment_new).
// Today/Monthly/Yearly tabs each hit a different Passbook endpoint; the field
// mapping below (which API field feeds which row) mirrors the Java fragment
// exactly, including its quirks (e.g. Yearly's "Credit Given" and "Remaining
// Amount" both read TotalOpening — that's what the live app does).
import {
  View, Text, StyleSheet, Pressable,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { COLORS } from '../../../theme/theme';
import MonthYearPickerDialog from '../../../components/MonthYearPickerDialog';
import PassbookSummary, { type PassbookFields, type PassbookPeriod } from '../../../components/PassbookSummary';
import { scale, vs, sp, ms, useAppHeaderHeight } from '../../../utils/responsive';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { TechnicianTabParamList } from '../../../navigation/TechnicianTabs';
import { TechnicianStackParamList } from '../../../navigation/TechStack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import {
  getTodayPassbook,
  getMonthlyPassbook,
  getYearlyPassbook,
} from '../../../api/passbook/passbookService';
import { usePassbookTabOrder } from '../../../state/passbookTabOrder';
import { getCurrentUserId } from '../../../state/session';

// Passbook is a real tab, but also needs to push 'Expenditure', which now
// lives one level up in TechnicianStack — so the nav type is a composite.
type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TechnicianTabParamList, 'Passbook'>,
  NativeStackNavigationProp<TechnicianStackParamList>
>;
type Period = PassbookPeriod;

// Java: DateUtils.getMonthName() — new DateFormatSymbols(ENGLISH).getShortMonths().
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const EMPTY_FIELDS: PassbookFields = {
  estimated: 0, credit: 0, expenses: 0, received: 0, remaining: 0, earnings: 0,
};

export default function PassbookScreen() {
  const headerHeight = useAppHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const tabOrder = usePassbookTabOrder();

  const [activePeriod, setActivePeriod] = useState<Period>('today');
  // Drives the Monthly/Yearly caret navigation (Java opens a month/year picker dialog).
  const [refDate, setRefDate] = useState(() => new Date());
  const [fields, setFields] = useState<PassbookFields>(EMPTY_FIELDS);
  const [loading, setLoading] = useState(false);

  // Java (btnMonthYear/btnYear): switching to Monthly/Yearly always opens the
  // month/year dialog rather than assuming the current month/year.
  const [pickerFor, setPickerFor] = useState<'monthly' | 'yearly' | null>(null);

  const load = useCallback(async (period: Period, date: Date) => {
    const userId = getCurrentUserId();
    if (!userId) {
      return;
    }
    setLoading(true);
    try {
      if (period === 'today') {
        const res = await getTodayPassbook({ UserId: userId });
        const d = res?.ResultData;
        // Java: txtEstimatedEarning and txtEarnings both read EarningAmount here.
        setFields({
          estimated: d?.EarningAmount ?? 0,
          credit: d?.Credit ?? 0,
          expenses: d?.Expenses ?? 0,
          received: d?.Return ?? 0,
          remaining: d?.Balance ?? 0,
          earnings: d?.EarningAmount ?? 0,
        });
      } else if (period === 'monthly') {
        const month = date.getMonth();
        const year = date.getFullYear();
        const res = await getMonthlyPassbook({ UserId: userId, PassbookMonth: month + 1, PassbookYear: year });
        const d = res?.ResultData;
        const monthName = MONTHS[month];
        // API scopes MonthlyALlDataList to the requested year via
        // PassbookMonth/PassbookYear already, and its per-row Year field
        // comes back blank -- matching on it (as Java's equalsIgnoreCase
        // check does) always misses, so match on Month name alone.
        const row = d?.MonthlyALlDataList?.find(item => item.Month?.includes(monthName));
        setFields({
          estimated: row?.Estimated ?? 0,
          credit: d?.TotalCredit ?? 0,
          expenses: row?.Expenses ?? 0,
          received: d?.TotalDeduction ?? 0,
          remaining: d?.TotalOpening ?? 0,
          earnings: row?.Earning ?? 0,
        });
      } else {
        const year = date.getFullYear();
        const res = await getYearlyPassbook({ UserId: userId, PassbookYear: year });
        const d = res?.ResultData;
        // Java: Credit Given and Remaining Amount both read TotalOpening for Yearly.
        setFields({
          estimated: d?.TotalEstimated ?? 0,
          credit: d?.TotalOpening ?? 0,
          expenses: d?.TotalExpenses ?? 0,
          received: d?.TotalDeduction ?? 0,
          remaining: d?.TotalOpening ?? 0,
          earnings: d?.TotalEarned ?? 0,
        });
      }
    } catch {
      setFields(EMPTY_FIELDS);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { load(activePeriod, refDate); }, [load, activePeriod, refDate]),
  );

  // Re-tapping the Passbook tab while already on it refreshes the screen.
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) load(activePeriod, refDate);
    });
    return unsubscribe;
  }, [navigation, load, activePeriod, refDate]);

  const selectPeriod = (period: Period) => {
    if (period === 'today') {
      setActivePeriod(period);
      const now = new Date();
      setRefDate(now);
      load(period, now);
      return;
    }
    setPickerFor(period);
  };

  const confirmPeriodPicker = (month: number, year: number) => {
    if (!pickerFor) return;
    const next = new Date(year, pickerFor === 'monthly' ? month : 0, 1);
    setActivePeriod(pickerFor);
    setRefDate(next);
    load(pickerFor, next);
    setPickerFor(null);
  };

  // The carets can't move past the current month (Monthly) or current year (Yearly).
  const nowDate = new Date();
  const forwardBlocked =
    (activePeriod === 'yearly' && refDate.getFullYear() >= nowDate.getFullYear()) ||
    (activePeriod === 'monthly' &&
      refDate.getFullYear() * 12 + refDate.getMonth() >= nowDate.getFullYear() * 12 + nowDate.getMonth());

  const shiftRef = (delta: number) => {
    if (activePeriod === 'today') {
      return;
    }
    if (delta > 0 && forwardBlocked) {
      return;
    }
    const next = new Date(refDate);
    if (activePeriod === 'monthly') {
      next.setMonth(next.getMonth() + delta);
    } else {
      next.setFullYear(next.getFullYear() + delta);
    }
    setRefDate(next);
  };

  const title = activePeriod === 'today'
    ? "Today's Earnings"
    : activePeriod === 'monthly'
      ? `${MONTHS[refDate.getMonth()]} ${refDate.getFullYear()}'s Earnings`
      : `${refDate.getFullYear()}'s Earnings`;

  return (
    <View style={styles.root}>
      {/* Tab Row */}
      <View style={[styles.tabRow, { paddingTop: headerHeight + vs(4) }]}>
        {(tabOrder === 'passbookFirst' ? ['passbook', 'expenditure'] : ['expenditure', 'passbook']).map(t =>
          t === 'passbook' ? (
            <Pressable key={t} style={styles.activeTab}>
              <Text style={styles.activeTabText}>PASSBOOK</Text>
            </Pressable>
          ) : (
            <Pressable key={t} style={styles.inactiveTab} onPress={() => navigation.navigate('Expenditure')}>
              <Text style={styles.inactiveTabText}>EXPENDITURE</Text>
            </Pressable>
          ),
        )}
      </View>

      <PassbookSummary
        period={activePeriod}
        onSelectPeriod={selectPeriod}
        title={title}
        fields={fields}
        loading={loading}
        onPrev={() => shiftRef(-1)}
        onNext={() => shiftRef(1)}
        prevDisabled={activePeriod === 'today'}
        nextDisabled={activePeriod === 'today' || forwardBlocked}
      />

      {/* Java: Util/MonthYearPickerDialog (Monthly: current year and one before; Yearly: current and two before) */}
      <MonthYearPickerDialog
        visible={pickerFor !== null}
        yearOnly={pickerFor === 'yearly'}
        minYear={new Date().getFullYear() - (pickerFor === 'yearly' ? 2 : 1)}
        maxYear={new Date().getFullYear()}
        activatedMonth={new Date().getMonth()}
        activatedYear={new Date().getFullYear()}
        onCancel={() => setPickerFor(null)}
        onConfirm={confirmPeriodPicker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },

  tabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.white,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  activeTab: {
    flex: 1,
    borderBottomWidth: ms(4),
    borderColor: COLORS.primary,
    backgroundColor: COLORS.tabSelector,
    height: ms(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabText:   { fontSize: sp(15), fontWeight: '600', color: COLORS.primary },
  inactiveTab:     { flex: 1, height: ms(44), alignItems: 'center', justifyContent: 'center' },
  inactiveTabText: { fontSize: sp(15), fontWeight: '400', color: COLORS.textQuaternary },

});
