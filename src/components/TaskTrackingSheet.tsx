// src/components/TaskTrackingSheet.tsx
//
// Java TaskDialogNew.acceptTaskDialog (dialog_accept_task.xml): a bottom-gravity dialog shown
// over whichever screen the technician tapped the task on (Home / Task tab), so it is hosted
// in place by those screens; TaskTrackingScreen only hosts it for the remaining entry points
// (notification, late reject, resume deep links).
import { launchCameraWithPermission } from '../utils/cameraPermission';
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, TouchableOpacity,
  ScrollView, TextInput, Alert, Linking,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Modal from './AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../theme/theme';
import type { TasksListResultData as Task } from '../api/task/task.types';
import { useTaskStatus } from '../hooks/useTaskStatus';
import { scale, vs, sp, ms } from '../utils/responsive';
import { launchImageLibrary } from 'react-native-image-picker';

const REJECTION_REASONS = [
  'Not available', 'Wrong area', 'Personal reason', 'Equipment issue', 'Other',
];

// drawable/rounded_button (colorPrimaryDark) and rounded_button_green (#4EB54E), 34dp radius.
const ACCEPT_GREEN = '#4EB54E';
// TextInputLayoutStyle hintTextColor.
const REASON_FOCUS_GREEN = '#2a7d6f';

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

// drawable/ic_close_popupp: red disc, light ring, white cross.
const ClosePopupIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Path fill="#FFFFFF" d="M12.5547,12.5547C1.8164,23.293 1.8164,40.707 12.5547,51.4453C23.293,62.1836 40.707,62.1836 51.4453,51.4453C62.1836,40.707 62.1836,23.293 51.4453,12.5547C40.707,1.8164 23.293,1.8164 12.5547,12.5547Z" />
    <Path fill="#C3002F" d="M17.8555,17.8594C10.0469,25.668 10.0469,38.332 17.8594,46.1406C25.668,53.9531 38.332,53.9531 46.1406,46.1406C53.9531,38.332 53.9531,25.668 46.1406,17.8594C38.332,10.0469 25.668,10.0469 17.8555,17.8594Z" />
    <Path fill="#F7F9F9" d="M32,61C24.25,61 16.9492,58 11.5,52.5C6,47.0508 3,39.75 3,32C3,24.25 6,16.9492 11.5,11.5C17,6 24.25,3 32,3C39.75,3 47.0508,6 52.5,11.5C58,17 61,24.25 61,32C61,39.75 58,47.0508 52.5,52.5C47.0508,58 39.75,61 32,61ZM32,6C25.0508,6 18.5508,8.6992 13.6016,13.6016C8.6484,18.5 6,25.0508 6,32C6,38.9492 8.6992,45.4492 13.6016,50.3984C18.5,55.3516 25.0508,58 32,58C38.9492,58 45.4492,55.3008 50.3984,50.3984C55.3516,45.5 58,38.9492 58,32C58,25.0508 55.3008,18.5508 50.3984,13.6016C45.4492,8.6992 38.9492,6 32,6Z" />
    <Path fill="#FFFFFF" d="M34.1016,32L39.75,26.3516C40.3516,25.75 40.3516,24.8008 39.75,24.25C39.1484,23.6484 38.1992,23.6484 37.6484,24.25L32,29.8984L26.3516,24.1992C25.75,23.6016 24.8008,23.6016 24.25,24.1992C23.6484,24.8008 23.6484,25.75 24.25,26.3008L29.8984,32L24.1992,37.6484C23.6016,38.25 23.6016,39.1992 24.1992,39.75C24.5,40.0508 24.8984,40.1992 25.25,40.1992C25.6016,40.1992 26,40.0508 26.3008,39.75L32,34.1016L37.6484,39.75C37.9492,40.0508 38.3516,40.1992 38.6992,40.1992C39.0508,40.1992 39.4492,40.0508 39.75,39.75C40.3516,39.1484 40.3516,38.1992 39.75,37.6484Z" />
  </Svg>
);

