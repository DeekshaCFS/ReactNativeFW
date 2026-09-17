// import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   FlatList,
//   Image,
//   KeyboardAvoidingView,
//   Linking,
//   Modal,
//   Platform,
//   Pressable,
//   RefreshControl,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import {
//   launchCamera,
//   launchImageLibrary,
//   type Asset,
// } from 'react-native-image-picker';
// import {
//   type AddCustomerLeadRequest,
//   type CityItem,
//   type CityListResponse,
//   type CustomerLookupItem,
//   type CustomerLookupResponse,
//   type LeadListItem,
//   type LeadListResponse,
//   type LeadServiceTypeItem,
//   type LeadServiceTypeResponse,
//   type LeadStatusItem,
//   type LeadStatusResponse,
//   type StateItem,
//   type StateListResponse,
// } from './adminLegacyApiTypes';
// import { getLeadstatusList, getAllLEADList } from '../../api/lead/leadService';
// import { getEnquiryServiceTypeList } from '../../api/services/servicesService';
// import { getCustomerList, getStateList, getCityList } from '../../api/customerList/customerListService';
// import { postExternalLeadForm } from '../../api/leadForm/leadFormService';
// import LeadDetailsScreen from '../admin/LeadDetailsScreen';

// type LeadListScreenProps = {
//   userId: number;
//   onMenuPress: () => void;
// };

// type LeadStatusOption = {
//   id: number;
//   label: string;
// };

// const PAGE_START = 1;
// const THEME_PRIMARY = '#c3002f';
// const HEADER_PRIMARY = '#d0003f';
// const ALL_STATUS: LeadStatusOption = {id: 0, label: 'Select Lead Status'};

// type CustomerOption = {
//   id: number;
//   name: string;
//   phone: string;
//   address: string;
//   state: string;
//   city: string;
//   pinCode: string;
//   landmark: string;
// };

// type ServiceTypeOption = {
//   id: number;
//   label: string;
// };

// type StateOption = {
//   id: number;
//   name: string;
// };

// type CityOption = {
//   id: number;
//   name: string;
// };

// type LeadPhotoSlot = {
//   uri: string;
//   base64: string;
//   fileName: string;
// } | null;

// const buildLeadPhotoFileName = (slotIndex: number) => {
//   const now = new Date();
//   const pad = (value: number) => String(value).padStart(2, '0');
//   const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
//     now.getDate(),
//   )}`;
//   const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(
//     now.getSeconds(),
//   )}`;
//   return `${datePart}_${timePart}_AddUpdateLead${slotIndex + 1}_.jpg`;
// };

// const normalizeServiceType = (
//   item: LeadServiceTypeItem,
// ): ServiceTypeOption => ({
//   id: getNumberValue(item, [
//     'serviceTypeId',
//     'ServiceTypeId',
//     'serviceTypeID',
//     'ServiceTypeID',
//     'id',
//     'Id',
//   ]),
//   label:
//     String(
//       item.serviceTypeName ??
//         item.ServiceTypeName ??
//         item.serviceName ??
//         item.ServiceName ??
//         item.name ??
//         item.Name ??
//         '',
//     ).trim() || 'Service Type',
// });

// const uniqueServiceTypes = (options: ServiceTypeOption[]) => {
//   const seen = new Set<number>();
//   return options.filter(option => {
//     if (!option.id || seen.has(option.id)) {
//       return false;
//     }
//     seen.add(option.id);
//     return true;
//   });
// };

// const getCustomerFieldValue = (
//   item: CustomerLookupItem,
//   keys: string[],
// ) => {
//   for (const key of keys) {
//     const value = (item as Record<string, unknown>)[key];
//     if (typeof value === 'string' && value.trim()) {
//       return value.trim();
//     }
//     if (typeof value === 'number' && Number.isFinite(value)) {
//       return String(value);
//     }
//   }

//   return '';
// };

// const normalizeCustomerOption = (
//   item: CustomerLookupItem,
//   index: number,
// ): CustomerOption | null => {
//   const name = getCustomerFieldValue(item, [
//     'customerName',
//     'CustomerName',
//     'customername',
//     'name',
//     'Name',
//     'fullName',
//     'FullName',
//     'fullname',
//     'customer_name',
//     'Customer_Name',
//     'clientName',
//     'ClientName',
//     'clientname',
//     'label',
//     'Label',
//     'text',
//     'Text',
//     'value',
//     'Value',
//   ]);

//   if (!name) {
//     return null;
//   }

//   const idValue = Number(
//     getCustomerFieldValue(item, [
//       'customerId',
//       'CustomerId',
//       'CustomerID',
//       'customerid',
//       'customerDetailsid',
//       'CustomerDetailsid',
//       'customerdetailsid',
//       'customer_id',
//       'Customer_Id',
//       'id',
//       'Id',
//       'ID',
//     ]),
//   );

//   return {
//     id: Number.isFinite(idValue) && idValue > 0 ? idValue : index + 1,
//     name,
//     phone: getCustomerFieldValue(item, [
//       'customerNumber',
//       'CustomerNumber',
//       'customernumber',
//       'customerMobileNumber',
//       'CustomerMobileNumber',
//       'customermobilenumber',
//       'customerMobileNo',
//       'CustomerMobileNo',
//       'customermobileno',
//       'contactNo',
//       'ContactNo',
//       'contactno',
//       'contactNumber',
//       'ContactNumber',
//       'contactnumber',
//       'mobileNo',
//       'MobileNo',
//       'mobileno',
//       'mobileNumber',
//       'MobileNumber',
//       'mobilenumber',
//       'Mobile',
//       'mobile',
//       'phone',
//       'Phone',
//       'phoneNo',
//       'PhoneNo',
//       'phoneno',
//       'phoneNumber',
//       'PhoneNumber',
//       'phonenumber',
//       'primaryMobile',
//       'PrimaryMobile',
//       'primarymobile',
//       'primaryMobileNumber',
//       'PrimaryMobileNumber',
//       'primarymobilenumber',
//     ]),
//     address: getCustomerFieldValue(item, [
//       'address',
//       'Address',
//       'customerAddress',
//       'CustomerAddress',
//       'customeraddress',
//       'fullAddress',
//       'FullAddress',
//       'fulladdress',
//     ]),
//     state: getCustomerFieldValue(item, [
//       'state',
//       'State',
//       'stateName',
//       'StateName',
//       'statename',
//     ]),
//     city: getCustomerFieldValue(item, [
//       'city',
//       'City',
//       'cityName',
//       'CityName',
//       'cityname',
//     ]),
//     pinCode: getCustomerFieldValue(item, [
//       'pinCode',
//       'PinCode',
//       'pincode',
//       'Pincode',
//       'zipCode',
//       'ZipCode',
//       'zipcode',
//     ]),
//     landmark: getCustomerFieldValue(item, [
//       'landmark',
//       'Landmark',
//       'landMark',
//       'LandMark',
//       'customerLandmark',
//       'CustomerLandmark',
//       'customerlandmark',
//     ]),
//   };
// };

// const filterCustomerOptions = (customers: CustomerOption[], query: string) => {
//   const searchTerm = query.trim().toLowerCase();
//   if (searchTerm.length < 2) {
//     return [];
//   }

//   return customers
//     .filter(option => option.name.toLowerCase().includes(searchTerm))
//     .slice(0, 20);
// };

// const getLookupFieldValue = (item: Record<string, unknown>, keys: string[]) => {
//   for (const key of keys) {
//     const value = item[key];
//     if (typeof value === 'string' && value.trim()) {
//       return value.trim();
//     }
//     if (typeof value === 'number' && Number.isFinite(value)) {
//       return String(value);
//     }
//   }

//   return '';
// };

// const normalizeStateOption = (item: StateItem): StateOption => ({
//   id: Number(
//     getLookupFieldValue(item as Record<string, unknown>, [
//       'stateId',
//       'StateId',
//       'stateID',
//       'StateID',
//       'stateid',
//       'id',
//       'Id',
//       'value',
//       'Value',
//     ]),
//   ) || 0,
//   name: getLookupFieldValue(item as Record<string, unknown>, [
//     'stateName',
//     'StateName',
//     'statename',
//     'name',
//     'Name',
//     'state',
//     'State',
//     'label',
//     'Label',
//     'text',
//     'Text',
//   ]),
// });

// const normalizeCityOption = (item: CityItem): CityOption => ({
//   id: Number(
//     getLookupFieldValue(item as Record<string, unknown>, [
//       'cityId',
//       'CityId',
//       'cityID',
//       'CityID',
//       'cityid',
//       'id',
//       'Id',
//       'value',
//       'Value',
//     ]),
//   ) || 0,
//   name: getLookupFieldValue(item as Record<string, unknown>, [
//     'cityName',
//     'CityName',
//     'cityname',
//     'name',
//     'Name',
//     'city',
//     'City',
//     'label',
//     'Label',
//     'text',
//     'Text',
//   ]),
// });

// const filterLookupOptions = <T extends {name: string}>(
//   options: T[],
//   query: string,
// ) => {
//   const searchTerm = query.trim().toLowerCase();
//   if (searchTerm.length < 2) {
//     return [];
//   }

//   return options
//     .filter(option => option.name.toLowerCase().includes(searchTerm))
//     .slice(0, 20);
// };

// const getResultData = <T,>(response: {
//   resultData?: T[] | null;
//   ResultData?: T[] | null;
// }) => response.resultData ?? response.ResultData ?? [];

// const getLookupResultData = <T,>(response: unknown): T[] => {
//   if (Array.isArray(response)) {
//     return response as T[];
//   }

//   if (response && typeof response === 'object') {
//     const data = response as Record<string, unknown>;

//     // 1. Try common known wrapper keys
//     const commonKeys = [
//       'resultData',
//       'ResultData',
//       'data',
//       'Data',
//       'customerList',
//       'CustomerList',
//       'items',
//       'Items',
//       'list',
//       'List',
//       'records',
//       'Records',
//     ];

//     for (const key of commonKeys) {
//       const value = data[key];
//       if (Array.isArray(value)) {
//         return value as T[];
//       }
//     }

//     // 2. Fallback: return the first property that contains an array
//     for (const value of Object.values(data)) {
//       if (Array.isArray(value)) {
//         return value as T[];
//       }
//     }
//   }

//   return [];
// };

// const getCode = (response: {code?: string; Code?: string}) =>
//   String(response.code ?? response.Code ?? '');

// const getMessage = (response: {message?: string; Message?: string}) =>
//   String(response.message ?? response.Message ?? '').trim();

// const isSuccessOrNoData = (
//   response: LeadListResponse | LeadStatusResponse | LeadServiceTypeResponse,
// ) => {
//   const code = getCode(response);
//   return code === '200' || code === '500' || code === '';
// };

// const getStringValue = (
//   item: LeadListItem,
//   keys: Array<keyof LeadListItem>,
// ) => {
//   for (const key of keys) {
//     const value = item[key];
//     if (typeof value === 'string' && value.trim()) {
//       return value.trim();
//     }
//     if (typeof value === 'number' && Number.isFinite(value)) {
//       return String(value);
//     }
//   }

//   return '';
// };

// const getNumberValue = (
//   item: LeadListItem | LeadStatusItem | LeadServiceTypeItem,
//   keys: Array<keyof (LeadListItem & LeadStatusItem & LeadServiceTypeItem)>,
// ) => {
//   for (const key of keys) {
//     const value = item[key as keyof typeof item];
//     const parsed = Number(value);
//     if (Number.isFinite(parsed) && parsed > 0) {
//       return parsed;
//     }
//   }

//   return 0;
// };

// const normalizeStatus = (item: LeadStatusItem): LeadStatusOption => ({
//   id: getNumberValue(item, [
//     'leadStatusId',
//     'LeadStatusId',
//     'leadStatusID',
//     'LeadStatusID',
//     'id',
//     'Id',
//   ]),
//   label:
//     String(
//       item.leadStatusName ??
//         item.LeadStatusName ??
//         item.statusName ??
//         item.StatusName ??
//         item.name ??
//         item.Name ??
//         '',
//     ).trim() || 'Lead Status',
// });

// const getLeadId = (item: LeadListItem) =>
//   getNumberValue(item, ['leadId', 'LeadId', 'leadID', 'LeadID', 'id', 'Id']);

// const getLeadDisplayId = (item: LeadListItem) => {
//   const rawId =
//     getStringValue(item, [
//       'newLeadId',
//       'NewLeadId',
//       'newLeadID',
//       'NewLeadID',
//       'leadNo',
//       'LeadNo',
//     ]) || String(getLeadId(item) || '');

//   if (!rawId) {
//     return '';
//   }

//   return rawId.toLowerCase().startsWith('ld') ? rawId : `Ld${rawId}`;
// };

// const getLeadTitle = (item: LeadListItem) =>
//   getStringValue(item, [
//     'leadName',
//     'LeadName',
//     'customerName',
//     'CustomerName',
//     'name',
//     'Name',
//   ]) || `Lead ${getLeadDisplayId(item) || '-'}`;

// const getLeadDescription = (item: LeadListItem) =>
//   getStringValue(item, [
//     'description',
//     'Description',
//     'requirement',
//     'Requirement',
//     'serviceName',
//     'ServiceName',
//   ]);

// const getLeadStatus = (item: LeadListItem) =>
//   getStringValue(item, [
//     'leadStatusName',
//     'LeadStatusName',
//     'leadStatus',
//     'LeadStatus',
//     'statusName',
//     'StatusName',
//   ]) || 'Assigned';

// const getLeadPhone = (item: LeadListItem) =>
//   getStringValue(item, [
//     'mobileNo',
//     'MobileNo',
//     'mobileNumber',
//     'MobileNumber',
//     'contactNo',
//     'ContactNo',
//     'phoneNo',
//     'PhoneNo',
//     'phoneNumber',
//     'PhoneNumber',
//   ]);

// const getLeadDateValue = (item: LeadListItem) =>
//   getStringValue(item, [
//     'leadDate',
//     'LeadDate',
//     'createdDate',
//     'CreatedDate',
//     'date',
//     'Date',
//     'createdOn',
//     'CreatedOn',
//   ]);

// const getLeadTimeValue = (item: LeadListItem) =>
//   getStringValue(item, [
//     'leadTime',
//     'LeadTime',
//     'createdTime',
//     'CreatedTime',
//   ]);

// const parseDateRobust = (dateStr: string) => {
//   if (!dateStr || dateStr.startsWith('0001-01-01')) {
//     return new Date(NaN);
//   }

//   const trimmed = dateStr.trim();

//   // Try common ISO-like patterns first and preserve the date portion.
//   const isoRegex = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
//   const isoMatch = trimmed.match(isoRegex);
//   if (isoMatch) {
//     const [, year, month, day, hour = '0', minute = '0', second = '0'] = isoMatch;
//     const y = Number(year);
//     if (y < 1900) {
//       return new Date(NaN);
//     }

//     return new Date(
//       y,
//       Number(month) - 1,
//       Number(day),
//       Number(hour),
//       Number(minute),
//       Number(second),
//     );
//   }

//   // Try YYYY/MM/DD formats.
//   const ymdSlashMatch = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
//   if (ymdSlashMatch) {
//     const [, year, month, day] = ymdSlashMatch;
//     const y = Number(year);
//     if (y < 1900) {
//       return new Date(NaN);
//     }
//     return new Date(y, Number(month) - 1, Number(day));
//   }

//   // Try DD-MM-YYYY or DD/MM/YYYY.
//   const dmyMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
//   if (dmyMatch) {
//     const [, day, month, year] = dmyMatch;
//     const y = Number(year);
//     if (y < 1900) {
//       return new Date(NaN);
//     }
//     return new Date(y, Number(month) - 1, Number(day));
//   }

