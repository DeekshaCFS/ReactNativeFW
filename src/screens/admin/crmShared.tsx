// src/screens/admin/crmShared.tsx
// Shared helpers/types/styles for the admin CRM screens. Lives outside CRMScreen so
// CRMScreen and the modals it renders can both import from here without a require cycle.

import {ms, sp} from '../../utils/responsive';
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
import type {EnquiryListResultData} from '../../api/customerInquiry/customerInquiry.types';
import type {CustomerListResultData, StateDTOResultData, CityDTOResultData} from '../../api/customerList/customerList.types';
import type {ServiceTypeListDTOResultData} from '../../api/services/services.types';
import type {TagListResultData} from '../../api/task/task.types';
import {BASE_URL} from '../../api/apiClient';
import {getCurrentCountryCode} from '../../state/session';

type CustomerLookupItem = CustomerListResultData & Record<string, unknown>;
type EnquiryListItem = EnquiryListResultData;
type StateItem = StateDTOResultData;
type CityItem = CityDTOResultData;
type TaskTag = TagListResultData;
type AdvanceServiceItem = ServiceTypeListDTOResultData & {
  children?: AdvanceServiceItem[] | null;
  Children?: AdvanceServiceItem[] | null;
};

export type ServiceNode = {
  id: number;
  key: string;
  label: string;
  children: ServiceNode[];
};

export type TaskTagOption = {
  id: number;
  label: string;
};

export const THEME_PRIMARY = '#c3002f';
export const HEADER_PRIMARY = '#a80030';

export const pad2 = (value: number) => String(value).padStart(2, '0');

export const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const getCurrentTimeString = () => {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

// Java: DateUtils.getPlusFifteenMins() -- every Add Task dialog defaults the
// task's start time to 15 minutes ahead of "now", not the raw current time.
export const getTaskStartTimeString = () => {
  const d = new Date(Date.now() + 15 * 60 * 1000);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

export const buildPhotoFileName = (slotIndex: number) => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
  const timePart = `${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
  return `${datePart}_${timePart}_AddEnquiry${slotIndex + 1}_.jpg`;
};

export const getStringField = (item: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return '';
};

export const getNumberField = (item: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = Number(item[key]);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }
  return 0;
};

export const findFirstArrayDeep = (
  value: unknown,
  depth: number,
): unknown[] | null => {
  if (Array.isArray(value)) {
    return value;
  }

  if (depth <= 0 || !value || typeof value !== 'object') {
    return null;
  }

  for (const nested of Object.values(value as Record<string, unknown>)) {
    const found = findFirstArrayDeep(nested, depth - 1);
    if (found) {
      return found;
    }
  }

  return null;
};

export const extractArray = <T,>(response: unknown): T[] => {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (response && typeof response === 'object') {
    const data = response as Record<string, unknown>;
    const commonKeys = [
      'resultData',
      'ResultData',
      'data',
      'Data',
      'items',
      'Items',
      'list',
      'List',
      'records',
      'Records',
    ];

    for (const key of commonKeys) {
      const value = data[key];
      if (Array.isArray(value)) {
        return value as T[];
      }
    }

    for (const value of Object.values(data)) {
      if (Array.isArray(value)) {
        return value as T[];
      }
    }

    const deepFound = findFirstArrayDeep(data, 4);
    if (deepFound) {
      return deepFound as T[];
    }
  }

  return [];
};

export const getCode = (response: {code?: string; Code?: string}) =>
  String(response.code ?? response.Code ?? '');

export const getMessage = (response: {message?: string; Message?: string}) =>
  String(response.message ?? response.Message ?? '').trim();

export const isSuccessOrNoData = (response: {code?: string; Code?: string}) => {
  const code = getCode(response);
  return code === '200' || code === '500' || code === '';
};

export const normalizePhone = (phone: string) => phone.replace(/[^\d+]/g, '');

// Java (CRMTaskDetailsFragmentNew / TaskDetailsFragmentNew / EnquiryDialogNew /
// CRMTaskAmcTabHostFragment -- every screen that shows a customer's number as
// text) prefixes it with the session's country code: "+" + countryCode + " " + number.
export const formatPhoneWithCountryCode = (rawPhone: string) => {
  const trimmed = rawPhone.trim();
  if (!trimmed) {
    return '';
  }
  const countryCode = getCurrentCountryCode();
  return countryCode ? `+${countryCode} ${trimmed}` : trimmed;
};

export const USER_ID_DIGIT_CODES: Record<string, string> = {
  '0': 'AZ=',
  '1': 'BY/',
  '2': 'CX=',
  '3': 'DW/',
  '4': 'EV=',
  '5': 'FU/',
  '6': 'G-=',
  '7': '/=/',
  '8': '=/=',
  '9': 'A=/',
};

export const encryptUserId = (userId: number) =>
  String(userId)
    .split('')
    .map(digit => USER_ID_DIGIT_CODES[digit] || '')
    .join('');

export const formatDisplayDate = (raw: string) => {
  if (!raw || raw.startsWith('0001-01-01')) {
    return '';
  }
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
  }
  const dmyMatch = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[1]}-${dmyMatch[2]}-${dmyMatch[3]}`;
  }
  return raw;
};

