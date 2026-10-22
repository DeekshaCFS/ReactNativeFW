// src/screens/admin/AddQuoteModal.tsx

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from '../../components/AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {OutlinedInput} from '../../components/OutlinedInput';
import PlaceSearchModal from '../../components/PlaceSearchModal';
import {FieldErrorDot, FieldErrorTip} from '../../components/BottomSheetDialog';
import AddQuotePreview, {type QuotePreviewData} from '../../components/AddQuotePreview';
import DateTimePicker, {type DateTimePickerChangeEvent} from '@react-native-community/datetimepicker';
import {pick} from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import SearchPickerModal, {type PickerOption} from '../../components/SearchPickerModal';
import {getEnquiryServiceTypeList} from '../../api/services/servicesService';
import type {EnquiryServiceTypeDTOResultData} from '../../api/services/services.types';
import {getAllItemAssignedUnassigned} from '../../api/item/itemService';
import type {ItemsListResultData} from '../../api/item/item.types';
import {getTaxList, postQuotationDetails, postQuotationDetailsNonOwner, selfInvoiceCreation} from '../../api/quotation/quotationService';
import {transactionTpye} from '../../api/paymentTransaction/paymentTransactionService';
import type {
  SaveQuotationDTOQuoteItemList,
  SaveQuotationDTOQuoteServiceList,
  SaveQuotationDTOQuoteTaxList,
} from '../../api/quotation/quotation.types';
import {sp, ms, vs} from '../../utils/responsive';
import {COLORS} from '../../theme/theme';
import {ensureSuccess} from '../../utils/apiResponse';
import {getCurrentUserId, isIndiaCountryDetailsId} from '../../state/session';
import {getCustomerList} from '../../api/customerList/customerListService';
import type {CustomerListResultData} from '../../api/customerList/customerList.types';
import {formatAmount, sanitizeDecimalInput} from '../../utils/decimal';
import { showFailureMsg, showSuccessMsg, showToast } from '../../utils/toast';
import DecimalInput from '../../components/DecimalInput';

import {useTranslation} from 'react-i18next';
import { tr } from '../../i18n/tr';
type LeadServiceTypeItem = EnquiryServiceTypeDTOResultData;
type ItemInventoryListItem = ItemsListResultData;
type SaveQuotationServiceRequest = SaveQuotationDTOQuoteServiceList;
type SaveQuotationItemRequest = SaveQuotationDTOQuoteItemList;

const HEADER_DARK = COLORS.statusOnHold; // gradient_addtask #353935
const SEGMENT_DARK = COLORS.ink; // @color/background_gray
const RED = COLORS.primary;
const BORDER = COLORS.lightGray; // TextInputLayoutStyle boxStrokeColor
const TAX_MODE_OPTIONS: PickerOption[] = [
  {id: 0, label: 'Select Tax'},
  {id: 1, label: 'With Tax'},
  {id: 2, label: 'Without Tax'},
];

type SectionKey = 'service' | 'items' | 'discount';

type ServiceRow = {
  id: string;
  serviceTypeId: number | null;
  serviceTypeName: string;
  quantity: string;
  price: string;
};

type ItemRow = {
  id: string;
  itemId: number | null;
  itemName: string;
  quantity: string;
  price: string;
  /** Master sales price, so price (the row total) can follow the quantity (Java AddInvoiceItemsAdminAdapter). */
  unitPrice: number;
};

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Java String.valueOf(double): 1233 -> "1233.0", 12.5 -> "12.5".
const javaDouble = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n));

const makeRowId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getServiceTypeId = (item: LeadServiceTypeItem) => Number(item.Id ?? 0);

const getServiceTypeName = (item: LeadServiceTypeItem) =>
  String(item.ServiceName ?? '').trim();

const getItemFieldString = (
  item: ItemInventoryListItem,
  keys: Array<keyof ItemInventoryListItem>,
) => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
};

const getItemFieldNumber = (
  item: ItemInventoryListItem,
  keys: Array<keyof ItemInventoryListItem>,
) => {
  for (const key of keys) {
    const value = item[key];
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed !== 0) {
      return parsed;
    }
  }
  return 0;
};

const getItemId = (item: ItemInventoryListItem) =>
  getItemFieldNumber(item, ['ItemId', 'Id']);

const getItemName = (item: ItemInventoryListItem) =>
  getItemFieldString(item, ['Name']);

const getItemPrice = (item: ItemInventoryListItem) =>
  getItemFieldNumber(item, ['SalesPrice']);

type AddQuoteModalProps = {
  visible: boolean;
  ownerId: number;
  onClose: () => void;
  onSuccess?: () => void;
  /** 'invoice' mirrors Java's dialog_add_invoice (SelfInvoiceCreate). */
  mode?: 'quote' | 'invoice';
  /** Fieldworker flow (Java: addQuoteTech / SaveQuotationsNonOwner). `ownerId` is then the owner's ID. */
  technician?: boolean;
};

// Java: adapters cap service and item rows at 10.
const TECH_MAX_ROWS = 10;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const pad2 = (n: number) => String(n).padStart(2, '0');