//   // Fallback to generic parsing.
//   const fallbackDate = new Date(trimmed);
//   if (!Number.isNaN(fallbackDate.getTime()) && fallbackDate.getFullYear() > 1900) {
//     return fallbackDate;
//   }

//   return new Date(NaN);
// };

// const formatLeadDateTime = (item: LeadListItem) => {
//   const rawDate = getLeadDateValue(item);
//   const rawTime = getLeadTimeValue(item);

//   if (!rawDate && !rawTime) {
//     return '';
//   }

//   let dateLabel = '';
//   let timeLabel = '';

//   // 1. Handle Date (prioritize rawDate)
//   if (rawDate) {
//     const trimmedDate = rawDate.trim();
//     const dMatch = trimmedDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
//     if (dMatch && dMatch[1] !== '0001') {
//       dateLabel = `${dMatch[3]}-${dMatch[2]}-${dMatch[1]}`;
//     } else {
//       const d = parseDateRobust(trimmedDate);
//       if (!Number.isNaN(d.getTime())) {
//         dateLabel = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
//       } else {
//         // If prioritized field is 0001-01-01, try fallback fields
//         const fallbackKeys = ['createdDate', 'CreatedDate', 'date', 'Date', 'createdOn', 'CreatedOn'];
//         for (const key of fallbackKeys) {
//           const val = (item as any)[key];
//           if (typeof val === 'string' && val.trim() && !val.startsWith('0001-01-01')) {
//             const fd = parseDateRobust(val);
//             if (!Number.isNaN(fd.getTime())) {
//               dateLabel = `${String(fd.getDate()).padStart(2, '0')}-${String(fd.getMonth() + 1).padStart(2, '0')}-${fd.getFullYear()}`;
//               break;
//             }
//           }
//         }
//       }
//     }
//   }

//   // 2. Handle Time (prioritize rawTime, fallback to rawDate T part)
//   let timeToParse = '';
//   if (rawTime && rawTime.trim().length > 0 && !rawTime.startsWith('00:00:00')) {
//     timeToParse = rawTime.trim();
//   } else if (rawDate && rawDate.includes('T')) {
//     const tPart = rawDate.split('T')[1];
//     if (tPart && !tPart.startsWith('00:00:00')) {
//       timeToParse = tPart;
//     }
//   }

//   if (timeToParse) {
//     const tMatch = timeToParse.match(/^(\d{1,2}):(\d{2})/);
//     if (tMatch) {
//       let h = Number(tMatch[1]);
//       const m = Number(tMatch[2]);
//       const sfx = h >= 12 ? 'pm' : 'am';
//       const h12 = h % 12 || 12;
//       timeLabel = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${sfx}`;
//     }
//   }

//   if (!dateLabel) {
//     return timeLabel;
//   }
//   return timeLabel ? `${dateLabel} ${timeLabel}` : dateLabel;
// };

// const getStatusColor = (status: string) => {
//   const normalized = status.trim().toLowerCase();
//   if (normalized.includes('discussion')) {
//     return '#06a9ee';
//   }
//   if (normalized.includes('inactive')) {
//     return '#9ca3af';
//   }
//   if (normalized.includes('assign')) {
//     return '#ffc12c';
//   }
//   if (normalized.includes('close') || normalized.includes('complete')) {
//     return '#18a957';
//   }
//   if (normalized.includes('reject') || normalized.includes('cancel')) {
//     return '#d32f2f';
//   }

//   return THEME_PRIMARY;
// };

// const normalizePhone = (phone: string) => phone.replace(/[^\d+]/g, '');

// const uniqueStatuses = (statuses: LeadStatusOption[]) => {
//   const seen = new Set<number>();
//   return statuses.filter(status => {
//     if (!status.id || seen.has(status.id)) {
//       return false;
//     }
//     seen.add(status.id);
//     return true;
//   });
// };

// const LeadListScreen = ({userId, onMenuPress}: LeadListScreenProps) => {
//   const [leads, setLeads] = useState<LeadListItem[]>([]);
//   const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

//   const [statuses, setStatuses] = useState<LeadStatusOption[]>([]);
//   const [selectedStatus, setSelectedStatus] =
//     useState<LeadStatusOption>(ALL_STATUS);
//   const [searchText, setSearchText] = useState('');
//   const [submittedSearch, setSubmittedSearch] = useState('');
//   const [pageIndex, setPageIndex] = useState(PAGE_START);
//   const [isInitialLoading, setIsInitialLoading] = useState(false);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const [isLastPage, setIsLastPage] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');
//   const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
//   const latestRequestId = useRef(0);

//   const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
//   const [leadCustomerId, setLeadCustomerId] = useState(0);
//   const [leadCustomerName, setLeadCustomerName] = useState('');
//   const [leadPhone, setLeadPhone] = useState('');
//   const [leadAddress, setLeadAddress] = useState('');
//   const [leadState, setLeadState] = useState('');
//   const [leadStateId, setLeadStateId] = useState(0);
//   const [leadCity, setLeadCity] = useState('');
//   const [leadCityId, setLeadCityId] = useState(0);
//   const [leadPinCode, setLeadPinCode] = useState('');
//   const [leadLandmark, setLeadLandmark] = useState('');
//   const [leadNotes, setLeadNotes] = useState('');
//   const [leadPhotos, setLeadPhotos] = useState<LeadPhotoSlot[]>([
//     null,
//     null,
//     null,
//   ]);
//   const [isSubmittingLead, setIsSubmittingLead] = useState(false);
//   const [serviceTypes, setServiceTypes] = useState<ServiceTypeOption[]>([]);
//   const [selectedServiceType, setSelectedServiceType] =
//     useState<ServiceTypeOption | null>(null);
//   const [isServiceTypeModalOpen, setIsServiceTypeModalOpen] = useState(false);
//   const [isServiceTypeLoading, setIsServiceTypeLoading] = useState(false);
//   const [serviceTypeSearch, setServiceTypeSearch] = useState('');
//   const [allCustomerOptions, setAllCustomerOptions] = useState<
//     CustomerOption[]
//   >([]);
//   const [customerSuggestions, setCustomerSuggestions] = useState<
//     CustomerOption[]
//   >([]);
//   const [isCustomerLoading, setIsCustomerLoading] = useState(false);
//   const [showCustomerSuggestions, setShowCustomerSuggestions] =
//     useState(false);
//   const latestCustomerRequestId = useRef(0);

//   const [allStateOptions, setAllStateOptions] = useState<StateOption[]>([]);
//   const [stateSuggestions, setStateSuggestions] = useState<StateOption[]>([]);
//   const [isStateLoading, setIsStateLoading] = useState(false);
//   const [showStateSuggestions, setShowStateSuggestions] = useState(false);
//   const latestStateRequestId = useRef(0);

//   const [allCityOptions, setAllCityOptions] = useState<CityOption[]>([]);
//   const [citySuggestions, setCitySuggestions] = useState<CityOption[]>([]);
//   const [isCityLoading, setIsCityLoading] = useState(false);
//   const [showCitySuggestions, setShowCitySuggestions] = useState(false);
//   const latestCityRequestId = useRef(0);

//   const statusOptions = useMemo(
//     () => [ALL_STATUS, ...statuses],
//     [statuses],
//   );

//   const loadStatuses = useCallback(async () => {
//     try {
//       const response = (await getLeadstatusList()) as LeadStatusResponse;
//       if (!isSuccessOrNoData(response)) {
//         return;
//       }

//       const nextStatuses = getResultData<LeadStatusItem>(response)
//         .map(normalizeStatus)
//         .filter(status => status.id > 0 && status.label);
//       setStatuses(uniqueStatuses(nextStatuses));
//     } catch {
//       setStatuses([]);
//     }
//   }, []);

//   const loadServiceTypes = useCallback(async () => {
//     if (serviceTypes.length > 0 || isServiceTypeLoading) {
//       return;
//     }

//     setIsServiceTypeLoading(true);
//     try {
//       const response = (await getEnquiryServiceTypeList({
//         OwnerId: userId,
//       })) as LeadServiceTypeResponse;
//       if (!isSuccessOrNoData(response)) {
//         return;
//       }

//       const nextServiceTypes = getResultData<LeadServiceTypeItem>(response)
//         .map(normalizeServiceType)
//         .filter(option => option.id > 0 && option.label);
//       setServiceTypes(uniqueServiceTypes(nextServiceTypes));
//     } catch {
//       setServiceTypes([]);
//     } finally {
//       setIsServiceTypeLoading(false);
//     }
//   }, [isServiceTypeLoading, serviceTypes.length, userId]);

//   const fetchLeadPage = useCallback(
//     async ({
//       nextPage,
//       replace,
//       refreshing = false,
//       searchParam = submittedSearch,
//       leadStatusId = selectedStatus.id,
//     }: {
//       nextPage: number;
//       replace: boolean;
//       refreshing?: boolean;
//       searchParam?: string;
//       leadStatusId?: number;
//     }) => {
//       if (replace && !refreshing) {
//         setIsInitialLoading(true);
//       } else if (refreshing) {
//         setIsRefreshing(true);
//       } else {
//         setIsLoadingMore(true);
//       }

//       setErrorMessage('');
//       const requestId = latestRequestId.current + 1;
//       latestRequestId.current = requestId;

//       try {
//         const response = (await getAllLEADList({
//           UserId: userId,
//           pageIndex: nextPage,
//           SearchParam: searchParam,
//           LeadStatusId: leadStatusId,
//         })) as LeadListResponse;

//         if (requestId !== latestRequestId.current) {
//           return;
//         }

//         if (!isSuccessOrNoData(response)) {
//           throw new Error(getMessage(response) || 'Unable to load leads.');
//         }

//         const nextLeads = getResultData<LeadListItem>(response);
//         setLeads(previous => (replace ? nextLeads : [...previous, ...nextLeads]));
//         setPageIndex(nextPage);
//         setIsLastPage(nextLeads.length === 0);
//       } catch (error) {
//         if (requestId !== latestRequestId.current) {
//           return;
//         }

//         const message =
//           error instanceof Error
//             ? error.message
//             : 'Unable to load leads right now.';
//         setErrorMessage(message);
//         if (replace) {
//           setLeads([]);
//           setIsLastPage(true);
//         }
//       } finally {
//         if (requestId === latestRequestId.current) {
//           setIsInitialLoading(false);
//           setIsRefreshing(false);
//           setIsLoadingMore(false);
//         }
//       }
//     },
//     [selectedStatus.id, submittedSearch, userId],
//   );

//   useEffect(() => {
//     loadStatuses();
//   }, [loadStatuses]);

//   useEffect(() => {
//     fetchLeadPage({nextPage: PAGE_START, replace: true});
//   }, [fetchLeadPage]);

//   const loadCustomerSuggestions = useCallback(
//     async (query: string) => {
//       const trimmedQuery = query.trim();
//       if (trimmedQuery.length < 2) {
//         setCustomerSuggestions([]);
//         setIsCustomerLoading(false);
//         return;
//       }

//       if (allCustomerOptions.length > 0) {
//         setCustomerSuggestions(filterCustomerOptions(allCustomerOptions, trimmedQuery));
//         setIsCustomerLoading(false);
//         return;
//       }

//       if (isCustomerLoading) {
//         return;
//       }

//       const requestId = latestCustomerRequestId.current + 1;
//       latestCustomerRequestId.current = requestId;
//       setIsCustomerLoading(true);

//       try {
//         const response = (await getCustomerList({
//           UserId: userId,
//           CustomerTagId: 0,
//         })) as CustomerLookupResponse;

//         if (latestCustomerRequestId.current !== requestId) {
//           return;
//         }

//         const normalized = getLookupResultData<CustomerLookupItem>(response)
//           .map(normalizeCustomerOption)
//           .filter((option): option is CustomerOption => Boolean(option));

//         setAllCustomerOptions(normalized);
//         setCustomerSuggestions(filterCustomerOptions(normalized, trimmedQuery));
//       } catch {
//         if (latestCustomerRequestId.current === requestId) {
//           setCustomerSuggestions([]);
//         }
//       } finally {
//         if (latestCustomerRequestId.current === requestId) {
//           setIsCustomerLoading(false);
//         }
//       }
//     },
//     [allCustomerOptions, isCustomerLoading, userId],
//   );

//   const preloadCustomers = useCallback(() => {
//     if (allCustomerOptions.length > 0 || isCustomerLoading) {
//       return;
//     }
//     loadCustomerSuggestions(leadCustomerName);
//   }, [allCustomerOptions.length, isCustomerLoading, leadCustomerName, loadCustomerSuggestions]);

//   useEffect(() => {
//     const query = leadCustomerName.trim();
//     if (!showCustomerSuggestions || query.length < 2) {
//       setCustomerSuggestions([]);
//       setIsCustomerLoading(false);
//       return;
//     }

//     if (allCustomerOptions.length > 0) {
//       setCustomerSuggestions(filterCustomerOptions(allCustomerOptions, query));
//       return;
//     }

//     const timeoutId = setTimeout(() => {
//       loadCustomerSuggestions(query);
//     }, 350);

//     return () => clearTimeout(timeoutId);
//   }, [allCustomerOptions, leadCustomerName, loadCustomerSuggestions, showCustomerSuggestions]);

//   const loadStateSuggestions = useCallback(
//     async (query: string) => {
//       if (allStateOptions.length > 0) {
//         setStateSuggestions(filterLookupOptions(allStateOptions, query));
//         setIsStateLoading(false);
//         return;
//       }

//       const requestId = latestStateRequestId.current + 1;
//       latestStateRequestId.current = requestId;
//       setIsStateLoading(true);

//       try {
//         const response = (await getStateList()) as StateListResponse;

//         if (latestStateRequestId.current !== requestId) {
//           return;
//         }

//         const normalized = getLookupResultData<StateItem>(response)
//           .map(normalizeStateOption)
//           .filter(option => option.id > 0 && option.name);
//         setAllStateOptions(normalized);
//         setStateSuggestions(filterLookupOptions(normalized, query));
//       } catch {
//         if (latestStateRequestId.current === requestId) {
//           setStateSuggestions([]);
//         }
//       } finally {
//         if (latestStateRequestId.current === requestId) {
//           setIsStateLoading(false);
//         }
//       }
//     },
//     [allStateOptions],
//   );

//   const preloadStates = useCallback(() => {
//     if (allStateOptions.length > 0 || isStateLoading) {
//       return;
//     }
//     loadStateSuggestions(leadState);
//   }, [allStateOptions.length, isStateLoading, leadState, loadStateSuggestions]);

//   useEffect(() => {
//     const query = leadState.trim();
//     if (!showStateSuggestions || query.length < 2) {
//       setStateSuggestions([]);
//       setIsStateLoading(false);
//       return;
//     }

//     if (allStateOptions.length > 0) {
//       setStateSuggestions(filterLookupOptions(allStateOptions, query));
//       return;
//     }

//     const timeoutId = setTimeout(() => {
//       loadStateSuggestions(query);
//     }, 350);

//     return () => clearTimeout(timeoutId);
//   }, [allStateOptions, leadState, loadStateSuggestions, showStateSuggestions]);

//   const loadCitySuggestions = useCallback(
//     async (query: string, stateId: number) => {
//       if (!stateId) {
//         setCitySuggestions([]);
//         setIsCityLoading(false);
//         return;
//       }

//       if (allCityOptions.length > 0) {
//         setCitySuggestions(filterLookupOptions(allCityOptions, query));
//         setIsCityLoading(false);
//         return;
//       }

//       const requestId = latestCityRequestId.current + 1;
//       latestCityRequestId.current = requestId;
//       setIsCityLoading(true);

//       try {
//         const response = (await getCityList({
//           UserId: userId,
//           StateId: stateId,
//         })) as CityListResponse;

