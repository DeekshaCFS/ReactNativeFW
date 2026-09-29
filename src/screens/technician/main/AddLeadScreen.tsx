// src/screens/technician/main/AddLeadScreen.tsx
//
// Port of Java's LeadManagement/AddEditLeadDialog.addLead for the fieldworker.
// Posts LeadForm/AddInternalCustomerLeadByTechnician (Java: addExternalLeadFormByTech).
// Not ported: Google Places address picker (plain text address, lat/long "0"),
// contact-book picker.

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp } from '../../../utils/responsive';
import SearchPickerModal, { PickerOption } from '../../../components/SearchPickerModal';
import { ensureSuccess } from '../../../utils/apiResponse';
import {
  getCurrentUserId,
  getCurrentUserProfile,
  isIndiaCountryDetailsId,
} from '../../../state/session';
import { getCustomerList, getStateList, getCityList } from '../../../api/customerList/customerListService';
import type { CustomerListResultData } from '../../../api/customerList/customerList.types';
import { getEnquiryServiceTypeList } from '../../../api/services/servicesService';
import { postExternalLeadFormByTech } from '../../../api/leadForm/leadFormService';

type Photo = { base64: string; uri: string; fileName: string };

const MAX_SUGGESTIONS = 6;

// Java: DateUtils.getDate(now, "yyyyMMdd_HHmmss") + "_AddUpdateLead<n>_.jpg"
const pad = (n: number) => String(n).padStart(2, '0');
const photoName = (slot: number) => {
  const d = new Date();
  const ts =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `${ts}_AddUpdateLead${slot}_.jpg`;
};

