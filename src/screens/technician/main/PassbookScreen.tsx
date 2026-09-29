// src/screens/technician/main/PassbookScreen.tsx
//
// Port of Java's HomePassbookFragmentNew (layout home_passbook_fragment_new).
// Today/Monthly/Yearly tabs each hit a different Passbook endpoint; the field
// mapping below (which API field feeds which row) mirrors the Java fragment
// exactly, including its quirks (e.g. Yearly's "Credit Given" and "Remaining
// Amount" both read TotalOpening — that's what the live app does).
import {
  View, Text, StyleSheet, ScrollView, Pressable, Modal,
  Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { useCallback, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../../../theme/theme';
import DrumPicker from '../../../components/DrumPicker';
import { scale, vs, sp, ms, HEADER_TOP_PADDING } from '../../../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const navigation = useNavigation<NavigationProp>();
  const insets     = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : insets.top;

  const [activePeriod, setActivePeriod] = useState<Period>('today');
  // Drives the Monthly/Yearly caret navigation (Java opens a month/year picker dialog).
  const [refDate, setRefDate] = useState(() => new Date());
  const [fields, setFields] = useState<PassbookFields>(EMPTY_FIELDS);
  const [loading, setLoading] = useState(false);

  // Java (btnMonthYear/btnYear): switching to Monthly/Yearly always opens a
  // month/year roller dialog rather than assuming the current month/year.
  // Monthly allows the current year and the one before; Yearly allows the
  // current year and the two before.
  const [pickerFor, setPickerFor] = useState<'monthly' | 'yearly' | null>(null);
  const [tempMonthIdx, setTempMonthIdx] = useState(0);
  const [tempYearIdx, setTempYearIdx] = useState(0);
  const monthlyYearOptions = [String(new Date().getFullYear() - 1), String(new Date().getFullYear())];
  const yearlyYearOptions = [
    String(new Date().getFullYear() - 2),
    String(new Date().getFullYear() - 1),
    String(new Date().getFullYear()),
  ];

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

  const selectPeriod = (period: Period) => {
    if (period === 'today') {
      setActivePeriod(period);
      const now = new Date();
      setRefDate(now);
      load(period, now);
      return;
    }

    const now = new Date();
    setTempMonthIdx(now.getMonth());
    setTempYearIdx(
      period === 'monthly'
        ? monthlyYearOptions.indexOf(String(now.getFullYear()))
        : yearlyYearOptions.indexOf(String(now.getFullYear())),
    );
    setPickerFor(period);
  };

  const confirmPeriodPicker = () => {
    if (!pickerFor) return;
    const year = Number(
      (pickerFor === 'monthly' ? monthlyYearOptions : yearlyYearOptions)[tempYearIdx],
    );
    const next = new Date(year, pickerFor === 'monthly' ? tempMonthIdx : 0, 1);
    setActivePeriod(pickerFor);
    setRefDate(next);
    load(pickerFor, next);
    setPickerFor(null);
  };

  const shiftRef = (delta: number) => {
    if (activePeriod === 'today') {
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

  const money = (v: number) => `Rs. ${formatAmount(v)}`;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + vs(40) }}
      >
        {/* Tab Row */}
        <View style={[styles.tabRow, { paddingTop: HEADER_TOP_PADDING + vs(10) }]}>
          <Pressable style={styles.activeTab}>
            <Text style={styles.activeTabText}>PASSBOOK</Text>
          </Pressable>
          <Pressable style={styles.inactiveTab} onPress={() => navigation.navigate('Expenditure')}>
            <Text style={styles.inactiveTabText}>EXPENDITURE</Text>
          </Pressable>
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

        {/* White card */}
        <View style={styles.whiteCard}>
          {/* Earnings row */}
          <View style={styles.earnRow}>
            <Pressable
              style={styles.caretButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => shiftRef(-1)}
              disabled={activePeriod === 'today'}
            >
              <Ionicons name="caret-back" size={sp(22)} color={activePeriod === 'today' ? '#ccc' : '#111'} />
            </Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.earningTitle}>{title}</Text>
              {loading ? (
                <ActivityIndicator style={{ marginTop: vs(4) }} color={COLORS.primary} />
              ) : (
                <Text style={styles.earningAmount}>{money(fields.earnings)}</Text>
              )}
            </View>
            <Pressable
              style={styles.caretButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => shiftRef(1)}
              disabled={activePeriod === 'today'}
            >
              <Ionicons name="caret-forward" size={sp(22)} color={activePeriod === 'today' ? '#ccc' : '#111'} />
            </Pressable>
          </View>

          {/* Gradient sheet */}
          <LinearGradient
            colors={['#fcbbc2', '#fdcfd5', '#ffffff']}
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

            <View style={styles.rowBetween}>
              <Text style={styles.mutedText}>
                Estimated Earnings <Text style={styles.bold}>{money(fields.estimated)}</Text>
              </Text>
              <Text style={styles.percentText}>80%</Text>
            </View>

            <View style={styles.rowBetween}>
              <Text style={[styles.bold, { fontSize: sp(18) }]}>Credit Given</Text>
              <Text style={[styles.bold, { fontSize: sp(18) }]}>{money(fields.credit)}</Text>
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
                  <Text style={styles.bold}>{money(value)}</Text>
                </View>
              </View>
            ))}
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Month/Year roller (Java: btnMonthYear/btnYear MonthPickerDialog) */}
      <Modal visible={pickerFor !== null} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setPickerFor(null)} />
        <View style={styles.centerModal}>
          <Text style={styles.modalTitle}>
            {pickerFor === 'monthly' ? 'Select month year' : 'Select year'}
          </Text>
          <View style={{ flexDirection: 'row', paddingHorizontal: scale(16) }}>
            {pickerFor === 'monthly' && (
              <DrumPicker data={MONTHS} selectedIndex={tempMonthIdx} onSelect={setTempMonthIdx} />
            )}
            <DrumPicker
              data={pickerFor === 'monthly' ? monthlyYearOptions : yearlyYearOptions}
              selectedIndex={tempYearIdx}
              onSelect={setTempYearIdx}
            />
          </View>
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#eee', marginTop: vs(12) }}>
            <Pressable style={{ flex: 1, paddingVertical: vs(14), alignItems: 'center' }} onPress={() => setPickerFor(null)}>
              <Text style={{ fontSize: sp(15), color: '#888' }}>Cancel</Text>
            </Pressable>
            <Pressable style={{ flex: 1, paddingVertical: vs(14), alignItems: 'center' }} onPress={confirmPeriodPicker}>
              <Text style={{ fontSize: sp(15), color: COLORS.primary, fontWeight: '600' }}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f7f7' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  centerModal: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    backgroundColor: '#fff',
    padding: scale(16),
    borderRadius: scale(12),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  modalTitle: { fontSize: sp(17), fontWeight: '600', marginBottom: vs(12), color: COLORS.textPrimary, textAlign: 'center' },

  tabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    marginBottom: vs(4),
  },
  activeTab: {
    flex: 1,
    borderBottomWidth: ms(3),
    borderColor: COLORS.primary,
    backgroundColor: '#f5d7d784',
    height: ms(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabText:   { fontSize: sp(15), fontWeight: '600', color: COLORS.primary },
  inactiveTab:     { flex: 1, height: ms(44), alignItems: 'center', justifyContent: 'center' },
  inactiveTabText: { fontSize: sp(15), fontWeight: '400', color: COLORS.textQuaternary },

  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: vs(16),
    paddingHorizontal: scale(8),
  },
  periodBtn: {
    paddingVertical: vs(8),
    paddingHorizontal: scale(20),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: '#c7c7c5',
  },
  activePeriod:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodText:       { color: '#111', fontWeight: '600', fontSize: sp(14) },
  activePeriodText: { color: '#fff' },

  whiteCard: {
    backgroundColor: '#fff',
    borderRadius: scale(28),
    marginHorizontal: scale(12),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  earnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: vs(18),
  },
  earningTitle:  { fontSize: sp(18), textAlign: 'center', color: COLORS.textPrimary },
  earningAmount: { fontSize: sp(18), fontWeight: '700', textAlign: 'center', marginTop: vs(4), color: COLORS.textPrimary },
  caretButton:   { padding: scale(8) },

  gradientSheet: {
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    paddingTop: vs(16),
    paddingHorizontal: scale(16),
    paddingBottom: vs(24),
  },
  progressBarBg:   { height: vs(6), backgroundColor: '#ededed', borderRadius: 4, marginBottom: vs(12) },
  progressBarFill: { width: '80%', height: vs(6), backgroundColor: COLORS.primary, borderRadius: 4 },
  percentText: { color: COLORS.primary, fontWeight: '600', fontSize: sp(13) },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: vs(8),
    paddingHorizontal: scale(4),
  },
  divider: {
    height: 1,
    backgroundColor: '#f8eeee',
    marginVertical: vs(4),
  },
  bold:        { fontWeight: '600', fontSize: sp(16), color: COLORS.textPrimary },
  mutedText:   { color: '#374151', fontSize: sp(13), flexShrink: 1 },
  rowText:     { fontSize: sp(15), color: COLORS.textPrimary },
});
