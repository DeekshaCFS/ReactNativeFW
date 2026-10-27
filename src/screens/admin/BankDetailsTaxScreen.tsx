// src/screens/admin/BankDetailsTaxScreen.tsx
//
// Owner-only "Bank Details & Tax" screen (Android's
// BankDetailsAndTaxFragmentTabHost, reached from SettingsFragment's
// cardView_bank row -- hidden for every non-Owner role). Two tabs: Bank
// Details (single payout bank account + UPI/payment-link/QR) and Tax
// Details (a dynamic list of named tax rates used elsewhere when building
// invoices/quotations). Both tabs read/write via the same
// Users/GetProfileDetails + Users/UpdateUser endpoints AdminProfileScreen.tsx
// already uses -- no new API surface, just two new nested fields on the
// existing update payload (see users.types.ts).

import { launchCameraWithPermission } from '../../utils/cameraPermission';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {launchImageLibrary, type Asset} from 'react-native-image-picker';
import {COLORS} from '../../theme/theme';
import PlaceSearchModal from '../../components/PlaceSearchModal';
import {ms, scale, sp, vs} from '../../utils/responsive';
import {sanitizeDecimalInput} from '../../utils/decimal';
import {getProfileDetails, updateUser} from '../../api/users/usersService';
import type {
  UserDetailsLstOwnerTaxDetailsDtos,
  UserDetailsOwnerAccountDetailsDto,
} from '../../api/users/users.types';
import { showFailureMsg, showSuccessMsg, showToast } from '../../utils/toast';
import DecimalInput from '../../components/DecimalInput';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TabStrip from '../../components/TabStrip';
import {OutlinedInput} from '../../components/OutlinedInput';

import {useTranslation} from 'react-i18next';
import { showImageSourceDialog } from '../../components/ImageSourceHost';
import {trf, tr} from '../../i18n/tr';
type Props = {
  ownerId: number;
};

type BankFields = {
  BankName: string;
  IFSC_Code: string;
  AccountNumber: string;
  BranchAddress: string;
  UPI_Id: string;
  PaymentLink: string;
};

type PickedImage = {
  uri: string;
  base64: string;
  fileName: string;
};

type TaxRow = {
  TaxDetailId?: number;
  TaxName: string;
  TaxPercentage: string;
};

const MAX_TAX_ROWS = 10;

const emptyBankFields: BankFields = {
  BankName: '',
  IFSC_Code: '',
  AccountNumber: '',
  BranchAddress: '',
  UPI_Id: '',
  PaymentLink: '',
};

