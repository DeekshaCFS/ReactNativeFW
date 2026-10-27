// src/screens/admin/AddFieldworkerModal.tsx

import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from '../../components/AppModal';
import {addBulkFieldworkers} from '../../api/umEmployeeList/umEmployeeListService';
import {isIndiaCountryDetailsId} from '../../state/session';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import OutlinedInput from '../../components/OutlinedInput';
import {COLORS} from '../../theme/theme';
import {HEADER_CONTENT_HEIGHT} from '../../components/AppHeader';
import {scale, sp} from '../../utils/responsive';
import {ensureSuccess} from '../../utils/apiResponse';
import { showFailureMsg, showSuccessMsg } from '../../utils/toast';

import {useTranslation} from 'react-i18next';
import { tr } from '../../i18n/tr';
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
  const {t} = useTranslation();
  const [rows, setRows] = useState<FieldworkerRow[]>([createEmptyRow(0)]);
  const [rowErrors, setRowErrors] = useState<Record<number, RowErrors>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const insets = useSafeAreaInsets();
  // Inside a Modal the safe-area inset can read 0, so fall back to the Android status bar height.
  const statusBarHeight = Math.max(
    insets.top,
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  );

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
      showFailureMsg(t('not_allowed'));
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
      showFailureMsg(t('not_allowed'));
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
      showFailureMsg(t('rn_invalid_data'));
      return;
    }

    if (hasDuplicateContactsAcrossRows()) {
      showFailureMsg(t('rn_duplicate_contact_number_not_allowed'));
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
      showSuccessMsg(t('rn_fieldworker_s_added_successfully'));
      resetForm();
      onAdded?.();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to add fieldworker right now.';
      showFailureMsg(message || 'Add Fieldworker');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}>
      <View style={screenStyle}>
        <View style={[headerStyle, {paddingTop: statusBarHeight}]}>
          <View style={headerRowStyle}>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Ionicons name="arrow-back" size={scale(26)} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={headerTitleStyle}>{t('empList')}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={scrollContentStyle}
          keyboardShouldPersistTaps="handled">
          <View style={topRowStyle}>
            <View style={howToStyle}>
              <View style={playIconStyle}>
                <Ionicons name="play" size={scale(11)} color="#FFFFFF" />
              </View>
              <Text style={howToTextStyle}>{t('haddtech')}</Text>
            </View>
            <TouchableOpacity
              style={submitPillStyle}
              onPress={handleSubmit}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={submitPillTextStyle}>{t('submit')}</Text>
              )}
            </TouchableOpacity>
          </View>

          {rows.map((row, index) => {
            const errors = rowErrors[index] ?? {};
            return (
              <View key={row.tempSrNo}>
                <View style={fieldworkerCardStyle}>
                  <View style={fieldworkerCardHeaderStyle}>
                    <Text style={fieldworkerCardTitleStyle}>
                      {t('technician') + ' #'}{index + 1}
                    </Text>
                    <TouchableOpacity
                      hitSlop={10}
                      onPress={() => handleRemoveRow(index)}>
                      <Ionicons
                        name="close"
                        size={scale(26)}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={fieldRowStyle}>
                    <OutlinedInput
                      style={[pillInputStyle, {flex: 1}]}
                      value={row.firstName}
                      onChangeText={value =>
                        updateRow(index, {
                          firstName: value.replace(/[^A-Za-z]/g, ''),
                        })
                      }
                      placeholder={t('first_name')}
                      placeholderTextColor={COLORS.lightGray}
                      autoCapitalize="words"
                      maxLength={16}
                    />
                    <OutlinedInput
                      style={[pillInputStyle, {flex: 1, marginLeft: scale(10)}]}
                      value={row.lastName}
                      onChangeText={value =>
                        updateRow(index, {
                          lastName: value.replace(/[^A-Za-z]/g, ''),
                        })
                      }
                      placeholder={t('last_name')}
                      placeholderTextColor={COLORS.lightGray}
                      autoCapitalize="words"
                      maxLength={16}
                    />
                  </View>
                  <Text style={fieldErrorStyle}>
                    {errors.firstName ?? errors.lastName ?? ' '}
                  </Text>

                  <OutlinedInput
                    style={pillInputStyle}
                    value={row.contact}
                    onChangeText={value =>
                      updateRow(index, {
                        contact: isIndia ? value.replace(/[^0-9]/g, '') : value,
                      })
                    }
                    placeholder={isIndia ? tr('Phone Number') : tr('Email Id')}
                    placeholderTextColor={COLORS.lightGray}
                    keyboardType={isIndia ? 'phone-pad' : 'email-address'}
                    autoCapitalize="none"
                    maxLength={isIndia ? 10 : undefined}
                  />
                  <Text style={fieldErrorStyle}>{errors.contact ?? ' '}</Text>
                </View>

                {index === rows.length - 1 ? (
                  <TouchableOpacity onPress={handleAddMore}>
                    <Text style={addMoreTextStyle}>{t('add_more')}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
};

const screenStyle = {flex: 1, backgroundColor: '#FAFAFA'} as const;

const headerStyle = {backgroundColor: COLORS.primary} as const;

const headerRowStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  height: HEADER_CONTENT_HEIGHT,
  paddingHorizontal: scale(16),
};

const headerTitleStyle = {
  color: '#FFFFFF',
  fontSize: sp(20),
  fontWeight: '500' as const,
  marginLeft: scale(24),
};

const scrollContentStyle = {
  padding: scale(6),
  paddingTop: scale(12),
  paddingBottom: scale(30),
};

// Java add_bulk_tech_fragment: how-to link left, 7/10-wide Submit pill right.
const topRowStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  marginLeft: scale(10),
  marginRight: scale(10),
  marginBottom: scale(20),
};

const howToStyle = {
  flex: 3,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
};

const playIconStyle = {
  width: scale(20),
  height: scale(20),
  borderRadius: scale(10),
  backgroundColor: COLORS.primary,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  marginRight: scale(8),
};

const howToTextStyle = {
  color: COLORS.primary,
  fontSize: sp(14),
  flexShrink: 1,
};

const submitPillStyle = {
  flex: 2,
  backgroundColor: COLORS.primary,
  borderRadius: scale(34),
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingTop: scale(3),
  paddingBottom: scale(4),
  marginLeft: scale(10),
};

const submitPillTextStyle = {
  color: '#FFFFFF',
  fontSize: sp(14),
  fontWeight: '700' as const,
};

// Java add_bulk_tech_row: 20dp-radius white card, 5dp margin, elevation.
const fieldworkerCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: scale(20),
  margin: scale(5),
  paddingBottom: scale(10),
  paddingHorizontal: scale(10),
  elevation: 6,
  shadowColor: '#000',
  shadowOpacity: 0.15,
  shadowRadius: 6,
  shadowOffset: {width: 0, height: 2},
} as const;

const fieldworkerCardHeaderStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  paddingLeft: scale(5),
  paddingTop: scale(8),
  marginBottom: scale(8),
};

const fieldworkerCardTitleStyle = {
  color: COLORS.primary,
  fontSize: sp(15),
  fontWeight: '700' as const,
};

const fieldRowStyle = {flexDirection: 'row' as const};

// TextInputLayoutStyle: outlined, 34dp radius, 1dp light_gray stroke, 14sp text.
const pillInputStyle = {
  borderWidth: 1,
  borderColor: COLORS.lightGray,
  borderRadius: scale(34),
  paddingHorizontal: scale(14),
  paddingVertical: 0,
  height: scale(38),
  fontSize: sp(14),
  color: COLORS.ink,
  backgroundColor: '#FFFFFF',
} as const;

// Material errorEnabled reserves a line under each outlined field.
const fieldErrorStyle = {
  color: COLORS.primary,
  fontSize: sp(12),
  marginLeft: scale(14),
  minHeight: scale(26),
  marginTop: scale(4),
};

const addMoreTextStyle = {
  color: COLORS.primary,
  fontSize: sp(18),
  fontWeight: '700' as const,
  textAlign: 'center' as const,
  marginTop: scale(5),
};

export default AddFieldworkerModal;