// drawable/location_advance, tinted colorPrimaryDark.
const LocationPinIcon = ({ width, height }: { width: number; height: number }) => (
  <Svg width={width} height={height} viewBox="0 0 90 90">
    <Path fill={COLORS.primary} d="M45.05,3.5h-0.12C23.64,3.5 10.37,26.52 21,44.92L45.01,86.5l23.97,-41.58C79.65,26.52 66.34,3.5 45.05,3.5zM45.01,43.51c-6.82,0 -12.36,-5.54 -12.36,-12.36c0,-6.82 5.54,-12.36 12.36,-12.36s12.32,5.54 12.32,12.36C57.33,37.97 51.83,43.51 45.01,43.51z" />
  </Svg>
);

// drawable/ic_amc_red (shown when PaymentMode is AMC).
const AmcIcon = ({ width, height }: { width: number; height: number }) => (
  <Svg width={width} height={height} viewBox="0 0 90 90">
    <Path fill="#C22033" d="M36.03,47.67h-3.31l-0.49,1.5h-3.27l3.63,-9.92h3.59l3.62,9.92h-3.28L36.03,47.67zM35.27,45.32l-0.9,-2.76l-0.9,2.76H35.27z" />
    <Path fill="#C22033" d="M51.86,39.24v9.92h-3.1v-4.95l-1.53,4.95h-2.66l-1.53,-4.95v4.95h-3.11v-9.92h3.81l2.19,5.96l2.13,-5.96H51.86z" />
    <Path fill="#C22033" d="M53.02,41.57c0.4,-0.77 0.96,-1.36 1.7,-1.79c0.74,-0.43 1.61,-0.64 2.61,-0.64c0.86,0 1.63,0.16 2.3,0.48c0.68,0.32 1.23,0.78 1.65,1.37c0.43,0.59 0.71,1.28 0.85,2.06h-3.28c-0.15,-0.33 -0.36,-0.58 -0.64,-0.76c-0.28,-0.18 -0.59,-0.27 -0.95,-0.27c-0.52,0 -0.94,0.2 -1.24,0.59c-0.3,0.39 -0.46,0.92 -0.46,1.58c0,0.66 0.15,1.19 0.46,1.58c0.3,0.39 0.72,0.59 1.24,0.59c0.36,0 0.67,-0.09 0.95,-0.27c0.28,-0.18 0.49,-0.44 0.64,-0.76h3.28c-0.14,0.79 -0.42,1.47 -0.85,2.06c-0.42,0.59 -0.98,1.04 -1.65,1.37c-0.68,0.32 -1.45,0.48 -2.3,0.48c-1,0 -1.87,-0.21 -2.61,-0.64c-0.74,-0.42 -1.31,-1.02 -1.7,-1.79c-0.4,-0.77 -0.6,-1.64 -0.6,-2.62C52.42,43.21 52.62,42.33 53.02,41.57z" />
    <Path fill="#C22033" d="M76.16,82.79H13.84c-5.71,0 -10.35,-4.64 -10.35,-10.35V17.55c0,-5.71 4.64,-10.35 10.35,-10.35h62.32c5.71,0 10.35,4.64 10.35,10.35v54.89C86.51,78.15 81.87,82.79 76.16,82.79zM13.84,13.29c-2.35,0 -4.26,1.91 -4.26,4.26v54.89c0,2.35 1.91,4.26 4.26,4.26h62.32c2.35,0 4.26,-1.91 4.26,-4.26V17.55c0,-2.35 -1.91,-4.26 -4.26,-4.26H13.84z" />
    <Path fill="#C22033" d="M68.22,72.46H21.78v-3.39c0,-2.75 -2.24,-4.99 -4.99,-4.99h-3.39V25.92h3.39c2.75,0 4.99,-2.24 4.99,-4.99v-3.39h46.45v3.39c0,2.75 2.24,4.99 4.99,4.99h3.39v38.16h-3.39c-2.75,0 -4.99,2.24 -4.99,4.99V72.46zM28.07,65.67h33.87c1.14,-3.77 4.12,-6.75 7.89,-7.89V32.21c-3.77,-1.14 -6.75,-4.12 -7.89,-7.89H28.07c-1.14,3.77 -4.12,6.75 -7.89,7.89v25.57C23.95,58.92 26.93,61.9 28.07,65.67z" />
  </Svg>
);

