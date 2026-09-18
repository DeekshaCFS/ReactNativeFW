// src/screens/admin/CRMScreen.tsx

import React, {useCallback, useEffect, useMemo, useState} from 'react';
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
  launchCamera,
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import {getEnquiryList, addEnquiry, updateEnquiry} from '../../api/customerInquiry/customerInquiryService';
import type {EnquiryListResultData} from '../../api/customerInquiry/customerInquiry.types';
import {getCustomerList, getStateList, getCityList} from '../../api/customerList/customerListService';
import type {CustomerListResultData, StateDTOResultData, CityDTOResultData} from '../../api/customerList/customerList.types';
import {getServiceTypeList} from '../../api/services/servicesService';
import type {ServiceTypeListDTOResultData} from '../../api/services/services.types';
import {getTaskTagList} from '../../api/task/taskService';
import type {TagListResultData} from '../../api/task/task.types';
import {BASE_URL} from '../../api/apiClient';
// TODO(temp): inlined from URLConstant.Base.GET_LINK before URLConstant.ts was deleted.
// Was: `${PROTOCOL}${SERVICE_IP}/EnquiryForm/EnquiryForm?Node=` where PROTOCOL='http://', SERVICE_IP='192.169.3.8'.
const ENQUIRY_FORM_LINK = 'http://192.169.3.8/EnquiryForm/EnquiryForm?Node=';

type AddEnquiryRequest = {
  CustomerDetailsid?: number;
  CustomerName: string;
  MobileNumber: string;
  EnquiryDate: string;
  EnquiryTime: string;
  Address: string;
  State: string;
  City: string;
  PinCode: string;
  Landmark: string;
  ServiceTypeId?: number;
  ServiceTypeName?: string;
  TaskTagId?: number;
  TaskTagName?: string;
  TechnicalProblem?: string;
  SpecialInstruction?: string;
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
const HEADER_PRIMARY = '#a80030';

const pad2 = (value: number) => String(value).padStart(2, '0');

export const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const getCurrentTimeString = () => {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

const buildPhotoFileName = (slotIndex: number) => {
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

const findFirstArrayDeep = (
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

const getCode = (response: {code?: string; Code?: string}) =>
  String(response.code ?? response.Code ?? '');

const getMessage = (response: {message?: string; Message?: string}) =>
  String(response.message ?? response.Message ?? '').trim();

const isSuccessOrNoData = (response: {code?: string; Code?: string}) => {
  const code = getCode(response);
  return code === '200' || code === '500' || code === '';
};

const normalizePhone = (phone: string) => phone.replace(/[^\d+]/g, '');

const USER_ID_DIGIT_CODES: Record<string, string> = {
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

const encryptUserId = (userId: number) =>
  String(userId)
    .split('')
    .map(digit => USER_ID_DIGIT_CODES[digit] || '')
    .join('');

const formatDisplayDate = (raw: string) => {
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
const CUSTOMER_STATE_KEYS = ['state', 'State', 'stateName', 'StateName'];
const CUSTOMER_CITY_KEYS = ['city', 'City', 'cityName', 'CityName'];
const CUSTOMER_PINCODE_KEYS = [
  'pinCode',
  'PinCode',
  'pincode',
  'Pincode',
  'zipCode',
  'ZipCode',
];
const CUSTOMER_LANDMARK_KEYS = [
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
const CUSTOMER_BRAND_KEYS = [
  'brandName',
  'BrandName',
  'brand',
  'Brand',
  'productBrand',
  'ProductBrand',
];
const CUSTOMER_LATITUDE_KEYS = ['latitude', 'Latitude', 'lat', 'Lat'];
const CUSTOMER_LONGITUDE_KEYS = [
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

const LOOKUP_ID_KEYS = [
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

const LOOKUP_NAME_KEYS = [
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

const getEnquiryType = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, [
    'enquiryType',
    'EnquiryType',
    'type',
    'Type',
  ]) || 'Sales Query';

const getEnquiryTechnicalProblem = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, [
    'technicalProblem',
    'TechnicalProblem',
    'problemDescription',
    'ProblemDescription',
  ]);

const getEnquirySpecialInstruction = (item: EnquiryListItem) =>
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

const getEnquiryCustomerId = (item: EnquiryListItem) =>
  getNumberField(item as Record<string, unknown>, [
    'customerDetailsid',
    'CustomerDetailsid',
    'customerDetailsId',
    'CustomerDetailsId',
    'customerId',
    'CustomerId',
  ]);

const getEnquiryState = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, CUSTOMER_STATE_KEYS);

const getEnquiryCity = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, CUSTOMER_CITY_KEYS);

const getEnquiryPinCode = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, CUSTOMER_PINCODE_KEYS);

const getEnquiryLandmark = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, CUSTOMER_LANDMARK_KEYS);

const getEnquiryTime = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, [
    'preferableTime',
    'PreferableTime',
    'enquiryTime',
    'EnquiryTime',
  ]);

const getEnquiryServiceTypeId = (item: EnquiryListItem) =>
  getNumberField(item as Record<string, unknown>, [
    'servicesId',
    'ServicesId',
    'serviceTypeId',
    'ServiceTypeId',
  ]);

const getEnquiryServiceTypeName = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, [
    'serviceTypeName',
    'ServiceTypeName',
    'serviceName',
    'ServiceName',
  ]);

const getEnquiryTaskTagId = (item: EnquiryListItem) =>
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

const getEnquiryTaskTagName = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, [
    'taskTagName',
    'TaskTagName',
    'tagName',
    'TagName',
    'taskTag',
    'TaskTag',
  ]);

const getEnquiryLocationId = (item: EnquiryListItem) =>
  getNumberField(item as Record<string, unknown>, [
    'locationId',
    'LocationId',
  ]);

const getEnquiryLongitude = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, ['longitude', 'Longitude']);

