// src/screens/technician/main/HomeScreen.tsx
import {
  View, Text, StyleSheet, FlatList,
  Pressable, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../../theme/theme';
import { useState, useEffect, useCallback } from 'react';
import { useDoubleBackExit } from '../../../hooks/useDoubleBackExit';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { attendanceCheck, addAttendance } from '../../../api/attendance/attendanceService';
import { getTodayTaskList } from '../../../api/task/taskService';
import { getTaskStatusCountOwnNew } from '../../../api/dashboard/dashboardService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfileDetails } from '../../../api/users/usersService';
import { getCountrySymbol } from '../../../api/countryDetails/countryDetailsService';
import { setCurrentCountryDetails } from '../../../state/session';
import Svg, { Circle, Path } from 'react-native-svg';
import { scale, vs, sp, hp, HEADER_TOP_PADDING } from '../../../utils/responsive';
import type { TasksListResultData as Task } from '../../../api/task/task.types';
import { useFocusEffect } from '@react-navigation/native';

// ── helpers ──────────────────────────────────────────────────────────────────

const getStatusStyle = (status?: string) => {
  switch (status) {
    case 'Completed': return styles.ribbonCompleted;
    case 'Rejected': return styles.ribbonRejected;
    case 'Ongoing': return styles.ribbonOngoing;
    case 'InActive': return styles.ribbonInactive;
    case 'OnHold': return styles.ribbonOnHold;
    default: return styles.ribbonInactive;
  }
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ── component ─────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: any) {
  const [filter, setFilter] = useState<'Today' | 'Week' | 'Month' | 'Year'>('Today');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [attendanceChecked, setAttendanceChecked] = useState(false);

  const [token,   setToken]   = useState<string | null>(null);
  const [userId,  setUserId]  = useState<number | null>(null);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [name,    setName]    = useState<string | null>(null);

  const [taskStatusCounts, setTaskStatusCounts] = useState({
    completed: 0, ongoing: 0, inactive: 0, rejected: 0, onHold: 0, total: 0,
  });

  const [todayTasks,   setTodayTasks]   = useState<Task[]>([]);
  const [loadingToday, setLoadingToday] = useState(false);

  const [profilePercent, setProfilePercent] = useState(0);

  useDoubleBackExit();

  // ── session ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const loadSession = async () => {
      const storedToken   = await AsyncStorage.getItem('token');
      const storedUserId  = await AsyncStorage.getItem('uid');
      const storedOwnerId = await AsyncStorage.getItem('owner_id');
      const storedName    = await AsyncStorage.getItem('name');
      setToken(storedToken);
      setUserId(storedUserId  ? Number(storedUserId)  : null);
      setOwnerId(storedOwnerId ? Number(storedOwnerId) : null);
      setName(storedName);
    };
    loadSession();
  }, []);

  useEffect(() => {
    if (token && userId) {
      loadProfile();
      loadTaskCounts();
      loadCountrySymbol();
      if (!attendanceChecked) {
        checkAttendance();
        setAttendanceChecked(true);
      }
    }
  }, [token, userId]);

  useEffect(() => {
    if (userId) loadTaskCounts();
  }, [filter, ownerId]);

  useFocusEffect(
    useCallback(() => {
      if (userId) loadTodayTasks();
    }, [userId])
  );

  // ── data loaders ──────────────────────────────────────────────────────────

  const checkAttendance = async () => {
    try {
      if (!userId) return;
      const todayKey = `checked_in_${new Date().toISOString().split('T')[0]}`;
      const local = await AsyncStorage.getItem(todayKey);
      if (local === 'true') return;

      const response = await attendanceCheck({ UserId: userId });
      if (response?.Code === '200' && response?.Message?.toLowerCase() === 'attendance already added.') {
        await AsyncStorage.setItem(todayKey, 'true');
      } else {
        setShowCheckInModal(true);
      }
    } catch {
      setShowCheckInModal(true);
    }
  };

  const handleCheckIn = async () => {
    try {
      const response = await addAttendance({
        UserId: userId!,
        AttendanceDate: new Date().toISOString(),
        AttendanceTypeId: 0,
        CreatedBy: userId!,
        Latitude: '',
        Longitude: '',
        AttendanceMarkedPlace: '',
      });

      if (response?.Code === '200') {
        const todayKey = `checked_in_${new Date().toISOString().split('T')[0]}`;
        await AsyncStorage.setItem(todayKey, 'true');
        setShowCheckInModal(false);
        Alert.alert('Success', 'Checked in successfully!');
      } else {
        Alert.alert('Check-in Failed', response?.Message || 'Please try again');
      }
    } catch (err: any) {
      Alert.alert('Check-in Failed', err?.message || 'Please try again');
    }
  };

  const loadProfile = async () => {
    try {
      if (!userId) return;

      const response = await getProfileDetails({ UserId: userId });
      const profile = response?.ResultData;

      if (profile) {
        const fullName =
          `${profile.FirstName ?? ''} ${profile.LastName ?? ''}`.trim();

        setName(fullName);
        await AsyncStorage.setItem('name', fullName);

        const pct = Number(profile.ProgressBarPercentage ?? 0);
        setProfilePercent(Number.isFinite(pct) ? pct : 0);
      }
    } catch {
      // silent
    }
  };

  // Java's HomeActivityNew.onCreate() calls GetCountrySymbol() once per
  // session (owner AND technician/fieldworker alike) and caches the result
  // in SharedPrefManager -- used to prefix customer phone numbers and build
  // WhatsApp links. Mirror that here so the technician stack has it too.
  const loadCountrySymbol = async () => {
    try {
      if (!userId) return;

      const response = await getCountrySymbol({ UserId: userId });
      const resultData = response?.ResultData;
      if (resultData) {
        setCurrentCountryDetails(resultData.CountryCode, resultData.CurrencySymbol);
      }
    } catch {
      // silent -- non-critical, same as loadProfile
    }
  };

  const loadTaskCounts = async () => {
    if (!userId) return;

    try {
      const response = await getTaskStatusCountOwnNew({
        OwnerId: userId,
        Flag: filter.toLowerCase(),
      });

      const rows = response?.ResultData || [];
      const counts = { completed: 0, ongoing: 0, inactive: 0, rejected: 0, onHold: 0, total: 0 };

      rows.forEach(row => {
        const count = row.Taskcount ?? 0;
        counts.total += count;
        switch (row.Name) {
          case 'Completed': counts.completed = count; break;
          case 'Rejected':  counts.rejected  = count; break;
          case 'Ongoing':   counts.ongoing   = count; break;
          case 'InActive':  counts.inactive  = count; break;
          case 'OnHold':    counts.onHold    = count; break;
        }
      });

      setTaskStatusCounts(counts);
    } catch {}
  };

  const loadTodayTasks = async () => {
    if (!userId) return;
    try {
      setLoadingToday(true);
      const response = await getTodayTaskList({ UserId: userId, pageIndex: 1, AllData: true });
      const all: Task[] = response?.ResultData || [];

      const todayStr = new Date().toDateString();
      const filtered = all.filter(t => {
        const d = t.TaskDate ? new Date(t.TaskDate).toDateString() : null;
        return d === todayStr;
      });

      setTodayTasks(filtered);
    } catch { /* silent */ }
    finally { setLoadingToday(false); }
  };

  // ── stats (server-computed, see loadTaskCounts) ─────────────────────────────

  const {
    completed: completedCount,
    ongoing:   ongoingCount,
    inactive:  inactiveCount,
    rejected:  rejectedCount,
    onHold:    onHoldCount,
    total:     totalTaskCount,
  } = taskStatusCounts;

  // ── arc chart ─────────────────────────────────────────────────────────────

  const ARC_SIZE   = scale(220);
  const ARC_CX     = scale(110);
  const ARC_CY     = scale(110);
  const ARC_RADIUS = scale(88);
  const ARC_STROKE = scale(16);

  const STATUS_COLORS = ['#08cb50','#f97316','#9ca3af', COLORS.primary,'#000'];

  function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function buildArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
    const sweep = endDeg - startDeg;

    if (sweep >= 359.99) {
      const start = polarToXY(cx, cy, r, startDeg);
      const mid   = polarToXY(cx, cy, r, startDeg + 180);
      return (
        `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} ` +
        `A ${r} ${r} 0 1 1 ${mid.x.toFixed(2)} ${mid.y.toFixed(2)} ` +
        `A ${r} ${r} 0 1 1 ${start.x.toFixed(2)} ${start.y.toFixed(2)}`
      );
    }

    const s = polarToXY(cx, cy, r, startDeg);
    const e = polarToXY(cx, cy, r, endDeg);
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  }

  function TaskArcCircle({ total, completed, ongoing, inactive, rejected, onHold }: {
    total: number; completed: number; ongoing: number;
    inactive: number; rejected: number; onHold: number;
  }) {
    const counts = [completed, ongoing, inactive, rejected, onHold];
    const safe   = total || 1;
    let offset   = 0;
    const arcs   = counts.map((count, i) => {
      const sweep = (count / safe) * 360;
      if (sweep <= 0) return null;
      const path  = buildArc(ARC_CX, ARC_CY, ARC_RADIUS, offset, offset + sweep);
      offset += sweep;
      return { path, color: STATUS_COLORS[i] };
    });
    return (
      <View style={styles.circleWrapper}>
        <Svg width={ARC_SIZE} height={ARC_SIZE}>
          <Circle cx={ARC_CX} cy={ARC_CY} r={ARC_RADIUS} fill="none" stroke="#2563eb" strokeWidth={ARC_STROKE} />
          {arcs.map((arc, i) => arc ? (
            <Path key={i} d={arc.path} fill="none" stroke={arc.color} strokeWidth={ARC_STROKE} strokeLinecap="butt" />
          ) : null)}
        </Svg>
        <View style={styles.circleLabelBox} pointerEvents="none">
          <Text style={styles.circleValue}>{total}</Text>
          <Text style={styles.circleLabel}>Total Task</Text>
        </View>
      </View>
    );
  }

  // ── task navigation ───────────────────────────

  const openTask = async (task: Task) => {
      // ── Terminal states ──────────────────────────────────────────
      if (task.TaskStatus === 'Completed') {
        Alert.alert('Task Completed', 'This task has already been completed.');
        return;
      }
      if (task.TaskStatus === 'Rejected') {
        Alert.alert('Task Rejected', 'This task has been rejected.');
        return;
      }
  
      if (task.TaskStatus === 'Ongoing') {
        switch (task.TaskState) {
          case 0: // Not started → tracking/accept flow
          case 1: // Started but not ended → still in execution
            navigation.navigate('TaskRouteMap', { task });
            break;
          case 2: // ENDED_NO_PAYMENT
            // Rate mode + closure already submitted → go straight to payment
            if (task.PaymentMode === 'Rate' && task.PaymentModeId === 2 && task.TaskClosureStatus === true) {
              navigation.navigate('PaymentReceived', { task });
            } else {
              navigation.navigate('TaskClosure', { task });
            }
            break;
          case 3: // Payment received → already done
            Alert.alert('Task Completed', 'This task is completed and payment is received.');
            break;
          case 4: // Fully closed
            Alert.alert('Task Closed', 'This task has already been closed.');
            break;
          default:
            navigation.navigate('TaskRouteMap', { task });
        }
        return;
      }
  
      // ── Pending / Not yet started (State 0 or 1) ────────────────
      if (task.TaskState === 0 || task.TaskState === 1) {
  
        if (task.TaskStatus === 'InActive') {
          const taskDate = new Date(task.TaskDate ?? '');
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          taskDate.setHours(0, 0, 0, 0);
          const diffDays = Math.round(
            (today.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24)
          );
  
          if (taskDate > today) {
            Alert.alert('Too Early', "It's too early to accept this task!");
            return;
          }
  
          navigation.navigate('TaskTracking', { task });
          return;
        }
  
        if (task.TaskStatus === 'OnHold') {
          navigation.navigate('TaskTracking', { task, resumeOnHold: true });
          return;
        }
      }
  
      // ── Work done, pending closure (State 2) ────────────────────
      if (task.TaskState === 2) {
        if (
          task.PaymentMode === 'Rate' &&
          task.PaymentModeId === 2 &&
          task.TaskClosureStatus === true
        ) {
          navigation.navigate('PaymentReceived', { task });
        } else {
          navigation.navigate('TaskClosure', { task });
        }
        return;
      }
  
      // ── Closure submitted, awaiting payment (State 3) ───────────
      if (task.TaskState === 3) {
        if (!task.TaskClosureStatus) {
          navigation.navigate('TaskClosure', { task });
        } else {
          Alert.alert('Task Completed', 'This task is completed and payment is received.');
        }
        return;
      }
    };

  // ── task card ─────────────────────────────────────────────────────────────

  const renderTaskCard = ({ item }: { item: Task }) => {
    const Task_Tag = item.Task_TagName?.toUpperCase() || null;
    return (
      <Pressable style={styles.card} onPress={() => openTask(item)}>
        <View style={styles.topRow}>
          <View style={[styles.statusBadge, getStatusStyle(item.TaskStatus)]}>
            <Text style={styles.statusText}>{item.TaskStatus?.toUpperCase()}</Text>
          </View>
          {Task_Tag && (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{Task_Tag}</Text>
            </View>
          )}
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {item.Name}{' '}
          </Text>
          <Text style={styles.taskId}>[{item.NewTaskId}]</Text>
          <Text style={styles.dateText}>{formatDateTime(item.CreatedDate)}</Text>
        </View>
        <View style={styles.contentRow}>
          <View style={styles.leftCol}>
            <Text style={styles.address} numberOfLines={2}>{item.LocationName}</Text>
            <View style={styles.customerRow}>
              <Text style={styles.customer}>{item.CustomerName}</Text>
              {/* <Ionicons name="attach-outline" size={sp(18)} color={COLORS.primary} /> */}
            </View>
          </View>
          <View style={styles.rightCol}>
            <View style={styles.itemEntry}>
              <Text style={styles.itemName}>
                {item.FSRName && item.FSRName.toUpperCase() !== 'NA' ? item.FSRName : ''}
              </Text>
              {!!item.WagesPerHours && (
                <Text style={styles.itemPrice}>Rs.{item.WagesPerHours}</Text>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  // ── date label for stats header ───────────────────────────────────────────

  const dateLabel = (() => {
    const fmt = (d: Date) => d.toLocaleDateString('en-GB').replace(/\//g, '-');
    const today = new Date();
    if (filter === 'Today') return fmt(today);
    if (filter === 'Week') {
      const start = new Date();
      const day = start.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diffToMonday);
      return `${fmt(start)} to ${fmt(today)}`;
    }
    if (filter === 'Month') {
      return `${fmt(new Date(today.getFullYear(), today.getMonth(), 1))} to ${fmt(today)}`;
    }
    return `${fmt(new Date(today.getFullYear(), 0, 1))} to ${fmt(today)}`;
  })();

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <View style={styles.redBg} />

      {/* Greeting row */}
      <View style={styles.greetingRow}>
        <Text style={styles.headerGreeting}>Hello, {name ?? '...'}</Text>
        <Pressable style={styles.filterButton} onPress={() => setDropdownVisible(true)}>
          <Text style={styles.headerSub}>{filter}</Text>
          <Ionicons name="chevron-down" size={sp(20)} color="#FEE2E2" />
        </Pressable>
      </View>

      {/* White sheet */}
      <FlatList
        data={todayTasks}
        keyExtractor={(item) => String(item.Id)}
        renderItem={renderTaskCard}
        contentContainerStyle={styles.whiteSheet}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Profile completion */}
            <>
              <Pressable onPress={() => navigation.navigate('Profile')}>
                <Text style={styles.profileTitle}>Profile Completion</Text>
              </Pressable>
              <View style={styles.progressRow}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${profilePercent}%` }]} />
                </View>
                <Text style={styles.profilePercentText}>{profilePercent}%</Text>
              </View>
            </>

            {/* Date label */}
            <Text style={styles.dateLabelText}>
              Showing data for{' '}
              <Text style={{ color: '#212121' }}>{dateLabel}</Text>
            </Text>

            {/* Arc + stats */}
            <View style={styles.statsRow}>
              <TaskArcCircle
                total={totalTaskCount}
                completed={completedCount}
                ongoing={ongoingCount}
                inactive={inactiveCount}
                rejected={rejectedCount}
                onHold={onHoldCount}
              />
              <View style={styles.stats}>
                <Text style={[styles.stat, { color: '#08cb50' }]}>
                  {String(completedCount).padStart(2, '0')}{'  '}Completed
                </Text>
                <Text style={[styles.stat, { color: '#f97316' }]}>
                  {String(ongoingCount).padStart(2, '0')}{'  '}Ongoing
                </Text>
                <Text style={[styles.stat, { color: '#9ca3af' }]}>
                  {String(inactiveCount).padStart(2, '0')}{'  '}InActive
                </Text>
                <Text style={[styles.stat, { color: COLORS.primary }]}>
                  {String(rejectedCount).padStart(2, '0')}{'  '}Rejected
                </Text>
                <Text style={[styles.stat, { color: '#000' }]}>
                  {String(onHoldCount).padStart(2, '0')}{'  '}OnHold
                </Text>
              </View>
            </View>

            {/* Divider before task list */}
            <View style={styles.divider} />

            {/* Loading indicator */}
            {loadingToday && (
              <ActivityIndicator
                color={COLORS.primary}
                size="small"
                style={{ marginVertical: vs(12) }}
              />
            )}
          </>
        }
        ListEmptyComponent={
          !loadingToday ? (
            <Text style={styles.emptyText}>No tasks for today</Text>
          ) : null
        }
      />

      {/* Filter dropdown */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setDropdownVisible(false)} />
        <View style={styles.dropdown}>
          {(['Today', 'Week', 'Month', 'Year'] as const).map((item) => (
            <Pressable
              key={item}
              style={styles.dropdownItem}
              onPress={() => { setFilter(item); setDropdownVisible(false); }}
            >
              <Text style={styles.dropdownText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </Modal>

      {/* Check-in modal */}
      <Modal transparent visible={showCheckInModal} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <Text style={styles.modalTitle}>Check-in for</Text>
            <Text style={styles.modalDate}>
              {new Date().toLocaleDateString('en-GB', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </Text>
            <Pressable style={styles.confirmBtn} onPress={handleCheckIn}>
              <Text style={styles.confirmText}>CHECK-IN</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: COLORS.primary },
  redBg:          { height: HEADER_TOP_PADDING + hp(1), backgroundColor: COLORS.primary },

  whiteSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    padding: scale(10),
    paddingBottom: vs(40),
    flexGrow: 1,
  },

  greetingRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: scale(20), paddingVertical: vs(10), minHeight: vs(50) },
  headerGreeting: { fontSize: sp(20), fontWeight: '500', color: '#fff' },
  filterButton:   { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
  headerSub:      { fontSize: sp(18), color: COLORS.white },

  dropdown:     { position: 'absolute', top: HEADER_TOP_PADDING + vs(50), right: scale(18), backgroundColor: '#fff', width: scale(140), elevation: 6, borderRadius: scale(8), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  dropdownItem: { padding: scale(12) },
  dropdownText: { fontSize: sp(14) },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'center' },
  bottomSheet:  { backgroundColor: '#fff', width: '100%', maxWidth: scale(560), padding: scale(20), borderTopLeftRadius: scale(28), borderTopRightRadius: scale(28), minHeight: vs(230), justifyContent: 'center' },
  modalTitle:   { fontSize: sp(20), paddingVertical: vs(15), textAlign: 'center' },
  modalDate:    { fontSize: sp(26), textAlign: 'center', marginBottom: vs(30), fontWeight: '400' },
  confirmBtn:   { padding: scale(10), borderRadius: scale(30), backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', height: vs(56) },
  confirmText:  { fontSize: sp(20), color: '#fff' },

  profileTitle:        { fontSize: sp(16), fontWeight: '500', paddingLeft: scale(8) },
  progressRow:         { flexDirection: 'row', alignItems: 'center', marginTop: vs(15), paddingHorizontal: scale(8) },
  progressBar:         { width: '90%', height: vs(6), borderRadius: 3, overflow: 'hidden', backgroundColor: COLORS.textMuted },
  progressFill:        { height: vs(6), backgroundColor: '#f59e0b', borderRadius: 3 },
  profilePercentText:  { width: '10%', fontSize: sp(13), textAlign: 'right' },
  
  dateLabelText: { marginVertical: vs(12), fontSize: sp(15), color: '#6b7280' },

  circleWrapper:  { alignItems: 'center', justifyContent: 'center', marginVertical: vs(10) },
  circleValue:    { fontSize: sp(30), fontWeight: '700', color: '#212121' },
  circleLabel:    { color: '#6b7280', fontSize: sp(16), marginTop: vs(2) },
  circleLabelBox: { position: 'absolute', alignItems: 'center' },

  stats: { marginTop: vs(8), justifyContent: 'center' },
  stat:  { fontSize: sp(15), fontWeight: '500', paddingVertical: vs(8) },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: scale(10) },

  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: vs(12), marginHorizontal: scale(4) },

  emptyText: { textAlign: 'center', color: '#9ca3af', fontSize: sp(14), marginTop: vs(24) },

  // ── task card ──
  card: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(12),
    marginBottom: vs(12),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  topRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(5) },

  statusBadge: {
    width: scale(80),
    height: vs(24),
    borderBottomRightRadius: scale(16),
    borderTopLeftRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    left: -scale(12),
    top: -vs(12),
  },

  statusText: {
    fontSize: sp(12),
    color: '#fff',
    fontWeight: '500',
  },

  tagBadge: {
    backgroundColor: '#2563EB',
    width: scale(100),
    height: vs(24),
    borderBottomLeftRadius: scale(16),
    borderTopRightRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    right: -scale(12),
    top: -vs(12),
  },

  tagText: {
    color: '#fff',
    fontSize: sp(12),
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },

  ribbonOngoing:   { backgroundColor: '#F59E0B' },
  ribbonCompleted: { backgroundColor: '#16A34A' },
  ribbonInactive:  { backgroundColor: '#9CA3AF' },
  ribbonOnHold:    { backgroundColor: '#000' },
  ribbonRejected:  { backgroundColor: '#DC2626' },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(6),
  },

  title:   { fontSize: sp(15), fontWeight: '600', color: '#111827', flex: 1, marginRight: scale(5) },
  taskId:  { color: '#2563EB', fontWeight: '500', fontSize: sp(15), marginRight: scale(15) },
  dateText:{ fontSize: sp(12), color: '#4f5258', flexShrink: 0 },

  contentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: vs(4) },
  leftCol:    { flex: 1, marginRight: scale(12) },
  rightCol:   { alignItems: 'flex-end' },

  address:     { marginBottom: vs(6), fontSize: sp(13), color: '#898e98', width: '70%' },
  customer:    { marginRight: scale(6), fontSize: sp(13), color: '#171a1e' },
  customerRow: { flexDirection: 'row', alignItems: 'center', marginTop: vs(4) },

  itemEntry: {
    alignItems: 'flex-end',
    width: scale(100),
  },

  itemName: {
    fontSize: sp(13),
    fontWeight: '600',
    color: COLORS.primary,
  },

  itemPrice: {
    fontSize: sp(13),
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'right',
    marginTop: vs(22),
  },
});