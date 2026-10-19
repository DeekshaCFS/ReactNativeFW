// src/screens/technician/drawer/ServiceScreen.tsx
//
// Android's RoutineServiceFragment: a lookup form (Asset ID or Customer No.)
// that finds a customer/asset then opens task creation pre-filled and
// self-assigned to the logged-in technician (TaskDialogNew.
// startTaskSelfCreation -- hardcoded self-assignment, no fieldworker
// picker). This screen is Fieldworker/Technician-only in Android (hidden
// from Owner/Manager/Sub-Admin in HomeActivityNew's drawer setup), so
// there's no admin-side equivalent to build.
import {
  View, StyleSheet, Text, TextInput,
  Pressable, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import Modal from '../../../components/AppModal';
import { COLORS } from '../../../theme/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms, sp, scale, hp, vs, wp, wps } from '../../../utils/responsive';
import { getRoutineCustomerList } from '../../../api/fsrManagement/fsrManagementService';
import type { RoutineServiceCustomerListDTOResultData } from '../../../api/fsrManagement/fsrManagement.types';
import RoutineServiceAcceptModal from './RoutineServiceAcceptModal';
import SearchPickerModal from '../../../components/SearchPickerModal';
import { getCustomerList } from '../../../api/customerList/customerListService';
import type { CustomerListResultData } from '../../../api/customerList/customerList.types';
import { useOpenTask } from '../../../hooks/useOpenTask';
import { showFailureMsg } from '../../../utils/toast';

import { useTranslation } from 'react-i18next';
import { tr } from '../../../i18n/tr';
type FilterType = 'Asset' | 'Customer No.';
const FILTER_OPTIONS: FilterType[] = ['Asset', 'Customer No.'];

export default function ServiceScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterType>('Asset');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [lookupResult, setLookupResult] = useState<RoutineServiceCustomerListDTOResultData | null>(null);
  const insets = useSafeAreaInsets();

  // Added on top of Java: the owner's customers as a dropdown for "Customer No." (Java: free
  // text only). Same call Java's Accounts screens make for a field worker:
  // CustomerList/GetAllCustomerListForMobile with the OWNER's id.
  const [customers, setCustomers] = useState<CustomerListResultData[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersFailed, setCustomersFailed] = useState(false);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [pickedCustomer, setPickedCustomer] = useState<CustomerListResultData | null>(null);

  useEffect(() => {
    if (filter !== 'Customer No.' || customers.length > 0 || customersLoading) return;
    (async () => {
      setCustomersLoading(true);
      setCustomersFailed(false);
      try {
        const ownerId = Number(await AsyncStorage.getItem('owner_id')) || 0;
        const res = await getCustomerList({ UserId: ownerId, CustomerTagId: 0 });
        const rows = (res?.ResultData ?? []).filter(c => !!c.MobileNumber && !!c.CustomerName);
        setCustomers(rows);
        setCustomersFailed(rows.length === 0);
      } catch {
        setCustomersFailed(true);
      } finally {
        setCustomersLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const customerOptions = useMemo(
    () => customers.map((c, i) => ({ id: i, label: `${c.MobileNumber} - ${c.CustomerName}` })),
    [customers],
  );
  const useCustomerDropdown = filter === 'Customer No.' && !customersFailed;

  // Opening a task the technician picked in the accept sheet (same routing as tapping it in
  // the task list).
  const openTask = useOpenTask(navigation, {
    onLateInactive: () => showFailureMsg(t('rn_it_s_too_late_to_accept_this_task')),
  });

  const handleSubmit = async () => {
    const value = (useCustomerDropdown ? pickedCustomer?.MobileNumber ?? '' : inputValue).trim();
    if (!value || submitting) return;

    setErrorText('');
    setSubmitting(true);
    try {
      const storedUid = await AsyncStorage.getItem('uid');

      if (!storedUid) {
        setErrorText('Unable to identify your account. Please log in again.');
        return;
      }

      // Java (RoutineServiceFragment.getRoutineAssetList/getRoutineCustomerList) passes
      // the technician's own SharedPrefManager userId here, not the employer/owner id.
      const params =
        filter === 'Asset'
          ? {userId: Number(storedUid), assetId: value}
          : {userId: Number(storedUid), customerNum: value};

      const response = await getRoutineCustomerList(params);
      const result = response?.ResultData;

      if (!result || (!result.CustomerName && !result.Address)) {
        // A customer picked from the owner's list is known to exist; use its details if the
        // lookup cannot find it by number.
        if (useCustomerDropdown && pickedCustomer) {
          setLookupResult(pickedCustomer as any);
          return;
        }
        setErrorText('Customer does not exist.');
        return;
      }

      setLookupResult(result);
    } catch (e) {
      setErrorText(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Red top band — accounts for status bar */}
      <View style={[styles.redBg, { height: vs(10) }]} />

      {/* White content sheet */}
      <View style={styles.whiteSheet}>
        <Text style={styles.titleText}>
          {t('rn_enter_asset_id_model_no_or_customer_number')}
        </Text>

        {/* Dropdown trigger */}
        <Pressable
          style={styles.dropdownTrigger}
          onPress={() => setDropdownOpen(true)}
        >
          <Text style={styles.dropdownValue}>{filter}</Text>
          <Ionicons name="chevron-down" size={scale(20)} color="#000" />
        </Pressable>

        {useCustomerDropdown ? (
          <Pressable
            style={[styles.dropdownTrigger, { marginBottom: ms(20) }]}
            onPress={() => setCustomerPickerOpen(true)}
          >
            {customersLoading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text
                style={[styles.dropdownValue, !pickedCustomer && { color: '#9ca3af', fontSize: sp(15) }]}
                numberOfLines={1}
              >
                {pickedCustomer
                  ? `${pickedCustomer.MobileNumber} - ${pickedCustomer.CustomerName}`
                  : tr('Select Customer Mobile Number')}
              </Text>
            )}
            <Ionicons name="chevron-down" size={scale(20)} color="#000" />
          </Pressable>
        ) : (
          <>
        {/* Text input -- Java: routineAssetId is textCapCharacters restricted to
            A-Z0-9 (android:digits), routineCutomerNo is numeric. Both maxLength 10. */}
        <TextInput
          placeholder={filter === 'Asset' ? tr('Enter Asset ID/Model No.') : tr('Enter Customer Mobile Number')}
          placeholderTextColor="#9ca3af"
          style={styles.input}
          cursorColor={COLORS.primary}
          value={inputValue}
          onChangeText={text => {
            const next =
              filter === 'Asset'
                ? text.toUpperCase().replace(/[^A-Z0-9]/g, '')
                : text.replace(/[^0-9]/g, '');
            setInputValue(next);
            if (errorText) setErrorText('');
          }}
          maxLength={10}
          autoCapitalize={filter === 'Asset' ? 'characters' : 'none'}
          keyboardType={filter === 'Customer No.' ? 'number-pad' : 'default'}
          returnKeyType="done"
        />

          </>
        )}

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

        {/* Submit */}
        <Pressable
          style={[styles.submitBtn, (!(useCustomerDropdown ? pickedCustomer : inputValue.trim()) || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!(useCustomerDropdown ? pickedCustomer : inputValue.trim()) || submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>{t('submit').toUpperCase()}</Text>
          )}
        </Pressable>
      </View>

      <RoutineServiceAcceptModal
        visible={!!lookupResult}
        customer={lookupResult}
        onClose={() => setLookupResult(null)}
        onCreated={() => {
          setLookupResult(null);
          setInputValue('');
          setPickedCustomer(null);
        }}
        navigation={navigation}
        onOpenTask={task => {
          setLookupResult(null);
          setInputValue('');
          setPickedCustomer(null);
          openTask(task);
        }}
      />

      <SearchPickerModal
        visible={customerPickerOpen}
        title={t('rn_select_customer')}
        searchHint="Search by number or name"
        options={customerOptions}
        loading={customersLoading}
        onSelect={option => {
          setPickedCustomer(customers[option.id] ?? null);
          setErrorText('');
          setCustomerPickerOpen(false);
        }}
        onClose={() => setCustomerPickerOpen(false)}
      />

      {/* Dropdown Modal */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setDropdownOpen(false)}
        />
        <View style={styles.dropdownBox}>
          {FILTER_OPTIONS.map((item) => (
            <Pressable
              key={item}
              style={({ pressed }) => [
                styles.dropdownItem,
                pressed && { backgroundColor: '#f0f0f0' },
              ]}
              onPress={() => { setFilter(item); setDropdownOpen(false); }}
            >
              <Text style={[
                styles.dropdownText,
                item === filter && { color: COLORS.primary, fontWeight: '600' },
              ]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  );
}

// Was flat wp(76) (~300px on a 390pt phone) with no ceiling -- on a tablet
// (e.g. ~1024pt landscape) that scales to ~780pt, far too wide for a form
// field or dropdown. Cap it so phones are unaffected but tablets get a
// sensible max instead of a linear percentage.
const FIELD_WIDTH = Math.min(wps(76), scale(340));

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  redBg: {
    backgroundColor: COLORS.primary,
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(28),
    borderTopRightRadius: ms(28),
    paddingHorizontal: ms(24),
    paddingTop: ms(24),
    alignItems: 'center',
  },
  titleText: {
    fontSize: sp(16),
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: ms(60),
    marginBottom: ms(40),
    fontWeight: '500',
    lineHeight: sp(24),
  },
  dropdownTrigger: {
    height: ms(50),
    width: FIELD_WIDTH,
    borderRadius: ms(30),
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(20),
    marginBottom: ms(16),
  },
  dropdownValue: {
    fontSize: sp(16),
    color: '#111',
  },
  input: {
    height: ms(50),
    width: FIELD_WIDTH,
    borderRadius: ms(30),
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: ms(20),
    fontSize: sp(15),
    marginBottom: ms(20),
    color: COLORS.textPrimary,
  },
  submitBtn: {
    height: ms(50),
    width: FIELD_WIDTH,
    borderRadius: ms(35),
    backgroundColor: '#2f2f2f',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#fff',
    fontSize: sp(17),
    fontWeight: '600',
    letterSpacing: 1,
  },
  errorText: {
    color: '#DC2626',
    fontSize: sp(13),
    textAlign: 'center',
    marginBottom: ms(12),
    width: FIELD_WIDTH,
  },

  // Dropdown popup — centred, no magic absolute top
  dropdownBox: {
    position: 'absolute',
    alignSelf: 'center',
    top: '27%',
    width: FIELD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: ms(12),
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: ms(16),
    paddingHorizontal: ms(20),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  dropdownText: {
    fontSize: sp(17),
    color: COLORS.textQuaternary,
    fontWeight: '400',
  },
});