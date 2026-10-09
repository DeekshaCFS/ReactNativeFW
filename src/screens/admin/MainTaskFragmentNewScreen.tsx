// src/screens/admin/MainTaskFragmentNewScreen.tsx

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useFocusEffect} from '@react-navigation/native';
import {getTaskListSearchNew} from '../../api/taskList/taskListService';
import {getTaskTagList} from '../../api/task/taskService';
import type {TasksList, TasksListResultData, TagList, TagListResultData} from '../../api/task/task.types';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {HEADER_CONTENT_HEIGHT} from '../../components/AppHeader';
import {ms, sp} from '../../utils/responsive';
import {COLORS} from '../../theme/theme';
import SearchPickerModal from '../../components/SearchPickerModal';
import MonthYearPickerDialog from '../../components/MonthYearPickerDialog';
import {ResetIcon} from '../../components/FocRequestCard';
import AddTaskModal, {
  buildTaskFormValues,
  type AddTaskInitialValues,
  type TaskFormMode,
} from './AddTaskModal';

// TasksListAdapter's textView_reassign_from_list: edit icon for InActive,
// re-assign icon for Completed / Rejected / OnHold, nothing for Ongoing.
// MainTaskFragmentNew then opens updateTaskDialog / reAssignCompletedTaskDialog /
// reAssignOnholdTaskDialog / reAssignTaskDialog respectively.
const getTaskRowAction = (status: string): Exclude<TaskFormMode, 'add'> | null => {
  switch (status.replace(/\s/g, '').toLowerCase()) {
    case 'inactive':
      return 'edit';
    case 'completed':
      return 'reassignCompleted';
    case 'onhold':
    case 'rejected':
      return 'reassign';
    default:
      return null;
  }
};

type MainTaskFragmentNewScreenProps = {
  userId: number;
  /**
   * Legacy embedded mode. HomeActivityNewScreen still renders this component
   * inside its own `activeTab === 'task'` branch and draws the red toolbar +
   * month row itself. When `month`/`year` are supplied the component treats
   * itself as controlled and renders no header of its own.
   *
   * When mounted as a real `AdminTabs` route these are omitted, the component
   * owns the selected month/year, and it draws its own header + picker.
   * Both props go away once HomeActivityNewScreen's internal task branch is
   * deleted.
   */
  month?: number;
  year?: number;
  onTaskSelect?: (task: TasksListResultData) => void;
  /** Opens the Add Task flow (Java main_task_fragment "+ Task" button). */
  onAddTask?: () => void;
};

type MonthYearOption = {
  month: number;
  year: number;
};

type StatusFilter = {
  id: number;
  label: string;
};

type TypeFilter = {
  id: number;
  label: string;
};

type FetchTaskPageOptions = {
  nextPage: number;
  replace: boolean;
  refreshing?: boolean;
  searchParam?: string;
  statusId?: number;
  taskTypeId?: number;
  taskTagId?: number;
  isAllData?: boolean;
};

const PAGE_START = 1;
const THEME_PRIMARY = COLORS.primary;

const TASK_TYPES: TypeFilter[] = [
  {id: 0, label: 'Type'},
  {id: 1, label: 'Urgent'},
  {id: 2, label: 'Today'},
  {id: 3, label: 'Schedule'},
];

const TASK_STATUSES: StatusFilter[] = [
  {id: 0, label: 'Status'},
  {id: 1, label: 'Completed'},
  {id: 2, label: 'Rejected'},
  {id: 3, label: 'Ongoing'},
  {id: 4, label: 'InActive'},
  {id: 5, label: 'OnHold'},
];

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

const getRecentTaskMonthOptions = (): MonthYearOption[] => {
  const now = new Date();
  return Array.from({length: 3}, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (2 - index), 1);
    return {
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };
  });
};

const getDefaultTaskMonthYear = () => {
  const options = getRecentTaskMonthOptions();
  return options[options.length - 1];
};

const formatMonthYearLabel = (month: number, year: number) => {
  const monthLabel =
    MONTH_LABELS[Math.max(1, Math.min(12, month)) - 1] ?? '---';
  return `${monthLabel} ${year}`;
};

const hasMonthYearOption = (
  options: MonthYearOption[],
  month: number,
  year: number,
) => options.some(option => option.month === month && option.year === year);

const getResultData = <T,>(response: {
  resultData?: T[] | null;
  ResultData?: T[] | null;
}) => response.resultData ?? response.ResultData ?? [];

const getCode = (response: {code?: string; Code?: string}) =>
  String(response.code ?? response.Code ?? '');

