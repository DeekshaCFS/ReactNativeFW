// src/screens/admin/AddFieldworkerModal.tsx

import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {addBulkFieldworkers} from '../../api/umEmployeeList/umEmployeeListService';
import {isIndiaCountryDetailsId} from '../../state/session';
import {styles} from './CRMScreen';
import {scale, sp, vs} from '../../utils/responsive';
import {ensureSuccess} from '../../utils/apiResponse';

type FieldworkerBulkInsertItem = {
  AE_FW_Contact: string;
  AE_FW_Firstname: string;
  AE_FW_Lastname: string;
};

type AddFieldworkerModalProps = {
  visible: boolean;
  onClose: () => void;
  ownerId: number;
  onAdded?: () => void;
};

type FieldworkerRow = {
  tempSrNo: number;
  firstName: string;
  lastName: string;
  contact: string;
};

type RowErrors = {
  firstName?: string;
  lastName?: string;
  contact?: string;
};

const MAX_FIELDWORKERS = 5;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createEmptyRow = (tempSrNo: number): FieldworkerRow => ({
  tempSrNo,
  firstName: '',
  lastName: '',
  contact: '',
});

const AddFieldworkerModal: React.FC<AddFieldworkerModalProps> = ({
  visible,
  onClose,
  ownerId,
  onAdded,
}) => {
  const [rows, setRows] = useState<FieldworkerRow[]>([createEmptyRow(0)]);
  const [rowErrors, setRowErrors] = useState<Record<number, RowErrors>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1 = India (Phone Number), anything else = NRI (Email Id).
  const isIndia = useMemo(() => isIndiaCountryDetailsId(), [visible]);

  const resetForm = () => {
    setRows([createEmptyRow(0)]);
    setRowErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const updateRow = (index: number, patch: Partial<FieldworkerRow>) => {
    setRows(previous =>
      previous.map((row, rowIndex) =>
        rowIndex === index ? {...row, ...patch} : row,
      ),
    );
    setRowErrors(previous => {
      if (!previous[index]) {
        return previous;
      }
      const next = {...previous};
      delete next[index];
      return next;
    });
  };

  const hasDuplicateContact = (index: number, contact: string) =>
    rows.some(
      (row, rowIndex) =>
        rowIndex !== index &&
        row.contact.trim().toLowerCase() === contact.trim().toLowerCase(),
    );

  const validateRow = (index: number): RowErrors | null => {
    const row = rows[index];
    const errors: RowErrors = {};
    const firstName = row.firstName.trim();
    const lastName = row.lastName.trim();
    const contact = row.contact.trim();

    if (!firstName) {
      errors.firstName = 'Please enter first name';
    } else if (row.firstName.includes(' ')) {
      errors.firstName = 'Space is not allowed';
    }

    if (!lastName) {
      errors.lastName = 'Please enter last name';
    } else if (row.lastName.includes(' ')) {
      errors.lastName = 'Space is not allowed';
    }

    if (
      !errors.firstName &&
      !errors.lastName &&
      firstName.toLowerCase() === lastName.toLowerCase()
    ) {
      errors.lastName = 'Please use different first and last name';
    }

    if (isIndia) {
      if (!contact) {
        errors.contact = 'Please enter phone number';
      } else if (contact.length !== 10) {
        errors.contact = 'Please enter a valid phone number';
      } else if (hasDuplicateContact(index, contact)) {
        errors.contact = 'Please use a different phone number';
      }
    } else {
      if (!contact) {
        errors.contact = 'Please enter your email id';
      } else if (!EMAIL_PATTERN.test(contact)) {
        errors.contact = 'Please enter a valid email id';
      } else if (hasDuplicateContact(index, contact)) {
        errors.contact = 'Please use a different email id';
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  const handleAddMore = () => {
    if (rows.length >= MAX_FIELDWORKERS) {
      Alert.alert('Add Fieldworker', 'Not allowed.');
      return;
    }

    const lastIndex = rows.length - 1;
    const errors = validateRow(lastIndex);
    if (errors) {
      setRowErrors(previous => ({...previous, [lastIndex]: errors}));
      return;
    }

    setRows(previous => [...previous, createEmptyRow(previous.length)]);
  };

  const handleRemoveRow = (index: number) => {
    if (index < 1) {
      Alert.alert('Add Fieldworker', 'Not allowed.');
      return;
    }

    setRows(previous => previous.filter((_, rowIndex) => rowIndex !== index));
    setRowErrors(previous => {
      const next: Record<number, RowErrors> = {};
      Object.keys(previous).forEach(key => {
        const keyIndex = Number(key);
        if (keyIndex === index) {
          return;
        }
        next[keyIndex > index ? keyIndex - 1 : keyIndex] = previous[keyIndex];
      });
      return next;
    });
  };

  const hasDuplicateContactsAcrossRows = () => {
    const seen = new Set<string>();
    for (const row of rows) {
      const contact = row.contact.trim().toLowerCase();
      if (!contact) {
        continue;
      }
      if (seen.has(contact)) {
        return true;
      }
      seen.add(contact);
    }
    return false;
  };

  const handleSubmit = async () => {
    const nextRowErrors: Record<number, RowErrors> = {};
    rows.forEach((_, index) => {
      const errors = validateRow(index);
      if (errors) {
        nextRowErrors[index] = errors;
      }
    });

    if (Object.keys(nextRowErrors).length > 0) {
      setRowErrors(nextRowErrors);
      Alert.alert('Add Fieldworker', 'Invalid data.');
      return;
    }

    if (hasDuplicateContactsAcrossRows()) {
      Alert.alert('Add Fieldworker', 'Duplicate Contact number not allowed !');
      return;
    }

    const fieldworkerBulkInsertArray: FieldworkerBulkInsertItem[] = rows.map(
      row => ({
        AE_FW_Contact: row.contact.trim(),
        AE_FW_Firstname: row.firstName.trim(),
        AE_FW_Lastname: row.lastName.trim(),
      }),
    );

    const payload = {
      UserId: ownerId,
      CreatedBy: ownerId,
      UserGroupCode: 2,
      ServicezoneId: 0,
      DesignationId: 1,
      FieldworkerBulkInsertArray: fieldworkerBulkInsertArray,
    };

    setIsSubmitting(true);
    try {
      ensureSuccess(await addBulkFieldworkers([payload]));
      Alert.alert('Add Fieldworker', 'Fieldworker(s) added successfully.');
      resetForm();
      onAdded?.();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to add fieldworker right now.';
      Alert.alert('Add Fieldworker', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>Add Fieldworker</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.modalCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled">
            <View style={styles.howToRow}>
              <View style={styles.howToPlayIcon}>
                <Text style={styles.howToPlayIconText}>▶</Text>
              </View>
              <Text style={styles.howToText}>How to add Fieldworker ?</Text>
            </View>

            {rows.map((row, index) => {
              const errors = rowErrors[index] ?? {};
              const isLastRow = index === rows.length - 1;
              return (
                <View key={row.tempSrNo} style={fieldworkerCardStyle}>
                  <View style={fieldworkerCardHeaderStyle}>
                    <Text style={fieldworkerCardTitleStyle}>
                      Fieldworker #{index + 1}
                    </Text>
                    {index > 0 ? (
                      <TouchableOpacity
                        onPress={() => handleRemoveRow(index)}>
                        <Text style={fieldworkerRemoveIconStyle}>✕</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <View style={styles.fieldRow}>
                    <View style={styles.floatingFieldHalf}>
                      <Text style={styles.floatingLabel}>First Name</Text>
                      <TextInput
                        style={styles.floatingInput}
                        value={row.firstName}
                        onChangeText={value =>
                          updateRow(index, {firstName: value})
                        }
                        placeholder="First Name"
                        placeholderTextColor="#9aa0a6"
                      />
                    </View>
                    <View style={styles.floatingFieldHalf}>
                      <Text style={styles.floatingLabel}>Last Name</Text>
                      <TextInput
                        style={styles.floatingInput}
                        value={row.lastName}
                        onChangeText={value =>
                          updateRow(index, {lastName: value})
                        }
                        placeholder="Last Name"
                        placeholderTextColor="#9aa0a6"
                      />
                    </View>
                  </View>
                  {errors.firstName || errors.lastName ? (
                    <Text style={styles.errorText}>
                      {errors.firstName ?? errors.lastName}
                    </Text>
                  ) : null}

                  <View style={styles.floatingFieldFull}>
                    <Text style={styles.floatingLabel}>
                      {isIndia ? 'Phone Number' : 'Email Id'}
                    </Text>
                    <TextInput
                      style={styles.floatingInput}
                      value={row.contact}
                      onChangeText={value =>
                        updateRow(index, {contact: value})
                      }
                      placeholder={
                        isIndia ? 'Phone Number' : 'Email Id'
                      }
                      placeholderTextColor="#9aa0a6"
                      keyboardType={isIndia ? 'phone-pad' : 'email-address'}
                      autoCapitalize="none"
                      maxLength={isIndia ? 10 : undefined}
                    />
                  </View>
                  {errors.contact ? (
                    <Text style={styles.errorText}>{errors.contact}</Text>
                  ) : null}

                  {isLastRow && rows.length < MAX_FIELDWORKERS ? (
                    <TouchableOpacity
                      style={addMoreButtonStyle}
                      onPress={handleAddMore}>
                      <Text style={styles.howToText}>+ Add More</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleSubmit}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.addButtonText}>SUBMIT</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const fieldworkerCardStyle = {
  borderWidth: 1,
  borderColor: '#d5d7db',
  borderRadius: scale(8),
  padding: scale(14),
  marginBottom: vs(16),
} as const;

const fieldworkerCardHeaderStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  marginBottom: vs(12),
};

const fieldworkerCardTitleStyle = {
  color: '#c3002f',
  fontSize: sp(14),
  fontWeight: '700' as const,
};

const fieldworkerRemoveIconStyle = {
  color: '#c3002f',
  fontSize: sp(16),
  fontWeight: '700' as const,
};

const addMoreButtonStyle = {
  alignSelf: 'center' as const,
  marginTop: vs(4),
};

export default AddFieldworkerModal;