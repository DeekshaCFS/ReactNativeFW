// src/screens/admin/AssignItemModal.tsx

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {ms, sp} from '../../utils/responsive';
import {ensureSuccess} from '../../utils/apiResponse';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from '../../components/AppModal';
import {getAllItemAssignedUnassigned, issueItem} from '../../api/item/itemService';
import type {IssueItemResultData, ItemsListResultData} from '../../api/item/item.types';
import {getAllUsersList} from '../../api/users/usersService';
import type {UsersListResultData} from '../../api/users/users.types';

type AssignItemRequest = IssueItemResultData;
type ItemInventoryListItem = ItemsListResultData;
import {
  THEME_PRIMARY,
  extractArray,
  getNumberField,
  getStringField,
  styles as sharedStyles,
} from './crmShared';
import {isFieldworkerRecord, taskStyles} from './AddTaskModal';
import {AssignItemIcon} from '../../components/FabIcons';
import SearchPickerModal from '../../components/SearchPickerModal';
import {COLORS} from '../../theme/theme';

// Same Java dialog sheet / header / spinner metrics as the Add Task form.
const styles = {...sharedStyles, ...taskStyles};

type AssignItemModalProps = {
  visible: boolean;
  onClose: () => void;
  ownerId: number;
  /** Opens with this item already chosen (assign from an inventory row). */
  initialItem?: {id: number; name: string} | null;
  onAssigned?: () => void;
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

const getFieldworkerName = (item: UsersListResultData) => {
  const record = item as Record<string, unknown>;
  const fullName = `${getStringField(record, [
    'firstName',
    'FirstName',
  ])} ${getStringField(record, ['lastName', 'LastName'])}`.trim();

  // FirstName/LastName first -- UserName on this endpoint is the login (phone number).
  return (
    fullName ||
    getStringField(record, ['employeeName', 'EmployeeName']) ||
    getStringField(record, ['name', 'Name']) ||
    getStringField(record, ['userName', 'UserName']) ||
    'Fieldworker'
  );
};

const getFieldworkerId = (item: UsersListResultData) => {
  const record = item as Record<string, unknown>;
  const value = record.userId ?? record.UserId ?? record.id ?? record.Id;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const AssignItemModal: React.FC<AssignItemModalProps> = ({
  visible,
  onClose,
  ownerId,
  initialItem = null,
  onAssigned,
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
    UsersListResultData[]
  >([]);
  const [isFieldworkerLoading, setIsFieldworkerLoading] = useState(false);

  const [quantity, setQuantity] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setSelectedItem(null);
    setItemSearchQuery('');
    setItemOptions([]);
    setSelectedFieldworker(null);
    setQuantity('0');
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }
    resetForm();
    if (initialItem) {
      setSelectedItem(initialItem);
    }
    // Keyed on the id: callers build initialItem inline, so its identity changes
    // every render and would otherwise reset the form under the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, resetForm, initialItem?.id]);

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
    // Java: Users/AllUsersList (HomeActivityNew.getUserList) feeds this spinner -- fieldworkers
    // only, not every employee.
    getAllUsersList({OwnerId: ownerId, RoleId: 2, OnlyList: false})
      .then(response => {
        setAllFieldworkers(
          extractArray<UsersListResultData>(response).filter(isFieldworkerRecord),
        );
      })
      .catch(() => setAllFieldworkers([]))
      .finally(() => setIsFieldworkerLoading(false));
  }, [allFieldworkers.length, isFieldworkerLoading, ownerId]);

  const handleFieldworkerSelect = (item: UsersListResultData) => {
    setSelectedFieldworker({
      id: getFieldworkerId(item),
      name: getFieldworkerName(item),
    });
    setIsFieldworkerModalOpen(false);
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
      ensureSuccess(await issueItem(payload));
      Alert.alert('Assign Item', 'Item assigned successfully.');
      resetForm();
      onAssigned?.();
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
                <Ionicons name="close" style={styles.modalCloseIcon} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={assignStyles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={assignStyles.howToRow}>
                <View style={assignStyles.howToPlayIcon}>
                  <Ionicons name="play" size={ms(11)} color="#FFFFFF" />
                </View>
                <Text style={assignStyles.howToText}>How to assign item ?</Text>
              </View>

              <TouchableOpacity
                style={[styles.dropdownPill, assignStyles.itemPill]}
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
                <Ionicons name="chevron-down" style={styles.dropdownChevron} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dropdownPill, assignStyles.fieldworkerPill]}
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
                <Ionicons name="chevron-down" style={styles.dropdownChevron} />
              </TouchableOpacity>

              <Text style={assignStyles.quantityLabel}>Quantity</Text>
              <View style={assignStyles.quantityPill}>
                <TouchableOpacity
                  style={assignStyles.quantityButton}
                  onPress={handleQuantityDecrement}
                >
                  <Text style={assignStyles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={assignStyles.quantityInput}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                  maxLength={5}
                />
                <TouchableOpacity
                  style={assignStyles.quantityButton}
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
                    <View style={styles.addButtonIconWrap}>
                      <AssignItemIcon size={ms(30)} color="#FFFFFF" />
                    </View>
                    <Text style={styles.darkAddButtonText}>ASSIGN</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Java ItemDialog: dialog_searchable_spinner_item / _technician -- the shared dialog. */}
      <SearchPickerModal
        visible={isItemModalOpen}
        title="Select Item"
        options={itemOptions.map(option => ({id: option.id, label: option.name}))}
        loading={isItemLoading}
        searchHint="Pls Enter Min 3 Characters."
        minChars={3}
        emptyText="No items found."
        onSearch={setItemSearchQuery}
        onSelect={picked => {
          const option = itemOptions.find(o => o.id === picked.id);
          if (option) {
            handleItemSelect(option);
          }
        }}
        onClose={() => setIsItemModalOpen(false)}
      />

      <SearchPickerModal
        visible={isFieldworkerModalOpen}
        title="Select Fieldworkers"
        options={allFieldworkers.map(item => ({
          id: getFieldworkerId(item),
          label: getFieldworkerName(item),
        }))}
        loading={isFieldworkerLoading}
        emptyText="No fieldworkers found."
        onSelect={picked => {
          const item = allFieldworkers.find(i => getFieldworkerId(i) === picked.id);
          if (item) {
            handleFieldworkerSelect(item);
          }
        }}
        onClose={() => setIsFieldworkerModalOpen(false)}
      />
    </>
  );
};

