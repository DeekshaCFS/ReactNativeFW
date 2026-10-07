// src/screens/technician/drawer/ExpenditureScreen.tsx
//
// Port of Java's ExpenseDetailsFragmentNew (technician's own passbook/expenditure
// self-service screen). Loads Expenditure/GetTechnicianExpenditure for the
// selected day (prev/next day arrows, same as the owner's read-only
// TechnicianExpenseDetailsModal) and lets the technician add a new expense
// with a photo via Expenditure/AddExpense.
import { launchCameraWithPermission } from '../../../utils/cameraPermission';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, Image, ActivityIndicator, Alert, Platform,
} from 'react-native';
import Modal from '../../../components/AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { COLORS } from '../../../theme/theme';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { TechnicianStackParamList } from '../../../navigation/TechStack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms, sp, scale, vs, useAppHeaderHeight } from '../../../utils/responsive';
import { requestLocationPermission } from '../../../utils/locationPermision';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import {
  getExpenditureDetails,
  updateAddExpense,
} from '../../../api/expenditure/expenditureService';
import type { ExpenseDetailsExpenseList, ExpenseDetailsResultData } from '../../../api/expenditure/expenditure.types';
import { formatAmount } from '../../../utils/decimal';
import { getCurrentUserId, getCurrentUserProfile } from '../../../state/session';
import { usePassbookTabOrder } from '../../../state/passbookTabOrder';

type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, 'Expenditure'>;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Java: mDate = year + "-" + (month + 1) + "-" + day (no zero padding).
const toApiDate = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const toLabel = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

// Java (ExpenseDetailsFragmentNew): DatePickerDialog bounds -- today minus
// two months through today.
const minSelectableDate = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 2);
  return d;
};

