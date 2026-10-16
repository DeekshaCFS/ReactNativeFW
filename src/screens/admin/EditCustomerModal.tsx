import React, {useEffect, useState} from 'react';
import {ms, sp} from '../../utils/responsive';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from '../../components/AppModal';
import OutlinedInput from '../../components/OutlinedInput';
import PlaceSearchModal from '../../components/PlaceSearchModal';
import {ContactBookIcon, EnquiryIcon} from '../../components/FabIcons';
import {COLORS} from '../../theme/theme';
import {taskStyles} from './AddTaskModal';
import {
  type CityItem,
  type CityListResponse,
  type CustomerTagItem,
  type CustomerTagListResponse,
  type StateItem,
  type StateListResponse,
  type UpdateCustomerDetailsRequest,
} from './adminLegacyApiTypes';
import { ensureSuccess } from '../../utils/apiResponse';
import { getStateList, getCityList, updateCustomerDetails, addCustomer, getCustomerTagList } from '../../api/customerList/customerListService';
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
} from './crmShared';
import { showFailureMsg, showSuccessMsg } from '../../utils/toast';

import {useTranslation} from 'react-i18next';
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
  /** 'add' mirrors Java's dialog_add_customer; the default edits `customer`. */
  mode?: 'add' | 'edit';
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
  telephoneNumber: '',
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
  mode = 'edit',
  onClose,
  onUpdated,
}: EditCustomerModalProps) => {
  const {t} = useTranslation();
  const isAddMode = mode === 'add';
  const modalTitle = isAddMode ? 'Add Customer' : 'Edit Customer';
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
  // Which address field the Google Places search is currently filling.
  const [placeSearchFor, setPlaceSearchFor] = useState<'address' | 'secondaryAddress' | null>(null);
  const [pickedCoords, setPickedCoords] = useState<{latitude: string; longitude: string} | null>(null);

  useEffect(() => {
    setPickedCoords(null);
    setPlaceSearchFor(null);
  }, [visible]);

  useEffect(() => {
    if (visible && isAddMode) {
      setForm(EMPTY_FORM);
      setLocationId(0);
      setCustomerGroupId(0);
      setCountryDetailsId(0);
      setIsActive(true);
      setCustomerTagId(0);
      setCustomerTagName('');
      setSelectedStateId(0);
      setAllCityOptions([]);
      setCitySuggestions([]);
      setStateSuggestions([]);
      setShowStateSuggestions(false);
      setShowCitySuggestions(false);
      return;
    }
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
      telephoneNumber: '',
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
  }, [visible, customer, isAddMode]);

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
      showFailureMsg('Customer Name is required.');
      return;
    }
    if (!form.address.trim()) {
      showFailureMsg('Primary Address is required.');
      return;
    }
    if (!form.state.trim() || !form.city.trim() || !form.pinCode.trim()) {
      showFailureMsg('State, City and Pin Code are required.');
      return;
    }
    if (!form.mobileNumber.trim()) {
      showFailureMsg('Phone Number is required.');
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
        // Java re-sends the stored coordinates on update; omitting them risks
        // clearing the customer's saved map location.
        latitude: pickedCoords?.latitude ?? String(customer?.latitude ?? customer?.Latitude ?? ''),
        Longitude: pickedCoords?.longitude ?? String(customer?.Longitude ?? customer?.longitude ?? ''),
      };

      if (isAddMode) {
        // Java (EnquiryDialogNew add-customer): same fields as update, plus
        // Telephone_Number and an AddressList entry carrying the representative.
        const addPayload = {
          Address: payload.Address,
          BrandName: payload.BrandName,
          BuildingNumber: payload.BuildingNumber,
          City: payload.City,
          CreatedBy: ownerId,
          CustomerName: payload.CustomerName,
          CustomerTagId: customerTagId,
          CustomerTagName: customerTagName,
          Description: payload.Description,
          EmailId: payload.EmailId,
          Instructions: payload.Instructions,
          IsActive: true,
          MobileNumber: payload.MobileNumber,
          ModelNumber: payload.ModelNumber,
          PinCode: payload.PinCode,
          SecondaryAddress: payload.SecondaryAddress,
          SecondaryDescription: payload.SecondaryDescription,
          SecondaryEmailId: payload.SecondaryEmailId,
          SecondaryInstructions: payload.SecondaryInstructions,
          SecondaryMobileNumber: payload.SecondaryMobileNumber,
          State: payload.State,
          Telephone_Number: form.telephoneNumber.trim(),
          AddressList: [
            {
              AddressId: 0,
              Address: payload.Address,
              State: payload.State,
              City: payload.City,
              PinCode: payload.PinCode,
              LandMarkPACI: form.secondaryDescription.trim(),
              RepName: form.representativeName.trim(),
              RepNo: form.representativeNumber.trim(),
            },
          ],
        };
        const addResponse = ensureSuccess(
          await addCustomer(addPayload as unknown as Parameters<typeof addCustomer>[0]),
        );
        const addRecord = (addResponse ?? {}) as unknown as Record<string, unknown>;
        showSuccessMsg(String(addRecord.Message ?? addRecord.message ?? '').trim() || 'Customer added successfully.');
        onUpdated({...addPayload});
        return;
      }

      const response = await updateCustomerDetails(
        payload as unknown as Parameters<typeof updateCustomerDetails>[0],
      );
      const responseRecord = (response ?? {}) as Record<string, unknown>;
      const code = String(responseRecord.code ?? responseRecord.Code ?? '');
      const message = String(responseRecord.message ?? responseRecord.Message ?? '').trim();

      if (code && code !== '200' && code !== '') {
        throw new Error(message || 'Unable to update customer details.');
      }

      showSuccessMsg(message || 'Customer details updated successfully.');
      onUpdated({
        ...(customer ?? {}),
        ...payload,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update customer details.';
      showFailureMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={taskStyles.modalSheet}>
          <View style={taskStyles.modalHeader}>
            <Text style={taskStyles.modalHeaderTitle}>{modalTitle}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" style={taskStyles.modalCloseIcon} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={taskStyles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
            <LabeledField
              label={t('customer_name')}
              required
              value={form.customerName}
              onChangeText={text => setField('customerName', text)}
            />

            <Text style={styles.sectionLabel}>{t('primary_details')}</Text>

            <LabeledField
              label="Primary Address"
              required
              value={form.address}
              onChangeText={text => setField('address', text)}
              onPress={() => setPlaceSearchFor('address')}
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
                  label={t('city')}
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

            {/* Row order follows dialog_add_customer.xml:
                [Pin Code | Mobile Number], then [Landmark/PACI | Telephone]. */}
            <View style={styles.fieldRow}>
              <View style={styles.halfWrap}>
                <LabeledField
                  label={t('pin_code')}
                  required
                  half
                  value={form.pinCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  onChangeText={text => setField('pinCode', text.replace(/[^0-9]/g, '').slice(0, 6))}
                />
              </View>
              <View style={styles.halfWrap}>
                <LabeledField
                  label={t('mobile_number')}
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
                  label={t('sec_landmark_paci')}
                  required
                  half
                  value={form.description}
                  onChangeText={text => setField('description', text)}
                />
              </View>
              {isAddMode ? (
                <View style={styles.halfWrap}>
                  <LabeledField
                    label={t('tele_number')}
                    half
                    value={form.telephoneNumber}
                    keyboardType="phone-pad"
                    onChangeText={text => setField('telephoneNumber', text)}
                  />
                </View>
              ) : null}
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.halfWrap}>
                <LabeledField
                  label={t('email_id')}
                  half
                  value={form.emailId}
                  keyboardType="email-address"
                  onChangeText={text => setField('emailId', text)}
                />
              </View>
              <View style={styles.halfWrap}>
                <TouchableOpacity
                  style={styles.dropdownField}
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
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.halfWrap}>
                <LabeledField
                  label={t('representative_name')}
                  half
                  value={form.representativeName}
                  onChangeText={text => setField('representativeName', text)}
                />
              </View>
              <View style={styles.halfWrap}>
                <LabeledField
                  label={t('representative_number')}
                  half
                  value={form.representativeNumber}
                  keyboardType="phone-pad"
                  onChangeText={text => setField('representativeNumber', text)}
                />
              </View>
            </View>

            <LabeledField
              label={t('notes')}
              value={form.instructions}
              onChangeText={text => setField('instructions', text)}
            />

            <Text style={styles.sectionLabel}>{t('secondary_details')}</Text>

            <LabeledField
              label={t('secondary_address')}
              value={form.secondaryAddress}
              onChangeText={text => setField('secondaryAddress', text)}
              onPress={() => setPlaceSearchFor('secondaryAddress')}
            />

            <View style={styles.fieldRow}>
              <View style={styles.halfWrap}>
                <LabeledField
                  label={t('sec_landmark_paci')}
                  half
                  value={form.secondaryDescription}
                  onChangeText={text => setField('secondaryDescription', text)}
                />
              </View>
              <View style={styles.halfWrap}>
                <LabeledField
                  label={t('phone_number')}
                  half
                  value={form.secondaryMobileNumber}
                  keyboardType="phone-pad"
                  icon="👤"
                  onChangeText={text => setField('secondaryMobileNumber', text)}
                />
              </View>
            </View>

            <LabeledField
              label={t('email_id')}
              value={form.secondaryEmailId}
              keyboardType="email-address"
              onChangeText={text => setField('secondaryEmailId', text)}
            />

            <LabeledField
              label={t('notes')}
              value={form.secondaryInstructions}
              onChangeText={text => setField('secondaryInstructions', text)}
            />

            <Text style={styles.sectionLabel}>Asset Details</Text>

            <LabeledField
              label={t('label_brand_name')}
              value={form.brandName}
              onChangeText={text => setField('brandName', text)}
            />

            <LabeledField
              label={t('model_number')}
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
                  <View style={styles.updateButtonIconWrap}>
                    <EnquiryIcon size={ms(30)} color="#FFFFFF" />
                  </View>
                  <Text style={styles.updateButtonText}>{isAddMode ? 'ADD' : 'UPDATE'}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose}>
              <Text style={taskStyles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
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

      <PlaceSearchModal
        visible={placeSearchFor !== null}
        onClose={() => setPlaceSearchFor(null)}
        onSelect={place => {
          if (placeSearchFor) {
            setField(placeSearchFor, place.address);
          }
          // Only the primary address carries the customer's map coordinates.
          if (placeSearchFor === 'address') {
            setPickedCoords({latitude: String(place.latitude), longitude: String(place.longitude)});
          }
          setPlaceSearchFor(null);
        }}
      />
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
  // When set the field is read-only and tapping it calls this (Google Places address search).
  onPress?: () => void;
};