const AddQuoteModal = ({visible, ownerId, onClose, onSuccess, mode = 'quote', technician = false}: AddQuoteModalProps) => {
  const {t} = useTranslation();
  const isInvoice = mode === 'invoice';
  const docLabel = isInvoice ? 'Invoice' : 'Quote';
  const docTitle = `Add ${docLabel}`;
  // Invoice-only: Java's preview dialog also asks for the amount received and
  // the payment transaction type before saving.
  const [receivedAmount, setReceivedAmount] = useState('');
  const [paymentTypes, setPaymentTypes] = useState<PickerOption[]>([]);
  const [selectedPaymentType, setSelectedPaymentType] = useState<PickerOption | null>(null);
  const [isPaymentTypePickerOpen, setIsPaymentTypePickerOpen] = useState(false);
  const [isLoadingPaymentTypes, setIsLoadingPaymentTypes] = useState(false);
  const [quoteName, setQuoteName] = useState('');
  const [quoteDate, setQuoteDate] = useState(getTodayDateString());
  const [validityDate, setValidityDate] = useState('');
  const [datePickerField, setDatePickerField] = useState<'quote' | 'validity' | null>(null);
  const [datePickerValue, setDatePickerValue] = useState(new Date());
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [buildingFlatNumber, setBuildingFlatNumber] = useState('');
  const [landmark, setLandmark] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  // Technician flow: customer autocomplete (Java: autoComplete_cust_name / edittext_quote_number).
  const [customers, setCustomers] = useState<CustomerListResultData[]>([]);
  const [customerId, setCustomerId] = useState(0);
  const [isPlaceSearchOpen, setIsPlaceSearchOpen] = useState(false);
  const [customerLat, setCustomerLat] = useState('0');
  const [customerLng, setCustomerLng] = useState('0');
  const [suggestFor, setSuggestFor] = useState<'name' | 'phone' | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>('service');

  const [serviceRows, setServiceRows] = useState<ServiceRow[]>([
    {id: makeRowId(), serviceTypeId: null, serviceTypeName: '', quantity: '', price: ''},
  ]);
  const [itemRows, setItemRows] = useState<ItemRow[]>([
    {id: makeRowId(), itemId: null, itemName: '', quantity: '', price: '', unitPrice: 0},
  ]);

  const [discountPercent, setDiscountPercent] = useState('');
  const [taxPercent, setTaxPercent] = useState('');

  const [extraName, setExtraName] = useState('');
  const [extraPrice, setExtraPrice] = useState('');
  const [termCondition, setTermCondition] = useState('');
  const [attachedFileName, setAttachedFileName] = useState('');
  const [attachedFileBase64, setAttachedFileBase64] = useState('');
  // Java's spin_tax: "Select Tax" (0) / "With Tax" (1) / "Without Tax" (2); with
  // tax, spin_percent lists the owner's taxes as "Name: N%".
  const [taxMode, setTaxMode] = useState<0 | 1 | 2>(0);
  const [taxName, setTaxName] = useState('');
  const [taxOptions, setTaxOptions] = useState<Array<PickerOption & {name: string; percent: number}>>([]);
  const [isTaxPickerOpen, setIsTaxPickerOpen] = useState(false);
  const [isTaxModePickerOpen, setIsTaxModePickerOpen] = useState(false);
  const [isLoadingTaxes, setIsLoadingTaxes] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [serviceTypes, setServiceTypes] = useState<LeadServiceTypeItem[]>([]);
  const [isLoadingServiceTypes, setIsLoadingServiceTypes] = useState(false);
  const [items, setItems] = useState<ItemInventoryListItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Java EditText.setError: one field at a time carries the red "!" and tooltip until edited.
  const [errorField, setErrorField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const showFieldError = (field: string, message: string) => {
    setErrorField(field);
    setErrorMsg(message);
  };
  const clearError = (field: string) => setErrorField(prev => (prev === field ? null : prev));

  const resetForm = useCallback(() => {
    setQuoteName('');
    setQuoteDate(getTodayDateString());
    setValidityDate('');
    setCustomerName('');
    setAddress('');
    setBuildingFlatNumber('');
    setLandmark('');
    setPhoneNumber('');
    setCustomerId(0);
    setCustomerLat('0');
    setCustomerLng('0');
    setSuggestFor(null);
    setActiveSection('service');
    setServiceRows([{id: makeRowId(), serviceTypeId: null, serviceTypeName: '', quantity: '', price: ''}]);
    setItemRows([{id: makeRowId(), itemId: null, itemName: '', quantity: '', price: '', unitPrice: 0}]);
    setDiscountPercent('');
    setTaxPercent('');
    setExtraName('');
    setExtraPrice('');
    setTermCondition('');
    setAttachedFileName('');
    setAttachedFileBase64('');
    setTaxMode(0);
    setTaxName('');
    setIsPreviewOpen(false);
    setErrorField(null);
    setReceivedAmount('');
    setSelectedPaymentType(null);
    setOpenDropdownKey(null);
  }, []);

  const loadServiceTypes = useCallback(async () => {
    setIsLoadingServiceTypes(true);
    try {
      // Java's fieldworker fragments pass the user's own ID as OwnerId here.
      const response = await getEnquiryServiceTypeList({OwnerId: technician ? getCurrentUserId() : ownerId});
      setServiceTypes(response.ResultData ?? []);
    } catch (error) {
      setServiceTypes([]);
    } finally {
      setIsLoadingServiceTypes(false);
    }
  }, [ownerId, technician]);

  // Admin: only the customer list is needed (for name / number suggestions).
  const loadCustomerList = useCallback(async () => {
    try {
      const response = await getCustomerList({UserId: ownerId, CustomerTagId: 0});
      setCustomers(response?.ResultData ?? []);
    } catch (error) {
      setCustomers([]);
    }
  }, [ownerId]);

  // Java: getCustomerListForTech -> getCustomerList(ownerId, 0), then getTaxDetails(ownerId);
  // with no tax configured the form never opens.
  const loadTechnicianData = useCallback(async () => {
    try {
      const response = await getCustomerList({UserId: ownerId, CustomerTagId: 0});
      setCustomers(response?.ResultData ?? []);
    } catch (error) {
      setCustomers([]);
    }
    try {
      const response = await getTaxList({UserId: ownerId});
      const rows = Array.isArray(response?.ResultData) ? response.ResultData : [];
      if (String(response?.Code) !== '200' || rows.length === 0) {
        showFailureMsg(t('rn_please_add_dynamic_tax_from_portal_to_proc'));
        onClose();
        return;
      }
      setTaxOptions(
        rows.map((row, index) => {
          const name = String(row.TaxName ?? '').trim();
          const percent = Number(row.TaxPercentage) || 0;
          return {id: Number(row.Id) || index + 1, label: `${name}: ${percent}%`, name, percent};
        }),
      );
    } catch (error) {
      showFailureMsg(t('rn_unable_to_load_tax_details_please_try_agai'));
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  const loadItems = useCallback(async () => {
    setIsLoadingItems(true);
    try {
      const response = await getAllItemAssignedUnassigned({OwnerId: ownerId, SearchParam: ''});
      const resultData = response.ResultData ?? [];
      setItems(Array.isArray(resultData) ? resultData : [resultData]);
    } catch (error) {
      setItems([]);
    } finally {
      setIsLoadingItems(false);
    }
  }, [ownerId]);

  useEffect(() => {
    if (visible) {
      resetForm();
      loadServiceTypes();
      loadItems();
      if (technician) {
        loadTechnicianData();
      } else {
        loadCustomerList();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleClose = () => {
    setOpenDropdownKey(null);
    onClose();
  };

  const addServiceRow = () => {
    if (serviceRows.length >= TECH_MAX_ROWS) {
      showToast(t('not_allowed'));
      return;
    }
    setServiceRows(prev => [
      ...prev,
      {id: makeRowId(), serviceTypeId: null, serviceTypeName: '', quantity: '', price: ''},
    ]);
  };

  const removeServiceRow = (id: string) => {
    setServiceRows(prev =>
      prev.length > 1
        ? prev.filter(row => row.id !== id)
        : prev.map(row => ({ ...row, serviceTypeId: null, serviceTypeName: '', quantity: '', price: '' })),
    );
  };

  // Java AddInvoiceItemsAdminAdapter.levelOneValidation: warns when no item is picked yet but still adds the row,
  // unless the price is a literal zero.
  const addItemRow = () => {
    if (itemRows.length >= TECH_MAX_ROWS) {
      showToast(t('not_allowed'));
      return;
    }
    if (!technician) {
      const last = itemRows[itemRows.length - 1];
      if (!last?.itemId) {
        showToast(t('rn_please_select_an_item'));
      }
      if (['0', '00', '000'].includes((last?.price ?? '').trim())) {
        showToast(t('rn_price_should_not_be_zero'));
        return;
      }
    }
    setItemRows(prev => [...prev, {id: makeRowId(), itemId: null, itemName: '', quantity: '', price: '', unitPrice: 0}]);
  };

  const removeItemRow = (id: string) => {
    if (!technician && itemRows.length === 1) {
      showToast(t('rn_at_least_one_item_is_required'));
      return;
    }
    setItemRows(prev =>
      prev.length > 1
        ? prev.filter(row => row.id !== id)
        : prev.map(row => ({ ...row, itemId: null, itemName: '', quantity: '', price: '', unitPrice: 0 })),
    );
  };

  // Java AddQuoteServiceAdapter: qty is a whole number (max 3 digits); typing it sets the row price to
  // qty x the service's master price; the price box is a free decimal (max 3 places, 9 chars).
  const onServiceQtyChange = (rowId: string, text: string) => {
    const qty = text.replace(/[^0-9]/g, '').slice(0, 3);
    if (qty && /^0+$/.test(qty)) {
      showToast(t('rn_qty_should_not_be_zero'));
    }
    setServiceRows(prev =>
      prev.map(r => {
        if (r.id !== rowId) {
          return r;
        }
        if (!qty) {
          return {...r, quantity: ''};
        }
        return r.serviceTypeId
          ? {...r, quantity: qty, price: javaDouble(Number(qty) * masterServicePrice(r.serviceTypeId))}
          : {...r, quantity: qty};
      }),
    );
  };

  const onServicePriceChange = (rowId: string, text: string) => {
    if (!/^\d*(\.\d{0,3})?$/.test(text)) {
      return;
    }
    setServiceRows(prev => prev.map(r => (r.id === rowId ? {...r, price: text.slice(0, 9)} : r)));
  };

  const onServicePriceBlur = (rowId: string) => {
    setServiceRows(prev =>
      prev.map(r => {
        if (r.id !== rowId || !r.price.trim()) {
          return r;
        }
        const d = Number(r.price);
        return {...r, price: Number.isFinite(d) ? d.toFixed(3) : ''};
      }),
    );
  };

  // Java admin item row: qty (max 3 digits) x the item's sales price fills the disabled price box.
  const onItemQtyChange = (rowId: string, text: string) => {
    const qty = text.replace(/[^0-9]/g, '').slice(0, 3);
    setItemRows(prev =>
      prev.map(r => {
        if (r.id !== rowId) {
          return r;
        }
        if (!qty) {
          return {...r, quantity: ''};
        }
        return r.itemId ? {...r, quantity: qty, price: javaDouble(Number(qty) * r.unitPrice)} : {...r, quantity: qty};
      }),
    );
  };

  // Java's "Attach SLA": any document (pdf, images, xlsx, txt, zip...), max 6 MB,
  // sent inline as SLAAttachmentName + SLAAttachmentBase64.
  const MAX_ATTACHMENT_BYTES = 6 * 1024 * 1024;

  const handlePickAttachment = async () => {
    try {
      const [file] = await pick({
        type: [
          'image/jpeg',
          'image/png',
          'application/pdf',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/zip',
          'text/plain',
        ],
      });
      if (!file) {
        return;
      }
      if (typeof file.size === 'number' && file.size > MAX_ATTACHMENT_BYTES) {
        showFailureMsg(t('rn_file_size_must_be_6_mb_or_less'));
        return;
      }
      const base64 = await RNFS.readFile(file.uri, 'base64');
      setAttachedFileName(file.name || 'Attached file');
      setAttachedFileBase64(base64);
    } catch (error) {
      const code = (error as {code?: string} | null)?.code;
      if (code !== 'DOCUMENT_PICKER_CANCELED' && code !== 'OPERATION_CANCELED') {
        showFailureMsg(t('rn_unable_to_attach_this_file'));
      }
    }
  };

  const openPaymentTypePicker = () => {
    setIsPaymentTypePickerOpen(true);
    if (paymentTypes.length > 0 || isLoadingPaymentTypes) {
      return;
    }
    setIsLoadingPaymentTypes(true);
    transactionTpye()
      .then(response => {
        const rows = Array.isArray(response?.ResultData) ? response.ResultData : [];
        setPaymentTypes(
          rows
            .map(row => ({
              id: Number(row.PaymentTransactionTypeId) || 0,
              label: String(row.PaymentTransactionTypeName ?? ''),
            }))
            .filter(option => option.label),
        );
      })
      .catch(() => setPaymentTypes([]))
      .finally(() => setIsLoadingPaymentTypes(false));
  };

  // `selectFirst` mimics Java's spinner, which shows (and submits) the first tax until another is picked.
  const openTaxPicker = (selectFirst = false) => {
    if (selectFirst && taxOptions.length > 0) {
      setTaxName(taxOptions[0].name);
      setTaxPercent(String(taxOptions[0].percent));
      return;
    }
    if (!selectFirst) {
      setIsTaxPickerOpen(true);
    }
    if (taxOptions.length > 0 || isLoadingTaxes) {
      return;
    }
    setIsLoadingTaxes(true);
    getTaxList({UserId: ownerId})
      .then(response => {
        const rows = Array.isArray(response?.ResultData) ? response.ResultData : [];
        const mapped = rows.map((row, index) => {
          const name = String(row.TaxName ?? '').trim();
          const percent = Number(row.TaxPercentage) || 0;
          return {
            id: Number(row.Id) || index + 1,
            label: `${name}: ${percent}%`,
            name,
            percent,
          };
        });
        setTaxOptions(mapped);
        if (selectFirst && mapped.length > 0) {
          setTaxName(mapped[0].name);
          setTaxPercent(String(mapped[0].percent));
        }
      })
      .catch(() => setTaxOptions([]))
      .finally(() => setIsLoadingTaxes(false));
  };

  // Java: only rows with a service and qty > 0 count; the price box already holds the row total.
  const serviceTotal = useMemo(
    () =>
      serviceRows.reduce(
        (sum, row) => (row.serviceTypeId && Number(row.quantity) > 0 ? sum + (Number(row.price) || 0) : sum),
        0,
      ),
    [serviceRows],
  );

  const masterServicePrice = (serviceTypeId: number | null) =>
    Number(serviceTypes.find(s => getServiceTypeId(s) === serviceTypeId)?.Price) || 0;

  const itemTotal = useMemo(
    () =>
      itemRows.reduce(
        (sum, row) =>
          row.itemId ? sum + (Number(row.price) || 0) * (technician ? Number(row.quantity) || 1 : 1) : sum,
        0,
      ),
    [itemRows, technician],
  );

  const extraTotal = Number(extraPrice) || 0;

  const grandTotal = useMemo(() => {
    const subTotal = serviceTotal + itemTotal + extraTotal;
    const discountValue = subTotal * ((Number(discountPercent) || 0) / 100);
    const taxableAmount = subTotal - discountValue;
    const taxValue = taxableAmount * ((Number(taxPercent) || 0) / 100);
    return taxableAmount + taxValue;
  }, [serviceTotal, itemTotal, extraTotal, discountPercent, taxPercent]);

  const openDatePicker = (field: 'quote' | 'validity') => {
    const current = field === 'quote' ? quoteDate : validityDate;
    const parsed = DATE_RE.test(current.trim()) ? new Date(current.trim()) : new Date();
    setDatePickerValue(isNaN(parsed.getTime()) ? new Date() : parsed);
    setDatePickerField(field);
  };

  const applyPickedDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    if (datePickerField === 'quote') setQuoteDate(formatted);
    else if (datePickerField === 'validity') setValidityDate(formatted);
  };

  // Java addQuoteTech's validation chain. Not ported: the "address needs lat/long" rule
  // (plain-text address; coordinates come from a picked customer, else "0").
  const validateTechnician = (): string | null => {
    if (!quoteName) return `Please enter ${docLabel.toLowerCase()} name`;
    if (!quoteName.trim() || /^\s/.test(quoteName)) return 'Space is not allowed';
    if (!customerName.trim()) return 'Please enter customer name';
    if (/^\s/.test(customerName)) return 'Space is not allowed';
    if (!address.trim()) return 'Please enter address';
    if (!landmark.trim()) return 'Please enter landmark';
    if (/^\s/.test(landmark)) return 'Space is not allowed';
    if (!DATE_RE.test(quoteDate.trim())) return `Please enter ${docLabel.toLowerCase()} date (YYYY-MM-DD)`;
    if (!DATE_RE.test(validityDate.trim())) return 'Please enter validity date (YYYY-MM-DD)';
    if (extraName.trim() && !extraPrice.trim()) return 'Please enter extra item price';
    if (validityDate.trim() < quoteDate.trim()) {
      return `Validity Date should not be less than ${docLabel} Date!`;
    }
    const phone = phoneNumber.trim();
    if (!phone) return 'Please enter customer number';
    if (Number(phone) === 0) return 'Please enter valid number';
    if (isIndiaCountryDetailsId()) {
      if (!/^\d{10,12}$/.test(phone)) return 'Please enter valid number';
    } else if (phone.length <= 6) {
      return 'Please enter valid number';
    }
    if (taxMode === 1 && !taxName) return 'Please select tax percentage';
    return null;
  };

  // Java addQuote / addInvoice validation chain (strings.xml messages). Returns false after flagging the field.
  const validateAdmin = (): boolean => {
    const leadingSpace = (v: string) => /^\s/.test(v) || !v.trim();
    if (!quoteName) {
      showFieldError('name', t('please_enter_task_name'));
      return false;
    }
    if (leadingSpace(quoteName)) {
      showFieldError('name', t('space_is_not_allowed'));
      return false;
    }
    if (customerName && leadingSpace(customerName)) {
      showFieldError('customer', t('space_is_not_allowed'));
      return false;
    }
    if (!address) {
      showFieldError('address', t('please_enter_address'));
      return false;
    }
    if (!landmark) {
      showFieldError('landmark', t('please_enter_landmark'));
      return false;
    }
    if (leadingSpace(landmark)) {
      showFieldError('landmark', t('space_is_not_allowed'));
      return false;
    }
    if (!quoteDate.trim()) {
      showFieldError('date', t('please_enter_date'));
      return false;
    }
    if (!validityDate.trim()) {
      showFieldError('validity', t('please_enter_date'));
      return false;
    }
    if (!(Number(customerLat) || 0) || !(Number(customerLng) || 0)) {
      showFieldError('address', t('please_enter_address'));
      showToast(t('please_enter_address_correctly'));
      return false;
    }
    if (extraName && !extraPrice) {
      showFieldError('extraPrice', 'Please Enter Price');
      return false;
    }
    if (quoteDate.trim() > validityDate.trim()) {
      showToast(t('rn_validity_date_should_not_be_less_than_quot'));
      return false;
    }
    if (!serviceRows.some(r => r.serviceTypeId && Number(r.quantity) > 0)) {
      showToast(t('rn_please_add_a_service'), true);
      return false;
    }
    const phone = phoneNumber.trim();
    const invalidPhone = () => {
      showFieldError('phone', t('please_enter_valid_number'));
      return false;
    };
    if (!phone || Number(phone) === 0) {
      return invalidPhone();
    }
    if (isIndiaCountryDetailsId() ? !/^\d{10,12}$/.test(phone) : phone.length <= 6) {
      return invalidPhone();
    }
    if (itemRows.some(r => r.itemId && !(Number(r.quantity) > 0))) {
      showToast(t('rn_item_qty_cannot_be_zero'));
      return false;
    }
    return true;
  };

  // Java viewAndSaveQuote / viewAndSaveSelfInvoice: the totals block of the preview.
  const totals = useMemo(() => {
    const subTotal = serviceTotal + itemTotal + extraTotal;
    const discPct = Math.trunc(Number(discountPercent)) || 0;
    const discAmt = subTotal * (discPct / 100);
    const afterDisc = subTotal - discAmt;
    const taxPct = taxMode === 1 ? Number(taxPercent) || 0 : 0;
    const taxBase = afterDisc !== 0 ? afterDisc : subTotal;
    const gst = taxMode === 1 ? taxBase * (taxPct / 100) : 0;
    const grand = (taxMode === 1 ? taxBase : afterDisc) + gst;
    return {subTotal, discPct, discAmt, afterDisc, taxPct, gst, grand};
  }, [serviceTotal, itemTotal, extraTotal, discountPercent, taxMode, taxPercent]);

  const previewData: QuotePreviewData = useMemo(() => {
    const lines = [
      ...serviceRows
        .filter(r => r.serviceTypeId && Number(r.quantity) > 0)
        .map(r => {
          const qty = Number(r.quantity);
          const total = Number(r.price) || 0;
          return {name: r.serviceTypeName, qty, unit: total / qty, total};
        }),
      ...itemRows
        .filter(r => r.itemId)
        .map(r => {
          const qty = Number(r.quantity) || 0;
          const total = technician ? qty * (Number(r.price) || 0) : Number(r.price) || 0;
          return {name: r.itemName, qty, unit: technician ? Number(r.price) || 0 : r.unitPrice, total};
        }),
      ...(extraName.trim() && extraTotal !== 0
        ? [{name: extraName.trim(), qty: 1, unit: extraTotal, total: extraTotal}]
        : []),
    ];
    const money = (n: number) => `₹ ${n.toFixed(3)}`;
    return {
      customerName: customerName.trim(),
      mobile: phoneNumber.trim(),
      address: address.trim(),
      landmark: landmark.trim(),
      flat: buildingFlatNumber.trim(),
      createdDate: quoteDate,
      validityDate: validityDate.trim(),
      lines,
      subTotal: money(totals.subTotal),
      discount: totals.discPct !== 0 ? `${money(totals.discAmt)} (${javaDouble(totals.discPct)}%)` : '₹ 0.00',
      amountAfterDiscount: money(totals.afterDisc),
      taxName: taxMode === 1 ? taxName : '',
      tax: taxMode === 1 ? `${money(totals.gst)} (${javaDouble(totals.taxPct)}%)` : '₹ 0.00',
      grandTotal: money(totals.grand),
      terms: termCondition.trim(),
    };
  }, [
    serviceRows, itemRows, technician, extraName, extraTotal, customerName, phoneNumber, address, landmark,
    buildingFlatNumber, quoteDate, validityDate, totals, taxMode, taxName, termCondition,
  ]);

  const [receivedError, setReceivedError] = useState('');

  // Java preview Save for an invoice: amount received + payment transaction type checks.
  const onPreviewSave = () => {
    if (isInvoice) {
      if (!receivedAmount.trim()) {
        setReceivedError(t('please_enter_amount'));
        return;
      }
      if (!selectedPaymentType) {
        showToast(t('rn_please_select_payment_transaction_type'), true);
        return;
      }
      if (Number(receivedAmount) > totals.grand) {
        showToast(t('rn_entered_amount_is_greater_than_grand_total'), true);
        return;
      }
    }
    handleSave(true);
  };

  const handleSave = async (confirmed = false) => {
    if (!confirmed) {
      if (technician) {
        const problem = validateTechnician();
        if (problem) {
          showFailureMsg(problem);
          return;
        }
      } else if (!validateAdmin()) {
        return;
      }
      setReceivedError('');
      setIsPreviewOpen(true);
      return;
    }

    // Java: only rows with a service and qty > 0 are posted; price already holds the row total.
    const quoteServiceList: SaveQuotationServiceRequest[] = serviceRows
      .filter(row => row.serviceTypeId && Number(row.quantity) > 0)
      .map(row => ({
        ServiceId: row.serviceTypeId ?? undefined,
        ServiceName: row.serviceTypeName,
        Quantity: Number(row.quantity),
        Price: Number(row.price) || 0,
        TotalPrice: Number(row.price) || 0,
      }));

    const quoteItemList: SaveQuotationItemRequest[] = itemRows
      .filter(row => row.itemId)
      .map(row =>
        technician
          ? {
              ItemId: row.itemId ?? undefined,
              ItemName: row.itemName,
              Quantity: Number(row.quantity) || 1,
              UnitPrice: Number(row.price) || 0,
              TotalPrice: (Number(row.quantity) || 1) * (Number(row.price) || 0),
            }
          : {
              ItemId: row.itemId ?? undefined,
              ItemName: row.itemName,
              Quantity: Number(row.quantity) || 0,
              UnitPrice: row.unitPrice,
              TotalPrice: Number(row.price) || 0,
            },
      );

    const nowIso = new Date().toISOString().slice(0, 19);

    setIsSubmitting(true);
    try {
      if (technician) {
        // Java: viewAndSaveQuoteTech -> saveQuoteDetailsNonOwner / selfInvoiceCreation.
        const userId = getCurrentUserId();
        const d = new Date();
        const localNow =
          `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T` +
          `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
        const stamp = `${localNow}.701Z`;
        const subTotal = serviceTotal + itemTotal + extraTotal;
        const discount = Math.trunc(Number(discountPercent)) || 0;
        const afterDiscount = subTotal - subTotal * (discount / 100);
        const taxPct = taxMode === 1 ? Number(taxPercent) || 0 : 0;
        const gst = afterDiscount * (taxPct / 100);

        const techBody = {
          IsActive: true,
          QuoteName: quoteName,
          // Java posts the current timestamp (not the picked date) as CreatedDate/QuoteTime.
          CreatedDate: stamp,
          QuoteTime: stamp,
          ValidityDate: `${validityDate.trim()}T00:00:00.701Z`,
          CreatedBy: userId,
          UpdatedBy: userId,
          UserId: userId,
          StatusId: 2,
          TermCondition: termCondition,
          ExtraItem: extraName,
          ExtraAmount: extraTotal,
          CustomerId: customerId,
          Customer: {
            CustomerName: customerName,
            CustomerDetailsid: customerId,
            MobileNumber: phoneNumber.trim(),
            IsActive: true,
            LocationList: {
              Name: '',
              Latitude: customerLat,
              Longitude: customerLng,
              Description: landmark,
              Address: address,
              BuildingNumber: buildingFlatNumber,
              // Java: the invoice save sends 0 here, the quote save the user's ID.
              CreatedBy: isInvoice ? 0 : userId,
              CreatedDate: stamp,
              IsActive: true,
            },
          },
          QuoteServiceList: quoteServiceList.map(s => ({
            ...s,
            CreatedBy: userId,
            UpdatedBy: userId,
            CreatedDate: stamp,
            IsActive: true,
          })),
          QuoteItemList: quoteItemList.map(i => ({
            ...i,
            CreatedDate: stamp,
            IsActive: true,
            // Java's self-invoice save also stamps these on every item row.
            ...(isInvoice
              ? {Id: 0, QuotationId: 0, UserId: userId, CreatedBy: userId, UpdatedBy: userId}
              : {}),
          })),
          QuoteTaxList: [
            {
              Discount: discount,
              DiscountAmounnt: afterDiscount,
              Tax: taxPct,
              TaxAmount: gst,
              WithoutTax: taxMode,
              CreatedBy: userId,
              CreatedDate: stamp,
              UserId: userId,
              IsActive: true,
            },
          ],
          TotalAmount: subTotal,
          GrandTotalAmount: afterDiscount + gst,
        };

        if (isInvoice) {
          ensureSuccess(
            await selfInvoiceCreation({
              ...techBody,
              ReceivedAmount: Number(receivedAmount) || 0,
              PaymentTransactionTypeId: selectedPaymentType?.id ?? 0,
            } as unknown as Parameters<typeof selfInvoiceCreation>[0]),
          );
        } else {
          ensureSuccess(
            await postQuotationDetailsNonOwner(
              techBody as unknown as Parameters<typeof postQuotationDetailsNonOwner>[0],
            ),
          );
        }

        showSuccessMsg(isInvoice ? tr('Invoice Created Successfully.') : tr('Quotation Created Successfully.'));
        onSuccess?.();
        handleClose();
        return;
      }

      // Java viewAndSaveQuote / viewAndSaveSelfInvoice: CreatedDate / QuoteTime are the moment of saving
      // (the picked quote date only feeds the validation), ValidityDate is the picked date.
      const userId = ownerId;
      const d = new Date();
      const localNow =
        `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T` +
        `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
      const stamp = `${localNow}.701Z`;
      const requestBody = {
        IsActive: true,
        UserId: userId,
        CreatedBy: userId,
        UpdatedBy: userId,
        StatusId: 2, // Not Assigned — matches the Java admin create-quote default
        QuoteName: quoteName,
        CreatedDate: stamp,
        QuoteTime: stamp,
        ValidityDate: `${validityDate.trim()}T00:00:00.701Z`,
        CustomerId: customerId,
        Customer: {
          CustomerName: customerName,
          CustomerDetailsid: customerId,
          MobileNumber: phoneNumber.trim(),
          IsActive: true,
          LocationList: {
            Name: '',
            latitude: customerLat,
            Longitude: customerLng,
            Description: landmark,
            Address: address,
            BuildingNumber: buildingFlatNumber,
            // Java: the invoice save sends 0 here, the quote save the user's ID.
            CreatedBy: isInvoice ? 0 : userId,
            CreatedDate: stamp,
            IsActive: true,
          },
        },
        ExtraItem: extraName,
        ExtraAmount: extraTotal,
        TermCondition: termCondition,
        TotalAmount: totals.subTotal,
        GrandTotalAmount: totals.grand,
        QuoteServiceList: quoteServiceList.map(sv => ({
          ...sv,
          CreatedBy: userId,
          UpdatedBy: userId,
          CreatedDate: stamp,
          IsActive: true,
        })),
        QuoteItemList: quoteItemList.map(it => ({...it, CreatedDate: stamp, IsActive: true})),
        // Java stores the amount after discount in DiscountAmounnt and the tax amount in TaxAmount.
        QuoteTaxList: [
          {
            Discount: totals.discPct,
            DiscountAmounnt: totals.afterDisc,
            Tax: totals.taxPct,
            TaxAmount: totals.gst,
            WithoutTax: taxMode,
            CreatedBy: userId,
            CreatedDate: stamp,
            UserId: userId,
            IsActive: true,
          },
        ],
      };

      if (isInvoice) {
        ensureSuccess(
          await selfInvoiceCreation({
            ...requestBody,
            ReceivedAmount: Number(receivedAmount) || 0,
            PaymentTransactionTypeId: selectedPaymentType?.id ?? 0,
          } as unknown as Parameters<typeof selfInvoiceCreation>[0]),
        );
      } else {
        ensureSuccess(
          await postQuotationDetails({
            ...requestBody,
            SLAAttachmentName: attachedFileName,
            SLAAttachmentBase64: attachedFileBase64,
          } as unknown as Parameters<typeof postQuotationDetails>[0]),
        );
      }

      showSuccessMsg(isInvoice ? tr('Invoice Created Successfully.') : tr('Quotation Created Successfully.'));
      onSuccess?.();
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : `Unable to save ${docLabel.toLowerCase()}.`;
      showFailureMsg(message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Java: autoComplete_cust_name / edittext_quote_number item-click listeners.
  const customerSuggestions = useMemo(() => {
    if (!suggestFor) {
      return [];
    }
    const q = (suggestFor === 'name' ? customerName : phoneNumber).trim().toLowerCase();
    if (!q) {
      return [];
    }
    return customers
      .filter(c =>
        suggestFor === 'name'
          ? (c.CustomerName ?? '').toLowerCase().includes(q)
          : String(c.MobileNumber ?? '').includes(q),
      )
      .slice(0, 6);
  }, [suggestFor, customers, customerName, phoneNumber]);

  const pickCustomer = (c: CustomerListResultData) => {
    setCustomerId(Number(c.CustomerDetailsid) || 0);
    setCustomerName(c.CustomerName ?? '');
    setPhoneNumber(c.MobileNumber ?? '');
    setAddress(c.Address ?? '');
    setBuildingFlatNumber(c.BuildingNumber ?? '');
    setLandmark(c.Description ?? '');
    const lat = parseFloat(c.latitude ?? '');
    const lng = parseFloat(c.Longitude ?? '');
    setCustomerLat(Number.isFinite(lat) ? String(lat) : '0');
    setCustomerLng(Number.isFinite(lng) ? String(lng) : '0');
    setSuggestFor(null);
  };

  const renderSuggestions = (field: 'name' | 'phone') =>
    suggestFor === field && customerSuggestions.length > 0 ? (
      <View style={styles.suggestList}>
        {customerSuggestions.map((c, i) => (
          <Pressable
            key={`${c.CustomerDetailsid ?? i}-${i}`}
            style={styles.dropdownItem}
            onPress={() => pickCustomer(c)}>
            <Text style={styles.dropdownItemText}>
              {c.CustomerName} {c.MobileNumber ? `· ${c.MobileNumber}` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
    ) : null;

  // Java: tapping the spinner opens dialog_searchable_spinner_service_type / _item (centered
  // searchable list) instead of an inline dropdown.
  const selectServiceType = (rowId: string, item: LeadServiceTypeItem) => {
    const typeId = getServiceTypeId(item);
    const typeName = getServiceTypeName(item);
    if (serviceRows.some(r => r.id !== rowId && r.serviceTypeName.toLowerCase() === typeName.toLowerCase())) {
      showToast(t('rn_same_service_name_not_allowed'));
      return;
    }
    setServiceRows(prev =>
      prev.map(r =>
        r.id === rowId
          ? {
              ...r,
              serviceTypeId: typeId,
              serviceTypeName: typeName,
              // A quantity already typed prices the row against the picked service.
              ...(Number(r.quantity) > 0 ? {price: javaDouble(Number(r.quantity) * (Number(item.Price) || 0))} : {}),
            }
          : r,
      ),
    );
  };

  const selectItem = (rowId: string, item: ItemInventoryListItem) => {
    const id = getItemId(item);
    const name = getItemName(item);
    const price = getItemPrice(item);
    if (itemRows.some(r => r.id !== rowId && r.itemName.toLowerCase() === name.toLowerCase())) {
      showToast(t('rn_same_item_name_not_allowed'));
      return;
    }
    setItemRows(prev =>
      prev.map(r => {
        if (r.id !== rowId) {
          return r;
        }
        if (technician) {
          return {...r, itemId: id, itemName: name, unitPrice: price, price: r.price ? r.price : String(price || '')};
        }
        return {
          ...r,
          itemId: id,
          itemName: name,
          unitPrice: price,
          price: Number(r.quantity) > 0 ? javaDouble(Number(r.quantity) * price) : r.price,
        };
      }),
    );
  };

  const renderServiceTypeDropdown = (row: ServiceRow) => (
    <Pressable style={styles.dropdownField} onPress={() => setOpenDropdownKey(`service-${row.id}`)}>
      <Text
        style={row.serviceTypeName ? styles.dropdownValueText : styles.dropdownPlaceholderText}
        numberOfLines={1}>
        {isLoadingServiceTypes ? tr('Loading...') : row.serviceTypeName || t('select_service_type')}
      </Text>
      <Ionicons name="chevron-down" style={styles.dropdownChevron} />
    </Pressable>
  );

  const renderItemDropdown = (row: ItemRow, flex = 3) => (
    <Pressable style={[styles.dropdownField, {flex}]} onPress={() => setOpenDropdownKey(`item-${row.id}`)}>
      <Text style={row.itemName ? styles.dropdownValueText : styles.dropdownPlaceholderText} numberOfLines={1}>
        {isLoadingItems ? tr('Loading...') : row.itemName || (technician ? 'Select Item' : 'Select')}
      </Text>
      <Ionicons name="chevron-down" style={styles.dropdownChevron} />
    </Pressable>
  );

  // Java EditText.setError: red outline, red "!" in the field and a tooltip with the message.
  const ErrorMark = () => (
    <>
      <View style={styles.errorDot}>
        <Text style={styles.errorDotText}>!</Text>
      </View>
      <FieldErrorTip message={errorMsg} bottom={ms(66)} />
    </>
  );
  const isErr = (field: string) => errorField === field;

  const pickerKind = openDropdownKey?.startsWith('service-') ? 'service' : openDropdownKey?.startsWith('item-') ? 'item' : null;
  const pickerRowId = openDropdownKey ? openDropdownKey.replace(/^(service|item)-/, '') : '';

  const showAttach = !isInvoice && !technician;
  const adminItems = !technician;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => (suggestFor ? setSuggestFor(null) : handleClose())}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <KeyboardAvoidingView
            style={styles.flexShrink}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled">
              <View style={styles.header}>
                <Text style={styles.headerTitle}>{docTitle}</Text>
                <TouchableOpacity onPress={handleClose} hitSlop={12}>
                  <Ionicons name="close" size={ms(30)} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              <View style={styles.formBody}>
              <View>
                <OutlinedInput
                  style={[styles.pillInput, {marginBottom: ms(36)}, isErr('name') && styles.pillError]}
                  placeholder={`${docLabel} Name *`}
                  placeholderTextColor={COLORS.lightGray}
                  maxLength={100}
                  value={quoteName}
                  onChangeText={v => {
                    setQuoteName(v);
                    clearError('name');
                  }}
                />
                {isErr('name') && <ErrorMark />}
              </View>

              <View style={[styles.fieldRow, {gap: ms(9), marginBottom: ms(4)}]}>
                <TouchableOpacity style={styles.halfInput} activeOpacity={0.7} onPress={() => openDatePicker('quote')}>
                  <View pointerEvents="none">
                    <OutlinedInput
                      style={[styles.pillInput, isErr('date') && styles.pillError]}
                      placeholder={`${docLabel} Date*`}
                      value={quoteDate}
                      editable={false}
                    />
                    {isErr('date') && <ErrorMark />}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.halfInput} activeOpacity={0.7} onPress={() => openDatePicker('validity')}>
                  <View pointerEvents="none">
                    <OutlinedInput
                      style={[styles.pillInput, isErr('validity') && styles.pillError]}
                      placeholder={t('rn_validity_date')}
                      value={validityDate}
                      editable={false}
                    />
                    {isErr('validity') && <ErrorMark />}
                  </View>
                </TouchableOpacity>
              </View>

              <View>
                <OutlinedInput
                  style={[styles.pillInput, {marginBottom: ms(20)}, isErr('customer') && styles.pillError]}
                  placeholder={t('star_customer_name')}
                  placeholderTextColor={COLORS.lightGray}
                  value={customerName}
                  onChangeText={text => {
                    setCustomerName(text);
                    setSuggestFor('name');
                    clearError('customer');
                    // Editing the name detaches it from a previously picked customer.
                    setCustomerId(0);
                  }}
                />
                {isErr('customer') && <ErrorMark />}
              </View>
              {renderSuggestions('name')}

              {/* Java: tapping the address opens the full-screen Google Places search. */}
              <TouchableOpacity activeOpacity={0.7} onPress={() => setIsPlaceSearchOpen(true)}>
                <View pointerEvents="none">
                  <OutlinedInput
                    style={[styles.pillInput, isErr('address') && styles.pillError]}
                    placeholder={t('star_address')}
                    placeholderTextColor={COLORS.lightGray}
                    value={address}
                    editable={false}
                  />
                  {isErr('address') && <ErrorMark />}
                </View>
              </TouchableOpacity>

              <OutlinedInput
                style={[styles.pillInput, {marginBottom: ms(36)}]}
                placeholder={t('rn_building_flat_number')}
                placeholderTextColor={COLORS.lightGray}
                maxLength={25}
                value={buildingFlatNumber}
                onChangeText={setBuildingFlatNumber}
              />

              <View style={[styles.fieldRow, {gap: ms(20)}]}>
                <View style={styles.halfInput}>
                  <OutlinedInput
                    style={[styles.pillInput, isErr('landmark') && styles.pillError]}
                    placeholder={t('star_landmark')}
                    placeholderTextColor={COLORS.lightGray}
                    value={landmark}
                    onChangeText={v => {
                      setLandmark(v);
                      clearError('landmark');
                    }}
                  />
                  {isErr('landmark') && <ErrorMark />}
                </View>
                <View style={styles.halfInput}>
                  <OutlinedInput
                    style={[styles.pillInput, isErr('phone') && styles.pillError]}
                    placeholder={t('star_phone_number')}
                    placeholderTextColor={COLORS.lightGray}
                    keyboardType="phone-pad"
                    maxLength={12}
                    value={phoneNumber}
                    onChangeText={text => {
                      setPhoneNumber(technician ? text.replace(/[^0-9]/g, '') : text);
                      setSuggestFor('phone');
                      clearError('phone');
                      setCustomerId(0);
                    }}
                  />
                  {isErr('phone') && <ErrorMark />}
                </View>
              </View>
              {renderSuggestions('phone')}

              <View style={styles.segmentRow}>
                {(
                  [
                    ['service', 'Service'],
                    ['items', 'Items'],
                    ['discount', 'Discount & Tax'],
                  ] as Array<[SectionKey, string]>
                ).map(([key, label], index) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.segmentButton,
                      index < 2 && styles.segmentDivider,
                      activeSection === key ? styles.segmentButtonActive : null,
                    ]}
                    onPress={() => setActiveSection(key)}>
                    <Text style={[styles.segmentButtonText, activeSection === key ? styles.segmentButtonTextActive : null]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {activeSection === 'service'
                ? serviceRows.map((row, index) => (
                    <View key={row.id} style={styles.rowCard}>
                      <View style={styles.rowCardHeader}>
                        <Text style={styles.rowCardTitle}>{t('service')} #{index + 1}</Text>
                        <TouchableOpacity onPress={() => removeServiceRow(row.id)} hitSlop={10}>
                          <Ionicons name="close" size={ms(26)} color={RED} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.rowCardFields}>
                        {renderServiceTypeDropdown(row)}
                        <TextInput
                          style={styles.qtyInput}
                          value={row.quantity}
                          keyboardType="number-pad"
                          maxLength={3}
                          onChangeText={v => onServiceQtyChange(row.id, v)}
                        />
                        <OutlinedInput
                          style={[styles.pillInput, styles.thirdInput, {flex: 2, marginBottom: 0}]}
                          placeholder={t('price')}
                          placeholderTextColor={COLORS.lightGray}
                          keyboardType="decimal-pad"
                          maxLength={9}
                          value={row.price}
                          onChangeText={v => onServicePriceChange(row.id, v)}
                          onBlur={() => onServicePriceBlur(row.id)}
                        />
                      </View>
                    </View>
                  ))
                : null}

              {activeSection === 'service' ? (
                <TouchableOpacity onPress={addServiceRow} style={styles.addMoreButton}>
                  <Text style={styles.addMoreText}>{t('add_more')}</Text>
                </TouchableOpacity>
              ) : null}

              {activeSection === 'items'
                ? itemRows.map((row, index) => (
                    <View key={row.id} style={[styles.rowCard, adminItems && {marginTop: ms(25)}]}>
                      <View style={styles.rowCardHeader}>
                        <Text style={styles.rowCardTitle}>{t('item')} #{index + 1}</Text>
                        <TouchableOpacity onPress={() => removeItemRow(row.id)} hitSlop={10}>
                          <Ionicons name="close" size={ms(26)} color={RED} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.rowCardFields}>
                        {adminItems ? (
                          <>
                            {renderItemDropdown(row, 5)}
                            <TextInput
                              style={[styles.qtyInput, {flex: 2}]}
                              placeholder={t('rn_qty_2')}
                              placeholderTextColor={COLORS.lightGray}
                              value={row.quantity}
                              keyboardType="number-pad"
                              maxLength={3}
                              onChangeText={v => onItemQtyChange(row.id, v)}
                            />
                            <OutlinedInput
                              style={[styles.pillInput, styles.thirdInput, {flex: 5, marginBottom: 0}]}
                              placeholder={t('price')}
                              placeholderTextColor={COLORS.lightGray}
                              editable={false}
                              value={row.price}
                            />
                          </>
                        ) : (
                          <>
                            {renderItemDropdown(row)}
                            <DecimalInput integer
                              style={[styles.pillInput, styles.thirdInput]}
                              label={t('rn_qty_2')}
                              placeholderTextColor={COLORS.lightGray}
                              value={row.quantity}
                              onChangeText={value =>
                                setItemRows(prev => prev.map(r => (r.id === row.id ? {...r, quantity: value} : r)))
                              }
                            />
                            <DecimalInput
                              style={[styles.pillInput, styles.thirdInput, {flex: 2}]}
                              label={t('price')}
                              placeholderTextColor={COLORS.lightGray}
                              value={row.price}
                              onChangeText={value =>
                                setItemRows(prev => prev.map(r => (r.id === row.id ? {...r, price: sanitizeDecimalInput(value)} : r)))
                              }
                            />
                          </>
                        )}
                      </View>
                    </View>
                  ))
                : null}

              {activeSection === 'items' ? (
                <TouchableOpacity onPress={addItemRow} style={styles.addMoreButton}>
                  <Text style={styles.addMoreText}>{t('add_more')}</Text>
                </TouchableOpacity>
              ) : null}

              {activeSection === 'discount' ? (
                <View>
                  <OutlinedInput
                    style={styles.pillInput}
                    placeholder={t('discount') + ' %'}
                    placeholderTextColor={COLORS.lightGray}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={discountPercent}
                    onChangeText={v => setDiscountPercent(v.replace(/[^0-9]/g, ''))}
                  />
                  <View style={[styles.fieldRow, styles.taxRow]}>
                    {/* Java spin_tax + spin_percent: two 50/50 spinners; the second is invisible unless "With Tax". */}
                    <TouchableOpacity
                      style={[styles.dropdownField, styles.halfInput, styles.taxSpinner]}
                      activeOpacity={0.7}
                      onPress={() => setIsTaxModePickerOpen(true)}>
                      <Text style={styles.taxSpinnerText} numberOfLines={1}>
                        {TAX_MODE_OPTIONS.find(o => o.id === taxMode)?.label}
                      </Text>
                      <Ionicons name="chevron-down" style={styles.taxChevron} />
                    </TouchableOpacity>
                    {taxMode === 1 ? (
                      <TouchableOpacity
                        style={[styles.dropdownField, styles.halfInput, styles.taxSpinner]}
                        activeOpacity={0.7}
                        onPress={() => openTaxPicker()}>
                        <Text style={styles.taxSpinnerText} numberOfLines={1}>
                          {taxName ? `${taxName}: ${taxPercent}%` : tr('Select Tax Percentage')}
                        </Text>
                        <Ionicons name="chevron-down" style={styles.taxChevron} />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.halfInput} />
                    )}
                  </View>
                </View>
              ) : null}

              <Text style={styles.extraLabel}>{t('rn_extra')}</Text>
              <View style={[styles.fieldRow, {gap: ms(20), marginBottom: ms(4)}]}>
                <OutlinedInput
                  style={[styles.pillInput, styles.halfInput, {flex: 1.5}]}
                  placeholder={t('name')}
                  placeholderTextColor={COLORS.lightGray}
                  value={extraName}
                  onChangeText={setExtraName}
                />
                <View style={styles.halfInput}>
                  <OutlinedInput
                    style={[styles.pillInput, isErr('extraPrice') && styles.pillError]}
                    placeholder={t('price')}
                    placeholderTextColor={COLORS.lightGray}
                    keyboardType="decimal-pad"
                    maxLength={10}
                    value={extraPrice}
                    onChangeText={v => {
                      clearError('extraPrice');
                      setExtraPrice(sanitizeDecimalInput(v));
                    }}
                    onBlur={() => {
                      const d = Number(extraPrice);
                      setExtraPrice(extraPrice.trim() && Number.isFinite(d) ? d.toFixed(3) : '');
                    }}
                  />
                  {isErr('extraPrice') && <ErrorMark />}
                </View>
              </View>

              {/* Java: lnlAttachFile is made visible by the admin addQuote only (never invoice / technician). */}
              {showAttach ? (
                <>
                  <Text style={[styles.extraLabel, {marginTop: 0, marginBottom: ms(10)}]}>{t('rn_attach_file')}</Text>
                  <TouchableOpacity style={styles.attachBox} activeOpacity={0.7} onPress={handlePickAttachment}>
                    <Text style={styles.attachBoxText}>
                      {attachedFileName ||
                        'Choose .pdf, .jpeg, .jpg, .png, .xlsx, .txt, .zip, etc. max file size is 6 MB'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}

              <OutlinedInput
                style={[styles.pillInput, styles.termInput]}
                placeholder={t('terms_and_condition')}
                placeholderTextColor={COLORS.lightGray}
                maxLength={100}
                value={termCondition}
                onChangeText={setTermCondition}
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleSave()}
                disabled={isSubmitting}>
                <Text style={styles.saveButtonText}>{isSubmitting ? tr('SAVING...') : tr('SAVE & VIEW')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>

      <SearchPickerModal
        visible={isTaxModePickerOpen}
        title={t('rn_select_tax')}
        hideSearch
        options={TAX_MODE_OPTIONS}
        onSelect={option => {
          setTaxMode(option.id as 0 | 1 | 2);
          if (option.id !== 1) {
            setTaxPercent('');
            setTaxName('');
          } else if (!taxName) {
            openTaxPicker(true);
          }
          setIsTaxModePickerOpen(false);
        }}
        onClose={() => setIsTaxModePickerOpen(false)}
      />

      <SearchPickerModal
        visible={isTaxPickerOpen}
        title={t('rn_select_tax')}
        hideSearch
        options={taxOptions}
        loading={isLoadingTaxes}
        emptyText="No taxes found."
        onSelect={option => {
          const tax = taxOptions.find(row => row.id === option.id);
          setTaxName(tax?.name ?? option.label);
          setTaxPercent(String(tax?.percent ?? 0));
          setIsTaxPickerOpen(false);
        }}
        onClose={() => setIsTaxPickerOpen(false)}
      />

      <SearchPickerModal
        visible={isPaymentTypePickerOpen}
        title={t('rn_payment_transaction_type')}
        options={paymentTypes}
        loading={isLoadingPaymentTypes}
        emptyText="No payment types found."
        onSelect={option => {
          setSelectedPaymentType(option);
          setIsPaymentTypePickerOpen(false);
        }}
        onClose={() => setIsPaymentTypePickerOpen(false)}
      />

      <PlaceSearchModal
        visible={isPlaceSearchOpen}
        onClose={() => setIsPlaceSearchOpen(false)}
        onSelect={place => {
          setAddress(place.address);
          setCustomerLat(String(place.latitude));
          setCustomerLng(String(place.longitude));
          setIsPlaceSearchOpen(false);
        }}
      />

      <SearchPickerModal
        visible={pickerKind !== null}
        title={pickerKind === 'item' ? tr('Select Item') : tr('Select Service Type')}
        searchHint={pickerKind === 'item' ? tr('Please Enter Min 3 Characters...') : tr('Search...')}
        options={
          pickerKind === 'item'
            ? items.map((item, index) => ({id: index, label: getItemName(item)}))
            : serviceTypes.map((item, index) => ({id: index, label: getServiceTypeName(item)}))
        }
        onSelect={option => {
          if (pickerKind === 'item') {
            const item = items[option.id];
            if (item) selectItem(pickerRowId, item);
          } else {
            const item = serviceTypes[option.id];
            if (item) selectServiceType(pickerRowId, item);
          }
          setOpenDropdownKey(null);
        }}
        onClose={() => setOpenDropdownKey(null)}
      />

      {datePickerField && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade" onRequestClose={() => setDatePickerField(null)}>
            <Pressable style={styles.dateBackdrop} onPress={() => setDatePickerField(null)}>
              <Pressable style={styles.dateSheet} onPress={e => e.stopPropagation()}>
                <Text style={styles.dateSheetTitle}>{t('rn_select_date')}</Text>
                <DateTimePicker
                  value={datePickerValue}
                  mode="date"
                  display="inline"
                  onValueChange={(_: DateTimePickerChangeEvent, date: Date) => setDatePickerValue(date)}
                  themeVariant="light"
                  accentColor={COLORS.primary}
                />
                <View style={styles.dateSheetActions}>
                  <TouchableOpacity style={styles.dateCancelBtn} onPress={() => setDatePickerField(null)}>
                    <Text style={styles.dateCancelText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateConfirmBtn}
                    onPress={() => {
                      applyPickedDate(datePickerValue);
                      setDatePickerField(null);
                    }}>
                    <Text style={styles.dateConfirmText}>{t('qr_code_positive_button_confirm')}</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        ) : (
          <DateTimePicker
            value={datePickerValue}
            mode="date"
            display="default"
            onValueChange={(_: DateTimePickerChangeEvent, date: Date) => {
              applyPickedDate(date);
              setDatePickerField(null);
            }}
            onDismiss={() => setDatePickerField(null)}
            positiveButton={{label: t('qr_code_positive_button_know'), textColor: COLORS.primary}}
            negativeButton={{label: tr('CANCEL'), textColor: COLORS.primary}}
          />
        )
      )}

      <AddQuotePreview
        visible={isPreviewOpen}
        isInvoice={isInvoice}
        data={previewData}
        saving={isSubmitting}
        onClose={() => setIsPreviewOpen(false)}
        onSave={onPreviewSave}
        receivedAmount={receivedAmount}
        onReceivedChange={v => {
          setReceivedAmount(sanitizeDecimalInput(v));
          setReceivedError('');
        }}
        receivedError={receivedError}
        paymentTypeLabel={selectedPaymentType?.label ?? ''}
        onPickPaymentType={openPaymentTypePicker}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: ms(560),
    maxHeight: '94%',
    overflow: 'hidden',
    borderTopLeftRadius: ms(25),
    borderTopRightRadius: ms(25),
  },
  // Java: gradient_addtask header (#353935, 20dp corners), 60dp tall, 22sp title.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: HEADER_DARK,
    paddingHorizontal: ms(20),
    height: ms(60),
    borderRadius: ms(20),
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: sp(22),
  },
  headerClose: {
    color: '#FFFFFF',
    fontSize: sp(18),
  },
  flexShrink: {
    flexShrink: 1,
  },
  // Java: 20dp side margins on every field, 20dp + label space above the first one.
  // Java: the title bar is part of the scrolling dialog; fields keep 20dp side margins.
  scrollContent: {
    paddingBottom: ms(0),
  },
  formBody: {
    paddingHorizontal: ms(20),
    paddingTop: ms(25),
  },
  pillError: {
    borderColor: '#B00020',
  },
  errorDot: {
    position: 'absolute',
    right: ms(14),
    top: ms(8),
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    backgroundColor: '#E4002B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorDotText: {color: '#fff', fontWeight: 'bold', fontSize: sp(16), lineHeight: ms(20)},
  fieldRow: {
    flexDirection: 'row',
    gap: ms(12),
    marginBottom: ms(14),
  },
  halfInput: {
    flex: 1,
  },
  // Java layout_discount: spinners with 20dp side margins (40dp gap), 10dp+10dp top, 16dp bottom.
  taxRow: {
    gap: ms(40),
    marginTop: ms(15),
    marginBottom: ms(25),
  },
  taxSpinner: {
    flex: 1,
    marginRight: 0,
    marginBottom: 0,
    paddingHorizontal: ms(18),
  },
  taxSpinnerText: {
    fontSize: sp(16),
    color: COLORS.ink,
    flex: 1,
  },
  taxChevron: {
    fontSize: sp(20),
    color: COLORS.ink,
    marginLeft: ms(6),
  },
  thirdInput: {
    flex: 1,
  },
  pillInput: {
    borderWidth: ms(1),
    borderColor: BORDER,
    borderRadius: ms(34),
    paddingHorizontal: ms(18),
    height: ms(39),
    fontSize: sp(16),
    color: COLORS.ink,
    marginBottom: ms(26), // Material errorEnabled reserves ~20dp under every field
  },
  termInput: {
    marginTop: ms(4),
    marginBottom: ms(21),
  },
  outsideLabel: {
    fontSize: sp(12),
    color: '#444',
    fontWeight: '500',
    marginBottom: ms(6),
  },
  dateInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInputText: {
    flex: 1,
    fontSize: sp(13),
    color: '#222',
    padding: 0,
  },
  dateBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ms(16),
  },
  dateSheet: {
    backgroundColor: '#fff',
    borderRadius: ms(20),
    width: '100%',
    maxWidth: ms(400),
    paddingTop: ms(16),
    paddingBottom: ms(12),
    paddingHorizontal: ms(12),
    elevation: 10,
  },
  dateSheetTitle: {
    fontSize: sp(18),
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: ms(8),
  },
  dateSheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: ms(12),
    paddingHorizontal: ms(8),
    gap: ms(12),
  },
  dateCancelBtn: {
    flex: 1,
    height: ms(44),
    borderRadius: ms(30),
    borderWidth: 1,
    borderColor: '#a6a6a6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCancelText: {
    fontSize: sp(16),
    color: '#555',
    fontWeight: '500',
  },
  dateConfirmBtn: {
    flex: 1,
    height: ms(44),
    borderRadius: ms(30),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateConfirmText: {
    fontSize: sp(16),
    color: '#fff',
    fontWeight: '600',
  },
  segmentRow: {
    flexDirection: 'row',
    borderRadius: ms(25),
    overflow: 'hidden',
    marginBottom: ms(21),
    borderWidth: 1,
    borderColor: SEGMENT_DARK,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: ms(38),
    backgroundColor: '#FFFFFF',
  },
  // Java SegmentedGroup: one 1dp outer border (25dp corners) with 1dp dividers between segments.
  segmentDivider: {
    borderRightWidth: 1,
    borderRightColor: SEGMENT_DARK,
  },
  segmentButtonActive: {
    backgroundColor: SEGMENT_DARK,
  },
  segmentButtonText: {
    fontSize: sp(14),
    fontWeight: '400',
    color: SEGMENT_DARK,
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  rowCard: {
    borderWidth: ms(1),
    borderColor: '#eceef0',
    borderRadius: ms(24),
    paddingHorizontal: ms(10),
    paddingTop: ms(4),
    paddingBottom: ms(36),
    marginHorizontal: ms(7),
    marginBottom: ms(5),
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: ms(2),
    shadowOffset: {width: 0, height: 1},
  },
  rowCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(18),
  },
  rowCardTitle: {
    color: RED,
    fontWeight: '700',
    fontSize: sp(14),
  },
  rowCardRemove: {
    color: RED,
    fontSize: sp(16),
    fontWeight: '700',
  },
  rowCardFields: {
    flexDirection: 'row',
    gap: ms(8),
  },
  dropdownField: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: ms(1),
    borderColor: BORDER,
    borderRadius: ms(34),
    paddingHorizontal: ms(10),
    height: ms(39),
    marginRight: ms(2),
    backgroundColor: COLORS.white,
  },
  // Java txtUnassignQty: rounded_border (20dp, light_gray stroke), centered, bold dark_gray 14sp.
  qtyInput: {
    flex: 1,
    height: ms(39),
    borderWidth: ms(1),
    borderColor: COLORS.lightGray,
    borderRadius: ms(20),
    textAlign: 'center',
    fontSize: sp(14),
    fontWeight: '700',
    color: COLORS.darkGray,
    padding: 0,
    marginLeft: ms(5),
    marginRight: ms(5),
  },
  dropdownPlaceholderText: {
    fontSize: sp(14),
    color: COLORS.ink,
    flex: 1,
  },
  dropdownValueText: {
    fontSize: sp(14),
    color: COLORS.ink,
    flex: 1,
  },
  dropdownChevron: {
    position: 'absolute',
    right: ms(8),
    fontSize: sp(20),
    color: COLORS.ink,
  },
  dropdownList: {
    position: 'absolute',
    top: ms(48),
    left: 0,
    right: 0,
    maxHeight: ms(160),
    borderWidth: ms(1),
    borderColor: '#e5e7eb',
    borderRadius: ms(12),
    backgroundColor: '#FFFFFF',
    zIndex: 20,
    elevation: 10,
  },
  suggestList: {
    borderWidth: ms(1),
    borderColor: '#e5e7eb',
    borderRadius: ms(12),
    backgroundColor: '#FFFFFF',
    marginBottom: ms(8),
  },
  dropdownScroll: {
    maxHeight: ms(160),
  },
  dropdownItem: {
    paddingVertical: ms(10),
    paddingHorizontal: ms(14),
    borderBottomWidth: ms(1),
    borderBottomColor: '#f1f2f4',
  },
  dropdownItemText: {
    fontSize: sp(13),
    color: '#222',
  },
  addMoreButton: {
    alignItems: 'center',
    marginBottom: ms(10),
  },
  addMoreText: {
    color: RED,
    fontWeight: '700',
    fontSize: sp(20),
  },
  extraLabel: {
    marginLeft: ms(2),
    fontSize: sp(16),
    color: COLORS.textBlack,
    marginBottom: ms(14),
  },
  // Java dashed_border: 1dp dashed #A9A9A9, white, 16sp black centred text with 10dp padding.
  attachBox: {
    borderWidth: ms(1),
    borderStyle: 'dashed',
    borderColor: '#A9A9A9',
    backgroundColor: '#FFFFFF',
    padding: ms(10),
    marginTop: 0,
    marginBottom: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachBoxText: {
    fontSize: sp(15.5),
    color: '#000000',
  },
  saveButton: {
    backgroundColor: COLORS.statusOnHold, // Java rounded_button_new #353935
    borderRadius: ms(34),
    height: ms(48),
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ms(10),
    marginBottom: ms(20),
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: sp(18),
    fontWeight: '500',
  },
  cancelButton: {
    alignSelf: 'center',
    minHeight: ms(48),
    justifyContent: 'center',
    paddingHorizontal: ms(16),
    marginBottom: ms(20),
  },
  cancelText: {
    color: RED,
    fontSize: sp(18),
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default AddQuoteModal;