export type CustomerOption = {
  id: number;
  name: string;
  phone: string;
  address: string;
  state: string;
  city: string;
  pinCode: string;
  landmark: string;
  productBrand: string;
  emailId?: string;
  latitude: string;
  longitude: string;
};

export const CUSTOMER_NAME_KEYS = [
  'customerName',
  'CustomerName',
  'name',
  'Name',
  'fullName',
  'FullName',
];
export const CUSTOMER_ID_KEYS = [
  'customerId',
  'CustomerId',
  'CustomerID',
  'customerDetailsid',
  'CustomerDetailsid',
  'id',
  'Id',
];
export const CUSTOMER_PHONE_KEYS = [
  'customerNumber',
  'CustomerNumber',
  'customerMobileNumber',
  'CustomerMobileNumber',
  'contactNo',
  'ContactNo',
  'mobileNo',
  'MobileNo',
  'mobileNumber',
  'MobileNumber',
  'phone',
  'Phone',
  'phoneNo',
  'PhoneNo',
  'phoneNumber',
  'PhoneNumber',
];
export const CUSTOMER_ADDRESS_KEYS = [
  'address',
  'Address',
  'customerAddress',
  'CustomerAddress',
  'fullAddress',
  'FullAddress',
];
export const CUSTOMER_STATE_KEYS = ['state', 'State', 'stateName', 'StateName'];
export const CUSTOMER_CITY_KEYS = ['city', 'City', 'cityName', 'CityName'];
export const CUSTOMER_PINCODE_KEYS = [
  'pinCode',
  'PinCode',
  'pincode',
  'Pincode',
  'zipCode',
  'ZipCode',
];
export const CUSTOMER_LANDMARK_KEYS = [
  'landmark',
  'Landmark',
  'landMark',
  'LandMark',
  'landmarkName',
  'LandmarkName',
  'nearByLandmark',
  'NearByLandmark',
  'nearbyLandmark',
  'NearbyLandmark',
];
export const CUSTOMER_BRAND_KEYS = [
  'brandName',
  'BrandName',
  'brand',
  'Brand',
  'productBrand',
  'ProductBrand',
];
export const CUSTOMER_LATITUDE_KEYS = ['latitude', 'Latitude', 'lat', 'Lat'];
export const CUSTOMER_LONGITUDE_KEYS = [
  'longitude',
  'Longitude',
  'lng',
  'Lng',
  'long',
  'Long',
];

export const normalizeCustomerOption = (
  item: CustomerLookupItem,
  index: number,
): CustomerOption | null => {
  const record = item as Record<string, unknown>;
  const name = getStringField(record, CUSTOMER_NAME_KEYS);
  if (!name) {
    return null;
  }

  const idValue = getNumberField(record, CUSTOMER_ID_KEYS);

  return {
    id: idValue > 0 ? idValue : index + 1,
    name,
    phone: getStringField(record, CUSTOMER_PHONE_KEYS),
    address: getStringField(record, CUSTOMER_ADDRESS_KEYS),
    state: getStringField(record, CUSTOMER_STATE_KEYS),
    city: getStringField(record, CUSTOMER_CITY_KEYS),
    pinCode: getStringField(record, CUSTOMER_PINCODE_KEYS),
    landmark: getStringField(record, CUSTOMER_LANDMARK_KEYS),
    productBrand: getStringField(record, CUSTOMER_BRAND_KEYS),
    emailId: getStringField(record, ['emailId', 'EmailId', 'emailID', 'EmailID', 'email', 'Email']),
    latitude: getStringField(record, CUSTOMER_LATITUDE_KEYS),
    longitude: getStringField(record, CUSTOMER_LONGITUDE_KEYS),
  };
};

export const filterCustomerOptions = (customers: CustomerOption[], query: string) => {
  const searchTerm = query.trim().toLowerCase();
  if (searchTerm.length < 2) {
    return [];
  }

  return customers
    .filter(option => option.name.toLowerCase().includes(searchTerm))
    .slice(0, 20);
};

export type StateOption = {
  id: number;
  name: string;
};

export type CityOption = {
  id: number;
  name: string;
};

export const LOOKUP_ID_KEYS = [
  'stateId',
  'StateId',
  'stateID',
  'StateID',
  'cityId',
  'CityId',
  'cityID',
  'CityID',
  'id',
  'Id',
  'value',
  'Value',
];

export const LOOKUP_NAME_KEYS = [
  'stateName',
  'StateName',
  'cityName',
  'CityName',
  'name',
  'Name',
  'state',
  'State',
  'city',
  'City',
  'label',
  'Label',
  'text',
  'Text',
];

export const normalizeStateOption = (item: StateItem): StateOption => ({
  id: getNumberField(item as Record<string, unknown>, LOOKUP_ID_KEYS),
  name: getStringField(item as Record<string, unknown>, LOOKUP_NAME_KEYS),
});

