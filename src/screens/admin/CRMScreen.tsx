// src/screens/admin/CRMScreen.tsx

import { launchCameraWithPermission } from '../../utils/cameraPermission';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ms, sp} from '../../utils/responsive';
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
  Modal,
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
import {
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import {getEnquiryList, addEnquiry, updateEnquiry} from '../../api/customerInquiry/customerInquiryService';
import type {EnquiryListResultData} from '../../api/customerInquiry/customerInquiry.types';
import {getCustomerList, getStateList, getCityList, deleteCustomerDetails} from '../../api/customerList/customerListService';
import type {CustomerListResultData, StateDTOResultData, CityDTOResultData} from '../../api/customerList/customerList.types';
import {getServiceTypeList} from '../../api/services/servicesService';
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

import AddTaskModal, {type AddTaskInitialValues} from './AddTaskModal';
import CustomerDetailsScreen from './CustomerDetailsScreen';
import EditCustomerModal from './EditCustomerModal';
import {
  type ServiceNode,
  type TaskTagOption,
  THEME_PRIMARY,
  HEADER_PRIMARY,
  pad2,
  getTodayDateString,
  getCurrentTimeString,
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
  const [enquiryTime, setEnquiryTime] = useState(getCurrentTimeString);
  const [address, setAddress] = useState('');
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
    setEnquiryTime(getCurrentTimeString());
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
    getServiceTypeList({
      OwnerId: ownerId,
      SearchParam: '',
      pageIndex: 1,
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
    setEnquiryTime(getCurrentTimeString());
    setAddress('');
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
    setEnquiryTime(getEnquiryTime(item) || getCurrentTimeString());
    setAddress(getEnquiryAddress(item));
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
          Longitude: editingEnquiryExtra?.longitude || '',
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
          Longitude: '',
          latitude: '',
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
          <View style={styles.cardMainCol}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {name}
            </Text>
            {addressText ? (
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {addressText}
              </Text>
            ) : null}
          </View>
          <View style={styles.cardActionsCol}>
            <View style={styles.cardActionsRow}>
              <TouchableOpacity
                style={styles.cardIconButton}
                onPress={() => openEditEnquiryModal(item)}
              >
                <Text style={styles.cardIconText}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cardIconButton}
                onPress={() => openSms(phoneValue)}
              >
                <Text style={styles.cardIconText}>💬</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cardIconButton}
                onPress={() => openCall(phoneValue)}
              >
                <Text style={styles.cardIconText}>📞</Text>
              </TouchableOpacity>
            </View>
            {dateText ? (
              <Text style={styles.cardDateText}>{dateText}</Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCustomerCard = ({item}: {item: CustomerLookupItem}) => {
    const record = item as Record<string, unknown>;
    const name = getStringField(record, CUSTOMER_NAME_KEYS) || 'Customer';
    const addressText = getStringField(record, CUSTOMER_ADDRESS_KEYS);
    const phoneValue = getStringField(record, CUSTOMER_PHONE_KEYS);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => setSelectedCustomer(item)}
      >
        <View style={styles.cardBody}>
          <View style={styles.cardMainCol}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {name}
            </Text>
            {addressText ? (
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {addressText}
              </Text>
            ) : null}
            {phoneValue ? (
              <Text style={styles.cardSubtitle}>{phoneValue}</Text>
            ) : null}
          </View>
          <View style={styles.cardActionsCol}>
            <View style={styles.cardActionsRow}>
              <TouchableOpacity
                style={styles.cardIconButton}
                onPress={() => openSms(phoneValue)}
              >
                <Text style={styles.cardIconText}>💬</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cardIconButton}
                onPress={() => openCall(phoneValue)}
              >
                <Text style={styles.cardIconText}>📞</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    const isLeaf = node.children.length === 0;
    const isSelectable = isLeaf || depth >= 2;

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

  if (selectedCustomer) {
    return (
      <>
        <CustomerDetailsScreen
          ownerId={ownerId}
          customer={selectedCustomer as Record<string, unknown>}
          onBack={() => setSelectedCustomer(null)}
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
      </>
    );
  }

  return (
    <View style={styles.screen}>
      {/* The hamburger/title/notification row used to be drawn here; it's
          now the shared AppHeader rendered once by AdminTabs above the tab
          bar. The tabs row below is offset by the header's height so it
          doesn't render underneath it. */}
      <View style={[styles.tabsRow, { marginTop: insets.top + HEADER_CONTENT_HEIGHT }]}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('enquiries')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'enquiries' ? styles.tabButtonTextActive : null,
            ]}
          >
            ENQUIRIES
          </Text>
          {activeTab === 'enquiries' ? (
            <View style={styles.tabButtonUnderline} />
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('customers')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'customers' ? styles.tabButtonTextActive : null,
            ]}
          >
            CUSTOMERS
          </Text>
          {activeTab === 'customers' ? (
            <View style={styles.tabButtonUnderline} />
          ) : null}
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'enquiries'
                ? 'Search by Enq no., Customer name...'
                : 'Search by Customer name...'
            }
            placeholderTextColor="#9aa0a6"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Text style={styles.searchClearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
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
              <Text style={styles.linkIconText}>🔗</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.addEnquiryButton}
            onPress={() => setIsAddCustomerModalOpen(true)}
          >
            <Text style={styles.addEnquiryButtonText}>+ Customer</Text>
          </TouchableOpacity>
        )}
      </View>

      {activeTab === 'customers' ? (
        <TouchableOpacity style={styles.customerTagFilterPill} onPress={openCustomerTagPicker}>
          <Text
            style={
              customerTagFilter ? styles.dropdownPillTextValue : styles.dropdownPillTextPlaceholder
            }
            numberOfLines={1}>
            {customerTagFilter ? customerTagFilter.label : 'Select Customer Tag'}
          </Text>
          <Ionicons name="chevron-down" style={styles.dropdownChevron} />
        </TouchableOpacity>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>
                {editingEnquiryId ? 'Edit Enquiry' : 'Enquiry'}
              </Text>
              <TouchableOpacity onPress={closeAddEnquiryModal}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
              style={styles.modalFlex}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <ScrollView
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.howToRow}>
                  <View style={styles.howToPlayIcon}>
                    <Text style={styles.howToPlayIconText}>▶</Text>
                  </View>
                  <Text style={styles.howToText}>How to add enquiry ?</Text>
                </View>

                <View style={[styles.fieldWrap, styles.customerFieldWrap]}>
                  <TextInput
                    style={styles.pillInput}
                    placeholder="Customer Name"
                    placeholderTextColor="#9aa0a6"
                    value={customerName}
                    onChangeText={text => {
                      setCustomerName(text);
                      setShowCustomerSuggestions(true);
                    }}
                    onFocus={() => setShowCustomerSuggestions(true)}
                  />
                  {showCustomerSuggestions && customerSuggestions.length > 0 ? (
                    <View style={styles.suggestionBox}>
                      {isCustomerLoading ? (
                        <ActivityIndicator
                          color={THEME_PRIMARY}
                          size="small"
                          style={styles.suggestionLoader}
                        />
                      ) : null}
                      <ScrollView
                        style={styles.suggestionScroll}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                      >
                        {customerSuggestions.map(option => (
                          <TouchableOpacity
                            key={option.id}
                            style={styles.suggestionItem}
                            onPress={() => handleCustomerSelect(option)}
                          >
                            <Text style={styles.suggestionItemText}>
                              {option.name}
                            </Text>
                            {option.phone ? (
                              <Text style={styles.suggestionItemSubText}>
                                {option.phone}
                              </Text>
                            ) : null}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}
                </View>

                <View style={styles.fieldWrap}>
                  <View style={styles.pillInputRow}>
                    <TextInput
                      style={styles.pillInputFlex}
                      placeholder="Phone Number *"
                      placeholderTextColor="#9aa0a6"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                    <Text style={styles.contactPickerIcon}>👤</Text>
                  </View>
                </View>

                <View style={styles.fieldRow}>
                  <View style={styles.floatingFieldHalf}>
                    <Text style={styles.floatingLabel}>Date *</Text>
                    <TextInput
                      style={styles.floatingInput}
                      value={enquiryDate}
                      onChangeText={setEnquiryDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9aa0a6"
                    />
                  </View>
                  <View style={styles.floatingFieldHalf}>
                    <Text style={styles.floatingLabel}>Time *</Text>
                    <TextInput
                      style={styles.floatingInput}
                      value={enquiryTime}
                      onChangeText={setEnquiryTime}
                      placeholder="HH:MM:SS"
                      placeholderTextColor="#9aa0a6"
                    />
                  </View>
                </View>

                <View style={styles.fieldWrap}>
                  <TextInput
                    style={styles.pillInput}
                    placeholder="Customer Address *"
                    placeholderTextColor="#9aa0a6"
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>

                <View style={[styles.fieldRow, styles.stateCityFieldRow]}>
                  <View style={[styles.floatingFieldHalf, styles.stateFieldWrap]}>
                    <Text style={styles.floatingLabel}>State *</Text>
                    <TextInput
                      style={styles.floatingInput}
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
                      <View style={styles.suggestionBox}>
                        {isStateLoading ? (
                          <ActivityIndicator
                            color={THEME_PRIMARY}
                            size="small"
                            style={styles.suggestionLoader}
                          />
                        ) : (
                          <ScrollView
                            style={styles.suggestionScroll}
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                          >
                            {stateSuggestions.map(option => (
                              <TouchableOpacity
                                key={option.id}
                                style={styles.suggestionItem}
                                onPress={() => handleStateSelect(option)}
                              >
                                <Text
                                  numberOfLines={1}
                                  style={styles.suggestionItemText}
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
                  <View style={[styles.floatingFieldHalf, styles.cityFieldWrap]}>
                    <Text style={styles.floatingLabel}>City *</Text>
                    <TextInput
                      style={styles.floatingInput}
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
                      <View style={styles.suggestionBox}>
                        {isCityLoading ? (
                          <ActivityIndicator
                            color={THEME_PRIMARY}
                            size="small"
                            style={styles.suggestionLoader}
                          />
                        ) : (
                          <ScrollView
                            style={styles.suggestionScroll}
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                          >
                            {citySuggestions.map(option => (
                              <TouchableOpacity
                                key={option.id}
                                style={styles.suggestionItem}
                                onPress={() => handleCitySelect(option)}
                              >
                                <Text
                                  numberOfLines={1}
                                  style={styles.suggestionItemText}
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

                <View style={styles.fieldWrap}>
                  <View style={styles.floatingFieldFull}>
                    <Text style={styles.floatingLabel}>Pin Code *</Text>
                    <TextInput
                      style={styles.floatingInput}
                      value={pinCode}
                      onChangeText={text =>
                        setPinCode(text.replace(/[^0-9]/g, '').slice(0, 6))
                      }
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                </View>

                <View style={styles.fieldWrap}>
                  <TextInput
                    style={styles.pillInput}
                    placeholder="Landmark *"
                    placeholderTextColor="#9aa0a6"
                    value={landmark}
                    onChangeText={setLandmark}
                  />
                </View>

                <TouchableOpacity
                  style={styles.dropdownPill}
                  onPress={() => {
                    loadServiceTypes();
                    setIsServiceTypeModalOpen(true);
                  }}
                >
                  <Text
                    style={
                      selectedService
                        ? styles.dropdownPillTextValue
                        : styles.dropdownPillTextPlaceholder
                    }
                    numberOfLines={1}
                  >
                    {selectedService ? selectedService.label : 'Select Service Type'}
                  </Text>
                  <Ionicons name="chevron-down" style={styles.dropdownChevron} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dropdownPill}
                  onPress={() => {
                    loadTaskTags();
                    setIsTaskTagModalOpen(true);
                  }}
                >
                  <Text
                    style={
                      selectedTaskTag
                        ? styles.dropdownPillTextValue
                        : styles.dropdownPillTextPlaceholder
                    }
                    numberOfLines={1}
                  >
                    {selectedTaskTag ? selectedTaskTag.label : 'Select Task Type'}
                  </Text>
                  <Ionicons name="chevron-down" style={styles.dropdownChevron} />
                </TouchableOpacity>

                <View style={styles.fieldWrap}>
                  <TextInput
                    style={styles.pillInput}
                    placeholder="Technical Problem"
                    placeholderTextColor="#9aa0a6"
                    value={technicalProblem}
                    onChangeText={setTechnicalProblem}
                  />
                </View>

                <View style={styles.fieldWrap}>
                  <TextInput
                    style={styles.pillInput}
                    placeholder="Special Instructions"
                    placeholderTextColor="#9aa0a6"
                    value={specialInstructions}
                    onChangeText={setSpecialInstructions}
                  />
                </View>

                <View style={styles.photoRow}>
                  {photos.map((photo, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.photoBox}
                      onPress={() =>
                        photo ? removePhoto(index) : handlePhotoBoxPress(index)
                      }
                    >
                      {photo ? (
                        <Image
                          source={{uri: photo.uri}}
                          style={styles.photoPreview}
                        />
                      ) : (
                        <Text style={styles.photoBoxIcon}>📷</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddEnquirySubmit}
                  disabled={isSubmittingEnquiry}
                >
                  {isSubmittingEnquiry ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.addButtonIcon}>?</Text>
                      <Text style={styles.addButtonText}>
                        {editingEnquiryId ? 'UPDATE' : 'ADD'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={closeAddEnquiryModal}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isEnquiryDetailModalOpen}
        animationType="slide"
        transparent
        onRequestClose={closeEnquiryDetailModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalSheet}>
            {selectedEnquiry ? (
              <>
                <View style={styles.detailModalHeader}>
                  <Text style={styles.detailModalTitle}>
                    {getEnquiryType(selectedEnquiry)}
                  </Text>
                  <View style={styles.detailModalHeaderActions}>
                    <TouchableOpacity
                      onPress={() =>
                        openWhatsapp(getEnquiryPhone(selectedEnquiry))
                      }
                    >
                      <Text style={styles.detailModalHeaderIcon}>💬</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => openCall(getEnquiryPhone(selectedEnquiry))}
                    >
                      <Text style={styles.detailModalHeaderIcon}>📞</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView contentContainerStyle={styles.detailModalContent}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Enquiry No.</Text>
                    <Text style={styles.detailValue}>
                      #{getEnquiryDisplayNo(selectedEnquiry) || '-'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pref. Date</Text>
                    <Text style={styles.detailValue}>
                      {getEnquiryDate(selectedEnquiry) || 'NA'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Customer Name</Text>
                    <Text style={styles.detailValue}>
                      {getEnquiryCustomerName(selectedEnquiry)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Contact Number</Text>
                    <Text style={styles.detailValue}>
                      {formatPhoneWithCountryCode(getEnquiryPhone(selectedEnquiry)) || 'NA'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address</Text>
                    <Text style={[styles.detailValue, styles.detailValueWrap]}>
                      {getEnquiryAddress(selectedEnquiry) || 'NA'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Technical Problem</Text>
                    <Text style={[styles.detailValue, styles.detailValueWrap]}>
                      {getEnquiryTechnicalProblem(selectedEnquiry) || 'NA'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Special Instructions</Text>
                    <Text style={[styles.detailValue, styles.detailValueWrap]}>
                      {getEnquirySpecialInstruction(selectedEnquiry) || 'NA'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.addTaskButton}
                    onPress={openAddTaskModal}
                  >
                    <Text style={styles.addTaskButtonText}>+ ADD TASK</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={closeEnquiryDetailModal}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
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
            <View style={styles.searchModalInputWrap}>
              <TextInput
                style={styles.searchModalInput}
                placeholder="Search..."
                placeholderTextColor="#9aa0a6"
                value={serviceTypeSearch}
                onChangeText={setServiceTypeSearch}
              />
              <Text style={styles.searchModalIcon}>🔍</Text>
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

      <AddTaskModal
        visible={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        ownerId={ownerId}
        initialValues={addTaskInitialValues}
      />
    </View>
  );
};


export default CRMScreen;