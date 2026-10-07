//src/screens/technician/main/TaskExecutionScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
  Linking,
  ToastAndroid,
} from 'react-native';
import Modal from '../../../components/AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp, wps, ms } from '../../../utils/responsive';
import { getCurrentUserProfile } from '../../../state/session';
import { placeTeleCmiCall } from '../../../utils/teleCmiCall';
import BottomSheetDialog, { FieldErrorDot, FieldErrorTip } from '../../../components/BottomSheetDialog';
import { UploadPhotoIcon } from '../../../components/DialogIcons';
import {
  getTaskById,
  addPhotoBeforeTask,
  updateTaskStatus,
  postOnHoldTASKDetails,
  getBeforeAfterOnHoldTaskImages,
} from '../../../api/task/taskService';
import type {
  TasksListResultData,
  TasksListMultipleItemAssigned,
  GetBeforeAfterOnHoldTaskImgDTOFileLists,
} from '../../../api/task/task.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Video, { VideoRef } from 'react-native-video';
import { TASK_STATUS_ID } from '../../../constants/taskStatus';
import { buildImagesPayload } from '../../../utils/imagePayload';
import { nowAsJavaTime } from '../../../utils/taskStatus.utils';
import { resetToTabsThen } from '../../../navigation/taskFlowNavigation';

type Task = TasksListResultData;
type AssignedItem = TasksListMultipleItemAssigned;

// Three photo boxes visible at a time, horizontally scrollable to reveal the rest.
const VISIBLE_PHOTO_BOXES = 3;
const PHOTO_ROW_GAP = scale(16);
const PHOTO_BOX_SIZE =
  Math.min(
    (wps(100) - scale(20) * 2 - PHOTO_ROW_GAP * (VISIBLE_PHOTO_BOXES - 1)) /
      VISIBLE_PHOTO_BOXES,
    scale(130),
  );

