// src/screens/admin/AddQuoteModal.tsx

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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

type LeadServiceTypeItem = EnquiryServiceTypeDTOResultData;
type ItemInventoryListItem = ItemsListResultData;
type SaveQuotationServiceRequest = SaveQuotationDTOQuoteServiceList;
type SaveQuotationItemRequest = SaveQuotationDTOQuoteItemList;

const HEADER_DARK = '#3a3a3c';
const SEGMENT_DARK = '#232b3a';
const RED = '#c3002f';
const BORDER = '#d5d7db';

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
};

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [customerLat, setCustomerLat] = useState('0');
  const [customerLng, setCustomerLng] = useState('0');
  const [suggestFor, setSuggestFor] = useState<'name' | 'phone' | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>('service');

  const [serviceRows, setServiceRows] = useState<ServiceRow[]>([
    {id: makeRowId(), serviceTypeId: null, serviceTypeName: '', quantity: '', price: ''},
  ]);
  const [itemRows, setItemRows] = useState<ItemRow[]>([
    {id: makeRowId(), itemId: null, itemName: '', quantity: '', price: ''},
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
  const [isLoadingTaxes, setIsLoadingTaxes] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [serviceTypes, setServiceTypes] = useState<LeadServiceTypeItem[]>([]);
  const [isLoadingServiceTypes, setIsLoadingServiceTypes] = useState(false);
  const [items, setItems] = useState<ItemInventoryListItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setItemRows([{id: makeRowId(), itemId: null, itemName: '', quantity: '', price: ''}]);
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
        Alert.alert(docTitle, 'Please add Dynamic Tax from Portal to proceed further.');
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
      Alert.alert(docTitle, 'Unable to load tax details. Please try again.');
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
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleClose = () => {
    setOpenDropdownKey(null);
    onClose();
  };

  const addServiceRow = () => {
    if (technician && serviceRows.length >= TECH_MAX_ROWS) {
      Alert.alert(docTitle, 'Not allowed');
      return;
    }
    setServiceRows(prev => [
      ...prev,
      {id: makeRowId(), serviceTypeId: null, serviceTypeName: '', quantity: '', price: ''},
    ]);
  };

  const removeServiceRow = (id: string) => {
    setServiceRows(prev => (prev.length > 1 ? prev.filter(row => row.id !== id) : prev));
  };

  const addItemRow = () => {
    if (technician && itemRows.length >= TECH_MAX_ROWS) {
      Alert.alert(docTitle, 'Not allowed');
      return;
    }
    setItemRows(prev => [...prev, {id: makeRowId(), itemId: null, itemName: '', quantity: '', price: ''}]);
  };

  const removeItemRow = (id: string) => {
    setItemRows(prev => (prev.length > 1 ? prev.filter(row => row.id !== id) : prev));
  };

  // Java's "Attach SLA": any document (pdf, images, xlsx, txt, zip...), max 6 MB,
  // sent inline as SLAAttachmentName + SLAAttachmentBase64.
  const MAX_ATTACHMENT_BYTES = 6 * 1024 * 1024;

  const handlePickAttachment = async () => {
    try {
      const [file] = await pick({type: ['*/*']});
      if (!file) {
        return;
      }
      if (typeof file.size === 'number' && file.size > MAX_ATTACHMENT_BYTES) {
        Alert.alert('Attach File', 'File size must be 6 MB or less.');
        return;
      }
      const base64 = await RNFS.readFile(file.uri, 'base64');
      setAttachedFileName(file.name || 'Attached file');
      setAttachedFileBase64(base64);
    } catch (error) {
      const code = (error as {code?: string} | null)?.code;
      if (code !== 'DOCUMENT_PICKER_CANCELED' && code !== 'OPERATION_CANCELED') {
        Alert.alert('Attach File', 'Unable to attach this file.');
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

  const openTaxPicker = () => {
    setIsTaxPickerOpen(true);
    if (taxOptions.length > 0 || isLoadingTaxes) {
      return;
    }
    setIsLoadingTaxes(true);
    getTaxList({UserId: ownerId})
      .then(response => {
        const rows = Array.isArray(response?.ResultData) ? response.ResultData : [];
        setTaxOptions(
          rows.map((row, index) => {
            const name = String(row.TaxName ?? '').trim();
            const percent = Number(row.TaxPercentage) || 0;
            return {
              id: Number(row.Id) || index + 1,
              label: `${name}: ${percent}%`,
              name,
              percent,
            };
          }),
        );
      })
      .catch(() => setTaxOptions([]))
      .finally(() => setIsLoadingTaxes(false));
  };

  const serviceTotal = useMemo(
    () =>
      serviceRows.reduce(
        // Technician: the price box holds the row total (qty x master price), as in Java's
        // AddQuoteServiceAdapter; admin keeps a unit price.
        (sum, row) => sum + (Number(row.price) || 0) * (technician ? 1 : Number(row.quantity) || 1),
        0,
      ),
    [serviceRows, technician],
  );

  const masterServicePrice = (serviceTypeId: number | null) =>
    Number(serviceTypes.find(s => getServiceTypeId(s) === serviceTypeId)?.Price) || 0;

  const itemTotal = useMemo(
    () => itemRows.reduce((sum, row) => sum + (Number(row.price) || 0) * (Number(row.quantity) || 1), 0),
    [itemRows],
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

  const handleSave = async (confirmed = false) => {
    if (technician) {
      const problem = validateTechnician();
      if (problem) {
        Alert.alert(docTitle, problem);
        return;
      }
    } else if (!quoteName.trim()) {
      Alert.alert(docTitle, `Please enter ${docLabel} Name.`);
      return;
    }
    if (!validityDate.trim()) {
      Alert.alert(docTitle, 'Please enter Validity Date.');
      return;
    }
    if (!customerName.trim()) {
      Alert.alert(docTitle, 'Please enter Customer Name.');
      return;
    }
    if (!address.trim()) {
      Alert.alert(docTitle, 'Please enter Address.');
      return;
    }
    if (!landmark.trim()) {
      Alert.alert(docTitle, 'Please enter Landmark.');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert(docTitle, 'Please enter Phone Number.');
      return;
    }

    const quoteServiceList: SaveQuotationServiceRequest[] = serviceRows
      // Java (technician): only rows with a service and qty > 0 are kept.
      .filter(row => row.serviceTypeId && (!technician || Number(row.quantity) > 0))
      .map(row => ({
        ServiceId: row.serviceTypeId ?? undefined,
        ServiceName: row.serviceTypeName,
        Quantity: Number(row.quantity) || 1,
        Price: Number(row.price) || 0,
        ...(technician ? {TotalPrice: Number(row.price) || 0} : {}),
      }));

    const quoteItemList: SaveQuotationItemRequest[] = itemRows
      .filter(row => row.itemId)
      .map(row => ({
        ItemId: row.itemId ?? undefined,
        ItemName: row.itemName,
        Quantity: Number(row.quantity) || 1,
        UnitPrice: Number(row.price) || 0,
        ...(technician
          ? {TotalPrice: (Number(row.quantity) || 1) * (Number(row.price) || 0)}
          : {}),
      }));

    // Java's admin add-quote flow (AddUpdateServiceDialog#addQuote) always sends
    // exactly one QuoteTaxList entry carrying discount % and tax %, even though
    // the UI only exposes one pair of fields — mirror that here instead of
    // dropping the values the user typed.
    const quoteTaxList: SaveQuotationDTOQuoteTaxList[] = [
      {
        Discount: Math.trunc(Number(discountPercent)) || 0,
        TaxAmount: taxMode === 1 ? Number(taxPercent) || 0 : 0,
        TaxName: taxMode === 1 ? taxName : '',
        WithoutTax: taxMode,
        CreatedBy: ownerId,
      },
    ];

    if (!confirmed) {
      // Java's "Save & View": show the summary first, save from there.
      setIsPreviewOpen(true);
      return;
    }

    if (isInvoice) {
      // Same checks as Java's invoice preview dialog.
      if (!receivedAmount.trim()) {
        Alert.alert(docTitle, 'Please enter amount received.');
        setIsPreviewOpen(true);
        return;
      }
      if (!selectedPaymentType) {
        Alert.alert(docTitle, 'Please select Payment Transaction Type');
        setIsPreviewOpen(true);
        return;
      }
      if (Number(receivedAmount) > grandTotal) {
        Alert.alert(docTitle, 'Entered Amount is greater than Grand Total Amount');
        setIsPreviewOpen(true);
        return;
      }
    }

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

        Alert.alert(docTitle, isInvoice ? 'Invoice Created Successfully.' : 'Quotation Created Successfully.');
        onSuccess?.();
        handleClose();
        return;
      }

      const requestBody = {
        UserId: ownerId,
        CreatedBy: ownerId,
        UpdatedBy: ownerId,
        StatusId: 2, // Not Assigned — matches the Java admin create-quote default
        QuoteName: quoteName.trim(),
        CreatedDate: `${quoteDate}T00:00:00`,
        QuoteTime: nowIso,
        ValidityDate: `${validityDate.trim()}T00:00:00`,
        Customer: {
          CustomerName: customerName.trim(),
          MobileNumber: phoneNumber.trim(),
          IsActive: true,
          LocationList: {
            Address: address.trim(),
            BuildingNumber: buildingFlatNumber.trim(),
            Description: landmark.trim(),
            IsActive: true,
          },
        },
        ExtraItem: extraName.trim(),
        ExtraAmount: Number(extraPrice) || 0,
        TermCondition: termCondition.trim(),
        TotalAmount: serviceTotal + itemTotal + extraTotal,
        GrandTotalAmount: grandTotal,
        QuoteServiceList: quoteServiceList,
        QuoteItemList: quoteItemList,
        QuoteTaxList: quoteTaxList,
      };

      if (isInvoice) {
        // Java's SelfInvoiceCreate: ".701Z" timestamps, received amount and
        // payment transaction type; the SLA strings are quote-only.
        ensureSuccess(
          await selfInvoiceCreation({
            ...requestBody,
            CreatedDate: `${nowIso}.701Z`,
            QuoteTime: `${nowIso}.701Z`,
            ValidityDate: `${validityDate.trim()}T00:00:00.701Z`,
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
          }),
        );
      }

      Alert.alert(docTitle, `${docLabel} saved successfully.`);
      onSuccess?.();
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : `Unable to save ${docLabel.toLowerCase()}.`;
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Java: autoComplete_cust_name / edittext_quote_number item-click listeners.
  const customerSuggestions = useMemo(() => {
    if (!technician || !suggestFor) {
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
          : (c.MobileNumber ?? '').includes(q),
      )
      .slice(0, 6);
  }, [technician, suggestFor, customers, customerName, phoneNumber]);

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

  const renderServiceTypeDropdown = (row: ServiceRow) => {
    const dropdownKey = `service-${row.id}`;
    const isOpen = openDropdownKey === dropdownKey;

    return (
      <View style={styles.dropdownWrap}>
        <Pressable
          style={styles.dropdownField}
          onPress={() => setOpenDropdownKey(isOpen ? null : dropdownKey)}>
          <Text
            style={row.serviceTypeName ? styles.dropdownValueText : styles.dropdownPlaceholderText}
            numberOfLines={1}>
            {isLoadingServiceTypes
              ? 'Loading...'
              : row.serviceTypeName || 'Select Service Type'}
          </Text>
          <Ionicons name="chevron-down" style={styles.dropdownChevron} />
        </Pressable>
        {isOpen ? (
          <View style={styles.dropdownList}>
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
              {serviceTypes.map(item => {
                const typeId = getServiceTypeId(item);
                const typeName = getServiceTypeName(item);
                return (
                  <Pressable
                    key={`${typeId}-${typeName}`}
                    style={styles.dropdownItem}
                    onPress={() => {
                      if (
                        technician &&
                        serviceRows.some(r => r.id !== row.id && r.serviceTypeName.toLowerCase() === typeName.toLowerCase())
                      ) {
                        Alert.alert(docTitle, 'Same Service name not allowed!');
                        setOpenDropdownKey(null);
                        return;
                      }
                      setServiceRows(prev =>
                        prev.map(r =>
                          r.id === row.id
                            ? {
                                ...r,
                                serviceTypeId: typeId,
                                serviceTypeName: typeName,
                                // Java (technician): picking a service fills its master price.
                                ...(technician ? {price: String(Number(item.Price) || 0)} : {}),
                              }
                            : r,
                        ),
                      );
                      setOpenDropdownKey(null);
                    }}>
                    <Text style={styles.dropdownItemText}>{typeName}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>
    );
  };

  const renderItemDropdown = (row: ItemRow) => {
    const dropdownKey = `item-${row.id}`;
    const isOpen = openDropdownKey === dropdownKey;

    return (
      <View style={styles.dropdownWrap}>
        <Pressable
          style={styles.dropdownField}
          onPress={() => setOpenDropdownKey(isOpen ? null : dropdownKey)}>
          <Text
            style={row.itemName ? styles.dropdownValueText : styles.dropdownPlaceholderText}
            numberOfLines={1}>
            {isLoadingItems ? 'Loading...' : row.itemName || 'Select Item'}
          </Text>
          <Ionicons name="chevron-down" style={styles.dropdownChevron} />
        </Pressable>
        {isOpen ? (
          <View style={styles.dropdownList}>
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
              {items.map((item, index) => {
                const id = getItemId(item);
                const name = getItemName(item);
                const price = getItemPrice(item);
                return (
                  <Pressable
                    key={`${id}-${index}`}
                    style={styles.dropdownItem}
                    onPress={() => {
                      if (
                        technician &&
                        itemRows.some(r => r.id !== row.id && r.itemName.toLowerCase() === name.toLowerCase())
                      ) {
                        Alert.alert(docTitle, 'Same Item name not allowed!');
                        setOpenDropdownKey(null);
                        return;
                      }
                      setItemRows(prev =>
                        prev.map(r =>
                          r.id === row.id
                            ? {
                                ...r,
                                itemId: id,
                                itemName: name,
                                price: r.price ? r.price : String(price || ''),
                              }
                            : r,
                        ),
                      );
                      setOpenDropdownKey(null);
                    }}>
                    <Text style={styles.dropdownItemText}>{name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{docTitle}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Text style={styles.headerClose}>{'\u2715'}</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.flexShrink}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.pillInput}
                placeholder={`${docLabel} Name *`}
                placeholderTextColor="#9aa0a6"
                value={quoteName}
                onChangeText={setQuoteName}
              />

              <View style={styles.fieldRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.outsideLabel}>{docLabel} Date*</Text>
                  <View style={[styles.pillInput, styles.dateInputWrap]}>
                    <TextInput
                      style={styles.dateInputText}
                      value={quoteDate}
                      onChangeText={setQuoteDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9aa0a6"
                    />
                    <TouchableOpacity onPress={() => openDatePicker('quote')} hitSlop={8}>
                      <Ionicons name="calendar-outline" size={ms(18)} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.outsideLabel}>Validity Date*</Text>
                  <View style={[styles.pillInput, styles.dateInputWrap]}>
                    <TextInput
                      style={styles.dateInputText}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9aa0a6"
                      value={validityDate}
                      onChangeText={setValidityDate}
                    />
                    <TouchableOpacity onPress={() => openDatePicker('validity')} hitSlop={8}>
                      <Ionicons name="calendar-outline" size={ms(18)} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TextInput
                style={styles.pillInput}
                placeholder="Customer Name *"
                placeholderTextColor="#9aa0a6"
                value={customerName}
                onChangeText={text => {
                  setCustomerName(text);
                  if (technician) {
                    setSuggestFor('name');
                    // Editing the name detaches it from a previously picked customer.
                    setCustomerId(0);
                  }
                }}
              />
              {renderSuggestions('name')}

              <TextInput
                style={styles.pillInput}
                placeholder="Address *"
                placeholderTextColor="#9aa0a6"
                value={address}
                onChangeText={setAddress}
              />

              <TextInput
                style={styles.pillInput}
                placeholder="Building / Flat Number"
                placeholderTextColor="#9aa0a6"
                value={buildingFlatNumber}
                onChangeText={setBuildingFlatNumber}
              />

              <View style={styles.fieldRow}>
                <TextInput
                  style={[styles.pillInput, styles.halfInput]}
                  placeholder="Landmark *"
                  placeholderTextColor="#9aa0a6"
                  value={landmark}
                  onChangeText={setLandmark}
                />
                <TextInput
                  style={[styles.pillInput, styles.halfInput]}
                  placeholder="Phone Number *"
                  placeholderTextColor="#9aa0a6"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={text => {
                    setPhoneNumber(technician ? text.replace(/[^0-9]/g, '') : text);
                    if (technician) {
                      setSuggestFor('phone');
                      setCustomerId(0);
                    }
                  }}
                />
              </View>
              {renderSuggestions('phone')}

              <View style={styles.segmentRow}>
                <TouchableOpacity
                  style={[styles.segmentButton, activeSection === 'service' ? styles.segmentButtonActive : null]}
                  onPress={() => setActiveSection('service')}>
                  <Text
                    style={[
                      styles.segmentButtonText,
                      activeSection === 'service' ? styles.segmentButtonTextActive : null,
                    ]}>
                    Service
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentButton, activeSection === 'items' ? styles.segmentButtonActive : null]}
                  onPress={() => setActiveSection('items')}>
                  <Text
                    style={[
                      styles.segmentButtonText,
                      activeSection === 'items' ? styles.segmentButtonTextActive : null,
                    ]}>
                    Items
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentButton, activeSection === 'discount' ? styles.segmentButtonActive : null]}
                  onPress={() => setActiveSection('discount')}>
                  <Text
                    style={[
                      styles.segmentButtonText,
                      activeSection === 'discount' ? styles.segmentButtonTextActive : null,
                    ]}>
                    Discount & Tax
                  </Text>
                </TouchableOpacity>
              </View>

              {activeSection === 'service'
                ? serviceRows.map((row, index) => (
                    <View key={row.id} style={styles.rowCard}>
                      <View style={styles.rowCardHeader}>
                        <Text style={styles.rowCardTitle}>Services #{index + 1}</Text>
                        {serviceRows.length > 1 ? (
                          <TouchableOpacity onPress={() => removeServiceRow(row.id)} hitSlop={10}>
                            <Text style={styles.rowCardRemove}>{'\u2715'}</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                      <View style={styles.rowCardFields}>
                        {renderServiceTypeDropdown(row)}
                        <TextInput
                          style={[styles.pillInput, styles.thirdInput]}
                          placeholder="Qty"
                          placeholderTextColor="#9aa0a6"
                          keyboardType="numeric"
                          value={row.quantity}
                          onChangeText={value => {
                            const qty = technician ? value.replace(/[^0-9]/g, '') : value;
                            setServiceRows(prev =>
                              prev.map(r => {
                                if (r.id !== row.id) {
                                  return r;
                                }
                                // Java (technician): price = qty x master price.
                                const master = masterServicePrice(r.serviceTypeId);
                                return technician && qty && r.serviceTypeId
                                  ? {...r, quantity: qty, price: String(Number(qty) * master)}
                                  : {...r, quantity: qty};
                              }),
                            );
                          }}
                        />
                        <TextInput
                          style={[styles.pillInput, styles.thirdInput]}
                          placeholder="Price"
                          placeholderTextColor="#9aa0a6"
                          keyboardType="decimal-pad"
                          value={row.price}
                          onChangeText={value =>
                            setServiceRows(prev =>
                              prev.map(r => (r.id === row.id ? {...r, price: sanitizeDecimalInput(value)} : r)),
                            )
                          }
                        />
                      </View>
                    </View>
                  ))
                : null}

              {activeSection === 'service' ? (
                <TouchableOpacity onPress={addServiceRow} style={styles.addMoreButton}>
                  <Text style={styles.addMoreText}>+ Add More</Text>
                </TouchableOpacity>
              ) : null}

              {activeSection === 'items'
                ? itemRows.map((row, index) => (
                    <View key={row.id} style={styles.rowCard}>
                      <View style={styles.rowCardHeader}>
                        <Text style={styles.rowCardTitle}>Item #{index + 1}</Text>
                        {itemRows.length > 1 ? (
                          <TouchableOpacity onPress={() => removeItemRow(row.id)} hitSlop={10}>
                            <Text style={styles.rowCardRemove}>{'\u2715'}</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                      <View style={styles.rowCardFields}>
                        {renderItemDropdown(row)}
                        <TextInput
                          style={[styles.pillInput, styles.thirdInput]}
                          placeholder="Qty"
                          placeholderTextColor="#9aa0a6"
                          keyboardType="numeric"
                          value={row.quantity}
                          onChangeText={value =>
                            setItemRows(prev => prev.map(r => (r.id === row.id ? {...r, quantity: value} : r)))
                          }
                        />
                        <TextInput
                          style={[styles.pillInput, styles.thirdInput]}
                          placeholder="Price"
                          placeholderTextColor="#9aa0a6"
                          keyboardType="decimal-pad"
                          value={row.price}
                          onChangeText={value =>
                            setItemRows(prev => prev.map(r => (r.id === row.id ? {...r, price: sanitizeDecimalInput(value)} : r)))
                          }
                        />
                      </View>
                    </View>
                  ))
                : null}

              {activeSection === 'items' ? (
                <TouchableOpacity onPress={addItemRow} style={styles.addMoreButton}>
                  <Text style={styles.addMoreText}>+ Add More</Text>
                </TouchableOpacity>
              ) : null}

              {activeSection === 'discount' ? (
                <View>
                  <TextInput
                    style={styles.pillInput}
                    placeholder="Discount %"
                    placeholderTextColor="#9aa0a6"
                    keyboardType="decimal-pad"
                    value={discountPercent}
                    onChangeText={t =>
                      // Java's technician discount is a whole number (Integer.parseInt).
                      setDiscountPercent(technician ? t.replace(/[^0-9]/g, '') : sanitizeDecimalInput(t))
                    }
                  />
                  <View style={styles.fieldRow}>
                    {([
                      [0, 'Select Tax'],
                      [1, 'With Tax'],
                      [2, 'Without Tax'],
                    ] as const).map(([taxModeOption, label]) => (
                      <TouchableOpacity
                        key={taxModeOption}
                        style={[
                          styles.pillInput,
                          styles.halfInput,
                          taxMode === taxModeOption ? {borderColor: '#c3002f'} : null,
                        ]}
                        onPress={() => {
                          setTaxMode(taxModeOption);
                          if (taxModeOption !== 1) {
                            setTaxPercent('');
                            setTaxName('');
                          }
                        }}>
                        <Text style={{color: taxMode === taxModeOption ? '#c3002f' : '#555'}}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {taxMode === 1 ? (
                    <TouchableOpacity style={styles.pillInput} onPress={openTaxPicker}>
                      <Text style={{color: taxName ? '#222' : '#9aa0a6'}}>
                        {taxName ? `${taxName}: ${taxPercent}%` : 'Select Tax Percentage'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              <Text style={styles.extraLabel}>Extra</Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={[styles.pillInput, styles.halfInput]}
                  placeholder="Name"
                  placeholderTextColor="#9aa0a6"
                  value={extraName}
                  onChangeText={setExtraName}
                />
                <TextInput
                  style={[styles.pillInput, styles.halfInput]}
                  placeholder="Price"
                  placeholderTextColor="#9aa0a6"
                  keyboardType="decimal-pad"
                  value={extraPrice}
                  onChangeText={t => setExtraPrice(sanitizeDecimalInput(t))}
                />
              </View>

              {/* Attach File exists only on dialog_add_quote.xml; dialog_add_invoice.xml has none. */}
              {/* {isInvoice ? null : (
                <>
                  <Text style={styles.extraLabel}>Attach File</Text>
                  <TouchableOpacity style={styles.attachBox} onPress={handlePickAttachment}>
                    <Text style={styles.attachBoxText} numberOfLines={2}>
                      {attachedFileName ||
                        'Choose .pdf, .jpeg, .jpg, .png, .xlsx, .txt, .zip, etc. max file size is 6 MB'}
                    </Text>
                  </TouchableOpacity>
                </>
              )} */}

              <TextInput
                style={[styles.pillInput, styles.termInput]}
                placeholder="Terms & Condition"
                placeholderTextColor="#9aa0a6"
                value={termCondition}
                onChangeText={setTermCondition}
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleSave()}
                disabled={isSubmitting}>
                <Text style={styles.saveButtonText}>
                  {isSubmitting ? 'SAVING...' : 'SAVE & VIEW'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>

      <SearchPickerModal
        visible={isTaxPickerOpen}
        title="Select Tax"
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
        title="Payment Transaction Type"
        options={paymentTypes}
        loading={isLoadingPaymentTypes}
        emptyText="No payment types found."
        onSelect={option => {
          setSelectedPaymentType(option);
          setIsPaymentTypePickerOpen(false);
        }}
        onClose={() => setIsPaymentTypePickerOpen(false)}
      />

      {datePickerField && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade" onRequestClose={() => setDatePickerField(null)}>
            <Pressable style={styles.dateBackdrop} onPress={() => setDatePickerField(null)}>
              <Pressable style={styles.dateSheet} onPress={e => e.stopPropagation()}>
                <Text style={styles.dateSheetTitle}>Select Date</Text>
                <DateTimePicker
                  value={datePickerValue}
                  mode="date"
                  display="inline"
                  onChange={(_: DateTimePickerChangeEvent, date?: Date) => {
                    if (date) setDatePickerValue(date);
                  }}
                  themeVariant="light"
                  accentColor={COLORS.primary}
                />
                <View style={styles.dateSheetActions}>
                  <TouchableOpacity style={styles.dateCancelBtn} onPress={() => setDatePickerField(null)}>
                    <Text style={styles.dateCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateConfirmBtn}
                    onPress={() => {
                      applyPickedDate(datePickerValue);
                      setDatePickerField(null);
                    }}>
                    <Text style={styles.dateConfirmText}>Confirm</Text>
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
            onChange={(event: DateTimePickerChangeEvent, date?: Date) => {
              const e = event as any;
              if (e.type === 'set' && date) applyPickedDate(date);
              setDatePickerField(null);
            }}
            positiveButton={{label: 'OK', textColor: COLORS.primary}}
            negativeButton={{label: 'CANCEL', textColor: COLORS.primary}}
          />
        )
      )}

      <Modal
        visible={isPreviewOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsPreviewOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <ScrollView contentContainerStyle={{padding: ms(16)}}>
              <Text style={styles.extraLabel}>Quote Preview</Text>
              <Text>{quoteName.trim()}</Text>
              <Text>
                {quoteDate} → {validityDate.trim()}
              </Text>
              <Text>
                {customerName.trim()} · {phoneNumber.trim()}
              </Text>
              <Text>{address.trim()}</Text>
              {serviceRows
                .filter(row => row.serviceTypeId)
                .map(row => (
                  <Text key={row.id}>
                    {row.serviceTypeName} × {Number(row.quantity) || 1} {technician ? '=' : '@'} {Number(row.price) || 0}
                  </Text>
                ))}
              {itemRows
                .filter(row => row.itemId)
                .map(row => (
                  <Text key={row.id}>
                    {row.itemName} × {Number(row.quantity) || 1} @ {Number(row.price) || 0}
                  </Text>
                ))}
              {extraName.trim() ? (
                <Text>
                  {extraName.trim()}: {extraTotal}
                </Text>
              ) : null}
              <Text>Discount: {Number(discountPercent) || 0}%</Text>
              <Text>
                Tax: {taxMode === 1 ? `${taxName} ${Number(taxPercent) || 0}%` : taxMode === 2 ? 'Without Tax' : '-'}
              </Text>
              <Text style={styles.extraLabel}>Total: {formatAmount(grandTotal)}</Text>
              {isInvoice ? (
                <View>
                  <TextInput
                    style={styles.pillInput}
                    placeholder="Amount Received"
                    placeholderTextColor="#9aa0a6"
                    keyboardType="decimal-pad"
                    value={receivedAmount}
                    onChangeText={t => setReceivedAmount(sanitizeDecimalInput(t))}
                  />
                  <TouchableOpacity style={styles.pillInput} onPress={openPaymentTypePicker}>
                    <Text style={{color: selectedPaymentType ? '#222' : '#9aa0a6'}}>
                      {selectedPaymentType ? selectedPaymentType.label : 'Select Payment Transaction Type'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  setIsPreviewOpen(false);
                  handleSave(true);
                }}
                disabled={isSubmitting}>
                <Text style={styles.saveButtonText}>SAVE</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsPreviewOpen(false)}>
                <Text style={styles.cancelText}>Back</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    borderRadius: ms(10),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: HEADER_DARK,
    paddingHorizontal: ms(18),
    paddingVertical: ms(16),
    borderRadius: ms(10),
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: sp(17),
    fontWeight: '700',
  },
  headerClose: {
    color: '#FFFFFF',
    fontSize: sp(18),
  },
  flexShrink: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: ms(16),
    paddingBottom: ms(30),
  },
  fieldRow: {
    flexDirection: 'row',
    gap: ms(12),
    marginBottom: ms(14),
  },
  halfInput: {
    flex: 1,
  },
  thirdInput: {
    flex: 1,
  },
  pillInput: {
    borderWidth: ms(1),
    borderColor: BORDER,
    borderRadius: ms(24),
    paddingHorizontal: ms(16),
    height: ms(46),
    fontSize: sp(13),
    color: '#222',
    marginBottom: ms(14),
  },
  termInput: {
    marginTop: ms(4),
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
    borderRadius: ms(20),
    overflow: 'hidden',
    marginBottom: ms(16),
    borderWidth: 1,
    borderColor: SEGMENT_DARK,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(12),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: SEGMENT_DARK,
  },
  segmentButtonActive: {
    backgroundColor: SEGMENT_DARK,
  },
  segmentButtonText: {
    fontSize: sp(12),
    fontWeight: '700',
    color: SEGMENT_DARK,
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  rowCard: {
    borderWidth: ms(1),
    borderColor: '#eceef0',
    borderRadius: ms(10),
    padding: ms(14),
    marginBottom: ms(12),
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
    marginBottom: ms(12),
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
  dropdownWrap: {
    flex: 2,
    position: 'relative',
    zIndex: 5,
  },
  dropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: ms(1),
    borderColor: BORDER,
    borderRadius: ms(24),
    paddingHorizontal: ms(14),
    height: ms(46),
  },
  dropdownPlaceholderText: {
    fontSize: sp(12),
    color: '#9aa0a6',
    flex: 1,
  },
  dropdownValueText: {
    fontSize: sp(12),
    color: '#222',
    flex: 1,
  },
  dropdownChevron: {
    fontSize: sp(14),
    color: '#8a8f98',
    marginLeft: ms(6),
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
    marginBottom: ms(18),
  },
  addMoreText: {
    color: RED,
    fontWeight: '700',
    fontSize: sp(13),
  },
  extraLabel: {
    fontSize: sp(13),
    fontWeight: '700',
    color: '#222',
    marginBottom: ms(10),
  },
  attachBox: {
    borderWidth: ms(1),
    borderStyle: 'dashed',
    borderColor: '#c7c9cc',
    borderRadius: ms(6),
    paddingHorizontal: ms(14),
    paddingVertical: ms(16),
    marginBottom: ms(18),
  },
  attachBoxText: {
    fontSize: sp(12),
    color: '#9aa0a6',
  },
  saveButton: {
    backgroundColor: SEGMENT_DARK,
    borderRadius: ms(24),
    height: ms(50),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ms(6),
    marginBottom: ms(16),
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: sp(14),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cancelText: {
    color: RED,
    fontSize: sp(14),
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default AddQuoteModal;