type Props = {
  task: Task;
  autoReject?: boolean;
  resumeOnHold?: boolean;
  navigation: any;
  /** Dialog dismissed without going anywhere (close icon, hardware back, rejected). */
  onClose: () => void;
  /** The flow moved on to another screen (accept / resume): just drop the dialog. */
  onFinished?: () => void;
  /** The task was rejected (hosts reload their list). */
  onRejected?: () => void;
};

export default function TaskTrackingSheet({
  task, autoReject = false, resumeOnHold = false, navigation, onClose, onFinished, onRejected,
}: Props) {
  const [sheetStep, setSheetStep] = useState<'actions' | 'reject'>(autoReject ? 'reject' : 'actions');
  const [sheetVisible, setSheetVisible] = useState(true);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  // Java acceptTaskDialog: Reject expands the same dialog (photos + reason) instead of a new step.
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNoteError, setRejectNoteError] = useState(false);

  const { actionState, errorMessage, wasTaskUnavailable, acceptTask, resumeTask, rejectTask } = useTaskStatus();

  // Java: ValidateTaskDetails -> 201 "No Data Found." sends the user home to refresh.
  const handleTaskUnavailable = () =>
    Alert.alert('Task Unavailable', 'This task is no longer available. Refreshing your tasks.', [
      { text: 'OK', onPress: () => navigation.navigate('Home') },
    ]);
  const isLoading = actionState === 'loading';
  const userId    = task.UserId ?? 0;

  const isResumeFlow = task.TaskStatus === 'OnHold' || task.TaskStatusId === 5 || resumeOnHold;

  const [rejectPhotos, setRejectPhotos] = useState<{ uri: string; base64?: string }[]>([]);
  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);
  const pendingPhotoIndexRef = useRef<number | null>(null);

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
      ? await launchCameraWithPermission({ mediaType: 'photo', includeBase64: true, quality: 0.7 })
      : await launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.7 });

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    setRejectPhotos(prev => {
      const updated = [...prev];
      updated[index] = { uri: asset.uri!, base64: asset.base64 };
      return updated;
    });
  };

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
      if (wasTaskUnavailable()) {
        handleTaskUnavailable();
        return;
      }
      Alert.alert('Error', errorMessage ?? 'Could not accept task');
      return;
    }

    setSheetVisible(false);
    onFinished?.();
    // Java swaps fragments without a back stack, so "back" from the next step must not land
    // on this Accept dialog and post the accept again.
    navigation.navigate('TaskRouteMap', { task: updated });
  };

  // OnHold -> Ongoing. Java skips the route map and opens the countdown screen directly
  // (TechDashboardFragmentNew.updateTask -> navigateToStartTaskCountDown).
  const handleResume = async () => {
    const resumed = await resumeTask(task, userId);

    if (!resumed) {
      if (wasTaskUnavailable()) {
        handleTaskUnavailable();
        return;
      }
      Alert.alert('Error', errorMessage ?? 'Could not resume task');
      return;
    }

    setSheetVisible(false);
    onFinished?.();
    navigation.navigate('TaskExecution', { task: resumed });
  };

  const handleRejectConfirm = async () => {
    if (!selectedReason) return;

    const photosWithImage = rejectPhotos.filter(p => p?.base64);
    if (photosWithImage.length === 0) {
      Alert.alert('Validation', 'At least one image is mandatory to reject the task');
      return;
    }

    const success = await rejectTask(task, userId, selectedReason, photosWithImage, rejectNote.trim() || undefined);
    if (!success) {
      if (wasTaskUnavailable()) {
        handleTaskUnavailable();
        return;
      }
      Alert.alert('Error', errorMessage ?? 'Could not reject task');
      return;
    }
    setSheetVisible(false);
    onRejected?.();
    onClose();
  };

  // Java buttonReject.onClick: reveal the fields, then validate (reason, then image) on every
  // press; the last press posts the rejection with the reason as RejectedTaskNotes.
  const handleInlineReject = async () => {
    setRejectOpen(true);
    if (!rejectNote) {
      setRejectNoteError(true);
      return;
    }
    setRejectNoteError(false);
    const photosWithImage = rejectPhotos.filter(p => p?.base64);
    if (photosWithImage.length === 0) {
      Alert.alert('Validation', 'At least One Image is mandatory to Reject the Task !!');
      return;
    }
    const success = await rejectTask(task, userId, rejectNote, photosWithImage);
    if (!success) {
      if (wasTaskUnavailable()) {
        handleTaskUnavailable();
        return;
      }
      Alert.alert('Error', errorMessage ?? 'Could not reject task');
      return;
    }
    setSheetVisible(false);
    onRejected?.();
    onClose();
  };

  // Android hardware back: one step back inside the sheet (reject -> actions), otherwise
  // leave. A late-task reject (autoReject) has no "actions" step to return to.
  const handleBack = () => {
    if (sheetStep === 'reject' && !autoReject) {
      setSheetStep('actions');
    } else {
      onClose();
    }
  };

  return (
    <>
      <Modal visible={sheetVisible} transparent animationType="slide" onRequestClose={handleBack}>
        <View style={styles.modalRoot}>
        {/* Full-window dim behind the sheet so its rounded top corners read against it. */}
        <View style={styles.modalOverlay} />
        <View style={styles.sheet}>
          {sheetStep === 'actions' && (
            isResumeFlow
              ? <OnHoldResumeSheet task={task} onClose={onClose} onResume={handleResume} isLoading={isLoading} />
              : (
                <ActionSheet
                  task={task}
                  onClose={onClose}
                  onAccept={handleAccept}
                  onReject={handleInlineReject}
                  isLoading={isLoading}
                  rejectOpen={rejectOpen}
                  rejectNote={rejectNote}
                  onRejectNoteChange={t => { setRejectNote(t); if (t) setRejectNoteError(false); }}
                  rejectNoteError={rejectNoteError}
                  photos={rejectPhotos}
                  onOpenPhotoPicker={openPhotoPicker}
                />
              )
          )}
          {sheetStep === 'reject' && (
            <RejectSheet
              reasons={REJECTION_REASONS}
              selectedReason={selectedReason}
              onSelectReason={setSelectedReason}
              note={rejectNote}
              onNoteChange={setRejectNote}
              onConfirm={handleRejectConfirm}
              onBack={handleBack}
              isLoading={isLoading}
              photos={rejectPhotos}
              onOpenPhotoPicker={openPhotoPicker}
            />
          )}
        </View>
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
    </>
  );
}

