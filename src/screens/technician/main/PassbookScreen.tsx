// src/screens/technician/main/PassbookScreen.tsx
//
// Port of Java's HomePassbookFragmentNew (layout home_passbook_fragment_new).
// Today/Monthly/Yearly tabs each hit a different Passbook endpoint; the field
// mapping below (which API field feeds which row) mirrors the Java fragment
// exactly, including its quirks (e.g. Yearly's "Credit Given" and "Remaining
// Amount" both read TotalOpening — that's what the live app does).
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, ActivityIndicator,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../../../theme/theme';
import MonthYearPickerDialog from '../../../components/MonthYearPickerDialog';
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
import { formatAmount } from '../../../utils/decimal';
import { usePassbookTabOrder } from '../../../state/passbookTabOrder';
import { getCurrentUserId } from '../../../state/session';

// Passbook is a real tab, but also needs to push 'Expenditure', which now
// lives one level up in TechnicianStack — so the nav type is a composite.
type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TechnicianTabParamList, 'Passbook'>,
  NativeStackNavigationProp<TechnicianStackParamList>
>;
type Period = 'today' | 'monthly' | 'yearly';

// Java: DateUtils.getMonthName() — new DateFormatSymbols(ENGLISH).getShortMonths().
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type PassbookFields = {
  estimated: number;
  credit: number;
  expenses: number;
  received: number;
  remaining: number;
  earnings: number;
};

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

  // Java: "₹ " + String.format("%.3f", value)
  const money = (v: number) => `₹ ${formatAmount(v)}`;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
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

        {/* Period selector */}
        <View style={styles.periodRow}>
          {(['today', 'monthly', 'yearly'] as Period[]).map((period) => (
            <Pressable
              key={period}
              style={[styles.periodBtn, activePeriod === period && styles.activePeriod]}
              onPress={() => selectPeriod(period)}
            >
              <Text style={[styles.periodText, activePeriod === period && styles.activePeriodText]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Java curve_card: #f2f2f2 backdrop, white sheet with 50dp top corners */}
        <View style={styles.cardBackdrop}>
          <View style={styles.whiteCard}>
            <Text style={styles.earningTitle}>{title}</Text>

            <View style={styles.earnRow}>
              <Pressable
                style={styles.caretCell}
                onPress={() => shiftRef(-1)}
                disabled={activePeriod === 'today'}
              >
                <Image source={require('../../../../assets/images/left_sort.png')} style={styles.caretImg} />
              </Pressable>
              <View style={styles.earnCell}>
                {loading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <Text style={styles.earningAmount}>{money(fields.earnings)}</Text>
                )}
              </View>
              <Pressable
                style={styles.caretCell}
                onPress={() => shiftRef(1)}
                disabled={activePeriod === 'today' || forwardBlocked}
              >
                <Image
                  source={require('../../../../assets/images/right_sort.png')}
                  style={[styles.caretImg, forwardBlocked && { opacity: 0.3 }]}
                />
              </Pressable>
            </View>

            {/* Java passbook_gradient: #fcb6be -> white, 50dp top corners, runs to the bottom */}
            <LinearGradient
              colors={[COLORS.passbookPink, COLORS.white]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradientSheet}
            >
              {/* Java: RoundCornerProgressBar is static (rcProgress="8.0" out of 10,
                  never bound to a real value in HomePassbookFragmentNew) — kept as
                  the same static decoration here. */}
              <View style={styles.progressBarBg}>
                <View style={styles.progressBarFill} />
              </View>

              <View style={styles.estRow}>
                <Text style={styles.estLabel}>Estimated Earnings</Text>
                <Text style={styles.estValue}>{money(fields.estimated)}</Text>
                <Text style={styles.percentText}>80%</Text>
              </View>

              <View style={styles.rowsBlock}>
                <View style={styles.rowBetween}>
                  <Text style={styles.creditText}>Credit Given</Text>
                  <Text style={styles.creditText}>{money(fields.credit)}</Text>
                </View>

                {[
                  { label: 'Expenses', value: fields.expenses },
                  { label: 'Received', value: fields.received },
                  { label: 'Remaining Amount', value: fields.remaining },
                ].map(({ label, value }) => (
                  <View key={label}>
                    <View style={styles.divider} />
                    <View style={styles.rowBetween}>
                      <Text style={styles.rowText}>{label}</Text>
                      <Text style={styles.rowValue}>{money(value)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>

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

  // Java: 3 equal 35dp buttons, 5dp margins, 8dp radius, 0.7dp #E3E3E3 stroke, 18sp bold.
  periodRow: {
    flexDirection: 'row',
    marginTop: vs(10),
    marginBottom: vs(20),
    backgroundColor: COLORS.white,
  },
  periodBtn: {
    flex: 1,
    height: vs(35),
    margin: scale(5),
    borderRadius: scale(8),
    borderWidth: 0.7,
    borderColor: COLORS.passbookBorder,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePeriod:     { backgroundColor: COLORS.primary },
  periodText:       { color: COLORS.textBlack, fontWeight: '700', fontSize: sp(18) },
  activePeriodText: { color: COLORS.white },

  cardBackdrop: { flex: 1, backgroundColor: COLORS.passbookBackdrop },
  whiteCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: scale(50),
    borderTopRightRadius: scale(50),
    overflow: 'hidden',
  },
  earningTitle: { marginTop: vs(8), fontSize: sp(22), textAlign: 'center', color: COLORS.textBlack },
  // Java: three equal cells, top-aligned; a long amount wraps onto a second line while the
  // pink sheet stays at a fixed offset from the top of the white card.
  earnRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: -vs(2), minHeight: vs(32) },
  caretCell: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: vs(4) },
  caretImg: { width: scale(16), height: scale(16), resizeMode: 'contain' },
  earnCell: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  earningAmount: { fontSize: sp(25), fontWeight: '700', textAlign: 'center', color: COLORS.textBlack },

  gradientSheet: {
    position: 'absolute',
    top: vs(102),
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: scale(50),
    borderTopRightRadius: scale(50),
    paddingTop: vs(20),
  },
  progressBarBg:   { height: vs(5), backgroundColor: COLORS.lighterGray, borderRadius: 34, marginHorizontal: scale(30), marginBottom: vs(20) },
  progressBarFill: { width: '80%', height: vs(5), backgroundColor: COLORS.primary, borderRadius: 34 },

  estRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: scale(30) },
  estLabel: { fontSize: sp(14), color: COLORS.textBlack },
  estValue: { marginLeft: scale(5), fontSize: sp(18), fontWeight: '700', color: COLORS.textBlack },
  percentText: { flex: 1, textAlign: 'right', paddingRight: scale(10), color: COLORS.primary, fontWeight: '700', fontSize: sp(14) },

  rowsBlock: { marginTop: vs(20), marginHorizontal: scale(30) },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: scale(10),
  },
  divider: { height: 1, backgroundColor: COLORS.lighterGray },
  creditText: { fontSize: sp(20), fontWeight: '700', color: COLORS.textBlack },
  rowText:    { fontSize: sp(16), color: COLORS.textBlack },
  rowValue:   { fontSize: sp(16), fontWeight: '700', color: COLORS.textBlack },
});
