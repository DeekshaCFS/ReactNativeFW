// src/components/AccountsSheets.tsx
//
// Java's Accounts dialogs (FWDialog + DialogSlideAnim, bottom gravity):
//   delete_quotedetails_dialog / delete_invoicedetails_dialog  -> AccountsDeleteSheet
//   update_quote_status / dialog_update_payment_status / dialog_invoice_follow_up -> AccountsFormSheet
import React from 'react';
import {ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Modal from './AppModal';
import BottomSheetDialog from './BottomSheetDialog';
import {EnquiryIcon} from './FabIcons';
import {COLORS} from '../theme/theme';
import {ms, sp} from '../utils/responsive';

import i18n from 'i18next';
type DeleteProps = {
  visible: boolean;
  message: string;
  onNo: () => void;
  onYes: () => void;
};

/** 30dp-radius card, centred bold 16sp message, "No" (light gray) / "YES" (red pill). */
export const AccountsDeleteSheet = ({visible, message, onNo, onYes}: DeleteProps) => (
  <BottomSheetDialog visible={visible} onRequestClose={onNo}>
    <View style={styles.delOuter}>
      <Text style={styles.delMessage}>{message}</Text>
      <View style={styles.delButtons}>
        <Pressable style={styles.delNo} onPress={onNo}>
          <Text style={styles.delNoText}>{i18n.t('no')}</Text>
        </Pressable>
        <Pressable style={styles.delYes} onPress={onYes}>
          <Text style={styles.delYesText}>{i18n.t('yes').toUpperCase()}</Text>
        </Pressable>
      </View>
    </View>
  </BottomSheetDialog>
);

type FormProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  actionLabel: string;
  onAction: () => void;
  /** update_quote_status has the ic_enq_option icon inside the button. */
  actionIcon?: boolean;
  loading?: boolean;
  cancelLabel?: string;
  /** Body top padding; payment sheet rows carry their own 20dp top margin. */
  bodyPaddingTop?: number;
  children: React.ReactNode;
};

/** gradient_addtask header (#353935, 60dp, 22sp title, close X), 20dp body margins, pill action button, red Cancel. */
export const AccountsFormSheet = ({
  visible,
  title,
  onClose,
  actionLabel,
  onAction,
  actionIcon = false,
  loading = false,
  cancelLabel = 'Cancel',
  bodyPaddingTop = ms(20),
  children,
}: FormProps) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={ms(30)} color="#fff" />
          </Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.body, {paddingTop: bodyPaddingTop}]}>
          {children}
          <TouchableOpacity style={[styles.actionBtn, loading && styles.actionBtnDisabled]} onPress={onAction} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                {actionIcon ? (
                  <View style={styles.actionIcon}>
                    <EnquiryIcon size={ms(30)} color="#fff" />
                  </View>
                ) : null}
                <Text style={styles.actionText}>{actionLabel}</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>{cancelLabel}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

/** Java bg_spinner / TextInputLayoutStyle outlined pill. */
export const sheetPill = {
  height: ms(40),
  borderWidth: 1,
  borderColor: COLORS.lightGray,
  borderRadius: ms(34),
  paddingHorizontal: ms(18),
  marginBottom: ms(16),
  justifyContent: 'center' as const,
  backgroundColor: '#fff',
  fontSize: sp(16),
  color: COLORS.ink,
};

const styles = StyleSheet.create({
  // Java card has marginBottom -30dp, so only ~30dp of padding shows under the buttons.
  delOuter: {padding: 20, paddingBottom: 10},
  delMessage: {
    marginVertical: 20,
    textAlign: 'center',
    fontSize: sp(15.5),
    fontWeight: 'bold',
    color: COLORS.ink,
  },
  delButtons: {flexDirection: 'row', alignItems: 'center', padding: 20},
  delNo: {flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: ms(48)},
  delNoText: {color: COLORS.lightGray, fontSize: sp(18), fontWeight: '500'},
  delYes: {
    flex: 1,
    minHeight: ms(48),
    borderRadius: ms(34),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  delYesText: {color: '#FFFFFF', fontSize: sp(18), fontWeight: '500'},

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: ms(560),
    borderRadius: ms(25),
    overflow: 'hidden',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.statusOnHold,
    height: ms(60),
    paddingHorizontal: ms(20),
    borderRadius: ms(20),
  },
  headerTitle: {fontSize: sp(21), color: '#FFFFFF'},
  body: {paddingHorizontal: ms(20), paddingTop: ms(20), paddingBottom: ms(10)},
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: ms(48),
    backgroundColor: COLORS.statusOnHold,
    borderRadius: ms(34),
    marginTop: ms(10),
    marginBottom: ms(20),
    elevation: 4,
  },
  actionBtnDisabled: {opacity: 0.6},
  actionIcon: {position: 'absolute', left: ms(15)},
  actionText: {color: '#FFFFFF', fontSize: sp(18), fontWeight: '500'},
  cancelBtn: {alignItems: 'center', marginBottom: ms(20)},
  cancelText: {color: COLORS.primary, fontSize: sp(18)},
});
