// src/screens/technician/main/TaskInputScreen.tsx

import React, { useEffect, useState } from 'react';
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
  Modal,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp, HEADER_TOP_PADDING, hp } from '../../../utils/responsive';
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

export default function TaskInputScreen({ navigation, route }: any) {
  const { routeTask } = route.params as { routeTask: { Id: number; [key: string]: any } };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fields, setFields] = useState<CustomFieldDTOResultData[]>([]);

  const [values, setValues] = useState<Record<number, string>>({});

  const [activeDatePicker, setActiveDatePicker] = useState<number | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<CustomFieldDTOResultData | null>(null);

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
        Alert.alert('Error', 'Could not load task input fields.');
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

  const handleDateChange = (fieldId: number) => (event: DateTimePickerChangeEvent, date?: Date) => {
    const e = event as any;
    setActiveDatePicker(null);
    if (e.type === 'dismissed' || !date) return;
    setFieldValue(fieldId, formatDate(date));
  };

  const handleDropdownSelect = (fieldId: number, value: string) => {
    setActiveDropdown(null);
    if (value === 'Select') {
      clearFieldValue(fieldId);
      return;
    }
    setFieldValue(fieldId, value);
  };

  // Boolean values are always written as canonical 'True'/'False', but prefill
  // data from the server may not match that casing (Android compares with
  // equalsIgnoreCase). Normalize reads so the correct Yes/No button highlights.
  const isBooleanValue = (fieldId: number, target: 'True' | 'False') =>
    (values[fieldId] ?? '').toLowerCase() === target.toLowerCase();

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (fields.length === 0) {
      Alert.alert('No Input', 'Please Provide an Input to proceed !!');
      return;
    }

    const missing = fields.filter(f => f.IsRequired && f.FieldId != null && !values[f.FieldId]?.trim());
    if (missing.length > 0) {
      Alert.alert('Required', `Field '${missing[0].Label}' is required!`);
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
        Alert.alert('Success', res.Message || 'Task input saved successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', res.Message || 'Failed to save task input.');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not save task input. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <View style={styles.redBg}/>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Task Input</Text>
        <Pressable style={styles.closeBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="close" size={sp(16)} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.headerDivider} />

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: vs(40) }} />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.columnHeaderRow}>
            <Text style={[styles.columnHeaderText, styles.colSrNo]}>Sr.No</Text>
            <Text style={[styles.columnHeaderText, styles.colLabel]}>Label</Text>
            <Text style={[styles.columnHeaderText, styles.colInput]}>Input</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {fields.length === 0 ? (
              <Text style={styles.emptyText}>No custom input fields configured for this task.</Text>
            ) : (
              fields.map(field => (
                <View key={field.FieldId} style={styles.fieldRow}>
                  <Text style={[styles.cellText, styles.colSrNo]}>{field.SerialNo}</Text>

                  <Text style={[styles.cellText, styles.colLabel]}>
                    {field.Label}
                    {field.IsRequired && <Text style={styles.requiredMark}> *</Text>}
                  </Text>

                  <View style={styles.colInput}>
                    {field.FieldTypeId === FIELD_TYPE.NUMBER && (
                      <View style={styles.floatingFieldBox}>
                        <Text style={styles.floatingLabel}>Number</Text>
                        <TextInput
                          style={styles.floatingValueInput}
                          keyboardType="numeric"
                          value={values[field.FieldId] ?? ''}
                          onChangeText={t => {
                            const cleaned = t.replace(/[^0-9]/g, '');
                            if (cleaned.length === 0) {
                              clearFieldValue(field.FieldId);
                            } else {
                              setFieldValue(field.FieldId, cleaned);
                            }
                          }}
                          placeholder="0"
                          placeholderTextColor="#c7c7c7"
                        />
                      </View>
                    )}

                    {field.FieldTypeId === FIELD_TYPE.TEXT && (
                      <View style={styles.floatingFieldBox}>
                        <Text style={styles.floatingLabel}>Text</Text>
                        <TextInput
                          style={styles.floatingValueInput}
                          value={values[field.FieldId] ?? ''}
                          onChangeText={t => {
                            if (t.length === 0) {
                              clearFieldValue(field.FieldId);
                            } else {
                              setFieldValue(field.FieldId, t);
                            }
                          }}
                          placeholder="Enter text"
                          placeholderTextColor="#c7c7c7"
                        />
                      </View>
                    )}

                    {field.FieldTypeId === FIELD_TYPE.DATE && (
                      <>
                        <Pressable
                          style={styles.floatingFieldBox}
                          onPress={() => setActiveDatePicker(field.FieldId)}
                        >
                          <Text style={styles.floatingLabel}>Date</Text>
                          <View style={styles.dateValueRow}>
                            <Text
                              style={
                                values[field.FieldId] ? styles.floatingValueText : styles.floatingPlaceholder
                              }
                            >
                              {values[field.FieldId] || 'dd-mm-yyyy'}
                            </Text>
                            <Ionicons name="calendar" size={sp(18)} color={COLORS.primary} />
                          </View>
                        </Pressable>
                        {activeDatePicker === field.FieldId && (
                          <DateTimePicker
                            value={new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleDateChange(field.FieldId)}
                          />
                        )}
                      </>
                    )}

                    {field.FieldTypeId === FIELD_TYPE.BOOLEAN && (
                      <View style={styles.boolGroup}>
                        <Pressable
                          style={styles.radioRow}
                          onPress={() => setFieldValue(field.FieldId, 'False')}
                          hitSlop={6}
                        >
                          <View
                            style={[
                              styles.radioOuter,
                              isBooleanValue(field.FieldId, 'False') && styles.radioOuterActive,
                            ]}
                          >
                            {isBooleanValue(field.FieldId, 'False') && <View style={styles.radioInner} />}
                          </View>
                          <Text style={styles.radioLabel}>NO</Text>
                        </Pressable>

                        <Pressable
                          style={styles.radioRow}
                          onPress={() => setFieldValue(field.FieldId, 'True')}
                          hitSlop={6}
                        >
                          <View
                            style={[
                              styles.radioOuter,
                              isBooleanValue(field.FieldId, 'True') && styles.radioOuterActive,
                            ]}
                          >
                            {isBooleanValue(field.FieldId, 'True') && <View style={styles.radioInner} />}
                          </View>
                          <Text style={styles.radioLabel}>Yes</Text>
                        </Pressable>
                      </View>
                    )}

                    {field.FieldTypeId === FIELD_TYPE.DROPDOWN && (
                      <Pressable style={styles.pillInput} onPress={() => setActiveDropdown(field)}>
                        <Text style={values[field.FieldId] ? styles.pillValueText : styles.pillPlaceholder}>
                          {values[field.FieldId] || 'Select'}
                        </Text>
                        <Ionicons name="chevron-down" size={sp(18)} color="#000" />
                      </Pressable>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <Pressable
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>UPDATE</Text>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      )}

      {/* Dropdown picker modal */}
      <Modal
        visible={activeDropdown !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDropdown(null)}
      >
        <Pressable style={styles.dropdownOverlay} onPress={() => setActiveDropdown(null)}>
          <View style={styles.dropdownSheet}>
            <Text style={styles.dropdownTitle}>{activeDropdown?.Label}</Text>
            <FlatList
              data={['Select', ...(activeDropdown?.DropdownValue ?? [])]}
              keyExtractor={(item, idx) => `${item}-${idx}`}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.dropdownOption}
                  onPress={() => activeDropdown && handleDropdownSelect(activeDropdown.FieldId, item)}
                >
                  <Text style={styles.dropdownOptionText}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  redBg: { 
    height: HEADER_TOP_PADDING + hp(2), 
    backgroundColor: COLORS.primary,
  },

  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: vs(10),
    paddingBottom: vs(14),
  },
  headerTitle: {
    color: '#000',
    fontSize: sp(24),
    fontWeight: '400',
    textAlign: 'center',
  },
  closeBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDivider: {
    height: 2,
    backgroundColor: '#a6a6a6',
    marginHorizontal: scale(20),
  },
  columnHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingTop: vs(14),
    paddingBottom: vs(8),
  },
  columnHeaderText: {
    fontSize: sp(18),
    fontWeight: '400',
  },
  colSrNo: {
    flex: 0.5,
  },
  colLabel: {
    flex: 1,
  },
  colInput: {
    flex: 1.8,
  },
  listContent: {
    padding: scale(18),
    paddingTop: vs(6),
    paddingBottom: vs(20),
  },
  emptyText: {
    textAlign: 'center',
    color: '#ababab',
    fontSize: sp(16),
    marginTop: vs(40),
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(22),
  },
  cellText: {
    fontSize: sp(20),
    fontWeight: '400',
  },
  requiredMark: {
    color: COLORS.primary,
  },

  // ── Floating-label box (Number / Text / Date) ──
  floatingFieldBox: {
    borderWidth: 1,
    borderColor: '#a6a6a6',
    borderRadius: scale(10),
    paddingHorizontal: scale(14),
    paddingTop: vs(10),
    paddingBottom: vs(8),
    backgroundColor: '#fff',
  },
  floatingLabel: {
    position: 'absolute',
    top: -vs(9),
    left: scale(10),
    fontSize: sp(13),
    color: '#a6a6a6',
    backgroundColor: '#fff',
    paddingHorizontal: scale(4),
  },
  floatingValueInput: {
    fontSize: sp(20),
    fontWeight: '600',
    color: '#000',
    padding: 0,
  },
  floatingValueText: {
    fontSize: sp(20),
    fontWeight: '600',
    color: '#000',
  },
  floatingPlaceholder: {
    fontSize: sp(18),
    color: '#c7c7c7',
  },
  dateValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // ── Boolean radio group ──
  boolGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(28),
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  radioOuter: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    borderWidth: 2,
    borderColor: '#a6a6a6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: scale(11),
    height: scale(11),
    borderRadius: scale(6),
    backgroundColor: COLORS.primary,
  },
  radioLabel: {
    fontSize: sp(16),
    fontWeight: '600',
    color: '#222',
  },

  // ── Dropdown pill ──
  pillInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#a6a6a6',
    borderRadius: scale(24),
    paddingHorizontal: scale(16),
    paddingVertical: vs(11),
    backgroundColor: '#fff',
  },
  pillValueText: {
    fontSize: sp(17),
    color: '#000',
  },
  pillPlaceholder: {
    fontSize: sp(17),
    color: '#a6a6a6',
  },

  // ── Submit ──
  submitBtn: {
    backgroundColor: '#2B2B2B',
    marginHorizontal: scale(16),
    marginBottom: vs(16),
    height: vs(50),
    borderRadius: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: sp(18),
    fontWeight: '400',
    letterSpacing: 1.2,
  },

  // ── Dropdown modal ──
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dropdownSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(16),
    borderTopRightRadius: scale(16),
    maxHeight: '60%',
    paddingBottom: vs(10),
  },
  dropdownTitle: {
    fontSize: sp(15),
    fontWeight: '700',
    color: '#222',
    padding: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownOption: {
    paddingHorizontal: scale(18),
    paddingVertical: vs(13),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f3f3',
  },
  dropdownOptionText: {
    fontSize: sp(14),
    color: '#333',
  },
});