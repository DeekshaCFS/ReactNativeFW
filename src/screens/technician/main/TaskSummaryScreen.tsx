// src/screens/technician/main/TaskSummaryScreen.tsx
import React, { useState } from 'react';
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
import { scale, vs, sp, HEADER_TOP_PADDING } from '../../../utils/responsive';
import { addTaskClosure } from '../../../api/task/taskService';
import type { TasksListResultData as Task, TaskClosureResultData as TaskClosurePayload } from '../../../api/task/task.types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SignaturePath {
  points: { x: number; y: number }[];
}

interface SummaryPreview {
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

function SummaryRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || value === 0 ? String(value) : '—'}</Text>
    </View>
  );
}

export default function TaskSummaryScreen({ navigation, route }: any) {
  const { task, elapsedSeconds = 0, payload, preview } = route.params as {
    task: Task;
    elapsedSeconds?: number;
    payload: TaskClosurePayload;
    preview: SummaryPreview;
  };

  const [submitting, setSubmitting] = useState(false);

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

      const isRateMode = task.PaymentMode === 'Rate' && task.PaymentModeId === 2;

      if (isRateMode) {
        navigation.navigate('PaymentReceived', { task, elapsedSeconds });
        return;
      }

      Alert.alert('Task Completed', 'The task has been closed successfully.', [
        {
          text: 'OK',
          onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to close task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Text style={styles.screenTitle}>Review Task Summary</Text>
        <Text style={styles.screenSubtitle}>
          Confirm everything below before submitting — this is your last chance to go back and edit.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Work Details</Text>
          <SummaryRow label="Work Mode" value={preview.workModeType} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Signed By</Text>
          <SummaryRow label="Customer Name" value={preview.customerName} />
          <SummaryRow label="Mobile Number" value={preview.customerNumber} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rating</Text>
          <View style={[styles.row, { alignItems: 'center' }]}>
            <Text style={styles.rowLabel}>Customer Rating</Text>
            <StarsReadOnly value={preview.rating} />
          </View>
          {!!preview.ratingRemark && (
            <Text style={styles.remarkText}>{preview.ratingRemark}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Signature</Text>
          <SignaturePreview paths={preview.customerSignPaths} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Technician Signature</Text>
          <SignaturePreview paths={preview.techSignPaths} />
        </View>

        {(preview.fieldPhotoUris.length > 0 || preview.customerPhotoUri || preview.techPhotoUri) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Photos</Text>
            <View style={styles.photoRow}>
              {preview.fieldPhotoUris.map((uri, i) => (
                <Image key={`field-${i}`} source={{ uri }} style={styles.photoThumb} />
              ))}
              {!!preview.customerPhotoUri && (
                <Image source={{ uri: preview.customerPhotoUri }} style={styles.photoThumb} />
              )}
              {!!preview.techPhotoUri && (
                <Image source={{ uri: preview.techPhotoUri }} style={styles.photoThumb} />
              )}
            </View>
          </View>
        )}

        <Pressable
          style={styles.editLink}
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Ionicons name="create-outline" size={sp(16)} color={COLORS.primary} />
          <Text style={styles.editLinkText}>Edit Details</Text>
        </Pressable>

        <Pressable
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
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
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: scale(16), paddingBottom: vs(40), gap: vs(14) },

  screenTitle: { fontSize: sp(20), fontWeight: '700', color: '#111827' },
  screenSubtitle: { fontSize: sp(13), color: '#6B7280', marginBottom: vs(4) },

  card: {
    backgroundColor: '#fff',
    borderRadius: scale(14),
    padding: scale(16),
    gap: vs(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontSize: sp(15), fontWeight: '700', color: '#111827' },

  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: sp(13), color: '#6B7280' },
  rowValue: { fontSize: sp(13), color: '#111827', fontWeight: '600', flexShrink: 1, textAlign: 'right' },

  remarkText: { fontSize: sp(13), color: '#374151', fontStyle: 'italic' },

  signatureBox: {
    height: vs(110),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  signatureEmpty: {
    height: vs(60),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureEmptyText: { color: '#9CA3AF', fontSize: sp(12) },

  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(10) },
  photoThumb: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(10),
    backgroundColor: '#F3F4F6',
  },

  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    paddingVertical: vs(8),
  },
  editLinkText: { color: COLORS.primary, fontSize: sp(14), fontWeight: '600' },

  submitBtn: {
    height: vs(50),
    borderRadius: scale(26),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(6),
  },
  submitBtnText: { color: '#fff', fontSize: sp(16), fontWeight: '700', letterSpacing: 0.5 },
});