export const normalizeCityOption = (item: CityItem): CityOption => ({
  id: getNumberField(item as Record<string, unknown>, LOOKUP_ID_KEYS),
  name: getStringField(item as Record<string, unknown>, LOOKUP_NAME_KEYS),
});

export const filterLookupOptions = <T extends {name: string}>(
  options: T[],
  query: string,
) => {
  const searchTerm = query.trim().toLowerCase();
  if (searchTerm.length < 2) {
    return [];
  }

  return options
    .filter(option => option.name.toLowerCase().includes(searchTerm))
    .slice(0, 20);
};

export const getEnquiryId = (item: EnquiryListItem) =>
  getNumberField(item as Record<string, unknown>, [
    'enquiryId',
    'EnquiryId',
    'inquiryId',
    'InquiryId',
    'customerInquiryId',
    'CustomerInquiryId',
    'id',
    'Id',
  ]);

export const getEnquiryDisplayNo = (item: EnquiryListItem) => {
  const raw = getStringField(item as Record<string, unknown>, [
    'newEnquiryId',
    'NewEnquiryId',
    'enquiryNo',
    'EnquiryNo',
    'enquiryNumber',
    'EnquiryNumber',
  ]);
  if (raw) {
    return raw;
  }
  const id = getEnquiryId(item);
  return id ? String(id) : '';
};

export const getEnquiryCustomerName = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, [
    'customerName',
    'CustomerName',
    'name',
    'Name',
  ]) || 'Customer';

export const getEnquiryAddress = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, [
    'address',
    'Address',
    'customerAddress',
    'CustomerAddress',
    'fullAddress',
    'FullAddress',
  ]);

export const getEnquiryPhone = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, [
    'mobileNumber',
    'MobileNumber',
    'contactNo',
    'ContactNo',
    'mobileNo',
    'MobileNo',
    'phoneNo',
    'PhoneNo',
    'phoneNumber',
    'PhoneNumber',
  ]);

export const getEnquiryDate = (item: EnquiryListItem) =>
  formatDisplayDate(
    getStringField(item as Record<string, unknown>, [
      'enquiryDate',
      'EnquiryDate',
      'createdDate',
      'CreatedDate',
      'date',
      'Date',
    ]),
  );

export const getEnquiryType = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, [
    'enquiryType',
    'EnquiryType',
    'type',
    'Type',
  ]) || 'Sales Query';

export const getEnquiryTechnicalProblem = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, [
    'technicalProblem',
    'TechnicalProblem',
    'problemDescription',
    'ProblemDescription',
  ]);

export const getEnquirySpecialInstruction = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, [
    'specialInstruction',
    'SpecialInstruction',
    'specialInstructions',
    'SpecialInstructions',
    'instruction',
    'Instruction',
    'note',
    'Note',
  ]);

export const getEnquiryCustomerId = (item: EnquiryListItem) =>
  getNumberField(item as Record<string, unknown>, [
    'customerDetailsid',
    'CustomerDetailsid',
    'customerDetailsId',
    'CustomerDetailsId',
    'customerId',
    'CustomerId',
  ]);

export const getEnquiryState = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, CUSTOMER_STATE_KEYS);

export const getEnquiryCity = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, CUSTOMER_CITY_KEYS);

export const getEnquiryPinCode = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, CUSTOMER_PINCODE_KEYS);

export const getEnquiryLandmark = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, CUSTOMER_LANDMARK_KEYS);

export const getEnquiryTime = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, [
    'preferableTime',
    'PreferableTime',
    'enquiryTime',
    'EnquiryTime',
  ]);

export const getEnquiryServiceTypeId = (item: EnquiryListItem) =>
  getNumberField(item as Record<string, unknown>, [
    'servicesId',
    'ServicesId',
    'serviceTypeId',
    'ServiceTypeId',
  ]);

export const getEnquiryServiceTypeName = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, [
    'serviceTypeName',
    'ServiceTypeName',
    'serviceName',
    'ServiceName',
  ]);

export const getEnquiryTaskTagId = (item: EnquiryListItem) =>
  getNumberField(item as Record<string, unknown>, [
    'taskTagId',
    'TaskTagId',
    'taskTagID',
    'TaskTagID',
    'tagId',
    'TagId',
    'taskTypeTagId',
    'TaskTypeTagId',
  ]);

export const getEnquiryTaskTagName = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, [
    'taskTagName',
    'TaskTagName',
    'tagName',
    'TagName',
    'taskTag',
    'TaskTag',
  ]);

export const getEnquiryLocationId = (item: EnquiryListItem) =>
  getNumberField(item as Record<string, unknown>, [
    'locationId',
    'LocationId',
  ]);

export const getEnquiryLongitude = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, ['longitude', 'Longitude']);

export const getEnquiryLocDescription = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, [
    'locDescription',
    'LocDescription',
  ]);

export const getEnquiryLocName = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, ['locName', 'LocName']);

export const getEnquiryInquaryState = (item: EnquiryListItem) =>
  getNumberField(item as Record<string, unknown>, [
    'inquaryState',
    'InquaryState',
  ]);

export const getEnquiryReferenceId = (item: EnquiryListItem) =>
  getNumberField(item as Record<string, unknown>, [
    'referenceId',
    'ReferenceId',
  ]);