const BankDetailsTaxScreen: React.FC<Props> = ({ownerId}) => {
  const {t} = useTranslation();
  const [activeTab, setActiveTab] = useState<'bank' | 'tax'>('bank');
  const [loading, setLoading] = useState(true);
  const [placeSearchOpen, setPlaceSearchOpen] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [savingTax, setSavingTax] = useState(false);

  const [bankFields, setBankFields] = useState<BankFields>(emptyBankFields);
  const [existingQrImage, setExistingQrImage] = useState<string | undefined>(undefined);
  const [pickedQrImage, setPickedQrImage] = useState<PickedImage | null>(null);

  const [taxRows, setTaxRows] = useState<TaxRow[]>([{TaxName: '', TaxPercentage: ''}]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await getProfileDetails({UserId: ownerId});
      const bank: UserDetailsOwnerAccountDetailsDto | undefined = response?.ResultData?.ownerAccountDetailsDto;
      const taxes: UserDetailsLstOwnerTaxDetailsDtos[] | undefined = response?.ResultData?.lstOwnerTaxDetailsDtos;

      setBankFields({
        BankName: bank?.BankName ?? '',
        IFSC_Code: bank?.IFSC_Code ?? '',
        AccountNumber: bank?.AccountNumber ?? '',
        BranchAddress: bank?.BranchAddress ?? '',
        UPI_Id: bank?.UPI_Id ?? '',
        PaymentLink: bank?.PaymentLink ?? '',
      });
      setExistingQrImage(bank?.QRCodeImage);
      setPickedQrImage(null);

      setTaxRows(
        Array.isArray(taxes) && taxes.length > 0
          ? taxes.map(t => ({
              TaxDetailId: t.TaxDetailId,
              TaxName: t.TaxName ?? '',
              TaxPercentage: t.TaxPercentage != null ? String(t.TaxPercentage) : '',
            }))
          : [{TaxName: '', TaxPercentage: ''}],
      );
    } catch {
      // Leave fields blank on failure — this mirrors a first-time setup.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  // ── Bank tab ──

  const applyPickedImage = (asset: Asset) => {
    if (!asset.base64 || !asset.uri) {
      showToast(t('rn_unable_to_read_the_selected_image_please_t'));
      return;
    }
    setPickedQrImage({
      uri: asset.uri,
      base64: asset.base64,
      fileName: asset.fileName || `qr_${Date.now()}.jpg`,
    });
  };

  const showImagePickerOptions = () => {
    showImageSourceDialog(
      async () => {
        const result = await launchCameraWithPermission({mediaType: 'photo', includeBase64: true, quality: 0.6, saveToPhotos: true});
        const asset = result.assets?.[0];
        if (asset) applyPickedImage(asset);
      },
      async () => {
        const result = await launchImageLibrary({mediaType: 'photo', includeBase64: true, quality: 0.6, selectionLimit: 1});
        const asset = result.assets?.[0];
        if (asset) applyPickedImage(asset);
      },
    );
  };

  const handlePay = () => {
    const link = bankFields.PaymentLink.trim();
    if (!link.startsWith('http://') && !link.startsWith('https://')) {
      showFailureMsg(t('rn_enter_a_valid_payment_link_starting_with_h'));
      return;
    }
    Linking.openURL(link).catch(() => {
      showToast(t('rn_unable_to_open_this_link'));
    });
  };

  const handleSaveBank = async () => {
    setSavingBank(true);
    try {
      const response = await updateUser({
        UserId: ownerId,
        UpdatedBy: ownerId,
        ownerAccountDetailsDto: {
          ...bankFields,
          QRCodeImageFileBase64Str: pickedQrImage?.base64,
          QRCodeImageFileName: pickedQrImage?.fileName,
        },
      });
      const code = String(response?.Code ?? '').toLowerCase();
      if (code === '200' || code === 'success') {
        showSuccessMsg(response?.Message ?? 'Bank details updated successfully.');
        fetchProfile();
      } else {
        showFailureMsg(response?.Message ?? 'Unable to update bank details.');
      }
    } catch (e) {
      showFailureMsg(e instanceof Error ? e.message : tr('Unable to update bank details.'));
    } finally {
      setSavingBank(false);
    }
  };

  // ── Tax tab ──

  const canAddTaxRow =
    taxRows.length < MAX_TAX_ROWS &&
    taxRows[taxRows.length - 1]?.TaxName.trim().length > 0 &&
    taxRows[taxRows.length - 1]?.TaxPercentage.trim().length > 0;

  const updateTaxRow = (index: number, field: 'TaxName' | 'TaxPercentage', value: string) => {
    setTaxRows(rows => rows.map((row, i) => (i === index ? {...row, [field]: value} : row)));
  };

  const addTaxRow = () => {
    if (!canAddTaxRow) return;
    setTaxRows(rows => [...rows, {TaxName: '', TaxPercentage: ''}]);
  };

  const removeTaxRow = (index: number) => {
    setTaxRows(rows => (rows.length > 1 ? rows.filter((_, i) => i !== index) : rows));
  };

  const areAllTaxRowsFilled = taxRows.every(r => r.TaxName.trim().length > 0 && r.TaxPercentage.trim().length > 0);

  const handleSaveTax = async () => {
    if (!areAllTaxRowsFilled) {
      showFailureMsg(t('rn_please_fill_in_both_fields_for_every_tax_r'));
      return;
    }
    setSavingTax(true);
    try {
      const response = await updateUser({
        UserId: ownerId,
        UpdatedBy: ownerId,
        lstOwnerTaxDetailsDtos: taxRows.map(row => ({
          TaxDetailId: row.TaxDetailId,
          TaxName: row.TaxName.trim(),
          TaxPercentage: Number(row.TaxPercentage),
        })),
      });
      const code = String(response?.Code ?? '').toLowerCase();
      if (code === '200' || code === 'success') {
        showSuccessMsg(response?.Message ?? 'Tax details updated successfully.');
        fetchProfile();
      } else {
        showFailureMsg(response?.Message ?? 'Unable to update tax details.');
      }
    } catch (e) {
      showFailureMsg(e instanceof Error ? e.message : tr('Unable to update tax details.'));
    } finally {
      setSavingTax(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TabStrip
        tabs={[
          {key: 'bank', label: tr('BANK DETAILS')},
          {key: 'tax', label: tr('TAX DETAILS')},
        ]}
        active={activeTab}
        onChange={k => setActiveTab(k as 'bank' | 'tax')}
      />

      {activeTab === 'bank' ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* fragment_bankdetails.xml: centred 20sp heading, first three fields in the left half
              with the QR image on the right, then full-width fields. */}
          <Text style={styles.heading}>{t('rn_bank_account_details')}</Text>
          <View style={styles.topRow}>
            <View style={styles.leftCol}>
              {(
                [
                  ['Bank Name', 'BankName'],
                  ['IFSC/Swift', 'IFSC_Code'],
                  ['Account Number', 'AccountNumber'],
                ] as const
              ).map(([label, field]) => (
                <OutlinedInput
                  key={field}
                  style={styles.pill}
                  placeholder={label}
                  placeholderTextColor={COLORS.lightGray}
                  value={bankFields[field]}
                  onChangeText={v => setBankFields(f => ({...f, [field]: v}))}
                  autoCapitalize={field === 'IFSC_Code' ? 'characters' : 'sentences'}
                  keyboardType={field === 'AccountNumber' ? 'number-pad' : 'default'}
                />
              ))}
            </View>
            <Pressable style={styles.qrBox} onPress={showImagePickerOptions}>
              {pickedQrImage ? (
                <Image source={{uri: pickedQrImage.uri}} style={styles.qrPreview} resizeMode="contain" />
              ) : existingQrImage ? (
                <Image source={{uri: existingQrImage}} style={styles.qrPreview} resizeMode="contain" />
              ) : (
                <Image source={require('../../../assets/images/profile_icon.png')} style={styles.qrPreview} resizeMode="contain" />
              )}
            </Pressable>
          </View>

          <Pressable onPress={() => setPlaceSearchOpen(true)}>
            <View pointerEvents="none">
              <OutlinedInput
                style={styles.pill}
                placeholder={t('rn_branch_address')}
                placeholderTextColor={COLORS.lightGray}
                value={bankFields.BranchAddress}
                editable={false}
              />
            </View>
          </Pressable>
          {(
            [
              ['UPI ID', 'UPI_Id'],
              ['Payment Link', 'PaymentLink'],
            ] as const
          ).map(([label, field]) => (
            <OutlinedInput
              key={field}
              style={styles.pill}
              placeholder={label}
              placeholderTextColor={COLORS.lightGray}
              value={bankFields[field]}
              onChangeText={v => setBankFields(f => ({...f, [field]: v}))}
              autoCapitalize="none"
            />
          ))}

          <View style={styles.buttonCol}>
            <Pressable style={styles.payButton} onPress={handlePay}>
              <Text style={styles.payButtonText}>{t('rn_pay')}</Text>
            </Pressable>
            <Pressable
              style={[styles.saveButton, savingBank && styles.saveButtonDisabled]}
              onPress={handleSaveBank}
              disabled={savingBank}>
              {savingBank ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>{t('update').toUpperCase()}</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>{t('rn_tax_details')}</Text>
          {/* add_bulk_dynamic_tax.xml: one rounded card per tax -- red "Tax #N", red cross, name +
              percent pills; "Add More" lives in the last card. */}
          {taxRows.map((row, index) => (
            <View key={index} style={styles.taxCard}>
              <View style={styles.taxCardHeader}>
                <Text style={styles.taxCardTitle}>{trf('Tax #{{n}}', { n: index + 1 })}</Text>
                <Pressable hitSlop={8} onPress={() => (index === 0 ? showFailureMsg(t('not_allowed')) : removeTaxRow(index))}>
                  <Ionicons name="close" size={ms(26)} color={THEME_PRIMARY} />
                </Pressable>
              </View>
              <View style={styles.taxRow}>
                <OutlinedInput
                  style={[styles.pill, styles.taxNameInput]}
                  placeholder={t('rn_tax_name')}
                  placeholderTextColor={COLORS.lightGray}
                  value={row.TaxName}
                  onChangeText={v => updateTaxRow(index, 'TaxName', v)}
                />
                <DecimalInput
                  style={[styles.pill, styles.taxPercentInput]}
                  label={t('rn_percent')}
                  placeholderTextColor={COLORS.lightGray}
                  value={row.TaxPercentage}
                  onChangeText={v => updateTaxRow(index, 'TaxPercentage', sanitizeDecimalInput(v))}
                />
              </View>
            </View>
          ))}

          <Pressable onPress={addTaxRow} hitSlop={8}>
            <Text style={styles.addTaxButtonText}>{t('add_more')}</Text>
          </Pressable>

          <Pressable
            style={[styles.saveButton, styles.fullWidthSaveButton, savingTax && styles.saveButtonDisabled]}
            onPress={handleSaveTax}
            disabled={savingTax}>
            {savingTax ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>{t('update').toUpperCase()}</Text>
            )}
          </Pressable>
        </ScrollView>
      )}
      <PlaceSearchModal
        visible={placeSearchOpen}
        onClose={() => setPlaceSearchOpen(false)}
        onSelect={place => {
          setBankFields(f => ({...f, BranchAddress: place.address}));
          setPlaceSearchOpen(false);
        }}
      />
    </KeyboardAvoidingView>
  );
};

const THEME_PRIMARY = '#c3002f';
const BORDER = '#8d8d8d';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    padding: ms(12),
    gap: scale(10),
  },
  tabButton: {
    flex: 1,
    paddingVertical: vs(10),
    borderRadius: scale(20),
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  tabActive: {
    backgroundColor: THEME_PRIMARY,
  },
  tabButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: sp(14),
  },
  tabButtonTextActive: {
    color: COLORS.white,
  },
  content: {
    padding: ms(20),
    paddingBottom: vs(40),
  },
  heading: {
    textAlign: 'center',
    fontSize: sp(20),
    color: COLORS.ink,
    marginBottom: ms(25),
  },
  pill: {
    height: ms(50),
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: ms(25),
    paddingHorizontal: ms(18),
    fontSize: sp(16),
    color: COLORS.ink,
    marginBottom: ms(20),
  },
  topRow: {flexDirection: 'row', gap: ms(14)},
  leftCol: {width: '52%'},
  qrBox: {flex: 1, height: ms(170), alignItems: 'center', justifyContent: 'flex-start'},
  buttonCol: {marginTop: ms(10), gap: ms(30)},
  qrPicker: {
    width: ms(110),
    height: ms(110),
    borderRadius: ms(12),
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: vs(20),
    overflow: 'hidden',
  },
  qrPreview: {
    width: '100%',
    height: '100%',
  },
  qrPickerText: {
    color: THEME_PRIMARY,
    fontSize: sp(12),
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: scale(6),
  },
  label: {
    color: '#6b7280',
    fontSize: sp(13),
    marginBottom: vs(6),
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: scale(10),
    paddingHorizontal: scale(14),
    paddingVertical: vs(10),
    fontSize: sp(15),
    color: '#111827',
    marginBottom: vs(14),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: scale(12),
    marginTop: vs(6),
  },
  payButton: {
    height: ms(50),
    backgroundColor: '#353935',
    borderRadius: ms(25),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  payButtonText: {color: '#fff', fontSize: sp(18)},
  saveButton: {
    height: ms(50),
    backgroundColor: THEME_PRIMARY,
    borderRadius: ms(25),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  fullWidthSaveButton: {
    marginTop: ms(20),
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {color: '#fff', fontSize: sp(18)},
  taxCard: {
    backgroundColor: '#fff',
    borderRadius: ms(20),
    margin: ms(5),
    marginHorizontal: -ms(15),
    marginBottom: ms(10),
    paddingBottom: ms(10),
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 2},
  },
  taxCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: ms(18),
    paddingRight: ms(14),
    paddingTop: ms(8),
    paddingBottom: ms(4),
  },
  taxCardTitle: {
    color: THEME_PRIMARY,
    fontSize: sp(15),
    fontWeight: '700',
  },
  taxRow: {
    flexDirection: 'row',
    marginLeft: ms(16),
    marginRight: ms(16),
    marginTop: ms(12),
    gap: ms(15),
  },
  taxNameInput: {flex: 1, marginBottom: ms(10)},
  taxPercentInput: {flex: 1, marginBottom: ms(10)},
  addTaxButtonText: {
    color: THEME_PRIMARY,
    fontSize: sp(18),
    fontWeight: '700',
    textAlign: 'center',
    marginTop: ms(5),
  },
});

export default BankDetailsTaxScreen;
