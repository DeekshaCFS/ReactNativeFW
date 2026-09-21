// src/screens/admin/MainTaskFragmentNewScreen.tsx

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useFocusEffect} from '@react-navigation/native';
import {getTaskListSearchNew} from '../../api/taskList/taskListService';
import {getTaskTagList} from '../../api/task/taskService';
import type {TasksList, TasksListResultData, TagList, TagListResultData} from '../../api/task/task.types';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {HEADER_CONTENT_HEIGHT} from '../../components/AppHeader';
import {ms, sp} from '../../utils/responsive';

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
const THEME_PRIMARY = '#c3002f';

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

  const isAllData = useMemo(
    () =>
      Boolean(
        submittedSearch ||
          selectedType.id !== 0 ||
          selectedStatus.id !== 0 ||
          selectedTag.id !== 0,
      ),
    [selectedStatus.id, selectedTag.id, selectedType.id, submittedSearch],
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
        setTasks(previous => (replace ? nextTasks : [...previous, ...nextTasks]));
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
        isAllData: true,
      });
    },
    [fetchTaskPage],
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
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        loadCleanMonthTasks();
      }, 1000);
      return () => clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadCleanMonthTasks]),
  );

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

  const renderTask = ({item}: {item: TasksListResultData}) => {
    const status = getTaskStatus(item);
    const tagName = getTaskTagName(item);
    const address = getPrimaryAddress(item);
    const customerName = getString(item, 'CustomerName');
    const taskDateTime = formatTaskDateTime(item);
    const newTaskId = getNewTaskId(item);
    const statusColor =
      status.toLowerCase() === 'ongoing'
        ? '#FF9800'
        : status.toLowerCase() === 'inactive'
          ? '#7E8794'
          : THEME_PRIMARY;

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
        {tagName ? (
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
          {taskDateTime ? (
            <Text numberOfLines={1} style={styles.taskDateText}>
              {taskDateTime}
            </Text>
          ) : null}
          {address ? (
            <Text numberOfLines={1} style={styles.taskSubline}>
              {address}
            </Text>
          ) : null}
          <Text numberOfLines={1} style={styles.customerText}>
            {customerName || 'Customer'}
          </Text>
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
    <Modal
      animationType="fade"
      transparent
      visible={isMonthPickerOpen}
      onRequestClose={() => setIsMonthPickerOpen(false)}>
      <Pressable
        style={styles.monthPickerBackdrop}
        onPress={() => setIsMonthPickerOpen(false)}>
        <Pressable style={styles.monthPickerPanel} onPress={() => {}}>
          <View style={styles.monthPickerHeader}>
            <Text style={styles.monthPickerTitle}>Select month</Text>
            <Text style={styles.monthPickerSubtitle}>
              {formatMonthYearLabel(pendingMonth, pendingYear)}
            </Text>
          </View>

          <View style={styles.monthPickerBody}>
            <View style={styles.monthPickerColumn}>
              <Text style={styles.monthPickerColumnTitle}>Month</Text>
              <ScrollView style={styles.monthPickerList}>
                {pendingMonthOptions.map(option => {
                  const selected =
                    option.month === pendingMonth && option.year === pendingYear;
                  return (
                    <Pressable
                      key={`${option.year}-${option.month}`}
                      onPress={() => setPendingMonth(option.month)}
                      style={[
                        styles.monthPickerItem,
                        selected ? styles.monthPickerItemSelected : null,
                      ]}>
                      <Text
                        style={[
                          styles.monthPickerItemText,
                          selected ? styles.monthPickerItemTextSelected : null,
                        ]}>
                        {MONTH_LABELS[option.month - 1] ?? '---'}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.monthPickerColumn}>
              <Text style={styles.monthPickerColumnTitle}>Year</Text>
              <ScrollView style={styles.monthPickerList}>
                {yearOptions.map(value => {
                  const selected = value === pendingYear;
                  return (
                    <Pressable
                      key={String(value)}
                      onPress={() => {
                        const optionsForYear = monthOptions.filter(
                          option => option.year === value,
                        );
                        const fallbackMonth =
                          optionsForYear.find(
                            option => option.month === pendingMonth,
                          ) ?? optionsForYear[optionsForYear.length - 1];

                        setPendingYear(value);
                        if (fallbackMonth) {
                          setPendingMonth(fallbackMonth.month);
                        }
                      }}
                      style={[
                        styles.monthPickerItem,
                        selected ? styles.monthPickerItemSelected : null,
                      ]}>
                      <Text
                        style={[
                          styles.monthPickerItemText,
                          selected ? styles.monthPickerItemTextSelected : null,
                        ]}>
                        {value}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <View style={styles.monthPickerFooter}>
            <Pressable
              onPress={() => setIsMonthPickerOpen(false)}
              style={styles.monthPickerButton}>
              <Text style={styles.monthPickerButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (hasMonthYearOption(monthOptions, pendingMonth, pendingYear)) {
                  setOwnMonthYear({month: pendingMonth, year: pendingYear});
                }
                setIsMonthPickerOpen(false);
              }}
              style={[
                styles.monthPickerButton,
                styles.monthPickerButtonPrimary,
              ]}>
              <Text
                style={[
                  styles.monthPickerButtonText,
                  styles.monthPickerButtonTextPrimary,
                ]}>
                OK
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // In controlled/embedded mode the parent already drew the toolbar and month
  // row, so render exactly what this component used to render.
  const shell = (
    <View style={styles.fragmentShell}>
      <View style={styles.panelHeader}>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
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
            placeholderTextColor="#9E9E9E"
            style={styles.searchInput}
          />
          {searchText ? (
            <Pressable
              hitSlop={12}
              onPress={() => {
                setSearchText('');
                setSubmittedSearch('');
              }}>
              <Text style={styles.clearSearch}>×</Text>
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
            <Text style={styles.refreshIcon}>↻</Text>
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

      <Modal
        visible={tagModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTagModalVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setTagModalVisible(false)}>
          <Pressable style={styles.modalPanel}>
            <Text style={styles.modalTitle}>Select Task Tag</Text>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setSelectedTag({id: 0, name: 'Select Task Tag'});
                setTagModalVisible(false);
              }}>
              <Text style={styles.modalItemText}>All Tags</Text>
            </TouchableOpacity>
            {tags.length === 0 ? (
              <Text style={styles.modalHint}>No task tags returned.</Text>
            ) : (
              tags.map(tag => (
                <TouchableOpacity
                  key={tag.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedTag(tag);
                    setTagModalVisible(false);
                  }}>
                  <Text style={styles.modalItemText}>{tag.name}</Text>
                </TouchableOpacity>
              ))
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setStatusModalVisible(false)}>
          <Pressable style={styles.modalPanel}>
            <Text style={styles.modalTitle}>Status</Text>
            {TASK_STATUSES.map(status => (
              <TouchableOpacity
                key={status.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedStatus(status);
                  setStatusModalVisible(false);
                }}>
                <Text style={styles.modalItemText}>{status.label}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
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
    backgroundColor: '#D0003F',
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
    color: '#FFFFFF',
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
    height: ms(76),
    backgroundColor: THEME_PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: ms(46),
    paddingBottom: ms(18),
  },
  taskMonthText: {
    color: '#FFFFFF',
    fontSize: sp(24),
    fontWeight: '500',
  },
  taskMonthArrow: {
    marginLeft: ms(14),
    color: '#FFFFFF',
    fontSize: sp(28),
    lineHeight: sp(30),
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
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
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
    color: '#111827',
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
    color: '#111827',
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
    color: '#111827',
    fontSize: sp(15),
    fontWeight: '800',
  },
  monthPickerButtonTextPrimary: {
    color: '#FFFFFF',
  },
  fragmentShell: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: ms(40),
    borderTopRightRadius: ms(40),
    overflow: 'hidden',
  },
  panelHeader: {
    paddingHorizontal: ms(16),
    paddingTop: ms(22),
    paddingBottom: ms(12),
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ms(54),
    borderBottomWidth: ms(1),
    borderBottomColor: '#C8C8C8',
  },
  searchIcon: {
    width: ms(30),
    color: '#B2B2B2',
    fontSize: sp(26),
    lineHeight: sp(30),
  },
  searchInput: {
    flex: 1,
    height: ms(50),
    paddingHorizontal: ms(6),
    paddingVertical: 0,
    color: '#222222',
    fontSize: sp(20),
    fontWeight: '400',
  },
  clearSearch: {
    color: '#777777',
    fontSize: sp(36),
    lineHeight: sp(38),
    fontWeight: '300',
  },
  filterRow: {
    marginTop: ms(18),
    minHeight: ms(36),
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
    color: '#111111',
    fontSize: sp(17),
    fontWeight: '500',
  },
  filterChevron: {
    flexShrink: 0,
    marginLeft: ms(6),
    color: THEME_PRIMARY,
    fontSize: sp(20),
  },
  refreshButton: {
    width: ms(132),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    color: THEME_PRIMARY,
    fontSize: sp(16),
    fontWeight: '800',
  },
  refreshIcon: {
    marginLeft: ms(6),
    color: THEME_PRIMARY,
    fontSize: sp(28),
    lineHeight: sp(30),
    fontWeight: '800',
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
    minHeight: ms(118),
    borderWidth: ms(1),
    borderColor: '#E6E6E6',
    borderRadius: ms(12),
    marginTop: ms(12),
    marginBottom: ms(8),
    backgroundColor: '#FFFFFF',
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
    minWidth: ms(112),
    height: ms(32),
    borderBottomRightRadius: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(10),
    zIndex: 2,
  },
  tagRibbon: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: ms(156),
    maxWidth: '45%',
    height: ms(32),
    borderBottomLeftRadius: ms(14),
    backgroundColor: '#2B7BFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(10),
    zIndex: 2,
  },
  ribbonText: {
    color: '#FFFFFF',
    fontSize: sp(12),
    fontWeight: '800',
  },
  taskBody: {
    paddingTop: ms(48),
    paddingHorizontal: ms(16),
    paddingBottom: ms(16),
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: ms(138),
  },
  taskTitle: {
    color: '#20283A',
    fontSize: sp(17),
    fontWeight: '800',
    lineHeight: sp(22),
    maxWidth: '42%',
  },
  taskIdText: {
    marginLeft: ms(5),
    color: '#1976D2',
    fontSize: sp(13),
    fontWeight: '800',
  },
  taskDateText: {
    position: 'absolute',
    top: ms(52),
    right: ms(16),
    maxWidth: ms(136),
    color: '#777777',
    fontSize: sp(14),
    fontWeight: '500',
    textAlign: 'right',
  },
  taskSubline: {
    marginTop: ms(10),
    color: '#9AA1AE',
    fontSize: sp(16),
    fontWeight: '600',
  },
  customerText: {
    marginTop: ms(8),
    color: '#182032',
    fontSize: sp(16),
    fontWeight: '500',
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
    color: '#111827',
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
    backgroundColor: '#FFFFFF',
    borderRadius: ms(8),
    paddingVertical: ms(12),
  },
  modalTitle: {
    color: '#111827',
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
    color: '#1F2937',
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