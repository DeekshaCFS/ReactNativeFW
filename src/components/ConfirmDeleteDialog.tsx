// src/components/ConfirmDeleteDialog.tsx
//
// The app's single delete / confirmation sheet, mirroring the Java FWDialog bottom sheets:
//   row (default)  -> grey message, [Cancel] [PILL]          (delete_*_dialog, dialog_delete_brand, dialog_delete_item)
//   stacked        -> icon, title + bold name, red message, full-width pill, plain cancel below
//                     (delete_tech_account, Java technician sheet)
//   FOC            -> "Are you sure?" title, red message, row buttons (delete_foc_requested_item)
//
// Use it directly (controlled) or through useConfirmDelete():
//   const {askDelete, deleteDialog} = useConfirmDelete();
//   askDelete(message, onConfirm, {layout, icon, title, subject, ...});
//   ...render {deleteDialog} in the screen's JSX.
import React, {useCallback, useState} from 'react';
import {Image, ImageSourcePropType, Pressable, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import BottomSheetDialog from './BottomSheetDialog';
import {COLORS} from '../theme/theme';
import {ms, sp} from '../utils/responsive';

export type DeleteSheetOptions = {
  /** 'stacked' = Java technician layout (icon, full-width confirm, cancel below). Default 'row'. */
  layout?: 'row' | 'stacked';
  /** Image shown at the top of a stacked sheet. */
  icon?: ImageSourcePropType;
  /** Heading before the bold line, e.g. "Are you sure?" (FOC) or "Do you wish to Delete" (technician). */
  title?: string;
  /** Bold primary-colour line, e.g. the brand, model, serial or employee name. */
  subject?: string;
  /** 'accent' = primary-colour message. Default is grey (row layout) or primary (stacked). */
  messageTone?: 'default' | 'accent';
  /** Default: translated "NO". Labels passed in are shown exactly as given. */
  cancelLabel?: string;
  /** Default: translated "YES". Labels passed in are shown exactly as given. */
  confirmLabel?: string;
  /** 'accent' = red text (Cancel). 'neutral' = dark grey (Nope. Not Now). */
  cancelTone?: 'accent' | 'neutral';
};

export type ConfirmDeleteDialogProps = DeleteSheetOptions & {
  visible: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDeleteDialog({
  visible,
  message,
  onConfirm,
  onCancel,
  layout = 'row',
  icon,
  title,
  subject,
  messageTone = 'default',
  cancelLabel,
  confirmLabel,
  cancelTone = 'accent',
}: ConfirmDeleteDialogProps) {
  const {t} = useTranslation();

  if (layout === 'stacked') {
    return (
      <BottomSheetDialog visible={visible} onRequestClose={onCancel}>
        <View style={styles.stackedBody}>
          {icon ? <Image source={icon} style={styles.icon} resizeMode="contain" /> : null}
          {title || subject ? (
            <Text style={styles.titleLine}>
              {title ? <Text style={styles.titleText}>{title} </Text> : null}
              {subject ? <Text style={styles.subjectText}>{subject}</Text> : null}
            </Text>
          ) : null}
          <Text style={styles.stackedMessage}>{message}</Text>
          <Pressable style={styles.fullConfirm} onPress={onConfirm} accessibilityRole="button">
            <Text style={styles.fullConfirmText}>{confirmLabel ?? t('yes')}</Text>
          </Pressable>
          <Pressable style={styles.stackedCancel} onPress={onCancel} accessibilityRole="button">
            <Text style={[styles.stackedCancelText, cancelTone === 'accent' && styles.stackedCancelAccent]}>
              {cancelLabel ?? t('no')}
            </Text>
          </Pressable>
        </View>
      </BottomSheetDialog>
    );
  }

  return (
    <BottomSheetDialog visible={visible} onRequestClose={onCancel}>
      <View style={styles.body}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subject ? <Text style={styles.subject}>{subject}</Text> : null}
        <Text style={[styles.message, messageTone === 'accent' && styles.messageAccent]}>{message}</Text>
        <View style={styles.buttons}>
          <Pressable style={styles.noButton} onPress={onCancel} accessibilityRole="button">
            <Text style={[styles.noText, cancelTone === 'neutral' && styles.noTextNeutral]}>
              {cancelLabel ?? t('no')}
            </Text>
          </Pressable>
          <Pressable style={styles.yesButton} onPress={onConfirm} accessibilityRole="button">
            <Text style={styles.yesText}>{confirmLabel ?? t('yes').toUpperCase()}</Text>
          </Pressable>
        </View>
      </View>
    </BottomSheetDialog>
  );
}

type PendingDelete = {message: string; onConfirm: () => void | Promise<void>; options: DeleteSheetOptions};

export function useConfirmDelete() {
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState<PendingDelete | null>(null);

  // onConfirm is optional: pass only options to show a message sheet with custom buttons.
  const askDelete = useCallback(
    (message: string, onConfirm: () => void | Promise<void> = () => {}, options: DeleteSheetOptions = {}) => {
      setPending({message, onConfirm, options});
      setVisible(true);
    },
    [],
  );

  const handleCancel = useCallback(() => setVisible(false), []);

  const handleConfirm = useCallback(() => {
    setVisible(false);
    void pending?.onConfirm();
  }, [pending]);

  const deleteDialog = (
    <ConfirmDeleteDialog
      visible={visible}
      message={pending?.message ?? ''}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      {...(pending?.options ?? {})}
    />
  );

  return {askDelete, deleteDialog};
}

const styles = StyleSheet.create({
  // row layout
  body: {
    paddingHorizontal: ms(24),
    paddingTop: ms(28),
    paddingBottom: ms(16),
  },
  title: {
    textAlign: 'center',
    fontSize: sp(16),
    color: '#535353',
    marginBottom: ms(6),
  },
  subject: {
    textAlign: 'center',
    fontSize: sp(18),
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: ms(10),
  },
  message: {
    textAlign: 'center',
    fontSize: sp(18),
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: ms(24),
  },
  messageAccent: {
    color: COLORS.primary,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noButton: {
    flex: 1,
    minHeight: ms(56),
    alignItems: 'center',
    justifyContent: 'center',
  },
  noText: {
    color: COLORS.primary,
    fontSize: sp(18),
    fontWeight: '600',
    textAlign: 'center',
  },
  noTextNeutral: {
    color: '#535353',
  },
  yesButton: {
    flex: 1.6,
    minHeight: ms(56),
    borderRadius: ms(28),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(8),
  },
  yesText: {
    color: '#fff',
    fontSize: sp(18),
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // stacked layout (Java delete_tech_account)
  stackedBody: {
    paddingHorizontal: ms(20),
    paddingTop: ms(16),
    paddingBottom: ms(12),
  },
  icon: {
    width: ms(56),
    height: ms(56),
    alignSelf: 'center',
    marginBottom: ms(12),
  },
  titleLine: {
    textAlign: 'center',
    marginBottom: ms(14),
  },
  titleText: {
    fontSize: sp(20),
    fontWeight: '700',
    color: '#3B3B3B',
  },
  subjectText: {
    fontSize: sp(20),
    fontWeight: '700',
    color: COLORS.primary,
  },
  stackedMessage: {
    textAlign: 'center',
    fontSize: sp(18),
    color: COLORS.primary,
    paddingHorizontal: ms(8),
    marginBottom: ms(24),
  },
  fullConfirm: {
    minHeight: ms(64),
    borderRadius: ms(32),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: ms(6),
    elevation: 3,
  },
  fullConfirmText: {
    color: '#fff',
    fontSize: sp(22),
    fontWeight: '600',
    textAlign: 'center',
  },
  stackedCancel: {
    minHeight: ms(56),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ms(6),
  },
  stackedCancelText: {
    fontSize: sp(20),
    fontWeight: '500',
    color: '#535353',
    textAlign: 'center',
  },
  stackedCancelAccent: {
    color: '#535353',
  },
});
