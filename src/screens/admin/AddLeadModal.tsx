// src/screens/admin/AddLeadModal.tsx
//
// Port of Java's LeadManagement/AddEditLeadDialog.addLead -- a single shared
// dialog for both owner and technician, differing only in which endpoint the
// submit goes to (Java: addExternalLeadForm vs addExternalLeadFormByTech,
// picked by SharedPrefManager's user group) and how Created/UpdatedBy/UserId
// are stamped. Not ported: Google Places address picker (plain text address,
// lat/long "0"), contact-book picker. Opens as a sliding-up modal from the FAB.

import { launchCameraWithPermission } from '../../utils/cameraPermission';
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
import Modal from '../../components/AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS } from '../../theme/theme';
import { scale, vs, sp } from '../../utils/responsive';
import SearchPickerModal, { PickerOption } from '../../components/SearchPickerModal';
import { OutlinedInput, OutlinedSelect } from '../../components/OutlinedInput';
import PlaceSearchModal from '../../components/PlaceSearchModal';
import { ensureSuccess } from '../../utils/apiResponse';
import {
  getCurrentUserId,
  getCurrentUserProfile,
  isIndiaCountryDetailsId,
} from '../../state/session';
import { getCustomerList, getStateList, getCityList } from '../../api/customerList/customerListService';
import type { CustomerListResultData } from '../../api/customerList/customerList.types';
import { getEnquiryServiceTypeList } from '../../api/services/servicesService';
import { postExternalLeadForm, postExternalLeadFormByTech } from '../../api/leadForm/leadFormService';

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

type AddLeadModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  technician?: boolean;
};

