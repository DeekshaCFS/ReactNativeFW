import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ms, sp} from '../../utils/responsive';
import {ensureSuccess} from '../../utils/apiResponse';
import {formatAmount, sanitizeDecimalInput} from '../../utils/decimal';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Modal from '../../components/AppModal';
import OutlinedInput from '../../components/OutlinedInput';
import {BalanceIcon} from '../../components/FabIcons';
import {COLORS} from '../../theme/theme';
import {
  type ExpenseTechnicianItem,
  type ExpenseTechnicianListResponse,
} from './adminLegacyApiTypes';
import { getExpenseUserList, updateAddCredit, updateDeductBalance } from '../../api/expenditure/expenditureService';
import { showFailureMsg, showSuccessMsg } from '../../utils/toast';

const GREEN_500 = '#4CAF50'; // @color/green_500

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

const formatMoney = (value: number) => `Rs. ${formatAmount(value)}`;

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
      showFailureMsg(message || 'Error');
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
      showFailureMsg('Please select a fieldworker first.');
      return;
    }

    if (!balanceAmount.trim() || Number(balanceAmount) <= 0) {
      showFailureMsg('Please enter a valid balance amount.');
      return;
    }

    if (balanceMode === 'deduct') {
      const remaining = selectedTechnicianBalance ?? getTechnicianBalance(selectedTechnician);
      if (remaining <= 0) {
        showFailureMsg('Current amount is 0, balance cannot be deducted.');
        return;
      }
    }

    (async () => {
      try {
        if (balanceMode === 'add') {
          ensureSuccess(await updateAddCredit({
            Amount: Number(balanceAmount),
            CredidDescription: balanceDescription,
            GivenBy: userId,
            ReceivedBy: getTechnicianId(selectedTechnician),
          }));

          showSuccessMsg(`₹${formatAmount(balanceAmount)} added to ${getTechnicianName(selectedTechnician)}.`);
        } else {
          ensureSuccess(await updateDeductBalance({
            Amount: Number(balanceAmount),
            Description: balanceDescription,
            DeductBy: userId,
            UserId: getTechnicianId(selectedTechnician),
          }));
          showSuccessMsg(`₹${formatAmount(balanceAmount)} deducted from ${getTechnicianName(selectedTechnician)}.`);
        }

        onSuccess?.();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unable to submit request.';
        showFailureMsg(msg || 'Error');
      } finally {
        handleClose();
      }
    })();
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={handleClose}>
      <Pressable style={styles.modalBackdrop} onPress={handleClose}>
        <Pressable style={styles.modalPanel}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.panelContent}>
            <View style={styles.howToRow}>
              <View style={styles.howToPlayIcon}>
                <Ionicons name="play" size={ms(11)} color="#FFFFFF" />
              </View>
              <Text style={styles.howToText}>How to add / deduct balance ?</Text>
            </View>

            <View style={styles.segmentGroup}>
              <Pressable
                style={[
                  styles.segmentButton,
                  balanceMode === 'add' ? styles.segmentSelected : null,
                ]}
                onPress={() => setBalanceMode('add')}>
                <Text
                  style={[
                    styles.segmentText,
                    balanceMode === 'add' ? styles.segmentTextSelected : null,
                  ]}>
                  Add Balance
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.segmentButton,
                  balanceMode === 'deduct' ? styles.segmentSelected : null,
                ]}
                onPress={() => setBalanceMode('deduct')}>
                <Text
                  style={[
                    styles.segmentText,
                    balanceMode === 'deduct' ? styles.segmentTextSelected : null,
                  ]}>
                  Deduct Balance
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.spinnerPill}
              onPress={() => setIsTechnicianDropdownOpen(prev => !prev)}>
              <Text
                style={selectedTechnician ? styles.spinnerValue : styles.spinnerPlaceholder}
                numberOfLines={1}>
                {isLoadingTechnicians
                  ? 'Loading...'
                  : selectedTechnician
                  ? getTechnicianName(selectedTechnician)
                  : 'Select Fieldworkers'}
              </Text>
              <Ionicons name="chevron-down" style={styles.spinnerChevron} />
            </Pressable>
            {isTechnicianDropdownOpen ? (
              <View style={styles.dropdownList}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
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
                  : ''}
              </Text>
            </View>

            <View style={styles.fieldWrap}>
              <OutlinedInput
                value={balanceAmount}
                onChangeText={t => setBalanceAmount(sanitizeDecimalInput(t))}
                placeholder="Enter Amount"
                placeholderTextColor={COLORS.lightGray}
                keyboardType="decimal-pad"
                maxLength={10}
                style={styles.pillInput}
              />
            </View>
            <View style={styles.fieldWrap}>
              <OutlinedInput
                value={balanceDescription}
                onChangeText={setBalanceDescription}
                placeholder="Enter Description"
                placeholderTextColor={COLORS.lightGray}
                autoCapitalize="words"
                maxLength={100}
                style={styles.pillInput}
              />
            </View>

            <Pressable style={styles.submitButton} onPress={handleSubmit}>
              <View style={styles.submitIconWrap}>
                <BalanceIcon size={ms(30)} color="#FFFFFF" />
              </View>
              <Text style={styles.submitText}>{balanceMode === 'deduct' ? 'DEDUCT' : 'ADD'}</Text>
            </Pressable>

            <Pressable onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// dialog_add_deduct_balance: 30dp-corner white card, 20dp padding, SegmentedGroup (40dp, 1dp
// background_gray border, 25dp corners), bg_spinner (40dp, 34dp radius), outlined 34dp fields,
// rounded_button ADD with ic_balance_option, transparent Cancel.
const FIELD_BORDER = COLORS.lightGray;

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.dialogDim,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalPanel: {
    width: '100%',
    maxWidth: ms(560),
    maxHeight: '94%',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    backgroundColor: '#FFFFFF',
    elevation: 10,
  },
  panelContent: {
    padding: ms(20),
  },
  howToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(20),
    marginLeft: ms(2),
  },
  howToPlayIcon: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12),
  },
  howToText: {
    color: COLORS.primary,
    fontSize: sp(14),
  },
  segmentGroup: {
    flexDirection: 'row',
    height: ms(40),
    marginTop: ms(5),
    borderWidth: 1,
    borderColor: COLORS.ink,
    borderRadius: ms(25),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: COLORS.ink,
  },
  segmentText: {
    fontSize: sp(14),
    color: COLORS.ink,
  },
  segmentTextSelected: {
    color: '#FFFFFF',
  },
  spinnerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ms(40),
    marginTop: ms(20),
    marginBottom: ms(3),
    paddingHorizontal: ms(12),
    borderWidth: ms(1),
    borderColor: FIELD_BORDER,
    borderRadius: ms(34),
    backgroundColor: '#FFFFFF',
  },
  spinnerPlaceholder: {
    flex: 1,
    fontSize: sp(14),
    color: COLORS.darkGray,
  },
  spinnerValue: {
    flex: 1,
    fontSize: sp(14),
    color: '#000000',
  },
  spinnerChevron: {
    fontSize: sp(20),
    color: COLORS.ink,
    marginLeft: ms(6),
  },
  dropdownList: {
    maxHeight: ms(160),
    borderWidth: ms(1),
    borderColor: FIELD_BORDER,
    borderRadius: ms(20),
    backgroundColor: '#FFFFFF',
    marginTop: ms(4),
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: ms(160),
  },
  dropdownItem: {
    paddingVertical: ms(12),
    paddingHorizontal: ms(16),
    borderBottomWidth: ms(1),
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    color: '#000000',
    fontSize: sp(14),
  },
  currentBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: ms(10),
    marginBottom: ms(20),
  },
  currentBalanceLabel: {
    color: GREEN_500,
    fontSize: sp(14),
  },
  currentBalanceValue: {
    color: COLORS.ink,
    fontSize: sp(14),
    paddingLeft: ms(2),
  },
  fieldWrap: {
    marginBottom: ms(26),
  },
  pillInput: {
    borderWidth: ms(1),
    borderColor: FIELD_BORDER,
    borderRadius: ms(34),
    paddingHorizontal: ms(18),
    paddingVertical: 0,
    height: ms(41),
    fontSize: sp(16),
    color: '#000000',
  },
  submitButton: {
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
  submitIconWrap: {
    position: 'absolute',
    left: ms(17),
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: sp(18),
    fontWeight: '500',
  },
  cancelText: {
    textAlign: 'center',
    textAlignVertical: 'center',
    color: COLORS.primary,
    fontSize: sp(18),
    fontWeight: '500',
    height: ms(48),
    lineHeight: ms(48),
    marginBottom: ms(20),
  },
});

export default ManageBalanceModal;
