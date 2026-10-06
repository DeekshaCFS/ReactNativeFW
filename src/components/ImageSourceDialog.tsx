// src/components/ImageSourceDialog.tsx
//
// Java: AlertDialog.Builder(...).setTitle("Select Image Source").setItems({Camera, Gallery}) --
// the plain Android list dialog used wherever a photo is picked (task closure, document
// upload, expenses ...). White box, left-aligned title and 48dp text rows, no icons.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Modal from './AppModal';
import { COLORS } from '../theme/theme';
import { ms, sp } from '../utils/responsive';

type Props = {
  visible: boolean;
  onCamera: () => void;
  onGallery: () => void;
  onClose: () => void;
  title?: string;
};

export default function ImageSourceDialog({
  visible,
  onCamera,
  onGallery,
  onClose,
  title = 'Select Image Source',
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* The inner Pressable swallows taps so only the backdrop dismisses. */}
        <Pressable style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Pressable
            style={styles.row}
            android_ripple={{ color: '#00000014' }}
            onPress={onCamera}
          >
            <Text style={styles.rowText}>Camera</Text>
          </Pressable>
          <Pressable
            style={styles.row}
            android_ripple={{ color: '#00000014' }}
            onPress={onGallery}
          >
            <Text style={styles.rowText}>Gallery</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: '87%',
    maxWidth: ms(560),
    paddingTop: ms(18),
    paddingBottom: ms(4),
    backgroundColor: COLORS.white,
    borderRadius: ms(2),
    elevation: 24,
  },
  title: {
    paddingHorizontal: ms(24),
    paddingBottom: ms(6),
    fontSize: sp(20),
    fontWeight: '500',
    color: COLORS.textBlack,
  },
  row: {
    height: ms(48),
    paddingHorizontal: ms(24),
    justifyContent: 'center',
  },
  rowText: {
    fontSize: sp(18),
    color: COLORS.textBlack,
  },
});