const getEnquiryLocDescription = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, [
    'locDescription',
    'LocDescription',
  ]);

const getEnquiryLocName = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, ['locName', 'LocName']);

const getEnquiryInquaryState = (item: EnquiryListItem) =>
  getNumberField(item as Record<string, unknown>, [
    'inquaryState',
    'InquaryState',
  ]);

const getEnquiryReferenceId = (item: EnquiryListItem) =>
  getNumberField(item as Record<string, unknown>, [
    'referenceId',
    'ReferenceId',
  ]);

const getEnquiryTaskId = (item: EnquiryListItem) =>
  getNumberField(item as Record<string, unknown>, ['taskId', 'TaskId']);

const getEnquiryTaskTypeId = (item: EnquiryListItem) =>
  getNumberField(item as Record<string, unknown>, [
    'taskTypeId',
    'TaskTypeId',
  ]);

const getEnquiryTechnicalNote = (item: EnquiryListItem) =>
  getStringField(item as Record<string, unknown>, [
    'technicalNote',
    'TechnicalNote',
  ]);

const ENQUIRY_IMAGE_FIELD_SETS: [string[], string[]][] = [
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

const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|gif|bmp|webp)(\?.*)?$/i;

const resolveImageOrigin = () => {
  return BASE_URL.replace(/\/api\/?$/i, '');
};

const looksLikeImagePath = (value: string) =>
  /^https?:\/\//i.test(value) ||
  value.startsWith('/') ||
  IMAGE_EXTENSION_PATTERN.test(value);

