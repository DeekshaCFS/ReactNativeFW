// src/components/CheckInGate.tsx
//
// Java HomeActivityNew.checkAttendance() + UserDialog.showAttendanceMarkDialog() for the
// sub-admin role: on launch ask the server whether today's attendance exists
// (GET Attendance/GetTodayAttandanceIsExist); if not, show a blocking "Check in" sheet that
// posts Attendance/AddAttendance. Same request as the technician HomeScreen.
// `onResolved` (optional) fires once attendance exists (already added, or just marked).
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import Modal from './AppModal';
import { COLORS } from '../theme/theme';
import { scale, vs, sp } from '../utils/responsive';
import { attendanceCheck, addAttendance } from '../api/attendance/attendanceService';
import { getCurrentLocationAndAddress } from '../utils/locationPermision';
import { showFailureMsg, showSuccessMsg } from '../utils/toast';

const ALREADY_ADDED = 'attendance already added.';

export default function CheckInGate({ onResolved }: { onResolved?: () => void }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const userIdRef = useRef<number | null>(null);
  const resolvedRef = useRef(false);

  const resolve = useCallback(() => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    setVisible(false);
    onResolved?.();
  }, [onResolved]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const uid = Number(await AsyncStorage.getItem('uid'));
      if (!uid || cancelled) return;
      userIdRef.current = uid;
      try {
        const response = await attendanceCheck({ UserId: uid });
        if (cancelled) return;
        if (response?.Code === '200' && response?.Message?.toLowerCase() === ALREADY_ADDED) {
          resolve();
        } else {
          setVisible(true);
        }
      } catch {
        // Java: a failed check still opens the check-in dialog.
        if (!cancelled) setVisible(true);
      }
    })();
    return () => { cancelled = true; };
  }, [resolve]);

  const handleCheckIn = async () => {
    const uid = userIdRef.current;
    if (!uid || submitting) return;
    try {
      setSubmitting(true);
      const { coords, address } = await getCurrentLocationAndAddress();
      const now = new Date();
      // Java sends yyyy-M-d (no zero padding).
      const attendanceDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

      const response = await addAttendance({
        UserId: uid,
        AttendanceDate: attendanceDate,
        AttendanceTypeId: 2, // Present
        CreatedBy: uid,
        UpdatedBy: uid,
        IsModelError: true,
        IsSuccessful: true,
        Latitude: coords ? String(coords.latitude) : '',
        Longitude: coords ? String(coords.longitude) : '',
        AttendanceMarkedPlace: address ?? 'Phone GPS is OFF',
      });

      if (response?.Code === '200') {
        if (response?.Message?.toLowerCase() !== ALREADY_ADDED) {
          showSuccessMsg(t('check_in_successfully'));
        }
        resolve();
      } else {
        showFailureMsg(response?.Message || 'Please try again');
      }
    } catch (err: any) {
      showFailureMsg(err?.message || 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('check_in_for')}</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
          <Pressable style={styles.btn} onPress={handleCheckIn} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>{t('rn_check_in_2')}</Text>}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet:   { backgroundColor: '#fff', width: '100%', maxWidth: scale(560), padding: scale(20), borderTopLeftRadius: scale(28), borderTopRightRadius: scale(28), minHeight: vs(230), justifyContent: 'center' },
  title:   { fontSize: sp(20), paddingVertical: vs(15), textAlign: 'center' },
  date:    { fontSize: sp(26), textAlign: 'center', marginBottom: vs(30), fontWeight: '400' },
  btn:     { padding: scale(10), borderRadius: scale(30), backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', height: vs(56) },
  btnText: { fontSize: sp(20), color: '#fff' },
});