export default function ExpenditureScreen() {
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [date, setDate] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(date);
  const [details, setDetails] = useState<ExpenseDetailsResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullScreenPhoto, setFullScreenPhoto] = useState<string | null>(null);

  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePhoto, setExpensePhoto] = useState<Asset | null>(null);
  const [saving, setSaving] = useState(false);

  const navigation = useNavigation<NavigationProp>();
  const tabOrder = usePassbookTabOrder();
  const insets = useSafeAreaInsets();
  const headerHeight = useAppHeaderHeight();

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

  // Android's DateTimePicker always shows the OS's own dialog as soon as it's
  // mounted -- it has no inline/embedded mode like iOS does -- so wrapping it
  // in our own Modal+Cancel/OK just stacks a second dialog on top of the
  // native one and reopens it on every re-render. Use the imperative API
  // there instead (native rollable dialog, its own OK/Cancel, matches Java's
  // DatePickerDialog exactly); keep the custom Modal only for iOS, which
  // really does need it to host the inline spinner.
  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        mode: 'date',
        display: 'spinner',
        maximumDate: new Date(),
        minimumDate: minSelectableDate(),
        onValueChange: (_event: DateTimePickerChangeEvent, selected: Date) => setDate(selected),
      });
      return;
    }
    setTempDate(date);
    setShowDatePicker(true);
  };

  const confirmDatePicker = () => {
    setDate(tempDate);
    setShowDatePicker(false);
  };

  const money = (v?: number) => `${formatAmount(v)}`;
  const rows = [
    { label: 'Credited Amount :', value: details?.CreditedAmonut },
    { label: 'Opening Amount :', value: details?.OpeningBalance },
    { label: 'Earned Amount :', value: details?.EarnedAmount },
    { label: 'Total Expense :', value: details?.Expenses },
    { label: 'Return :', value: details?.ReturnAmount },
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
    const result = await launchCameraWithPermission({ mediaType: 'photo', includeBase64: true, quality: 0.6, saveToPhotos: true });
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
        {/* Tab Row — order depends on how the screen was opened (see passbookTabOrder.ts) */}
        <View style={[styles.tabRow, { paddingTop: headerHeight + vs(4) }]}>
          {(tabOrder === 'passbookFirst' ? ['passbook', 'expenditure'] : ['expenditure', 'passbook']).map(t =>
            t === 'expenditure' ? (
              <Pressable key={t} style={styles.activeTab}>
                <Text style={styles.activeTabText}>EXPENDITURE</Text>
              </Pressable>
            ) : (
              <Pressable key={t} style={styles.inactiveTab} onPress={() => navigation.navigate('Passbook')}>
                <Text style={styles.inactiveTabText}>PASSBOOK</Text>
              </Pressable>
            ),
          )}
        </View>

        <View style={styles.content}>
          <Pressable style={styles.dateRow} onPress={openDatePicker}>
            <Text style={styles.dateText}>{toLabel(date)}</Text>
            <Ionicons name="chevron-down" size={scale(18)} color={COLORS.primary} />
          </Pressable>

          <View style={styles.nameRow}>
            <Text style={styles.techName} numberOfLines={1}>
              {details?.FullName || getCurrentUserProfile().userFirstName}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: ms(20) }} color={COLORS.primary} />
          ) : (
            <>
              <View style={styles.detailsCard}>
                <View style={styles.detailsBody}>
                  {rows.map(({ label, value }, i) => (
                    <View key={label} style={[styles.rowBetween, i > 0 && { marginTop: vs(10) }]}>
                      <Text style={styles.label}>{label}</Text>
                      <Text style={styles.value}>{money(value)}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.divider} />
                <View style={styles.remainingRow}>
                  <Text style={styles.value}>Remaining Amount :</Text>
                  <Text style={styles.value}>{money(details?.RemainingBalance)}</Text>
                </View>
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

              {expenses.length === 0 ? (
                <View style={styles.naCard}>
                  <Text style={styles.naText}>NA</Text>
                </View>
              ) : (
                expenses.map((item, index) => (
                  <View key={index} style={styles.expenseCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.expenseName} numberOfLines={1}>{item.ExpenseName}</Text>
                      <Text style={styles.expenseAmount} numberOfLines={1}>{money(item.Amount)}</Text>
                    </View>
                    <Pressable
                      disabled={!item.ExpensePhoto}
                      onPress={() => setFullScreenPhoto(item.ExpensePhoto ?? null)}
                      style={styles.expensePhotoBox}
                    >
                      {item.ExpensePhoto ? (
                        <Image source={{ uri: item.ExpensePhoto }} style={styles.expensePhoto} />
                      ) : (
                        <Ionicons name="image-outline" size={scale(22)} color={COLORS.ink} />
                      )}
                    </Pressable>
                  </View>
                ))
              )}
            </>
          )}
        </View>
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
                  <Ionicons name="image-outline" size={scale(42)} color={COLORS.lightGray} />
                  <Text style={styles.uploadHint}>Upload Expense Photo</Text>
                </>
              )}
            </Pressable>

            <TextInput
              placeholder="Expense Name"
              placeholderTextColor={COLORS.lightGray}
              style={styles.expInput}
              returnKeyType="next"
              value={expenseName}
              onChangeText={setExpenseName}
            />

            <TextInput
              placeholder="Please Enter Amount"
              placeholderTextColor={COLORS.lightGray}
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

      {/* Rollable date picker (Java: DatePickerDialog, min = today - 2 months).
          iOS only -- Android uses the imperative DateTimePickerAndroid API
          in openDatePicker() instead. */}
      {Platform.OS === 'ios' && (
        <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
          <Pressable style={styles.overlay} onPress={() => setShowDatePicker(false)} />
          <View style={styles.centerModal}>
            <Text style={styles.datePickerTitle}>Select Date</Text>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              minimumDate={minSelectableDate()}
              onValueChange={(_event: DateTimePickerChangeEvent, selected: Date) => setTempDate(selected)}
              onDismiss={() => setShowDatePicker(false)}
            />
            <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#eee', marginTop: ms(12) }}>
              <Pressable style={{ flex: 1, paddingVertical: ms(14), alignItems: 'center' }} onPress={() => setShowDatePicker(false)}>
                <Text style={{ fontSize: sp(15), color: '#888' }}>Cancel</Text>
              </Pressable>
              <Pressable style={{ flex: 1, paddingVertical: ms(14), alignItems: 'center' }} onPress={confirmDatePicker}>
                <Text style={{ fontSize: sp(15), color: COLORS.primary, fontWeight: '600' }}>OK</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  centerModal: {
    position: 'absolute',
    top: '25%',
    left: '8%',
    right: '8%',
    backgroundColor: '#fff',
    padding: ms(16),
    borderRadius: ms(12),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  datePickerTitle: { fontSize: sp(17), fontWeight: '600', marginBottom: ms(8), color: COLORS.textPrimary, textAlign: 'center' },

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
  activeTabText: { fontSize: sp(15), fontWeight: '600', color: COLORS.primary },
  inactiveTab: { flex: 1, height: ms(44), alignItems: 'center', justifyContent: 'center' },
  inactiveTabText: { fontSize: sp(15), fontWeight: '400', color: COLORS.textQuaternary },

  // Java expense_details_new: 10dp content padding, everything on white.
  content: { padding: scale(10) },
  dateRow: { flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: scale(4) },
  dateText: { fontSize: sp(16), fontWeight: '700', color: COLORS.primary },
  nameRow: { margin: scale(10) },
  techName: { fontSize: sp(15), fontWeight: '700', color: COLORS.ink, paddingLeft: scale(5) },

  detailsCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: scale(10),
    marginTop: vs(10),
    borderRadius: scale(12),
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  detailsBody: { padding: scale(15) },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: sp(14), color: COLORS.ink },
  value: { fontSize: sp(14), fontWeight: '700', color: COLORS.ink },
  divider: { height: 1, marginTop: vs(10), backgroundColor: COLORS.lightGray },
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: scale(15),
    marginTop: vs(10),
    marginBottom: vs(20),
  },

  lowerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: scale(10),
    marginTop: vs(20),
  },
  lowerTitle: { color: COLORS.primary, fontSize: sp(16) },

  naCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: scale(10),
    marginTop: vs(10),
    borderRadius: scale(8),
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  naText: { margin: scale(10), fontSize: sp(14), color: COLORS.ink },

  // Java expense_list_new
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: scale(15),
    marginVertical: scale(10),
    padding: scale(20),
    borderRadius: scale(12),
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  expenseName: { fontSize: sp(16), fontWeight: '700', color: COLORS.ink },
  expenseAmount: { fontSize: sp(12), color: COLORS.textBlack, marginTop: vs(5) },
  expensePhotoBox: {
    width: scale(40),
    height: scale(40),
    padding: 1,
    borderRadius: scale(8),
    borderWidth: 0.7,
    borderColor: COLORS.passbookBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  expensePhoto: { width: '100%', height: '100%', borderRadius: scale(7) },

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
    marginBottom: ms(12),
    color: COLORS.ink,
  },
  expImage: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: ms(34),
    padding: ms(10),
    marginVertical: ms(12),
    height: ms(145),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  expImagePreview: { width: '100%', height: '100%', borderRadius: ms(18) },
  uploadHint: {
    color: COLORS.lightGray,
    fontSize: sp(18),
    marginTop: ms(4),
  },
  expInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: ms(34),
    paddingHorizontal: ms(16),
    marginBottom: ms(16),
    height: ms(42),
    fontSize: sp(16),
    color: COLORS.ink,
  },
  confirmBtn: {
    borderRadius: ms(30),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    height: ms(46),
    marginTop: ms(8),
  },
  confirmText: {
    fontSize: sp(18),
    color: COLORS.white,
    fontWeight: '500',
  },
  cancelText: {
    fontSize: sp(18),
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: ms(20),
    paddingVertical: ms(8),
  },

  fullScreenBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  fullScreenClose: { position: 'absolute', top: ms(40), right: ms(20), zIndex: 1 },
  fullScreenImage: { width: '100%', height: '80%' },
});