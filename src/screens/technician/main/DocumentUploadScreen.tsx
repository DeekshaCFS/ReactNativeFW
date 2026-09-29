// src/screens/technician/main/DocumentUploadScreen.tsx
//
// Port of Java's Document/DocumentUploadFragment. Shown after a task is closed (for a
// non-Rate, non-HNG task) so the technician can attach completion documents: PDFs or
// images, each tagged with a document type, at most 10 files and 5 MB in total.
// Skip / close return to the dashboard; Save posts TaskList/UploadPostTaskDocs.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { pick, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { launchCamera } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp, hp, HEADER_TOP_PADDING } from '../../../utils/responsive';
import { getDocumentTypes, uploadTaskDoc } from '../../../api/taskList/taskListService';
import type { DocAttachmentType } from '../../../api/taskList/taskList.types';
import type { TasksListResultData as Task } from '../../../api/task/task.types';
import { finishTaskFlowToHome } from '../../../navigation/taskFlowNavigation';

// Java: DocumentUploadFragment limits.
const MAX_TOTAL_MB = 5;
const MAX_FILES = 10;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

interface SelectedFile {
  key: string;
  uri: string;
  name: string;         // full name incl. extension (Java: OriginalFileName)
  extension: string;    // lower-case, no dot (Java: FileExtension)
  base64: string;
  sizeBytes: number;
  isImage: boolean;
  documentId: number;
  documentName: string;
}

const base64Bytes = (b64: string) => Math.floor((b64.length * 3) / 4);
const toMB = (bytes: number) => bytes / (1024 * 1024);
const formatMB = (mb: number) => mb.toFixed(2);

