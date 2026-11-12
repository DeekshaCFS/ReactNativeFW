// src/components/ImageSourceDialog.tsx
//
// Java: AlertDialog.Builder(...).setTitle("Select Image Source").setItems({Camera, Gallery}) --
// the plain Android list dialog used wherever a photo is picked (task closure, document
// upload, expenses ...). White box, left-aligned title and 48dp text rows, no icons.

import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Modal from './AppModal';
import { getOpenModals, setPortalEntry } from './modalPortal';
import { COLORS } from '../theme/theme';
import { ms, sp } from '../utils/responsive';

import { useTranslation } from 'react-i18next';
type Props = {
  visible: boolean;
  onCamera: () => void;
  onGallery: () => void;
  onClose: () => void;
  onDismiss?: () => void;
  title?: string;
};

let dialogCount = 0;

export default function ImageSourceDialog({
  visible,
  onCamera,
  onGallery,
  onClose,
  onDismiss,
  title = 'Select Image Source',
}: Props) {
  const { t } = useTranslation();
  const [dialogKey] = useState(() => `image-source-${++dialogCount}`);
  // Opened while a form sheet is open: draw inside that sheet, since iPhone cannot show a second
  // modal on top of it. The caller still learns when the dialog closes (onDismiss).
  const wasVisible = useRef(false);
  const openedInsideModal = useRef(false);
  if (visible && !wasVisible.current) openedInsideModal.current = getOpenModals().length > 0;
  wasVisible.current = visible;
  const portalMode = visible && openedInsideModal.current;
  const shownInPortal = useRef(false);

  const panel = (
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* The inner Pressable swallows taps so only the backdrop dismisses. */}
        <Pressable style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Pressable
            style={styles.row}
            android_ripple={{ color: '#00000014' }}
            onPress={onCamera}
          >
            <Text style={styles.rowText}>{t('rn_camera')}</Text>
          </Pressable>
          <Pressable
            style={styles.row}
            android_ripple={{ color: '#00000014' }}
            onPress={onGallery}
          >
            <Text style={styles.rowText}>{t('rn_gallery')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
  );

  useEffect(() => {
    setPortalEntry(dialogKey, portalMode ? panel : null);
    if (portalMode) shownInPortal.current = true;
    if (!visible && shownInPortal.current) {
      shownInPortal.current = false;
      onDismiss?.();
    }
  });
  useEffect(() => () => setPortalEntry(dialogKey, null), [dialogKey]);

  return (
    <Modal visible={visible && !portalMode} transparent animationType="fade" onRequestClose={onClose} onDismiss={onDismiss}>
      {panel}
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