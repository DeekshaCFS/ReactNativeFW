// src/screens/admin/EditEmployeeModal.tsx
//
// Maps to Java's UM/EditEmpFragment (layout edit_emp_profile): loads the
// employee via UM_EmployeeList/GetEmployeeDetailsForUpdate, lets the owner
// change name, contact, designation / zone / manager, address, landmark,
// joining date, e-mail and KYC document, and posts
// UM_EmployeeList/UpdateEmployeeDetails.
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {pick} from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import SearchPickerModal, {type PickerOption} from '../../components/SearchPickerModal';
import {COLORS} from '../../theme/theme';
import {ms, sp, vs} from '../../utils/responsive';
import {ensureSuccess} from '../../utils/apiResponse';
import {
  getEmpDetailsForEdit,
  getKycList,
  updateEmpDetails,
} from '../../api/umEmployeeList/umEmployeeListService';
import {getDesignationType} from '../../api/umDesignations/umDesignationsService';
import {getAllZoneList, getManagerListByServzone} from '../../api/umServiceZone/umServiceZoneService';

type Props = {
  visible: boolean;
  ownerId: number;
  /** EmployeeNumber of the employee being edited. */
  employeeNumber: number;
  /** Names from the list row, shown until the owner picks something else. */
  designationName?: string;
  zoneName?: string;
  onClose: () => void;
  onUpdated: () => void;
};

type PickerKind = 'designation' | 'zone' | 'manager' | 'kyc';

const MAX_DOC_BYTES = 6 * 1024 * 1024;

const rows = <T,>(response: unknown): T[] => {
  const data = (response as {ResultData?: unknown} | null)?.ResultData;
  return Array.isArray(data) ? (data as T[]) : [];
};

// "2024-05-01T00:00:00" -> "01-05-2024" (Java shows dd-MM-yyyy).
const toDisplayDate = (value: unknown): string => {
  const text = String(value ?? '').trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
};

