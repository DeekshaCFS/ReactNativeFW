// src/screens/technician/main/TaskClosureScreen.tsx
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
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp, HEADER_TOP_PADDING } from '../../../utils/responsive';
import {
  GetAllTaskListDTOResultData as Task,
  GetAllTaskListDTODeviceInfoList as DeviceInfo,
  TaskClosureResultData,
  TaskClosureTechnicalNotedto,
  TaskClosureDeviceInfoList,
  TaskClosureUsedItemDetailsDto,
} from '../../../api/task/task.types';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { getAllchkpointCategory, postChkpointData } from '../../../api/fsrManagement/fsrManagementService';
import { requestLocationPermission, getCurrentPosition, getAddressFromCoordinates, Coordinates } from '../../../utils/locationPermision';

// ─── Local Types ──────────────────────────────────────────────────────────────

interface PhotoAsset {
  uri: string;
  base64?: string;
}

type PendingPhoto =
  | { type: 'field'; index: number }
  | { type: 'attachment' }
  | { type: 'customerPhoto' }
  | { type: 'techPhoto' }
  | { type: 'devicePhoto'; deviceIndex: number; photoKey: 'DevicePhoto1' | 'DevicePhoto2' | 'DevicePhoto3' };

interface SignaturePath {
  points: { x: number; y: number }[];
}

interface DeviceEntry extends Partial<DeviceInfo> {
  DevicePhoto1Uri?: string;
  DevicePhoto2Uri?: string;
  DevicePhoto3Uri?: string;
}

interface WorkModeOption {
  Id: number;
  WorkModeType: string;
}

const WORK_MODES: WorkModeOption[] = [
  { Id: 1, WorkModeType: 'New Installation' },
  { Id: 2, WorkModeType: 'Repair' },
  { Id: 3, WorkModeType: 'Service' },
];

const TASK_STATUS = {
  COMPLETED: 1,
  REJECTED: 2,
  ON_GOING: 3,
  IN_ACTIVE: 4,
  ONHOLD: 5,
} as const;

const TASK_STATE = {
  NOT_STARTED: 0,
  STARTED_NOT_ENDED: 1,
  ENDED_NO_PAYMENT: 2,
  PAYMENT_RECEIVED: 3,
  TASK_CLOSURE: 4,
} as const;

const PAYMENT_MODE_RATE_ID = 2;

interface AssignedSlot {
  ItemIssuedId: number;
  ItemId: number;
  ItemName: string;
  AssignedQty: number;
  usedQty: string;
}

interface AdHocSlot {
  itemIssuedId: number;
  itemId: number;
  itemName: string;
  salesPrice: number;
  avlQty: number;
  usedQty: string;
}

interface IssueListItem {
  Id: number;
  ItemId: number;
  Name: string;
  Quantity: number;
  SalesPrice: number;
}

interface FSRCheckpoint {
  CheckpointId: number;
  CheckpointName: string;
}

interface FSRCategory {
  CategoryId: number;
  CategoryName: string;
  lstCheckpointDTo: FSRCheckpoint[];
}

interface FSRStatusOption {
  CheckpointStatusId: number;
  CheckpointStatusName: string;
}

interface SelectedCheckpoint {
  SelectedCheckpointId: number;
  FSRId: number;
  CategoryId: number;
  CheckpointId: number;
  CheckpointStatusId: number;
  InputTextId: number;
  CreatedBy: number;
  CreatedDate: string;
  UpdatedBy: number;
  UpdatedDate: string;
  IsActive: boolean;
  TaskId: any;
}

// ─── Shared helper ────────────────────────────────────────────────────────────

const buildPathD = (points: { x: number; y: number }[]) => {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
};

// ─── Signature Pad ────────────────────────────────────────────────────────────

interface SignaturePadProps {
  paths: SignaturePath[];
  onPathsChange: (paths: SignaturePath[]) => void;
  height?: number;
}

