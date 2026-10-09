// src/screens/technician/main/TaskSummaryScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp } from '../../../utils/responsive';
import { addTaskClosure, getBeforeAfterOnHoldTaskImages } from '../../../api/task/taskService';
import { getAllChkpointInputformData } from '../../../api/fsrManagement/fsrManagementService';
import type { AllChkPointInputFormDTOResultData } from '../../../api/fsrManagement/fsrManagement.types';
import { getCurrentCountryCode, getCurrentCurrencySymbol, getCurrentUserProfile } from '../../../state/session';
import { getIsHNGClient } from '../../../api/users/usersService';
import type { TasksListResultData as Task, TaskClosureResultData as TaskClosurePayload } from '../../../api/task/task.types';
import { resetToTabsThen, finishTaskFlowToHome } from '../../../navigation/taskFlowNavigation';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SignaturePath {
  points: { x: number; y: number }[];
}

interface SummaryItem {
  name?: string;
  assignedQty: number;
  usedQty: number;
  price: number;
}

interface SummaryPreview {
  items?: SummaryItem[];
  workModeType: string;
  customerName: string;
  customerNumber: string;
  rating: number;
  ratingRemark: string;
  fieldPhotoUris: string[];
  customerPhotoUri?: string;
  techPhotoUri?: string;
  customerSignPaths: SignaturePath[];
  techSignPaths: SignaturePath[];
}

const buildPathD = (points: { x: number; y: number }[]) => {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
  return d;
};