//         if (latestCityRequestId.current !== requestId) {
//           return;
//         }

//         const normalized = getLookupResultData<CityItem>(response)
//           .map(normalizeCityOption)
//           .filter(option => option.id > 0 && option.name);
//         setAllCityOptions(normalized);
//         setCitySuggestions(filterLookupOptions(normalized, query));
//       } catch {
//         if (latestCityRequestId.current === requestId) {
//           setCitySuggestions([]);
//         }
//       } finally {
//         if (latestCityRequestId.current === requestId) {
//           setIsCityLoading(false);
//         }
//       }
//     },
//     [allCityOptions, userId],
//   );

//   const preloadCities = useCallback(() => {
//     if (!leadStateId) {
//       return;
//     }
//     if (allCityOptions.length > 0 || isCityLoading) {
//       return;
//     }
//     loadCitySuggestions(leadCity, leadStateId);
//   }, [allCityOptions.length, isCityLoading, leadCity, leadStateId, loadCitySuggestions]);

//   useEffect(() => {
//     const query = leadCity.trim();
//     if (!showCitySuggestions || !leadStateId || query.length < 2) {
//       setCitySuggestions([]);
//       setIsCityLoading(false);
//       return;
//     }

//     if (allCityOptions.length > 0) {
//       setCitySuggestions(filterLookupOptions(allCityOptions, query));
//       return;
//     }

//     const timeoutId = setTimeout(() => {
//       loadCitySuggestions(query, leadStateId);
//     }, 350);

//     return () => clearTimeout(timeoutId);
//   }, [allCityOptions, leadCity, leadStateId, loadCitySuggestions, showCitySuggestions]);

//   const handleStateSelect = (state: StateOption) => {
//     setLeadStateId(state.id);
//     setLeadState(state.name);
//     setStateSuggestions([]);
//     setShowStateSuggestions(false);

//     setLeadCity('');
//     setLeadCityId(0);
//     setAllCityOptions([]);
//     setCitySuggestions([]);
//   };

//   const handleCitySelect = (city: CityOption) => {
//     setLeadCityId(city.id);
//     setLeadCity(city.name);
//     setCitySuggestions([]);
//     setShowCitySuggestions(false);
//   };

//   const handleCustomerSelect = (customer: CustomerOption) => {
//     setLeadCustomerId(customer.id);
//     setLeadCustomerName(customer.name);
//     setLeadPhone(customer.phone);
//     setLeadAddress(customer.address);
//     setLeadState(customer.state);
//     setLeadStateId(0);
//     setLeadCity(customer.city);
//     setLeadCityId(0);
//     setAllCityOptions([]);
//     setCitySuggestions([]);
//     setLeadPinCode(customer.pinCode);
//     setLeadLandmark(customer.landmark);
//     setCustomerSuggestions([]);
//     setShowCustomerSuggestions(false);
//   };

//   const resetLeadForm = () => {
//     setLeadCustomerId(0);
//     setLeadCustomerName('');
//     setLeadPhone('');
//     setLeadAddress('');
//     setLeadState('');
//     setLeadStateId(0);
//     setLeadCity('');
//     setLeadCityId(0);
//     setStateSuggestions([]);
//     setCitySuggestions([]);
//     setAllCityOptions([]);
//     setShowStateSuggestions(false);
//     setShowCitySuggestions(false);
//     setLeadPinCode('');
//     setLeadLandmark('');
//     setLeadNotes('');
//     setLeadPhotos([null, null, null]);
//     setSelectedServiceType(null);
//     setServiceTypeSearch('');
//     setShowCustomerSuggestions(false);
//     setCustomerSuggestions([]);
//   };

//   const applyPickedPhoto = (slotIndex: number, asset: Asset) => {
//     if (!asset.base64 || !asset.uri) {
//       Alert.alert('Photo', 'Unable to read the selected photo. Please try again.');
//       return;
//     }

//     setLeadPhotos(previous => {
//       const next = [...previous];
//       next[slotIndex] = {
//         uri: asset.uri as string,
//         base64: asset.base64 as string,
//         fileName: asset.fileName || buildLeadPhotoFileName(slotIndex),
//       };
//       return next;
//     });
//   };

//   const capturePhotoFromCamera = async (slotIndex: number) => {
//     const result = await launchCamera({
//       mediaType: 'photo',
//       includeBase64: true,
//       quality: 0.6,
//       saveToPhotos: true,
//     });

//     if (result.didCancel) {
//       return;
//     }
//     if (result.errorCode) {
//       Alert.alert('Camera', result.errorMessage || 'Unable to open camera.');
//       return;
//     }

//     const asset = result.assets?.[0];
//     if (asset) {
//       applyPickedPhoto(slotIndex, asset);
//     }
//   };

//   const pickPhotoFromGallery = async (slotIndex: number) => {
//     const result = await launchImageLibrary({
//       mediaType: 'photo',
//       includeBase64: true,
//       quality: 0.6,
//       selectionLimit: 1,
//     });

//     if (result.didCancel) {
//       return;
//     }
//     if (result.errorCode) {
//       Alert.alert('Gallery', result.errorMessage || 'Unable to open gallery.');
//       return;
//     }

//     const asset = result.assets?.[0];
//     if (asset) {
//       applyPickedPhoto(slotIndex, asset);
//     }
//   };

//   const handlePhotoBoxPress = (slotIndex: number) => {
//     Alert.alert('Add Photo', 'Choose an option', [
//       {text: 'Camera', onPress: () => capturePhotoFromCamera(slotIndex)},
//       {text: 'Gallery', onPress: () => pickPhotoFromGallery(slotIndex)},
//       {text: 'Cancel', style: 'cancel'},
//     ]);
//   };

//   const removeLeadPhoto = (slotIndex: number) => {
//     setLeadPhotos(previous => {
//       const next = [...previous];
//       next[slotIndex] = null;
//       return next;
//     });
//   };

//   const openAddLeadModal = () => {
//     setIsAddLeadModalOpen(true);
//     loadServiceTypes();
//   };

//   const closeAddLeadModal = () => {
//     setIsAddLeadModalOpen(false);
//     resetLeadForm();
//   };

//   const handleAddLeadSubmit = async () => {
//     if (!leadCustomerName.trim()) {
//       Alert.alert('Validation', 'Please enter Customer Name.');
//       return;
//     }
//     if (!leadPhone.trim()) {
//       Alert.alert('Validation', 'Please enter Phone Number.');
//       return;
//     }
//     if (!leadAddress.trim()) {
//       Alert.alert('Validation', 'Please enter Customer Address.');
//       return;
//     }
//     if (!leadState.trim()) {
//       Alert.alert('Validation', 'Please enter State.');
//       return;
//     }
//     if (!leadCity.trim()) {
//       Alert.alert('Validation', 'Please enter City.');
//       return;
//     }
//     if (!leadPinCode.trim()) {
//       Alert.alert('Validation', 'Please enter Pin Code.');
//       return;
//     }
//     if (!leadLandmark.trim()) {
//       Alert.alert('Validation', 'Please enter Landmark.');
//       return;
//     }

//     if (isSubmittingLead) {
//       return;
//     }

//     setIsSubmittingLead(true);

//     const payload: AddCustomerLeadRequest = {
//       Address: leadAddress.trim(),
//       City: leadCity.trim(),
//       CreatedBy: userId,
//       CustomerDetailsid: leadCustomerId,
//       CustomerName: leadCustomerName.trim(),
//       Description: leadNotes.trim(),
//       ImageFileBase64Str: leadPhotos[0]?.base64 || '',
//       ImageFileBase64Str1: leadPhotos[1]?.base64 || '',
//       ImageFileBase64Str2: leadPhotos[2]?.base64 || '',
//       ImageFileName: leadPhotos[0]?.fileName || '',
//       ImageFileName1: leadPhotos[1]?.fileName || '',
//       ImageFileName2: leadPhotos[2]?.fileName || '',
//       IsActive: true,
//       LeadId: 0,
//       LeadNo: 0,
//       LeadState: 0,
//       LeadStatus: 1,
//       LeadStatusId: 0,
//       LocDescription: 'NA',
//       LocName: '',
//       LocationId: 0,
//       Longitude: '',
//       MobileNumber: leadPhone.trim(),
//       OTP: 0,
//       OwnerId: 0,
//       PinCode: leadPinCode.trim(),
//       ReferenceId: 0,
//       ServiceName: selectedServiceType?.label || '',
//       ServicesId: selectedServiceType?.id || 0,
//       State: leadState.trim(),
//       TaskId: 0,
//       UpdatedBy: userId,
//       UserId: 0,
//       latitude: '',
//     };

//     try {
//       await postExternalLeadForm(
//         payload as unknown as Parameters<typeof postExternalLeadForm>[0],
//       );
//       closeAddLeadModal();
//       Alert.alert('Lead', 'Lead added successfully.');
//       fetchLeadPage({nextPage: PAGE_START, replace: true});
//     } catch (error) {
//       const message =
//         error instanceof Error ? error.message : 'Unable to add lead right now.';
//       Alert.alert('Lead', message);
//     } finally {
//       setIsSubmittingLead(false);
//     }
//   };

//   const submitSearch = () => {
//     setSubmittedSearch(searchText.trim());
//   };

//   const clearSearch = () => {
//     setSearchText('');
//     if (submittedSearch) {
//       setSubmittedSearch('');
//     }
//   };

//   const openCall = async (phone: string) => {
//     const normalizedPhone = normalizePhone(phone);
//     if (!normalizedPhone) {
//       Alert.alert('Phone number unavailable');
//       return;
//     }

//     const url = `tel:${normalizedPhone}`;
//     try {
//       const canOpen = await Linking.canOpenURL(url);
//       if (canOpen) {
//         await Linking.openURL(url);
//       }
//     } catch {
//       Alert.alert('Unable to call', 'Please try again on a device.');
//     }
//   };

//   const openWhatsapp = async (phone: string) => {
//     const normalizedPhone = normalizePhone(phone).replace(/^\+/, '');
//     if (!normalizedPhone) {
//       Alert.alert('WhatsApp number unavailable');
//       return;
//     }

//     const url = `https://wa.me/${normalizedPhone}`;
//     try {
//       const canOpen = await Linking.canOpenURL(url);
//       if (canOpen) {
//         await Linking.openURL(url);
//       } else {
//         Alert.alert('Unable to open WhatsApp', 'Please try again on a device.');
//       }
//     } catch {
//       Alert.alert('Unable to open WhatsApp', 'Please try again later.');
//     }
//   };

//   const renderLead = ({item}: {item: LeadListItem}) => {
//     const status = getLeadStatus(item);
//     const phone = getLeadPhone(item);
//     const leadId = getLeadDisplayId(item);
//     const dateTime = formatLeadDateTime(item);

//     return (
//       <TouchableOpacity
//         activeOpacity={0.78}
//         style={styles.leadCard}
//         onPress={() => setSelectedLeadId(getLeadId(item))}>
//         <View style={[styles.statusRibbon, {backgroundColor: getStatusColor(status)}]}>
//           <Text numberOfLines={1} style={styles.statusRibbonText}>
//             {status.toUpperCase()}
//           </Text>
//         </View>

//         {dateTime ? (
//           <Text numberOfLines={1} style={styles.leadDateText}>
//             {dateTime}
//           </Text>
//         ) : null}

//         <View style={styles.leadBody}>
//           <View style={styles.leadTitleRow}>
//             <Text numberOfLines={1} style={styles.leadTitle}>
//               {getLeadTitle(item)}
//             </Text>
//             {leadId ? (
//               <Text numberOfLines={1} style={styles.leadIdText}>
//                 [{leadId}]
//               </Text>
//             ) : null}
//           </View>
//           <Text numberOfLines={1} style={styles.leadDescription}>
//             {getLeadDescription(item) || 'Lead enquiry'}
//           </Text>
//         </View>

