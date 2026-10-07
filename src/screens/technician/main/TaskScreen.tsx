// src/screens/technician/main/TaskScreen.tsx
import { launchCameraWithPermission } from '../../../utils/cameraPermission';
import React, { useState, useEffect, } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  FlatList, ActivityIndicator, Alert, Image, Linking,
} from 'react-native';
import Modal from '../../../components/AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp, ms, useAppHeaderHeight } from '../../../utils/responsive';
import TaskListCard from '../../../components/TaskListCard';
import { getTaskListSearchNew } from '../../../api/taskList/taskListService';
import { getTaskTagList } from '../../../api/task/taskService';
import { getTaskDoc } from '../../../api/taskList/taskListService';
import type { GetPostedTaskDocFile } from '../../../api/taskList/taskList.types';
import TaskAttachmentsSheet from '../../../components/TaskAttachmentsSheet';
import TaskTrackingSheet from '../../../components/TaskTrackingSheet';
import { getPendingTasks } from '../../../offline/offlineStore';
import { userPermissions } from '../../../api/userPermission/userPermissionService';
import { downloadReport } from '../../../api/report/reportService';
import type { TasksListResultData as Task, TagListResultData as TaskTag } from '../../../api/task/task.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DrumPicker from '../../../components/DrumPicker';
import { useFocusEffect } from '@react-navigation/native';
import { useTaskStatus } from '../../../hooks/useTaskStatus';
import { useOpenTask } from '../../../hooks/useOpenTask';

