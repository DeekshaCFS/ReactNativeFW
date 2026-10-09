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
import ExpenseDetailsBody, {
  minExpenseDate,
  toExpenseApiDate,
  toExpenseLabel,
} from '../../../components/ExpenseDetailsBody';

type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, 'Expenditure'>;

const toApiDate = toExpenseApiDate;
const toLabel = toExpenseLabel;
const minSelectableDate = minExpenseDate;

export default function ExpenditureScreen() {
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [date, setDate] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(date);
  const [details, setDetails] = useState<ExpenseDetailsResultData | null>(null);
  const [loading, setLoading] = useState(false);

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

          <ExpenseDetailsBody
            details={details}
            loading={loading}
            onAdd={() => setShowAddExpenseModal(true)}
          />
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

});