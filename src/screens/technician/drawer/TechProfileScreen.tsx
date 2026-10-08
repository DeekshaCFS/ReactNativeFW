// src/screens/technician/drawer/TechProfileScreen.tsx
//
// Java: ProfileFragmentNew (fragment_edit_profile_new.xml). Reuses HomeActivityNew's own
// toolbar retitled "Profile" (hamburger + location/headset/bell, no back arrow) -- handled by
// TechnicianTabs, not this screen -- then a single white rounded card with no gap below it.
import { launchCameraWithPermission } from '../../../utils/cameraPermission';
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, Image, ScrollView,
  Pressable, Alert, ActivityIndicator, Platform, ToastAndroid, TouchableOpacity, Linking,
} from 'react-native';
import Modal from '../../../components/AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../../theme/theme';
import { pick, types as pickerTypes } from '@react-native-documents/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
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
import { ms, sp, scale, vs, useAppHeaderHeight } from '../../../utils/responsive';
import { PencilEditIcon, EditFieldIcon } from '../../../components/DialogIcons';
import PlaceSearchModal from '../../../components/PlaceSearchModal';

// `UserResultData` / `KycDocType` are just local aliases for the api-layer
// DTO shapes, kept so the rest of this screen reads the same as before.
// DocTypeId/DocTypeName are narrowed back to required — every entry the KYC
// list API actually returns (and the static fallback list below) has both.
type UserResultData = UserDetailsResultData;
type KycDocType = Required<Pick<KYC_List_DTOResultData, 'DocTypeId' | 'DocTypeName'>> &
  Omit<KYC_List_DTOResultData, 'DocTypeId' | 'DocTypeName'>;

// ─── Field Component ────────────────────────────────────────────────────────
// Java's TextInputLayoutStyle: 1dp light_gray outlined pill with a floating hint.

interface FieldProps {
  label: string;
  value?: string;
  keyboard?: 'default' | 'email-address' | 'phone-pad';
  /** Overlaid plain glyph at the field's top-right corner (Java's imageView_editMobile/Email —
   *  no border, no background, just the icon sitting over the field's border). */
  showEditIcon?: boolean;
  editable?: boolean;
  onChange?: (v: string) => void;
  onEditIconPress?: () => void;
  onPress?: () => void;
  maxLength?: number;
}

const Field: React.FC<FieldProps> = ({
  label, value, keyboard = 'default', showEditIcon = false, editable = true,
  onChange, onEditIconPress, onPress, maxLength,
}) => (
  <View style={fieldStyles.wrapper}>
    <Text style={fieldStyles.floatingLabel}>{label}</Text>
    {onPress ? (
      <Pressable style={fieldStyles.inputBox} onPress={onPress}>
        <Text style={[fieldStyles.input, !value && { color: COLORS.lightGray }]} numberOfLines={1}>
          {value || ''}
        </Text>
      </Pressable>
    ) : (
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
      </View>
    )}
    {showEditIcon && (
      <Pressable style={fieldStyles.editIconOverlay} onPress={onEditIconPress} hitSlop={8}>
        <EditFieldIcon size={ms(20)} />
      </Pressable>
    )}
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

// Java's editText_firstname/lastname `digits` attribute only allows A-Z/a-z — no digits,
// symbols or even spaces — so names can never contain a space through typing.
const stripToLetters = (raw: string) => raw.replace(/[^A-Za-z]/g, '');

// Ported from medtAadharCard's TextWatcher: insert a space after every 4 digits,
// capped at the 14-char "9999 9999 9999" format.
const formatAadhar = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  const groups = digits.match(/.{1,4}/g) ?? [];
  return groups.join(' ');
};

const toast = (msg: string) => ToastAndroid.show(msg, ToastAndroid.SHORT);

