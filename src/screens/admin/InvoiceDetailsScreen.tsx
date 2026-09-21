// src/screens/admin/InvoiceDetailsScreen.tsx

import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  getInvoicedetailsByInvoiceId,
  deleteInvoiceDetails,
  getInvoicePdf,
  saveInvoicePaymmentDetails,
  invoiceFollowUpNotes,
} from '../../api/accountManagement/accountManagementService';
import type {InvoiceDetailsDTOResultData} from '../../api/accountManagement/accountManagement.types';
import {scale, sp, vs, ms} from '../../utils/responsive';
import BackBar from '../../components/BackBar';

const THEME_PRIMARY = '#c3002f';
const HEADER_PRIMARY = '#a80030';
const STATUS_ORANGE = '#F4A62A';
const GREEN_AMOUNT = '#2E7D32';
const RED = '#c3002f';

// Matches Java's UpdatePaymentStatus() dialog spinner exactly
// (dialog_update_payment_status / InvoiceDetailsFragment.java).
const PAYMENT_TYPES = ['Cash', 'UPI', 'NEFT', 'Cheque', 'Credit', 'Other'] as const;

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatAmount = (value: unknown) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num.toFixed(1) : '0.0';
};

const formatPercent = (value: unknown) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num.toFixed(1) : '0.0';
};

