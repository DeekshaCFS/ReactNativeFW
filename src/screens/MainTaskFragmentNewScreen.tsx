import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  type TaskListItem,
  type TaskListResponse,
  type TaskTag,
  type TaskTagResponse,
  touchlessApi,
} from '../api/Api';

type MainTaskFragmentNewScreenProps = {
  userId: number;
  month: number;
  year: number;
  onTaskSelect?: (task: TaskListItem) => void;
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

const getResultData = <T,>(response: {
  resultData?: T[] | null;
  ResultData?: T[] | null;
}) => response.resultData ?? response.ResultData ?? [];

const getCode = (response: {code?: string; Code?: string}) =>
  String(response.code ?? response.Code ?? '');

const getMessage = (response: {message?: string; Message?: string}) =>
  String(response.message ?? response.Message ?? '').trim();

const getNumber = (
  item: TaskListItem,
  camelKey: keyof TaskListItem,
  pascalKey: keyof TaskListItem,
) => {
  const value = item[camelKey] ?? item[pascalKey];
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getString = (
  item: TaskListItem,
  camelKey: keyof TaskListItem,
  pascalKey: keyof TaskListItem,
) => {
  const value = item[camelKey] ?? item[pascalKey];
  return typeof value === 'string' ? value.trim() : '';
};

const getTaskId = (item: TaskListItem) => getNumber(item, 'id', 'Id');

const getTaskTitle = (item: TaskListItem) =>
  getString(item, 'name', 'Name') || `Task #${getTaskId(item) || '-'}`;

const getNewTaskId = (item: TaskListItem) =>
  getString(item, 'newTaskId', 'NewTaskId') ||
  getString(item, 'newTaskID', 'NewTaskID');

const getTaskStatus = (item: TaskListItem) =>
  getString(item, 'taskStatus', 'TaskStatus') || 'Unknown';

const getTaskType = (item: TaskListItem) =>
  getString(item, 'taskType', 'TaskType') || 'Task';

const getTaskDate = (item: TaskListItem) =>
  getString(item, 'taskDate', 'TaskDate');

const getTaskTime = (item: TaskListItem) =>
  getString(item, 'taskTime', 'TaskTime');

const getTaskTagName = (item: TaskListItem) =>
  getString(item, 'task_TagName', 'Task_TagName') ||
  getString(item, 'taskTagName', 'TaskTagName');

const getPrimaryAddress = (item: TaskListItem) =>
  getString(item, 'fullAddress', 'FullAddress') ||
  getString(item, 'locationName', 'LocationName') ||
  getString(item, 'locationDesc', 'LocationDesc');

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

const formatTaskDateTime = (item: TaskListItem) => {
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

const isSuccessOrNoData = (response: TaskListResponse | TaskTagResponse) => {
  const code = getCode(response);
  return code === '200' || code === '500' || code === '';
};

const normalizeTag = (tag: TaskTag) => {
  const id = Number(tag.taskTagId ?? tag.TaskTagId);
  const name = String(tag.taskTagName ?? tag.TaskTagName ?? '').trim();
  return {
    id: Number.isFinite(id) ? id : 0,
    name,
  };
};

const MainTaskFragmentNewScreen = ({
  userId,
  month,
  year,
  onTaskSelect,
}: MainTaskFragmentNewScreenProps) => {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
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
        const response = await touchlessApi.getTaskList({
          userId,
          searchParam,
          statusId,
          taskTypeId,
          pageIndex: nextPage,
          month,
          year,
          taskTagId,
          isAllData: allData,
        });

        if (requestId !== latestRequestId.current) {
          return;
        }

        if (!isSuccessOrNoData(response)) {
          throw new Error(getMessage(response) || 'Unable to load task list.');
        }

        const nextTasks = getResultData<TaskListItem>(response);
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
      const response = await touchlessApi.getTaskTags({userId});
      if (!isSuccessOrNoData(response)) {
        return;
      }

      setTags(
        getResultData<TaskTag>(response)
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
    loadCleanMonthTasks();
  }, [month, year]);

  useEffect(() => {
    if (!didSkipInitialFilterLoad.current) {
      didSkipInitialFilterLoad.current = true;
      return;
    }

    fetchTaskPage({nextPage: PAGE_START, replace: true});
  }, [submittedSearch, selectedStatus.id, selectedTag.id, selectedType.id]);

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

  const handleTaskPress = (task: TaskListItem) => {
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

  const renderTask = ({item}: {item: TaskListItem}) => {
    const status = getTaskStatus(item);
    const tagName = getTaskTagName(item);
    const address = getPrimaryAddress(item);
    const customerName = getString(item, 'customerName', 'CustomerName');
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

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>!</Text>
        <Text style={styles.emptyTitle}>
          {errorMessage ? 'Unable to Load Tasks' : 'No Result Found'}
        </Text>
        <Text style={styles.emptyText}>
          {errorMessage || 'Try another search, status, tag, or refresh the list.'}
        </Text>
      </View>
    );
  };

  return (
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
            <Text style={styles.filterChevron}>⌄</Text>
          </Pressable>
          <Pressable
            style={styles.filterButton}
            onPress={() => setStatusModalVisible(true)}>
            <Text numberOfLines={1} style={styles.filterText}>
              {selectedStatus.label}
            </Text>
            <Text style={styles.filterChevron}>⌄</Text>
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
};

const styles = StyleSheet.create({
  fragmentShell: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
  },
  panelHeader: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 12,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderBottomWidth: 1,
    borderBottomColor: '#C8C8C8',
  },
  searchIcon: {
    width: 30,
    color: '#B2B2B2',
    fontSize: 26,
    lineHeight: 30,
  },
  searchInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 6,
    paddingVertical: 0,
    color: '#222222',
    fontSize: 20,
    fontWeight: '400',
  },
  clearSearch: {
    color: '#777777',
    fontSize: 36,
    lineHeight: 38,
    fontWeight: '300',
  },
  filterRow: {
    marginTop: 18,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  filterText: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '500',
  },
  filterChevron: {
    marginLeft: 'auto',
    color: THEME_PRIMARY,
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '800',
  },
  refreshButton: {
    width: 132,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    color: THEME_PRIMARY,
    fontSize: 16,
    fontWeight: '800',
  },
  refreshIcon: {
    marginLeft: 6,
    color: THEME_PRIMARY,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '800',
  },
  loadingOverlay: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#4B5563',
    fontSize: 13,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 124,
  },
  taskCard: {
    minHeight: 118,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 8,
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
    minWidth: 112,
    height: 32,
    borderBottomRightRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    zIndex: 2,
  },
  tagRibbon: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 156,
    maxWidth: '45%',
    height: 32,
    borderBottomLeftRadius: 14,
    backgroundColor: '#2B7BFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    zIndex: 2,
  },
  ribbonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  taskBody: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 138,
  },
  taskTitle: {
    color: '#20283A',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    maxWidth: '42%',
  },
  taskIdText: {
    marginLeft: 5,
    color: '#1976D2',
    fontSize: 13,
    fontWeight: '800',
  },
  taskDateText: {
    position: 'absolute',
    top: 52,
    right: 16,
    maxWidth: 136,
    color: '#777777',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  taskSubline: {
    marginTop: 10,
    color: '#9AA1AE',
    fontSize: 16,
    fontWeight: '600',
  },
  customerText: {
    marginTop: 8,
    color: '#182032',
    fontSize: 16,
    fontWeight: '500',
  },
  listFooter: {
    paddingVertical: 18,
  },
  emptyState: {
    flex: 1,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#F2F4F7',
    color: '#98A2B3',
    fontSize: 28,
    fontWeight: '800',
  },
  emptyTitle: {
    marginTop: 12,
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 6,
    color: '#667085',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  modalPanel: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '76%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
  },
  modalTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  modalItem: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalItemText: {
    color: '#1F2937',
    fontSize: 15,
  },
  modalHint: {
    color: '#667085',
    fontSize: 13,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

export default MainTaskFragmentNewScreen;
