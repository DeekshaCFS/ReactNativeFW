// src/screens/admin/AdminProfileScreen.tsx

import { launchCameraWithPermission } from '../../utils/cameraPermission';
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Image, ScrollView,
  Pressable, ActivityIndicator, Platform, StatusBar, TouchableOpacity, Share,
} from 'react-native';
import Modal from '../../components/AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../theme/theme';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getProfileDetails,
  getUserDetails,
  updateUser as updateUserProfile,
  authenticateMobile,
  authenticateEmail,
} from '../../api/users/usersService';
import PlaceSearchModal from '../../components/PlaceSearchModal';
import SearchPickerModal,{ type PickerOption } from '../../components/SearchPickerModal';
import type { UserDetailsResultData, UpdateUserResultData } from '../../api/users/users.types';
import { ms, sp, scale, vs, useAppHeaderHeight } from '../../utils/responsive';
import { useNavigation } from '@react-navigation/native';
import { PencilEditIcon, EditFieldIcon } from '../../components/DialogIcons';
import { getServiceType } from '../../api/customerInquiry/customerInquiryService';
import { showFailureMsg, showSuccessMsg } from '../../utils/toast';

import {useTranslation} from 'react-i18next';
import ImageSourceDialog from '../../components/ImageSourceDialog';
import { tr } from '../../i18n/tr';
type UserResultData = UserDetailsResultData;

// ─── Field Component (identical to TechProfileScreen's) ─────────────────────
// Java's TextInputLayoutStyle: 1dp light_gray outlined pill with a floating hint.

interface FieldProps {
  label: string;
  value?: string;
  keyboard?: 'default' | 'email-address' | 'phone-pad' | 'number-pad' | 'url';
  /** Overlaid plain glyph at the field's top-right corner (Java's imageView_editMobile/Email --
   *  no border, no background, just the icon sitting over the field's border). */
  showEditIcon?: boolean;
  editable?: boolean;
  onChange?: (v: string) => void;
  onEditIconPress?: () => void;
  /** Read-only tap target (Google Places address search), like TechProfileScreen's Address. */
  onPress?: () => void;
  maxLength?: number;
  prefix?: string;
}

const Field: React.FC<FieldProps> = ({
  label, value, keyboard = 'default', showEditIcon = false, editable = true,
  onChange, onEditIconPress, onPress, maxLength, prefix,
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
        <View style={fieldStyles.inputRow}>
          {!!prefix && (
            <>
              <Text style={fieldStyles.prefixText}>{prefix}</Text>
              <Text style={fieldStyles.prefixDivider}>|</Text>
            </>
          )}
          <TextInput
            style={[fieldStyles.input, { flex: 1 }]}
            value={value ?? ''}
            keyboardType={keyboard}
            onChangeText={onChange}
            editable={editable}
            maxLength={maxLength}
            cursorColor={COLORS.primary}
          />
        </View>
      </View>
    )}
    {showEditIcon && (
      <Pressable style={fieldStyles.editIconOverlay} onPress={onEditIconPress} hitSlop={8}>
        <EditFieldIcon size={ms(20)} />
      </Pressable>
    )}
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

// Image file names from the server can contain spaces (e.g. "FieldWeb Invoice Generation Workflow.png").
// Java's Picasso encodes them; React Native's Image on Android does not and silently fails.
const encodeImageUrl = (url?: string) => (url ?? '').replace(/ /g, '%20');

