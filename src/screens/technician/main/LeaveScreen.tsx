// src/screens/technician/main/LeaveScreen.tsx
import {
  View, Text, StyleSheet, FlatList, Pressable, Modal, Image, ScrollView,
  Platform, StatusBar, TextInput, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp, ms, HEADER_TOP_PADDING } from '../../../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { TechnicianStackParamList } from '../../../navigation/TechStack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getLeaveTypesList, leaveBalSummary, getAllEmployeeLeaveList, postLeaveDetails, deleteLeave } from '../../../api/leaveManagement/leaveManagementService';
import type {
  GetLeaveTypesDTOResultData as LeaveType,
  LeavaBalanceSummaryDTOResultData as LeaveBalanceSummary,
  GetAllLeavesListDTOLeaveDetails as LeaveDetails,
} from '../../../api/leaveManagement/leaveManagement.types';

// ── Screen-local UI helpers (not Java DTOs — kept inline) ──────────────────
const LeaveStatusId = { PENDING: 1, APPROVED: 2, DECLINED: 3 } as const;
const LEAVE_STATUS_OPTIONS = ['Status', 'Approved', 'Declined', 'Pending'] as const;
type LeaveStatusOption = (typeof LEAVE_STATUS_OPTIONS)[number];
const SINGLE_DATE_LEAVE_TYPES: number[] = [1]; // Half Day

interface LeaveFormState {
  leaveTypeId: number | null;
  leaveTypeName: string;
  leaveDate: string;
  fromDate: string;
  toDate: string;
  reason: string;
}
const EMPTY_LEAVE_FORM: LeaveFormState = {
  leaveTypeId: null,
  leaveTypeName: '',
  leaveDate: '',
  fromDate: '',
  toDate: '',
  reason: '',
};

type NavigationProp = NativeStackNavigationProp<TechnicianStackParamList, 'Leave'>;

const PAGE_SIZE = 50;

const LEAVE_TYPE_COLORS: Record<number, string> = {
  1: '#1A1A1A', // Half Day - black
  2: '#22c55e', // Full Day - green
  4: '#2563eb', // Casual Leave - blue
  5: '#f59e0b', // Sick Leave - orange
};

