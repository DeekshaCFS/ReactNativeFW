// src/screens/admin/AssignItemModal.tsx

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {getAllItemAssignedUnassigned, issueItem} from '../../api/item/itemService';
import type {IssueItemResultData, ItemsListResultData} from '../../api/item/item.types';
import {getExpenseUserList} from '../../api/expenditure/expenditureService';
import type {ExpenseTechListResultData} from '../../api/expenditure/expenditure.types';

type AssignItemRequest = IssueItemResultData;
type ExpenseTechnicianItem = ExpenseTechListResultData;
type ItemInventoryListItem = ItemsListResultData;
import {
  THEME_PRIMARY,
  extractArray,
  getNumberField,
  getStringField,
  styles,
} from './CRMScreen';

type AssignItemModalProps = {
  visible: boolean;
  onClose: () => void;
  ownerId: number;
};

type ItemOption = {
  id: number;
  name: string;
};

const normalizeAssignItemOption = (
  item: ItemInventoryListItem,
): ItemOption => {
  const record = item as Record<string, unknown>;
  return {
    id: getNumberField(record, ['itemId', 'ItemId', 'id', 'Id']),
    name: getStringField(record, ['itemName', 'ItemName', 'name', 'Name']),
  };
};

const getFieldworkerName = (item: ExpenseTechnicianItem) => {
  const record = item as Record<string, unknown>;
  const fullName = `${getStringField(record, [
    'firstName',
    'FirstName',
  ])} ${getStringField(record, ['lastName', 'LastName'])}`.trim();

  return (
    getStringField(record, [
      'employeeName',
      'EmployeeName',
      'userName',
      'UserName',
    ]) ||
    getStringField(record, ['name', 'Name']) ||
    fullName ||
    'Fieldworker'
  );
};

