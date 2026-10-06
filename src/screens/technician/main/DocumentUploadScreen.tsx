// src/screens/technician/main/DocumentUploadScreen.tsx
//
// Port of Java's Document/DocumentUploadFragment. Shown after a task is closed (for a
// non-Rate, non-HNG task, or after payment) so the technician can attach completion
// documents: PDFs or images, each tagged with a document type, at most 10 files and 5 MB
// in total. Presented as a sheet over the tab bar (Java swaps it in under the app
// header, above the bottom navigation). Skip / close return to the dashboard; Upload
// posts TaskList/UploadPostTaskDocs.
//
// Two modes, like the Java segmented control:
//   Attach  - pick PDF / image files from storage.
//   Capture - up to 5 photos (camera or gallery), each with its own document type.

import { launchCameraWithPermission } from '../../../utils/cameraPermission';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import Modal from '../../../components/AppModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp, ms } from '../../../utils/responsive';
import { HEADER_CONTENT_HEIGHT } from '../../../components/AppHeader';
import { getDocumentTypes, uploadTaskDoc } from '../../../api/taskList/taskListService';
import type { DocAttachmentType } from '../../../api/taskList/taskList.types';
import type { TasksListResultData as Task } from '../../../api/task/task.types';
import { finishTaskFlowToHome } from '../../../navigation/taskFlowNavigation';

// Java: DocumentUploadFragment limits.
const MAX_TOTAL_MB = 5;
const MAX_FILES = 10;
const MAX_CAPTURE_SLOTS = 5;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const GREEN = '#4CAF50';
const SKIP_GREY = '#9CA3B0';

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

type Mode = 'attach' | 'capture';

const base64Bytes = (b64: string) => Math.floor((b64.length * 3) / 4);
const toMB = (bytes: number) => bytes / (1024 * 1024);
const formatMB = (mb: number) => mb.toFixed(2);

