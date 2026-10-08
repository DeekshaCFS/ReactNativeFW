// src/screens/technician/main/ItemRequestScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
  ActivityIndicator,
  Image,
} from 'react-native';
import Modal from '../../../components/AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { COLORS } from '../../../theme/theme';
import { ms, sp, useAppHeaderHeight } from '../../../utils/responsive';
import SearchPickerModal, { PickerOption } from '../../../components/SearchPickerModal';
import { ClosePopupIcon } from '../../../components/TaskTrackingSheet';
import { UploadAttachmentIcon } from '../../../components/DialogIcons';
import { getLargeItemAssignedUnassigned } from '../../../api/item/itemService';
import { postFocDetails, getFocAttachmentList } from '../../../api/focItemRequest/focItemRequestService';
import { pick } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local request-body shapes for FOC_Item_Request/Add_FOC_Request_Details — kept
// inline since the generated DTO (AddFocDTOResultData) is missing several
// fields the live endpoint expects (ProductID, ItemDescription, etc).
// Verified field-by-field against Java's AddFocDTO.java / TaskRequestItems_FW.java
// (no ShipToParty on either side — an earlier version of this file sent it,
// but it isn't part of the DTO Java actually posts).
interface FOCItemRequestDetail {
  ItemRequestId: number;
  FocRequestId: number;
  ItemRequestName: string;
  ItemRequestQty: number;
  ItemRequestInvoice_Date: string;
  ItemRequestInstall_date: string;
  AttachmentTypeID: number;
  AttachmentTypeName: string;
  AttachmentDoc: string;
  AttachmentDocFileName: string;
  ItemRequestStatusTagId: number;
  ItemRequestStatusTagName: string;
  IsActive: boolean;
  IsItemRecieved: boolean;
  IsAnyIssue: boolean;
  DescribeIssue: string;
  IsExistingItem: boolean;
  UserId: number;
  CreatedBy: number;
  CreatedDate: string;
  UpdatedBy: number;
  UpdatedDate: string;
  FieldWorkerDescribeIssue: string;
  ExistingItemId: number;
  ExistingItemCode: string;
  ExistingItemName: string;
  ExistingItemQty: number;
  ItemStatus: string;
  ProductID: string;
  ItemDescription: string;
  ProductDescription: string;
}

interface FOCRequestPayload {
  FocRequestId: number;
  SourceTypeId: number;
  SourceName: string;
  TaskId: number;
  FocStatusTagId: number;
  ChangedBy: number;
  IsActive: boolean;
  IsItemRecieved: boolean;
  IsAnyIssue: boolean;
  Notes: string;
  CustomerDetailsId: number;
  UserId: number;
  CreatedBy: number;
  CreatedDate: string;
  UpdatedBy: number;
  UpdatedDate: string;
  FOC_Item_Request_Details: FOCItemRequestDetail[];
}

interface FileAsset {
  uri: string;
  name: string;
  type: string;
  base64?: string;
}

interface RequestItem {
  id: number;
  itemName: string;
  itemNameId: number | null;
  quantity: string;
  itemDescription: string;
  productId: string;
  productIdValue: number | null;
  productDescription: string;
  invoiceDate: string;
  installDate: string;
  attachmentType: string;
  attachmentTypeId: number | null;
  attachment: FileAsset | null;
}

type DateField = 'invoiceDate' | 'installDate';

// ─── Blank item factory ───────────────────────────────────────────────────────

const blankItem = (): RequestItem => ({
  id: Date.now() + Math.random(),
  itemName: '',
  itemNameId: null,
  quantity: '1',
  itemDescription: '',
  productId: '',
  productIdValue: null,
  productDescription: '',
  invoiceDate: '',
  installDate: '',
  attachmentType: '',
  attachmentTypeId: null,
  attachment: null,
});

// Java shows the dates as yyyy-MM-dd and posts them as "<yyyy-MM-dd>T00:00:00" (no timezone shift).
const formatDate = (date: Date): string => {
  const dd   = String(date.getDate()).padStart(2, '0');
  const mm   = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
};

const parseYMD = (value: string): Date => {
  const [yyyy, mm, dd] = value.split('-').map(Number);
  return new Date(yyyy, mm - 1, dd);
};

const toast = (msg: string) => ToastAndroid.show(msg, ToastAndroid.SHORT);

