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
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {postLeaveApprovReject} from '../../api/leaveManagement/leaveManagementService';
import type {LeaveListItem} from './adminLegacyApiTypes';
import {COLORS} from '../../theme/theme';
import {ms, sp, vs} from '../../utils/responsive';

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
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState<'approve' | 'decline' | null>(null);

  useEffect(() => {
    setNotes(String(leave?.CommentsByApprover ?? ''));
    setSubmitting(null);
  }, [leave]);

  if (!leave) {
    return null;
  }

  const statusName = String(leave.LeaveStatusName ?? '').toLowerCase();
  const isActioned =
    (statusName === 'approved' && leave.LeaveStatusId === 2) ||
    (statusName === 'rejected' && leave.LeaveStatusId === 3);
  const notesLocked = leave.CommentsByApprover != null;
  const fullName = [leave.FirstName, leave.LastName].filter(Boolean).join(' ').trim();
  const start = toDisplayDate(leave.LeaveStartDate);
  const end = toDisplayDate(leave.LeaveEndDate);

  const submit = async (approve: boolean) => {
    if (!notes.trim()) {
      Alert.alert('Leave Request', 'Please Explain Leave Reason');
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
      Alert.alert(
        'Leave Request',
        message.toLowerCase() === 'leave successfully rejected'
          ? 'Leave Successfully Declined.'
          : message || (approve ? 'Leave approved.' : 'Leave declined.'),
      );
      onActioned();
    } catch (error) {
      Alert.alert('Leave Request', error instanceof Error ? error.message : 'Unable to update leave.');
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

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Pressable style={styles.close} onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={sp(22)} color="#333" />
          </Pressable>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              {leave.ProfileImageUrl ? (
                <Image source={{uri: leave.ProfileImageUrl}} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={sp(28)} color="#60acf7" />
                </View>
              )}
              <View style={styles.headerText}>
                <Text style={styles.name}>
                  {fullName || NA}
                  <Text style={styles.empId}> (EMP{leave.UserID ?? ''})</Text>
                </Text>
                <Text style={styles.role}>{orNA(leave.UserDesignation)}</Text>
              </View>
            </View>

            {rows.map(([label, value]) => (
              <View key={label} style={styles.row}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
              </View>
            ))}

            <Text style={[styles.label, styles.notesLabel]}>Approval/Decline Notes *</Text>
            <TextInput
              style={[styles.notes, notesLocked ? styles.notesLocked : null]}
              placeholder="Notes"
              placeholderTextColor="#9aa0a6"
              value={notes}
              onChangeText={setNotes}
              editable={!notesLocked}
              multiline
            />

            {isActioned ? null : (
              <View style={styles.buttonRow}>
                <Pressable
                  style={[styles.button, styles.decline]}
                  disabled={submitting !== null}
                  onPress={() => submit(false)}>
                  {submitting === 'decline' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.declineText}>Decline</Text>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.button, styles.approve]}
                  disabled={submitting !== null}
                  onPress={() => submit(true)}>
                  {submitting === 'approve' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.approveText}>Approve</Text>
                  )}
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(16),
    borderTopRightRadius: ms(16),
    padding: ms(20),
    maxHeight: '88%',
  },
  close: {alignSelf: 'flex-end'},
  header: {flexDirection: 'row', alignItems: 'center', marginBottom: vs(16)},
  avatar: {width: ms(56), height: ms(56), borderRadius: ms(28), marginRight: ms(12)},
  avatarPlaceholder: {backgroundColor: '#f1f3f4', alignItems: 'center', justifyContent: 'center'},
  headerText: {flex: 1},
  name: {fontSize: sp(16), fontWeight: '700', color: '#20283A'},
  empId: {fontSize: sp(13), fontWeight: '400', color: '#5f6368'},
  role: {fontSize: sp(13), color: '#5f6368', marginTop: vs(2)},
  row: {flexDirection: 'row', paddingVertical: vs(7), borderBottomWidth: 1, borderBottomColor: '#f1f3f4'},
  label: {flex: 1, fontSize: sp(13), color: '#5f6368'},
  value: {flex: 1.4, fontSize: sp(13), color: '#20283A'},
  notesLabel: {marginTop: vs(14), marginBottom: vs(6)},
  notes: {
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: ms(8),
    minHeight: vs(70),
    padding: ms(10),
    fontSize: sp(13),
    color: '#20283A',
    textAlignVertical: 'top',
  },
  notesLocked: {backgroundColor: '#f8f9fa'},
  buttonRow: {flexDirection: 'row', gap: ms(12), marginTop: vs(18)},
  button: {flex: 1, borderRadius: ms(22), paddingVertical: vs(11), alignItems: 'center'},
  // Java: rounded_button (Decline, colorPrimaryDark) / rounded_button_green
  // (Approve, #4EB54E) -- both filled with white bold text, not outlined.
  decline: {backgroundColor: COLORS.primary},
  approve: {backgroundColor: '#4EB54E'},
  declineText: {color: '#fff', fontWeight: '700', fontSize: sp(14)},
  approveText: {color: '#fff', fontWeight: '700', fontSize: sp(14)},
});

export default LeaveApprovalModal;