// dialog_add_customer: Material outlined (34dp-radius) fields with the hint floating on the border.
const LabeledField = ({
  label,
  required,
  half,
  value,
  onChangeText,
  icon,
  keyboardType,
  maxLength,
  onFocus,
  onPress,
}: LabeledFieldProps) => {
  const labelText = `${label}${required ? ' *' : ''}`;
  return (
    <View style={half ? undefined : styles.fieldFull}>
      <OutlinedInput
        style={[taskStyles.pillInput, {paddingHorizontal: ms(14)}, icon ? {paddingRight: ms(52)} : null]}
        placeholder={labelText}
        placeholderTextColor={COLORS.lightGray}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onFocus={onFocus}
        editable={onPress ? false : undefined}
      />
      {onPress ? (
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onPress} />
      ) : null}
      {icon ? (
        <View style={taskStyles.phonebookButton} pointerEvents="none">
          <ContactBookIcon size={ms(25)} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.dialogDim,
    justifyContent: 'flex-end',
  },
  flex: {
    flexShrink: 1,
  },
  fieldFull: {
    marginBottom: ms(26),
  },
  sectionLabel: {
    fontSize: sp(14),
    fontWeight: '700',
    color: '#000000',
    marginLeft: ms(12),
    marginBottom: ms(14),
  },
  fieldRow: {
    flexDirection: 'row',
    gap: ms(10),
    marginBottom: ms(26),
  },
  halfWrap: {
    flex: 1,
    position: 'relative',
  },
  stateZIndex: {
    zIndex: 2,
  },
  // bg_spinner: 40dp, 34dp radius, 1dp light_gray stroke, 12dp side padding.
  dropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ms(40),
    paddingHorizontal: ms(12),
    borderWidth: ms(1),
    borderColor: COLORS.lightGray,
    borderRadius: ms(34),
    minWidth: 0,
    overflow: 'hidden',
  },
  dropdownValueText: {
    fontSize: sp(14),
    color: '#000000',
    flex: 1,
  },
  dropdownPlaceholderText: {
    fontSize: sp(14),
    color: COLORS.darkGray,
    flex: 1,
  },
  dropdownChevron: {
    fontSize: sp(20),
    color: COLORS.ink,
    marginLeft: ms(6),
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
  // button_add: rounded_button (red, 34dp radius), ic_enq_option on the left, 18sp label.
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: ms(34),
    height: ms(48),
    marginTop: ms(10),
    marginBottom: ms(20),
    elevation: 4,
  },
  updateButtonIconWrap: {
    position: 'absolute',
    left: ms(17),
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: sp(18),
    fontWeight: '500',
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