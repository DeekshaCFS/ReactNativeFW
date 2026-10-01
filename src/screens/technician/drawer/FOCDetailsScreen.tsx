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
  ActivityIndicator, Linking, TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { ms, sp, scale } from '../../../utils/responsive';
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

const formatDate = (iso?: string): string => {
  if (!iso) return 'NA';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'NA';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
};

interface ItemLocalState {
  itemReceived: boolean | null;
  anyIssue: boolean | null;
  describeIssue: string;
  locked: boolean;
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
  const confirmDeleteItem = (itemRequestId?: number) => {
    if (!itemRequestId) return;
    Alert.alert('Delete FOC', 'Do you want to delete this FOC?', [
      { text: 'Nope. Not Now', style: 'cancel' },
      {
        text: 'Yes. Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await getDeleteFocRequestSubItem({ ItemRequestId: itemRequestId });
            if (res?.Code !== '200') {
              Alert.alert('Failed', res?.Message || 'Could not delete the item.');
              return;
            }
            setItems(prev => prev.filter(it => it.ItemRequestId !== itemRequestId));
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Could not delete the item.');
          }
        },
      },
    ]);
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
      {/* Header card */}
      <View style={styles.headerCard}>
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
              <Ionicons name="sync" size={scale(14)} color="#fff" />
            </>
          )}
        </Pressable>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Request Id:</Text>
          <Text style={styles.fieldValue}>REQ{focRequest?.FocRequestId}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Status:</Text>
          <Text style={styles.fieldValue}>{focRequest?.FOCStatusName || 'NA'}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Req. Date:</Text>
          <Text style={styles.fieldValue}>{formatDate(items[0]?.CreatedDate)}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Status Notes:</Text>
          <Text style={styles.fieldValue}>{focRequest?.Notes || 'NA'}</Text>
        </View>
      </View>

      {/* Item cards */}
      {items.map((it, idx) => {
        const st = it.ItemRequestId != null ? localState[it.ItemRequestId] : undefined;
        return (
          <View key={it.ItemRequestId ?? idx} style={styles.itemCard}>
            <View style={styles.itemTitleBar}>
              <Text style={styles.itemTitleText} numberOfLines={1}>
                #{idx + 1} {it.ItemRequestName}
              </Text>
              <Pressable
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => confirmDeleteItem(it.ItemRequestId)}
              >
                <Ionicons name="trash-outline" size={scale(18)} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.itemBody}>
              <View style={styles.itemRow}>
                <View style={styles.itemCol}>
                  <Text style={styles.fieldLabel}>Status :</Text>
                  <Text style={[styles.fieldValue, styles.statusGreen]}>
                    {it.ItemRequestStatusTagName || 'NA'}
                  </Text>
                </View>
                <View style={styles.itemCol}>
                  <Text style={styles.fieldLabel}>Req. Qty :</Text>
                  <Text style={[styles.fieldValue, styles.qtyRed]}>{it.ItemRequestQty ?? 'NA'}</Text>
                </View>
              </View>

              <View style={styles.itemRow}>
                <View style={styles.itemCol}>
                  <Text style={styles.fieldLabel}>Invoice Date :</Text>
                  <Text style={styles.fieldValueMuted}>{formatDate(it.ItemRequestInvoice_Date)}</Text>
                </View>
                <View style={styles.itemCol}>
                  <Text style={styles.fieldLabel}>Install Date :</Text>
                  <Text style={styles.fieldValueMuted}>{formatDate(it.ItemRequestInstall_date)}</Text>
                </View>
              </View>

              <View style={styles.itemRow}>
                <View style={styles.itemCol}>
                  <Text style={styles.fieldLabel}>Attachment Type :</Text>
                  <Text style={styles.fieldValueMuted}>{it.AttachmentTypeName || 'NA'}</Text>
                </View>
                <Pressable
                  style={[styles.itemCol, styles.attachmentLink]}
                  onPress={() => openAttachment(it.AttachmentDoc)}
                >
                  <Ionicons name="attach" size={scale(16)} color={COLORS.primary} />
                  <Text style={styles.attachmentLinkText}>View Attachment</Text>
                </Pressable>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Notes :</Text>
                <Text style={styles.fieldValueMuted}>{it.DescribeIssue || 'NA'}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Product Id :</Text>
                <Text style={styles.fieldValueMuted}>{it.ProductID || 'NA'}</Text>
              </View>

              {/* Item Received toggle */}
              <View style={styles.toggleRow}>
                <Text style={styles.fieldLabel}>Item Received</Text>
                <View style={styles.segment}>
                  <Pressable
                    style={[
                      styles.segmentBtn,
                      styles.segmentBtnNo,
                      st?.itemReceived === false && styles.segmentBtnNoActive,
                    ]}
                    disabled={!!st?.locked}
                    onPress={() => it.ItemRequestId != null && setItemState(it.ItemRequestId, { itemReceived: false })}
                  >
                    <Text style={[styles.segmentText, st?.itemReceived === false && styles.segmentTextActive]}>
                      NO
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.segmentBtn,
                      styles.segmentBtnYes,
                      st?.itemReceived === true && styles.segmentBtnYesActive,
                    ]}
                    disabled={!!st?.locked}
                    onPress={() => it.ItemRequestId != null && setItemState(it.ItemRequestId, { itemReceived: true })}
                  >
                    <Text style={[styles.segmentText, st?.itemReceived === true && styles.segmentTextActive]}>
                      Yes
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Any Issue (only once item marked received) */}
              {st?.itemReceived === true && (
                <>
                  <View style={styles.toggleRow}>
                    <Text style={styles.fieldLabel}>Any Issue</Text>
                    <View style={styles.segment}>
                      <Pressable
                        style={[
                          styles.segmentBtn,
                          styles.segmentBtnNo,
                          st?.anyIssue === false && styles.segmentBtnNoActive,
                        ]}
                        onPress={() => it.ItemRequestId != null && setItemState(it.ItemRequestId, { anyIssue: false })}
                      >
                        <Text style={[styles.segmentText, st?.anyIssue === false && styles.segmentTextActive]}>
                          NO
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.segmentBtn,
                          styles.segmentBtnYes,
                          st?.anyIssue === true && styles.segmentBtnYesActive,
                        ]}
                        onPress={() => it.ItemRequestId != null && setItemState(it.ItemRequestId, { anyIssue: true })}
                      >
                        <Text style={[styles.segmentText, st?.anyIssue === true && styles.segmentTextActive]}>
                          Yes
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {st?.anyIssue === true && (
                    <View style={styles.descBox}>
                      <TextInput
                        style={styles.descInput}
                        placeholder="Describe the issue"
                        placeholderTextColor="#a6a6a6"
                        value={st.describeIssue}
                        onChangeText={text =>
                          it.ItemRequestId != null && setItemState(it.ItemRequestId, { describeIssue: text })
                        }
                        multiline
                      />
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  content: { padding: ms(16), paddingBottom: ms(40) },

  headerCard: { marginBottom: ms(16) },
  updateAllBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    backgroundColor: COLORS.primary,
    paddingHorizontal: ms(16),
    paddingVertical: ms(8),
    borderRadius: ms(20),
    marginBottom: ms(12),
  },
  updateAllBtnDisabled: { opacity: 0.6 },
  updateAllText: { color: '#fff', fontWeight: '600', fontSize: sp(13) },

  fieldRow: { flexDirection: 'row', marginBottom: ms(10), flexWrap: 'wrap' },
  fieldLabel: { fontWeight: '700', fontSize: sp(14), color: COLORS.textPrimary, marginRight: ms(6) },
  fieldValue: { fontSize: sp(14), color: COLORS.textPrimary },
  fieldValueMuted: { fontSize: sp(14), color: '#8a8f98' },
  statusGreen: { color: '#16a34a', fontWeight: '600' },
  qtyRed: { color: COLORS.primary, fontWeight: '700' },

  itemCard: {
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: ms(16),
    overflow: 'hidden',
  },
  itemTitleBar: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(14),
    paddingVertical: ms(10),
  },
  itemTitleText: { color: '#fff', fontWeight: '700', fontSize: sp(13), flex: 1, marginRight: ms(8) },
  itemBody: { padding: ms(16) },
  itemRow: { flexDirection: 'row', marginBottom: ms(10) },
  itemCol: { flex: 1 },

  attachmentLink: { flexDirection: 'row', alignItems: 'center', gap: ms(4) },
  attachmentLinkText: { color: COLORS.primary, fontSize: sp(13), fontWeight: '600' },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: ms(8),
  },
  segment: {
    flexDirection: 'row',
    borderRadius: ms(20),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  segmentBtn: { paddingHorizontal: ms(18), paddingVertical: ms(6), backgroundColor: '#fff' },
  segmentBtnNo: {},
  segmentBtnNoActive: { backgroundColor: COLORS.primary },
  segmentBtnYes: {},
  segmentBtnYesActive: { backgroundColor: '#16a34a' },
  segmentText: { fontSize: sp(13), fontWeight: '600', color: '#555' },
  segmentTextActive: { color: '#fff' },

  descBox: {
    marginTop: ms(10),
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: ms(10),
    padding: ms(10),
  },
  descInput: { fontSize: sp(13), color: COLORS.textPrimary },
});