export default function AddLeadModal({ visible, onClose, onSuccess, technician = false }: AddLeadModalProps) {
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
  const [placeSearchOpen, setPlaceSearchOpen] = useState(false);
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
      { text: 'Camera', onPress: async () => handle(await launchCameraWithPermission(options), 'Camera') },
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
      const payload = {
        CustomerName: name,
        MobileNumber: mobile,
        Address: address,
        LocName: '',
        LocDescription: landmark,
        ServiceName: service?.label ?? '',
        ServicesId: service?.id ?? 0,
        CustomerDetailsid: customerId,
        Description: notes,
        // Java: owner branch stamps Created/UpdatedBy with the owner's id;
        // the technician branch zeroes both and sends UserId instead.
        UpdatedBy: technician ? 0 : userId,
        CreatedBy: technician ? 0 : userId,
        ...(technician ? { UserId: userId } : {}),
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
      };
      const res = technician
        ? await postExternalLeadFormByTech(payload)
        : await postExternalLeadForm(payload as unknown as Parameters<typeof postExternalLeadForm>[0]);
      ensureSuccess(res, 'Failed to update, please try again');
      Alert.alert('Lead', res?.Message || 'Lead added successfully.', [
        { text: 'OK', onPress: () => { onSuccess?.(); onClose(); } },
      ]);
    } catch (e) {
      Alert.alert('Lead', e instanceof Error ? e.message : 'Failed to update, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Lead Form</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={scale(30)} color={COLORS.white} />
            </Pressable>
          </View>

          <KeyboardAvoidingView
            style={styles.flexShrink}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
        <OutlinedInput
          style={styles.input}
          value={name}
          onChangeText={onNameChange}
          placeholder="Customer Name *"
          placeholderTextColor={COLORS.lightGray}
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

        <OutlinedInput
          style={styles.input}
          value={mobile}
          onChangeText={t => setMobile(t.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={15}
          placeholder="Phone Number *"
          placeholderTextColor={COLORS.lightGray}
        />

        {/* Java: tapping the address opens the full-screen Google Places search. */}
        <Pressable onPress={() => setPlaceSearchOpen(true)}>
          <View pointerEvents="none">
            <OutlinedInput
              style={styles.input}
              value={address}
              editable={false}
              placeholder="Customer Address *"
              placeholderTextColor={COLORS.lightGray}
            />
          </View>
        </Pressable>

        <View style={styles.halfRow}>
          <OutlinedSelect
            style={[styles.input, styles.half]}
            label={`State${isStateEnable ? ' *' : ''}`}
            value={stateText}
            onPress={() => setPicker('state')}
          />
          <OutlinedSelect
            style={[styles.input, styles.half]}
            label={`City${isCityEnable ? ' *' : ''}`}
            value={cityText}
            onPress={() => setPicker('city')}
          />
        </View>

        <View style={styles.halfRow}>
          <OutlinedInput
            style={[styles.input, styles.half]}
            value={pincode}
            onChangeText={t => setPincode(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={10}
            placeholder={`Pin Code${isPincodeEnable ? ' *' : ''}`}
            placeholderTextColor={COLORS.lightGray}
          />
          <View style={styles.half} />
        </View>

        <OutlinedInput
          style={styles.input}
          value={landmark}
          onChangeText={setLandmark}
          placeholder="Landmark *"
          placeholderTextColor={COLORS.lightGray}
        />

        <OutlinedSelect
          style={[styles.input, styles.serviceInput]}
          label="Select Service Type"
          value={service?.label}
          chevron
          onPress={() => setPicker('service')}
        />

        <View style={styles.photoRow}>
          {photos.map((p, i) => (
            <View key={i} style={styles.photoWrap}>
              <Pressable style={styles.photoBox} onPress={() => choosePhoto(i)}>
                {p ? (
                  <Image source={{ uri: p.uri }} style={styles.photoImg} />
                ) : (
                  <Ionicons name="camera-outline" size={sp(50)} color={COLORS.lightGray} />
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

        <OutlinedInput
          style={[styles.input, styles.notes]}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Notes"
          placeholderTextColor={COLORS.lightGray}
        />

        <View style={styles.btnRow}>
          <Pressable
            style={[styles.btn, styles.btnPrimary, submitting && { opacity: 0.6 }]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnPrimaryText}>ADD</Text>
            )}
          </Pressable>
          <Pressable style={[styles.btn]} onPress={onClose}>
            <Text style={styles.btnGhostText}>Cancel</Text>
          </Pressable>
        </View>
            </ScrollView>
          </KeyboardAvoidingView>

          <PlaceSearchModal
            visible={placeSearchOpen}
            onClose={() => setPlaceSearchOpen(false)}
            onSelect={place => {
              setAddress(place.address);
              setLatitude(String(place.latitude));
              setLongitude(String(place.longitude));
              setPlaceSearchOpen(false);
            }}
          />
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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: COLORS.background,
    width: '100%',
    maxHeight: '94%',
    overflow: 'hidden',
    borderTopLeftRadius: scale(25),
    borderTopRightRadius: scale(25),
  },
  // Java gradient_addtask header: #353935, 20dp corners, 60dp tall, 22sp title.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.statusOnHold,
    paddingHorizontal: scale(20),
    height: vs(60),
    borderRadius: scale(20),
  },
  headerTitle: { color: COLORS.white, fontSize: sp(22) },
  flexShrink: { flexShrink: 1 },
  content: { paddingHorizontal: scale(20), paddingTop: vs(20), paddingBottom: vs(24) },
  // Java TextInputLayoutStyle: outlined pill, light-gray stroke, 34dp radius, 16sp text.
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: scale(34),
    paddingHorizontal: scale(18),
    height: vs(42),
    fontSize: sp(16),
    color: COLORS.ink,
    backgroundColor: COLORS.white,
    marginBottom: vs(26), // room Material reserves for the error line
  },
  halfRow: { flexDirection: 'row', gap: scale(20) },
  half: { flex: 1 },
  serviceInput: { marginBottom: vs(16) },
  notes: { height: vs(100), paddingTop: vs(14), textAlignVertical: 'top' },
  suggestBox: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: scale(15),
    backgroundColor: COLORS.white,
    marginTop: -vs(18),
    marginBottom: vs(12),
  },
  suggestRow: {
    paddingHorizontal: scale(12),
    paddingVertical: vs(9),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  suggestName: { fontSize: sp(14), color: COLORS.ink },
  suggestSub: { fontSize: sp(12), color: COLORS.lightGray },
  photoRow: { flexDirection: 'row', gap: scale(16), marginBottom: vs(26) },
  photoWrap: { position: 'relative', flex: 1 },
  photoBox: {
    height: vs(100),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImg: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: -scale(6), right: -scale(6) },
  btnRow: { flexDirection: 'column', gap: scale(10), marginTop: vs(6) },
  btn: {
    height: vs(52),
    borderRadius: scale(34),
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: COLORS.statusOnHold, elevation: 4 },
  btnPrimaryText: { color: COLORS.white, fontSize: sp(20) },
  btnGhostText: { color: COLORS.primary, fontSize: sp(18) },
});
