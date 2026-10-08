// src/screens/technician/drawer/RoutineServiceAcceptModal.tsx
//
// Android's TaskDialogNew.startTaskSelfCreation (dialog_accept_task_routine_service.xml):
// shown after a Routine Service lookup finds a customer. Lets the technician name the
// task, pick AMC/Rate and (if Rate) a wage, optionally pick an FSR, then creates the
// self-assigned task directly (no separate Add Task form).
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ActivityIndicator, Alert, Linking, FlatList,
} from 'react-native';
import Modal from '../../../components/AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { ms, sp, scale } from '../../../utils/responsive';
import { getFsrBindList } from '../../../api/fsrManagement/fsrManagementService';
import type { FSRBindListDTOResultData } from '../../../api/fsrManagement/fsrManagement.types';
import type { RoutineServiceCustomerListDTOResultData } from '../../../api/fsrManagement/fsrManagement.types';
import { addTaskRoutineService, updateTaskStatus } from '../../../api/task/taskService';
import { TASK_STATUS_ID } from '../../../constants/taskStatus';
import { nowAsJavaTime } from '../../../utils/taskStatus.utils';
import { getCurrentUserId } from '../../../state/session';

type PaymentMode = 'AMC' | 'Rate';

interface Props {
  visible: boolean;
  customer: RoutineServiceCustomerListDTOResultData | null;
  onClose: () => void;
  onCreated: () => void;
}

