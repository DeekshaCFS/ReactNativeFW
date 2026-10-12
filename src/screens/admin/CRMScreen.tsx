// src/screens/admin/CRMScreen.tsx

import { launchCameraWithPermission } from '../../utils/cameraPermission';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ms, sp} from '../../utils/responsive';
import {COLORS} from '../../theme/theme';
import {ensureSuccess} from '../../utils/apiResponse';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {getCustomerTagList} from '../../api/customerList/customerListService';
import SearchPickerModal, {type PickerOption} from '../../components/SearchPickerModal';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {HEADER_CONTENT_HEIGHT} from '../../components/AppHeader';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from '../../components/AppModal';
import {
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import {getEnquiryList, addEnquiry, updateEnquiry} from '../../api/customerInquiry/customerInquiryService';
import type {EnquiryListResultData} from '../../api/customerInquiry/customerInquiry.types';
import {getCustomerList, getStateList, getCityList, deleteCustomerDetails} from '../../api/customerList/customerListService';
import type {CustomerListResultData, StateDTOResultData, CityDTOResultData} from '../../api/customerList/customerList.types';
import {getAdvanceServiceList} from '../../api/services/servicesService';
import type {ServiceTypeListDTOResultData} from '../../api/services/services.types';
import {getTaskTagList} from '../../api/task/taskService';
import type {TagListResultData} from '../../api/task/task.types';
import {BASE_URL} from '../../api/apiClient';
import {getCurrentCountryCode} from '../../state/session';
// TODO(temp): inlined from URLConstant.Base.GET_LINK before URLConstant.ts was deleted.
// Was: `${PROTOCOL}${SERVICE_IP}/EnquiryForm/EnquiryForm?Node=` where PROTOCOL='http://', SERVICE_IP='192.169.3.8'.
const ENQUIRY_FORM_LINK = 'http://192.169.3.8/EnquiryForm/EnquiryForm?Node=';

type AddEnquiryRequest = {
  CustomerDetailsid?: number;
  CustomerName: string;
  MobileNumber: string;
  PreferableDate: string;
  PreferableTime: string;
  Address: string;
  State: string;
  City: string;
  PinCode: string;
  LocDescription: string;
  LocName?: string;
  Longitude?: string;
  latitude?: string;
  ServicesId?: number;
  TaskTagId?: number;
  TaskTagName?: string;
  TechnicalProblem?: string;
  TechnicalNote?: string;
  OwnerId: number;
  InquaryState: number;
  ImageFileBase64Str?: string;
  ImageFileName?: string;
  ImageFileBase64Str1?: string;
  ImageFileName1?: string;
  ImageFileBase64Str2?: string;
  ImageFileName2?: string;
  UserId: number;
  CreatedBy: number;
  UpdatedBy: number;
  IsActive?: boolean;
};

type UpdateCustomerInquiryRequest = {
  Address: string;
  CreatedBy: number;
  CustomerDetailsid?: number;
  CustomerName: string;
  EnquiryId: number;
  ImageFileBase64Str?: string;
  ImageFileBase64Str1?: string;
  ImageFileBase64Str2?: string;
  ImageFileName?: string;
  ImageFileName1?: string;
  ImageFileName2?: string;
  InquaryState?: number;
  IsActive?: boolean;
  LocDescription?: string;
  LocName?: string;
  LocationId?: number;
  Longitude?: string;
  MobileNumber: string;
  OwnerId: number;
  PinCode?: string;
  PreferableDate: string;
  PreferableTime: string;
  ReferenceId?: number;
  ServicesId?: number;
  TaskId?: number;
  TaskTagId?: number;
  TaskTagName?: string;
  TaskTypeId?: number;
  TechnicalNote?: string;
  TechnicalProblem?: string;
  UpdatedBy: number;
  UserId: number;
};

type CustomerLookupItem = CustomerListResultData & Record<string, unknown>;
type EnquiryListItem = EnquiryListResultData;
type StateItem = StateDTOResultData;
type CityItem = CityDTOResultData;
type TaskTag = TagListResultData;
type AdvanceServiceItem = ServiceTypeListDTOResultData & {
  children?: AdvanceServiceItem[] | null;
  Children?: AdvanceServiceItem[] | null;
};

import AddTaskModal, {type AddTaskInitialValues, taskStyles} from './AddTaskModal';
import OutlinedInput from '../../components/OutlinedInput';
import PlaceSearchModal from '../../components/PlaceSearchModal';
import {ContactBookIcon, EnquiryIcon, InvoiceIcon, WhatsappIcon} from '../../components/FabIcons';
import CustomerDetailsScreen from './CustomerDetailsScreen';
import EditCustomerModal from './EditCustomerModal';
import {
  type ServiceNode,
  type TaskTagOption,
  THEME_PRIMARY,
  HEADER_PRIMARY,
  pad2,
  getTodayDateString,
  getTaskStartTimeString,
  buildPhotoFileName,
  getStringField,
  getNumberField,
  findFirstArrayDeep,
  extractArray,
  getCode,
  getMessage,
  isSuccessOrNoData,
  normalizePhone,
  formatPhoneWithCountryCode,
  USER_ID_DIGIT_CODES,
  encryptUserId,
  formatDisplayDate,
  type CustomerOption,
  CUSTOMER_NAME_KEYS,
  CUSTOMER_ID_KEYS,
  CUSTOMER_PHONE_KEYS,
  CUSTOMER_ADDRESS_KEYS,
  CUSTOMER_STATE_KEYS,
  CUSTOMER_CITY_KEYS,
  CUSTOMER_PINCODE_KEYS,
  CUSTOMER_LANDMARK_KEYS,
  CUSTOMER_BRAND_KEYS,
  CUSTOMER_LATITUDE_KEYS,
  CUSTOMER_LONGITUDE_KEYS,
  normalizeCustomerOption,
  filterCustomerOptions,
  type StateOption,
  type CityOption,
  LOOKUP_ID_KEYS,
  LOOKUP_NAME_KEYS,
  normalizeStateOption,
  normalizeCityOption,
  filterLookupOptions,
  getEnquiryId,
  getEnquiryDisplayNo,
  getEnquiryCustomerName,
  getEnquiryAddress,
  getEnquiryPhone,
  getEnquiryDate,
  getEnquiryType,
  getEnquiryTechnicalProblem,
  getEnquirySpecialInstruction,
  getEnquiryCustomerId,
  getEnquiryState,
  getEnquiryCity,
  getEnquiryPinCode,
  getEnquiryLandmark,
  getEnquiryTime,
  getEnquiryServiceTypeId,
  getEnquiryServiceTypeName,
  getEnquiryTaskTagId,
  getEnquiryTaskTagName,
  getEnquiryLocationId,
  getEnquiryLongitude,
  getEnquiryLocDescription,
  getEnquiryLocName,
  getEnquiryInquaryState,
  getEnquiryReferenceId,
  getEnquiryTaskId,
  getEnquiryTaskTypeId,
  getEnquiryTechnicalNote,
  ENQUIRY_IMAGE_FIELD_SETS,
  IMAGE_EXTENSION_PATTERN,
  resolveImageOrigin,
  looksLikeImagePath,
  resolveImageUrl,
  getEnquiryImageSlotSources,
  fetchImageAsBase64,
  SERVICE_CHILD_KEYS,
  SERVICE_LABEL_KEYS,
  SERVICE_ID_KEYS,
  getServiceChildArray,
  buildServiceTree,
  filterServiceTree,
  normalizeTaskTag,
  styles,
} from './crmShared';
import TabStrip from '../../components/TabStrip';

// Enquiry form: same Java dialog sheet / header / outlined-field metrics as the Add Task form
// (dialog_enquiry_new), layered over the CRM-wide styles.
const eq = {...styles, ...taskStyles};

// dialog_enquiry_details: 30dp-corner sheet, 20dp padding (+10dp top), 20sp service-name title,
// 22dp primary-tinted WhatsApp / call icons, 16sp label (background_gray) / value (light_gray)
// rows 16dp apart, rounded_button "+ ADD TASK", transparent Cancel.
const enquiryDetailStyles = {
  sheet: {
    backgroundColor: '#FFFFFF',
    width: '100%' as const,
    maxWidth: ms(560),
    alignSelf: 'center' as const,
    maxHeight: '94%' as const,
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    overflow: 'hidden' as const,
  },
  content: {
    padding: ms(20),
    paddingTop: ms(30),
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: ms(30),
  },
  title: {
    flex: 0.7,
    color: '#000000',
    fontSize: sp(20),
    marginBottom: ms(3),
  },
  headerActions: {
    flex: 0.3,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-around' as const,
  },
  callIcon: {
    width: ms(22),
    height: ms(22),
    tintColor: COLORS.primary,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: ms(16),
  },
  label: {
    flex: 0.4,
    color: COLORS.ink,
    fontSize: sp(16),
  },
  value: {
    flex: 0.6,
    paddingLeft: ms(3),
    color: COLORS.lightGray,
    fontSize: sp(16),
    textAlign: 'right' as const,
  },
  addTaskButton: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: COLORS.primary,
    borderRadius: ms(34),
    height: ms(48),
    marginTop: ms(20),
    marginBottom: ms(20),
    elevation: 4,
  },
  addTaskText: {
    color: '#FFFFFF',
    fontSize: sp(18),
    fontWeight: '500' as const,
  },
};

