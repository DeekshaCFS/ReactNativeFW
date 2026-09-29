// src/screens/admin/EmployeeAttendanceModal.tsx
//
// Owner-facing per-employee attendance drill-down. Mirrors Android's
// OwnerAttendanceFragment.showTechAttendanceDialogNew bottom sheet: a
// monthly calendar with colored day markers, a day-tap detail card
// (CheckIn/CheckOut + status), and monthly Present/Absent/Idle/OnLeave
// counters, plus a call icon. Reached from the calendar icon on each row
// in EmployeeManagementScreen.tsx.
//
// Calendar/dot/summary logic is adapted from the technician's own
// self-attendance view (screens/technician/main/AttendanceScreen.tsx),
// generalized to view another user and to browse months via prev/next.

import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {ms, scale, sp, vs} from '../../utils/responsive';
import {getAttendanceTechMonthly} from '../../api/attendance/attendanceService';
import type {TechMonthlyAttendanceResultData} from '../../api/attendance/attendance.types';
import type {EmployeeListItem} from './adminLegacyApiTypes';

type Props = {
  visible: boolean;
  employee: EmployeeListItem | null;
  onClose: () => void;
};

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const THEME_PRIMARY = '#c3002f';
const DEFAULT_PROFILE_ICON = require('../../../assets/images/image.png');

const getEmployeeName = (item: EmployeeListItem) =>
  String(item.FirstNameM ?? '').trim() || `Employee ${item.EmployeeNumber ?? '-'}`;

const getDotColor = (record: TechMonthlyAttendanceResultData | undefined, cellDate: Date, today: Date) => {
  if (cellDate > today) return null;
  if (!record) return '#f01d1d';
  const map: Record<string, string> = {
    Present: '#22c55e',
    Absent: '#f01d1d',
    Idle: '#f59e0b',
    OnLeave: '#000',
  };
  return map[record.Attendance ?? ''] ?? null;
};

const statusColor = (record: TechMonthlyAttendanceResultData | undefined) => {
  if (!record) return '#f87171';
  return record.Attendance === 'Present'
    ? '#22c55e'
    : record.Attendance === 'Idle'
    ? '#f59e0b'
    : record.Attendance === 'OnLeave'
    ? '#000'
    : '#f87171';
};

const formatTime = (dateStr?: string) => {
  if (!dateStr) return '-NA-';
  return dateStr.split('T')[1]?.split('.')[0] || '-NA-';
};

const CELL_SIZE = scale(32);