const getFieldworkerId = (item: ExpenseTechnicianItem) => {
  const record = item as Record<string, unknown>;
  const value = record.userId ?? record.UserId;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const AssignItemModal: React.FC<AssignItemModalProps> = ({
  visible,
  onClose,
  ownerId,
}) => {
  const [selectedItem, setSelectedItem] = useState<ItemOption | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);
  const [isItemLoading, setIsItemLoading] = useState(false);

  const [selectedFieldworker, setSelectedFieldworker] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isFieldworkerModalOpen, setIsFieldworkerModalOpen] = useState(false);
  const [allFieldworkers, setAllFieldworkers] = useState<
    ExpenseTechnicianItem[]
  >([]);
  const [isFieldworkerLoading, setIsFieldworkerLoading] = useState(false);
  const [fieldworkerSearch, setFieldworkerSearch] = useState('');

  const [quantity, setQuantity] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setSelectedItem(null);
    setItemSearchQuery('');
    setItemOptions([]);
    setSelectedFieldworker(null);
    setFieldworkerSearch('');
    setQuantity('0');
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }
    resetForm();
  }, [visible, resetForm]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const loadItemOptions = useCallback(
    (searchParam: string) => {
      setIsItemLoading(true);
      getAllItemAssignedUnassigned({OwnerId: ownerId, SearchParam: searchParam})
        .then(response => {
          const items = extractArray<ItemInventoryListItem>(response);
          setItemOptions(
            items.map(normalizeAssignItemOption).filter(option => option.name),
          );
        })
        .catch(() => setItemOptions([]))
        .finally(() => setIsItemLoading(false));
    },
    [ownerId],
  );

  useEffect(() => {
    if (!isItemModalOpen) {
      return;
    }
    const query = itemSearchQuery.trim();
    if (query.length < 3) {
      setItemOptions([]);
      return;
    }
    const timeoutId = setTimeout(() => {
      loadItemOptions(query);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [isItemModalOpen, itemSearchQuery, loadItemOptions]);

  const openItemModal = () => {
    setItemSearchQuery('');
    setItemOptions([]);
    setIsItemModalOpen(true);
  };

  const handleItemSelect = (option: ItemOption) => {
    setSelectedItem(option);
    setIsItemModalOpen(false);
    setItemSearchQuery('');
  };

  const loadFieldworkers = useCallback(() => {
    if (allFieldworkers.length > 0 || isFieldworkerLoading) {
      return;
    }
    setIsFieldworkerLoading(true);
    getExpenseUserList({OwnerId: ownerId})
      .then(response => {
        setAllFieldworkers(extractArray<ExpenseTechnicianItem>(response));
      })
      .catch(() => setAllFieldworkers([]))
      .finally(() => setIsFieldworkerLoading(false));
  }, [allFieldworkers.length, isFieldworkerLoading, ownerId]);

  const displayedFieldworkers = useMemo(() => {
    const query = fieldworkerSearch.trim().toLowerCase();
    if (!query) {
      return allFieldworkers;
    }
    return allFieldworkers.filter(item =>
      getFieldworkerName(item).toLowerCase().includes(query),
    );
  }, [allFieldworkers, fieldworkerSearch]);

  const handleFieldworkerSelect = (item: ExpenseTechnicianItem) => {
    setSelectedFieldworker({
      id: getFieldworkerId(item),
      name: getFieldworkerName(item),
    });
    setIsFieldworkerModalOpen(false);
    setFieldworkerSearch('');
  };

  const handleQuantityIncrement = () => {
    setQuantity(previous => String((Number(previous) || 0) + 1));
  };

  const handleQuantityDecrement = () => {
    setQuantity(previous => String(Math.max(0, (Number(previous) || 0) - 1)));
  };

  const handleAssignSubmit = async () => {
    if (!selectedItem) {
      Alert.alert('Assign Item', 'Please select an item.');
      return;
    }
    if (!selectedFieldworker) {
      Alert.alert('Assign Item', 'Please select a fieldworker.');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      Alert.alert('Assign Item', 'Please enter a valid quantity.');
      return;
    }

    const payload: AssignItemRequest = {
      Id: 0,
      ItemId: selectedItem.id,
      UserId: selectedFieldworker.id,
      Quantity: Number(quantity) || 0,
      TransactionType: 2,
      OwnerId: ownerId,
      IsActive: true,
      IsModelError: true,
      IsSuccessful: true,
      CreatedBy: ownerId,
      UpdatedBy: ownerId,
    };

    setIsSubmitting(true);
    try {
      await issueItem(payload);
      Alert.alert('Assign Item', 'Item assigned successfully.');
      resetForm();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to assign item right now.';
      Alert.alert('Assign Item', message);
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
              <Text style={styles.modalHeaderTitle}>Assign Item</Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.howToRow}>
                <View style={styles.howToPlayIcon}>
                  <Text style={styles.howToPlayIconText}>▶</Text>
                </View>
                <Text style={styles.howToText}>How to assign item?</Text>
              </View>

              <TouchableOpacity
                style={styles.dropdownPill}
                onPress={openItemModal}
              >
                <Text
                  style={
                    selectedItem
                      ? styles.dropdownPillTextValue
                      : styles.dropdownPillTextPlaceholder
                  }
                  numberOfLines={1}
                >
                  {selectedItem ? selectedItem.name : 'Select Item'}
                </Text>
                <Text style={styles.dropdownChevron}>⌄</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dropdownPill}
                onPress={() => {
                  loadFieldworkers();
                  setIsFieldworkerModalOpen(true);
                }}
              >
                <Text
                  style={
                    selectedFieldworker
                      ? styles.dropdownPillTextValue
                      : styles.dropdownPillTextPlaceholder
                  }
                  numberOfLines={1}
                >
                  {selectedFieldworker
                    ? selectedFieldworker.name
                    : 'Select Fieldworkers'}
                </Text>
                <Text style={styles.dropdownChevron}>⌄</Text>
              </TouchableOpacity>

              <Text style={assignStyles.quantityLabel}>Quantity</Text>
              <View style={assignStyles.quantityPill}>
                <TouchableOpacity
                  style={assignStyles.quantityMinusButton}
                  onPress={handleQuantityDecrement}
                >
                  <Text style={assignStyles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={assignStyles.quantityInput}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
                <TouchableOpacity
                  style={assignStyles.quantityPlusButton}
                  onPress={handleQuantityIncrement}
                >
                  <Text style={assignStyles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={assignStyles.assignButton}
                onPress={handleAssignSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.addButtonIcon}>📦</Text>
                    <Text style={styles.addButtonText}>ASSIGN</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isItemModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsItemModalOpen(false)}
      >
        <Pressable
          style={styles.centeredModalOverlay}
          onPress={() => setIsItemModalOpen(false)}
        >
          <Pressable style={styles.taskTagModalBox} onPress={() => {}}>
            <Text style={styles.taskTagModalTitle}>Select Item</Text>
            <View style={styles.searchModalInputWrap}>
              <TextInput
                style={styles.searchModalInput}
                placeholder="Pls Enter Min 3 Characters."
                placeholderTextColor="#9aa0a6"
                value={itemSearchQuery}
                onChangeText={setItemSearchQuery}
                autoFocus
              />
            </View>
            {isItemLoading ? (
              <ActivityIndicator
                color={THEME_PRIMARY}
                size="small"
                style={styles.suggestionLoader}
              />
            ) : itemSearchQuery.trim().length < 3 ? (
              <Text style={styles.itemSearchHintText}>
                Pls Enter Min 3 Characters.
              </Text>
            ) : (
              <ScrollView
                style={styles.taskTagModalScroll}
                keyboardShouldPersistTaps="handled"
              >
                {itemOptions.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.taskTagItem}
                    onPress={() => handleItemSelect(option)}
                  >
                    <Text style={styles.taskTagItemText}>{option.name}</Text>
                  </TouchableOpacity>
                ))}
                {itemOptions.length === 0 ? (
                  <Text style={styles.emptyText}>No items found.</Text>
                ) : null}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isFieldworkerModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsFieldworkerModalOpen(false)}
      >
        <Pressable
          style={styles.centeredModalOverlay}
          onPress={() => setIsFieldworkerModalOpen(false)}
        >
          <Pressable style={styles.taskTagModalBox} onPress={() => {}}>
            <Text style={styles.taskTagModalTitle}>Select Fieldworker</Text>
            <View style={styles.searchModalInputWrap}>
              <TextInput
                style={styles.searchModalInput}
                placeholder="Search..."
                placeholderTextColor="#9aa0a6"
                value={fieldworkerSearch}
                onChangeText={setFieldworkerSearch}
              />
            </View>
            {isFieldworkerLoading ? (
              <ActivityIndicator
                color={THEME_PRIMARY}
                size="small"
                style={styles.suggestionLoader}
              />
            ) : (
              <ScrollView style={styles.taskTagModalScroll}>
                {displayedFieldworkers.map(item => {
                  const name = getFieldworkerName(item);
                  const isSelected =
                    selectedFieldworker?.id === getFieldworkerId(item);
                  return (
                    <TouchableOpacity
                      key={getFieldworkerId(item) || name}
                      style={styles.taskTagItem}
                      onPress={() => handleFieldworkerSelect(item)}
                    >
                      <Text
                        style={[
                          styles.taskTagItemText,
                          isSelected ? styles.serviceLeafTextSelected : null,
                        ]}
                      >
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {displayedFieldworkers.length === 0 ? (
                  <Text style={styles.emptyText}>No fieldworkers found.</Text>
                ) : null}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const assignStyles = {
  quantityLabel: {
    fontSize: 11,
    color: '#8a8f98',
    marginBottom: 4,
  },
  quantityPill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: 24,
    height: 46,
    paddingHorizontal: 6,
    marginBottom: 14,
  },
  quantityInput: {
    flex: 1,
    fontSize: 13,
    color: '#222',
    padding: 0,
    textAlign: 'center' as const,
  },
  quantityPlusButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME_PRIMARY,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  quantityMinusButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME_PRIMARY,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  quantityButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 20,
  },
  assignButton: {
    flexDirection: 'row' as const,
    backgroundColor: THEME_PRIMARY,
    borderRadius: 24,
    height: 48,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 14,
    gap: 8,
  },
};

export default AssignItemModal;