const resolveImageUrl = (value: string) => {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  const origin = resolveImageOrigin();
  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${origin}${normalizedPath}`;
};

const getEnquiryImageSlotSources = (item: EnquiryListItem) => {
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

const fetchImageAsBase64 = (url: string): Promise<string> =>
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

const SERVICE_CHILD_KEYS = [
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

const SERVICE_LABEL_KEYS = [
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

const SERVICE_ID_KEYS = [
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

const getServiceChildArray = (
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
            CustomerTagId: 0,
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
    [ownerId],
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
    const result = await launchCamera({
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
          EnquiryDate: enquiryDate,
          EnquiryTime: enquiryTime,
          Address: address.trim(),
          State: state.trim(),
          City: city.trim(),
          PinCode: pinCode.trim(),
          Landmark: landmark.trim(),
          ServiceTypeId: selectedService?.id || 0,
          ServiceTypeName: selectedService?.label || '',
          TaskTagId: selectedTaskTag?.id || 0,
          TaskTagName: selectedTaskTag?.label || '',
          TechnicalProblem: technicalProblem.trim(),
          SpecialInstruction: specialInstructions.trim(),
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
        await addEnquiry(payload);
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

  const openWhatsapp = async (rawPhone: string) => {
    const normalizedPhone = normalizePhone(rawPhone).replace(/^\+/, '');
    if (!normalizedPhone) {
      Alert.alert('WhatsApp number unavailable');
      return;
    }
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
                onPress={() => openWhatsapp(phoneValue)}
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
                onPress={() => openWhatsapp(phoneValue)}
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
        ) : null}
      </View>

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
                  <Text style={styles.dropdownChevron}>⌄</Text>
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
                  <Text style={styles.dropdownChevron}>⌄</Text>
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
                      {getEnquiryPhone(selectedEnquiry) || 'NA'}
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
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  headerIconButton: {
    padding: 4,
  },
  headerIconText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#eceef0',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8a8f98',
    letterSpacing: 0.5,
  },
  tabButtonTextActive: {
    color: THEME_PRIMARY,
  },
  tabButtonUnderline: {
    marginTop: 8,
    height: 2,
    width: '60%',
    backgroundColor: THEME_PRIMARY,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f2f4',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
    color: '#8a8f98',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#222',
    padding: 0,
  },
  searchClearIcon: {
    fontSize: 14,
    color: '#8a8f98',
    paddingLeft: 6,
  },
  addEnquiryButton: {
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addEnquiryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  linkIconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkIconText: {
    fontSize: 18,
    color: THEME_PRIMARY,
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    color: '#c3002f',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#8a8f98',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    marginBottom: 10,
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
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomRightRadius: 6,
  },
  cardRibbonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  cardMainCol: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  cardActionsCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cardIconButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    fontSize: 15,
  },
  cardDateText: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    maxHeight: '92%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3a3a3c',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalCloseIcon: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  modalFlex: {
    flexShrink: 1,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  howToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  howToPlayIcon: {
    width: 28,
    height: 20,
    borderRadius: 4,
    backgroundColor: THEME_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  howToPlayIconText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  howToText: {
    color: THEME_PRIMARY,
    fontSize: 13,
    fontWeight: '600',
  },
  fieldWrap: {
    marginBottom: 14,
    position: 'relative',
    zIndex: 1,
  },
  customerFieldWrap: {
    zIndex: 30,
    elevation: 30,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
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
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 46,
    fontSize: 13,
    color: '#222',
  },
  pillInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 46,
  },
  pillInputFlex: {
    flex: 1,
    fontSize: 13,
    color: '#222',
    padding: 0,
  },
  contactPickerIcon: {
    fontSize: 18,
    color: THEME_PRIMARY,
    marginLeft: 8,
  },
  floatingFieldFull: {
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
  },
  floatingFieldHalf: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
  },
  floatingLabel: {
    fontSize: 10,
    color: '#8a8f98',
    marginBottom: 2,
  },
  floatingInput: {
    fontSize: 13,
    color: '#222',
    padding: 0,
    height: 20,
  },
  dropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 46,
    marginBottom: 14,
  },
  dropdownPillTextPlaceholder: {
    fontSize: 13,
    color: '#9aa0a6',
    flex: 1,
  },
  dropdownPillTextValue: {
    fontSize: 13,
    color: '#222',
    flex: 1,
  },
  dropdownChevron: {
    fontSize: 16,
    color: '#8a8f98',
    marginLeft: 8,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  photoBox: {
    flex: 1,
    height: 70,
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoBoxIcon: {
    fontSize: 22,
    color: '#9aa0a6',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: THEME_PRIMARY,
    borderRadius: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    gap: 8,
  },
  addButtonIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cancelText: {
    textAlign: 'center',
    color: THEME_PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  shareModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: 'center',
  },
  qrPreviewSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  qrPreviewImage: {
    width: '100%',
    maxWidth: 240,
    aspectRatio: 1,
    marginVertical: 16,
  },
  shareModalIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  shareModalIconText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  shareModalTitle: {
    color: THEME_PRIMARY,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  shareModalSubtitle: {
    color: '#333333',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  shareModalPrimaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  shareModalPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  shareModalSecondaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2b2b2b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  shareModalSecondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailModalSheet: {
    backgroundColor: '#FFFFFF',
    maxHeight: '85%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  detailModalTitle: {
    color: '#1f2937',
    fontSize: 18,
    fontWeight: '700',
  },
  detailModalHeaderActions: {
    flexDirection: 'row',
    gap: 20,
  },
  detailModalHeaderIcon: {
    color: THEME_PRIMARY,
    fontSize: 20,
  },
  detailModalContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  detailLabel: {
    color: '#1f2937',
    fontSize: 14,
    flexShrink: 0,
    marginRight: 12,
  },
  detailValue: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'right',
    flexShrink: 1,
  },
  detailValueWrap: {
    flex: 1,
  },
  addTaskButton: {
    backgroundColor: THEME_PRIMARY,
    borderRadius: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  addTaskButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  suggestionBox: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e1e2e5',
    borderRadius: 8,
    maxHeight: 200,
    overflow: 'hidden',
    zIndex: 10,
    elevation: 4,
  },
  suggestionScroll: {
    maxHeight: 200,
  },
  suggestionLoader: {
    paddingVertical: 10,
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#FFFFFF',
  },
  suggestionItemText: {
    fontSize: 13,
    color: '#222',
  },
  suggestionItemSubText: {
    fontSize: 11,
    color: '#8a8f98',
    marginTop: 2,
  },
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  serviceModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    width: '100%',
    maxHeight: '70%',
    padding: 16,
  },
  searchModalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME_PRIMARY,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
  },
  searchModalInput: {
    flex: 1,
    fontSize: 13,
    color: '#222',
    padding: 0,
  },
  searchModalIcon: {
    fontSize: 14,
    color: '#8a8f98',
  },
  serviceModalScroll: {
    maxHeight: 320,
  },
  serviceHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME_PRIMARY,
    marginTop: 8,
    marginBottom: 4,
  },
  serviceSubHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME_PRIMARY,
    marginLeft: 12,
    marginTop: 6,
    marginBottom: 4,
  },
  serviceLeafRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 24,
    paddingVertical: 4,
  },
  serviceLeafBullet: {
    fontSize: 12,
    color: '#222',
    marginRight: 6,
  },
  serviceLeafText: {
    fontSize: 13,
    color: '#222',
  },
  serviceLeafTextSelected: {
    color: THEME_PRIMARY,
    fontWeight: '700',
  },
  taskTagModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    width: '100%',
    maxHeight: '75%',
    padding: 16,
  },
  taskTagModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 10,
  },
  taskTagModalScroll: {
    maxHeight: 320,
  },
  taskTagItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taskTagItemText: {
    fontSize: 13,
    color: '#222',
  },
  warrantyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  warrantyToggleGroup: {
    flexDirection: 'row',
    borderRadius: 24,
    overflow: 'hidden',
  },
  warrantyToggleButton: {
    height: 46,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  warrantyToggleButtonLeft: {
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    borderRightWidth: 0.5,
  },
  warrantyToggleButtonRight: {
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    borderLeftWidth: 0.5,
  },
  warrantyToggleButtonActive: {
    backgroundColor: '#1c1c1e',
  },
  warrantyToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  warrantyToggleTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  amcDisabledField: {
    flex: 1,
    justifyContent: 'center',
  },
  amcDisabledInput: {
    borderWidth: 1,
    borderColor: '#e1e2e5',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 46,
    fontSize: 11,
    color: '#9aa0a6',
    backgroundColor: '#f5f5f7',
  },
  amcEnabledInput: {
    borderColor: '#d0d2d6',
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  taskFormTabsRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  taskFormTabButton: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#d5d7db',
  },
  taskFormTabButtonActive: {
    backgroundColor: '#1c1c1e',
  },
  taskFormTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  taskFormTabTextActive: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabContentPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  tabContentPlaceholderText: {
    color: '#9aa0a6',
    fontSize: 13,
  },
  instructionRecorderBox: {
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionRecorderLabel: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
  },
  instructionRecorderButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginBottom: 10,
  },
  instructionRecorderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9aa0a6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionRecorderButtonDisabled: {
    opacity: 0.5,
  },
  instructionRecorderMicButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME_PRIMARY,
  },
  instructionRecorderButtonIcon: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  instructionRecorderTimerText: {
    color: '#1a1a1a',
    fontSize: 13,
    fontWeight: '600',
  },
  darkAddButton: {
    flexDirection: 'row',
    backgroundColor: '#3a3a3c',
    borderRadius: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    gap: 8,
  },
  darkAddButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  itemRowCard: {
    borderWidth: 1,
    borderColor: '#e1e2e5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  itemRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemRowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME_PRIMARY,
  },
  itemRowRemove: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME_PRIMARY,
  },
  itemRowFieldsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemNameDropdown: {
    flex: 1.4,
    marginBottom: 0,
  },
  itemAvailableQtyBox: {
    flex: 0.7,
    height: 46,
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemAvailableQtyText: {
    fontSize: 13,
    color: '#222',
  },
  itemQuantityInput: {
    flex: 1,
    marginBottom: 0,
    textAlign: 'center',
  },
  addMoreText: {
    color: THEME_PRIMARY,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
  },
  itemSearchHintText: {
    color: THEME_PRIMARY,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 16,
  },
});

export default CRMScreen;