const EmployeeAttendanceModal: React.FC<Props> = ({visible, employee, onClose}) => {
  const [viewedMonth, setViewedMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDate());
  const [records, setRecords] = useState<TechMonthlyAttendanceResultData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const now = new Date();
    setViewedMonth(now);
    setSelectedDay(now.getDate());
  }, [visible, employee?.EmployeeNumber]);

  useEffect(() => {
    if (!visible || !employee?.EmployeeNumber) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const year = viewedMonth.getFullYear();
        const month = viewedMonth.getMonth() + 1;
        const startDate = `${year}-${month}-1`;
        const response = await getAttendanceTechMonthly({
          UserId: employee.EmployeeNumber,
          StartDate: startDate,
        });
        if (!cancelled) {
          setRecords(Array.isArray(response?.ResultData) ? response.ResultData : []);
        }
      } catch {
        if (!cancelled) setRecords([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, employee?.EmployeeNumber, viewedMonth]);

  const today = useMemo(() => new Date(), [visible]);
  const year = viewedMonth.getFullYear();
  const month = viewedMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const fmt = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const findRecord = (day: number) => records.find(r => r?.Date?.includes(fmt(day)));

  const selectedRecord = findRecord(selectedDay);
  const selectedDate = new Date(year, month, selectedDay);

  const present = records.filter(r => r.Attendance === 'Present').length;
  const absent = records.filter(r => r.Attendance === 'Absent').length;
  const idle = records.filter(r => r.Attendance === 'Idle').length;
  const leave = records.filter(r => r.Attendance === 'OnLeave').length;

  const handleCall = () => {
    const mobile = String(employee?.ContactM ?? '').trim();
    if (!mobile) {
      Alert.alert('Attendance', 'Mobile number is not available.');
      return;
    }
    Linking.openURL(`tel:${mobile}`).catch(() => {
      Alert.alert('Attendance', 'Unable to open dialer.');
    });
  };

  const goToPrevMonth = () => setViewedMonth(new Date(year, month - 1, 1));
  const goToNextMonth = () => setViewedMonth(new Date(year, month + 1, 1));
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const renderCalendar = () => {
    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(<View key={`e${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const isFuture = cellDate > today;
      const record = findRecord(day);
      const dotColor = getDotColor(record, cellDate, today);
      const selected = selectedDay === day;

      cells.push(
        <Pressable
          key={`d${day}`}
          style={styles.dayCell}
          disabled={isFuture}
          onPress={() => setSelectedDay(day)}>
          <View style={[styles.dayCircle, selected && styles.selectedDay]}>
            <Text
              style={[
                styles.dayText,
                isFuture && styles.dayTextFuture,
                selected && styles.selectedText,
              ]}>
              {day}
            </Text>
          </View>
          {dotColor && <View style={[styles.dot, {backgroundColor: dotColor}]} />}
        </Pressable>,
      );
    }
    return cells;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          {employee ? (
            <>
              <View style={styles.headerRow}>
                <Image
                  source={employee.ProfileImage ? {uri: employee.ProfileImage} : DEFAULT_PROFILE_ICON}
                  style={styles.avatar}
                />
                <View style={styles.headerTextColumn}>
                  <Text numberOfLines={1} style={styles.name}>
                    {getEmployeeName(employee)}
                  </Text>
                  <Text numberOfLines={1} style={styles.role}>
                    {String(employee.DesignationName ?? employee.UserGroupName ?? 'Employee').trim()}
                  </Text>
                </View>
                <Pressable hitSlop={10} onPress={handleCall} style={styles.callButton}>
                  <Text style={styles.callIcon}>☎</Text>
                </Pressable>
              </View>

              <View style={styles.monthRow}>
                <Pressable hitSlop={10} onPress={goToPrevMonth} style={styles.monthNavButton}>
                  <Text style={styles.monthNavText}>‹</Text>
                </Pressable>
                <Text style={styles.monthText}>
                  {viewedMonth.toLocaleString('default', {month: 'long', year: 'numeric'})}
                </Text>
                <Pressable
                  hitSlop={10}
                  onPress={goToNextMonth}
                  disabled={isCurrentMonth}
                  style={styles.monthNavButton}>
                  <Text style={[styles.monthNavText, isCurrentMonth && styles.monthNavTextDisabled]}>
                    ›
                  </Text>
                </Pressable>
              </View>

              <View style={styles.weekRow}>
                {DAYS.map((d, i) => (
                  <Text key={i} style={styles.weekText}>
                    {d}
                  </Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>{renderCalendar()}</View>

              <View style={styles.summaryRow}>
                {[
                  {label: 'Present', value: present, bg: '#22c55e'},
                  {label: 'Absent', value: absent, bg: '#f87171'},
                  {label: 'Idle', value: idle, bg: '#f59e0b'},
                  {label: 'Leave', value: leave, bg: '#000'},
                ].map(({label, value, bg}) => (
                  <View key={label} style={[styles.summaryCard, {backgroundColor: bg}]}>
                    <Text style={styles.summaryValue}>{loading ? '-' : value}</Text>
                    <Text style={styles.summaryLabel}>{label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.checkCard}>
                <View style={styles.checkRow}>
                  <Text style={styles.checkDateText} numberOfLines={1}>
                    {selectedDate.toLocaleDateString(undefined, {weekday: 'long', day: '2-digit', month: 'short'})}
                  </Text>
                  <View style={[styles.statusTag, {backgroundColor: statusColor(selectedRecord)}]}>
                    <Text style={styles.statusTagText}>{selectedRecord?.Attendance ?? 'Absent'}</Text>
                  </View>
                </View>
                <View style={styles.checkRow}>
                  <Text style={styles.checkLabel}>Check In</Text>
                  <Text style={styles.checkTime}>{formatTime(selectedRecord?.CheckIn)}</Text>
                </View>
                <View style={styles.checkRow}>
                  <Text style={styles.checkLabel}>Check Out</Text>
                  <Text style={styles.checkTime}>{formatTime(selectedRecord?.CheckOut)}</Text>
                </View>
              </View>

              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.36)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: ms(560),
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: ms(16),
    borderTopRightRadius: ms(16),
    paddingHorizontal: ms(22),
    paddingTop: ms(20),
    paddingBottom: ms(28),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(14),
  },
  avatar: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    marginRight: ms(12),
  },
  headerTextColumn: {
    flex: 1,
  },
  name: {
    color: '#111827',
    fontSize: sp(17),
    fontWeight: '800',
  },
  role: {
    color: '#6b7280',
    fontSize: sp(13),
    marginTop: vs(2),
  },
  callButton: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5d7d784',
  },
  callIcon: {
    color: THEME_PRIMARY,
    fontSize: sp(16),
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(8),
  },
  monthNavButton: {
    paddingHorizontal: ms(16),
    paddingVertical: vs(4),
  },
  monthNavText: {
    fontSize: sp(22),
    color: THEME_PRIMARY,
    fontWeight: '700',
  },
  monthNavTextDisabled: {
    color: '#d1d5db',
  },
  monthText: {
    fontSize: sp(15),
    fontWeight: '700',
    color: '#111827',
    minWidth: ms(150),
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  weekText: {
    width: '14%',
    textAlign: 'center',
    color: '#84868a',
    fontWeight: '500',
    fontSize: sp(13),
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: vs(3),
  },
  dayCircle: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: sp(13),
    color: '#111',
  },
  dayTextFuture: {
    color: '#ccc',
  },
  selectedDay: {
    backgroundColor: THEME_PRIMARY,
    borderRadius: CELL_SIZE / 2,
  },
  selectedText: {
    color: '#fff',
    fontWeight: '700',
  },
  dot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    marginTop: vs(2),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: vs(16),
    gap: scale(6),
  },
  summaryCard: {
    flex: 1,
    minHeight: vs(58),
    borderRadius: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(6),
  },
  summaryValue: {
    color: '#fff',
    fontSize: sp(18),
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#fff',
    fontSize: sp(11),
    marginTop: vs(2),
  },
  checkCard: {
    backgroundColor: '#f9fafb',
    borderRadius: scale(12),
    padding: scale(14),
    marginTop: vs(14),
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(4),
  },
  checkDateText: {
    flex: 1,
    fontSize: sp(13),
    fontWeight: '600',
    color: '#111827',
  },
  checkLabel: {
    fontSize: sp(13),
    color: '#6b7280',
  },
  checkTime: {
    fontSize: sp(13),
    fontWeight: '600',
    color: '#111827',
  },
  statusTag: {
    paddingHorizontal: scale(12),
    paddingVertical: vs(3),
    borderRadius: scale(10),
  },
  statusTagText: {
    color: '#fff',
    fontSize: sp(11),
    fontWeight: '600',
  },
  closeButton: {
    marginTop: vs(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: THEME_PRIMARY,
    fontSize: sp(16),
    fontWeight: '800',
  },
});

export default EmployeeAttendanceModal;
