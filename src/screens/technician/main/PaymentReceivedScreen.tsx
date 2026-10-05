// src/screens/technician/main/PaymentReceivedScreen.tsx

import { launchCameraWithPermission } from '../../../utils/cameraPermission';
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import QRCode from 'react-native-qrcode-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp } from '../../../utils/responsive';
import { formatAmount, sanitizeDecimalInput } from '../../../utils/decimal';
import { getTaskClosureDetails } from '../../../api/taskList/taskListService';
import { getPgActivationStatus } from '../../../api/paymentGateway/paymentGatewayService';
import { getProfileDetails } from '../../../api/users/usersService';
import { updateTaskWithEarnedAmount } from '../../../api/passbook/passbookService';
import type { UpdateTaskWithEarnedAmountExcessDtl as ExcessAmountDetail } from '../../../api/passbook/passbook.types';
import type { TaskClosureMultipleItemAssigned as AddedItem } from '../../../api/taskList/taskList.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TASK_STATUS_ID } from '../../../constants/taskStatus';
import type { TasksListResultData as Task } from '../../../api/task/task.types';
import { resetToTabsThen } from '../../../navigation/taskFlowNavigation';
import { getCurrentCurrencySymbol } from '../../../state/session';

// Java (TechPaymentReceivedFragmentNew): first spinner is the mode, the type spinner only
// appears for Offline.
const PAYMENT_MODES = ['Select Payment Mode', 'Online', 'Offline'] as const;
const PAYMENT_TYPES = ['Select Payment Type', 'Cash', 'UPI', 'Online', 'NEFT', 'Cheque', 'Credit', 'Other'] as const;
const MODE_OFFLINE = 'Offline';
const MODE_ONLINE = 'Online';

const PAYMENT_RECEIVED_STATE = 3; // TaskState.PAYMENT_RECEIVED

// Java: DateUtils.getDate(now, "yyyyMMdd_HHmmss")
const proofFileTimestamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

interface AdjustmentRow {
  description: string;
  amount: string;
}

