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
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp, hp, HEADER_TOP_PADDING } from '../../../utils/responsive';
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

type Task = TasksListResultData;
type AssignedItem = TasksListMultipleItemAssigned;

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

  const [showOnHoldSheet, setShowOnHoldSheet] = useState(false);
  const [onHoldReason, setOnHoldReason] = useState('');
  const [onHoldPhotos, setOnHoldPhotos] = useState<{ uri: string; base64?: string }[]>([]);
  const [onHolding, setOnHolding] = useState(false);

  const [taskDetail, setTaskDetail] = useState<Task | null>(routeTask ?? null);
  const [trackingDetail, setTrackingDetail] = useState<TasksListResultData | null>(null);

  const [beforeImages, setBeforeImages] = useState<GetBeforeAfterOnHoldTaskImgDTOFileLists[]>([]);
  const [afterImages, setAfterImages] = useState<GetBeforeAfterOnHoldTaskImgDTOFileLists[]>([]);
  const [holdImages, setHoldImages] = useState<GetBeforeAfterOnHoldTaskImgDTOFileLists[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [showContinue, setShowContinue] = useState(false);

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

      if (routeTask.StartDate) {
        const elapsedSeconds = Math.floor(
          (Date.now() - Number(routeTask.StartDate)) / 1000
        );

        setSeconds(elapsedSeconds);
      }
      setIsRunning(false);

      if (
        routeTask.StartDate &&
        (routeTask.TaskState === 1 ||
          (routeTask.TaskState === 0 && routeTask.TaskStatus === 'On Hold'))
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

    const result = source === 'camera'
      ? await launchCamera({ mediaType: 'photo', includeBase64: true, quality: 0.7 })
      : await launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.7 });

    if (result.assets?.[0]) {
      const asset = result.assets[0];
      const updated = [...list];
      updated[index] = { uri: asset.uri!, base64: asset.base64 };
      setList(updated);
    }
  };

  const handleStart = () => {
    if (showContinue) {
      setShowContinue(false);
      startTask();
      return;
    }

    if (photos.length === 0 || !photos.some(p => p?.uri)) {
      setShowUploadSheet(true);
      return;
    }

    startTask();
  };

  const startTask = async () => {
    try {
      const response = await updateTaskStatus({
        TaskId: routeTask.Id,
        UserId: Number(uid),
        TaskStatus: TASK_STATUS_ID.Ongoing,
        TaskState: 1,
        Time: seconds,
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

      const response = await addPhotoBeforeTask({
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
    if (!rejectReason.trim()) {
      Alert.alert('Please enter a reason for rejection');
      return;
    }

    const presentRejectPhotos = rejectPhotos.filter(p => p?.base64);
    if (presentRejectPhotos.length === 0) {
      Alert.alert('At least one image is mandatory to reject the task.');
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
        Time: seconds,
        Task_Rejected_Image_Dtls: taskRejectedImageDtls,
      });

      if (response?.Code !== '200') {
        Alert.alert('Error', response?.Message || 'Failed to reject task');
        return;
      }

      setShowRejectSheet(false);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to reject task');
    } finally {
      setRejecting(false);
    }
  };

  const handleOnHold = async () => {
    if (!onHoldReason.trim()) {
      Alert.alert('Please enter a reason for on hold');
      return;
    }

    const presentHoldPhotos = onHoldPhotos.filter(p => p?.base64);
    if (presentHoldPhotos.length === 0) {
      Alert.alert('At least one image is mandatory to put the task on hold.');
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
        CreatedBy: Number(uid),
        CreatedDate: new Date().toISOString(),
        UpdatedBy: Number(uid),
        UpdatedDate: new Date().toISOString(),
        TaskStatus: 5,
      });

      if (response?.Code !== '200') {
        Alert.alert('Error', response?.Message || 'Failed to put task on hold');
        return;
      }

      setShowOnHoldSheet(false);
      setIsRunning(false);
      Alert.alert('Success', 'Task moved to On Hold');
      navigation.goBack();
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
      await updateTaskStatus({
        TaskId: routeTask.Id,
        UserId: Number(uid),
        TaskStatus: TASK_STATUS_ID.Ongoing,
        TaskState: 2,
        Time: seconds,
      });
    } catch (err: any) {
      console.warn('[TaskExecution] handleEndTask: updateTaskStatus failed, continuing to closure:', err?.message);
    }
    navigation.navigate('TaskClosure', { task: routeTask, elapsedSeconds: seconds });
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

  const handleTaskInput = () => {
    navigation.navigate('TaskInput', { routeTask });
  };

  const renderPhotoSlots = (
    list: { uri: string; base64?: string }[],
    setList: React.Dispatch<React.SetStateAction<{ uri: string; base64?: string }[]>>,
  ) => (
    <View style={styles.photoRow}>
      {[0, 1, 2].map((i) => (
        <Pressable
          key={i}
          style={styles.photoBox}
          onPress={() => openPhotoPicker(list, setList, i)}
        >
          {list[i]?.uri ? (
            <Image source={{ uri: list[i].uri }} style={styles.photoThumb} />
          ) : (
            <Ionicons name="camera-outline" size={sp(44)} color="#848891" />
          )}
        </Pressable>
      ))}
    </View>
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
        <View style={styles.inputBox}>
          <Text style={styles.taskName}>{taskDetail?.Name || 'Task'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.sectionValue}>
          {taskDetail?.Description && taskDetail.Description !== 'undefined' && taskDetail.Description.trim() !== ''
            ? taskDetail.Description
            : 'NA'}
        </Text>

        {trackingDetail?.OnHoldTaskDtos?.OnHoldNotes && (
          <>
            <Text style={styles.sectionTitle}>On Hold Notes</Text>
            <Text style={styles.sectionValue}>{trackingDetail.OnHoldTaskDtos.OnHoldNotes}</Text>
          </>
        )}

        <Text style={styles.sectionTitle}>Item Assigned</Text>
        {taskDetail?.MultipleItemAssigned && taskDetail.MultipleItemAssigned.length > 0 ? (
          taskDetail.MultipleItemAssigned
            .filter((a: AssignedItem) => a.ItemName)
            .map((a: AssignedItem, idx: number) => (
              <View style={styles.inputBox} key={idx}>
                <Text style={styles.sectionValue}>{idx + 1}. {a.ItemName}</Text>
              </View>
            ))
        ) : (
          <Text style={styles.sectionValue}>NA</Text>
        )}

        {isRunning && (
          <>
            <Text style={styles.sectionTitle}>
              Picture Before Start Task
            </Text>
            {renderPhotoSlots(photos, setPhotos)}

            {trackingDetail?.PreDeviceInfoDto?.DeviceInfoNotes || note ? (
              <>
                <Text style={styles.sectionTitle}>Note</Text>
                <Text style={styles.sectionValue}>
                  {trackingDetail?.PreDeviceInfoDto?.DeviceInfoNotes || note}
                </Text>
              </>
            ) : null}
          </>
        )}

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

        <Text style={styles.timer}>{formatTime()}</Text>

        <View style={styles.topButtons}>
          <Pressable style={[styles.btn, styles.reject]} onPress={() => setShowRejectSheet(true)}>
            <Text style={styles.btnText}>REJECT</Text>
          </Pressable>

          <Pressable
            style={[styles.btn, styles.onhold]}
            onPress={() => {
              if (!isRunning) {
                Alert.alert('Task not started', 'Start the task before putting it on hold.');
                return;
              }
              setShowOnHoldSheet(true);
            }}
          >
            <Text style={styles.btnText}>ON HOLD</Text>
          </Pressable>

          <Pressable
            style={[styles.btn, isRunning ? styles.endTask : styles.start]}
            onPress={isRunning ? handleEndTask : handleStart}
          >
            <Text style={styles.btnText}>
              {
                isRunning
                  ? 'END TASK'
                  : showContinue
                    ? 'CONTINUE TASK'
                    : 'START'
              }
            </Text>
          </Pressable>
        </View>

        <View style={styles.bottomButtons}>
          <Pressable style={styles.bottomBtn} onPress={handleTaskInput}>
            <Text style={styles.btnText}>TASK INPUT</Text>
          </Pressable>
          <Pressable style={styles.bottomBtn} onPress={() => navigation.navigate('ItemRequest', { routeTask })}>
            <Text style={styles.btnText}>REQUEST ITEMS</Text>
          </Pressable>
        </View>
      </ScrollView>

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

      {/* UPLOAD BEFORE-PHOTO SHEET */}
      {showUploadSheet && (
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.uploadIcon}>
                <Ionicons name="cloud-upload-outline" size={sp(20)} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Upload Photo</Text>
                <Text style={styles.sheetSub}>Please take the picture before starting the task</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setShowUploadSheet(false)} hitSlop={10}>
                <Ionicons name="close" size={sp(22)} color="#fff" />
              </Pressable>
            </View>
            {renderPhotoSlots(photos, setPhotos)}
            <View style={styles.noteBox}>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Note"
                placeholderTextColor="#9CA3AF"
                style={{ color: '#111827', fontSize: sp(16) }}
              />
            </View>
            <Pressable style={styles.uploadBtn} onPress={handleUploadAndStart} disabled={uploading}>
              <Text style={styles.uploadText}>{uploading ? 'UPLOADING...' : 'UPLOAD'}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* REJECT SHEET */}
      {showRejectSheet && (
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={[styles.uploadIcon, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="share-outline" size={sp(22)} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Reject</Text>
                <Text style={styles.sheetSub}>Please take the picture before rejecting the task</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setShowRejectSheet(false)} hitSlop={10}>
                <Ionicons name="close" size={sp(22)} color="#fff" />
              </Pressable>
            </View>
            {renderPhotoSlots(rejectPhotos, setRejectPhotos)}
            <View style={styles.noteBox}>
              <TextInput
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="Reason for Reject"
                placeholderTextColor="#848484"
                style={{ color: '#111827', fontSize: sp(16) }}
              />
            </View>
            <Pressable style={[styles.uploadBtn, { backgroundColor: COLORS.primary }]} onPress={handleReject} disabled={rejecting}>
              <Text style={styles.uploadText}>{rejecting ? 'REJECTING...' : 'REJECT'}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ON HOLD SHEET */}
      {showOnHoldSheet && (
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Reason for holding the task ?</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setShowOnHoldSheet(false)} hitSlop={10}>
                <Ionicons name="close" size={sp(22)} color="#fff" />
              </Pressable>
            </View>
            <View style={styles.noteBox}>
              <TextInput
                value={onHoldReason}
                onChangeText={setOnHoldReason}
                placeholder="Note"
                placeholderTextColor="#848484"
                style={{ color: '#111827', fontSize: sp(16) }}
              />
            </View>
            {renderPhotoSlots(onHoldPhotos, setOnHoldPhotos)}
            <View style={{ flexDirection: 'row', gap: scale(12) }}>
              <Pressable style={[styles.uploadBtn, { backgroundColor: COLORS.black, flex: 1 }]} onPress={handleOnHold} disabled={onHolding}>
                <Text style={styles.uploadText}>{onHolding ? 'SAVING...' : 'PUT ON HOLD'}</Text>
              </Pressable>
              <Pressable
                style={[styles.uploadBtn, { backgroundColor: COLORS.primary, flex: 1 }]}
                onPress={() => {
                  setShowOnHoldSheet(false);
                  navigation.navigate('ItemRequest', { routeTask, fromOnHold: true });
                }}
              >
                <Text style={styles.uploadText}>REQUEST ITEMS</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
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
  root:          { flex: 1, backgroundColor: COLORS.primary },
  scrollArea:    { flex: 1, marginTop: HEADER_TOP_PADDING + vs(10), backgroundColor: '#fff', borderTopLeftRadius: scale(28), borderTopRightRadius: scale(28) },
  scrollContent: { alignItems: 'flex-start', paddingTop: vs(30), paddingHorizontal: scale(20), paddingBottom: vs(40) },

  timer:         { fontSize: sp(36), alignSelf: 'center', width: '100%', textAlign: 'center', marginTop: vs(100), marginBottom: vs(10) },
  topButtons:    { flexDirection: 'row', gap: scale(10), marginBottom: vs(16), alignSelf: 'center' },
  btn:           { height: vs(44), width: scale(110), borderRadius: scale(28), alignItems: 'center', justifyContent: 'center' },
  reject:        { backgroundColor: COLORS.primary },
  start:         { backgroundColor: '#16A34A' },
  onhold:        { backgroundColor: COLORS.black },
  endTask:       { backgroundColor: '#16A34A' },
  btnText:       { color: '#fff', fontWeight: '500', fontSize: sp(15), textAlign: 'center' },
  bottomButtons: { flexDirection: 'row', gap: scale(10), alignSelf: 'center' },
  bottomBtn:     { backgroundColor: COLORS.black, height: vs(44), width: scale(148), borderRadius: scale(28), alignItems: 'center', justifyContent: 'center' },
  taskName:      { fontSize: sp(18), color: COLORS.black, fontWeight: '500' },
  inputBox:      { width: '100%', borderWidth: 2, borderColor: '#d2d2d2', borderRadius: scale(12), marginBottom: vs(16), minHeight: vs(44), paddingHorizontal: scale(12), justifyContent: 'center' },
  sectionTitle:  { fontSize: sp(17), color: COLORS.black, marginTop: vs(8), fontWeight: '500' },
  sectionValue:  { fontSize: sp(17), color: '#111827', marginBottom: vs(8), fontWeight: '400', textAlign: 'justify' },
  audioCard:     { width: '100%', borderWidth: 1.05, borderColor: '#d2d2d2', borderRadius: scale(30), paddingVertical: vs(18), alignItems: 'center', marginTop: vs(12), marginBottom: vs(12) },
  audioText:     { color: '#858688', marginBottom: vs(10), fontSize: sp(14) },
  playBtn:       { width: scale(52), height: scale(52), borderRadius: scale(26), backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center' },

  sheetOverlay:  { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet:         { backgroundColor: '#fff', borderTopLeftRadius: scale(28), borderTopRightRadius: scale(28), padding: scale(20), elevation: 10 },
  sheetHeader:   { flexDirection: 'row', alignItems: 'center', gap: scale(10), marginBottom: vs(16) },
  uploadIcon:    { width: scale(36), height: scale(36), borderRadius: scale(18), backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  closeBtn:      { width: scale(36), height: scale(36), borderRadius: scale(18), backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginLeft: scale(12) },
  sheetTitle:    { fontSize: sp(17), fontWeight: '400' },
  sheetSub:      { fontSize: sp(12), color: '#6B7280' },
  photoRow:      { flexDirection: 'row', justifyContent: 'space-between', marginVertical: vs(24), gap: scale(16) },
  photoBox:      { flex: 1, height: vs(100), borderWidth: 1, borderColor: '#848484', borderRadius: scale(12), alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoThumb:    { width: '100%', height: '100%' },
  noteBox:       { borderWidth: 1, borderColor: '#848484', borderRadius: scale(30), marginBottom: vs(20), paddingLeft: scale(15), height: vs(44), justifyContent: 'center' },
  uploadBtn:     { backgroundColor: COLORS.primary, borderRadius: scale(30), alignItems: 'center', height: vs(44), justifyContent: 'center' },
  uploadText:    { color: '#fff', fontWeight: '500', fontSize: sp(18) },

  modalBackdrop:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(32) },
  photoSourceSheet:      { backgroundColor: '#fff', borderRadius: scale(16), width: '100%', maxWidth: scale(360), paddingVertical: vs(8), elevation: 10 },
  photoSourceTitle:      { fontSize: sp(17), fontWeight: '600', color: '#111', paddingHorizontal: scale(20), paddingVertical: vs(14) },
  photoSourceDivider:    { height: 1, backgroundColor: '#F3F4F6' },
  photoSourceOption:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(20), paddingVertical: vs(14), gap: scale(14) },
  photoSourceIconWrap:   { width: scale(34), height: scale(34), borderRadius: scale(17), alignItems: 'center', justifyContent: 'center' },
  photoSourceOptionText: { fontSize: sp(15), color: '#1F2937' },
});