const MAX_ITEMS = 5;

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ItemRequestScreen({ navigation, route }: any) {
  const routeTask = route?.params?.routeTask ?? null;
  const returnTo = route?.params?.returnTo as { name: string; params?: any } | undefined;
  const headerHeight = useAppHeaderHeight();

  const [items, setItems]         = useState<RequestItem[]>([blankItem()]);
  const [submitting, setSubmitting] = useState(false);

  const [uid, setUid] = useState<number>(0);
  const [token, setToken] = useState<string>('');
  const [ownerId, setOwnerId] = useState<number>(routeTask?.OwnerId ?? 0);

  useEffect(() => {
    const loadSession = async () => {
      const storedUid   = await AsyncStorage.getItem('uid');
      const storedToken = await AsyncStorage.getItem('token');
      const storedOwner = await AsyncStorage.getItem('owner_id');
      if (storedUid)   setUid(Number(storedUid));
      if (storedToken) setToken(storedToken);
      if (storedOwner) setOwnerId(Number(storedOwner));
    };
    loadSession();
  }, []);

  // ── Picker (Java: dialog_searchable_* dialogs) ──
  type PickerKind = 'item' | 'product' | 'attachment';
  const [picker, setPicker] = useState<{ kind: PickerKind; itemId: number } | null>(null);
  const [pickerOptions, setPickerOptions] = useState<PickerOption[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const descById = useRef<Record<number, string>>({});
  const searchSeq = useRef(0);

  // ── Date picker state ──
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerValue, setDatePickerValue]     = useState(new Date());
  const pendingDateRef = useRef<{ itemId: number; field: DateField } | null>(null);

  const openPicker = (kind: PickerKind, itemId: number) => {
    searchSeq.current++;
    setPicker({ kind, itemId });
    if (kind === 'attachment') {
      setPickerLoading(false);
      setPickerOptions(attachmentTypeOptions);
    } else {
      // Java fetches the full list once as soon as the picker opens, then filters locally
      // as the technician types -- not a 3-character minimum.
      setPickerOptions([]);
      searchItems('');
    }
  };

  const closePicker = () => {
    searchSeq.current++;
    setPicker(null);
  };

  // ── Date picker helpers ──
  const openDatePicker = (itemId: number, field: DateField, currentValue: string) => {
    // Parse existing yyyy-mm-dd back to a Date, or use today
    let initial = new Date();
    if (currentValue) {
      const [yyyy, mm, dd] = currentValue.split('-').map(Number);
      if (!isNaN(dd) && !isNaN(mm) && !isNaN(yyyy)) {
        initial = new Date(yyyy, mm - 1, dd);
      }
    }
    pendingDateRef.current = { itemId, field };
    setDatePickerValue(initial);
    setDatePickerVisible(true);
  };

  const confirmIOSDate = () => {
    if (pendingDateRef.current) {
      const { itemId, field } = pendingDateRef.current;
      updateItem(itemId, { [field]: formatDate(datePickerValue) });
    }
    setDatePickerVisible(false);
    pendingDateRef.current = null;
  };

  // Item Name and Product Id both call Item/AllItemList; the full list loads on open and
  // narrows further as the technician types (server-side SearchParam).
  const searchItems = async (text: string) => {
    const seq = searchSeq.current;
    try {
      setPickerLoading(true);
      const res = await getLargeItemAssignedUnassigned({ OwnerId: ownerId, SearchParam: text });
      if (seq !== searchSeq.current) return;
      const list = res.ResultData ?? [];
      list.forEach((it: any) => {
        descById.current[it.Id] = it.Description ?? '';
      });
      setPickerOptions(list.map((it: any) => ({ id: it.Id, label: it.Name })));
    } catch {
      if (seq === searchSeq.current) setPickerOptions([]);
    } finally {
      if (seq === searchSeq.current) setPickerLoading(false);
    }
  };

  const onPickerSelect = (option: PickerOption) => {
    if (!picker) return;
    const { kind, itemId } = picker;
    if (kind === 'item') {
      // Java: the picked item's description fills (and locks) the description field.
      updateItem(itemId, {
        itemName: option.label,
        itemNameId: option.id,
        itemDescription: descById.current[option.id] ?? '',
      });
    } else if (kind === 'product') {
      updateItem(itemId, {
        productId: option.label,
        productIdValue: option.id > 0 ? option.id : null,
        productDescription: descById.current[option.id] ?? '',
      });
    } else {
      updateItem(itemId, { attachmentType: option.label, attachmentTypeId: option.id });
    }
    closePicker();
  };

  // Java: closing the dialog with text typed and nothing picked keeps the typed text.
  const onPickerDismissText = (text: string) => {
    if (!picker) return;
    if (picker.kind === 'item') {
      updateItem(picker.itemId, { itemName: text, itemNameId: null, itemDescription: '' });
    } else if (picker.kind === 'product') {
      updateItem(picker.itemId, { productId: text, productIdValue: null, productDescription: '' });
    }
  };

  const [attachmentTypeOptions, setAttachmentTypeOptions] = useState<PickerOption[]>([]);

  // GET FOC_Item_Request/Get_FOC_Att_types_List -- Java fetches this once per
  // session (HomeActivityNew.getFOCAttachmentList) and reuses it on the Item
  // Request screen; we fetch it here instead since RN has no equivalent cache.
  useEffect(() => {
    if (!uid) return;
    const loadAttachmentTypes = async () => {
      try {
        const res = await getFocAttachmentList({ userid: uid });
        setAttachmentTypeOptions(
          (res.ResultData ?? []).map(item => ({
            id: item.AttachmentTypeID ?? 0,
            label: item.AttachmentTypeName ?? '',
          })),
        );
      } catch {
        setAttachmentTypeOptions([]);
      }
    };
    loadAttachmentTypes();
  }, [uid]);

  // ── Item field updater ──
  const updateItem = (id: number, patch: Partial<RequestItem>) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, ...patch } : it)));
  };

  // Java (addItem): the next block only opens once the current one has a name, a non-zero
  // quantity and a valid invoice/install date pair; the earlier block is then locked (its cross
  // is hidden) and the button disappears after the 5th item.
  const addItem = () => {
    const last = items[items.length - 1];
    if (last.invoiceDate && last.installDate && parseYMD(last.installDate) < parseYMD(last.invoiceDate)) {
      toast('Error: Installation Date cannot be before Invoice Date!');
      return;
    }
    if (!last.itemName.trim() || !last.quantity.trim() || Number(last.quantity) === 0) {
      toast('Please Enter Item Name and Quantity!!');
      return;
    }
    setItems(prev => [...prev, blankItem()]);
  };

  // The cross on the only block just clears it; otherwise the last block is removed.
  const removeItem = (id: number) => {
    if (items.length === 1) {
      setItems([blankItem()]);
      return;
    }
    setItems(prev => prev.filter(it => it.id !== id));
  };

  // Back to whoever opened the sheet (closure / on-hold sheet / countdown).
  const leaveSheet = () => {
    if (route?.params?.fromOnHold) {
      navigation.navigate('TaskExecution', { task: routeTask, reopenOnHold: true });
    } else if (returnTo) {
      navigation.navigate(returnTo.name, returnTo.params);
    } else if (routeTask) {
      navigation.navigate('TaskExecution', { task: routeTask });
    } else {
      navigation.goBack();
    }
  };

  // -- Attach file --
  const pickDocument = async (itemId: number) => {
    try {
      const result = await pick({ type: ['*/*'] });
      const file = result[0];
      const base64 = await RNFS.readFile(file.uri, 'base64');
      updateItem(itemId, {
        attachment: {
          uri: file.uri,
          name: file.name ?? 'document',
          type: file.type ?? 'application/octet-stream',
          base64,
        },
      });
    } catch (e) {
      console.log(e);
    }
  };

  // ── Submit ──
  // Java (buttonAddQuote): a date pair out of order is rejected first; then every open block
  // needs item name, quantity (!= 0), invoice date and install date, else "Please Fill all
  // Item Details!!".
  const handleSubmit = async () => {
    for (const item of items) {
      if (item.invoiceDate && item.installDate && parseYMD(item.installDate) < parseYMD(item.invoiceDate)) {
        toast('Error: Installation Date cannot be before Invoice Date!');
        return;
      }
    }
    const incomplete = items.some(
      item =>
        !item.itemName.trim() ||
        !item.quantity.trim() ||
        Number(item.quantity) === 0 ||
        !item.invoiceDate ||
        !item.installDate,
    );
    if (incomplete) {
      toast('Please Fill all Item Details!!');
      return;
    }

    try {
      setSubmitting(true);
      const now = new Date().toISOString();

      const details: FOCItemRequestDetail[] = items.map(item => ({
        ItemRequestId:            0,
        FocRequestId:             0,
        ItemRequestName:          item.itemName,
        ItemRequestQty:           Number(item.quantity) || 1,
        ItemRequestInvoice_Date:  `${item.invoiceDate}T00:00:00`,
        ItemRequestInstall_date:  `${item.installDate}T00:00:00`,
        AttachmentTypeID:         item.attachmentTypeId ?? 0,
        AttachmentTypeName:       item.attachmentType,
        AttachmentDoc:            item.attachment?.base64 ?? '',
        AttachmentDocFileName:    item.attachment?.name  ?? '',
        ItemRequestStatusTagId:   0,
        ItemRequestStatusTagName: '',
        IsActive:                 true,
        IsItemRecieved:           false,
        IsAnyIssue:               false,
        DescribeIssue:            '',
        IsExistingItem:           (item.itemNameId ?? 0) !== 0,
        UserId:                   uid,
        CreatedBy:                uid,
        CreatedDate:              now,
        UpdatedBy:                uid,
        UpdatedDate:              now,
        FieldWorkerDescribeIssue: '',
        ExistingItemId:           item.itemNameId ?? 0,
        ExistingItemCode:         '',
        ExistingItemName:         '',
        ExistingItemQty:          0,
        ItemStatus:               '',
        ProductID:                item.productId,
        ItemDescription:          item.itemDescription,
        ProductDescription:       item.productDescription,
      }));

      const payload: FOCRequestPayload = {
        FocRequestId:      0,
        // Java (TaskRequestItems_FW): SourceTypeId=1; "InDirect" when raised from a
        // task (closure / on-hold / execution), "Direct" otherwise.
        SourceTypeId:      1,
        SourceName:        routeTask?.Id ? 'InDirect' : 'Direct',
        TaskId:            routeTask?.Id ?? 0,
        FocStatusTagId:    0,
        ChangedBy:         uid,
        IsActive:          true,
        IsItemRecieved:    true,   // Java sets the request-level flag true; per-item stays false
        IsAnyIssue:        false,
        Notes:             '',
        CustomerDetailsId: routeTask?.CustomerDetailsid ?? 0,
        UserId:            uid,
        CreatedBy:         uid,
        CreatedDate:       now,
        UpdatedBy:         uid,
        UpdatedDate:       now,
        FOC_Item_Request_Details: details,
      };

      const response = await postFocDetails(payload);

      if (response.Code === '200') {
        toast('Item Requested Successfully');
        leaveSheet();
      } else {
        toast(response.Message || 'Submission failed.');
      }
    } catch (err: any) {
      toast(err?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  // Java: add_foc_fragment.xml -- white sheet (25dp top radius) under the FieldWeb header, no
  // bottom bar; each item block is label row, name + qty, description, product id, product
  // description, invoice/install dates, attachment type + dashed attachment box.

  const lastIndex = items.length - 1;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: headerHeight }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.sheet}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: ms(20) }}
        >
          {/* ── Title + close ── */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>Item Request</Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={leaveSheet} hitSlop={8}>
            <ClosePopupIcon size={ms(30)} />
          </Pressable>

          <View style={styles.divider} />

          {items.map((item, idx) => {
            const locked = idx < lastIndex;
            return (
              <View key={item.id} style={idx > 0 && { marginTop: ms(16) }}>
                {/* ── # Item N + cross (hidden once the next block is open) ── */}
                <View style={styles.itemHeader}>
                  <Text style={styles.itemHeaderText}># Item {idx + 1}</Text>
                  {!locked && (
                    <Pressable onPress={() => removeItem(item.id)} hitSlop={8}>
                      <Ionicons name="close" size={ms(26)} color={COLORS.primary} />
                    </Pressable>
                  )}
                </View>

                {/* ── Item Name + Quantity ── */}
                <View style={styles.nameRow}>
                  <Pressable
                    disabled={locked}
                    style={[styles.spinner, { width: '63.1%' }]}
                    onPress={() => openPicker('item', item.id)}
                  >
                    <Text style={[styles.spinnerText, !!item.itemName && styles.spinnerValue]} numberOfLines={1}>
                      {item.itemName || 'Item Name'}
                    </Text>
                    <Ionicons name="chevron-down" size={ms(22)} color={COLORS.ink} />
                  </Pressable>

                  <View style={styles.qtyCell}>
                    <View style={styles.qtyBox}>
                      <TextInput
                        value={item.quantity}
                        onChangeText={val => updateItem(item.id, { quantity: val.replace(/[^0-9]/g, '') })}
                        keyboardType="numeric"
                        maxLength={3}
                        editable={!locked}
                        placeholder="Quantity"
                        placeholderTextColor={COLORS.lightGray}
                        style={styles.qtyInput}
                      />
                      {!!item.quantity && <Text style={styles.floatLabel}>Quantity</Text>}
                    </View>
                  </View>
                </View>

                {/* ── Item Description ── */}
                <View style={[styles.fieldWrap, { marginTop: ms(15) }]}>
                  <TextInput
                    value={item.itemDescription}
                    onChangeText={val => updateItem(item.id, { itemDescription: val })}
                    placeholder="Item Description"
                    placeholderTextColor={COLORS.lightGray}
                    maxLength={50}
                    autoCapitalize="words"
                    editable={!(item.itemNameId && item.itemDescription)}
                    style={styles.box}
                  />
                  {!!item.itemDescription && <Text style={styles.floatLabel}>Item Description</Text>}
                </View>

                {/* ── Product Id ── */}
                <Pressable
                  style={[styles.spinner, styles.productSpinner]}
                  onPress={() => openPicker('product', item.id)}
                >
                  <Text style={[styles.spinnerText, { fontSize: sp(16) }, !!item.productId && styles.spinnerValue]} numberOfLines={1}>
                    {item.productId || 'Product Id'}
                  </Text>
                  <Ionicons name="chevron-down" size={ms(22)} color={COLORS.ink} />
                </Pressable>

                {/* ── Product Description ── */}
                <View style={[styles.fieldWrap, { marginTop: ms(15) }]}>
                  <TextInput
                    value={item.productDescription}
                    onChangeText={val => updateItem(item.id, { productDescription: val })}
                    placeholder="Product Description"
                    placeholderTextColor={COLORS.lightGray}
                    maxLength={50}
                    autoCapitalize="words"
                    editable={!(item.productIdValue && item.productDescription)}
                    style={styles.box}
                  />
                  {!!item.productDescription && <Text style={styles.floatLabel}>Product Description</Text>}
                </View>

                {/* ── Invoice Date + Install Date ── */}
                <View style={styles.dateRow}>
                  <Pressable
                    disabled={locked}
                    style={[styles.fieldWrap, { flex: 1, marginHorizontal: 0, marginRight: ms(8) }]}
                    onPress={() => openDatePicker(item.id, 'invoiceDate', item.invoiceDate)}
                  >
                    <View style={[styles.box, styles.dateBox]}>
                      <Text style={[styles.dateText, !item.invoiceDate && { color: COLORS.lightGray }]}>
                        {item.invoiceDate || 'Invoice Date'}
                      </Text>
                    </View>
                    {!!item.invoiceDate && <Text style={styles.floatLabel}>Invoice Date</Text>}
                  </Pressable>

                  <Pressable
                    disabled={locked}
                    style={[styles.fieldWrap, { flex: 1, marginHorizontal: 0 }]}
                    onPress={() => openDatePicker(item.id, 'installDate', item.installDate)}
                  >
                    <View style={[styles.box, styles.dateBox]}>
                      <Text style={[styles.dateText, !item.installDate && { color: COLORS.lightGray }]}>
                        {item.installDate || 'Install Date'}
                      </Text>
                    </View>
                    {!!item.installDate && <Text style={styles.floatLabel}>Install Date</Text>}
                  </Pressable>
                </View>

                {/* ── Attachment Type + dashed attachment box ── */}
                <View style={styles.attachRow}>
                  <Pressable
                    style={[styles.spinner, styles.attachSpinner]}
                    onPress={() => openPicker('attachment', item.id)}
                  >
                    <Text style={[styles.spinnerText, !!item.attachmentType && styles.spinnerValue]} numberOfLines={1}>
                      {item.attachmentType || 'Attachment Type'}
                    </Text>
                    <Ionicons name="chevron-down" size={ms(22)} color={COLORS.ink} />
                  </Pressable>

                  <Pressable style={styles.attachBox} onPress={() => pickDocument(item.id)}>
                    {item.attachment ? (
                      <>
                        {item.attachment.type.startsWith('image/') ? (
                          <Image
                            source={{ uri: item.attachment.uri }}
                            style={styles.attachThumb}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.attachInner}>
                            <Ionicons name="document-outline" size={ms(22)} color={COLORS.primary} />
                            <Text style={styles.attachLabel} numberOfLines={2}>
                              {item.attachment.name}
                            </Text>
                          </View>
                        )}
                        <Pressable
                          style={styles.attachRemoveBtn}
                          onPress={() => updateItem(item.id, { attachment: null })}
                          hitSlop={6}
                        >
                          <Ionicons name="close" size={ms(12)} color="#fff" />
                        </Pressable>
                      </>
                    ) : (
                      <View style={styles.attachInner}>
                        <View style={styles.attachIcon}>
                          <UploadAttachmentIcon size={ms(50)} />
                        </View>
                        <Text style={styles.attachLabel} numberOfLines={2}>Attachment</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              </View>
            );
          })}

          {/* ── + Add Item (gone after the 5th block) ── */}
          {items.length < MAX_ITEMS ? (
            <Pressable style={styles.addItemBtn} onPress={addItem}>
              <Text style={styles.addItemText}>+ Add Item</Text>
            </Pressable>
          ) : (
            <View style={styles.addItemBtn} />
          )}

          {/* ── SUBMIT ── */}
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

      {/* ── Date Picker ── */}
      {datePickerVisible && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade" onRequestClose={() => setDatePickerVisible(false)}>
            <Pressable
              style={styles.dateBackdrop}
              onPress={() => setDatePickerVisible(false)}
            >
              <Pressable style={styles.dateSheet} onPress={e => e.stopPropagation()}>
                <Text style={styles.dateSheetTitle}>Select Date</Text>
                <DateTimePicker
                  value={datePickerValue}
                  mode="date"
                  display="inline"
                  onValueChange={(_: DateTimePickerChangeEvent, date: Date) => setDatePickerValue(date)}
                  themeVariant="light"
                  accentColor={COLORS.primary}
                />
                <View style={styles.dateSheetActions}>
                  <Pressable
                    style={styles.dateCancelBtn}
                    onPress={() => {
                      setDatePickerVisible(false);
                      pendingDateRef.current = null;
                    }}
                  >
                    <Text style={styles.dateCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.dateConfirmBtn} onPress={confirmIOSDate}>
                    <Text style={styles.dateConfirmText}>Confirm</Text>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        ) : (
          <DateTimePicker
            value={datePickerValue}
            mode="date"
            display="default"
            onValueChange={(_: DateTimePickerChangeEvent, date: Date) => {
              setDatePickerVisible(false);
              if (pendingDateRef.current) {
                const { itemId, field } = pendingDateRef.current;
                updateItem(itemId, { [field]: formatDate(date) });
              }
              pendingDateRef.current = null;
            }}
            onDismiss={() => {
              setDatePickerVisible(false);
              pendingDateRef.current = null;
            }}
            positiveButton={{ label: 'OK', textColor: COLORS.primary }}
            negativeButton={{ label: 'CANCEL', textColor: COLORS.primary }}
          />
        )
      )}

      {/* ── Java-style searchable picker dialogs ── */}
      <SearchPickerModal
        visible={picker !== null}
        title={
          picker?.kind === 'item'
            ? 'Select Item'
            : picker?.kind === 'product'
              ? 'Select Product Id'
              : 'Select Attachment Type'
        }
        options={pickerOptions}
        loading={pickerLoading}
        onSelect={onPickerSelect}
        onClose={closePicker}
        {...(picker?.kind === 'attachment'
          ? {}
          : {
              onSearch: searchItems,
              onDismissText: onPickerDismissText,
            })}
      />

    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primary },
  sheet: {
    flex: 1,
    marginTop: ms(5),
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(25),
    borderTopRightRadius: ms(25),
    overflow: 'hidden',
  },

  // ── Title ──
  titleRow: { marginTop: ms(10), height: ms(30), alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: sp(22), color: COLORS.textBlack, textAlign: 'center' },
  closeBtn: { position: 'absolute', right: ms(10), top: ms(5) },
  divider: {
    height: 1,
    margin: ms(20),
    backgroundColor: '#aaaaaa', // @android:color/darker_gray
  },

  // ── Item header ──
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: ms(1.5),
    paddingBottom: ms(2.5),
    paddingRight: ms(8),
  },
  itemHeaderText: {
    marginVertical: ms(5),
    paddingLeft: ms(15),
    fontSize: sp(15),
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  // ── Spinner-style fields (bg_spinner: 34dp radius, 1dp light-gray stroke, 12dp side padding) ──
  spinner: {
    height: ms(40),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: ms(34),
    paddingHorizontal: ms(12),
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spinnerText: { flex: 1, fontSize: sp(14), color: '#666666' }, // TextView hint colour in Java
  spinnerValue: { color: COLORS.ink },

  nameRow: {
    flexDirection: 'row',
    marginHorizontal: ms(5),
    marginTop: ms(5),
    paddingLeft: ms(5),
    height: ms(40),
  },
  qtyCell: { flex: 1, marginLeft: ms(11), justifyContent: 'center' },
  qtyBox: {
    height: ms(34),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: ms(34),
    justifyContent: 'center',
  },
  qtyInput: {
    padding: 0,
    textAlign: 'center',
    fontSize: sp(14),
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },

  // ── Outlined text boxes (TextInputLayoutStyle) ──
  fieldWrap: { marginHorizontal: ms(5) },
  box: {
    height: ms(40),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: ms(34),
    paddingHorizontal: ms(15),
    paddingVertical: 0,
    fontSize: sp(16),
    color: COLORS.ink,
  },
  floatLabel: {
    position: 'absolute',
    top: -ms(8),
    left: ms(14),
    paddingHorizontal: ms(4),
    backgroundColor: COLORS.white,
    fontSize: sp(12),
    color: COLORS.lightGray,
  },
  productSpinner: { height: ms(40), marginHorizontal: ms(5), marginTop: ms(11), paddingHorizontal: ms(10) },
  dateRow: { flexDirection: 'row', marginHorizontal: ms(5), marginTop: ms(15) },
  dateBox: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: sp(16), color: COLORS.ink },

  // ── Attachment row ──
  attachRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: ms(5),
    marginRight: ms(10),
    marginTop: ms(30),
  },
  attachSpinner: { width: '46.2%', marginLeft: ms(5), marginRight: ms(10), marginTop: ms(4.5) },
  attachBox: {
    width: '46.2%',
    height: ms(50),
    marginLeft: ms(5),
    borderWidth: 1,
    borderColor: '#A9A9A9',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  attachInner: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  attachIcon: { width: '30%', alignItems: 'center' },
  attachLabel: { flex: 1, marginHorizontal: ms(15), fontSize: sp(16), color: '#000000' },
  attachThumb: { width: '100%', height: '100%' },
  attachRemoveBtn: {
    position: 'absolute',
    top: ms(3),
    right: ms(3),
    width: ms(16),
    height: ms(16),
    borderRadius: ms(8),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Add Item / Submit ──
  addItemBtn: {
    height: ms(30),
    marginTop: ms(31.5),
    marginHorizontal: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemText: { fontSize: sp(18), fontWeight: 'bold', color: COLORS.primary },
  submitBtn: {
    minHeight: ms(48),
    margin: ms(20),
    borderRadius: ms(34),
    backgroundColor: '#353935',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  submitBtnText: { color: COLORS.white, fontSize: sp(18), fontWeight: '500' },

  // ── Date picker (iOS modal) ──
  dateBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ms(16),
  },
  dateSheet: {
    backgroundColor: '#fff',
    borderRadius: ms(20),
    width: '100%',
    maxWidth: ms(400),
    paddingTop: ms(16),
    paddingBottom: ms(12),
    paddingHorizontal: ms(12),
    elevation: 10,
  },
  dateSheetTitle: {
    fontSize: sp(18),
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: ms(8),
  },
  dateSheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: ms(12),
    paddingHorizontal: ms(8),
    gap: ms(12),
  },
  dateCancelBtn: {
    flex: 1,
    height: ms(44),
    borderRadius: ms(30),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCancelText: { fontSize: sp(16), color: '#555', fontWeight: '500' },
  dateConfirmBtn: {
    flex: 1,
    height: ms(44),
    borderRadius: ms(30),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateConfirmText: { fontSize: sp(16), color: '#fff', fontWeight: '600' },
});
