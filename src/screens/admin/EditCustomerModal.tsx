import React, {useEffect, useState} from 'react';
import {ms, sp} from '../../utils/responsive';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
import {
  type CityItem,
  type CityListResponse,
  type CustomerTagItem,
  type CustomerTagListResponse,
  type StateItem,
  type StateListResponse,
  type UpdateCustomerDetailsRequest,
} from './adminLegacyApiTypes';
import { getStateList, getCityList, updateCustomerDetails, getCustomerTagList } from '../../api/customerList/customerListService';
import {
  CUSTOMER_ADDRESS_KEYS,
  CUSTOMER_ID_KEYS,
  CUSTOMER_NAME_KEYS,
  CUSTOMER_PHONE_KEYS,
  THEME_PRIMARY,
  extractArray,
  filterLookupOptions,
  getNumberField,
  getStringField,
  normalizeCityOption,
  normalizeStateOption,
  type CityOption,
  type StateOption,
} from './CRMScreen';

const STATE_KEYS = ['state', 'State', 'stateName', 'StateName'];
const CITY_KEYS = ['city', 'City', 'cityName', 'CityName'];
const PINCODE_KEYS = ['pinCode', 'PinCode', 'pincode', 'Pincode', 'zipCode', 'ZipCode'];
const BUILDING_KEYS = ['buildingNumber', 'BuildingNumber', 'building', 'Building'];
const DESCRIPTION_KEYS = [
  'description',
  'Description',
  'landmark',
  'Landmark',
  'landMark',
  'LandMark',
];
const EMAIL_KEYS = ['emailId', 'EmailId', 'email', 'Email'];
const INSTRUCTIONS_KEYS = ['instructions', 'Instructions', 'notes', 'Notes'];
const LOCATION_ID_KEYS = ['locationId', 'LocationId'];
const CUSTOMER_TAG_ID_KEYS = ['customerTagId', 'CustomerTagId'];
const CUSTOMER_TAG_NAME_KEYS = [
  'customerTagName',
  'CustomerTagName',
  'tagName',
  'TagName',
];
const CUSTOMER_GROUP_ID_KEYS = ['customerGroupId', 'CustomerGroupId'];
const COUNTRY_DETAILS_ID_KEYS = ['countryDetailsId', 'CountryDetailsId'];
const BRAND_KEYS = ['brandName', 'BrandName', 'brand', 'Brand', 'productBrand', 'ProductBrand'];
const MODEL_KEYS = ['modelNumber', 'ModelNumber', 'model', 'Model'];
const SECONDARY_ADDRESS_KEYS = ['secondaryAddress', 'SecondaryAddress'];
const SECONDARY_DESCRIPTION_KEYS = [
  'secondaryDescription',
  'SecondaryDescription',
  'secondaryLandmark',
  'SecondaryLandmark',
];
const SECONDARY_EMAIL_KEYS = [
  'secondaryEmailId',
  'SecondaryEmailId',
  'secondaryEmail',
  'SecondaryEmail',
];
const SECONDARY_INSTRUCTIONS_KEYS = [
  'secondaryInstructions',
  'SecondaryInstructions',
  'secondaryNotes',
  'SecondaryNotes',
];
const SECONDARY_MOBILE_KEYS = [
  'secondaryMobileNumber',
  'SecondaryMobileNumber',
  'secondaryPhone',
  'SecondaryPhone',
  'secondaryContactNo',
  'SecondaryContactNo',
];
const REPRESENTATIVE_NAME_KEYS = ['representativeName', 'RepresentativeName'];
const REPRESENTATIVE_NUMBER_KEYS = [
  'representativeNumber',
  'RepresentativeNumber',
  'representativeMobileNumber',
  'RepresentativeMobileNumber',
];

const getBooleanField = (
  item: Record<string, unknown>,
  keys: string[],
  fallback: boolean,
) => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }
  return fallback;
};

type CustomerTagOption = {
  id: number;
  name: string;
};

const normalizeCustomerTagOption = (item: CustomerTagItem): CustomerTagOption => ({
  id: getNumberField(item as Record<string, unknown>, CUSTOMER_TAG_ID_KEYS),
  name: getStringField(item as Record<string, unknown>, CUSTOMER_TAG_NAME_KEYS),
});

type EditCustomerModalProps = {
  visible: boolean;
  ownerId: number;
  customer: Record<string, unknown> | null;
  onClose: () => void;
  onUpdated: (customer: Record<string, unknown>) => void;
};