export default function RoutineServiceAcceptModal({ visible, customer, onClose, onCreated }: Props) {
  const [taskName, setTaskName] = useState('');
  const [taskNameError, setTaskNameError] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('AMC');
  const [wages, setWages] = useState('');
  const [wagesError, setWagesError] = useState('');
  const [fsrList, setFsrList] = useState<FSRBindListDTOResultData[]>([]);
  const [selectedFsr, setSelectedFsr] = useState<FSRBindListDTOResultData | null>(null);
  const [fsrPickerOpen, setFsrPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    // Reset per Java's dialog defaults (AMC checked, everything else blank).
    setTaskName('');
    setTaskNameError('');
    setPaymentMode('AMC');
    setWages('');
    setWagesError('');
    setSelectedFsr(null);

    const userId = getCurrentUserId();
    getFsrBindList({ UserId: userId })
      .then(res => setFsrList(res.ResultData ?? []))
      .catch(() => setFsrList([]));
  }, [visible]);

  const handleCall = () => {
    const number = customer?.MobileNumber;
    if (!number) {
      Alert.alert('', 'Contact Number is not available...!!');
      return;
    }
    Linking.openURL(`tel:${number}`);
  };

  const handleProceed = async () => {
    const trimmedName = taskName;
    if (!trimmedName.trim()) {
      setTaskNameError('Please Enter Task Name');
      return;
    }
    if (/^\s/.test(trimmedName)) {
      setTaskNameError('Space is not allowed');
      return;
    }
    setTaskNameError('');

    let wageValue = 0;
    if (paymentMode === 'Rate') {
      wageValue = Number(wages);
      if (!wages.trim()) {
        setWagesError('Please Enter Rate');
        return;
      }
      if (!Number.isFinite(wageValue) || wageValue === 0) {
        setWagesError('Please Enter valid Amount');
        return;
      }
    }
    setWagesError('');

    const userId = getCurrentUserId();
    const now = new Date();
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const taskDate = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}T00:00:00`;
    const plusFifteen = new Date(now.getTime() + 15 * 60 * 1000);
    const time = `${pad2(plusFifteen.getHours())}:${pad2(plusFifteen.getMinutes())}:${pad2(plusFifteen.getSeconds())}`;

    try {
      setSubmitting(true);
      const res = await addTaskRoutineService({
        Id: 0,
        Name: trimmedName,
        Description: customer?.Description ?? '',
        TaskStatus: TASK_STATUS_ID.InActive,
        TaskType: 1,
        TaskDate: taskDate,
        Time: time,
        LocationId: 0,
        CustomerName: customer?.CustomerName ?? '',
        ContactNo: customer?.MobileNumber ?? '',
        PaymentMode: paymentMode === 'Rate' ? 'Rate' : 'AMC',
        PaymentModeId: paymentMode === 'Rate' ? 2 : 1,
        WagesPerHour: paymentMode === 'Rate' ? wageValue : 0,
        UserId: userId,
        ItemId: 0,
        IsActive: true,
        CreatedBy: userId,
        UpdatedBy: userId,
        LocName: customer?.Address ?? '',
        latitude: '',
        Longitude: '',
        LocDescription: customer?.Description ?? '',
        Address: customer?.Address ?? '',
        PinCode: customer?.PinCode ?? '',
        LocIsActive: true,
        IsSuccessful: true,
        IsModelError: true,
        ItemQuantity: 0,
        AMCServiceDetailsId: 0,
        CustomerDetailsid: customer?.CustomerDetailsid,
        AudioFilePath: '',
        NewAddedTaskId: 0,
        Base64AudioString: '',
        OnHoldTaskId: 0,
        LeadId: 0,
        QuotationId: 0,
        BrandName: '',
        ModelNumber: '',
        FSRId: selectedFsr?.FSRId ?? 0,
      });

      if (res?.Code !== '200') {
        Alert.alert('Failed', res?.Message || 'Could not create the task.');
        return;
      }

      const newTaskId = res.ResultData?.NewAddedTaskId ?? res.ResultData?.Id;
      if (newTaskId) {
        // Java flips the freshly-created self task straight to Ongoing.
        await updateTaskStatus({
          TaskId: newTaskId,
          UserId: userId,
          TaskStatus: TASK_STATUS_ID.Ongoing,
          TaskState: 1,
          TotalDistance: 0,
          Time: nowAsJavaTime(),
        });
      }

      Alert.alert('Success', res?.Message || 'Task created successfully.');
      onCreated();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not create the task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Java: imageView_cancel is a FrameLayout-gravity="end|top" circle that
              floats over the card's corner, with the title centered below/around it
              (not sharing a row) -- not a left-aligned title + inline icon row. */}
          <View style={styles.header}>
            <Text style={styles.title}>Routine Service</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
            <Ionicons name="close-circle" size={scale(30)} color={COLORS.primary} />
          </Pressable>

          <Text style={styles.sectionLabel}>Customer Details</Text>
          <Text style={styles.customerName}>{customer?.CustomerName}</Text>
          <View style={styles.addressRow}>
            <Text style={styles.addressText}>{customer?.Address}</Text>
            <Pressable onPress={handleCall} hitSlop={8}>
              <Ionicons name="call-outline" size={scale(20)} color={COLORS.primary} />
            </Pressable>
          </View>

          {/* Java always shows this section (no visibility=gone), even when blank.
              Not styles.addressText here: that style's flex:1 only makes sense
              inside addressRow's flex row -- standalone, it was collapsing
              this Text to zero height and silently hiding the landmark value. */}
          <Text style={styles.sectionLabel}>Landmark</Text>
          <Text style={styles.landmarkText}>{customer?.Description}</Text>

          <TextInput
            value={taskName}
            onChangeText={text => { setTaskName(text); if (taskNameError) setTaskNameError(''); }}
            placeholder="Task Name"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            maxLength={100}
            autoCapitalize="words"
          />
          {!!taskNameError && <Text style={styles.errorText}>{taskNameError}</Text>}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={styles.segment}>
              <Pressable
                style={[styles.segmentBtn, paymentMode === 'AMC' && styles.segmentBtnActive]}
                onPress={() => { setPaymentMode('AMC'); setWages(''); setWagesError(''); }}
              >
                <Text style={[styles.segmentText, paymentMode === 'AMC' && styles.segmentTextActive]}>AMC</Text>
              </Pressable>
              <Pressable
                style={[styles.segmentBtn, paymentMode === 'Rate' && styles.segmentBtnActive]}
                onPress={() => setPaymentMode('Rate')}
              >
                <Text style={[styles.segmentText, paymentMode === 'Rate' && styles.segmentTextActive]}>Rate</Text>
              </Pressable>
            </View>

            <TextInput
              value={wages}
              onChangeText={text => { setWages(text.replace(/[^0-9.]/g, '')); if (wagesError) setWagesError(''); }}
              placeholder={paymentMode === 'AMC' ? 'Not Applicable In AMC Mode' : 'Please Enter Amount'}
              placeholderTextColor="#9ca3af"
              editable={paymentMode === 'Rate'}
              keyboardType="decimal-pad"
              maxLength={10}
              style={[styles.inputRate, paymentMode === 'AMC' && styles.inputDisabled]}
            />
          </View>
          {!!wagesError && <Text style={styles.errorText}>{wagesError}</Text>}

          <Pressable
            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            onPress={() => setFsrPickerOpen(true)}
          >
            <Text style={{ color: selectedFsr ? '#111' : '#9ca3af', fontSize: sp(15) }}>
              {selectedFsr?.FSRName ?? 'Select FSR'}
            </Text>
            <Ionicons name="chevron-down" size={scale(18)} color="#111" />
          </Pressable>

          <Pressable
            style={[styles.proceedBtn, submitting && styles.proceedBtnDisabled]}
            onPress={handleProceed}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.proceedText}>PROCEED</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* FSR picker */}
      <Modal visible={fsrPickerOpen} transparent animationType="fade" onRequestClose={() => setFsrPickerOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setFsrPickerOpen(false)} />
        <View style={styles.fsrModal}>
          <Text style={styles.sectionLabel}>Select FSR</Text>
          <FlatList
            data={fsrList}
            keyExtractor={(item, idx) => String(item.FSRId ?? idx)}
            ListHeaderComponent={
              <Pressable style={styles.fsrItem} onPress={() => { setSelectedFsr(null); setFsrPickerOpen(false); }}>
                <Text style={styles.fsrItemText}>Select FSR</Text>
              </Pressable>
            }
            renderItem={({ item }) => (
              <Pressable style={styles.fsrItem} onPress={() => { setSelectedFsr(item); setFsrPickerOpen(false); }}>
                <Text style={styles.fsrItemText}>{item.FSRName}</Text>
              </Pressable>
            )}
            style={{ maxHeight: ms(260) }}
          />
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: ms(24), borderTopRightRadius: ms(24), padding: ms(20) },
  header: { alignItems: 'center', marginBottom: ms(12) },
  title: { fontSize: sp(22), fontWeight: '500', color: COLORS.primary, textAlign: 'center' },
  closeButton: { position: 'absolute', top: ms(8), right: ms(8) },
  sectionLabel: { fontSize: sp(14), color: '#8a8f98', fontWeight: '600', marginTop: ms(8) },
  customerName: { fontSize: sp(16), color: COLORS.textPrimary, marginTop: ms(2) },
  addressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: ms(4) },
  addressText: { fontSize: sp(14), color: COLORS.textPrimary, flex: 1, marginRight: ms(8) },
  landmarkText: { fontSize: sp(14), color: COLORS.textPrimary, marginTop: ms(2) },
  input: {
    height: ms(48),
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: ms(24),
    paddingHorizontal: ms(14),
    fontSize: sp(15),
    color: '#111',
    marginTop: ms(14),
    justifyContent: 'center',
  },
  inputRate: {
    height: ms(48),
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: ms(24),
    paddingHorizontal: ms(14),
    fontSize: sp(15),
    color: '#111',
    marginTop: ms(14),
    justifyContent: 'center',
    width: '65%',
  },
  inputDisabled: { backgroundColor: '#f3f4f6', color: '#9ca3af' },
  errorText: { color: '#DC2626', fontSize: sp(12), marginTop: ms(4) },
  segment: {
    flexDirection: 'row',
    borderRadius: ms(24),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#111',
    marginTop: ms(16),
    width: '34%',
    height: ms(45),
  },
  segmentBtn: { flex: 1, paddingVertical: ms(10), alignItems: 'center' },
  segmentBtnActive: { backgroundColor: '#111' },
  segmentText: { fontSize: sp(14), fontWeight: '600', color: '#111' },
  segmentTextActive: { color: '#fff' },
  proceedBtn: {
    marginTop: ms(20),
    height: ms(50),
    borderRadius: ms(30),
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedBtnDisabled: { opacity: 0.6 },
  proceedText: { color: '#fff', fontSize: sp(16), fontWeight: '700', letterSpacing: 1 },

  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  fsrModal: {
    position: 'absolute',
    top: '30%',
    left: scale(24),
    right: scale(24),
    backgroundColor: '#fff',
    borderRadius: ms(14),
    padding: ms(14),
  },
  fsrItem: { paddingVertical: ms(12), borderTopWidth: 1, borderColor: '#eee' },
  fsrItemText: { fontSize: sp(14), color: COLORS.textPrimary },
});
