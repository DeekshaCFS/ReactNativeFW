// src/screens/technician/main/PaymentReceivedScreen.tsx

import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp } from '../../../utils/responsive';
import { formatAmount, sanitizeDecimalInput } from '../../../utils/decimal';
import { getTaskClosureDetails } from '../../../api/taskList/taskListService';
import { getPgActivationStatus } from '../../../api/paymentGateway/paymentGatewayService';
import { updateTaskWithEarnedAmount } from '../../../api/passbook/passbookService';
import type { UpdateTaskWithEarnedAmountExcessDtl as ExcessAmountDetail } from '../../../api/passbook/passbook.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TASK_STATUS_ID } from '../../../constants/taskStatus';
import type { TasksListResultData as Task } from '../../../api/task/task.types';
import { finishTaskFlowToHome } from '../../../navigation/taskFlowNavigation';

const PAYMENT_TRANSACTION_TYPES = ['Cash', 'UPI', 'Online', 'NEFT', 'Cheque', 'Credit', 'Other'] as const;

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

  const [paymentType, setPaymentType] = useState<string>('');

  // Java (TechPaymentReceivedFragmentNew): an optional "Proof of Payment" photo is
  // offered for UPI / Online payments and posted as QRCodeImageFileName / ...Base64Str.
  const [proofPhoto, setProofPhoto] = useState<{ uri: string; base64: string } | null>(null);
  const showProofPicker = paymentType === 'UPI' || paymentType === 'Online';

  const pickProofPhoto = (source: 'camera' | 'gallery') => {
    const options = { mediaType: 'photo' as const, includeBase64: true, quality: 0.8 as const };
    const launch = source === 'camera' ? launchCamera : launchImageLibrary;
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
  const [notes, setNotes] = useState('');
  const [adjustments, setAdjustments] = useState<AdjustmentRow[]>([]);

  const [pgActive, setPgActive] = useState(false);
  const [pgName, setPgName] = useState('');

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
        }

        if (pgRes.status === 'fulfilled') {
          const pg = pgRes.value.ResultData;
          if (pg?.IsActive) {
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

  // ── Adjustment rows (Task_Excess_Amount_Dtls), capped at 5 ──
  const addAdjustmentRow = () => {
    if (adjustments.length >= 5) {
      Alert.alert('', 'You can add up to 5 adjustment entries.');
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
      if (!paymentType) {
        Alert.alert('Required', 'Please select a payment type.');
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

      if (taskAmount != null && taskAmount > 0 && total > taskAmount) {
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
        Notes: notes.trim() || undefined,
        TaskState: PAYMENT_RECEIVED_STATE,
        TaskStatus: TASK_STATUS_ID.Completed,
        PaymentTransactionType: markPending ? 'Payment Pending' : paymentType,
        // Java sends mTextViewAmount's value here — the running total of task amount +
        // adjustments (unchanged from the base task amount when no adjustments were made).
        NewWagePerHours: (taskAmount ?? 0) + (markPending ? 0 : adjustmentTotal),
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
        { text: 'OK', onPress: () => finishTaskFlowToHome(navigation) },
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
        {/* ── Task summary ── */}
        <View style={styles.card}>
          <Text style={styles.taskName}>{routeTask.Name}</Text>
          {taskAmount != null && (
            <Text style={styles.taskAmount}>Task Amount: ₹{formatAmount(taskAmount)}</Text>
          )}
        </View>

        {/* ── Payment Gateway (placeholder) ── */}
        {pgActive && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pay via {pgName}</Text>
            <Text style={styles.cardSubtitle}>
              Collect payment online instead of cash/manual entry.
            </Text>
            <Pressable style={styles.gatewayButton} onPress={handlePayViaGateway}>
              <Ionicons name="card-outline" size={scale(18)} color={COLORS.white} />
              <Text style={styles.gatewayButtonText}>Pay via {pgName}</Text>
            </Pressable>
          </View>
        )}

        {/* ── Manual entry ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Type</Text>
          <View style={styles.chipRow}>
            {PAYMENT_TRANSACTION_TYPES.map(type => (
              <Pressable
                key={type}
                style={[styles.chip, paymentType === type && styles.chipActive]}
                onPress={() => setPaymentType(type)}
              >
                <Text style={[styles.chipText, paymentType === type && styles.chipTextActive]}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          {showProofPicker && (
            <>
              <Text style={[styles.cardTitle, { marginTop: vs(16) }]}>Proof of Payment (optional)</Text>
              <Pressable style={styles.proofBox} onPress={openProofPicker}>
                {proofPhoto ? (
                  <Image source={{ uri: proofPhoto.uri }} style={styles.proofImage} resizeMode="cover" />
                ) : (
                  <View style={styles.proofPlaceholder}>
                    <Ionicons name="camera-outline" size={sp(24)} color={COLORS.primary} />
                    <Text style={styles.chipText}>Add Proof of Payment</Text>
                  </View>
                )}
              </Pressable>
            </>
          )}

          <Text style={[styles.cardTitle, { marginTop: vs(16) }]}>Amount Received</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="decimal-pad"
            value={earnedAmount}
            onChangeText={t => setEarnedAmount(sanitizeDecimalInput(t))}
          />

          <Text style={[styles.cardTitle, { marginTop: vs(16) }]}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Add a note about this payment"
            placeholderTextColor={COLORS.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        {/* ── Adjustments ── */}
        <View style={styles.card}>
          <View style={styles.adjustmentsHeader}>
            <Text style={styles.cardTitle}>Adjustments</Text>
            {adjustments.length < 5 && (
              <Pressable onPress={addAdjustmentRow} style={styles.addRowButton}>
                <Ionicons name="add-circle-outline" size={scale(18)} color={COLORS.primary} />
                <Text style={styles.addRowText}>Add</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.cardSubtitle}>
            Optional extra charges or deductions (e.g. taxes, discounts)
          </Text>

          {adjustments.map((row, index) => (
            <View key={index} style={styles.adjustmentRow}>
              <TextInput
                style={[styles.input, styles.adjustmentDesc]}
                placeholder="Description"
                placeholderTextColor={COLORS.textTertiary}
                value={row.description}
                onChangeText={v => updateAdjustmentRow(index, 'description', v)}
              />
              <TextInput
                style={[styles.input, styles.adjustmentAmount]}
                placeholder="Amount"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="decimal-pad"
                value={row.amount}
                onChangeText={v => updateAdjustmentRow(index, 'amount', sanitizeDecimalInput(v))}
              />
              <Pressable onPress={() => removeAdjustmentRow(index)} style={styles.removeRowButton}>
                <Ionicons name="close-circle" size={scale(20)} color={COLORS.textTertiary} />
              </Pressable>
            </View>
          ))}
        </View>

        {/* ── Actions ── */}
        <Pressable
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={() => handleSubmit(false)}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitButtonText}>Submit Payment & Close Task</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.pendingButton}
          onPress={() =>
            Alert.alert(
              'Mark as Payment Pending?',
              'The task will be closed without recording a received amount.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Confirm', onPress: () => handleSubmit(true) },
              ],
            )
          }
          disabled={submitting}
        >
          <Text style={styles.pendingButtonText}>Mark as Payment Pending</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F7F8' },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F7F8' },
  scrollContent: { padding: scale(16), paddingBottom: vs(40) },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: vs(14),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  taskName: { fontSize: sp(16), fontWeight: '700', color: COLORS.textPrimary },
  taskAmount: { fontSize: sp(14), color: COLORS.textSecondary, marginTop: vs(4) },
  cardTitle: { fontSize: sp(14), fontWeight: '600', color: COLORS.textPrimary },
  cardSubtitle: { fontSize: sp(12), color: COLORS.textMuted, marginTop: vs(2), marginBottom: vs(8) },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(8), marginTop: vs(8) },
  chip: {
    paddingHorizontal: scale(14),
    paddingVertical: vs(7),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: sp(13), color: COLORS.textPrimary },
  chipTextActive: { color: COLORS.white, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: vs(10),
    fontSize: sp(14),
    color: COLORS.textPrimary,
    marginTop: vs(6),
  },
  notesInput: { minHeight: vs(60), textAlignVertical: 'top' },
  proofBox: {
    marginTop: vs(8),
    height: vs(110),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: scale(10),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proofImage: { width: '100%', height: '100%' },
  proofPlaceholder: { alignItems: 'center', gap: vs(4) },
  adjustmentsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addRowButton: { flexDirection: 'row', alignItems: 'center', gap: scale(4) },
  addRowText: { color: COLORS.primary, fontSize: sp(13), fontWeight: '600' },
  adjustmentRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8), marginTop: vs(8) },
  adjustmentDesc: { flex: 2, marginTop: 0 },
  adjustmentAmount: { flex: 1, marginTop: 0 },
  removeRowButton: { padding: scale(4) },
  gatewayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    backgroundColor: COLORS.primary,
    borderRadius: scale(8),
    paddingVertical: vs(12),
    marginTop: vs(4),
  },
  gatewayButtonText: { color: COLORS.white, fontSize: sp(14), fontWeight: '600' },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: scale(10),
    paddingVertical: vs(14),
    alignItems: 'center',
    marginTop: vs(4),
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: COLORS.white, fontSize: sp(15), fontWeight: '700' },
  pendingButton: { alignItems: 'center', paddingVertical: vs(14) },
  pendingButtonText: { color: COLORS.textMuted, fontSize: sp(13), textDecorationLine: 'underline' },
});