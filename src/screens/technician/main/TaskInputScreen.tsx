// src/screens/technician/main/TaskInputScreen.tsx
//
// Java: AddCustomLabelInput_FW (add_custom_label.xml + task_closure_custom_label_row.xml).
// A white rounded sheet under the FieldWeb header (no bottom bar) with a Sr.No / Label / Input
// table; every row is 35dp of 14sp text next to an outlined 34dp-radius input.

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import Modal from '../../../components/AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { COLORS } from '../../../theme/theme';
import { ms, sp, useAppHeaderHeight } from '../../../utils/responsive';
import OutlinedInput from '../../../components/OutlinedInput';
import { getCustomFieldData, postTaskCustomField } from '../../../api/users/usersService';
import type { CustomFieldDTOResultData } from '../../../api/users/users.types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIELD_TYPE = {
  NUMBER: 1,
  TEXT: 2,
  DATE: 3,
  BOOLEAN: 4,
  DROPDOWN: 5,
} as const;

const formatDate = (date: Date): string => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const toast = (msg: string) => ToastAndroid.show(msg, ToastAndroid.SHORT);

export default function TaskInputScreen({ navigation, route }: any) {
  const { routeTask, returnTo } = route.params as {
    routeTask: { Id: number; [key: string]: any };
    returnTo?: { name: string; params?: any };
  };
  const headerHeight = useAppHeaderHeight();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields] = useState<CustomFieldDTOResultData[]>([]);

  const [values, setValues] = useState<Record<number, string>>({});

  const [activeDatePicker, setActiveDatePicker] = useState<number | null>(null);
  const [dropdown, setDropdown] = useState<{
    field: CustomFieldDTOResultData;
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const dropdownRefs = useRef<Record<number, View | null>>({});

  // Close/save go back to whichever screen opened the sheet (Java pops the fragment).
  const closeSheet = () => {
    const target = returnTo ?? { name: 'TaskExecution', params: { task: routeTask } };
    navigation.navigate(target.name, target.params);
  };

  // ─── Load field definitions ────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const uid = await AsyncStorage.getItem('uid');
        const userId = Number(uid);

        const res = await getCustomFieldData({ UserId: userId, TaskId: routeTask.Id });
        const list = res.ResultData ?? [];
        setFields(list);

        const prefill: Record<number, string> = {};
        list.forEach(f => {
          if (f.UserValue && f.FieldId != null) prefill[f.FieldId] = f.UserValue;
        });
        setValues(prefill);
      } catch (err) {
        ToastAndroid.show('Could not load task input fields.', ToastAndroid.SHORT);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ─── Field updates ──────────────────────────────────────────────────────────

  const setFieldValue = (fieldId: number, value: string) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
  };

  // Matches Android's afterTextChanged behavior: clearing a NUMBER/TEXT field
  // back to empty removes its entry entirely instead of keeping an empty string.
  const clearFieldValue = (fieldId: number) => {
    setValues(prev => {
      if (!(fieldId in prev)) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const handleDateChange = (fieldId: number) => (_event: DateTimePickerChangeEvent, date: Date) => {
    setActiveDatePicker(null);
    setFieldValue(fieldId, formatDate(date));
  };

  const handleDropdownSelect = (fieldId: number, value: string) => {
    setDropdown(null);
    if (value === 'Select') {
      clearFieldValue(fieldId);
      return;
    }
    setFieldValue(fieldId, value);
  };

  const openDropdown = (field: CustomFieldDTOResultData) => {
    const node = dropdownRefs.current[field.FieldId];
    node?.measureInWindow((x, y, width) => setDropdown({ field, top: y, left: x, width }));
  };

  // Boolean values are always written as canonical 'True'/'False', but prefill
  // data from the server may not match that casing (Android compares with
  // equalsIgnoreCase). Normalize reads so the correct Yes/No button highlights.
  const isBooleanValue = (fieldId: number, target: 'True' | 'False') =>
    (values[fieldId] ?? '').toLowerCase() === target.toLowerCase();

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    // Java: nothing entered at all -> one failure message, before any required-field check.
    if (Object.keys(values).length === 0) {
      ToastAndroid.show('Please Provide an Input to proceed !!', ToastAndroid.SHORT);
      return;
    }

    const missing = fields.filter(f => f.IsRequired && f.FieldId != null && !values[f.FieldId]?.trim());
    if (missing.length > 0) {
      toast(`Field '${missing[missing.length - 1].Label}' is required!`);
      return;
    }

    try {
      setSubmitting(true);
      const uid = await AsyncStorage.getItem('uid');
      const userId = Number(uid);

      // Parity with Android (AddCustomLabelInput_FW#saveCustomTaskInput):
      // only fields the user actually touched (or that were prefilled) are
      // sent. Untouched optional fields are omitted entirely rather than
      // sent with an empty UserValue.
      const payload: CustomFieldDTOResultData[] = fields
        .filter(f => f.FieldId != null && Object.prototype.hasOwnProperty.call(values, f.FieldId))
        .map(f => ({
          SerialNo: f.SerialNo,
          FieldId: f.FieldId,
          Label: f.Label,
          IsRequired: f.IsRequired,
          UserValue: values[f.FieldId!] ?? '',
          FieldTypeId: f.FieldTypeId,
          FieldTypeName: f.FieldTypeName,
          InputId: f.InputId,
        }));

      const res = await postTaskCustomField({ UserId: userId, TaskId: routeTask.Id }, payload);
      if (res.Code === '200') {
        toast(res.Message || 'Task input saved successfully.');
        closeSheet();
      } else {
        toast(res.Message || 'Failed to save task input.');
      }
    } catch (err) {
      toast('Could not save task input. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const renderInput = (field: CustomFieldDTOResultData) => {
    const id = field.FieldId;
    switch (field.FieldTypeId) {
      case FIELD_TYPE.NUMBER:
        return (
          <OutlinedInput
            style={styles.box}
            placeholder="Number"
            placeholderTextColor={COLORS.lightGray}
            keyboardType="numeric"
            value={values[id] ?? ''}
            onChangeText={t => {
              const cleaned = t.replace(/[^0-9]/g, '');
              if (cleaned.length === 0) clearFieldValue(id);
              else setFieldValue(id, cleaned);
            }}
          />
        );
      case FIELD_TYPE.TEXT:
        return (
          <OutlinedInput
            style={styles.box}
            placeholder="Text"
            placeholderTextColor={COLORS.lightGray}
            autoCapitalize="words"
            value={values[id] ?? ''}
            onChangeText={t => {
              // Java edtText digits: letters, numbers and space only.
              const cleaned = t.replace(/[^A-Za-z0-9 ]/g, '');
              if (cleaned.length === 0) clearFieldValue(id);
              else setFieldValue(id, cleaned);
            }}
          />
        );
      case FIELD_TYPE.DATE:
        return (
          <>
            <Pressable style={styles.dateWrap} onPress={() => setActiveDatePicker(id)}>
              <View style={[styles.box, styles.dateBox]}>
                <Text style={[styles.dateText, !values[id] && { color: COLORS.lightGray }]}>
                  {values[id] || 'Date'}
                </Text>
                <Ionicons name="calendar" size={ms(20)} color={COLORS.primary} />
              </View>
              {!!values[id] && <Text style={styles.floatLabel}>Date</Text>}
            </Pressable>
            {activeDatePicker === id && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onValueChange={handleDateChange(id)}
                onDismiss={() => setActiveDatePicker(null)}
              />
            )}
          </>
        );
      case FIELD_TYPE.BOOLEAN:
        return (
          <View style={styles.boolGroup}>
            {(['False', 'True'] as const).map(v => (
              <Pressable
                key={v}
                style={styles.radioRow}
                onPress={() => {
                  Keyboard.dismiss();
                  setFieldValue(id, v);
                }}
                hitSlop={6}
              >
                <View style={[styles.radioOuter, isBooleanValue(id, v) && styles.radioOuterActive]}>
                  {isBooleanValue(id, v) && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>{v === 'True' ? 'Yes' : 'NO'}</Text>
              </Pressable>
            ))}
          </View>
        );
      case FIELD_TYPE.DROPDOWN:
        return (
          <Pressable
            ref={node => {
              dropdownRefs.current[id] = node;
            }}
            collapsable={false}
            style={styles.spinner}
            onPress={() => openDropdown(field)}
          >
            <Text style={styles.spinnerText} numberOfLines={1}>
              {values[id] || 'Select'}
            </Text>
            <Ionicons name="chevron-down" size={ms(20)} color={COLORS.textBlack} />
          </Pressable>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.root, { paddingTop: headerHeight }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheet}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Add Task Input</Text>
          <Pressable style={styles.closeBtn} onPress={closeSheet} hitSlop={8}>
            <Ionicons name="close" size={ms(18)} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.divider} />

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: ms(40) }} />
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: ms(30) }}
          >
            <View style={styles.columnHeaderRow}>
              <Text style={[styles.columnHeaderText, styles.colSrNo]}>Sr.No</Text>
              <Text style={[styles.columnHeaderText, styles.colLabel]}>Label</Text>
              <Text style={[styles.columnHeaderText, styles.colInput, { textAlign: 'center' }]}>Input</Text>
            </View>

            <View style={styles.list}>
              {fields.map(field => (
                <View key={field.FieldId} style={styles.fieldRow}>
                  <Text style={[styles.cellText, styles.colSrNo]}>{field.SerialNo}</Text>
                  <Text style={[styles.cellText, styles.colLabel]}>{field.Label}</Text>
                  <View style={styles.colInput}>{renderInput(field)}</View>
                </View>
              ))}
            </View>

            <Pressable
              style={[styles.updateBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.updateBtnText}>UPDATE</Text>
              )}
            </Pressable>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Spinner popup (Java's simple_spinner_dropdown_item list, anchored on the field) */}
      <Modal
        visible={dropdown !== null}
        transparent
        animationType="none"
        onRequestClose={() => setDropdown(null)}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setDropdown(null)}>
          {dropdown && (
            <View
              style={[
                styles.popup,
                { top: dropdown.top, left: dropdown.left, width: dropdown.width },
              ]}
            >
              <ScrollView style={{ maxHeight: ms(250) }} showsVerticalScrollIndicator={false}>
                {['Select', ...(dropdown.field.DropdownValue ?? [])].map((item, idx) => (
                  <Pressable
                    key={`${item}-${idx}`}
                    style={styles.popupItem}
                    onPress={() => handleDropdownSelect(dropdown.field.FieldId, item)}
                  >
                    <Text style={styles.popupItemText} numberOfLines={1}>
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primary },
  sheet: {
    flex: 1,
    marginTop: ms(5),
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    overflow: 'hidden',
  },

  // ── Title ──
  titleRow: { height: ms(40), alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: sp(22), color: COLORS.textBlack, textAlign: 'center' },
  closeBtn: {
    position: 'absolute',
    right: ms(16),
    top: ms(6),
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  divider: {
    height: 1,
    marginVertical: ms(8),
    marginHorizontal: ms(20),
    backgroundColor: '#aaaaaa', // @android:color/darker_gray
  },

  // ── Table header / rows (weightSum 3 → 0.5 / 1 / 1.5) ──
  columnHeaderRow: { flexDirection: 'row', margin: ms(5) },
  columnHeaderText: { fontSize: sp(14), fontWeight: 'bold', color: COLORS.ink },
  colSrNo: { flex: 0.5 },
  colLabel: { flex: 1 },
  colInput: { flex: 1.5 },
  list: { margin: ms(5) },
  fieldRow: { flexDirection: 'row', margin: ms(2), alignItems: 'flex-start' },
  cellText: { height: ms(35), fontSize: sp(14), color: COLORS.ink, textAlignVertical: 'center' },

  // ── Outlined inputs (TextInputLayoutStyle: 1dp light_gray stroke, 34dp radius) ──
  box: {
    height: ms(35),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: ms(34),
    paddingHorizontal: ms(10),
    paddingVertical: 0,
    fontSize: sp(16),
    color: COLORS.ink,
    marginBottom: ms(24), // room Material reserves for the error line
  },
  dateWrap: { marginBottom: 0 },
  dateBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { fontSize: sp(16), color: COLORS.ink },
  floatLabel: {
    position: 'absolute',
    top: -ms(8),
    left: ms(14),
    paddingHorizontal: ms(4),
    backgroundColor: COLORS.white,
    fontSize: sp(12),
    color: COLORS.lightGray,
  },

  // ── Yes / No radios ──
  boolGroup: { flexDirection: 'row', alignItems: 'center', minHeight: ms(35) },
  radioRow: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: ms(6) },
  radioOuter: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    borderWidth: 2,
    borderColor: COLORS.darkGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: COLORS.primary },
  radioInner: { width: ms(10), height: ms(10), borderRadius: ms(5), backgroundColor: COLORS.primary },
  radioLabel: { marginLeft: ms(8), fontSize: sp(16), color: COLORS.ink },

  // ── Spinner (bg_spinner: 30dp tall, 34dp radius, 12dp side padding) ──
  spinner: {
    height: ms(30),
    margin: ms(5),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: ms(34),
    paddingHorizontal: ms(12),
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spinnerText: { flex: 1, fontSize: sp(14), color: COLORS.textBlack },

  // ── Update button (rounded_button_new: #353935, 34dp radius, min height 48dp) ──
  updateBtn: {
    minHeight: ms(48),
    marginHorizontal: ms(30),
    marginTop: ms(10),
    borderRadius: ms(34),
    backgroundColor: '#353935',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  updateBtnText: { color: COLORS.white, fontSize: sp(18), fontWeight: '500' },

  // ── Dropdown popup ──
  popup: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: ms(4),
    elevation: 8,
    overflow: 'hidden',
  },
  popupItem: { minHeight: ms(48), justifyContent: 'center', paddingHorizontal: ms(16) },
  popupItemText: { fontSize: sp(16), color: COLORS.textBlack },
});
