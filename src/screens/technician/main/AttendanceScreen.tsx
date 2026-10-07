// src/screens/technician/main/AttendanceScreen.tsx
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, StatusBar,
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp, ms, useAppHeaderHeight } from '../../../utils/responsive';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { TechnicianTabParamList } from '../../../navigation/TechnicianTabs';
import { TechnicianStackParamList } from '../../../navigation/TechStack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { getAttendanceTechMonthly } from '../../../api/attendance/attendanceService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TechnicianTabParamList, 'Attendance'>,
  NativeStackNavigationProp<TechnicianStackParamList>
>;

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function AttendanceScreen() {
  const headerHeight = useAppHeaderHeight();
  const navigation = useNavigation<NavigationProp>();

  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('uid').then(v => setUserId(v));
  }, []);

  useFocusEffect(
    useCallback(() => { loadAttendance(); }, [userId])
  );

  // Re-tapping the Attendance tab while already on it refreshes the screen.
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) loadAttendance();
    });
    return unsubscribe;
  }, [navigation, userId]);

  const loadAttendance = async () => {
    try {
      if (!userId) return;
      const now = new Date();
      const startDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      const response = await getAttendanceTechMonthly({ UserId: Number(userId), StartDate: startDate });
      setAttendanceData(
        Array.isArray(response?.ResultData) ? response.ResultData : []
      );
    } catch { setAttendanceData([]); }
  };

  const today   = new Date();
  const year    = today.getFullYear();
  const month   = today.getMonth();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const selectedFullDate = new Date(year, month, selectedDate);

  // Java marker_calendar_* drawables: a dot only for days the API returned.
  const getDotColor = (attendance: any) => {
    const map: Record<string, string> = {
      Present: COLORS.success, Absent: COLORS.alertRed, Idle: COLORS.statusOngoing, OnLeave: COLORS.textBlack,
    };
    return attendance ? map[attendance.Attendance] ?? null : null;
  };

  const renderCalendar = () => {
    const cells = [];
    // Java (applandeo CalendarView): leading/trailing days of the adjacent months are shown greyed out.
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = 0; i < firstDay; i++) {
      cells.push(
        <View key={`p${i}`} style={styles.dayCell}>
          <View style={styles.dayCircle}><Text style={[styles.dayText, { color: COLORS.border }]}>{prevMonthDays - firstDay + 1 + i}</Text></View>
        </View>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const selected  = selectedDate === day;
      const isFuture  = new Date(year, month, day) > today;
      const dateStr   = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const attendance = attendanceData.find(a => a?.Date?.includes(dateStr));
      const dotColor  = getDotColor(attendance);

      cells.push(
        <Pressable key={`d${day}`} style={styles.dayCell} disabled={isFuture} onPress={() => setSelectedDate(day)}>
          <View style={[styles.dayCircle, selected && styles.selectedDay]}>
            <Text style={[
              styles.dayText,
              isFuture && { color: COLORS.border },
              !selected && day === today.getDate() && { color: COLORS.success, fontWeight: '700' },
              selected && styles.selectedText,
            ]}>
              {day}
            </Text>
          </View>
          {dotColor && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
        </Pressable>
      );
    }
    const trailing = 42 - firstDay - daysInMonth; // Java always draws six week rows
    for (let i = 1; i <= trailing; i++) {
      cells.push(
        <View key={`n${i}`} style={styles.dayCell}>
          <View style={styles.dayCircle}><Text style={[styles.dayText, { color: COLORS.border }]}>{i}</Text></View>
        </View>
      );
    }
    return cells;
  };

  const fmt = (k: string) => `${year}-${String(month + 1).padStart(2, '0')}-${String(k).padStart(2, '0')}`;
  const selectedAttendance = attendanceData.find(a => a?.Date?.includes(fmt(String(selectedDate))));

  const present = attendanceData.filter(a => a.Attendance === 'Present').length;
  const absent  = attendanceData.filter(a => a.Attendance === 'Absent').length;
  const idle    = attendanceData.filter(a => a.Attendance === 'Idle').length;
  const leave   = attendanceData.filter(a => a.Attendance === 'OnLeave').length;

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '-NA-';
    return dateStr.split('T')[1]?.split('.')[0] || '-NA-';
  };

  // Java curve_card_* status tag colours (On Leave tag uses white text).
  const statusColor = (attendance: any) =>
    attendance.Attendance === 'Present' ? COLORS.attPresentTag
      : attendance.Attendance === 'Idle'    ? COLORS.attIdleTag
      : attendance.Attendance === 'OnLeave' ? COLORS.attLeaveTag
      : COLORS.attAbsent;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(40) }}>
        {/* Tab Row */}
        <View style={[styles.tabRow, { paddingTop: headerHeight + vs(4) }]}>
          <Pressable style={styles.activeTab}>
            <Text style={styles.activeTabText}>ATTENDANCE</Text>
          </Pressable>
          <Pressable style={styles.inactiveTab} onPress={() => navigation.navigate('Leave')}>
            <Text style={styles.inactiveTabText}>LEAVES</Text>
          </Pressable>
        </View>

        {/* Month header */}
        <Text style={styles.monthText}>
          {today.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Text>

        {/* Day labels */}
        <View style={styles.weekRow}>
          {DAYS.map((d, i) => <Text key={i} style={styles.weekText}>{d}</Text>)}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>{renderCalendar()}</View>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Total Absent',  value: absent,  bg: COLORS.attAbsent },
            { label: 'Total Present', value: present, bg: COLORS.success },
            { label: 'Total Idle',    value: idle,    bg: COLORS.statusOngoing },
            { label: 'Total Leave',   value: leave,   bg: COLORS.attLeave },
          ].map(({ label, value, bg }) => (
            <View key={label} style={[styles.summaryCard, { backgroundColor: bg }]}>
              <Text style={styles.summaryText}>{label}</Text>
              <Text style={styles.summaryValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Check card */}
        <View style={styles.checkCard}>
          <View style={styles.line}>
            <Text style={styles.lineText} numberOfLines={1}>
              {selectedFullDate.toLocaleDateString(undefined, { weekday: 'long' })}
            </Text>
            <Text style={styles.lineLabel}>CheckIn :</Text>
            <Text style={styles.lineTime}>{formatTime(selectedAttendance?.CheckIn)}</Text>
          </View>

          {selectedAttendance && (
            <View style={styles.statusRow}>
              <View style={[styles.statusTag, { backgroundColor: statusColor(selectedAttendance) }]}>
                <Text style={[styles.statusTagText, selectedAttendance.Attendance === 'OnLeave' && { color: COLORS.white }]}>
                  {selectedAttendance.Attendance === 'OnLeave' ? 'On Leave' : selectedAttendance.Attendance}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.line}>
            <Text style={styles.lineText} numberOfLines={1}>
              {selectedFullDate.toLocaleDateString('ja-JP', {
                year: 'numeric', month: '2-digit', day: '2-digit',
              }).replace(/\//g, '-')}
            </Text>
            <Text style={styles.lineLabel}>CheckOut :</Text>
            <Text style={styles.lineTime}>{formatTime(selectedAttendance?.CheckOut)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const CELL_SIZE = scale(30);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },

  tabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: vs(8),
    backgroundColor: COLORS.white,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  activeTab: {
    flex: 1,
    borderBottomWidth: ms(4),
    borderColor: COLORS.primary,
    backgroundColor: COLORS.tabSelector,
    height: ms(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabText:   { fontSize: sp(15), fontWeight: '600', color: COLORS.primary },
  inactiveTab:     { flex: 1, height: ms(44), alignItems: 'center', justifyContent: 'center' },
  inactiveTabText: { fontSize: sp(15), fontWeight: '400', color: COLORS.textQuaternary },

  monthText: {
    textAlign: 'center',
    fontSize: sp(18),
    fontWeight: '400',
    color: COLORS.primary,
    marginVertical: vs(12),
  },

  weekRow: { flexDirection: 'row', justifyContent: 'space-evenly', paddingBottom: vs(14) },
  weekText: {
    width: '14%',
    textAlign: 'center',
    color: COLORS.midGray,
    fontWeight: '500',
    fontSize: sp(15),
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: vs(58),
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: vs(6),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  dayCircle: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText:      { fontSize: sp(14), color: COLORS.textBlack },
  selectedDay:  { backgroundColor: COLORS.success, borderRadius: scale(18) },
  selectedText: { color: '#fff', fontWeight: '600' },
  dot: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(4),
    marginTop: vs(2),
  },

  // Java: 110dp tall, 4 equal cards with 10dp gaps, 10dp radius, 46sp count.
  summaryRow: {
    flexDirection: 'row',
    marginTop: vs(15),
    paddingHorizontal: scale(10),
    gap: scale(10),
  },
  summaryCard: {
    flex: 1,
    height: vs(110),
    borderRadius: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText:  { color: COLORS.white, fontSize: sp(14), textAlign: 'center' },
  summaryValue: { color: COLORS.white, fontSize: sp(46), fontWeight: '700' },

  checkCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: scale(15),
    marginTop: vs(10),
    marginBottom: vs(20),
    padding: scale(10),
    borderRadius: scale(10),
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(4),
  },
  lineText:  { flex: 1, fontSize: sp(12), fontWeight: '700', color: COLORS.textBlack },
  lineLabel: { width: scale(80), fontSize: sp(12), color: COLORS.textBlack },
  lineTime:  { flex: 1, fontSize: sp(12), fontWeight: '700', color: COLORS.textBlack },

  // Java curve_card_*: 80x30dp tag hugging the right edge, left side fully rounded.
  statusRow: { position: 'absolute', right: 0, top: vs(15) },
  statusTag: {
    width: scale(80),
    height: vs(30),
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: scale(50),
    borderBottomLeftRadius: scale(50),
  },
  statusTagText: { color: COLORS.textBlack, fontSize: sp(12) },
});