export default function TaskExecutionScreen({ navigation, route }: any) {
  const { task: routeTask } = route.params as { task: Task };

  const [uid, setUid] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [photos, setPhotos] = useState<{ uri: string; base64?: string }[]>([]);
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);

  const [showRejectSheet, setShowRejectSheet] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectPhotos, setRejectPhotos] = useState<{ uri: string; base64?: string }[]>([]);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReasonError, setRejectReasonError] = useState(false);

  const [showOnHoldSheet, setShowOnHoldSheet] = useState(false);
  const [onHoldReason, setOnHoldReason] = useState('');
  const [onHoldPhotos, setOnHoldPhotos] = useState<{ uri: string; base64?: string }[]>([]);
  const [onHolding, setOnHolding] = useState(false);
  const [onHoldReasonError, setOnHoldReasonError] = useState(false);

  const [taskDetail, setTaskDetail] = useState<Task | null>(routeTask ?? null);
  const [trackingDetail, setTrackingDetail] = useState<TasksListResultData | null>(null);

  const [beforeImages, setBeforeImages] = useState<GetBeforeAfterOnHoldTaskImgDTOFileLists[]>([]);
  const [afterImages, setAfterImages] = useState<GetBeforeAfterOnHoldTaskImgDTOFileLists[]>([]);
  const [holdImages, setHoldImages] = useState<GetBeforeAfterOnHoldTaskImgDTOFileLists[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [showContinue, setShowContinue] = useState(false);

  // Java (TaskRequestItems_FW.setRefresh): after items are requested from the on-hold
  // dialog, the on-hold dialog opens again with what the user had already entered.
  useEffect(() => {
    if (route.params?.reopenOnHold) {
      setShowOnHoldSheet(true);
      navigation.setParams({ reopenOnHold: undefined });
    }
  }, [route.params?.reopenOnHold, navigation]);

  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);

  const [audioSource, setAudioSource] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const videoRef = useRef<VideoRef>(null);

  const pendingPhotoRef = useRef<{
    list: { uri: string; base64?: string }[];
    setList: React.Dispatch<React.SetStateAction<{ uri: string; base64?: string }[]>>;
    index: number;
  } | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setSeconds(prev => prev + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    AsyncStorage.getItem('uid').then(id => {
      if (id) setUid(id);
    });
  }, []);

  useEffect(() => {
    if (routeTask) {
      setTaskDetail(routeTask);

      // Java: chronometer shows 00:00 until START/CONTINUE; on continue it runs from
      // (now - StartDate).
      setSeconds(0);
      setIsRunning(false);

      if (
        routeTask.StartDate &&
        (routeTask.TaskState === 1 ||
          (routeTask.TaskState === 0 && routeTask.TaskStatus === 'OnHold'))
      ) {
        setShowContinue(true);
      }
    }

    const fetchTrackingDetails = async () => {
      if (!uid || !routeTask?.Id) return;
      try {
        setTrackingLoading(true);
        const response = await getTaskById({ UserId: Number(uid), TaskID: routeTask.Id });
        const tracking = response?.ResultData?.[0] ?? null;

        console.log('trackingDetail', JSON.stringify(tracking, null, 2));

        setTrackingDetail(tracking);
      } catch (err: any) {
        // silent
      } finally {
        setTrackingLoading(false);
      }
    };

    const fetchTaskImages = async () => {
      if (!uid) return;
      try {
        const beforeRes = await getBeforeAfterOnHoldTaskImages({
          userId: Number(uid),
          taskId: routeTask.Id,
          beforeImages: true,
          afterImages: false,
          onHoldImages: false,
        });

        const files = beforeRes?.ResultData?.FileLists || [];
        setBeforeImages(files);
        if (files.length > 0) {
          setPhotos(files.map(f => ({ uri: f.FilePath || '' })));
        }

        const afterRes = await getBeforeAfterOnHoldTaskImages({
          userId: Number(uid),
          taskId: routeTask.Id,
          beforeImages: false,
          afterImages: true,
          onHoldImages: false,
        });
        setAfterImages(afterRes?.ResultData?.FileLists || []);

        const holdRes = await getBeforeAfterOnHoldTaskImages({
          userId: Number(uid),
          taskId: routeTask.Id,
          beforeImages: false,
          afterImages: false,
          onHoldImages: true,
        });
        setHoldImages(holdRes?.ResultData?.FileLists || []);
      } catch (err: any) {
        // silent
      }
    };

    fetchTrackingDetails();
    fetchTaskImages();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [routeTask?.Id, uid]);

  const formatTime = () => {
    const hrs  = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0)
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const openPhotoPicker = (
    list: { uri: string; base64?: string }[],
    setList: React.Dispatch<React.SetStateAction<{ uri: string; base64?: string }[]>>,
    index: number,
  ) => {
    pendingPhotoRef.current = { list, setList, index };
    setShowPhotoSourceModal(true);
  };

  const handlePhotoSource = async (source: 'camera' | 'gallery') => {
    setShowPhotoSourceModal(false);
    if (!pendingPhotoRef.current) return;
    const { list, setList, index } = pendingPhotoRef.current;
    pendingPhotoRef.current = null;

    // The camera intent silently fails on Android if launched while the source Modal is
    // still dismissing; give it time to close first.
    if (source === 'camera') await new Promise<void>(r => setTimeout(r, 400));

    // CAMERA is declared in the manifest, so image-picker expects the app to obtain the
    // runtime permission itself.
    if (source === 'camera' && Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Camera unavailable', 'Camera permission is required to take a photo.');
        return;
      }
    }

    let result;
    try {
      result = source === 'camera'
        ? await launchCamera({ mediaType: 'photo', includeBase64: true, quality: 0.7, saveToPhotos: false })
        : await launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.7 });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unable to open the camera');
      return;
    }

    if (result.errorCode) {
      Alert.alert(
        'Camera unavailable',
        result.errorCode === 'permission'
          ? 'Camera permission is required to take a photo.'
          : result.errorMessage || 'Unable to open the camera',
      );
      return;
    }

    if (result.assets?.[0]) {
      const asset = result.assets[0];
      const updated = [...list];
      updated[index] = { uri: asset.uri!, base64: asset.base64 };
      setList(updated);
    }
  };

  const handleStart = () => {
    if (showContinue) {
      // Java: already-running task (STARTED_NOT_ENDED) just resumes the timer from
      // (now - StartDate) with no API call. An on-hold task restarts from 0.
      if (routeTask.TaskState === 1 && routeTask.StartDate) {
        setSeconds(Math.max(0, Math.floor((Date.now() - Number(routeTask.StartDate)) / 1000)));
        setShowContinue(false);
        setIsRunning(true);
        return;
      }
      setShowContinue(false);
      startTask();
      return;
    }

    // Java: START always opens the before-task photo dialog (captureBeforeTaskPhotoDialog).
    setShowUploadSheet(true);
  };

  const startTask = async () => {
    try {
      const response = await updateTaskStatus({
        TaskId: routeTask.Id,
        UserId: Number(uid),
        TaskStatus: TASK_STATUS_ID.Ongoing,
        TaskState: 1,
        Time: nowAsJavaTime(),
      });
      console.log('START RESPONSE', response);

      if (response?.Code === '200') {
        setShowContinue(false);
        setIsRunning(true);

        setTaskDetail(prev =>
          prev
            ? {
                ...prev,
                TaskState: 1,
              }
            : prev
        );
      } else {
        Alert.alert('Error', response?.Message || 'Failed to start task');
      }
    } catch (err: any) {
      console.log('START ERROR', err);
      Alert.alert('Error', err?.message || 'Failed to start task');
    }
  };

  const handleUploadAndStart = async () => {
    const presentPhotos = photos.filter(p => p?.base64);
    if (presentPhotos.length === 0) {
      Alert.alert('Please Add/Capture Image');
      return;
    }
    try {
      setUploading(true);

      const now = new Date();
      const p2 = (n: number) => String(n).padStart(2, '0');
      // Java: mPhotoName = "yyyyMMdd_HHmmss_<which>.jpg"
      const photoName =
        `${now.getFullYear()}${p2(now.getMonth() + 1)}${p2(now.getDate())}_` +
        `${p2(now.getHours())}${p2(now.getMinutes())}${p2(now.getSeconds())}_1.jpg`;

      const response = await addPhotoBeforeTask({
        DeviceInfoImageName: photoName,
        Images: buildImagesPayload(presentPhotos.map(p => p.base64)),
        DeviceInfoImagePath: presentPhotos[0]?.base64 || '',
        DeviceInfoImagePath1: presentPhotos[1]?.base64 || '',
        DeviceInfoImagePath2: presentPhotos[2]?.base64 || '',
        DeviceInfoNotes: note,
        CreatedBy: Number(uid),
        TaskId: routeTask.Id,
      });

      if (response?.Code !== '200') {
        Alert.alert('Upload failed', response?.Message || 'Could not upload photos');
        return;
      }

      setShowUploadSheet(false);
      await startTask();
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message || 'Could not upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleReject = async () => {
    // Java buttonUpload.onClick: reason (field error), then at least one image (toast).
    if (!rejectReason) {
      setRejectReasonError(true);
      return;
    }
    setRejectReasonError(false);

    const presentRejectPhotos = rejectPhotos.filter(p => p?.base64);
    if (presentRejectPhotos.length === 0) {
      ToastAndroid.show('At least One Image is mandatory to Reject the Task !!', ToastAndroid.LONG);
      return;
    }

    try {
      setRejecting(true);

      const taskRejectedImageDtls = presentRejectPhotos.map(p => ({
        ImagePath: p.base64,
        TaskId: routeTask.Id,
        RejectedBy: Number(uid),
      }));

      const response = await updateTaskStatus({
        TaskId: routeTask.Id,
        UserId: Number(uid),
        TaskStatus: 2, // TaskStatus.REJECTED
        TaskState: 0, // TaskState.NOT_STARTED
        RejectedTaskNotes: rejectReason.trim(),
        TotalDistance: 0,
        Time: nowAsJavaTime(),
        Task_Rejected_Image_Dtls: taskRejectedImageDtls,
      });

      if (response?.Code !== '200') {
        Alert.alert('Error', response?.Message || 'Failed to reject task');
        return;
      }

      setShowRejectSheet(false);
      setRejectReason('');
      setRejectPhotos([]);
      ToastAndroid.show('Task updated successfully', ToastAndroid.LONG);
      // Java returns to the Task tab after a rejection.
      navigation.navigate('Task');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to reject task');
    } finally {
      setRejecting(false);
    }
  };

  const handleOnHold = async () => {
    // Java buttonOnhold.onClick: reason (field error), then at least one image.
    if (!onHoldReason) {
      setOnHoldReasonError(true);
      return;
    }
    setOnHoldReasonError(false);

    const presentHoldPhotos = onHoldPhotos.filter(p => p?.base64);
    if (presentHoldPhotos.length === 0) {
      Alert.alert('At Least One Image is Mandatory to put task on hold !! ');
      return;
    }

    try {
      setOnHolding(true);

      const response = await postOnHoldTASKDetails({
        Id: 0,
        TaskId: routeTask.Id,
        UserId: Number(uid),
        OnHoldNotes: onHoldReason.trim(),
        Pick1: onHoldPhotos[0]?.base64 || '',
        Pick2: onHoldPhotos[1]?.base64 || '',
        Pick3: onHoldPhotos[2]?.base64 || '',
        Images: buildImagesPayload(presentHoldPhotos.map(p => p.base64), true),
        // Java copies these from the task (resultData) rather than using "now".
        CreatedBy: routeTask.CreatedBy ?? Number(uid),
        CreatedDate: routeTask.CreatedDate ?? new Date().toISOString(),
        UpdatedBy: Number(routeTask.UpdatedBy ?? uid),
        UpdatedDate: routeTask.UpdatedDate ?? new Date().toISOString(),
        TaskStatus: 5,
      });

      if (response?.Code !== '200') {
        Alert.alert('Error', response?.Message || 'Failed to put task on hold');
        return;
      }

      setShowOnHoldSheet(false);
      setIsRunning(false);
      ToastAndroid.show('Status Updated Successfully.', ToastAndroid.LONG);
      navigation.navigate('Task');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to put task on hold');
    } finally {
      setOnHolding(false);
    }
  };

  const handleEndTask = async () => {
    setIsRunning(false);
    try {
      const res = await updateTaskStatus({
        TaskId: routeTask.Id,
        UserId: Number(uid),
        TaskStatus: TASK_STATUS_ID.Ongoing,
        TaskState: 2,
        Time: nowAsJavaTime(),
      });
      // Java only moves on to Closure after the server confirms ENDED_NO_PAYMENT.
      if (res?.Code !== '200') {
        setIsRunning(true);
        Alert.alert('Error', res?.Message || 'Could not end the task. Please try again.');
        return;
      }
    } catch (err: any) {
      // Keep the task running so the technician can retry instead of reaching
      // Closure while the server still thinks the task is in progress.
      setIsRunning(true);
      Alert.alert('Error', err?.message || 'Could not end the task. Please try again.');
      return;
    }
    // Java sets TaskState = ENDED_NO_PAYMENT before opening Closure (HomeActivityNew
    // updateTaskStatus success). Closure derives Rate-mode handling from this state, so
    // it must not receive the stale pre-end task.
    const endedTask: Task = {
      ...routeTask,
      TaskStatus: 'Ongoing',
      TaskStatusId: TASK_STATUS_ID.Ongoing,
      TaskState: 2,
    };
    // The task has ended on the server: back from Closure goes to the tab bar, never to
    // this screen (where START would post TaskState 1 and regress the task).
    resetToTabsThen(navigation, {
      name: 'TaskClosure',
      params: { task: endedTask, elapsedSeconds: seconds },
    });
  };

  const handlePlayAudio = () => {
    const audioPath =
      taskDetail?.AudioFilePath ||
      routeTask.AudioFilePath;

    if (!audioPath) {
      Alert.alert(
        'No Audio',
        'No instruction audio is attached to this task.'
      );
      return;
    }

    if (isPlayingAudio) {
      setIsPlayingAudio(false);
      return;
    }

    setAudioSource(audioPath);
    setAudioLoading(true);
    setIsPlayingAudio(true);
  };

  const handleCallCustomer = () => {
    // Java imageView_call (only shown with the TeleCMI module on): bridge the call via TeleCMI.
    placeTeleCmiCall(taskDetail?.ContactNo ?? routeTask?.ContactNo);
  };

  const handleTaskInput = () => {
    navigation.navigate('TaskInput', { routeTask });
  };

  const MAX_PHOTOS = 12;

  // Java: HorizontalScrollView of 100dp boxes (textview_border_curved) 10dp apart.
  const renderPhotoSlots = (
    list: { uri: string; base64?: string }[],
    setList: React.Dispatch<React.SetStateAction<{ uri: string; base64?: string }[]>>,
  ) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.photoScroll}
      contentContainerStyle={styles.photoRow}
    >
      {Array.from({ length: MAX_PHOTOS }, (_, i) => i).map((i) => (
        <Pressable
          key={i}
          style={styles.photoBox}
          onPress={() => openPhotoPicker(list, setList, i)}
        >
          {list[i]?.uri ? (
            <Image source={{ uri: list[i].uri }} style={styles.photoThumb} />
          ) : (
            <Ionicons name="camera-outline" size={ms(56)} color={COLORS.lightGray} />
          )}
        </Pressable>
      ))}
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Task name card (CardView 14dp margin, 10dp radius) */}
        <View style={styles.nameCard}>
          <Text style={styles.taskName}>{taskDetail?.Name || 'Task'}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.description}>
            {taskDetail?.Description && taskDetail.Description !== 'undefined' && taskDetail.Description.trim() !== ''
              ? taskDetail.Description
              : 'NA'}
          </Text>

          {/* Java shows the call button only when the TeleCMI module is on. */}
          {getCurrentUserProfile().teleCmiModuleFlag === 'true' && (
            <Pressable style={styles.callBtn} onPress={handleCallCustomer}>
              <Image source={require('../../../../assets/images/ic_phone.png')} style={styles.callIcon} />
            </Pressable>
          )}

          {trackingDetail?.OnHoldTaskDtos?.OnHoldNotes && (
            <>
              <Text style={styles.sectionTitle}>On Hold Notes</Text>
              <Text style={styles.sectionValue}>{trackingDetail.OnHoldTaskDtos.OnHoldNotes}</Text>
            </>
          )}

          <Text style={styles.sectionTitle}>Item Assigned</Text>
          {taskDetail?.MultipleItemAssigned && taskDetail.MultipleItemAssigned.length > 0 ? (
            <View style={styles.itemsCard}>
              {taskDetail.MultipleItemAssigned
                .filter((a: AssignedItem) => a.ItemName)
                .map((a: AssignedItem, idx: number) => (
                  <View style={styles.itemRow} key={idx}>
                    <Text style={styles.itemText}>{idx + 1}. {a.ItemName}</Text>
                  </View>
                ))}
            </View>
          ) : (
            <Text style={styles.sectionValue}>NA</Text>
          )}

          {(isRunning || showContinue || photos.some(p => p?.uri)) && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: ms(10) }]}>
                Picture Before Start Task
              </Text>
              {renderPhotoSlots(photos, setPhotos)}
            </>
          )}

          {(trackingDetail?.PreDeviceInfoDto?.DeviceInfoNotes ||
            routeTask?.PreDeviceInfoDto?.DeviceInfoNotes ||
            note) ? (
            <>
              <Text style={[styles.sectionTitle, { marginTop: ms(15) }]}>Note</Text>
              <Text style={styles.sectionValue}>
                {trackingDetail?.PreDeviceInfoDto?.DeviceInfoNotes ||
                  routeTask?.PreDeviceInfoDto?.DeviceInfoNotes ||
                  note}
              </Text>
            </>
          ) : null}
        </View>

        {/* linear_play_audio: bg_closure_border (34dp radius, #f4f4f4), 10dp above */}
        <View style={styles.audioCard}>
          <Text style={styles.audioText}>Listen your Instructions</Text>
          <Pressable style={styles.playBtn} onPress={handlePlayAudio} disabled={audioLoading}>
            {audioLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name={isPlayingAudio ? 'stop-outline' : 'play-outline'} size={sp(22)} color="#fff" />
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* linear_start_task: bottom-anchored 30dp-radius card with the timer and action buttons */}
      <View style={styles.bottomPanel}>
        <Text style={styles.timer}>{formatTime()}</Text>

        <View style={styles.btnRow}>
          <Pressable style={[styles.btn, styles.reject]} onPress={() => setShowRejectSheet(true)}>
            <Text style={styles.btnText}>REJECT</Text>
          </Pressable>

          <Pressable style={[styles.btn, styles.onhold]} onPress={() => setShowOnHoldSheet(true)}>
            <Text style={styles.btnText}>ON HOLD</Text>
          </Pressable>

          <Pressable
            style={[styles.btn, isRunning ? styles.endTask : styles.start]}
            onPress={isRunning ? handleEndTask : handleStart}
          >
            <Text style={styles.btnText}>
              {isRunning ? 'END TASK' : showContinue ? 'CONTINUE' : 'START'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.btnRow}>
          <Pressable style={[styles.btn, styles.onhold]} onPress={handleTaskInput}>
            <Text style={styles.btnText}>TASK INPUT</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.onhold]} onPress={() => navigation.navigate('ItemRequest', { routeTask })}>
            <Text style={styles.btnText}>REQUEST ITEMS</Text>
          </Pressable>
        </View>
      </View>

      {/* PHOTO SOURCE PICKER MODAL */}
      <Modal visible={showPhotoSourceModal} transparent animationType="fade" onRequestClose={() => setShowPhotoSourceModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowPhotoSourceModal(false)}>
          <Pressable>
            <View style={styles.photoSourceSheet}>
              <Text style={styles.photoSourceTitle}>Select Image Source</Text>
              <View style={styles.photoSourceDivider} />
              <TouchableOpacity style={styles.photoSourceOption} onPress={() => handlePhotoSource('camera')}>
                <View style={[styles.photoSourceIconWrap, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="camera-outline" size={sp(20)} color="#fff" />
                </View>
                <Text style={styles.photoSourceOptionText}>Camera</Text>
              </TouchableOpacity>
              <View style={styles.photoSourceDivider} />
              <TouchableOpacity style={styles.photoSourceOption} onPress={() => handlePhotoSource('gallery')}>
                <View style={[styles.photoSourceIconWrap, { backgroundColor: '#6366F1' }]}>
                  <Ionicons name="images-outline" size={sp(20)} color="#fff" />
                </View>
                <Text style={styles.photoSourceOptionText}>Gallery</Text>
              </TouchableOpacity>
              <View style={styles.photoSourceDivider} />
              <TouchableOpacity style={[styles.photoSourceOption, { justifyContent: 'center' }]} onPress={() => setShowPhotoSourceModal(false)}>
                <Text style={[styles.photoSourceOptionText, { color: COLORS.primary, fontWeight: '600' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* dialog_before_task_photo.xml */}
      {/* Java: setCancelable(false) -- only a successful upload dismisses it. */}
      <BottomSheetDialog visible={showUploadSheet} onRequestClose={() => {}}>
        <View style={styles.dlgHeader}>
          <UploadPhotoIcon size={ms(36)} />
          <View style={styles.dlgHeaderText}>
            <Text style={styles.dlgTitle}>Upload Photo</Text>
            <Text style={styles.dlgSub}>Please take the picture before starting the task</Text>
          </View>
        </View>
        {renderPhotoSlots(photos, setPhotos)}
        <View style={styles.noteField}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Note"
            placeholderTextColor={COLORS.lightGray}
            style={styles.noteInput}
          />
        </View>
        <Pressable style={styles.dlgBtn} onPress={handleUploadAndStart} disabled={uploading}>
          <Text style={styles.dlgBtnText}>{uploading ? 'UPLOADING...' : 'UPLOAD'}</Text>
        </Pressable>
      </BottomSheetDialog>

      {/* dialog_reject_task_photo.xml */}
      <BottomSheetDialog
        visible={showRejectSheet}
        onRequestClose={() => { setShowRejectSheet(false); setRejectPhotos([]); setRejectReasonError(false); }}
        onClose={() => { setShowRejectSheet(false); setRejectPhotos([]); setRejectReason(''); setRejectReasonError(false); }}
      >
        <View style={styles.dlgHeader}>
          <UploadPhotoIcon size={ms(36)} />
          <View style={styles.dlgHeaderText}>
            <Text style={styles.dlgTitle}>Reject</Text>
            <Text style={styles.dlgSub}>Please take the picture before Rejecting the task</Text>
          </View>
        </View>
        <View style={styles.rejectPhotos}>
          {[0, 1, 2].map(i => (
            <Pressable
              key={i}
              style={[styles.rejectPhotoBox, i === 1 && { marginHorizontal: ms(20) }]}
              onPress={() => openPhotoPicker(rejectPhotos, setRejectPhotos, i)}
            >
              {rejectPhotos[i]?.uri ? (
                <Image source={{ uri: rejectPhotos[i].uri }} style={styles.photoThumb} />
              ) : (
                <Ionicons name="camera-outline" size={ms(56)} color={COLORS.lightGray} />
              )}
            </Pressable>
          ))}
        </View>
        <View style={styles.noteFieldWrap}>
          {rejectReasonError && <FieldErrorTip message="Enter Reason for Reject" bottom={ms(43)} />}
          <View style={styles.noteField}>
            <TextInput
              value={rejectReason}
              onChangeText={t => { setRejectReason(t); if (t) setRejectReasonError(false); }}
              placeholder="Reason for Reject"
              placeholderTextColor={COLORS.lightGray}
              style={styles.noteInput}
              maxLength={100}
            />
            {rejectReasonError && <FieldErrorDot />}
          </View>
        </View>
        <Pressable style={styles.dlgBtn} onPress={handleReject} disabled={rejecting}>
          <Text style={styles.dlgBtnText}>{rejecting ? 'REJECTING...' : 'REJECT'}</Text>
        </Pressable>
        <Pressable
          style={styles.dlgCancel}
          onPress={() => { setShowRejectSheet(false); setRejectPhotos([]); setRejectReasonError(false); }}
        >
          <Text style={styles.dlgCancelText}>Cancel</Text>
        </Pressable>
      </BottomSheetDialog>

      {/* dialog_on_hold.xml */}
      <BottomSheetDialog
        visible={showOnHoldSheet}
        onRequestClose={() => {}}
        onClose={() => { setShowOnHoldSheet(false); setOnHoldPhotos([]); setOnHoldReasonError(false); }}
      >
        <Text style={styles.holdTitle}>Reason for holding the task ?</Text>
        <View style={styles.holdNoteWrap}>
          {onHoldReasonError && <FieldErrorTip message="Please Enter the Reason!!" bottom={ms(100) + ms(3)} />}
          <View style={styles.holdNote}>
            <TextInput
              value={onHoldReason}
              onChangeText={t => { setOnHoldReason(t); if (t) setOnHoldReasonError(false); }}
              placeholder="Note"
              placeholderTextColor={COLORS.lightGray}
              style={styles.noteInput}
              multiline
            />
            {onHoldReasonError && <FieldErrorDot />}
          </View>
        </View>
        {renderPhotoSlots(onHoldPhotos, setOnHoldPhotos)}
        <View style={styles.holdBtnRow}>
          <Pressable style={[styles.holdBtn, { backgroundColor: COLORS.statusOnHold }]} onPress={handleOnHold} disabled={onHolding}>
            <Text style={styles.dlgBtnText}>{onHolding ? 'SAVING...' : 'PUT ON HOLD'}</Text>
          </Pressable>
          <Pressable
            style={[styles.holdBtn, { backgroundColor: COLORS.primary }]}
            onPress={() => {
              setShowOnHoldSheet(false);
              navigation.navigate('ItemRequest', { routeTask, fromOnHold: true });
            }}
          >
            <Text style={styles.dlgBtnText}>REQUEST ITEMS</Text>
          </Pressable>
        </View>
      </BottomSheetDialog>
      {audioSource && (
        <Video
          ref={videoRef}
          source={{ uri: audioSource }}
          style={{ width: 0, height: 0 }}
          paused={!isPlayingAudio}
          playInBackground={false}
          playWhenInactive={false}
          ignoreSilentSwitch="ignore"
          onLoad={() => setAudioLoading(false)}
          onEnd={() => { setAudioLoading(false); setIsPlayingAudio(false); setAudioSource(null); }}
          onError={() => {
            setAudioLoading(false);
            setIsPlayingAudio(false);
            setAudioSource(null);
            Alert.alert('Playback Error', 'Unable to play instruction audio.');
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // dialog_before_task_photo / dialog_reject_task_photo / dialog_on_hold
  dlgHeader:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: ms(20), paddingTop: ms(20), paddingBottom: ms(20) },
  dlgHeaderText: { marginLeft: ms(8), flex: 1 },
  dlgTitle:      { fontSize: sp(18), color: COLORS.ink },
  dlgSub:        { fontSize: sp(10), color: COLORS.darkGray },
  photoScroll:   { marginHorizontal: ms(20) },
  photoRow:      { paddingHorizontal: ms(10), paddingVertical: ms(10), gap: ms(10) },
  photoBox:      { width: ms(100), height: ms(100), borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: ms(15), alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoThumb:    { width: '100%', height: '100%' },
  rejectPhotos:  { flexDirection: 'row', paddingHorizontal: ms(20), paddingVertical: ms(10) },
  rejectPhotoBox:{ flex: 1, height: ms(100), borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: ms(15), alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  noteFieldWrap: { marginHorizontal: -ms(20) },
  noteField:     { height: ms(40), borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: ms(34), justifyContent: 'center', marginHorizontal: ms(30), marginTop: ms(16), paddingLeft: ms(18), paddingRight: ms(40) },
  noteInput:     { fontSize: sp(16), color: COLORS.ink, padding: 0 },
  dlgBtn:        { height: ms(48), marginHorizontal: ms(20), marginTop: ms(30), marginBottom: ms(20), borderRadius: ms(34), backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  dlgBtnText:    { color: '#fff', fontSize: sp(18), fontWeight: '500' },
  dlgCancel:     { height: ms(48), alignItems: 'center', justifyContent: 'center', marginBottom: ms(10) },
  dlgCancelText: { color: COLORS.primary, fontSize: sp(18) },
  holdTitle:     { fontSize: sp(18), color: COLORS.ink, marginLeft: ms(28), marginTop: ms(30), marginBottom: ms(10) },
  holdNoteWrap:  { marginHorizontal: ms(20), marginBottom: ms(8) },
  holdNote:      { height: ms(100), borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: ms(15), justifyContent: 'center', paddingHorizontal: ms(18) },
  holdBtnRow:    { flexDirection: 'row', paddingHorizontal: ms(20), marginTop: ms(30), marginBottom: ms(25) },
  holdBtn:       { flex: 1, height: ms(48), margin: ms(5), borderRadius: ms(34), alignItems: 'center', justifyContent: 'center', elevation: 4 },
  root:          { flex: 1, backgroundColor: COLORS.primary },
  scrollArea:    { flex: 1, marginTop: vs(10), backgroundColor: '#fff', borderTopLeftRadius: ms(30), borderTopRightRadius: ms(30) },
  scrollContent: { padding: ms(10), paddingBottom: ms(190) },

  nameCard:      { margin: ms(14), padding: ms(10), borderRadius: ms(10), backgroundColor: '#fff', elevation: 3, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  taskName:      { fontSize: sp(16), fontWeight: 'bold', color: COLORS.ink },
  infoSection:   { paddingHorizontal: ms(20), paddingVertical: ms(10) },
  sectionTitle:  { fontSize: sp(14), fontWeight: 'bold', color: COLORS.ink },
  description:   { fontSize: sp(12), color: COLORS.ink, marginBottom: ms(10) },
  sectionValue:  { fontSize: sp(14), color: COLORS.ink, marginBottom: ms(8) },
  callBtn:       { alignSelf: 'flex-end', width: ms(40), height: ms(40), borderRadius: ms(8), backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: ms(10) },
  callIcon:      { width: ms(22), height: ms(22), tintColor: COLORS.primary },
  itemsCard:     { margin: ms(2), borderRadius: ms(10), backgroundColor: '#fff', elevation: 3, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  itemRow:       { paddingHorizontal: ms(15), paddingVertical: ms(10) },
  itemText:      { fontSize: sp(14), color: COLORS.ink },
  audioCard:     { marginTop: ms(10), borderWidth: 1, borderColor: '#f4f4f4', borderRadius: ms(34), paddingHorizontal: ms(5), paddingTop: ms(10), paddingBottom: ms(15), alignItems: 'center' },
  audioText:     { fontSize: sp(12), color: COLORS.darkGray },
  playBtn:       { width: ms(52), height: ms(52), borderRadius: ms(26), margin: ms(8), backgroundColor: COLORS.ink, alignItems: 'center', justifyContent: 'center' },

  bottomPanel:   { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: ms(30), borderTopRightRadius: ms(30), paddingHorizontal: ms(20), paddingBottom: ms(5), elevation: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
  timer:         { fontSize: sp(30), textAlign: 'center', color: COLORS.ink, marginVertical: ms(10) },
  btnRow:        { flexDirection: 'row' },
  btn:           { flex: 1, height: ms(48), margin: ms(5), borderRadius: ms(34), alignItems: 'center', justifyContent: 'center' },
  reject:        { backgroundColor: COLORS.primary },
  start:         { backgroundColor: '#4EB54E' },
  onhold:        { backgroundColor: COLORS.statusOnHold },
  endTask:       { backgroundColor: '#4EB54E' },
  btnText:       { color: '#fff', fontWeight: '500', fontSize: sp(16), textAlign: 'center' },



  modalBackdrop:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(32) },
  photoSourceSheet:      { backgroundColor: '#fff', borderRadius: scale(16), width: '100%', maxWidth: scale(360), paddingVertical: vs(8), elevation: 10 },
  photoSourceTitle:      { fontSize: sp(17), fontWeight: '600', color: '#111', paddingHorizontal: scale(20), paddingVertical: vs(14) },
  photoSourceDivider:    { height: 1, backgroundColor: '#F3F4F6' },
  photoSourceOption:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(20), paddingVertical: vs(14), gap: scale(14) },
  photoSourceIconWrap:   { width: scale(34), height: scale(34), borderRadius: scale(17), alignItems: 'center', justifyContent: 'center' },
  photoSourceOptionText: { fontSize: sp(15), color: '#1F2937' },
});