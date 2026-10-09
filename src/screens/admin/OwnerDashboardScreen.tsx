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
import Ionicons from 'react-native-vector-icons/Ionicons';
import {ms, sp} from '../../utils/responsive';
import {COLORS} from '../../theme/theme';
import {formatAmount} from '../../utils/decimal';
import {getCurrentCurrencySymbol} from '../../state/session';

export type DayFilter = 'Today' | 'Week' | 'Month' | 'Year';

const RING_SIZE = ms(170);
const RING_THICKNESS = ms(16);
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
  // Matches Java's Earnings/mEarnings.setOnClickListener — both the value
  // and the ⓘ icon navigate to Passbook (HomePassbookFragmentNew).
  onEarningsPress?: () => void;
  // Matches Java's mTextViewAMCStatus/mAMC.setOnClickListener — both
  // navigate to the AMC list (AMCListFragment).
  onAmcStatusPress?: () => void;
  // Matches Java's mAttendance/mAttend.setOnClickListener — navigates to
  // Leave management (LeaveTabHost / PersonalLeaveTabHost for Manager and
  // Zone Head roles), not a dedicated attendance screen.
  onAttendancePress?: () => void;
};

const OwnerDashboardScreen = ({
  ownerId,
  filter,
  onCreateTask,
  onEarningsPress,
  onAmcStatusPress,
  onAttendancePress,
}: OwnerDashboardScreenProps) => {
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

        // TEMP DEBUG — remove once we've confirmed what the "year" filter
        // actually returns. Compares the raw AMC response against what
        // Java's FWLogger line logs (amcDashboardCount.getMessage()) for
        // the same filter/account so we can tell a data issue apart from
        // a parsing issue.
        if (__DEV__ && filter === 'Year') {
          console.log('[AMC][Year] raw response:', JSON.stringify(amcResponse));
          console.log('[AMC][Year] resolved amcData:', amcData);
        }

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
        setAmcStatus({
          upcoming: toNumber(amcData?.TotalUpcomming ?? amcData?.totalUpcomming ?? amcData?.totalUpcoming),
          renewal: toNumber(amcData?.TotalRenewal ?? amcData?.totalRenewal),
          expired: toNumber(amcData?.TotalExpired ?? amcData?.totalExpired),
        });
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

  // Java's MaterialRatingBar: stepSize 0.5, primary tint, outline for the rest.
  const ratingStars = useMemo(
    () =>
      Array.from({length: 5}, (_, index) => {
        const diff = avgRating - index;
        if (diff >= 0.75) {
          return 'star';
        }
        return diff >= 0.25 ? 'star-half' : 'star-outline';
      }),
    [avgRating],
  );

  // Java shows ₹ for India; the API symbol comes back as 'Rs.'.
  const apiSymbol = getCurrentCurrencySymbol();
  const currency = !apiSymbol || /^(rs.?|inr)$/i.test(apiSymbol) ? '₹' : apiSymbol;

  const renderInfo = () => (
    <Ionicons name="information-circle-outline" size={ms(20)} color={COLORS.lightGray} />
  );

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Java home_gradient: red hero showing behind the top of the first card */}
      <View style={styles.hero} />
      <View style={styles.card}>
        <View style={styles.showingRow}>
          <Text style={styles.muted}>Showing Data for :</Text>
          <Text style={styles.valueStrong}> {filter}</Text>
          <View style={styles.flex1} />
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
            {taskChartItems.map((item, index) => (
              <View
                key={item.key}
                style={[styles.taskLegendItem, index > 0 ? styles.legendGap : null]}>
                <Text style={[styles.taskLegendValue, {color: item.color}]}>
                  {String(item.value).padStart(2, '0')}
                </Text>
                <Text style={[styles.taskLegendLabel, {color: item.color}]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.metricsRow}>
          <Pressable style={styles.earningsBlock} onPress={onEarningsPress}>
            <View style={styles.metricLabelRow}>
              <Text style={styles.metricLabel}>Earnings</Text>
              <View style={styles.infoGap}>{renderInfo()}</View>
            </View>
            <Text style={styles.metricValueGreen}>
              {currency} {formatAmount(earningAmount)}
            </Text>
          </Pressable>
          <Pressable style={styles.amcBlock} onPress={onAmcStatusPress}>
            <View style={styles.metricLabelRow}>
              <Text style={styles.metricLabel}>AMC Status</Text>
              <View style={styles.infoGap}>{renderInfo()}</View>
            </View>
            <View style={styles.amcRow}>
              <View style={styles.amcCell}>
                <Text style={[styles.amcValue, {color: COLORS.statusOngoing}]}>
                  {amcStatus.upcoming}
                </Text>
                <Text style={[styles.amcHint, {color: COLORS.statusOngoing}]}>Upcoming</Text>
              </View>
              <View style={styles.amcCell}>
                <Text style={[styles.amcValue, {color: COLORS.blue500}]}>{amcStatus.renewal}</Text>
                <Text style={[styles.amcHint, {color: COLORS.blue500}]}>Renewal</Text>
              </View>
            </View>
            <View style={styles.amcRow}>
              <View style={styles.amcCell}>
                <Text style={[styles.amcValue, {color: COLORS.statusRejected}]}>
                  {amcStatus.expired}
                </Text>
                <Text style={[styles.amcHint, {color: COLORS.statusRejected}]}>Expired</Text>
              </View>
            </View>
          </Pressable>
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
              <Text style={styles.ratingValue}>{avgRating.toFixed(2)}</Text>
              <View style={styles.starsRow}>
                {ratingStars.map((name, index) => (
                  <Ionicons key={index} name={name} size={ms(16)} color={COLORS.primary} />
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>

      <Pressable style={[styles.card, styles.attendanceCard]} onPress={onAttendancePress}>
        <View style={styles.attendanceHeader}>
          <Text style={styles.sectionTitle}>Today's Attendance</Text>
          <View style={styles.infoGap}>{renderInfo()}</View>
        </View>
        <View style={styles.attendanceRow}>
          {[
            {label: 'Present', value: attendance.present, bg: COLORS.success, fg: COLORS.success},
            {label: 'Absent', value: attendance.absent, bg: COLORS.attAbsent, fg: COLORS.alertRed},
            {label: 'Idle', value: attendance.idle, bg: COLORS.statusOngoing, fg: COLORS.statusOngoing},
            {label: 'On Leave', value: attendance.onLeave, bg: COLORS.attLeave, fg: COLORS.textBlack},
          ].map(item => (
            <View key={item.label} style={styles.attendanceCell}>
              <View style={[styles.attendanceBox, {backgroundColor: item.bg}]}>
                <Text style={styles.attendanceCount}>{item.value}</Text>
              </View>
              <Text style={[styles.attendanceLabel, {color: item.fg}]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </Pressable>
      {isLoading ? (
        <View style={styles.loaderRow}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loaderText}>Refreshing dashboard...</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const cardShadow = {
  elevation: 8,
  shadowColor: '#000',
  shadowOpacity: 0.15,
  shadowRadius: ms(6),
  shadowOffset: {width: 0, height: ms(3)},
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: ms(10),
    paddingTop: ms(10),
    paddingBottom: ms(10),
  },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ms(330),
    backgroundColor: COLORS.primary,
  },
  flex1: {flex: 1},
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(30),
    marginBottom: ms(10),
    paddingTop: ms(20),
    ...cardShadow,
  },
  showingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: ms(20),
  },
  muted: {
    color: COLORS.authText,
    fontSize: sp(14),
  },
  valueStrong: {
    color: COLORS.textBlack,
    fontWeight: '700',
    fontSize: sp(14),
  },
  ctaButton: {
    width: ms(100),
    backgroundColor: COLORS.primary,
    borderRadius: ms(34),
    paddingVertical: ms(5),
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: sp(14),
  },
  taskChartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: ms(20),
    marginTop: ms(10),
  },
  taskChartLeft: {
    flex: 0.6,
    padding: ms(10),
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
    fontSize: sp(32),
    fontWeight: '700',
    color: COLORS.textBlack,
  },
  taskChartTotalLabel: {
    fontSize: sp(15),
    color: COLORS.textBlack,
  },
  taskChartLegend: {
    flex: 0.4,
    justifyContent: 'center',
    paddingLeft: ms(15),
  },
  taskLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendGap: {marginTop: ms(20)},
  taskLegendValue: {
    fontSize: sp(15),
    fontWeight: '700',
  },
  taskLegendLabel: {
    marginLeft: ms(10),
    fontSize: sp(13),
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    marginHorizontal: ms(20),
    marginTop: ms(15),
  },
  earningsBlock: {flex: 0.4},
  amcBlock: {flex: 0.6},
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoGap: {marginLeft: ms(10)},
  metricLabel: {
    color: COLORS.lightGray,
    fontSize: sp(15),
    fontWeight: '700',
  },
  metricValueGreen: {
    color: COLORS.success,
    fontWeight: '700',
    fontSize: sp(22),
    margin: ms(2),
  },
  amcRow: {
    flexDirection: 'row',
    marginTop: ms(10),
  },
  amcCell: {
    flex: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  amcValue: {
    fontSize: sp(15),
    fontWeight: '700',
  },
  amcHint: {
    marginLeft: ms(5),
    fontSize: sp(13),
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.dividerGray,
    marginHorizontal: ms(20),
    marginTop: ms(10),
  },
  summaryRow: {
    flexDirection: 'row',
    padding: ms(15),
    marginBottom: ms(10),
  },
  summaryBlock: {
    flex: 1,
    alignItems: 'center',
  },
  summaryTitle: {
    color: COLORS.lightGray,
    fontSize: sp(14),
    textAlign: 'center',
    fontWeight: '700',
  },
  summaryValue: {
    marginTop: ms(10),
    color: COLORS.textBlack,
    fontSize: sp(14),
  },
  ratingRow: {
    marginTop: ms(10),
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    color: COLORS.primary,
    fontSize: sp(14),
    marginRight: ms(10),
  },
  starsRow: {
    flexDirection: 'row',
  },
  attendanceCard: {
    height: ms(150),
    marginBottom: ms(5),
    paddingTop: 0,
  },
  attendanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: ms(20),
    marginTop: ms(10),
  },
  sectionTitle: {
    color: COLORS.lightGray,
    fontSize: sp(15),
    fontWeight: '700',
  },
  attendanceRow: {
    flexDirection: 'row',
    marginHorizontal: ms(10),
    marginTop: ms(15),
  },
  attendanceCell: {
    flex: 1,
    alignItems: 'center',
  },
  attendanceBox: {
    width: '80%',
    height: ms(55),
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceCount: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: sp(20),
  },
  attendanceLabel: {
    marginTop: ms(8),
    fontSize: sp(12),
    fontWeight: '700',
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ms(4),
    marginBottom: ms(8),
  },
  loaderText: {
    marginLeft: ms(8),
    color: COLORS.slate,
    fontSize: sp(12),
  },
});

export default OwnerDashboardScreen;
