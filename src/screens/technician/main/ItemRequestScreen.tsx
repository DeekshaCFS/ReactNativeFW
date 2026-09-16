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
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp, hp, wp } from '../../../utils/responsive';
import { getAllItemAssignedUnassigned } from '../../../api/item/itemService';
import { postFocDetails } from '../../../api/focItemRequest/focItemRequestService';
import { pick } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local request-body shapes for FOC_Item_Request/Add_FOC_Request_Details — kept
// inline since the generated DTO (AddFocDTOResultData) is missing several
// fields the live endpoint expects (ShipToParty, ProductID, ItemDescription, etc).
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
  ShipToParty: number;
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

interface DropdownOption {
  id: number;
  label: string;
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

const formatDate = (date: Date): string => {
  const dd   = String(date.getDate()).padStart(2, '0');
  const mm   = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const parseDMY = (value: string): Date => {
  const [dd, mm, yyyy] = value.split('-').map(Number);
  return new Date(yyyy, mm - 1, dd);
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ItemRequestScreen({ navigation, route }: any) {
  const routeTask = route?.params?.routeTask ?? null;

  const [items, setItems]         = useState<RequestItem[]>([blankItem()]);
  const [submitting, setSubmitting] = useState(false);

  const [uid, setUid] = useState<number>(0);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const loadSession = async () => {
      const storedUid   = await AsyncStorage.getItem('uid');
      const storedToken = await AsyncStorage.getItem('token');
      if (storedUid)   setUid(Number(storedUid));
      if (storedToken) setToken(storedToken);
    };
    loadSession();
  }, []);

  // ── Anchored inline dropdown state ──
  const [dropdownVisible, setDropdownVisible]   = useState(false);
  const [dropdownOptions, setDropdownOptions]   = useState<DropdownOption[]>([]);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [dropdownSearch, setDropdownSearch]     = useState('');
  const dropdownCallback = useRef<((option: DropdownOption) => void) | null>(null);

  // ── Date picker state ──
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerValue, setDatePickerValue]     = useState(new Date());
  const pendingDateRef = useRef<{ itemId: number; field: DateField } | null>(null);

  // ── Per-item per-field trigger refs ──
  const triggerRefs = useRef<Record<string, Record<string, React.RefObject<View | null>>>>({});

  const getTriggerRef = (itemId: number, field: string): React.RefObject<View | null> => {
    const key = String(itemId);
    if (!triggerRefs.current[key]) triggerRefs.current[key] = {};
    if (!triggerRefs.current[key][field]) {
      triggerRefs.current[key][field] = React.createRef<View>();
    }
    return triggerRefs.current[key][field];
  };

  const openDropdown = (
    ref: React.RefObject<View | null>,
    options: DropdownOption[],
    callback: (option: DropdownOption) => void,
  ) => {
    ref.current?.measureInWindow((x, y, width, height) => {
      setDropdownPosition({ top: y + height + 4, left: x, width });
      setDropdownOptions(options);
      setDropdownSearch('');
      dropdownCallback.current = callback;
      setDropdownVisible(true);
    });
  };

  const closeDropdown = () => {
    setDropdownVisible(false);
    setDropdownSearch('');
  };

