// src/components/BottomSheetDialog.tsx
//
// Java FWDialog(R.style.DialogSlideAnim) + Gravity.BOTTOM with a 30dp-radius CardView: a window-wide
// dim behind a white sheet anchored to the bottom (dialog_before_task_photo / dialog_reject_task_photo
// / dialog_on_hold). Also the EditText.setError popup used by their note fields.
import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Modal from './AppModal';
import { COLORS } from '../theme/theme';
import { ms, sp } from '../utils/responsive';
import { ClosePopupIcon } from './TaskTrackingSheet';

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  /** Close icon pinned to the top-right corner (imageView_cancel). */
  onClose?: () => void;
  children: React.ReactNode;
};

export default function BottomSheetDialog({ visible, onRequestClose, onClose, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onRequestClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.dim} />
        <View style={styles.sheet}>
          {onClose && (
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={6}>
              <ClosePopupIcon size={ms(40)} />
            </Pressable>
          )}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** The "!" shown inside a field with an error (TextInputLayout error icon). */
export const FieldErrorDot = () => (
  <View style={styles.errorDot}>
    <Text style={styles.errorDotText}>!</Text>
  </View>
);

/** EditText.setError popup: dark bubble with a red underline, pointing down at the error icon. */
export const FieldErrorTip = ({ message, bottom }: { message: string; bottom: number }) => (
  <View style={[styles.errorTip, { bottom }]} pointerEvents="none">
    <View style={styles.errorTipBox}>
      <Text style={styles.errorTipText}>{message}</Text>
    </View>
    <View style={styles.errorTipArrow} />
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  dim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    maxHeight: '92%',
    overflow: 'hidden',
  },
  closeBtn: { position: 'absolute', top: 0, right: 0, width: ms(50), height: ms(50), alignItems: 'center', zIndex: 2 },
  errorDot: {
    position: 'absolute',
    right: ms(14),
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    backgroundColor: '#E4002B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorDotText: { color: '#fff', fontWeight: 'bold', fontSize: sp(16), lineHeight: ms(20) },
  errorTip: { position: 'absolute', right: ms(2), alignItems: 'flex-end', zIndex: 5 },
  errorTipBox: {
    backgroundColor: 'rgba(15,15,15,0.95)',
    borderRadius: ms(4),
    borderBottomWidth: ms(3),
    borderBottomColor: '#E4002B',
    paddingHorizontal: ms(16),
    paddingVertical: ms(8),
  },
  errorTipText: { color: '#fff', fontSize: sp(13.5) },
  errorTipArrow: {
    marginRight: ms(18),
    width: 0,
    height: 0,
    borderLeftWidth: ms(8),
    borderRightWidth: ms(8),
    borderTopWidth: ms(8),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#E4002B',
  },
});

export const SHEET_TEXT = { color: COLORS.ink };