export default function AddLeadScreen({ navigation }: any) {
  const { isStateEnable, isCityEnable, isPincodeEnable } = getCurrentUserProfile().taskConfiguration;

  const [customers, setCustomers] = useState<CustomerListResultData[]>([]);
  const [services, setServices] = useState<PickerOption[]>([]);
  const [states, setStates] = useState<PickerOption[]>([]);
  const [cities, setCities] = useState<PickerOption[]>([]);
  const [cityLoading, setCityLoading] = useState(false);

  const [customerId, setCustomerId] = useState(0);
  const [name, setName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [service, setService] = useState<PickerOption | null>(null);
  const [stateText, setStateText] = useState('');
  const [cityText, setCityText] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('0');
  const [longitude, setLongitude] = useState('0');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<(Photo | null)[]>([null, null, null]);

  const [picker, setPicker] = useState<'service' | 'state' | 'city' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Java loads these up front (customer list + states in HomeActivityNew, service
  // types in LeadsFragmentForTechnician). Failures leave the pickers empty.
  useEffect(() => {
    const userId = getCurrentUserId();
    (async () => {
      const ownerId = Number(await AsyncStorage.getItem('owner_id')) || 0;
      try {
        const res = await getCustomerList({ UserId: ownerId, CustomerTagId: 0 });
        setCustomers(res?.ResultData ?? []);
      } catch {
        setCustomers([]);
      }
    })();
    getEnquiryServiceTypeList({ OwnerId: userId })
      .then(res =>
        setServices(
          (res?.ResultData ?? [])
            .filter(s => s.Id && s.ServiceName)
            .map(s => ({ id: Number(s.Id), label: String(s.ServiceName) })),
        ),
      )
      .catch(() => setServices([]));
    getStateList()
      .then(res =>
        setStates(
          (res?.ResultData ?? [])
            .filter(s => s.Text)
            .map(s => ({ id: Number(s.Value) || 0, label: String(s.Text) })),
        ),
      )
      .catch(() => setStates([]));
  }, []);

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!showSuggestions || !q) return [];
    return customers
      .filter(c => (c.CustomerName ?? '').toLowerCase().includes(q))
      .slice(0, MAX_SUGGESTIONS);
  }, [customers, name, showSuggestions]);

  const loadCities = async (stateId: number) => {
    setCities([]);
    setCityLoading(true);
    try {
      const res = await getCityList({ UserId: getCurrentUserId(), StateId: stateId });
      setCities(
        (res?.ResultData ?? [])
          .filter(c => c.Text)
          .map(c => ({ id: Number(c.Value) || 0, label: String(c.Text) })),
      );
    } catch {
      setCities([]);
    } finally {
      setCityLoading(false);
    }
  };

  // Java: leadCustName.setOnItemClickListener
  const pickCustomer = (c: CustomerListResultData) => {
    setCustomerId(Number(c.CustomerDetailsid) || 0);
    setName(c.CustomerName ?? '');
    setMobile(c.MobileNumber ?? '');
    setAddress(c.Address ?? '');
    setLandmark(c.Description ?? '');
    setStateText(c.State ?? '');
    setCityText(c.City ?? '');
    setPincode(c.PinCode ?? '');
    setLatitude(Number.isFinite(parseFloat(c.latitude ?? '')) ? String(parseFloat(c.latitude as string)) : '0');
    setLongitude(Number.isFinite(parseFloat(c.Longitude ?? '')) ? String(parseFloat(c.Longitude as string)) : '0');
    setShowSuggestions(false);
    // Java sets state/city text only; the city list stays tied to the last picked state.
    setCities([]);
    const match = states.find(s => s.label.toLowerCase() === (c.State ?? '').toLowerCase());
    if (match) loadCities(match.id);
  };

  const onNameChange = (text: string) => {
    setName(text);
    setShowSuggestions(true);
    // Editing the name detaches it from a previously picked customer.
    if (customerId) setCustomerId(0);
  };

  const setPhoto = (slot: number, asset: { base64?: string; uri?: string }) => {
    if (!asset.base64) {
      Alert.alert('Photo', 'Unable to read the selected image. Please try again.');
      return;
    }
    setPhotos(prev => {
      const next = [...prev];
      next[slot] = { base64: asset.base64 as string, uri: asset.uri ?? '', fileName: photoName(slot + 1) };
      return next;
    });
  };

  const choosePhoto = (slot: number) => {
    const options = { mediaType: 'photo' as const, includeBase64: true, quality: 0.6 as const };
    const handle = (result: any, label: string) => {
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert(label, result.errorMessage || `Unable to open ${label.toLowerCase()}.`);
        return;
      }
      const asset = result.assets?.[0];
      if (asset) setPhoto(slot, asset);
    };
    Alert.alert('Add/Capture Image', 'Choose an option', [
      { text: 'Camera', onPress: async () => handle(await launchCamera(options), 'Camera') },
      {
        text: 'Gallery',
        onPress: async () => handle(await launchImageLibrary({ ...options, selectionLimit: 1 }), 'Gallery'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Java's validation chain, in the same order.
  const validate = (): string | null => {
    const n = name.trim();
    if (!name) return 'Please enter customer name';
    if (!n || /^\s/.test(name)) return 'Space is not allowed';
    if (!mobile) return 'Please enter customer number';
    if (isIndiaCountryDetailsId()) {
      if (mobile.length !== 10) return 'Please enter valid number';
    } else if (mobile.length <= 6) {
      return 'Please enter valid number';
    }
    if (Number(mobile) === 0) return 'Please enter valid number';
    if (!address) return 'Please enter address';
    if (!landmark) return 'Please enter landmark';
    if (!landmark.trim() || /^\s/.test(landmark)) return 'Space is not allowed';
    if (!service) return 'Please select service type';
    if (isStateEnable && !stateText) return 'Please select state';
    if (isCityEnable && !cityText) return 'Please select city';
    if (isPincodeEnable && !pincode) return 'Please enter pincode';
    return null;
  };

  const submit = async () => {
    if (submitting) return;
    const error = validate();
    if (error) {
      Alert.alert('Add Lead', error);
      return;
    }

    const userId = getCurrentUserId();
    const hasPhoto = photos.some(p => p);

    setSubmitting(true);
    try {
      const res = await postExternalLeadFormByTech({
        CustomerName: name,
        MobileNumber: mobile,
        Address: address,
        LocName: '',
        LocDescription: landmark,
        ServiceName: service?.label ?? '',
        ServicesId: service?.id ?? 0,
        CustomerDetailsid: customerId,
        Description: notes,
        // Java: non-owner branch zeroes Created/UpdatedBy and sends UserId.
        UpdatedBy: 0,
        CreatedBy: 0,
        UserId: userId,
        latitude,
        Longitude: longitude,
        IsActive: true,
        LeadStatus: 1,
        State: stateText,
        City: cityText,
        PinCode: pincode,
        // Java sends all six image fields only when at least one photo exists.
        ...(hasPhoto
          ? {
              ImageFileName: photos[0]?.fileName ?? '',
              ImageFileBase64Str: photos[0]?.base64 ?? '',
              ImageFileName1: photos[1]?.fileName ?? '',
              ImageFileBase64Str1: photos[1]?.base64 ?? '',
              ImageFileName2: photos[2]?.fileName ?? '',
              ImageFileBase64Str2: photos[2]?.base64 ?? '',
            }
          : {}),
      });
      ensureSuccess(res, 'Failed to update, please try again');
      Alert.alert('Lead', res?.Message || 'Lead added successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Lead', e instanceof Error ? e.message : 'Failed to update, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.label}>Customer Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={onNameChange}
          placeholder="Enter customer name"
          placeholderTextColor={COLORS.textTertiary}
        />
        {suggestions.length > 0 && (
          <View style={styles.suggestBox}>
            {suggestions.map((c, i) => (
              <Pressable
                key={`${c.CustomerDetailsid ?? i}`}
                style={styles.suggestRow}
                onPress={() => pickCustomer(c)}
              >
                <Text style={styles.suggestName}>{c.CustomerName}</Text>
                <Text style={styles.suggestSub}>{c.MobileNumber}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.label}>Mobile Number *</Text>
        <TextInput
          style={styles.input}
          value={mobile}
          onChangeText={t => setMobile(t.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={15}
          placeholder="Enter mobile number"
          placeholderTextColor={COLORS.textTertiary}
        />

        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={address}
          onChangeText={setAddress}
          multiline
          placeholder="Enter address"
          placeholderTextColor={COLORS.textTertiary}
        />

        <Text style={styles.label}>Landmark *</Text>
        <TextInput
          style={styles.input}
          value={landmark}
          onChangeText={setLandmark}
          placeholder="Enter landmark"
          placeholderTextColor={COLORS.textTertiary}
        />

        <Text style={styles.label}>Service Type *</Text>
        <Pressable style={styles.select} onPress={() => setPicker('service')}>
          <Text style={service ? styles.selectText : styles.selectPlaceholder}>
            {service?.label ?? 'Select service type'}
          </Text>
          <Ionicons name="chevron-down" size={sp(18)} color={COLORS.icon} />
        </Pressable>

        <Text style={styles.label}>State{isStateEnable ? ' *' : ''}</Text>
        <Pressable style={styles.select} onPress={() => setPicker('state')}>
          <Text style={stateText ? styles.selectText : styles.selectPlaceholder}>
            {stateText || 'Select state'}
          </Text>
          <Ionicons name="chevron-down" size={sp(18)} color={COLORS.icon} />
        </Pressable>

        <Text style={styles.label}>City{isCityEnable ? ' *' : ''}</Text>
        <Pressable style={styles.select} onPress={() => setPicker('city')}>
          <Text style={cityText ? styles.selectText : styles.selectPlaceholder}>
            {cityText || 'Select city'}
          </Text>
          <Ionicons name="chevron-down" size={sp(18)} color={COLORS.icon} />
        </Pressable>

        <Text style={styles.label}>Pincode{isPincodeEnable ? ' *' : ''}</Text>
        <TextInput
          style={styles.input}
          value={pincode}
          onChangeText={t => setPincode(t.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={10}
          placeholder="Enter pincode"
          placeholderTextColor={COLORS.textTertiary}
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Enter notes"
          placeholderTextColor={COLORS.textTertiary}
        />

        <Text style={styles.label}>Photos</Text>
        <View style={styles.photoRow}>
          {photos.map((p, i) => (
            <View key={i} style={styles.photoWrap}>
              <Pressable style={styles.photoBox} onPress={() => choosePhoto(i)}>
                {p ? (
                  <Image source={{ uri: p.uri }} style={styles.photoImg} />
                ) : (
                  <Ionicons name="camera-outline" size={sp(28)} color={COLORS.textTertiary} />
                )}
              </Pressable>
              {p && (
                <Pressable
                  style={styles.photoRemove}
                  hitSlop={8}
                  onPress={() =>
                    setPhotos(prev => prev.map((x, j) => (j === i ? null : x)))
                  }
                >
                  <Ionicons name="close-circle" size={sp(20)} color={COLORS.primary} />
                </Pressable>
              )}
            </View>
          ))}
        </View>

        <View style={styles.btnRow}>
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => navigation.goBack()}>
            <Text style={styles.btnGhostText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnPrimary, submitting && { opacity: 0.6 }]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnPrimaryText}>Add Lead</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <SearchPickerModal
        visible={picker === 'service'}
        title="Select Service Type"
        options={services}
        onSelect={o => {
          setService(o);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
      <SearchPickerModal
        visible={picker === 'state'}
        title="Select State"
        options={states}
        onSelect={o => {
          setStateText(o.label);
          setCityText('');
          setPicker(null);
          loadCities(o.id);
        }}
        onClose={() => setPicker(null)}
      />
      <SearchPickerModal
        visible={picker === 'city'}
        title="Select City"
        options={cities}
        loading={cityLoading}
        emptyText="Select a state first."
        onSelect={o => {
          setCityText(o.label);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: scale(16), paddingVertical: vs(16), paddingBottom: vs(140) },
  label: {
    fontSize: sp(13),
    fontWeight: '600',
    color: COLORS.textQuaternary,
    marginTop: vs(12),
    marginBottom: vs(6),
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: vs(10),
    fontSize: sp(14),
    color: COLORS.textPrimary,
    backgroundColor: '#fff',
  },
  multiline: { minHeight: vs(70), textAlignVertical: 'top' },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: vs(12),
    backgroundColor: '#fff',
  },
  selectText: { fontSize: sp(14), color: COLORS.textPrimary, flex: 1 },
  selectPlaceholder: { fontSize: sp(14), color: COLORS.textTertiary, flex: 1 },
  suggestBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: scale(8),
    backgroundColor: '#fff',
    marginTop: vs(4),
  },
  suggestRow: {
    paddingHorizontal: scale(12),
    paddingVertical: vs(9),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  suggestName: { fontSize: sp(14), color: COLORS.textPrimary },
  suggestSub: { fontSize: sp(12), color: COLORS.textMuted },
  photoRow: { flexDirection: 'row', gap: scale(12) },
  photoWrap: { position: 'relative' },
  photoBox: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImg: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: -scale(6), right: -scale(6) },
  btnRow: { flexDirection: 'row', gap: scale(12), marginTop: vs(28) },
  btn: {
    flex: 1,
    height: vs(46),
    borderRadius: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnPrimaryText: { color: '#fff', fontSize: sp(15), fontWeight: '600' },
  btnGhost: { borderWidth: 1, borderColor: COLORS.primary },
  btnGhostText: { color: COLORS.primary, fontSize: sp(15), fontWeight: '600' },
});
