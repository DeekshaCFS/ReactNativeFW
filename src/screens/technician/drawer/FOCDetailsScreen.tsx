// src/screens/technician/drawer/FOCDetailsScreen.tsx
//
// Android's FOCDetails_UpdateFragmnt (field-worker/technician branch, using
// FOC_TechItemListAdapter): shows the FOC request header plus each requested
// item's sub-card, lets the technician mark items received / flag issues
// locally, then posts everything in one "Update All" call -- no per-toggle
// network request. Matches update_foc_request_details_fragment.xml /
// adapter_tech_request_foc_details.xml.
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
  ActivityIndicator, Linking, TextInput, ToastAndroid,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../../../theme/theme';
import { ms, sp } from '../../../utils/responsive';
import {
  getDeleteFocRequestSubItem,
  postItemDetailsStatus,
} from '../../../api/focItemRequest/focItemRequestService';
import type {
  GetFOCListResultData,
  GetFOCListFOC_ItemList,
  FOC_UpdateItemRequestDTOFOC_Item_Request_Details,
} from '../../../api/focItemRequest/focItemRequest.types';
import { getCurrentUserId } from '../../../state/session';
import DeleteFocDialog from '../../../components/DeleteFocDialog';

const formatDate = (iso?: string): string => {
  if (!iso) return 'NA';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'NA';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
};

const RED = '#c3002f';
const GREEN = '#4CAF50';

interface ItemLocalState {
  itemReceived: boolean | null;
  anyIssue: boolean | null;
  describeIssue: string;
  locked: boolean;
  issueLocked: boolean;
}

// Java drawables: ic_delete_acc, ic_reset, intercom_icn_attachment
const DeleteIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Path fill="#c3002f" d="M19.45,68.24c0,-9.34 -0.01,-18.68 0,-28.02c0,-2.97 1.6,-4.99 4.25,-5.46c2.92,-0.51 5.66,1.63 5.88,4.61c0.03,0.43 0.02,0.87 0.02,1.31c0,18.25 0,36.49 0,54.74c0,6.07 4.13,10.2 10.21,10.2c13.46,0 26.91,0 40.37,0c6.08,0 10.22,-4.13 10.22,-10.2c0,-18.4 0,-36.81 0,-55.21c0,-2.85 1.53,-4.89 4.02,-5.4c2.87,-0.59 5.53,1.23 6.02,4.13c0.09,0.54 0.11,1.1 0.11,1.65c0.01,18.33 0.01,36.65 0,54.98c0,10.04 -6.72,18.12 -16.59,19.91c-1.16,0.21 -2.36,0.29 -3.54,0.29c-13.61,0.02 -27.23,0.02 -40.84,0.01c-11.31,-0.01 -20.11,-8.8 -20.13,-20.09C19.44,86.52 19.45,77.38 19.45,68.24z" />
    <Path fill="#c3002f" d="M80.24,19.45c1.33,0 2.47,0 3.61,0c5.46,0 10.92,-0.03 16.38,0.01c3.7,0.02 6.14,3.17 5.13,6.53c-0.6,1.99 -2.35,3.42 -4.42,3.59c-0.28,0.02 -0.55,0.02 -0.83,0.02c-26.74,0 -53.49,0 -80.23,0c-3.22,0 -5.51,-2.15 -5.48,-5.12c0.02,-2.91 2.29,-5.02 5.47,-5.03c6.09,-0.02 12.19,-0.01 18.28,-0.01c0.47,0 0.94,0 1.61,0c0,-0.5 0,-0.92 0,-1.33c0,-2.85 -0.02,-5.7 0.01,-8.55c0.03,-3.19 2.09,-5.3 5.28,-5.31c9.97,-0.03 19.94,-0.03 29.91,0c3.19,0.01 5.26,2.11 5.29,5.3C80.26,12.79 80.24,16.03 80.24,19.45zM49.92,19.34c6.76,0 13.45,0 20.13,0c0,-1.7 0,-3.29 0,-4.88c-6.76,0 -13.42,0 -20.13,0C49.92,16.13 49.92,17.73 49.92,19.34z" />
    <Path fill="#c3002f" d="M44.8,67.48c0,-5.89 -0.02,-11.79 0.01,-17.68c0.01,-2.48 1.75,-4.46 4.17,-4.93c2.19,-0.42 4.56,0.77 5.45,2.87c0.33,0.78 0.5,1.68 0.5,2.53c0.03,11.55 0.03,23.1 0.02,34.65c0,3.23 -2.18,5.5 -5.14,5.47c-2.91,-0.03 -5,-2.3 -5,-5.47C44.79,79.11 44.8,73.3 44.8,67.48z" />
    <Path fill="#c3002f" d="M75.2,67.63c0,5.89 0.02,11.79 -0.01,17.68c-0.01,2.39 -1.49,4.27 -3.74,4.9c-2.17,0.6 -4.54,-0.27 -5.61,-2.26c-0.47,-0.87 -0.76,-1.94 -0.76,-2.93c-0.05,-11.63 -0.05,-23.26 -0.02,-34.89c0.01,-3.13 2.23,-5.37 5.16,-5.32c2.87,0.04 4.97,2.3 4.98,5.38C75.21,56 75.2,61.81 75.2,67.63z" />
  </Svg>
);

const ResetIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill="#fff" d="M12,4L12,1L8,5l4,4L12,6c3.31,0 6,2.69 6,6 0,1.01 -0.25,1.97 -0.7,2.8l1.46,1.46C19.54,15.03 20,13.57 20,12c0,-4.42 -3.58,-8 -8,-8zM12,18c-3.31,0 -6,-2.69 -6,-6 0,-1.01 0.25,-1.97 0.7,-2.8L5.24,7.74C4.46,8.97 4,10.43 4,12c0,4.42 3.58,8 8,8v3l4,-4 -4,-4v3z" />
  </Svg>
);

const AttachIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill="#c3002f" d="M16.5,6v11.5c0,2.21 -1.79,4 -4,4s-4,-1.79 -4,-4V5c0,-1.38 1.12,-2.5 2.5,-2.5s2.5,1.12 2.5,2.5v10.5c0,0.55 -0.45,1 -1,1s-1,-0.45 -1,-1V6H10v9.5c0,1.38 1.12,2.5 2.5,2.5s2.5,-1.12 2.5,-2.5V5c0,-2.21 -1.79,-4 -4,-4S7,2.79 7,5v12.5c0,3.04 2.46,5.5 5.5,5.5s5.5,-2.46 5.5,-5.5V6h-1.5z" />
  </Svg>
);

// Java SegmentedGroup: NO (red) / Yes (green); NO is the default selection.
function YesNoSegment({ value, onChange, disabled, width }: {
  value: boolean | null; onChange: (v: boolean) => void; disabled?: boolean; width: number;
}) {
  const isYes = value === true;
  return (
    <View style={[styles.segment, { width }]}>
      <Pressable
        disabled={disabled}
        onPress={() => onChange(false)}
        style={[styles.segBtn, styles.segLeft, { borderColor: RED }, !isYes && { backgroundColor: RED }]}
      >
        <Text style={[styles.segText, !isYes && styles.segTextOn]}>NO</Text>
      </Pressable>
      <Pressable
        disabled={disabled}
        onPress={() => onChange(true)}
        style={[styles.segBtn, styles.segRight, { borderColor: GREEN }, isYes && { backgroundColor: GREEN }]}
      >
        <Text style={[styles.segText, isYes && styles.segTextOn]}>Yes</Text>
      </Pressable>
    </View>
  );
}

