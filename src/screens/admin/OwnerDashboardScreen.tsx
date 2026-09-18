// src/screens/admin/OwnerDashboardScreen.tsx

import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {getDashboardData} from '../../api/dashboard/dashboardService';
import {getPassbookForDashboard} from '../../api/passbook/passbookService';
import {getAmcDashboardCountDetails} from '../../api/amc/amcService';

export type DayFilter = 'Today' | 'Week' | 'Month' | 'Year';

const RING_SIZE = 170;
const RING_THICKNESS = 16;
const RING_SEGMENTS = 60;
const RING_RADIUS = RING_SIZE / 2 - RING_THICKNESS / 2;
const RING_SEGMENT_ANGLE = 360 / RING_SEGMENTS;
const RING_SEGMENT_LENGTH = (2 * Math.PI * RING_RADIUS) / RING_SEGMENTS + 1;

const FILTER_INPUT_VALUE: Record<DayFilter, string> = {
  Today: 'today',
  Week: 'week',
  Month: 'month',
  Year: 'year',
};

const getResultData = <T,>(value: unknown): T | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const source = value as Record<string, unknown>;
  const resultData = source.resultData ?? source.ResultData;
  return (resultData as T | undefined) ?? null;
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

type OwnerDashboardScreenProps = {
  ownerId: number;
  filter: DayFilter;
  onCreateTask?: () => void;
};