const getMessage = (response: {message?: string; Message?: string}) =>
  String(response.message ?? response.Message ?? '').trim();

const getNumber = (
  item: TasksListResultData,
  key: keyof TasksListResultData,
) => {
  const value = item[key];
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getString = (
  item: TasksListResultData,
  key: keyof TasksListResultData,
) => {
  const value = item[key];
  return typeof value === 'string' ? value.trim() : '';
};

const getTaskId = (item: TasksListResultData) => getNumber(item, 'Id');

const getTaskTitle = (item: TasksListResultData) =>
  getString(item, 'Name') || `Task #${getTaskId(item) || '-'}`;

const getNewTaskId = (item: TasksListResultData) =>
  getString(item, 'NewTaskId');

const getTaskStatus = (item: TasksListResultData) =>
  getString(item, 'TaskStatus') || 'Unknown';

const getTaskType = (item: TasksListResultData) =>
  getString(item, 'TaskType') || 'Task';

const getTaskDate = (item: TasksListResultData) =>
  getString(item, 'TaskDate');

const getTaskTime = (item: TasksListResultData) =>
  getString(item, 'TaskTime');

const getTaskTagName = (item: TasksListResultData) =>
  getString(item, 'Task_TagName');

const getPrimaryAddress = (item: TasksListResultData) =>
  getString(item, 'FullAddress') ||
  getString(item, 'LocationName') ||
  getString(item, 'LocationDesc');

const parseDateRobust = (dateStr: string) => {
  if (!dateStr) {
    return new Date(NaN);
  }

  // 1. Try standard parsing
  let date = new Date(dateStr);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  // 2. Try YYYY-MM-DD HH:mm:ss (often fails without T)
  const isoLike = dateStr.replace(' ', 'T');
  date = new Date(isoLike);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  // 3. Try DD-MM-YYYY or DD/MM/YYYY
  const parts = dateStr.split(/[-/]/);
  if (parts.length >= 3) {
    const p0 = Number(parts[0]);
    const p1 = Number(parts[1]);
    const p2 = Number(parts[2]);

    // Assume DD-MM-YYYY if p2 is a 4-digit year and p0 <= 31
    if (p2 > 1000 && p0 <= 31 && p1 <= 12) {
      return new Date(p2, p1 - 1, p0);
    }
    // Assume YYYY-MM-DD if p0 is a 4-digit year
    if (p0 > 1000 && p1 <= 12 && p2 <= 31) {
      return new Date(p0, p1 - 1, p2);
    }
  }

  return new Date(NaN);
};

const formatTaskDateTime = (item: TasksListResultData) => {
  const taskDate = getTaskDate(item);
  if (!taskDate) {
    return '';
  }

  const date = parseDateRobust(taskDate);
  if (Number.isNaN(date.getTime())) {
    return taskDate;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const dateLabel = `${day}-${month}-${year}`;
  const time = getTaskTime(item).split('.')[0];
  if (!time) {
    return dateLabel;
  }

  const [hourRaw = '0', minuteRaw = '0'] = time.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return dateLabel;
  }

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${dateLabel} ${String(hour12).padStart(2, '0')}:${String(
    minute,
  ).padStart(2, '0')} ${suffix}`;
};

const isSuccessOrNoData = (response: TasksList | TagList) => {
  const code = getCode(response);
  return code === '200' || code === '500' || code === '';
};

const normalizeTag = (tag: TagListResultData) => {
  const id = Number(tag.TaskTagId);
  const name = String(tag.TaskTagName ?? '').trim();
  return {
    id: Number.isFinite(id) ? id : 0,
    name,
  };
};

const MainTaskFragmentNewScreen = ({
  userId,
  month: controlledMonth,
  year: controlledYear,
  onTaskSelect,
  onAddTask,
}: MainTaskFragmentNewScreenProps) => {
  // Controlled (legacy embedded) only when BOTH are supplied by the parent.
  const isControlled =
    controlledMonth !== undefined && controlledYear !== undefined;
  const insets = useSafeAreaInsets();

  const [ownMonthYear, setOwnMonthYear] = useState(getDefaultTaskMonthYear);
  const month = isControlled ? (controlledMonth as number) : ownMonthYear.month;
  const year = isControlled ? (controlledYear as number) : ownMonthYear.year;

  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pendingMonth, setPendingMonth] = useState(month);
  const [pendingYear, setPendingYear] = useState(year);
  const monthOptions = useMemo(() => getRecentTaskMonthOptions(), []);
  const yearOptions = useMemo(
    () =>
      Array.from(new Set(monthOptions.map(option => option.year))).sort(
        (first, second) => second - first,
      ),
    [monthOptions],
  );
  const pendingMonthOptions = useMemo(
    () => monthOptions.filter(option => option.year === pendingYear),
    [monthOptions, pendingYear],
  );

  const openMonthPicker = () => {
    setPendingMonth(month);
    setPendingYear(year);
    setIsMonthPickerOpen(true);
  };

  const [tasks, setTasks] = useState<TasksListResultData[]>([]);
  const [tags, setTags] = useState<Array<{id: number; name: string}>>([]);
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [selectedType, setSelectedType] = useState<TypeFilter>(TASK_TYPES[0]);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>(
    TASK_STATUSES[0],
  );
  const [selectedTag, setSelectedTag] = useState({id: 0, name: 'Select Task Tag'});
  const [pageIndex, setPageIndex] = useState(PAGE_START);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLastPage, setIsLastPage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const latestRequestId = useRef(0);
  const didSkipInitialFilterLoad = useRef(false);
  const didHandleInitialMonthYear = useRef(false);

  // Java (MainTaskFragmentNew): getTaskList() sends isAllData=false only when no
  // status/type filter is set AND the selected month is the current month; any
  // status/type filter or a past month sends true. The server leaves completed
  // tasks out when isAllData is false, so Completed tasks stay hidden on the
  // default list and only appear through the Status filter.
  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return month === now.getMonth() + 1 && year === now.getFullYear();
  }, [month, year]);

  const isAllData = useMemo(
    () => !(selectedStatus.id === 0 && selectedType.id === 0 && isCurrentMonth),
    [selectedStatus.id, selectedType.id, isCurrentMonth],
  );

  const fetchTaskPage = useCallback(
    async ({
      nextPage,
      replace,
      refreshing = false,
      searchParam = submittedSearch,
      statusId = selectedStatus.id,
      taskTypeId = selectedType.id,
      taskTagId = selectedTag.id,
      isAllData: allData = isAllData,
    }: FetchTaskPageOptions) => {
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
        const response = await getTaskListSearchNew({
          UserId: userId,
          searchparam: searchParam,
          TaskStatusID: statusId,
          TaskTypeID: taskTypeId,
          pageIndex: nextPage,
          TaskMonth: month,
          TaskYear: year,
          TaskTagId: taskTagId,
          AllData: allData,
        });

        if (requestId !== latestRequestId.current) {
          return;
        }

        if (!isSuccessOrNoData(response)) {
          throw new Error(getMessage(response) || 'Unable to load task list.');
        }

        const nextTasks = getResultData<TasksListResultData>(response);
        // Completed tasks stay hidden until the Status filter asks for them
        // (same rule as the technician TaskScreen).
        const visibleTasks =
          statusId === 0
            ? nextTasks.filter(
                task => getTaskStatus(task).toLowerCase() !== 'completed',
              )
            : nextTasks;
        setTasks(previous =>
          replace ? visibleTasks : [...previous, ...visibleTasks],
        );
        setPageIndex(nextPage);
        setIsLastPage(nextTasks.length === 0);
      } catch (error) {
        if (requestId !== latestRequestId.current) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load task list right now.';
        setErrorMessage(message);
        if (replace) {
          setTasks([]);
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
      isAllData,
      month,
      selectedStatus.id,
      selectedTag.id,
      selectedType.id,
      submittedSearch,
      userId,
      year,
    ],
  );

  const loadTags = useCallback(async () => {
    try {
      const response = await getTaskTagList({userId});
      if (!isSuccessOrNoData(response)) {
        return;
      }

      setTags(
        getResultData<TagListResultData>(response)
          .map(normalizeTag)
          .filter(tag => tag.id > 0 && tag.name),
      );
    } catch {
      setTags([]);
    }
  }, [userId]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const loadCleanMonthTasks = useCallback(
    (refreshing = false) => {
      fetchTaskPage({
        nextPage: PAGE_START,
        replace: true,
        refreshing,
        searchParam: '',
        statusId: 0,
        taskTypeId: 0,
        taskTagId: 0,
        // No status/type filter here, so this is Java's isAllData rule for an
        // unfiltered list: false in the current month, true for other months.
        isAllData: !isCurrentMonth,
      });
    },
    [fetchTaskPage, isCurrentMonth],
  );

  useEffect(() => {
    setSearchText('');
    setSubmittedSearch('');
    setSelectedType(TASK_TYPES[0]);
    setSelectedStatus(TASK_STATUSES[0]);
    setSelectedTag({id: 0, name: 'Select Task Tag'});

    if (!didHandleInitialMonthYear.current) {
      // First run (mount): the focus effect below owns the very first load,
      // on its own delay -- see the comment there. Firing a second, undelayed
      // request here as well would race it.
      didHandleInitialMonthYear.current = true;
      return;
    }

    loadCleanMonthTasks();
  }, [month, year]);

  useEffect(() => {
    if (!didSkipInitialFilterLoad.current) {
      didSkipInitialFilterLoad.current = true;
      return;
    }

    fetchTaskPage({nextPage: PAGE_START, replace: true});
  }, [submittedSearch, selectedStatus.id, selectedTag.id, selectedType.id]);

  // The legacy Java screen is a Fragment that gets destroyed and recreated
  // every time the Task tab is opened (FragmentTransaction.replace), so
  // MainTaskFragmentNew.onCreateView() -- and its initial getTaskList() call
  // -- reruns on every visit. React Navigation's bottom tabs keep this
  // screen mounted after the first visit instead of remounting it, so a
  // plain mount effect only ever fires once and can't be trusted to survive
  // the tab's lazy-mount timing. Fetching on every focus -- including the
  // first one -- makes the list load every time the tab is opened, matching
  // the Java app.
  //
  // Crucially, Java's onCreateView() never calls getTaskList() directly --
  // it always routes the *first* call through mockingNetworkDelay(), which
  // deliberately waits 1 second before firing, and since the fragment is
  // recreated on every visit, that applies to every open, not just the
  // very first. RN's fetch here was firing the instant the screen mounted
  // or refocused, with no delay at all -- and it turns out that's too
  // early: the exact same request that comes back empty on a cold open
  // succeeds a moment later (e.g. via a manual "Refresh List" tap).
  // Matching Java's delay on every open fixes that.
  // Keep the latest loader in a ref so the focus effect below depends on focus
  // only, not on every filter change.
  const loadCleanMonthTasksRef = useRef(loadCleanMonthTasks);
  useEffect(() => {
    loadCleanMonthTasksRef.current = loadCleanMonthTasks;
  });

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        loadCleanMonthTasksRef.current();
      }, 1000);
      return () => clearTimeout(timer);
    }, []),
  );

  const [taskFormValues, setTaskFormValues] = useState<AddTaskInitialValues | null>(null);

  const resetAndLoad = () => {
    setSearchText('');
    setSubmittedSearch('');
    setSelectedType(TASK_TYPES[0]);
    setSelectedStatus(TASK_STATUSES[0]);
    setSelectedTag({id: 0, name: 'Select Task Tag'});
    loadCleanMonthTasks();
  };

  const submitSearch = () => {
    setSubmittedSearch(searchText.trim());
  };

  const handleTaskPress = (task: TasksListResultData) => {
    if (onTaskSelect) {
      onTaskSelect(task);
      return;
    }
    const status = getTaskStatus(task);
    const taskId = getTaskId(task);
    const newTaskId = getNewTaskId(task);
    Alert.alert(
      getTaskTitle(task),
      [
        newTaskId ? `Task ID: ${newTaskId}` : taskId ? `Task ID: ${taskId}` : '',
        `Status: ${status}`,
        `Type: ${getTaskType(task)}`,
        getTaskDate(task) ? `Date: ${getTaskDate(task)}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    );
  };

  // Icon only for now. Java: TasksListAdapter -> TechDashboardFragmentNew.getDownloadReport()
  // GETs the report endpoint (UserId, TaskID); the response Message is the PDF URL,
  // which DownloadFile saves under getExternalFilesDir(DIRECTORY_DOWNLOADS) and opens
  // through the app FileProvider.
  const handleDownloadReport = (_task: TasksListResultData) => {};

  const renderTask = ({item}: {item: TasksListResultData}) => {
    const status = getTaskStatus(item);
    const tagName = getTaskTagName(item);
    const address = getPrimaryAddress(item);
    const assignedTo = getString(item, 'AssignedTo') || getString(item, 'CustomerName');
    const wages = Number(item.WagesPerHours) || 0;
    const taskDateTime = formatTaskDateTime(item);
    const newTaskId = getNewTaskId(item);
    const rowAction = getTaskRowAction(status);
    // Java: TasksListAdapter's per-status color switch (R.color.green/red/onhold/orange/light_gray).
    // Matches the technician TaskScreen's ribbon colors for consistency across the app.
    const statusColor =
      status.toLowerCase() === 'completed'
        ? COLORS.statusCompleted
        : status.toLowerCase() === 'onhold'
          ? COLORS.statusOnHold
          : status.toLowerCase() === 'ongoing'
            ? COLORS.statusOngoing
            : status.toLowerCase() === 'inactive'
              ? COLORS.statusInactive
              : COLORS.statusRejected; // Rejected, and any other status, stays red
    // Java (TasksListAdapter): owners get the PDF download icon on a Completed
    // task once payment is received and the closure is done.
    const showDownload =
      status.toLowerCase() === 'completed' &&
      item.TaskState === 3 &&
      item.TaskClosureStatus === true;

    return (
      <TouchableOpacity
        activeOpacity={0.78}
        style={styles.taskCard}
        onPress={() => handleTaskPress(item)}>
        <View style={[styles.statusRibbon, {backgroundColor: statusColor}]}>
          <Text numberOfLines={1} style={styles.ribbonText}>
            {status.toUpperCase()}
          </Text>
        </View>
        {tagName && tagName.toUpperCase() !== 'NA' ? (
          <View style={styles.tagRibbon}>
            <Text numberOfLines={1} style={styles.ribbonText}>
              {tagName.toUpperCase()}
            </Text>
          </View>
        ) : null}

        <View style={styles.taskBody}>
          <View style={styles.taskTitleRow}>
            <Text numberOfLines={1} style={styles.taskTitle}>
              {getTaskTitle(item)}
            </Text>
            {newTaskId ? (
              <Text numberOfLines={1} style={styles.taskIdText}>
                [{newTaskId}]
              </Text>
            ) : null}
          </View>
          {showDownload ? (
            <TouchableOpacity
              style={styles.rowDownloadButton}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Download report"
              onPress={() => handleDownloadReport(item)}>
              <Ionicons name="download-outline" style={styles.rowDownloadIcon} />
            </TouchableOpacity>
          ) : null}
          {rowAction ? (
            <TouchableOpacity
              style={[
                styles.rowActionButton,
                showDownload ? styles.rowActionButtonWithDownload : null,
              ]}
              hitSlop={10}
              onPress={() => setTaskFormValues(buildTaskFormValues(item, rowAction))}>
              <Ionicons
                name={rowAction === 'edit' ? 'create-outline' : 'refresh'}
                style={styles.rowActionIcon}
              />
            </TouchableOpacity>
          ) : null}
          {taskDateTime ? (
            <Text numberOfLines={1} style={styles.taskDateText}>
              {taskDateTime}
            </Text>
          ) : null}
          {address ? (
            <Text numberOfLines={2} style={styles.taskSubline}>
              {address}
            </Text>
          ) : null}
          <Text numberOfLines={1} style={styles.customerText}>
            {assignedTo || 'Customer'}
          </Text>
          {wages > 0 ? (
            <Text numberOfLines={1} style={styles.taskAmountText}>
              {'\u20B9'} {wages.toFixed(3)}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderListFooter = () =>
    isLoadingMore ? (
      <View style={styles.listFooter}>
        <ActivityIndicator color={THEME_PRIMARY} size="small" />
      </View>
    ) : null;

  const renderEmpty = () => {
    if (isInitialLoading) {
      return null;
    }

    if (errorMessage) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>!</Text>
          <Text style={styles.emptyTitle}>Unable to Load Tasks</Text>
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

  const monthPicker = (
    <MonthYearPickerDialog
      visible={isMonthPickerOpen}
      variant="holo"
      minYear={Math.min(...yearOptions, year)}
      maxYear={Math.max(...yearOptions, year)}
      activatedMonth={month - 1}
      activatedYear={year}
      onCancel={() => setIsMonthPickerOpen(false)}
      onConfirm={(m, y) => {
        setIsMonthPickerOpen(false);
        if (hasMonthYearOption(monthOptions, m + 1, y)) {
          setOwnMonthYear({month: m + 1, year: y});
        }
      }}
    />
  );

  // In controlled/embedded mode the parent already drew the toolbar and month
  // row, so render exactly what this component used to render.
  const shell = (
    <View style={styles.fragmentShell}>
      <View style={styles.panelHeader}>
        <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" style={styles.searchIcon} />
          <TextInput
            value={searchText}
            onChangeText={value => {
              setSearchText(value.slice(0, 25));
              if (!value.trim() && submittedSearch) {
                setSubmittedSearch('');
              }
            }}
            onSubmitEditing={submitSearch}
            returnKeyType="search"
            placeholder="Customer Or Task Id Number"
            placeholderTextColor={COLORS.lightGray}
            style={styles.searchInput}
          />
          {searchText ? (
            <Pressable
              hitSlop={12}
              onPress={() => {
                setSearchText('');
                setSubmittedSearch('');
              }}>
              <Ionicons name="close" style={styles.clearSearch} />
            </Pressable>
          ) : null}
        </View>
        {onAddTask ? (
          <Pressable style={styles.addTaskButton} onPress={onAddTask}>
            <Text style={styles.addTaskText}>+ Task</Text>
          </Pressable>
        ) : null}
        </View>

        <View style={styles.filterRow}>
          <Pressable
            style={styles.filterButton}
            onPress={() => setTagModalVisible(true)}>
            <Text numberOfLines={1} style={styles.filterText}>
              {selectedTag.name}
            </Text>
            <Ionicons name="chevron-down" style={styles.filterChevron} />
          </Pressable>
          <Pressable
            style={styles.filterButton}
            onPress={() => setStatusModalVisible(true)}>
            <Text numberOfLines={1} style={styles.filterText}>
              {selectedStatus.label}
            </Text>
            <Ionicons name="chevron-down" style={styles.filterChevron} />
          </Pressable>
          <Pressable style={styles.refreshButton} onPress={resetAndLoad}>
            <Text style={styles.refreshText}>Refresh List</Text>
            <View style={styles.refreshIcon}>
              <ResetIcon size={ms(24)} />
            </View>
          </Pressable>
        </View>
      </View>

      {isInitialLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={THEME_PRIMARY} />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      ) : null}

      <FlatList
        data={tasks}
        keyExtractor={(item, index) => `${getTaskId(item) || index}-${index}`}
        renderItem={renderTask}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderListFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            colors={[THEME_PRIMARY]}
            tintColor={THEME_PRIMARY}
            onRefresh={() => loadCleanMonthTasks(true)}
          />
        }
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (!isInitialLoading && !isLoadingMore && !isLastPage) {
            fetchTaskPage({nextPage: pageIndex + 1, replace: false});
          }
        }}
      />

      <SearchPickerModal
        visible={tagModalVisible}
        title="Select Task Tag"
        options={tags.map(tag => ({id: tag.id, label: tag.name}))}
        emptyText="No task tags returned."
        onClose={() => setTagModalVisible(false)}
        onSelect={option => {
          setSelectedTag({id: option.id, name: option.label});
          setTagModalVisible(false);
        }}
      />

      <SearchPickerModal
        visible={statusModalVisible}
        title="Status"
        options={TASK_STATUSES.filter(status => status.id !== 0).map(status => ({
          id: status.id,
          label: status.label,
        }))}
        onClose={() => setStatusModalVisible(false)}
        onSelect={option => {
          const status = TASK_STATUSES.find(item => item.id === option.id);
          if (status) {
            setSelectedStatus(status);
          }
          setStatusModalVisible(false);
        }}
      />

      <AddTaskModal
        visible={taskFormValues !== null}
        ownerId={userId}
        initialValues={taskFormValues}
        onClose={() => setTaskFormValues(null)}
        onSaved={resetAndLoad}
      />
    </View>
  );

  if (isControlled) {
    return shell;
  }

  // The menu/title/notification row used to be drawn here; it's now the
  // shared AppHeader rendered once by AdminTabs above the tab bar. Only the
  // month picker row below is specific to this screen, so it's all that's
  // left here — offset by the header's height so it doesn't render
  // underneath it.
  return (
    <View style={styles.screen}>
      <View style={[styles.taskHeader, { paddingTop: insets.top + HEADER_CONTENT_HEIGHT }]}>
        <Pressable style={styles.taskMonthRow} onPress={openMonthPicker}>
          <Text style={styles.taskMonthText}>
            {formatMonthYearLabel(month, year)}
          </Text>
          <Ionicons name="chevron-down" style={styles.taskMonthArrow} />
        </Pressable>
      </View>

      <View style={styles.taskContentContainer}>{shell}</View>

      {monthPicker}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME_PRIMARY,
  },
  taskHeader: {
    backgroundColor: THEME_PRIMARY,
  },
  taskToolbar: {
    height: ms(64),
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(20),
    elevation: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 3},
  },
  taskToolbarMenu: {
    width: ms(38),
    height: ms(38),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  taskToolbarTitle: {
    flex: 1,
    marginLeft: ms(26),
    color: COLORS.white,
    fontSize: sp(24),
    fontWeight: '800',
  },
  taskToolbarActions: {
    width: ms(142),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskToolbarIconSpacing: {
    width: ms(36),
    textAlign: 'center',
  },
  taskMonthRow: {
    height: ms(49),
    backgroundColor: THEME_PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: ms(30),
    paddingBottom: ms(6),
  },
  taskMonthText: {
    color: COLORS.white,
    fontSize: sp(17),
    fontWeight: '500',
  },
  taskMonthArrow: {
    marginLeft: ms(10),
    color: COLORS.white,
    fontSize: sp(20),
    lineHeight: sp(22),
  },
  taskContentContainer: {
    flex: 1,
    backgroundColor: THEME_PRIMARY,
  },
  monthPickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(22),
  },
  monthPickerPanel: {
    width: '100%',
    maxWidth: ms(360),
    backgroundColor: COLORS.white,
    borderRadius: ms(10),
    overflow: 'hidden',
  },
  monthPickerHeader: {
    paddingHorizontal: ms(18),
    paddingTop: ms(16),
    paddingBottom: ms(12),
    borderBottomWidth: ms(1),
    borderBottomColor: '#E5E7EB',
  },
  monthPickerTitle: {
    color: COLORS.textBlack,
    fontSize: sp(18),
    fontWeight: '800',
  },
  monthPickerSubtitle: {
    marginTop: ms(6),
    color: '#6B7280',
    fontSize: sp(14),
    fontWeight: '600',
  },
  monthPickerBody: {
    flexDirection: 'row',
    paddingHorizontal: ms(12),
    paddingVertical: ms(14),
    gap: ms(10),
  },
  monthPickerColumn: {
    flex: 1,
    minWidth: 0,
  },
  monthPickerColumnTitle: {
    color: COLORS.textBlack,
    fontSize: sp(13),
    fontWeight: '700',
    paddingHorizontal: ms(6),
    paddingBottom: ms(8),
  },
  monthPickerList: {
    maxHeight: ms(240),
    borderWidth: ms(1),
    borderColor: '#E5E7EB',
    borderRadius: ms(8),
  },
  monthPickerItem: {
    minHeight: ms(44),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(10),
  },
  monthPickerItemSelected: {
    backgroundColor: 'rgba(195,0,47,0.12)',
  },
  monthPickerItemText: {
    color: COLORS.textBlack,
    fontSize: sp(16),
    fontWeight: '600',
  },
  monthPickerItemTextSelected: {
    color: THEME_PRIMARY,
    fontWeight: '800',
  },
  monthPickerFooter: {
    flexDirection: 'row',
    borderTopWidth: ms(1),
    borderTopColor: '#E5E7EB',
  },
  monthPickerButton: {
    flex: 1,
    paddingVertical: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthPickerButtonPrimary: {
    backgroundColor: THEME_PRIMARY,
  },
  monthPickerButtonText: {
    color: COLORS.textBlack,
    fontSize: sp(15),
    fontWeight: '800',
  },
  monthPickerButtonTextPrimary: {
    color: COLORS.white,
  },
  fragmentShell: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    overflow: 'hidden',
  },
  panelHeader: {
    paddingHorizontal: ms(12),
    paddingTop: ms(14),
    paddingBottom: ms(8),
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTaskButton: {
    marginLeft: ms(10),
    width: ms(60),
    height: ms(30),
    borderRadius: ms(15),
    backgroundColor: COLORS.textBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTaskText: {
    color: COLORS.white,
    fontSize: sp(12),
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    height: ms(40),
    paddingHorizontal: ms(8),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkGray,
  },
  searchIcon: {
    color: COLORS.lightGray,
    fontSize: ms(20),
    marginRight: ms(8),
  },
  searchInput: {
    flex: 1,
    height: ms(40),
    paddingHorizontal: 0,
    paddingVertical: 0,
    color: COLORS.textBlack,
    fontSize: sp(14),
  },
  clearSearch: {
    color: COLORS.textBlack,
    fontSize: ms(20),
  },
  filterRow: {
    marginTop: ms(10),
    minHeight: ms(30),
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: ms(8),
  },
  filterText: {
    flex: 1,
    color: COLORS.textBlack,
    fontSize: sp(14),
  },
  filterChevron: {
    flexShrink: 0,
    marginLeft: ms(6),
    color: THEME_PRIMARY,
    fontSize: sp(16),
  },
  refreshButton: {
    width: ms(112),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    color: THEME_PRIMARY,
    fontSize: sp(13),
    fontWeight: '700',
  },
  refreshIcon: {
    marginLeft: ms(5),
  },
  loadingOverlay: {
    paddingVertical: ms(20),
    alignItems: 'center',
  },
  loadingText: {
    marginTop: ms(8),
    color: '#4B5563',
    fontSize: sp(13),
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: ms(20),
    paddingTop: ms(2),
    paddingBottom: ms(124),
  },
  taskCard: {
    minHeight: ms(96),
    borderWidth: ms(1),
    borderColor: '#E6E6E6',
    borderRadius: ms(10),
    marginTop: ms(8),
    marginBottom: ms(6),
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 2},
  },
  statusRibbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    minWidth: ms(80),
    height: ms(20),
    borderBottomRightRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(10),
    zIndex: 2,
  },
  tagRibbon: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: ms(100),
    maxWidth: '45%',
    height: ms(20),
    borderBottomLeftRadius: ms(10),
    backgroundColor: COLORS.tagBlue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(10),
    zIndex: 2,
  },
  ribbonText: {
    color: COLORS.white,
    fontSize: sp(10),
    fontWeight: '700',
  },
  taskBody: {
    paddingTop: ms(26),
    paddingHorizontal: ms(12),
    paddingBottom: ms(10),
  },
  rowActionButton: {
    position: 'absolute',
    right: ms(100),
    bottom: ms(8),
    padding: ms(4),
  },
  rowActionButtonWithDownload: {
    right: ms(128),
  },
  rowDownloadButton: {
    position: 'absolute',
    right: ms(100),
    bottom: ms(8),
    padding: ms(4),
  },
  rowDownloadIcon: {
    fontSize: sp(20),
    color: COLORS.primary,
  },
  rowActionIcon: {
    fontSize: sp(20),
    color: THEME_PRIMARY,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: ms(110),
  },
  taskTitle: {
    color: COLORS.ink,
    fontSize: sp(16),
    fontWeight: '700',
    lineHeight: sp(20),
    maxWidth: '42%',
  },
  taskIdText: {
    marginLeft: ms(5),
    color: COLORS.linkBlue,
    fontSize: sp(12),
    fontWeight: '700',
  },
  taskDateText: {
    position: 'absolute',
    top: ms(28),
    right: ms(12),
    maxWidth: ms(136),
    color: '#777777',
    fontSize: sp(11),
    fontWeight: '500',
    textAlign: 'right',
  },
  taskSubline: {
    marginTop: ms(5),
    paddingRight: '38%',
    color: COLORS.lightGray,
    fontSize: sp(12),
  },
  customerText: {
    marginTop: ms(5),
    color: COLORS.ink,
    fontSize: sp(12),
  },
  taskAmountText: {
    position: 'absolute',
    right: ms(12),
    bottom: ms(10),
    color: THEME_PRIMARY,
    fontSize: sp(12),
    fontWeight: '700',
  },
  listFooter: {
    paddingVertical: ms(18),
  },
  emptyState: {
    flex: 1,
    minHeight: ms(300),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(28),
  },
  emptyIcon: {
    width: ms(52),
    height: ms(52),
    borderRadius: ms(26),
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#F2F4F7',
    color: '#98A2B3',
    fontSize: sp(28),
    fontWeight: '800',
  },
  emptyImage: {
    width: ms(220),
    height: ms(220),
  },
  emptyTitle: {
    marginTop: ms(12),
    color: COLORS.textBlack,
    fontSize: sp(17),
    fontWeight: '700',
  },
  emptyText: {
    marginTop: ms(6),
    color: '#667085',
    textAlign: 'center',
    fontSize: sp(13),
    lineHeight: sp(18),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(22),
  },
  modalPanel: {
    width: '100%',
    maxWidth: ms(360),
    maxHeight: '76%',
    backgroundColor: COLORS.white,
    borderRadius: ms(8),
    paddingVertical: ms(12),
  },
  modalTitle: {
    color: COLORS.textBlack,
    fontSize: sp(17),
    fontWeight: '700',
    paddingHorizontal: ms(16),
    paddingBottom: ms(8),
  },
  modalItem: {
    minHeight: ms(44),
    justifyContent: 'center',
    paddingHorizontal: ms(16),
  },
  modalItemText: {
    color: COLORS.textBlack,
    fontSize: sp(15),
  },
  modalHint: {
    color: '#667085',
    fontSize: sp(13),
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
  },
});

export default MainTaskFragmentNewScreen;