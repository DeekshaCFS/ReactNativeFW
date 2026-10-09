// src/screens/admin/EmployeeManagementScreen.tsx

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ms, sp} from '../../utils/responsive';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from '../../components/AppModal';
import {
  type EmployeeListItem,
  type EmployeeListResponse,
  type EmployeeLookupItem,
  type EmployeeLookupResponse,
  type LeaveListItem,
  type LeaveListResponse,
} from './adminLegacyApiTypes';
import { getAllDesignation } from '../../api/umDesignations/umDesignationsService';
import { getAllEmpList } from '../../api/umEmployeeList/umEmployeeListService';
import { getAllEmployeeLeaveList } from '../../api/leaveManagement/leaveManagementService';
import LeaveApprovalModal from './LeaveApprovalModal';
import { deleteEmpAccount, downloadTechList } from '../../api/users/usersService';
import { ensureSuccess } from '../../utils/apiResponse';
import EditEmployeeModal from './EditEmployeeModal';
import EmployeeAttendanceModal from './EmployeeAttendanceModal';
import TechnicianLiveMapScreen from './TechnicianLiveMapScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../theme/theme';
import TabStrip from '../../components/TabStrip';

type EmployeeManagementScreenProps = {
  ownerId: number;
  // Non-zero only when mounted under the shared AppHeader (the Employee tab
  // in AdminTabs), so content clears it. When pushed standalone from
  // Settings this screen already sits under a native stack header, which
  // reserves its own space, so the default (0) is correct there.
  contentTopOffset?: number;
  // "+ Emp" (Java: EmployeeListFragment plus_tech -> AddBulkTechFragment).
  onAddEmployee?: () => void;
  // Reports the active sub-tab back to AdminTabs so its shared header can
  // show "Attendance" while on Leave (matching Java's toolbar title) and
  // "Employee List" otherwise.
  onActiveTabChange?: (tab: EmployeeTab) => void;
};

type EmployeeTab = 'employee' | 'leave';

type FilterOption = {
  id: number;
  label: string;
};

type FilterKind = 'type' | 'zone' | 'status';
type LeaveFilterKind = 'leaveStatus' | 'leaveMonth';

const PAGE_START = 1;
const THEME_PRIMARY = '#c3002f';
const DEFAULT_PROFILE_ICON = require('../../../assets/images/profile_icon.png');
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
// Java: EmployeeLeaveList's spinStatus dialog -- Pending=1, Approved=2,
// Declined=3 (id 0 is reserved for "no filter", the button's idle state,
// not a selectable option in the list).
const LEAVE_STATUS_OPTIONS: FilterOption[] = [
  {id: 2, label: 'Approved'},
  {id: 3, label: 'Declined'},
  {id: 1, label: 'Pending'},
];

const getResultData = <T,>(response: {
  resultData?: T[] | null;
  ResultData?: T[] | null;
}) => response.resultData ?? response.ResultData ?? [];

const getCode = (response: {code?: string; Code?: string}) =>
  String(response.code ?? response.Code ?? '');

const getMessage = (response: {message?: string; Message?: string}) =>
  String(response.message ?? response.Message ?? '').trim();

const isSuccessOrNoData = (
  response: EmployeeLookupResponse | EmployeeListResponse | LeaveListResponse,
) => {
  const code = getCode(response);
  return code === '200' || code === '500' || code === '';
};

const uniqueOptions = (options: FilterOption[]) => {
  const seen = new Set<number>();
  return options.filter(option => {
    if (!option.id || seen.has(option.id)) {
      return false;
    }
    seen.add(option.id);
    return true;
  });
};

const getEmployeeName = (item: EmployeeListItem) =>
  String(item.FirstNameM ?? '').trim() || `Employee ${item.EmployeeNumber ?? '-'}`;

const getFieldOrNA = (value: string | null | undefined) => {
  const trimmed = String(value ?? '').trim();
  return trimmed || 'NA';
};

// Java: Picasso placeholder + onError both fall back to R.drawable.profile_icon.
const EmployeeAvatar = ({uri}: {uri?: string | null}) => {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      source={uri && !failed ? {uri} : DEFAULT_PROFILE_ICON}
      style={styles.avatar}
      onError={() => setFailed(true)}
    />
  );
};

const getBatteryLabel = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return '0%';
  }

  return `${value}%`;
};

const getDefaultMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
};

const formatMonthYearParam = (month: number, year: number) =>
  `${year}-${String(month).padStart(2, '0')}`;