// The shared header of the accept / resume dialogs: close icon pinned top-right (50dp view,
// 40dp icon), task name, description (hidden when empty), customer + address + landmark.
function TaskDetailsBlock({ task, onClose, resumeDefaults = false }: { task: Task; onClose: () => void; resumeDefaults?: boolean }) {
  const isAmc = (task.PaymentMode ?? '').toLowerCase() === 'amc';
  const description = task.Description || (resumeDefaults ? 'Special Instruction' : '');
  return (
    <View>
      <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={6}>
        <ClosePopupIcon size={ms(40)} />
      </Pressable>
      <View style={styles.content}>
        <Text style={styles.taskName}>{task.Name || 'Task'}</Text>
        {description ? <Text style={styles.taskDesc}>{description}</Text> : null}
        <Text style={styles.sectionLabel}>Customer Details</Text>
        <Text style={styles.valueText}>{task.CustomerName || 'NA'}</Text>
        <View style={styles.addressRow}>
          <Text style={styles.addressText}>{task.FullAddress || task.LocationName}</Text>
          <View style={styles.amcSlot}>{isAmc ? <AmcIcon width={ms(25)} height={ms(22)} /> : null}</View>
          <Pressable style={styles.locationBtn} onPress={() => handleLocationTask(task)} hitSlop={6}>
            <LocationPinIcon width={ms(25)} height={ms(25)} />
          </Pressable>
          <Pressable style={styles.callBtn} onPress={() => handleCallTask(task)} hitSlop={6}>
            <Image source={require('../../assets/images/ic_phone.png')} style={styles.callIcon} />
          </Pressable>
        </View>
        <Text style={[styles.sectionLabel, { marginTop: ms(10) }]}>Landmark</Text>
        <Text style={[styles.landmarkText]}>{task.LocationDesc || (resumeDefaults ? 'NA' : '')}</Text>
      </View>
    </View>
  );
}

