import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';
import {
  type AddItemRequest,
  type ItemGroupItem,
  type ItemGroupListResponse,
  type ItemUnitTypeItem,
  type ItemUnitTypeListResponse,
  touchlessApi,
} from '../api/Api';
import {
  THEME_PRIMARY,
  extractArray,
  getNumberField,
  getStringField,
  styles,
} from './CRMScreen';

type AddItemModalProps = {
  visible: boolean;
  onClose: () => void;
  ownerId: number;
};

type LookupOption = {
  id: number;
  name: string;
};

const normalizeItemGroupOption = (item: ItemGroupItem): LookupOption => {
  const record = item as Record<string, unknown>;
  return {
    id: getNumberField(record, [
      'itemGroupId',
      'ItemGroupId',
      'itemGroupID',
      'ItemGroupID',
      'groupId',
      'GroupId',
      'groupID',
      'GroupID',
      'id',
      'Id',
      'ID',
    ]),
    name: getStringField(record, [
      'itemGroupName',
      'ItemGroupName',
      'groupName',
      'GroupName',
      'name',
      'Name',
      'title',
      'Title',
      'description',
      'Description',
    ]),
  };
};

const normalizeItemUnitOption = (item: ItemUnitTypeItem): LookupOption => {
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
}) => {
  const [itemName, setItemName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [hsnCode, setHsnCode] = useState('');

  const [itemGroups, setItemGroups] = useState<LookupOption[]>([]);
  const [isItemGroupLoading, setIsItemGroupLoading] = useState(false);
  const [itemGroupError, setItemGroupError] = useState('');
  const [isItemGroupModalOpen, setIsItemGroupModalOpen] = useState(false);
  const [itemGroupSearch, setItemGroupSearch] = useState('');
  const [selectedItemGroup, setSelectedItemGroup] =
    useState<LookupOption | null>(null);

  const [quantity, setQuantity] = useState('0');

  const [itemUnits, setItemUnits] = useState<LookupOption[]>([]);
  const [isItemUnitLoading, setIsItemUnitLoading] = useState(false);
  const [itemUnitError, setItemUnitError] = useState('');
  const [isItemUnitModalOpen, setIsItemUnitModalOpen] = useState(false);
  const [itemUnitSearch, setItemUnitSearch] = useState('');
  const [selectedItemUnit, setSelectedItemUnit] =
    useState<LookupOption | null>(null);

  const [purchasePrice, setPurchasePrice] = useState('');
  const [salesPrice, setSalesPrice] = useState('');
  const [description, setDescription] = useState('');

  const [itemImage, setItemImage] = useState<PickedImage | null>(null);
  const [itemImageBase64, setItemImageBase64] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setItemName('');
    setItemCode('');
    setHsnCode('');
    setSelectedItemGroup(null);
    setItemGroupSearch('');
    setQuantity('0');
    setSelectedItemUnit(null);
    setItemUnitSearch('');
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
    touchlessApi
      .getItemGroupList<ItemGroupListResponse>({ownerId})
      .then(response => {
        const items = extractArray<ItemGroupItem>(response);
        const options = items
          .map(normalizeItemGroupOption)
          .filter(option => option.name);
        setItemGroups(options);
        if (items.length === 0) {
          setItemGroupError('No item groups found.');
        } else if (options.length === 0) {
          setItemGroupError('Unable to read item group names from server.');
        }
      })
      .catch(error => {
        setItemGroups([]);
        setItemGroupError(
          error instanceof Error
            ? error.message
            : 'Unable to load item groups right now.',
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
    touchlessApi
      .getItemUnitTypeList<ItemUnitTypeListResponse>({ownerId})
      .then(response => {
        const items = extractArray<ItemUnitTypeItem>(response);
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

  const displayedItemGroups = useMemo(
    () =>
      itemGroupSearch.trim()
        ? itemGroups.filter(option =>
            option.name
              .toLowerCase()
              .includes(itemGroupSearch.trim().toLowerCase()),
          )
        : itemGroups,
    [itemGroupSearch, itemGroups],
  );

  const displayedItemUnits = useMemo(
    () =>
      itemUnitSearch.trim()
        ? itemUnits.filter(option =>
            option.name
              .toLowerCase()
              .includes(itemUnitSearch.trim().toLowerCase()),
          )
        : itemUnits,
    [itemUnitSearch, itemUnits],
  );

  const applyPickedImage = (asset: Asset) => {
    if (!asset.base64 || !asset.uri) {
      Alert.alert('Photo', 'Unable to read the selected image. Please try again.');
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
      Alert.alert('Gallery', result.errorMessage || 'Unable to open gallery.');
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
      Alert.alert('Add Item', 'Please enter item name.');
      return;
    }

    const payload: AddItemRequest = {
      Id: 0,
      Name: itemName.trim(),
      SerialNumber: itemCode.trim(),
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
      await touchlessApi.addItem(payload);
      Alert.alert('Add Item', 'Item added successfully.');
      resetForm();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to add item right now.';
      Alert.alert('Add Item', message);
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
              <Text style={styles.modalHeaderTitle}>Add Item</Text>
              <TouchableOpacity onPress={handleClose}>
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
                <View style={styles.fieldWrap}>
                  <TextInput
                    style={styles.pillInput}
                    placeholder="Item Name"
                    placeholderTextColor="#9aa0a6"
                    value={itemName}
                    onChangeText={setItemName}
                  />
                </View>

                <View style={styles.fieldRow}>
                  <TextInput
                    style={[styles.pillInput, itemStyles.halfInput]}
                    placeholder="Item Code"
                    placeholderTextColor="#9aa0a6"
                    value={itemCode}
                    onChangeText={setItemCode}
                  />
                  <TextInput
                    style={[styles.pillInput, itemStyles.halfInput]}
                    placeholder="HSN Code"
                    placeholderTextColor="#9aa0a6"
                    value={hsnCode}
                    onChangeText={setHsnCode}
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
                  <Text style={styles.dropdownChevron}>⌄</Text>
                </TouchableOpacity>

                <View style={styles.fieldRow}>
                  <View style={itemStyles.halfBlock}>
                    <Text style={itemStyles.blockLabel}>Quantity</Text>
                    <View style={itemStyles.quantityPill}>
                      <TouchableOpacity
                        style={itemStyles.quantityMinusButton}
                        onPress={handleQuantityDecrement}
                      >
                        <Text style={itemStyles.quantityPlusText}>−</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={itemStyles.quantityInput}
                        keyboardType="numeric"
                        value={quantity}
                        onChangeText={setQuantity}
                      />
                      <TouchableOpacity
                        style={itemStyles.quantityPlusButton}
                        onPress={handleQuantityIncrement}
                      >
                        <Text style={itemStyles.quantityPlusText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={itemStyles.halfBlock}>
                    <Text style={itemStyles.blockLabel}>Unit</Text>
                    <TouchableOpacity
                      style={[styles.dropdownPill, itemStyles.unitDropdown]}
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
                        {selectedItemUnit
                          ? selectedItemUnit.name
                          : 'Select Unit'}
                      </Text>
                      <Text style={styles.dropdownChevron}>⌄</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.fieldRow}>
                  <TextInput
                    style={[styles.pillInput, itemStyles.halfInput]}
                    placeholder="Purchase Price"
                    placeholderTextColor="#9aa0a6"
                    keyboardType="numeric"
                    value={purchasePrice}
                    onChangeText={setPurchasePrice}
                  />
                  <TextInput
                    style={[styles.pillInput, itemStyles.halfInput]}
                    placeholder="Sales Price"
                    placeholderTextColor="#9aa0a6"
                    keyboardType="numeric"
                    value={salesPrice}
                    onChangeText={setSalesPrice}
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
                      <Text style={itemStyles.imageBoxIcon}>🖼️</Text>
                      <Text style={itemStyles.imageBoxText}>
                        Add/Capture Image
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.fieldWrap}>
                  <TextInput
                    style={styles.pillInput}
                    placeholder="Description"
                    placeholderTextColor="#9aa0a6"
                    value={description}
                    onChangeText={setDescription}
                  />
                </View>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddItemSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.addButtonIcon}>📦</Text>
                      <Text style={styles.addButtonText}>ADD</Text>
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

      <Modal
        visible={isItemGroupModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsItemGroupModalOpen(false)}
      >
        <Pressable
          style={styles.centeredModalOverlay}
          onPress={() => setIsItemGroupModalOpen(false)}
        >
          <Pressable style={styles.taskTagModalBox} onPress={() => {}}>
            <Text style={styles.taskTagModalTitle}>Select Item Group</Text>
            <View style={styles.searchModalInputWrap}>
              <TextInput
                style={styles.searchModalInput}
                placeholder="Search..."
                placeholderTextColor="#9aa0a6"
                value={itemGroupSearch}
                onChangeText={setItemGroupSearch}
                autoFocus
              />
              <Text style={styles.searchModalIcon}>🔍</Text>
            </View>
            {isItemGroupLoading ? (
              <ActivityIndicator
                color={THEME_PRIMARY}
                size="small"
                style={styles.suggestionLoader}
              />
            ) : (
              <ScrollView
                style={styles.taskTagModalScroll}
                keyboardShouldPersistTaps="handled"
              >
                {displayedItemGroups.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.taskTagItem}
                    onPress={() => {
                      setSelectedItemGroup(option);
                      setIsItemGroupModalOpen(false);
                      setItemGroupSearch('');
                    }}
                  >
                    <Text style={styles.taskTagItemText}>{option.name}</Text>
                  </TouchableOpacity>
                ))}
                {displayedItemGroups.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {itemGroupError || 'No item groups found.'}
                  </Text>
                ) : null}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isItemUnitModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsItemUnitModalOpen(false)}
      >
        <Pressable
          style={styles.centeredModalOverlay}
          onPress={() => setIsItemUnitModalOpen(false)}
        >
          <Pressable style={styles.taskTagModalBox} onPress={() => {}}>
            <Text style={styles.taskTagModalTitle}>Select Unit</Text>
            <View style={styles.searchModalInputWrap}>
              <TextInput
                style={styles.searchModalInput}
                placeholder="Search..."
                placeholderTextColor="#9aa0a6"
                value={itemUnitSearch}
                onChangeText={setItemUnitSearch}
                autoFocus
              />
              <Text style={styles.searchModalIcon}>🔍</Text>
            </View>
            {isItemUnitLoading ? (
              <ActivityIndicator
                color={THEME_PRIMARY}
                size="small"
                style={styles.suggestionLoader}
              />
            ) : (
              <ScrollView
                style={styles.taskTagModalScroll}
                keyboardShouldPersistTaps="handled"
              >
                {displayedItemUnits.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.taskTagItem}
                    onPress={() => {
                      setSelectedItemUnit(option);
                      setIsItemUnitModalOpen(false);
                      setItemUnitSearch('');
                    }}
                  >
                    <Text style={styles.taskTagItemText}>{option.name}</Text>
                  </TouchableOpacity>
                ))}
                {displayedItemUnits.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {itemUnitError || 'No units found.'}
                  </Text>
                ) : null}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const itemStyles = StyleSheet.create({
  halfInput: {
    flex: 1,
  },
  halfBlock: {
    flex: 1,
  },
  blockLabel: {
    fontSize: 11,
    color: '#8a8f98',
    marginBottom: 4,
  },
  quantityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: 24,
    height: 46,
    paddingHorizontal: 6,
  },
  quantityInput: {
    flex: 1,
    fontSize: 13,
    color: '#222',
    padding: 0,
    textAlign: 'center',
  },
  quantityPlusButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityMinusButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityPlusText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  unitDropdown: {
    marginBottom: 0,
  },
  imageBox: {
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: 8,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  imageBoxIcon: {
    fontSize: 26,
    color: '#9aa0a6',
    marginBottom: 4,
  },
  imageBoxText: {
    fontSize: 13,
    color: '#9aa0a6',
  },
});

export default AddItemModal;