// dialog_issue_item_new: 10dp side margins, 14sp spinners, rounded_border (20dp) quantity stepper
// with plain "-" / "+" 30sp text, rounded_button (red, 34dp) ASSIGN with ic_item_option.
const assignStyles = {
  scrollContent: {
    paddingHorizontal: ms(10),
    paddingTop: ms(20),
    paddingBottom: ms(10),
  },
  howToRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: ms(20),
  },
  howToPlayIcon: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    backgroundColor: COLORS.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: ms(10),
  },
  howToText: {
    color: COLORS.primary,
    fontSize: sp(14),
  },
  itemPill: {
    marginBottom: ms(3),
  },
  fieldworkerPill: {
    marginTop: ms(20),
    marginBottom: ms(3),
  },
  quantityLabel: {
    fontSize: sp(18),
    color: '#000000',
    marginLeft: ms(5),
    marginTop: ms(10),
  },
  quantityPill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: ms(1),
    borderColor: COLORS.lightGray,
    borderRadius: ms(20),
    height: ms(40),
    marginTop: ms(10),
    marginBottom: ms(10),
  },
  quantityInput: {
    flex: 0.7,
    fontSize: sp(16),
    color: COLORS.ink,
    padding: 0,
    textAlign: 'center' as const,
  },
  quantityButton: {
    flex: 0.15,
    height: '100%' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  quantityButtonText: {
    color: COLORS.ink,
    fontSize: sp(30),
    lineHeight: sp(36),
  },
  assignButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: COLORS.primary,
    borderRadius: ms(34),
    height: ms(48),
    marginTop: ms(10),
    marginBottom: ms(20),
    elevation: 4,
  },
};

export default AssignItemModal;