const OwnerDashboardScreen = ({ownerId, filter, onCreateTask}: OwnerDashboardScreenProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [taskStats, setTaskStats] = useState({
    complete: 0,
    urgent: 0,
    inactive: 0,
    reject: 0,
    onHold: 0,
  });
  const [attendance, setAttendance] = useState({
    present: 0,
    absent: 0,
    idle: 0,
    onLeave: 0,
  });
  const [amcStatus, setAmcStatus] = useState({
    upcoming: 0,
    renewal: 0,
    expired: 0,
  });
  const [earningAmount, setEarningAmount] = useState(0);
  const [avgResolutionTime, setAvgResolutionTime] = useState('00.00 Hrs.');
  const [avgRating, setAvgRating] = useState(0);

  const totalTasks = useMemo(() => {
    return (
      taskStats.complete +
      taskStats.urgent +
      taskStats.inactive +
      taskStats.reject +
      taskStats.onHold
    );
  }, [taskStats.complete, taskStats.inactive, taskStats.onHold, taskStats.reject, taskStats.urgent]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const [dashboardResponse, earningResponse, amcResponse] = await Promise.all([
          getDashboardData({
            UserId: ownerId,
            Duration: filter.toLowerCase(),
            pageIndex: 1,
          }),
          getPassbookForDashboard({
            UserId: ownerId,
            InputFilter: filter.toLowerCase(),
          }),
          getAmcDashboardCountDetails({
            OwnerId: ownerId,
            InputFilter: FILTER_INPUT_VALUE[filter],
            AMCTypeId: 0,
          }),
        ]);

        if (!isMounted) {
          return;
        }

        const dashboardData = getResultData<Record<string, unknown>>(dashboardResponse);
        const earningData = getResultData<Record<string, unknown>>(earningResponse);
        const amcData = getResultData<Record<string, unknown>>(amcResponse);

        const tasksCountList =
          ((dashboardData?.tasksCount ?? dashboardData?.TasksCount) as
            | Array<Record<string, unknown>>
            | undefined) ?? [];

        let completeCount = 0;
        let urgentCount = 0;
        let inactiveCount = 0;
        let rejectCount = 0;
        let onHoldCount = 0;
        let matchedCompleted = false;
        let resolutionTime = '00.00 Hrs.';
        let customerRating = '0.00';

        tasksCountList.forEach(item => {
          const name = String(item.name ?? item.Name ?? '').toLowerCase();
          const taskStatusId = toNumber(item.taskStatusId ?? item.TaskStatusId, -1);
          const count = toNumber(item.taskcount ?? item.Taskcount ?? item.taskCount);

          if (name === 'completed') {
            completeCount = count;
          } else if (name === 'rejected') {
            rejectCount = count;
          } else if (name === 'ongoing') {
            urgentCount = count;
          } else if (name === 'inactive') {
            inactiveCount = count;
          } else if (name === 'onhold') {
            onHoldCount = count;
          }

          if (taskStatusId === 1 || name === 'completed') {
            resolutionTime = String(
              item.avgResolutionTime ?? item.AvgResolutionTime ?? resolutionTime,
            );
            customerRating = String(
              item.avgCustomerRating ?? item.AvgCustomerRating ?? customerRating,
            );
            matchedCompleted = true;
          }
        });

        setTaskStats({
          complete: completeCount,
          urgent: urgentCount,
          inactive: inactiveCount,
          reject: rejectCount,
          onHold: onHoldCount,
        });

        if (matchedCompleted) {
          setAvgResolutionTime(resolutionTime);
          setAvgRating(toNumber(customerRating));
        } else {
          setAvgResolutionTime('00.00 Hrs.');
          setAvgRating(0);
        }

        const attendanceData =
          (dashboardData?.attendance as Record<string, unknown> | undefined) ??
          (dashboardData?.Attendance as Record<string, unknown> | undefined);
        if (attendanceData) {
          setAttendance({
            present: toNumber(attendanceData.presentCount ?? attendanceData.PresentCount),
            absent: toNumber(attendanceData.absentCount ?? attendanceData.AbsentCount),
            idle: toNumber(attendanceData.idleCount ?? attendanceData.IdleCount),
            onLeave: toNumber(attendanceData.leaveCount ?? attendanceData.LeaveCount),
          });
        }

        setEarningAmount(
          toNumber(earningData?.earningAmount ?? earningData?.EarningAmount),
        );

        // AMCDashboardCountResultData uses PascalCase (TotalUpcomming is the
        // actual, misspelled field name on the backend), so the camelCase
        // keys here never matched and AMC Status always rendered as 0s.
        // Java's callAMCStatusCountApi() only updates the AMC views when
        // the backend reports a real success — on any other Code (e.g. the
        // 500/NullReferenceException the backend currently throws for the
        // "year" InputFilter) it leaves whatever was already on screen
        // untouched rather than zeroing it out. Match that here.
        const amcResponseRecord = amcResponse as Record<string, unknown> | null;
        const amcCode = String(amcResponseRecord?.Code ?? '').toLowerCase();
        const amcMessage = String(amcResponseRecord?.Message ?? '').toLowerCase();
        if (amcCode === '200' && amcMessage === 'success request') {
          setAmcStatus({
            upcoming: toNumber(amcData?.TotalUpcomming ?? amcData?.totalUpcomming ?? amcData?.totalUpcoming),
            renewal: toNumber(amcData?.TotalRenewal ?? amcData?.totalRenewal),
            expired: toNumber(amcData?.TotalExpired ?? amcData?.totalExpired),
          });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to load dashboard data';
        Alert.alert('Dashboard API error', message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [ownerId, filter]);

  const taskChartItems = useMemo(
    () => [
      // Colors match Java's R.color values used in the FitChart:
      // Completed -> green (#03DE73), Ongoing -> orange (#FF9B00),
      // InActive -> light_gray (#9A9FAA), Rejected -> colorPrimaryDark
      // (#C3002F), OnHold -> onhold (#353935).
      {key: 'complete', label: 'Completed', value: taskStats.complete, color: '#03DE73'},
      {key: 'urgent', label: 'Ongoing', value: taskStats.urgent, color: '#FF9B00'},
      {key: 'inactive', label: 'Inactive', value: taskStats.inactive, color: '#9A9FAA'},
      {key: 'reject', label: 'Rejected', value: taskStats.reject, color: '#c3002f'},
      {key: 'onHold', label: 'OnHold', value: taskStats.onHold, color: '#353935'},
    ],
    [taskStats.complete, taskStats.inactive, taskStats.onHold, taskStats.reject, taskStats.urgent],
  );

  const ringSegments = useMemo(() => {
    if (totalTasks === 0) {
      return Array.from({length: RING_SEGMENTS}, () => '#E5E7EB');
    }
    const boundaries: {upTo: number; color: string}[] = [];
    let cumulative = 0;
    taskChartItems.forEach(item => {
      if (item.value <= 0) {
        return;
      }
      cumulative += item.value;
      boundaries.push({
        upTo: (cumulative / totalTasks) * RING_SEGMENTS,
        color: item.color,
      });
    });
    return Array.from({length: RING_SEGMENTS}, (_, index) => {
      const mid = index + 0.5;
      const match = boundaries.find(boundary => mid <= boundary.upTo);
      return match ? match.color : boundaries[boundaries.length - 1]?.color ?? '#E5E7EB';
    });
  }, [taskChartItems, totalTasks]);

  const ratingStars = useMemo(
    () => Array.from({length: 5}, (_, index) => index < Math.round(avgRating)),
    [avgRating],
  );

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.showingDataRow}>
            <Text style={styles.muted}>Showing Data for :</Text>
            <Text style={styles.valueStrong}> {filter}</Text>
          </View>
          <Pressable style={styles.ctaButton} onPress={onCreateTask}>
            <Text style={styles.ctaButtonText}>Create Task</Text>
          </Pressable>
        </View>

        <View style={styles.taskChartRow}>
          <View style={styles.taskChartLeft}>
            <View style={styles.taskChartRing}>
              {ringSegments.map((color, index) => (
                <View
                  key={index}
                  style={[
                    styles.taskChartRingSegment,
                    {
                      backgroundColor: color,
                      transform: [
                        {rotate: `${index * RING_SEGMENT_ANGLE}deg`},
                        {translateY: -RING_RADIUS},
                      ],
                    },
                  ]}
                />
              ))}
              <Text style={styles.taskChartTotal}>{totalTasks}</Text>
              <Text style={styles.taskChartTotalLabel}>Total Task</Text>
            </View>
          </View>
          <View style={styles.taskChartLegend}>
            {taskChartItems.map(item => (
              <View key={item.key} style={styles.taskLegendItem}>
                <Text style={[styles.taskLegendValue, {color: item.color}]}>
                  {String(item.value).padStart(2, '0')}
                </Text>
                <Text style={[styles.taskLegendLabel, {color: item.color}]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBlock}>
            <View style={styles.metricLabelRow}>
              <Text style={styles.metricLabel}>Earnings</Text>
              <Text style={styles.infoIcon}>ⓘ</Text>
            </View>
            <Text style={styles.metricValueGreen}>Rs. {earningAmount.toFixed(0)}</Text>
          </View>
          <View style={styles.metricBlock}>
            <View style={[styles.metricLabelRow, styles.metricLabelRowCenter]}>
              <Text style={styles.metricLabelCenter}>AMC Status</Text>
              <Text style={styles.infoIcon}>ⓘ</Text>
            </View>
            <View style={styles.metricInline}>
              <Text style={styles.metricValueOrange}>{amcStatus.upcoming}</Text>
              <Text style={styles.metricHintOrange}> Upcoming</Text>
            </View>
            <View style={styles.metricInline}>
              <Text style={styles.metricValueBlue}>{amcStatus.renewal}</Text>
              <Text style={styles.metricHintBlue}> Renewal</Text>
            </View>
            <View style={styles.metricInline}>
              <Text style={styles.metricValuePrimary}>{amcStatus.expired}</Text>
              <Text style={styles.metricHintPrimary}> Expired</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryTitle}>Avg. Task Resolution Time</Text>
            <Text style={styles.summaryValue}>{avgResolutionTime}</Text>
          </View>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryTitle}>Avg. Customer Rating</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingValue}>{avgRating.toFixed(1)}</Text>
              <View style={styles.starsRow}>
                {ratingStars.map((filled, index) => (
                  <Text
                    key={index}
                    style={filled ? styles.starFilled : styles.starEmpty}
                  >
                    ★
                  </Text>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Today's Attendance</Text>
          <Text style={styles.infoIcon}>ⓘ</Text>
        </View>
        <View style={styles.attendanceRow}>
          <View style={[styles.attendanceBox, styles.presentBg]}>
            <Text style={styles.attendanceCount}>{attendance.present}</Text>
            <Text style={styles.attendanceLabel}>Present</Text>
          </View>
          <View style={[styles.attendanceBox, styles.absentBg]}>
            <Text style={styles.attendanceCount}>{attendance.absent}</Text>
            <Text style={styles.attendanceLabel}>Absent</Text>
          </View>
          <View style={[styles.attendanceBox, styles.idleBg]}>
            <Text style={styles.attendanceCount}>{attendance.idle}</Text>
            <Text style={styles.attendanceLabel}>Idle</Text>
          </View>
          <View style={[styles.attendanceBox, styles.leaveBg]}>
            <Text style={styles.attendanceCount}>{attendance.onLeave}</Text>
            <Text style={styles.attendanceLabel}>On Leave</Text>
          </View>
        </View>
      </View>
      {isLoading ? (
        <View style={styles.loaderRow}>
          <ActivityIndicator color="#c3002f" />
          <Text style={styles.loaderText}>Refreshing dashboard...</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 2,
    paddingBottom: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  muted: {
    color: '#6B7280',
    fontSize: 13,
  },
  valueStrong: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 13,
  },
  showingDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaButton: {
    backgroundColor: '#c3002f',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  infoIcon: {
    color: '#9CA3AF',
    fontSize: 13,
    marginLeft: 4,
  },
  metricsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  metricBlock: {
    flex: 1,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabelRowCenter: {
    justifyContent: 'center',
  },
  metricLabel: {
    color: '#9CA3AF',
    fontWeight: '700',
  },
  metricLabelCenter: {
    color: '#9CA3AF',
    fontWeight: '700',
    textAlign: 'center',
  },
  metricValueGreen: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 22,
    marginTop: 6,
  },
  metricInline: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  metricValueOrange: {
    color: '#F59E0B',
    fontWeight: '700',
  },
  metricHintOrange: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  metricValueBlue: {
    color: '#2563EB',
    fontWeight: '700',
  },
  metricHintBlue: {
    color: '#2563EB',
    fontWeight: '600',
  },
  metricValuePrimary: {
    color: '#c3002f',
    fontWeight: '700',
  },
  metricHintPrimary: {
    color: '#c3002f',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  taskChartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  taskChartLeft: {
    flex: 0.56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskChartRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  taskChartRingSegment: {
    position: 'absolute',
    width: RING_THICKNESS,
    height: RING_SEGMENT_LENGTH,
    top: RING_SIZE / 2 - RING_SEGMENT_LENGTH / 2,
    left: RING_SIZE / 2 - RING_THICKNESS / 2,
    borderRadius: RING_THICKNESS / 2,
  },
  taskChartTotal: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 34,
  },
  taskChartTotalLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
    fontWeight: '600',
  },
  taskChartLegend: {
    flex: 0.44,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  taskLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskLegendValue: {
    minWidth: 24,
    fontSize: 15,
    fontWeight: '700',
  },
  taskLegendLabel: {
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryBlock: {
    flex: 1,
    alignItems: 'center',
  },
  summaryTitle: {
    color: '#6B7280',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '700',
  },
  summaryValue: {
    marginTop: 8,
    color: '#111827',
    fontSize: 14,
  },
  ratingRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingValue: {
    color: '#111827',
    fontSize: 14,
  },
  starsRow: {
    flexDirection: 'row',
  },
  starFilled: {
    color: '#c3002f',
    fontSize: 14,
    marginHorizontal: 1,
  },
  starEmpty: {
    color: '#F3D0D6',
    fontSize: 14,
    marginHorizontal: 1,
  },
  attendanceRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },
  attendanceBox: {
    flex: 1,
    borderRadius: 12,
    minHeight: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presentBg: {
    backgroundColor: '#16A34A',
  },
  absentBg: {
    backgroundColor: '#E2726A',
  },
  idleBg: {
    backgroundColor: '#F59E0B',
  },
  leaveBg: {
    backgroundColor: '#111827',
  },
  attendanceCount: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 20,
  },
  attendanceLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  loaderText: {
    marginLeft: 8,
    color: '#4B5563',
    fontSize: 12,
  },
});

export default OwnerDashboardScreen;