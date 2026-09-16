// src/screens/technician/drawer/TechProfileScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, Image, ScrollView, Modal,
  Pressable, Alert, ActivityIndicator, Platform, StatusBar, TouchableOpacity, Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/theme';
import { pick, types as pickerTypes } from '@react-native-documents/picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getProfileDetails,
  getUserDetails,
  updateUser as updateUserProfile,
  updateProfilePic,
  authenticateMobile,
  authenticateEmail,
} from '../../../api/users/usersService';
import type { UserDetailsResultData, UpdateUserResultData } from '../../../api/users/users.types';
import { getKycList } from '../../../api/umEmployeeList/umEmployeeListService';
import type { KYC_List_DTOResultData } from '../../../api/umEmployeeList/umEmployeeList.types';
import { ms, sp, scale, hp, vs } from '../../../utils/responsive';

// `UserResultData` / `KycDocType` are just local aliases for the api-layer
// DTO shapes, kept so the rest of this screen reads the same as before.
// DocTypeId/DocTypeName are narrowed back to required — every entry the KYC
// list API actually returns (and the static fallback list below) has both.
type UserResultData = UserDetailsResultData;
type KycDocType = Required<Pick<KYC_List_DTOResultData, 'DocTypeId' | 'DocTypeName'>> &
  Omit<KYC_List_DTOResultData, 'DocTypeId' | 'DocTypeName'>;

// ─── Field Component ────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value?: string;
  keyboard?: 'default' | 'email-address' | 'phone-pad';
  showEditIcon?: boolean;
  editable?: boolean;
  onChange?: (v: string) => void;
  onEditIconPress?: () => void;
  maxLength?: number;
}

const Field: React.FC<FieldProps> = ({
  label, value, keyboard = 'default', showEditIcon = false, editable = true,
  onChange, onEditIconPress, maxLength,
}) => (
  <View style={fieldStyles.wrapper}>
    <Text style={fieldStyles.floatingLabel}>{label}</Text>
    <View style={fieldStyles.inputBox}>
      <TextInput
        style={fieldStyles.input}
        value={value ?? ''}
        keyboardType={keyboard}
        onChangeText={onChange}
        editable={editable}
        maxLength={maxLength}
        cursorColor={COLORS.primary}
      />
      {showEditIcon && (
        <Pressable style={fieldStyles.editIcon} onPress={onEditIconPress}>
          <Ionicons name="create-outline" size={scale(20)} color={COLORS.primary} />
        </Pressable>
      )}
    </View>
  </View>
);

// Fallback doc-type map, used only until the KYC list loads from the server
// (mirrors GetDocumentTypeListByUserId from the Java reference).
const FALLBACK_DOC_TYPE_MAP: Record<string, number> = {
  Aadhar: 1,
  PAN: 2,
  'Driving License': 3,
};

// Allowed attachment types, ported from ProfileFragmentNew#callIntent's mimeTypes array.
const ALLOWED_DOC_TYPES = [
  pickerTypes.pdf,
  pickerTypes.images,
  pickerTypes.plainText,
  pickerTypes.zip,
  pickerTypes.xls,
  pickerTypes.xlsx,
];
const MAX_FILE_SIZE_BYTES = 6 * 1024 * 1024; // 6 MB, per the attach-box hint text

// ─── Validation helpers (ported from ProfileFragmentNew's mButtonSave checks) ─

const isValidPhone = (value: string) => value.trim().length === 10;

const isValidEmailFormat = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const hasNoSpacesAndNotEmpty = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 && !value.includes(' ');
};

// Ported from medtAadharCard's TextWatcher: insert a space after every 4 digits,
// capped at the 14-char "9999 9999 9999" format.
const formatAadhar = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  const groups = digits.match(/.{1,4}/g) ?? [];
  return groups.join(' ');
};