// customer_list_fragment / customerlist_custom_new.
const customerListStyles = {
  addCustButton: {
    width: ms(70),
    paddingHorizontal: 0,
    borderRadius: ms(10),
  },
  filterRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingTop: ms(10),
    paddingHorizontal: ms(16),
    height: ms(40),
    backgroundColor: '#FFFFFF',
  },
  tagSpinner: {
    flex: 0.5,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  tagSpinnerText: {
    flexShrink: 1,
    color: '#000000',
    fontSize: sp(14),
  },
  tagSpinnerChevron: {
    color: COLORS.primary,
    fontSize: sp(20),
    marginLeft: ms(6),
  },
  refreshButton: {
    flex: 0.5,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
  },
  refreshText: {
    color: COLORS.primary,
    fontSize: sp(13),
    fontWeight: '700' as const,
    marginRight: ms(5),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(10),
    margin: ms(8),
    paddingLeft: ms(20),
    paddingRight: ms(12),
    paddingTop: ms(10),
    paddingBottom: ms(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
  },
  name: {
    color: COLORS.ink,
    fontSize: sp(15),
    fontWeight: '700' as const,
  },
  addressRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: ms(16),
  },
  address: {
    flex: 1,
    color: COLORS.lightGray,
    fontSize: sp(12),
  },
  iconButton: {
    width: ms(44),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  phoneIcon: {
    width: ms(20),
    height: ms(20),
    tintColor: '#000000',
  },
};

const enquiryStyles = {
  howToRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: ms(20),
    marginLeft: ms(2),
  },
  howToPlayIcon: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    backgroundColor: COLORS.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: ms(12),
  },
  howToText: {
    color: COLORS.primary,
    fontSize: sp(14),
  },
  // Java image slots: 20dp-corner outlined boxes with a gray camera glyph.
  photoRow: {
    flexDirection: 'row' as const,
    gap: ms(8),
    marginBottom: ms(20),
  },
  photoBox: {
    flex: 1,
    height: ms(87),
    borderWidth: ms(1),
    borderColor: '#BDBDBD',
    borderRadius: ms(20),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
  },
  addButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: COLORS.primary,
    borderRadius: ms(34),
    height: ms(48),
    marginTop: ms(10),
    marginBottom: ms(20),
    elevation: 4,
  },
};

type CRMScreenProps = {
  ownerId: number;
  openAddEnquiryTrigger?: number;
};

type CRMTabKey = 'enquiries' | 'customers';

type PhotoSlot = {
  uri: string;
  base64: string;
  fileName: string;
  isExistingRemote?: boolean;
} | null;

