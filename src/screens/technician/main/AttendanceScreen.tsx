// src/screens/technician/main/AttendanceScreen.tsx
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, StatusBar,
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp, ms, wp, HEADER_TOP_PADDING } from '../../../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : insets.top;

  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('uid').then(v => setUserId(v));
  }, []);

  useFocusEffect(
    useCallback(() => { loadAttendance(); }, [userId])
  );

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

  const getDotColor = (attendance: any, day: number) => {
    if (new Date(year, month, day) > today) return null;
    if (!attendance) return '#f01d1d';
    const map: Record<string, string> = {
      Present: '#22c55e', Absent: '#f01d1d', Idle: '#f59e0b', OnLeave: '#000',
    };
    return map[attendance.Attendance] ?? null;
  };

  const renderCalendar = () => {
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<View key={`e${i}`} style={styles.dayCell} />);

    for (let day = 1; day <= daysInMonth; day++) {
      const selected  = selectedDate === day;
      const isFuture  = new Date(year, month, day) > today;
      const dateStr   = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const attendance = attendanceData.find(a => a?.Date?.includes(dateStr));
      const dotColor  = getDotColor(attendance, day);

      cells.push(
        <Pressable key={`d${day}`} style={styles.dayCell} onPress={() => setSelectedDate(day)}>
          <View style={[styles.dayCircle, selected && styles.selectedDay]}>
            <Text style={[
              styles.dayText,
              isFuture && { color: '#ccc' },
              !selected && day === today.getDate() && { color: '#22c55e', fontWeight: '700' },
              selected && styles.selectedText,
            ]}>
              {day}
            </Text>
          </View>
          {dotColor && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
        </Pressable>
      );
    }
    return cells;
  };

  const fmt = (k: string) => `${year}-${String(month + 1).padStart(2, '0')}-${String(k).padStart(2, '0')}`;
  const selectedAttendance = attendanceData.find(a => a?.Date?.includes(fmt(String(selectedDate))));

  const present = attendanceData.filter(a => a.Attendance === 'Present').length;
  const absent  = Array.from({ length: today.getDate() }, (_, i) => i + 1).filter(day => {
    const r = attendanceData.find(a => a?.Date?.includes(fmt(String(day))));
    return !r || r.Attendance === 'Absent';
  }).length;
  const idle    = attendanceData.filter(a => a.Attendance === 'Idle').length;
  const leave   = attendanceData.filter(a => a.Attendance === 'OnLeave').length;

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '-NA-';
    return dateStr.split('T')[1]?.split('.')[0] || '-NA-';
  };

  const statusColor = (attendance: any) => {
    if (!attendance) return '#f87171';
    return attendance.Attendance === 'Present' ? '#22c55e'
      : attendance.Attendance === 'Idle'    ? '#f59e0b'
      : attendance.Attendance === 'OnLeave' ? '#000'
      : '#f87171';
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(40) }}>
        {/* Tab Row */}
        <View style={[styles.tabRow, { paddingTop: HEADER_TOP_PADDING + vs(10)}]}>
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
            { label: 'Total Absent',  value: absent,  bg: '#f87171' },
            { label: 'Total Present', value: present, bg: '#22c55e' },
            { label: 'Total Idle',    value: idle,    bg: '#f59e0b' },
            { label: 'Total Leave',   value: leave,   bg: '#000' },
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

          <View style={styles.statusRow}>
            <View style={[styles.statusTag, { backgroundColor: statusColor(selectedAttendance) }]}>
              <Text style={styles.statusTagText}>
                {selectedAttendance?.Attendance ?? 'Absent'}
              </Text>
            </View>
          </View>

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

const CELL_SIZE = scale(36);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },

  tabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: vs(8),
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  activeTab: {
    flex: 1,
    borderBottomWidth: ms(3),
    borderColor: COLORS.primary,
    backgroundColor: '#f5d7d784',
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
    fontWeight: '600',
    color: COLORS.primary,
    marginVertical: vs(12),
  },

  weekRow: { flexDirection: 'row', justifyContent: 'space-evenly' },
  weekText: {
    width: '14%',
    textAlign: 'center',
    color: '#84868a',
    fontWeight: '500',
    fontSize: sp(15),
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: scale(4),
  },
  dayCell: {
    width: '14%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: vs(4),
  },
  dayCircle: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText:      { fontSize: sp(14), color: '#111' },
  selectedDay:  { backgroundColor: '#22c55e', borderRadius: scale(18) },
  selectedText: { color: '#fff', fontWeight: '600' },
  dot: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(4),
    marginTop: vs(2),
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: vs(24),
    paddingHorizontal: scale(4),
    flexWrap: 'wrap',
    gap: scale(6),
  },
  summaryCard: {
    width: wp(21),
    minHeight: vs(90),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(4),
    paddingVertical: vs(10),
  },
  summaryText:  { color: '#fff', fontSize: sp(12), textAlign: 'center' },
  summaryValue: { color: '#fff', fontSize: sp(32), fontWeight: '700' },

  checkCard: {
    backgroundColor: '#fff',
    margin: scale(16),
    padding: scale(16),
    borderRadius: scale(14),
    elevation: 4,
    shadowColor: '#000',
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
  lineText:  { flex: 1, fontSize: sp(13), fontWeight: '500', color: COLORS.textPrimary },
  lineLabel: { width: scale(80), fontSize: sp(13), color: COLORS.textPrimary },
  lineTime:  { flex: 1, fontSize: sp(13), fontWeight: '500', textAlign: 'right', color: COLORS.textPrimary },

  statusRow: { alignItems: 'flex-end', paddingVertical: vs(6) },
  statusTag: {
    paddingHorizontal: scale(14),
    paddingVertical: vs(4),
    borderTopLeftRadius: scale(12),
    borderBottomLeftRadius: scale(12),
  },
  statusTagText: { color: '#fff', fontSize: sp(12), fontWeight: '500' },
});