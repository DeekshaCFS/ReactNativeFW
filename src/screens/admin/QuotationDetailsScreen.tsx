// src/screens/admin/QuotationDetailsScreen.tsx

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
import {
  getQuotationdetailsByQuoteId,
  deleteQuotationDetails,
  getQuotationPdf,
  updateQuotationStatus,
} from '../../api/quotation/quotationService';
import type {QuotationDetailsDTOResultData} from '../../api/quotation/quotation.types';
import {sp, ms, vs, scale} from '../../utils/responsive';

const THEME_PRIMARY = '#c3002f';
const HEADER_PRIMARY = '#a80030';
const STATUS_BLUE = '#5b6bd9';
const GREEN_AMOUNT = '#2E7D32';
const RED = '#c3002f';

// Matches Java's Quotation/UpdateQuotationStatus flow (UpdateQuotationStatus()
// in QuotationDetailsFragment.java): the only status a quotation can be moved
// to from here is "Lost" (StatusId 4) — there's no full status picker.
const LOST_STATUS_ID = 4;

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

const formatDateTime = (raw?: string | null) => {
  const value = String(raw ?? '').trim();
  if (!value) {
    return '-';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  const datePart = formatDateOnly(value);
  let hours = parsed.getHours();
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  const meridiem = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  if (hours === 0) {
    hours = 12;
  }
  return `${datePart}  ${hours}:${minutes} ${meridiem}`;
};

type QuotationDetailsScreenProps = {
  ownerId: number;
  quotationId: number;
  initialStatusLabel?: string;
  onBack: () => void;
  onDeleted?: () => void;
};

const QuotationDetailsScreen = ({
  ownerId,
  quotationId,
  initialStatusLabel,
  onBack,
  onDeleted,
}: QuotationDetailsScreenProps) => {
  const [details, setDetails] = useState<QuotationDetailsDTOResultData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getQuotationdetailsByQuoteId({
        Id: quotationId,
        UserId: ownerId,
      });
      const resultData = response.ResultData ?? null;
      setDetails(resultData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load quotation details.';
      Alert.alert('Quotation details error', message);
    } finally {
      setIsLoading(false);
    }
  }, [ownerId, quotationId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleDelete = () => {
    Alert.alert('Delete Quotation', 'Are you sure you want to delete this quotation?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            await deleteQuotationDetails({Id: quotationId, UserId: ownerId});
            if (onDeleted) {
              onDeleted();
            } else {
              onBack();
            }
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unable to delete quotation.';
            Alert.alert('Delete failed', message);
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  const handleDownload = async () => {
    try {
      const response = await getQuotationPdf({Id: quotationId, UserId: ownerId});
      const resultData = response.ResultData ?? null;
      const pdfUrl = String(resultData?.QuotationPdfPath ?? '').trim();
      if (!pdfUrl) {
        Alert.alert('Download', 'PDF is not available for this quotation.');
        return;
      }
      await Linking.openURL(pdfUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to download PDF.';
      Alert.alert('Download failed', message);
    }
  };

  const handleMarkAsLost = async () => {
    setIsUpdatingStatus(true);
    try {
      await updateQuotationStatus({
        QuotationId: quotationId,
        UserId: ownerId,
        StatusId: LOST_STATUS_ID,
        Notes: statusNote.trim(),
      });
      setIsStatusModalOpen(false);
      setStatusNote('');
      await loadDetails();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update quotation status.';
      Alert.alert('Update failed', message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const status = details?.Status;
  const statusLabel =
    String(status?.StatusName ?? '').trim() ||
    initialStatusLabel ||
    'Not Assigned';

  const customer = details?.Customer;
  const location = customer?.LocationList;

  const itemList = details?.QuoteItemList ?? [];
  const serviceList = details?.QuoteServiceList ?? [];
  const taxList = details?.QuoteTaxList ?? [];
  const taxInfo = taxList?.[0];

  const extraItem = String(details?.ExtraItem ?? '').trim();
  const extraAmount = details?.ExtraAmount ?? 0;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerIconButton} hitSlop={10}>
          <Text style={styles.headerIconText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Quotation Details
        </Text>
        <View style={styles.headerRightActions} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.card}>
          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={THEME_PRIMARY} size="large" />
            </View>
          ) : (
            <>
              <View style={styles.topRow}>
                <Text style={styles.statusLabel}>{statusLabel}</Text>
                <View style={styles.iconRow}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleDelete}
                    disabled={isDeleting}
                    hitSlop={8}>
                    <Text style={styles.iconTextDelete}>{'\uD83D\uDDD1'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setIsStatusModalOpen(true)}
                    hitSlop={8}>
                    <Text style={styles.iconText}>{'\u2705'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton} onPress={handleDownload} hitSlop={8}>
                    <Text style={styles.iconText}>{'\u2B07'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Quote Details</Text>
              <DetailRow label="Quote Name" value={details?.QuoteName ?? '-'} />
              <DetailRow label="Quote ID" value={details?.QuoteCode ?? '-'} />
              <DetailRow
                label="Created Date"
                value={formatDateTime(details?.CreatedDate)}
              />
              <DetailRow
                label="Validity Date"
                value={formatDateTime(details?.ValidityDate)}
              />

              <Text style={styles.sectionTitle}>Customer Details</Text>
              <DetailRow
                label="Customer Name"
                value={customer?.CustomerName ?? '-'}
              />
              <DetailRow
                label="Customer Number"
                value={customer?.MobileNumber ?? '-'}
              />
              <DetailRow label="Address" value={location?.Address ?? '-'} />
              <DetailRow
                label="Flat/Building/Parcel"
                value={location?.BuildingNumber ?? '-'}
              />
              <DetailRow label="Landmark" value={location?.Description ?? '-'} />

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

              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, styles.colName]}>Extra Name</Text>
                <Text style={[styles.tableHeaderCell, styles.colPrice]}>Extra Price</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colName]}>{extraItem || '-'}</Text>
                <Text style={[styles.tableCell, styles.colPrice]}>Rs. {formatAmount(extraAmount)}</Text>
              </View>

              <Text style={styles.sectionTitle}>Tax,Discounts & Quote Amount</Text>
              <DetailRow
                label="Total Amount"
                value={`Rs. ${formatAmount(details?.TotalAmount)}`}
              />
              <DetailRow
                label="Discount"
                value={`Rs. ${formatAmount(taxInfo?.DiscountAmounnt)}(${formatPercent(
                  taxInfo?.Discount,
                )}%)`}
              />
              <DetailRow
                label="Tax"
                value={`Rs. ${formatAmount(taxInfo?.TaxAmount)}(${formatPercent(
                  taxInfo?.Tax,
                )}%)`}
              />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabelBold}>Grand Total Amount</Text>
                <Text style={styles.grandTotalValue}>
                  Rs. {formatAmount(details?.GrandTotalAmount)}
                </Text>
              </View>

              <Text style={styles.sectionTitle}>Terms & Conditions</Text>
              <Text style={styles.termsText}>
                {String(details?.TermCondition ?? '').trim() || '-'}
              </Text>
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={isStatusModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsStatusModalOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsStatusModalOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>Mark Quotation as Lost</Text>
            <Text style={styles.modalSubtitle}>
              This updates the quotation status to Lost. Add an optional note below.
            </Text>
            <TextInput
              style={styles.modalNoteInput}
              placeholder="Note (optional)"
              placeholderTextColor="#9aa0a6"
              value={statusNote}
              onChangeText={setStatusNote}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setIsStatusModalOpen(false)}
                disabled={isUpdatingStatus}>
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleMarkAsLost}
                disabled={isUpdatingStatus}>
                <Text style={styles.modalButtonPrimaryText}>
                  {isUpdatingStatus ? 'Updating...' : 'Mark as Lost'}
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
    color: STATUS_BLUE,
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
  termsText: {
    fontSize: sp(12),
    color: '#8a8f98',
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


export default QuotationDetailsScreen;