export default function PaymentReceivedScreen({ navigation, route }: any) {
  const { task: routeTask, elapsedSeconds = 0 } = route.params as {
    task: Task;
    elapsedSeconds?: number;
  };

  const [loadingContext, setLoadingContext] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [taskAmount, setTaskAmount] = useState<number | null>(
    routeTask.WagesPerHours ?? null,
  );

  const [paymentMode, setPaymentMode] = useState<string>('');
  const [paymentType, setPaymentType] = useState<string>('');

  // Java (TechPaymentReceivedFragmentNew): an optional "Proof of Payment" photo is
  // offered for UPI / Online payments and posted as QRCodeImageFileName / ...Base64Str.
  const [proofPhoto, setProofPhoto] = useState<{ uri: string; base64: string } | null>(null);
  // Java (spinPaymntMode listener): UPI / Online -> QR image + "+ Add Proof of Payment";
  // Cash -> Tax field; any other type shows nothing extra.
  const showProofPicker = paymentMode === MODE_OFFLINE && (paymentType === 'UPI' || paymentType === 'Online');
  const showTaxForCash = paymentMode === MODE_OFFLINE && paymentType === 'Cash';
  const [proofBoxOpen, setProofBoxOpen] = useState(false);
  const [tax, setTax] = useState('');
  const [upiQrUri, setUpiQrUri] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [upiQrFailed, setUpiQrFailed] = useState(false);

  const pickProofPhoto = (source: 'camera' | 'gallery') => {
    const options = { mediaType: 'photo' as const, includeBase64: true, quality: 0.8 as const };
    const launch = source === 'camera' ? launchCameraWithPermission : launchImageLibrary;
    launch(options).then(result => {
      const asset = result.assets?.[0];
      if (asset?.uri && asset.base64) {
        setProofPhoto({ uri: asset.uri, base64: asset.base64 });
      }
    }).catch(() => {
      Alert.alert('Error', 'Could not load the photo.');
    });
  };

  const openProofPicker = () =>
    Alert.alert('Proof of Payment', 'Select an option', [
      { text: 'Take Photo', onPress: () => pickProofPhoto('camera') },
      { text: 'Choose from Gallery', onPress: () => pickProofPhoto('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  const [earnedAmount, setEarnedAmount] = useState('');
  const [adjustments, setAdjustments] = useState<AdjustmentRow[]>([]);
  const [pickerOpen, setPickerOpen] = useState<'mode' | 'type' | null>(null);

  const [pgActive, setPgActive] = useState(false);
  const [pgName, setPgName] = useState('');
  const currencySymbol = getCurrentCurrencySymbol();
  const taskCurrency = !currencySymbol || currencySymbol === 'Rs.' ? '\u20B9' : currencySymbol;
  const totalCurrency = currencySymbol || 'Rs.';

  // Items used/added during task closure (Java: TaskClosure.MultipleItemAssigned,
  // rendered on TechPaymentReceivedFragmentNew as a Name / Qty / Price breakdown).
  const [addedItems, setAddedItems] = useState<AddedItem[]>([]);

  // ── Load context: closure detail (for reference amount) + gateway status ──
  useEffect(() => {
    (async () => {
      try {
        const uid = await AsyncStorage.getItem('uid');
        const userId = Number(uid) || 0;

        const results = await Promise.allSettled([
          getTaskClosureDetails({ UserId: userId, TaskID: routeTask.Id }),
          // Java (getPG_ActivationStatus) passes the logged-in user's own id.
          getPgActivationStatus({ UserId: userId }),
        ]);

        const [closureRes, pgRes] = results;

        if (closureRes.status === 'fulfilled') {
          const closure = closureRes.value.ResultData as any;
          // Fall back to closure-derived amount if the task itself didn't carry WagesPerHours
          if (taskAmount == null && closure) {
            const inferred =
              closure.WagesPerHours ?? closure.TaskAmount ?? null;
            if (inferred != null) setTaskAmount(Number(inferred));
          }
          // Java only folds the item total into the running total for non-quotation
          // tasks (getQuotationId() == 0) -- a quotation-based task's amount is the
          // quoted price alone.
          if (closure?.MultipleItemAssigned && !routeTask.QuotationId) {
            setAddedItems(closure.MultipleItemAssigned);
          }
        }

        if (pgRes.status === 'fulfilled') {
          const pg = pgRes.value.ResultData;
          // Java (getPG_ActivationStatus): active when ResultData carries both keys.
          if (pg?.APIKey && pg?.SecretKey) {
            setPgActive(true);
            setPgName(pg.PaymentGatewayName || 'Online Payment Gateway');
          }
        }
      } catch {
        // Non-fatal — screen still works with manual entry only
      } finally {
        setLoadingContext(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Java (getProfileDetails): choosing UPI loads the owner's QR code image.
  useEffect(() => {
    if (!(paymentMode === MODE_OFFLINE && (paymentType === 'UPI' || paymentType === 'Online'))) return;
    let active = true;
    (async () => {
      try {
        const uid = Number(await AsyncStorage.getItem('uid')) || 0;
        const res = await getProfileDetails({ UserId: uid });
        const owner = res?.ResultData?.ownerAccountDetailsDto;
        if (active) {
          setUpiQrUri(owner?.QRCodeImage || '');
          setUpiQrFailed(false);
          setPaymentLink(owner?.PaymentLink || '');
        }
      } catch {
        if (active) {
          setUpiQrUri('');
          setPaymentLink('');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [paymentMode, paymentType]);

  // Java: getTotal() -- sum(item.UsedItemQty * item.SalesPrice).
  const itemsTotal = useMemo(
    () => addedItems.reduce((sum, item) => sum + (item.UsedItemQty ?? 0) * (item.SalesPrice ?? 0), 0),
    [addedItems],
  );

  const servicesTotal = useMemo(
    () => adjustments.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    [adjustments],
  );

  // Java: mTextViewAmount -- (items) + Task Amount + (services), shown as a
  // reference total and used as the "can't exceed this" ceiling on submit.
  const grandTotal = (taskAmount ?? 0) + itemsTotal + servicesTotal;

  // ── Adjustment rows (Task_Excess_Amount_Dtls), capped at 5 ──
  const addAdjustmentRow = () => {
    if (adjustments.length >= 5) {
      Alert.alert('', 'You can add up to 5 adjustment entries.');
      return;
    }
    // Java: a new service row is only added once the previous one has been filled in.
    const last = adjustments[adjustments.length - 1];
    if (last && !last.description.trim() && !last.amount.trim()) {
      Alert.alert('', 'Please Enter Amount and Description!!');
      return;
    }
    setAdjustments(prev => [...prev, { description: '', amount: '' }]);
  };

  const updateAdjustmentRow = (index: number, field: keyof AdjustmentRow, value: string) => {
    setAdjustments(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeAdjustmentRow = (index: number) => {
    setAdjustments(prev => prev.filter((_, i) => i !== index));
  };

  // ── Submit ──
  const handleSubmit = async (markPendingParam = false) => {
    if (!markPendingParam) {
      if (!earnedAmount.trim() || Number.isNaN(Number(earnedAmount))) {
        Alert.alert('Required', 'Please enter the amount received.');
        return;
      }
    }

    const isZeroAmount = !markPendingParam && Number(earnedAmount) === 0;
    const markPending = markPendingParam || isZeroAmount;

    let adjustmentTotal = 0;
    if (!markPending) {
      if (!paymentMode) {
        Alert.alert('Required', 'Select Payment Mode');
        return;
      }
      if (paymentMode === MODE_OFFLINE && !paymentType) {
        Alert.alert('Required', 'Select Payment Type');
        return;
      }
      for (const row of adjustments) {
        if (row.amount.trim() && !row.description.trim()) {
          Alert.alert('Required', 'Please enter a description for each adjustment amount.');
          return;
        }
      }

      adjustmentTotal = adjustments.reduce(
        (sum, row) => sum + (Number(row.amount) || 0),
        0,
      );
      const total = Number(earnedAmount) + adjustmentTotal;

      if (grandTotal > 0 && total > grandTotal) {
        Alert.alert('', 'Received amount cannot be greater than the total task amount.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const uid = await AsyncStorage.getItem('uid');
      if (!uid) {
        Alert.alert('Error', 'User session not found. Please log in again.');
        return;
      }
      const userId = Number(uid);
      const now = new Date().toISOString();

      const excessDtls: ExcessAmountDetail[] = markPending
        ? []
        : adjustments
            .filter(row => row.amount.trim() !== '')
            .map(row => ({
              Excess_Amount_Id: 0,
              TaskId: routeTask.Id,
              Excess_Amount_Des: row.description.trim(),
              Excess_Amount: Number(row.amount),
              IsActive: true,
              UserId: userId,
              CreatedBy: userId,
              CreatedDate: now,
              UpdatedBy: userId,
              UpdatedDate: now,
            }));

      const res = await updateTaskWithEarnedAmount({
        Id: 0,
        EarningAmount: markPending ? 0 : Number(earnedAmount),
        TaskId: routeTask.Id,
        UserId: userId,
        TaskState: PAYMENT_RECEIVED_STATE,
        TaskStatus: TASK_STATUS_ID.Completed,
        // Java: Online mode posts "RazorPay"; Offline posts the chosen payment type.
        PaymentTransactionType: markPending ? 'Payment Pending' : paymentMode === MODE_ONLINE ? 'RazorPay' : paymentType,
        // Java sends mTextViewAmount's value here — items + Task Amount + adjustments
        // (unchanged from the base task amount when there are no items/adjustments).
        NewWagePerHours: (taskAmount ?? 0) + itemsTotal + (markPending ? 0 : adjustmentTotal),
        Task_Excess_Amount_Dtls: excessDtls,
        // Only attach proof when it applies to the chosen payment type.
        ...(!markPending && showProofPicker && proofPhoto && {
          QRCodeImageFileName: `${proofFileTimestamp()}_ProofOfPaymntImg_.jpg`,
          QRCodeImageFileBase64Str: proofPhoto.base64,
        }),
      });

      if (res.Code !== '200') {
        Alert.alert('Failed', res.Message || 'Could not update payment.');
        return;
      }

      Alert.alert('Task Completed', 'Payment recorded and the task has been closed.', [
        // Java: after payment the Tasks tab is shown with the Document Upload sheet on top.
        { text: 'OK', onPress: () => resetToTabsThen(navigation, { name: 'DocumentUpload', params: { task: routeTask } }) },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.Message || err?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Gateway placeholder ──
  const handlePayViaGateway = () => {
    Alert.alert(
      'Coming soon',
      'Online payment via gateway is not yet enabled — order creation needs to be implemented server-side first. Please collect payment manually for now.',
    );
  };

  const selectMode = (mode: string) => {
    setPickerOpen(null);
    if (mode === 'Select Payment Mode') {
      setPaymentMode('');
      setPaymentType('');
      return;
    }
    if (mode === MODE_ONLINE && !pgActive) {
      // Java: Online Payment Mode is not activated for your account.
      Alert.alert('', 'Online Payment Mode is not activated for your account !');
      setPaymentMode('');
      setPaymentType('');
      return;
    }
    setPaymentMode(mode);
    setPaymentType('');
    setProofBoxOpen(false);
  };

  if (loadingContext) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Task details ── */}
        <View style={[styles.card, styles.taskCard]}>
          <Text style={styles.taskName}>{routeTask.Name}</Text>
          <Text style={[styles.sectionTitle, { marginTop: vs(14) }]}>Task Details :</Text>

          <View style={styles.itemLine}>
            <Text style={styles.taskname}>{routeTask.Name}</Text>
            <Text style={styles.taskAmount}>{taskCurrency} {formatAmount(taskAmount ?? 0)}</Text>
          </View>

          {addedItems.map((item, idx) => (
            <View key={idx} style={styles.itemLine}>
              <Text style={styles.itemName}>
                {item.ItemName}
              </Text>
              <Text style={styles.itemQty}>
                {(item.UsedItemQty ?? 0) > 0 ? ` ${item.UsedItemQty}` : ''}
              </Text>
              <Text style={styles.itemPrice}>
                {taskCurrency} {formatAmount((item.UsedItemQty ?? 0) * (item.SalesPrice ?? 0))}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Services (Java: "+ Add Services", up to 5 description/amount rows) ── */}
        <View style={[styles.card, styles.tintedCard]}>
          <Text style={styles.sectionTitle}>Services</Text>

          {adjustments.map((row, index) => (
            <View key={index} style={{ marginTop: vs(6) }}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceNo}>#{index + 1}</Text>
                <Pressable onPress={() => removeAdjustmentRow(index)} hitSlop={8}>
                  <Ionicons name="close" size={scale(24)} color={COLORS.primary} />
                </Pressable>
              </View>
              <View style={styles.adjustmentRow}>
                <TextInput
                  style={[styles.pillInput, { flex: 1.3 }]}
                  placeholder="Description"
                  placeholderTextColor="#9CA3AF"
                  value={row.description}
                  onChangeText={v => updateAdjustmentRow(index, 'description', v)}
                />
                <TextInput
                  style={[styles.pillInput, { flex: 0.7 }]}
                  placeholder="Amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={row.amount}
                  onChangeText={v => updateAdjustmentRow(index, 'amount', sanitizeDecimalInput(v))}
                />
              </View>
            </View>
          ))}

          <Pressable onPress={addAdjustmentRow} style={styles.addRowButton}>
            <Text style={styles.addRowText}>+ Add Services</Text>
          </Pressable>
        </View>

        {/* ── Payment mode / type ── */}
        <View style={styles.selectWrap}>
          <Pressable style={styles.selectBox} onPress={() => setPickerOpen('mode')}>
            <Text style={styles.selectText}>{paymentMode || 'Select Payment Mode'}</Text>
            <Ionicons name="chevron-down" size={scale(20)} color="#1d2536" />
          </Pressable>

          {paymentMode === MODE_OFFLINE && (
            <Pressable style={styles.selectBox} onPress={() => setPickerOpen('type')}>
              <Text style={styles.selectText}>{paymentType || 'Select Payment Type'}</Text>
              <Ionicons name="chevron-down" size={scale(20)} color="#1d2536" />
            </Pressable>
          )}

          {/* Java: UPI shows the owner's QR image (profile avatar until/unless it loads);
              Online shows a QR generated from the owner's payment link. */}
          {paymentMode === MODE_OFFLINE && paymentType === 'UPI' && (
            upiQrUri && !upiQrFailed ? (
              <Image
                source={{ uri: upiQrUri }}
                style={styles.qrImage}
                resizeMode="stretch"
                onError={() => setUpiQrFailed(true)}
              />
            ) : (
              <View style={[styles.qrImage, styles.avatarWrap]}>
                <Ionicons name="person-circle-outline" size={scale(120)} color="#9CA3AF" />
              </View>
            )
          )}
          {paymentMode === MODE_OFFLINE && paymentType === 'Online' && !!paymentLink && (
            <View style={styles.qrImage}>
              <QRCode value={paymentLink} size={scale(120)} />
            </View>
          )}
        </View>

        {/* ── Payment Details ── */}
        <View style={[styles.card, styles.tintedCard, { marginTop: vs(10) }]}>
          <Text style={[styles.sectionTitle, { marginTop: vs(5) }]}>Payment Details</Text>
          <View style={styles.detailsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Task Amount</Text>
              <Text style={styles.totalCurrency}>{totalCurrency}</Text>
              <Text style={styles.totalValue}>{formatAmount(grandTotal)}</Text>
            </View>

            <View style={styles.amountReceivedRow}>
              <Text style={styles.amountReceivedLabel}>Amount Received</Text>
              <TextInput
                style={styles.amountReceivedInput}
                placeholder="Amount"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={earnedAmount}
                onChangeText={t => setEarnedAmount(sanitizeDecimalInput(t))}
                onBlur={() => {
                  if (earnedAmount.trim() && !Number.isNaN(Number(earnedAmount))) {
                    setEarnedAmount(formatAmount(earnedAmount));
                  }
                }}
              />
            </View>

            {showTaxForCash && (
              <View style={styles.amountReceivedRow}>
                <Text style={styles.amountReceivedLabel}>Tax</Text>
                <TextInput
                  style={styles.amountReceivedInput}
                  placeholder="Discount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={3}
                  value={tax}
                  onChangeText={t => setTax(t.replace(/[^0-9]/g, ''))}
                />
              </View>
            )}

            {showProofPicker && (
              <View style={styles.proofWrap}>
                {(proofBoxOpen || proofPhoto) && (
                  <Pressable style={styles.proofBox} onPress={openProofPicker}>
                    {proofPhoto ? (
                      <Image source={{ uri: proofPhoto.uri }} style={styles.proofImage} resizeMode="cover" />
                    ) : (
                      <Ionicons name="camera-outline" size={sp(44)} color="#848891" />
                    )}
                  </Pressable>
                )}
                {!proofPhoto && !proofBoxOpen && (
                  <Pressable onPress={() => setProofBoxOpen(true)}>
                    <Text style={styles.addRowText}>+ Add Proof of Payment</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>

        {/* ── Actions (Java: Close Task for Offline, Make Payment for Online) ── */}
        {paymentMode === MODE_OFFLINE && (
          <Pressable
            style={[styles.actionButton, submitting && styles.submitButtonDisabled]}
            onPress={() => handleSubmit(false)}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.actionButtonText}>CLOSE TASK</Text>
            )}
          </Pressable>
        )}
        {paymentMode === MODE_ONLINE && (
          <Pressable style={styles.actionButton} onPress={handlePayViaGateway}>
            <Text style={styles.actionButtonText}>Make Payment</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Mode / type picker */}
      <Modal visible={pickerOpen !== null} transparent animationType="fade" onRequestClose={() => setPickerOpen(null)}>
        <Pressable style={styles.overlay} onPress={() => setPickerOpen(null)} />
        <View style={styles.pickerModal}>
          {(pickerOpen === 'mode' ? PAYMENT_MODES : PAYMENT_TYPES).map(option => (
            <Pressable
              key={option}
              style={styles.pickerItem}
              onPress={() => {
                if (pickerOpen === 'mode') {
                  selectMode(option);
                } else {
                  setPaymentType(option === 'Select Payment Type' ? '' : option);
                  setProofBoxOpen(false);
                  setPickerOpen(null);
                }
              }}
            >
              <Text style={styles.pickerItemText}>{option}</Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const DARK = '#1d2536';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA' },
  scrollContent: { paddingTop: vs(12), paddingBottom: vs(40) },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: scale(30),
    padding: scale(12),
    marginBottom: vs(12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  taskCard: { paddingBottom: vs(40), paddingTop: vs(10) },
  tintedCard: { backgroundColor: '#fff0f3' },

  taskName: { fontSize: sp(20), fontWeight: '700', color: DARK, textAlign: 'center' },
  sectionTitle: { fontSize: sp(17), fontWeight: '700', color: DARK },
  taskname: { fontSize: sp(13), fontWeight: '700', color: COLORS.primary },
  taskAmount: { fontSize: sp(13), fontWeight: '700', color: COLORS.success, marginTop: vs(4) },
  itemLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: scale(5), marginTop: vs(10) },
  itemName: { flex: 1, fontSize: sp(13), fontWeight: '500', color: COLORS.charcoal, marginRight: scale(8) },
  itemQty: { fontSize: sp(13), fontWeight: '500', color: COLORS.charcoal, marginRight: scale(100) },
  itemPrice: { fontSize: sp(13), fontWeight: '500', color: COLORS.charcoal },

  serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: scale(15), paddingVertical: vs(4) },
  serviceNo: { fontSize: sp(15), fontWeight: '700', color: COLORS.primary },
  adjustmentRow: { flexDirection: 'row', gap: scale(10), paddingHorizontal: scale(5) },
  pillInput: {
    height: vs(44),
    borderWidth: 1,
    borderColor: '#9CA3AF',
    borderRadius: scale(34),
    paddingHorizontal: scale(14),
    fontSize: sp(16),
    color: DARK,
    backgroundColor: COLORS.white,
  },
  addRowButton: { height: vs(30), marginTop: vs(10), alignItems: 'center', justifyContent: 'center' },
  addRowText: { color: COLORS.primary, fontSize: sp(20), fontWeight: '700' },

  selectWrap: { paddingHorizontal: scale(10), marginTop: vs(10), gap: vs(8) },
  selectBox: {
    height: vs(40),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    marginHorizontal: scale(5),
  },
  selectText: { fontSize: sp(18), color: DARK },

  detailsBox: {
    marginTop: vs(5),
    padding: scale(20),
  },
  totalRow: { flexDirection: 'row', alignItems: 'center' },
  totalLabel: { flex: 1, fontSize: sp(16), color: '#6B7280' },
  totalCurrency: { fontSize: sp(16), color: '#6B7280', marginRight: scale(18) },
  totalValue: { fontSize: sp(18), fontWeight: '700', color: COLORS.success },
  amountReceivedRow: { flexDirection: 'row', alignItems: 'center', marginTop: vs(14) },
  amountReceivedLabel: { flex: 0.6, fontSize: sp(17), fontWeight: '700', color: COLORS.primary },
  amountReceivedInput: {
    flex: 0.4,
    height: vs(52),
    borderWidth: 1,
    borderColor: '#9CA3AF',
    borderRadius: scale(34),
    paddingHorizontal: scale(16),
    fontSize: sp(18),
    color: DARK,
    backgroundColor: 'transparent',
  },
  proofWrap: { marginTop: vs(14), alignItems: 'center' },
  proofBox: {
    height: vs(100),
    width: scale(160),
    borderWidth: 1,
    borderColor: '#9CA3AF',
    borderRadius: scale(14),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofImage: { width: '100%', height: '100%' },
  avatarWrap: { alignItems: 'center', justifyContent: 'center' },
  qrImage: { width: scale(170), height: scale(170), alignSelf: 'center', padding: scale(25) },

  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: scale(34),
    paddingVertical: vs(14),
    alignItems: 'center',
    marginHorizontal: scale(40),
    marginTop: vs(30),
  },
  actionButtonText: { color: COLORS.white, fontSize: sp(18), fontWeight: '500' },
  submitButtonDisabled: { opacity: 0.6 },

  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerModal: {
    position: 'absolute',
    top: '30%',
    left: scale(24),
    right: scale(24),
    backgroundColor: COLORS.white,
    borderRadius: scale(8),
    paddingVertical: scale(6),
  },
  pickerItem: { paddingVertical: vs(14), paddingHorizontal: scale(16) },
  pickerItemText: { fontSize: sp(17), color: DARK },
});