const formatDateOnly = (raw?: string | null) => {
  const value = String(raw ?? '').trim();
  if (!value) {
    return '-';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.split('T')[0];
  }
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}-${month}-${year}`;
};

const getStatusColor = (statusLabel: string) => {
  const normalized = statusLabel.trim().toLowerCase();
  if (normalized === 'paid') {
    return GREEN_AMOUNT;
  }
  return STATUS_ORANGE;
};

type InvoiceDetailsScreenProps = {
  ownerId: number;
  invoiceId: number;
  initialStatusLabel?: string;
  initialTaskName?: string;
  onBack: () => void;
  onDeleted?: () => void;
};

const InvoiceDetailsScreen = ({
  ownerId,
  invoiceId,
  initialStatusLabel,
  initialTaskName,
  onBack,
  onDeleted,
}: InvoiceDetailsScreenProps) => {
  const [details, setDetails] = useState<InvoiceDetailsDTOResultData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<string>('');
  const [isPaymentTypeOpen, setIsPaymentTypeOpen] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(getTodayDateString());
  const [followUpNote, setFollowUpNote] = useState('');
  const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);

  const loadDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getInvoicedetailsByInvoiceId({
        InvoiceId: invoiceId,
        UserId: ownerId,
      });
      const resultData = response.ResultData ?? null;
      setDetails(resultData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load invoice details.';
      Alert.alert('Invoice details error', message);
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId, ownerId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleDelete = () => {
    Alert.alert('Delete Invoice', 'Are you sure you want to delete this invoice?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            await deleteInvoiceDetails({Id: invoiceId, UserId: ownerId});
            if (onDeleted) {
              onDeleted();
            } else {
              onBack();
            }
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unable to delete invoice.';
            Alert.alert('Delete failed', message);
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await getInvoicePdf({UserId: ownerId, invoiceId: invoiceId});
      const pdfUrl = String(response.ResultData?.InvoicePdfPath ?? '').trim();
      if (!pdfUrl) {
        Alert.alert('Download', 'PDF is not available for this invoice.');
        return;
      }
      await Linking.openURL(pdfUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to download PDF.';
      Alert.alert('Download failed', message);
    } finally {
      setIsDownloading(false);
    }
  };

  const openPaymentModal = () => {
    setPaymentAmount('');
    setPaymentType('');
    setIsPaymentTypeOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async () => {
    const amount = Number(paymentAmount);
    if (!paymentAmount.trim() || !Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Record Payment', 'Please enter a valid amount.');
      return;
    }
    if (!paymentType) {
      Alert.alert('Record Payment', 'Please select a payment type.');
      return;
    }
    const remaining = Number(details?.RemainingAmount ?? 0);
    if (remaining > 0 && amount > remaining) {
      Alert.alert('Record Payment', 'Entered amount is greater than the remaining amount.');
      return;
    }

    setIsSavingPayment(true);
    try {
      // Java's UpdatePaymentStatus() sends Id == InvoiceId for this endpoint
      // (see InvoiceDetailsFragment.java#updatePayment) — mirrored here.
      await saveInvoicePaymmentDetails({
        Id: invoiceId,
        InvoiceId: invoiceId,
        Amount: amount,
        CreatedBy: ownerId,
        UserId: ownerId,
        PaymentTransactionType: paymentType,
        IsActive: true,
      });
      setIsPaymentModalOpen(false);
      await loadDetails();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to record payment.';
      Alert.alert('Payment failed', message);
    } finally {
      setIsSavingPayment(false);
    }
  };

  const openFollowUpModal = () => {
    setFollowUpDate(getTodayDateString());
    setFollowUpNote('');
    setIsFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = async () => {
    if (!followUpDate.trim()) {
      Alert.alert('Follow Up', 'Please enter a date.');
      return;
    }
    setIsSavingFollowUp(true);
    try {
      await invoiceFollowUpNotes({
        InvoiceId: invoiceId,
        // Java hardcodes this to 1 with the comment "need to pass final value
        // once Details API is ready" — it's a known placeholder in the
        // original app itself, not something we're guessing at here.
        StatuiId: 1,
        UserId: ownerId,
        FolowUpDate: `${followUpDate.trim()}T00:00:00`,
        Notes: followUpNote.trim(),
      });
      setIsFollowUpModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save follow-up.';
      Alert.alert('Follow up failed', message);
    } finally {
      setIsSavingFollowUp(false);
    }
  };

  const statusLabel = initialStatusLabel || 'Pending';
  // Java's InvoiceDetailsFragment hides edit/delete/follow-up once an invoice
  // is fully Paid (only the download icon stays), and hides download while
  // Partial Paid / UnPaid — see setInvoiceStatusUI() in the Java source.
  const isPaid = statusLabel.trim().toLowerCase() === 'paid';
  const itemList = details?.ItemList ?? [];
  const serviceList = details?.ServiceList ?? [];
  const paymentList = details?.PaymentList ?? [];

  return (
    <View style={styles.screen}>
      <BackBar onBack={onBack} />

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.card}>
          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={THEME_PRIMARY} size="large" />
            </View>
          ) : (
            <>
              <View style={styles.topRow}>
                <Text style={[styles.statusLabel, {color: getStatusColor(statusLabel)}]}>
                  {statusLabel}
                </Text>
                <View style={styles.iconRow}>
                  {!isPaid ? (
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={openPaymentModal}
                      hitSlop={8}>
                      <Text style={styles.iconText}>{'\u270E'}</Text>
                    </TouchableOpacity>
                  ) : null}
                  {!isPaid ? (
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={handleDelete}
                      disabled={isDeleting}
                      hitSlop={8}>
                      <Text style={styles.iconTextDelete}>{'\uD83D\uDDD1'}</Text>
                    </TouchableOpacity>
                  ) : null}
                  {!isPaid ? (
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={openFollowUpModal}
                      hitSlop={8}>
                      <Text style={styles.iconText}>{'\uD83D\uDCC5'}</Text>
                    </TouchableOpacity>
                  ) : null}
                  {isPaid ? (
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={handleDownload}
                      disabled={isDownloading}
                      hitSlop={8}>
                      <Text style={styles.iconText}>{'\u2B07'}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              <Text style={styles.sectionTitle}>Invoice Details</Text>
              <DetailRow
                label="Task Name"
                value={
                  details?.QuotationCode ??
                  initialTaskName ??
                  '-'
                }
              />
              <DetailRow
                label="Invoice Date"
                value={formatDateOnly(details?.InvoiceDateTime)}
              />
              <DetailRow label="Invoice ID" value={details?.InvoiceCode ?? '-'} />

              <Text style={styles.sectionTitle}>Customer Details</Text>
              <DetailRow
                label="Customer Name"
                value={details?.CustomerName ?? '-'}
              />
              <DetailRow
                label="Customer Number"
                value={details?.MobileNumber ?? '-'}
              />
              <DetailRow label="Address" value={details?.CustAddress ?? '-'} />
              <DetailRow
                label="Flat/Building/Parcel"
                value={details?.BuildingNumber ?? '-'}
              />
              <DetailRow label="Landmark" value={details?.Landmark ?? '-'} />

              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, styles.colName]}>Item Details</Text>
                <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
                <Text style={[styles.tableHeaderCell, styles.colPrice]}>Unit Price</Text>
                <Text style={[styles.tableHeaderCell, styles.colPrice]}>Total Price</Text>
              </View>
              {itemList.map((line, index) => (
                <View key={`item-${index}`} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colName]}>
                    {line.ItemName ?? '-'}
                  </Text>
                  <Text style={[styles.tableCell, styles.colQty]}>
                    {line.Quantity ?? 0}
                  </Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>
                    Rs. {formatAmount(line.UnitPrice)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>
                    Rs. {formatAmount(line.TotalPrice)}
                  </Text>
                </View>
              ))}

              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, styles.colName]}>Service Name</Text>
                <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
                <Text style={[styles.tableHeaderCell, styles.colPrice]}>Service Price</Text>
              </View>
              {serviceList.map((line, index) => (
                <View key={`service-${index}`} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colName]}>
                    {line.ServiceName ?? '-'}
                  </Text>
                  <Text style={[styles.tableCell, styles.colQty]}>
                    {line.Quantity ?? 0}
                  </Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>
                    Rs. {formatAmount(line.Price)}
                  </Text>
                </View>
              ))}

              <Text style={styles.sectionTitle}>Tax,Discounts & Quote Amount</Text>
              <DetailRow
                label="Total Amount"
                value={`Rs. ${formatAmount(details?.SubTotalAmount)}`}
              />
              <DetailRow
                label="Discount"
                value={`Rs. ${formatAmount(details?.DiscountAmounnt)}(${formatPercent(
                  details?.Discount,
                )}%)`}
              />
              <DetailRow
                label="Tax"
                value={`Rs. ${formatAmount(details?.TaxAmount)}(${formatPercent(
                  details?.Tax,
                )}%)`}
              />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabelBold}>Grand Total Amount</Text>
                <Text style={styles.grandTotalValue}>
                  Rs. {formatAmount(details?.GrandTotalAmount)}
                </Text>
              </View>

              <Text style={styles.sectionTitle}>Payment History</Text>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, styles.colName]}>Date</Text>
                <Text style={[styles.tableHeaderCell, styles.colName]}>Payment Type</Text>
                <Text style={[styles.tableHeaderCell, styles.colPrice]}>Received Amount</Text>
              </View>
              {paymentList.map((payment, index) => (
                <View key={`payment-${index}`} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colName]}>
                    {formatDateOnly(payment.PaymentDate)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colName]}>
                    {payment.PaymentTransactionType ?? '-'}
                  </Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>
                    Rs. {formatAmount(payment.Amount)}
                  </Text>
                </View>
              ))}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabelBold}>Pending Amount</Text>
                <Text style={styles.pendingAmountValue}>
                  Rs. {formatAmount(details?.RemainingAmount)}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={isPaymentModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsPaymentModalOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsPaymentModalOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <Text style={styles.modalSubtitle}>
              Remaining: Rs. {formatAmount(details?.RemainingAmount)}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Amount"
              placeholderTextColor="#9aa0a6"
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
            />
            <Pressable
              style={styles.modalDropdownField}
              onPress={() => setIsPaymentTypeOpen(prev => !prev)}>
              <Text
                style={paymentType ? styles.modalDropdownValueText : styles.modalDropdownPlaceholderText}
                numberOfLines={1}>
                {paymentType || 'Select Payment Type'}
              </Text>
              <Ionicons name="chevron-down" style={styles.modalDropdownChevron} />
            </Pressable>
            {isPaymentTypeOpen ? (
              <View style={styles.modalDropdownList}>
                {PAYMENT_TYPES.map(type => (
                  <Pressable
                    key={type}
                    style={styles.modalDropdownItem}
                    onPress={() => {
                      setPaymentType(type);
                      setIsPaymentTypeOpen(false);
                    }}>
                    <Text style={styles.modalDropdownItemText}>{type}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setIsPaymentModalOpen(false)}
                disabled={isSavingPayment}>
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSavePayment}
                disabled={isSavingPayment}>
                <Text style={styles.modalButtonPrimaryText}>
                  {isSavingPayment ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isFollowUpModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsFollowUpModalOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsFollowUpModalOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>Follow Up</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9aa0a6"
              value={followUpDate}
              onChangeText={setFollowUpDate}
            />
            <TextInput
              style={styles.modalNoteInput}
              placeholder="Note (optional)"
              placeholderTextColor="#9aa0a6"
              value={followUpNote}
              onChangeText={setFollowUpNote}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setIsFollowUpModalOpen(false)}
                disabled={isSavingFollowUp}>
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveFollowUp}
                disabled={isSavingFollowUp}>
                <Text style={styles.modalButtonPrimaryText}>
                  {isSavingFollowUp ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const DetailRow = ({label, value}: {label: string; value: React.ReactNode}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel} numberOfLines={2}>
      {label}
    </Text>
    <Text style={styles.detailValue} numberOfLines={3}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME_PRIMARY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: HEADER_PRIMARY,
    paddingHorizontal: ms(12),
    paddingVertical: ms(14),
  },
  headerIconButton: {
    padding: ms(4),
  },
  headerIconText: {
    color: '#FFFFFF',
    fontSize: sp(18),
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: sp(18),
    fontWeight: '700',
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: ms(16),
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: ms(12),
    paddingBottom: ms(30),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    padding: ms(16),
  },
  centerBox: {
    paddingVertical: ms(60),
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(8),
  },
  statusLabel: {
    fontWeight: '700',
    fontSize: sp(14),
  },
  iconRow: {
    flexDirection: 'row',
    gap: ms(14),
  },
  iconButton: {
    padding: ms(2),
  },
  iconText: {
    fontSize: sp(16),
    color: '#1c1c1e',
  },
  iconTextDelete: {
    fontSize: sp(16),
    color: RED,
  },
  sectionTitle: {
    fontSize: sp(13),
    fontWeight: '700',
    color: '#1c1c1e',
    marginTop: ms(14),
    marginBottom: ms(6),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: ms(3),
  },
  detailLabel: {
    fontSize: sp(12),
    color: '#1c1c1e',
    flex: 1,
  },
  detailLabelBold: {
    fontSize: sp(12),
    color: '#1c1c1e',
    fontWeight: '700',
    flex: 1,
  },
  detailValue: {
    fontSize: sp(12),
    color: '#8a8f98',
    flex: 1,
    textAlign: 'right',
  },
  grandTotalValue: {
    fontSize: sp(13),
    color: GREEN_AMOUNT,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  pendingAmountValue: {
    fontSize: sp(13),
    color: RED,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    marginTop: ms(12),
    marginBottom: ms(4),
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: ms(3),
  },
  tableHeaderCell: {
    fontSize: sp(12),
    fontWeight: '700',
    color: '#1c1c1e',
  },
  tableCell: {
    fontSize: sp(12),
    color: '#4c4c4e',
  },
  colName: {
    flex: 2,
  },
  colQty: {
    flex: 1,
    textAlign: 'center',
  },
  colPrice: {
    flex: 1,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: scale(24),
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(14),
    padding: scale(18),
  },
  modalTitle: {
    fontSize: sp(15),
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: vs(6),
  },
  modalSubtitle: {
    fontSize: sp(12),
    color: '#6b7280',
    marginBottom: vs(14),
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: scale(10),
    height: vs(44),
    paddingHorizontal: scale(12),
    fontSize: sp(13),
    color: '#222',
    marginBottom: vs(12),
  },
  modalNoteInput: {
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: scale(10),
    minHeight: vs(70),
    paddingHorizontal: scale(12),
    paddingVertical: vs(10),
    fontSize: sp(13),
    color: '#222',
    textAlignVertical: 'top',
    marginBottom: vs(16),
  },
  modalDropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: scale(10),
    height: vs(44),
    paddingHorizontal: scale(12),
    marginBottom: vs(12),
  },
  modalDropdownPlaceholderText: {
    fontSize: sp(13),
    color: '#9aa0a6',
    flex: 1,
  },
  modalDropdownValueText: {
    fontSize: sp(13),
    color: '#222',
    flex: 1,
  },
  modalDropdownChevron: {
    fontSize: sp(14),
    color: '#8a8f98',
    marginLeft: scale(6),
  },
  modalDropdownList: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: scale(10),
    marginTop: vs(-8),
    marginBottom: vs(12),
    overflow: 'hidden',
  },
  modalDropdownItem: {
    paddingVertical: vs(10),
    paddingHorizontal: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f4',
  },
  modalDropdownItemText: {
    fontSize: sp(13),
    color: '#222',
  },
  modalActions: {
    flexDirection: 'row',
    gap: scale(10),
  },
  modalButton: {
    flex: 1,
    height: vs(44),
    borderRadius: scale(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#f1f2f4',
  },
  modalButtonSecondaryText: {
    color: '#1c1c1e',
    fontWeight: '700',
    fontSize: sp(13),
  },
  modalButtonPrimary: {
    backgroundColor: THEME_PRIMARY,
  },
  modalButtonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: sp(13),
  },
});

export default InvoiceDetailsScreen;