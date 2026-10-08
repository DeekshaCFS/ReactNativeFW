// src/components/DeleteFocDialog.tsx
//
// Java delete_foc_requested_item.xml shown by FOCFragment/FOC_TechItemListAdapter.DeleteUsedItemsDialog:
// a non-cancelable bottom sheet asking to confirm deleting a FOC request / FOC sub-item.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheetDialog from './BottomSheetDialog';
import { ms, sp } from '../utils/responsive';

type Props = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function DeleteFocDialog({ visible, onConfirm, onCancel }: Props) {
  return (
    <BottomSheetDialog visible={visible} onRequestClose={() => {}}>
      <View style={styles.outer}>
        <View style={styles.inner}>
          <Text style={styles.title}>Are you sure?</Text>
          <Text style={styles.message}>Do you want to delete this FOC?</Text>

          <Pressable style={styles.deleteBtn} onPress={onConfirm}>
            <Text style={styles.deleteText}>Yes. Delete</Text>
          </Pressable>

          <Pressable style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Nope. Not Now</Text>
          </Pressable>
        </View>
      </View>
    </BottomSheetDialog>
  );
}

const styles = StyleSheet.create({
  outer: { padding: ms(10) },
  inner: { padding: ms(10) },
  title: {
    margin: ms(5),
    fontSize: sp(18),
    fontWeight: 'bold',
    color: '#535353',
  },
  message: {
    margin: ms(10),
    textAlign: 'center',
    fontSize: sp(16),
    color: '#c3002f',
  },
  deleteBtn: {
    margin: ms(20),
    minHeight: ms(48),
    borderRadius: ms(34),
    backgroundColor: '#c3002f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(8),
  },
  deleteText: { color: '#fff', fontSize: sp(18) },
  cancelBtn: {
    alignSelf: 'center',
    minHeight: ms(48),
    minWidth: ms(88),
    paddingHorizontal: ms(8),
    paddingBottom: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: '#535353', fontSize: sp(18) },
});
