// src/screens/technician/main/TaskTrackingScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, TouchableOpacity,
  ScrollView, Modal, TextInput, Platform, StatusBar, Alert, Linking
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import type { TasksListResultData as Task } from '../../../api/task/task.types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TechnicianStackParamList } from '../../../navigation/TechStack';
import { useTaskStatus, TaskStatusAmbiguousError } from '../../../hooks/useTaskStatus';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, vs, sp, ms, hp } from '../../../utils/responsive';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const REJECTION_REASONS = [
  'Not available', 'Wrong area', 'Personal reason', 'Equipment issue', 'Other',
];

const handleCallTask = (task: Task) => {
  const phone = task.ContactNo ?? task.TechContactNo;
  if (phone) Linking.openURL(`tel:${phone}`);
  else Alert.alert('Unavailable', 'Contact number is not available.');
};

const handleLocationTask = async (task: Task) => {
  const lat = task.Latitude ? parseFloat(task.Latitude) : 0;
  const lng = task.Longitude ? parseFloat(task.Longitude) : 0;
  if (!lat || !lng) {
    Alert.alert('Unable to find destination', 'Google Map is unable to find this destination.');
    return;
  }
  const nativeNavUrl = `google.navigation:q=${lat},${lng}`;
  const webFallbackUrl = `https://maps.google.com/maps?daddr=${lat},${lng}`;
  try {
    const canOpenNative = await Linking.canOpenURL(nativeNavUrl);
    if (canOpenNative) await Linking.openURL(nativeNavUrl);
    else await Linking.openURL(webFallbackUrl);
  } catch {
    Alert.alert('Maps Unavailable', 'Please install a maps application to continue.');
  }
};

interface TaskFlowState {
  isTaskEnd: boolean; isTaskClosure: boolean; isTaskStart: boolean;
  isTaskCountdown: boolean; isTaskRejected: boolean; isCompleted: boolean;
}

const defaultFlowState: TaskFlowState = {
  isTaskEnd: false, isTaskClosure: false, isTaskStart: false,
  isTaskCountdown: false, isTaskRejected: false, isCompleted: false,
};

type Props = NativeStackScreenProps<TechnicianStackParamList, 'TaskTracking'>;