const fieldStyles = StyleSheet.create({
  wrapper:        { marginBottom: ms(16) },
  floatingLabel:  {
    position: 'absolute', left: ms(22), top: -ms(8),
    backgroundColor: '#fff', paddingHorizontal: ms(4),
    fontSize: sp(12), color: '#8a8a8a', zIndex: 10,
  },
  inputBox: {
    height: ms(50), borderRadius: ms(28), borderWidth: 1,
    borderColor: '#d1d1d1', paddingHorizontal: ms(18),
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', backgroundColor: '#f9f9f9',
  },
  input:   { flex: 1, fontSize: sp(15), color: '#333' },
  editIcon: {
    borderWidth: 1, borderColor: COLORS.primary,
    borderRadius: ms(6), padding: ms(4),
  },
});

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function TechProfileScreen() {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : insets.top;

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);
  const [docNumber, setDocNumber] = useState('');
  // Tracks cursor position for the Aadhar field. Reformatting the string on
  // every keystroke (inserting spaces) can desync Android's native cursor
  // index from the new value, which makes typed characters appear not to
  // show up at all until the input loses focus. Pinning selection to the end
  // after every change keeps the native widget and JS state in agreement.
  const [aadharSelection, setAadharSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });

  // KYC doc-type list, loaded from GetDocumentTypeListByUserId (getKYCListByUsr in Java)
  const [kycList, setKycList] = useState<KycDocType[]>([]);
  const [docTypeId, setDocTypeId] = useState<number>(0);
  const [docTypeName, setDocTypeName] = useState<string>('');
  const [showDocDropdown, setShowDocDropdown] = useState(false);
  const [kycSearch, setKycSearch] = useState('');

  const [selectedFile, setSelectedFile] = useState<{
    name: string; type: string; base64: string;
  } | null>(null);

  // DOB calendar picker (mirrors the DatePickerDialog + setMaxDate in the Java reference)
  const [showDobPicker, setShowDobPicker] = useState(false);

  // Tracks whether Contact No / Email were changed via the OTP-verify flow
  // this session (mirrors updateUser.setMobileNoUpdate / setEmailIdUpdate in
  // the Java reference), so UpdateUserProfile gets told which field changed.
  const [isMobileNoUpdate, setIsMobileNoUpdate] = useState(false);
  const [isEmailIdUpdate, setIsEmailIdUpdate] = useState(false);

  // Mobile / Email OTP-verify flow (VerifyOTPDialog in Java)
  const [otpModal, setOtpModal] = useState<{
    visible: boolean;
    from: 'MOBILE' | 'EMAIL' | null;
    stage: 'enter' | 'otp';
    newValue: string;
    otpValue: string;
    sentOtp: number | null;
  }>({ visible: false, from: null, stage: 'enter', newValue: '', otpValue: '', sentOtp: null });

  useEffect(() => {
    AsyncStorage.getItem('uid').then(setUserId);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchKycList();
    }
  }, [userId]);

  // Source: TechDashboardFragmentNew.getProfileDetails() / ProfileFragmentNew
  // GET Users/GetProfileDetails?UserId={userId} — primary source for profile data.
  const fetchProfile = async () => {
    try {
      if (!userId) return;
      const response = await getProfileDetails({ UserId: Number(userId) });
      const user = response?.ResultData ?? null;
      setProfile(user);
      setIsMobileNoUpdate(false);
      setIsEmailIdUpdate(false);
      setDocNumber(formatAadhar(user?.AadharCardNo ?? ''));
      if (user?.EmpDocType) {
        setDocTypeId(user.EmpDocType);
      }

      // GetProfileDetails doesn't return EmpDocument/EmpDocType for this
      // account — confirmed via GetUsersByUserId returning the real value for
      // the same user, same moment. Patch those two fields in specifically.
      // Source: Users/GetUsersByUserId?UserId={userId}
      if (!user?.EmpDocument) {
        const fallbackRes = await getUserDetails({ UserId: Number(userId) });
        const fallback = fallbackRes?.ResultData;
        if (fallback?.EmpDocument) {
          setProfile(prev => prev ? {
            ...prev,
            EmpDocument: fallback.EmpDocument,
            EmpDocType: fallback.EmpDocType ?? prev.EmpDocType,
          } : prev);
          if (fallback.EmpDocType) {
            setDocTypeId(fallback.EmpDocType);
          }
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Mirrors getKYCListByUsr(): pulls the available document types for the
  // technician's company so the KYC dropdown isn't hardcoded.
  // Source: UM_EmployeeList/GetDocumentTypeListByUserId?UserId={userId}
  const fetchKycList = async () => {
    try {
      if (!userId) return;
      const response = await getKycList({ UserId: Number(userId) });
      const list = (response?.ResultData ?? []).filter(
        (d): d is KycDocType => d.DocTypeId != null && d.DocTypeName != null,
      );
      setKycList(list);
      if (docTypeId) {
        const match = list.find(d => d.DocTypeId === docTypeId);
        if (match?.DocTypeName) setDocTypeName(match.DocTypeName);
      }
    } catch {
      // Fall back silently to the static list below if the API is unavailable.
    }
  };

  const handleProfilePhoto = async (source: 'camera' | 'gallery') => {
    setShowPhotoSourceModal(false);
    const result = source === 'camera'
      ? await launchCamera({ mediaType: 'photo', includeBase64: true, quality: 0.8 })
      : await launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.8 });

    const asset = result.assets?.[0];
    if (!asset?.base64) return;

    try {
      // Source: HomeActivityNew (UpdateProfilePicAsyncTask) — POST Users/UploadPhoto
      // { UserId, File, FileName }
      await updateProfilePic({
        UserId: Number(userId),
        File: asset.base64,
        FileName: asset.fileName || 'profile.jpg',
      });
      fetchProfile();
      Alert.alert('Success', 'Profile photo updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to upload profile photo');
    }
  };

  // ─── KYC document attach (callIntent / getFileName / encodeToBase64 in Java) ─
  const pickDocument = async () => {
    try {
      const result = await pick({ type: ALLOWED_DOC_TYPES });
      const file = result[0];

      if (file.size != null && file.size > MAX_FILE_SIZE_BYTES) {
        Alert.alert('File too large', 'Please choose a file under 6 MB.');
        return;
      }

      const base64 = await RNFS.readFile(file.uri, 'base64');
      setSelectedFile({
        name: file.name ?? 'document',
        type: file.type ?? 'application/octet-stream',
        base64,
      });
    } catch (e: any) {
      if (e?.code !== 'OPERATION_CANCELED') {
        console.log(e);
      }
    }
  };

  const handleSelectDocType = (item: Pick<KycDocType, 'DocTypeId' | 'DocTypeName'>) => {
    setDocTypeId(item.DocTypeId);
    setDocTypeName(item.DocTypeName);
    setShowDocDropdown(false);
    setKycSearch('');
  };

  // Mirrors onDateSet(): updates DOB and closes the picker. On Android the
  // picker dismisses itself after a single tap, so we close on every event
  // (not just 'set') — some OEM builds report event.type as undefined instead
  // of 'dismissed', so checking strictly for 'set' can leave the picker stuck
  // open. iOS keeps the inline wheel open until the person taps away, so we
  // only update the date there and let onDateChange close it separately.
  const handleDobChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDobPicker(false);
    }
    if (event.type === 'dismissed' || !date) {
      return;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dobDateOnly = `${year}-${month}-${day}T00:00:00.000Z`;
    setProfile(prev => prev ? { ...prev, DOB: dobDateOnly } : prev);
  };

  const filteredKycList = kycList.filter(d =>
    d.DocTypeName.toLowerCase().includes(kycSearch.toLowerCase()),
  );

  // ─── Mobile / Email OTP verification (VerifyOTPDialog in Java) ─────────────
  const openOtpFlow = (from: 'MOBILE' | 'EMAIL') => {
    setOtpModal({
      visible: true, from, stage: 'enter',
      newValue: '', otpValue: '', sentOtp: null,
    });
  };

  const closeOtpFlow = () => {
    setOtpModal({ visible: false, from: null, stage: 'enter', newValue: '', otpValue: '', sentOtp: null });
  };

  // Mirrors textView_validate.onClick: sends an OTP to the new mobile/email,
  // guarding against duplicates and bad formats the same way the Java does.
  // Both branches now follow the identical shape — IsMobileNoExistForUpdateProfile
  // and IsTechEmailIdExistForUpdateProfile both take a UserId and return
  // ResultData.OTP — so mobile and email go through the same two-stage flow.
  const handleSendOtp = async () => {
    const { from, newValue } = otpModal;
    if (!from || !userId) return;

    if (from === 'MOBILE') {
      if (!isValidPhone(newValue)) {
        Alert.alert('Validation', 'Please enter a valid 10-digit number');
        return;
      }
      if (newValue === profile?.ContactNo) {
        Alert.alert('Validation', 'This is a duplicate mobile number');
        return;
      }
    } else {
      if (!isValidEmailFormat(newValue)) {
        Alert.alert('Validation', 'Please enter a valid email id');
        return;
      }
      if (newValue.toLowerCase() === (profile?.Email ?? '').toLowerCase()) {
        Alert.alert('Validation', 'This is a duplicate email id');
        return;
      }
    }

    try {
      // Source: ProfileFragmentNew.getMobileOTPVerified / getEmailOTPVerified
      // GET Users/IsMobileNoExistForUpdateProfile?MobileNo={n}&UserId={id}
      // GET Users/IsTechEmailIdExistForUpdateProfile?EmailId={e}&UserId={id}
      const body = from === 'MOBILE'
        ? await authenticateMobile({ MobileNo: Number(newValue), UserId: Number(userId) })
        : await authenticateEmail({ EmailId: newValue, UserId: Number(userId) });

      if (body?.Message?.toLowerCase().includes('already registered')) {
        Alert.alert('Notice', body.Message);
        return;
      }
      setOtpModal(prev => ({ ...prev, stage: 'otp', sentOtp: body?.ResultData?.OTP ?? null }));
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to send OTP');
    }
  };

  // Mirrors textView_submit.onClick: compares the entered OTP against the
  // one returned by IsMobileNoExistForUpdateProfile / IsTechEmailIdExistForUpdateProfile,
  // then applies the new value locally and flags it for the update payload.
  const handleVerifyOtp = () => {
    const { from, newValue, otpValue, sentOtp } = otpModal;
    if (sentOtp == null || Number(otpValue) !== sentOtp) {
      Alert.alert('Error', 'Invalid OTP');
      return;
    }

    if (from === 'MOBILE') {
      setProfile(prev => prev ? { ...prev, ContactNo: newValue } : prev);
      setIsMobileNoUpdate(true);
    } else {
      setProfile(prev => prev ? { ...prev, Email: newValue } : prev);
      setIsEmailIdUpdate(true);
    }
    Alert.alert('Success', 'OTP verified');
    closeOtpFlow();
  };

  // ─── Update ───────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!profile?.FirstName || !hasNoSpacesAndNotEmpty(profile.FirstName)) {
      return !profile?.FirstName
        ? 'Please enter first name'
        : 'Space is not allowed';
    }
    if (!profile?.LastName || !hasNoSpacesAndNotEmpty(profile.LastName)) {
      return !profile?.LastName
        ? 'Please enter last name'
        : 'Space is not allowed';
    }
    if (!profile?.ContactNo) {
      return 'Please enter contact number';
    }
    if (!isValidPhone(profile.ContactNo)) {
      return 'Please enter a valid 10-digit contact number';
    }
    if (profile?.Email && !isValidEmailFormat(profile.Email)) {
      return 'Please enter a valid email id';
    }
    return null;
  };

  const handleUpdate = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Validation', validationError);
      return;
    }
    if (!profile || !userId) return;

    setUpdating(true);
    try {
      const payload: Partial<UpdateUserResultData> = {
        UserId: Number(userId),
        FirstName: profile.FirstName ?? '',
        LastName: profile.LastName ?? '',
        ContactNo: profile.ContactNo ?? '',
        Email: profile.Email ?? '',
        Address: profile.Address ?? '',
        DOB: profile.DOB ?? '',
        UpdatedBy: Number(userId),
        IsMobileNoUpdate: isMobileNoUpdate,
        IsEmailIdUpdate: isEmailIdUpdate,
      };

      const aadharValue = docNumber || profile.AadharCardNo || '';
      if (aadharValue.trim() !== '') {
        payload.AadharCardNo = aadharValue;
      }

      // KYC document attachment, only included if the user picked one
      if (selectedFile && (docTypeId || docTypeName)) {
        const fallbackId = FALLBACK_DOC_TYPE_MAP[docTypeName] ?? 0;
        payload.EmpDocumentType = docTypeId || fallbackId;
        payload.EmployeeDocumentBase64 = selectedFile.base64;
        payload.EmployeeDocumentName = selectedFile.name.replace(/\.[^/.]+$/, '');
        payload.EmployeeDocumentFileType = selectedFile.name.includes('.')
          ? `.${selectedFile.name.split('.').pop()}`
          : '';
      }

      // Source: ProfileFragmentNew.updateProfileUser() — POST Users/UpdateUser
      const body = await updateUserProfile(payload);
      const message = body?.Message ?? 'Profile updated successfully';
      const code = String(body?.Code ?? '').toLowerCase();
      const isSuccess = code === '200' || code === 'success';

      if (isSuccess) {
        Alert.alert('Success', message);
        const savedAadhar = formatAadhar(body?.ResultData?.AadharCardNo ?? payload.AadharCardNo ?? '');
        setIsMobileNoUpdate(false);
        setIsEmailIdUpdate(false);
        setSelectedFile(null);
        setDocTypeId(0);
        setDocTypeName('');
        await fetchProfile();
        setDocNumber(savedAadhar);
      } else {
        Alert.alert('Error', message);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const manager = `${profile?.OwnerFirstName ?? ''} ${profile?.OwnerLastName ?? ''}`.trim();
  const AVATAR = ms(100);
  const hasExistingDoc = !!profile?.EmpDocument;

  return (
    <View style={styles.root}>
      <View style={[styles.redBg, { height: vs(10) }]} />

      <ScrollView
        style={styles.whiteSheet}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + ms(40) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <Image
            source={
              profile?.Photo
                ? { uri: profile.Photo }
                : require('../../../../assets/images/image.png')
            }
            style={{ width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 }}
          />
          <Pressable
            style={styles.avatarEdit}
            onPress={() => setShowPhotoSourceModal(true)}
          >
            <Ionicons name="create-outline" size={scale(14)} color="#fff" />
          </Pressable>
        </View>

        <Field label="First Name" value={profile?.FirstName}
          onChange={(v) => setProfile(prev => prev ? { ...prev, FirstName: v } : prev)} />
        <Field label="Last Name" value={profile?.LastName}
          onChange={(v) => setProfile(prev => prev ? { ...prev, LastName: v } : prev)} />

        <View style={styles.managerRow}>
          <Text style={styles.managerLabel}>Reporting Manager : </Text>
          <Text style={styles.managerValue} numberOfLines={1}>{manager}</Text>
        </View>

        {/* Contact No — read-only once set, edit via OTP (imageView_editMobile) */}
        <Field
          label="Contact No"
          value={profile?.ContactNo}
          keyboard="phone-pad"
          editable={!profile?.ContactNo}
          showEditIcon={!!profile?.ContactNo}
          onChange={(v) => setProfile(prev => prev ? { ...prev, ContactNo: v } : prev)}
          onEditIconPress={() => openOtpFlow('MOBILE')}
        />

        <Field label="Address" value={profile?.Address}
          onChange={(v) => setProfile(prev => prev ? { ...prev, Address: v } : prev)} />

        {/* E-Mail — read-only once set, edit via OTP (imageView_editEmail) */}
        <Field
          label="E-Mail ID"
          value={profile?.Email}
          keyboard="email-address"
          editable={!profile?.Email}
          showEditIcon={!!profile?.Email}
          onChange={(v) => setProfile(prev => prev ? { ...prev, Email: v } : prev)}
          onEditIconPress={() => openOtpFlow('EMAIL')}
        />

        <View style={fieldStyles.wrapper}>
          <Text style={fieldStyles.floatingLabel}>Date of Birth</Text>
          <Pressable
            style={fieldStyles.inputBox}
            onPress={() => setShowDobPicker(true)}
          >
            <Text style={{ fontSize: sp(15), color: profile?.DOB ? '#333' : '#aaa' }}>
              {profile?.DOB ? new Date(profile.DOB).toLocaleDateString('en-GB').replace(/\//g, '-') : 'Select...'}
            </Text>
          </Pressable>
        </View>

        {showDobPicker && (
          <DateTimePicker
            value={profile?.DOB ? new Date(profile.DOB) : new Date()}
            mode="date"
            display={Platform.OS === 'android' ? 'calendar' : 'inline'}
            maximumDate={new Date()}
            onChange={handleDobChange}
          />
        )}

        <Field
          label="Aadhar Card"
          value={docNumber}
          keyboard="phone-pad"
          maxLength={14}
          onChange={(v) => setDocNumber(formatAadhar(v))}
        />

        {/* KYC Section */}
        <Text style={styles.sectionTitle}>KYC Details</Text>

        {/* Document Picker — populated from the KYC list API, falls back to static list */}
        <View style={fieldStyles.wrapper}>
          <Text style={fieldStyles.floatingLabel}>Please Select Document</Text>
          <Pressable
            style={fieldStyles.inputBox}
            onPress={() => setShowDocDropdown(!showDocDropdown)}
          >
            <Text style={{ fontSize: sp(15), color: docTypeName ? '#333' : '#aaa' }}>
              {docTypeName || 'Select...'}
            </Text>
            <Ionicons name="chevron-down" size={scale(18)} color="#333" />
          </Pressable>

          {showDocDropdown && (
            <View style={styles.dropdownBox}>
              <TextInput
                style={styles.dropdownSearch}
                placeholder="Search..."
                value={kycSearch}
                onChangeText={setKycSearch}
              />
              {(kycList.length > 0
                ? filteredKycList
                : (['Aadhar', 'PAN', 'Driving License'] as const).map((name) => ({
                    DocTypeId: FALLBACK_DOC_TYPE_MAP[name], DocTypeName: name,
                  }))
              ).map((item) => (
                <Pressable
                  key={item.DocTypeId}
                  style={({ pressed }) => [styles.dropdownItem, pressed && { backgroundColor: '#f5f5f5' }]}
                  onPress={() => handleSelectDocType(item)}
                >
                  <Text style={{ fontSize: sp(15) }}>{item.DocTypeName}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* File Attach */}
        <Text style={styles.attachLabel}>Attach File</Text>

        {/* Existing uploaded document link (docTinyUrl in Java) */}
        {hasExistingDoc && (
          <Pressable onPress={() => Linking.openURL(profile!.EmpDocument!)}>
            <Text style={styles.existingDocLink} numberOfLines={1}>
              {profile!.EmpDocument}
            </Text>
          </Pressable>
        )}
        
        <Pressable style={styles.attachBox} onPress={pickDocument}>
          <Text style={styles.attachText}>
            {selectedFile
              ? selectedFile.name
              : 'Choose .pdf, .jpeg, .jpg, .png, .xlsx, .txt, .zip, etc. max file size is 6 MB'}
          </Text>
        </Pressable>

        {/* Update */}
        <Pressable
          style={[styles.updateBtn, updating && { opacity: 0.7 }]}
          onPress={handleUpdate}
          disabled={updating}
        >
          {updating
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.updateText}>UPDATE</Text>}
        </Pressable>

        <Pressable onPress={() => {}}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>

      {/* Photo source picker */}
      <Modal visible={showPhotoSourceModal} transparent animationType="fade" onRequestClose={() => setShowPhotoSourceModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowPhotoSourceModal(false)}>
          <Pressable>
            <View style={styles.photoSourceSheet}>
              <Text style={styles.photoSourceTitle}>Select Image Source</Text>
              <View style={styles.photoSourceDivider} />
              <TouchableOpacity style={styles.photoSourceOption} onPress={() => handleProfilePhoto('camera')}>
                <View style={[styles.photoSourceIconWrap, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="camera-outline" size={sp(20)} color="#fff" />
                </View>
                <Text style={styles.photoSourceOptionText}>Camera</Text>
              </TouchableOpacity>
              <View style={styles.photoSourceDivider} />
              <TouchableOpacity style={styles.photoSourceOption} onPress={() => handleProfilePhoto('gallery')}>
                <View style={[styles.photoSourceIconWrap, { backgroundColor: '#6366F1' }]}>
                    <Ionicons name="images-outline" size={sp(20)} color="#fff" />
                </View>
                <Text style={styles.photoSourceOptionText}>Gallery</Text>
              </TouchableOpacity>
              <View style={styles.photoSourceDivider} />
              <TouchableOpacity style={[styles.photoSourceOption, { justifyContent: 'center' }]} onPress={() => setShowPhotoSourceModal(false)}>
                <Text style={[styles.photoSourceOptionText, { color: COLORS.primary, fontWeight: '600' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Mobile / Email OTP verification (VerifyOTPDialog in Java) */}
      <Modal visible={otpModal.visible} transparent animationType="fade" onRequestClose={closeOtpFlow}>
        <Pressable style={styles.modalBackdrop} onPress={closeOtpFlow}>
          <Pressable>
            <View style={styles.otpSheet}>
              <View style={styles.otpHeaderRow}>
                <Text style={styles.otpTitle}>
                  {otpModal.from === 'MOBILE' ? 'Update Mobile Number' : 'Update Email ID'}
                </Text>
                <Pressable onPress={closeOtpFlow}>
                  <Ionicons name="close" size={scale(20)} color="#444" />
                </Pressable>
              </View>

              {otpModal.stage === 'enter' ? (
                <>
                  <TextInput
                    style={styles.otpInput}
                    placeholder={otpModal.from === 'MOBILE' ? 'Enter new mobile number' : 'Enter new email id'}
                    keyboardType={otpModal.from === 'MOBILE' ? 'phone-pad' : 'email-address'}
                    value={otpModal.newValue}
                    onChangeText={(v) => setOtpModal(prev => ({ ...prev, newValue: v }))}
                  />
                  <Pressable style={styles.otpActionBtn} onPress={handleSendOtp}>
                    <Text style={styles.otpActionText}>Send OTP</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.otpHint}>
                    Enter the OTP sent to {otpModal.newValue}
                  </Text>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="Enter OTP"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otpModal.otpValue}
                    onChangeText={(v) => setOtpModal(prev => ({ ...prev, otpValue: v }))}
                  />
                  <Pressable style={styles.otpActionBtn} onPress={handleVerifyOtp}>
                    <Text style={styles.otpActionText}>Verify & Submit</Text>
                  </Pressable>
                </>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  redBg: {
    backgroundColor: COLORS.primary,
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(28),
    borderTopRightRadius: ms(28),
  },
  content: {
    padding: ms(16),
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  /* Avatar */
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: ms(20),
    marginTop: ms(8),
  },
  avatarEdit: {
    position: 'absolute',
    bottom: ms(4),
    right: '38%',
    backgroundColor: COLORS.primary,
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },

  /* Manager Row */
  managerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(16),
    flexWrap: 'wrap',
  },
  managerLabel: {
    fontSize: sp(13),
    color: 'rgba(182,180,182,0.93)',
  },
  managerValue: {
    fontSize: sp(14),
    color: COLORS.textPrimary,
    flex: 1,
  },

  /* KYC */
  sectionTitle: {
    fontSize: sp(16),
    fontWeight: '600',
    marginTop: ms(8),
    marginBottom: ms(12),
    color: COLORS.textPrimary,
  },
  existingDocLink: {
    color: 'blue',
    textDecorationLine: 'underline',
    fontSize: sp(13),
    marginBottom: ms(12),
    marginLeft: ms(20),
  },

  /* Dropdown */
  dropdownBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: ms(8),
    marginTop: ms(4),
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 20,
    maxHeight: ms(220),
  },
  dropdownSearch: {
    paddingHorizontal: ms(14),
    paddingVertical: ms(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    fontSize: sp(14),
  },
  dropdownItem: {
    padding: ms(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },

  /* File attach */
  attachLabel: {
    fontSize: sp(15),
    fontWeight: '500',
    marginBottom: ms(8),
    color: COLORS.textPrimary,
  },
  attachBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#c9c9c9',
    borderRadius: ms(8),
    padding: ms(16),
    marginBottom: ms(20),
    marginHorizontal: ms(20),
  },
  attachText: {
    color: '#666',
    fontSize: sp(14),
    lineHeight: sp(20),
  },

  /* Buttons */
  updateBtn: {
    backgroundColor: '#2f2f2f',
    height: ms(52),
    borderRadius: ms(30),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  updateText: {
    color: '#fff',
    fontSize: sp(17),
    fontWeight: '600',
  },
  cancelText: {
    textAlign: 'center',
    color: COLORS.primary,
    marginTop: ms(16),
    fontSize: sp(16),
    paddingVertical: ms(8),
  },

  modalBackdrop:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(32) },
  photoSourceSheet:      { backgroundColor: '#fff', borderRadius: scale(16), width: '100%', paddingVertical: vs(8), elevation: 10 },
  photoSourceTitle:      { fontSize: sp(17), fontWeight: '600', color: '#111', paddingHorizontal: scale(20), paddingVertical: vs(14) },
  photoSourceDivider:    { height: 1, backgroundColor: '#F3F4F6' },
  photoSourceOption:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(20), paddingVertical: vs(14), gap: scale(14) },
  photoSourceIconWrap:   { width: scale(34), height: scale(34), borderRadius: scale(17), alignItems: 'center', justifyContent: 'center' },
  photoSourceOptionText: { fontSize: sp(15), color: '#1F2937' },

  /* OTP modal */
  otpSheet: {
    backgroundColor: '#fff', borderRadius: scale(16), width: '100%',
    padding: scale(20), elevation: 10,
  },
  otpHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: vs(14),
  },
  otpTitle: { fontSize: sp(16), fontWeight: '600', color: '#111' },
  otpHint: { fontSize: sp(13), color: '#666', marginBottom: vs(10) },
  otpInput: {
    height: ms(46), borderRadius: ms(10), borderWidth: 1,
    borderColor: '#d1d1d1', paddingHorizontal: ms(14),
    fontSize: sp(15), color: '#333', marginBottom: vs(14),
  },
  otpActionBtn: {
    backgroundColor: COLORS.primary, height: ms(46), borderRadius: ms(24),
    justifyContent: 'center', alignItems: 'center',
  },
  otpActionText: { color: '#fff', fontSize: sp(15), fontWeight: '600' },
});