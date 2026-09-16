// src/screens/technician/main/PassbookScreen.tsx
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, StatusBar,
} from 'react-native';
import { useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp, ms, hp, HEADER_TOP_PADDING } from '../../../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TechnicianTabParamList } from '../../../navigation/TechnicianTabs';
import { TechnicianStackParamList } from '../../../navigation/TechStack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';

// Passbook is a real tab, but also needs to push 'Expenditure', which now
// lives one level up in TechnicianStack — so the nav type is a composite.
type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TechnicianTabParamList, 'Passbook'>,
  NativeStackNavigationProp<TechnicianStackParamList>
>;
type Period = 'today' | 'monthly' | 'yearly';

const PERIOD_ROWS = [
  { label: 'Estimated Earnings', value: 'Rs. 0' },
  { label: 'Credit Given',       value: 'Rs. 0' },
  { label: 'Expenses',           value: 'Rs. 0' },
  { label: 'Received',           value: 'Rs. 0' },
  { label: 'Remaining Amount',   value: 'Rs. 0' },
];

export default function PassbookScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets     = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : insets.top;

  const [activePeriod, setActivePeriod] = useState<Period>('today');

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
              onPress={() => setActivePeriod(period)}
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
            <Pressable style={styles.caretButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="caret-back" size={sp(22)} color="#111" />
            </Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.earningTitle}>Today's Earnings</Text>
              <Text style={styles.earningAmount}>Rs. 0</Text>
            </View>
            <Pressable style={styles.caretButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="caret-forward" size={sp(22)} color="#111" />
            </Pressable>
          </View>

          {/* Gradient sheet */}
          <LinearGradient
            colors={['#fcbbc2', '#fdcfd5', '#ffffff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradientSheet}
          >
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>

            <View style={styles.rowBetween}>
              <Text style={styles.mutedText}>
                Estimated Earnings <Text style={styles.bold}>Rs. 0</Text>
              </Text>
              <Text style={styles.percentText}>80%</Text>
            </View>

            <View style={styles.rowBetween}>
              <Text style={[styles.bold, { fontSize: sp(18) }]}>Credit Given</Text>
              <Text style={[styles.bold, { fontSize: sp(18) }]}>Rs. 0</Text>
            </View>

            {[
              { label: 'Expenses',          value: 'Rs. 0' },
              { label: 'Received',          value: 'Rs. 0' },
              { label: 'Remaining Amount',  value: 'Rs. 0' },
            ].map(({ label, value }) => (
              <View key={label}>
                <View style={styles.divider} />
                <View style={styles.rowBetween}>
                  <Text style={styles.rowText}>{label}</Text>
                  <Text style={styles.bold}>{value}</Text>
                </View>
              </View>
            ))}
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f7f7' },

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
  percentText: { color: COLORS.primary, fontWeight: '600', fontSize: sp(13) },
  rowText:     { fontSize: sp(15), color: COLORS.textPrimary },
});