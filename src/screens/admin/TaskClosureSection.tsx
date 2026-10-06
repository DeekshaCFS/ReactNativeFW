// src/screens/admin/TaskClosureSection.tsx
//
// Lower half of Java's TaskDetailsFragmentNew (dialog_task_details.xml): the
// "Warranty Details" block followed by include layout_task_closure_new.
// Completed tasks load Tasklist/GetTaskClosureList; Rejected tasks load
// TaskList/GetTaskClosureList-1 (setTaskClosureToView / setRejectedTaskClosureToView).
// Also owns the three popups that screen opens: the CHK POINT / INPUT FORM data,
// the posted task documents ("View Document") and the QR-scan history.
import React, {forwardRef, useEffect, useImperativeHandle, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Modal from '../../components/AppModal';
import {
  getQRScannedData,
  getRejectedTaskDetails,
  getTaskClosureDetails,
  getTaskDoc,
} from '../../api/taskList/taskListService';
import {getAllChkpointInputformData} from '../../api/fsrManagement/fsrManagementService';
import {formatAmount} from '../../utils/decimal';
import {ms, sp, vs} from '../../utils/responsive';

type AnyRecord = Record<string, unknown>;

export type TaskClosureSectionHandle = {
  openDocuments: () => void;
  openQrHistory: () => void;
};

type Props = {
  ownerId: number;
  taskId: number;
  taskName: string;
  newTaskId: string;
  customerId: number;
  isRejected: boolean;
  /** Task-list PaymentMode ("Rate" shows the Payment Details block). */
  paymentMode: string;
  earningAmount: number;
  assignedTo: string;
  /** Called once closure data loads (Java only shows Earned Amount after that). */
  onClosureLoaded?: (loaded: boolean) => void;
  /** Java shows the QR icon only when at least one scan exists. */
  onQrAvailable?: (available: boolean) => void;
};

const NA = 'NA';
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v)).trim();
const arr = (v: unknown) => (Array.isArray(v) ? (v as AnyRecord[]) : []);
const rec = (v: unknown) => (v && typeof v === 'object' ? (v as AnyRecord) : {});

// DateUtils.getStringDate(..., "dd/MM/YYYY")
const toDdMmYyyy = (raw: unknown) => {
  const [y, m, d] = str(raw).split('T')[0].split('-');
  return y && m && d ? `${d}/${m}/${y}` : '';
};