function SignaturePad({ paths, onPathsChange, height = 160 }: SignaturePadProps) {
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  const pathsRef = useRef(paths);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    pathsRef.current = paths;
  }, [paths]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPathRef.current = [{ x: locationX, y: locationY }];
        forceUpdate(n => n + 1);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPathRef.current = [...currentPathRef.current, { x: locationX, y: locationY }];
        forceUpdate(n => n + 1);
      },
      onPanResponderRelease: () => {
        if (currentPathRef.current.length > 1) {
          onPathsChange([...pathsRef.current, { points: currentPathRef.current }]);
        }
        currentPathRef.current = [];
        forceUpdate(n => n + 1);
      },
    })
  ).current;

  return (
    <View style={[sigStyles.padContainer, { height }]} {...panResponder.panHandlers}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        {paths.map((path, idx) => (
          <Path
            key={idx}
            d={buildPathD(path.points)}
            stroke="#1C1C1E"
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {currentPathRef.current.length > 1 && (
          <Path
            d={buildPathD(currentPathRef.current)}
            stroke="#1C1C1E"
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </Svg>
    </View>
  );
}

const sigStyles = StyleSheet.create({
  padContainer: {
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    marginTop: vs(6),
    position: 'relative',
  },
});

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const getStarIcon = (star: number): string => {
    if (value >= star) return 'star';
    if (value >= star - 0.5) return 'star-half';
    return 'star-outline';
  };
  const STAR_SIZE = sp(30);
  return (
    <View style={{ marginTop: vs(10) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(4) }}>
        <Text style={{ fontSize: sp(20), color: COLORS.primary, fontWeight: '600', marginRight: scale(6) }}>
          {value.toFixed(1)}
        </Text>
        {[1, 2, 3, 4, 5].map(star => (
          <View key={star} style={{ width: STAR_SIZE, height: STAR_SIZE }}>
            <Ionicons
              name={getStarIcon(star)}
              size={STAR_SIZE}
              color={value >= star - 0.5 ? COLORS.primary : '#C0C0C0'}
            />
            <Pressable
              onPress={() => onChange(value === star - 0.5 ? 0 : star - 0.5)}
              style={{ position: 'absolute', left: 0, top: 0, width: STAR_SIZE / 2, height: STAR_SIZE }}
            />
            <Pressable
              onPress={() => onChange(value === star ? 0 : star)}
              style={{ position: 'absolute', right: 0, top: 0, width: STAR_SIZE / 2, height: STAR_SIZE }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── SVG → base64 ────────────────────────────────────────────────────────────

function signaturePathsToBase64(paths: SignaturePath[]): string | undefined {
  if (paths.length === 0) return undefined;
  const W = 400, H = 200;
  const buildD = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
    }
    return d;
  };
  const pathTags = paths
    .map(p => `<path d="${buildD(p.points)}" stroke="#1C1C1E" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="background:#fff">${pathTags}</svg>`;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  while (i < svg.length) {
    const a = svg.charCodeAt(i++);
    const b = i < svg.length ? svg.charCodeAt(i++) : 0;
    const c = i < svg.length ? svg.charCodeAt(i++) : 0;
    result +=
      chars[a >> 2] +
      chars[((a & 3) << 4) | (b >> 4)] +
      (i - 2 < svg.length ? chars[((b & 15) << 2) | (c >> 6)] : '=') +
      (i - 1 < svg.length ? chars[c & 63] : '=');
  }
  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaskClosure({ navigation, route }: any) {
  const { task: routeTask, elapsedSeconds = 0 } = route.params as {
    task: Task;
    elapsedSeconds?: number;
  };

  const [submitting, setSubmitting] = useState(false);

  // ── Current location (Source: TaskClosureFragmentNew.getLastLocation() /
  // getAddressFromLocation()) — requests location permission and resolves
  // the technician's address as soon as the closure screen loads. The Java
  // fragment stamps this address (plus date/time) as a caption on the
  // before/after task photos; that caption-stamping step still needs to be
  // wired up here once the photo-caption UI exists — for now this captures
  // the permission + coordinates + address so that follow-up isn't blocked.
  const [closureLocation, setClosureLocation] = useState<Coordinates | null>(null);
  const [closureAddress, setClosureAddress] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const granted = await requestLocationPermission();
      if (!granted) return;
      try {
        const coords = await getCurrentPosition();
        setClosureLocation(coords);
        const address = await getAddressFromCoordinates(coords.latitude, coords.longitude);
        setClosureAddress(address);
      } catch (error) {
        console.log('[TaskClosureScreen] Unable to get current location:', error);
      }
    })();
  }, []);

  // ── Work modes (static — see WORK_MODES above) ──
  const [selectedWorkMode, setSelectedWorkMode] = useState<WorkModeOption | null>(null);

  // ── Field photos (3 slots) ──
  const [fieldPhotos, setFieldPhotos] = useState<(PhotoAsset | null)[]>([null, null, null]);

  // ── Technical notes ──
  const [technicalNotes, setTechnicalNotes] = useState<{ text: string }[]>([]);
  const [noteSheetVisible, setNoteSheetVisible] = useState(false);
  const [activeNoteIndex, setActiveNoteIndex] = useState<number | null>(null);
  const [noteInputValue, setNoteInputValue] = useState('');
  const [notAllowedVisible, setNotAllowedVisible] = useState(false);

  // ── Device list ──
  const [devices, setDevices] = useState<DeviceEntry[]>([]);
  const [expandedDeviceIndex, setExpandedDeviceIndex] = useState<number | null>(null);
  const [deviceNotAllowed, setDeviceNotAllowed] = useState(false);

  // ── Attachment ──
  const [attachment, setAttachment] = useState<PhotoAsset | null>(null);

  // ── Photo source modal ──
  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);
  const pendingPhotoRef = useRef<PendingPhoto | null>(null);

  // ── Signature sheet ──
  const [showSignatureSheet, setShowSignatureSheet] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<'customer' | 'tech' | null>(null);
  const customerExpanded = openAccordion === 'customer';
  const techExpanded = openAccordion === 'tech';
  const toggleAccordion = (section: 'customer' | 'tech') =>
    setOpenAccordion(prev => (prev === section ? null : section));

  // ── Customer details ──
  const [customerName, setCustomerName] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [customerPhoto, setCustomerPhoto] = useState<PhotoAsset | null>(null);
  const [customerSignPaths, setCustomerSignPaths] = useState<SignaturePath[]>([]);
  const [rating, setRating] = useState(0);
  const [ratingRemark, setRatingRemark] = useState('');

  // ── Technician details ──
  const [techPhoto, setTechPhoto] = useState<PhotoAsset | null>(null);
  const [techSignPaths, setTechSignPaths] = useState<SignaturePath[]>([]);

  // ── Satisfaction / "Happy Code" (only shown when routeTask.HappyCode is set —
  //    cross-verified against TaskClosureFragmentNew.validate()) ──
  const hasHappyCode = !!routeTask.HappyCode && routeTask.HappyCode !== 0;
  const [satisfactionCode, setSatisfactionCode] = useState('');

  // ─── Used Items Sheet state ───────────────────────────────────────────────

  const [showUsedItemSheet, setShowUsedItemSheet] = useState(false);

  const hasFSR = !!routeTask.FSRName;
  const [showFSRSheet, setShowFSRSheet] = useState(false);
  const [fsrLoading, setFsrLoading] = useState(false);
  const [fsrName, setFsrName] = useState(routeTask.FSRName ?? '');
  const [fsrCategories, setFsrCategories] = useState<FSRCategory[]>([]);
  const [fsrStatusOptions, setFsrStatusOptions] = useState<FSRStatusOption[]>([]);
  // checkpointId -> chosen CheckpointStatusId
  const [fsrSelections, setFsrSelections] = useState<Record<number, number>>({});
  const [fsrSubmitting, setFsrSubmitting] = useState(false);
  const [fsrCompletedCount, setFsrCompletedCount] = useState(0);
  const [activeCheckpointPicker, setActiveCheckpointPicker] = useState<number | null>(null);

  // Catalogue for the ad-hoc item picker — see IssueListItem note above.
  const [issueList, setIssueList] = useState<IssueListItem[]>([]);
  const [issueListLoading, setIssueListLoading] = useState(false);

  const [assignedSlots, setAssignedSlots] = useState<AssignedSlot[]>(() =>
    (routeTask.MultipleItemAssigned ?? []).map(item => ({
      ItemIssuedId: item.ItemIssuedId ?? 0,
      ItemId:       item.ItemId ?? 0,
      ItemName:     item.ItemName ?? '',
      AssignedQty:  item.ItemQuantity ?? 0,
      usedQty:      item.UsedItemQty ? String(item.UsedItemQty) : '',
    }))
  );

  // Bottom section: ad-hoc "Add More" slots
  const MAX_ADHOC_SLOTS = 10;
  const [adHocSlots, setAdHocSlots] = useState<(AdHocSlot | null)[]>([]);
  const [visibleSlotCount, setVisibleSlotCount] = useState(0);

  // Searchable item picker modal
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [itemPickerSearch, setItemPickerSearch] = useState('');
  const pendingSlotIndexRef = useRef<number>(-1);

  // ─── FSR Checkpoints ────

  const openFSRSheet = async () => {
    setShowFSRSheet(true);
    if (fsrCategories.length > 0) return;

    try {
      setFsrLoading(true);
      const uid = await AsyncStorage.getItem('uid');
      const response = await getAllchkpointCategory({
        UserId: Number(uid),
        TaskId: routeTask.Id,
      });
      const result = response?.ResultData?.[0];

      const categories = (result?.lstFSRCategories ?? []).map(cat => ({
        CategoryId: cat.CategoryId ?? 0,
        CategoryName: cat.CategoryName ?? '',
        lstCheckpointDTo: (cat.lstCheckpointDTo ?? []).map(cp => ({
          CheckpointId: cp.CheckpointId ?? 0,
          CheckpointName: cp.CheckpointName ?? '',
        })),
      }));
      const statusOptions = (result?.lstCheckpointStatusDTo ?? []).map(s => ({
        CheckpointStatusId: s.CheckpointStatusId ?? 0,
        CheckpointStatusName: s.CheckpointStatusName ?? '',
      }));

      // Pre-fill any previously saved selections (matches Java's
      // lstSelectedCheckpointDTo handling in TaskClosureFragmentNew).
      const preSelected: Record<number, number> = {};
      (result?.lstSelectedCheckpointDTo ?? []).forEach((sel: any) => {
        if (sel?.CheckpointId != null && sel?.CheckpointStatusId != null) {
          preSelected[sel.CheckpointId] = sel.CheckpointStatusId;
        }
      });

      setFsrCategories(categories);
      setFsrStatusOptions([{ CheckpointStatusId: 0, CheckpointStatusName: 'Select' }, ...statusOptions]);
      if (Object.keys(preSelected).length > 0) {
        setFsrSelections(preSelected);
        setFsrCompletedCount(Object.keys(preSelected).length);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not load FSR checkpoints. Please try again.');
    } finally {
      setFsrLoading(false);
    }
  };

  const handleSelectCheckpointStatus = (checkpointId: number, statusId: number) => {
    setFsrSelections(prev => {
      const next = { ...prev };
      if (statusId === 0) {
        delete next[checkpointId];
      } else {
        next[checkpointId] = statusId;
      }
      setFsrCompletedCount(Object.keys(next).length);
      return next;
    });
  };

  const handleSubmitFSRCheckpoints = async () => {
    const entries = Object.entries(fsrSelections);
    if (entries.length === 0) {
      setShowFSRSheet(false);
      return;
    }

    try {
      setFsrSubmitting(true);
      const uid = await AsyncStorage.getItem('uid');
      const userId = Number(uid);

      const checkpointMeta = new Map<number, { categoryId: number }>();
      fsrCategories.forEach(cat => {
        (cat.lstCheckpointDTo ?? []).forEach(cp => {
          checkpointMeta.set(cp.CheckpointId, { categoryId: cat.CategoryId });
        });
      });

      const payload: SelectedCheckpoint[] = (entries as [string, number][]).map(([checkpointIdStr, statusId]) => {
        const checkpointId = Number(checkpointIdStr);
        const meta = checkpointMeta.get(checkpointId);
        return {
          SelectedCheckpointId: 0,
          FSRId: routeTask.FSRId ?? 0,
          CategoryId: meta?.categoryId ?? 0,
          CheckpointId: checkpointId,
          CheckpointStatusId: statusId,
          InputTextId: 0,
          CreatedBy: userId,
          CreatedDate: new Date().toISOString(),
          UpdatedBy: userId,
          UpdatedDate: new Date().toISOString(),
          IsActive: true,
          TaskId: routeTask.Id,
        };
      });

      // Java's saveAllChkPointData posts a List<ResultData> body directly
      // (see Api.java: @Body List<SaveSelectedChkPointData.ResultData>).
      await postChkpointData(payload);
      setShowFSRSheet(false);
    } catch (err) {
      Alert.alert('Error', 'Could not save checkpoints. Please try again.');
    } finally {
      setFsrSubmitting(false);
    }
  };

  // ─── Open used item sheet ──

  const openUsedItemSheet = () => {
    setShowUsedItemSheet(true);
  };

  // ─── Add More slot handler ───

  const handleAddMoreSlot = () => {
    if (visibleSlotCount >= MAX_ADHOC_SLOTS) return;

    // Validate the last visible slot before revealing the next one
    if (visibleSlotCount > 0) {
      const lastSlot = adHocSlots[visibleSlotCount - 1];
      if (!lastSlot?.itemName || !lastSlot?.usedQty || lastSlot.usedQty === '0') {
        Alert.alert('', 'Please Enter Item Name and Quantity!!');
        return;
      }
      if (Number(lastSlot.usedQty) > lastSlot.avlQty) {
        Alert.alert('', 'Quantity should not be greater than Available Qty!!');
        setAdHocSlots(prev => {
          const updated = [...prev];
          if (updated[visibleSlotCount - 1]) {
            updated[visibleSlotCount - 1] = { ...updated[visibleSlotCount - 1]!, usedQty: '' };
          }
          return updated;
        });
        return;
      }
    }

    setAdHocSlots(prev => {
      const updated = [...prev];
      if (updated.length <= visibleSlotCount) updated.push(null);
      return updated;
    });
    setVisibleSlotCount(c => c + 1);
  };

  // ─── Duplicate checks ──

  const hasDuplicatesInAdHoc = (slots: AdHocSlot[]): boolean => {
    const seen = new Set<number>();
    for (const slot of slots) {
      if (!seen.add(slot.itemId)) return true;
    }
    return false;
  };

  const hasDuplicatesBetween = (assigned: AssignedSlot[], adHoc: AdHocSlot[]): boolean => {
    const assignedIds = new Set(assigned.map(a => a.ItemId).filter(Boolean));
    return adHoc.some(s => s.itemId !== 0 && assignedIds.has(s.itemId));
  };

  // ─── UPDATE button handler ─────────────────────

  const handleUsedItemUpdate = () => {
    const filledAdHoc = adHocSlots
      .slice(0, visibleSlotCount)
      .filter((s): s is AdHocSlot => !!s && !!s.itemName && !!s.usedQty);

    if (assignedSlots.length > 0 && filledAdHoc.length > 0) {
      if (hasDuplicatesBetween(assignedSlots, filledAdHoc)) {
        Alert.alert('', 'Duplicate Items are not allowed!!');
        return;
      }
    } else if (filledAdHoc.length > 0) {
      if (hasDuplicatesInAdHoc(filledAdHoc)) {
        Alert.alert('', 'Duplicate Items not allowed!!');
        return;
      }
    }

    const hasAssignedQty = assignedSlots.some(s => s.usedQty.trim() !== '');
    if (!hasAssignedQty && filledAdHoc.length === 0) {
      Alert.alert('', 'Please Enter Used Quantity!');
      return;
    }

    setShowUsedItemSheet(false);
  };

  // ─── Photo helpers ────────────────────────────────────────────────────────

  const openPhotoPicker = (pending: PendingPhoto) => {
    pendingPhotoRef.current = pending;
    setShowPhotoSourceModal(true);
  };

  const handlePhotoSource = async (source: 'camera' | 'gallery') => {
    setShowPhotoSourceModal(false);
    const pending = pendingPhotoRef.current;
    if (!pending) return;
    pendingPhotoRef.current = null;

    const result =
      source === 'camera'
        ? await launchCamera({ mediaType: 'photo', includeBase64: true, quality: 0.7 })
        : await launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.7 });

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    const photo: PhotoAsset = { uri: asset.uri, base64: asset.base64 ?? undefined };

    if (pending.type === 'field') {
      setFieldPhotos(prev => {
        const updated = [...prev];
        updated[pending.index] = photo;
        return updated;
      });
    } else if (pending.type === 'attachment') {
      setAttachment(photo);
    } else if (pending.type === 'customerPhoto') {
      setCustomerPhoto(photo);
    } else if (pending.type === 'techPhoto') {
      setTechPhoto(photo);
    } else if (pending.type === 'devicePhoto') {
      const { deviceIndex, photoKey } = pending;
      const uriKey = `${photoKey}Uri` as 'DevicePhoto1Uri' | 'DevicePhoto2Uri' | 'DevicePhoto3Uri';
      setDevices(prev =>
        prev.map((d, i) =>
          i === deviceIndex
            ? { ...d, [photoKey]: photo.base64 ?? '', [uriKey]: photo.uri }
            : d
        )
      );
    }
  };

  // ─── Payload builder ──────────────────────────────────────────────────────

  const buildFieldPhotoFields = (
    photos: (PhotoAsset | null)[]
  ): Pick<TaskClosureResultData, 'FieldPhoto' | 'FieldPhoto1' | 'FieldPhoto2'> => ({
    FieldPhoto: photos[0]?.base64 || undefined,
    FieldPhoto1: photos[1]?.base64 || undefined,
    FieldPhoto2: photos[2]?.base64 || undefined,
  });

  // ─── Validation ───────────────────────────────────────────────────────────

  const validateClosure = (): string | null => {
    if (customerSignPaths.length === 0) {
      return 'Please add the customer signature.';
    }
    if (!fieldPhotos.some(p => !!p?.base64)) {
      return 'Please add at least one field photo.';
    }
    if (rating === 0) {
      return 'Please rate the service.';
    }
    if (!selectedWorkMode) {
      return 'Please select a Work Mode before continuing.';
    }
    if (hasHappyCode) {
      if (!satisfactionCode.trim()) {
        return 'Please Enter Satisfaction Code!!';
      }
      if (Number(satisfactionCode) !== routeTask.HappyCode) {
        return 'Please Enter Valid Satisfaction Code!!';
      }
    }
    // Matches Java's addDeviceListToTaskClosure(): every device row the
    // technician added must have a name, a model number, and at least one
    // photo before the closure can submit.
    for (const device of devices) {
      const name = device.DeviceName?.trim() ?? '';
      const model = device.ModelNumber?.trim() ?? '';
      const hasPhoto = !!(device.DevicePhoto1 || device.DevicePhoto2 || device.DevicePhoto3);
      if (!name) return 'Please Enter Device Name';
      if (!model) return 'Please Enter Model No';
      if (!hasPhoto) return 'Please add at least one device photo';
    }
    return null;
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleContinue = async () => {
    const validationError = validateClosure();
    if (validationError) {
      Alert.alert('Required', validationError);
      return;
    }
    try {
      setSubmitting(true);
      const freshUid = await AsyncStorage.getItem('uid');
      if (!freshUid) {
        Alert.alert('Error', 'User session not found. Please log in again.');
        return;
      }
      const now = new Date().toISOString();

      const customerSignatureImage = signaturePathsToBase64(customerSignPaths);
      const techSignatureImage = signaturePathsToBase64(techSignPaths);

      const isRateMode =
        routeTask.TaskState === TASK_STATE.ENDED_NO_PAYMENT &&
        (routeTask.PaymentMode ?? '').toLowerCase() === 'rate' &&
        routeTask.PaymentModeId === PAYMENT_MODE_RATE_ID;

      const filledAdHoc = adHocSlots
        .slice(0, visibleSlotCount)
        .filter((s): s is AdHocSlot => !!s && !!s.usedQty);

      const usedItemDetailsDto: TaskClosureUsedItemDetailsDto[] = [
        ...assignedSlots
          .filter(s => s.usedQty.trim() !== '')
          .map(s => ({
            Id:           0,
            ItemId:       s.ItemId,
            ItemIssuedId: s.ItemIssuedId,
            TaskId:       routeTask.Id,
            AvlQty:       0,
            AssignedQty:  s.AssignedQty,
            UsedQty:      Number(s.usedQty),
            UserId:       Number(freshUid),
            CreatedBy:    Number(freshUid),
            CreatedDate:  now,
            UpdateBy:     Number(freshUid),
            UpdatedDate:  now,
            Notes:        '',
          })),
        ...filledAdHoc.map(s => ({
          Id:           0,
          ItemId:       s.itemId,
          ItemIssuedId: s.itemIssuedId,
          TaskId:       routeTask.Id,
          AvlQty:       s.avlQty,
          AssignedQty:  0,
          UsedQty:      Number(s.usedQty),
          UserId:       Number(freshUid),
          CreatedBy:    Number(freshUid),
          CreatedDate:  now,
          UpdateBy:     Number(freshUid),
          UpdatedDate:  now,
          Notes:        '',
        })),
      ];

      const technicalNotedto: TaskClosureTechnicalNotedto[] = technicalNotes.map(note => ({
        Id: 0,
        TechnicalNote1: note.text,
        TaskClosureDetailsId: 0,
        UserId: String(freshUid),
        CreatedBy: String(freshUid),
        CreatedDate: now,
        UpdatedBy: String(freshUid),
        UpdatedDate: now,
        isSyncDone: '0',
      }));

      const deviceInfoList: TaskClosureDeviceInfoList[] = devices.map(device => ({
        Id: 0,
        DeviceName:    device.DeviceName    ?? '',
        ModelNumber:   device.ModelNumber   ?? '',
        DevicePhoto1:  device.DevicePhoto1  ?? '',
        DevicePhoto2:  device.DevicePhoto2  ?? '',
        DevicePhoto3:  device.DevicePhoto3  ?? '',
        DeviceReading: device.DeviceReading ?? 0,
        TaskClosureDetailsId: 0,
        UserId:      String(freshUid),
        CreatedBy:   String(freshUid),
        CreatedDate: now,
        UpdatedBy:   String(freshUid),
        UpdatedDate: now,
        isSyncDone: '0',
      }));

      const payload: TaskClosureResultData = {
        Id: 0,
        UserId: Number(freshUid),
        TaskId: routeTask.Id,
        TaskState: isRateMode ? TASK_STATE.ENDED_NO_PAYMENT : TASK_STATE.PAYMENT_RECEIVED,
        TaskStatus: isRateMode ? TASK_STATUS.ON_GOING : TASK_STATUS.COMPLETED,
        CreatedBy: String(freshUid),
        CreatedDate: now,
        UpdatedBy: String(freshUid),
        UpdatedDate: now,

        WorkModeId: selectedWorkMode!.Id,
        WorkModeType: selectedWorkMode!.WorkModeType,

        ...buildFieldPhotoFields(fieldPhotos),

        TechnicalNotedto: technicalNotedto,

        DeviceInfoList: deviceInfoList,

        SignedBy: customerName || undefined,
        MobileNo: customerNumber ? Number(customerNumber) : 0,
        ...(customerPhoto?.base64 && { CustomerImage: customerPhoto.base64 }),
        ...(customerSignatureImage && { CustomerSignatureImage: customerSignatureImage }),

        ...(techPhoto?.base64 && { TechImage: techPhoto.base64 }),
        ...(techSignatureImage && { TechSignatureImage: techSignatureImage }),

        RatingBar: rating,
        RatingBarId: 0,
        ...(ratingRemark.trim() && { RatingRemark: ratingRemark.trim() }),

        ...(attachment?.base64 && {
          Tsk_Doc_Base64: attachment.base64,
          Tsk_Doc_Name: 'attachment',
          Tsk_Doc_Extension: '.jpg',
        }),

        SelectedCheckpointList: [],
        CustomeFieldDTO: [],
        Task_Excess_Amount_Dtls: [],
        UsedItemDetailsDto: usedItemDetailsDto,
        MultipleItemAssigned: [],
      };

      navigation.navigate('TaskSummary', {
        task: routeTask,
        elapsedSeconds,
        payload,
        preview: {
          workModeType: selectedWorkMode!.WorkModeType,
          customerName,
          customerNumber,
          rating,
          ratingRemark,
          fieldPhotoUris: fieldPhotos.filter((p): p is PhotoAsset => !!p?.uri).map(p => p.uri),
          customerPhotoUri: customerPhoto?.uri,
          techPhotoUri: techPhoto?.uri,
          customerSignPaths,
          techSignPaths,
        },
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Something went wrong building the summary.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.redBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── FIELD PHOTO ─────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Field Photo</Text>
          <Text style={styles.cardSubtitle}>Where the task is performed</Text>
          <View style={styles.photoRow}>
            {([0, 1, 2] as const).map(i => (
              <Pressable
                key={`field-photo-${i}`}
                style={styles.photoSlot}
                onPress={() => openPhotoPicker({ type: 'field', index: i })}
              >
                {fieldPhotos[i]?.uri ? (
                  <>
                    <Image source={{ uri: fieldPhotos[i]!.uri }} style={styles.photoThumb} />
                    <Pressable
                      style={styles.photoRemoveBtn}
                      onPress={() =>
                        setFieldPhotos(prev => {
                          const updated = [...prev];
                          updated[i] = null;
                          return updated;
                        })
                      }
                      hitSlop={6}
                    >
                      <Ionicons name="close" size={sp(15)} color="#fff" />
                    </Pressable>
                  </>
                ) : (
                  <Ionicons name="camera-outline" size={sp(70)} color="#a6a6a6" />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── WORK MODE ───────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Work Mode</Text>
          <View style={styles.workModeRow}>
            {WORK_MODES.map(mode => (
              <Pressable
                key={`work-mode-${mode.Id}`}
                style={styles.radioItem}
                onPress={() => setSelectedWorkMode(mode)}
              >
                <View
                  style={[
                    styles.radioOuter,
                    selectedWorkMode?.Id === mode.Id && styles.radioOuterActive,
                  ]}
                >
                  {selectedWorkMode?.Id === mode.Id && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>{mode.WorkModeType}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── TECHNICAL NOTES ─────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Technical Notes</Text>
          <Pressable
            style={styles.addRow}
            onPress={() => {
              const hasEmpty = technicalNotes.some(n => !n.text.trim());
              if (hasEmpty) {
                setNotAllowedVisible(true);
                setTimeout(() => setNotAllowedVisible(false), 2000);
                return;
              }
              setTechnicalNotes(prev => [...prev, { text: '' }]);
            }}
          >
            <Text style={styles.addRowPlaceholder}>Add Notes</Text>
            <Text style={styles.plusBtn}>+</Text>
          </Pressable>
          {notAllowedVisible && (
            <Text style={styles.notAllowedText}>
              Please fill the existing note before adding a new one.
            </Text>
          )}
          {technicalNotes.map((note, idx) => (
            <Pressable
              key={`note-${idx}`}
              style={styles.noteChip}
              onPress={() => {
                setActiveNoteIndex(idx);
                setNoteInputValue(note.text);
                setNoteSheetVisible(true);
              }}
            >
              <Text style={styles.noteChipIndex}>{idx + 1}</Text>
              <Text
                style={[styles.noteChipText, !note.text && styles.noteChipPlaceholder]}
                numberOfLines={1}
              >
                {note.text || 'Click here to add note details'}
              </Text>
              <Pressable
                hitSlop={8}
                onPress={() => setTechnicalNotes(prev => prev.filter((_, i) => i !== idx))}
              >
                <Ionicons name="close" size={sp(25)} color={COLORS.primary} />
              </Pressable>
            </Pressable>
          ))}
        </View>

        {/* Technical Notes Bottom Sheet */}
        <Modal
          visible={noteSheetVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setNoteSheetVisible(false)}
        >
          <View style={styles.sheetOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.sheetContainer}
            >
              <View style={styles.sheetContent}>
                <Text style={styles.sheetTitle}>Technical Notes</Text>
                <TextInput
                  value={noteInputValue}
                  onChangeText={setNoteInputValue}
                  placeholder="Click here to add note"
                  placeholderTextColor={COLORS.primary}
                  style={styles.sheetTextArea}
                  multiline
                  autoFocus
                  textAlignVertical="top"
                />
                <Pressable
                  style={styles.sheetSaveBtn}
                  onPress={() => {
                    if (activeNoteIndex !== null) {
                      setTechnicalNotes(prev =>
                        prev.map((n, i) =>
                          i === activeNoteIndex ? { text: noteInputValue.trim() } : n
                        )
                      );
                    }
                    setNoteInputValue('');
                    setActiveNoteIndex(null);
                    setNoteSheetVisible(false);
                  }}
                >
                  <Text style={styles.sheetSaveBtnText}>SAVE</Text>
                </Pressable>
                <Pressable onPress={() => setNoteSheetVisible(false)}>
                  <Text style={styles.sheetCancelText}>Cancel</Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* ── DEVICE LIST ─────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Device List</Text>
          <Pressable
            style={styles.addRow}
            onPress={() => {
              const hasEmpty = devices.some(
                d => !d.DeviceName?.trim() && !d.ModelNumber?.trim() && !d.DeviceReading
              );
              if (hasEmpty) {
                setDeviceNotAllowed(true);
                setTimeout(() => setDeviceNotAllowed(false), 2000);
                return;
              }
              const newIndex = devices.length;
              setDevices(prev => [...prev, {}]);
              setExpandedDeviceIndex(newIndex);
            }}
          >
            <Text style={styles.addRowPlaceholder}>Add New Device</Text>
            <Text style={styles.plusBtn}>+</Text>
          </Pressable>
          {deviceNotAllowed && (
            <Text style={styles.notAllowedText}>
              Please fill the existing device before adding a new one.
            </Text>
          )}
          {devices.map((device, idx) => {
            const isExpanded = expandedDeviceIndex === idx;
            return (
              <View key={`device-${idx}`} style={styles.deviceChipWrapper}>
                <Pressable
                  style={styles.noteChip}
                  onPress={() => setExpandedDeviceIndex(isExpanded ? null : idx)}
                >
                  <Text style={styles.noteChipIndex}>{idx + 1}</Text>
                  <Text
                    style={[styles.noteChipText, !device.DeviceName && styles.noteChipPlaceholder]}
                    numberOfLines={1}
                  >
                    {isExpanded
                      ? (device.DeviceName || 'Click here to close')
                      : (device.DeviceName || 'Click here to add device details')}
                  </Text>
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      setDevices(prev => prev.filter((_, i) => i !== idx));
                      if (expandedDeviceIndex === idx) setExpandedDeviceIndex(null);
                    }}
                  >
                    <Ionicons name="close" size={sp(25)} color={COLORS.primary} />
                  </Pressable>
                </Pressable>

                {isExpanded && (
                  <View style={styles.deviceForm}>
                    <TextInput
                      value={device.DeviceName || ''}
                      onChangeText={val =>
                        setDevices(prev =>
                          prev.map((d, i) => (i === idx ? { ...d, DeviceName: val } : d))
                        )
                      }
                      placeholder="Device"
                      placeholderTextColor="#ABABAB"
                      style={styles.deviceInput}
                    />
                    <TextInput
                      value={device.ModelNumber || ''}
                      onChangeText={val =>
                        setDevices(prev =>
                          prev.map((d, i) => (i === idx ? { ...d, ModelNumber: val } : d))
                        )
                      }
                      placeholder="Company/Model"
                      placeholderTextColor="#ABABAB"
                      style={styles.deviceInput}
                    />
                    <TextInput
                      value={device.DeviceReading ? String(device.DeviceReading) : ''}
                      onChangeText={val =>
                        setDevices(prev =>
                          prev.map((d, i) =>
                            i === idx ? { ...d, DeviceReading: Number(val) } : d
                          )
                        )
                      }
                      placeholder="Device Reading"
                      placeholderTextColor="#ABABAB"
                      keyboardType="numeric"
                      style={styles.deviceInput}
                    />
                    <View style={styles.photoRow}>
                      {(['DevicePhoto1', 'DevicePhoto2', 'DevicePhoto3'] as const).map(
                        (photoKey, pIdx) => (
                          <View key={photoKey} style={styles.photoSlot}>
                            <Pressable
                              style={styles.photoRemoveBtn}
                              onPress={() => {
                                const uriKey = `${photoKey}Uri` as
                                  | 'DevicePhoto1Uri'
                                  | 'DevicePhoto2Uri'
                                  | 'DevicePhoto3Uri';
                                setDevices(prev =>
                                  prev.map((d, i) =>
                                    i === idx ? { ...d, [photoKey]: '', [uriKey]: undefined } : d
                                  )
                                );
                              }}
                              hitSlop={6}
                            >
                              <Ionicons name="close" size={sp(18)} color={COLORS.primary} />
                            </Pressable>
                            <Pressable
                              style={styles.photoInner}
                              onPress={() =>
                                openPhotoPicker({ type: 'devicePhoto', deviceIndex: idx, photoKey })
                              }
                            >
                              {device[
                                `${photoKey}Uri` as
                                  | 'DevicePhoto1Uri'
                                  | 'DevicePhoto2Uri'
                                  | 'DevicePhoto3Uri'
                              ] ? (
                                <Image
                                  source={{
                                    uri: device[
                                      `${photoKey}Uri` as
                                        | 'DevicePhoto1Uri'
                                        | 'DevicePhoto2Uri'
                                        | 'DevicePhoto3Uri'
                                    ],
                                  }}
                                  style={styles.photoPreview}
                                  resizeMode="cover"
                                />
                              ) : pIdx === 0 ? (
                                <Ionicons name="camera-outline" size={sp(60)} color="#a6a6a6" />
                              ) : (
                                <Ionicons name="add-circle-outline" size={sp(45)} color="#a6a6a6" />
                              )}
                            </Pressable>
                          </View>
                        )
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ── ACTION TILES ────────────────────────────────────────────── */}
        <View style={styles.tilesRow}>
          <Pressable style={styles.tile} onPress={openUsedItemSheet}>
            <Text style={styles.tileTitle}>Update Used Item</Text>
            <Text style={styles.tileSub}>{'Click Here to Add/\nUpdate'}</Text>
          </Pressable>
          <Pressable
            style={[styles.tile, { backgroundColor: '#ebeef3' }]}
            onPress={() => navigation.navigate('TaskInput', { routeTask })}
          >
            <Text style={styles.tileTitle}>Add Task Input</Text>
            <Text style={styles.tileSub}>{'Click Here to add Task\nInput'}</Text>
          </Pressable>
        </View>

        {/* ──────────────── CHECKPOINTS (FSR) ──────────────────── */}
        {hasFSR && (
          <Pressable style={styles.naCard} onPress={openFSRSheet}>
            <Text style={styles.naTitle}>{routeTask.FSRName}</Text>
            <Text style={styles.naSub}>
              {fsrCompletedCount > 0
                ? `${fsrCompletedCount} checkpoint${fsrCompletedCount === 1 ? '' : 's'} filled — tap to review`
                : 'Click here for filling checkpoints'}
            </Text>
          </Pressable>
        )}

        {/* ── SIGNATURE & RATING ──────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: 'rgba(255,235,235,0.78)' }]}>
          <Text style={styles.cardTitle}>Signature & Rating</Text>
          <Pressable
            style={styles.signatureArea}
            onPress={() => setShowSignatureSheet(true)}
          >
            {customerSignPaths.length > 0 ? (
              <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                {customerSignPaths.map((path, idx) => (
                  <Path
                    key={idx}
                    d={buildPathD(path.points)}
                    stroke="#1C1C1E"
                    strokeWidth={2.2}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </Svg>
            ) : (
              <Text style={styles.signaturePlaceholder}>Click Here For Signature</Text>
            )}
          </Pressable>
        </View>

        {/* ── SATISFACTION CODE (only when task has a HappyCode) ─────── */}
        {hasHappyCode && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Satisfaction Code</Text>
            <TextInput
              value={satisfactionCode}
              onChangeText={setSatisfactionCode}
              placeholder="Enter satisfaction code"
              placeholderTextColor="#ABABAB"
              keyboardType="numeric"
              style={styles.deviceInput}
            />
          </View>
        )}

        {/* ── UPLOAD ATTACHMENT ───────────────────────────────────────── */}
        <View style={[styles.card, { marginBottom: vs(16), backgroundColor: '#f2f2f2' }]}>
          <Text style={styles.cardTitle}>* Upload Attachment Here [Upto 5 MB Limit]</Text>
          <Pressable
            style={styles.dashedBox}
            onPress={() => openPhotoPicker({ type: 'attachment' })}
          >
            {attachment?.uri ? (
              <Image source={{ uri: attachment.uri }} style={styles.attachThumb} />
            ) : (
              <View style={styles.dashedInner}>
                <Ionicons name="cloud-upload-outline" size={sp(24)} color={COLORS.primary} />
                <Text style={styles.attachLabel}>Attachment</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── REQUEST ITEMS BTN ───────────────────────────────────────── */}
        <Pressable
          style={styles.requestBtn}
          onPress={() => navigation.navigate('ItemRequest', { routeTask })}
        >
          <Text style={styles.requestBtnText}>REQUEST ITEMS</Text>
        </Pressable>

        {/* ── CONTINUE BTN ────────────────────────────────────────────── */}
        <Pressable
          style={[styles.continueBtn, submitting && { opacity: 0.6 }]}
          onPress={handleContinue}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueBtnText}>CONTINUE</Text>
          )}
        </Pressable>

      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════════
          SIGNATURE MODAL
      ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showSignatureSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSignatureSheet(false)}
      >
        <View style={styles.bottomSheetOverlay}>
          <View style={styles.signatureSheet}>
            <Text style={styles.signatureSheetTitle}>Signature & Rating</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: vs(16) }}
            >
              {/* ADD CUSTOMER DETAILS */}
              <Pressable
                style={[
                  styles.signatureDropdown,
                  customerExpanded && sigModalStyles.dropdownActive,
                ]}
                onPress={() => toggleAccordion('customer')}
              >
                <Text style={styles.signatureDropdownText}>ADD CUSTOMER DETAILS</Text>
                <Ionicons name="caret-down" size={sp(20)} color={COLORS.primary} />
              </Pressable>

              {customerExpanded && (
                <View style={sigModalStyles.expandedSection}>
                  <View style={sigModalStyles.fieldsAndPhoto}>
                    <View style={sigModalStyles.fieldsCol}>
                      <TextInput
                        value={customerName}
                        onChangeText={setCustomerName}
                        placeholder="Customer Name"
                        placeholderTextColor="#a6a6a6"
                        style={sigModalStyles.roundedInput}
                      />
                      <TextInput
                        value={customerNumber}
                        onChangeText={setCustomerNumber}
                        placeholder="Customer Number"
                        placeholderTextColor="#a6a6a6"
                        keyboardType="phone-pad"
                        style={[sigModalStyles.roundedInput, { marginTop: vs(20) }]}
                      />
                    </View>
                    <Pressable
                      style={sigModalStyles.photoSlot}
                      onPress={() => openPhotoPicker({ type: 'customerPhoto' })}
                    >
                      {customerPhoto?.uri ? (
                        <>
                          <Image source={{ uri: customerPhoto.uri }} style={sigModalStyles.photoThumb} />
                          <Pressable
                            style={sigModalStyles.photoRemoveBtn}
                            onPress={() => setCustomerPhoto(null)}
                            hitSlop={6}
                          >
                            <Ionicons name="close" size={sp(15)} color="#fff" />
                          </Pressable>
                        </>
                      ) : (
                        <Ionicons name="camera-outline" size={sp(60)} color="#a6a6a6" />
                      )}
                    </Pressable>
                  </View>

                  <View style={sigModalStyles.signatureRow}>
                    <Text style={sigModalStyles.signatureLabel}>Signature</Text>
                    <Pressable onPress={() => setCustomerSignPaths([])}>
                      <Text style={sigModalStyles.clearText}>CLEAR</Text>
                    </Pressable>
                  </View>
                  <SignaturePad
                    paths={customerSignPaths}
                    onPathsChange={setCustomerSignPaths}
                    height={150}
                  />

                  <StarRating
                    value={rating}
                    onChange={v => {
                      setRating(v);
                      if (v > 3) setRatingRemark('');
                    }}
                  />

                  {rating > 0 && rating <= 3 && (
                    <View style={sigModalStyles.remarkContainer}>
                      <TextInput
                        value={ratingRemark}
                        onChangeText={setRatingRemark}
                        placeholder="Enter Remark Here..."
                        placeholderTextColor="#ABABAB"
                        style={sigModalStyles.roundedInput}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>
                  )}
                </View>
              )}

              {/* ADD TECHNICIAN DETAILS */}
              <Pressable
                style={[
                  styles.signatureDropdown,
                  { marginTop: vs(20) },
                  techExpanded && sigModalStyles.dropdownActive,
                ]}
                onPress={() => toggleAccordion('tech')}
              >
                <Text style={styles.signatureDropdownText}>ADD TECHNICIAN DETAILS</Text>
                <Ionicons name="caret-down" size={sp(20)} color={COLORS.primary} />
              </Pressable>

              {techExpanded && (
                <View style={sigModalStyles.expandedSection}>
                  <Text style={sigModalStyles.techInfoLabel}>Tech Info.</Text>
                  <Pressable
                    style={sigModalStyles.techPhotoSlot}
                    onPress={() => openPhotoPicker({ type: 'techPhoto' })}
                  >
                    {techPhoto?.uri ? (
                      <>
                        <Image source={{ uri: techPhoto.uri }} style={sigModalStyles.techPhotoThumb} />
                        <Pressable
                          style={sigModalStyles.photoRemoveBtn}
                          onPress={() => setTechPhoto(null)}
                          hitSlop={6}
                        >
                          <Ionicons name="close" size={sp(15)} color="#fff" />
                        </Pressable>
                      </>
                    ) : (
                      <Ionicons name="camera-outline" size={sp(80)} color="#ABABAB" />
                    )}
                  </Pressable>

                  <View style={sigModalStyles.signatureRow}>
                    <Text style={sigModalStyles.signatureLabel}>Signature</Text>
                    <Pressable onPress={() => setTechSignPaths([])}>
                      <Text style={sigModalStyles.clearText}>CLEAR</Text>
                    </Pressable>
                  </View>
                  <SignaturePad
                    paths={techSignPaths}
                    onPathsChange={setTechSignPaths}
                    height={130}
                  />
                </View>
              )}
            </ScrollView>

            <Pressable
              style={styles.signatureSaveBtn}
              onPress={() => setShowSignatureSheet(false)}
            >
              <Text style={styles.signatureSaveText}>SAVE</Text>
            </Pressable>
            <Pressable onPress={() => setShowSignatureSheet(false)}>
              <Text style={styles.signatureCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════
          PHOTO SOURCE MODAL
      ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showPhotoSourceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotoSourceModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowPhotoSourceModal(false)}
        >
          <Pressable>
            <View style={styles.sourceSheet}>
              <Text style={styles.sourceTitle}>Select Image Source</Text>
              <View style={styles.sourceDivider} />
              <TouchableOpacity
                style={styles.sourceOption}
                onPress={() => handlePhotoSource('camera')}
              >
                <View style={[styles.sourceIconWrap, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="camera-outline" size={sp(20)} color="#fff" />
                </View>
                <Text style={styles.sourceOptionText}>Camera</Text>
              </TouchableOpacity>
              <View style={styles.sourceDivider} />
              <TouchableOpacity
                style={styles.sourceOption}
                onPress={() => handlePhotoSource('gallery')}
              >
                <View style={[styles.sourceIconWrap, { backgroundColor: '#6366F1' }]}>
                  <Ionicons name="images-outline" size={sp(20)} color="#fff" />
                </View>
                <Text style={styles.sourceOptionText}>Gallery</Text>
              </TouchableOpacity>
              <View style={styles.sourceDivider} />
              <TouchableOpacity
                style={[styles.sourceOption, { justifyContent: 'center' }]}
                onPress={() => setShowPhotoSourceModal(false)}
              >
                <Text style={[styles.sourceOptionText, { color: COLORS.primary, fontWeight: '600' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════
          UPDATE USED ITEM SHEET
      ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showUsedItemSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUsedItemSheet(false)}
      >
        <View style={styles.sheetOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={usedItemStyles.sheet}
          >
            {/* Dark header */}
            <View style={usedItemStyles.header}>
              <Text style={usedItemStyles.headerTitle}>Update Used Items</Text>
              <Pressable onPress={() => setShowUsedItemSheet(false)} hitSlop={10}>
                <Ionicons name="close" size={sp(30)} color="#fff" />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={usedItemStyles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {issueListLoading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: vs(30) }} />
              ) : (
                <>
                  {/* ── Assigned items (Task.MultipleItemAssigned) ── */}
                  {assignedSlots.map((slot, idx) => (
                    <View key={`assigned-${idx}`} style={usedItemStyles.itemRow}>
                      <Text style={usedItemStyles.itemName} numberOfLines={2}>
                        {idx + 1}. {slot.ItemName}
                      </Text>
                      <View style={usedItemStyles.assignedPill}>
                        <Text style={usedItemStyles.assignedQtyText}>{slot.AssignedQty}</Text>
                      </View>
                      <TextInput
                        value={slot.usedQty}
                        onChangeText={val => {
                          const num = Number(val);
                          if (val !== '' && (isNaN(num) || num > slot.AssignedQty)) return;
                          setAssignedSlots(prev =>
                            prev.map((s, i) => (i === idx ? { ...s, usedQty: val } : s))
                          );
                        }}
                        placeholder="Used Qty"
                        placeholderTextColor="#ABABAB"
                        keyboardType="numeric"
                        style={usedItemStyles.usedQtyInput}
                      />
                    </View>
                  ))}

                  {assignedSlots.length === 0 && visibleSlotCount === 0 && (
                    <Text style={usedItemStyles.emptyText}>
                      No items assigned to this task.
                    </Text>
                  )}

                  {/* ── Ad-hoc "Add More" slots (max 10) ── */}
                  {Array.from({ length: visibleSlotCount }).map((_, idx) => {
                    const slot = adHocSlots[idx];
                    return (
                      <View key={`adhoc-${idx}`} style={usedItemStyles.adHocBlock}>
                        {/* Header row: # Item1 + red X */}
                        <View style={usedItemStyles.slotHeaderRow}>
                          <Text style={usedItemStyles.slotLabel}># Item{idx + 1}</Text>
                          <Pressable
                            hitSlop={8}
                            onPress={() => {
                              setAdHocSlots(prev => prev.filter((_, i) => i !== idx));
                              setVisibleSlotCount(c => c - 1);
                            }}
                          >
                            <Ionicons name="close" size={sp(22)} color={COLORS.primary} />
                          </Pressable>
                        </View>

                        {/* Item row: dropdown | avl qty | used qty */}
                        <View style={usedItemStyles.itemRow}>
                          {/* Dropdown-style item picker */}
                          <Pressable
                            style={usedItemStyles.itemPickerBtn}
                            onPress={() => {
                              pendingSlotIndexRef.current = idx;
                              setItemPickerSearch('');
                              setShowItemPicker(true);
                            }}
                          >
                            <Text
                              style={[
                                usedItemStyles.itemPickerText,
                                !slot?.itemName && { color: '#ABABAB' },
                              ]}
                              numberOfLines={1}
                            >
                              {slot?.itemName || 'Item Name'}
                            </Text>
                            <Ionicons name="chevron-down" size={sp(18)} color="#ABABAB" />
                          </Pressable>

                          {/* Available qty pill — always visible, shows 0 until item selected */}
                          <View style={usedItemStyles.assignedPill}>
                            <Text style={usedItemStyles.assignedQtyText}>
                              {slot?.avlQty ?? 0}
                            </Text>
                          </View>

                          {/* Used qty input */}
                          <TextInput
                            value={slot?.usedQty ?? ''}
                            onChangeText={val => {
                              const num = Number(val);
                              if (val !== '' && isNaN(num)) return;
                              setAdHocSlots(prev => {
                                const updated = [...prev];
                                const existing = updated[idx];
                                updated[idx] = {
                                  itemIssuedId: existing?.itemIssuedId ?? 0,
                                  itemId:       existing?.itemId ?? 0,
                                  itemName:     existing?.itemName ?? '',
                                  salesPrice:   existing?.salesPrice ?? 0,
                                  avlQty:       existing?.avlQty ?? 0,
                                  usedQty:      val,
                                };
                                return updated;
                              });
                            }}
                            placeholder="Use..."
                            placeholderTextColor="#ABABAB"
                            keyboardType="numeric"
                            style={usedItemStyles.usedQtyInput}
                          />
                        </View>
                      </View>
                    );
                  })}

                  {/* + Add More */}
                  {visibleSlotCount < MAX_ADHOC_SLOTS && (
                    <Pressable style={usedItemStyles.addMoreBtn} onPress={handleAddMoreSlot}>
                      <Text style={usedItemStyles.addMoreText}>+ Add More</Text>
                    </Pressable>
                  )}
                </>
              )}
            </ScrollView>

            <Pressable style={usedItemStyles.updateBtn} onPress={handleUsedItemUpdate}>
              <Text style={usedItemStyles.updateBtnText}>UPDATE</Text>
            </Pressable>
            <Pressable onPress={() => setShowUsedItemSheet(false)}>
              <Text style={usedItemStyles.cancelText}>Cancel</Text>
            </Pressable>

          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════
          FSR CHECKPOINTS SHEET 
      ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showFSRSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFSRSheet(false)}
      >
        <View style={styles.sheetOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={fsrStyles.sheet}
          >
            <Pressable onPress={() => setShowFSRSheet(false)} hitSlop={10}>
                <Ionicons 
                  name="close-circle" size={sp(35)} 
                  style={{color: COLORS.primary, alignSelf: 'flex-end', marginRight: sp(10), marginTop: sp(10)}} 
                />
              </Pressable>
              <Text style={fsrStyles.headerTitle} numberOfLines={1}>
                {fsrName || 'FSR Checkpoints'}
              </Text>

            <ScrollView
              contentContainerStyle={fsrStyles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {fsrLoading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: vs(30) }} />
              ) : fsrCategories.length === 0 ? (
                <Text style={fsrStyles.emptyText}>No checkpoints found for this FSR.</Text>
              ) : (
                fsrCategories.map(category => (
                  <View key={category.CategoryId} style={fsrStyles.categoryBlock}>
                    <Text style={fsrStyles.categoryName}>{category.CategoryName}</Text>

                    {(category.lstCheckpointDTo ?? []).map(checkpoint => {
                      const selectedStatusId = fsrSelections[checkpoint.CheckpointId] ?? 0;
                      const selectedLabel = fsrStatusOptions.find(
                        o => o.CheckpointStatusId === selectedStatusId
                      )?.CheckpointStatusName;

                      return (
                        <View key={checkpoint.CheckpointId} style={fsrStyles.checkpointRow}>
                          <Text style={fsrStyles.checkpointName} numberOfLines={2}>
                            {checkpoint.CheckpointName}
                          </Text>

                          <Pressable
                            style={fsrStyles.statusSelectBtn}
                            onPress={() => setActiveCheckpointPicker(checkpoint.CheckpointId)}
                          >
                            <Text
                              style={[
                                fsrStyles.statusSelectText,
                                !selectedLabel && fsrStyles.statusSelectPlaceholder,
                              ]}
                            >
                              {selectedLabel || 'Select'}
                            </Text>
                            <Ionicons name="chevron-down" size={sp(18)} />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ))
              )}
            </ScrollView>

            <Pressable
              style={[fsrStyles.submitBtn, fsrSubmitting && { opacity: 0.6 }]}
              onPress={handleSubmitFSRCheckpoints}
              disabled={fsrSubmitting}
            >
              {fsrSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={fsrStyles.submitBtnText}>SUBMIT</Text>
              )}
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Checkpoint status picker */}
      <Modal
        visible={activeCheckpointPicker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveCheckpointPicker(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setActiveCheckpointPicker(null)}
        >
          <Pressable>
            <View style={usedItemStyles.pickerSheet}>
              <ScrollView style={{ maxHeight: vs(350) }}>
                {fsrStatusOptions.map(opt => (
                  <Pressable
                    key={opt.CheckpointStatusId}
                    style={usedItemStyles.pickerRow}
                    onPress={() => {
                      if (activeCheckpointPicker !== null) {
                        handleSelectCheckpointStatus(activeCheckpointPicker, opt.CheckpointStatusId);
                      }
                      setActiveCheckpointPicker(null);
                    }}
                  >
                    <Text style={usedItemStyles.pickerRowText}>{opt.CheckpointStatusName}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════
          SEARCHABLE ITEM PICKER 
      ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showItemPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowItemPicker(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowItemPicker(false)}
        >
          <Pressable>
            <View style={usedItemStyles.pickerSheet}>
              <TextInput
                value={itemPickerSearch}
                onChangeText={setItemPickerSearch}
                placeholder="Search item..."
                placeholderTextColor="#ABABAB"
                style={usedItemStyles.pickerSearch}
                autoFocus
              />
              <ScrollView style={{ maxHeight: vs(350) }} keyboardShouldPersistTaps="handled">
                {issueList
                  .filter(i =>
                    i.Name.toLowerCase().includes(itemPickerSearch.toLowerCase())
                  )
                  .map(item => (
                    <Pressable
                      key={item.Id}
                      style={usedItemStyles.pickerRow}
                      onPress={() => {
                        const idx = pendingSlotIndexRef.current;
                        if (idx < 0) return;
                        setAdHocSlots(prev => {
                          const updated = [...prev];
                          updated[idx] = {
                            itemIssuedId: item.Id,       // Id from AllItemList
                            itemId:       item.ItemId,
                            itemName:     item.Name,
                            salesPrice:   item.SalesPrice,
                            avlQty:       item.Quantity, // UnAssignedQuantity mapped above
                            usedQty:      updated[idx]?.usedQty ?? '',
                          };
                          return updated;
                        });
                        setShowItemPicker(false);
                      }}
                    >
                      <Text style={usedItemStyles.pickerRowText}>{item.Name}</Text>
                    </Pressable>
                  ))}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </KeyboardAvoidingView>
  );
}

// ─── Used Item Styles ─────────────────────────────────────────────────────────

const usedItemStyles = StyleSheet.create({
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    paddingBottom: vs(24),
    maxHeight: '82%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2B2B2B',
    borderRadius: scale(28),
    paddingHorizontal: scale(25),
    paddingVertical: vs(12),
  },
  headerTitle: {
    fontSize: sp(24),
    fontWeight: '400',
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: scale(18),
    paddingTop: vs(18),
    paddingBottom: vs(10),
    gap: vs(14),
  },
  emptyText: {
    textAlign: 'center',
    color: '#a6a6a6',
    fontSize: sp(18),
    marginTop: vs(20),
  },
  sectionBlock: {
    gap: vs(12),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  itemName: {
    flex: 1,
    fontSize: sp(18),
    flexShrink: 1,
  },
  assignedPill: {
    height: vs(40),
    width: scale(50),
    borderWidth: 1.2,
    borderColor: '#a6a6a6',
    borderRadius: scale(30),
    paddingHorizontal: scale(12),
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assignedQtyText: {
    fontSize: sp(18),
    color: '#1C1C1E',
    fontWeight: '400',
    flex: 1,
    flexShrink: 1,
    textAlign: 'center',
  },
  usedQtyInput: {
    width: scale(120),
    height: vs(40),
    borderWidth: 1.2,
    borderColor: '#838383',
    borderRadius: scale(30),
    paddingHorizontal: scale(12),
    fontSize: sp(18),
    textAlign: 'center',
  },
  adHocBlock: {
    marginBottom: vs(4),
  },
  addMoreBtn: {
    alignSelf: 'center',
    paddingVertical: vs(8),
    marginTop: vs(6),
  },
  addMoreText: {
    fontSize: sp(22),
    color: COLORS.primary,
    fontWeight: '500',
  },
  updateBtn: {
    marginHorizontal: scale(18),
    marginTop: vs(16),
    height: vs(50),
    backgroundColor: '#2B2B2B',
    borderRadius: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  updateBtnText: {
    color: '#fff',
    fontSize: sp(22),
    fontWeight: '500',
    letterSpacing: 1.2,
  },
  cancelText: {
    color: COLORS.primary,
    fontSize: sp(22),
    fontWeight: '500',
    textAlign: 'center',
    marginTop: vs(16),
  },
  pickerSheet: {
    backgroundColor: '#fff',
    borderRadius: scale(12),
    width: scale(280),
    maxHeight: vs(420),
    padding: scale(12),
    elevation: 10,
  },
  pickerSearch: {
    height: vs(40),
    borderWidth: 1.2,
    borderColor: '#a6a6a6',
    borderRadius: scale(20),
    paddingHorizontal: scale(14),
    fontSize: sp(16),
    color: '#1C1C1E',
    marginBottom: vs(8),
  },
  pickerRow: {
    paddingVertical: vs(12),
    paddingHorizontal: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerRowText: {
    fontSize: sp(16),
    color: '#1C1C1E',
  },
  slotHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(6),
  },
  slotLabel: {
    fontSize: sp(16),
    fontWeight: '600',
    color: COLORS.primary, 
  },
  itemPickerBtn: {
    flex: 1,
    height: vs(40),
    borderWidth: 1.2,
    borderColor: '#a6a6a6',
    borderRadius: scale(30),
    paddingHorizontal: scale(12),
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemPickerText: {
    fontSize: sp(16),
    flex: 1,
  },
});

// ─── Signature Modal Styles ───────────────────────────────────────────────────

const fsrStyles = StyleSheet.create({
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    maxHeight: '95%',
    overflow: 'hidden',
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: sp(22),
    fontWeight: '400',
    marginTop: sp(-10),
  },
  listContent: {
    padding: scale(16),
    paddingBottom: vs(20),
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: sp(16),
    marginTop: vs(30),
  },
  categoryBlock: {
    marginBottom: vs(16),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: scale(14),
    padding: scale(16),
    paddingBottom: vs(4),
  },
  categoryName: {
    fontSize: sp(18),
    fontWeight: '500',
    color: COLORS.primary,
    marginBottom: vs(14),
  },
  checkpointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(12),
    gap: scale(12),
  },
  checkpointName: {
    flex: 1,
    fontSize: sp(16),
    color: '#1C1C1E',
  },
  
  submitBtn: {
    backgroundColor: '#1C1C1E',
    marginHorizontal: scale(16),
    marginBottom: vs(16),
    paddingVertical: vs(16),
    borderRadius: scale(15),
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: sp(22),
    fontWeight: '400',
  },
  statusSelectBtn: {
    width: scale(150),
    height: vs(30),
    borderWidth: 1.2,
    borderColor: '#C8C8C8',
    borderRadius: scale(30),
    paddingHorizontal: scale(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  statusSelectText: {
    fontSize: sp(15),
    color: '#565656',
  },
  statusSelectPlaceholder: {
    color: '#ABABAB',
  },
});

const sigModalStyles = StyleSheet.create({
  dropdownActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
  },
  expandedSection: {
    marginTop: vs(8),
    marginBottom: vs(8),
  },
  fieldsAndPhoto: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(10),
  },
  fieldsCol: {
    width: vs(180),
  },
  roundedInput: {
    height: vs(40),
    borderWidth: 1.2,
    borderColor: '#a6a6a6',
    borderRadius: scale(30),
    paddingHorizontal: scale(18),
    fontSize: sp(18),
    color: '#1C1C1E',
    backgroundColor: '#fff',
  },
  photoSlot: {
    width: scale(100),
    height: scale(90),
    borderWidth: 1.5,
    borderColor: '#a6a6a6',
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginTop: vs(10),
    marginLeft: vs(50),
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: scale(4),
    right: scale(4),
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    backgroundColor: 'rgba(239,68,68,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: vs(14),
  },
  signatureLabel: {
    fontSize: sp(18),
    fontWeight: '400',
    color: '#1C1C1E',
  },
  clearText: {
    fontSize: sp(18),
    color: COLORS.primary,
    fontWeight: '500',
  },
  techInfoLabel: {
    fontSize: sp(25),
    fontWeight: '400',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: vs(5),
    marginTop: vs(10),
  },
  techPhotoSlot: {
    width: '100%',
    height: vs(100),
    borderWidth: 1.5,
    borderColor: '#a6a6a6',
    borderRadius: scale(15),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  techPhotoThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  remarkContainer: {
    marginTop: vs(12),
  },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  redBg: {
    height: HEADER_TOP_PADDING + vs(10),
    backgroundColor: COLORS.primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
  },
  scrollContent: {
    paddingTop: vs(8),
    paddingBottom: vs(32),
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: scale(12),
    marginVertical: vs(8),
    padding: scale(14),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: scale(14),
    shadowColor: '#d1d1d1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: sp(18),
    fontWeight: '500',
    color: '#1C1C1E',
  },
  cardSubtitle: {
    fontSize: sp(15),
    color: '#9CA3AF',
    marginBottom: vs(10),
  },
  photoRow: {
    flexDirection: 'row',
    gap: scale(18),
  },
  photoSlot: {
    width: scale(100),
    height: scale(100),
    aspectRatio: 1,
    borderWidth: 1.5,
    borderColor: '#898989',
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: scale(4),
    right: scale(4),
    width: scale(18),
    height: scale(18),
    borderRadius: scale(15),
    borderColor: '#bcbcbc',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workModeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(18),
    marginTop: vs(8),
    marginBottom: vs(4),
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  radioOuter: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    borderWidth: 2,
    borderColor: '#a6a6a6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: COLORS.primary,
  },
  radioLabel: {
    fontSize: sp(16),
    color: '#000',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: scale(30),
    height: vs(44),
    marginTop: vs(8),
    marginBottom: vs(8),
    overflow: 'hidden',
  },
  addRowPlaceholder: {
    flex: 1,
    paddingHorizontal: scale(14),
    fontSize: sp(18),
    color: '#a6a6a6',
    textAlign: 'center',
  },
  plusBtn: {
    fontSize: sp(30),
    color: COLORS.primary,
    paddingHorizontal: scale(14),
    lineHeight: sp(32),
  },
  noteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(25),
    borderWidth: 1,
    borderColor: '#d1d1d1',
    paddingHorizontal: scale(14),
    paddingVertical: vs(10),
    marginBottom: vs(8),
    gap: scale(8),
  },
  noteChipIndex: {
    fontSize: sp(18),
    fontWeight: '600',
    color: '#000',
    minWidth: scale(16),
  },
  noteChipText: {
    flex: 1,
    fontSize: sp(18),
    color: '#000',
  },
  noteChipPlaceholder: {
    color: '#a6a6a6',
  },
  notAllowedText: {
    fontSize: sp(12),
    color: COLORS.primary,
    marginTop: vs(4),
    marginLeft: scale(4),
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scale(30),
    borderTopRightRadius: scale(30),
    paddingHorizontal: scale(22),
    paddingTop: vs(15),
    paddingBottom: vs(20),
  },
  sheetContent: {
    gap: vs(16),
  },
  sheetTitle: {
    fontSize: sp(22),
    fontWeight: '400',
    color: '#1c1c1e',
    textAlign: 'center',
  },
  sheetTextArea: {
    borderWidth: 2,
    borderColor: '#a6a6a6',
    borderRadius: scale(20),
    minHeight: vs(180),
    padding: scale(14),
    fontSize: sp(16),
    color: '#1F2937',
  },
  sheetSaveBtn: {
    height: vs(45),
    backgroundColor: COLORS.primary,
    borderRadius: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  sheetSaveBtnText: {
    color: '#FFF',
    fontSize: sp(22),
    fontWeight: '400',
    letterSpacing: 1,
  },
  sheetCancelText: {
    color: COLORS.primary,
    fontSize: sp(23),
    fontWeight: '500',
    textAlign: 'center',
    marginTop: vs(5),
  },
  deviceChipWrapper: {
    marginBottom: vs(8),
  },
  deviceForm: {
    borderRadius: scale(12),
    padding: scale(12),
    gap: vs(10),
    marginTop: vs(4),
  },
  deviceInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(25),
    borderWidth: 1,
    borderColor: '#d1d1d1',
    paddingHorizontal: scale(16),
    paddingVertical: vs(12),
    fontSize: sp(18),
    color: '#1F2937',
  },
  photoInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: scale(12),
  },
  tilesRow: {
    flexDirection: 'row',
    gap: scale(10),
    marginHorizontal: scale(16),
    marginVertical: vs(10),
  },
  tile: {
    flex: 1,
    backgroundColor: '#EBF3FF',
    borderRadius: scale(12),
    padding: scale(8),
    minHeight: vs(100),
  },
  tileTitle: {
    fontSize: sp(18),
    fontWeight: '500',
    color: '#000',
    marginBottom: vs(6),
    textAlign: 'center',
  },
  tileSub: {
    fontSize: sp(16),
    color: '#666666',
    lineHeight: sp(17),
    textAlign: 'center',
  },
  naCard: {
    backgroundColor: '#f2f2f2',
    borderRadius: scale(12),
    marginHorizontal: scale(16),
    marginBottom: vs(10),
    paddingHorizontal: scale(10),
    paddingTop: vs(5),
    paddingBottom: vs(50),
  },
  naTitle: {
    fontSize: sp(18),
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: vs(5),
  },
  naSub: {
    fontSize: sp(16),
    color: '#666666',
    textAlign: 'center',
    marginTop: vs(8),
  },
  signatureArea: {
    height: vs(100),
    borderRadius: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signaturePlaceholder: {
    fontSize: sp(16),
    color: '#666666',
    textAlign: 'center',
    marginLeft: scale(80),
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  signatureSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: scale(30),
    borderTopRightRadius: scale(30),
    paddingHorizontal: scale(22),
    paddingTop: vs(10),
    paddingBottom: vs(20),
    maxHeight: '92%',
  },
  signatureSheetTitle: {
    textAlign: 'center',
    fontSize: sp(22),
    fontWeight: '400',
    color: '#1C1C1E',
    marginBottom: vs(10),
  },
  signatureDropdown: {
    height: vs(50),
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: scale(22),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(25),
  },
  signatureDropdownText: {
    fontSize: sp(20),
    color: COLORS.primary,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  signatureSaveBtn: {
    height: vs(45),
    backgroundColor: COLORS.primary,
    borderRadius: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  signatureSaveText: {
    color: '#FFF',
    fontSize: sp(22),
    fontWeight: '400',
    letterSpacing: 1,
  },
  signatureCancelText: {
    color: COLORS.primary,
    fontSize: sp(23),
    fontWeight: '500',
    marginTop: vs(30),
    alignItems: 'center',
    textAlign: 'center',
  },
  dashedBox: {
    marginTop: vs(12),
    alignSelf: 'center',
    width: '55%',
    borderWidth: 1.5,
    borderColor: '#a6a6a6',
    borderStyle: 'dashed',
    borderRadius: scale(8),
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  dashedInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: vs(14),
    paddingHorizontal: scale(16),
  },
  attachLabel: {
    fontSize: sp(18),
    color: COLORS.black,
    fontWeight: '400',
    marginLeft: scale(8),
  },
  attachThumb: {
    width: '100%',
    height: vs(80),
  },
  requestBtn: {
    marginHorizontal: scale(16),
    marginTop: vs(6),
    marginBottom: vs(14),
    height: vs(50),
    backgroundColor: '#1F2937',
    borderRadius: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestBtnText: {
    color: '#fff',
    fontSize: sp(22),
    fontWeight: '400',
    letterSpacing: 1.2,
  },
  continueBtn: {
    marginHorizontal: scale(16),
    height: vs(50),
    backgroundColor: COLORS.primary,
    borderRadius: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    color: '#fff',
    fontSize: sp(22),
    fontWeight: '400',
    letterSpacing: 1.2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(32),
  },
  sourceSheet: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    width: '100%',
    paddingVertical: vs(8),
    elevation: 10,
  },
  sourceTitle: {
    fontSize: sp(16),
    fontWeight: '600',
    color: '#111',
    paddingHorizontal: scale(20),
    paddingVertical: vs(14),
  },
  sourceDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  sourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: vs(14),
    gap: scale(14),
  },
  sourceIconWrap: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceOptionText: {
    fontSize: sp(15),
    color: '#1F2937',
  },
});