// OtpView: 4 line-style boxes (lineColor light_gray, 2dp, 10dp spacing, colorPrimary bold digits).
function ResponseCodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<TextInput>(null);
  return (
    <View style={styles.codeBox}>
      <Text style={styles.codeLabel}>Response Code</Text>
      <Pressable style={styles.codeCells} onPress={() => inputRef.current?.focus()}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={styles.codeCell}>
            <Text style={styles.codeDigit}>{value[i] ?? ''}</Text>
          </View>
        ))}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={t => onChange(t.replace(/[^0-9]/g, '').slice(0, 4))}
          keyboardType="number-pad"
          maxLength={4}
          style={styles.codeHiddenInput}
          caretHidden
        />
      </Pressable>
    </View>
  );
}

function ActionSheet({
  task, onClose, onAccept, onReject, isLoading,
  rejectOpen, rejectNote, onRejectNoteChange, rejectNoteError, photos, onOpenPhotoPicker,
}: {
  task: Task; onClose: () => void; onAccept: (responseCode?: string) => void;
  onReject: () => void; isLoading: boolean;
  rejectOpen: boolean; rejectNote: string; onRejectNoteChange: (t: string) => void;
  rejectNoteError: boolean;
  photos: { uri: string; base64?: string }[];
  onOpenPhotoPicker: (index: number) => void;
}) {
  const requiresResponseCode = !!task.ResponseCode && Number(task.ResponseCode) !== 0;
  const [responseCode, setResponseCode] = useState('');
  const codeReady = !requiresResponseCode || responseCode.trim().length > 0;
  const [reasonFocused, setReasonFocused] = useState(false);
  const reasonFloating = reasonFocused || !!rejectNote || rejectNoteError;
  const reasonInputRef = useRef<TextInput>(null);
  // Java: EditText.setError popup only shows on the focused field, so the error focuses it.
  useEffect(() => {
    if (rejectNoteError) reasonInputRef.current?.focus();
  }, [rejectNoteError]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <TaskDetailsBlock task={task} onClose={onClose} />
      <View style={styles.content}>
        {requiresResponseCode && <ResponseCodeInput value={responseCode} onChange={setResponseCode} />}
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

        {rejectOpen && (
          <>
            {/* lnlRejectImgUpload: 3 x 100dp boxes (textview_border_curved), 20dp between. */}
            <View style={styles.rejectPhotoRow}>
              {[0, 1, 2].map(i => (
                <Pressable
                  key={i}
                  style={[styles.rejectPhotoBox, i === 1 && styles.rejectPhotoBoxMid]}
                  onPress={() => onOpenPhotoPicker(i)}
                >
                  {photos[i]?.uri
                    ? <Image source={{ uri: photos[i].uri }} style={styles.photoThumb} resizeMode="contain" />
                    : <Ionicons name="camera-outline" size={ms(56)} color={COLORS.lightGray} />}
                </Pressable>
              ))}
            </View>
            {/* rejeReasonLayout: outlined (34dp) "Reason for Reject"; EditText.setError popup. */}
            <View style={styles.reasonWrap}>
              {rejectNoteError && (
                <View style={styles.errorTip} pointerEvents="none">
                  <View style={styles.errorTipBox}>
                    <Text style={styles.errorTipText}>Enter Reason for Reject</Text>
                  </View>
                  <View style={styles.errorTipArrow} />
                </View>
              )}
              <View style={[styles.reasonBox, reasonFocused && styles.reasonBoxFocused]}>
                <TextInput
                  ref={reasonInputRef}
                  value={rejectNote}
                  onChangeText={onRejectNoteChange}
                  onFocus={() => setReasonFocused(true)}
                  onBlur={() => setReasonFocused(false)}
                  maxLength={100}
                  autoCapitalize="words"
                  style={styles.reasonInput}
                  cursorColor={COLORS.ink}
                />
                {rejectNoteError && (
                  <View style={styles.errorDot}>
                    <Text style={styles.errorDotText}>!</Text>
                  </View>
                )}
              </View>
              <Text
                pointerEvents="none"
                style={[
                  styles.reasonLabel,
                  reasonFloating ? styles.reasonLabelFloating : styles.reasonLabelResting,
                  reasonFocused && { color: REASON_FOCUS_GREEN },
                ]}
              >
                Reason for Reject
              </Text>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function OnHoldResumeSheet({ task, onClose, onResume, isLoading }: {
  task: Task; onClose: () => void; onResume: () => void; isLoading: boolean;
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <TaskDetailsBlock task={task} onClose={onClose} resumeDefaults />
      <View style={styles.content}>
        <Text style={styles.resumePrompt}>Do you want to Resume this Task?</Text>
        <View style={styles.btnRow}>
          <Pressable style={[styles.pillBtn, { backgroundColor: '#E5E7EB' }]} onPress={onClose}>
            <Text style={[styles.pillBtnLabel, { color: '#9CA3AF' }]}>NO</Text>
          </Pressable>
          <Pressable style={[styles.pillBtn, styles.acceptPillBtn, isLoading && styles.btnDisabled]} onPress={() => onResume()} disabled={isLoading}>
            <Text style={styles.pillBtnLabel}>{isLoading ? 'Please wait…' : 'YES'}</Text>
          </Pressable>
        </View>
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
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.rejectScroll}>
      <View style={styles.titleRow}>
        <Pressable onPress={onBack} hitSlop={10} style={{ marginRight: scale(12) }}>
          <Ionicons name="arrow-back" size={scale(22)} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.rejectTitle}>Reason for Rejection</Text>
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
        style={[styles.pillBtn, styles.rejectPillBtn, { width: '100%', flex: 0 }, (!selectedReason || isLoading) && styles.btnDisabled]}
        onPress={onConfirm} disabled={!selectedReason || isLoading}
      >
        <Text style={styles.pillBtnLabel}>{isLoading ? 'Please wait…' : 'CONFIRM REJECTION'}</Text>
      </Pressable>
    </ScrollView>
  );
}

// dialog_accept_task.xml: 30dp-radius card, 20dp side padding, 15sp texts, 22sp title.
const styles = StyleSheet.create({
  // The dialog dims the screen it was opened over.
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    maxHeight: '88%',
    overflow: 'hidden',
  },
  content: { paddingHorizontal: ms(20) },
  // imageView_cancel: 50dp square pinned top|end, icon 40dp (10dp bottom padding).
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: ms(50),
    height: ms(50),
    alignItems: 'center',
    zIndex: 2,
  },
  taskName: { marginTop: ms(30), fontSize: sp(22), color: COLORS.ink },
  taskDesc: { marginTop: ms(5), fontSize: sp(15), color: COLORS.ink },
  sectionLabel: { marginTop: ms(20), fontSize: sp(15), fontWeight: 'bold', color: COLORS.lightGray },
  valueText: { marginTop: ms(5), fontSize: sp(15), color: COLORS.ink },
  addressRow: { flexDirection: 'row', marginTop: ms(10), marginRight: ms(8), alignItems: 'flex-start' },
  addressText: { flex: 0.75, fontSize: sp(15), color: COLORS.ink },
  amcSlot: { flex: 0.15, alignItems: 'center' },
  locationBtn: { width: ms(25), marginRight: ms(8), marginTop: ms(-1) },
  callBtn: { flex: 0.1, alignItems: 'center' },
  callIcon: { width: ms(20), height: ms(20), tintColor: COLORS.primary },
  landmarkText: { marginTop: ms(5), fontSize: sp(14), color: COLORS.ink },
  // lnlResponseCode: bg_border (10dp radius, 1dp #f4f4f4), padding 10, marginTop 10.
  codeBox: {
    marginTop: ms(10),
    padding: ms(10),
    borderWidth: 1,
    borderColor: '#f4f4f4',
    borderRadius: ms(10),
  },
  codeLabel: { fontSize: sp(15), fontWeight: 'bold', color: COLORS.ink },
  codeCells: { flexDirection: 'row', justifyContent: 'center', marginTop: ms(20), gap: ms(10) },
  codeCell: {
    width: ms(48),
    minHeight: ms(40),
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.lightGray,
  },
  codeDigit: { fontSize: sp(16), fontWeight: 'bold', color: COLORS.primary, paddingBottom: ms(4) },
  codeHiddenInput: { ...StyleSheet.absoluteFill, opacity: 0 },
  // button_reject has 10dp margins, button_accept none; row has 20dp bottom margin.
  btnRow: { flexDirection: 'row', marginTop: ms(20), marginBottom: ms(20) },
  pillBtn: { flex: 1, height: ms(48), borderRadius: ms(34), alignItems: 'center', justifyContent: 'center' },
  rejectPillBtn: { backgroundColor: COLORS.primary, marginHorizontal: ms(10) },
  acceptPillBtn: { backgroundColor: ACCEPT_GREEN },
  btnDisabled: { opacity: 0.4 },
  rejectPhotoRow: { flexDirection: 'row', marginTop: ms(30), marginHorizontal: ms(10) },
  rejectPhotoBox: {
    flex: 1,
    height: ms(100),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: ms(15),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rejectPhotoBoxMid: { marginHorizontal: ms(20) },
  reasonWrap: { marginTop: ms(26), marginHorizontal: ms(15), marginBottom: ms(30) },
  reasonBox: {
    height: ms(40),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: ms(34),
    justifyContent: 'center',
    paddingLeft: ms(18),
    paddingRight: ms(40),
  },
  reasonBoxFocused: { borderWidth: 2 },
  reasonInput: { fontSize: sp(16), color: COLORS.ink, padding: 0 },
  reasonLabel: { position: 'absolute', left: ms(14), paddingHorizontal: ms(4), backgroundColor: '#fff', color: COLORS.lightGray },
  reasonLabelFloating: { top: -ms(10), fontSize: sp(12) },
  reasonLabelResting: { top: ms(10), left: ms(14), fontSize: sp(16), backgroundColor: 'transparent' },
  errorDot: {
    position: 'absolute',
    right: ms(14),
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    backgroundColor: '#E4002B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorDotText: { color: '#fff', fontWeight: 'bold', fontSize: sp(16), lineHeight: ms(20) },
  // EditText.setError popup: dark bubble with a red underline and a pointer to the error icon.
  errorTip: { position: 'absolute', right: ms(2), bottom: ms(43), alignItems: 'flex-end', zIndex: 5 },
  errorTipBox: {
    backgroundColor: 'rgba(15,15,15,0.95)',
    borderRadius: ms(4),
    borderBottomWidth: ms(3),
    borderBottomColor: '#E4002B',
    paddingHorizontal: ms(16),
    paddingVertical: ms(8),
  },
  errorTipText: { color: '#fff', fontSize: sp(13.5) },
  errorTipArrow: {
    marginRight: ms(18),
    width: 0,
    height: 0,
    borderLeftWidth: ms(8),
    borderRightWidth: ms(8),
    borderTopWidth: ms(8),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#E4002B',
  },
  pillBtnLabel: { color: '#fff', fontSize: sp(18) },
  resumePrompt: { textAlign: 'center', marginTop: ms(20), fontSize: sp(18), color: COLORS.primary, marginBottom: vs(20) },
  rejectScroll: { padding: scale(20), paddingBottom: vs(24) },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: vs(16) },
  rejectTitle: { flex: 1, fontSize: sp(22), color: COLORS.ink },
  photoRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: vs(24), gap: scale(16) },
  photoBox: { flex: 1, height: vs(100), borderWidth: 1, borderColor: '#848484', borderRadius: scale(12), alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoThumb: { width: '100%', height: '100%' },
  noteInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: scale(12),
    padding: scale(12), fontSize: sp(14), color: '#111827', height: vs(90),
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(32) },
  photoSourceSheet: { backgroundColor: '#fff', borderRadius: scale(16), width: '100%', maxWidth: scale(360), paddingVertical: vs(8), elevation: 10 },
  photoSourceTitle: { fontSize: sp(17), fontWeight: '600', color: '#111', paddingHorizontal: scale(20), paddingVertical: vs(14) },
  photoSourceDivider: { height: 1, backgroundColor: '#F3F4F6' },
  photoSourceOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(20), paddingVertical: vs(14), gap: scale(14) },
  photoSourceIconWrap: { width: scale(34), height: scale(34), borderRadius: scale(17), alignItems: 'center', justifyContent: 'center' },
  photoSourceOptionText: { fontSize: sp(15), color: '#1F2937' },
});
