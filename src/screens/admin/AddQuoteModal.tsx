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
import {launchImageLibrary} from 'react-native-image-picker';
import {getEnquiryServiceTypeList} from '../../api/services/servicesService';
import type {EnquiryServiceTypeDTOResultData} from '../../api/services/services.types';
import {getAllItemAssignedUnassigned} from '../../api/item/itemService';
import type {ItemsListResultData} from '../../api/item/item.types';
import {postQuotationDetails} from '../../api/quotation/quotationService';
import type {
  SaveQuotationDTOQuoteItemList,
  SaveQuotationDTOQuoteServiceList,
  SaveQuotationDTOQuoteTaxList,
} from '../../api/quotation/quotation.types';
import {sp, ms} from '../../utils/responsive';

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
};

const AddQuoteModal = ({visible, ownerId, onClose, onSuccess}: AddQuoteModalProps) => {
  const [quoteName, setQuoteName] = useState('');
  const [quoteDate, setQuoteDate] = useState(getTodayDateString());
  const [validityDate, setValidityDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [buildingFlatNumber, setBuildingFlatNumber] = useState('');
  const [landmark, setLandmark] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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
    setActiveSection('service');
    setServiceRows([{id: makeRowId(), serviceTypeId: null, serviceTypeName: '', quantity: '', price: ''}]);
    setItemRows([{id: makeRowId(), itemId: null, itemName: '', quantity: '', price: ''}]);
    setDiscountPercent('');
    setTaxPercent('');
    setExtraName('');
    setExtraPrice('');
    setTermCondition('');
    setAttachedFileName('');
    setOpenDropdownKey(null);
  }, []);

  const loadServiceTypes = useCallback(async () => {
    setIsLoadingServiceTypes(true);
    try {
      const response = await getEnquiryServiceTypeList({OwnerId: ownerId});
      setServiceTypes(response.ResultData ?? []);
    } catch (error) {
      setServiceTypes([]);
    } finally {
      setIsLoadingServiceTypes(false);
    }
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleClose = () => {
    setOpenDropdownKey(null);
    onClose();
  };

  const addServiceRow = () => {
    setServiceRows(prev => [
      ...prev,
      {id: makeRowId(), serviceTypeId: null, serviceTypeName: '', quantity: '', price: ''},
    ]);
  };

  const removeServiceRow = (id: string) => {
    setServiceRows(prev => (prev.length > 1 ? prev.filter(row => row.id !== id) : prev));
  };

  const addItemRow = () => {
    setItemRows(prev => [...prev, {id: makeRowId(), itemId: null, itemName: '', quantity: '', price: ''}]);
  };

  const removeItemRow = (id: string) => {
    setItemRows(prev => (prev.length > 1 ? prev.filter(row => row.id !== id) : prev));
  };

  const handlePickAttachment = async () => {
    try {
      const result = await launchImageLibrary({mediaType: 'mixed', selectionLimit: 1});
      if (result.didCancel) {
        return;
      }
      if (result.errorCode) {
        Alert.alert('Attach File', result.errorMessage || 'Unable to pick file.');
        return;
      }
      const asset = result.assets?.[0];
      if (asset) {
        setAttachedFileName(asset.fileName || 'Attached file');
      }
    } catch (error) {
      Alert.alert('Attach File', 'Unable to open picker.');
    }
  };

  const serviceTotal = useMemo(
    () =>
      serviceRows.reduce((sum, row) => sum + (Number(row.price) || 0) * (Number(row.quantity) || 1), 0),
    [serviceRows],
  );

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

  const handleSave = async () => {
    if (!quoteName.trim()) {
      Alert.alert('Add Quote', 'Please enter Quote Name.');
      return;
    }
    if (!validityDate.trim()) {
      Alert.alert('Add Quote', 'Please enter Validity Date.');
      return;
    }
    if (!customerName.trim()) {
      Alert.alert('Add Quote', 'Please enter Customer Name.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Add Quote', 'Please enter Address.');
      return;
    }
    if (!landmark.trim()) {
      Alert.alert('Add Quote', 'Please enter Landmark.');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Add Quote', 'Please enter Phone Number.');
      return;
    }

    const quoteServiceList: SaveQuotationServiceRequest[] = serviceRows
      .filter(row => row.serviceTypeId)
      .map(row => ({
        ServiceId: row.serviceTypeId ?? undefined,
        ServiceName: row.serviceTypeName,
        Quantity: Number(row.quantity) || 1,
        Price: Number(row.price) || 0,
      }));

    const quoteItemList: SaveQuotationItemRequest[] = itemRows
      .filter(row => row.itemId)
      .map(row => ({
        ItemId: row.itemId ?? undefined,
        ItemName: row.itemName,
        Quantity: Number(row.quantity) || 1,
        UnitPrice: Number(row.price) || 0,
      }));

    // Java's admin add-quote flow (AddUpdateServiceDialog#addQuote) always sends
    // exactly one QuoteTaxList entry carrying discount % and tax %, even though
    // the UI only exposes one pair of fields — mirror that here instead of
    // dropping the values the user typed.
    const quoteTaxList: SaveQuotationDTOQuoteTaxList[] = [
      {
        Discount: Number(discountPercent) || 0,
        Tax: Number(taxPercent) || 0,
        WithoutTax: Number(taxPercent) > 0 ? 1 : 2,
      },
    ];

    const nowIso = new Date().toISOString().slice(0, 19);

    setIsSubmitting(true);
    try {
      await postQuotationDetails({
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
      });

      Alert.alert('Add Quote', 'Quote saved successfully.');
      onSuccess?.();
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save quote.';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                      setServiceRows(prev =>
                        prev.map(r =>
                          r.id === row.id
                            ? {...r, serviceTypeId: typeId, serviceTypeName: typeName}
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
            <Text style={styles.headerTitle}>Add Quote</Text>
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
                placeholder="Quote Name *"
                placeholderTextColor="#9aa0a6"
                value={quoteName}
                onChangeText={setQuoteName}
              />

              <View style={styles.fieldRow}>
                <View style={styles.floatingFieldHalf}>
                  <Text style={styles.floatingLabel}>Quote Date*</Text>
                  <TextInput
                    style={styles.floatingInput}
                    value={quoteDate}
                    onChangeText={setQuoteDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9aa0a6"
                  />
                </View>
                <TextInput
                  style={[styles.pillInput, styles.halfInput]}
                  placeholder="Validity Date*"
                  placeholderTextColor="#9aa0a6"
                  value={validityDate}
                  onChangeText={setValidityDate}
                />
              </View>

              <TextInput
                style={styles.pillInput}
                placeholder="Customer Name *"
                placeholderTextColor="#9aa0a6"
                value={customerName}
                onChangeText={setCustomerName}
              />

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
                  onChangeText={setPhoneNumber}
                />
              </View>

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
                          onChangeText={value =>
                            setServiceRows(prev =>
                              prev.map(r => (r.id === row.id ? {...r, quantity: value} : r)),
                            )
                          }
                        />
                        <TextInput
                          style={[styles.pillInput, styles.thirdInput]}
                          placeholder="Price"
                          placeholderTextColor="#9aa0a6"
                          keyboardType="numeric"
                          value={row.price}
                          onChangeText={value =>
                            setServiceRows(prev =>
                              prev.map(r => (r.id === row.id ? {...r, price: value} : r)),
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
                          keyboardType="numeric"
                          value={row.price}
                          onChangeText={value =>
                            setItemRows(prev => prev.map(r => (r.id === row.id ? {...r, price: value} : r)))
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
                <View style={styles.fieldRow}>
                  <TextInput
                    style={[styles.pillInput, styles.halfInput]}
                    placeholder="Discount (%)"
                    placeholderTextColor="#9aa0a6"
                    keyboardType="numeric"
                    value={discountPercent}
                    onChangeText={setDiscountPercent}
                  />
                  <TextInput
                    style={[styles.pillInput, styles.halfInput]}
                    placeholder="Tax (%)"
                    placeholderTextColor="#9aa0a6"
                    keyboardType="numeric"
                    value={taxPercent}
                    onChangeText={setTaxPercent}
                  />
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
                  keyboardType="numeric"
                  value={extraPrice}
                  onChangeText={setExtraPrice}
                />
              </View>

              <Text style={styles.extraLabel}>Attach File</Text>
              <TouchableOpacity style={styles.attachBox} onPress={handlePickAttachment}>
                <Text style={styles.attachBoxText} numberOfLines={2}>
                  {attachedFileName ||
                    'Choose .pdf, .jpeg, .jpg, .png, .xlsx, .txt, .zip, etc. max file size is 6 MB'}
                </Text>
              </TouchableOpacity>

              <TextInput
                style={[styles.pillInput, styles.termInput]}
                placeholder="Terms & Condition"
                placeholderTextColor="#9aa0a6"
                value={termCondition}
                onChangeText={setTermCondition}
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
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
  floatingFieldHalf: {
    flex: 1,
    borderWidth: ms(1),
    borderColor: BORDER,
    borderRadius: ms(24),
    paddingHorizontal: ms(16),
    paddingTop: ms(6),
    paddingBottom: ms(6),
    justifyContent: 'center',
  },
  floatingLabel: {
    fontSize: sp(10),
    color: '#8a8f98',
    marginBottom: ms(2),
  },
  floatingInput: {
    fontSize: sp(13),
    color: '#222',
    padding: 0,
    height: ms(20),
  },
  segmentRow: {
    flexDirection: 'row',
    borderRadius: ms(20),
    overflow: 'hidden',
    marginBottom: ms(16),
    borderWidth: ms(1),
    borderColor: SEGMENT_DARK,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(12),
    backgroundColor: '#FFFFFF',
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