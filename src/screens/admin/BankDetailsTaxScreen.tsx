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
import {ms, scale, sp, vs} from '../../utils/responsive';
import {sanitizeDecimalInput} from '../../utils/decimal';
import {getProfileDetails, updateUser} from '../../api/users/usersService';
import type {
  UserDetailsLstOwnerTaxDetailsDtos,
  UserDetailsOwnerAccountDetailsDto,
} from '../../api/users/users.types';

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
  const [activeTab, setActiveTab] = useState<'bank' | 'tax'>('bank');
  const [loading, setLoading] = useState(true);
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
      Alert.alert('Photo', 'Unable to read the selected image. Please try again.');
      return;
    }
    setPickedQrImage({
      uri: asset.uri,
      base64: asset.base64,
      fileName: asset.fileName || `qr_${Date.now()}.jpg`,
    });
  };

  const showImagePickerOptions = () => {
    Alert.alert('QR Code', 'Add a QR code image', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await launchCameraWithPermission({mediaType: 'photo', includeBase64: true, quality: 0.6, saveToPhotos: true});
          const asset = result.assets?.[0];
          if (asset) applyPickedImage(asset);
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await launchImageLibrary({mediaType: 'photo', includeBase64: true, quality: 0.6, selectionLimit: 1});
          const asset = result.assets?.[0];
          if (asset) applyPickedImage(asset);
        },
      },
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const handlePay = () => {
    const link = bankFields.PaymentLink.trim();
    if (!link.startsWith('http://') && !link.startsWith('https://')) {
      Alert.alert('Payment Link', 'Enter a valid payment link starting with http:// or https:// first.');
      return;
    }
    Linking.openURL(link).catch(() => {
      Alert.alert('Payment Link', 'Unable to open this link.');
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
        Alert.alert('Success', response?.Message ?? 'Bank details updated successfully.');
        fetchProfile();
      } else {
        Alert.alert('Bank Details', response?.Message ?? 'Unable to update bank details.');
      }
    } catch (e) {
      Alert.alert('Bank Details', e instanceof Error ? e.message : 'Unable to update bank details.');
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
      Alert.alert('Tax Details', 'Please fill in both fields for every tax row.');
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
        Alert.alert('Success', response?.Message ?? 'Tax details updated successfully.');
        fetchProfile();
      } else {
        Alert.alert('Tax Details', response?.Message ?? 'Unable to update tax details.');
      }
    } catch (e) {
      Alert.alert('Tax Details', e instanceof Error ? e.message : 'Unable to update tax details.');
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
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabButton, activeTab === 'bank' && styles.tabActive]}
          onPress={() => setActiveTab('bank')}>
          <Text style={[styles.tabButtonText, activeTab === 'bank' && styles.tabButtonTextActive]}>
            Bank Details
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'tax' && styles.tabActive]}
          onPress={() => setActiveTab('tax')}>
          <Text style={[styles.tabButtonText, activeTab === 'tax' && styles.tabButtonTextActive]}>
            Tax Details
          </Text>
        </Pressable>
      </View>

      {activeTab === 'bank' ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Order follows fragment_bankdetails.xml: header, fields, then the QR image. */}
          <Text style={styles.label}>Bank Account Details</Text>
          {(
            [
              ['Bank Name', 'BankName'],
              ['IFSC/Swift', 'IFSC_Code'],
              ['Account Number', 'AccountNumber'],
              ['Branch Address', 'BranchAddress'],
              ['UPI ID', 'UPI_Id'],
              ['Payment Link', 'PaymentLink'],
            ] as const
          ).map(([label, field]) => (
            <View key={field}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                placeholder={label}
                placeholderTextColor={COLORS.textMuted}
                value={bankFields[field]}
                onChangeText={t => setBankFields(f => ({...f, [field]: t}))}
                autoCapitalize={field === 'IFSC_Code' ? 'characters' : 'sentences'}
              />
            </View>
          ))}

          <Pressable style={styles.qrPicker} onPress={showImagePickerOptions}>
            {pickedQrImage ? (
              <Image source={{uri: pickedQrImage.uri}} style={styles.qrPreview} />
            ) : existingQrImage ? (
              <Image source={{uri: existingQrImage}} style={styles.qrPreview} />
            ) : (
              <Text style={styles.qrPickerText}>+ Add QR Code</Text>
            )}
          </Pressable>

          <View style={styles.buttonRow}>
            <Pressable style={styles.payButton} onPress={handlePay}>
              <Text style={styles.payButtonText}>Pay</Text>
            </Pressable>
            <Pressable
              style={[styles.saveButton, savingBank && styles.saveButtonDisabled]}
              onPress={handleSaveBank}
              disabled={savingBank}>
              {savingBank ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>Update</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {taxRows.map((row, index) => (
            <View key={index} style={styles.taxRow}>
              <TextInput
                style={[styles.input, styles.taxNameInput]}
                placeholder="Tax Name"
                placeholderTextColor={COLORS.textMuted}
                value={row.TaxName}
                onChangeText={t => updateTaxRow(index, 'TaxName', t)}
              />
              <TextInput
                style={[styles.input, styles.taxPercentInput]}
                placeholder="%"
                placeholderTextColor={COLORS.textMuted}
                value={row.TaxPercentage}
                onChangeText={t => updateTaxRow(index, 'TaxPercentage', sanitizeDecimalInput(t))}
                keyboardType="decimal-pad"
              />
              <Pressable
                hitSlop={8}
                onPress={() => removeTaxRow(index)}
                disabled={taxRows.length <= 1}
                style={styles.removeTaxButton}>
                <Text style={[styles.removeTaxButtonText, taxRows.length <= 1 && styles.removeTaxButtonTextDisabled]}>
                  ✕
                </Text>
              </Pressable>
            </View>
          ))}

          <Pressable
            style={[styles.addTaxButton, !canAddTaxRow && styles.addTaxButtonDisabled]}
            onPress={addTaxRow}
            disabled={!canAddTaxRow}>
            <Text style={styles.addTaxButtonText}>+ Add More</Text>
          </Pressable>

          <Pressable
            style={[styles.saveButton, styles.fullWidthSaveButton, savingTax && styles.saveButtonDisabled]}
            onPress={handleSaveTax}
            disabled={savingTax}>
            {savingTax ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Update</Text>
            )}
          </Pressable>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
};

