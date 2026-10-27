// src/screens/admin/LeaveApprovalModal.tsx
//
// Port of Java's LeaveApproveRejectFragmnt (layout fragment_requested_leave_details):
// opened from a leave-request row for owner / sub-admin. Shows the employee +
// leave details, takes "Approval/Decline Notes *", and posts
// Leave/Approve-Reject-Leave with IsApproved true/false. Approve/Decline are
// hidden once the leave is already Approved (2) or Rejected (3), and the notes
// become read-only when the approver already commented.
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Modal from '../../components/AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {postLeaveApprovReject} from '../../api/leaveManagement/leaveManagementService';
import type {LeaveListItem} from './adminLegacyApiTypes';
import {COLORS} from '../../theme/theme';
import {ms, sp} from '../../utils/responsive';
import { showFailureMsg, showSuccessMsg } from '../../utils/toast';

import {useTranslation} from 'react-i18next';
import { tr } from '../../i18n/tr';
type Props = {
  leave: LeaveListItem | null;
  ownerId: number;
  onClose: () => void;
  onActioned: () => void;
};

const NA = 'NA';

const toDisplayDate = (raw?: string | null) => {
  const value = String(raw ?? '').split('T')[0];
  const [y, m, d] = value.split('-');
  return y && m && d ? `${d}/${m}/${y}` : '';
};

const orNA = (value?: string | null) => (String(value ?? '').trim() ? String(value).trim() : NA);

