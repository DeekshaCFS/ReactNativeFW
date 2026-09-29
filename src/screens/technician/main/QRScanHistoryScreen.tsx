// src/screens/technician/main/QRScanHistoryScreen.tsx
// Source: FieldWeb/QRCodeScanner/TechQRCodeScannerHistroy.java
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { request, check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Camera, CameraType } from 'react-native-camera-kit';
import { COLORS } from '../../../theme/theme';
import { ms, sp } from '../../../utils/responsive';
import { getQRScannedData, postQRScannedData } from '../../../api/taskList/taskListService';
import type { QRPostDataDTOField } from '../../../api/taskList/taskList.types';

// Java: MAX_SCAN_LIMIT = 15
const MAX_SCAN_LIMIT = 15;

interface QRField {
  name: string;
  value: string;
}

interface QRScan {
  no: number;
  fields: QRField[];
  rawText: string;
}

// Java parseQRCode(): each line "Key: Value" (or "Key:-Value") -> one field.
const parseQRText = (raw: string): QRField[] => {
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const idx = line.indexOf(':');
      if (idx === -1) return { name: line, value: '' };
      const name = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      if (value.startsWith('-')) value = value.slice(1).trim();
      return { name, value };
    });
};

async function requestCameraPermission(): Promise<boolean> {
  try {
    const permission = Platform.OS === 'android' ? PERMISSIONS.ANDROID.CAMERA : PERMISSIONS.IOS.CAMERA;
    const existing = await check(permission);
    if (existing === RESULTS.GRANTED) return true;
    const result = await request(permission);
    return result === RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export default function QRScanHistoryScreen({ route, navigation }: any) {
  const { task } = route.params ?? {};
  const taskId: number = task?.Id;

  const [scans, setScans] = useState<QRScan[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [posting, setPosting] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await getQRScannedData({ taskId });
        if (!active) return;
        const fields = response?.ResultData?.Fields ?? [];
        const grouped = new Map<number, QRField[]>();
        for (const field of fields) {
          const no = Number(String(field.QRcodeScanNo ?? '').replace('Scan', '').trim()) || 0;
          grouped.set(no, [
            ...(grouped.get(no) ?? []),
            { name: field.FieldName ?? '', value: field.FieldValue ?? '' },
          ]);
        }
        const previousScans = [...grouped.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([no, qFields]) => ({ no, fields: qFields, rawText: '' }));
        setScans(previousScans);
      } catch {
        // no prior scans, or request failed — start with an empty list like the Java fragment does
      } finally {
        if (active) setLoadingHistory(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [taskId]);

  const renumberScans = (list: QRScan[]): QRScan[] =>
    list.map((scan, index) => ({ ...scan, no: index + 1 }));

  const handleReadCode = (event: { nativeEvent: { codeStringValue: string } }) => {
    const value = event?.nativeEvent?.codeStringValue;
    if (!value) return;
    setScannerOpen(false);

    setScans(prev => {
      if (prev.length >= MAX_SCAN_LIMIT) {
        Alert.alert('Limit reached', `You can scan a maximum of ${MAX_SCAN_LIMIT} QR codes.`);
        return prev;
      }
      const next: QRScan = { no: prev.length + 1, fields: parseQRText(value), rawText: value };
      return [...prev, next];
    });
  };

  const openScanner = async () => {
    if (scans.length >= MAX_SCAN_LIMIT) {
      Alert.alert('Limit reached', `You can scan a maximum of ${MAX_SCAN_LIMIT} QR codes.`);
      return;
    }
    const granted = await requestCameraPermission();
    if (!granted) {
      Alert.alert('Camera permission needed', 'Please allow camera access to scan QR codes.');
      return;
    }
    setScannerOpen(true);
  };

  const removeScan = (no: number) => {
    setScans(prev => renumberScans(prev.filter(scan => scan.no !== no)));
  };

  const handlePost = async () => {
    if (scans.length === 0) {
      Alert.alert('Nothing to post', 'Scan at least one QR code first.');
      return;
    }
    setPosting(true);
    try {
      const uid = await AsyncStorage.getItem('uid');
      const userId = Number(uid) || 0;

      const fields: QRPostDataDTOField[] = scans.flatMap(scan =>
        scan.fields.map(field => ({
          QRcodeScanNo: scan.no,
          FieldName: field.name,
          FieldValue: field.value,
        })),
      );
      const qrCodeText = scans.map(scan => scan.rawText).filter(Boolean).join('\n\n');

      const response = await postQRScannedData({
        TaskId: taskId,
        ScanBy: userId,
        CreatedBy: userId,
        QRCodeText: qrCodeText,
        Fields: fields,
      });

      Alert.alert(response?.Message || 'Success', undefined, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Could not post scanned data. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const canScanMore = useMemo(() => scans.length < MAX_SCAN_LIMIT, [scans.length]);

  return (
    <View style={styles.root}>
      {loadingHistory ? (
        <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {scans.length === 0 && (
            <Text style={styles.emptyText}>No QR codes scanned yet for this task.</Text>
          )}

          {scans.map(scan => (
            <View key={scan.no} style={styles.scanCard}>
              <View style={styles.scanCardHeader}>
                <Text style={styles.scanCardTitle}>Scan #{scan.no}</Text>
                <Pressable onPress={() => removeScan(scan.no)} hitSlop={8}>
                  <Ionicons name="close-circle" size={sp(22)} color="#c0392b" />
                </Pressable>
              </View>
              {scan.fields.length === 0 ? (
                <Text style={styles.fieldRow}>(no readable fields in this code)</Text>
              ) : (
                scan.fields.map((field, idx) => (
                  <Text key={idx} style={styles.fieldRow}>
                    <Text style={styles.fieldName}>{field.name}: </Text>
                    {field.value}
                  </Text>
                ))
              )}
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Pressable
          style={[styles.scanButton, !canScanMore && styles.buttonDisabled]}
          onPress={openScanner}
          disabled={!canScanMore}
        >
          <Ionicons name="qr-code-outline" size={sp(20)} color="#fff" />
          <Text style={styles.scanButtonText}>Scan QR Code</Text>
        </Pressable>
        <Pressable
          style={[styles.postButton, (posting || scans.length === 0) && styles.buttonDisabled]}
          onPress={handlePost}
          disabled={posting || scans.length === 0}
        >
          {posting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </Pressable>
      </View>

      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View style={styles.cameraRoot}>
          {scannerOpen && (
            <Camera
              style={StyleSheet.absoluteFill}
              cameraType={CameraType.Back}
              scanBarcode
              allowedBarcodeTypes={['qr']}
              onReadCode={handleReadCode}
              showFrame
              laserColor="#00ff00"
              frameColor="#ffffff"
            />
          )}
          <Pressable style={styles.cameraClose} onPress={() => setScannerOpen(false)}>
            <Ionicons name="close" size={sp(28)} color="#fff" />
          </Pressable>
          <View style={styles.cameraHint}>
            <Text style={styles.cameraHintText}>Align the QR code within the frame</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  loader: { flex: 1 },
  content: { padding: ms(16), paddingBottom: ms(100) },
  emptyText: { textAlign: 'center', color: '#777', marginTop: ms(40), fontSize: sp(14) },
  scanCard: {
    backgroundColor: '#fff',
    borderRadius: ms(12),
    padding: ms(14),
    marginBottom: ms(12),
    elevation: 1,
  },
  scanCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(8),
  },
  scanCardTitle: { fontSize: sp(15), fontWeight: '700', color: '#222' },
  fieldRow: { fontSize: sp(13), color: '#444', marginBottom: ms(4) },
  fieldName: { fontWeight: '600', color: '#222' },
  footer: {
    flexDirection: 'row',
    padding: ms(14),
    gap: ms(12),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: ms(10),
    paddingVertical: ms(12),
    gap: ms(8),
  },
  scanButtonText: { color: '#fff', fontSize: sp(14), fontWeight: '600' },
  postButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2e7d32',
    borderRadius: ms(10),
    paddingVertical: ms(12),
  },
  postButtonText: { color: '#fff', fontSize: sp(14), fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
  cameraRoot: { flex: 1, backgroundColor: '#000' },
  cameraClose: { position: 'absolute', top: ms(48), right: ms(20), zIndex: 1 },
  cameraHint: { position: 'absolute', bottom: ms(60), alignSelf: 'center' },
  cameraHintText: { color: '#fff', fontSize: sp(13) },
});