const formatMonthYearLabel = (month: number, year: number) =>
  `${MONTH_LABELS[Math.max(1, Math.min(12, month)) - 1]} ${year}`;

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-GB').replace(/\//g, '-');
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const dateLabel = date.toLocaleDateString('en-GB').replace(/\//g, '-');
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${dateLabel}  ${String(hours).padStart(2, '0')}:${String(
    minutes,
  ).padStart(2, '0')} ${suffix}`;
};

const getLeaveEmployeeName = (item: LeaveListItem) =>
  `${String(item.FirstName ?? '').trim()} ${String(item.LastName ?? '').trim()}`
    .trim()
    .replace(/\s+/g, ' ') || `Employee ${item.UserID ?? '-'}`;

const EmployeeManagementScreen = ({
  ownerId,
  contentTopOffset = 0,
  onAddEmployee,
  onActiveTabChange,
}: EmployeeManagementScreenProps) => {
  const [activeTab, setActiveTab] = useState<EmployeeTab>('employee');

  // `onActiveTabChange` is intentionally excluded from the deps: AdminTabs
  // passes a fresh closure on every render (it calls navigation.setParams,
  // which itself triggers a re-render), so depending on it here caused an
  // infinite update loop. Only react to activeTab actually changing.
  useEffect(() => {
    onActiveTabChange?.(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [leaves, setLeaves] = useState<LeaveListItem[]>([]);
  // EmpAdminLeaveListAdapter.onClick -> LeaveApproveRejectFragmnt.
  const [selectedLeave, setSelectedLeave] = useState<LeaveListItem | null>(null);
  const [employeeTypes, setEmployeeTypes] = useState<FilterOption[]>([]);
  const [zones, setZones] = useState<FilterOption[]>([]);
  const [statuses, setStatuses] = useState<FilterOption[]>([]);
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [selectedType, setSelectedType] = useState<FilterOption>({
    id: 0,
    label: 'Select Emp Type',
  });
  const [selectedZone, setSelectedZone] = useState<FilterOption>({
    id: 0,
    label: 'Select Zone',
  });
  const [selectedStatus, setSelectedStatus] = useState<FilterOption>({
    id: 0,
    label: 'Status',
  });
  const [leaveSearchText, setLeaveSearchText] = useState('');
  const [submittedLeaveSearch, setSubmittedLeaveSearch] = useState('');
  // Java's spinStatus starts on the neutral "Status" label with leaveStatusId
  // 0 (no filter, shows every status) until the user picks one of the three
  // real options above -- LEAVE_STATUS_OPTIONS[0] was "Approved", which both
  // mislabeled the idle state and silently filtered every first load.
  const [selectedLeaveStatus, setSelectedLeaveStatus] = useState<FilterOption>(
    {id: 0, label: 'Status'},
  );
  const [leaveMonthYear, setLeaveMonthYear] = useState(getDefaultMonthYear);
  const [pendingLeaveMonth, setPendingLeaveMonth] = useState(
    () => leaveMonthYear.month,
  );
  const [pendingLeaveYear, setPendingLeaveYear] = useState(
    () => leaveMonthYear.year,
  );
  const [pageIndex, setPageIndex] = useState(PAGE_START);
  const [leavePageIndex, setLeavePageIndex] = useState(PAGE_START);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isLeaveInitialLoading, setIsLeaveInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLeaveRefreshing, setIsLeaveRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLeaveLoadingMore, setIsLeaveLoadingMore] = useState(false);
  const [isLastPage, setIsLastPage] = useState(false);
  const [isLeaveLastPage, setIsLeaveLastPage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [leaveErrorMessage, setLeaveErrorMessage] = useState('');
  const [filterModal, setFilterModal] = useState<FilterKind | null>(null);
  const [leaveFilterModal, setLeaveFilterModal] = useState<LeaveFilterKind | null>(
    null,
  );
  const [editingEmployee, setEditingEmployee] = useState<EmployeeListItem | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeListItem | null>(
    null,
  );
  const [attendanceEmployee, setAttendanceEmployee] = useState<EmployeeListItem | null>(
    null,
  );
  const [trackingEmployee, setTrackingEmployee] = useState<EmployeeListItem | null>(
    null,
  );
  const latestRequestId = useRef(0);
  const latestLeaveRequestId = useRef(0);

  const modalConfig = useMemo(() => {
    if (filterModal === 'type') {
      return {
        title: 'Select Emp Type',
        options: [{id: 0, label: 'Select Emp Type'}, ...employeeTypes],
        selectedId: selectedType.id,
      };
    }

    if (filterModal === 'zone') {
      return {
        title: 'Select Zone',
        options: [{id: 0, label: 'Select Zone'}, ...zones],
        selectedId: selectedZone.id,
      };
    }

    return {
      title: 'Status',
      options: [{id: 0, label: 'Status'}, ...statuses],
      selectedId: selectedStatus.id,
    };
  }, [
    employeeTypes,
    filterModal,
    selectedStatus.id,
    selectedType.id,
    selectedZone.id,
    statuses,
    zones,
  ]);
  const leaveYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from(
      {length: currentYear - 2000 + 2},
      (_, index) => currentYear + 1 - index,
    );
  }, []);

  const loadLookup = useCallback(async () => {
    try {
      const response = (await getAllDesignation({ UserId: ownerId })) as EmployeeLookupResponse;
      if (!isSuccessOrNoData(response)) {
        return;
      }

      const result = getResultData<EmployeeLookupItem>(response);
      setEmployeeTypes(
        uniqueOptions(
          result.map(item => ({
            id: Number(item.UserGroupCodeId ?? 0),
            label: String(item.UserGroupName ?? '').trim(),
          })),
        ),
      );
      setZones(
        uniqueOptions(
          result.map(item => ({
            id: Number(item.ZoneServiceId ?? 0),
            label: String(item.ZoneName ?? '').trim(),
          })),
        ),
      );
      setStatuses(
        uniqueOptions(
          result.map(item => ({
            id: Number(item.AttendenceTypeId ?? 0),
            label: String(item.AttendenceTypeName ?? '').trim(),
          })),
        ),
      );
    } catch {
      setEmployeeTypes([]);
      setZones([]);
      setStatuses([]);
    }
  }, [ownerId]);

  const fetchEmployeePage = useCallback(
    async ({
      nextPage,
      replace,
      refreshing = false,
      searchParam = submittedSearch,
      employeeTypeId = selectedType.id,
      zoneId = selectedZone.id,
      status = selectedStatus.id,
    }: {
      nextPage: number;
      replace: boolean;
      refreshing?: boolean;
      searchParam?: string;
      employeeTypeId?: number;
      zoneId?: number;
      status?: number;
    }) => {
      if (replace && !refreshing) {
        setIsInitialLoading(true);
      } else if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoadingMore(true);
      }

      setErrorMessage('');
      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;

      try {
        const response = (await getAllEmpList({
          OwnerId: ownerId,
          pageIndex: nextPage,
          SearchParam: searchParam,
          employeeTypeId,
          zoneId,
          status,
        })) as EmployeeListResponse;

        if (requestId !== latestRequestId.current) {
          return;
        }

        if (!isSuccessOrNoData(response)) {
          throw new Error(getMessage(response) || 'Unable to load employees.');
        }

        const nextEmployees = getResultData<EmployeeListItem>(response);
        setEmployees(previous =>
          replace ? nextEmployees : [...previous, ...nextEmployees],
        );
        setPageIndex(nextPage);
        setIsLastPage(nextEmployees.length === 0);
      } catch (error) {
        if (requestId !== latestRequestId.current) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load employees right now.';
        setErrorMessage(message);
        if (replace) {
          setEmployees([]);
          setIsLastPage(true);
        }
      } finally {
        if (requestId === latestRequestId.current) {
          setIsInitialLoading(false);
          setIsRefreshing(false);
          setIsLoadingMore(false);
        }
      }
    },
    [
      ownerId,
      selectedStatus.id,
      selectedType.id,
      selectedZone.id,
      submittedSearch,
    ],
  );

  const fetchLeavePage = useCallback(
    async ({
      nextPage,
      replace,
      refreshing = false,
      searchParams = submittedLeaveSearch,
      leaveStatusId = selectedLeaveStatus.id,
      month = leaveMonthYear.month,
      year = leaveMonthYear.year,
    }: {
      nextPage: number;
      replace: boolean;
      refreshing?: boolean;
      searchParams?: string;
      leaveStatusId?: number;
      month?: number;
      year?: number;
    }) => {
      if (replace && !refreshing) {
        setIsLeaveInitialLoading(true);
      } else if (refreshing) {
        setIsLeaveRefreshing(true);
      } else {
        setIsLeaveLoadingMore(true);
      }

      setLeaveErrorMessage('');
      const requestId = latestLeaveRequestId.current + 1;
      latestLeaveRequestId.current = requestId;

      try {
        const response = (await getAllEmployeeLeaveList({
          UserId: ownerId,
          PageNumber: nextPage,
          PageSize: 10,
          LeaveStatusId: leaveStatusId,
          IsPersonal: false,
          IsExportData: false,
          MonthYear: formatMonthYearParam(month, year),
          SearchParams: searchParams,
          ZoneId: 0,
        })) as LeaveListResponse;

        if (requestId !== latestLeaveRequestId.current) {
          return;
        }

        if (!isSuccessOrNoData(response)) {
          throw new Error(getMessage(response) || 'Unable to load leave requests.');
        }

        const resultData = response.resultData ?? response.ResultData ?? null;
        const nextLeaves = resultData?.LeaveDetails ?? [];
        setLeaves(previous => (replace ? nextLeaves : [...previous, ...nextLeaves]));
        setLeavePageIndex(nextPage);
        setIsLeaveLastPage(nextLeaves.length === 0);
      } catch (error) {
        if (requestId !== latestLeaveRequestId.current) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load leave requests right now.';
        setLeaveErrorMessage(message);
        if (replace) {
          setLeaves([]);
          setIsLeaveLastPage(true);
        }
      } finally {
        if (requestId === latestLeaveRequestId.current) {
          setIsLeaveInitialLoading(false);
          setIsLeaveRefreshing(false);
          setIsLeaveLoadingMore(false);
        }
      }
    },
    [
      leaveMonthYear.month,
      leaveMonthYear.year,
      ownerId,
      selectedLeaveStatus.id,
      submittedLeaveSearch,
    ],
  );

  useEffect(() => {
    loadLookup();
  }, [loadLookup]);

  useEffect(() => {
    fetchEmployeePage({nextPage: PAGE_START, replace: true});
  }, [fetchEmployeePage]);

  useEffect(() => {
    if (activeTab === 'leave') {
      fetchLeavePage({nextPage: PAGE_START, replace: true});
    }
  }, [activeTab, fetchLeavePage]);

  const refreshList = () => {
    setSearchText('');
    setSubmittedSearch('');
    setSelectedType({id: 0, label: 'Select Emp Type'});
    setSelectedZone({id: 0, label: 'Select Zone'});
    setSelectedStatus({id: 0, label: 'Status'});
    fetchEmployeePage({
      nextPage: PAGE_START,
      replace: true,
      searchParam: '',
      employeeTypeId: 0,
      zoneId: 0,
      status: 0,
    });
  };

  const submitSearch = () => {
    setSubmittedSearch(searchText.trim());
  };

  const submitLeaveSearch = () => {
    setSubmittedLeaveSearch(leaveSearchText.trim());
  };

  const selectFilter = (option: FilterOption) => {
    if (filterModal === 'type') {
      setSelectedType(option);
    } else if (filterModal === 'zone') {
      setSelectedZone(option);
    } else if (filterModal === 'status') {
      setSelectedStatus(option);
    }
    setFilterModal(null);
  };

  const selectLeaveStatus = (option: FilterOption) => {
    setSelectedLeaveStatus(option);
    setLeaveFilterModal(null);
  };

  const applyLeaveMonthYear = () => {
    setLeaveMonthYear({month: pendingLeaveMonth, year: pendingLeaveYear});
    setLeaveFilterModal(null);
  };

  const handleCallEmployee = (item: EmployeeListItem) => {
    const mobile = String(item.ContactM ?? '').trim();
    if (!mobile) {
      Alert.alert('Employee Details', 'Mobile number is not available.');
      return;
    }
    Linking.openURL(`tel:${mobile}`).catch(() => {
      Alert.alert('Employee Details', 'Unable to place the call.');
    });
  };

  const handleWhatsAppEmployee = (item: EmployeeListItem) => {
    const mobile = String(item.ContactM ?? '').trim();
    if (!mobile) {
      Alert.alert('Employee Details', 'Mobile number is not available.');
      return;
    }
    Linking.openURL(`https://wa.me/${mobile}`).catch(() => {
      Alert.alert('Employee Details', 'Unable to open WhatsApp.');
    });
  };

  const handleEditEmployee = (item: EmployeeListItem) => {
    if (!item.EmployeeNumber) {
      Alert.alert('Edit Profile', 'Employee id is not available.');
      return;
    }
    setEditingEmployee(item);
  };

  // EmployeeListFragment.getDownloadTechList: the server builds the file and
  // returns its URL in ResultData.TechFilePath.
  const handleDownloadEmployees = async () => {
    try {
      const response = await downloadTechList({OwnerId: ownerId});
      const url = String(response?.ResultData?.TechFilePath ?? '');
      if (response?.Code === '200' && url) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Download', response?.Message || 'Unable to download the employee list.');
      }
    } catch (error) {
      Alert.alert('Download', error instanceof Error ? error.message : 'Unable to download the employee list.');
    }
  };

  const handleDeleteEmployee = (item: EmployeeListItem) => {
    // delete_tech_account.xml wording.
    Alert.alert(
      `Do you wish to Delete ${getEmployeeName(item)}`,
      'It will completely remove all the data associated with this account.',
      [
        {text: 'Nope. Not Now', style: 'cancel'},
        {
          text: 'Yes. Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Java (EmployeeListFragment.DeleteEmpAccount): a list of
              // { UserId: <logged-in owner>, Id: <employee to delete> }.
              ensureSuccess(
                await deleteEmpAccount([
                  {UserId: ownerId, Id: item.EmployeeNumber ?? 0},
                ] as unknown as Parameters<typeof deleteEmpAccount>[0]),
              );
              setSelectedEmployee(null);
              refreshList();
            } catch (error) {
              Alert.alert(
                'Delete Employee',
                error instanceof Error ? error.message : 'Unable to delete employee.',
              );
            }
          },
        },
      ],
    );
  };

  const renderEmployee = ({item}: {item: EmployeeListItem}) => {
    const battery = item.BatteryPercentage;
    const gpsOn = item.GPSOnOrOff === true;
    const attendance = String(item.AttendenceTypeName ?? 'Absent').trim();
    const attendanceLower = attendance.toLowerCase();
    const isPresent = attendanceLower === 'present';
    // Java hides each of these when the value is NA or missing.
    const clean = (v: unknown) => {
      const t = String(v ?? '').trim();
      return t && t !== 'NA' ? t : '';
    };
    const role = clean(item.UserGroupName);
    const designation = clean(item.DesignationName);
    const zone = clean(item.ZoneName);
    const batteryValue = Number(battery ?? 0);
    const batteryColor =
      batteryValue >= 51
        ? COLORS.success
        : batteryValue >= 21
        ? COLORS.statusOngoing
        : COLORS.primary;
    const pillColor = isPresent
      ? COLORS.success
      : attendanceLower === 'absent'
      ? COLORS.statusRejected
      : attendanceLower === 'idle'
      ? COLORS.statusOngoing
      : attendanceLower === 'on leave' || attendanceLower === 'onleave'
      ? COLORS.attLeave
      : COLORS.darkGray;

    return (
      <Pressable
        style={styles.employeeCard}
        onPress={() => setSelectedEmployee(item)}>
        <View style={styles.avatarColumn}>
          <EmployeeAvatar uri={item.ProfileImage} />
          <View
            style={[styles.attendancePill, {backgroundColor: pillColor}]}>
            <Text style={styles.attendanceText}>{attendance}</Text>
          </View>
        </View>

        <View style={styles.employeeInfo}>
          <Text numberOfLines={1} style={styles.employeeName}>
            {getEmployeeName(item)}
          </Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Battery</Text>
            <Text
              style={[
                styles.metricValue,
                {color: batteryColor},
              ]}>
              {getBatteryLabel(battery)}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>GPS</Text>
            <Text style={[styles.metricValue, {color: gpsOn ? COLORS.success : COLORS.primary}]}>
              {gpsOn ? 'On' : 'Off'}
            </Text>
          </View>
        </View>

        <View style={styles.employeeSide}>
          {role ? (
            <View style={styles.roleRibbon}>
              <Text numberOfLines={1} style={styles.roleRibbonText}>
                {role.toUpperCase()}
              </Text>
            </View>
          ) : (
            <View style={styles.roleRibbonSpacer} />
          )}
          {designation ? (
            <Text numberOfLines={1} style={styles.sideText}>
              {designation}
            </Text>
          ) : null}
          {zone ? (
            <Text numberOfLines={1} style={styles.sideText}>
              {zone}
            </Text>
          ) : null}
          <View style={styles.trackRow}>
            <Pressable
              hitSlop={8}
              onPress={() => setAttendanceEmployee(item)}>
              <Ionicons name="calendar-outline" style={styles.calendarIcon} />
            </Pressable>
            <Pressable
              style={styles.trackButton}
              onPress={() => {
                if (attendanceLower === 'absent') {
                  Alert.alert('Track', 'Employee is Absent today.');
                  return;
                }
                setTrackingEmployee(item);
              }}>
              <Text style={styles.trackButtonText}>Track</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => {
    if (isInitialLoading) {
      return null;
    }

    if (errorMessage) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>!</Text>
          <Text style={styles.emptyTitle}>Unable to Load Employees</Text>
          <Text style={styles.emptyText}>{errorMessage}</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Image
          source={require('../../../assets/images/noresultfound.png')}
          style={styles.emptyImage}
          resizeMode="contain"
        />
      </View>
    );
  };

  const renderLeave = ({item}: {item: LeaveListItem}) => {
    // Java: EmpAdminLeaveListAdapter derives both the label and color from
    // LeaveStatusId (1/2/3), not the raw LeaveStatusName string -- that
    // string's actual API value doesn't reliably say "Declined" (it can come
    // back as "Rejected"), so matching on it silently missed the red case.
    const statusId = Number(item.LeaveStatusId) || 0;
    const status =
      statusId === 2 ? 'Approved' : statusId === 3 ? 'Declined' : 'Pending';
    const statusColor =
      statusId === 2 ? '#00C900' : statusId === 3 ? COLORS.primary : '#0000FF';
    const leaveType = String(item.LeaveType ?? 'Full Day').trim();
    const isHalfDay = leaveType.toLowerCase().includes('half');
    const employeeName = getLeaveEmployeeName(item);
    const employeeCode = item.UserID ? `EMP${item.UserID}` : item.UserName ?? '';
    const startDate = formatDate(item.LeaveStartDate);
    const endDate = formatDate(item.LeaveEndDate);

    return (
      <Pressable style={styles.leaveCard} onPress={() => setSelectedLeave(item)}>
        <View
          style={[
            styles.leaveTypeRibbon,
            isHalfDay ? styles.leaveTypeRibbonHalf : null,
          ]}>
          <Text style={styles.leaveTypeRibbonText}>{leaveType}</Text>
        </View>
        <View style={styles.leaveDatePill}>
          <Text numberOfLines={1} style={styles.leaveCreatedText}>
            {formatDateTime(item.LeaveCreatedDate)}
          </Text>
        </View>

        <View style={styles.leaveTopRow}>
          <Text numberOfLines={1} style={styles.leaveEmployeeName}>
            {employeeName}
            {employeeCode ? (
              <Text style={styles.leaveEmployeeCode}> [{employeeCode}]</Text>
            ) : null}
          </Text>
          <Text numberOfLines={1} style={styles.leaveRoleText}>
            {String(item.UserDesignation ?? 'Fieldworker').trim()}
          </Text>
        </View>

        <View style={styles.leaveDetailRow}>
          <View style={styles.leaveDateGroup}>
            <Text style={styles.leaveLabel}>Leave Date :</Text>
            <Text numberOfLines={1} style={styles.leaveValue}>
              {startDate} - {endDate}
            </Text>
          </View>
          <View style={styles.leaveStatusGroup}>
            <Text style={styles.leaveStatusLabel}>Status :</Text>
            <Text style={[styles.leaveStatusValue, {color: statusColor}]}>
              {status}
            </Text>
          </View>
        </View>

        <View style={styles.leaveReasonRow}>
          <Text style={styles.leaveLabel}>Leave Reason :</Text>
          <Text numberOfLines={1} style={styles.leaveReasonValue}>
            {String(item.ReasonOfLeave ?? '').trim() || 'NA'}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderLeaveEmpty = () => {
    if (isLeaveInitialLoading) {
      return null;
    }

    if (leaveErrorMessage) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>!</Text>
          <Text style={styles.emptyTitle}>Unable to Load Leave Requests</Text>
          <Text style={styles.emptyText}>{leaveErrorMessage}</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Image
          source={require('../../../assets/images/noresultfound.png')}
          style={styles.emptyImage}
          resizeMode="contain"
        />
      </View>
    );
  };

  const renderEmployeeTab = () => (
    <>
      <View style={styles.actionArea}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" style={styles.searchIcon} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={submitSearch}
              returnKeyType="search"
              placeholder="Search"
              placeholderTextColor={COLORS.lightGray}
              style={styles.searchInput}
            />
            {searchText ? (
              <Pressable
                hitSlop={10}
                onPress={() => {
                  setSearchText('');
                  setSubmittedSearch('');
                }}>
                <Ionicons name="close" style={styles.clearText} />
              </Pressable>
            ) : null}
          </View>
          <Pressable style={styles.addButton} onPress={onAddEmployee}>
            <Text style={styles.addButtonText}>+ Emp</Text>
          </Pressable>
          <Pressable onPress={handleDownloadEmployees}>
            <Ionicons name="download-outline" size={25} style={{ color: COLORS.primary }} />
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          <Pressable
            style={[styles.filterButton, {flex: 1.3}]}
            onPress={() => setFilterModal('type')}>
            <Text numberOfLines={1} style={styles.filterText}>
              {selectedType.label}
            </Text>
            <Ionicons name="chevron-down" style={styles.filterChevron} />
          </Pressable>
          <Pressable
            style={[styles.filterButton, {flex: 1}]}
            onPress={() => setFilterModal('zone')}>
            <Text numberOfLines={1} style={styles.filterText}>
              {selectedZone.label}
            </Text>
            <Ionicons name="chevron-down" style={styles.filterChevron} />
          </Pressable>
          <Pressable
            style={[styles.filterButton, {flex: 0.7}]}
            onPress={() => setFilterModal('status')}>
            <Text numberOfLines={1} style={styles.filterText}>
              {selectedStatus.label}
            </Text>
            <Ionicons name="chevron-down" style={styles.filterChevron} />
          </Pressable>
        </View>
      </View>

      {isInitialLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={THEME_PRIMARY} />
          <Text style={styles.loadingText}>Loading employees...</Text>
        </View>
      ) : null}

      <FlatList
        data={employees}
        keyExtractor={(item, index) => `${item.EmployeeNumber ?? index}-${index}`}
        renderItem={renderEmployee}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.listFooter}>
              <ActivityIndicator color={THEME_PRIMARY} size="small" />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            colors={[THEME_PRIMARY]}
            tintColor={THEME_PRIMARY}
            onRefresh={() =>
              fetchEmployeePage({
                nextPage: PAGE_START,
                replace: true,
                refreshing: true,
              })
            }
          />
        }
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (!isInitialLoading && !isLoadingMore && !isLastPage) {
            fetchEmployeePage({nextPage: pageIndex + 1, replace: false});
          }
        }}
      />
    </>
  );

  const renderLeaveRequestTab = () => (
    <>
      <View style={styles.leaveToolbar}>
        <View style={styles.leaveSearchBox}>
          <Ionicons name="search" style={styles.searchIcon} />
          <TextInput
            value={leaveSearchText}
            onChangeText={setLeaveSearchText}
            onSubmitEditing={submitLeaveSearch}
            returnKeyType="search"
            placeholder="Search"
            placeholderTextColor={COLORS.lightGray}
            style={styles.searchInput}
          />
          {leaveSearchText ? (
            <Pressable
              hitSlop={10}
              onPress={() => {
                setLeaveSearchText('');
                setSubmittedLeaveSearch('');
              }}>
              <Ionicons name="close" style={styles.clearText} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={styles.leaveStatusButton}
          onPress={() => setLeaveFilterModal('leaveStatus')}>
          <Text numberOfLines={1} style={styles.leaveFilterText}>
            {selectedLeaveStatus.label}
          </Text>
          <Ionicons name="chevron-down" style={styles.leaveFilterChevron} />
        </Pressable>

        <Pressable
          style={styles.leaveMonthButton}
          onPress={() => {
            setPendingLeaveMonth(leaveMonthYear.month);
            setPendingLeaveYear(leaveMonthYear.year);
            setLeaveFilterModal('leaveMonth');
          }}>
          <Text numberOfLines={1} style={styles.leaveFilterText}>
            {formatMonthYearLabel(leaveMonthYear.month, leaveMonthYear.year)}
          </Text>
          <Ionicons name="chevron-down" style={styles.leaveFilterChevron} />
        </Pressable>
      </View>

      {isLeaveInitialLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={THEME_PRIMARY} />
          <Text style={styles.loadingText}>Loading leave requests...</Text>
        </View>
      ) : null}

      <FlatList
        data={leaves}
        keyExtractor={(item, index) => `${item.LeaveID ?? index}-${index}`}
        renderItem={renderLeave}
        contentContainerStyle={styles.leaveListContent}
        ListEmptyComponent={renderLeaveEmpty}
        ListFooterComponent={
          isLeaveLoadingMore ? (
            <View style={styles.listFooter}>
              <ActivityIndicator color={THEME_PRIMARY} size="small" />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isLeaveRefreshing}
            colors={[THEME_PRIMARY]}
            tintColor={THEME_PRIMARY}
            onRefresh={() =>
              fetchLeavePage({
                nextPage: PAGE_START,
                replace: true,
                refreshing: true,
              })
            }
          />
        }
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (!isLeaveInitialLoading && !isLeaveLoadingMore && !isLeaveLastPage) {
            fetchLeavePage({nextPage: leavePageIndex + 1, replace: false});
          }
        }}
      />
    </>
  );

  return (
    <View style={styles.shell}>
      <View style={{ marginTop: contentTopOffset }}>
        <TabStrip
          tabs={[
            { key: 'employee', label: 'EMPLOYEE LIST' },
            { key: 'leave', label: 'LEAVE REQUEST' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </View>

      {activeTab === 'employee' ? renderEmployeeTab() : renderLeaveRequestTab()}

      <LeaveApprovalModal
        leave={selectedLeave}
        ownerId={ownerId}
        onClose={() => setSelectedLeave(null)}
        onActioned={() => {
          setSelectedLeave(null);
          fetchLeavePage({nextPage: PAGE_START, replace: true});
        }}
      />

      <Modal
        visible={filterModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModal(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setFilterModal(null)}>
          <Pressable
            style={[
              styles.modalPanel,
              leaveFilterModal === 'leaveMonth' ? styles.monthModalPanel : null,
            ]}>
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            {modalConfig.options.map(option => (
              <TouchableOpacity
                key={`${filterModal}-${option.id}`}
                style={[
                  styles.modalItem,
                  option.id === modalConfig.selectedId ? styles.modalItemActive : null,
                ]}
                onPress={() => selectFilter(option)}>
                <Text
                  style={[
                    styles.modalItemText,
                    option.id === modalConfig.selectedId
                      ? styles.modalItemTextActive
                      : null,
                  ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={leaveFilterModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setLeaveFilterModal(null)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setLeaveFilterModal(null)}>
          <Pressable style={styles.modalPanel}>
            {leaveFilterModal === 'leaveStatus' ? (
              <>
                <Text style={styles.modalTitle}>Select Status</Text>
                {LEAVE_STATUS_OPTIONS.map((option, index) => (
                  <TouchableOpacity
                    key={`${option.id}-${option.label}-${index}`}
                    style={[
                      styles.modalItem,
                      option.id === selectedLeaveStatus.id &&
                      option.label === selectedLeaveStatus.label
                        ? styles.modalItemActive
                        : null,
                    ]}
                    onPress={() => selectLeaveStatus(option)}>
                    <Text
                      style={[
                        styles.modalItemText,
                        option.id === selectedLeaveStatus.id &&
                        option.label === selectedLeaveStatus.label
                          ? styles.modalItemTextActive
                          : null,
                      ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Select month</Text>
                <View style={styles.monthPickerBody}>
                  <ScrollView style={styles.monthPickerColumn}>
                    <Text style={styles.monthPickerColumnTitle}>Month</Text>
                    {MONTH_LABELS.map((label, index) => {
                      const value = index + 1;
                      const selected = value === pendingLeaveMonth;
                      return (
                        <TouchableOpacity
                          key={label}
                          style={[
                            styles.modalItem,
                            selected ? styles.modalItemActive : null,
                          ]}
                          onPress={() => setPendingLeaveMonth(value)}>
                          <Text
                            style={[
                              styles.modalItemText,
                              selected ? styles.modalItemTextActive : null,
                            ]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <ScrollView style={styles.monthPickerColumn}>
                    <Text style={styles.monthPickerColumnTitle}>Year</Text>
                    {leaveYearOptions.map(value => {
                      const selected = value === pendingLeaveYear;
                      return (
                        <TouchableOpacity
                          key={String(value)}
                          style={[
                            styles.modalItem,
                            selected ? styles.modalItemActive : null,
                          ]}
                          onPress={() => setPendingLeaveYear(value)}>
                          <Text
                            style={[
                              styles.modalItemText,
                              selected ? styles.modalItemTextActive : null,
                            ]}>
                            {value}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
                <View style={styles.monthPickerFooter}>
                  <Pressable
                    style={styles.monthPickerButton}
                    onPress={() => setLeaveFilterModal(null)}>
                    <Text style={styles.monthPickerButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.monthPickerButton, styles.monthPickerButtonPrimary]}
                    onPress={applyLeaveMonthYear}>
                    <Text
                      style={[
                        styles.monthPickerButtonText,
                        styles.monthPickerButtonTextPrimary,
                      ]}>
                      OK
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={selectedEmployee !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedEmployee(null)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedEmployee(null)}>
          <Pressable style={styles.detailsSheet}>
            {selectedEmployee ? (
              <>
                <View style={styles.detailsHeaderRow}>
                  <Text style={styles.detailsTitle}>Employee Details</Text>
                  <View style={styles.detailsHeaderIcons}>
                    <Pressable
                      hitSlop={10}
                      onPress={() => handleEditEmployee(selectedEmployee)}
                      style={styles.detailsIconButton}>
                      <Ionicons name="create-outline" style={styles.detailsIconText} />
                    </Pressable>
                    <Pressable
                      hitSlop={10}
                      onPress={() => handleCallEmployee(selectedEmployee)}
                      style={styles.detailsIconButton}>
                      <Ionicons name="call-outline" style={styles.detailsIconText} />
                    </Pressable>
                    <Pressable
                      hitSlop={10}
                      onPress={() => handleWhatsAppEmployee(selectedEmployee)}
                      style={styles.detailsIconButton}>
                      <Ionicons name="logo-whatsapp" style={styles.detailsIconText} />
                    </Pressable>
                    <Pressable
                      hitSlop={10}
                      onPress={() => handleDeleteEmployee(selectedEmployee)}
                      style={styles.detailsIconButton}>
                      <Ionicons name="trash-outline" style={styles.detailsIconText} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.detailsFieldRow}>
                  <Text style={styles.detailsLabel}>Employee Name</Text>
                  <Text style={styles.detailsValue} numberOfLines={1}>
                    {getEmployeeName(selectedEmployee)}
                  </Text>
                </View>
                <View style={styles.detailsFieldRow}>
                  <Text style={styles.detailsLabel}>Mobile Number</Text>
                  <Text style={styles.detailsValue} numberOfLines={1}>
                    {getFieldOrNA(selectedEmployee.ContactM)}
                  </Text>
                </View>
                <View style={styles.detailsFieldRow}>
                  <Text style={styles.detailsLabel}>Employee Type</Text>
                  <Text style={styles.detailsValue} numberOfLines={1}>
                    {getFieldOrNA(selectedEmployee.UserGroupName)}
                  </Text>
                </View>
                <View style={styles.detailsFieldRow}>
                  <Text style={styles.detailsLabel}>Designation</Text>
                  <Text style={styles.detailsValue} numberOfLines={1}>
                    {getFieldOrNA(selectedEmployee.DesignationName)}
                  </Text>
                </View>
                <View style={styles.detailsFieldRow}>
                  <Text style={styles.detailsLabel}>Zone</Text>
                  <Text style={styles.detailsValue} numberOfLines={1}>
                    {getFieldOrNA(selectedEmployee.ZoneName)}
                  </Text>
                </View>
                <View style={styles.detailsFieldRow}>
                  <Text style={styles.detailsLabel}>Email ID</Text>
                  <Text style={styles.detailsValue} numberOfLines={1}>
                    {getFieldOrNA(selectedEmployee.EmailId)}
                  </Text>
                </View>
                <View style={styles.detailsFieldRow}>
                  <Text style={styles.detailsLabel}>Address</Text>
                  <Text style={styles.detailsValue} numberOfLines={1}>
                    NA
                  </Text>
                </View>

                <Pressable
                  style={styles.detailsCancelButton}
                  onPress={() => setSelectedEmployee(null)}>
                  <Text style={styles.detailsCancelText}>Cancel</Text>
                </Pressable>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
      <EmployeeAttendanceModal
        visible={attendanceEmployee !== null}
        employee={attendanceEmployee}
        onClose={() => setAttendanceEmployee(null)}
      />
      <TechnicianLiveMapScreen
        visible={trackingEmployee !== null}
        employee={trackingEmployee}
        onClose={() => setTrackingEmployee(null)}
      />
      <EditEmployeeModal
        visible={editingEmployee !== null}
        ownerId={ownerId}
        employeeNumber={editingEmployee?.EmployeeNumber ?? 0}
        designationName={String(editingEmployee?.DesignationName ?? '')}
        zoneName={String(editingEmployee?.ZoneName ?? '')}
        onClose={() => setEditingEmployee(null)}
        onUpdated={() => {
          setSelectedEmployee(null);
          refreshList();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME_PRIMARY,
    paddingHorizontal: ms(12),
    paddingVertical: ms(14),
  },
  headerIconButton: {
    padding: ms(4),
  },
  headerIconText: {
    color: '#FFFFFF',
    fontSize: sp(18),
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: sp(18),
    fontWeight: '700',
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: ms(12),
  },
  shell: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: ms(4),
    borderBottomColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#FFF4F7',
    borderBottomColor: THEME_PRIMARY,
  },
  tabText: {
    color: '#7A7A7A',
    fontSize: sp(16),
    fontWeight: '600',
  },
  tabTextActive: {
    color: THEME_PRIMARY,
  },
  actionArea: {
    paddingHorizontal: ms(24),
    paddingTop: ms(15),
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(16),
    marginTop: ms(-10),
  },
  searchBox: {
    flex: 1,
    height: ms(35),
    borderBottomWidth: ms(1),
    borderBottomColor: '#BDBDBD',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    color: COLORS.lightGray,
    fontSize: ms(20),
    marginRight: ms(8),
  },
  searchInput: {
    flex: 1,
    color: COLORS.textBlack,
    fontSize: sp(14),
    paddingVertical: 0,
  },
  clearText: {
    color: COLORS.textBlack,
    fontSize: ms(20),
  },
  addButton: {
    height: ms(30),
    width: ms(60),
    borderRadius: ms(15),
    backgroundColor: COLORS.textBlack,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: sp(12),
    fontWeight: '500',
  },
  filterRow: {
    marginTop: ms(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(14),
  },
  filterButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterText: {
    flex: 1,
    color: COLORS.textBlack,
    fontSize: sp(14),
    fontWeight: '400',
  },
  filterChevron: {
    color: THEME_PRIMARY,
    fontSize: sp(20),
    lineHeight: sp(20),
    marginLeft: ms(15),
  },
  loadingOverlay: {
    paddingVertical: ms(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: ms(8),
    color: '#6B7280',
    fontSize: sp(13),
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: ms(2),
    paddingTop: ms(10),
    paddingBottom: ms(5),
  },
  employeeCard: {
    height: ms(105),
    borderRadius: ms(20),
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    margin: ms(8),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.13,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
  },
  avatarColumn: {
    width: ms(80),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(10),
  },
  avatar: {
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
  },
  attendancePill: {
    marginTop: ms(5),
    width: ms(60),
    height: ms(20),
    borderRadius: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceText: {
    color: '#FFFFFF',
    fontSize: sp(14),
  },
  employeeInfo: {
    flex: 1,
    paddingTop: ms(10),
    paddingBottom: ms(15),
    justifyContent: 'space-between',
    minWidth: 0,
  },
  employeeName: {
    color: COLORS.ink,
    fontSize: sp(14),
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
  },
  metricLabel: {
    color: COLORS.authText,
    fontSize: sp(10),
    minWidth: ms(52),
  },
  metricValue: {
    color: COLORS.success,
    fontSize: sp(10),
    fontWeight: '700',
  },
  metricValueDanger: {
    color: THEME_PRIMARY,
  },
  employeeSide: {
    width: ms(120),
    alignItems: 'flex-end',
    paddingBottom: ms(10),
  },
  roleRibbonSpacer: {
    height: ms(20),
  },
  roleRibbon: {
    alignSelf: 'stretch',
    height: ms(20),
    borderBottomLeftRadius: ms(10),
    backgroundColor: COLORS.tagBlue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(14),
  },
  roleRibbonText: {
    color: '#FFFFFF',
    fontSize: sp(10),
    fontWeight: '700',
  },
  sideText: {
    maxWidth: ms(80),
    marginTop: ms(8),
    marginRight: ms(14),
    color: COLORS.primary,
    fontSize: sp(10),
    fontWeight: '700',
  },
  trackRow: {
    alignSelf: 'stretch',
    marginTop: ms(10),
    paddingHorizontal: ms(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarIcon: {
    color: '#111111',
    fontSize: sp(20),
    lineHeight: sp(20),
  },
  trackButton: {
    width: ms(60),
    height: ms(20),
    borderRadius: ms(20),
    backgroundColor: COLORS.darkGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontSize: sp(14),
  },
  listFooter: {
    paddingVertical: ms(8),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(24),
    paddingTop: ms(110),
    paddingBottom: ms(48),
  },
  emptyImage: {
    width: ms(200),
    height: ms(200),
  },
  emptyIcon: {
    width: ms(42),
    height: ms(42),
    borderRadius: ms(21),
    backgroundColor: '#F3F4F6',
    color: THEME_PRIMARY,
    textAlign: 'center',
    lineHeight: sp(42),
    fontSize: sp(24),
    fontWeight: '900',
  },
  emptyTitle: {
    marginTop: ms(14),
    color: '#1F2937',
    fontSize: sp(18),
    fontWeight: '900',
  },
  emptyText: {
    marginTop: ms(8),
    color: '#6B7280',
    fontSize: sp(14),
    textAlign: 'center',
    lineHeight: sp(20),
  },
  leaveToolbar: {
    paddingHorizontal: ms(15),
    paddingTop: ms(10),
    paddingBottom: ms(5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
  },
  leaveSearchBox: {
    flex: 1.8,
    height: ms(40),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkGray,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  leaveStatusButton: {
    flex: 0.8,
    height: ms(40),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leaveMonthButton: {
    flex: 0.8,
    height: ms(40),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leaveFilterText: {
    flex: 1,
    color: COLORS.textBlack,
    fontSize: sp(14),
  },
  leaveFilterChevron: {
    color: THEME_PRIMARY,
    fontSize: sp(16),
    lineHeight: sp(18),
    marginLeft: ms(5),
  },
  leaveListContent: {
    paddingHorizontal: ms(15),
    paddingTop: ms(5),
    paddingBottom: ms(5),
  },
  leaveCard: {
    minHeight: ms(50),
    borderRadius: ms(10),
    backgroundColor: '#FFFFFF',
    borderWidth: ms(1),
    borderColor: '#ECECEC',
    marginBottom: ms(30),
    paddingTop: ms(50),
    paddingHorizontal: ms(18),
    paddingBottom: ms(10),
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
  },
  leaveTypeRibbon: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: ms(100),
    height: ms(20),
    borderTopLeftRadius: ms(10),
    borderBottomRightRadius: ms(10),
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    paddingLeft: ms(12),
  },
  leaveTypeRibbonHalf: {
    backgroundColor: '#303832',
  },
  leaveTypeRibbonText: {
    color: '#FFFFFF',
    fontSize: sp(12),
    fontWeight: '600',
  },
  leaveDatePill: {
    position: 'absolute',
    right: ms(18),
    top: 0,
    height: ms(20),
    maxWidth: ms(260),
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  leaveCreatedText: {
    color: '#555555',
    fontSize: sp(12),
    fontWeight: '500',
  },
  leaveTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(14),
    marginTop: ms(-20),
  },
  leaveEmployeeName: {
    flex: 1,
    color: '#111111',
    fontSize: sp(14),
    fontWeight: '500',
  },
  leaveEmployeeCode: {
    color: '#555555',
    fontSize: sp(14),
    fontWeight: '500',
  },
  leaveRoleText: {
    width: ms(128),
    color: '#1E90FF',
    fontSize: sp(13),
    fontWeight: '500',
    textAlign: 'right',
  },
  leaveDetailRow: {
    marginTop: ms(3),
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(14),
  },
  leaveReasonRow: {
    marginTop: ms(3),
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaveLabel: {
    color: '#555555',
    fontSize: sp(12),
    fontWeight: '500',
  },
  leaveDateGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },
  leaveValue: {
    flex: 1,
    color: THEME_PRIMARY,
    fontSize: sp(12),
    fontWeight: '500',
  },
  leaveStatusLabel: {
    color: '#555555',
    fontSize: sp(12),
    fontWeight: '700',
  },
  leaveStatusGroup: {
    minWidth: ms(150),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: ms(8),
    left: ms(25),
  },
  leaveStatusValue: {
    minWidth: ms(72),
    fontSize: sp(12),
    fontWeight: '500',
  },
  leaveReasonValue: {
    flex: 1,
    color: THEME_PRIMARY,
    fontSize: sp(12),
    fontWeight: '500',
    left: ms(20),
  },
  leaveShell: {
    flex: 1,
    paddingHorizontal: ms(24),
    paddingTop: ms(22),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.36)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPanel: {
    width: '100%',
    maxWidth: ms(420),
    maxHeight: '72%',
    borderRadius: ms(12),
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  monthModalPanel: {
    maxHeight: '82%',
  },
  modalTitle: {
    paddingHorizontal: ms(18),
    paddingVertical: ms(16),
    color: '#111827',
    fontSize: sp(18),
    fontWeight: '900',
    borderBottomWidth: ms(1),
    borderBottomColor: '#E5E7EB',
  },
  modalItem: {
    paddingHorizontal: ms(18),
    paddingVertical: ms(15),
    borderBottomWidth: ms(1),
    borderBottomColor: '#F1F2F4',
  },
  modalItemActive: {
    backgroundColor: '#FDE7EE',
  },
  modalItemText: {
    color: '#1F2937',
    fontSize: sp(16),
    fontWeight: '600',
  },
  modalItemTextActive: {
    color: THEME_PRIMARY,
    fontWeight: '900',
  },
  monthPickerBody: {
    flexDirection: 'row',
    padding: ms(12),
    gap: ms(10),
    maxHeight: ms(430),
  },
  monthPickerColumn: {
    flex: 1,
    maxHeight: ms(340),
  },
  monthPickerColumnTitle: {
    color: '#111827',
    fontSize: sp(13),
    fontWeight: '900',
    paddingHorizontal: ms(18),
    paddingVertical: ms(8),
  },
  monthPickerFooter: {
    height: ms(54),
    flexDirection: 'row',
    borderTopWidth: ms(1),
    borderTopColor: '#E5E7EB',
  },
  monthPickerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthPickerButtonPrimary: {
    backgroundColor: THEME_PRIMARY,
  },
  monthPickerButtonText: {
    color: '#111827',
    fontSize: sp(12),
    fontWeight: '500',
  },
  monthPickerButtonTextPrimary: {
    color: '#FFFFFF',
  },
  detailsSheet: {
    position: 'absolute',
    bottom: 0,
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
  detailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(18),
  },
  detailsTitle: {
    color: '#111827',
    fontSize: sp(20),
    fontWeight: '800',
  },
  detailsHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(16),
  },
  detailsIconButton: {
    width: ms(30),
    height: ms(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsIconText: {
    color: THEME_PRIMARY,
    fontSize: sp(12),
  },
  detailsFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ms(10),
  },
  detailsLabel: {
    color: '#111827',
    fontSize: sp(12),
    fontWeight: '500',
    flex: 1,
  },
  detailsValue: {
    color: '#7A7A7A',
    fontSize: sp(12),
    flex: 1,
    textAlign: 'right',
  },
  detailsCancelButton: {
    marginTop: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCancelText: {
    color: THEME_PRIMARY,
    fontSize: sp(12),
    fontWeight: '500',
  },
});

export default EmployeeManagementScreen;