const fieldStyles = StyleSheet.create({
  wrapper:        { marginBottom: ms(16) },
  floatingLabel:  {
    position: 'absolute', left: ms(22), top: -ms(8),
    backgroundColor: '#fff', paddingHorizontal: ms(4),
    fontSize: sp(12), color: COLORS.lightGray, zIndex: 10,
  },
  inputBox: {
    minHeight: ms(46), borderRadius: ms(28), borderWidth: 1,
    borderColor: COLORS.lightGray, paddingHorizontal: ms(18), paddingVertical: ms(10),
    justifyContent: 'center', backgroundColor: '#fff',
  },
  input: { fontSize: sp(16), color: COLORS.textBlack, padding: 0 },
  // Overlaps the field's top border at its right edge, like Java's negative-margin ImageView.
  editIconOverlay: {
    position: 'absolute', top: ms(10), right: ms(10),
  },
});

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function TechProfileScreen() {
  const navigation = useNavigation<any>();
  const headerHeight = useAppHeaderHeight();

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);
  // profile.Photo can be a truthy but unreachable/broken URL (e.g. no photo
  // ever uploaded), which <Image> fails to load silently, leaving a blank
  // circle instead of falling back to the placeholder -- so track load
  // failures and fall back explicitly.
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);
  const [docNumber, setDocNumber] = useState('');
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);

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

  // Mobile / Email OTP verification (Java's VerifyOTPDialog / otp_verified.xml): a single card
  // holding the new-value field and, once it looks complete, a 4-digit OTP row beneath it.
  // Validate sends the OTP; Submit only lights up once 4 digits are entered.
  const [otpModal, setOtpModal] = useState<{
    visible: boolean;
    from: 'MOBILE' | 'EMAIL' | null;
    newValue: string;
    otpValue: string;
    sentOtp: number | null;
    fieldError: string | null;
  }>({ visible: false, from: null, newValue: '', otpValue: '', sentOtp: null, fieldError: null });

  useEffect(() => {
    AsyncStorage.getItem('uid').then(setUserId);
  }, []);

  useEffect(() => {
    setPhotoLoadFailed(false);
  }, [profile?.Photo]);

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
      ? await launchCameraWithPermission({ mediaType: 'photo', includeBase64: true, quality: 0.8 })
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
      toast('Profile photo updated successfully');
    } catch {
      toast('Failed to upload profile photo');
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
  const handleDobChange = (_event: DateTimePickerChangeEvent, date: Date) => {
    if (Platform.OS === 'android') {
      setShowDobPicker(false);
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
    setOtpModal({ visible: true, from, newValue: '', otpValue: '', sentOtp: null, fieldError: null });
  };

  const closeOtpFlow = () => {
    setOtpModal({ visible: false, from: null, newValue: '', otpValue: '', sentOtp: null, fieldError: null });
  };

  // Java only reveals the OTP boxes once the typed value "looks complete": 10 digits for
  // mobile, or contains "@" for email (profileotp_view visibility toggle in the TextWatcher).
  const otpInputReady = otpModal.from === 'MOBILE'
    ? otpModal.newValue.length === 10
    : otpModal.newValue.includes('@');

  // Mirrors textView_validate.onClick: sends an OTP to the new mobile/email,
  // guarding against duplicates and bad formats the same way the Java does.
  const handleSendOtp = async () => {
    const { from, newValue } = otpModal;
    if (!from || !userId) return;

    if (from === 'MOBILE') {
      if (!isValidPhone(newValue)) {
        setOtpModal(prev => ({ ...prev, fieldError: 'Please Enter a Valid Number' }));
        return;
      }
      if (newValue === profile?.ContactNo) {
        setOtpModal(prev => ({ ...prev, fieldError: 'Same Mobile number not allowed' }));
        return;
      }
    } else {
      if (!isValidEmailFormat(newValue)) {
        setOtpModal(prev => ({ ...prev, fieldError: 'Please Enter Valid Email ID' }));
        return;
      }
      if (newValue.toLowerCase() === (profile?.Email ?? '').toLowerCase()) {
        setOtpModal(prev => ({ ...prev, fieldError: 'Same Email Id not allowed' }));
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
        setOtpModal(prev => ({ ...prev, fieldError: body.Message ?? null }));
        return;
      }
      setOtpModal(prev => ({ ...prev, fieldError: null, sentOtp: body?.ResultData?.OTP ?? null }));
    } catch (e: any) {
      setOtpModal(prev => ({ ...prev, fieldError: e?.message || 'Failed to send OTP' }));
    }
  };

  // Mirrors textView_submit.onClick: compares the entered OTP against the
  // one returned by IsMobileNoExistForUpdateProfile / IsTechEmailIdExistForUpdateProfile,
  // then applies the new value locally and flags it for the update payload.
  const handleVerifyOtp = () => {
    const { from, newValue, otpValue, sentOtp } = otpModal;
    if (sentOtp == null || Number(otpValue) !== sentOtp) {
      toast('Invalid OTP');
      return;
    }

    if (from === 'MOBILE') {
      setProfile(prev => prev ? { ...prev, ContactNo: newValue } : prev);
      setIsMobileNoUpdate(true);
    } else {
      setProfile(prev => prev ? { ...prev, Email: newValue } : prev);
      setIsEmailIdUpdate(true);
    }
    toast('OTP Verified');
    closeOtpFlow();
  };

  // ─── Update ───────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!profile?.FirstName) return 'First Name';
    if (profile.FirstName.includes(' ') || !profile.FirstName.trim()) return 'Space is not allowed';
    if (!profile?.LastName) return 'Last Name';
    if (profile.LastName.includes(' ') || !profile.LastName.trim()) return 'Space is not allowed';
    if (!profile?.ContactNo) return 'Please Enter Contact Number';
    if (!isValidPhone(profile.ContactNo)) return 'Please Enter a Valid Number';
    if (profile?.Email && !isValidEmailFormat(profile.Email)) return 'Please Enter Valid Email ID';
    return null;
  };

  const handleUpdate = async () => {
    const validationError = validate();
    if (validationError) {
      toast(validationError);
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
        toast(message);
        const savedAadhar = formatAadhar(body?.ResultData?.AadharCardNo ?? payload.AadharCardNo ?? '');
        setIsMobileNoUpdate(false);
        setIsEmailIdUpdate(false);
        setSelectedFile(null);
        setDocTypeId(0);
        setDocTypeName('');
        await fetchProfile();
        setDocNumber(savedAadhar);
      } else {
        toast(message);
      }
    } catch (e: any) {
      toast(e?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loader, { paddingTop: headerHeight }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const manager = `${profile?.OwnerFirstName ?? ''} ${profile?.OwnerLastName ?? ''}`.trim();
  const AVATAR = ms(120);
  const hasExistingDoc = !!profile?.EmpDocument;

  return (
    <View style={styles.root}>
      <ScrollView
        style={[styles.whiteSheet, { marginTop: headerHeight }]}
        contentContainerStyle={[styles.content, { paddingBottom: ms(40) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <Image
            source={
              profile?.Photo && !photoLoadFailed
                ? { uri: profile.Photo }
                : require('../../../../assets/images/image.png')
            }
            onError={() => setPhotoLoadFailed(true)}
            style={{ width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 }}
          />
          <Pressable
            style={styles.avatarEdit}
            onPress={() => setShowPhotoSourceModal(true)}
          >
            <PencilEditIcon size={ms(40)} />
          </Pressable>
        </View>

        <Field label="First Name" value={profile?.FirstName} maxLength={16}
          onChange={(v) => setProfile(prev => prev ? { ...prev, FirstName: stripToLetters(v) } : prev)} />
        <Field label="Last Name" value={profile?.LastName} maxLength={16}
          onChange={(v) => setProfile(prev => prev ? { ...prev, LastName: stripToLetters(v) } : prev)} />

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

        {/* Address — read-only, opens the Google Places search (Java's AutocompleteActivity) */}
        <Field
          label="Address"
          value={profile?.Address}
          onPress={() => setShowPlaceSearch(true)}
        />

        {/* E-Mail — Java always disables this field (txtEmailId_Layout.setEnabled(false) runs
            in both the "has email" and "no email yet" branches) and the pencil icon has no
            visibility toggle at all, so both are unconditional -- unlike Contact No below,
            which is only read-only/iconed once a value exists. */}
        <Field
          label="E-Mail ID"
          value={profile?.Email}
          keyboard="email-address"
          editable={false}
          showEditIcon
          onEditIconPress={() => openOtpFlow('EMAIL')}
        />

        <View style={fieldStyles.wrapper}>
          <Text style={fieldStyles.floatingLabel}>Date of Birth</Text>
          <Pressable
            style={fieldStyles.inputBox}
            onPress={() => setShowDobPicker(true)}
          >
            <Text style={{ fontSize: sp(16), color: profile?.DOB ? COLORS.textBlack : COLORS.lightGray }}>
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
            onValueChange={handleDobChange}
            onDismiss={() => setShowDobPicker(false)}
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
            style={[fieldStyles.inputBox, styles.selectRow]}
            onPress={() => setShowDocDropdown(!showDocDropdown)}
          >
            <Text style={{ fontSize: sp(16), color: docTypeName ? COLORS.textBlack : COLORS.lightGray }}>
              {docTypeName || 'Select...'}
            </Text>
            <Ionicons name="chevron-down" size={scale(18)} color={COLORS.textBlack} />
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

        <Pressable onPress={() => navigation.navigate('TechnicianTabsRoot', { screen: 'Home' })}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>

      {/* Photo source picker */}
      <Modal visible={showPhotoSourceModal} transparent animationType="fade" onRequestClose={() => setShowPhotoSourceModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowPhotoSourceModal(false)}>
          <Pressable style={styles.modalSheetWrap} onPress={() => {}}>
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

      {/* Address search (Java's full-screen Places Autocomplete) */}
      <PlaceSearchModal
        visible={showPlaceSearch}
        onClose={() => setShowPlaceSearch(false)}
        onSelect={(place) => {
          setProfile(prev => prev ? { ...prev, Address: place.address } : prev);
          setShowPlaceSearch(false);
        }}
      />

      {/* Mobile / Email OTP verification (VerifyOTPDialog / otp_verified.xml in Java):
          one card, field + (once it looks complete) the 4-digit OTP row, Validate / Submit. */}
      <Modal visible={otpModal.visible} transparent animationType="fade" onRequestClose={closeOtpFlow}>
        <Pressable style={styles.modalBackdrop} onPress={closeOtpFlow}>
          <Pressable style={styles.modalSheetWrap} onPress={() => {}}>
            <View style={styles.otpSheet}>
              <View style={styles.otpHeaderRow}>
                <Text style={styles.otpTitle}>
                  {otpModal.from === 'MOBILE' ? 'Change your contact number' : 'Change your Email id'}
                </Text>
                <Pressable onPress={closeOtpFlow} hitSlop={8}>
                  <Ionicons name="close" size={scale(20)} color="#444" />
                </Pressable>
              </View>

              <View style={fieldStyles.wrapper}>
                <Text style={fieldStyles.floatingLabel}>
                  {otpModal.from === 'MOBILE' ? 'Contact No' : 'E-Mail ID'}
                </Text>
                <View style={fieldStyles.inputBox}>
                  <TextInput
                    style={fieldStyles.input}
                    keyboardType={otpModal.from === 'MOBILE' ? 'phone-pad' : 'email-address'}
                    maxLength={otpModal.from === 'MOBILE' ? 12 : 40}
                    value={otpModal.newValue}
                    onChangeText={(v) => setOtpModal(prev => ({ ...prev, newValue: v, fieldError: null }))}
                  />
                </View>
              </View>
              {!!otpModal.fieldError && <Text style={styles.otpFieldError}>{otpModal.fieldError}</Text>}

              {otpInputReady && (
                <View style={fieldStyles.wrapper}>
                  <Text style={fieldStyles.floatingLabel}>OTP</Text>
                  <View style={fieldStyles.inputBox}>
                    <TextInput
                      style={[fieldStyles.input, styles.otpBoxesInput]}
                      keyboardType="number-pad"
                      maxLength={4}
                      value={otpModal.otpValue}
                      onChangeText={(v) => setOtpModal(prev => ({ ...prev, otpValue: v.replace(/[^0-9]/g, '') }))}
                    />
                  </View>
                </View>
              )}

              <View style={styles.otpActionsRow}>
                <Pressable style={styles.otpValidateBtn} onPress={handleSendOtp}>
                  <Text style={styles.otpActionText}>Send OTP</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.otpSubmitBtn,
                    otpModal.otpValue.length !== 4 && styles.otpSubmitBtnDisabled,
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={otpModal.otpValue.length !== 4}
                >
                  <Text style={styles.otpActionText}>Submit</Text>
                </Pressable>
              </View>
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
  whiteSheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
  },
  content: {
    padding: ms(20),
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },

  /* Avatar */
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: ms(20),
  },
  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: '34%',
  },

  /* Manager Row */
  managerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(10),
    flexWrap: 'wrap',
  },
  managerLabel: {
    fontSize: sp(12),
    color: COLORS.lightGray,
  },
  managerValue: {
    fontSize: sp(16),
    color: COLORS.textBlack,
    flex: 1,
  },

  /* KYC */
  sectionTitle: {
    fontSize: sp(16),
    fontWeight: '700',
    marginTop: ms(8),
    marginBottom: ms(12),
    color: COLORS.textBlack,
  },
  selectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  existingDocLink: {
    color: COLORS.tagBlue,
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
    fontWeight: '700',
    marginBottom: ms(8),
    color: COLORS.textBlack,
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
    backgroundColor: '#353935',
    height: ms(50),
    borderRadius: ms(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: ms(10),
    elevation: 3,
  },
  updateText: {
    color: '#fff',
    fontSize: sp(18),
  },
  cancelText: {
    textAlign: 'center',
    color: COLORS.primary,
    marginTop: ms(16),
    marginBottom: ms(20),
    fontSize: sp(18),
    paddingVertical: ms(8),
  },

  modalBackdrop:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(32) },
  // Absorbs taps so they don't bubble to modalBackdrop's dismiss handler. Needs an explicit
  // width: without one, the sheet inside (which is itself width:'100%') has nothing to resolve
  // its percentage against and collapses to a sliver.
  modalSheetWrap:        { width: '100%' },
  photoSourceSheet:      { backgroundColor: '#fff', borderRadius: scale(16), width: '100%', maxWidth: scale(360), paddingVertical: vs(8), elevation: 10 },
  photoSourceTitle:      { fontSize: sp(17), fontWeight: '600', color: '#111', paddingHorizontal: scale(20), paddingVertical: vs(14) },
  photoSourceDivider:    { height: 1, backgroundColor: '#F3F4F6' },
  photoSourceOption:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(20), paddingVertical: vs(14), gap: scale(14) },
  photoSourceIconWrap:   { width: scale(34), height: scale(34), borderRadius: scale(17), alignItems: 'center', justifyContent: 'center' },
  photoSourceOptionText: { fontSize: sp(15), color: '#1F2937' },

  /* OTP modal (Java: single card, field + OTP row, Validate/Submit) */
  otpSheet: {
    backgroundColor: '#fff', borderRadius: scale(16), width: '100%', maxWidth: scale(400),
    padding: scale(20), elevation: 10,
  },
  otpHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: vs(16),
  },
  otpTitle: { flex: 1, fontSize: sp(18), color: COLORS.ink, marginRight: scale(8) },
  otpFieldError: { fontSize: sp(12), color: COLORS.primary, marginTop: -ms(12), marginBottom: ms(10) },
  otpBoxesInput: { letterSpacing: scale(8), fontSize: sp(18) },
  otpActionsRow: { flexDirection: 'row', gap: scale(10), marginTop: ms(4) },
  otpValidateBtn: {
    flex: 1, backgroundColor: COLORS.primary, height: ms(42), borderRadius: ms(24),
    justifyContent: 'center', alignItems: 'center',
  },
  otpSubmitBtn: {
    flex: 1, backgroundColor: COLORS.primary, height: ms(42), borderRadius: ms(24),
    justifyContent: 'center', alignItems: 'center',
  },
  otpSubmitBtnDisabled: { backgroundColor: COLORS.lightGray },
  otpActionText: { color: '#fff', fontSize: sp(15), fontWeight: '600' },
});
