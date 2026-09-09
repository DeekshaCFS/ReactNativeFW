import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {type InvoiceDetails, touchlessApi} from '../api/Api';

const THEME_PRIMARY = '#c3002f';
const HEADER_PRIMARY = '#a80030';
const STATUS_ORANGE = '#F4A62A';
const GREEN_AMOUNT = '#2E7D32';
const RED = '#c3002f';

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
  const [details, setDetails] = useState<InvoiceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await touchlessApi.getInvoiceDetails({
        invoiceId,
        userId: ownerId,
      });
      const resultData = response.resultData ?? response.ResultData ?? null;
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
            await touchlessApi.deleteInvoice({invoiceId, userId: ownerId});
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

  const statusLabel = initialStatusLabel || 'Pending';
  const itemList = details?.itemList ?? details?.ItemList ?? [];
  const serviceList = details?.serviceList ?? details?.ServiceList ?? [];
  const paymentList = details?.paymentList ?? details?.PaymentList ?? [];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerIconButton}>
          <Text style={styles.headerIconText}>{'\u2630'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice Details</Text>
        <View style={styles.headerRightActions}>
          <Text style={styles.headerIconText}>{'\uD83C\uDFA7'}</Text>
          <Text style={styles.headerIconText}>{'\uD83D\uDD14'}</Text>
        </View>
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
                <Text style={[styles.statusLabel, {color: getStatusColor(statusLabel)}]}>
                  {statusLabel}
                </Text>
                <View style={styles.iconRow}>
                  <TouchableOpacity style={styles.iconButton}>
                    <Text style={styles.iconText}>{'\u270E'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleDelete}
                    disabled={isDeleting}>
                    <Text style={styles.iconTextDelete}>{'\uD83D\uDDD1'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton}>
                    <Text style={styles.iconText}>{'\uD83D\uDCC5'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Invoice Details</Text>
              <DetailRow
                label="Task Name"
                value={
                  details?.quoteTaskName ??
                  details?.QuoteTaskName ??
                  initialTaskName ??
                  '-'
                }
              />
              <DetailRow
                label="Invoice Date"
                value={formatDateOnly(details?.invoiceDateTime ?? details?.InvoiceDateTime)}
              />
              <DetailRow label="Invoice ID" value={details?.invoiceCode ?? details?.InvoiceCode ?? '-'} />

              <Text style={styles.sectionTitle}>Customer Details</Text>
              <DetailRow
                label="Customer Name"
                value={details?.customerName ?? details?.CustomerName ?? '-'}
              />
              <DetailRow
                label="Customer Number"
                value={details?.mobileNumber ?? details?.MobileNumber ?? '-'}
              />
              <DetailRow label="Address" value={details?.custAddress ?? details?.CustAddress ?? '-'} />
              <DetailRow
                label="Flat/Building/Parcel"
                value={details?.buildingNumber ?? details?.BuildingNumber ?? '-'}
              />
              <DetailRow label="Landmark" value={details?.landmark ?? details?.Landmark ?? '-'} />

              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, styles.colName]}>Item Details</Text>
                <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
                <Text style={[styles.tableHeaderCell, styles.colPrice]}>Unit Price</Text>
                <Text style={[styles.tableHeaderCell, styles.colPrice]}>Total Price</Text>
              </View>
              {itemList.map((line, index) => (
                <View key={`item-${index}`} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colName]}>
                    {line.itemName ?? line.ItemName ?? '-'}
                  </Text>
                  <Text style={[styles.tableCell, styles.colQty]}>
                    {line.quantity ?? line.Quantity ?? 0}
                  </Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>
                    Rs. {formatAmount(line.unitPrice ?? line.UnitPrice)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>
                    Rs. {formatAmount(line.totalPrice ?? line.TotalPrice)}
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
                    {line.serviceName ?? line.ServiceName ?? '-'}
                  </Text>
                  <Text style={[styles.tableCell, styles.colQty]}>
                    {line.quantity ?? line.Quantity ?? 0}
                  </Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>
                    Rs. {formatAmount(line.price ?? line.Price)}
                  </Text>
                </View>
              ))}

              <Text style={styles.sectionTitle}>Tax,Discounts & Quote Amount</Text>
              <DetailRow
                label="Total Amount"
                value={`Rs. ${formatAmount(details?.subTotalAmount ?? details?.SubTotalAmount)}`}
              />
              <DetailRow
                label="Discount"
                value={`Rs. ${formatAmount(details?.discountAmounnt ?? details?.DiscountAmounnt)}(${formatPercent(
                  details?.discount ?? details?.Discount,
                )}%)`}
              />
              <DetailRow
                label="Tax"
                value={`Rs. ${formatAmount(details?.taxAmount ?? details?.TaxAmount)}(${formatPercent(
                  details?.tax ?? details?.Tax,
                )}%)`}
              />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabelBold}>Grand Total Amount</Text>
                <Text style={styles.grandTotalValue}>
                  Rs. {formatAmount(details?.grandTotalAmount ?? details?.GrandTotalAmount)}
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
                    {formatDateOnly(payment.paymentDate ?? payment.PaymentDate)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colName]}>
                    {payment.paymentTransactionType ?? payment.PaymentTransactionType ?? '-'}
                  </Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>
                    Rs. {formatAmount(payment.amount ?? payment.Amount)}
                  </Text>
                </View>
              ))}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabelBold}>Pending Amount</Text>
                <Text style={styles.pendingAmountValue}>
                  Rs. {formatAmount(details?.remainingAmount ?? details?.RemainingAmount)}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const DetailRow = ({label, value}: {label: string; value: React.ReactNode}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
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
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  headerIconButton: {
    padding: 4,
  },
  headerIconText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 16,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 12,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontWeight: '700',
    fontSize: 14,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 14,
  },
  iconButton: {
    padding: 2,
  },
  iconText: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  iconTextDelete: {
    fontSize: 16,
    color: RED,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1c1c1e',
    marginTop: 14,
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  detailLabel: {
    fontSize: 12,
    color: '#1c1c1e',
    flex: 1,
  },
  detailLabelBold: {
    fontSize: 12,
    color: '#1c1c1e',
    fontWeight: '700',
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    color: '#8a8f98',
    flex: 1,
    textAlign: 'right',
  },
  grandTotalValue: {
    fontSize: 13,
    color: GREEN_AMOUNT,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  pendingAmountValue: {
    fontSize: 13,
    color: RED,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  tableCell: {
    fontSize: 12,
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
});

export default InvoiceDetailsScreen;