const LeaveApprovalModal: React.FC<Props> = ({leave, ownerId, onClose, onActioned}) => {
  const {t} = useTranslation();
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState<'approve' | 'decline' | null>(null);

  useEffect(() => {
    setNotes(String(leave?.CommentsByApprover ?? ''));
    setSubmitting(null);
  }, [leave]);

  if (!leave) {
    return null;
  }

  // LeaveStatusId is the reliable source of truth here (2 = Approved, 3 =
  // Declined) -- the API's raw LeaveStatusName string doesn't consistently
  // say "Declined" (it can come back as "Rejected"), so requiring both to
  // match let an already-declined leave slip through as still-actionable.
  const isActioned = leave.LeaveStatusId === 2 || leave.LeaveStatusId === 3;
  const notesLocked = leave.CommentsByApprover != null;
  const fullName = [leave.FirstName, leave.LastName].filter(Boolean).join(' ').trim();
  const start = toDisplayDate(leave.LeaveStartDate);
  const end = toDisplayDate(leave.LeaveEndDate);

  const submit = async (approve: boolean) => {
    if (!notes.trim()) {
      showFailureMsg(t('rn_please_explain_leave_reason'));
      return;
    }
    setSubmitting(approve ? 'approve' : 'decline');
    try {
      const response = await postLeaveApprovReject({
        UserID: Number(leave.UserID) || 0,
        LeaveID: Number(leave.LeaveID) || 0,
        CommentsByApprover: notes.trim(),
        IsApproved: approve,
        ActionedBy: ownerId,
      });
      const message = String(response?.Message ?? '');
      showSuccessMsg(message.toLowerCase() === 'leave successfully declined'
          ? tr('Leave Successfully Declined.')
          : message || (approve ? 'Leave approved.' : 'Leave declined.'));
      onActioned();
    } catch (error) {
      showFailureMsg(error instanceof Error ? error.message : tr('Unable to update leave.'));
    } finally {
      setSubmitting(null);
    }
  };

  const rows: [string, string][] = [
    ['Zone', orNA(leave.Zone)],
    ['Zone Manager', orNA(leave.ZoneManager)],
    ['Contact', orNA(leave.ContactNo)],
    ['Leave Date', start && end ? `${start} to ${end}` : NA],
    ['Leave Type', orNA(leave.LeaveType)],
    ['Leave Reason', orNA(leave.ReasonOfLeave)],
  ];

  // fragment_requested_leave_details.xml: red screen, action-bar-high gap, then a white card
  // with 30dp top corners holding the centred avatar / name / role and the detail table.
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.bar}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.barBtn}>
            <Ionicons name="arrow-back" size={ms(24)} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.card}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.cardContent}>
            <Image
              source={
                leave.ProfileImageUrl
                  ? {uri: leave.ProfileImageUrl}
                  : require('../../../assets/images/profile_icon.png')
              }
              defaultSource={require('../../../assets/images/profile_icon.png')}
              style={styles.avatar}
            />

            <View style={styles.nameRow}>
              <Text style={styles.name}>{fullName || NA}</Text>
              <Text style={styles.empId} numberOfLines={1}>
                {t('plus_emp').toUpperCase()}{leave.UserID ?? ''})
              </Text>
            </View>
            <Text style={styles.role}>{orNA(leave.UserDesignation)}</Text>

            <View style={styles.details}>
              {rows.map(([label, value], index) => (
                <View
                  key={label}
                  style={[styles.row, index === rows.length - 1 ? styles.rowLast : null]}>
                  <Text style={styles.label}>{label}</Text>
                  <Text style={styles.value}>{value}</Text>
                </View>
              ))}

              <Text style={styles.notesLabel}>{t('rn_approval_decline_notes')}</Text>
              <TextInput
                style={styles.notes}
                placeholder={t('notes')}
                placeholderTextColor={COLORS.lightGray}
                value={notes}
                onChangeText={setNotes}
                editable={!notesLocked}
                multiline
              />

              {isActioned ? null : (
                <View style={styles.buttonRow}>
                  <Pressable
                    style={[styles.button, styles.decline, styles.buttonLeft]}
                    disabled={submitting !== null}
                    onPress={() => submit(false)}>
                    {submitting === 'decline' ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>{t('rn_decline')}</Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={[styles.button, styles.approve, styles.buttonRight]}
                    disabled={submitting !== null}
                    onPress={() => submit(true)}>
                    {submitting === 'approve' ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>{t('approve')}</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const GRAY_DARK = '#1d2536'; // Java background_gray (labels, name)
const GRAY_LIGHT = '#9a9faa'; // Java light_gray (values)

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.primary},
  bar: {height: ms(56), justifyContent: 'center', paddingHorizontal: ms(12)},
  barBtn: {width: ms(40), height: ms(40), justifyContent: 'center'},
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    overflow: 'hidden',
    elevation: 24,
  },
  cardContent: {paddingTop: ms(5), paddingBottom: ms(60)},
  avatar: {
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    margin: ms(5),
    alignSelf: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(10),
  },
  name: {fontSize: sp(18), fontWeight: '700', color: GRAY_DARK},
  empId: {fontSize: sp(18), fontWeight: '700', color: '#1976D2', marginLeft: ms(15)},
  role: {
    fontSize: sp(16),
    fontWeight: '700',
    color: '#535353',
    textAlign: 'center',
  },
  details: {marginTop: ms(22), marginHorizontal: ms(20)},
  row: {flexDirection: 'row', marginBottom: ms(10)},
  rowLast: {marginBottom: ms(20)},
  label: {flex: 0.4, fontSize: sp(15), color: GRAY_DARK},
  value: {flex: 0.6, fontSize: sp(15), color: GRAY_LIGHT},
  notesLabel: {fontSize: sp(15), color: GRAY_DARK, marginBottom: ms(10)},
  notes: {
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
    borderRadius: ms(20),
    padding: ms(10),
    marginBottom: ms(5),
    fontSize: sp(15),
    color: GRAY_DARK,
    textAlignVertical: 'top',
  },
  buttonRow: {flexDirection: 'row'},
  // Java: rounded_button (Decline, colorPrimaryDark) / rounded_button_green (Approve, #4EB54E),
  // 34dp radius, white bold 18sp, 20dp gutter between them, 5dp above / 20dp below.
  button: {
    flex: 1,
    height: ms(48),
    marginTop: ms(5),
    marginBottom: ms(20),
    borderRadius: ms(34),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLeft: {marginRight: ms(20)},
  buttonRight: {marginLeft: ms(20)},
  decline: {backgroundColor: COLORS.primary},
  approve: {backgroundColor: '#4EB54E'},
  buttonText: {color: '#fff', fontWeight: '700', fontSize: sp(18)},
});

export default LeaveApprovalModal;
