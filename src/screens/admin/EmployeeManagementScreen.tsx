import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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

type EmployeeManagementScreenProps = {
  ownerId: number;
  onMenuPress?: () => void;
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
const DEFAULT_PROFILE_ICON = require('../../../assets/images/image.png');
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
const LEAVE_STATUS_OPTIONS: FilterOption[] = [
  {id: 0, label: 'Approved'},
  {id: 1, label: 'Pending'},
  {id: 2, label: 'Approved'},
  {id: 3, label: 'Declined'},
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

const EmployeeManagementScreen = ({ownerId, onMenuPress}: EmployeeManagementScreenProps) => {
  const [activeTab, setActiveTab] = useState<EmployeeTab>('employee');
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [leaves, setLeaves] = useState<LeaveListItem[]>([]);
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
  const [selectedLeaveStatus, setSelectedLeaveStatus] = useState<FilterOption>(
    LEAVE_STATUS_OPTIONS[0],
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
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeListItem | null>(
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

  const handleEditEmployee = (_item: EmployeeListItem) => {
    Alert.alert('Employee Details', 'Edit is not available right now.');
  };

  const handleDeleteEmployee = (item: EmployeeListItem) => {
    Alert.alert(
      'Delete Employee',
      `Are you sure you want to delete ${getEmployeeName(item)}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Employee Details', 'Delete is not available right now.');
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
    const role = String(item.UserGroupName ?? 'Employee').trim();
    const designation = String(item.DesignationName ?? 'NA').trim();
    const zone = String(item.ZoneName ?? 'NA').trim();

    return (
      <Pressable
        style={styles.employeeCard}
        onPress={() => setSelectedEmployee(item)}>
        <View style={styles.avatarColumn}>
          <Image
            source={item.ProfileImage ? {uri: item.ProfileImage} : DEFAULT_PROFILE_ICON}
            style={styles.avatar}
          />
          <View
            style={[
              styles.attendancePill,
              isPresent ? styles.attendancePresent : null,
            ]}>
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
                Number(battery ?? 0) <= 0 ? styles.metricValueDanger : null,
              ]}>
              {getBatteryLabel(battery)}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>GPS</Text>
            <Text style={[styles.metricValue, gpsOn ? null : styles.metricValueDanger]}>
              {gpsOn ? 'On' : 'Off'}
            </Text>
          </View>
        </View>

        <View style={styles.employeeSide}>
          <View style={styles.roleRibbon}>
            <Text numberOfLines={1} style={styles.roleRibbonText}>
              {role.toUpperCase()}
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.sideText}>
            {designation}
          </Text>
          <Text numberOfLines={1} style={styles.sideText}>
            {zone}
          </Text>
          <View style={styles.trackRow}>
            <Text style={styles.calendarIcon}>▣</Text>
            <Pressable style={styles.trackButton}>
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

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>!</Text>
        <Text style={styles.emptyTitle}>
          {errorMessage ? 'Unable to Load Employees' : 'No Result Found'}
        </Text>
        <Text style={styles.emptyText}>
          {errorMessage || 'Try another search or refresh the list.'}
        </Text>
      </View>
    );
  };

  const renderLeave = ({item}: {item: LeaveListItem}) => {
    const status = String(item.LeaveStatusName ?? 'Pending').trim();
    const statusColor =
      status.toLowerCase() === 'approved'
        ? '#00C900'
        : status.toLowerCase() === 'declined'
          ? THEME_PRIMARY
          : '#0000FF';
    const leaveType = String(item.LeaveType ?? 'Full Day').trim();
    const isHalfDay = leaveType.toLowerCase().includes('half');
    const employeeName = getLeaveEmployeeName(item);
    const employeeCode = item.UserID ? `EMP${item.UserID}` : item.UserName ?? '';
    const startDate = formatDate(item.LeaveStartDate);
    const endDate = formatDate(item.LeaveEndDate);

    return (
      <View style={styles.leaveCard}>
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
      </View>
    );
  };

  const renderLeaveEmpty = () => {
    if (isLeaveInitialLoading) {
      return null;
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>!</Text>
        <Text style={styles.emptyTitle}>
          {leaveErrorMessage ? 'Unable to Load Leave Requests' : 'No Result Found'}
        </Text>
        <Text style={styles.emptyText}>
          {leaveErrorMessage || 'Try another search, status, or month.'}
        </Text>
      </View>
    );
  };

  const renderEmployeeTab = () => (
    <>
      <View style={styles.actionArea}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={submitSearch}
              returnKeyType="search"
              placeholder="Search"
              placeholderTextColor="#A3A3A3"
              style={styles.searchInput}
            />
            {searchText ? (
              <Pressable
                hitSlop={10}
                onPress={() => {
                  setSearchText('');
                  setSubmittedSearch('');
                }}>
                <Text style={styles.clearText}>×</Text>
              </Pressable>
            ) : null}
          </View>
          <Pressable style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Emp</Text>
          </Pressable>
          <Pressable style={styles.downloadButton} onPress={refreshList}>
            <Text style={styles.downloadIcon}>⇩</Text>
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          <Pressable
            style={styles.filterButton}
            onPress={() => setFilterModal('type')}>
            <Text numberOfLines={1} style={styles.filterText}>
              {selectedType.label}
            </Text>
            <Text style={styles.filterChevron}>⌄</Text>
          </Pressable>
          <Pressable
            style={styles.filterButton}
            onPress={() => setFilterModal('zone')}>
            <Text numberOfLines={1} style={styles.filterText}>
              {selectedZone.label}
            </Text>
            <Text style={styles.filterChevron}>⌄</Text>
          </Pressable>
          <Pressable
            style={styles.filterButton}
            onPress={() => setFilterModal('status')}>
            <Text numberOfLines={1} style={styles.filterText}>
              {selectedStatus.label}
            </Text>
            <Text style={styles.filterChevron}>⌄</Text>
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

  const renderLeaveTab = () => (
    <View style={styles.leaveShell}>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          editable={false}
          placeholder="Search"
          placeholderTextColor="#A3A3A3"
          style={styles.searchInput}
        />
      </View>
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>!</Text>
        <Text style={styles.emptyTitle}>No Result Found</Text>
        <Text style={styles.emptyText}>Leave request data is not available.</Text>
      </View>
    </View>
  );

  const renderLeaveRequestTab = () => (
    <>
      <View style={styles.leaveToolbar}>
        <View style={styles.leaveSearchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={leaveSearchText}
            onChangeText={setLeaveSearchText}
            onSubmitEditing={submitLeaveSearch}
            returnKeyType="search"
            placeholder="Search"
            placeholderTextColor="#A3A3A3"
            style={styles.searchInput}
          />
          {leaveSearchText ? (
            <Pressable
              hitSlop={10}
              onPress={() => {
                setLeaveSearchText('');
                setSubmittedLeaveSearch('');
              }}>
              <Text style={styles.clearText}>×</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={styles.leaveStatusButton}
          onPress={() => setLeaveFilterModal('leaveStatus')}>
          <Text numberOfLines={1} style={styles.leaveFilterText}>
            {selectedLeaveStatus.label}
          </Text>
          <Text style={styles.leaveFilterChevron}>⌄</Text>
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
          <Text style={styles.leaveFilterChevron}>⌄</Text>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={onMenuPress} style={styles.headerIconButton}>
          <Text style={styles.headerIconText}>{'\u2630'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employee List</Text>
        <View style={styles.headerRightActions}>
          <Text style={styles.headerIconText}>{'\uD83C\uDFA7'}</Text>
          <Text style={styles.headerIconText}>{'\uD83D\uDD14'}</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabButton, activeTab === 'employee' ? styles.tabActive : null]}
          onPress={() => setActiveTab('employee')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'employee' ? styles.tabTextActive : null,
            ]}>
            EMPLOYEE LIST
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'leave' ? styles.tabActive : null]}
          onPress={() => setActiveTab('leave')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'leave' ? styles.tabTextActive : null,
            ]}>
            LEAVE REQUEST
          </Text>
        </Pressable>
      </View>

      {activeTab === 'employee' ? renderEmployeeTab() : renderLeaveRequestTab()}

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
                      <Text style={styles.detailsIconText}>✎</Text>
                    </Pressable>
                    <Pressable
                      hitSlop={10}
                      onPress={() => handleCallEmployee(selectedEmployee)}
                      style={styles.detailsIconButton}>
                      <Text style={styles.detailsIconText}>☎</Text>
                    </Pressable>
                    <Pressable
                      hitSlop={10}
                      onPress={() => handleWhatsAppEmployee(selectedEmployee)}
                      style={styles.detailsIconButton}>
                      <Text style={styles.detailsIconText}>💬</Text>
                    </Pressable>
                    <Pressable
                      hitSlop={10}
                      onPress={() => handleDeleteEmployee(selectedEmployee)}
                      style={styles.detailsIconButton}>
                      <Text style={styles.detailsIconText}>🗑</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME_PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  headerIconButton: {
    padding: 4,
  },
  headerIconText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shell: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabRow: {
    height: 74,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#FFF4F7',
    borderBottomColor: THEME_PRIMARY,
  },
  tabText: {
    color: '#7A7A7A',
    fontSize: 16,
    fontWeight: '800',
  },
  tabTextActive: {
    color: THEME_PRIMARY,
  },
  actionArea: {
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchBox: {
    flex: 1,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#BDBDBD',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    color: '#B0B0B0',
    fontSize: 30,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#1F2937',
    fontSize: 20,
    paddingVertical: 0,
  },
  clearText: {
    color: '#B0B0B0',
    fontSize: 40,
    lineHeight: 42,
  },
  addButton: {
    height: 48,
    minWidth: 84,
    borderRadius: 18,
    backgroundColor: '#070707',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    elevation: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  downloadButton: {
    width: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadIcon: {
    color: THEME_PRIMARY,
    fontSize: 42,
    lineHeight: 44,
    fontWeight: '700',
  },
  filterRow: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
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
    color: '#111111',
    fontSize: 16,
    fontWeight: '600',
  },
  filterChevron: {
    color: THEME_PRIMARY,
    fontSize: 30,
    lineHeight: 30,
    marginLeft: 8,
  },
  loadingOverlay: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 98,
  },
  employeeCard: {
    minHeight: 164,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    flexDirection: 'row',
    marginBottom: 22,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.13,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
  },
  avatarColumn: {
    width: 112,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#EEE6F8',
  },
  attendancePill: {
    marginTop: 14,
    minWidth: 96,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#D1003E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  attendancePresent: {
    backgroundColor: '#08A864',
  },
  attendanceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  employeeInfo: {
    flex: 1,
    paddingTop: 28,
    paddingBottom: 22,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  employeeName: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '900',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricLabel: {
    color: '#777777',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 52,
  },
  metricValue: {
    color: '#00C970',
    fontSize: 16,
    fontWeight: '900',
  },
  metricValueDanger: {
    color: THEME_PRIMARY,
  },
  employeeSide: {
    width: 136,
    alignItems: 'flex-end',
    paddingBottom: 18,
  },
  roleRibbon: {
    alignSelf: 'stretch',
    height: 42,
    borderBottomLeftRadius: 20,
    backgroundColor: '#2E7BFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  roleRibbonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  sideText: {
    maxWidth: 112,
    marginTop: 18,
    marginRight: 14,
    color: THEME_PRIMARY,
    fontSize: 13,
    fontWeight: '900',
  },
  trackRow: {
    alignSelf: 'stretch',
    marginTop: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarIcon: {
    color: '#111111',
    fontSize: 28,
    lineHeight: 30,
  },
  trackButton: {
    minWidth: 76,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5A5A5A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  listFooter: {
    paddingVertical: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F4F6',
    color: THEME_PRIMARY,
    textAlign: 'center',
    lineHeight: 42,
    fontSize: 24,
    fontWeight: '900',
  },
  emptyTitle: {
    marginTop: 14,
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  leaveToolbar: {
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  leaveSearchBox: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 160,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#BDBDBD',
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  leaveStatusButton: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 108,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leaveMonthButton: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 126,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leaveFilterText: {
    flex: 1,
    color: '#111111',
    fontSize: 17,
    fontWeight: '600',
  },
  leaveFilterChevron: {
    color: THEME_PRIMARY,
    fontSize: 28,
    lineHeight: 28,
    marginLeft: 2,
  },
  leaveListContent: {
    paddingHorizontal: 28,
    paddingTop: 10,
    paddingBottom: 98,
  },
  leaveCard: {
    minHeight: 168,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    marginBottom: 30,
    paddingTop: 62,
    paddingHorizontal: 18,
    paddingBottom: 18,
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
  },
  leaveTypeRibbon: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 146,
    height: 42,
    borderTopLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  leaveTypeRibbonHalf: {
    backgroundColor: '#303832',
  },
  leaveTypeRibbonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  leaveDatePill: {
    position: 'absolute',
    right: 18,
    top: 0,
    height: 42,
    maxWidth: 260,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  leaveCreatedText: {
    color: '#555555',
    fontSize: 17,
    fontWeight: '700',
  },
  leaveTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  leaveEmployeeName: {
    flex: 1,
    color: '#111111',
    fontSize: 17,
    fontWeight: '600',
  },
  leaveEmployeeCode: {
    color: '#555555',
    fontWeight: '700',
  },
  leaveRoleText: {
    width: 128,
    color: '#1E90FF',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
  },
  leaveDetailRow: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  leaveReasonRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaveLabel: {
    color: '#555555',
    fontSize: 16,
    fontWeight: '700',
  },
  leaveDateGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leaveValue: {
    flex: 1,
    color: THEME_PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  leaveStatusLabel: {
    color: '#555555',
    fontSize: 16,
    fontWeight: '700',
  },
  leaveStatusGroup: {
    minWidth: 154,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  leaveStatusValue: {
    minWidth: 72,
    fontSize: 16,
    fontWeight: '700',
  },
  leaveReasonValue: {
    flex: 1,
    color: THEME_PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  leaveShell: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.36)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalPanel: {
    maxHeight: '72%',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  monthModalPanel: {
    maxHeight: '82%',
  },
  modalTitle: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalItem: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F4',
  },
  modalItemActive: {
    backgroundColor: '#FDE7EE',
  },
  modalItemText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },
  modalItemTextActive: {
    color: THEME_PRIMARY,
    fontWeight: '900',
  },
  monthPickerBody: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    maxHeight: 430,
  },
  monthPickerColumn: {
    flex: 1,
    maxHeight: 340,
  },
  monthPickerColumnTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '900',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  monthPickerFooter: {
    height: 54,
    flexDirection: 'row',
    borderTopWidth: 1,
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
    fontSize: 15,
    fontWeight: '900',
  },
  monthPickerButtonTextPrimary: {
    color: '#FFFFFF',
  },
  detailsSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 28,
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  detailsTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
  },
  detailsHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailsIconButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsIconText: {
    color: THEME_PRIMARY,
    fontSize: 18,
  },
  detailsFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  detailsLabel: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  detailsValue: {
    color: '#7A7A7A',
    fontSize: 15,
    flex: 1,
    textAlign: 'right',
  },
  detailsCancelButton: {
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCancelText: {
    color: THEME_PRIMARY,
    fontSize: 16,
    fontWeight: '800',
  },
});

export default EmployeeManagementScreen;