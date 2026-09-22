// src/screens/admin/AdminProfileScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Image, ScrollView, Modal,
  Pressable, Alert, ActivityIndicator, Platform, StatusBar, TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/theme';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getProfileDetails,
  updateUser as updateUserProfile,
  authenticateMobile,
  authenticateEmail,
} from '../../api/users/usersService';
import { getKycList } from '../../api/umEmployeeList/umEmployeeListService';
import { pick } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import SearchPickerModal, { type PickerOption } from '../../components/SearchPickerModal';
import type { UserDetailsResultData, UpdateUserResultData } from '../../api/users/users.types';
import { ms, sp, scale, vs } from '../../utils/responsive';

type UserResultData = UserDetailsResultData;

// ─── Field Component (identical contract to TechProfileScreen's) ───────────

interface FieldProps {
  label: string;
  value?: string;
  keyboard?: 'default' | 'email-address' | 'phone-pad' | 'number-pad' | 'url';
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

// ─── Validation helpers (ported from ProfileFragmentNew's mButtonSave checks) ─

const isValidPhone = (value: string) => value.trim().length === 10;

const isValidEmailFormat = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const hasNoSpacesAndNotEmpty = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 && !value.includes(' ');
};

// Ported from isValidGSTOrPAN(): Java flags it invalid when length is
// >15 or <6, i.e. valid range is 6–15 characters.
const isValidGstOrPan = (value: string) => value.trim().length >= 6 && value.trim().length <= 15;