export default function FOCDetailsScreen({ navigation, route }: any) {
  const focRequest = route.params?.focRequest as GetFOCListResultData;

  const [items, setItems] = useState<GetFOCListFOC_ItemList[]>(focRequest?.FOC_ItemList ?? []);
  const [localState, setLocalState] = useState<Record<number, ItemLocalState>>(() => {
    const initial: Record<number, ItemLocalState> = {};
    (focRequest?.FOC_ItemList ?? []).forEach(it => {
      if (it.ItemRequestId == null) return;
      initial[it.ItemRequestId] = {
        itemReceived: it.IsItemRecieved ?? null,
        anyIssue: it.IsAnyIssue ?? null,
        describeIssue: it.FieldWorkerDescribeIssue ?? '',
        locked: !!it.IsItemRecieved,
        issueLocked: !!it.IsAnyIssue,
      };
    });
    return initial;
  });
  const [updating, setUpdating] = useState(false);

  const setItemState = (itemRequestId: number, patch: Partial<ItemLocalState>) => {
    setLocalState(prev => ({
      ...prev,
      [itemRequestId]: { ...prev[itemRequestId], ...patch },
    }));
  };

  // Java: FOCListAdapter's deleteReqItem (per sub-item) -> DeleteUsedItemsDialog
  // ("Do you want to delete this FOC?") -> FOCFragment.DeleteFOCReqSubItem ->
  // GET Delete_FOC_Request_Sub_Items?ItemRequestId=.
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const confirmDeleteItem = (itemRequestId?: number) => {
    if (!itemRequestId) return;
    setPendingDeleteId(itemRequestId);
  };

  const deleteItem = async () => {
    const itemRequestId = pendingDeleteId;
    setPendingDeleteId(null);
    if (itemRequestId == null) return;
    try {
      const res = await getDeleteFocRequestSubItem({ ItemRequestId: itemRequestId });
      if (res?.Code !== '200') {
        Alert.alert('Failed', res?.Message || 'Could not delete the item.');
        return;
      }
      if (res?.Message) ToastAndroid.show(res.Message, ToastAndroid.SHORT);
      setItems(prev => prev.filter(it => it.ItemRequestId !== itemRequestId));
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not delete the item.');
    }
  };

  const openAttachment = (url?: string) => {
    if (!url) {
      Alert.alert('No Attachment!!');
      return;
    }
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open the attachment.'));
  };

  // Java: "Update All" posts every locally-touched item in one
  // POST FOC_Request_Details_Update_Status (FOC_UpdateItemRequestDTO.ResultData).
  const handleUpdateAll = async () => {
    const userId = getCurrentUserId();
    const touched: FOC_UpdateItemRequestDTOFOC_Item_Request_Details[] = items
      .filter(it => it.ItemRequestId != null && localState[it.ItemRequestId]?.itemReceived != null)
      .map(it => {
        const st = localState[it.ItemRequestId!];
        return {
          ItemRequestId: it.ItemRequestId,
          FocRequestId: focRequest.FocRequestId,
          IsItemRecieved: !!st.itemReceived,
          IsAnyIssue: !!st.anyIssue,
          FieldWorkerDescribeIssue: st.describeIssue,
          UserId: userId,
        };
      });

    if (touched.length === 0) {
      Alert.alert('', 'Please provide an Item status to proceed !');
      return;
    }

    try {
      setUpdating(true);
      const res = await postItemDetailsStatus({
        CreatedBy: userId,
        FocRequestId: focRequest.FocRequestId,
        UserId: userId,
        IsAnyIssue: touched.some(t => t.IsAnyIssue),
        FOC_Item_Request_Details: touched,
      });
      if (res?.Code !== '200') {
        Alert.alert('Failed', res?.Message || 'Could not update items.');
        return;
      }
      Alert.alert('Success', res?.Message || 'Updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not update items.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Header: Update All + request details (update_foc_request_details_fragment.xml) */}
      <View style={styles.headerArea}>
        <Pressable
          style={[styles.updateAllBtn, updating && styles.updateAllBtnDisabled]}
          onPress={handleUpdateAll}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.updateAllText}>Update All</Text>
              <ResetIcon size={ms(24)} />
            </>
          )}
        </Pressable>

        <View style={styles.infoBlock}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Request Id:</Text>
            <Text style={styles.infoValue}>REQ{focRequest?.FocRequestId}</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: ms(8) }]}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={styles.infoValue}>{focRequest?.FOCStatusName || 'NA'}</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: ms(8) }]}>
            <Text style={styles.infoLabel}>Req. Date:</Text>
            <Text style={styles.infoValue}>{formatDate(items[0]?.CreatedDate)}</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: ms(8) }]}>
            <Text style={styles.infoLabel}>Status Notes:</Text>
            <Text style={styles.infoValue} numberOfLines={3}>{focRequest?.Notes ?? 'NA'}</Text>
          </View>
        </View>
      </View>

      {/* Item cards (adapter_tech_request_foc_details.xml) */}
      {items.map((it, idx) => {
        const st = it.ItemRequestId != null ? localState[it.ItemRequestId] : undefined;
        const received = st?.itemReceived === true;
        const issue = st?.anyIssue === true;
        const setSt = (patch: Partial<ItemLocalState>) =>
          it.ItemRequestId != null && setItemState(it.ItemRequestId, patch);
        return (
          <View key={it.ItemRequestId ?? idx} style={styles.itemCard}>
            <View style={styles.titleRow}>
              <Text style={styles.titleBadge} numberOfLines={1}>
                #{idx + 1} {(it.ItemRequestName ?? '').toUpperCase()}
              </Text>
              <Pressable
                style={styles.deleteBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => confirmDeleteItem(it.ItemRequestId)}
              >
                <DeleteIcon size={ms(20)} />
              </Pressable>
            </View>

            <View style={styles.statusRow}>
              <Text style={[styles.lblBlack, { flex: 1.3 }]}>Status : </Text>
              <Text style={[styles.statusValue, { flex: 1 }]} numberOfLines={1}>
                {it.ItemRequestStatusTagName || 'NA'}
              </Text>
              <Text style={[styles.lblBlack, { flex: 0.9 }]}>Req. Qty :</Text>
              <Text style={[styles.qtyValue, { flex: 0.8 }]}>{it.ItemRequestQty}</Text>
            </View>

            <View style={styles.rowSide}>
              <Text style={[styles.lblGray, { flex: 1.3 }]}>Invoice Date :</Text>
              <Text style={[styles.valLight, { flex: 1 }]}>{it.ItemRequestInvoice_Date ? formatDate(it.ItemRequestInvoice_Date) : ''}</Text>
              <Text style={[styles.lblGray, { flex: 0.9 }]}>Install Date :</Text>
              <Text style={[styles.valLight, { flex: 0.8 }]}>{it.ItemRequestInstall_date ? formatDate(it.ItemRequestInstall_date) : ''}</Text>
            </View>

            <View style={[styles.rowSide, { marginTop: ms(10) }]}>
              <Text style={[styles.lblGray, { flex: 0.975 }]}>Attachment Type :</Text>
              <Text style={[styles.valLight, { flex: 0.75 }]}>{it.AttachmentTypeName || 'NA'}</Text>
              <Pressable
                style={[styles.attachLink, { flex: 1.275 }, it.AttachmentDoc == null && { opacity: 0 }]}
                disabled={it.AttachmentDoc == null}
                onPress={() => openAttachment(it.AttachmentDoc)}
              >
                <AttachIcon size={ms(16)} />
                <Text style={styles.valLight}>  View Attachment</Text>
              </Pressable>
            </View>

            <View style={[styles.rowSide, { marginTop: ms(10) }]}>
              <Text style={[styles.lblGray, { flex: 0.65 }]}>Notes :</Text>
              <Text style={[styles.valLight, { flex: 1.35 }]}>{it.DescribeIssue || 'NA'}</Text>
            </View>

            {it.ProductID != null && (
              <View style={[styles.rowSide, { marginTop: ms(10) }]}>
                <Text style={[styles.lblGray, { flex: 0.65 }]}>Product Id :</Text>
                <Text style={[styles.valLight, { flex: 1.35 }]}>{it.ProductID}</Text>
              </View>
            )}

            {/* Item Received + Any Issues */}
            <View style={styles.recvRow}>
              <View style={styles.recvHalf}>
                <Text style={[styles.lblBlack, { marginRight: ms(10) }]}>Item Received</Text>
                <YesNoSegment
                  width={ms(93)}
                  value={st?.itemReceived ?? false}
                  disabled={!!st?.locked}
                  onChange={v => setSt(v ? { itemReceived: true } : { itemReceived: false, anyIssue: null, describeIssue: '' })}
                />
              </View>
              {received && (
                <View style={styles.recvHalf}>
                  <Text style={[styles.lblBlack, { marginHorizontal: ms(10) }]}>Any Issues</Text>
                  <YesNoSegment
                    width={ms(103)}
                    value={st?.anyIssue ?? false}
                    disabled={!!st?.issueLocked}
                    onChange={v => setSt({ anyIssue: v, ...(v ? {} : { describeIssue: '' }) })}
                  />
                </View>
              )}
            </View>

            {received && issue && (
              <TextInput
                style={styles.descInput}
                placeholder="Describe Issue"
                placeholderTextColor="#9a9faa"
                value={st?.describeIssue ?? ''}
                editable={!st?.issueLocked}
                onChangeText={text => setSt({ describeIssue: text })}
                numberOfLines={1}
              />
            )}
          </View>
        );
      })}

      <DeleteFocDialog
        visible={pendingDeleteId != null}
        onConfirm={deleteItem}
        onCancel={() => setPendingDeleteId(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  content: { paddingTop: ms(20), paddingBottom: ms(40) },

  headerArea: { height: ms(174) },
  updateAllBtn: {
    alignSelf: 'flex-end',
    width: ms(100),
    height: ms(30),
    marginRight: ms(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(5),
    backgroundColor: RED,
    borderRadius: ms(34),
  },
  updateAllBtnDisabled: { opacity: 0.6 },
  updateAllText: { color: '#fff', fontSize: sp(12) },

  infoBlock: { paddingVertical: ms(14), paddingHorizontal: ms(16) },
  infoRow: { flexDirection: 'row' },
  infoLabel: { flex: 1, fontSize: sp(14), fontWeight: 'bold', color: '#0e0e0e' },
  infoValue: { flex: 1, fontSize: sp(14), color: '#535353' },

  itemCard: {
    marginHorizontal: ms(15),
    marginTop: ms(25),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: '#f4f4f4',
    backgroundColor: '#fff',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleBadge: {
    maxWidth: '80%',
    backgroundColor: RED,
    color: '#fff',
    fontSize: sp(12),
    fontWeight: 'bold',
    paddingHorizontal: ms(15),
    paddingVertical: ms(3),
    borderTopLeftRadius: ms(10),
    borderBottomRightRadius: ms(10),
    overflow: 'hidden',
  },
  deleteBtn: { width: ms(30), height: ms(30), padding: ms(5), alignItems: 'center', justifyContent: 'center' },

  statusRow: { flexDirection: 'row', padding: ms(10) },
  rowSide: { flexDirection: 'row', marginHorizontal: ms(10) },
  lblBlack: { fontSize: sp(12), fontWeight: 'bold', color: '#0e0e0e' },
  lblGray: { fontSize: sp(12), fontWeight: 'bold', color: '#535353' },
  valLight: { fontSize: sp(12), color: '#9a9faa' },
  statusValue: { fontSize: sp(11), fontWeight: 'bold', color: GREEN },
  qtyValue: { fontSize: sp(12), fontWeight: 'bold', color: RED },
  attachLink: { flexDirection: 'row', alignItems: 'flex-start', minHeight: ms(20) },

  recvRow: { flexDirection: 'row', marginTop: ms(10), padding: ms(10) },
  recvHalf: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  segment: { flexDirection: 'row', height: ms(20) },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  segLeft: { borderTopLeftRadius: ms(25), borderBottomLeftRadius: ms(25) },
  segRight: { borderTopRightRadius: ms(25), borderBottomRightRadius: ms(25) },
  segText: { fontSize: sp(14), color: '#1d2536' },
  segTextOn: { color: '#fff' },

  descInput: {
    marginHorizontal: ms(10),
    marginBottom: ms(10),
    padding: ms(10),
    borderWidth: 1,
    borderColor: '#9a9faa',
    borderRadius: ms(20),
    fontSize: sp(16),
    color: '#1d2536',
  },
});