export default function TaskTrackingScreen({ navigation, route }: Props) {
  const { task, autoReject = false, resumeOnHold = false } = route.params;
  const insets = useSafeAreaInsets();

  const [flowState, setFlowState] = useState<TaskFlowState>(defaultFlowState);
  const [sheetStep, setSheetStep] = useState<'actions' | 'reject'>(autoReject ? 'reject' : 'actions');
  const [sheetVisible, setSheetVisible] = useState(true);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const { actionState, errorMessage, acceptTask, rejectTask } = useTaskStatus();
  const isLoading = actionState === 'loading';
  const userId    = task.UserId ?? 0;

  const isResumeFlow = task.TaskStatus === 'OnHold' || task.TaskStatusId === 5 || resumeOnHold;

  const [rejectPhotos, setRejectPhotos] = useState<{ uri: string; base64?: string }[]>([]);
  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);
  const pendingPhotoIndexRef = React.useRef<number | null>(null);

  const openPhotoPicker = (index: number) => {
    pendingPhotoIndexRef.current = index;
    setShowPhotoSourceModal(true);
  };

  const handlePhotoSource = async (source: 'camera' | 'gallery') => {
    setShowPhotoSourceModal(false);
    const index = pendingPhotoIndexRef.current;
    if (index === null) return;
    pendingPhotoIndexRef.current = null;

    const result = source === 'camera'
      ? await launchCamera({ mediaType: 'photo', includeBase64: true, quality: 0.7 })
      : await launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.7 });

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    setRejectPhotos(prev => {
      const updated = [...prev];
      updated[index] = { uri: asset.uri!, base64: asset.base64 };
      return updated;
    });
  };

  const setFlow = (patch: Partial<TaskFlowState>) =>
    setFlowState(prev => ({ ...prev, ...patch }));

  const handleAccept = async (responseCode?: string) => {
    if (!isResumeFlow && task.ResponseCode && Number(task.ResponseCode) !== 0) {
      if (!responseCode || !responseCode.trim()) {
        Alert.alert('Response Code Required', 'Please enter the response code.');
        return;
      }
      if (Number(responseCode.trim()) !== Number(task.ResponseCode)) {
        Alert.alert('Invalid Code', 'Please enter a valid response code.');
        return;
      }
    }

    const updated = await acceptTask(task, userId, responseCode);

    if (!updated) {
      Alert.alert('Error', errorMessage ?? 'Could not accept task');
      return;
    }

    setFlow({ isTaskStart: true });
    setSheetVisible(false);
    navigation.navigate('TaskRouteMap', { task: updated });
  };

  const handleRejectConfirm = async () => {
    if (!selectedReason) return;

    const photosWithImage = rejectPhotos.filter(p => p?.base64);
    if (photosWithImage.length === 0) {
      Alert.alert('Validation', 'At least one image is mandatory to reject the task');
      return;
    }

    const success = await rejectTask(task, userId, selectedReason, photosWithImage, rejectNote.trim() || undefined);
    if (!success) { console.warn(errorMessage ?? 'Could not reject task'); return; }
    setFlow({ isTaskRejected: true });
    setSheetVisible(false);
    navigation.goBack();
  };

  const handleClose = () => navigation.goBack();

  return (
    <View style={styles.root}>
      <View style={styles.bgOverlay} />

      <Modal visible={sheetVisible} transparent animationType="slide">
        <View style={styles.modalOverlay} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + ms(8) }]}>
          {sheetStep === 'actions' && (
            isResumeFlow
              ? <OnHoldResumeSheet task={task} onClose={handleClose} onResume={handleAccept} isLoading={isLoading} />
              : <ActionSheet task={task} onClose={handleClose} onAccept={handleAccept} onReject={() => setSheetStep('reject')} isLoading={isLoading} />
          )}
          {sheetStep === 'reject' && (
            <RejectSheet
              reasons={REJECTION_REASONS}
              selectedReason={selectedReason}
              onSelectReason={setSelectedReason}
              note={rejectNote}
              onNoteChange={setRejectNote}
              onConfirm={handleRejectConfirm}
              onBack={() => setSheetStep('actions')}
              isLoading={isLoading}
              photos={rejectPhotos}
              onOpenPhotoPicker={openPhotoPicker}
            />
          )}
        </View>
      </Modal>

      <Modal visible={showPhotoSourceModal} transparent animationType="fade" onRequestClose={() => setShowPhotoSourceModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowPhotoSourceModal(false)}>
          <Pressable>
            <View style={styles.photoSourceSheet}>
              <Text style={styles.photoSourceTitle}>Select Image Source</Text>
              <View style={styles.photoSourceDivider} />
              <TouchableOpacity style={styles.photoSourceOption} onPress={() => handlePhotoSource('camera')}>
                <View style={[styles.photoSourceIconWrap, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="camera-outline" size={scale(20)} color="#fff" />
                </View>
                <Text style={styles.photoSourceOptionText}>Camera</Text>
              </TouchableOpacity>
              <View style={styles.photoSourceDivider} />
              <TouchableOpacity style={styles.photoSourceOption} onPress={() => handlePhotoSource('gallery')}>
                <View style={[styles.photoSourceIconWrap, { backgroundColor: '#6366F1' }]}>
                  <Ionicons name="images-outline" size={scale(20)} color="#fff" />
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
    </View>
  );
}