const CONTACT_COUNTRY_CODE = '+91';

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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefixText: {
    fontSize: sp(16),
    color: COLORS.lightGray,
    marginRight: ms(8),
  },
  prefixDivider: {
    fontSize: sp(16),
    color: COLORS.lightGray,
    marginRight: ms(8),
  },
});

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function AdminProfileScreen() {
  const {t} = useTranslation();
  const navigation = useNavigation<any>();
  const headerHeight = useAppHeaderHeight();

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  // Which address field the Google Places search is currently filling.
  const [placeSearchFor, setPlaceSearchFor] = useState<'address' | 'companyAddress' | null>(null);
  const [gstOrPan, setGstOrPan] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyContactNo, setCompanyContactNo] = useState('');
  const [noOfEmployees, setNoOfEmployees] = useState('');
  const [companyDisplayName, setCompanyDisplayName] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  // Java: enquiry_spin_services (owner only) -- CustomerInquiry/ServiceTypeList.
  const [serviceTypeId, setServiceTypeId] = useState(0);
  const [serviceType, setServiceType] = useState<PickerOption | null>(null);
  const [serviceTypeOptions, setServiceTypeOptions] = useState<PickerOption[]>([]);
  const [isServicePickerOpen, setIsServicePickerOpen] = useState(false);
  // Java "Triggers": Response / Satisfaction code switches + up to 5 lead e-mails (chips).
  const [responseCode, setResponseCode] = useState(false);
  const [happyCode, setHappyCode] = useState(false);
  const [leadEmails, setLeadEmails] = useState<string[]>([]);
  const [leadEmailInput, setLeadEmailInput] = useState('');

  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);
  // Which image is being picked: profile avatar or company logo. Mirrors
  // isProfileImage in the Java fragment.
  const [photoTarget, setPhotoTarget] = useState<'profile' | 'logo'>('profile');
  // profile.Photo can be a truthy but unreachable/broken URL, which <Image>
  // fails to load silently, leaving a blank circle instead of falling back
  // to the placeholder -- so track load failures and fall back explicitly.
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

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

  useEffect(() => {
    setPhotoLoadFailed(false);
    setLogoLoadFailed(false);
  }, [profile?.Photo, profile?.CompanyLogo]);

  // Java HomeActivityNew.getServiceTypeForProfileFragment -> CustomerInquiry/ServiceTypeList.
  useEffect(() => {
    getServiceType()
      .then(response => {
        const rows = Array.isArray(response?.ResultData) ? response.ResultData : [];
        setServiceTypeOptions(
          rows
            .map(row => ({id: Number(row.Id) || 0, label: String(row.ServiceName ?? '')}))
            .filter(option => option.label)
            .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })),
        );
      })
      .catch(() => setServiceTypeOptions([]));
  }, []);

  // Pre-select the saved service type once both the profile and the list have loaded.
  useEffect(() => {
    if (serviceTypeId && serviceTypeOptions.length > 0) {
      setServiceType(serviceTypeOptions.find(o => o.id === serviceTypeId) ?? null);
    }
  }, [serviceTypeId, serviceTypeOptions]);

  // Source: ProfileFragmentNew.getProfileDetails() — GET Users/GetProfileDetails?UserId={userId}
  const fetchProfile = async () => {
    try {
      if (!userId) return;
      const response = await getProfileDetails({ UserId: Number(userId) });
      const user = response?.ResultData ?? null;
      setProfile(user);
      // Java opens this screen with the HomeActivityNew.getUSerDetails result
      // (Users/GetUsersByUserId), and that response carries CRMLoginURL while
      // GetProfileDetails returns it as null -- patch it in for the "Link" field.
      if (user && !user.CRMLoginURL) {
        getUserDetails({ UserId: Number(userId) })
          .then(res => {
            const crmLoginUrl = res?.ResultData?.CRMLoginURL;
            if (crmLoginUrl) {
              setProfile(prev => (prev ? { ...prev, CRMLoginURL: crmLoginUrl } : prev));
            }
          })
          .catch(() => {});
      }
      setIsMobileNoUpdate(false);
      setIsEmailIdUpdate(false);
      setProfileImageBase64(null);
      setCompanyLogoBase64(null);
      setCompanyLogoRemoved(false);
      setCompanyName(user?.CompanyName ?? '');
      setCompanyAddress(user?.CompanyAddress ?? '');
      setGstOrPan(user?.CompanyGSTorPanNo ?? '');
      setCompanyWebsite(user?.CompanyWebsite ?? '');
      setCompanyContactNo(user?.CompanyContactNo != null ? String(user.CompanyContactNo) : '');
      setNoOfEmployees(user?.NoOfUsers != null ? String(user.NoOfUsers) : '');
      setCompanyDisplayName(user?.CompanySortName ?? '');
      setCompanyCity(user?.CompanyCity ?? '');
      // Triggers (Java: radiobuttonYes / radiobuttonSatisfYes / addEmailChip per saved e-mail).
      setResponseCode(!!user?.IsResponseCode);
      setHappyCode(!!user?.IsHappyCode);
      setLeadEmails(
        String(user?.LeadsEmail ?? '')
          .split(',')
          .map(e => e.trim())
          .filter(Boolean)
          .slice(0, 5),
      );
      setLeadEmailInput('');
      setServiceTypeId(user?.CompanyServiceTypeId ?? 0);
    } catch (e: any) {
      showFailureMsg(e.message || 'Failed to load profile');
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
      ? await launchCameraWithPermission({ mediaType: 'photo', includeBase64: true, quality: 0.8 })
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
  const handleDobChange = (_event: DateTimePickerChangeEvent, date: Date) => {
    if (Platform.OS === 'android') setShowDobPicker(false);
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
        showFailureMsg(t('rn_please_enter_a_valid_10_digit_number'));
        return;
      }
      if (newValue === profile?.ContactNo) {
        showFailureMsg(t('rn_this_is_a_duplicate_mobile_number'));
        return;
      }
    } else {
      if (!isValidEmailFormat(newValue)) {
        showFailureMsg(t('please_enter_valid_emailid'));
        return;
      }
      if (newValue.toLowerCase() === (profile?.Email ?? '').toLowerCase()) {
        showFailureMsg(t('rn_this_is_a_duplicate_email_id'));
        return;
      }
    }

    try {
      const body = from === 'MOBILE'
        ? await authenticateMobile({ MobileNo: Number(newValue), UserId: Number(userId) })
        : await authenticateEmail({ EmailId: newValue, UserId: Number(userId) });

      if (body?.Message?.toLowerCase().includes('already registered')) {
        showFailureMsg(body.Message || 'Notice');
        return;
      }
      setOtpModal(prev => ({ ...prev, stage: 'otp', sentOtp: body?.ResultData?.OTP ?? null }));
    } catch (e: any) {
      showFailureMsg(e?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = () => {
    const { from, newValue, otpValue, sentOtp } = otpModal;
    if (sentOtp == null || Number(otpValue) !== sentOtp) {
      showFailureMsg(t('invalid_otp'));
      return;
    }

    if (from === 'MOBILE') {
      setProfile(prev => prev ? { ...prev, ContactNo: newValue } : prev);
      setIsMobileNoUpdate(true);
    } else {
      setProfile(prev => prev ? { ...prev, Email: newValue } : prev);
      setIsEmailIdUpdate(true);
    }
    showSuccessMsg(t('otp_verified'));
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
      showFailureMsg(validationError || 'Validation');
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

      // Java: updateUser.setCompanyCity(...) and the service-type / trigger values.
      payload.CompanyCity = companyCity.trim();
      if (serviceType) {
        payload.CompanyServiceTypeId = serviceType.id;
      }
      payload.IsResponseCode = responseCode;
      payload.IsHappyCode = happyCode;
      payload.LeadsEmail = leadEmails.join(',');

      if (companyContactNo.trim()) {
        payload.CompanyContactNo = Number(companyContactNo);
      }
      if (noOfEmployees.trim()) {
        payload.NoOfUsers = noOfEmployees;
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
        showSuccessMsg(message || 'Success');
        setIsMobileNoUpdate(false);
        setIsEmailIdUpdate(false);
        setProfileImageBase64(null);
        setCompanyLogoBase64(null);
        setCompanyLogoRemoved(false);
        await fetchProfile();
      } else {
        showFailureMsg(message || 'Error');
      }
    } catch (e: any) {
      showFailureMsg(e?.message || 'Failed to update profile');
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

  const AVATAR = ms(120);
  const hasLogo = !!(companyLogoBase64 || (profile?.CompanyLogo && !companyLogoRemoved && !logoLoadFailed));

  const addLeadEmail = () => {
    const email = leadEmailInput.trim();
    if (leadEmails.length >= 5) {
      showFailureMsg(t('rn_you_can_add_up_to_5_email_id_s_only'));
    } else if (isValidEmailFormat(email)) {
      if (!leadEmails.includes(email)) {
        setLeadEmails(prev => [...prev, email]);
      }
      setLeadEmailInput('');
    } else {
      showFailureMsg(t('rn_invalid_email'));
    }
  };

  // Java SegmentedGroup (No red / Yes green when checked).
  const renderYesNo = (value: boolean, onChange: (v: boolean) => void) => (
    <View style={styles.segmented}>
      <Pressable
        style={[styles.segment, styles.segmentLeft, !value && { backgroundColor: COLORS.primary }]}
        onPress={() => onChange(false)}>
        <Text style={[styles.segmentText, !value && styles.segmentTextOn]}>{t('no')}</Text>
      </Pressable>
      <Pressable
        style={[styles.segment, styles.segmentRight, value && { backgroundColor: COLORS.green500 }]}
        onPress={() => onChange(true)}>
        <Text style={[styles.segmentText, value && styles.segmentTextOn]}>{t('yes')}</Text>
      </Pressable>
    </View>
  );

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
              profileImageBase64
                ? { uri: `data:image/jpeg;base64,${profileImageBase64}` }
                : profile?.Photo && !photoLoadFailed
                  ? { uri: encodeImageUrl(profile.Photo) }
                  : require('../../../assets/images/image.png')
            }
            onError={() => setPhotoLoadFailed(true)}
            style={{ width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 }}
          />
          <Pressable style={styles.avatarEdit} onPress={() => openPhotoSource('profile')}>
            <PencilEditIcon size={ms(40)} />
          </Pressable>
        </View>

        <Field label={t('first_name')} value={profile?.FirstName} maxLength={16}
          onChange={(v) => setProfile(prev => prev ? { ...prev, FirstName: v.replace(/[^A-Za-z]/g, '') } : prev)} />
        <Field label={t('last_name')} value={profile?.LastName} maxLength={16}
          onChange={(v) => setProfile(prev => prev ? { ...prev, LastName: v.replace(/[^A-Za-z]/g, '') } : prev)} />

        {/* Contact No — read-only once set, edit via OTP (imageView_editMobile) */}
        <Field
          label={t('contact_no_hint')}
          value={profile?.ContactNo}
          keyboard="phone-pad"
          prefix={profile?.CountryCode ?? CONTACT_COUNTRY_CODE}
          maxLength={12}
          editable={!profile?.ContactNo}
          showEditIcon={!!profile?.ContactNo}
          onChange={(v) => setProfile(prev => prev ? { ...prev, ContactNo: v } : prev)}
          onEditIconPress={() => openOtpFlow('MOBILE')}
        />

        {/* Address — read-only, opens the Google Places search (Java's AutocompleteActivity) */}
        <Field label={t('address')} value={profile?.Address}
          onPress={() => setPlaceSearchFor('address')} />

        {/* E-Mail — Java always disables this field and always shows the pencil icon. */}
        <Field
          label={t('e_mail_id')}
          value={profile?.Email}
          keyboard="email-address"
          editable={false}
          showEditIcon
          onEditIconPress={() => openOtpFlow('EMAIL')}
        />

        <View style={fieldStyles.wrapper}>
          <Text style={fieldStyles.floatingLabel}>{t('date_of_birth')}</Text>
          <Pressable style={fieldStyles.inputBox} onPress={() => setShowDobPicker(true)}>
            <Text style={{ fontSize: sp(16), color: profile?.DOB ? COLORS.textBlack : COLORS.lightGray }}>
              {profile?.DOB ? new Date(profile.DOB).toLocaleDateString('en-GB').replace(/\//g, '-') : tr('Select...')}
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

        {/* Owner-only block of ProfileFragmentNew (company name … number of employees). The
            Reporting Manager row, Aadhar card and KYC section are technician-only in Java. */}
        <Field label={t('company_name')} value={companyName} maxLength={40} onChange={setCompanyName} />
        <Field label={t('company_disp_name')} value={companyDisplayName} maxLength={4}
          onChange={setCompanyDisplayName} />

        {/* enquiry_spin_services: bg_spinner pill (40dp, 34dp radius, light_gray stroke, arrow). */}
        <Pressable style={styles.serviceSpinner} onPress={() => setIsServicePickerOpen(true)}>
          <Text
            style={[styles.serviceSpinnerText, !serviceType && { color: COLORS.lightGray }]}
            numberOfLines={1}>
            {serviceType ? serviceType.label : tr('Select Service Type')}
          </Text>
          <Ionicons name="chevron-down" size={scale(18)} color={COLORS.textBlack} />
        </Pressable>

        <Field label={t('number_of_emp')} keyboard="number-pad" maxLength={3}
          value={noOfEmployees} onChange={setNoOfEmployees} />

        {/* linear_company_details */}
        <Text style={styles.sectionTitle}>{t('title_change_company_name')}</Text>

        <View style={styles.logoBox}>
          {hasLogo ? (
            <>
              <Image
                source={{
                  uri: companyLogoBase64
                    ? `data:image/jpeg;base64,${companyLogoBase64}`
                    : encodeImageUrl(profile!.CompanyLogo),
                }}
                style={styles.logoImage}
                onError={() => setLogoLoadFailed(true)}
                resizeMode="contain"
              />
              <Pressable style={styles.logoClose} onPress={handleRemoveCompanyLogo} hitSlop={8}>
                <Ionicons name="close-circle" size={ms(24)} color={COLORS.primary} />
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.logoHintRow} onPress={() => openPhotoSource('logo')}>
              <Ionicons name="add-circle" size={ms(24)} color={COLORS.primary} />
              <Text style={styles.logoHintText}>{t('company_logo_hint')}</Text>
            </Pressable>
          )}
        </View>

        <Field label={t('company_address_hint')} value={companyAddress}
          onPress={() => setPlaceSearchFor('companyAddress')} />
        <Field label={t('city')} value={companyCity} maxLength={200} onChange={setCompanyCity} />
        <Field label={t('rn_gst_pan_no')} value={gstOrPan} maxLength={15}
          onChange={(v) => setGstOrPan(v.replace(/[^0-9A-Za-z]/g, '').toUpperCase())} />
        <Field label={t('company_cont_no_hint')} keyboard="number-pad" maxLength={12} prefix={profile?.CountryCode ?? CONTACT_COUNTRY_CODE}
          value={companyContactNo} onChange={setCompanyContactNo} />
        <Field label={t('company_website_hint')} keyboard="url" maxLength={50}
          value={companyWebsite} onChange={setCompanyWebsite} />

        {/* edtTinyUrl + imgviewTinyUrl (share): read-only CRM login link. */}
        <View>
          <Field label={t('tiny_url')} value={profile?.CRMLoginURL} editable={false} maxLength={50} />
          <Pressable
            style={styles.linkShare}
            hitSlop={8}
            onPress={() => profile?.CRMLoginURL && Share.share({ message: profile.CRMLoginURL })}>
            <Ionicons name="share-social" size={ms(22)} color={COLORS.primary} />
          </Pressable>
        </View>

        {/* linear_trigger / trigger.xml */}
        <Text style={styles.sectionTitle}>{t('rn_triggers')}</Text>
        <View style={styles.triggerRow}>
          <Text style={styles.triggerLabel}>{t('rn_activate_response_code')}</Text>
          {renderYesNo(responseCode, setResponseCode)}
        </View>
        <View style={[styles.triggerRow, { marginTop: ms(10) }]}>
          <Text style={styles.triggerLabel}>{t('rn_activate_satisfaction_code')}</Text>
          {renderYesNo(happyCode, setHappyCode)}
        </View>
        <Text style={styles.leadsLabel}>{t('rn_receive_real_time_lead_information_max_5')}</Text>
        <View style={[fieldStyles.wrapper, { marginTop: ms(8) }]}>
          <View style={[fieldStyles.inputBox, { minHeight: ms(50) }]}>
            <TextInput
              style={fieldStyles.input}
              placeholder={t('enter_email_id')}
              placeholderTextColor={COLORS.lightGray}
              value={leadEmailInput}
              onChangeText={setLeadEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={addLeadEmail}
              cursorColor={COLORS.primary}
            />
          </View>
        </View>
        <View style={styles.chipRow}>
          {leadEmails.map(email => (
            <View key={email} style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>{email}</Text>
              <Pressable hitSlop={8} onPress={() => setLeadEmails(prev => prev.filter(e => e !== email))}>
                <Ionicons name="close-circle" size={ms(18)} color={COLORS.lightGray} />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Update */}
        <Pressable
          style={[styles.updateBtn, updating && { opacity: 0.7 }]}
          onPress={handleUpdate}
          disabled={updating}
        >
          {updating
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.updateText}>{t('update').toUpperCase()}</Text>}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Home')}>
          <Text style={styles.cancelText}>{t('cancel')}</Text>
        </Pressable>
      </ScrollView>

      {/* Photo source picker (shared by avatar + company logo) */}
      <ImageSourceDialog
        visible={showPhotoSourceModal}
        onCamera={() => handlePickImage('camera')}
        onGallery={() => handlePickImage('gallery')}
        onClose={() => setShowPhotoSourceModal(false)}
      />

      {/* Mobile / Email OTP verification (VerifyOTPDialog in Java) */}
      <PlaceSearchModal
        visible={placeSearchFor !== null}
        onClose={() => setPlaceSearchFor(null)}
        onSelect={(place) => {
          if (placeSearchFor === 'address') {
            setProfile(prev => prev ? { ...prev, Address: place.address } : prev);
          } else if (placeSearchFor === 'companyAddress') {
            setCompanyAddress(place.address);
          }
          setPlaceSearchFor(null);
        }}
      />

      <Modal visible={otpModal.visible}transparent animationType="fade" onRequestClose={closeOtpFlow}>
        <Pressable style={styles.modalBackdrop} onPress={closeOtpFlow}>
          <Pressable>
            <View style={styles.otpSheet}>
              <View style={styles.otpHeaderRow}>
                <Text style={styles.otpTitle}>
                  {otpModal.from === 'MOBILE' ? tr('Update Mobile Number') : tr('Update Email ID')}
                </Text>
                <Pressable onPress={closeOtpFlow}>
                  <Ionicons name="close" size={scale(20)} color="#444" />
                </Pressable>
              </View>

              {otpModal.stage === 'enter' ? (
                <>
                  <TextInput
                    style={styles.otpInput}
                    placeholder={otpModal.from === 'MOBILE' ? tr('Enter new mobile number') : tr('Enter new email id')}
                    keyboardType={otpModal.from === 'MOBILE' ? 'phone-pad' : 'email-address'}
                    value={otpModal.newValue}
                    onChangeText={(v) => setOtpModal(prev => ({ ...prev, newValue: v }))}
                  />
                  <Pressable style={styles.otpActionBtn} onPress={handleSendOtp}>
                    <Text style={styles.otpActionText}>{t('send_otp')}</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.otpHint}>
                    {t('rn_enter_the_otp_sent_to')} {otpModal.newValue}
                  </Text>
                  <TextInput
                    style={styles.otpInput}
                    placeholder={t('rn_enter_otp')}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otpModal.otpValue}
                    onChangeText={(v) => setOtpModal(prev => ({ ...prev, otpValue: v }))}
                  />
                  <Pressable style={styles.otpActionBtn} onPress={handleVerifyOtp}>
                    <Text style={styles.otpActionText}>{t('rn_verify_submit')}</Text>
                  </Pressable>
                </>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Java: com.corefield.fieldweb.Util.SearchableSpinner (enquiry_spin_services). */}
      <SearchPickerModal
        visible={isServicePickerOpen}
        title={t('select_service_type')}
        options={serviceTypeOptions}
        onSelect={option => {
          setServiceType(option);
          setIsServicePickerOpen(false);
        }}
        onClose={() => setIsServicePickerOpen(false)}
      />
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

  /* enquiry_spin_services -- bg_spinner: 40dp, 34dp radius, light_gray stroke, arrow at end */
  serviceSpinner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ms(40),
    borderRadius: ms(34),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    paddingHorizontal: ms(12),
    marginBottom: ms(15),
    backgroundColor: '#fff',
  },
  serviceSpinnerText: {
    flex: 1,
    fontSize: sp(16),
    color: COLORS.textBlack,
  },

  /* Company details */
  sectionTitle: {
    textAlign: 'center',
    fontSize: sp(20),
    color: '#1d2536',
    marginBottom: ms(20),
  },
  // relative_layout_comp_logo: 139dp tall, bg_curve_border (8dp radius, #E3E3E3 0.7dp stroke)
  logoBox: {
    alignSelf: 'center',
    height: ms(139),
    width: ms(200),
    borderRadius: ms(8),
    borderWidth: 0.7,
    borderColor: '#E3E3E3',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  logoClose: {
    position: 'absolute',
    top: ms(5),
    right: ms(5),
  },
  logoHintRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(16),
    gap: ms(5),
  },
  logoHintText: {
    fontSize: sp(16),
    color: COLORS.lightGray,
  },
  linkShare: {
    position: 'absolute',
    top: ms(10),
    right: ms(10),
  },

  /* Triggers (trigger.xml) */
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerLabel: {
    flex: 1,
    fontSize: sp(15),
    color: '#1d2536',
    paddingRight: ms(20),
  },
  segmented: {
    flexDirection: 'row',
    height: ms(40),
    marginTop: ms(5),
    borderRadius: ms(25),
    borderWidth: 1,
    borderColor: '#1d2536',
    overflow: 'hidden',
    elevation: 5,
    backgroundColor: '#fff',
  },
  segment: {
    width: ms(52),
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLeft: {},
  segmentRight: {
    borderLeftWidth: 1,
    borderLeftColor: '#1d2536',
  },
  segmentText: {
    fontSize: sp(14),
    color: '#1d2536',
  },
  segmentTextOn: {
    color: '#fff',
  },
  leadsLabel: {
    marginTop: ms(10),
    fontSize: sp(16),
    color: '#1d2536',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(8),
    marginBottom: ms(10),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    maxWidth: '100%',
    height: ms(32),
    paddingHorizontal: ms(12),
    borderRadius: ms(16),
    backgroundColor: '#E8E8E8',
  },
  chipText: {
    fontSize: sp(14),
    color: COLORS.textBlack,
    flexShrink: 1,
  },

  /* Buttons (rounded_button_new / transparent cancel) */
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