const THEME_PRIMARY = '#c3002f';

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
    padding: ms(16),
    paddingBottom: vs(40),
  },
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
    flex: 1,
    borderWidth: 1,
    borderColor: THEME_PRIMARY,
    borderRadius: scale(10),
    paddingVertical: vs(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: THEME_PRIMARY,
    fontSize: sp(15),
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    backgroundColor: THEME_PRIMARY,
    borderRadius: scale(10),
    paddingVertical: vs(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthSaveButton: {
    marginTop: vs(10),
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: sp(15),
    fontWeight: '700',
  },
  taxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  taxNameInput: {
    flex: 2,
  },
  taxPercentInput: {
    flex: 1,
  },
  removeTaxButton: {
    paddingHorizontal: scale(6),
    paddingBottom: vs(14),
  },
  removeTaxButtonText: {
    color: THEME_PRIMARY,
    fontSize: sp(18),
    fontWeight: '700',
  },
  removeTaxButtonTextDisabled: {
    color: '#d1d5db',
  },
  addTaxButton: {
    alignSelf: 'flex-start',
    paddingVertical: vs(8),
  },
  addTaxButtonDisabled: {
    opacity: 0.4,
  },
  addTaxButtonText: {
    color: THEME_PRIMARY,
    fontSize: sp(14),
    fontWeight: '700',
  },
});

export default BankDetailsTaxScreen;