function ActionSheet({ task, onClose, onAccept, onReject, isLoading }: {
  task: Task; onClose: () => void; onAccept: (responseCode?: string) => void;
  onReject: () => void; isLoading: boolean;
}) {
  const requiresResponseCode = !!task.ResponseCode && Number(task.ResponseCode) !== 0;
  const [responseCode, setResponseCode] = useState('');
  const codeReady = !requiresResponseCode || responseCode.trim().length > 0;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
      <View style={styles.titleRow}>
        <Text style={styles.sheetTaskName} numberOfLines={2}>{task.Name || 'Task'}</Text>
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
          <Ionicons name="close" size={scale(18)} color="#fff" />
        </Pressable>
      </View>
      <Text style={styles.taskDesc}>{task.Description}</Text>
      <Text style={styles.sectionLabel}>Customer Details</Text>
      <Text style={styles.fetchText}>{task.CustomerName}</Text>
      <View style={styles.addressRow}>
        <Text style={styles.addressText} numberOfLines={3}>{task.LocationName}</Text>
        <View style={styles.iconGroup}>
          <Pressable style={styles.iconBtn} onPress={() => handleLocationTask(task)}><Ionicons name="location" size={scale(26)} color={COLORS.primary} /></Pressable>
          <Pressable style={styles.iconBtn} onPress={() => handleCallTask(task)}><Ionicons name="call-outline" size={scale(26)} color={COLORS.primary} /></Pressable>
        </View>
      </View>
      <Text style={styles.sectionLabel}>Landmark</Text>
      <Text style={styles.fetchText}>{task.LocationDesc}</Text>
      {requiresResponseCode && (
        <>
          <View style={{ height: vs(12) }} />
          <Text style={styles.sectionLabel}>Enter Response Code</Text>
          <TextInput
            value={responseCode}
            onChangeText={setResponseCode}
            placeholder="••••"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            maxLength={4}
            style={styles.otpInput}
            cursorColor={COLORS.primary}
          />
        </>
      )}
      <View style={{ height: vs(24) }} />
      <View style={styles.btnRow}>
        <Pressable style={[styles.pillBtn, styles.rejectPillBtn, isLoading && styles.btnDisabled]} onPress={onReject} disabled={isLoading}>
          <Text style={styles.pillBtnLabel}>REJECT</Text>
        </Pressable>
        <Pressable
          style={[styles.pillBtn, styles.acceptPillBtn, (isLoading || !codeReady) && styles.btnDisabled]}
          onPress={() => onAccept(requiresResponseCode ? responseCode.trim() : undefined)}
          disabled={isLoading || !codeReady}
        >
          <Text style={styles.pillBtnLabel}>{isLoading ? 'Please wait…' : 'ACCEPT'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function OnHoldResumeSheet({ task, onClose, onResume, isLoading }: {
  task: Task; onClose: () => void; onResume: () => void; isLoading: boolean;
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
      <View style={styles.titleRow}>
        <Text style={styles.sheetTaskName} numberOfLines={2}>{task.Name || 'Task'}</Text>
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
          <Ionicons name="close" size={scale(18)} color="#fff" />
        </Pressable>
      </View>
      <Text style={styles.taskDesc}>{task.Description || 'Special Instruction'}</Text>
      <Text style={styles.sectionLabel}>Customer Details</Text>
      <Text style={styles.fetchText}>{task.CustomerName}</Text>
      <View style={styles.addressRow}>
        <Text style={styles.addressText} numberOfLines={3}>{task.LocationName}</Text>
        <View style={styles.iconGroup}>
          <Pressable style={styles.iconBtn} onPress={() => handleLocationTask(task)}><Ionicons name="location" size={scale(26)} color={COLORS.primary} /></Pressable>
          <Pressable style={styles.iconBtn} onPress={() => handleCallTask(task)}><Ionicons name="call-outline" size={scale(26)} color={COLORS.primary} /></Pressable>
        </View>
      </View>
      <Text style={styles.sectionLabel}>Landmark</Text>
      <Text style={styles.fetchText}>{task.LocationDesc || 'NA'}</Text>
      <View style={{ height: vs(32) }} />
      <Text style={styles.resumePrompt}>Do you want to Resume this Task?</Text>
      <View style={styles.btnRow}>
        <Pressable style={[styles.pillBtn, { backgroundColor: '#E5E7EB' }]} onPress={onClose}>
          <Text style={[styles.pillBtnLabel, { color: '#9CA3AF' }]}>NO</Text>
        </Pressable>
        <Pressable style={[styles.pillBtn, styles.acceptPillBtn, isLoading && styles.btnDisabled]} onPress={() => onResume()} disabled={isLoading}>
          <Text style={styles.pillBtnLabel}>{isLoading ? 'Please wait…' : 'YES'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function RejectSheet({ reasons, selectedReason, onSelectReason, note, onNoteChange, onConfirm, onBack, isLoading, photos, onOpenPhotoPicker }: {
  reasons: string[]; selectedReason: string | null;
  onSelectReason: (r: string) => void; note: string;
  onNoteChange: (t: string) => void; onConfirm: () => void;
  onBack: () => void; isLoading: boolean;
  photos: { uri: string; base64?: string }[];
  onOpenPhotoPicker: (index: number) => void;
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
      <View style={styles.titleRow}>
        <Pressable onPress={onBack} hitSlop={10} style={{ marginRight: scale(12) }}>
          <Ionicons name="arrow-back" size={scale(22)} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.sheetTaskName}>Reason for Rejection</Text>
      </View>
      <View style={styles.photoRow}>
        {[0, 1, 2].map(i => (
          <Pressable key={i} style={styles.photoBox} onPress={() => onOpenPhotoPicker(i)}>
            {photos[i]?.uri
              ? <Image source={{ uri: photos[i].uri }} style={styles.photoThumb} />
              : <Ionicons name="camera-outline" size={sp(44)} color="#848891" />}
          </Pressable>
        ))}
      </View>
      <Text style={styles.sectionLabel}>Additional note (optional)</Text>
      <TextInput
        value={note} onChangeText={onNoteChange}
        placeholder="Describe the reason…" placeholderTextColor="#9CA3AF"
        multiline style={styles.noteInput}
        cursorColor={COLORS.primary} textAlignVertical="top"
      />
      <View style={{ height: vs(12) }} />
      <Pressable
        style={[styles.pillBtn, styles.rejectPillBtn, { width: '100%' }, (!selectedReason || isLoading) && styles.btnDisabled]}
        onPress={onConfirm} disabled={!selectedReason || isLoading}
      >
        <Text style={styles.pillBtnLabel}>{isLoading ? 'Please wait…' : 'CONFIRM REJECTION'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: COLORS.primary },
  bgOverlay:   { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalOverlay:{ flex: 1 },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    maxHeight: hp(88),
  },
  sheetScroll: { padding: scale(20), paddingBottom: vs(24) },
  titleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: vs(16) },
  sheetTaskName: { flex: 1, fontSize: sp(22), fontWeight: '400', color: '#111827', lineHeight: sp(30) },
  closeBtn: {
    width: scale(34), height: scale(34), borderRadius: scale(17),
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginLeft: scale(12),
  },
  sectionLabel:  { fontSize: sp(18), color: COLORS.textMuted, marginBottom: vs(2) },
  fetchText:     { fontSize: sp(16), color: COLORS.black, marginBottom: vs(8) },
  taskDesc:      { fontSize: sp(18), color: COLORS.black, marginBottom: vs(12), fontWeight: '400' },
  addressRow:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: vs(14), gap: scale(8) },
  addressText:   { flex: 1, fontSize: sp(16), color: COLORS.black, lineHeight: sp(22) },
  iconGroup:     { flexDirection: 'row', alignItems: 'center', gap: scale(8), paddingTop: vs(2), marginLeft:scale(60) },
  iconBtn:       { padding: scale(4) },
  btnRow:        { flexDirection: 'row', gap: scale(12) },
  pillBtn:       { flex: 1, height: ms(54), borderRadius: scale(28), alignItems: 'center', justifyContent: 'center' },
  rejectPillBtn: { backgroundColor: '#DC2626' },
  acceptPillBtn: { backgroundColor: '#16A34A' },
  btnDisabled:   { opacity: 0.4 },
  pillBtnLabel:  { color: '#fff', fontSize: sp(18), fontWeight: '500', letterSpacing: 0.5 },
  resumePrompt:  { textAlign: 'center', fontSize: sp(18), color: COLORS.primary, marginBottom: vs(20), fontWeight: '400' },
  photoRow:      { flexDirection: 'row', justifyContent: 'space-between', marginVertical: vs(24), gap: scale(16) },
  photoBox:      { flex: 1, height: vs(100), borderWidth: 1, borderColor: '#848484', borderRadius: scale(12), alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoThumb:    { width: '100%', height: '100%' },
  noteInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: scale(12),
    padding: scale(12), fontSize: sp(14), color: '#111827', height: vs(90),
  },
  otpInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: scale(12),
    paddingVertical: vs(10), paddingHorizontal: scale(14),
    fontSize: sp(18), color: '#111827', letterSpacing: scale(6),
    width: scale(140),
  },
  modalBackdrop:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(32) },
  photoSourceSheet:      { backgroundColor: '#fff', borderRadius: scale(16), width: '100%', maxWidth: scale(360), paddingVertical: vs(8), elevation: 10 },
  photoSourceTitle:      { fontSize: sp(17), fontWeight: '600', color: '#111', paddingHorizontal: scale(20), paddingVertical: vs(14) },
  photoSourceDivider:    { height: 1, backgroundColor: '#F3F4F6' },
  photoSourceOption:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(20), paddingVertical: vs(14), gap: scale(14) },
  photoSourceIconWrap:   { width: scale(34), height: scale(34), borderRadius: scale(17), alignItems: 'center', justifyContent: 'center' },
  photoSourceOptionText: { fontSize: sp(15), color: '#1F2937' },
});