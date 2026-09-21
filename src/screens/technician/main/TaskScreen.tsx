// src/screens/technician/main/TaskScreen.tsx
import React, { useState, useEffect, } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, Modal,
  FlatList, ActivityIndicator, Alert, Image, Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp, hp, HEADER_TOP_PADDING } from '../../../utils/responsive';
import { getTaskListSearchNew } from '../../../api/taskList/taskListService';
import { getTaskTagList } from '../../../api/task/taskService';
import { userPermissions } from '../../../api/userPermission/userPermissionService';
import { downloadReport } from '../../../api/report/reportService';
import type { TasksListResultData as Task, TagListResultData as TaskTag } from '../../../api/task/task.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DrumPicker from '../../../components/DrumPicker';
import { launchCamera } from 'react-native-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useTaskStatus } from '../../../hooks/useTaskStatus';

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'Completed': return styles.ribbonCompleted;
    case 'Rejected': return styles.ribbonRejected;
    case 'Ongoing': return styles.ribbonOngoing;
    case 'InActive': return styles.ribbonInactive;
    case 'OnHold': return styles.ribbonOnHold;
    default: return styles.ribbonInactive;
  }
};

export default function TaskScreen({ navigation, route }: any) {
  const [uid, setUid] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tagList, setTagList] = useState<TaskTag[]>([]);
  const [statusList, setStatusList] = useState<any[]>([]);

  const [selectedTag, setSelectedTag] = useState<TaskTag | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<any>(null);

  const [search, setSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [statusSearch, setStatusSearch] = useState('');

  const [pageIndex, setPageIndex] = useState(1);
  const [recordCount, setRecordCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [canDownloadReport, setCanDownloadReport] = useState(false);

  const [activeDropdown, setActiveDropdown] = useState<'TAG' | 'STATUS' | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const errorMessageRef = React.useRef<string | null>(null);
  const { acceptTask, rejectTask, errorMessage } = useTaskStatus();

  const [showLateRejectSheet, setShowLateRejectSheet] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectPhotos, setRejectPhotos] = useState<{ uri: string; base64?: string }[]>([]);
  const [lateRejectPhase, setLateRejectPhase] = useState<'confirm' | 'upload'>('confirm');

  const formatMonthYear = (date: Date) =>
    date.toLocaleString('en-IN', { month: 'short', year: 'numeric' });

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const getLast6Months = () => {
    const result: { month: number; year: number }[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({ month: d.getMonth(), year: d.getFullYear() });
    }
    return result.reverse();
  };

  const last6        = getLast6Months();
  const monthOptions = last6.map(d => MONTH_NAMES[d.month]);
  const yearOptions  = [...new Set(last6.map(d => String(d.year)))];

  const [tempMonthIdx, setTempMonthIdx] = useState(
    last6.findIndex(d => d.month === new Date().getMonth() && d.year === new Date().getFullYear())
  );
  const [tempYearIdx, setTempYearIdx] = useState(
    yearOptions.indexOf(String(new Date().getFullYear()))
  );

  const takePhoto = async (
    list: { uri: string; base64?: string }[],
    setList: React.Dispatch<React.SetStateAction<{ uri: string; base64?: string }[]>>,
    index: number,
  ) => {
    const result = await launchCamera({ mediaType: 'photo', includeBase64: true, quality: 0.7 });
    if (result.assets?.[0]) {
      const asset = result.assets[0];
      const updated = [...list];
      updated[index] = { uri: asset.uri!, base64: asset.base64 };
      setList(updated);
    }
  };

  const fetchTags = async () => {
    if (!ownerId) return;
    try {
      const response = await getTaskTagList({ UserId: ownerId });
      setTagList(response.ResultData || []);
    } catch (err: any) { /* silent */ }
  };

  useEffect(() => {
    setStatusList([
      { Id: 1, Name: 'Completed' },
      { Id: 2, Name: 'Rejected' },
      { Id: 3, Name: 'Ongoing' },
      { Id: 4, Name: 'InActive' },
      { Id: 5, Name: 'OnHold' },
    ]);
  }, []);

  const statusParam = selectedStatus === null ? 0 : selectedStatus.Id;

  useFocusEffect(
    React.useCallback(() => {
      if (sessionReady && uid && ownerId) fetchTasks(1, true);
    }, [sessionReady, uid, ownerId, selectedStatus, selectedTag, search, selectedDate])
  );

  const fetchTasks = async (page = 1, reset = false) => {
    if (!uid || !ownerId) return;
    if (reset) setTasks([]);
    try {
      setLoading(true);
      const response = await getTaskListSearchNew({
        UserId: uid,
        searchparam: search,
        TaskStatusID: statusParam,
        TaskTypeID: 0,
        pageIndex: page,
        TaskMonth: selectedDate.getMonth() + 1,
        TaskYear: selectedDate.getFullYear(),
        TaskTagId: selectedTag?.TaskTagId || 0,
        AllData: true,
      });
      const newTasks: Task[] = response.ResultData || [];
      const visibleTasks =
        selectedStatus == null
          ? newTasks.filter(t => t.TaskStatus !== 'Completed' && t.TaskStatus !== 'Rejected')
          : newTasks;
      const sortByIdDesc = (arr: Task[]) => [...arr].sort((a, b) => (b.Id ?? 0) - (a.Id ?? 0));
      setTasks(prev => reset ? sortByIdDesc(visibleTasks) : sortByIdDesc([...prev, ...visibleTasks]));
      setRecordCount(response.RecordCount || 0);
    } catch (err: any) { /* silent */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      const storedToken   = await AsyncStorage.getItem('token');
      const storedUid     = await AsyncStorage.getItem('uid');
      const storedOwnerId =
        await AsyncStorage.getItem('owner_id') ||
        await AsyncStorage.getItem('owner_id');

      setToken(storedToken);
      setUid(storedUid);
      setOwnerId(storedOwnerId);
      setSessionReady(true);

      if (storedUid && storedOwnerId) {
        try {
          const tagResponse = await getTaskTagList({ UserId: storedOwnerId });
          setTagList(tagResponse.ResultData || []);
        } catch { /* silent */ }

        try {
          const permRes = await userPermissions({ UserID: Number(storedUid) });
          const perms = permRes.ResultData || [];
          const taskPdfPerm =
            perms.find(p => p.Permissioncode === 'Task PDF') || perms[0];
          setCanDownloadReport(!!taskPdfPerm?.IsActive);
        } catch { /* silent — download icon just stays hidden */ }
      }
    };
    loadSession();
  }, []);

  const handleDownloadReport = async (task: Task) => {
    if (!uid) return;
    try {
      const res = await downloadReport({ UserId: Number(uid), TaskID: task.Id });
      if (res.Code === '200' && res.Message) {
        await Linking.openURL(res.Message);
      } else {
        Alert.alert('Download Failed', res.Message || 'Could not generate the report.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.Message || err?.message || 'Could not download the report.');
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setSelectedTag(null);
    setSelectedStatus(null);
    setSearch('');
    setSelectedDate(new Date());
    setPageIndex(1);
    //fetchTasks(1, true);
  };

  React.useEffect(()=> {
    errorMessageRef.current = errorMessage;
  }, [errorMessage]);

  const handleRejectTask = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Validation', 'Please enter reason');
      return;
    }
    const photosWithImage = rejectPhotos.filter(p => p?.base64);
    if (photosWithImage.length === 0) {
      Alert.alert('Validation', 'At least one image is mandatory to reject the task');
      return;
    }
    try {
      const success = await rejectTask(
        selectedTask!,
        Number(uid),
        rejectReason.trim(),
        photosWithImage,
      );
      if (!success) {
        Alert.alert('Error', errorMessageRef.current ?? 'Failed to reject task');
        return;
      }

      const rejectedId = selectedTask!.Id;
      setTasks(prev =>
        prev.map(t =>
          t.Id === rejectedId ? { ...t, TaskStatus: 'Rejected', TaskState: 0 } : t
        )
      );

      closeLateRejectSheet();

      fetchTasks(1, true);

      Alert.alert('Success', 'Task rejected successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to reject task');
    }
  };

  const closeLateRejectSheet = () => {
    setShowLateRejectSheet(false);
    setLateRejectPhase('confirm');
    setRejectReason('');
    setRejectPhotos([]);
  };

  const loadMore = () => {
    if (tasks.length >= recordCount) return;
    const nextPage = pageIndex + 1;
    setPageIndex(nextPage);
    fetchTasks(nextPage);
  };

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
        case 0: // NOT_STARTED 
        case 1: // STARTED_NOT_ENDED 
          navigation.navigate('TaskRouteMap', { task });
          break;
        case 2: // ENDED_NO_PAYMENT
          if (task.PaymentMode === 'Rate') {
            if (task.TaskClosureStatus === true) {
              navigation.navigate('PaymentReceived', { task });
            } else {
              navigation.navigate('TaskClosure', { task });
            }
          } else {
            navigation.navigate('TaskClosure', { task });
          }
          break;
        case 3: // PAYMENT_RECEIVED
          if (task.TaskClosureStatus !== true) {
            navigation.navigate('TaskClosure', { task });
          } else {
            Alert.alert('Task Completed', 'This task is completed and payment is received.');
          }
          break;
        case 4: // TASK_CLOSURE → fully closed (e.g. AMC, no payment step)
          Alert.alert('Task Closed', 'This task has already been closed.');
          break;
        default:
          navigation.navigate('TaskRouteMap', { task });
      }
      return;
    }

    // ── Pending / Not yet started ───────────────────────────────
    if (task.TaskState === 0 || task.TaskState === 1) {
      if (task.TaskStatus === 'InActive') {
        const taskDate = new Date(task.TaskDate);
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
        if (diffDays > 3) {
          setSelectedTask(task);
          setShowLateRejectSheet(true);
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
  };

  const getTaskTag = (task: Task) => {
    return task.Task_TagName &&
          task.Task_TagName.toUpperCase() !== 'NA'
      ? task.Task_TagName.toUpperCase()
      : null;
  };

  const renderItem = ({ item }: { item: Task }) => {
    const Task_Tag = getTaskTag(item);
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
              {canDownloadReport && item.TaskStatus === 'Completed' && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDownloadReport(item);
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="download-outline" size={sp(18)} style={[{color: COLORS.primary}, { marginLeft: sp(170) }]} />
                </Pressable>
              )}
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

  const renderPhotoSlots = (
    list: { uri: string; base64?: string }[],
    setList: React.Dispatch<React.SetStateAction<{ uri: string; base64?: string }[]>>,
  ) => (
    <View style={styles.photoRow}>
      {[0, 1, 2].map((i) => (
        <Pressable key={i} style={styles.photoBox} onPress={() => takePhoto(list, setList, i)}>
          {list[i]?.uri
            ? <Image source={{ uri: list[i].uri }} style={styles.photoThumb} />
            : <Ionicons name="camera-outline" size={sp(44)} color="#848891" />
          }
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.redBg} />

      <View style={styles.monthRow}>
        <Pressable style={styles.monthWrapper} 
          onPress={() => setShowMonthPicker(true)}
        >
          <Text style={styles.monthText}>{formatMonthYear(selectedDate)}</Text>
          <Ionicons name="chevron-down" size={sp(16)} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.whiteSheet}>
        <View style={styles.searchContainer}>
          {!search && <Ionicons name="search" size={sp(18)} color="#9CA3AF" />}
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Customer Or Task Id Number"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            cursorColor={COLORS.primary}
          />
          {search !== '' && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close" size={sp(18)} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        <View style={styles.filterRow}>
          <Pressable style={styles.filterItem} onPress={() => setActiveDropdown('TAG')}>
            <Text style={styles.filterText} numberOfLines={1}>
              {selectedTag?.TaskTagName || 'Select Task Tag'}
            </Text>
            <Ionicons name="chevron-down" size={sp(14)} color={COLORS.primary} />
          </Pressable>

          <Pressable style={styles.filterItem} onPress={() => setActiveDropdown('STATUS')}>
            <Text style={styles.filterText}>{selectedStatus?.Name || 'Status'}</Text>
            <Ionicons name="chevron-down" size={sp(14)} color={COLORS.primary} />
          </Pressable>

          <Pressable style={styles.refreshItem} onPress={handleRefresh}>
            <Text style={styles.refreshText}>Refresh</Text>
            <Ionicons name="refresh" size={sp(14)} color={COLORS.primary} />
          </Pressable>
        </View>

        {loading && pageIndex === 1 ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: vs(40) }} />
        ) : tasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image
              source={require('../../../../assets/images/noresultfound.png')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item, index) =>
              item?.Id ? String(item.NewTaskId) : index.toString()
            }
            renderItem={renderItem}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* TAG MODAL */}
      <Modal visible={activeDropdown === 'TAG'} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setActiveDropdown(null)} />
        <View style={styles.centerModal}>
          <Text style={styles.modalTitle}>Select Task Tag</Text>
          <View style={styles.modalSearchBox}>
            <TextInput
              value={tagSearch}
              onChangeText={setTagSearch}
              placeholder="Search..."
              placeholderTextColor="#9CA3AF"
              style={styles.modalSearchInput}
              cursorColor={COLORS.primary}
            />
          </View>
          <FlatList
            data={tagList.filter(tag =>
              tag.TaskTagName.toLowerCase().includes(tagSearch.toLowerCase())
            )}
            keyExtractor={(item, index) =>
              item?.TaskTagId ? item.TaskTagId.toString() : index.toString()
            }
            renderItem={({ item }) => (
              <Pressable style={styles.modalItem} onPress={() => {
                setSelectedTag(item); setTagSearch(''); setActiveDropdown(null);
              }}>
                <Text style={styles.itemText}>{item.TaskTagName}</Text>
              </Pressable>
            )}
            style={{ maxHeight: vs(220) }}
            showsVerticalScrollIndicator
            bounces={false}
          />
        </View>
      </Modal>

      {/* STATUS MODAL */}
      <Modal visible={activeDropdown === 'STATUS'} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setActiveDropdown(null)} />
        <View style={styles.centerModal}>
          <Text style={styles.modalTitle}>Select Status</Text>
          <View style={styles.modalSearchBox}>
            <TextInput
              value={statusSearch}
              onChangeText={setStatusSearch}
              placeholder="Search..."
              placeholderTextColor="#9CA3AF"
              style={styles.modalSearchInput}
              cursorColor={COLORS.primary}
            />
          </View>
          <FlatList
            data={statusList.filter(item =>
              item.Name.toLowerCase().includes(statusSearch.toLowerCase())
            )}
            keyExtractor={(item, index) =>
              item?.Id !== undefined ? item.Id.toString() : index.toString()
            }
            renderItem={({ item }) => (
              <Pressable style={styles.modalItem} onPress={() => {
                setSelectedStatus({ Id: item.Id, Name: item.Name });
                setStatusSearch(''); setActiveDropdown(null);
              }}>
                <Text style={styles.itemText}>{item.Name}</Text>
              </Pressable>
            )}
            style={{ maxHeight: vs(220) }}
            showsVerticalScrollIndicator
            bounces={false}
          />
        </View>
      </Modal>

      {/* MONTH PICKER MODAL */}
      <Modal visible={showMonthPicker} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowMonthPicker(false)} />
        <View style={styles.centerModal}>
          <View style={{ flexDirection: 'row', paddingHorizontal: scale(16) }}>
            <DrumPicker data={monthOptions} selectedIndex={tempMonthIdx} onSelect={setTempMonthIdx} />
            <DrumPicker data={yearOptions} selectedIndex={tempYearIdx} onSelect={setTempYearIdx} />
          </View>
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#eee', marginTop: vs(12) }}>
            <Pressable style={{ flex: 1, paddingVertical: vs(14), alignItems: 'center' }} onPress={() => setShowMonthPicker(false)}>
              <Text style={{ fontSize: sp(15), color: '#888' }}>Cancel</Text>
            </Pressable>
            <Pressable
              style={{ flex: 1, paddingVertical: vs(14), alignItems: 'center' }}
              onPress={() => {
                const selected = last6[tempMonthIdx];
                if (selected) setSelectedDate(new Date(selected.year, selected.month, 1));
                setShowMonthPicker(false);
              }}
            >
              <Text style={{ fontSize: sp(15), color: COLORS.primary, fontWeight: '600' }}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* LATE REJECT SHEET */}
      <Modal visible={showLateRejectSheet} transparent animationType="slide">
        <View style={styles.overlay} />
        <View style={styles.bottomSheet}>
          <Pressable style={styles.closeBtn} onPress={closeLateRejectSheet}>
            <Ionicons name="close" size={sp(22)} color="#fff" />
          </Pressable>

          <Text style={styles.sheetTitle}>{selectedTask?.Name}</Text>
          <Text style={styles.sheetText}>
            It's too Late to Accept the Task !{'\n'}
            Do you wish to proceed for Reject the task ?
          </Text>

          {lateRejectPhase === 'confirm' ? (
            <View style={[styles.btnRow, { marginTop: 'auto' }]}>
              <Pressable style={styles.cancelBtn} onPress={closeLateRejectSheet}>
                <Text style={styles.btnText}>CANCEL</Text>
              </Pressable>
              <Pressable style={styles.rejectBtn} onPress={() => setLateRejectPhase('upload')}>
                <Text style={styles.btnText}>REJECT</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {renderPhotoSlots(rejectPhotos, setRejectPhotos)}
              <View style={styles.inputBox}>
                <TextInput
                  placeholder="Reason for Reject"
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  style={{ flex: 1, fontSize: sp(16) }}
                />
                <Ionicons name="alert-circle-outline" size={sp(26)} color="#F97316" />
              </View>
              <View style={styles.btnRow}>
                <Pressable style={styles.cancelBtn} onPress={closeLateRejectSheet}>
                  <Text style={styles.btnText}>CANCEL</Text>
                </Pressable>
                <Pressable style={styles.rejectBtn} onPress={handleRejectTask}>
                  <Text style={styles.btnText}>REJECT</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: COLORS.primary },
  redBg:      { height: HEADER_TOP_PADDING + hp(1), backgroundColor: COLORS.primary },

  whiteSheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    padding: scale(14),
  },

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

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(5),
  },

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

  dateText: {
    fontSize: sp(12),
    color: '#4f5258',
    flexShrink: 0,
  },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(6),
  },

  title: {
    fontSize: sp(15),
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: scale(5),
  },

  taskId: {
    color: '#2563EB',
    fontWeight: '500',
    fontSize: sp(15),
    marginRight: scale(15),
  },

  address:  { marginBottom: vs(6), fontSize: sp(13), color: '#898e98', width: '60%' },
  customer: { marginRight: scale(6), fontSize: sp(13), color: '#171a1e' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: scale(14),
    height: vs(44),
    borderBottomWidth: 1,
    borderColor: '#222222',
    marginBottom: vs(14),
  },

  searchInput: {
    flex: 1,
    marginLeft: scale(8),
    fontSize: sp(15),
    color: '#222222',
  },

  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(16),
  },

  filterItem:  { flexDirection: 'row', alignItems: 'center', gap: scale(4), flex: 1, marginRight: scale(8) },
  filterText:  { fontSize: sp(13), color: '#111827', flexShrink: 1 },

  refreshItem: { flexDirection: 'row', alignItems: 'center', gap: scale(4) },
  refreshText: { fontSize: sp(13), color: COLORS.primary, fontWeight: '600' },

  monthRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: scale(20),
    paddingVertical: vs(6),
  },

  monthWrapper: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
  monthText:    { color: '#fff', fontSize: sp(16), fontWeight: '500' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },

  centerModal: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    right: '10%',
    backgroundColor: '#fff',
    padding: scale(16),
    borderRadius: scale(12),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  modalTitle: { fontSize: sp(18), fontWeight: '500', marginBottom: vs(12), color: '#717171e4' },

  modalSearchBox: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: scale(10),
    paddingHorizontal: scale(10),
    marginBottom: vs(12),
    height: vs(42),
    justifyContent: 'center',
  },

  modalSearchInput: { fontSize: sp(16), fontWeight: '400', color: '#111' },

  modalItem:  { paddingVertical: vs(10), paddingHorizontal: scale(16) },
  itemText:   { fontSize: sp(15), fontWeight: '400' },

  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    maxWidth: scale(560),
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    padding: scale(20),
    paddingBottom: vs(30),
    minHeight: vs(200),
  },

  closeBtn: {
    position: 'absolute',
    top: vs(10),
    right: scale(12),
    backgroundColor: COLORS.primary,
    borderRadius: scale(20),
    padding: scale(6),
  },

  sheetTitle: {
    fontSize: sp(20),
    fontWeight: '400',
    marginBottom: vs(10),
    marginTop: vs(10),
  },

  sheetText: {
    fontSize: sp(15),
    color: COLORS.black,
    marginBottom: vs(15),
  },

  photoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(20),
    marginBottom: vs(16),
  },

  photoBox: {
    width: scale(82),
    height: vs(90),
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  photoThumb: { width: '100%', height: '100%' },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(30),
    paddingHorizontal: scale(12),
    marginBottom: vs(32),
    height: vs(48),
  },

  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(10),
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: '#9CA3AF',
    padding: vs(10),
    borderRadius: scale(25),
    alignItems: 'center',
  },

  rejectBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: vs(10),
    borderRadius: scale(25),
    alignItems: 'center',
  },

  btnText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: sp(18),
  },

  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: vs(4),
  },

  leftCol: { flex: 1, marginRight: scale(12) },
  rightCol: { alignItems: 'flex-end' },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(4),
  },

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

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyImage: {
    width: scale(220),
    height: scale(220),
  },
});