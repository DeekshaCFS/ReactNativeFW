// src/screens/technician/drawer/ExpenditureScreen.tsx
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Modal, TextInput, Platform, StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { TechnicianStackParamList } from '../../../navigation/TechStack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms, sp, scale, HEADER_TOP_PADDING } from '../../../utils/responsive';
import { requestLocationPermission } from '../../../utils/locationPermision';

type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, 'Expenditure'>;

export default function ExpenditureScreen() {
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  // Source: ExpenseDetailsFragmentNew.getLastLocation() — requests location permission as soon
  // as the add-expense sheet opens. The Java fragment reverse-geocodes this into an address
  // alongside the expense record; this form has no fields/state wired up for that yet (see the
  // ADD button below, which is still a no-op), so this only primes the permission for now.
  useEffect(() => {
    if (showAddExpenseModal) {
      requestLocationPermission();
    }
  }, [showAddExpenseModal]);

  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : insets.top;

  const rows = [
    { label: 'Credited Amount:',  value: '0' },
    { label: 'Opening Amount:',   value: '0' },
    { label: 'Earned Amount:',    value: '0' },
    { label: 'Total Expense:',    value: '0' },
    { label: 'Return:',           value: '0' },
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: ms(140) }}
      >
        {/* Tab Row — offset by real status bar height */}
        <View style={styles.tabRow}>
          <Pressable style={styles.activeTab}>
            <Text style={styles.activeTabText}>EXPENDITURE</Text>
          </Pressable>
          <Pressable
            style={styles.inactiveTab}
            onPress={() => navigation.navigate('TechnicianTabsRoot', { screen: 'Passbook' })}
          >
            <Text style={styles.inactiveTabText}>PASSBOOK</Text>
          </Pressable>
        </View>

        <View style={styles.headerRow}>
          <Text style={styles.headerSub}>16 Feb 2026</Text>
          <Ionicons name="chevron-down" size={scale(18)} color={COLORS.primary} />
        </View>

        <Text style={styles.bold}>Technician Name</Text>

        <View style={styles.whiteCard}>
          {rows.map(({ label, value }) => (
            <View key={label} style={styles.rowBetween}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.bold}>{value}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <Text style={styles.bold}>Remaining Amount:</Text>
            <Text style={styles.bold}>0</Text>
          </View>
          {/* bottom padding inside card */}
          <View style={{ height: ms(12) }} />
        </View>

        <View style={styles.lowerRow}>
          <Text style={styles.lowerTitle}>Expense List</Text>
          <Pressable
            onPress={() => setShowAddExpenseModal(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add" size={scale(30)} color={COLORS.primary} />
          </Pressable>
        </View>

        <View style={styles.whiteCard}>
          <Text style={styles.naText}>NA</Text>
        </View>
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal transparent visible={showAddExpenseModal} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + ms(16) }]}>
            <Text style={styles.modalTitle}>Add Expense</Text>

            {/* Photo Upload */}
            <Pressable style={styles.expImage}>
              <Ionicons name="image-outline" size={scale(52)} color="#999" />
              <Text style={styles.uploadHint}>Upload Expense Photo</Text>
            </Pressable>

            <TextInput
              placeholder="Expense Name"
              placeholderTextColor="#999"
              style={styles.expInput}
              returnKeyType="next"
            />

            <TextInput
              placeholder="Please Enter Amount"
              placeholderTextColor="#999"
              style={styles.expInput}
              keyboardType="numeric"
              returnKeyType="done"
            />

            <Pressable
              style={styles.confirmBtn}
              onPress={() => setShowAddExpenseModal(false)}
            >
              <Text style={styles.confirmText}>ADD</Text>
            </Pressable>

            <Pressable onPress={() => setShowAddExpenseModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },

  // Tab row — height driven by content + dynamic paddingTop
  tabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: ms(12),
    height: 'auto',
  },
  activeTab: {
    borderBottomWidth: ms(3),
    borderColor: COLORS.primary,
    backgroundColor: '#f5d7d784',
    paddingVertical: ms(8),
    height: ms(44),
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabText: {
    fontSize: sp(15),
    fontWeight: '600',
    color: COLORS.primary,
  },
  inactiveTab: {
    paddingVertical: ms(8),
    height: ms(44),
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%',
  },
  inactiveTabText: {
    fontSize: sp(15),
    fontWeight: '400',
    color: COLORS.textQuaternary,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: ms(8),
    paddingHorizontal: ms(20),
    gap: ms(4),
  },
  headerSub: {
    fontSize: sp(16),
    color: COLORS.primary,
    fontWeight: '700',
  },

  bold: {
    fontWeight: '600',
    fontSize: sp(16),
    paddingHorizontal: ms(18),
    color: COLORS.textPrimary,
  },

  whiteCard: {
    backgroundColor: '#fff',
    borderRadius: ms(15),
    paddingTop: ms(12),
    paddingHorizontal: ms(6),
    marginTop: ms(14),
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    marginHorizontal: ms(15),
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: ms(8),
    paddingHorizontal: ms(12),
  },

  divider: {
    height: 1,
    backgroundColor: '#000',
    marginVertical: ms(6),
    marginHorizontal: ms(12),
  },

  label: {
    fontSize: sp(15),
    color: COLORS.textPrimary,
  },

  lowerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ms(20),
  },
  lowerTitle: {
    color: COLORS.primary,
    fontSize: sp(16),
    fontWeight: '400',
  },

  naText: {
    color: COLORS.black,
    fontSize: sp(15),
    fontWeight: '400',
    paddingHorizontal: ms(12),
    paddingBottom: ms(14),
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    padding: ms(20),
    borderTopLeftRadius: ms(28),
    borderTopRightRadius: ms(28),
  },
  modalTitle: {
    fontSize: sp(22),
    fontWeight: '500',
    marginBottom: ms(12),
    color: COLORS.textPrimary,
  },
  expImage: {
    borderWidth: 1,
    borderColor: '#382f2f',
    borderRadius: ms(20),
    padding: ms(10),
    marginVertical: ms(12),
    height: ms(160),
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadHint: {
    color: '#999',
    fontSize: sp(15),
    marginTop: ms(8),
  },
  expInput: {
    borderWidth: 1,
    borderColor: '#382f2f',
    borderRadius: ms(30),
    paddingHorizontal: ms(16),
    marginBottom: ms(14),
    height: ms(50),
    fontSize: sp(16),
    color: COLORS.textPrimary,
  },
  confirmBtn: {
    borderRadius: ms(30),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    height: ms(50),
    marginTop: ms(4),
  },
  confirmText: {
    fontSize: sp(17),
    color: '#fff',
    fontWeight: '600',
  },
  cancelText: {
    fontSize: sp(17),
    color: COLORS.primary,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: ms(20),
    paddingVertical: ms(8),
  },
});