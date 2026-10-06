// src/screens/admin/UsedItemUpdateModal.tsx
//
// Port of Java's ItemDialog.updateUsedItem (layout dialog_used_item_update),
// opened from the refresh icon on a used-item row (UsedItemInventoryAdapter).
// Shows Task Assigned / Issued / Used qty, an add-or-deduct toggle, a -/+
// quantity stepper and a required note, then posts Item/AddUsedItem or
// Item/DeductUsedItem with the row's ids (same fields Java copies over).
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Modal from '../../components/AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {addUsedItem, deductUsedItem} from '../../api/item/itemService';
import type {GetUsedItemListResultData} from '../../api/item/item.types';
import {ms, sp, vs} from '../../utils/responsive';

type Props = {
  row: GetUsedItemListResultData | null;
  onClose: () => void;
  onUpdated: () => void;
};

const UsedItemUpdateModal: React.FC<Props> = ({row, onClose, onUpdated}) => {
  const [mode, setMode] = useState<'add' | 'deduct'>('add');
  const [qty, setQty] = useState('0');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode('add');
    setQty('0');
    setNote('');
  }, [row]);

  if (!row) {
    return null;
  }

  const step = (delta: number) => {
    const next = (Number(qty) || 0) + delta;
    if (next <= 0) {
      Alert.alert('', 'Quantity should not less than 0');
      return;
    }
    setQty(String(next));
  };

  const submit = async () => {
    const quantity = Number(qty) || 0;
    if (quantity === 0) {
      Alert.alert('', 'Please enter valid quantity');
      return;
    }
    if (!note.trim()) {
      Alert.alert('', 'Please enter notes');
      return;
    }
    if (quantity > (Number(row.AssignedQty) || 0)) {
      Alert.alert('', 'Used quantity is greater than Updated assign quantity!');
      return;
    }
    const payload = {
      ItemId: row.ItemId,
      ItemIssuedId: row.ItemIssuedId,
      TaskId: row.TaskId,
      UsedQty: quantity,
      UserId: row.UserId, // tech id
      CreatedBy: row.CreatedBy, // owner id
      UpdateBy: row.UpdateBy,
      Notes: note.trim(),
    };
    setSubmitting(true);
    try {
      const response = await (mode === 'add' ? addUsedItem(payload) : deductUsedItem(payload));
      if (response?.Message) {
        Alert.alert('', response.Message);
      }
      onUpdated();
    } catch (error) {
      Alert.alert('', error instanceof Error ? error.message : 'Unable to update used item.');
    } finally {
      setSubmitting(false);
    }
  };

  const qtyCol = (label: string, value: unknown) => (
    <View style={styles.qtyCol}>
      <Text style={styles.qtyLabel}>{label}</Text>
      <Text style={styles.qtyValue}>{String(value ?? 0)}</Text>
    </View>
  );

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Pressable style={styles.close} onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={sp(22)} color="#333" />
          </Pressable>
          <Text style={styles.title}>
            {row.ItemName} <Text style={styles.itemId}>[{row.ItemId}]</Text>
          </Text>
          <View style={styles.qtyRow}>
            {qtyCol('Task Assigned Qty', row.AssignedQty)}
            {qtyCol('Issued Qty', row.CurrentAssignedQty)}
            {qtyCol('Used Qty', row.UsedQty)}
          </View>

          <View style={styles.toggle}>
            {(['add', 'deduct'] as const).map(option => (
              <Pressable
                key={option}
                style={[styles.toggleOption, mode === option ? styles.toggleActive : null]}
                onPress={() => setMode(option)}>
                <Text style={[styles.toggleText, mode === option ? styles.toggleTextActive : null]}>
                  {option === 'add' ? '+ ' : '− '}Used Item Qty
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.qtyLabel}>Enter Quantity</Text>
          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={() => step(-1)}>
              <Text style={styles.stepText}>-</Text>
            </Pressable>
            <TextInput
              style={styles.stepInput}
              value={qty}
              onChangeText={t => setQty(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
            />
            <Pressable style={styles.stepBtn} onPress={() => step(1)}>
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.note}
            placeholder="Note"
            placeholderTextColor="#9aa0a6"
            value={note}
            onChangeText={setNote}
            multiline
          />

          <Pressable style={styles.button} onPress={submit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update</Text>}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
  sheet: {backgroundColor: '#fff', borderTopLeftRadius: ms(16), borderTopRightRadius: ms(16), padding: ms(20)},
  close: {alignSelf: 'flex-end'},
  title: {fontSize: sp(16), fontWeight: '700', color: '#20283A'},
  itemId: {fontSize: sp(13), fontWeight: '400', color: '#5f6368'},
  qtyRow: {flexDirection: 'row', marginVertical: vs(14)},
  qtyCol: {flex: 1, alignItems: 'center'},
  qtyLabel: {fontSize: sp(12), color: '#5f6368', marginBottom: vs(4)},
  qtyValue: {fontSize: sp(15), fontWeight: '700', color: '#20283A'},
  toggle: {flexDirection: 'row', borderWidth: 1, borderColor: '#c3002f', borderRadius: ms(20), overflow: 'hidden', marginBottom: vs(14)},
  toggleOption: {flex: 1, paddingVertical: vs(8), alignItems: 'center'},
  toggleActive: {backgroundColor: '#c3002f'},
  toggleText: {fontSize: sp(13), color: '#c3002f'},
  toggleTextActive: {color: '#fff', fontWeight: '700'},
  stepper: {flexDirection: 'row', alignItems: 'center', gap: ms(10), marginBottom: vs(12)},
  stepBtn: {width: ms(36), height: ms(36), borderRadius: ms(18), backgroundColor: '#f1f3f4', alignItems: 'center', justifyContent: 'center'},
  stepText: {fontSize: sp(18), color: '#20283A'},
  stepInput: {flex: 1, borderWidth: 1, borderColor: '#dadce0', borderRadius: ms(8), textAlign: 'center', fontSize: sp(15), paddingVertical: vs(6), color: '#20283A'},
  note: {borderWidth: 1, borderColor: '#dadce0', borderRadius: ms(8), minHeight: vs(60), padding: ms(10), fontSize: sp(13), color: '#20283A', textAlignVertical: 'top'},
  button: {backgroundColor: '#c3002f', borderRadius: ms(22), paddingVertical: vs(12), alignItems: 'center', marginTop: vs(16)},
  buttonText: {color: '#fff', fontWeight: '700', fontSize: sp(14)},
});

export default UsedItemUpdateModal;