//         <View style={styles.leadActions}>
//           <Pressable
//             hitSlop={10}
//             style={styles.actionButton}
//             onPress={() => openWhatsapp(phone)}>
//             <Text style={styles.whatsappIcon}>WA</Text>
//           </Pressable>
//           <Pressable
//             hitSlop={10}
//             style={styles.actionButton}
//             onPress={() => openCall(phone)}>
//             <Text style={styles.callIcon}>Call</Text>
//           </Pressable>
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   const renderEmpty = () => {
//     if (isInitialLoading) {
//       return null;
//     }

//     return (
//       <View style={styles.emptyState}>
//         <Text style={styles.emptyIcon}>!</Text>
//         <Text style={styles.emptyTitle}>
//           {errorMessage ? 'Unable to Load Leads' : 'No Result Found'}
//         </Text>
//         <Text style={styles.emptyText}>
//           {errorMessage || 'Try another search or lead status.'}
//         </Text>
//       </View>
//     );
//   };

//   const renderFormInput = (
//     placeholder: string,
//     options: {
//       half?: boolean;
//       trailing?: React.ReactNode;
//       value?: string;
//       onChangeText?: (text: string) => void;
//       onFocus?: () => void;
//       keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
//       multiline?: boolean;
//     } = {},
//   ) => (
//     <View
//       style={[
//         styles.formInputShell,
//         options.half ? styles.formHalf : null,
//         options.multiline ? styles.formInputShellMultiline : null,
//       ]}>
//       <TextInput
//         style={[styles.formInput, options.multiline ? styles.formInputMultiline : null]}
//         placeholder={placeholder}
//         placeholderTextColor="#9CA3AF"
//         value={options.value}
//         onChangeText={options.onChangeText}
//         onFocus={options.onFocus}
//         keyboardType={options.keyboardType ?? 'default'}
//         multiline={options.multiline}
//       />
//       {options.trailing ? (
//         <View style={styles.formTrailing}>{options.trailing}</View>
//       ) : null}
//     </View>
//   );

//   const renderCustomerSuggestions = () => {
//     const shouldShow =
//       showCustomerSuggestions &&
//       leadCustomerName.trim().length >= 2 &&
//       (isCustomerLoading || customerSuggestions.length > 0);

//     if (!shouldShow) {
//       return null;
//     }

//     return (
//       <View style={styles.customerSuggestionPanel}>
//         {isCustomerLoading ? (
//           <View style={styles.customerSuggestionStatus}>
//             <ActivityIndicator color={THEME_PRIMARY} size="small" />
//             <Text style={styles.customerSuggestionStatusText}>
//               Loading customers...
//             </Text>
//           </View>
//         ) : (
//           <ScrollView
//             keyboardShouldPersistTaps="handled"
//             nestedScrollEnabled
//             style={styles.customerSuggestionList}>
//             {customerSuggestions.map(customer => (
//               <Pressable
//                 key={`${customer.id}-${customer.name}`}
//                 style={styles.customerSuggestionItem}
//                 onPress={() => handleCustomerSelect(customer)}>
//                 <Text numberOfLines={1} style={styles.customerSuggestionName}>
//                   {customer.name}
//                 </Text>
//                 {customer.phone ? (
//                   <Text numberOfLines={1} style={styles.customerSuggestionMeta}>
//                     {customer.phone}
//                   </Text>
//                 ) : null}
//               </Pressable>
//             ))}
//           </ScrollView>
//         )}
//       </View>
//     );
//   };

//   const renderStateSuggestions = () => {
//     const shouldShow =
//       showStateSuggestions &&
//       leadState.trim().length >= 2 &&
//       (isStateLoading || stateSuggestions.length > 0);

//     if (!shouldShow) {
//       return null;
//     }

//     return (
//       <View style={styles.customerSuggestionPanel}>
//         {isStateLoading ? (
//           <View style={styles.customerSuggestionStatus}>
//             <ActivityIndicator color={THEME_PRIMARY} size="small" />
//             <Text style={styles.customerSuggestionStatusText}>
//               Loading states...
//             </Text>
//           </View>
//         ) : (
//           <ScrollView
//             keyboardShouldPersistTaps="handled"
//             nestedScrollEnabled
//             style={styles.customerSuggestionList}>
//             {stateSuggestions.map(state => (
//               <Pressable
//                 key={`${state.id}-${state.name}`}
//                 style={styles.customerSuggestionItem}
//                 onPress={() => handleStateSelect(state)}>
//                 <Text numberOfLines={1} style={styles.customerSuggestionName}>
//                   {state.name}
//                 </Text>
//               </Pressable>
//             ))}
//           </ScrollView>
//         )}
//       </View>
//     );
//   };

//   const renderCitySuggestions = () => {
//     const shouldShow =
//       showCitySuggestions &&
//       leadCity.trim().length >= 2 &&
//       (isCityLoading || citySuggestions.length > 0);

//     if (!shouldShow) {
//       return null;
//     }

//     return (
//       <View style={styles.customerSuggestionPanel}>
//         {isCityLoading ? (
//           <View style={styles.customerSuggestionStatus}>
//             <ActivityIndicator color={THEME_PRIMARY} size="small" />
//             <Text style={styles.customerSuggestionStatusText}>
//               Loading cities...
//             </Text>
//           </View>
//         ) : (
//           <ScrollView
//             keyboardShouldPersistTaps="handled"
//             nestedScrollEnabled
//             style={styles.customerSuggestionList}>
//             {citySuggestions.map(city => (
//               <Pressable
//                 key={`${city.id}-${city.name}`}
//                 style={styles.customerSuggestionItem}
//                 onPress={() => handleCitySelect(city)}>
//                 <Text numberOfLines={1} style={styles.customerSuggestionName}>
//                   {city.name}
//                 </Text>
//               </Pressable>
//             ))}
//           </ScrollView>
//         )}
//       </View>
//     );
//   };

//   const renderServiceTypeModal = () => {
//     const filteredServiceTypes = serviceTypes.filter(option =>
//       option.label.toLowerCase().includes(serviceTypeSearch.trim().toLowerCase()),
//     );

//     return (
//       <Modal
//         visible={isServiceTypeModalOpen}
//         transparent
//         animationType="fade"
//         onRequestClose={() => setIsServiceTypeModalOpen(false)}>
//         <Pressable
//           style={styles.modalBackdrop}
//           onPress={() => setIsServiceTypeModalOpen(false)}>
//           <Pressable style={styles.modalPanel}>
//             <Text style={styles.modalTitle}>Select Service Type</Text>
//             <View style={styles.modalSearchBox}>
//               <TextInput
//                 value={serviceTypeSearch}
//                 onChangeText={setServiceTypeSearch}
//                 placeholder="Search Service Type"
//                 placeholderTextColor="#9CA3AF"
//                 style={styles.modalSearchInput}
//               />
//             </View>
//             {isServiceTypeLoading ? (
//               <View style={styles.customerSuggestionStatus}>
//                 <ActivityIndicator color={THEME_PRIMARY} size="small" />
//                 <Text style={styles.customerSuggestionStatusText}>
//                   Loading service types...
//                 </Text>
//               </View>
//             ) : (
//               <ScrollView keyboardShouldPersistTaps="handled">
//                 {filteredServiceTypes.length === 0 ? (
//                   <Text style={styles.modalEmptyText}>
//                     No service type found.
//                   </Text>
//                 ) : (
//                   filteredServiceTypes.map(option => (
//                     <TouchableOpacity
//                       key={option.id}
//                       style={[
//                         styles.modalItem,
//                         option.id === selectedServiceType?.id
//                           ? styles.modalItemActive
//                           : null,
//                       ]}
//                       onPress={() => {
//                         setSelectedServiceType(option);
//                         setIsServiceTypeModalOpen(false);
//                         setServiceTypeSearch('');
//                       }}>
//                       <Text
//                         style={[
//                           styles.modalItemText,
//                           option.id === selectedServiceType?.id
//                             ? styles.modalItemTextActive
//                             : null,
//                         ]}>
//                         {option.label}
//                       </Text>
//                     </TouchableOpacity>
//                   ))
//                 )}
//               </ScrollView>
//             )}
//           </Pressable>
//         </Pressable>
//       </Modal>
//     );
//   };

//   const renderAddLeadModal = () => (
//     <Modal
//       visible={isAddLeadModalOpen}
//       transparent
//       animationType="slide"
//       onRequestClose={closeAddLeadModal}>
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//         style={styles.addModalRoot}>
//         <View style={styles.addModalPanel}>
//           <View style={styles.addModalHeader}>
//             <Text style={styles.addModalTitle}>Lead Form</Text>
//             <Pressable
//               hitSlop={10}
//               onPress={closeAddLeadModal}
//               style={styles.addModalClose}>
//               <Text style={styles.addModalCloseText}>x</Text>
//             </Pressable>
//           </View>

//           <ScrollView
//             style={styles.addFormScroll}
//             contentContainerStyle={styles.addFormContent}
//             keyboardShouldPersistTaps="handled">
//             <View style={styles.customerAutocompleteWrapper}>
//               {renderFormInput('Customer Name *', {
//                 value: leadCustomerName,
//                 onChangeText: text => {
//                   setLeadCustomerName(text);
//                   setShowCustomerSuggestions(true);
//                 },
//                 onFocus: () => {
//                   setShowCustomerSuggestions(true);
//                   preloadCustomers();
//                 },
//               })}
//               {renderCustomerSuggestions()}
//             </View>

//             {renderFormInput('Phone Number *', {
//               value: leadPhone,
//               onChangeText: setLeadPhone,
//               keyboardType: 'phone-pad',
//               trailing: <Text style={styles.contactIcon}>PB</Text>,
//             })}

//             {renderFormInput('Customer Address *', {
//               value: leadAddress,
//               onChangeText: setLeadAddress,
//             })}

//             <View style={styles.formPairRow}>
//               <View
//                 style={[styles.customerAutocompleteWrapper, styles.formHalf]}>
//                 {renderFormInput('State *', {
//                   value: leadState,
//                   onChangeText: text => {
//                     setLeadState(text);
//                     setLeadStateId(0);
//                     setShowStateSuggestions(true);
//                   },
//                   onFocus: () => {
//                     setShowStateSuggestions(true);
//                     preloadStates();
//                   },
//                 })}
//                 {renderStateSuggestions()}
//               </View>
//               <View
//                 style={[styles.customerAutocompleteWrapper, styles.formHalf]}>
//                 {renderFormInput('City *', {
//                   value: leadCity,
//                   onChangeText: text => {
//                     setLeadCity(text);
//                     setLeadCityId(0);
//                     setShowCitySuggestions(true);
//                   },
//                   onFocus: () => {
//                     if (!leadStateId) {
//                       Alert.alert('Lead Form', 'Please select a State first.');
//                       return;
//                     }
//                     setShowCitySuggestions(true);
//                     preloadCities();
//                   },
//                 })}
//                 {renderCitySuggestions()}
//               </View>
//             </View>

//             {renderFormInput('Pin Code *', {
//               value: leadPinCode,
//               onChangeText: setLeadPinCode,
//               keyboardType: 'numeric',
//             })}

//             {renderFormInput('Landmark *', {
//               value: leadLandmark,
//               onChangeText: setLeadLandmark,
//             })}

//             <Pressable
//               style={styles.formInputShell}
//               onPress={() => {
//                 setIsServiceTypeModalOpen(true);
//                 loadServiceTypes();
//               }}>
//               <Text
//                 numberOfLines={1}
//                 style={[
//                   styles.formSelectText,
//                   selectedServiceType ? styles.formValueText : null,
//                 ]}>
//                 {selectedServiceType?.label || 'Select Service Type'}
//               </Text>
//               <Text style={styles.formSelectArrow}>v</Text>
//             </Pressable>

//             <View style={styles.photoRow}>
//               {leadPhotos.map((photo, index) => (
//                 <Pressable
//                   key={index}
//                   style={styles.photoBox}
//                   onPress={() => handlePhotoBoxPress(index)}>
//                   {photo ? (
//                     <>
//                       <Image source={{uri: photo.uri}} style={styles.photoPreview} />
//                       <Pressable
//                         hitSlop={8}
//                         style={styles.photoRemove}
//                         onPress={() => removeLeadPhoto(index)}>
//                         <Text style={styles.photoRemoveText}>x</Text>
//                       </Pressable>
//                     </>
//                   ) : (
//                     <Text style={styles.photoIcon}>Cam</Text>
//                   )}
//                 </Pressable>
//               ))}
//             </View>

//             {renderFormInput('Notes', {
//               value: leadNotes,
//               onChangeText: setLeadNotes,
//               multiline: true,
//             })}

//             <Pressable
//               style={[
//                 styles.submitLeadButton,
//                 isSubmittingLead ? styles.submitLeadButtonDisabled : null,
//               ]}
//               disabled={isSubmittingLead}
//               onPress={handleAddLeadSubmit}>
//               {isSubmittingLead ? (
//                 <ActivityIndicator color="#FFFFFF" size="small" />
//               ) : (
//                 <Text style={styles.submitLeadText}>ADD</Text>
//               )}
//             </Pressable>

//             <Pressable style={styles.cancelLeadButton} onPress={closeAddLeadModal}>
//               <Text style={styles.cancelLeadText}>Cancel</Text>
//             </Pressable>
//           </ScrollView>
//         </View>
//       </KeyboardAvoidingView>
//     </Modal>
//   );

//   if (selectedLeadId !== null) {
//     return (
//       <LeadDetailsScreen
//         userId={userId}
//         leadId={selectedLeadId}
//         onBack={() => setSelectedLeadId(null)}
//       />
//     );
//   }

//   return (
//     <View style={styles.screen}>
//       <View style={styles.toolbar}>
//         <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
//           <Text style={styles.menuText}>Menu</Text>
//         </TouchableOpacity>
//         <Text style={styles.toolbarTitle}>Leads</Text>
//         <View style={styles.toolbarActions}>
//           <Text style={styles.toolbarActionText}>Help</Text>
//           <Text style={styles.toolbarActionText}>Bell</Text>
//         </View>
//       </View>

//       <Pressable
//         style={styles.statusSelector}
//         onPress={() => setIsStatusModalOpen(true)}>
//         <Text numberOfLines={1} style={styles.statusSelectorText}>
//           {selectedStatus.label}
//         </Text>
//         <Text style={styles.statusSelectorChevron}>v</Text>
//       </Pressable>

//       <View style={styles.panel}>
//         <View style={styles.searchRow}>
//           <View style={styles.searchBox}>
//             <Text style={styles.searchIcon}>Search</Text>
//             <TextInput
//               value={searchText}
//               onChangeText={value => {
//                 const nextValue = value.slice(0, 35);
//                 setSearchText(nextValue);
//                 if (!nextValue.trim() && submittedSearch) {
//                   setSubmittedSearch('');
//                 }
//               }}
//               onSubmitEditing={submitSearch}
//               returnKeyType="search"
//               placeholder="Search by Customer Name, Lead Id"
//               placeholderTextColor="#8f8f8f"
//               style={styles.searchInput}
//             />
//             {searchText ? (
//               <Pressable hitSlop={12} onPress={clearSearch}>
//                 <Text style={styles.clearText}>x</Text>
//               </Pressable>
//             ) : null}
//           </View>

//           <Pressable style={styles.addButton} onPress={openAddLeadModal}>
//             <Text style={styles.addButtonText}>+ Lead</Text>
//           </Pressable>

//           <Pressable style={styles.linkButton}>
//             <Text style={styles.linkButtonText}>Link</Text>
//           </Pressable>
//         </View>

//         {isInitialLoading ? (
//           <View style={styles.loadingOverlay}>
//             <ActivityIndicator color={THEME_PRIMARY} />
//             <Text style={styles.loadingText}>Loading leads...</Text>
//           </View>
//         ) : null}

//         <FlatList
//           data={leads}
//           keyExtractor={(item, index) => `${getLeadId(item) || index}-${index}`}
//           renderItem={renderLead}
//           contentContainerStyle={styles.listContent}
//           ListEmptyComponent={renderEmpty}
//           ListFooterComponent={
//             isLoadingMore ? (
//               <View style={styles.listFooter}>
//                 <ActivityIndicator color={THEME_PRIMARY} size="small" />
//               </View>
//             ) : null
//           }
//           refreshControl={
//             <RefreshControl
//               refreshing={isRefreshing}
//               colors={[THEME_PRIMARY]}
//               tintColor={THEME_PRIMARY}
//               onRefresh={() =>
//                 fetchLeadPage({
//                   nextPage: PAGE_START,
//                   replace: true,
//                   refreshing: true,
//                 })
//               }
//             />
//           }
//           onEndReachedThreshold={0.35}
//           onEndReached={() => {
//             if (!isInitialLoading && !isLoadingMore && !isLastPage) {
//               fetchLeadPage({nextPage: pageIndex + 1, replace: false});
//             }
//           }}
//         />
//       </View>

//       <Modal
//         visible={isStatusModalOpen}
//         transparent
//         animationType="fade"
//         onRequestClose={() => setIsStatusModalOpen(false)}>
//         <Pressable
//           style={styles.modalBackdrop}
//           onPress={() => setIsStatusModalOpen(false)}>
//           <Pressable style={styles.modalPanel}>
//             <Text style={styles.modalTitle}>Select Lead Status</Text>
//             {statusOptions.map(status => (
//               <TouchableOpacity
//                 key={`${status.id}-${status.label}`}
//                 style={[
//                   styles.modalItem,
//                   status.id === selectedStatus.id ? styles.modalItemActive : null,
//                 ]}
//                 onPress={() => {
//                   setSelectedStatus(status);
//                   setIsStatusModalOpen(false);
//                 }}>
//                 <Text
//                   style={[
//                     styles.modalItemText,
//                     status.id === selectedStatus.id
//                       ? styles.modalItemTextActive
//                       : null,
//                   ]}>
//                   {status.label}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </Pressable>
//         </Pressable>
//       </Modal>

//       {renderAddLeadModal()}
//       {renderServiceTypeModal()}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   screen: {
//     flex: 1,
//     backgroundColor: THEME_PRIMARY,
//   },
//   toolbar: {
//     height: 64,
//     backgroundColor: HEADER_PRIMARY,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     elevation: 5,
//     shadowColor: '#000000',
//     shadowOpacity: 0.18,
//     shadowRadius: 5,
//     shadowOffset: {width: 0, height: 3},
//   },
//   menuButton: {
//     width: 40,
//     height: 40,
//     alignItems: 'flex-start',
//     justifyContent: 'center',
//   },
//   menuText: {
//     color: '#FFFFFF',
//     fontSize: 12,
//     lineHeight: 14,
//     fontWeight: '900',
//   },
//   toolbarTitle: {
//     flex: 1,
//     marginLeft: 20,
//     color: '#FFFFFF',
//     fontSize: 24,
//     fontWeight: '800',
//   },
//   toolbarActions: {
//     width: 104,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   toolbarActionText: {
//     color: '#FFFFFF',
//     fontSize: 12,
//     fontWeight: '800',
//   },
//   statusSelector: {
//     height: 82,
//     backgroundColor: THEME_PRIMARY,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 18,
//     paddingBottom: 16,
//   },
//   statusSelectorText: {
//     color: '#FFFFFF',
//     fontSize: 20,
//     fontWeight: '600',
//   },
//   statusSelectorChevron: {
//     marginLeft: 12,
//     color: '#FFFFFF',
//     fontSize: 28,
//     lineHeight: 30,
//     fontWeight: '900',
//   },
//   panel: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//     borderTopLeftRadius: 40,
//     borderTopRightRadius: 40,
//     overflow: 'hidden',
//   },
//   searchRow: {
//     minHeight: 74,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 24,
//     gap: 12,
//   },
//   searchBox: {
//     flex: 1,
//     minWidth: 0,
//     height: 52,
//     borderBottomWidth: 1,
//     borderBottomColor: '#c9c9c9',
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   searchIcon: {
//     color: '#b9b9b9',
//     fontSize: 12,
//     fontWeight: '800',
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     height: 50,
//     color: '#222222',
//     fontSize: 18,
//     paddingHorizontal: 0,
//     paddingVertical: 0,
//   },
//   clearText: {
//     color: '#a7a7a7',
//     fontSize: 28,
//     lineHeight: 30,
//   },
//   addButton: {
//     height: 42,
//     minWidth: 74,
//     borderRadius: 13,
//     backgroundColor: '#080808',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 12,
//   },
//   addButtonText: {
//     color: '#FFFFFF',
//     fontSize: 13,
//     fontWeight: '900',
//   },
//   linkButton: {
//     height: 42,
//     minWidth: 44,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   linkButtonText: {
//     color: THEME_PRIMARY,
//     fontSize: 13,
//     fontWeight: '900',
//   },
//   loadingOverlay: {
//     paddingVertical: 14,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   loadingText: {
//     marginTop: 8,
//     color: '#6b7280',
//     fontSize: 13,
//     fontWeight: '600',
//   },
//   listContent: {
//     flexGrow: 1,
//     paddingHorizontal: 18,
//     paddingTop: 4,
//     paddingBottom: 110,
//   },
//   leadCard: {
//     minHeight: 120,
//     borderWidth: 1,
//     borderColor: '#ededed',
//     borderRadius: 12,
//     backgroundColor: '#FFFFFF',
//     marginBottom: 20,
//     overflow: 'hidden',
//     elevation: 4,
//     shadowColor: '#000000',
//     shadowOpacity: 0.15,
//     shadowRadius: 5,
//     shadowOffset: {width: 0, height: 2},
//   },
//   statusRibbon: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     minWidth: 104,
//     maxWidth: '42%',
//     height: 30,
//     borderBottomRightRadius: 14,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 12,
//     zIndex: 2,
//   },
//   statusRibbonText: {
//     color: '#FFFFFF',
//     fontSize: 11,
//     fontWeight: '900',
//   },
//   leadDateText: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     maxWidth: 168,
//     color: '#8b8b8b',
//     fontSize: 13,
//     fontWeight: '600',
//     textAlign: 'right',
//   },
//   leadBody: {
//     paddingTop: 42,
//     paddingLeft: 20,
//     paddingRight: 154,
//     paddingBottom: 16,
//   },
//   leadTitleRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     minWidth: 0,
//   },
//   leadTitle: {
//     maxWidth: 150,
//     color: '#20283a',
//     fontSize: 18,
//     lineHeight: 23,
//     fontWeight: '900',
//   },
//   leadIdText: {
//     marginLeft: 8,
//     color: '#1976d2',
//     fontSize: 13,
//     fontWeight: '900',
//   },
//   leadDescription: {
//     marginTop: 10,
//     color: '#666666',
//     fontSize: 15,
//     fontWeight: '500',
//   },
//   leadActions: {
//     position: 'absolute',
//     right: 18,
//     bottom: 18,
//     width: 136,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   actionButton: {
//     minWidth: 52,
//     height: 38,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   whatsappIcon: {
//     color: '#111827',
//     fontSize: 13,
//     fontWeight: '900',
//   },
//   callIcon: {
//     color: '#374151',
//     fontSize: 13,
//     fontWeight: '900',
//   },
//   listFooter: {
//     paddingVertical: 16,
//   },
//   emptyState: {
//     flex: 1,
//     minHeight: 300,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 28,
//   },
//   emptyIcon: {
//     width: 52,
//     height: 52,
//     borderRadius: 26,
//     textAlign: 'center',
//     textAlignVertical: 'center',
//     backgroundColor: '#f2f4f7',
//     color: '#98a2b3',
//     fontSize: 28,
//     fontWeight: '800',
//   },
//   emptyTitle: {
//     marginTop: 12,
//     color: '#111827',
//     fontSize: 17,
//     fontWeight: '800',
//   },
//   emptyText: {
//     marginTop: 6,
//     color: '#667085',
//     textAlign: 'center',
//     fontSize: 13,
//     lineHeight: 18,
//   },
//   modalBackdrop: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.35)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 22,
//   },
//   modalPanel: {
//     width: '100%',
//     maxWidth: 360,
//     maxHeight: '76%',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 8,
//     paddingVertical: 12,
//   },
//   modalTitle: {
//     color: '#111827',
//     fontSize: 18,
//     fontWeight: '800',
//     paddingHorizontal: 16,
//     paddingBottom: 8,
//   },
//   modalItem: {
//     minHeight: 46,
//     justifyContent: 'center',
//     paddingHorizontal: 16,
//   },
//   modalItemActive: {
//     backgroundColor: '#fde7ee',
//   },
//   modalItemText: {
//     color: '#1f2937',
//     fontSize: 15,
//     fontWeight: '600',
//   },
//   modalItemTextActive: {
//     color: THEME_PRIMARY,
//     fontWeight: '900',
//   },
//   modalSearchBox: {
//     marginHorizontal: 16,
//     marginBottom: 8,
//     height: 40,
//     borderWidth: 1,
//     borderColor: '#d9d9d9',
//     borderRadius: 20,
//     paddingHorizontal: 16,
//     justifyContent: 'center',
//   },
//   modalSearchInput: {
//     height: 38,
//     color: '#1F2937',
//     fontSize: 14,
//     paddingHorizontal: 0,
//     paddingVertical: 0,
//   },
//   modalEmptyText: {
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     color: '#667085',
//     fontSize: 13,
//   },
//   addModalRoot: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.35)',
//     justifyContent: 'flex-end',
//   },
//   addModalPanel: {
//     backgroundColor: '#FFFFFF',
//     borderTopLeftRadius: 8,
//     borderTopRightRadius: 8,
//     maxHeight: '90%',
//     overflow: 'hidden',
//   },
//   addModalHeader: {
//     alignItems: 'center',
//     backgroundColor: '#3a3f3a',
//     flexDirection: 'row',
//     minHeight: 56,
//     paddingHorizontal: 20,
//     justifyContent: 'space-between',
//   },
//   addModalTitle: {
//     color: '#FFFFFF',
//     fontSize: 20,
//     fontWeight: '600',
//   },
//   addModalClose: {
//     width: 32,
//     height: 32,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   addModalCloseText: {
//     color: '#FFFFFF',
//     fontSize: 26,
//     fontWeight: '300',
//     lineHeight: 28,
//   },
//   addFormScroll: {
//     backgroundColor: '#FFFFFF',
//   },
//   addFormContent: {
//     paddingHorizontal: 20,
//     paddingTop: 20,
//     paddingBottom: 24,
//   },
//   formInputShell: {
//     height: 46,
//     borderWidth: 1,
//     borderColor: '#c9c9c9',
//     borderRadius: 23,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 18,
//     marginBottom: 18,
//   },
//   formInputShellMultiline: {
//     height: 90,
//     borderRadius: 20,
//     alignItems: 'flex-start',
//     paddingVertical: 12,
//   },
//   formInput: {
//     flex: 1,
//     height: 44,
//     color: '#1F2937',
//     fontSize: 15,
//     paddingHorizontal: 0,
//     paddingVertical: 0,
//   },
//   formInputMultiline: {
//     height: '100%',
//     textAlignVertical: 'top',
//   },
//   formTrailing: {
//     marginLeft: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   contactIcon: {
//     color: THEME_PRIMARY,
//     fontSize: 13,
//     fontWeight: '900',
//   },
//   formPairRow: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   formHalf: {
//     flex: 1,
//   },
//   formSelectText: {
//     flex: 1,
//     color: '#9CA3AF',
//     fontSize: 15,
//   },
//   formValueText: {
//     color: '#1F2937',
//   },
//   formSelectArrow: {
//     marginLeft: 8,
//     color: '#1F2937',
//     fontSize: 16,
//     fontWeight: '800',
//   },
//   customerAutocompleteWrapper: {
//     zIndex: 20,
//   },
//   customerSuggestionPanel: {
//     position: 'absolute',
//     top: 48,
//     left: 0,
//     right: 0,
//     maxHeight: 210,
//     backgroundColor: '#FFFFFF',
//     borderWidth: 1,
//     borderColor: '#D9D9D9',
//     borderRadius: 8,
//     elevation: 8,
//     shadowColor: '#000000',
//     shadowOffset: {width: 0, height: 3},
//     shadowOpacity: 0.2,
//     shadowRadius: 5,
//     zIndex: 30,
//   },
//   customerSuggestionList: {
//     maxHeight: 208,
//   },
//   customerSuggestionItem: {
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderBottomWidth: StyleSheet.hairlineWidth,
//     borderBottomColor: '#EEEEEE',
//   },
//   customerSuggestionName: {
//     color: '#111111',
//     fontSize: 15,
//     fontWeight: '700',
//   },
//   customerSuggestionMeta: {
//     marginTop: 3,
//     color: '#777777',
//     fontSize: 12,
//   },
//   customerSuggestionStatus: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     minHeight: 52,
//     paddingHorizontal: 14,
//   },
//   customerSuggestionStatusText: {
//     marginLeft: 8,
//     color: '#777777',
//     fontSize: 13,
//   },
//   photoRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 18,
//   },
//   photoBox: {
//     width: '31%',
//     height: 76,
//     borderWidth: 1,
//     borderColor: '#c9c9c9',
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     overflow: 'hidden',
//   },
//   photoIcon: {
//     color: '#9CA3AF',
//     fontSize: 13,
//     fontWeight: '800',
//   },
//   photoPreview: {
//     width: '100%',
//     height: '100%',
//   },
//   photoRemove: {
//     position: 'absolute',
//     top: 2,
//     right: 2,
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   photoRemoveText: {
//     color: '#FFFFFF',
//     fontSize: 12,
//     fontWeight: '800',
//     lineHeight: 14,
//   },
//   submitLeadButton: {
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: '#3a3f3a',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginTop: 4,
//   },
//   submitLeadButtonDisabled: {
//     opacity: 0.7,
//   },
//   submitLeadText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '800',
//   },
//   cancelLeadButton: {
//     height: 44,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   cancelLeadText: {
//     color: THEME_PRIMARY,
//     fontSize: 15,
//     fontWeight: '800',
//   },
// });

// export default LeadListScreen;

// src/screens/admin/LeadListScreen.tsx

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';
import {
  type AddCustomerLeadRequest,
  type CityItem,
  type CityListResponse,
  type CustomerLookupItem,
  type CustomerLookupResponse,
  type LeadListItem,
  type LeadListResponse,
  type LeadServiceTypeItem,
  type LeadServiceTypeResponse,
  type LeadStatusItem,
  type LeadStatusResponse,
  type StateItem,
  type StateListResponse,
} from './adminLegacyApiTypes';
import { getLeadstatusList, getAllLEADList } from '../../api/lead/leadService';
import { getEnquiryServiceTypeList } from '../../api/services/servicesService';
import { getCustomerList, getStateList, getCityList } from '../../api/customerList/customerListService';
import { postExternalLeadForm } from '../../api/leadForm/leadFormService';
import LeadDetailsScreen from '../admin/LeadDetailsScreen';

type LeadListScreenProps = {
  userId: number;
};

type LeadStatusOption = {
  id: number;
  label: string;
};

const PAGE_START = 1;
const THEME_PRIMARY = '#c3002f';
const HEADER_PRIMARY = '#d0003f';
const ALL_STATUS: LeadStatusOption = {id: 0, label: 'Select Lead Status'};

type CustomerOption = {
  id: number;
  name: string;
  phone: string;
  address: string;
  state: string;
  city: string;
  pinCode: string;
  landmark: string;
};

type ServiceTypeOption = {
  id: number;
  label: string;
};

type StateOption = {
  id: number;
  name: string;
};

type CityOption = {
  id: number;
  name: string;
};

type LeadPhotoSlot = {
  uri: string;
  base64: string;
  fileName: string;
} | null;

const buildLeadPhotoFileName = (slotIndex: number) => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate(),
  )}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(
    now.getSeconds(),
  )}`;
  return `${datePart}_${timePart}_AddUpdateLead${slotIndex + 1}_.jpg`;
};

const normalizeServiceType = (
  item: LeadServiceTypeItem,
): ServiceTypeOption => ({
  id: getNumberValue(item, [
    'serviceTypeId',
    'ServiceTypeId',
    'serviceTypeID',
    'ServiceTypeID',
    'id',
    'Id',
  ]),
  label:
    String(
      item.serviceTypeName ??
        item.ServiceTypeName ??
        item.serviceName ??
        item.ServiceName ??
        item.name ??
        item.Name ??
        '',
    ).trim() || 'Service Type',
});

const uniqueServiceTypes = (options: ServiceTypeOption[]) => {
  const seen = new Set<number>();
  return options.filter(option => {
    if (!option.id || seen.has(option.id)) {
      return false;
    }
    seen.add(option.id);
    return true;
  });
};

const getCustomerFieldValue = (
  item: CustomerLookupItem,
  keys: string[],
) => {
  for (const key of keys) {
    const value = (item as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return '';
};

const normalizeCustomerOption = (
  item: CustomerLookupItem,
  index: number,
): CustomerOption | null => {
  const name = getCustomerFieldValue(item, [
    'customerName',
    'CustomerName',
    'customername',
    'name',
    'Name',
    'fullName',
    'FullName',
    'fullname',
    'customer_name',
    'Customer_Name',
    'clientName',
    'ClientName',
    'clientname',
    'label',
    'Label',
    'text',
    'Text',
    'value',
    'Value',
  ]);

  if (!name) {
    return null;
  }

  const idValue = Number(
    getCustomerFieldValue(item, [
      'customerId',
      'CustomerId',
      'CustomerID',
      'customerid',
      'customerDetailsid',
      'CustomerDetailsid',
      'customerdetailsid',
      'customer_id',
      'Customer_Id',
      'id',
      'Id',
      'ID',
    ]),
  );

  return {
    id: Number.isFinite(idValue) && idValue > 0 ? idValue : index + 1,
    name,
    phone: getCustomerFieldValue(item, [
      'customerNumber',
      'CustomerNumber',
      'customernumber',
      'customerMobileNumber',
      'CustomerMobileNumber',
      'customermobilenumber',
      'customerMobileNo',
      'CustomerMobileNo',
      'customermobileno',
      'contactNo',
      'ContactNo',
      'contactno',
      'contactNumber',
      'ContactNumber',
      'contactnumber',
      'mobileNo',
      'MobileNo',
      'mobileno',
      'mobileNumber',
      'MobileNumber',
      'mobilenumber',
      'Mobile',
      'mobile',
      'phone',
      'Phone',
      'phoneNo',
      'PhoneNo',
      'phoneno',
      'phoneNumber',
      'PhoneNumber',
      'phonenumber',
      'primaryMobile',
      'PrimaryMobile',
      'primarymobile',
      'primaryMobileNumber',
      'PrimaryMobileNumber',
      'primarymobilenumber',
    ]),
    address: getCustomerFieldValue(item, [
      'address',
      'Address',
      'customerAddress',
      'CustomerAddress',
      'customeraddress',
      'fullAddress',
      'FullAddress',
      'fulladdress',
    ]),
    state: getCustomerFieldValue(item, [
      'state',
      'State',
      'stateName',
      'StateName',
      'statename',
    ]),
    city: getCustomerFieldValue(item, [
      'city',
      'City',
      'cityName',
      'CityName',
      'cityname',
    ]),
    pinCode: getCustomerFieldValue(item, [
      'pinCode',
      'PinCode',
      'pincode',
      'Pincode',
      'zipCode',
      'ZipCode',
      'zipcode',
    ]),
    landmark: getCustomerFieldValue(item, [
      'landmark',
      'Landmark',
      'landMark',
      'LandMark',
      'customerLandmark',
      'CustomerLandmark',
      'customerlandmark',
    ]),
  };
};

const filterCustomerOptions = (customers: CustomerOption[], query: string) => {
  const searchTerm = query.trim().toLowerCase();
  if (searchTerm.length < 2) {
    return [];
  }

  return customers
    .filter(option => option.name.toLowerCase().includes(searchTerm))
    .slice(0, 20);
};

const getLookupFieldValue = (item: Record<string, unknown>, keys: string[]) => {
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

const normalizeStateOption = (item: StateItem): StateOption => ({
  id: Number(
    getLookupFieldValue(item as Record<string, unknown>, [
      'stateId',
      'StateId',
      'stateID',
      'StateID',
      'stateid',
      'id',
      'Id',
      'value',
      'Value',
    ]),
  ) || 0,
  name: getLookupFieldValue(item as Record<string, unknown>, [
    'stateName',
    'StateName',
    'statename',
    'name',
    'Name',
    'state',
    'State',
    'label',
    'Label',
    'text',
    'Text',
  ]),
});

const normalizeCityOption = (item: CityItem): CityOption => ({
  id: Number(
    getLookupFieldValue(item as Record<string, unknown>, [
      'cityId',
      'CityId',
      'cityID',
      'CityID',
      'cityid',
      'id',
      'Id',
      'value',
      'Value',
    ]),
  ) || 0,
  name: getLookupFieldValue(item as Record<string, unknown>, [
    'cityName',
    'CityName',
    'cityname',
    'name',
    'Name',
    'city',
    'City',
    'label',
    'Label',
    'text',
    'Text',
  ]),
});

const filterLookupOptions = <T extends {name: string}>(
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

const getResultData = <T,>(response: {
  resultData?: T[] | null;
  ResultData?: T[] | null;
}) => response.resultData ?? response.ResultData ?? [];

const getLookupResultData = <T,>(response: unknown): T[] => {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (response && typeof response === 'object') {
    const data = response as Record<string, unknown>;

    // 1. Try common known wrapper keys
    const commonKeys = [
      'resultData',
      'ResultData',
      'data',
      'Data',
      'customerList',
      'CustomerList',
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

    // 2. Fallback: return the first property that contains an array
    for (const value of Object.values(data)) {
      if (Array.isArray(value)) {
        return value as T[];
      }
    }
  }

  return [];
};

const getCode = (response: {code?: string; Code?: string}) =>
  String(response.code ?? response.Code ?? '');

const getMessage = (response: {message?: string; Message?: string}) =>
  String(response.message ?? response.Message ?? '').trim();

const isSuccessOrNoData = (
  response: LeadListResponse | LeadStatusResponse | LeadServiceTypeResponse,
) => {
  const code = getCode(response);
  return code === '200' || code === '500' || code === '';
};

const getStringValue = (
  item: LeadListItem,
  keys: Array<keyof LeadListItem>,
) => {
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

const getNumberValue = (
  item: LeadListItem | LeadStatusItem | LeadServiceTypeItem,
  keys: Array<keyof (LeadListItem & LeadStatusItem & LeadServiceTypeItem)>,
) => {
  for (const key of keys) {
    const value = item[key as keyof typeof item];
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return 0;
};

const normalizeStatus = (item: LeadStatusItem): LeadStatusOption => ({
  id: getNumberValue(item, [
    'leadStatusId',
    'LeadStatusId',
    'leadStatusID',
    'LeadStatusID',
    'id',
    'Id',
  ]),
  label:
    String(
      item.leadStatusName ??
        item.LeadStatusName ??
        item.statusName ??
        item.StatusName ??
        item.name ??
        item.Name ??
        '',
    ).trim() || 'Lead Status',
});

const getLeadId = (item: LeadListItem) =>
  getNumberValue(item, ['leadId', 'LeadId', 'leadID', 'LeadID', 'id', 'Id']);

const getLeadDisplayId = (item: LeadListItem) => {
  const rawId =
    getStringValue(item, [
      'newLeadId',
      'NewLeadId',
      'newLeadID',
      'NewLeadID',
      'leadNo',
      'LeadNo',
    ]) || String(getLeadId(item) || '');

  if (!rawId) {
    return '';
  }

  return rawId.toLowerCase().startsWith('ld') ? rawId : `Ld${rawId}`;
};

const getLeadTitle = (item: LeadListItem) =>
  getStringValue(item, [
    'leadName',
    'LeadName',
    'customerName',
    'CustomerName',
    'name',
    'Name',
  ]) || `Lead ${getLeadDisplayId(item) || '-'}`;

const getLeadDescription = (item: LeadListItem) =>
  getStringValue(item, [
    'description',
    'Description',
    'requirement',
    'Requirement',
    'serviceName',
    'ServiceName',
  ]);

const getLeadStatus = (item: LeadListItem) =>
  getStringValue(item, [
    'leadStatusName',
    'LeadStatusName',
    'leadStatus',
    'LeadStatus',
    'statusName',
    'StatusName',
  ]) || 'Assigned';

const getLeadPhone = (item: LeadListItem) =>
  getStringValue(item, [
    'mobileNo',
    'MobileNo',
    'mobileNumber',
    'MobileNumber',
    'contactNo',
    'ContactNo',
    'phoneNo',
    'PhoneNo',
    'phoneNumber',
    'PhoneNumber',
  ]);

const getLeadDateValue = (item: LeadListItem) =>
  getStringValue(item, [
    'leadDate',
    'LeadDate',
    'createdDate',
    'CreatedDate',
    'date',
    'Date',
    'createdOn',
    'CreatedOn',
  ]);

const getLeadTimeValue = (item: LeadListItem) =>
  getStringValue(item, [
    'leadTime',
    'LeadTime',
    'createdTime',
    'CreatedTime',
  ]);

const parseDateRobust = (dateStr: string) => {
  if (!dateStr || dateStr.startsWith('0001-01-01')) {
    return new Date(NaN);
  }

  const trimmed = dateStr.trim();

  // Try common ISO-like patterns first and preserve the date portion.
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
  const isoMatch = trimmed.match(isoRegex);
  if (isoMatch) {
    const [, year, month, day, hour = '0', minute = '0', second = '0'] = isoMatch;
    const y = Number(year);
    if (y < 1900) {
      return new Date(NaN);
    }

    return new Date(
      y,
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );
  }

  // Try YYYY/MM/DD formats.
  const ymdSlashMatch = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (ymdSlashMatch) {
    const [, year, month, day] = ymdSlashMatch;
    const y = Number(year);
    if (y < 1900) {
      return new Date(NaN);
    }
    return new Date(y, Number(month) - 1, Number(day));
  }

  // Try DD-MM-YYYY or DD/MM/YYYY.
  const dmyMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    const y = Number(year);
    if (y < 1900) {
      return new Date(NaN);
    }
    return new Date(y, Number(month) - 1, Number(day));
  }

  // Fallback to generic parsing.
  const fallbackDate = new Date(trimmed);
  if (!Number.isNaN(fallbackDate.getTime()) && fallbackDate.getFullYear() > 1900) {
    return fallbackDate;
  }

  return new Date(NaN);
};

const formatLeadDateTime = (item: LeadListItem) => {
  const rawDate = getLeadDateValue(item);
  const rawTime = getLeadTimeValue(item);

  if (!rawDate && !rawTime) {
    return '';
  }

  let dateLabel = '';
  let timeLabel = '';

  // 1. Handle Date (prioritize rawDate)
  if (rawDate) {
    const trimmedDate = rawDate.trim();
    const dMatch = trimmedDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dMatch && dMatch[1] !== '0001') {
      dateLabel = `${dMatch[3]}-${dMatch[2]}-${dMatch[1]}`;
    } else {
      const d = parseDateRobust(trimmedDate);
      if (!Number.isNaN(d.getTime())) {
        dateLabel = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
      } else {
        // If prioritized field is 0001-01-01, try fallback fields
        const fallbackKeys = ['createdDate', 'CreatedDate', 'date', 'Date', 'createdOn', 'CreatedOn'];
        for (const key of fallbackKeys) {
          const val = (item as any)[key];
          if (typeof val === 'string' && val.trim() && !val.startsWith('0001-01-01')) {
            const fd = parseDateRobust(val);
            if (!Number.isNaN(fd.getTime())) {
              dateLabel = `${String(fd.getDate()).padStart(2, '0')}-${String(fd.getMonth() + 1).padStart(2, '0')}-${fd.getFullYear()}`;
              break;
            }
          }
        }
      }
    }
  }

  // 2. Handle Time (prioritize rawTime, fallback to rawDate T part)
  let timeToParse = '';
  if (rawTime && rawTime.trim().length > 0 && !rawTime.startsWith('00:00:00')) {
    timeToParse = rawTime.trim();
  } else if (rawDate && rawDate.includes('T')) {
    const tPart = rawDate.split('T')[1];
    if (tPart && !tPart.startsWith('00:00:00')) {
      timeToParse = tPart;
    }
  }

  if (timeToParse) {
    const tMatch = timeToParse.match(/^(\d{1,2}):(\d{2})/);
    if (tMatch) {
      let h = Number(tMatch[1]);
      const m = Number(tMatch[2]);
      const sfx = h >= 12 ? 'pm' : 'am';
      const h12 = h % 12 || 12;
      timeLabel = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${sfx}`;
    }
  }

  if (!dateLabel) {
    return timeLabel;
  }
  return timeLabel ? `${dateLabel} ${timeLabel}` : dateLabel;
};