// "01-05-2024" -> "2024-05-01T00:00:00"
const toApiDate = (value: string): string | undefined => {
  const match = value.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}T00:00:00` : undefined;
};

const EditEmployeeModal: React.FC<Props> = ({
  visible,
  ownerId,
  employeeNumber,
  designationName = '',
  zoneName = '',
  onClose,
  onUpdated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [designation, setDesignation] = useState<PickerOption | null>(null);
  const [zone, setZone] = useState<PickerOption | null>(null);
  const [manager, setManager] = useState<PickerOption | null>(null);
  const [kycType, setKycType] = useState<PickerOption | null>(null);
  const [kycDocName, setKycDocName] = useState('');
  const [userGroupCodeId, setUserGroupCodeId] = useState(0);
  const [attachment, setAttachment] = useState<{name: string; base64: string; ext: string} | null>(null);

  const [picker, setPicker] = useState<PickerKind | null>(null);
  const [pickerOptions, setPickerOptions] = useState<PickerOption[]>([]);
  const [isPickerLoading, setIsPickerLoading] = useState(false);

  useEffect(() => {
    if (!visible || !employeeNumber) {
      return;
    }
    let active = true;
    setIsLoading(true);
    setAttachment(null);
    setKycType(null);
    setManager(null);
    getEmpDetailsForEdit({UserId: ownerId, EmployeeId: employeeNumber})
      .then(response => {
        if (!active) {
          return;
        }
        const data = (rows<Record<string, unknown>>(response)[0] ??
          (response as {ResultData?: Record<string, unknown>} | null)?.ResultData ??
          {}) as Record<string, unknown>;
        setFirstName(String(data.FirstnameM ?? ''));
        setLastName(String(data.LastnameM ?? ''));
        setContactNo(String(data.ContactNo ?? ''));
        setEmail(String(data.EmailId ?? ''));
        setAddress(String(data.EmpAddress ?? ''));
        setLandmark(String(data.LandMark ?? ''));
        setJoiningDate(toDisplayDate(data.JoiningDate));
        setUserGroupCodeId(Number(data.UserGroupCodeId) || 0);
        setDesignation(Number(data.DesignationId) ? {id: Number(data.DesignationId), label: designationName || 'Designation'} : null);
        setZone(Number(data.ServiceZoneMId) ? {id: Number(data.ServiceZoneMId), label: zoneName || 'Zone'} : null);
        setManager(Number(data.ManagerId) ? {id: Number(data.ManagerId), label: 'Manager'} : null);
        setKycType(Number(data.EmpDocType) ? {id: Number(data.EmpDocType), label: String(data.EmpDocument ?? 'Document')} : null);
        setKycDocName(String(data.EmpDocument ?? ''));
      })
      .catch(error => {
        Alert.alert('Edit Profile', error instanceof Error ? error.message : 'Unable to load employee details.');
      })
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
    // designationName / zoneName only label the prefill; not reload triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, ownerId, employeeNumber]);

  const openPicker = useCallback(
    async (kind: PickerKind) => {
      if (kind === 'manager' && !zone) {
        Alert.alert('Edit Profile', 'Please select a zone first.');
        return;
      }
      setPicker(kind);
      setPickerOptions([]);
      setIsPickerLoading(true);
      try {
        let options: PickerOption[] = [];
        if (kind === 'designation') {
          const response = await getDesignationType({OwnerId: ownerId});
          options = rows<{DesigationId?: number; DesigationName?: string; UserGroupCodeId?: number}>(response)
            .filter(row => !userGroupCodeId || !row.UserGroupCodeId || row.UserGroupCodeId === userGroupCodeId)
            .map(row => ({id: Number(row.DesigationId) || 0, label: String(row.DesigationName ?? '')}));
        } else if (kind === 'zone') {
          const response = await getAllZoneList({UserId: ownerId});
          options = rows<{ZoneServiceId?: number; ZoneName?: string}>(response).map(row => ({
            id: Number(row.ZoneServiceId) || 0,
            label: String(row.ZoneName ?? ''),
          }));
        } else if (kind === 'manager') {
          const response = await getManagerListByServzone({UserId: ownerId, ServiceZoneId: zone?.id ?? 0});
          options = rows<{EmployeeNumber?: number; FirstName?: string; LastName?: string}>(response).map(row => ({
            id: Number(row.EmployeeNumber) || 0,
            label: `${row.FirstName ?? ''} ${row.LastName ?? ''}`.trim(),
          }));
        } else {
          const response = await getKycList({UserId: ownerId});
          options = rows<{DocTypeId?: number; DocTypeName?: string}>(response).map(row => ({
            id: Number(row.DocTypeId) || 0,
            label: String(row.DocTypeName ?? ''),
          }));
        }
        setPickerOptions(options.filter(option => option.label));
      } catch {
        setPickerOptions([]);
      } finally {
        setIsPickerLoading(false);
      }
    },
    [ownerId, userGroupCodeId, zone],
  );

  const handlePick = (option: PickerOption) => {
    if (picker === 'designation') {
      setDesignation(option);
    } else if (picker === 'zone') {
      setZone(option);
      setManager(null); // managers belong to a zone
    } else if (picker === 'manager') {
      setManager(option);
    } else if (picker === 'kyc') {
      setKycType(option);
      setKycDocName(option.label);
    }
    setPicker(null);
  };

  const attachFile = async () => {
    try {
      const [file] = await pick({type: ['*/*']});
      if (!file) {
        return;
      }
      if (typeof file.size === 'number' && file.size > MAX_DOC_BYTES) {
        Alert.alert('Attach File', 'File size must be 6 MB or less.');
        return;
      }
      const base64 = await RNFS.readFile(file.uri, 'base64');
      const name = file.name || 'document';
      const dot = name.lastIndexOf('.');
      setAttachment({
        name: dot > 0 ? name.slice(0, dot) : name,
        ext: dot > 0 ? name.slice(dot + 1) : '',
        base64,
      });
    } catch (error) {
      const code = (error as {code?: string} | null)?.code;
      if (code !== 'DOCUMENT_PICKER_CANCELED' && code !== 'OPERATION_CANCELED') {
        Alert.alert('Attach File', 'Unable to attach this file.');
      }
    }
  };

  const handleUpdate = async () => {
    // Same checks as Java's EditEmpFragment btnUpdate.
    if (!firstName.trim()) {
      Alert.alert('Edit Profile', 'Please enter first name.');
      return;
    }
    if (firstName.includes(' ')) {
      Alert.alert('Edit Profile', 'Space is not allowed in first name.');
      return;
    }
    if (!lastName.trim()) {
      Alert.alert('Edit Profile', 'Please enter last name.');
      return;
    }
    if (lastName.includes(' ')) {
      Alert.alert('Edit Profile', 'Space is not allowed in last name.');
      return;
    }
    if (!/^\d{10,12}$/.test(contactNo.trim())) {
      Alert.alert('Edit Profile', 'Please enter a valid contact number.');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Edit Profile', 'Please enter a valid email id.');
      return;
    }
    if (joiningDate.trim() && !toApiDate(joiningDate)) {
      Alert.alert('Edit Profile', 'Joining date must be DD-MM-YYYY.');
      return;
    }

    setIsSubmitting(true);
    try {
      ensureSuccess(
        await updateEmpDetails({
          FristName: firstName.trim(),
          LastName: lastName.trim(),
          ContactM: contactNo.trim(),
          EmailId: email.trim(),
          DesigationName: designation?.label,
          DesignationId: designation?.id ?? 0,
          ServiceZoneMId: zone?.id ?? 0,
          ManagerId: manager?.id ?? 0,
          UserGroupCode: userGroupCodeId,
          RoleAutoId: userGroupCodeId,
          EmpAddress: address.trim(),
          JoiningDate: toApiDate(joiningDate),
          CreatedBy: ownerId,
          UserId: ownerId,
          EmployeeNumber: employeeNumber,
          LandMark: landmark.trim(),
          LocationId: zone?.id ?? 0,
          EmpDocumentType: kycType?.id ?? 0,
          EmpDoc: kycDocName,
          ...(attachment
            ? {
                EmployeeDocumentBase64: attachment.base64,
                EmployeeDocumentName: attachment.name,
                EmployeeDocumentFileType: `.${attachment.ext}`,
              }
            : {}),
        } as unknown as Parameters<typeof updateEmpDetails>[0]),
      );
      Alert.alert('Edit Profile', 'Profile updated successfully.');
      onUpdated();
      onClose();
    } catch (error) {
      Alert.alert('Edit Profile', error instanceof Error ? error.message : 'Unable to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pill = (value: string, placeholder: string, onPress: () => void) => (
    <TouchableOpacity style={styles.pill} onPress={onPress}>
      <Text style={value ? styles.pillValue : styles.pillPlaceholder} numberOfLines={1}>
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={sp(16)} color="#8a8f98" />
    </TouchableOpacity>
  );

  const input = (
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    extra: Partial<React.ComponentProps<typeof TextInput>> = {},
  ) => (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9aa0a6"
      {...extra}
    />
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={sp(24)} color="#fff" />
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={COLORS.primary} size="large" />
        ) : (
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
              <Text style={styles.section}>Employee Details</Text>
              {input(firstName, setFirstName, 'First Name')}
              {input(lastName, setLastName, 'Last Name')}
              {input(contactNo, setContactNo, 'Contact No', {keyboardType: 'phone-pad', maxLength: 12})}
              {pill(designation?.label === 'Designation' ? '' : designation?.label ?? '', 'Select Designation', () => openPicker('designation'))}
              {pill(zone?.label === 'Zone' ? '' : zone?.label ?? '', 'Select Zone', () => openPicker('zone'))}
              {pill(manager?.label === 'Manager' ? '' : manager?.label ?? '', 'Select Manager', () => openPicker('manager'))}

              <Text style={styles.section}>Other Details</Text>
              {input(address, setAddress, 'Address')}
              {input(landmark, setLandmark, 'Landmark')}
              {input(joiningDate, setJoiningDate, 'Joining Date (DD-MM-YYYY)')}
              {input(email, setEmail, 'E-Mail ID', {keyboardType: 'email-address', autoCapitalize: 'none'})}

              <Text style={styles.section}>KYC Details</Text>
              {pill(kycType?.label ?? '', 'Please Select Document', () => openPicker('kyc'))}
              <Text style={styles.label}>Attach File</Text>
              <TouchableOpacity style={styles.pill} onPress={attachFile}>
                <Text style={attachment ? styles.pillValue : styles.pillPlaceholder} numberOfLines={1}>
                  {attachment
                    ? `${attachment.name}${attachment.ext ? `.${attachment.ext}` : ''}`
                    : 'Choose .pdf, .jpeg, .jpg, .png, .xlsx, .txt, .zip, etc. max file size is 6 MB'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.updateButton} onPress={handleUpdate} disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.updateText}>UPDATE</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </View>

      <SearchPickerModal
        visible={picker !== null}
        title={
          picker === 'designation'
            ? 'Select Designation'
            : picker === 'zone'
            ? 'Select Zone'
            : picker === 'manager'
            ? 'Select Manager'
            : 'Select Document'
        }
        options={pickerOptions}
        loading={isPickerLoading}
        onSelect={handlePick}
        onClose={() => setPicker(null)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {flex: 1},
  screen: {flex: 1, backgroundColor: '#FFFFFF'},
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: ms(16),
    paddingVertical: ms(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {color: '#fff', fontSize: sp(18), fontWeight: '700'},
  loader: {marginTop: vs(40)},
  body: {padding: ms(16), paddingBottom: vs(40)},
  section: {fontSize: sp(15), fontWeight: '700', color: COLORS.primary, marginTop: vs(8), marginBottom: vs(8)},
  label: {fontSize: sp(12), color: '#6B7280', marginBottom: vs(4)},
  input: {
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: ms(24),
    paddingHorizontal: ms(16),
    height: ms(46),
    fontSize: sp(13),
    color: '#222',
    marginBottom: vs(12),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: ms(24),
    paddingHorizontal: ms(16),
    height: ms(46),
    marginBottom: vs(12),
  },
  pillValue: {flex: 1, fontSize: sp(13), color: '#222'},
  pillPlaceholder: {flex: 1, fontSize: sp(13), color: '#9aa0a6'},
  updateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: ms(24),
    height: ms(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(12),
  },
  updateText: {color: '#fff', fontWeight: '700', fontSize: sp(14)},
  cancelText: {textAlign: 'center', color: '#6B7280', marginTop: vs(14), fontSize: sp(13)},
});

export default EditEmployeeModal;