const CRMScreen = ({
  ownerId,
  openAddEnquiryTrigger,
}: CRMScreenProps) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<CRMTabKey>('enquiries');

  const [enquiries, setEnquiries] = useState<EnquiryListItem[]>([]);
  const [isLoadingEnquiries, setIsLoadingEnquiries] = useState(false);
  const [isRefreshingEnquiries, setIsRefreshingEnquiries] = useState(false);
  const [enquiryError, setEnquiryError] = useState('');

  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryListItem | null>(
    null,
  );
  const [isEnquiryDetailModalOpen, setIsEnquiryDetailModalOpen] =
    useState(false);

  const [isShareEnquiryModalOpen, setIsShareEnquiryModalOpen] =
    useState(false);
  const [isDownloadingQrCode, setIsDownloadingQrCode] = useState(false);
  const [qrPreviewPath, setQrPreviewPath] = useState<string | null>(null);

  const [customers, setCustomers] = useState<CustomerLookupItem[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isRefreshingCustomers, setIsRefreshingCustomers] = useState(false);
  const [customerError, setCustomerError] = useState('');
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerLookupItem | null>(null);
  const [customerBeingEdited, setCustomerBeingEdited] =
    useState<CustomerLookupItem | null>(null);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  // Customer tag filter (Java's CustomerListFragment: spin_cust_tag -> getCustomerList(userID, custTagId)).
  const [customerTagFilter, setCustomerTagFilter] = useState<PickerOption | null>(null);
  const [customerTagOptions, setCustomerTagOptions] = useState<PickerOption[]>([]);
  const [isCustomerTagPickerOpen, setIsCustomerTagPickerOpen] = useState(false);
  const [isLoadingCustomerTags, setIsLoadingCustomerTags] = useState(false);

  const [searchText, setSearchText] = useState('');

  const [isAddEnquiryModalOpen, setIsAddEnquiryModalOpen] = useState(false);
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [editingEnquiryId, setEditingEnquiryId] = useState(0);
  const [editingEnquiryExtra, setEditingEnquiryExtra] = useState<{
    locationId: number;
    longitude: string;
    locDescription: string;
    locName: string;
    inquaryState: number;
    referenceId: number;
    taskId: number;
    taskTypeId: number;
    technicalNote: string;
  } | null>(null);

  const [enquiryLocalOverrides, setEnquiryLocalOverrides] = useState<
    Record<
      number,
      {
        landmark: string;
        taskTagId: number;
        taskTagName: string;
        specialInstructions: string;
        photos: PhotoSlot[];
      }
    >
  >({});

  const [customerId, setCustomerId] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [enquiryDate, setEnquiryDate] = useState(getTodayDateString);
  const [enquiryTime, setEnquiryTime] = useState(getTaskStartTimeString);
  const [address, setAddress] = useState('');
  const [isPlaceSearchOpen, setIsPlaceSearchOpen] = useState(false);
  const [placeCoords, setPlaceCoords] = useState<{latitude: string; longitude: string} | null>(null);
  const [state, setStateValue] = useState('');
  const [city, setCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [technicalProblem, setTechnicalProblem] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [photos, setPhotos] = useState<PhotoSlot[]>([null, null, null]);

  const [allCustomerOptions, setAllCustomerOptions] = useState<
    CustomerOption[]
  >([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<
    CustomerOption[]
  >([]);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] =
    useState(false);

  const [stateId, setStateId] = useState(0);
  const [cityId, setCityId] = useState(0);
  const [allStateOptions, setAllStateOptions] = useState<StateOption[]>([]);
  const [stateSuggestions, setStateSuggestions] = useState<StateOption[]>([]);
  const [isStateLoading, setIsStateLoading] = useState(false);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);

  const [allCityOptions, setAllCityOptions] = useState<CityOption[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<CityOption[]>([]);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const [serviceTree, setServiceTree] = useState<ServiceNode[]>([]);
  const [isServiceTypeModalOpen, setIsServiceTypeModalOpen] = useState(false);
  const [isServiceTypeLoading, setIsServiceTypeLoading] = useState(false);
  const [serviceTypeError, setServiceTypeError] = useState('');
  const [serviceTypeSearch, setServiceTypeSearch] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceNode | null>(
    null,
  );

  const [taskTags, setTaskTags] = useState<TaskTagOption[]>([]);
  const [isTaskTagModalOpen, setIsTaskTagModalOpen] = useState(false);
  const [isTaskTagLoading, setIsTaskTagLoading] = useState(false);
  const [taskTagSearch, setTaskTagSearch] = useState('');
  const [selectedTaskTag, setSelectedTaskTag] = useState<TaskTagOption | null>(
    null,
  );

  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [addTaskInitialValues, setAddTaskInitialValues] =
    useState<AddTaskInitialValues | null>(null);

  const fetchEnquiries = useCallback(
    async (refreshing = false) => {
      if (refreshing) {
        setIsRefreshingEnquiries(true);
      } else {
        setIsLoadingEnquiries(true);
      }
      setEnquiryError('');

      try {
        const response = await getEnquiryList({UserId: ownerId});
        if (!isSuccessOrNoData(response)) {
          throw new Error(getMessage(response) || 'Unable to load enquiries.');
        }
        setEnquiries(extractArray<EnquiryListItem>(response));
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load enquiries right now.';
        setEnquiryError(message);
        setEnquiries([]);
      } finally {
        setIsLoadingEnquiries(false);
        setIsRefreshingEnquiries(false);
      }
    },
    [ownerId],
  );

  const openCustomerTagPicker = () => {
    setIsCustomerTagPickerOpen(true);
    if (customerTagOptions.length > 0 || isLoadingCustomerTags) {
      return;
    }
    setIsLoadingCustomerTags(true);
    getCustomerTagList({UserId: ownerId})
      .then(response => {
        const rows = extractArray<Record<string, unknown>>(response);
        setCustomerTagOptions(
          rows
            .map(row => ({
              id: getNumberField(row, ['customerTagId', 'CustomerTagId']),
              label: getStringField(row, ['customerTagName', 'CustomerTagName']),
            }))
            .filter(option => option.label),
        );
      })
      .catch(() => setCustomerTagOptions([]))
      .finally(() => setIsLoadingCustomerTags(false));
  };

  const fetchCustomers = useCallback(
    async (refreshing = false) => {
      if (refreshing) {
        setIsRefreshingCustomers(true);
      } else {
        setIsLoadingCustomers(true);
      }
      setCustomerError('');

      try {
        const response =
          await getCustomerList({
            UserId: ownerId,
            CustomerTagId: customerTagFilter?.id ?? 0,
          });
        if (!isSuccessOrNoData(response)) {
          throw new Error(getMessage(response) || 'Unable to load customers.');
        }
        const list = extractArray<CustomerLookupItem>(response);
        setCustomers(list);
        setAllCustomerOptions(
          list
            .map((item, index) => normalizeCustomerOption(item, index))
            .filter((option): option is CustomerOption => Boolean(option)),
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load customers right now.';
        setCustomerError(message);
        setCustomers([]);
      } finally {
        setIsLoadingCustomers(false);
        setIsRefreshingCustomers(false);
      }
    },
    [ownerId, customerTagFilter],
  );

  useEffect(() => {
    fetchEnquiries();
    fetchCustomers();
  }, [fetchEnquiries, fetchCustomers]);

  const loadCustomerSuggestions = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length < 2) {
        setCustomerSuggestions([]);
        return;
      }

      if (allCustomerOptions.length > 0) {
        setCustomerSuggestions(
          filterCustomerOptions(allCustomerOptions, trimmedQuery),
        );
        return;
      }

      if (isCustomerLoading) {
        return;
      }

      setIsCustomerLoading(true);
      try {
        const response =
          await getCustomerList({
            UserId: ownerId,
            CustomerTagId: 0,
          });
        const normalized = extractArray<CustomerLookupItem>(response)
          .map((item, index) => normalizeCustomerOption(item, index))
          .filter((option): option is CustomerOption => Boolean(option));
        setAllCustomerOptions(normalized);
        setCustomerSuggestions(filterCustomerOptions(normalized, trimmedQuery));
      } catch {
        setCustomerSuggestions([]);
      } finally {
        setIsCustomerLoading(false);
      }
    },
    [allCustomerOptions, isCustomerLoading, ownerId],
  );

  useEffect(() => {
    const query = customerName.trim();
    if (!showCustomerSuggestions || query.length < 2) {
      setCustomerSuggestions([]);
      return;
    }

    if (allCustomerOptions.length > 0) {
      setCustomerSuggestions(filterCustomerOptions(allCustomerOptions, query));
      return;
    }

    const timeoutId = setTimeout(() => {
      loadCustomerSuggestions(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [allCustomerOptions, customerName, loadCustomerSuggestions, showCustomerSuggestions]);

  const loadStateSuggestions = useCallback(
    async (query: string) => {
      if (allStateOptions.length > 0) {
        setStateSuggestions(filterLookupOptions(allStateOptions, query));
        setIsStateLoading(false);
        return;
      }

      if (isStateLoading) {
        return;
      }

      setIsStateLoading(true);
      try {
        const response = await getStateList();
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
    },
    [allStateOptions, isStateLoading],
  );

  const preloadStates = useCallback(() => {
    if (allStateOptions.length > 0 || isStateLoading) {
      return;
    }
    loadStateSuggestions(state);
  }, [allStateOptions.length, isStateLoading, loadStateSuggestions, state]);

  useEffect(() => {
    const query = state.trim();
    if (!showStateSuggestions || query.length < 2) {
      setStateSuggestions([]);
      return;
    }

    if (allStateOptions.length > 0) {
      setStateSuggestions(filterLookupOptions(allStateOptions, query));
      return;
    }

    const timeoutId = setTimeout(() => {
      loadStateSuggestions(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [allStateOptions, loadStateSuggestions, showStateSuggestions, state]);

  const loadCitySuggestions = useCallback(
    async (query: string, forStateId: number) => {
      if (!forStateId) {
        setCitySuggestions([]);
        return;
      }

      if (allCityOptions.length > 0) {
        setCitySuggestions(filterLookupOptions(allCityOptions, query));
        setIsCityLoading(false);
        return;
      }

      if (isCityLoading) {
        return;
      }

      setIsCityLoading(true);
      try {
        const response = await getCityList({
          UserId: ownerId,
          StateId: forStateId,
        });
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
    },
    [allCityOptions, isCityLoading, ownerId],
  );

  const preloadCities = useCallback(() => {
    if (!stateId) {
      return;
    }
    if (allCityOptions.length > 0 || isCityLoading) {
      return;
    }
    loadCitySuggestions(city, stateId);
  }, [allCityOptions.length, city, isCityLoading, loadCitySuggestions, stateId]);

  useEffect(() => {
    const query = city.trim();
    if (!showCitySuggestions || !stateId || query.length < 2) {
      setCitySuggestions([]);
      return;
    }

    if (allCityOptions.length > 0) {
      setCitySuggestions(filterLookupOptions(allCityOptions, query));
      return;
    }

    const timeoutId = setTimeout(() => {
      loadCitySuggestions(query, stateId);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [allCityOptions, city, loadCitySuggestions, showCitySuggestions, stateId]);

  const handleStateSelect = (option: StateOption) => {
    setStateId(option.id);
    setStateValue(option.name);
    setStateSuggestions([]);
    setShowStateSuggestions(false);

    setCity('');
    setCityId(0);
    setAllCityOptions([]);
    setCitySuggestions([]);
  };

  const handleCitySelect = (option: CityOption) => {
    setCityId(option.id);
    setCity(option.name);
    setCitySuggestions([]);
    setShowCitySuggestions(false);
  };

  const handleCustomerSelect = (customer: CustomerOption) => {
    setCustomerId(customer.id);
    setCustomerName(customer.name);
    setPhone(customer.phone);
    setEnquiryDate(getTodayDateString());
    setEnquiryTime(getTaskStartTimeString());
    if (customer.address) {
      setAddress(customer.address);
    }
    setStateId(0);
    if (customer.state) {
      setStateValue(customer.state);
    }
    setCityId(0);
    setAllCityOptions([]);
    setCitySuggestions([]);
    if (customer.city) {
      setCity(customer.city);
    }
    if (customer.pinCode) {
      setPinCode(customer.pinCode);
    }
    if (customer.landmark) {
      setLandmark(customer.landmark);
    }
    setCustomerSuggestions([]);
    setShowCustomerSuggestions(false);
  };


  const loadServiceTypes = useCallback(() => {
    if (serviceTree.length > 0 || isServiceTypeLoading) {
      return;
    }
    setIsServiceTypeLoading(true);
    setServiceTypeError('');
    // Java: Services/GetAdvanceServiceListByUserId -- category > subcategory > service tree.
    getAdvanceServiceList({
      UserId: ownerId,
      SearchParam: '',
    })
      .then(response => {
        const items = extractArray<AdvanceServiceItem>(response);
        const tree = buildServiceTree(items);
        setServiceTree(tree);
        if (tree.length === 0) {
          try {
            console.warn(
              '[CRM Service Type] No service types resolved from response.',
              JSON.stringify(response),
            );
          } catch (e) {
            // ignore logging failures
          }
        }
      })
      .catch(error => {
        setServiceTree([]);
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load service types right now.';
        setServiceTypeError(message);
        try {
          console.warn('[CRM Service Type] Failed to load:', message);
        } catch (e) {
          // ignore logging failures
        }
      })
      .finally(() => setIsServiceTypeLoading(false));
  }, [isServiceTypeLoading, ownerId, serviceTree.length]);

  const loadTaskTags = useCallback(() => {
    if (taskTags.length > 0 || isTaskTagLoading) {
      return;
    }
    setIsTaskTagLoading(true);
    getTaskTagList({UserId: ownerId})
      .then(response => {
        const items = extractArray<TaskTag>(response);
        setTaskTags(
          items
            .map(normalizeTaskTag)
            .filter(option => option.label && option.label !== 'Task'),
        );
      })
      .catch(() => setTaskTags([]))
      .finally(() => setIsTaskTagLoading(false));
  }, [isTaskTagLoading, ownerId, taskTags.length]);

  const applyPickedPhoto = (slotIndex: number, asset: Asset) => {
    if (!asset.base64 || !asset.uri) {
      Alert.alert('Photo', 'Unable to read the selected photo. Please try again.');
      return;
    }

    setPhotos(previous => {
      const next = [...previous];
      next[slotIndex] = {
        uri: asset.uri as string,
        base64: asset.base64 as string,
        fileName: asset.fileName || buildPhotoFileName(slotIndex),
        isExistingRemote: false,
      };
      return next;
    });
  };

  const capturePhotoFromCamera = async (slotIndex: number) => {
    const result = await launchCameraWithPermission({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.6,
      saveToPhotos: true,
    });
    if (result.didCancel) {
      return;
    }
    if (result.errorCode) {
      Alert.alert('Camera', result.errorMessage || 'Unable to open camera.');
      return;
    }
    const asset = result.assets?.[0];
    if (asset) {
      applyPickedPhoto(slotIndex, asset);
    }
  };

  const pickPhotoFromGallery = async (slotIndex: number) => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.6,
      selectionLimit: 1,
    });
    if (result.didCancel) {
      return;
    }
    if (result.errorCode) {
      Alert.alert('Gallery', result.errorMessage || 'Unable to open gallery.');
      return;
    }
    const asset = result.assets?.[0];
    if (asset) {
      applyPickedPhoto(slotIndex, asset);
    }
  };

  const handlePhotoBoxPress = (slotIndex: number) => {
    Alert.alert('Add Photo', 'Choose an option', [
      {text: 'Camera', onPress: () => capturePhotoFromCamera(slotIndex)},
      {text: 'Gallery', onPress: () => pickPhotoFromGallery(slotIndex)},
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const removePhoto = (slotIndex: number) => {
    setPhotos(previous => {
      const next = [...previous];
      next[slotIndex] = null;
      return next;
    });
  };

  const resetEnquiryForm = () => {
    setEditingEnquiryId(0);
    setEditingEnquiryExtra(null);
    setCustomerId(0);
    setCustomerName('');
    setPhone('');
    setEnquiryDate(getTodayDateString());
    setEnquiryTime(getTaskStartTimeString());
    setAddress('');
    setPlaceCoords(null);
    setStateValue('');
    setStateId(0);
    setCity('');
    setCityId(0);
    setAllCityOptions([]);
    setCitySuggestions([]);
    setStateSuggestions([]);
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
    setPinCode('');
    setLandmark('');
    setTechnicalProblem('');
    setSpecialInstructions('');
    setPhotos([null, null, null]);
    setSelectedService(null);
    setSelectedTaskTag(null);
    setServiceTypeSearch('');
    setTaskTagSearch('');
    setCustomerSuggestions([]);
    setShowCustomerSuggestions(false);
  };

  const openAddEnquiryModal = () => {
    setIsAddEnquiryModalOpen(true);
  };

  useEffect(() => {
    if (openAddEnquiryTrigger) {
      setActiveTab('enquiries');
      openAddEnquiryModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAddEnquiryTrigger]);

  const openEditEnquiryModal = (item: EnquiryListItem) => {
    resetEnquiryForm();

    const enquiryId = getEnquiryId(item);
    const override = enquiryLocalOverrides[enquiryId];

    setEditingEnquiryId(enquiryId);
    setCustomerId(getEnquiryCustomerId(item));
    setCustomerName(getEnquiryCustomerName(item));
    setPhone(getEnquiryPhone(item));
    setEnquiryDate(getEnquiryDate(item) || getTodayDateString());
    setEnquiryTime(getEnquiryTime(item) || getTaskStartTimeString());
    setAddress(getEnquiryAddress(item));
    setPlaceCoords(null);
    setStateValue(getEnquiryState(item));
    setCity(getEnquiryCity(item));
    setPinCode(getEnquiryPinCode(item));
    setLandmark(getEnquiryLandmark(item) || override?.landmark || '');
    setTechnicalProblem(getEnquiryTechnicalProblem(item));
    setSpecialInstructions(
      getEnquirySpecialInstruction(item) || override?.specialInstructions || '',
    );

    const serviceTypeId = getEnquiryServiceTypeId(item);
    const serviceTypeName = getEnquiryServiceTypeName(item);
    setSelectedService(
      serviceTypeId || serviceTypeName
        ? {
            id: serviceTypeId,
            key: `selected-${serviceTypeId}`,
            label: serviceTypeName,
            children: [],
          }
        : null,
    );

    const taskTagId = getEnquiryTaskTagId(item) || override?.taskTagId || 0;
    const taskTagName =
      getEnquiryTaskTagName(item) || override?.taskTagName || '';
    setSelectedTaskTag(
      taskTagId || taskTagName
        ? {id: taskTagId, label: taskTagName}
        : null,
    );

    setEditingEnquiryExtra({
      locationId: getEnquiryLocationId(item),
      longitude: getEnquiryLongitude(item),
      locDescription: getEnquiryLocDescription(item),
      locName: getEnquiryLocName(item),
      inquaryState: getEnquiryInquaryState(item),
      referenceId: getEnquiryReferenceId(item),
      taskId: getEnquiryTaskId(item),
      taskTypeId: getEnquiryTaskTypeId(item),
      technicalNote: getEnquiryTechnicalNote(item),
    });

    const imageSlots = getEnquiryImageSlotSources(item);
    const hasAnyImageFromList = imageSlots.some(Boolean);
    setPhotos(
      hasAnyImageFromList
        ? imageSlots.map(slot =>
            slot
              ? {
                  uri: slot.uri,
                  base64: slot.base64,
                  fileName: slot.fileName,
                  isExistingRemote: slot.isRemoteUrl,
                }
              : null,
          )
        : override?.photos || [null, null, null],
    );

    imageSlots.forEach((slot, index) => {
      if (slot && slot.isRemoteUrl) {
        fetchImageAsBase64(slot.uri)
          .then(base64 => {
            if (!base64) {
              return;
            }
            setPhotos(previous => {
              const next = [...previous];
              const current = next[index];
              if (current && current.uri === slot.uri) {
                next[index] = {...current, base64, isExistingRemote: false};
              }
              return next;
            });
          })
          .catch(() => {});
      }
    });

    setIsAddEnquiryModalOpen(true);
  };

  const closeAddEnquiryModal = () => {
    setIsAddEnquiryModalOpen(false);
    resetEnquiryForm();
  };

  const handleAddEnquirySubmit = async () => {
    if (!phone.trim()) {
      Alert.alert('Validation', 'Please enter Phone Number.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Validation', 'Please enter Customer Address.');
      return;
    }
    if (!state.trim()) {
      Alert.alert('Validation', 'Please enter State.');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Validation', 'Please enter City.');
      return;
    }
    if (!pinCode.trim()) {
      Alert.alert('Validation', 'Please enter Pin Code.');
      return;
    }
    if (!/^\d{6}$/.test(pinCode.trim())) {
      Alert.alert('Validation', 'Please enter a valid 6-digit Pin Code.');
      return;
    }
    if (!landmark.trim()) {
      Alert.alert('Validation', 'Please enter Landmark.');
      return;
    }

    if (isSubmittingEnquiry) {
      return;
    }

    setIsSubmittingEnquiry(true);

    const isEditing = editingEnquiryId > 0;

    const buildImageFields = (
      photo: PhotoSlot,
      suffix: '' | '1' | '2',
    ): Record<string, string | undefined> => {
      const base64Key = `ImageFileBase64Str${suffix}`;
      const nameKey = `ImageFileName${suffix}`;
      if (!photo) {
        return {[base64Key]: '', [nameKey]: ''};
      }
      if (photo.isExistingRemote && !photo.base64) {
        return {[base64Key]: undefined, [nameKey]: undefined};
      }
      return {[base64Key]: photo.base64 || '', [nameKey]: photo.fileName || ''};
    };

    try {
      if (isEditing) {
        const updatePayload: UpdateCustomerInquiryRequest = {
          Address: address.trim(),
          CreatedBy: ownerId,
          CustomerDetailsid: customerId || 0,
          CustomerName: customerName.trim(),
          EnquiryId: editingEnquiryId,
          ...buildImageFields(photos[0], ''),
          ...buildImageFields(photos[1], '1'),
          ...buildImageFields(photos[2], '2'),
          InquaryState: editingEnquiryExtra?.inquaryState || 1,
          IsActive: true,
          LocDescription: editingEnquiryExtra?.locDescription || 'NA',
          LocName: editingEnquiryExtra?.locName || '',
          LocationId: editingEnquiryExtra?.locationId || 0,
          Longitude: placeCoords?.longitude || editingEnquiryExtra?.longitude || '',
          MobileNumber: phone.trim(),
          OwnerId: ownerId,
          PinCode: pinCode.trim(),
          PreferableDate: enquiryDate,
          PreferableTime: enquiryTime,
          ReferenceId: editingEnquiryExtra?.referenceId || 0,
          ServicesId: selectedService?.id || 0,
          TaskId: editingEnquiryExtra?.taskId || 0,
          TaskTagId: selectedTaskTag?.id || 0,
          TaskTagName: selectedTaskTag?.label || '',
          TaskTypeId: editingEnquiryExtra?.taskTypeId || 0,
          TechnicalNote: editingEnquiryExtra?.technicalNote || '',
          TechnicalProblem: technicalProblem.trim(),
          UpdatedBy: ownerId,
          UserId: ownerId,
        };
        const updateResponse = await updateEnquiry(updatePayload);
        const updateResponseRecord =
          updateResponse && typeof updateResponse === 'object'
            ? (updateResponse as {code?: string; Code?: string; message?: string; Message?: string})
            : {};
        const updateCode = getCode(updateResponseRecord);
        if (updateCode && updateCode !== '200') {
          throw new Error(
            getMessage(updateResponseRecord) ||
              'Server rejected the update. Please try again.',
          );
        }
        setEnquiryLocalOverrides(previous => ({
          ...previous,
          [editingEnquiryId]: {
            landmark: landmark.trim(),
            taskTagId: selectedTaskTag?.id || 0,
            taskTagName: selectedTaskTag?.label || '',
            specialInstructions: specialInstructions.trim(),
            photos,
          },
        }));
        closeAddEnquiryModal();
        Alert.alert('Enquiry', 'Enquiry updated successfully.');
      } else {
        const payload: AddEnquiryRequest = {
          CustomerDetailsid: customerId || 0,
          CustomerName: customerName.trim(),
          MobileNumber: phone.trim(),
          PreferableDate: enquiryDate,
          PreferableTime: enquiryTime,
          Address: address.trim(),
          State: state.trim(),
          City: city.trim(),
          PinCode: pinCode.trim(),
          LocDescription: landmark.trim(),
          LocName: '',
          Longitude: placeCoords?.longitude || '',
          latitude: placeCoords?.latitude || '',
          ServicesId: selectedService?.id || 0,
          TaskTagId: selectedTaskTag?.id || 0,
          TaskTagName: selectedTaskTag?.label || '',
          TechnicalProblem: technicalProblem.trim(),
          TechnicalNote: specialInstructions.trim(),
          OwnerId: ownerId,
          InquaryState: 1,
          ImageFileBase64Str: photos[0]?.base64 || '',
          ImageFileName: photos[0]?.fileName || '',
          ImageFileBase64Str1: photos[1]?.base64 || '',
          ImageFileName1: photos[1]?.fileName || '',
          ImageFileBase64Str2: photos[2]?.base64 || '',
          ImageFileName2: photos[2]?.fileName || '',
          UserId: ownerId,
          CreatedBy: ownerId,
          UpdatedBy: ownerId,
          IsActive: true,
        };
        ensureSuccess(await addEnquiry(payload as unknown as Parameters<typeof addEnquiry>[0]));
        closeAddEnquiryModal();
        Alert.alert('Enquiry', 'Enquiry added successfully.');
      }
      fetchEnquiries();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Unable to ${isEditing ? 'update' : 'add'} enquiry right now.`;
      Alert.alert('Enquiry', message);
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  const openEnquiryDetailModal = (item: EnquiryListItem) => {
    setSelectedEnquiry(item);
    setIsEnquiryDetailModalOpen(true);
  };

  const closeEnquiryDetailModal = () => {
    setIsEnquiryDetailModalOpen(false);
    setSelectedEnquiry(null);
  };

  const openAddTaskModal = () => {
    if (!selectedEnquiry) {
      return;
    }
    const enquiry = selectedEnquiry;
    const tagId = getEnquiryTaskTagId(enquiry);
    const tagName = getEnquiryTaskTagName(enquiry);
    setAddTaskInitialValues({
      title: getEnquiryType(enquiry),
      address: getEnquiryAddress(enquiry),
      state: getEnquiryState(enquiry),
      city: getEnquiryCity(enquiry),
      pinCode: getEnquiryPinCode(enquiry),
      landmark: getEnquiryLandmark(enquiry) || 'NA',
      customerName: getEnquiryCustomerName(enquiry),
      customerNumber: getEnquiryPhone(enquiry),
      taskTagId: tagId,
      taskTagName: tagName,
    });
    setIsEnquiryDetailModalOpen(false);
    setIsAddTaskModalOpen(true);
  };

  const getEnquiryFormShareUrl = () =>
    `${ENQUIRY_FORM_LINK}${encryptUserId(ownerId)}`;

  const openShareEnquiryModal = () => {
    setIsShareEnquiryModalOpen(true);
  };

  const closeShareEnquiryModal = () => {
    setIsShareEnquiryModalOpen(false);
  };

  const handleCopyAndShareEnquiryLink = async () => {
    const url = getEnquiryFormShareUrl();
    try {
      await Share.share({
        message: url,
        url,
      });
    } catch {
      Alert.alert('Enquiry', 'Unable to share the link right now.');
    }
  };

  const handleDownloadEnquiryQrCode = async () => {
    if (isDownloadingQrCode) {
      return;
    }
    const qrUrl =
      'https://quickchart.io/qr?text=' +
      ENQUIRY_FORM_LINK +
      encryptUserId(ownerId) +
      '=&centerImageUrl=https://play-lh.googleusercontent.com/y7A-hlJPYg9k_b1eSAkZlsIyxKIwjIkuDXK5k4CKblLhzTGPSr42algKOaNECMOdJ84&size=500';

    setIsDownloadingQrCode(true);
    try {
      const downloadDir = `${RNFS.ExternalDirectoryPath}/Download`;
      const dirExists = await RNFS.exists(downloadDir);
      if (!dirExists) {
        await RNFS.mkdir(downloadDir);
      }
      const filePath = `${downloadDir}/EnquiryFormQRCode_${Date.now()}.jpg`;

      const result = await RNFS.downloadFile({
        fromUrl: qrUrl,
        toFile: filePath,
      }).promise;

      if (result.statusCode && result.statusCode >= 200 && result.statusCode < 300) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('File downloaded successfully', ToastAndroid.SHORT);
        }
        setQrPreviewPath(filePath);
      } else {
        throw new Error('Download failed');
      }
    } catch {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Download failed', ToastAndroid.SHORT);
      } else {
        Alert.alert('Enquiry', 'Unable to download QR code right now.');
      }
    } finally {
      setIsDownloadingQrCode(false);
    }
  };

  const openCall = async (rawPhone: string) => {
    const normalizedPhone = normalizePhone(rawPhone);
    if (!normalizedPhone) {
      Alert.alert('Phone number unavailable');
      return;
    }
    const url = `tel:${normalizedPhone}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch {
      Alert.alert('Unable to call', 'Please try again on a device.');
    }
  };

  // Java's list-row message icon (CRMFragment.onClick, imageView_message, for
  // both the enquiry and customer adapters) opens the native SMS composer
  // with the raw number -- it does NOT open WhatsApp. Only the enquiry
  // *details* dialog (EnquiryDialogNew.enquiryDetailsDialog) opens WhatsApp.
  const openSms = async (rawPhone: string) => {
    const normalizedPhone = normalizePhone(rawPhone);
    if (!normalizedPhone) {
      Alert.alert('Phone number unavailable');
      return;
    }
    const url = `sms:${normalizedPhone}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to open Messages', 'Please try again on a device.');
      }
    } catch {
      Alert.alert('Unable to open Messages', 'Please try again later.');
    }
  };

  // Java (EnquiryDialogNew.enquiryDetailsDialog, imageViewMessage) prefixes
  // the number with the session's country code before building the wa.me
  // link -- e.g. countryCode "91" + number "9998887776" -> wa.me/919998887776.
  const openWhatsapp = async (rawPhone: string) => {
    const digitsOnly = normalizePhone(rawPhone).replace(/^\+/, '');
    if (!digitsOnly) {
      Alert.alert('WhatsApp number unavailable');
      return;
    }
    const countryCode = getCurrentCountryCode().replace(/\D/g, '');
    const normalizedPhone = countryCode ? `${countryCode}${digitsOnly}` : digitsOnly;
    const url = `https://wa.me/${normalizedPhone}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to open WhatsApp', 'Please try again on a device.');
      }
    } catch {
      Alert.alert('Unable to open WhatsApp', 'Please try again later.');
    }
  };

  const filteredEnquiries = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return enquiries;
    }
    return enquiries.filter(item => {
      const name = getEnquiryCustomerName(item).toLowerCase();
      const no = getEnquiryDisplayNo(item).toLowerCase();
      return name.includes(query) || no.includes(query);
    });
  }, [enquiries, searchText]);

  const filteredCustomers = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return customers;
    }
    return customers.filter(item => {
      const record = item as Record<string, unknown>;
      const name = getStringField(record, CUSTOMER_NAME_KEYS).toLowerCase();
      const phoneVal = getStringField(
        record,
        CUSTOMER_PHONE_KEYS,
      ).toLowerCase();
      return name.includes(query) || phoneVal.includes(query);
    });
  }, [customers, searchText]);

  const renderEnquiryCard = ({item}: {item: EnquiryListItem}) => {
    const displayNo = getEnquiryDisplayNo(item);
    const name = getEnquiryCustomerName(item);
    const addressText = getEnquiryAddress(item);
    const phoneValue = getEnquiryPhone(item);
    const dateText = getEnquiryDate(item);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => openEnquiryDetailModal(item)}
      >
        <View style={styles.cardRibbon}>
          <Text style={styles.cardRibbonText}>
            {displayNo ? `ENQUIRY #${displayNo}` : 'ENQUIRY'}
          </Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {name}
            </Text>
            {dateText ? <Text style={styles.cardDateText}>{dateText}</Text> : null}
          </View>
          <View style={styles.cardAddressRow}>
            <Text style={styles.cardSubtitle} numberOfLines={2}>
              {addressText}
            </Text>
            <TouchableOpacity
              style={styles.cardIconButton}
              onPress={() => openEditEnquiryModal(item)}>
              <Ionicons name="create-outline" style={styles.cardIconText} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cardIconButton} onPress={() => openSms(phoneValue)}>
              <Ionicons name="logo-whatsapp" style={styles.cardIconText} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cardIconButton} onPress={() => openCall(phoneValue)}>
              <Ionicons name="call-outline" style={styles.cardIconText} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // customerlist_custom_new: 10dp-radius card (8dp margin), 15sp bold name, then a row with the
  // 12sp two-line address and the add-task / WhatsApp / call glyphs (20dp, black).
  const openAddTaskForCustomer = (item: CustomerLookupItem) => {
    const record = item as Record<string, unknown>;
    setAddTaskInitialValues({
      title: '',
      address: getStringField(record, CUSTOMER_ADDRESS_KEYS),
      state: getStringField(record, CUSTOMER_STATE_KEYS),
      city: getStringField(record, CUSTOMER_CITY_KEYS),
      pinCode: getStringField(record, CUSTOMER_PINCODE_KEYS),
      landmark: getStringField(record, CUSTOMER_LANDMARK_KEYS) || 'NA',
      customerName: getStringField(record, CUSTOMER_NAME_KEYS),
      customerNumber: getStringField(record, CUSTOMER_PHONE_KEYS),
      customerId: getNumberField(record, CUSTOMER_ID_KEYS) || undefined,
      taskTagId: 0,
      taskTagName: '',
    });
    setIsAddTaskModalOpen(true);
  };

  const renderCustomerCard = ({item}: {item: CustomerLookupItem}) => {
    const record = item as Record<string, unknown>;
    const name = getStringField(record, CUSTOMER_NAME_KEYS) || 'Customer';
    const addressText = getStringField(record, CUSTOMER_ADDRESS_KEYS);
    const phoneValue = getStringField(record, CUSTOMER_PHONE_KEYS);

    return (
      <TouchableOpacity
        style={customerListStyles.card}
        activeOpacity={0.8}
        onPress={() => setSelectedCustomer(item)}
      >
        <Text style={customerListStyles.name} numberOfLines={1}>
          {name}
        </Text>
        <View style={customerListStyles.addressRow}>
          <Text style={customerListStyles.address} numberOfLines={2}>
            {addressText}
          </Text>
          <TouchableOpacity
            style={customerListStyles.iconButton}
            onPress={() => openAddTaskForCustomer(item)}
          >
            <InvoiceIcon size={ms(20)} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={customerListStyles.iconButton}
            onPress={() => openSms(phoneValue)}
          >
            <WhatsappIcon size={ms(20)} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={customerListStyles.iconButton}
            onPress={() => openCall(phoneValue)}
          >
            <Image
              source={require('../../../assets/images/ic_phone.png')}
              style={customerListStyles.phoneIcon}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderServiceNode = (node: ServiceNode, depth: number) => {
    return renderServiceNodeFor(
      node,
      depth,
      selectedService,
      selectedNode => {
        setSelectedService(selectedNode);
        setIsServiceTypeModalOpen(false);
        setServiceTypeSearch('');
      },
    );
  };

  const renderServiceNodeFor = (
    node: ServiceNode,
    depth: number,
    selected: ServiceNode | null,
    onSelect: (node: ServiceNode) => void,
  ) => {
    const isSelectable = depth >= 2; // Java: only services are tappable; categories stay headers

    return (
      <View key={node.key}>
        {isSelectable ? (
          <TouchableOpacity
            style={styles.serviceLeafRow}
            onPress={() => onSelect(node)}
          >
            <Text style={styles.serviceLeafBullet}>•</Text>
            <Text
              style={[
                styles.serviceLeafText,
                selected?.id === node.id ? styles.serviceLeafTextSelected : null,
              ]}
            >
              {node.label}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text
            style={
              depth === 0 ? styles.serviceHeaderText : styles.serviceSubHeaderText
            }
          >
            {node.label}
          </Text>
        )}
        {node.children.map(child =>
          renderServiceNodeFor(child, depth + 1, selected, onSelect),
        )}
      </View>
    );
  };

  const displayedServiceTree = filterServiceTree(serviceTree, serviceTypeSearch);
  const displayedTaskTags = taskTagSearch.trim()
    ? taskTags.filter(tag =>
        tag.label.toLowerCase().includes(taskTagSearch.trim().toLowerCase()),
      )
    : taskTags;

  // Customer details render as an overlay (not an early return) so the enquiry detail / edit
  // modals below stay mounted and the cards in the Enquiry tab can open them, like Java.
  const customerDetailsOverlay = selectedCustomer ? (
    <View style={StyleSheet.absoluteFill}>
          <CustomerDetailsScreen
            ownerId={ownerId}
            customer={selectedCustomer as Record<string, unknown>}
            onBack={() => setSelectedCustomer(null)}
            onEnquiryPress={openEnquiryDetailModal}
            onEnquiryEdit={openEditEnquiryModal}
            onEnquiryCall={item => openCall(getEnquiryPhone(item))}
            onEnquiryWhatsapp={item => openSms(getEnquiryPhone(item))}
            onEdit={record => {
              setCustomerBeingEdited(record);
              setIsEditCustomerModalOpen(true);
            }}
            onDelete={record => {
              // CRMTaskAmcTabHostFragment.deleteCustomer (delete_customer_dialog).
              Alert.alert(
                '',
                'Do you want to delete this Customer ? It will delete all customer history.',
                [
                  {text: 'NO', style: 'cancel'},
                  {
                    text: 'Yes',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        const response = await deleteCustomerDetails({
                          UserId: ownerId,
                          CustomerId: getNumberField(record, ['customerDetailsid', 'CustomerDetailsid']),
                        });
                        Alert.alert('', response?.Message ?? 'Customer deleted.');
                        if (response?.Code === '200') {
                          setSelectedCustomer(null);
                          fetchCustomers(true);
                        }
                      } catch (error) {
                        Alert.alert('', error instanceof Error ? error.message : 'Unable to delete customer.');
                      }
                    },
                  },
                ],
              );
            }}
          />
    </View>
  ) : null;


  return (
    <View style={styles.screen}>
      {/* The hamburger/title/notification row used to be drawn here; it's
          now the shared AppHeader rendered once by AdminTabs above the tab
          bar. The tabs row below is offset by the header's height so it
          doesn't render underneath it. */}
      <View style={{ marginTop: insets.top + HEADER_CONTENT_HEIGHT }}>
        <TabStrip
          tabs={[
            { key: 'enquiries', label: 'ENQUIRIES' },
            { key: 'customers', label: 'CUSTOMERS' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'enquiries'
                ? 'Search by Enq no., Customer name...'
                : 'Search by Customer name...'
            }
            placeholderTextColor={COLORS.lightGray}
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close" style={styles.searchClearIcon} />
          </TouchableOpacity>
        </View>
        {activeTab === 'enquiries' ? (
          <>
            <TouchableOpacity
              style={styles.addEnquiryButton}
              onPress={openAddEnquiryModal}
            >
              <Text style={styles.addEnquiryButtonText}>+ Enquiry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkIconButton}
              onPress={openShareEnquiryModal}
            >
              <Ionicons name="link" style={styles.linkIconText} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.addEnquiryButton, customerListStyles.addCustButton]}
            onPress={() => setIsAddCustomerModalOpen(true)}
          >
            <Text style={styles.addEnquiryButtonText}>+ CUST</Text>
          </TouchableOpacity>
        )}
      </View>

      {activeTab === 'customers' ? (
        <View style={customerListStyles.filterRow}>
          <TouchableOpacity style={customerListStyles.tagSpinner} onPress={openCustomerTagPicker}>
            <Text style={customerListStyles.tagSpinnerText} numberOfLines={1}>
              {customerTagFilter ? customerTagFilter.label : 'Select Customer Tag'}
            </Text>
            <Ionicons name="chevron-down" style={customerListStyles.tagSpinnerChevron} />
          </TouchableOpacity>
          <TouchableOpacity
            style={customerListStyles.refreshButton}
            onPress={() => {
              if (customerTagFilter) {
                setCustomerTagFilter(null);
              } else {
                fetchCustomers(true);
              }
            }}
          >
            <Text style={customerListStyles.refreshText}>Refresh List</Text>
            <Ionicons name="sync" size={ms(22)} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      ) : null}

      {activeTab === 'enquiries' ? (
        isLoadingEnquiries ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={THEME_PRIMARY} size="large" />
          </View>
        ) : enquiryError ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{enquiryError}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredEnquiries}
            keyExtractor={(item, index) =>
              String(getEnquiryId(item) || index)
            }
            renderItem={renderEnquiryCard}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshingEnquiries}
                onRefresh={() => fetchEnquiries(true)}
                colors={[THEME_PRIMARY]}
              />
            }
            ListEmptyComponent={
              <View style={styles.centerBox}>
                <Text style={styles.emptyText}>No enquiries found.</Text>
              </View>
            }
          />
        )
      ) : isLoadingCustomers ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={THEME_PRIMARY} size="large" />
        </View>
      ) : customerError ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{customerError}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item, index) => {
            const record = item as Record<string, unknown>;
            const id = getNumberField(record, CUSTOMER_ID_KEYS);
            return String(id || index);
          }}
          renderItem={renderCustomerCard}
          style={{backgroundColor: '#FFFFFF'}}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshingCustomers}
              onRefresh={() => fetchCustomers(true)}
              colors={[THEME_PRIMARY]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>No customers found.</Text>
            </View>
          }
        />
      )}

      <SearchPickerModal
        visible={isCustomerTagPickerOpen}
        title="Select Customer Tag"
        options={customerTagOptions}
        loading={isLoadingCustomerTags}
        emptyText="No customer tags found."
        onSelect={option => {
          setCustomerTagFilter(option);
          setIsCustomerTagPickerOpen(false);
          fetchCustomers();
        }}
        onClose={() => setIsCustomerTagPickerOpen(false)}
      />

      <EditCustomerModal
        visible={isAddCustomerModalOpen}
        ownerId={ownerId}
        customer={null}
        mode="add"
        onClose={() => setIsAddCustomerModalOpen(false)}
        onUpdated={() => {
          setIsAddCustomerModalOpen(false);
          fetchCustomers(true);
        }}
      />

      <Modal
        visible={isAddEnquiryModalOpen}
        animationType="slide"
        transparent
        onRequestClose={closeAddEnquiryModal}
      >
        <View style={eq.modalOverlay}>
          <View style={eq.modalSheet}>
            <View style={eq.modalHeader}>
              <Text style={eq.modalHeaderTitle}>
                {editingEnquiryId ? 'Edit Enquiry' : 'Enquiry'}
              </Text>
              <TouchableOpacity onPress={closeAddEnquiryModal}>
                <Ionicons name="close" style={eq.modalCloseIcon} />
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
              style={eq.modalFlex}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <ScrollView
                contentContainerStyle={eq.modalScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={enquiryStyles.howToRow}>
                  <View style={enquiryStyles.howToPlayIcon}>
                    <Ionicons name="play" size={ms(11)} color="#FFFFFF" />
                  </View>
                  <Text style={enquiryStyles.howToText}>How to add enquiry ?</Text>
                </View>

                <View style={[eq.fieldWrap, eq.customerFieldWrap]}>
                  <OutlinedInput
                    style={eq.pillInput}
                    placeholder="Customer Name"
                    placeholderTextColor={COLORS.lightGray}
                    value={customerName}
                    onChangeText={text => {
                      setCustomerName(text);
                      setShowCustomerSuggestions(true);
                    }}
                    onFocus={() => setShowCustomerSuggestions(true)}
                  />
                  {showCustomerSuggestions && customerSuggestions.length > 0 ? (
                    <View style={eq.suggestionBox}>
                      {isCustomerLoading ? (
                        <ActivityIndicator
                          color={THEME_PRIMARY}
                          size="small"
                          style={eq.suggestionLoader}
                        />
                      ) : null}
                      <ScrollView
                        style={eq.suggestionScroll}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                      >
                        {customerSuggestions.map(option => (
                          <TouchableOpacity
                            key={option.id}
                            style={eq.suggestionItem}
                            onPress={() => handleCustomerSelect(option)}
                          >
                            <Text style={eq.suggestionItemText}>
                              {option.name}
                            </Text>
                            {option.phone ? (
                              <Text style={eq.suggestionItemSubText}>
                                {option.phone}
                              </Text>
                            ) : null}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}
                </View>

                <View style={eq.fieldWrap}>
                  <View>
                    <OutlinedInput
                      style={[eq.pillInput, {paddingRight: ms(52)}]}
                      placeholder="Phone Number *"
                      placeholderTextColor={COLORS.lightGray}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                    <View style={eq.phonebookButton} pointerEvents="none">
                      <ContactBookIcon size={ms(25)} />
                    </View>
                  </View>
                </View>

                <View style={[eq.fieldRow, eq.dateRow]}>
                  <View style={eq.halfField}>
                    <OutlinedInput
                      style={eq.pillInput}
                      placeholder="Date *"
                      placeholderTextColor={COLORS.lightGray}
                      value={enquiryDate}
                      onChangeText={setEnquiryDate}
                    />
                  </View>
                  <View style={eq.halfField}>
                    <OutlinedInput
                      style={eq.pillInput}
                      placeholder="Time *"
                      placeholderTextColor={COLORS.lightGray}
                      value={enquiryTime}
                      onChangeText={setEnquiryTime}
                    />
                  </View>
                </View>

                <View style={eq.fieldWrap}>
                  {/* Java: tapping the address opens the full-screen Google Places search. */}
                  <Pressable onPress={() => setIsPlaceSearchOpen(true)}>
                    <View pointerEvents="none">
                      <OutlinedInput
                        style={eq.pillInput}
                        placeholder="Customer Address *"
                        placeholderTextColor={COLORS.lightGray}
                        value={address}
                        editable={false}
                      />
                    </View>
                  </Pressable>
                </View>

                <View style={[eq.fieldRow, eq.stateCityFieldRow]}>
                  <View style={[eq.halfField, eq.stateFieldWrap]}>
                    <OutlinedInput
                      style={eq.pillInput}
                      placeholder="State *"
                      placeholderTextColor={COLORS.lightGray}
                      value={state}
                      onChangeText={text => {
                        setStateValue(text);
                        setStateId(0);
                        setShowStateSuggestions(true);
                      }}
                      onFocus={() => {
                        setShowStateSuggestions(true);
                        preloadStates();
                      }}
                    />
                    {showStateSuggestions &&
                    state.trim().length >= 2 &&
                    (isStateLoading || stateSuggestions.length > 0) ? (
                      <View style={eq.suggestionBox}>
                        {isStateLoading ? (
                          <ActivityIndicator
                            color={THEME_PRIMARY}
                            size="small"
                            style={eq.suggestionLoader}
                          />
                        ) : (
                          <ScrollView
                            style={eq.suggestionScroll}
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                          >
                            {stateSuggestions.map(option => (
                              <TouchableOpacity
                                key={option.id}
                                style={eq.suggestionItem}
                                onPress={() => handleStateSelect(option)}
                              >
                                <Text
                                  numberOfLines={1}
                                  style={eq.suggestionItemText}
                                >
                                  {option.name}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    ) : null}
                  </View>
                  <View style={[eq.halfField, eq.cityFieldWrap]}>
                    <OutlinedInput
                      style={eq.pillInput}
                      placeholder="City *"
                      placeholderTextColor={COLORS.lightGray}
                      value={city}
                      onChangeText={text => {
                        setCity(text);
                        setCityId(0);
                        setShowCitySuggestions(true);
                      }}
                      onFocus={() => {
                        if (!stateId) {
                          Alert.alert('Enquiry', 'Please select a State first.');
                          return;
                        }
                        setShowCitySuggestions(true);
                        preloadCities();
                      }}
                    />
                    {showCitySuggestions &&
                    city.trim().length >= 2 &&
                    (isCityLoading || citySuggestions.length > 0) ? (
                      <View style={eq.suggestionBox}>
                        {isCityLoading ? (
                          <ActivityIndicator
                            color={THEME_PRIMARY}
                            size="small"
                            style={eq.suggestionLoader}
                          />
                        ) : (
                          <ScrollView
                            style={eq.suggestionScroll}
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                          >
                            {citySuggestions.map(option => (
                              <TouchableOpacity
                                key={option.id}
                                style={eq.suggestionItem}
                                onPress={() => handleCitySelect(option)}
                              >
                                <Text
                                  numberOfLines={1}
                                  style={eq.suggestionItemText}
                                >
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

                <View style={eq.fieldRow}>
                  <View style={eq.halfField}>
                    <OutlinedInput
                      style={eq.pillInput}
                      placeholder="Pin Code *"
                      placeholderTextColor={COLORS.lightGray}
                      value={pinCode}
                      onChangeText={text =>
                        setPinCode(text.replace(/[^0-9]/g, '').slice(0, 6))
                      }
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                  <View style={eq.halfField} />
                </View>

                <View style={eq.fieldWrap}>
                  <OutlinedInput
                    style={eq.pillInput}
                    placeholder="Landmark *"
                    placeholderTextColor={COLORS.lightGray}
                    value={landmark}
                    onChangeText={setLandmark}
                  />
                </View>

                <TouchableOpacity
                  style={eq.dropdownPill}
                  onPress={() => {
                    loadServiceTypes();
                    setIsServiceTypeModalOpen(true);
                  }}
                >
                  <Text
                    style={
                      selectedService
                        ? eq.dropdownPillTextValue
                        : eq.dropdownPillTextPlaceholder
                    }
                    numberOfLines={1}
                  >
                    {selectedService ? selectedService.label : 'Select Service Type'}
                  </Text>
                  <Ionicons name="chevron-down" style={eq.dropdownChevron} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={eq.dropdownPill}
                  onPress={() => {
                    loadTaskTags();
                    setIsTaskTagModalOpen(true);
                  }}
                >
                  <Text
                    style={
                      selectedTaskTag
                        ? eq.dropdownPillTextValue
                        : eq.dropdownPillTextPlaceholder
                    }
                    numberOfLines={1}
                  >
                    {selectedTaskTag ? selectedTaskTag.label : 'Select Task Type'}
                  </Text>
                  <Ionicons name="chevron-down" style={eq.dropdownChevron} />
                </TouchableOpacity>

                <View style={eq.fieldWrap}>
                  <OutlinedInput
                    style={eq.pillInput}
                    placeholder="Technical Problem"
                    placeholderTextColor={COLORS.lightGray}
                    value={technicalProblem}
                    onChangeText={setTechnicalProblem}
                  />
                </View>

                <View style={eq.fieldWrap}>
                  <OutlinedInput
                    style={eq.pillInput}
                    placeholder="Special Instructions"
                    placeholderTextColor={COLORS.lightGray}
                    value={specialInstructions}
                    onChangeText={setSpecialInstructions}
                  />
                </View>

                <View style={enquiryStyles.photoRow}>
                  {photos.map((photo, index) => (
                    <TouchableOpacity
                      key={index}
                      style={enquiryStyles.photoBox}
                      onPress={() =>
                        photo ? removePhoto(index) : handlePhotoBoxPress(index)
                      }
                    >
                      {photo ? (
                        <Image
                          source={{uri: photo.uri}}
                          style={eq.photoPreview}
                        />
                      ) : (
                        <Ionicons name="camera-outline" size={ms(56)} color={COLORS.lightGray} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={enquiryStyles.addButton}
                  onPress={handleAddEnquirySubmit}
                  disabled={isSubmittingEnquiry}
                >
                  {isSubmittingEnquiry ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <View style={eq.addButtonIconWrap}>
                        <EnquiryIcon size={ms(30)} color="#FFFFFF" />
                      </View>
                      <Text style={eq.darkAddButtonText}>
                        {editingEnquiryId ? 'UPDATE' : 'ADD'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={closeAddEnquiryModal}>
                  <Text style={eq.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>

      <PlaceSearchModal
        visible={isPlaceSearchOpen}
        onClose={() => setIsPlaceSearchOpen(false)}
        onSelect={place => {
          setAddress(place.address);
          setPlaceCoords({latitude: String(place.latitude), longitude: String(place.longitude)});
          setIsPlaceSearchOpen(false);
        }}
      />

      <Modal
        visible={isEnquiryDetailModalOpen}
        animationType="slide"
        transparent
        onRequestClose={closeEnquiryDetailModal}
      >
        <View style={styles.modalOverlay}>
          <View style={enquiryDetailStyles.sheet}>
            {selectedEnquiry ? (
              <ScrollView contentContainerStyle={enquiryDetailStyles.content}>
                <View style={enquiryDetailStyles.header}>
                  <Text style={enquiryDetailStyles.title} numberOfLines={2}>
                    {getEnquiryServiceTypeName(selectedEnquiry) || getEnquiryType(selectedEnquiry)}
                  </Text>
                  <View style={enquiryDetailStyles.headerActions}>
                    <TouchableOpacity
                      onPress={() => openWhatsapp(getEnquiryPhone(selectedEnquiry))}
                    >
                      <WhatsappIcon size={ms(22)} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => openCall(getEnquiryPhone(selectedEnquiry))}
                    >
                      <Image
                        source={require('../../../assets/images/ic_phone.png')}
                        style={enquiryDetailStyles.callIcon}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                  <View style={enquiryDetailStyles.row}>
                    <Text style={enquiryDetailStyles.label}>Enquiry No.</Text>
                    <Text style={enquiryDetailStyles.value}>
                      #{getEnquiryDisplayNo(selectedEnquiry) || '-'}
                    </Text>
                  </View>
                  <View style={enquiryDetailStyles.row}>
                    <Text style={enquiryDetailStyles.label}>Pref. Date</Text>
                    <Text style={enquiryDetailStyles.value}>
                      {getEnquiryDate(selectedEnquiry) || 'NA'}
                    </Text>
                  </View>
                  <View style={enquiryDetailStyles.row}>
                    <Text style={enquiryDetailStyles.label}>Customer Name</Text>
                    <Text style={enquiryDetailStyles.value}>
                      {getEnquiryCustomerName(selectedEnquiry)}
                    </Text>
                  </View>
                  <View style={enquiryDetailStyles.row}>
                    <Text style={enquiryDetailStyles.label}>Contact Number</Text>
                    <Text style={enquiryDetailStyles.value}>
                      {formatPhoneWithCountryCode(getEnquiryPhone(selectedEnquiry)) || 'NA'}
                    </Text>
                  </View>
                  <View style={enquiryDetailStyles.row}>
                    <Text style={enquiryDetailStyles.label}>Address</Text>
                    <Text style={enquiryDetailStyles.value}>
                      {getEnquiryAddress(selectedEnquiry) || 'NA'}
                    </Text>
                  </View>
                  <View style={enquiryDetailStyles.row}>
                    <Text style={enquiryDetailStyles.label}>Technical Problem</Text>
                    <Text style={enquiryDetailStyles.value}>
                      {getEnquiryTechnicalProblem(selectedEnquiry) || 'NA'}
                    </Text>
                  </View>
                  <View style={enquiryDetailStyles.row}>
                    <Text style={enquiryDetailStyles.label}>Special Instructions</Text>
                    <Text style={enquiryDetailStyles.value}>
                      {getEnquirySpecialInstruction(selectedEnquiry) || 'NA'}
                    </Text>
                  </View>

                <TouchableOpacity
                  style={enquiryDetailStyles.addTaskButton}
                  onPress={openAddTaskModal}
                >
                  <Text style={enquiryDetailStyles.addTaskText}>+ ADD TASK</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={closeEnquiryDetailModal}>
                  <Text style={eq.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={isShareEnquiryModalOpen}
        animationType="slide"
        transparent
        onRequestClose={closeShareEnquiryModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.shareModalSheet}>
            <View style={styles.shareModalIconBadge}>
              <Text style={styles.shareModalIconText}>▶</Text>
            </View>
            <Text style={styles.shareModalTitle}>How to share enquiry URL ?</Text>
            <Text style={styles.shareModalSubtitle}>
              Click on below button to Copy or Share the Enquiry Form link
            </Text>

            <TouchableOpacity
              style={styles.shareModalPrimaryButton}
              onPress={handleCopyAndShareEnquiryLink}
            >
              <Text style={styles.shareModalPrimaryButtonText}>
                COPY & SHARE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareModalSecondaryButton}
              onPress={handleDownloadEnquiryQrCode}
              disabled={isDownloadingQrCode}
            >
              {isDownloadingQrCode ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.shareModalSecondaryButtonText}>
                  DOWNLOAD QR CODE
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={closeShareEnquiryModal}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!qrPreviewPath}
        animationType="fade"
        transparent
        onRequestClose={() => setQrPreviewPath(null)}
      >
        <View style={styles.centeredModalOverlay}>
          <View style={styles.qrPreviewSheet}>
            <Text style={styles.shareModalTitle}>Enquiry QR Code</Text>
            {qrPreviewPath ? (
              <Image
                source={{uri: `file://${qrPreviewPath}`}}
                style={styles.qrPreviewImage}
                resizeMode="contain"
              />
            ) : null}
            <Text style={styles.shareModalSubtitle}>
              QR code saved to your device storage.
            </Text>
            <TouchableOpacity
              style={styles.shareModalPrimaryButton}
              onPress={async () => {
                if (!qrPreviewPath) {
                  return;
                }
                try {
                  await Share.share({url: `file://${qrPreviewPath}`});
                } catch {
                  // ignore share cancellation errors
                }
              }}
            >
              <Text style={styles.shareModalPrimaryButtonText}>SHARE</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setQrPreviewPath(null)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isServiceTypeModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsServiceTypeModalOpen(false)}
      >
        <Pressable
          style={styles.centeredModalOverlay}
          onPress={() => setIsServiceTypeModalOpen(false)}
        >
          <Pressable style={styles.serviceModalBox} onPress={() => {}}>
            <View style={styles.serviceSearchWrap}>
              <TextInput
                style={styles.serviceSearchInput}
                placeholder="Search..."
                placeholderTextColor="#757575"
                value={serviceTypeSearch}
                onChangeText={setServiceTypeSearch}
              />
              <Ionicons name="search-outline" size={ms(26)} color="#8a8f98" />
            </View>
            {isServiceTypeLoading ? (
              <ActivityIndicator
                color={THEME_PRIMARY}
                size="small"
                style={styles.suggestionLoader}
              />
            ) : (
              <ScrollView style={styles.serviceModalScroll}>
                {displayedServiceTree.map(node => renderServiceNode(node, 0))}
                {displayedServiceTree.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {serviceTypeError || 'No service types found.'}
                  </Text>
                ) : null}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isTaskTagModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsTaskTagModalOpen(false)}
      >
        <Pressable
          style={styles.centeredModalOverlay}
          onPress={() => setIsTaskTagModalOpen(false)}
        >
          <Pressable style={styles.taskTagModalBox} onPress={() => {}}>
            <Text style={styles.taskTagModalTitle}>Select Task Tag</Text>
            <View style={styles.searchModalInputWrap}>
              <TextInput
                style={styles.searchModalInput}
                placeholder="Search..."
                placeholderTextColor="#9aa0a6"
                value={taskTagSearch}
                onChangeText={setTaskTagSearch}
              />
              <Text style={styles.searchModalIcon}>🔍</Text>
            </View>
            {isTaskTagLoading ? (
              <ActivityIndicator
                color={THEME_PRIMARY}
                size="small"
                style={styles.suggestionLoader}
              />
            ) : (
              <ScrollView style={styles.taskTagModalScroll}>
                {displayedTaskTags.map(tag => (
                  <TouchableOpacity
                    key={tag.id}
                    style={styles.taskTagItem}
                    onPress={() => {
                      setSelectedTaskTag(tag);
                      setIsTaskTagModalOpen(false);
                      setTaskTagSearch('');
                    }}
                  >
                    <Text style={styles.taskTagItemText}>{tag.label}</Text>
                  </TouchableOpacity>
                ))}
                {displayedTaskTags.length === 0 ? (
                  <Text style={styles.emptyText}>No task tags found.</Text>
                ) : null}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <EditCustomerModal
        visible={isEditCustomerModalOpen}
        ownerId={ownerId}
        customer={customerBeingEdited}
        onClose={() => setIsEditCustomerModalOpen(false)}
        onUpdated={updatedCustomer => {
          setIsEditCustomerModalOpen(false);
          setSelectedCustomer(updatedCustomer as CustomerLookupItem);
          fetchCustomers(true);
        }}
      />

      <AddTaskModal
        visible={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        ownerId={ownerId}
        initialValues={addTaskInitialValues}
      />
      {customerDetailsOverlay}
    </View>
  );
};


export default CRMScreen;