  // ── Date picker helpers ──
  const openDatePicker = (itemId: number, field: DateField, currentValue: string) => {
    // Parse existing dd-mm-yyyy back to a Date, or use today
    let initial = new Date();
    if (currentValue) {
      const [dd, mm, yyyy] = currentValue.split('-').map(Number);
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

  // ── API data ──
  const [itemNameOptions, setItemNameOptions] = useState<DropdownOption[]>([]);

  useEffect(() => {
    getAllItemAssignedUnassigned({ OwnerId: routeTask?.OwnerId ?? 0 }).then(res => {
      const mapped = (res.ResultData ?? []).map((item: any) => ({
        id: item.Id,
        label: item.Name,
      }));
      setItemNameOptions(mapped);
    }).catch(console.error);
  }, []);

  const productIdOptions: DropdownOption[] = [
    { id: 101, label: 'PRD-101' },
    { id: 102, label: 'PRD-102' },
    { id: 103, label: 'PRD-103' },
  ];
  const attachmentTypeOptions: DropdownOption[] = [
    { id: 1, label: 'Invoice' },
    { id: 2, label: 'Warranty Card' },
    { id: 3, label: 'Manual' },
  ];

  // ── Item field updater ──
  const updateItem = (id: number, patch: Partial<RequestItem>) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, ...patch } : it)));
  };

  const removeItem = (id: number) => {
    if (items.length === 1) {
      Alert.alert('Cannot Remove', 'At least one item is required.');
      return;
    }
    setItems(prev => prev.filter(it => it.id !== id));
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
  // Matches Java's buttonAddQuote handler: item name, quantity (!=0), invoice date, and
  // install date are all mandatory per row (a row missing any of these is silently
  // dropped server-side in Java, surfaced as "Please Fill all Item Details!!"), and
  // install date may not be before invoice date for any row.
  const handleSubmit = async () => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.itemName.trim()) {
        Alert.alert('Required', `Please select an Item Name for Item ${i + 1}.`);
        return;
      }
      if (!item.quantity.trim() || Number(item.quantity) === 0) {
        Alert.alert('Required', `Please enter a Quantity for Item ${i + 1}.`);
        return;
      }
      if (!item.invoiceDate || !item.installDate) {
        Alert.alert('Required', `Please select Invoice Date and Install Date for Item ${i + 1}.`);
        return;
      }
      if (parseDMY(item.installDate) < parseDMY(item.invoiceDate)) {
        Alert.alert('', 'Error: Installation Date cannot be before Invoice Date!');
        return;
      }
    }

    try {
      setSubmitting(true);
      const now = new Date().toISOString();

      const details: FOCItemRequestDetail[] = items.map(item => ({
        ItemRequestId:            0,
        FocRequestId:             0,
        ItemRequestName:          item.itemName,
        ItemRequestQty:           Number(item.quantity) || 1,
        ItemRequestInvoice_Date:  parseDMY(item.invoiceDate).toISOString(),
        ItemRequestInstall_date:  parseDMY(item.installDate).toISOString(),
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
        IsExistingItem:           false,
        UserId:                   uid,
        CreatedBy:                uid,
        CreatedDate:              now,
        UpdatedBy:                uid,
        UpdatedDate:              now,
        FieldWorkerDescribeIssue: '',
        ExistingItemId:           0,
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
        SourceTypeId:      0,
        SourceName:        '',
        TaskId:            routeTask?.Id ?? 0,
        FocStatusTagId:    0,
        ChangedBy:         uid,
        IsActive:          true,
        IsItemRecieved:    false,
        IsAnyIssue:        false,
        Notes:             '',
        CustomerDetailsId: routeTask?.CustomerDetailsId ?? 0,
        UserId:            uid,
        CreatedBy:         uid,
        CreatedDate:       now,
        UpdatedBy:         uid,
        UpdatedDate:       now,
        ShipToParty:       0,
        FOC_Item_Request_Details: details,
      };

      const response = await postFocDetails(payload);

      if (response.Code === '200') {
        Alert.alert('Success', 'Item request submitted successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.Message || 'Submission failed.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filtered options (min 3 chars) ──
  const filteredOptions =
    dropdownSearch.length >= 3
      ? dropdownOptions.filter(o =>
          o.label.toLowerCase().includes(dropdownSearch.toLowerCase())
        )
      : [];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Red strip */}
      <View style={styles.redBg} />

      {/* White sheet */}
      <View style={styles.sheet}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Item Request</Text>
          <Pressable style={styles.closeBtn} onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="close" size={sp(20)} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.headerDivider} />

        {/* ── Scrollable content ── */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {items.map((item, idx) => (
            <View key={item.id} style={styles.itemBlock}>

              {/* ── Item header ── */}
              <View style={styles.itemHeader}>
                <Text style={styles.itemHeaderText}># Item {idx + 1}</Text>
                <Pressable onPress={() => removeItem(item.id)} hitSlop={8}>
                  <Ionicons name="close" size={sp(22)} color={COLORS.primary} />
                </Pressable>
              </View>

              {/* ── Row: Item Name dropdown + Quantity ── */}
              <View style={styles.row}>
                <Pressable
                  ref={getTriggerRef(item.id, 'itemName')}
                  style={[styles.roundedInput, styles.dropdownInput, { flex: 1 }]}
                  onPress={() =>
                    openDropdown(
                      getTriggerRef(item.id, 'itemName'),
                      itemNameOptions,
                      opt => updateItem(item.id, { itemName: opt.label, itemNameId: opt.id }),
                    )
                  }
                >
                  <Text style={{ color: item.itemName ? '#000' : '#a6a6a6', fontSize: sp(18), flex: 1 }}>
                    {item.itemName || 'Item Name'}
                  </Text>
                  <Ionicons name="chevron-down" size={sp(22)} color="#000" />
                </Pressable>

                <View style={styles.quantityWrap}>
                  <Text style={styles.quantityLabel}>Quantity</Text>
                  <TextInput
                    value={item.quantity}
                    onChangeText={val => updateItem(item.id, { quantity: val })}
                    keyboardType="numeric"
                    style={styles.quantityInput}
                    textAlign="center"
                  />
                </View>
              </View>

              {/* ── Item Description ── */}
              <TextInput
                value={item.itemDescription}
                onChangeText={val => updateItem(item.id, { itemDescription: val })}
                placeholder="Item Description"
                placeholderTextColor="#a6a6a6"
                style={styles.roundedInput}
              />

              {/* ── Product Id dropdown ── */}
              <Pressable
                ref={getTriggerRef(item.id, 'productId')}
                style={[styles.roundedInput, styles.dropdownInput]}
                onPress={() =>
                  openDropdown(
                    getTriggerRef(item.id, 'productId'),
                    productIdOptions,
                    opt => updateItem(item.id, { productId: opt.label, productIdValue: opt.id }),
                  )
                }
              >
                <Text style={{ color: item.productId ? '#000' : '#a6a6a6', fontSize: sp(18), flex: 1 }}>
                  {item.productId || 'Product Id'}
                </Text>
                <Ionicons name="chevron-down" size={sp(22)} color="#000" />
              </Pressable>

              {/* ── Product Description ── */}
              <TextInput
                value={item.productDescription}
                onChangeText={val => updateItem(item.id, { productDescription: val })}
                placeholder="Product Description"
                placeholderTextColor="#a6a6a6"
                style={styles.roundedInput}
              />

              {/* ── Row: Invoice Date + Install Date ── */}
              <View style={styles.row}>
                {/* Invoice Date */}
                <Pressable
                  style={[styles.roundedInput, styles.dropdownInput, { flex: 1 }]}
                  onPress={() => openDatePicker(item.id, 'invoiceDate', item.invoiceDate)}
                >
                  <Text style={{ color: item.invoiceDate ? '#000' : '#a6a6a6', fontSize: sp(18), flex: 1 }}>
                    {item.invoiceDate || 'Invoice Date'}
                  </Text>
                </Pressable>

                {/* Install Date */}
                <Pressable
                  style={[styles.roundedInput, styles.dropdownInput, { flex: 1 }]}
                  onPress={() => openDatePicker(item.id, 'installDate', item.installDate)}
                >
                  <Text style={{ color: item.installDate ? '#000' : '#a6a6a6', fontSize: sp(18), flex: 1 }}>
                    {item.installDate || 'Install Date'}
                  </Text>
                </Pressable>
              </View>

              {/* ── Row: Attachment Type + Attachment photo ── */}
              <View style={styles.row}>
                <Pressable
                  ref={getTriggerRef(item.id, 'attachmentType')}
                  style={[styles.roundedInput, styles.dropdownInput, { flex: 1 }]}
                  onPress={() =>
                    openDropdown(
                      getTriggerRef(item.id, 'attachmentType'),
                      attachmentTypeOptions,
                      opt => updateItem(item.id, { attachmentType: opt.label, attachmentTypeId: opt.id }),
                    )
                  }
                >
                  <Text style={{ color: item.attachmentType ? '#000' : '#a6a6a6', fontSize: sp(18), flex: 1 }}>
                    {item.attachmentType || 'Attachment Type'}
                  </Text>
                  <Ionicons name="chevron-down" size={sp(22)} color="#000" />
                </Pressable>

                {/* Dashed attachment box */}
                <Pressable
                  style={styles.attachBox}
                  onPress={() => pickDocument(item.id)}   // ← pass item.id
                >
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
                          <Ionicons name="document-outline" size={sp(20)} color={COLORS.primary} />
                          <Text style={styles.attachLabel} numberOfLines={1}>
                            {item.attachment.name}
                          </Text>
                        </View>
                      )}
                      <Pressable
                        style={styles.attachRemoveBtn}
                        onPress={() => updateItem(item.id, { attachment: null })}
                        hitSlop={6}
                      >
                        <Ionicons name="close" size={sp(13)} color="#fff" />
                      </Pressable>
                    </>
                  ) : (
                    <View style={styles.attachInner}>
                      <Ionicons name="cloud-upload-outline" size={sp(20)} color={COLORS.primary} />
                      <Text style={styles.attachLabel}>Attachment</Text>
                    </View>
                  )}
                </Pressable>
              </View>

            </View>
          ))}

          {/* ── + Add Item ── */}
          <Pressable
            style={styles.addItemBtn}
            onPress={() => setItems(prev => [...prev, blankItem()])}
          >
            <Text style={styles.addItemText}>+ Add Item</Text>
          </Pressable>

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
                  onChange={(_: DateTimePickerChangeEvent, date?: Date) => {
                    if (date) setDatePickerValue(date);
                  }}
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
            onChange={(event: DateTimePickerChangeEvent, date?: Date) => {
              const e = event as any;
              setDatePickerVisible(false);
              if (e.type === 'set' && date && pendingDateRef.current) {
                const { itemId, field } = pendingDateRef.current;
                updateItem(itemId, { [field]: formatDate(date) });
              }
              pendingDateRef.current = null;
            }}
            positiveButton={{ label: 'OK', textColor: COLORS.primary }}
            negativeButton={{ label: 'CANCEL', textColor: COLORS.primary }}
          />
        )
      )}

      {/* ── Anchored inline dropdown with search ── */}
      {dropdownVisible && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeDropdown}
        >
          <Pressable
            style={[
              styles.inlineDropdown,
              {
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
              },
            ]}
            onPress={e => e.stopPropagation()}
          >
            {/* Search bar */}
            <View style={styles.inlineSearchRow}>
              <Ionicons name="search-outline" size={sp(18)} color="#a6a6a6" />
              <TextInput
                autoFocus
                value={dropdownSearch}
                onChangeText={setDropdownSearch}
                placeholder="Search..."
                placeholderTextColor="#a6a6a6"
                style={styles.inlineSearchInput}
              />
              {dropdownSearch.length > 0 && (
                <Pressable onPress={() => setDropdownSearch('')} hitSlop={6}>
                  <Ionicons name="close-circle" size={sp(18)} color="#a6a6a6" />
                </Pressable>
              )}
            </View>

            {/* Results area */}
            {dropdownSearch.length < 3 ? (
              <Text style={styles.inlineSearchHint}>
                Type at least 3 characters to search
              </Text>
            ) : filteredOptions.length === 0 ? (
              <Text style={styles.inlineSearchHint}>No results found</Text>
            ) : (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: vs(200) }}
              >
                {filteredOptions.map((option, idx) => (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.inlineDropdownItem,
                      idx === filteredOptions.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => {
                      dropdownCallback.current?.(option);
                      closeDropdown();
                    }}
                  >
                    <Text style={styles.inlineDropdownText}>{option.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      )}

    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  redBg: {
    height: hp(10),
    backgroundColor: COLORS.primary,
  },

  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    paddingBottom: vs(40),
    overflow: 'hidden',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(20),
    paddingTop: vs(15),
    paddingBottom: vs(14),
  },
  headerTitle: {
    fontSize: sp(28),
    fontWeight: '400',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: scale(16),
    top: vs(14),
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDivider: {
    height: 2,
    backgroundColor: '#a6a6a6',
    marginHorizontal: scale(20),
  },

  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: vs(16),
    paddingBottom: vs(40),
    gap: vs(0),
  },

  // ── Item block ──
  itemBlock: {
    gap: vs(12),
    marginBottom: vs(20),
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(2),
  },
  itemHeaderText: {
    fontSize: sp(20),
    fontWeight: '600',
    color: COLORS.primary,
  },

  // ── Shared input ──
  roundedInput: {
    borderWidth: 1,
    borderColor: '#a6a6a6',
    borderRadius: scale(30),
    paddingHorizontal: scale(16),
    height: vs(45),
    fontSize: sp(18),
    color: '#000',
  },

  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // ── Row layout ──
  row: {
    flexDirection: 'row',
    gap: scale(10),
    alignItems: 'center',
  },

  // ── Quantity ──
  quantityWrap: {
    width: wp(30),
    borderWidth: 1,
    borderColor: '#a6a6a6',
    borderRadius: scale(30),
    height: vs(45),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  quantityLabel: {
    position: 'absolute',
    top: -vs(9),
    fontSize: sp(16),
    color: '#a6a6a6',
    backgroundColor: '#fff',
    paddingHorizontal: scale(4),
  },
  quantityInput: {
    fontSize: sp(20),
    color: '#000',
    fontWeight: '500',
    width: '100%',
    textAlign: 'center',
  },

  // ── Attachment ──
  attachBox: {
    flex: 1,
    height: vs(45),
    borderWidth: 1.5,
    borderColor: '#a6a6a6',
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  attachInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
  },
  attachLabel: {
    fontSize: sp(16),
    color: '#000',
    fontWeight: '400',
  },
  attachThumb: {
    width: '100%',
    height: '100%',
  },
  attachRemoveBtn: {
    position: 'absolute',
    top: scale(3),
    right: scale(3),
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Add Item ──
  addItemBtn: {
    alignSelf: 'center',
    paddingVertical: vs(10),
    marginBottom: vs(16),
  },
  addItemText: {
    fontSize: sp(20),
    color: COLORS.primary,
    fontWeight: '500',
  },

  // ── Submit ──
  submitBtn: {
    height: vs(50),
    backgroundColor: '#2B2B2B',
    borderRadius: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: sp(20),
    fontWeight: '400',
    letterSpacing: 1.2,
  },

  // ── Date picker (iOS modal) ──
  dateBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(16),
  },
  dateSheet: {
    backgroundColor: '#fff',
    borderRadius: scale(20),
    width: '100%',
    paddingTop: vs(16),
    paddingBottom: vs(12),
    paddingHorizontal: scale(12),
    elevation: 10,
  },
  dateSheetTitle: {
    fontSize: sp(18),
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: vs(8),
  },
  dateSheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: vs(12),
    paddingHorizontal: scale(8),
    gap: scale(12),
  },
  dateCancelBtn: {
    flex: 1,
    height: vs(44),
    borderRadius: scale(30),
    borderWidth: 1,
    borderColor: '#a6a6a6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCancelText: {
    fontSize: sp(16),
    color: '#555',
    fontWeight: '500',
  },
  dateConfirmBtn: {
    flex: 1,
    height: vs(44),
    borderRadius: scale(30),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateConfirmText: {
    fontSize: sp(16),
    color: '#fff',
    fontWeight: '600',
  },

  // ── Anchored inline dropdown ──
  inlineDropdown: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#a6a6a6',
    borderRadius: scale(12),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    zIndex: 999,
    overflow: 'hidden',
  },
  inlineSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: vs(8),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    gap: scale(8),
  },
  inlineSearchInput: {
    flex: 1,
    fontSize: sp(16),
    color: '#1C1C1E',
    paddingVertical: 0,
  },
  inlineSearchHint: {
    fontSize: sp(14),
    color: '#a6a6a6',
    textAlign: 'center',
    paddingVertical: vs(14),
    paddingHorizontal: scale(12),
  },
  inlineDropdownItem: {
    paddingHorizontal: scale(16),
    paddingVertical: vs(13),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  inlineDropdownText: {
    fontSize: sp(18),
    color: '#1C1C1E',
  },
});