const getStatusColor = (status: string) => {
  const normalized = status.trim().toLowerCase();
  if (normalized.includes('discussion')) {
    return '#06a9ee';
  }
  if (normalized.includes('inactive')) {
    return '#9ca3af';
  }
  if (normalized.includes('assign')) {
    return '#ffc12c';
  }
  if (normalized.includes('close') || normalized.includes('complete')) {
    return '#18a957';
  }
  if (normalized.includes('reject') || normalized.includes('cancel')) {
    return '#d32f2f';
  }

  return THEME_PRIMARY;
};

const normalizePhone = (phone: string) => phone.replace(/[^\d+]/g, '');

const uniqueStatuses = (statuses: LeadStatusOption[]) => {
  const seen = new Set<number>();
  return statuses.filter(status => {
    if (!status.id || seen.has(status.id)) {
      return false;
    }
    seen.add(status.id);
    return true;
  });
};

const LeadListScreen = ({userId}: LeadListScreenProps) => {
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  const [statuses, setStatuses] = useState<LeadStatusOption[]>([]);
  const [selectedStatus, setSelectedStatus] =
    useState<LeadStatusOption>(ALL_STATUS);
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(PAGE_START);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLastPage, setIsLastPage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const latestRequestId = useRef(0);

  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [leadCustomerId, setLeadCustomerId] = useState(0);
  const [leadCustomerName, setLeadCustomerName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadAddress, setLeadAddress] = useState('');
  const [leadState, setLeadState] = useState('');
  const [leadStateId, setLeadStateId] = useState(0);
  const [leadCity, setLeadCity] = useState('');
  const [leadCityId, setLeadCityId] = useState(0);
  const [leadPinCode, setLeadPinCode] = useState('');
  const [leadLandmark, setLeadLandmark] = useState('');
  const [leadNotes, setLeadNotes] = useState('');
  const [leadPhotos, setLeadPhotos] = useState<LeadPhotoSlot[]>([
    null,
    null,
    null,
  ]);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeOption[]>([]);
  const [selectedServiceType, setSelectedServiceType] =
    useState<ServiceTypeOption | null>(null);
  const [isServiceTypeModalOpen, setIsServiceTypeModalOpen] = useState(false);
  const [isServiceTypeLoading, setIsServiceTypeLoading] = useState(false);
  const [serviceTypeSearch, setServiceTypeSearch] = useState('');
  const [allCustomerOptions, setAllCustomerOptions] = useState<
    CustomerOption[]
  >([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<
    CustomerOption[]
  >([]);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] =
    useState(false);
  const latestCustomerRequestId = useRef(0);

  const [allStateOptions, setAllStateOptions] = useState<StateOption[]>([]);
  const [stateSuggestions, setStateSuggestions] = useState<StateOption[]>([]);
  const [isStateLoading, setIsStateLoading] = useState(false);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const latestStateRequestId = useRef(0);

  const [allCityOptions, setAllCityOptions] = useState<CityOption[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<CityOption[]>([]);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const latestCityRequestId = useRef(0);

  const statusOptions = useMemo(
    () => [ALL_STATUS, ...statuses],
    [statuses],
  );

  const loadStatuses = useCallback(async () => {
    try {
      const response = (await getLeadstatusList()) as LeadStatusResponse;
      if (!isSuccessOrNoData(response)) {
        return;
      }

      const nextStatuses = getResultData<LeadStatusItem>(response)
        .map(normalizeStatus)
        .filter(status => status.id > 0 && status.label);
      setStatuses(uniqueStatuses(nextStatuses));
    } catch {
      setStatuses([]);
    }
  }, []);

  const loadServiceTypes = useCallback(async () => {
    if (serviceTypes.length > 0 || isServiceTypeLoading) {
      return;
    }

    setIsServiceTypeLoading(true);
    try {
      const response = (await getEnquiryServiceTypeList({
        OwnerId: userId,
      })) as LeadServiceTypeResponse;
      if (!isSuccessOrNoData(response)) {
        return;
      }

      const nextServiceTypes = getResultData<LeadServiceTypeItem>(response)
        .map(normalizeServiceType)
        .filter(option => option.id > 0 && option.label);
      setServiceTypes(uniqueServiceTypes(nextServiceTypes));
    } catch {
      setServiceTypes([]);
    } finally {
      setIsServiceTypeLoading(false);
    }
  }, [isServiceTypeLoading, serviceTypes.length, userId]);

  const fetchLeadPage = useCallback(
    async ({
      nextPage,
      replace,
      refreshing = false,
      searchParam = submittedSearch,
      leadStatusId = selectedStatus.id,
    }: {
      nextPage: number;
      replace: boolean;
      refreshing?: boolean;
      searchParam?: string;
      leadStatusId?: number;
    }) => {
      if (replace && !refreshing) {
        setIsInitialLoading(true);
      } else if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoadingMore(true);
      }

      setErrorMessage('');
      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;

      try {
        const response = (await getAllLEADList({
          UserId: userId,
          pageIndex: nextPage,
          SearchParam: searchParam,
          LeadStatusId: leadStatusId,
        })) as LeadListResponse;

        if (requestId !== latestRequestId.current) {
          return;
        }

        if (!isSuccessOrNoData(response)) {
          throw new Error(getMessage(response) || 'Unable to load leads.');
        }

        const nextLeads = getResultData<LeadListItem>(response);
        setLeads(previous => (replace ? nextLeads : [...previous, ...nextLeads]));
        setPageIndex(nextPage);
        setIsLastPage(nextLeads.length === 0);
      } catch (error) {
        if (requestId !== latestRequestId.current) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load leads right now.';
        setErrorMessage(message);
        if (replace) {
          setLeads([]);
          setIsLastPage(true);
        }
      } finally {
        if (requestId === latestRequestId.current) {
          setIsInitialLoading(false);
          setIsRefreshing(false);
          setIsLoadingMore(false);
        }
      }
    },
    [selectedStatus.id, submittedSearch, userId],
  );

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  useEffect(() => {
    fetchLeadPage({nextPage: PAGE_START, replace: true});
  }, [fetchLeadPage]);

  const loadCustomerSuggestions = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length < 2) {
        setCustomerSuggestions([]);
        setIsCustomerLoading(false);
        return;
      }

      if (allCustomerOptions.length > 0) {
        setCustomerSuggestions(filterCustomerOptions(allCustomerOptions, trimmedQuery));
        setIsCustomerLoading(false);
        return;
      }

      if (isCustomerLoading) {
        return;
      }

      const requestId = latestCustomerRequestId.current + 1;
      latestCustomerRequestId.current = requestId;
      setIsCustomerLoading(true);

      try {
        const response = (await getCustomerList({
          UserId: userId,
          CustomerTagId: 0,
        })) as CustomerLookupResponse;

        if (latestCustomerRequestId.current !== requestId) {
          return;
        }

        const normalized = getLookupResultData<CustomerLookupItem>(response)
          .map(normalizeCustomerOption)
          .filter((option): option is CustomerOption => Boolean(option));

        setAllCustomerOptions(normalized);
        setCustomerSuggestions(filterCustomerOptions(normalized, trimmedQuery));
      } catch {
        if (latestCustomerRequestId.current === requestId) {
          setCustomerSuggestions([]);
        }
      } finally {
        if (latestCustomerRequestId.current === requestId) {
          setIsCustomerLoading(false);
        }
      }
    },
    [allCustomerOptions, isCustomerLoading, userId],
  );

  const preloadCustomers = useCallback(() => {
    if (allCustomerOptions.length > 0 || isCustomerLoading) {
      return;
    }
    loadCustomerSuggestions(leadCustomerName);
  }, [allCustomerOptions.length, isCustomerLoading, leadCustomerName, loadCustomerSuggestions]);

  useEffect(() => {
    const query = leadCustomerName.trim();
    if (!showCustomerSuggestions || query.length < 2) {
      setCustomerSuggestions([]);
      setIsCustomerLoading(false);
      return;
    }

    if (allCustomerOptions.length > 0) {
      setCustomerSuggestions(filterCustomerOptions(allCustomerOptions, query));
      return;
    }

    const timeoutId = setTimeout(() => {
      loadCustomerSuggestions(query);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [allCustomerOptions, leadCustomerName, loadCustomerSuggestions, showCustomerSuggestions]);

  const loadStateSuggestions = useCallback(
    async (query: string) => {
      if (allStateOptions.length > 0) {
        setStateSuggestions(filterLookupOptions(allStateOptions, query));
        setIsStateLoading(false);
        return;
      }

      const requestId = latestStateRequestId.current + 1;
      latestStateRequestId.current = requestId;
      setIsStateLoading(true);

      try {
        const response = (await getStateList()) as StateListResponse;

        if (latestStateRequestId.current !== requestId) {
          return;
        }

        const normalized = getLookupResultData<StateItem>(response)
          .map(normalizeStateOption)
          .filter(option => option.id > 0 && option.name);
        setAllStateOptions(normalized);
        setStateSuggestions(filterLookupOptions(normalized, query));
      } catch {
        if (latestStateRequestId.current === requestId) {
          setStateSuggestions([]);
        }
      } finally {
        if (latestStateRequestId.current === requestId) {
          setIsStateLoading(false);
        }
      }
    },
    [allStateOptions],
  );

  const preloadStates = useCallback(() => {
    if (allStateOptions.length > 0 || isStateLoading) {
      return;
    }
    loadStateSuggestions(leadState);
  }, [allStateOptions.length, isStateLoading, leadState, loadStateSuggestions]);

  useEffect(() => {
    const query = leadState.trim();
    if (!showStateSuggestions || query.length < 2) {
      setStateSuggestions([]);
      setIsStateLoading(false);
      return;
    }

    if (allStateOptions.length > 0) {
      setStateSuggestions(filterLookupOptions(allStateOptions, query));
      return;
    }

    const timeoutId = setTimeout(() => {
      loadStateSuggestions(query);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [allStateOptions, leadState, loadStateSuggestions, showStateSuggestions]);

  const loadCitySuggestions = useCallback(
    async (query: string, stateId: number) => {
      if (!stateId) {
        setCitySuggestions([]);
        setIsCityLoading(false);
        return;
      }

      if (allCityOptions.length > 0) {
        setCitySuggestions(filterLookupOptions(allCityOptions, query));
        setIsCityLoading(false);
        return;
      }

      const requestId = latestCityRequestId.current + 1;
      latestCityRequestId.current = requestId;
      setIsCityLoading(true);

      try {
        const response = (await getCityList({
          UserId: userId,
          StateId: stateId,
        })) as CityListResponse;

        if (latestCityRequestId.current !== requestId) {
          return;
        }

        const normalized = getLookupResultData<CityItem>(response)
          .map(normalizeCityOption)
          .filter(option => option.id > 0 && option.name);
        setAllCityOptions(normalized);
        setCitySuggestions(filterLookupOptions(normalized, query));
      } catch {
        if (latestCityRequestId.current === requestId) {
          setCitySuggestions([]);
        }
      } finally {
        if (latestCityRequestId.current === requestId) {
          setIsCityLoading(false);
        }
      }
    },
    [allCityOptions, userId],
  );

  const preloadCities = useCallback(() => {
    if (!leadStateId) {
      return;
    }
    if (allCityOptions.length > 0 || isCityLoading) {
      return;
    }
    loadCitySuggestions(leadCity, leadStateId);
  }, [allCityOptions.length, isCityLoading, leadCity, leadStateId, loadCitySuggestions]);

  useEffect(() => {
    const query = leadCity.trim();
    if (!showCitySuggestions || !leadStateId || query.length < 2) {
      setCitySuggestions([]);
      setIsCityLoading(false);
      return;
    }

    if (allCityOptions.length > 0) {
      setCitySuggestions(filterLookupOptions(allCityOptions, query));
      return;
    }

    const timeoutId = setTimeout(() => {
      loadCitySuggestions(query, leadStateId);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [allCityOptions, leadCity, leadStateId, loadCitySuggestions, showCitySuggestions]);

  const handleStateSelect = (state: StateOption) => {
    setLeadStateId(state.id);
    setLeadState(state.name);
    setStateSuggestions([]);
    setShowStateSuggestions(false);

    setLeadCity('');
    setLeadCityId(0);
    setAllCityOptions([]);
    setCitySuggestions([]);
  };

  const handleCitySelect = (city: CityOption) => {
    setLeadCityId(city.id);
    setLeadCity(city.name);
    setCitySuggestions([]);
    setShowCitySuggestions(false);
  };

  const handleCustomerSelect = (customer: CustomerOption) => {
    setLeadCustomerId(customer.id);
    setLeadCustomerName(customer.name);
    setLeadPhone(customer.phone);
    setLeadAddress(customer.address);
    setLeadState(customer.state);
    setLeadStateId(0);
    setLeadCity(customer.city);
    setLeadCityId(0);
    setAllCityOptions([]);
    setCitySuggestions([]);
    setLeadPinCode(customer.pinCode);
    setLeadLandmark(customer.landmark);
    setCustomerSuggestions([]);
    setShowCustomerSuggestions(false);
  };

  const resetLeadForm = () => {
    setLeadCustomerId(0);
    setLeadCustomerName('');
    setLeadPhone('');
    setLeadAddress('');
    setLeadState('');
    setLeadStateId(0);
    setLeadCity('');
    setLeadCityId(0);
    setStateSuggestions([]);
    setCitySuggestions([]);
    setAllCityOptions([]);
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
    setLeadPinCode('');
    setLeadLandmark('');
    setLeadNotes('');
    setLeadPhotos([null, null, null]);
    setSelectedServiceType(null);
    setServiceTypeSearch('');
    setShowCustomerSuggestions(false);
    setCustomerSuggestions([]);
  };

  const applyPickedPhoto = (slotIndex: number, asset: Asset) => {
    if (!asset.base64 || !asset.uri) {
      Alert.alert('Photo', 'Unable to read the selected photo. Please try again.');
      return;
    }

    setLeadPhotos(previous => {
      const next = [...previous];
      next[slotIndex] = {
        uri: asset.uri as string,
        base64: asset.base64 as string,
        fileName: asset.fileName || buildLeadPhotoFileName(slotIndex),
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

  const removeLeadPhoto = (slotIndex: number) => {
    setLeadPhotos(previous => {
      const next = [...previous];
      next[slotIndex] = null;
      return next;
    });
  };

  const openAddLeadModal = () => {
    setIsAddLeadModalOpen(true);
    loadServiceTypes();
  };

  const closeAddLeadModal = () => {
    setIsAddLeadModalOpen(false);
    resetLeadForm();
  };

  const handleAddLeadSubmit = async () => {
    if (!leadCustomerName.trim()) {
      Alert.alert('Validation', 'Please enter Customer Name.');
      return;
    }
    if (!leadPhone.trim()) {
      Alert.alert('Validation', 'Please enter Phone Number.');
      return;
    }
    if (!leadAddress.trim()) {
      Alert.alert('Validation', 'Please enter Customer Address.');
      return;
    }
    if (!leadState.trim()) {
      Alert.alert('Validation', 'Please enter State.');
      return;
    }
    if (!leadCity.trim()) {
      Alert.alert('Validation', 'Please enter City.');
      return;
    }
    if (!leadPinCode.trim()) {
      Alert.alert('Validation', 'Please enter Pin Code.');
      return;
    }
    if (!leadLandmark.trim()) {
      Alert.alert('Validation', 'Please enter Landmark.');
      return;
    }

    if (isSubmittingLead) {
      return;
    }

    setIsSubmittingLead(true);

    const payload: AddCustomerLeadRequest = {
      Address: leadAddress.trim(),
      City: leadCity.trim(),
      CreatedBy: userId,
      CustomerDetailsid: leadCustomerId,
      CustomerName: leadCustomerName.trim(),
      Description: leadNotes.trim(),
      ImageFileBase64Str: leadPhotos[0]?.base64 || '',
      ImageFileBase64Str1: leadPhotos[1]?.base64 || '',
      ImageFileBase64Str2: leadPhotos[2]?.base64 || '',
      ImageFileName: leadPhotos[0]?.fileName || '',
      ImageFileName1: leadPhotos[1]?.fileName || '',
      ImageFileName2: leadPhotos[2]?.fileName || '',
      IsActive: true,
      LeadId: 0,
      LeadNo: 0,
      LeadState: 0,
      LeadStatus: 1,
      LeadStatusId: 0,
      LocDescription: 'NA',
      LocName: '',
      LocationId: 0,
      Longitude: '',
      MobileNumber: leadPhone.trim(),
      OTP: 0,
      OwnerId: 0,
      PinCode: leadPinCode.trim(),
      ReferenceId: 0,
      ServiceName: selectedServiceType?.label || '',
      ServicesId: selectedServiceType?.id || 0,
      State: leadState.trim(),
      TaskId: 0,
      UpdatedBy: userId,
      UserId: 0,
      latitude: '',
    };

    try {
      await postExternalLeadForm(
        payload as unknown as Parameters<typeof postExternalLeadForm>[0],
      );
      closeAddLeadModal();
      Alert.alert('Lead', 'Lead added successfully.');
      fetchLeadPage({nextPage: PAGE_START, replace: true});
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to add lead right now.';
      Alert.alert('Lead', message);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const submitSearch = () => {
    setSubmittedSearch(searchText.trim());
  };

  const clearSearch = () => {
    setSearchText('');
    if (submittedSearch) {
      setSubmittedSearch('');
    }
  };

  const openCall = async (phone: string) => {
    const normalizedPhone = normalizePhone(phone);
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

  const openWhatsapp = async (phone: string) => {
    const normalizedPhone = normalizePhone(phone).replace(/^\+/, '');
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

  const renderLead = ({item}: {item: LeadListItem}) => {
    const status = getLeadStatus(item);
    const phone = getLeadPhone(item);
    const leadId = getLeadDisplayId(item);
    const dateTime = formatLeadDateTime(item);

    return (
      <TouchableOpacity
        activeOpacity={0.78}
        style={styles.leadCard}
        onPress={() => setSelectedLeadId(getLeadId(item))}>
        <View style={[styles.statusRibbon, {backgroundColor: getStatusColor(status)}]}>
          <Text numberOfLines={1} style={styles.statusRibbonText}>
            {status.toUpperCase()}
          </Text>
        </View>

        {dateTime ? (
          <Text numberOfLines={1} style={styles.leadDateText}>
            {dateTime}
          </Text>
        ) : null}

        <View style={styles.leadBody}>
          <View style={styles.leadTitleRow}>
            <Text numberOfLines={1} style={styles.leadTitle}>
              {getLeadTitle(item)}
            </Text>
            {leadId ? (
              <Text numberOfLines={1} style={styles.leadIdText}>
                [{leadId}]
              </Text>
            ) : null}
          </View>
          <Text numberOfLines={1} style={styles.leadDescription}>
            {getLeadDescription(item) || 'Lead enquiry'}
          </Text>
        </View>

        <View style={styles.leadActions}>
          <Pressable
            hitSlop={10}
            style={styles.actionButton}
            onPress={() => openWhatsapp(phone)}>
            <Text style={styles.whatsappIcon}>WA</Text>
          </Pressable>
          <Pressable
            hitSlop={10}
            style={styles.actionButton}
            onPress={() => openCall(phone)}>
            <Text style={styles.callIcon}>Call</Text>
          </Pressable>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (isInitialLoading) {
      return null;
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>!</Text>
        <Text style={styles.emptyTitle}>
          {errorMessage ? 'Unable to Load Leads' : 'No Result Found'}
        </Text>
        <Text style={styles.emptyText}>
          {errorMessage || 'Try another search or lead status.'}
        </Text>
      </View>
    );
  };

  const renderFormInput = (
    placeholder: string,
    options: {
      half?: boolean;
      trailing?: React.ReactNode;
      value?: string;
      onChangeText?: (text: string) => void;
      onFocus?: () => void;
      keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
      multiline?: boolean;
    } = {},
  ) => (
    <View
      style={[
        styles.formInputShell,
        options.half ? styles.formHalf : null,
        options.multiline ? styles.formInputShellMultiline : null,
      ]}>
      <TextInput
        style={[styles.formInput, options.multiline ? styles.formInputMultiline : null]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={options.value}
        onChangeText={options.onChangeText}
        onFocus={options.onFocus}
        keyboardType={options.keyboardType ?? 'default'}
        multiline={options.multiline}
      />
      {options.trailing ? (
        <View style={styles.formTrailing}>{options.trailing}</View>
      ) : null}
    </View>
  );

  const renderCustomerSuggestions = () => {
    const shouldShow =
      showCustomerSuggestions &&
      leadCustomerName.trim().length >= 2 &&
      (isCustomerLoading || customerSuggestions.length > 0);

    if (!shouldShow) {
      return null;
    }

    return (
      <View style={styles.customerSuggestionPanel}>
        {isCustomerLoading ? (
          <View style={styles.customerSuggestionStatus}>
            <ActivityIndicator color={THEME_PRIMARY} size="small" />
            <Text style={styles.customerSuggestionStatusText}>
              Loading customers...
            </Text>
          </View>
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={styles.customerSuggestionList}>
            {customerSuggestions.map(customer => (
              <Pressable
                key={`${customer.id}-${customer.name}`}
                style={styles.customerSuggestionItem}
                onPress={() => handleCustomerSelect(customer)}>
                <Text numberOfLines={1} style={styles.customerSuggestionName}>
                  {customer.name}
                </Text>
                {customer.phone ? (
                  <Text numberOfLines={1} style={styles.customerSuggestionMeta}>
                    {customer.phone}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderStateSuggestions = () => {
    const shouldShow =
      showStateSuggestions &&
      leadState.trim().length >= 2 &&
      (isStateLoading || stateSuggestions.length > 0);

    if (!shouldShow) {
      return null;
    }

    return (
      <View style={styles.customerSuggestionPanel}>
        {isStateLoading ? (
          <View style={styles.customerSuggestionStatus}>
            <ActivityIndicator color={THEME_PRIMARY} size="small" />
            <Text style={styles.customerSuggestionStatusText}>
              Loading states...
            </Text>
          </View>
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={styles.customerSuggestionList}>
            {stateSuggestions.map(state => (
              <Pressable
                key={`${state.id}-${state.name}`}
                style={styles.customerSuggestionItem}
                onPress={() => handleStateSelect(state)}>
                <Text numberOfLines={1} style={styles.customerSuggestionName}>
                  {state.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderCitySuggestions = () => {
    const shouldShow =
      showCitySuggestions &&
      leadCity.trim().length >= 2 &&
      (isCityLoading || citySuggestions.length > 0);

    if (!shouldShow) {
      return null;
    }

    return (
      <View style={styles.customerSuggestionPanel}>
        {isCityLoading ? (
          <View style={styles.customerSuggestionStatus}>
            <ActivityIndicator color={THEME_PRIMARY} size="small" />
            <Text style={styles.customerSuggestionStatusText}>
              Loading cities...
            </Text>
          </View>
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={styles.customerSuggestionList}>
            {citySuggestions.map(city => (
              <Pressable
                key={`${city.id}-${city.name}`}
                style={styles.customerSuggestionItem}
                onPress={() => handleCitySelect(city)}>
                <Text numberOfLines={1} style={styles.customerSuggestionName}>
                  {city.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderServiceTypeModal = () => {
    const filteredServiceTypes = serviceTypes.filter(option =>
      option.label.toLowerCase().includes(serviceTypeSearch.trim().toLowerCase()),
    );

    return (
      <Modal
        visible={isServiceTypeModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsServiceTypeModalOpen(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsServiceTypeModalOpen(false)}>
          <Pressable style={styles.modalPanel}>
            <Text style={styles.modalTitle}>Select Service Type</Text>
            <View style={styles.modalSearchBox}>
              <TextInput
                value={serviceTypeSearch}
                onChangeText={setServiceTypeSearch}
                placeholder="Search Service Type"
                placeholderTextColor="#9CA3AF"
                style={styles.modalSearchInput}
              />
            </View>
            {isServiceTypeLoading ? (
              <View style={styles.customerSuggestionStatus}>
                <ActivityIndicator color={THEME_PRIMARY} size="small" />
                <Text style={styles.customerSuggestionStatusText}>
                  Loading service types...
                </Text>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled">
                {filteredServiceTypes.length === 0 ? (
                  <Text style={styles.modalEmptyText}>
                    No service type found.
                  </Text>
                ) : (
                  filteredServiceTypes.map(option => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.modalItem,
                        option.id === selectedServiceType?.id
                          ? styles.modalItemActive
                          : null,
                      ]}
                      onPress={() => {
                        setSelectedServiceType(option);
                        setIsServiceTypeModalOpen(false);
                        setServiceTypeSearch('');
                      }}>
                      <Text
                        style={[
                          styles.modalItemText,
                          option.id === selectedServiceType?.id
                            ? styles.modalItemTextActive
                            : null,
                        ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  const renderAddLeadModal = () => (
    <Modal
      visible={isAddLeadModalOpen}
      transparent
      animationType="slide"
      onRequestClose={closeAddLeadModal}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.addModalRoot}>
        <View style={styles.addModalPanel}>
          <View style={styles.addModalHeader}>
            <Text style={styles.addModalTitle}>Lead Form</Text>
            <Pressable
              hitSlop={10}
              onPress={closeAddLeadModal}
              style={styles.addModalClose}>
              <Text style={styles.addModalCloseText}>x</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.addFormScroll}
            contentContainerStyle={styles.addFormContent}
            keyboardShouldPersistTaps="handled">
            <View style={styles.customerAutocompleteWrapper}>
              {renderFormInput('Customer Name *', {
                value: leadCustomerName,
                onChangeText: text => {
                  setLeadCustomerName(text);
                  setShowCustomerSuggestions(true);
                },
                onFocus: () => {
                  setShowCustomerSuggestions(true);
                  preloadCustomers();
                },
              })}
              {renderCustomerSuggestions()}
            </View>

            {renderFormInput('Phone Number *', {
              value: leadPhone,
              onChangeText: setLeadPhone,
              keyboardType: 'phone-pad',
              trailing: <Text style={styles.contactIcon}>PB</Text>,
            })}

            {renderFormInput('Customer Address *', {
              value: leadAddress,
              onChangeText: setLeadAddress,
            })}

            <View style={styles.formPairRow}>
              <View
                style={[styles.customerAutocompleteWrapper, styles.formHalf]}>
                {renderFormInput('State *', {
                  value: leadState,
                  onChangeText: text => {
                    setLeadState(text);
                    setLeadStateId(0);
                    setShowStateSuggestions(true);
                  },
                  onFocus: () => {
                    setShowStateSuggestions(true);
                    preloadStates();
                  },
                })}
                {renderStateSuggestions()}
              </View>
              <View
                style={[styles.customerAutocompleteWrapper, styles.formHalf]}>
                {renderFormInput('City *', {
                  value: leadCity,
                  onChangeText: text => {
                    setLeadCity(text);
                    setLeadCityId(0);
                    setShowCitySuggestions(true);
                  },
                  onFocus: () => {
                    if (!leadStateId) {
                      Alert.alert('Lead Form', 'Please select a State first.');
                      return;
                    }
                    setShowCitySuggestions(true);
                    preloadCities();
                  },
                })}
                {renderCitySuggestions()}
              </View>
            </View>

            {renderFormInput('Pin Code *', {
              value: leadPinCode,
              onChangeText: setLeadPinCode,
              keyboardType: 'numeric',
            })}

            {renderFormInput('Landmark *', {
              value: leadLandmark,
              onChangeText: setLeadLandmark,
            })}

            <Pressable
              style={styles.formInputShell}
              onPress={() => {
                setIsServiceTypeModalOpen(true);
                loadServiceTypes();
              }}>
              <Text
                numberOfLines={1}
                style={[
                  styles.formSelectText,
                  selectedServiceType ? styles.formValueText : null,
                ]}>
                {selectedServiceType?.label || 'Select Service Type'}
              </Text>
              <Text style={styles.formSelectArrow}>v</Text>
            </Pressable>

            <View style={styles.photoRow}>
              {leadPhotos.map((photo, index) => (
                <Pressable
                  key={index}
                  style={styles.photoBox}
                  onPress={() => handlePhotoBoxPress(index)}>
                  {photo ? (
                    <>
                      <Image source={{uri: photo.uri}} style={styles.photoPreview} />
                      <Pressable
                        hitSlop={8}
                        style={styles.photoRemove}
                        onPress={() => removeLeadPhoto(index)}>
                        <Text style={styles.photoRemoveText}>x</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Text style={styles.photoIcon}>Cam</Text>
                  )}
                </Pressable>
              ))}
            </View>

            {renderFormInput('Notes', {
              value: leadNotes,
              onChangeText: setLeadNotes,
              multiline: true,
            })}

            <Pressable
              style={[
                styles.submitLeadButton,
                isSubmittingLead ? styles.submitLeadButtonDisabled : null,
              ]}
              disabled={isSubmittingLead}
              onPress={handleAddLeadSubmit}>
              {isSubmittingLead ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitLeadText}>ADD</Text>
              )}
            </Pressable>

            <Pressable style={styles.cancelLeadButton} onPress={closeAddLeadModal}>
              <Text style={styles.cancelLeadText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (selectedLeadId !== null) {
    return (
      <LeadDetailsScreen
        userId={userId}
        leadId={selectedLeadId}
        onBack={() => setSelectedLeadId(null)}
      />
    );
  }

  return (
    <View style={styles.screen}>
      {/* The menu/title/notification row used to be drawn here; it's now
          the shared AppHeader rendered once by AdminTabs, above
          AdminHomeScreen (which this screen is embedded in). */}
      <Pressable
        style={styles.statusSelector}
        onPress={() => setIsStatusModalOpen(true)}>
        <Text numberOfLines={1} style={styles.statusSelectorText}>
          {selectedStatus.label}
        </Text>
        <Text style={styles.statusSelectorChevron}>v</Text>
      </Pressable>

      <View style={styles.panel}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>Search</Text>
            <TextInput
              value={searchText}
              onChangeText={value => {
                const nextValue = value.slice(0, 35);
                setSearchText(nextValue);
                if (!nextValue.trim() && submittedSearch) {
                  setSubmittedSearch('');
                }
              }}
              onSubmitEditing={submitSearch}
              returnKeyType="search"
              placeholder="Search by Customer Name, Lead Id"
              placeholderTextColor="#8f8f8f"
              style={styles.searchInput}
            />
            {searchText ? (
              <Pressable hitSlop={12} onPress={clearSearch}>
                <Text style={styles.clearText}>x</Text>
              </Pressable>
            ) : null}
          </View>

          <Pressable style={styles.addButton} onPress={openAddLeadModal}>
            <Text style={styles.addButtonText}>+ Lead</Text>
          </Pressable>

          <Pressable style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Link</Text>
          </Pressable>
        </View>

        {isInitialLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={THEME_PRIMARY} />
            <Text style={styles.loadingText}>Loading leads...</Text>
          </View>
        ) : null}

        <FlatList
          data={leads}
          keyExtractor={(item, index) => `${getLeadId(item) || index}-${index}`}
          renderItem={renderLead}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.listFooter}>
                <ActivityIndicator color={THEME_PRIMARY} size="small" />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              colors={[THEME_PRIMARY]}
              tintColor={THEME_PRIMARY}
              onRefresh={() =>
                fetchLeadPage({
                  nextPage: PAGE_START,
                  replace: true,
                  refreshing: true,
                })
              }
            />
          }
          onEndReachedThreshold={0.35}
          onEndReached={() => {
            if (!isInitialLoading && !isLoadingMore && !isLastPage) {
              fetchLeadPage({nextPage: pageIndex + 1, replace: false});
            }
          }}
        />
      </View>

      <Modal
        visible={isStatusModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsStatusModalOpen(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsStatusModalOpen(false)}>
          <Pressable style={styles.modalPanel}>
            <Text style={styles.modalTitle}>Select Lead Status</Text>
            {statusOptions.map(status => (
              <TouchableOpacity
                key={`${status.id}-${status.label}`}
                style={[
                  styles.modalItem,
                  status.id === selectedStatus.id ? styles.modalItemActive : null,
                ]}
                onPress={() => {
                  setSelectedStatus(status);
                  setIsStatusModalOpen(false);
                }}>
                <Text
                  style={[
                    styles.modalItemText,
                    status.id === selectedStatus.id
                      ? styles.modalItemTextActive
                      : null,
                  ]}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {renderAddLeadModal()}
      {renderServiceTypeModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME_PRIMARY,
  },
  toolbar: {
    height: 64,
    backgroundColor: HEADER_PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    elevation: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 3},
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '900',
  },
  toolbarTitle: {
    flex: 1,
    marginLeft: 20,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  toolbarActions: {
    width: 104,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toolbarActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  statusSelector: {
    height: 82,
    backgroundColor: THEME_PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  statusSelectorText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  statusSelectorChevron: {
    marginLeft: 12,
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '900',
  },
  panel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
  },
  searchRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    minWidth: 0,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#c9c9c9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    color: '#b9b9b9',
    fontSize: 12,
    fontWeight: '800',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#222222',
    fontSize: 18,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  clearText: {
    color: '#a7a7a7',
    fontSize: 28,
    lineHeight: 30,
  },
  addButton: {
    height: 42,
    minWidth: 74,
    borderRadius: 13,
    backgroundColor: '#080808',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  linkButton: {
    height: 42,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    color: THEME_PRIMARY,
    fontSize: 13,
    fontWeight: '900',
  },
  loadingOverlay: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 110,
  },
  leadCard: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#ededed',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 2},
  },
  statusRibbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    minWidth: 104,
    maxWidth: '42%',
    height: 30,
    borderBottomRightRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    zIndex: 2,
  },
  statusRibbonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  leadDateText: {
    position: 'absolute',
    top: 12,
    right: 12,
    maxWidth: 168,
    color: '#8b8b8b',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  leadBody: {
    paddingTop: 42,
    paddingLeft: 20,
    paddingRight: 154,
    paddingBottom: 16,
  },
  leadTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  leadTitle: {
    maxWidth: 150,
    color: '#20283a',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
  leadIdText: {
    marginLeft: 8,
    color: '#1976d2',
    fontSize: 13,
    fontWeight: '900',
  },
  leadDescription: {
    marginTop: 10,
    color: '#666666',
    fontSize: 15,
    fontWeight: '500',
  },
  leadActions: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 136,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    minWidth: 52,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappIcon: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '900',
  },
  callIcon: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '900',
  },
  listFooter: {
    paddingVertical: 16,
  },
  emptyState: {
    flex: 1,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#f2f4f7',
    color: '#98a2b3',
    fontSize: 28,
    fontWeight: '800',
  },
  emptyTitle: {
    marginTop: 12,
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 6,
    color: '#667085',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  modalPanel: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '76%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
  },
  modalTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  modalItem: {
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalItemActive: {
    backgroundColor: '#fde7ee',
  },
  modalItemText: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '600',
  },
  modalItemTextActive: {
    color: THEME_PRIMARY,
    fontWeight: '900',
  },
  modalSearchBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    height: 40,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  modalSearchInput: {
    height: 38,
    color: '#1F2937',
    fontSize: 14,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  modalEmptyText: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#667085',
    fontSize: 13,
  },
  addModalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  addModalPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  addModalHeader: {
    alignItems: 'center',
    backgroundColor: '#3a3f3a',
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  addModalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  addModalClose: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addModalCloseText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 28,
  },
  addFormScroll: {
    backgroundColor: '#FFFFFF',
  },
  addFormContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  formInputShell: {
    height: 46,
    borderWidth: 1,
    borderColor: '#c9c9c9',
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  formInputShellMultiline: {
    height: 90,
    borderRadius: 20,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  formInput: {
    flex: 1,
    height: 44,
    color: '#1F2937',
    fontSize: 15,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  formInputMultiline: {
    height: '100%',
    textAlignVertical: 'top',
  },
  formTrailing: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactIcon: {
    color: THEME_PRIMARY,
    fontSize: 13,
    fontWeight: '900',
  },
  formPairRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formHalf: {
    flex: 1,
  },
  formSelectText: {
    flex: 1,
    color: '#9CA3AF',
    fontSize: 15,
  },
  formValueText: {
    color: '#1F2937',
  },
  formSelectArrow: {
    marginLeft: 8,
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '800',
  },
  customerAutocompleteWrapper: {
    zIndex: 20,
  },
  customerSuggestionPanel: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    maxHeight: 210,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 8,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 30,
  },
  customerSuggestionList: {
    maxHeight: 208,
  },
  customerSuggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEEE',
  },
  customerSuggestionName: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },
  customerSuggestionMeta: {
    marginTop: 3,
    color: '#777777',
    fontSize: 12,
  },
  customerSuggestionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 14,
  },
  customerSuggestionStatusText: {
    marginLeft: 8,
    color: '#777777',
    fontSize: 13,
  },
  photoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  photoBox: {
    width: '31%',
    height: 76,
    borderWidth: 1,
    borderColor: '#c9c9c9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoIcon: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '800',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  submitLeadButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3a3f3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitLeadButtonDisabled: {
    opacity: 0.7,
  },
  submitLeadText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelLeadButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLeadText: {
    color: THEME_PRIMARY,
    fontSize: 15,
    fontWeight: '800',
  },
});

export default LeadListScreen;