// Ported from isValidWebsite()'s WebUrl regex.
const WEBSITE_REGEX = /^((ftp|http|https):\/\/)?(www\.)?(?!.*(ftp|http|https|www\.))[a-zA-Z0-9_-]+(\.[a-zA-Z]+)+((\/)[\w#]+)*(\/\w+\?[a-zA-Z0-9_]+=\w+(&[a-zA-Z0-9_]+=\w+)*)?$/;
const isValidWebsite = (value: string) => WEBSITE_REGEX.test(value.trim());

// Ported from isNumberGreater(): valid range is 1–100.
const isValidEmployeeCount = (value: string) => /^[1-9][0-9]?$|^100$/.test(value.trim());

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

export default function AdminProfileScreen() {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : insets.top;

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [gstOrPan, setGstOrPan] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyContactNo, setCompanyContactNo] = useState('');
  const [noOfEmployees, setNoOfEmployees] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [companyDisplayName, setCompanyDisplayName] = useState('');
  // KYC (Java's spin_kyc + attach file, actively submitted on the owner's own
  // profile update: EmpDocumentType / EmployeeDocumentBase64).
  const [kycDocType, setKycDocType] = useState<PickerOption | null>(null);
  const [kycAttachment, setKycAttachment] = useState<{name: string; base64: string; ext: string} | null>(null);
  const [kycDocTypeOptions, setKycDocTypeOptions] = useState<PickerOption[]>([]);
  const [isKycPickerOpen, setIsKycPickerOpen] = useState(false);
  const [isLoadingKycTypes, setIsLoadingKycTypes] = useState(false);

  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);
  // Which image is being picked: profile avatar or company logo. Mirrors
  // isProfileImage in the Java fragment.
  const [photoTarget, setPhotoTarget] = useState<'profile' | 'logo'>('profile');

  // Java defers both images to the Save/UpdateUser call rather than
  // uploading immediately (mImageEncodeBaseStringProfile / …Company) —
  // unlike the technician screen's avatar, which uploads on selection.
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null);
  const [companyLogoBase64, setCompanyLogoBase64] = useState<string | null>(null);
  const [companyLogoRemoved, setCompanyLogoRemoved] = useState(false);

  const [showDobPicker, setShowDobPicker] = useState(false);

  const [isMobileNoUpdate, setIsMobileNoUpdate] = useState(false);
  const [isEmailIdUpdate, setIsEmailIdUpdate] = useState(false);

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
    if (userId) fetchProfile();
  }, [userId]);

  // Source: ProfileFragmentNew.getProfileDetails() — GET Users/GetProfileDetails?UserId={userId}
  const fetchProfile = async () => {
    try {
      if (!userId) return;
      const response = await getProfileDetails({ UserId: Number(userId) });
      const user = response?.ResultData ?? null;
      setProfile(user);
      setIsMobileNoUpdate(false);
      setIsEmailIdUpdate(false);
      setProfileImageBase64(null);
      setCompanyLogoBase64(null);
      setCompanyLogoRemoved(false);
      setDocNumber(formatAadhar(user?.AadharCardNo ?? ''));
      setCompanyName(user?.CompanyName ?? '');
      setCompanyAddress(user?.CompanyAddress ?? '');
      setGstOrPan(user?.CompanyGSTorPanNo ?? '');
      setCompanyWebsite(user?.CompanyWebsite ?? '');
      setCompanyContactNo(user?.CompanyContactNo != null ? String(user.CompanyContactNo) : '');
      setNoOfEmployees(user?.NoOfUsers != null ? String(user.NoOfUsers) : '');
      setCompanyDisplayName(user?.CompanySortName ?? '');
      setKycAttachment(null);
      setKycDocType(
        user?.EmpDocType
          ? {id: user.EmpDocType, label: user?.EmpDocument || 'Document'}
          : null,
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // ─── Avatar / company logo (deferred upload, embedded in UpdateUser) ──────
  const openPhotoSource = (target: 'profile' | 'logo') => {
    setPhotoTarget(target);
    setShowPhotoSourceModal(true);
  };

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    setShowPhotoSourceModal(false);
    const result = source === 'camera'
      ? await launchCamera({ mediaType: 'photo', includeBase64: true, quality: 0.8 })
      : await launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.8 });

    const asset = result.assets?.[0];
    if (!asset?.base64) return;

    if (photoTarget === 'profile') {
      setProfileImageBase64(asset.base64);
    } else {
      setCompanyLogoBase64(asset.base64);
      setCompanyLogoRemoved(false);
    }
  };

  const handleRemoveCompanyLogo = () => {
    setCompanyLogoBase64(null);
    setCompanyLogoRemoved(true);
  };

  // ─── DOB picker (mirrors onDateSet in the Java reference) ──────────────────
  const handleDobChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDobPicker(false);
    if (event.type === 'dismissed' || !date) return;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setProfile(prev => prev ? { ...prev, DOB: `${year}-${month}-${day}T00:00:00.000Z` } : prev);
  };

  // ─── Mobile / Email OTP verification (VerifyOTPDialog in Java) ─────────────
  const openOtpFlow = (from: 'MOBILE' | 'EMAIL') => {
    setOtpModal({ visible: true, from, stage: 'enter', newValue: '', otpValue: '', sentOtp: null });
  };

  const closeOtpFlow = () => {
    setOtpModal({ visible: false, from: null, stage: 'enter', newValue: '', otpValue: '', sentOtp: null });
  };

  // Source: Users/IsMobileNoExistForUpdateProfile & Users/IsTechEmailIdExistForUpdateProfile
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
  // Mirrors mButtonSave's validation chain (Owner branch) in ProfileFragmentNew.
  const validate = (): string | null => {
    if (!profile?.FirstName || !hasNoSpacesAndNotEmpty(profile.FirstName)) {
      return !profile?.FirstName ? 'Please enter first name' : 'Space is not allowed';
    }
    if (!profile?.LastName || !hasNoSpacesAndNotEmpty(profile.LastName)) {
      return !profile?.LastName ? 'Please enter last name' : 'Space is not allowed';
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
    if (!companyName.trim()) {
      return 'Company name is required';
    }
    if (gstOrPan.trim() && !isValidGstOrPan(gstOrPan)) {
      return 'Please enter a valid GST / PAN number';
    }
    if (companyContactNo.trim() && !isValidPhone(companyContactNo)) {
      return 'Please enter a valid company contact number';
    }
    if (companyWebsite.trim() && !isValidWebsite(companyWebsite)) {
      return 'Please enter a valid website';
    }
    if (noOfEmployees.trim() && !isValidEmployeeCount(noOfEmployees)) {
      return 'No. of employees should be between 1 and 100';
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
        // ─ Company Details (Owner/SubAdmin branch) ─
        CompanyId: profile.CompanyId,
        CompanyName: companyName,
        CompanyAddress: companyAddress,
        CompanyGSTorPanNo: gstOrPan,
        CompanyWebsite: companyWebsite,
        CompanySortName: companyDisplayName,
      };

      if (kycDocType) {
        payload.EmpDocumentType = kycDocType.id;
      }
      if (kycAttachment) {
        payload.EmployeeDocumentBase64 = kycAttachment.base64;
        payload.EmployeeDocumentName = kycAttachment.name;
        payload.EmployeeDocumentFileType = `.${kycAttachment.ext}`;
      }

      if (companyContactNo.trim()) {
        payload.CompanyContactNo = Number(companyContactNo);
      }
      if (noOfEmployees.trim()) {
        payload.NoOfUsers = noOfEmployees;
      }

      const aadharValue = docNumber || profile.AadharCardNo || '';
      if (aadharValue.trim() !== '') {
        payload.AadharCardNo = aadharValue;
      }

      // Profile photo — only sent if the user picked a new one this session.
      if (profileImageBase64) {
        payload.File = profileImageBase64;
        payload.FileName = `${profile.UserName ?? 'profile'}.jpg`;
      }

      // Company logo — only sent if the user picked a new one, or cleared it.
      if (companyLogoBase64) {
        payload.CompanyLogo = companyLogoBase64;
        payload.CompanyLogoName = `${profile.UserName ?? 'company'}Company.jpg`;
      } else if (companyLogoRemoved) {
        payload.CompanyLogo = '';
      }

      // Source: ProfileFragmentNew.updateProfileUser() — POST Users/UpdateUser
      const body = await updateUserProfile(payload);
      const message = body?.Message ?? 'Profile updated successfully';
      const code = String(body?.Code ?? '').toLowerCase();
      const isSuccess = code === '200' || code === 'success';

      if (isSuccess) {
        Alert.alert('Success', message);
        setIsMobileNoUpdate(false);
        setIsEmailIdUpdate(false);
        setProfileImageBase64(null);
        setCompanyLogoBase64(null);
        setCompanyLogoRemoved(false);
        await fetchProfile();
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

  const AVATAR = ms(100);
  const LOGO = ms(72);

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
              profileImageBase64
                ? { uri: `data:image/jpeg;base64,${profileImageBase64}` }
                : profile?.Photo
                  ? { uri: profile.Photo }
                  : require('../../../assets/images/image.png')
            }
            style={[styles.avatar, { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 }]}
          />
          <Pressable style={styles.avatarEdit} onPress={() => openPhotoSource('profile')}>
            <Ionicons name="create-outline" size={scale(14)} color="#fff" />
          </Pressable>
        </View>

        <Field label="First Name" value={profile?.FirstName}
          onChange={(v) => setProfile(prev => prev ? { ...prev, FirstName: v } : prev)} />
        <Field label="Last Name" value={profile?.LastName}
          onChange={(v) => setProfile(prev => prev ? { ...prev, LastName: v } : prev)} />

        {(profile?.OwnerFirstName || profile?.OwnerLastName) ? (
          <Field
            label="Reporting Manager"
            value={`${profile?.OwnerFirstName ?? ''} ${profile?.OwnerLastName ?? ''}`.trim()}
            editable={false}
            onChange={() => {}}
          />
        ) : null}

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
          <Pressable style={fieldStyles.inputBox} onPress={() => setShowDobPicker(true)}>
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

        {/* Company Details — Owner/SubAdmin only branch in ProfileFragmentNew (mLinearCompanyDetails) */}
        <Text style={styles.sectionTitle}>Company Details</Text>

        <View style={styles.logoRow}>
          <View style={[styles.logoWrapper, { width: LOGO, height: LOGO }]}>
            {(companyLogoBase64 || (profile?.CompanyLogo && !companyLogoRemoved)) ? (
              <Image
                source={
                  companyLogoBase64
                    ? { uri: `data:image/jpeg;base64,${companyLogoBase64}` }
                    : { uri: profile!.CompanyLogo }
                }
                style={{ width: LOGO, height: LOGO, borderRadius: ms(8) }}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.logoHint}>No Logo</Text>
            )}
          </View>
          <View style={styles.logoActions}>
            <Pressable onPress={() => openPhotoSource('logo')}>
              <Text style={styles.logoActionText}>Upload Company Logo</Text>
            </Pressable>
            {(companyLogoBase64 || (profile?.CompanyLogo && !companyLogoRemoved)) && (
              <Pressable onPress={handleRemoveCompanyLogo}>
                <Text style={[styles.logoActionText, { color: '#999' }]}>Remove</Text>
              </Pressable>
            )}
          </View>
        </View>

        <Field label="Company Name" value={companyName} onChange={setCompanyName} />
        <Field label="Company Display Name" value={companyDisplayName} onChange={setCompanyDisplayName} />
        <Field label="Company Address" value={companyAddress} onChange={setCompanyAddress} />
        <Field label="GST / PAN No" value={gstOrPan} maxLength={15} onChange={(v) => setGstOrPan(v.toUpperCase())} />
        <Field label="Company Website" keyboard="url" value={companyWebsite} onChange={setCompanyWebsite} />
        <Field label="Company Contact No" keyboard="phone-pad" value={companyContactNo} onChange={setCompanyContactNo} />
        <Field label="No. of Employees" keyboard="number-pad" value={noOfEmployees} onChange={setNoOfEmployees} />

        {/* KYC Details */}
        <Pressable
          style={styles.kycPickerRow}
          onPress={() => {
            setIsKycPickerOpen(true);
            if (kycDocTypeOptions.length === 0 && !isLoadingKycTypes && userId) {
              setIsLoadingKycTypes(true);
              getKycList({UserId: Number(userId)})
                .then(response => {
                  const rows = Array.isArray(response?.ResultData) ? response.ResultData : [];
                  setKycDocTypeOptions(
                    rows
                      .map(row => ({id: Number(row.DocTypeId) || 0, label: String(row.DocTypeName ?? '')}))
                      .filter(option => option.label),
                  );
                })
                .catch(() => setKycDocTypeOptions([]))
                .finally(() => setIsLoadingKycTypes(false));
            }
          }}>
          <Text style={kycDocType ? styles.kycPickerValue : styles.kycPickerPlaceholder}>
            {kycDocType ? kycDocType.label : 'Please Select Document'}
          </Text>
          <Ionicons name="chevron-down" size={scale(16)} color="#8a8f98" />
        </Pressable>
        <Pressable
          style={styles.kycPickerRow}
          onPress={async () => {
            try {
              const [file] = await pick({type: ['*/*']});
              if (!file) return;
              if (typeof file.size === 'number' && file.size > 6 * 1024 * 1024) {
                Alert.alert('Attach File', 'File size must be 6 MB or less.');
                return;
              }
              const base64 = await RNFS.readFile(file.uri, 'base64');
              const name = file.name || 'document';
              const dot = name.lastIndexOf('.');
              setKycAttachment({
                name: dot > 0 ? name.slice(0, dot) : name,
                ext: dot > 0 ? name.slice(dot + 1) : '',
                base64,
              });
            } catch (error: any) {
              if (error?.code !== 'DOCUMENT_PICKER_CANCELED' && error?.code !== 'OPERATION_CANCELED') {
                Alert.alert('Attach File', 'Unable to attach this file.');
              }
            }
          }}>
          <Text style={kycAttachment ? styles.kycPickerValue : styles.kycPickerPlaceholder} numberOfLines={1}>
            {kycAttachment
              ? `${kycAttachment.name}${kycAttachment.ext ? `.${kycAttachment.ext}` : ''}`
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

      {/* Photo source picker (shared by avatar + company logo) */}
      <Modal visible={showPhotoSourceModal} transparent animationType="fade" onRequestClose={() => setShowPhotoSourceModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowPhotoSourceModal(false)}>
          <Pressable>
            <View style={styles.photoSourceSheet}>
              <Text style={styles.photoSourceTitle}>Select Image Source</Text>
              <View style={styles.photoSourceDivider} />
              <TouchableOpacity style={styles.photoSourceOption} onPress={() => handlePickImage('camera')}>
                <View style={[styles.photoSourceIconWrap, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="camera-outline" size={sp(20)} color="#fff" />
                </View>
                <Text style={styles.photoSourceOptionText}>Camera</Text>
              </TouchableOpacity>
              <View style={styles.photoSourceDivider} />
              <TouchableOpacity style={styles.photoSourceOption} onPress={() => handlePickImage('gallery')}>
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

      <SearchPickerModal
        visible={isKycPickerOpen}
        title="Select Document"
        options={kycDocTypeOptions}
        loading={isLoadingKycTypes}
        onSelect={option => {
          setKycDocType(option);
          setIsKycPickerOpen(false);
        }}
        onClose={() => setIsKycPickerOpen(false)}
      />
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
  avatar: {},
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

  /* Company Details */
  sectionTitle: {
    fontSize: sp(16),
    fontWeight: '600',
    marginTop: ms(8),
    marginBottom: ms(12),
    color: COLORS.textPrimary,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(16),
    gap: ms(14),
  },
  logoWrapper: {
    borderRadius: ms(8),
    borderWidth: 1,
    borderColor: '#e2e2e2',
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoHint: {
    fontSize: sp(11),
    color: '#aaa',
  },
  logoActions: {
    gap: ms(8),
  },
  logoActionText: {
    color: COLORS.primary,
    fontSize: sp(14),
    fontWeight: '500',
  },

  kycPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: scale(24),
    paddingHorizontal: scale(16),
    height: ms(46),
    marginBottom: ms(12),
  },
  kycPickerValue: {
    flex: 1,
    fontSize: sp(13),
    color: '#222',
  },
  kycPickerPlaceholder: {
    flex: 1,
    fontSize: sp(13),
    color: '#9aa0a6',
  },

  /* Buttons */
  updateBtn: {
    backgroundColor: '#2f2f2f',
    height: ms(52),
    borderRadius: ms(30),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    marginTop: ms(8),
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
  photoSourceSheet:      { backgroundColor: '#fff', borderRadius: scale(16), width: '100%', maxWidth: scale(360), paddingVertical: vs(8), elevation: 10 },
  photoSourceTitle:      { fontSize: sp(17), fontWeight: '600', color: '#111', paddingHorizontal: scale(20), paddingVertical: vs(14) },
  photoSourceDivider:    { height: 1, backgroundColor: '#F3F4F6' },
  photoSourceOption:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(20), paddingVertical: vs(14), gap: scale(14) },
  photoSourceIconWrap:   { width: scale(34), height: scale(34), borderRadius: scale(17), alignItems: 'center', justifyContent: 'center' },
  photoSourceOptionText: { fontSize: sp(15), color: '#1F2937' },

  /* OTP modal */
  otpSheet: {
    backgroundColor: '#fff', borderRadius: scale(16), width: '100%', maxWidth: scale(400),
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