export const getEnquiryTaskId = (item: EnquiryListItem) =>
  getNumberField(item as Record<string, unknown>, ['taskId', 'TaskId']);

export const getEnquiryTaskTypeId = (item: EnquiryListItem) =>
  getNumberField(item as Record<string, unknown>, [
    'taskTypeId',
    'TaskTypeId',
  ]);

export const getEnquiryTechnicalNote = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, [
    'technicalNote',
    'TechnicalNote',
  ]);

export const ENQUIRY_IMAGE_FIELD_SETS: [string[], string[]][] = [
  [
    ['imageFileBase64Str', 'ImageFileBase64Str', 'imagePath', 'ImagePath', 'imageUrl', 'ImageUrl', 'image1', 'Image1'],
    ['imageFileName', 'ImageFileName'],
  ],
  [
    ['imageFileBase64Str1', 'ImageFileBase64Str1', 'imagePath1', 'ImagePath1', 'imageUrl1', 'ImageUrl1', 'image2', 'Image2'],
    ['imageFileName1', 'ImageFileName1'],
  ],
  [
    ['imageFileBase64Str2', 'ImageFileBase64Str2', 'imagePath2', 'ImagePath2', 'imageUrl2', 'ImageUrl2', 'image3', 'Image3'],
    ['imageFileName2', 'ImageFileName2'],
  ],
];

export const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|gif|bmp|webp)(\?.*)?$/i;

export const resolveImageOrigin = () => {
  return BASE_URL.replace(/\/api\/?$/i, '');
};

export const looksLikeImagePath = (value: string) =>
  /^https?:\/\//i.test(value) ||
  value.startsWith('/') ||
  IMAGE_EXTENSION_PATTERN.test(value);