const EMPTY_FORM = {
  customerDetailsId: 0,
  customerName: '',
  address: '',
  buildingNumber: '',
  state: '',
  city: '',
  pinCode: '',
  description: '',
  mobileNumber: '',
  emailId: '',
  representativeName: '',
  representativeNumber: '',
  instructions: '',
  secondaryAddress: '',
  secondaryDescription: '',
  secondaryMobileNumber: '',
  secondaryEmailId: '',
  secondaryInstructions: '',
  brandName: '',
  modelNumber: '',
};

const EditCustomerModal = ({
  visible,
  ownerId,
  customer,
  onClose,
  onUpdated,
}: EditCustomerModalProps) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [locationId, setLocationId] = useState(0);
  const [customerGroupId, setCustomerGroupId] = useState(0);
  const [countryDetailsId, setCountryDetailsId] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [customerTagId, setCustomerTagId] = useState(0);
  const [customerTagName, setCustomerTagName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [allStateOptions, setAllStateOptions] = useState<StateOption[]>([]);
  const [stateSuggestions, setStateSuggestions] = useState<StateOption[]>([]);
  const [isStateLoading, setIsStateLoading] = useState(false);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);

  const [allCityOptions, setAllCityOptions] = useState<CityOption[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<CityOption[]>([]);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState(0);

  const [customerTags, setCustomerTags] = useState<CustomerTagOption[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isTagLoading, setIsTagLoading] = useState(false);

  useEffect(() => {
    if (!visible || !customer) {
      return;
    }

    const record = customer as Record<string, unknown>;

    setForm({
      customerDetailsId: getNumberField(record, CUSTOMER_ID_KEYS),
      customerName: getStringField(record, CUSTOMER_NAME_KEYS),
      address: getStringField(record, CUSTOMER_ADDRESS_KEYS),
      buildingNumber: getStringField(record, BUILDING_KEYS),
      state: getStringField(record, STATE_KEYS),
      city: getStringField(record, CITY_KEYS),
      pinCode: getStringField(record, PINCODE_KEYS),
      description: getStringField(record, DESCRIPTION_KEYS),
      mobileNumber: getStringField(record, CUSTOMER_PHONE_KEYS),
      emailId: getStringField(record, EMAIL_KEYS),
      representativeName: getStringField(record, REPRESENTATIVE_NAME_KEYS),
      representativeNumber: getStringField(record, REPRESENTATIVE_NUMBER_KEYS),
      instructions: getStringField(record, INSTRUCTIONS_KEYS),
      secondaryAddress: getStringField(record, SECONDARY_ADDRESS_KEYS),
      secondaryDescription: getStringField(record, SECONDARY_DESCRIPTION_KEYS),
      secondaryMobileNumber: getStringField(record, SECONDARY_MOBILE_KEYS),
      secondaryEmailId: getStringField(record, SECONDARY_EMAIL_KEYS),
      secondaryInstructions: getStringField(record, SECONDARY_INSTRUCTIONS_KEYS),
      brandName: getStringField(record, BRAND_KEYS),
      modelNumber: getStringField(record, MODEL_KEYS),
    });
    setLocationId(getNumberField(record, LOCATION_ID_KEYS));
    setCustomerGroupId(getNumberField(record, CUSTOMER_GROUP_ID_KEYS));
    setCountryDetailsId(getNumberField(record, COUNTRY_DETAILS_ID_KEYS));
    setIsActive(getBooleanField(record, ['isActive', 'IsActive'], true));
    setCustomerTagId(getNumberField(record, CUSTOMER_TAG_ID_KEYS));
    setCustomerTagName(getStringField(record, CUSTOMER_TAG_NAME_KEYS));

    setSelectedStateId(0);
    setAllCityOptions([]);
    setCitySuggestions([]);
    setStateSuggestions([]);
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
  }, [visible, customer]);

  const setField = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm(previous => ({...previous, [key]: value}));
  };

  const loadStateSuggestions = async (query: string) => {
    if (allStateOptions.length > 0) {
      setStateSuggestions(filterLookupOptions(allStateOptions, query));
      return;
    }
    if (isStateLoading) {
      return;
    }
    setIsStateLoading(true);
    try {
      const response = (await getStateList()) as StateListResponse;
      const normalized = extractArray<StateItem>(response)
        .map(normalizeStateOption)
        .filter(option => option.id > 0 && option.name);
      setAllStateOptions(normalized);
      setStateSuggestions(filterLookupOptions(normalized, query));
    } catch {
      setStateSuggestions([]);
    } finally {
      setIsStateLoading(false);
    }
  };

  const loadCitySuggestions = async (query: string, forStateId: number) => {
    if (!forStateId) {
      setCitySuggestions([]);
      return;
    }
    if (allCityOptions.length > 0) {
      setCitySuggestions(filterLookupOptions(allCityOptions, query));
      return;
    }
    if (isCityLoading) {
      return;
    }
    setIsCityLoading(true);
    try {
      const response = (await getCityList({
        UserId: ownerId,
        StateId: forStateId,
      })) as CityListResponse;
      const normalized = extractArray<CityItem>(response)
        .map(normalizeCityOption)
        .filter(option => option.id > 0 && option.name);
      setAllCityOptions(normalized);
      setCitySuggestions(filterLookupOptions(normalized, query));
    } catch {
      setCitySuggestions([]);
    } finally {
      setIsCityLoading(false);
    }
  };

  const handleStateSelect = (option: StateOption) => {
    setSelectedStateId(option.id);
    setField('state', option.name);
    setStateSuggestions([]);
    setShowStateSuggestions(false);
    setAllCityOptions([]);
    setCitySuggestions([]);
  };

  const handleCitySelect = (option: CityOption) => {
    setField('city', option.name);
    setCitySuggestions([]);
    setShowCitySuggestions(false);
  };

  const loadCustomerTags = () => {
    if (customerTags.length > 0 || isTagLoading) {
      return;
    }
    setIsTagLoading(true);
    getCustomerTagList({UserId: ownerId})
      .then(response => {
        const items = extractArray<CustomerTagItem>(response as CustomerTagListResponse)
          .map(normalizeCustomerTagOption)
          .filter(option => option.id > 0 && option.name);
        setCustomerTags(items);
      })
      .catch(() => setCustomerTags([]))
      .finally(() => setIsTagLoading(false));
  };

  const handleTagSelect = (option: CustomerTagOption) => {
    setCustomerTagId(option.id);
    setCustomerTagName(option.name);
    setIsTagModalOpen(false);
  };

  const handleUpdate = async () => {
    if (!form.customerName.trim()) {
      Alert.alert('Edit Customer', 'Customer Name is required.');
      return;
    }
    if (!form.address.trim()) {
      Alert.alert('Edit Customer', 'Primary Address is required.');
      return;
    }
    if (!form.state.trim() || !form.city.trim() || !form.pinCode.trim()) {
      Alert.alert('Edit Customer', 'State, City and Pin Code are required.');
      return;
    }
    if (!form.mobileNumber.trim()) {
      Alert.alert('Edit Customer', 'Phone Number is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: UpdateCustomerDetailsRequest = {
        Address: form.address.trim(),
        BrandName: form.brandName.trim(),
        BuildingNumber: form.buildingNumber.trim(),
        City: form.city.trim(),
        CountryDetailsId: countryDetailsId,
        CreatedBy: ownerId,
        CustomerDetailsid: form.customerDetailsId,
        CustomerGroupId: customerGroupId,
        CustomerName: form.customerName.trim(),
        CustomerTagId: customerTagId,
        Description: form.description.trim(),
        EmailId: form.emailId.trim(),
        Instructions: form.instructions.trim(),
        IsActive: isActive,
        LocationId: locationId,
        MobileNumber: form.mobileNumber.trim(),
        ModelNumber: form.modelNumber.trim(),
        PinCode: form.pinCode.trim(),
        SecondaryAddress: form.secondaryAddress.trim(),
        SecondaryDescription: form.secondaryDescription.trim(),
        SecondaryEmailId: form.secondaryEmailId.trim(),
        SecondaryInstructions: form.secondaryInstructions.trim(),
        SecondaryMobileNumber: form.secondaryMobileNumber.trim(),
        State: form.state.trim(),
        UpdatedBy: ownerId,
      };

      const response = await updateCustomerDetails(
        payload as unknown as Parameters<typeof updateCustomerDetails>[0],
      );
      const responseRecord = (response ?? {}) as Record<string, unknown>;
      const code = String(responseRecord.code ?? responseRecord.Code ?? '');
      const message = String(responseRecord.message ?? responseRecord.Message ?? '').trim();

      if (code && code !== '200' && code !== '') {
        throw new Error(message || 'Unable to update customer details.');
      }

      Alert.alert('Edit Customer', message || 'Customer details updated successfully.');
      onUpdated({
        ...(customer ?? {}),
        ...payload,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update customer details.';
      Alert.alert('Edit Customer', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Customer</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.headerCloseIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <LabeledField
              label="Customer Name"
              required
              value={form.customerName}
              onChangeText={text => setField('customerName', text)}
            />

            <Text style={styles.sectionLabel}>Primary Details</Text>

            <LabeledField
              label="Primary Address"
              required
              value={form.address}
              onChangeText={text => setField('address', text)}
            />

            <LabeledField
              label="Building / Flat Number"
              value={form.buildingNumber}
              onChangeText={text => setField('buildingNumber', text)}
            />

            <View style={styles.fieldRow}>
              <View style={[styles.halfWrap, styles.stateZIndex]}>
                <LabeledField
                  label="State"
                  required
                  half
                  value={form.state}
                  onChangeText={text => {
                    setField('state', text);
                    setSelectedStateId(0);
                    setShowStateSuggestions(true);
                    if (text.trim().length >= 2) {
                      loadStateSuggestions(text);
                    } else {
                      setStateSuggestions([]);
                    }
                  }}
                  onFocus={() => setShowStateSuggestions(true)}
                />
                {showStateSuggestions &&
                form.state.trim().length >= 2 &&
                (isStateLoading || stateSuggestions.length > 0) ? (
                  <View style={styles.suggestionBox}>
                    {isStateLoading ? (
                      <ActivityIndicator
                        color={THEME_PRIMARY}
                        size="small"
                        style={styles.suggestionLoader}
                      />
                    ) : (
                      <ScrollView style={styles.suggestionScroll} nestedScrollEnabled>
                        {stateSuggestions.map(option => (
                          <TouchableOpacity
                            key={option.id}
                            style={styles.suggestionItem}
                            onPress={() => handleStateSelect(option)}
                          >
                            <Text numberOfLines={1} style={styles.suggestionItemText}>
                              {option.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                ) : null}
              </View>
              <View style={styles.halfWrap}>
                <LabeledField
                  label="City"
                  required
                  half
                  value={form.city}
                  onChangeText={text => {
                    setField('city', text);
                    setShowCitySuggestions(true);
                    if (selectedStateId && text.trim().length >= 2) {
                      loadCitySuggestions(text, selectedStateId);
                    } else {
                      setCitySuggestions([]);
                    }
                  }}
                  onFocus={() => setShowCitySuggestions(true)}
                />
                {showCitySuggestions &&
                form.city.trim().length >= 2 &&
                (isCityLoading || citySuggestions.length > 0) ? (
                  <View style={styles.suggestionBox}>
                    {isCityLoading ? (
                      <ActivityIndicator
                        color={THEME_PRIMARY}
                        size="small"
                        style={styles.suggestionLoader}
                      />
                    ) : (
                      <ScrollView style={styles.suggestionScroll} nestedScrollEnabled>
                        {citySuggestions.map(option => (
                          <TouchableOpacity
                            key={option.id}
                            style={styles.suggestionItem}
                            onPress={() => handleCitySelect(option)}
                          >
                            <Text numberOfLines={1} style={styles.suggestionItemText}>
                              {option.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                ) : null}
              </View>
            </View>

            <LabeledField
              label="Pin Code"
              required
              value={form.pinCode}
              keyboardType="number-pad"
              maxLength={6}
              onChangeText={text => setField('pinCode', text.replace(/[^0-9]/g, '').slice(0, 6))}
            />

            <View style={styles.fieldRow}>
              <View style={styles.halfWrap}>
                <LabeledField
                  label="Landmark/PACI"
                  required
                  half
                  value={form.description}
                  onChangeText={text => setField('description', text)}
                />
              </View>
              <View style={styles.halfWrap}>
                <LabeledField
                  label="Phone Number"
                  required
                  half
                  value={form.mobileNumber}
                  keyboardType="phone-pad"
                  icon="👤"
                  onChangeText={text => setField('mobileNumber', text)}
                />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.halfWrap}>
                <LabeledField
                  label="Email ID"
                  half
                  value={form.emailId}
                  keyboardType="email-address"
                  onChangeText={text => setField('emailId', text)}
                />
              </View>
              <TouchableOpacity
                style={[styles.halfWrap, styles.dropdownField]}
                onPress={() => {
                  loadCustomerTags();
                  setIsTagModalOpen(true);
                }}
              >
                <Text
                  style={
                    customerTagName
                      ? styles.dropdownValueText
                      : styles.dropdownPlaceholderText
                  }
                  numberOfLines={1}
                >
                  {customerTagName || 'Select Customer Tag'}
                </Text>
                <Ionicons name="chevron-down" style={styles.dropdownChevron} />
              </TouchableOpacity>
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.halfWrap}>
                <LabeledField
                  label="Representative Name"
                  half
                  value={form.representativeName}
                  onChangeText={text => setField('representativeName', text)}
                />
              </View>
              <View style={styles.halfWrap}>
                <LabeledField
                  label="Representative Number"
                  half
                  value={form.representativeNumber}
                  keyboardType="phone-pad"
                  onChangeText={text => setField('representativeNumber', text)}
                />
              </View>
            </View>

            <LabeledField
              label="Notes"
              value={form.instructions}
              onChangeText={text => setField('instructions', text)}
            />

            <Text style={styles.sectionLabel}>Secondary Details</Text>

            <LabeledField
              label="Secondary Address"
              value={form.secondaryAddress}
              onChangeText={text => setField('secondaryAddress', text)}
            />

            <View style={styles.fieldRow}>
              <View style={styles.halfWrap}>
                <LabeledField
                  label="Landmark/PACI"
                  half
                  value={form.secondaryDescription}
                  onChangeText={text => setField('secondaryDescription', text)}
                />
              </View>
              <View style={styles.halfWrap}>
                <LabeledField
                  label="Phone Number"
                  half
                  value={form.secondaryMobileNumber}
                  keyboardType="phone-pad"
                  icon="👤"
                  onChangeText={text => setField('secondaryMobileNumber', text)}
                />
              </View>
            </View>

            <LabeledField
              label="Email ID"
              value={form.secondaryEmailId}
              keyboardType="email-address"
              onChangeText={text => setField('secondaryEmailId', text)}
            />

            <LabeledField
              label="Notes"
              value={form.secondaryInstructions}
              onChangeText={text => setField('secondaryInstructions', text)}
            />

            <Text style={styles.sectionLabel}>Asset Details</Text>

            <LabeledField
              label="Brand Name"
              value={form.brandName}
              onChangeText={text => setField('brandName', text)}
            />

            <LabeledField
              label="Model Number"
              value={form.modelNumber}
              onChangeText={text => setField('modelNumber', text)}
            />

            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.updateButtonIcon}>?</Text>
                  <Text style={styles.updateButtonText}>UPDATE</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <Modal
        visible={isTagModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsTagModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.tagModalOverlay}
          activeOpacity={1}
          onPress={() => setIsTagModalOpen(false)}
        >
          <View style={styles.tagModalSheet}>
            <Text style={styles.tagModalTitle}>Select Customer Tag</Text>
            {isTagLoading ? (
              <ActivityIndicator color={THEME_PRIMARY} style={styles.tagModalLoader} />
            ) : customerTags.length === 0 ? (
              <Text style={styles.tagModalEmptyText}>No customer tags available.</Text>
            ) : (
              <ScrollView style={styles.tagModalScroll}>
                {customerTags.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.tagModalItem}
                    onPress={() => handleTagSelect(option)}
                  >
                    <Text style={styles.tagModalItemText}>{option.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

type LabeledFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  required?: boolean;
  half?: boolean;
  icon?: string;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad' | 'email-address';
  maxLength?: number;
  onFocus?: () => void;
};

const LabeledField = ({
  label,
  value,
  onChangeText,
  required,
  half,
  icon,
  keyboardType,
  maxLength,
  onFocus,
}: LabeledFieldProps) => {
  const labelText = `${label}${required ? ' *' : ''}`;
  return (
    <View style={half ? styles.fieldBoxHalf : styles.fieldBox}>
      <Text style={[styles.fieldLabel, {opacity: value ? 1 : 0}]}>{labelText}</Text>
      <View style={styles.fieldInputRow}>
        <TextInput
          style={styles.fieldInput}
          placeholder={labelText}
          placeholderTextColor="#9aa0a6"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          maxLength={maxLength}
          onFocus={onFocus}
        />
        {icon ? <Text style={styles.fieldInputIcon}>{icon}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3a3a3c',
    paddingHorizontal: ms(16),
    paddingVertical: ms(16),
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: sp(17),
    fontWeight: '700',
  },
  headerCloseIcon: {
    color: '#FFFFFF',
    fontSize: sp(20),
  },
  scrollContent: {
    padding: ms(16),
    paddingBottom: ms(32),
    width: '100%',
    maxWidth: ms(640),
    alignSelf: 'center',
  },
  sectionLabel: {
    fontSize: sp(13),
    fontWeight: '700',
    color: '#222',
    marginTop: ms(6),
    marginBottom: ms(12),
  },
  fieldBox: {
    borderWidth: ms(1),
    borderColor: '#d5d7db',
    borderRadius: ms(24),
    paddingHorizontal: ms(16),
    paddingTop: ms(6),
    paddingBottom: ms(6),
    marginBottom: ms(14),
    justifyContent: 'center',
    minHeight: ms(46),
  },
  fieldBoxHalf: {
    flex: 1,
    borderWidth: ms(1),
    borderColor: '#d5d7db',
    borderRadius: ms(24),
    paddingHorizontal: ms(16),
    paddingTop: ms(6),
    paddingBottom: ms(6),
    justifyContent: 'center',
    minHeight: ms(46),
  },
  fieldRow: {
    flexDirection: 'row',
    gap: ms(12),
    marginBottom: ms(14),
  },
  halfWrap: {
    flex: 1,
    position: 'relative',
  },
  stateZIndex: {
    zIndex: 2,
  },
  fieldLabel: {
    fontSize: sp(10),
    color: '#8a8f98',
    marginBottom: ms(2),
  },
  fieldInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldInput: {
    flex: 1,
    fontSize: sp(13),
    color: '#222',
    padding: 0,
    height: ms(20),
  },
  fieldInputIcon: {
    fontSize: sp(16),
    color: THEME_PRIMARY,
    marginLeft: ms(8),
  },
  dropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ms(46),
  },
  dropdownValueText: {
    fontSize: sp(13),
    color: '#222',
    flex: 1,
  },
  dropdownPlaceholderText: {
    fontSize: sp(13),
    color: '#9aa0a6',
    flex: 1,
  },
  dropdownChevron: {
    fontSize: sp(16),
    color: '#8a8f98',
    marginLeft: ms(8),
  },
  suggestionBox: {
    position: 'absolute',
    top: ms(48),
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: ms(1),
    borderColor: '#e1e2e5',
    borderRadius: ms(8),
    maxHeight: ms(200),
    overflow: 'hidden',
    zIndex: 10,
    elevation: 8,
  },
  suggestionScroll: {
    maxHeight: ms(200),
  },
  suggestionLoader: {
    paddingVertical: ms(10),
  },
  suggestionItem: {
    paddingHorizontal: ms(14),
    paddingVertical: ms(10),
    borderBottomWidth: ms(1),
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#FFFFFF',
  },
  suggestionItemText: {
    fontSize: sp(13),
    color: '#222',
  },
  updateButton: {
    flexDirection: 'row',
    backgroundColor: THEME_PRIMARY,
    borderRadius: ms(24),
    height: ms(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ms(6),
    marginBottom: ms(14),
    gap: ms(8),
  },
  updateButtonIcon: {
    color: '#FFFFFF',
    fontSize: sp(14),
    fontWeight: '700',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: sp(14),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cancelText: {
    textAlign: 'center',
    color: THEME_PRIMARY,
    fontSize: sp(14),
    fontWeight: '600',
  },
  tagModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: ms(24),
  },
  tagModalSheet: {
    width: '100%',
    maxWidth: ms(360),
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    padding: ms(16),
  },
  tagModalTitle: {
    fontSize: sp(15),
    fontWeight: '700',
    color: '#222',
    marginBottom: ms(10),
  },
  tagModalScroll: {
    maxHeight: ms(320),
  },
  tagModalItem: {
    paddingVertical: ms(12),
    borderBottomWidth: ms(1),
    borderBottomColor: '#f0f0f0',
  },
  tagModalItemText: {
    fontSize: sp(14),
    color: '#222',
  },
  tagModalLoader: {
    paddingVertical: ms(16),
  },
  tagModalEmptyText: {
    fontSize: sp(13),
    color: '#8a8f98',
    paddingVertical: ms(16),
    textAlign: 'center',
  },
});

export default EditCustomerModal;