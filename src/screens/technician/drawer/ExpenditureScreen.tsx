// src/screens/technician/drawer/ExpenditureScreen.tsx
//
// Port of Java's ExpenseDetailsFragmentNew (technician's own passbook/expenditure
// self-service screen). Loads Expenditure/GetTechnicianExpenditure for the
// selected day (prev/next day arrows, same as the owner's read-only
// TechnicianExpenseDetailsModal) and lets the technician add a new expense
// with a photo via Expenditure/AddExpense.
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Modal, TextInput, Image, ActivityIndicator, Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { TechnicianStackParamList } from '../../../navigation/TechStack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms, sp, scale } from '../../../utils/responsive';
import { requestLocationPermission } from '../../../utils/locationPermision';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';
import {
  getExpenditureDetails,
  updateAddExpense,
} from '../../../api/expenditure/expenditureService';
import type { ExpenseDetailsExpenseList, ExpenseDetailsResultData } from '../../../api/expenditure/expenditure.types';
import { formatAmount } from '../../../utils/decimal';
import { getCurrentUserId, getCurrentUserProfile } from '../../../state/session';

type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, 'Expenditure'>;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Java: mDate = year + "-" + (month + 1) + "-" + day (no zero padding).
const toApiDate = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const toLabel = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

export default function ExpenditureScreen() {
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [date, setDate] = useState(() => new Date());
  const [details, setDetails] = useState<ExpenseDetailsResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullScreenPhoto, setFullScreenPhoto] = useState<string | null>(null);

  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePhoto, setExpensePhoto] = useState<Asset | null>(null);
  const [saving, setSaving] = useState(false);

  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      return;
    }
    setLoading(true);
    try {
      const res = await getExpenditureDetails({ UserId: userId, ExpsDate: toApiDate(date) });
      setDetails(res?.ResultData ?? null);
    } catch {
      setDetails(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Source: ExpenseDetailsFragmentNew.getLastLocation() — requests location permission as soon
  // as the add-expense sheet opens.
  useEffect(() => {
    if (showAddExpenseModal) {
      requestLocationPermission();
    }
  }, [showAddExpenseModal]);

  const shiftDay = (delta: number) =>
    setDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + delta));

  const money = (v?: number) => `${formatAmount(v)}`;
  const rows = [
    { label: 'Credited Amount:', value: details?.CreditedAmonut },
    { label: 'Opening Amount:', value: details?.OpeningBalance },
    { label: 'Earned Amount:', value: details?.EarnedAmount },
    { label: 'Total Expense:', value: details?.Expenses },
    { label: 'Return:', value: details?.ReturnAmount },
  ];
  const expenses: ExpenseDetailsExpenseList[] = Array.isArray(details?.ExpenseList)
    ? (details?.ExpenseList as ExpenseDetailsExpenseList[])
    : [];

  const applyPickedImage = (asset: Asset) => {
    if (!asset.base64) {
      Alert.alert('Photo', 'Unable to read the selected image. Please try again.');
      return;
    }
    setExpensePhoto(asset);
  };

  const captureImageFromCamera = async () => {
    const result = await launchCamera({ mediaType: 'photo', includeBase64: true, quality: 0.6, saveToPhotos: true });
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Camera', result.errorMessage || 'Unable to open camera.');
      return;
    }
    const asset = result.assets?.[0];
    if (asset) applyPickedImage(asset);
  };

  const pickImageFromGallery = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.6, selectionLimit: 1 });
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Gallery', result.errorMessage || 'Unable to open gallery.');
      return;
    }
    const asset = result.assets?.[0];
    if (asset) applyPickedImage(asset);
  };

  const choosePhotoSource = () => {
    Alert.alert('Add/Capture Image', 'Choose an option', [
      { text: 'Camera', onPress: () => captureImageFromCamera() },
      { text: 'Gallery', onPress: () => pickImageFromGallery() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const closeAddExpenseModal = () => {
    setShowAddExpenseModal(false);
    setExpenseName('');
    setExpenseAmount('');
    setExpensePhoto(null);
  };

  const submitExpense = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      return;
    }
    if (!expenseName.trim()) {
      Alert.alert('Add Expense', 'Please enter an expense name.');
      return;
    }
    const amount = Number(expenseAmount);
    if (!expenseAmount || !Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Add Expense', 'Please enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      const res = await updateAddExpense({
        Amount: amount,
        ExpenseName: expenseName.trim(),
        UserId: userId,
        ExpensePhoto: expensePhoto?.base64 ?? '',
      });
      if (res?.Code === '200' || /success/i.test(res?.Message ?? '')) {
        closeAddExpenseModal();
        load();
      } else {
        Alert.alert('Add Expense', res?.Message || 'Unable to add expense right now.');
      }
    } catch (e) {
      Alert.alert('Add Expense', e instanceof Error ? e.message : 'Unable to add expense right now.');
    } finally {
      setSaving(false);
    }
  };

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
            onPress={() => navigation.popTo('TechnicianTabsRoot', { screen: 'Passbook' })}
          >
            <Text style={styles.inactiveTabText}>PASSBOOK</Text>
          </Pressable>
        </View>

        <View style={styles.headerRow}>
          <Pressable onPress={() => shiftDay(-1)} hitSlop={10}>
            <Ionicons name="chevron-back" size={scale(18)} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerSub}>{toLabel(date)}</Text>
          <Pressable onPress={() => shiftDay(1)} hitSlop={10}>
            <Ionicons name="chevron-forward" size={scale(18)} color={COLORS.primary} />
          </Pressable>
        </View>

        <Text style={styles.bold} numberOfLines={1}>{details?.FullName || getCurrentUserProfile().userFirstName}</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: ms(20) }} color={COLORS.primary} />
        ) : (
          <>
            <View style={styles.whiteCard}>
              {rows.map(({ label, value }) => (
                <View key={label} style={styles.rowBetween}>
                  <Text style={styles.label}>{label}</Text>
                  <Text style={styles.bold}>{money(value)}</Text>
                </View>
              ))}

              <View style={styles.divider} />

              <View style={styles.rowBetween}>
                <Text style={styles.bold}>Remaining Amount:</Text>
                <Text style={styles.bold}>{money(details?.RemainingBalance)}</Text>
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
              {expenses.length === 0 ? (
                <Text style={styles.naText}>NA</Text>
              ) : (
                expenses.map((item, index) => (
                  <View key={index} style={styles.expenseRow}>
                    {item.ExpensePhoto ? (
                      <Pressable onPress={() => setFullScreenPhoto(item.ExpensePhoto ?? null)}>
                        <Image source={{ uri: item.ExpensePhoto }} style={styles.expensePhoto} />
                      </Pressable>
                    ) : (
                      <View style={[styles.expensePhoto, styles.photoPlaceholder]}>
                        <Ionicons name="image-outline" size={scale(20)} color="#9aa0a6" />
                      </View>
                    )}
                    <Text style={styles.expenseName} numberOfLines={1}>{item.ExpenseName}</Text>
                    <Text style={styles.bold}>{money(item.Amount)}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal transparent visible={showAddExpenseModal} animationType="slide" onRequestClose={closeAddExpenseModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + ms(16) }]}>
            <Text style={styles.modalTitle}>Add Expense</Text>

            {/* Photo Upload */}
            <Pressable style={styles.expImage} onPress={choosePhotoSource}>
              {expensePhoto?.uri ? (
                <Image source={{ uri: expensePhoto.uri }} style={styles.expImagePreview} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={scale(52)} color="#999" />
                  <Text style={styles.uploadHint}>Upload Expense Photo</Text>
                </>
              )}
            </Pressable>

            <TextInput
              placeholder="Expense Name"
              placeholderTextColor="#999"
              style={styles.expInput}
              returnKeyType="next"
              value={expenseName}
              onChangeText={setExpenseName}
            />

            <TextInput
              placeholder="Please Enter Amount"
              placeholderTextColor="#999"
              style={styles.expInput}
              keyboardType="numeric"
              returnKeyType="done"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
            />

            <Pressable
              style={[styles.confirmBtn, saving && { opacity: 0.6 }]}
              onPress={submitExpense}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>ADD</Text>}
            </Pressable>

            <Pressable onPress={closeAddExpenseModal}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Full-screen photo viewer */}
      <Modal
        visible={!!fullScreenPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setFullScreenPhoto(null)}>
        <Pressable style={styles.fullScreenBackdrop} onPress={() => setFullScreenPhoto(null)}>
          <Pressable style={styles.fullScreenClose} onPress={() => setFullScreenPhoto(null)} hitSlop={10}>
            <Ionicons name="close" size={sp(28)} color="#fff" />
          </Pressable>
          {fullScreenPhoto ? (
            <Image source={{ uri: fullScreenPhoto }} style={styles.fullScreenImage} resizeMode="contain" />
          ) : null}
        </Pressable>
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
    gap: ms(8),
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

  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    paddingHorizontal: ms(12),
    paddingVertical: ms(10),
  },
  expensePhoto: { width: ms(40), height: ms(40), borderRadius: ms(8) },
  photoPlaceholder: { backgroundColor: '#f1f3f4', alignItems: 'center', justifyContent: 'center' },
  expenseName: { flex: 1, fontSize: sp(14), color: COLORS.textPrimary },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: ms(560),
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
    overflow: 'hidden',
  },
  expImagePreview: { width: '100%', height: '100%', borderRadius: ms(18) },
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

  fullScreenBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  fullScreenClose: { position: 'absolute', top: ms(40), right: ms(20), zIndex: 1 },
  fullScreenImage: { width: '100%', height: '80%' },
});
