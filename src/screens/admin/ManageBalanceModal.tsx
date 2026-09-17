import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  type ExpenseTechnicianItem,
  type ExpenseTechnicianListResponse,
} from './adminLegacyApiTypes';
import { getExpenseUserList, updateAddCredit, updateDeductBalance } from '../../api/expenditure/expenditureService';

const THEME_PRIMARY = '#c3002f';

const getCode = (response: {code?: string; Code?: string}) =>
  String(response.code ?? response.Code ?? '');

const getMessage = (response: {message?: string; Message?: string}) =>
  String(response.message ?? response.Message ?? '').trim();

const isSuccessOrNoData = (response: ExpenseTechnicianListResponse) => {
  const code = getCode(response);
  return code === '200' || code === '';
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getExpenseString = (
  item: ExpenseTechnicianItem,
  keys: Array<keyof ExpenseTechnicianItem>,
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

const getExpenseNumber = (
  item: ExpenseTechnicianItem,
  keys: Array<keyof ExpenseTechnicianItem>,
) => {
  for (const key of keys) {
    const parsed = toNumber(item[key]);
    if (parsed !== 0 || item[key] === 0 || item[key] === '0') {
      return parsed;
    }
  }

  return 0;
};

const getTechnicianId = (item: ExpenseTechnicianItem) =>
  getExpenseNumber(item, ['userId', 'UserId']);

const getTechnicianName = (item: ExpenseTechnicianItem) => {
  const fullName = `${getExpenseString(item, ['firstName', 'FirstName'])} ${getExpenseString(
    item,
    ['lastName', 'LastName'],
  )}`.trim();

  return (
    getExpenseString(item, ['employeeName', 'EmployeeName', 'userName', 'UserName']) ||
    getExpenseString(item, ['name', 'Name']) ||
    fullName ||
    'Fieldworker'
  );
};

const getTechnicianBalance = (item: ExpenseTechnicianItem) =>
  getExpenseNumber(item, [
    'remainingBalance',
    'RemainingBalance',
    'balance',
    'Balance',
  ]);

const formatMoney = (value: number) => `Rs. ${value}`;

type ManageBalanceModalProps = {
  visible: boolean;
  userId: number;
  initialMode?: 'add' | 'deduct';
  initialTechnicianId?: number | null;
  onClose: () => void;
  onSuccess?: () => void;
};

const ManageBalanceModal = ({
  visible,
  userId,
  initialMode = 'add',
  initialTechnicianId = null,
  onClose,
  onSuccess,
}: ManageBalanceModalProps) => {
  const [technicians, setTechnicians] = useState<ExpenseTechnicianItem[]>([]);
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false);
  const [balanceMode, setBalanceMode] = useState<'add' | 'deduct'>(initialMode);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(
    initialTechnicianId,
  );
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceDescription, setBalanceDescription] = useState('');
  const [isTechnicianDropdownOpen, setIsTechnicianDropdownOpen] = useState(false);

  const loadTechnicians = useCallback(async () => {
    setIsLoadingTechnicians(true);
    try {
      const response = (await getExpenseUserList({ OwnerId: userId })) as ExpenseTechnicianListResponse;
      if (!isSuccessOrNoData(response)) {
        throw new Error(getMessage(response) || 'Unable to load fieldworkers.');
      }
      setTechnicians(response.resultData ?? response.ResultData ?? []);
    } catch (error) {
      setTechnicians([]);
      const message =
        error instanceof Error ? error.message : 'Unable to load fieldworkers.';
      Alert.alert('Error', message);
    } finally {
      setIsLoadingTechnicians(false);
    }
  }, [userId]);

  useEffect(() => {
    if (visible) {
      setBalanceMode(initialMode);
      setSelectedTechnicianId(initialTechnicianId);
      setBalanceAmount('');
      setBalanceDescription('');
      setIsTechnicianDropdownOpen(false);
      loadTechnicians();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const selectedTechnician = useMemo(() => {
    if (selectedTechnicianId == null) {
      return null;
    }
    return technicians.find(item => getTechnicianId(item) === selectedTechnicianId);
  }, [selectedTechnicianId, technicians]);

  const selectedTechnicianBalance = selectedTechnician
    ? getTechnicianBalance(selectedTechnician)
    : null;

  const handleClose = () => {
    setIsTechnicianDropdownOpen(false);
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedTechnician) {
      Alert.alert('Select fieldworker', 'Please select a fieldworker first.');
      return;
    }

    if (!balanceAmount.trim() || Number(balanceAmount) <= 0) {
      Alert.alert('Enter amount', 'Please enter a valid balance amount.');
      return;
    }

    if (balanceMode === 'deduct') {
      const remaining = selectedTechnicianBalance ?? getTechnicianBalance(selectedTechnician);
      if (remaining <= 0) {
        Alert.alert(
          'Cannot Deduct',
          'Current amount is 0, balance cannot be deducted.',
        );
        return;
      }
    }

    (async () => {
      try {
        if (balanceMode === 'add') {
          await updateAddCredit({
            Amount: Number(balanceAmount),
            CredidDescription: balanceDescription,
            GivenBy: userId,
            ReceivedBy: getTechnicianId(selectedTechnician),
          });

          Alert.alert('Add Balance', `₹${balanceAmount} added to ${getTechnicianName(selectedTechnician)}.`);
        } else {
          await updateDeductBalance({
            Amount: Number(balanceAmount),
            Description: balanceDescription,
            DeductBy: userId,
            UserId: getTechnicianId(selectedTechnician),
          });
          Alert.alert('Deduct Balance', `₹${balanceAmount} deducted from ${getTechnicianName(selectedTechnician)}.`);
        }

        onSuccess?.();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unable to submit request.';
        Alert.alert('Error', msg);
      } finally {
        handleClose();
      }
    })();
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={handleClose}>
      <Pressable style={styles.modalBackdrop} onPress={handleClose}>
        <Pressable style={styles.modalPanel}>
          <Text style={styles.modalTitle}>How to add / deduct balance ?</Text>
          <View style={styles.balanceToggleRow}>
            <Pressable
              style={[
                styles.balanceToggleButton,
                balanceMode === 'add' ? styles.balanceToggleSelected : null,
              ]}
              onPress={() => setBalanceMode('add')}>
              <Text
                style={[
                  styles.balanceToggleText,
                  balanceMode === 'add' ? styles.balanceToggleTextSelected : null,
                ]}>
                Add Balance
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.balanceToggleButton,
                balanceMode === 'deduct' ? styles.balanceToggleSelected : null,
              ]}
              onPress={() => setBalanceMode('deduct')}>
              <Text
                style={[
                  styles.balanceToggleText,
                  balanceMode === 'deduct' ? styles.balanceToggleTextSelected : null,
                ]}>
                Deduct Balance
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.dropdownField}
            onPress={() => setIsTechnicianDropdownOpen(prev => !prev)}>
            <Text style={styles.dropdownLabel}>Select Fieldworkers</Text>
            <Text style={styles.dropdownValue}>
              {isLoadingTechnicians
                ? 'Loading...'
                : selectedTechnician
                ? getTechnicianName(selectedTechnician)
                : 'Choose a fieldworker'}
            </Text>
          </Pressable>
          {isTechnicianDropdownOpen ? (
            <View style={styles.dropdownList}>
              <ScrollView style={styles.dropdownScroll}>
                {technicians.map(item => (
                  <Pressable
                    key={`${getTechnicianId(item)}`}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedTechnicianId(getTechnicianId(item));
                      setIsTechnicianDropdownOpen(false);
                    }}>
                    <Text style={styles.dropdownItemText}>{getTechnicianName(item)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.currentBalanceRow}>
            <Text style={styles.currentBalanceLabel}>Current Balance:</Text>
            <Text style={styles.currentBalanceValue}>
              {selectedTechnician
                ? formatMoney(selectedTechnicianBalance ?? getTechnicianBalance(selectedTechnician))
                : 'Rs. 0'}
            </Text>
          </View>

          <TextInput
            value={balanceAmount}
            onChangeText={setBalanceAmount}
            placeholder="Enter Amount"
            placeholderTextColor="#9E9E9E"
            keyboardType="numeric"
            style={styles.balanceInput}
          />
          <TextInput
            value={balanceDescription}
            onChangeText={setBalanceDescription}
            placeholder="Enter Description"
            placeholderTextColor="#9E9E9E"
            style={[styles.balanceInput, styles.descriptionInput]}
            multiline
          />

          <View style={styles.modalFooter}>
            <Pressable style={styles.modalCancelButton} onPress={handleClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.modalOkButton} onPress={handleSubmit}>
              <Text style={styles.modalOkText}>{balanceMode === 'deduct' ? 'DEDUCT' : 'ADD'}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalPanel: {
    width: '100%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 30,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 18,
  },
  balanceToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  balanceToggleButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  balanceToggleSelected: {
    backgroundColor: THEME_PRIMARY,
    borderColor: THEME_PRIMARY,
  },
  balanceToggleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
  },
  balanceToggleTextSelected: {
    color: '#FFFFFF',
  },
  dropdownField: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  dropdownLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  dropdownValue: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownList: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  dropdownScroll: {
    maxHeight: 160,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    color: '#111111',
    fontSize: 14,
  },
  currentBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 14,
  },
  currentBalanceLabel: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '700',
  },
  currentBalanceValue: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },
  balanceInput: {
    width: '100%',
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111111',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  descriptionInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    marginRight: 8,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '800',
  },
  modalOkButton: {
    flex: 1,
    height: 48,
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: THEME_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOkText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});

export default ManageBalanceModal;