const statusBg: Record<string, string> = {
  Approved: '#22c55e',
  Rejected: '#f87171',
  Declined: '#f87171',
  Pending: '#f59e0b',
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const monthLabel = (year: number, month0: number) =>
  new Date(year, month0, 1).toLocaleString('default', { month: 'short', year: 'numeric' });

const splitDate = (iso?: string) => (iso ? iso.split('T')[0] : '');

const formatDisplayDate = (iso?: string) => {
  if (!iso) return '';
  const d = splitDate(iso);
  const parts = d.split('-');
  if (parts.length !== 3) return '';
  const [y, m, day] = parts;
  return `${day}/${m}/${y}`;
};

const formatRequestedAt = (iso?: string) => {
  if (!iso) return '';
  const [d, t] = iso.split('T');
  const parts = d.split('-');
  if (parts.length !== 3) return '';
  const [y, m, day] = parts;
  const time = t ? t.split('.')[0] : '';
  return `${day}-${m}-${y}  ${time}`;
};

export default function LeaveScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : insets.top;

  const [userId, setUserId] = useState<number | null>(null);

  // ── List state ──
  const [leaves, setLeaves] = useState<LeaveDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);

  // ── Filters ──
  const today = new Date();
  const [filterYear, setFilterYear] = useState(today.getFullYear());
  const [filterMonth, setFilterMonth] = useState(today.getMonth()); // 0-indexed
  const [statusFilter, setStatusFilter] = useState<LeaveStatusOption>('Status');
  const [activeDropdown, setActiveDropdown] = useState<'status' | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const monthYearParam = `${filterYear}-${pad2(filterMonth + 1)}`;
  const statusIdParam = useMemo(() => {
    if (statusFilter === 'Approved') return LeaveStatusId.APPROVED;
    if (statusFilter === 'Declined') return LeaveStatusId.DECLINED;
    if (statusFilter === 'Pending') return LeaveStatusId.PENDING;
    return 0;
  }, [statusFilter]);

  // ── Reference data ──
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceSummary[]>([]);

  // ── Request / Update sheet ──
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMode, setSheetMode] = useState<'request' | 'update'>('request');
  const [form, setForm] = useState<LeaveFormState>(EMPTY_LEAVE_FORM);
  const [activeLeave, setActiveLeave] = useState<LeaveDetails | null>(null);
  const [showLeaveTypeDropdown, setShowLeaveTypeDropdown] = useState(false);
  const [activeDateField, setActiveDateField] = useState<'leaveDate' | 'fromDate' | 'toDate' | null>(null);
  const [errorLabel, setErrorLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSingleDateType = form.leaveTypeId != null && SINGLE_DATE_LEAVE_TYPES.includes(form.leaveTypeId);

  // ── Bootstrap ──
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const uid = await AsyncStorage.getItem('uid');
        if (uid) setUserId(Number(uid));
      })();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      loadLeaveTypes();
      loadBalanceSummary();
      resetAndLoad();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, monthYearParam, statusIdParam])
  );

  const loadLeaveTypes = async () => {
    if (!userId) return;
    try {
      const list = await getLeaveTypesList({ userid: userId });
      setLeaveTypes(Array.isArray(list.ResultData) ? list.ResultData : []);
    } catch {
      setLeaveTypes([]);
    }
  };

  const loadBalanceSummary = async () => {
    if (!userId) return;
    try {
      const list = await leaveBalSummary({ UserId: userId });
      setLeaveBalance(Array.isArray(list.ResultData) ? list.ResultData : []);
    } catch {
      setLeaveBalance([]);
    }
  };

  const resetAndLoad = () => {
    setLeaves([]);
    setIsLastPage(false);
    setPage(1);
    fetchLeaves(1, true);
  };

  const fetchLeaves = async (pageNumber: number, isFirstLoad: boolean) => {
    if (!userId) return;
    isFirstLoad ? setLoading(true) : setLoadingMore(true);
    try {
      const res = await getAllEmployeeLeaveList({
        UserId: userId,
        PageNumber: pageNumber,
        PageSize: PAGE_SIZE,
        LeaveStatusId: statusIdParam,
        IsPersonal: true,
        IsExportData: false,
        MonthYear: monthYearParam,
        SearchParams: '',
        ZoneId: 0,
      });

      const data = res.ResultData?.LeaveDetails ?? [];
      setLeaves(prev => (isFirstLoad ? data : [...prev, ...data]));
      setIsLastPage(data.length < PAGE_SIZE);
      setPage(pageNumber);
    } catch {
      if (isFirstLoad) setLeaves([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setIsLastPage(false);
    fetchLeaves(1, true);
  };

  const onEndReached = () => {
    if (loading || loadingMore || isLastPage) return;
    fetchLeaves(page + 1, false);
  };

  // ── Sheet helpers ──
  const openRequestSheet = () => {
    setSheetMode('request');
    setActiveLeave(null);
    setForm(EMPTY_LEAVE_FORM);
    setErrorLabel('');
    setSheetVisible(true);
  };

  const openUpdateSheet = (leave: LeaveDetails) => {
    if (leave.LeaveStatusId === LeaveStatusId.APPROVED || leave.LeaveStatusId === LeaveStatusId.DECLINED) {
      Alert.alert('Not allowed', "You can't edit an Approved or Declined leave.");
      return;
    }
    setSheetMode('update');
    setActiveLeave(leave);
    const leaveTypeId = leave.LeaveTypeId ?? null;
    setForm({
      leaveTypeId,
      leaveTypeName: leave.LeaveType ?? '',
      leaveDate: leaveTypeId !== null && SINGLE_DATE_LEAVE_TYPES.includes(leaveTypeId) ? splitDate(leave.LeaveStartDate) : '',
      fromDate: leaveTypeId === null || !SINGLE_DATE_LEAVE_TYPES.includes(leaveTypeId) ? splitDate(leave.LeaveStartDate) : '',
      toDate: leaveTypeId === null || !SINGLE_DATE_LEAVE_TYPES.includes(leaveTypeId) ? splitDate(leave.LeaveEndDate) : '',
      reason: leave.ReasonOfLeave ?? '',
    });
    setErrorLabel('');
    setSheetVisible(true);
  };

  const closeSheet = () => {
    setSheetVisible(false);
    setShowLeaveTypeDropdown(false);
    setActiveDateField(null);
  };

  const balanceFor = (typeId: number) => leaveBalance.find(b => b.LeaveTypeId === typeId);
  const totalAvailable = leaveBalance.reduce((sum, b) => sum + (b.RemainingLeaves ?? 0), 0);

  const handleSelectLeaveType = (lt: LeaveType) => {
    setForm(prev => ({ ...prev, leaveTypeId: lt.Id ?? null, leaveTypeName: lt.Name ?? '' }));
    setShowLeaveTypeDropdown(false);
    setErrorLabel('');
  };

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    const field = activeDateField;
    setActiveDateField(null);
    if (event.type === 'dismissed' || !date || !field) return;

    const iso = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    setForm(prev => {
      const next = { ...prev, [field]: iso };
      if (field === 'toDate' && next.fromDate && next.leaveTypeId) {
        const bal = balanceFor(next.leaveTypeId);
        const days = Math.round(
          (new Date(next.toDate).getTime() - new Date(next.fromDate).getTime()) / 86400000
        );
        if (bal && days > (bal.RemainingLeaves ?? 0)) {
          setErrorLabel(
            `Insufficient Remaining Leaves for ${next.leaveTypeName}.\nRequested : ${days} Available : ${bal.RemainingLeaves ?? 0}`
          );
        } else {
          setErrorLabel('');
        }
      }
      return next;
    });
  };

  const validateForm = (): string | null => {
    if (!form.leaveTypeId) return 'Please select leave type';
    if (isSingleDateType) {
      if (!form.leaveDate) return 'Please select leave date';
    } else {
      if (!form.fromDate) return 'Please select from date';
      if (!form.toDate) return 'Please select to date';
    }
    if (!form.reason.trim()) return 'Please enter leave reason';
    return null;
  };

  const handleSubmit = async () => {
    if (!userId) return;
    const err = validateForm();
    if (err) {
      setErrorLabel(err);
      return;
    }

    const startDate = isSingleDateType ? `${form.leaveDate}T00:00:00` : `${form.fromDate}T00:00:00`;
    const endDate = isSingleDateType ? `${form.leaveDate}T00:00:00` : `${form.toDate}T00:00:00`;

    setSubmitting(true);
    try {
      const res = await postLeaveDetails({
        UserId: userId,
        LeaveTypeId: form.leaveTypeId!,
        StartDate: startDate,
        EndDate: endDate,
        Reason: form.reason.trim(),
        ...(sheetMode === 'update' && activeLeave ? { LeaveId: activeLeave.LeaveID } : {}),
      });

      if (res.Code === '200') {
        closeSheet();
        resetAndLoad();
        loadBalanceSummary();
      } else {
        setErrorLabel(res.Message || 'Something went wrong. Please try again.');
      }
    } catch (e: any) {
      setErrorLabel(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!userId || !activeLeave) return;
    Alert.alert('Delete Leave', 'Are you sure you want to delete this leave request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSubmitting(true);
          try {
            const res = await deleteLeave({ UserId: userId, LeaveId: activeLeave.LeaveID });
            if (res.Code === '200') {
              closeSheet();
              resetAndLoad();
              loadBalanceSummary();
            } else {
              Alert.alert('Failed', res.Message || 'Could not delete leave.');
            }
          } catch (e: any) {
            Alert.alert('Failed', e?.message || 'Could not delete leave.');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  // ── Render ──
  const renderItem = ({ item }: { item: LeaveDetails }) => {
    const statusName = (item.LeaveStatusId === LeaveStatusId.DECLINED ? 'Declined' : item.LeaveStatusName) ?? '';
    const typeColor = LEAVE_TYPE_COLORS[item.LeaveTypeId ?? -1] ?? COLORS.textPrimary;

    return (
      <Pressable style={styles.card} onPress={() => openUpdateSheet(item)}>
        <View style={styles.cardTopRow}>
          <Text style={[styles.leaveType, { color: typeColor }]}>{item.LeaveType}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusBg[statusName] ?? '#9ca3af' }]}>
            <Text style={styles.statusPillText}>{statusName}</Text>
          </View>
        </View>

        <Text style={styles.leaveDateRange}>
          {formatDisplayDate(item.LeaveStartDate)} - {formatDisplayDate(item.LeaveEndDate)}
        </Text>

        {!!item.ReasonOfLeave && (
          <Text style={styles.leaveNotes} numberOfLines={2}>{item.ReasonOfLeave}</Text>
        )}

        <Text style={styles.requestedAt}>Requested on {formatRequestedAt(item.LeaveCreatedDate)}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vs(40) }}>
        {/* Tabs */}
        <View style={styles.tabRow}>
          <Pressable style={styles.inactiveTab} onPress={() => navigation.navigate('TechnicianTabsRoot', { screen: 'Attendance' })}>
            <Text style={styles.inactiveTabText}>ATTENDANCE</Text>
          </Pressable>
          <Pressable style={styles.activeTab}>
            <Text style={styles.activeTabText}>LEAVES</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* Filter row */}
          <View style={styles.filterRow}>
            <Pressable style={styles.filterItem} onPress={() => setShowMonthPicker(true)}>
              <Text style={styles.filterText}>{monthLabel(filterYear, filterMonth)}</Text>
              <Ionicons name="chevron-down" size={scale(16)} color={COLORS.primary} />
            </Pressable>

            <Pressable style={styles.filterItem} onPress={() => setActiveDropdown('status')}>
              <Text style={styles.filterText}>{statusFilter}</Text>
              <Ionicons name="chevron-down" size={scale(16)} color={COLORS.primary} />
            </Pressable>

            <Pressable style={styles.leaveBtn} onPress={openRequestSheet}>
              <Text style={styles.leaveText}>+ Leave</Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: vs(60) }} />
          ) : leaves.length === 0 ? (
            <View style={styles.emptyState}>
              <Image
                style={styles.emptyImage}
                resizeMode="contain"
                source={require('../../../../assets/images/noresultfound.png')}
              />
            </View>
          ) : (
            <FlatList
              data={leaves}
              keyExtractor={(item, idx) => `${item.LeaveID}-${idx}`}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: vs(24) }}
              onEndReachedThreshold={0.4}
              onEndReached={onEndReached}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
              }
              ListFooterComponent={loadingMore ? <ActivityIndicator color={COLORS.primary} style={{ marginVertical: vs(12) }} /> : null}
            />
          )}
        </View>

        {/* Month picker */}
        {showMonthPicker && (
          <DateTimePicker
            value={new Date(filterYear, filterMonth, 1)}
            mode="date"
            display={Platform.OS === 'android' ? 'calendar' : 'inline'}
            onChange={(event, date) => {
              setShowMonthPicker(false);
              if (event.type === 'dismissed' || !date) return;
              setFilterYear(date.getFullYear());
              setFilterMonth(date.getMonth());
            }}
          />
        )}

        {/* Status dropdown */}
        <Modal
          visible={activeDropdown !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveDropdown(null)}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setActiveDropdown(null)} />
          <View style={styles.dropdown}>
            {LEAVE_STATUS_OPTIONS.map(item => (
              <Pressable
                key={item}
                style={({ pressed }) => [styles.dropdownItem, pressed && { backgroundColor: '#f5f5f5' }]}
                onPress={() => { setStatusFilter(item); setActiveDropdown(null); }}
              >
                <Text style={[styles.dropdownText, item === statusFilter && { color: COLORS.primary, fontWeight: '600' }]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </Modal>

        {/* Request / Update Leave bottom sheet */}
        <Modal visible={sheetVisible} transparent animationType="slide" onRequestClose={closeSheet}>
          <Pressable style={styles.sheetBackdrop} onPress={closeSheet} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>{sheetMode === 'request' ? 'Request Leave' : 'Update Leave'}</Text>
              <Pressable onPress={closeSheet}>
                <Ionicons name="close" size={scale(22)} color={COLORS.textPrimary} />
              </Pressable>
            </View>

            {sheetMode === 'request' && (
              <View style={styles.balanceRow}>
                {([
                  ['Half Day', 1], ['Full Day', 2], ['Casual', 4], ['Sick', 5],
                ] as [string, number][]).map(([label, id]) => {
                  const bal = balanceFor(id);
                  return (
                    <View key={id} style={styles.balanceCard}>
                      <Text style={styles.balanceLabel}>{label}</Text>
                      <Text style={styles.balanceValue}>
                        {bal ? `${bal.LeavesTaken}/${bal.TotalLeaves}` : '0/0'}
                      </Text>
                    </View>
                  );
                })}
                <View style={styles.balanceCard}>
                  <Text style={styles.balanceLabel}>Available</Text>
                  <Text style={[styles.balanceValue, { color: COLORS.primary }]}>{totalAvailable}</Text>
                </View>
              </View>
            )}

            {/* Leave Type */}
            <Text style={styles.fieldLabel}>Leave Type</Text>
            <Pressable style={styles.inputBox} onPress={() => setShowLeaveTypeDropdown(prev => !prev)}>
              <Text style={{ fontSize: sp(15), color: form.leaveTypeName ? '#333' : '#aaa' }}>
                {form.leaveTypeName || 'Select leave type'}
              </Text>
              <Ionicons name="chevron-down" size={scale(18)} color="#333" />
            </Pressable>

            {showLeaveTypeDropdown && (
              <View style={styles.inlineDropdown}>
                {leaveTypes.map(lt => (
                  <Pressable
                    key={lt.Id}
                    style={({ pressed }) => [styles.dropdownItem, pressed && { backgroundColor: '#f5f5f5' }]}
                    onPress={() => handleSelectLeaveType(lt)}
                  >
                    <Text style={{ fontSize: sp(15) }}>{lt.Name}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Dates */}
            {isSingleDateType ? (
              <>
                <Text style={styles.fieldLabel}>Leave Date</Text>
                <Pressable style={styles.inputBox} onPress={() => setActiveDateField('leaveDate')}>
                  <Text style={{ fontSize: sp(15), color: form.leaveDate ? '#333' : '#aaa' }}>
                    {form.leaveDate || 'Select date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={scale(18)} color="#333" />
                </Pressable>
              </>
            ) : (
              <View style={styles.rangeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>From Date</Text>
                  <Pressable style={styles.inputBox} onPress={() => setActiveDateField('fromDate')}>
                    <Text style={{ fontSize: sp(15), color: form.fromDate ? '#333' : '#aaa' }}>
                      {form.fromDate || 'Select'}
                    </Text>
                  </Pressable>
                </View>
                <View style={{ width: scale(12) }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>To Date</Text>
                  <Pressable
                    style={styles.inputBox}
                    onPress={() => { if (form.fromDate) setActiveDateField('toDate'); }}
                  >
                    <Text style={{ fontSize: sp(15), color: form.toDate ? '#333' : '#aaa' }}>
                      {form.toDate || 'Select'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {activeDateField && (
              <DateTimePicker
                value={
                  form[activeDateField]
                    ? new Date(form[activeDateField] as string)
                    : new Date()
                }
                mode="date"
                display={Platform.OS === 'android' ? 'calendar' : 'inline'}
                minimumDate={new Date(Date.now() - 7 * 86400000)}
                onChange={onDateChange}
              />
            )}

            {!!errorLabel && <Text style={styles.errorLabel}>{errorLabel}</Text>}

            {/* Reason */}
            <Text style={styles.fieldLabel}>Reason</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter reason for leave"
              placeholderTextColor="#aaa"
              multiline
              value={form.reason}
              onChangeText={(v) => setForm(prev => ({ ...prev, reason: v }))}
            />

            {/* Actions */}
            <View style={styles.sheetActions}>
              {sheetMode === 'update' && (
                <Pressable style={styles.deleteBtn} onPress={handleDelete} disabled={submitting}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>{sheetMode === 'request' ? 'Apply' : 'Update'}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.white },
  content: { flex: 1, padding: scale(16), marginTop: vs(8) },

  tabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    marginBottom: vs(4),
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

  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(16),
    flexWrap: 'wrap',
    gap: scale(8),
  },
  filterItem: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
  filterText: { fontSize: sp(14), color: COLORS.textPrimary },

  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    height: vs(36),
    borderRadius: scale(12),
    backgroundColor: '#000',
  },
  leaveText: { fontSize: sp(14), color: COLORS.white, fontWeight: '500' },

  emptyState: { alignItems: 'center', marginTop: vs(180) },
  emptyImage: { width: scale(180), height: scale(180) },

  // List card
  card: {
    backgroundColor: '#fff',
    borderRadius: scale(12),
    padding: scale(14),
    marginBottom: vs(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leaveType: { fontSize: sp(15), fontWeight: '700' },
  statusPill: { paddingHorizontal: scale(10), paddingVertical: vs(3), borderRadius: scale(10) },
  statusPillText: { color: '#fff', fontSize: sp(11), fontWeight: '600' },
  leaveDateRange: { marginTop: vs(6), fontSize: sp(13), color: COLORS.textPrimary, fontWeight: '500' },
  leaveNotes: { marginTop: vs(4), fontSize: sp(13), color: COLORS.textMuted },
  requestedAt: { marginTop: vs(8), fontSize: sp(11), color: COLORS.textTertiary },

  // Dropdown — centred, positioned below filter row
  dropdown: {
    position: 'absolute',
    top: '28%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    width: scale(220),
    left: scale(16),
    elevation: 8,
    borderRadius: scale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: vs(13),
    paddingHorizontal: scale(16),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  dropdownText: { fontSize: sp(14), color: COLORS.textQuaternary, fontWeight: '500' },

  // Bottom sheet
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    padding: scale(20),
    maxHeight: '90%',
  },
  sheetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(12) },
  sheetTitle: { fontSize: sp(17), fontWeight: '700', color: COLORS.textPrimary },

  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(16), gap: scale(6) },
  balanceCard: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    borderRadius: scale(10),
    paddingVertical: vs(8),
    alignItems: 'center',
  },
  balanceLabel: { fontSize: sp(10), color: COLORS.textMuted },
  balanceValue: { fontSize: sp(14), fontWeight: '700', color: COLORS.textPrimary, marginTop: vs(2) },

  fieldLabel: { fontSize: sp(13), color: COLORS.textMuted, marginTop: vs(10), marginBottom: vs(6) },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ms(46),
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: scale(10),
    paddingHorizontal: scale(14),
  },
  inlineDropdown: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: scale(10),
    marginTop: vs(4),
    maxHeight: vs(160),
    overflow: 'hidden',
  },
  rangeRow: { flexDirection: 'row' },

  errorLabel: { color: '#d32f2f', fontSize: sp(12), marginTop: vs(8) },

  reasonInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: scale(10),
    paddingHorizontal: scale(14),
    paddingVertical: vs(10),
    minHeight: ms(70),
    fontSize: sp(14),
    color: '#333',
    textAlignVertical: 'top',
  },

  sheetActions: { flexDirection: 'row', gap: scale(10), marginTop: vs(18) },
  deleteBtn: {
    flex: 1,
    height: ms(46),
    borderRadius: scale(23),
    borderWidth: 1,
    borderColor: '#d32f2f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { color: '#d32f2f', fontWeight: '600', fontSize: sp(14) },
  submitBtn: {
    flex: 2,
    height: ms(46),
    borderRadius: scale(23),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: { color: COLORS.white, fontWeight: '600', fontSize: sp(14) },
});