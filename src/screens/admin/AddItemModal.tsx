// src/screens/admin/AddItemModal.tsx

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ms, sp} from '../../utils/responsive';
import {ensureSuccess} from '../../utils/apiResponse';
import {sanitizeDecimalInput} from '../../utils/decimal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import SearchPickerModal from '../../components/SearchPickerModal';
import {
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';
import { launchCameraWithPermission } from '../../utils/cameraPermission';
import {addItem, editItem, getItemGroup, getItemUnitType} from '../../api/item/itemService';
import type {AddItem, ItemUnitTypeResultData} from '../../api/item/item.types';
import {
  THEME_PRIMARY,
  getNumberField,
  getStringField,
  styles as sharedStyles,
} from './crmShared';
import {taskStyles} from './AddTaskModal';
import OutlinedInput from '../../components/OutlinedInput';
import {QuoteIcon} from '../../components/FabIcons';
import {COLORS} from '../../theme/theme';
import {requestLocationPermission} from '../../utils/locationPermision';
import { showFailureMsg, showSuccessMsg, showToast } from '../../utils/toast';

// Same Java dialog sheet / header / outlined-field metrics as the Add Task form.
const styles = {...sharedStyles, ...taskStyles};

type AddItemModalProps = {
  visible: boolean;
  onClose: () => void;
  ownerId: number;
  /** Edit an existing inventory item (Java's updateItemEditDialog). */
  item?: Record<string, unknown> | null;
  onSaved?: () => void;
};

type LookupOption = {
  id: number;
  name: string;
};

const normalizeItemUnitOption = (item: ItemUnitTypeResultData): LookupOption => {
  const record = item as Record<string, unknown>;
  return {
    id: getNumberField(record, [
      'itemUnitTypeId',
      'ItemUnitTypeId',
      'itemUnitTypeID',
      'ItemUnitTypeID',
      'unitTypeId',
      'UnitTypeId',
      'unitTypeID',
      'UnitTypeID',
      'unitId',
      'UnitId',
      'unitID',
      'UnitID',
      'id',
      'Id',
      'ID',
    ]),
    name: getStringField(record, [
      'itemUnitTypeName',
      'ItemUnitTypeName',
      'unitTypeName',
      'UnitTypeName',
      'unitName',
      'UnitName',
      'unitType',
      'UnitType',
      'unit',
      'Unit',
      'name',
      'Name',
      'title',
      'Title',
      'description',
      'Description',
    ]),
  };
};

type PickedImage = {
  uri: string;
  base64: string;
  fileName: string;
};

const AddItemModal: React.FC<AddItemModalProps> = ({
  visible,
  onClose,
  ownerId,
  item = null,
  onSaved,
}) => {
  const isEditMode = item !== null;
  const [itemName, setItemName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [serialNo, setSerialNo] = useState('');
  // Java uses dialog_update_edit_item_new for edits: title 'Update Quantity for <name>',
  // no Item Name or Serial No inputs.
  const modalTitle = isEditMode ? `Update Quantity for ${itemName}` : 'Add Item';
  const [hsnCode, setHsnCode] = useState('');

  const [itemGroups, setItemGroups] = useState<LookupOption[]>([]);
  const [isItemGroupLoading, setIsItemGroupLoading] = useState(false);
  const [itemGroupError, setItemGroupError] = useState('');
  const [isItemGroupModalOpen, setIsItemGroupModalOpen] = useState(false);
  const [selectedItemGroup, setSelectedItemGroup] =
    useState<LookupOption | null>(null);

  const [quantity, setQuantity] = useState('0');

  const [itemUnits, setItemUnits] = useState<LookupOption[]>([]);
  const [isItemUnitLoading, setIsItemUnitLoading] = useState(false);
  const [itemUnitError, setItemUnitError] = useState('');
  const [isItemUnitModalOpen, setIsItemUnitModalOpen] = useState(false);
  const [selectedItemUnit, setSelectedItemUnit] =
    useState<LookupOption | null>(null);

  const [purchasePrice, setPurchasePrice] = useState('');
  const [salesPrice, setSalesPrice] = useState('');
  const [description, setDescription] = useState('');

  const [itemImage, setItemImage] = useState<PickedImage | null>(null);
  const [itemImageBase64, setItemImageBase64] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Source: OwnerItemInventoryFragmentNew.getLastLocation() / ItemInventoryFragment.getLastLocation()
  // — both request location permission as soon as the item-inventory screen loads. Primed here the
  // same way, on modal open, ahead of any inventory-location field this form grows later.
  useEffect(() => {
    if (visible) {
      requestLocationPermission();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !item) {
      return;
    }
    const record = item as Record<string, unknown>;
    setItemName(getStringField(record, ['name', 'Name', 'itemName', 'ItemName']));
    setItemCode(getStringField(record, ['serialNumber', 'SerialNumber', 'itemCode', 'ItemCode']));
    setHsnCode(getStringField(record, ['hsnCode', 'HSNCode']));
    const groupName = getStringField(record, ['itemGroupName', 'ItemGroupName']);
    setSelectedItemGroup(
      groupName
        ? {id: getNumberField(record, ['itemGroupId', 'ItemGroupId']), name: groupName}
        : null,
    );
    setQuantity(String(getNumberField(record, ['quantity', 'Quantity', 'unAssignedQuantity', 'UnAssignedQuantity'])));
    const unitName = getStringField(record, ['itemUnitTypeName', 'ItemUnitTypeName', 'unitName', 'UnitName']);
    setSelectedItemUnit(
      unitName
        ? {id: getNumberField(record, ['itemUnitTypeId', 'ItemUnitTypeId']), name: unitName}
        : null,
    );
    setPurchasePrice(String(getNumberField(record, ['purchasePrice', 'PurchasePrice'])));
    setSalesPrice(String(getNumberField(record, ['salesPrice', 'SalesPrice'])));
    setDescription(getStringField(record, ['description', 'Description']));
    setItemImage(null);
    setItemImageBase64('');
  }, [visible, item]);

  const resetForm = () => {
    setItemName('');
    setItemCode('');
    setSerialNo('');
    setHsnCode('');
    setSelectedItemGroup(null);
    setQuantity('0');
    setSelectedItemUnit(null);
    setPurchasePrice('');
    setSalesPrice('');
    setDescription('');
    setItemImage(null);
    setItemImageBase64('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const loadItemGroups = useCallback(() => {
    if (itemGroups.length > 0 || isItemGroupLoading) {
      return;
    }
    setIsItemGroupLoading(true);
    setItemGroupError('');
    getItemGroup({userId: ownerId})
      .then(response => {
        const rows = Array.isArray(response?.ResultData) ? response.ResultData : [];
        const options = rows
          .map(row => ({
            id: Number(row.ItemGroupId) || 0,
            name: String(row.ItemGroupName ?? '').trim(),
          }))
          .filter(option => option.name);
        setItemGroups(options);
        if (options.length === 0) {
          setItemGroupError('No item groups found.');
        }
      })
      .catch(error => {
        setItemGroups([]);
        setItemGroupError(
          error instanceof Error ? error.message : 'Unable to load item groups.',
        );
      })
      .finally(() => setIsItemGroupLoading(false));
  }, [isItemGroupLoading, itemGroups.length, ownerId]);

  const loadItemUnits = useCallback(() => {
    if (itemUnits.length > 0 || isItemUnitLoading) {
      return;
    }
    setIsItemUnitLoading(true);
    setItemUnitError('');
    getItemUnitType({UserId: ownerId})
      .then(response => {
        const items = response.ResultData ?? [];
        const options = items
          .map(normalizeItemUnitOption)
          .filter(option => option.name);
        setItemUnits(options);
        if (items.length === 0) {
          setItemUnitError('No units found.');
        } else if (options.length === 0) {
          setItemUnitError('Unable to read unit names from server.');
        }
      })
      .catch(error => {
        setItemUnits([]);
        setItemUnitError(
          error instanceof Error
            ? error.message
            : 'Unable to load units right now.',
        );
      })
      .finally(() => setIsItemUnitLoading(false));
  }, [isItemUnitLoading, itemUnits.length, ownerId]);


  const applyPickedImage = (asset: Asset) => {
    if (!asset.base64 || !asset.uri) {
      showToast('Unable to read the selected image. Please try again.');
      return;
    }
    const picked: PickedImage = {
      uri: asset.uri,
      base64: asset.base64,
      fileName: asset.fileName || `item_${Date.now()}.jpg`,
    };
    setItemImage(picked);
    setItemImageBase64(asset.base64);
  };

  const captureImageFromCamera = async () => {
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
      showToast(result.errorMessage || 'Unable to open camera.');
      return;
    }
    const asset = result.assets?.[0];
    if (asset) {
      applyPickedImage(asset);
    }
  };

  const pickImageFromGallery = async () => {
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
      showToast(result.errorMessage || 'Unable to open gallery.');
      return;
    }
    const asset = result.assets?.[0];
    if (asset) {
      applyPickedImage(asset);
    }
  };

  const handleImageBoxPress = () => {
    Alert.alert('Add/Capture Image', 'Choose an option', [
      {text: 'Camera', onPress: () => captureImageFromCamera()},
      {text: 'Gallery', onPress: () => pickImageFromGallery()},
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const handleQuantityIncrement = () => {
    setQuantity(previous => String((Number(previous) || 0) + 1));
  };

  const handleQuantityDecrement = () => {
    setQuantity(previous => String(Math.max(0, (Number(previous) || 0) - 1)));
  };

  const handleAddItemSubmit = async () => {
    if (!itemName.trim()) {
      showFailureMsg('Please enter item name.');
      return;
    }

    if (isEditMode) {
      const itemId = getNumberField(item as Record<string, unknown>, ['id', 'Id', 'itemId', 'ItemId']);
      const purchase = Number(purchasePrice) || 0;
      const sales = Number(salesPrice) || 0;
      // Java's edit dialog blocks saving when sales price < purchase price.
      if (sales < purchase) {
        showFailureMsg('Sales price should be greater than or equal to purchase price.');
        return;
      }
      setIsSubmitting(true);
      try {
        ensureSuccess(
          await editItem({
            Id: itemId,
            Name: itemName.trim(),
            SerialNumber: itemCode.trim(),
            HSNCode: hsnCode.trim(),
            ItemGroupId: selectedItemGroup?.id || 0,
            ItemGroupName: selectedItemGroup?.name || '',
            Quantity: Number(quantity) || 0,
            ItemUnitTypeId: selectedItemUnit?.id || 0,
            PurchasePrice: purchase,
            SalesPrice: sales,
            Description: description.trim() || 'NA',
            ImageFileBase64Str: itemImageBase64,
            ImageFileName: itemImage?.fileName || '',
            ItemType: 1,
            CreatedBy: ownerId,
            UpdatedBy: ownerId,
          } as unknown as Parameters<typeof editItem>[0]),
        );
        showSuccessMsg('Item updated successfully.');
        resetForm();
        onSaved?.();
        onClose();
      } catch (error) {
        showFailureMsg(error instanceof Error ? error.message : 'Unable to update item right now.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // NOTE: SerialNumber, HSNCode, ItemGroupId, and ItemGroupName aren't part of
    // the generated AddItemResultdata DTO (item group isn't a confirmed real
    // feature — see loadItemGroups above). Keeping them here since the old
    // Api.ts sent them and dropping them could lose data the backend still
    // accepts; this should be verified against the live API contract.
    const payload = {
      Id: 0,
      Name: itemName.trim(),
      SerialNumber: itemCode.trim(),
      SerialNoValue: serialNo.trim(),
      HSNCode: hsnCode.trim(),
      ItemGroupId: selectedItemGroup?.id || 0,
      ItemGroupName: selectedItemGroup?.name || '',
      Quantity: Number(quantity) || 0,
      ItemUnitTypeId: selectedItemUnit?.id || 0,
      PurchasePrice: purchasePrice.trim() || '0',
      SalesPrice: salesPrice.trim() || '0',
      Description: description.trim(),
      ImageFileBase64Str: itemImageBase64,
      ImageFileName: itemImage?.fileName || '',
      ItemType: 1,
      IsModelError: true,
      IsSuccessful: true,
      CreatedBy: ownerId,
      UpdatedBy: ownerId,
    };

    setIsSubmitting(true);
    try {
      ensureSuccess(await addItem(payload as Partial<AddItem>));
      showSuccessMsg('Item added successfully.');
      resetForm();
      onSaved?.();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to add item right now.';
      showFailureMsg(message || 'Add Item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>{modalTitle}</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" style={styles.modalCloseIcon} />
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
                {isEditMode ? null : (
                  <View style={styles.fieldWrap}>
                    <OutlinedInput
                      style={styles.pillInput}
                      placeholder="Item Name"
                      placeholderTextColor={COLORS.lightGray}
                      value={itemName}
                      onChangeText={setItemName}
                      maxLength={20}
                    />
                  </View>
                )}

                <View style={styles.fieldRow}>
                  <OutlinedInput
                    style={[styles.pillInput, itemStyles.halfInput]}
                    placeholder="Item Code"
                    placeholderTextColor={COLORS.lightGray}
                    value={itemCode}
                    onChangeText={setItemCode}
                    autoCapitalize="characters"
                    maxLength={30}
                  />
                  <OutlinedInput
                    style={[styles.pillInput, itemStyles.halfInput]}
                    placeholder="HSN Code"
                    placeholderTextColor={COLORS.lightGray}
                    value={hsnCode}
                    onChangeText={setHsnCode}
                    autoCapitalize="characters"
                    maxLength={30}
                  />
                </View>

                <TouchableOpacity
                  style={styles.dropdownPill}
                  onPress={() => {
                    loadItemGroups();
                    setIsItemGroupModalOpen(true);
                  }}
                >
                  <Text
                    style={
                      selectedItemGroup
                        ? styles.dropdownPillTextValue
                        : styles.dropdownPillTextPlaceholder
                    }
                    numberOfLines={1}
                  >
                    {selectedItemGroup
                      ? selectedItemGroup.name
                      : 'Select Item Group'}
                  </Text>
                  <Ionicons name="chevron-down" style={styles.dropdownChevron} />
                </TouchableOpacity>

                <View style={itemStyles.labelRow}>
                  <Text style={itemStyles.blockLabel}>Quantity</Text>
                  <Text style={itemStyles.blockLabel}>Unit</Text>
                </View>
                <View style={styles.fieldRow}>
                  {/* dialog_add_item: rounded_border stepper; the "-" TextView is clipped to an
                      invisible tap area at the left, the "+" sits at the right. */}
                  <View style={itemStyles.quantityPill}>
                    <TouchableOpacity
                      style={itemStyles.quantityMinusArea}
                      onPress={handleQuantityDecrement}
                    />
                    <TextInput
                      style={itemStyles.quantityInput}
                      keyboardType="numeric"
                      value={quantity}
                      onChangeText={setQuantity}
                      maxLength={5}
                    />
                    <TouchableOpacity
                      style={itemStyles.quantityPlusArea}
                      onPress={handleQuantityIncrement}
                    >
                      <Text style={itemStyles.quantityPlusText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.dropdownPill,
                      itemStyles.unitDropdown,
                    ]}
                    onPress={() => {
                      loadItemUnits();
                      setIsItemUnitModalOpen(true);
                    }}
                  >
                    <Text
                      style={
                        selectedItemUnit
                          ? styles.dropdownPillTextValue
                          : styles.dropdownPillTextPlaceholder
                      }
                      numberOfLines={1}
                    >
                      {selectedItemUnit ? selectedItemUnit.name : 'Select Unit'}
                    </Text>
                    <Ionicons name="chevron-down" style={styles.dropdownChevron} />
                  </TouchableOpacity>
                </View>

                {isEditMode ? null : (
                  <View style={styles.fieldRow}>
                    <OutlinedInput
                      style={[styles.pillInput, itemStyles.halfInput]}
                      placeholder="Serial No"
                      placeholderTextColor={COLORS.lightGray}
                      value={serialNo}
                      onChangeText={setSerialNo}
                      autoCapitalize="characters"
                      maxLength={30}
                    />
                    <View style={itemStyles.halfInput} />
                  </View>
                )}

                <View style={styles.fieldRow}>
                  <OutlinedInput
                    style={[styles.pillInput, itemStyles.halfInput]}
                    placeholder="Purchase Price"
                    placeholderTextColor={COLORS.lightGray}
                    keyboardType="decimal-pad"
                    value={purchasePrice}
                    onChangeText={t => setPurchasePrice(sanitizeDecimalInput(t))}
                    maxLength={10}
                  />
                  <OutlinedInput
                    style={[styles.pillInput, itemStyles.halfInput]}
                    placeholder="Sales Price"
                    placeholderTextColor={COLORS.lightGray}
                    keyboardType="decimal-pad"
                    value={salesPrice}
                    onChangeText={t => setSalesPrice(sanitizeDecimalInput(t))}
                    maxLength={10}
                  />
                </View>

                <TouchableOpacity
                  style={itemStyles.imageBox}
                  onPress={handleImageBoxPress}
                >
                  {itemImage ? (
                    <Image
                      source={{uri: itemImage.uri}}
                      style={styles.photoPreview}
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="image-outline"
                        size={ms(40)}
                        color={COLORS.lightGray}
                      />
                      <Text style={itemStyles.imageBoxText}>
                        Add/Capture Image
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.fieldWrap}>
                  <OutlinedInput
                    style={styles.pillInput}
                    placeholder="Description"
                    placeholderTextColor={COLORS.lightGray}
                    value={description}
                    onChangeText={setDescription}
                    maxLength={60}
                  />
                </View>

                <TouchableOpacity
                  style={itemStyles.addButton}
                  onPress={handleAddItemSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <View style={styles.addButtonIconWrap}>
                        <QuoteIcon size={ms(30)} color="#FFFFFF" />
                      </View>
                      <Text style={styles.darkAddButtonText}>
                        {isEditMode ? 'UPDATE' : 'ADD'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>

      {/* Java ItemDialog: dialog_searchable_itemgroup / _spinner_unit -- the shared dialog. */}
      <SearchPickerModal
        visible={isItemGroupModalOpen}
        title="Select Item Group"
        wrapContent
        options={itemGroups.map(option => ({id: option.id, label: option.name}))}
        loading={isItemGroupLoading}
        emptyText={itemGroupError || 'No item groups found.'}
        onSelect={picked => {
          const option = itemGroups.find(o => o.id === picked.id);
          if (option) {
            setSelectedItemGroup(option);
          }
          setIsItemGroupModalOpen(false);
        }}
        onClose={() => setIsItemGroupModalOpen(false)}
      />

      <SearchPickerModal
        visible={isItemUnitModalOpen}
        title="Select Unit"
        wrapContent
        options={itemUnits.map(option => ({id: option.id, label: option.name}))}
        loading={isItemUnitLoading}
        emptyText={itemUnitError || 'No units found.'}
        onSelect={picked => {
          const option = itemUnits.find(o => o.id === picked.id);
          if (option) {
            setSelectedItemUnit(option);
          }
          setIsItemUnitModalOpen(false);
        }}
        onClose={() => setIsItemUnitModalOpen(false)}
      />
    </>
  );
};

const itemStyles = StyleSheet.create({
  halfInput: {
    flex: 1,
  },
  // Quantity / Unit captions above the stepper row (default 14sp TextViews).
  labelRow: {
    flexDirection: 'row',
    gap: ms(10),
    marginBottom: ms(5),
  },
  blockLabel: {
    flex: 1,
    fontSize: sp(14),
    color: COLORS.darkGray,
  },
  // rounded_border: 20dp radius, 1dp light_gray stroke.
  quantityPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: ms(1),
    borderColor: COLORS.lightGray,
    borderRadius: ms(20),
    height: ms(40),
  },
  quantityInput: {
    flex: 1,
    fontSize: sp(16),
    color: COLORS.ink,
    padding: 0,
    textAlign: 'center',
  },
  quantityMinusArea: {
    width: ms(36),
    height: '100%',
  },
  quantityPlusArea: {
    width: ms(36),
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityPlusText: {
    color: '#000000',
    fontSize: sp(24),
  },
  unitDropdown: {
    flex: 1,
    marginBottom: 0,
  },
  // bg_transperent_curveborder: 20dp radius, quantum_grey400 stroke; 100dp tall.
  imageBox: {
    borderWidth: ms(1),
    borderColor: '#BDBDBD',
    borderRadius: ms(20),
    height: ms(100),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ms(10),
    marginBottom: ms(20),
    overflow: 'hidden',
  },
  imageBoxText: {
    fontSize: sp(16),
    color: COLORS.lightGray,
  },
  // button_add: rounded_button (colorPrimaryDark, 34dp radius), ic_additem drawableLeft.
  addButton: {
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
});

export default AddItemModal;