export const resolveImageUrl = (value: string) => {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  const origin = resolveImageOrigin();
  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${origin}${normalizedPath}`;
};

export const getEnquiryImageSlotSources = (item: EnquiryListItem) => {
  const record = item as Record<string, unknown>;
  return ENQUIRY_IMAGE_FIELD_SETS.map(([valueKeys, nameKeys], index) => {
    const value = getStringField(record, valueKeys);
    if (!value) {
      return null;
    }
    const fileName =
      getStringField(record, nameKeys) || buildPhotoFileName(index);
    if (looksLikeImagePath(value)) {
      return {uri: resolveImageUrl(value), base64: '', fileName, isRemoteUrl: true};
    }
    return {
      uri: `data:image/jpeg;base64,${value}`,
      base64: value,
      fileName,
      isRemoteUrl: false,
    };
  });
};

export const fetchImageAsBase64 = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onloadend = () => {
          const result = reader.result;
          if (typeof result === 'string') {
            resolve(result.split(',')[1] || '');
          } else {
            resolve('');
          }
        };
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });

export const SERVICE_CHILD_KEYS = [
  'lstServiceTypeSubcategories',
  'LstServiceTypeSubcategories',
  'lstServiceType',
  'LstServiceType',
  'children',
  'Children',
  'subServices',
  'SubServices',
  'subServiceTypeList',
  'SubServiceTypeList',
  'childServiceTypeList',
  'ChildServiceTypeList',
  'childServiceType',
  'ChildServiceType',
  'childServices',
  'ChildServices',
  'childList',
  'ChildList',
  'items',
  'Items',
  'serviceList',
  'ServiceList',
  'serviceTypeList',
  'ServiceTypeList',
  'advanceServiceList',
  'AdvanceServiceList',
  'subCategoryList',
  'SubCategoryList',
  'subServiceList',
  'SubServiceList',
  'list',
  'List',
];

export const SERVICE_LABEL_KEYS = [
  'ServiceTypeCategoryName',
  'ServiceTypeSubCategoryName',
  'ServiceName',
  'name',
  'Name',
  'serviceName',
  'serviceTypeName',
  'ServiceTypeName',
  'categoryName',
  'CategoryName',
  'subServiceTypeName',
  'SubServiceTypeName',
  'childServiceTypeName',
  'ChildServiceTypeName',
  'title',
  'Title',
  'label',
  'Label',
  'text',
  'Text',
];

export const SERVICE_ID_KEYS = [
  'ServiceTypeCategoryId',
  'ServiceTypeSubCategoryId',
  'Id',
  'serviceId',
  'ServiceId',
  'serviceTypeId',
  'ServiceTypeId',
  'serviceTypeID',
  'ServiceTypeID',
  'subServiceTypeId',
  'SubServiceTypeId',
  'childServiceTypeId',
  'ChildServiceTypeId',
  'categoryId',
  'CategoryId',
  'id',
  'value',
  'Value',
];

export const getServiceChildArray = (
  item: Record<string, unknown>,
): Record<string, unknown>[] => {
  for (const key of SERVICE_CHILD_KEYS) {
    const value = item[key];
    if (Array.isArray(value)) {
      return value as Record<string, unknown>[];
    }
  }
  return [];
};

export const buildServiceTree = (
  items: AdvanceServiceItem[],
  depth = 0,
  parentKey = '',
): ServiceNode[] =>
  items
    .map((item, index) => {
      const record = item as Record<string, unknown>;
      const label = getStringField(record, SERVICE_LABEL_KEYS);
      const id =
        getNumberField(record, SERVICE_ID_KEYS) || (depth + 1) * 10000 + index;
      const key = `${parentKey}${depth}-${index}-${id}`;
      const children = buildServiceTree(
        getServiceChildArray(record) as AdvanceServiceItem[],
        depth + 1,
        `${key}-`,
      );
      return {id, key, label, children};
    })
    .filter(node => node.label);

export const filterServiceTree = (
  nodes: ServiceNode[],
  query: string,
): ServiceNode[] => {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return nodes;
  }

  const result: ServiceNode[] = [];
  nodes.forEach(node => {
    const children = filterServiceTree(node.children, query);
    if (node.label.toLowerCase().includes(trimmed) || children.length > 0) {
      result.push({...node, children});
    }
  });
  return result;
};

export const normalizeTaskTag = (item: TaskTag): TaskTagOption => ({
  id: getNumberField(item as Record<string, unknown>, [
    'taskTagId',
    'TaskTagId',
    'id',
    'Id',
  ]),
  label:
    getStringField(item as Record<string, unknown>, [
      'taskTagName',
      'TaskTagName',
    ]) || 'Task',
});


export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: HEADER_PRIMARY,
    paddingHorizontal: ms(12),
    paddingVertical: ms(14),
  },
  headerIconButton: {
    padding: ms(4),
  },
  headerIconText: {
    color: '#FFFFFF',
    fontSize: sp(18),
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: sp(18),
    fontWeight: '700',
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: ms(16),
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: ms(1),
    borderBottomColor: '#eceef0',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: ms(12),
  },
  tabButtonText: {
    fontSize: sp(13),
    fontWeight: '700',
    color: '#8a8f98',
    letterSpacing: 0.5,
  },
  tabButtonTextActive: {
    color: THEME_PRIMARY,
  },
  tabButtonUnderline: {
    marginTop: ms(8),
    height: ms(2),
    width: '60%',
    backgroundColor: THEME_PRIMARY,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(12),
    paddingVertical: ms(10),
    gap: ms(8),
    backgroundColor: '#FFFFFF',
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f2f4',
    borderRadius: ms(20),
    paddingHorizontal: ms(12),
    height: ms(40),
  },
  searchIcon: {
    fontSize: sp(14),
    marginRight: ms(6),
    color: '#8a8f98',
  },
  searchInput: {
    flex: 1,
    fontSize: sp(13),
    color: '#222',
    padding: 0,
  },
  searchClearIcon: {
    fontSize: sp(14),
    color: '#8a8f98',
    paddingLeft: ms(6),
  },
  addEnquiryButton: {
    backgroundColor: '#1c1c1e',
    paddingHorizontal: ms(14),
    height: ms(40),
    borderRadius: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addEnquiryButtonText: {
    color: '#FFFFFF',
    fontSize: sp(12),
    fontWeight: '700',
  },
  linkIconButton: {
    width: ms(34),
    height: ms(34),
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkIconText: {
    fontSize: sp(18),
    color: THEME_PRIMARY,
  },
  listContent: {
    padding: ms(12),
    paddingBottom: ms(24),
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(40),
  },
  errorText: {
    color: '#c3002f',
    fontSize: sp(13),
    textAlign: 'center',
    paddingHorizontal: ms(20),
  },
  emptyText: {
    color: '#8a8f98',
    fontSize: sp(13),
    textAlign: 'center',
    paddingVertical: ms(20),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(6),
    marginBottom: ms(10),
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
  },
  cardRibbon: {
    alignSelf: 'flex-start',
    backgroundColor: '#3f7ee8',
    paddingHorizontal: ms(10),
    paddingVertical: ms(3),
    borderBottomRightRadius: ms(6),
  },
  cardRibbonText: {
    color: '#FFFFFF',
    fontSize: sp(10),
    fontWeight: '700',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: ms(12),
  },
  cardMainCol: {
    flex: 1,
    paddingRight: ms(8),
  },
  cardTitle: {
    fontSize: sp(15),
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: ms(4),
  },
  cardSubtitle: {
    fontSize: sp(12),
    color: '#6b7280',
    lineHeight: sp(16),
  },
  cardActionsCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: ms(10),
  },
  cardIconButton: {
    width: ms(26),
    height: ms(26),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    fontSize: sp(15),
  },
  cardDateText: {
    fontSize: sp(11),
    color: '#9ca3af',
    marginTop: ms(8),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: ms(560),
    alignSelf: 'center',
    maxHeight: '92%',
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3a3a3c',
    paddingHorizontal: ms(16),
    paddingVertical: ms(14),
    borderRadius: ms(20),
  },
  modalHeaderTitle: {
    color: '#FFFFFF',
    fontSize: sp(16),
    fontWeight: '700',
  },
  modalCloseIcon: {
    color: '#FFFFFF',
    fontSize: sp(18),
  },
  modalFlex: {
    flexShrink: 1,
  },
  modalScrollContent: {
    padding: ms(16),
    paddingBottom: ms(30),
  },
  howToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(16),
  },
  howToPlayIcon: {
    width: ms(28),
    height: ms(20),
    borderRadius: ms(4),
    backgroundColor: THEME_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(8),
  },
  howToPlayIconText: {
    color: '#FFFFFF',
    fontSize: sp(10),
  },
  howToText: {
    color: THEME_PRIMARY,
    fontSize: sp(13),
    fontWeight: '600',
  },
  fieldWrap: {
    marginBottom: ms(14),
    position: 'relative',
    zIndex: 1,
  },
  customerFieldWrap: {
    zIndex: 30,
    elevation: 30,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: ms(12),
    marginBottom: ms(14),
  },
  stateCityFieldRow: {
    zIndex: 20,
    elevation: 20,
  },
  stateFieldWrap: {
    position: 'relative',
    zIndex: 2,
  },
  cityFieldWrap: {
    position: 'relative',
    zIndex: 1,
  },
  pillInput: {
    borderWidth: ms(1),
    borderColor: '#d5d7db',
    borderRadius: ms(24),
    paddingHorizontal: ms(16),
    height: ms(40),
    fontSize: sp(13),
    color: '#222',
  },
  instructionsInput: {
    borderWidth: ms(1),
    borderColor: '#d5d7db',
    borderRadius: ms(16),
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    minHeight: ms(140),
    fontSize: sp(13),
    color: '#222',
  },
  instructionsCharCount: {
    fontSize: sp(11),
    color: '#9aa0a6',
    textAlign: 'right',
    marginTop: ms(4),
  },
  pillInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: ms(1),
    borderColor: '#d5d7db',
    borderRadius: ms(24),
    paddingHorizontal: ms(16),
    height: ms(40),
  },
  pillInputFlex: {
    flex: 1,
    fontSize: sp(13),
    color: '#222',
    padding: 0,
  },
  contactPickerIcon: {
    fontSize: sp(18),
    color: THEME_PRIMARY,
    marginLeft: ms(8),
  },
  // Fixed height (matching pillInput/pillInputRow/dropdownPill's ms(40), the
  // form's dominant pill height) so these sit flush with the pill-style
  // fields beside/above them instead of sizing to content.
  floatingFieldFull: {
    borderWidth: ms(1),
    borderColor: '#d5d7db',
    borderRadius: ms(24),
    paddingHorizontal: ms(16),
    height: ms(40),
    justifyContent: 'center',
  },
  floatingFieldHalf: {
    flex: 1,
    borderWidth: ms(1),
    borderColor: '#d5d7db',
    borderRadius: ms(24),
    paddingHorizontal: ms(16),
    height: ms(40),
    justifyContent: 'center',
  },
  floatingLabel: {
    // Matches pillInput/dropdownPill's placeholder size (sp(13)) so this
    // doubles as this field's "placeholder" without looking undersized next
    // to sibling fields that use a real TextInput placeholder.
    fontSize: sp(13),
    color: '#9aa0a6',
    marginBottom: ms(2),
  },
  floatingInput: {
    fontSize: sp(13),
    color: '#222',
    padding: 0,
    height: ms(20),
  },
  // Plain flex wrapper for a dropdownPill sitting in a fieldRow -- dropdownPill
  // already draws its own border, so wrapping it in floatingFieldHalf (which
  // also has a border) produced a visible double border.
  pillFieldHalf: {
    flex: 1,
  },
  dropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: ms(1),
    borderColor: '#d5d7db',
    borderRadius: ms(24),
    paddingHorizontal: ms(16),
    height: ms(40),
    marginBottom: ms(14),
  },
  dropdownPillTextPlaceholder: {
    fontSize: sp(13),
    color: '#9aa0a6',
    flex: 1,
  },
  dropdownPillTextValue: {
    fontSize: sp(13),
    color: '#222',
    flex: 1,
  },
  dropdownChevron: {
    fontSize: sp(16),
    color: '#8a8f98',
    marginLeft: ms(8),
  },
  customerTagFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: ms(1),
    borderColor: '#d5d7db',
    borderRadius: ms(20),
    paddingHorizontal: ms(14),
    height: ms(38),
    marginHorizontal: ms(16),
    marginBottom: ms(10),
  },
  photoRow: {
    flexDirection: 'row',
    gap: ms(10),
    marginBottom: ms(18),
  },
  photoBox: {
    flex: 1,
    height: ms(70),
    borderWidth: ms(1),
    borderColor: '#d5d7db',
    borderRadius: ms(6),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoBoxIcon: {
    fontSize: sp(22),
    color: '#9aa0a6',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: THEME_PRIMARY,
    borderRadius: ms(24),
    height: ms(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(14),
    gap: ms(8),
  },
  addButtonIcon: {
    color: '#FFFFFF',
    fontSize: sp(14),
    fontWeight: '700',
  },
  addButtonText: {
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
  shareModalSheet: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: ms(480),
    alignSelf: 'center',
    borderTopLeftRadius: ms(16),
    borderTopRightRadius: ms(16),
    paddingHorizontal: ms(24),
    paddingTop: ms(24),
    paddingBottom: ms(28),
    alignItems: 'center',
  },
  qrPreviewSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    paddingHorizontal: ms(24),
    paddingTop: ms(24),
    paddingBottom: ms(28),
    alignItems: 'center',
    width: '100%',
    maxWidth: ms(380),
    alignSelf: 'center',
  },
  qrPreviewImage: {
    width: '100%',
    maxWidth: ms(240),
    aspectRatio: 1,
    marginVertical: ms(16),
  },
  shareModalIconBadge: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    backgroundColor: THEME_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(14),
  },
  shareModalIconText: {
    color: '#FFFFFF',
    fontSize: sp(16),
  },
  shareModalTitle: {
    color: THEME_PRIMARY,
    fontSize: sp(15),
    fontWeight: '700',
    marginBottom: ms(10),
    textAlign: 'center',
  },
  shareModalSubtitle: {
    color: '#333333',
    fontSize: sp(13),
    textAlign: 'center',
    marginBottom: ms(20),
  },
  shareModalPrimaryButton: {
    width: '100%',
    height: ms(48),
    borderRadius: ms(24),
    backgroundColor: THEME_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(12),
  },
  shareModalPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: sp(14),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  shareModalSecondaryButton: {
    width: '100%',
    height: ms(48),
    borderRadius: ms(24),
    backgroundColor: '#2b2b2b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(18),
  },
  shareModalSecondaryButtonText: {
    color: '#FFFFFF',
    fontSize: sp(14),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailModalSheet: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: ms(560),
    alignSelf: 'center',
    maxHeight: '85%',
    borderTopLeftRadius: ms(12),
    borderTopRightRadius: ms(12),
    overflow: 'hidden',
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(20),
    paddingVertical: ms(18),
  },
  detailModalTitle: {
    color: '#1f2937',
    fontSize: sp(18),
    fontWeight: '700',
  },
  detailModalHeaderActions: {
    flexDirection: 'row',
    gap: ms(20),
  },
  detailModalHeaderIcon: {
    color: THEME_PRIMARY,
    fontSize: sp(20),
  },
  detailModalContent: {
    paddingHorizontal: ms(20),
    paddingBottom: ms(24),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: ms(10),
  },
  detailLabel: {
    color: '#1f2937',
    fontSize: sp(14),
    flexShrink: 0,
    marginRight: ms(12),
  },
  detailValue: {
    color: '#9ca3af',
    fontSize: sp(14),
    textAlign: 'right',
    flexShrink: 1,
  },
  detailValueWrap: {
    flex: 1,
  },
  addTaskButton: {
    backgroundColor: THEME_PRIMARY,
    borderRadius: ms(24),
    height: ms(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ms(10),
    marginBottom: ms(14),
  },
  addTaskButtonText: {
    color: '#FFFFFF',
    fontSize: sp(14),
    fontWeight: '700',
    letterSpacing: 0.5,
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
    elevation: 4,
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
  suggestionItemSubText: {
    fontSize: sp(11),
    color: '#8a8f98',
    marginTop: ms(2),
  },
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: ms(24),
  },
  serviceModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(6),
    width: '100%',
    maxWidth: ms(480),
    alignSelf: 'center',
    maxHeight: '70%',
    padding: ms(16),
  },
  searchModalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: ms(1),
    borderColor: THEME_PRIMARY,
    borderRadius: ms(6),
    paddingHorizontal: ms(12),
    height: ms(40),
    marginBottom: ms(10),
  },
  searchModalInput: {
    flex: 1,
    fontSize: sp(13),
    color: '#222',
    padding: 0,
  },
  searchModalIcon: {
    fontSize: sp(14),
    color: '#8a8f98',
  },
  serviceModalScroll: {
    maxHeight: ms(320),
  },
  serviceHeaderText: {
    fontSize: sp(14),
    fontWeight: '700',
    color: THEME_PRIMARY,
    marginTop: ms(8),
    marginBottom: ms(4),
  },
  serviceSubHeaderText: {
    fontSize: sp(13),
    fontWeight: '700',
    color: THEME_PRIMARY,
    marginLeft: ms(12),
    marginTop: ms(6),
    marginBottom: ms(4),
  },
  serviceLeafRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: ms(24),
    paddingVertical: ms(4),
  },
  serviceLeafBullet: {
    fontSize: sp(12),
    color: '#222',
    marginRight: ms(6),
  },
  serviceLeafText: {
    fontSize: sp(13),
    color: '#222',
  },
  serviceLeafTextSelected: {
    color: THEME_PRIMARY,
    fontWeight: '700',
  },
  taskTagModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(6),
    width: '100%',
    maxWidth: ms(480),
    alignSelf: 'center',
    maxHeight: '75%',
    padding: ms(16),
  },
  taskTagModalTitle: {
    fontSize: sp(15),
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: ms(10),
  },
  taskTagModalScroll: {
    maxHeight: ms(320),
  },
  taskTagItem: {
    paddingVertical: ms(10),
    borderBottomWidth: ms(1),
    borderBottomColor: '#f0f0f0',
  },
  taskTagItemText: {
    fontSize: sp(13),
    color: '#222',
  },
  warrantyRow: {
    flexDirection: 'row',
    gap: ms(12),
    marginBottom: ms(14),
  },
  warrantyToggleGroup: {
    flexDirection: 'row',
    borderRadius: ms(24),
    overflow: 'hidden',
  },
  warrantyToggleButton: {
    height: ms(40),
    paddingHorizontal: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: ms(1),
    borderColor: '#3a3a3c',
  },
  warrantyToggleButtonLeft: {
    borderTopLeftRadius: ms(24),
    borderBottomLeftRadius: ms(24),
    borderRightWidth: ms(0.5),
  },
  warrantyToggleButtonRight: {
    borderTopRightRadius: ms(24),
    borderBottomRightRadius: ms(24),
    borderLeftWidth: ms(0.5),
  },
  warrantyToggleButtonActive: {
    backgroundColor: '#1c1c1e',
  },
  warrantyToggleText: {
    fontSize: sp(12),
    fontWeight: '600',
    color: '#1c1c1e',
  },
  warrantyToggleTextActive: {
    fontSize: sp(12),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  amcDisabledField: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  amcDisabledInput: {
    borderWidth: ms(1),
    borderColor: '#e1e2e5',
    borderRadius: ms(24),
    paddingHorizontal: ms(16),
    height: ms(40),
    fontSize: sp(11),
    color: '#9aa0a6',
    backgroundColor: '#f5f5f7',
  },
  amcPlaceholderOverlay: {
    position: 'absolute',
    left: ms(16),
    right: ms(16),
    fontSize: sp(11),
    color: '#9aa0a6',
  },
  amcEnabledInput: {
    borderColor: '#d0d2d6',
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  taskFormTabsRow: {
    flexDirection: 'row',
    borderWidth: ms(1),
    borderColor: '#d5d7db',
    borderRadius: ms(20),
    overflow: 'hidden',
    marginBottom: ms(16),
  },
  taskFormTabButton: {
    flex: 1,
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: ms(1),
    borderLeftColor: '#d5d7db',
  },
  taskFormTabButtonActive: {
    backgroundColor: '#1c1c1e',
  },
  taskFormTabText: {
    fontSize: sp(11),
    fontWeight: '600',
    color: '#1c1c1e',
  },
  taskFormTabTextActive: {
    fontSize: sp(11),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabContentPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(24),
  },
  tabContentPlaceholderText: {
    color: '#9aa0a6',
    fontSize: sp(13),
  },
  instructionRecorderBox: {
    borderWidth: ms(1),
    borderColor: '#eaebed',
    borderRadius: ms(20),
    paddingVertical: ms(18),
    paddingHorizontal: ms(12),
    alignItems: 'center',
    marginBottom: ms(16),
  },
  instructionRecorderLabel: {
    color: '#6b7280',
    fontSize: sp(12),
    textAlign: 'center',
    marginBottom: ms(14),
  },
  instructionRecorderButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(28),
    marginBottom: ms(10),
  },
  instructionRecorderButton: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    backgroundColor: '#9aa0a6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionRecorderButtonDisabled: {
    opacity: 0.5,
  },
  instructionRecorderMicButton: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    backgroundColor: THEME_PRIMARY,
  },
  instructionRecorderButtonIcon: {
    color: '#FFFFFF',
    fontSize: sp(18),
  },
  instructionRecorderTimerText: {
    color: '#1a1a1a',
    fontSize: sp(13),
    fontWeight: '600',
  },
  darkAddButton: {
    flexDirection: 'row',
    backgroundColor: '#3a3a3c',
    borderRadius: ms(24),
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(14),
    gap: ms(8),
  },
  darkAddButtonText: {
    color: '#FFFFFF',
    fontSize: sp(14),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  itemRowCard: {
    borderWidth: ms(1),
    borderColor: '#e1e2e5',
    borderRadius: ms(10),
    padding: ms(12),
    marginBottom: ms(12),
  },
  itemRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(10),
  },
  itemRowTitle: {
    fontSize: sp(13),
    fontWeight: '700',
    color: THEME_PRIMARY,
  },
  itemRowRemove: {
    fontSize: sp(14),
    fontWeight: '700',
    color: THEME_PRIMARY,
  },
  itemRowFieldsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },
  itemNameDropdown: {
    flex: 1.4,
    marginBottom: 0,
  },
  itemAvailableQtyBox: {
    flex: 0.7,
    height: ms(40),
    borderWidth: ms(1),
    borderColor: '#d5d7db',
    borderRadius: ms(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemAvailableQtyText: {
    fontSize: sp(13),
    color: '#222',
  },
  itemQuantityInput: {
    flex: 1,
    marginBottom: 0,
    textAlign: 'center',
  },
  addMoreText: {
    color: THEME_PRIMARY,
    fontSize: sp(13),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: ms(14),
  },
  itemSearchHintText: {
    color: THEME_PRIMARY,
    fontSize: sp(12),
    textAlign: 'center',
    paddingVertical: ms(16),
  },
});