const TaskClosureSection = forwardRef<TaskClosureSectionHandle, Props>(
  (
    {
      ownerId,
      taskId,
      taskName,
      newTaskId,
      customerId,
      isRejected,
      paymentMode,
      earningAmount,
      assignedTo,
      onClosureLoaded,
      onQrAvailable,
    },
    ref,
  ) => {
    const [closure, setClosure] = useState<AnyRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [chkPoint, setChkPoint] = useState<AnyRecord | null>(null);
    const [chkPointOpen, setChkPointOpen] = useState(false);
    const [docs, setDocs] = useState<AnyRecord[] | null>(null);
    const [qrScans, setQrScans] = useState<{no: number; fields: {name: string; value: string}[]}[]>([]);
    const [qrOpen, setQrOpen] = useState(false);

    useEffect(() => {
      let active = true;
      setLoading(true);
      const params = {UserId: ownerId, TaskID: taskId};
      (isRejected ? getRejectedTaskDetails(params) : getTaskClosureDetails(params))
        .then(response => {
          if (!active) {
            return;
          }
          const ok =
            response?.Code === '200' && String(response?.Message ?? '').toLowerCase() === 'success';
          const data = isRejected
            ? arr((response as AnyRecord)?.ResultData)[0] ?? null
            : ((response?.ResultData as AnyRecord | undefined) ?? null);
          setClosure(ok ? data : null);
          onClosureLoaded?.(ok && !!data);
        })
        .catch(() => active && setClosure(null))
        .finally(() => active && setLoading(false));

      getAllChkpointInputformData({UserId: ownerId, TaskId: taskId})
        .then(response => active && setChkPoint(rec(response?.ResultData)))
        .catch(() => {});

      getQRScannedData({taskId})
        .then(response => {
          if (!active) {
            return;
          }
          const grouped = new Map<number, {name: string; value: string}[]>();
          for (const field of response?.ResultData?.Fields ?? []) {
            const no = Number(str(field.QRcodeScanNo).replace('Scan', '').trim()) || 0;
            grouped.set(no, [...(grouped.get(no) ?? []), {name: str(field.FieldName), value: str(field.FieldValue)}]);
          }
          const scans = [...grouped.entries()].sort((a, b) => a[0] - b[0]).map(([no, fields]) => ({no, fields}));
          setQrScans(scans);
          onQrAvailable?.(scans.length > 0);
        })
        .catch(() => onQrAvailable?.(false));
      return () => {
        active = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ownerId, taskId, isRejected]);

    const openDocuments = async () => {
      try {
        const response = await getTaskDoc({userId: ownerId, taskId, customerId});
        const result = rec(response?.ResultData);
        const files = arr(result.Files).length ? arr(result.Files) : result.FilePath ? [result] : [];
        if (!files.length) {
          Alert.alert('', 'You have no attachment!');
          return;
        }
        setDocs(files);
      } catch {
        Alert.alert('', 'You have no attachment!');
      }
    };

    useImperativeHandle(ref, () => ({
      openDocuments,
      openQrHistory: () => setQrOpen(true),
    }));

    if (loading) {
      return <ActivityIndicator style={styles.loader} color="#c3002f" />;
    }
    if (!closure) {
      // Java hides mTaskClosureWrapper / mLinearLayoutRatingWrapper when there's no closure.
      return null;
    }

    const pre = rec(closure.PreDeviceInfoDto);
    const newBefore = arr(pre.Images).map(i => str(i.FilePath)).filter(Boolean);
    const newAfter = arr(closure.AfterImages).map(i => str(i.FilePath)).filter(Boolean);
    const useNewPhotos = newBefore.length > 0 || newAfter.length > 0;
    const beforePhotos = useNewPhotos
      ? newBefore
      : [pre.DeviceInfoImagePath, pre.DeviceInfoImagePath1, pre.DeviceInfoImagePath2].map(str).filter(Boolean);
    const afterPhotos = useNewPhotos
      ? newAfter
      : [closure.FieldPhoto, closure.FieldPhoto1, closure.FieldPhoto2].map(str).filter(Boolean);
    const notes = arr(closure.TechnicalNotedto);
    const devices = arr(closure.DeviceInfoList);
    const warranty = closure.TaskWarrantyDetailsModelDtocls
      ? rec(closure.TaskWarrantyDetailsModelDtocls)
      : null;
    const excess = arr(closure.Task_Excess_Amount_Dtls);
    const isRate = paymentMode.toLowerCase() === 'rate';
    const grandTotal =
      earningAmount !== 0 ? excess.reduce((sum, e) => sum + (Number(e.Excess_Amount) || 0), 0) : earningAmount;
    const mobileNo = Number(closure.MobileNo) || 0;
    const rating = Number(closure.RatingBar) || 0;
    const fsr = arr(chkPoint?.lstFSRManagement)[0];
    const inputText = arr(chkPoint?.lstInputText)[0];
    const chkPointLabel = str(inputText?.Name) || str(fsr?.FSRName) || 'CHK POINT / INPUT FORM';

    const photoRow = (label: string, photos: string[]) => (
      <View style={styles.photoBlock}>
        <Text style={styles.subLabel}>{label}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {photos.length ? (
            photos.map(uri => <Image key={uri} source={{uri}} style={styles.photo} />)
          ) : (
            <Text style={styles.value}>{NA}</Text>
          )}
        </ScrollView>
      </View>
    );

    return (
      <View>
        {warranty ? (
          <>
            <Text style={styles.heading}>Warranty Details</Text>
            {(
              [
                ['Warranty Type', str(warranty.WarrantyTypeName)],
                ['Start Date', toDdMmYyyy(warranty.StartDate)],
                ['End Date', toDdMmYyyy(warranty.EndDate)],
                ['Brand Name', str(warranty.BrandName)],
                ['Model Name', str(warranty.ModelName)],
                ['Serial No', str(warranty.SerialNoName)],
              ] as const
            ).map(([label, value]) => (
              <View key={label} style={styles.row}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value || '-NA-'}</Text>
              </View>
            ))}
          </>
        ) : null}

        <Text style={styles.heading}>Field Photo</Text>
        {photoRow('Before', beforePhotos)}
        {photoRow('After', afterPhotos)}

        <View style={styles.row}>
          <Text style={styles.label}>Work Mode</Text>
          <Text style={styles.value}>: {str(closure.WorkModeType) || NA}</Text>
        </View>

        {notes.length ? (
          <>
            <Text style={styles.heading}>Technical Notes</Text>
            {notes.map((note, i) => (
              <Text key={i} style={styles.listText}>
                {i + 1}. {str(note.TechnicalNote1)}
              </Text>
            ))}
          </>
        ) : null}

        {devices.length ? (
          <>
            <Text style={styles.heading}>Device List</Text>
            {devices.map((device, i) => (
              <View key={i} style={styles.deviceCard}>
                <Text style={styles.listText}>{str(device.DeviceName)}</Text>
                <Text style={styles.subText}>{str(device.ModelNumber)}</Text>
                <Text style={styles.subText}>{str(device.DeviceReading)}</Text>
                <View style={styles.devicePhotos}>
                  {[device.DevicePhoto1, device.DevicePhoto2, device.DevicePhoto3]
                    .map(str)
                    .filter(Boolean)
                    .map(uri => (
                      <Image key={uri} source={{uri}} style={styles.devicePhoto} />
                    ))}
                </View>
              </View>
            ))}
          </>
        ) : null}

        {str(closure.DocPath) ? (
          <View style={styles.row}>
            <Text style={styles.label}>Attachment : </Text>
            <Text style={styles.link} onPress={() => Linking.openURL(str(closure.DocPath)).catch(() => {})}>
              View Task Attachment
            </Text>
          </View>
        ) : null}

        <View style={styles.signRow}>
          <View style={styles.signCol}>
            <Text style={styles.subLabel}>Cust. Sign</Text>
            {str(closure.CustomerSignatureImage) ? (
              <Image source={{uri: str(closure.CustomerSignatureImage)}} style={styles.sign} resizeMode="contain" />
            ) : (
              <View style={styles.sign} />
            )}
            <Text style={styles.subText}>Name : {str(closure.SignedBy) || NA}</Text>
          </View>
          <View style={styles.signCol}>
            <Text style={styles.subLabel}>Tech. Sign</Text>
            {str(closure.TechSignatureImage) ? (
              <>
                <Image source={{uri: str(closure.TechSignatureImage)}} style={styles.sign} resizeMode="contain" />
                <Text style={styles.subText}>Name : {assignedTo || NA}</Text>
              </>
            ) : (
              <View style={styles.sign} />
            )}
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Mobile No.</Text>
          <Text style={styles.value}>{mobileNo ? String(mobileNo) : NA}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Rating</Text>
          <Text style={styles.value}>
            {'★'.repeat(Math.round(rating))}
            {'☆'.repeat(Math.max(0, 5 - Math.round(rating)))} {rating.toFixed(1)}
          </Text>
        </View>

        {chkPoint && (fsr || inputText) ? (
          <Pressable onPress={() => setChkPointOpen(true)}>
            <Text style={styles.link}>{chkPointLabel}</Text>
          </Pressable>
        ) : null}

        {isRate ? (
          <>
            <Text style={styles.heading}>Payment Details</Text>
            <View style={styles.tableHead}>
              <Text style={[styles.cellSr, styles.bold]}>Sr.No </Text>
              <Text style={[styles.cellDesc, styles.bold]}>Description</Text>
              <Text style={[styles.cellAmt, styles.bold]}>Amount</Text>
            </View>
            {excess.map((e, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.cellSr}>{i + 1}.</Text>
                <Text style={styles.cellDesc}>{str(e.Excess_Amount_Des)}</Text>
                <Text style={styles.cellAmt}>Rs. {formatAmount(e.Excess_Amount)}</Text>
              </View>
            ))}
            <View style={styles.tableRow}>
              <Text style={[styles.cellDesc, styles.bold]}>Grand Total :</Text>
              <Text style={[styles.cellAmt, styles.bold]}>Rs. {formatAmount(grandTotal)}</Text>
            </View>
          </>
        ) : null}

        {/* CHK POINT / INPUT FORM data */}
        <Modal visible={chkPointOpen} transparent animationType="fade" onRequestClose={() => setChkPointOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setChkPointOpen(false)}>
            <Pressable style={styles.dialog}>
              <Text style={styles.dialogTitle}>{chkPointLabel}</Text>
              <ScrollView>
                {arr(fsr?.lstFSRCategories).map((cat, ci) => (
                  <View key={`c${ci}`}>
                    <Text style={styles.bold}>{str(cat.CategoryName)}</Text>
                    {arr(cat.lstCheckpointDTo).map((cp, pi) => (
                      <View key={pi} style={styles.row}>
                        <Text style={styles.label}>{str(cp.CheckpointName)}</Text>
                        <Text style={styles.value}>
                          {str(rec(cp.SelectedCheckpointStatus).CheckpointStatusName) || NA}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
                {arr(inputText?.lstInputTextCategoryDtos).map((field, fi) => (
                  <View key={`i${fi}`} style={styles.row}>
                    <Text style={styles.label}>{str(field.Name)}</Text>
                    <Text style={styles.value}>{str(field.Description) || NA}</Text>
                  </View>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Posted task documents (viewAttachmentPopup) */}
        <Modal visible={docs !== null} transparent animationType="fade" onRequestClose={() => setDocs(null)}>
          <Pressable style={styles.backdrop} onPress={() => setDocs(null)}>
            <Pressable style={styles.dialog}>
              <Text style={styles.dialogTitle}>{taskName}</Text>
              {(docs ?? []).map((file, i) => (
                <Text
                  key={i}
                  style={[styles.link, styles.docRow]}
                  onPress={() => Linking.openURL(str(file.FilePath)).catch(() => {})}>
                  {str(file.OriginalFileName) || str(file.ConvertedFileName) || `Document ${i + 1}`}
                </Text>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        {/* QR Code Scanned Details */}
        <Modal visible={qrOpen} transparent animationType="fade" onRequestClose={() => setQrOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setQrOpen(false)}>
            <Pressable style={styles.dialog}>
              <Text style={styles.dialogTitle}>QR Code Scanned Details</Text>
              <Text style={styles.subText}>
                {taskName} / {newTaskId}
              </Text>
              <ScrollView>
                {qrScans.map(scan => (
                  <View key={scan.no} style={styles.qrScan}>
                    <Text style={styles.bold}>Scan {scan.no}</Text>
                    {scan.fields.map((f, i) => (
                      <View key={i} style={styles.row}>
                        <Text style={styles.label}>{f.name}</Text>
                        <Text style={styles.value}>{f.value}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  loader: {marginVertical: vs(16)},
  heading: {fontSize: sp(14), fontWeight: '700', color: '#20283A', marginTop: vs(16), marginBottom: vs(6)},
  row: {flexDirection: 'row', paddingVertical: vs(5)},
  label: {flex: 1, fontSize: sp(13), color: '#5f6368'},
  value: {flex: 1.3, fontSize: sp(13), color: '#20283A'},
  subLabel: {fontSize: sp(12), color: '#5f6368', marginBottom: vs(4)},
  subText: {fontSize: sp(12), color: '#5f6368'},
  listText: {fontSize: sp(13), color: '#20283A', paddingVertical: vs(2)},
  photoBlock: {marginBottom: vs(8)},
  photo: {width: ms(76), height: ms(76), borderRadius: ms(8), marginRight: ms(8), backgroundColor: '#f1f3f4'},
  deviceCard: {borderWidth: 1, borderColor: '#eceff1', borderRadius: ms(8), padding: ms(8), marginBottom: vs(6)},
  devicePhotos: {flexDirection: 'row', gap: ms(6), marginTop: vs(4)},
  devicePhoto: {width: ms(56), height: ms(56), borderRadius: ms(10), backgroundColor: '#f1f3f4'},
  link: {fontSize: sp(13), color: '#1a73e8', textDecorationLine: 'underline', marginVertical: vs(6)},
  signRow: {flexDirection: 'row', gap: ms(12), marginTop: vs(12)},
  signCol: {flex: 1},
  sign: {height: vs(70), borderWidth: 1, borderColor: '#eceff1', borderRadius: ms(6), marginBottom: vs(4)},
  tableHead: {flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#dadce0', paddingVertical: vs(4)},
  tableRow: {flexDirection: 'row', paddingVertical: vs(4)},
  cellSr: {width: ms(48), fontSize: sp(13), color: '#20283A'},
  cellDesc: {flex: 1, fontSize: sp(13), color: '#20283A'},
  cellAmt: {width: ms(110), fontSize: sp(13), color: '#20283A', textAlign: 'right'},
  bold: {fontWeight: '700', color: '#20283A'},
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: ms(20)},
  dialog: {backgroundColor: '#fff', borderRadius: ms(12), padding: ms(16), maxHeight: '80%'},
  dialogTitle: {fontSize: sp(15), fontWeight: '700', color: '#20283A', marginBottom: vs(8)},
  docRow: {paddingVertical: vs(4)},
  qrScan: {marginTop: vs(8)},
});

export default TaskClosureSection;