function SignaturePreview({ paths }: { paths: SignaturePath[] }) {
  if (!paths.length) {
    return (
      <View style={styles.signatureEmpty}>
        <Text style={styles.signatureEmptyText}>No signature</Text>
      </View>
    );
  }
  return (
    <View style={styles.signatureBox}>
      <Svg width="100%" height="100%" viewBox="0 0 400 200">
        {paths.map((p, i) => (
          <Path
            key={i}
            d={buildPathD(p.points)}
            stroke="#1C1C1E"
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </Svg>
    </View>
  );
}

function StarsReadOnly({ value }: { value: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: scale(2) }}>
      {[1, 2, 3, 4, 5].map(star => (
        <Ionicons
          key={star}
          name={star <= value ? 'star' : 'star-outline'}
          size={sp(18)}
          color={COLORS.primary}
        />
      ))}
    </View>
  );
}

export default function TaskSummaryScreen({ navigation, route }: any) {
  const { task, elapsedSeconds = 0, payload, preview, returnTo } = route.params as {
    returnTo?: { name: string; params?: any };
    task: Task;
    elapsedSeconds?: number;
    payload: TaskClosurePayload;
    preview: SummaryPreview;
  };

  const [submitting, setSubmitting] = useState(false);
  const [beforePhotoUris, setBeforePhotoUris] = useState<string[]>([]);
  const [checkpointForm, setCheckpointForm] = useState<AllChkPointInputFormDTOResultData | null>(null);

  // Java (SummaryDetailsFragment.inIt): loads the saved checkpoint / input form
  // (FSRManagement/GetSavedSelectedCheckpoint) and the before-task photos
  // (TaskList/GetBeforeAfterAndHoldTaskFiles, before flag) to show on the summary.
  useEffect(() => {
    let active = true;
    (async () => {
      const uid = Number(await AsyncStorage.getItem('uid'));
      try {
        const res = await getAllChkpointInputformData({ UserId: uid, TaskId: task.Id });
        if (active && res?.Code === '200') setCheckpointForm(res.ResultData ?? null);
      } catch {
        // optional section
      }
      try {
        const res = await getBeforeAfterOnHoldTaskImages({
          userId: uid,
          taskId: task.Id,
          beforeImages: true,
          afterImages: false,
          onHoldImages: false,
        });
        const files = res?.ResultData?.FileLists ?? [];
        if (active) setBeforePhotoUris(files.map(f => f.FilePath || '').filter(Boolean));
      } catch {
        // optional section
      }
    })();
    return () => {
      active = false;
    };
  }, [task.Id]);

  const countryCode = getCurrentCountryCode();
  const currencySymbol = getCurrentCurrencySymbol() || '₹';
  const techName = getCurrentUserProfile().userFirstName;
  const inputForm = checkpointForm?.lstInputText?.[0];
  const fsrForm = checkpointForm?.lstFSRManagement?.[0];
  const notes = payload.TechnicalNotedto ?? [];
  const devices = payload.DeviceInfoList ?? [];
  const items = preview.items ?? [];

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const freshUid = await AsyncStorage.getItem('uid');
      if (!freshUid) {
        Alert.alert('Error', 'User session not found. Please log in again.');
        return;
      }

      // Step 1: Add closure details (Android: updateTask() → updateTaskClosure API)
      try {
        const closureRes = await addTaskClosure(payload);
        if (closureRes.Code !== '200') {
          Alert.alert('Closure Failed', closureRes.Message || 'Unknown error');
          return;
        }
      } catch (err: any) {
        Alert.alert('Closure Error', err?.response?.data?.Message || err?.message);
        return;
      }

      const isRateMode =
        task.TaskState === 2 &&
        (task.PaymentMode ?? '').toLowerCase() === 'rate' && task.PaymentModeId === 2;

      // Java (getHNGVerification): users under an HNG client always go to the payment
      // screen after closure, whatever the task's payment mode. A failed lookup means
      // "not HNG", same as Java.
      let isHngClient = false;
      try {
        const hng = await getIsHNGClient({ UserId: Number(freshUid) });
        isHngClient = hng?.Code === '200';
      } catch {
        isHngClient = false;
      }

      if (isHngClient || isRateMode) {
        // The closure is already saved: back from Payment must not return to Summary,
        // where Submit would post the closure a second time.
        resetToTabsThen(navigation, { name: 'PaymentReceived', params: { task, elapsedSeconds } });
        return;
      }

      // Java: after a non-Rate, non-HNG closure the technician is offered the document
      // upload screen (skippable) before returning to the dashboard.
      Alert.alert('Task Completed', 'The task has been closed successfully.', [
        {
          text: 'OK',
          onPress: () => resetToTabsThen(navigation, { name: 'DocumentUpload', params: { task } }),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to close task');
    } finally {
      setSubmitting(false);
    }
  };

  const deviceUri = (v?: string) =>
    !v ? '' : /^(https?:|data:|file:)/.test(v) ? v : `data:image/jpeg;base64,${v}`;

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <Text style={styles.heading}>Field Photo</Text>
          <Text style={styles.subLabel}>Before</Text>
          <View style={styles.photoRow}>
            {beforePhotoUris.length > 0 ? (
              beforePhotoUris.map((uri, i) => (
                <Image key={`before-${i}`} source={{ uri }} style={styles.photoThumb} />
              ))
            ) : (
              <View style={[styles.photoThumb, styles.photoEmpty]} />
            )}
          </View>
          <Text style={styles.subLabel}>After</Text>
          <View style={styles.photoRow}>
            {preview.fieldPhotoUris.length > 0 ? (
              preview.fieldPhotoUris.map((uri, i) => (
                <Image key={`after-${i}`} source={{ uri }} style={styles.photoThumb} />
              ))
            ) : (
              <View style={[styles.photoThumb, styles.photoEmpty]} />
            )}
          </View>

          <Text style={styles.workModeRow}>
            Work Mode:  <Text style={styles.workModeValue}>{preview.workModeType}</Text>
          </Text>

          {items.length > 0 && (
            <>
              <Text style={styles.heading}>Items</Text>
              <View style={styles.itemRow}>
                <Text style={[styles.tableHead, { flex: 2 }]}>Item</Text>
                <Text style={[styles.tableHead, styles.tableNum]}>Assigned</Text>
                <Text style={[styles.tableHead, styles.tableNum]}>Used</Text>
                <Text style={[styles.tableHead, styles.tableNum]}>Price</Text>
              </View>
              {items.map((it, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={[styles.greyText, { flex: 2 }]}>{it.name || '—'}</Text>
                  <Text style={[styles.greyText, styles.tableNum]}>{it.assignedQty}</Text>
                  <Text style={[styles.greyText, styles.tableNum]}>{it.usedQty}</Text>
                  <Text style={[styles.greyText, styles.tableNum]}>
                    {currencySymbol} {it.price.toFixed(3)}
                  </Text>
                </View>
              ))}
            </>
          )}

          {notes.length > 0 && (
            <>
              <Text style={styles.heading}>Technical Notes</Text>
              {notes.map((n, i) => (
                <Text key={i} style={styles.noteText}>
                  {i + 1}. {n.TechnicalNote1}
                </Text>
              ))}
            </>
          )}

          {devices.length > 0 && (
            <>
              <Text style={styles.heading}>Device List</Text>
              {devices.map((d, i) => (
                <View key={i} style={styles.deviceBlock}>
                  <Text style={styles.greyText}>Device: {d.DeviceName}</Text>
                  <Text style={styles.greyText}>Company/Model: {d.ModelNumber}</Text>
                  {!!d.DeviceReading && (
                    <Text style={styles.greyText}>Device Reading: {Number(d.DeviceReading).toFixed(1)}</Text>
                  )}
                  <View style={styles.deviceImgRow}>
                    {[d.DevicePhoto1, d.DevicePhoto2, d.DevicePhoto3].filter(Boolean).map((img, j) => (
                      <Image key={j} source={{ uri: deviceUri(img) }} style={styles.deviceThumb} />
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}

          {!!inputForm?.lstInputTextCategoryDtos?.length && (
            <>
              <Text style={styles.heading}>{inputForm.Name || 'Input Form'}</Text>
              {inputForm.lstInputTextCategoryDtos.map((c, i) => (
                <View key={i} style={styles.deviceBlock}>
                  <Text style={styles.greyText}>{c.Name}</Text>
                  <Text style={styles.greyText}>{c.Description}</Text>
                </View>
              ))}
            </>
          )}

          {!!fsrForm?.lstFSRCategories?.length && (
            <>
              <Text style={styles.heading}>{fsrForm.FSRName || 'Checkpoints'}</Text>
              {fsrForm.lstFSRCategories.map((cat, i) => (
                <View key={i} style={styles.deviceBlock}>
                  <Text style={styles.categoryTitle}>{cat.CategoryName}</Text>
                  {(cat.lstCheckpointDTo ?? [])
                    .filter(c => c.FSRCategoryId === cat.CategoryId)
                    .map((c, j) => (
                      <Text key={j} style={styles.greyText}>
                        {c.CheckpointName}
                        {c.SelectedCheckpointStatus?.CheckpointStatusName
                          ? `: ${c.SelectedCheckpointStatus.CheckpointStatusName}`
                          : ''}
                      </Text>
                    ))}
                </View>
              ))}
            </>
          )}

          <View style={styles.signRow}>
            <View style={styles.signCol}>
              <Text style={styles.signTitle}>Cust. Sign</Text>
              <SignaturePreview paths={preview.customerSignPaths} />
              <Text style={styles.greyText}>
                Name :   <Text style={styles.darkText}>{preview.customerName || 'NA'}</Text>
              </Text>
              <Text style={styles.greyText}>
                Mobile No.  <Text style={styles.mobileText}>
                  {preview.customerNumber ? `+${countryCode} ${preview.customerNumber}` : 'NA'}
                </Text>
              </Text>
              <View style={styles.ratingRow}>
                <StarsReadOnly value={preview.rating} />
                <Text style={styles.ratingText}>{preview.rating.toFixed(1)}</Text>
              </View>
              {!!preview.ratingRemark && <Text style={styles.greyText}>{preview.ratingRemark}</Text>}
            </View>
            <View style={styles.signCol}>
              <Text style={styles.signTitle}>Tech. Sign</Text>
              <SignaturePreview paths={preview.techSignPaths} />
                <Text style={styles.greyText}>
                  Name :   <Text style={styles.darkText}>{techName}</Text>
                </Text>
            </View>
          </View>

          {returnTo && (
            <Pressable
              style={[styles.editBtn, submitting && { opacity: 0.6 }]}
              onPress={() => navigation.navigate(returnTo.name, returnTo.params)}
              disabled={submitting}
            >
              <Text style={styles.editBtnText}>EDIT DETAILS</Text>
            </Pressable>
          )}

          <Pressable
            style={[styles.submitBtn,submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>SUBMIT</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primary },
  card: {
    flex: 1,
    marginTop: vs(6),
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    overflow: 'hidden',
  },
  scrollContent: { padding: scale(20), paddingBottom: vs(40) },

  heading: { fontSize: sp(18), fontWeight: '700', color: '#1F2937', marginTop: vs(18), marginBottom: vs(6) },
  subLabel: { fontSize: sp(17), color: '#1F2937', marginTop: vs(10), marginBottom: vs(8) },
  workModeRow: { fontSize: sp(18), color: '#1F2937', marginTop: vs(26) },
  workModeValue: { color: COLORS.primary },

  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(10) },
  photoThumb: {
    width: scale(110),
    height: scale(110),
    borderRadius: scale(22),
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    backgroundColor: '#F3F4F6',
  },
  photoEmpty: { backgroundColor: '#fff' },

  greyText: { fontSize: sp(12), color: '#6B7280', lineHeight: sp(22) },
  darkText: { color: '#4B5563' },
  noteText: { fontSize: sp(16), color: '#4B5563', marginLeft: scale(16), marginBottom: vs(4) },
  categoryTitle: { fontSize: sp(15), fontWeight: '700', color: '#374151' },

  tableHead: { fontSize: sp(13), color: '#374151', fontWeight: '600' },
  tableNum: { flex: 1, textAlign: 'right' },
  itemRow: { flexDirection: 'row', marginBottom: vs(4) },

  deviceBlock: { marginLeft: scale(10), marginBottom: vs(10) },
  deviceImgRow: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(10), marginTop: vs(10) },
  deviceThumb: { width: scale(110), height: scale(110), borderRadius: scale(20), backgroundColor: '#F3F4F6' },

  signRow: { flexDirection: 'row', gap: scale(10), marginTop: vs(26) },
  signCol: { flex: 1 },
  signTitle: { fontSize: sp(18), fontWeight: '700', color: '#1F2937', marginBottom: vs(8) },
  mobileText: { color: COLORS.primary, textDecorationLine: 'underline', fontSize: sp(12) },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: scale(10), marginTop: vs(4) },
  ratingText: { fontSize: sp(13), color: COLORS.primary, fontWeight: '500' },

  signatureBox: { height: vs(100), backgroundColor: '#fff', overflow: 'hidden', marginBottom: vs(10) },
  signatureEmpty: { height: vs(60), alignItems: 'center', justifyContent: 'center' },
  signatureEmptyText: { color: '#9CA3AF', fontSize: sp(12) },

  editBtn: {
    height: vs(50),
    borderRadius: scale(26),
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(24),
  },
  editBtnText: { color: COLORS.primary, fontSize: sp(18), fontWeight: '500' },
  submitBtn: {
    height: vs(50),
    borderRadius: scale(26),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(12),
  },
  submitBtnText: { color: '#fff', fontSize: sp(18), fontWeight: '500' },
});