export default function DocumentUploadScreen({ navigation, route }: any) {
  const { task } = route.params as { task: Task };
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>('attach');
  const [docTypes, setDocTypes] = useState<DocAttachmentType[]>([]);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [slots, setSlots] = useState<(SelectedFile | null)[]>(() =>
    Array.from({ length: MAX_CAPTURE_SLOTS }, () => null),
  );
  const [typePickerFor, setTypePickerFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const activeFiles = mode === 'attach' ? files : slots.filter((s): s is SelectedFile => !!s);
  const totalMB = activeFiles.reduce((sum, f) => sum + toMB(f.sizeBytes), 0);
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

  // Java: switching the segment clears whatever was picked in the other one.
  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setFiles([]);
    setSlots(Array.from({ length: MAX_CAPTURE_SLOTS }, () => null));
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

  const removeFile = (key: string) => setFiles(prev => prev.filter(f => f.key !== key));

  // ── Capture mode ──
  const captureIntoSlot = async (index: number, source: 'camera' | 'gallery') => {
    try {
      const options = { mediaType: 'photo' as const, includeBase64: true, quality: 0.7 as const };
      const result =
        source === 'camera'
          ? await launchCameraWithPermission(options)
          : await launchImageLibrary(options);
      const asset = result.assets?.[0];
      if (!asset?.uri || !asset.base64) return;

      const sizeBytes = base64Bytes(asset.base64);
      const others = slots.reduce(
        (sum, s, i) => (i !== index && s ? sum + toMB(s.sizeBytes) : sum),
        0,
      );
      if (toMB(sizeBytes) + others > MAX_TOTAL_MB) {
        Alert.alert(
          '',
          `Total size exceeded! You can upload only ${formatMB(Math.max(MAX_TOTAL_MB - others, 0))} MB more.`,
        );
        return;
      }

      const d = new Date();
      const p = (n: number) => String(n).padStart(2, '0');
      const name =
        `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_` +
        `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}_${index + 1}.jpg`;

      setSlots(prev => {
        const next = [...prev];
        next[index] = {
          key: `slot-${index}`,
          uri: asset.uri!,
          name,
          extension: 'jpg',
          base64: asset.base64!,
          sizeBytes,
          isImage: true,
          documentId: prev[index]?.documentId ?? 0,
          documentName: prev[index]?.documentName ?? '',
        };
        return next;
      });
    } catch {
      Alert.alert('Error', 'Could not load the photo');
    }
  };

  // Java: showImageSourceChooser() -> "Select Image Source" with Camera / Gallery.
  const pickSlotPhoto = (index: number) =>
    Alert.alert('Select Image Source', undefined, [
      { text: 'Camera', onPress: () => captureIntoSlot(index, 'camera') },
      { text: 'Gallery', onPress: () => captureIntoSlot(index, 'gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const setFileType = (key: string, type: DocAttachmentType) => {
    const apply = (f: SelectedFile): SelectedFile =>
      f.key === key
        ? { ...f, documentId: type.DocumentId ?? 0, documentName: type.DocumentName ?? '' }
        : f;
    setFiles(prev => prev.map(apply));
    setSlots(prev => prev.map(s => (s ? apply(s) : s)));
    setTypePickerFor(null);
  };

  const handleSave = async () => {
    if (activeFiles.length === 0) {
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
        Files: activeFiles.map(f => ({
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

  const TypeSelect = ({
    fileKey,
    name,
    disabled,
    width,
  }: {
    fileKey: string;
    name?: string;
    disabled?: boolean;
    width?: number;
  }) => (
    <Pressable
      style={[styles.typeBox, width ? { width } : null, disabled && { opacity: 0.4 }]}
      onPress={() => setTypePickerFor(fileKey)}
      disabled={disabled}
    >
      <Text style={styles.typeText} numberOfLines={1}>{name || 'Select Type'}</Text>
      <Ionicons name="caret-down" size={sp(12)} color="#6B7280" />
    </Pressable>
  );

  // The sheet sits between the app header and the bottom tab bar, which stay visible
  // behind this transparent screen (Java: fragment under the header, above the nav bar).
  const sheetTop = insets.top + HEADER_CONTENT_HEIGHT;
  const sheetBottom = ms(66) + Math.max(insets.bottom, ms(4)) + ms(6);

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={[styles.sheet, { top: sheetTop, bottom: sheetBottom }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Document Upload</Text>
          <Pressable style={styles.closeBtn} onPress={() => finishTaskFlowToHome(navigation)} hitSlop={8}>
            <Ionicons name="close" size={sp(20)} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.headerDivider} />

        {/* Attach / Capture segmented control */}
        <View style={styles.segmentRow}>
          <View style={styles.segment}>
            <Pressable
              style={[styles.segmentHalf, styles.segmentLeft, mode === 'attach' ? styles.attachOn : styles.attachOff]}
              onPress={() => switchMode('attach')}
            >
              <Text style={[styles.segmentText, mode === 'attach' && styles.segmentTextOn]}>Attach</Text>
            </Pressable>
            <Pressable
              style={[styles.segmentHalf, styles.segmentRight, mode === 'capture' ? styles.captureOn : styles.captureOff]}
              onPress={() => switchMode('capture')}
            >
              <Text style={[styles.segmentText, mode === 'capture' && styles.segmentTextOn]}>Capture</Text>
            </Pressable>
          </View>
        </View>

        {mode === 'attach' ? (
          <View style={styles.panelAttach}>
            <Text style={styles.panelText}>* Upload Attachment Here [Upto 5 MB Limit]</Text>
            <Pressable style={styles.attachBox} onPress={attachFiles}>
              <Ionicons name="share-outline" size={sp(24)} color={COLORS.primary} style={styles.attachIcon} />
              <Text style={styles.attachLabel}>Attachment</Text>
            </Pressable>

            <ScrollView
              style={{ marginTop: vs(15) }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {files.map(f => (
                <View key={f.key} style={styles.fileRow}>
                  {f.isImage ? (
                    <Image source={{ uri: f.uri }} style={styles.fileIcon} />
                  ) : (
                    <Ionicons name="document-text-outline" size={sp(32)} color={COLORS.primary} />
                  )}
                  <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
                  <TypeSelect fileKey={f.key} name={f.documentName} width={scale(110)} />
                  <Pressable onPress={() => removeFile(f.key)} hitSlop={8} style={styles.removeBtn}>
                    <Ionicons name="close" size={sp(18)} color="#374151" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.panelCapture}>
            <Text style={styles.panelText}>Click here to capture Images upto 5 if any !</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.slotRow}
            >
              {slots.map((slot, i) => (
                <View key={i} style={styles.slotCol}>
                  <Pressable style={styles.slotBox} onPress={() => pickSlotPhoto(i)}>
                    {slot ? (
                      <Image source={{ uri: slot.uri }} style={styles.slotImage} />
                    ) : (
                      <Ionicons name="camera-outline" size={sp(44)} color="#848891" />
                    )}
                  </Pressable>
                  <TypeSelect fileKey={`slot-${i}`} name={slot?.documentName} disabled={!slot} width={scale(120)} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.footer}>
          <Pressable style={[styles.footerBtn, styles.skipBtn]} onPress={() => finishTaskFlowToHome(navigation)} disabled={saving}>
            <Text style={styles.footerText}>SKIP</Text>
          </Pressable>
          <Pressable style={[styles.footerBtn, styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.footerText}>UPLOAD</Text>}
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
  root: { flex: 1, backgroundColor: 'transparent' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(30),
    borderTopRightRadius: scale(30),
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: vs(8),
    minHeight: vs(48),
  },
  headerTitle: { color: '#000', fontSize: sp(22), textAlign: 'center' },
  closeBtn: {
    position: 'absolute',
    right: scale(28),
    top: vs(10),
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDivider: { height: 1, backgroundColor: '#9CA3AF', marginHorizontal: scale(20), marginVertical: vs(8) },

  segmentRow: { alignItems: 'center', marginTop: vs(6) },
  segment: { flexDirection: 'row', width: scale(300), height: vs(44) },
  segmentHalf: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  segmentLeft: { borderTopLeftRadius: scale(35), borderBottomLeftRadius: scale(35) },
  segmentRight: { borderTopRightRadius: scale(35), borderBottomRightRadius: scale(35) },
  attachOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  attachOff: { backgroundColor: '#fff', borderColor: COLORS.primary },
  captureOn: { backgroundColor: GREEN, borderColor: GREEN },
  captureOff: { backgroundColor: '#fff', borderColor: GREEN },
  segmentText: { fontSize: sp(16), color: '#1d2536' },
  segmentTextOn: { color: '#fff' },

  panelAttach: {
    margin: scale(10),
    marginTop: vs(14),
    height: vs(320),
    borderRadius: scale(16),
    backgroundColor: '#fcfafb',
    paddingTop: vs(5),
    paddingHorizontal: scale(8),
  },
  panelCapture: {
    margin: scale(10),
    marginTop: vs(14),
    borderRadius: scale(16),
    backgroundColor: '#fcfafb',
    paddingVertical: vs(10),
  },
  panelText: { color: '#000', fontSize: sp(15), textAlign: 'center' },

  attachBox: {
    alignSelf: 'center',
    marginTop: vs(12),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9CA3AF',
    paddingVertical: vs(14),
    paddingHorizontal: scale(20),
  },
  attachIcon: { marginRight: scale(18) },
  attachLabel: { fontSize: sp(16), color: '#000' },

  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: scale(10),
    padding: scale(8),
    margin: scale(4),
  },
  fileIcon: { width: scale(40), height: scale(40), borderRadius: scale(6) },
  fileName: { flex: 1, fontSize: sp(14), color: '#000' },
  removeBtn: { padding: scale(4) },

  typeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scale(4),
    paddingVertical: vs(6),
    paddingHorizontal: scale(6),
    borderBottomWidth: 1,
    borderBottomColor: '#9CA3AF',
  },
  typeText: { flex: 1, fontSize: sp(14), color: '#374151' },

  slotRow: { padding: scale(10), gap: scale(10) },
  slotCol: { alignItems: 'center', marginRight: scale(10) },
  slotBox: {
    width: scale(100),
    height: scale(100),
    borderWidth: 1,
    borderColor: '#848484',
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: vs(6),
  },
  slotImage: { width: '100%', height: '100%' },

  footer: {
    flexDirection: 'row',
    margin: scale(10),
    marginTop: vs(20),
  },
  footerBtn: {
    flex: 1,
    marginHorizontal: scale(20),
    height: vs(52),
    borderRadius: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  skipBtn: { backgroundColor: SKIP_GREY },
  saveBtn: { backgroundColor: '#52B350' },
  footerText: { color: '#fff', fontSize: sp(20), fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: scale(24) },
  modalCard: { backgroundColor: '#fff', borderRadius: scale(16), padding: scale(16), maxHeight: '60%' },
  modalTitle: { fontSize: sp(18), marginBottom: vs(8), color: COLORS.textPrimary },
  typeRow: { paddingVertical: vs(12), borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  typeRowText: { fontSize: sp(16), color: COLORS.textPrimary },
  emptyTypes: { color: COLORS.textMuted, paddingVertical: vs(12) },
});