export default function DocumentUploadScreen({ navigation, route }: any) {
  const { task } = route.params as { task: Task };

  const [docTypes, setDocTypes] = useState<DocAttachmentType[]>([]);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [typePickerFor, setTypePickerFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totalMB = files.reduce((sum, f) => sum + toMB(f.sizeBytes), 0);
  const remainingMB = MAX_TOTAL_MB - totalMB;

  // Java: getDocumentAttachmentType() -> TaskList/GetDocumentTypes on open.
  useEffect(() => {
    (async () => {
      try {
        const uid = await AsyncStorage.getItem('uid');
        const list = await getDocumentTypes({ userId: Number(uid) });
        setDocTypes(Array.isArray(list) ? list : []);
      } catch {
        // Non-fatal: files can still be uploaded without a document type.
      }
    })();
  }, []);

  // Java's validation, applied as each file is added.
  const addFile = (file: Omit<SelectedFile, 'key' | 'documentId' | 'documentName'>): boolean => {
    if (files.length >= MAX_FILES) {
      Alert.alert('', `You can upload only ${MAX_FILES} files`);
      return false;
    }
    const sizeMB = toMB(file.sizeBytes);
    if (sizeMB > MAX_TOTAL_MB) {
      Alert.alert('', `${file.name} is larger than ${MAX_TOTAL_MB} MB`);
      return false;
    }
    if (sizeMB > remainingMB) {
      Alert.alert('', `Not enough space. You can upload only ${formatMB(remainingMB)} MB more`);
      return false;
    }
    setFiles(prev => [
      ...prev,
      { ...file, key: `${Date.now()}_${Math.random()}`, documentId: 0, documentName: '' },
    ]);
    return true;
  };

  const attachFiles = async () => {
    try {
      const picked = await pick({ type: ALLOWED_MIME_TYPES, allowMultiSelection: true });
      let room = remainingMB;
      let count = files.length;

      for (const f of picked) {
        const name = f.name ?? 'document';
        const base64 = await RNFS.readFile(f.uri, 'base64');
        const sizeBytes = base64Bytes(base64);

        // Track running totals locally: state has not updated yet inside this loop.
        if (count >= MAX_FILES) {
          Alert.alert('', `You can upload only ${MAX_FILES} files`);
          break;
        }
        if (toMB(sizeBytes) > MAX_TOTAL_MB) {
          Alert.alert('', `${name} is larger than ${MAX_TOTAL_MB} MB`);
          continue;
        }
        if (toMB(sizeBytes) > room) {
          Alert.alert('', `Not enough space. You can upload only ${formatMB(room)} MB more`);
          continue;
        }

        room -= toMB(sizeBytes);
        count += 1;
        setFiles(prev => [
          ...prev,
          {
            key: `${Date.now()}_${Math.random()}`,
            uri: f.uri,
            name,
            extension: name.includes('.') ? name.split('.').pop()!.toLowerCase() : '',
            base64,
            sizeBytes,
            isImage: (f.type ?? '').startsWith('image/'),
            documentId: 0,
            documentName: '',
          },
        ]);
      }
    } catch (err: any) {
      if (!isErrorWithCode(err) || err.code !== errorCodes.OPERATION_CANCELED) {
        Alert.alert('Error', 'Error selecting file');
      }
    }
  };

  const takePhoto = async () => {
    try {
      const result = await launchCamera({ mediaType: 'photo', includeBase64: true, quality: 0.7 });
      const asset = result.assets?.[0];
      if (!asset?.uri || !asset.base64) return;

      const d = new Date();
      const p = (n: number) => String(n).padStart(2, '0');
      const name =
        `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_` +
        `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.jpg`;

      addFile({
        uri: asset.uri,
        name,
        extension: 'jpg',
        base64: asset.base64,
        sizeBytes: base64Bytes(asset.base64),
        isImage: true,
      });
    } catch {
      Alert.alert('Error', 'Could not open the camera');
    }
  };

  const removeFile = (key: string) => setFiles(prev => prev.filter(f => f.key !== key));

  const setFileType = (key: string, type: DocAttachmentType) => {
    setFiles(prev =>
      prev.map(f =>
        f.key === key
          ? { ...f, documentId: type.DocumentId ?? 0, documentName: type.DocumentName ?? '' }
          : f,
      ),
    );
    setTypePickerFor(null);
  };

  const handleSave = async () => {
    if (files.length === 0) {
      Alert.alert('', 'To upload : PDF or Image is compulsory !');
      return;
    }
    if (totalMB > MAX_TOTAL_MB) {
      Alert.alert('', 'Total file size cannot exceed 5 MB');
      return;
    }

    try {
      setSaving(true);
      const uid = await AsyncStorage.getItem('uid');

      const res = await uploadTaskDoc({
        UserId: Number(uid),
        TaskId: task.Id,
        CustomerId: task.CustomerDetailsid,
        Files: files.map(f => ({
          OriginalFileName: f.name,
          FileExtension: f.extension,
          Base64File: f.base64,
          DocumnetTypeId: f.documentId,
          DocumnetTypeName: f.documentName,
        })),
      });

      if (res?.Code && res.Code !== '200') {
        Alert.alert('Upload failed', res.Message || 'Could not upload the documents.');
        return;
      }

      Alert.alert('Success', res?.Message || 'Documents uploaded successfully.', [
        { text: 'OK', onPress: () => finishTaskFlowToHome(navigation) },
      ]);
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message || 'Could not upload the documents.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.redBg} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upload Documents</Text>
          <Pressable style={styles.closeBtn} onPress={() => finishTaskFlowToHome(navigation)} hitSlop={8}>
            <Ionicons name="close" size={sp(16)} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.headerDivider} />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.subtitle}>
            Attach completion documents (PDF or image). Up to {MAX_FILES} files, {MAX_TOTAL_MB} MB in total.
          </Text>

          <View style={styles.attachRow}>
            <Pressable style={styles.attachBtn} onPress={attachFiles}>
              <Ionicons name="document-attach-outline" size={sp(22)} color={COLORS.primary} />
              <Text style={styles.attachBtnText}>Attach File</Text>
            </Pressable>
            <Pressable style={styles.attachBtn} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={sp(22)} color={COLORS.primary} />
              <Text style={styles.attachBtnText}>Take Photo</Text>
            </Pressable>
          </View>

          <Text style={styles.remaining}>
            {files.length} file{files.length === 1 ? '' : 's'} · {formatMB(Math.max(remainingMB, 0))} MB remaining
          </Text>

          {files.map(f => (
            <View key={f.key} style={styles.fileCard}>
              <View style={styles.fileTop}>
                <Ionicons
                  name={f.isImage ? 'image-outline' : 'document-text-outline'}
                  size={sp(22)}
                  color={COLORS.primary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
                  <Text style={styles.fileSize}>{formatMB(toMB(f.sizeBytes))} MB</Text>
                </View>
                <Pressable onPress={() => removeFile(f.key)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={sp(20)} color={COLORS.primary} />
                </Pressable>
              </View>
              <Pressable style={styles.typeBox} onPress={() => setTypePickerFor(f.key)}>
                <Text style={[styles.typeText, !f.documentName && { color: '#a6a6a6' }]}>
                  {f.documentName || 'Select Type'}
                </Text>
                <Ionicons name="chevron-down" size={sp(18)} color="#000" />
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={[styles.footerBtn, styles.skipBtn]} onPress={() => finishTaskFlowToHome(navigation)} disabled={saving}>
            <Text style={styles.skipText}>SKIP</Text>
          </Pressable>
          <Pressable style={[styles.footerBtn, styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>UPLOAD</Text>}
          </Pressable>
        </View>
      </View>

      <Modal
        visible={typePickerFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTypePickerFor(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setTypePickerFor(null)}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Document Type</Text>
            {docTypes.length === 0 ? (
              <Text style={styles.emptyTypes}>No document types available.</Text>
            ) : (
              <FlatList
                data={docTypes}
                keyExtractor={(item, i) => String(item.DocumentId ?? i)}
                renderItem={({ item }) => (
                  <Pressable style={styles.typeRow} onPress={() => typePickerFor && setFileType(typePickerFor, item)}>
                    <Text style={styles.typeRowText}>{item.DocumentName}</Text>
                  </Pressable>
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primary },
  redBg: { height: HEADER_TOP_PADDING + hp(2), backgroundColor: COLORS.primary },
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: vs(10),
    paddingBottom: vs(14),
  },
  headerTitle: { color: '#000', fontSize: sp(24), fontWeight: '400' },
  closeBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDivider: { height: 2, backgroundColor: '#a6a6a6', marginHorizontal: scale(20) },
  content: { padding: scale(16), paddingBottom: vs(24) },
  subtitle: { fontSize: sp(14), color: COLORS.textMuted, marginBottom: vs(14) },
  attachRow: { flexDirection: 'row', gap: scale(12) },
  attachBtn: {
    flex: 1,
    height: vs(70),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(4),
  },
  attachBtnText: { fontSize: sp(14), color: COLORS.textPrimary },
  remaining: { marginTop: vs(12), marginBottom: vs(8), fontSize: sp(13), color: COLORS.textMuted },
  fileCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: scale(12),
    padding: scale(12),
    marginBottom: vs(10),
  },
  fileTop: { flexDirection: 'row', alignItems: 'center', gap: scale(10) },
  fileName: { fontSize: sp(15), color: COLORS.textPrimary },
  fileSize: { fontSize: sp(12), color: COLORS.textMuted },
  typeBox: {
    marginTop: vs(10),
    height: vs(42),
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: scale(21),
    paddingHorizontal: scale(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeText: { fontSize: sp(15), color: '#000' },
  footer: {
    flexDirection: 'row',
    gap: scale(12),
    paddingHorizontal: scale(16),
    paddingBottom: vs(16),
    paddingTop: vs(8),
  },
  footerBtn: { flex: 1, height: vs(50), borderRadius: scale(30), alignItems: 'center', justifyContent: 'center' },
  skipBtn: { backgroundColor: '#E5E7EB' },
  skipText: { color: '#6B7280', fontSize: sp(16), letterSpacing: 1.2 },
  saveBtn: { backgroundColor: '#2B2B2B' },
  saveText: { color: '#fff', fontSize: sp(16), letterSpacing: 1.2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: scale(24) },
  modalCard: { backgroundColor: '#fff', borderRadius: scale(16), padding: scale(16), maxHeight: '60%' },
  modalTitle: { fontSize: sp(18), marginBottom: vs(8), color: COLORS.textPrimary },
  typeRow: { paddingVertical: vs(12), borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  typeRowText: { fontSize: sp(16), color: COLORS.textPrimary },
  emptyTypes: { color: COLORS.textMuted, paddingVertical: vs(12) },
});