export default function TaskScreen({ navigation, route }: any) {
  const headerHeight = useAppHeaderHeight();
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

  // Paging bookkeeping lives in refs so a fetch loop and onEndReached always see current values.
  const pageRef = React.useRef(1);
  const rawLoadedRef = React.useRef(0);
  const hasMoreRef = React.useRef(false);
  const fetchingRef = React.useRef(false);
  const requestRef = React.useRef(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [canDownloadReport, setCanDownloadReport] = useState(false);

  const [activeDropdown, setActiveDropdown] = useState<'TAG' | 'STATUS' | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const errorMessageRef = React.useRef<string | null>(null);
  const { acceptTask, rejectTask, errorMessage, wasTaskUnavailable } = useTaskStatus();

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
    const result = await launchCameraWithPermission({ mediaType: 'photo', includeBase64: true, quality: 0.7 });
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

  // Java (MainTaskFragmentNew): isAllData is false only for the default view -- no status
  // picked and the current month -- where the server hands back the open tasks. Any other
  // month or a status filter asks for all data.
  const isCurrentMonth = () => {
    const now = new Date();
    return selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear();
  };

  const PAGE_FILL = 10;

  const fetchTasks = async (page = 1, reset = false) => {
    if (!uid || !ownerId) return;
    if (!reset && (fetchingRef.current || !hasMoreRef.current)) return;

    const requestId = ++requestRef.current;
    fetchingRef.current = true;
    if (reset) {
      setTasks([]);
      rawLoadedRef.current = 0;
      hasMoreRef.current = false;
      page = 1;
      setLoading(true);
    }

    try {
      const allData = !(selectedStatus == null && isCurrentMonth());
      const collected: Task[] = [];
      let current = page;

      // Completed tasks are hidden until the Status filter asks for them, so a page can
      // contribute nothing. Keep reading pages until the list has something new to show
      // (or the server runs out) -- otherwise scrolling would stall on an all-completed page.
      for (;;) {
        const response = await getTaskListSearchNew({
          UserId: uid,
          searchparam: search,
          TaskStatusID: statusParam,
          TaskTypeID: 0,
          pageIndex: current,
          TaskMonth: selectedDate.getMonth() + 1,
          TaskYear: selectedDate.getFullYear(),
          TaskTagId: selectedTag?.TaskTagId || 0,
          AllData: allData,
        });
        if (requestId !== requestRef.current) return; // a newer fetch superseded this one

        const rows: Task[] = response.ResultData || [];
        const total = response.RecordCount || 0;
        rawLoadedRef.current += rows.length;
        pageRef.current = current;
        collected.push(
          ...(selectedStatus == null ? rows.filter(t => t.TaskStatus !== 'Completed') : rows),
        );

        hasMoreRef.current = rows.length > 0 && rawLoadedRef.current < total;
        if (!hasMoreRef.current || collected.length >= PAGE_FILL) break;
        current += 1;
      }

      const sortByIdDesc = (arr: Task[]) => [...arr].sort((x, y) => (y.Id ?? 0) - (x.Id ?? 0));
      setTasks(prev => {
        const seen = new Set(reset ? [] : prev.map(t => t.Id));
        return sortByIdDesc([...(reset ? [] : prev), ...collected.filter(t => !seen.has(t.Id))]);
      });
    } catch (err: any) { /* silent */ }
    finally {
      if (requestId === requestRef.current) {
        fetchingRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
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

  // Java: TasksListAdapter.getTaskCompletionDoc -- an InActive task looks up the documents
  // posted with the task (taskId 0 + customer), a Completed one the closure documents.
  const [attachmentFiles, setAttachmentFiles] = useState<GetPostedTaskDocFile[]>([]);
  const [attachmentTask, setAttachmentTask] = useState<Task | null>(null);

  const handleViewAttachments = async (task: Task) => {
    if (!uid) return;
    try {
      const response = await getTaskDoc({
        userId: Number(uid),
        taskId: task.TaskStatus === 'InActive' ? 0 : task.Id,
        customerId: task.CustomerDetailsid,
      });
      const files = response?.ResultData?.Files ?? [];
      if (files.length === 0) {
        Alert.alert('Attachments', 'You have no attachment!');
        return;
      }
      setAttachmentFiles(files);
      setAttachmentTask(task);
    } catch {
      Alert.alert('Attachments', 'You have no attachment!');
    }
  };

  const handleDownloadFile = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (err: any) {
      Alert.alert('Download failed', err?.message || 'Could not open the file.');
    }
  };

  // Java: the red FAB opens the Sync screen, or says there is nothing to sync.
  const handleSyncFab = async () => {
    const pending = await getPendingTasks(Number(uid) || undefined);
    if (pending.length === 0) {
      Alert.alert('Sync', 'You have no Offline data to be sync.');
      return;
    }
    navigation.navigate('SyncOffline');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setSelectedTag(null);
    setSelectedStatus(null);
    setSearch('');
    setSelectedDate(new Date());
    fetchTasks(1, true);
  };

  // Re-tapping the Task tab while already on it refreshes the screen.
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) handleRefresh();
    });
    return unsubscribe;
  }, [navigation]);

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
        if (wasTaskUnavailable()) {
          // Java refreshes the list when the task no longer exists.
          closeLateRejectSheet();
          fetchTasks(1, true);
        }
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

  const loadMore = () => fetchTasks(pageRef.current + 1);

  // Java opens the accept / resume dialog over the Task list.
  const [tracking, setTracking] = useState<{ task: Task; resumeOnHold: boolean } | null>(null);

  const openTask = useOpenTask(navigation, {
    onOpenTracking: (t, options) => setTracking({ task: t, resumeOnHold: !!options?.resumeOnHold }),
    onLateInactive: t => {
      setSelectedTask(t);
      setShowLateRejectSheet(true);
    },
  });

  // Java: the PDF download icon sits beside the amount on a Completed task when the
  // technician has the Task PDF permission.
  const renderItem = ({ item }: { item: Task }) => (
    <TaskListCard
      task={item}
      onPress={() => openTask(item)}
      actions={
        <>
          {canDownloadReport && item.TaskStatus === 'Completed' ? (
            <Pressable onPress={() => handleDownloadReport(item)} hitSlop={8} style={styles.actionIcon}>
              <Ionicons name="download-outline" size={ms(20)} color={COLORS.primary} />
            </Pressable>
          ) : null}
          {item.TaskStatus === 'InActive' || item.TaskStatus === 'Completed' ? (
            <Pressable onPress={() => handleViewAttachments(item)} hitSlop={8} style={styles.actionIcon}>
              <Ionicons name="attach" size={ms(20)} color={COLORS.primary} />
            </Pressable>
          ) : null}
        </>
      }
    />
  );

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
      <View style={[styles.redBg, { height: headerHeight }]} />

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
          <Ionicons name="search" size={ms(22)} color={COLORS.lightGray} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Customer Or Task Id Number"
            placeholderTextColor={COLORS.lightGray}
            style={styles.searchInput}
            cursorColor={COLORS.primary}
          />
          <Pressable onPress={() => setSearch('')} hitSlop={10}>
            <Ionicons name="close" size={ms(22)} color={COLORS.textBlack} />
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          <Pressable style={styles.filterItem} onPress={() => setActiveDropdown('TAG')}>
            <Text style={styles.filterText} numberOfLines={1}>
              {selectedTag?.TaskTagName || 'Select Task Tag'}
            </Text>
            <Ionicons name="chevron-down" size={ms(20)} color={COLORS.primary} />
          </Pressable>

          <Pressable style={styles.filterItem} onPress={() => setActiveDropdown('STATUS')}>
            <Text style={styles.filterText} numberOfLines={1}>{selectedStatus?.Name || 'Status'}</Text>
            <Ionicons name="chevron-down" size={ms(20)} color={COLORS.primary} />
          </Pressable>

          <Pressable style={styles.refreshItem} onPress={handleRefresh}>
            <Text style={styles.refreshText}>Refresh List</Text>
            <Ionicons name="refresh-outline" size={ms(20)} color={COLORS.primary} />
          </Pressable>
        </View>

        {loading ? (
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
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <Pressable style={styles.syncFab} onPress={handleSyncFab} accessibilityLabel="Sync Data">
        <Ionicons name="sync-outline" size={ms(30)} color={COLORS.white} />
      </Pressable>

      {tracking && (
        <TaskTrackingSheet
          task={tracking.task}
          resumeOnHold={tracking.resumeOnHold}
          navigation={navigation}
          onClose={() => setTracking(null)}
          onFinished={() => setTracking(null)}
          onRejected={() => fetchTasks(1, true)}
        />
      )}

      <TaskAttachmentsSheet
        visible={attachmentTask !== null}
        taskName={attachmentTask?.Name}
        files={attachmentFiles}
        onClose={() => setAttachmentTask(null)}
        onDownload={handleDownloadFile}
      />

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
  redBg:      { backgroundColor: COLORS.primary },

  // main_task_fragment.xml: white CardView, 30dp corners, 10dp top margin.
  whiteSheet: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    paddingTop: ms(10),
    overflow: 'hidden',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ms(40),
    marginLeft: ms(8),
    marginRight: ms(33), // SearchView takes weight 0.94 of the row
    paddingHorizontal: ms(8),
    borderBottomWidth: 1,
    borderColor: COLORS.textBlack,
  },
  searchInput: { flex: 1, marginLeft: ms(8), fontSize: sp(16), color: COLORS.textBlack, paddingVertical: 0 },

  // 30dp row, 10dp above; the two spinners share the width, "Refresh List" sits at the end.
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ms(30),
    marginTop: ms(10),
  },
  filterItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: ms(10) },
  filterText: { flexShrink: 1, fontSize: sp(14), color: COLORS.textBlack },
  refreshItem: { flexDirection: 'row', alignItems: 'center', marginLeft: ms(10), marginRight: ms(5) },
  refreshText: { marginRight: ms(5), fontSize: sp(13), fontWeight: 'bold', color: COLORS.primary },

  // RecyclerView: 10dp side/top padding, 25dp bottom margin.
  listContent: { paddingHorizontal: ms(10), paddingTop: ms(10), paddingBottom: ms(80) },
  actionIcon: { marginRight: ms(8) },
  // FloatingActionButton: 56dp, colorPrimaryDark, 16dp margin, bottom end.
  syncFab: {
    position: 'absolute',
    right: ms(16),
    bottom: ms(10),
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },

  monthRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: scale(20),
    paddingVertical: vs(6),
  },

  monthWrapper: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
  monthText:    { color: COLORS.white, fontSize: sp(18) },

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

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyImage: {
    width: ms(200),
    height: ms(200),
  },
});