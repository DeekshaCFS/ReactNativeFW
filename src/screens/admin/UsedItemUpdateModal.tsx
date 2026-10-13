// src/screens/admin/UsedItemUpdateModal.tsx
//
// Port of Java's ItemDialog.updateUsedItem (layout dialog_used_item_update): a bottom card with a
// 30dp top radius, opened from the return arrow on a used-item row (UsedItemInventoryAdapter).
// Shows Task Assigned / Issued / Used qty, an add-or-deduct segmented control, a -/+ quantity
// stepper and a required note, then posts Item/AddUsedItem or Item/DeductUsedItem with the row's
// ids (same fields Java copies over). Spacing measured against the Java dialog on the emulator.
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Modal from '../../components/AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {addUsedItem, deductUsedItem} from '../../api/item/itemService';
import type {GetUsedItemListResultData} from '../../api/item/item.types';
import {AddBalDialogIcon, DecBalDialogIcon} from '../../components/JavaIcons';
import {COLORS} from '../../theme/theme';
import {ms, sp} from '../../utils/responsive';
import {showFailureMsg} from '../../utils/toast';

type Props = {
  row: GetUsedItemListResultData | null;
  onClose: () => void;
  onUpdated: () => void;
};

const GREEN_500 = '#4CAF50';
const BACKGROUND_GRAY = '#1d2536';

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
      showFailureMsg('Quantity should not less than 0');
      return;
    }
    setQty(String(next));
  };

  const submit = async () => {
    const quantity = Number(qty) || 0;
    if (quantity === 0) {
      showFailureMsg('Please enter valid quantity');
      return;
    }
    if (!note.trim()) {
      showFailureMsg('Please enter notes');
      return;
    }
    if (quantity > (Number(row.AssignedQty) || 0)) {
      showFailureMsg('Used quantity is greater than Updated assign quantity!');
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
        showFailureMsg(response.Message);
      }
      onUpdated();
    } catch (error) {
      showFailureMsg(error instanceof Error ? error.message : 'Unable to update used item.');
    } finally {
      setSubmitting(false);
    }
  };

  // Java SegmentedGroup: the checked half is filled with its tint (green / primary), the other is
  // outlined; the fixed-colour round +/- badge sits on the left of both.
  const segment = (option: 'add' | 'deduct') => {
    const selected = mode === option;
    const tint = option === 'add' ? GREEN_500 : COLORS.primary;
    return (
      <Pressable
        key={option}
        style={[
          styles.segment,
          option === 'add' ? styles.segmentLeft : styles.segmentRight,
          {borderColor: tint},
          selected ? {backgroundColor: tint} : null,
        ]}
        onPress={() => setMode(option)}>
        <View style={styles.segmentIcon}>
          {option === 'add' ? (
            <AddBalDialogIcon size={ms(24)} />
          ) : (
            <DecBalDialogIcon size={ms(24)} />
          )}
        </View>
        <Text style={[styles.segmentText, {color: selected ? '#FFFFFF' : BACKGROUND_GRAY}]}>
          Used Item Qty
        </Text>
      </Pressable>
    );
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={styles.card}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <View style={styles.titleRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {row.ItemName}
              </Text>
              <Text style={styles.itemId}>[{row.ItemId}]</Text>
              <Pressable style={styles.close} onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={ms(30)} color={COLORS.primary} />
              </Pressable>
            </View>

            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Task Assigned Qty</Text>
              <Text style={styles.qtyLabel}>Issued Qty</Text>
              <Text style={styles.qtyLabel}>Used Qty</Text>
            </View>
            <View style={[styles.qtyRow, styles.qtyValueRow]}>
              <Text style={[styles.qtyValue, {color: '#2F61D5'}]}>{String(row.AssignedQty ?? 0)}</Text>
              <Text style={[styles.qtyValue, {color: '#ff9b00'}]}>{String(row.CurrentAssignedQty ?? 0)}</Text>
              <Text style={[styles.qtyValue, {color: COLORS.primary}]}>{String(row.UsedQty ?? 0)}</Text>
            </View>

            <View style={styles.segmentGroup}>
              {segment('add')}
              {segment('deduct')}
            </View>

            <Text style={styles.enterQty}>Enter Quantity</Text>
            <View style={styles.stepper}>
              <Pressable style={styles.stepSide} onPress={() => step(-1)}>
                <Text style={styles.stepSign}>-</Text>
              </Pressable>
              <TextInput
                style={styles.stepInput}
                value={qty}
                onChangeText={t => setQty(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
              />
              <Pressable style={styles.stepSide} onPress={() => step(1)}>
                <Text style={styles.stepSign}>+</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.note}
              placeholder="Note"
              placeholderTextColor={COLORS.lightGray}
              value={note}
              onChangeText={setNote}
              maxLength={250}
            />

            <Pressable style={styles.button} onPress={submit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Update</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  dismissArea: {flex: 1},
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    maxHeight: '90%',
    overflow: 'hidden',
  },
  content: {paddingHorizontal: ms(10), paddingBottom: ms(4)},
  // name at the left, id at a fixed 100dp offset, red close X at the right
  titleRow: {height: ms(24), marginTop: ms(24), marginBottom: ms(20), justifyContent: 'center'},
  itemName: {fontSize: sp(16), fontWeight: 'bold', color: COLORS.black, maxWidth: ms(95)},
  itemId: {
    position: 'absolute',
    left: ms(100),
    fontSize: sp(14),
    fontWeight: 'bold',
    color: COLORS.linkBlue,
  },
  close: {position: 'absolute', right: ms(10)},
  qtyRow: {flexDirection: 'row'},
  qtyLabel: {flex: 1, textAlign: 'center', fontSize: sp(14), color: '#6B6B6B'},
  qtyValueRow: {marginTop: ms(8)},
  qtyValue: {flex: 1, textAlign: 'center', fontSize: sp(14)},
  segmentGroup: {flexDirection: 'row', height: ms(40), marginTop: ms(11), marginBottom: ms(25)},
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingLeft: ms(15),
    paddingRight: ms(25),
  },
  segmentLeft: {borderTopLeftRadius: ms(20), borderBottomLeftRadius: ms(20)},
  segmentRight: {borderTopRightRadius: ms(20), borderBottomRightRadius: ms(20)},
  segmentIcon: {width: ms(24), height: ms(24)},
  segmentText: {flex: 1, textAlign: 'center', fontSize: sp(13.5)},
  enterQty: {marginTop: ms(-2), fontSize: sp(18), color: COLORS.black},
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ms(40),
    marginTop: ms(6),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: ms(20),
  },
  stepSide: {flex: 0.15, alignItems: 'center', justifyContent: 'center', height: '100%'},
  stepSign: {fontSize: sp(30), lineHeight: sp(34), color: BACKGROUND_GRAY},
  stepInput: {
    flex: 0.7,
    height: '100%',
    textAlign: 'center',
    fontSize: sp(16),
    color: BACKGROUND_GRAY,
    padding: 0,
  },
  // TextInputLayout (outlined): 1dp rounded border around the 16sp hint / text
  note: {
    marginTop: ms(22),
    height: ms(41),
    paddingHorizontal: ms(15),
    paddingVertical: 0,
    fontSize: sp(16),
    color: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: ms(20),
  },
  button: {
    marginTop: ms(38),
    marginBottom: ms(20),
    minHeight: ms(48),
    borderRadius: ms(34),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
  },
  buttonText: {color: '#FFFFFF', fontSize: sp(18), fontWeight: '500'},
});

export default UsedItemUpdateModal;
