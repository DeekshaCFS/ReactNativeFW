// src/screens/technician/main/PassbookScreen.tsx
//
// Port of Java's HomePassbookFragmentNew (layout home_passbook_fragment_new).
// The data loading + Today/Monthly/Yearly navigation lives in usePassbook (shared
// with the admin Passbook); this file only owns the tab row and screen wiring.
import {
  View, Text, StyleSheet, Pressable,
} from 'react-native';
import { useCallback, useEffect } from 'react';
import { COLORS } from '../../../theme/theme';
import MonthYearPickerDialog from '../../../components/MonthYearPickerDialog';
import PassbookSummary from '../../../components/PassbookSummary';
import { vs, ms, sp, useAppHeaderHeight } from '../../../utils/responsive';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { TechnicianTabParamList } from '../../../navigation/TechnicianTabs';
import { TechnicianStackParamList } from '../../../navigation/TechStack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { usePassbookTabOrder } from '../../../state/passbookTabOrder';
import { getCurrentUserId } from '../../../state/session';
import { usePassbook } from '../../../hooks/usePassbook';

// Passbook is a real tab, but also needs to push 'Expenditure', which now
// lives one level up in TechnicianStack — so the nav type is a composite.
type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TechnicianTabParamList, 'Passbook'>,
  NativeStackNavigationProp<TechnicianStackParamList>
>;

export default function PassbookScreen() {
  const headerHeight = useAppHeaderHeight();
  const navigation = useNavigation<NavigationProp>();
  const tabOrder = usePassbookTabOrder();

  const passbook = usePassbook(getCurrentUserId());
  const { period, reload } = passbook;
  const now = new Date();

  // Coming back to the tab refreshes whatever period is selected.
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  // Re-tapping the Passbook tab while already on it refreshes the screen.
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) reload();
    });
    return unsubscribe;
  }, [navigation, reload]);

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
        period={period}
        onSelectPeriod={passbook.selectPeriod}
        title={passbook.title}
        fields={passbook.fields}
        loading={passbook.loading}
        onPrev={() => passbook.shift(-1)}
        onNext={() => passbook.shift(1)}
        prevDisabled={period === 'today'}
        nextDisabled={period === 'today' || passbook.forwardBlocked}
      />

      {/* Java: Util/MonthYearPickerDialog (Monthly: current year and one before; Yearly: current and two before) */}
      <MonthYearPickerDialog
        visible={passbook.pickerFor !== null}
        yearOnly={passbook.pickerFor === 'yearly'}
        minYear={now.getFullYear() - (passbook.pickerFor === 'yearly' ? 2 : 1)}
        maxYear={now.getFullYear()}
        activatedMonth={now.getMonth()}
        activatedYear={now.getFullYear()}
        onCancel={passbook.cancelPicker}
        onConfirm={passbook.confirmPicker}
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
