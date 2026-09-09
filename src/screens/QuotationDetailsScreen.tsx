import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {type QuotationDetails, touchlessApi} from '../api/Api';

const THEME_PRIMARY = '#c3002f';
const HEADER_PRIMARY = '#a80030';
const STATUS_BLUE = '#5b6bd9';
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
  const [details, setDetails] = useState<QuotationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await touchlessApi.getQuotationDetails({
        quotationId,
        userId: ownerId,
      });
      const resultData = response.resultData ?? response.ResultData ?? null;
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
            await touchlessApi.deleteQuotation({quotationId, userId: ownerId});
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
      const response = await touchlessApi.getQuotationPdf({quotationId, userId: ownerId});
      const resultData = response.resultData ?? response.ResultData ?? null;
      const pdfUrl = String(resultData?.quotationPdfPath ?? resultData?.QuotationPdfPath ?? '').trim();
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

  const status = details?.status ?? details?.Status;
  const statusLabel =
    String(status?.statusName ?? status?.StatusName ?? '').trim() ||
    initialStatusLabel ||
    'Not Assigned';

  const customer = details?.customer ?? details?.Customer;
  const location = customer?.locationList ?? customer?.LocationList;

  const itemList = details?.quoteItemList ?? details?.QuoteItemList ?? [];
  const serviceList = details?.quoteServiceList ?? details?.QuoteServiceList ?? [];
  const taxList = details?.quoteTaxList ?? details?.QuoteTaxList ?? [];
  const taxInfo = taxList?.[0];

  const extraItem = String(details?.extraItem ?? details?.ExtraItem ?? '').trim();
  const extraAmount = details?.extraAmount ?? details?.ExtraAmount ?? 0;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerIconButton}>
          <Text style={styles.headerIconText}>{'\u2630'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quotation Details</Text>
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
                <Text style={styles.statusLabel}>{statusLabel}</Text>
                <View style={styles.iconRow}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleDelete}
                    disabled={isDeleting}>
                    <Text style={styles.iconTextDelete}>{'\uD83D\uDDD1'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton}>
                    <Text style={styles.iconText}>{'\uD83D\uDCC5'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton}>
                    <Text style={styles.iconText}>{'\u2705'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton}>
                    <Text style={styles.iconText}>{'\uD83D\uDD27'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton} onPress={handleDownload}>
                    <Text style={styles.iconText}>{'\u2B07'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Quote Details</Text>
              <DetailRow label="Quote Name" value={details?.quoteName ?? details?.QuoteName ?? '-'} />
              <DetailRow label="Quote ID" value={details?.quoteCode ?? details?.QuoteCode ?? '-'} />
              <DetailRow
                label="Created Date"
                value={formatDateTime(details?.createdDate ?? details?.CreatedDate)}
              />
              <DetailRow
                label="Validity Date"
                value={formatDateTime(details?.validityDate ?? details?.ValidityDate)}
              />

              <Text style={styles.sectionTitle}>Customer Details</Text>
              <DetailRow
                label="Customer Name"
                value={customer?.customerName ?? customer?.CustomerName ?? '-'}
              />
              <DetailRow
                label="Customer Number"
                value={customer?.mobileNumber ?? customer?.MobileNumber ?? '-'}
              />
              <DetailRow label="Address" value={location?.address ?? location?.Address ?? '-'} />
              <DetailRow
                label="Flat/Building/Parcel"
                value={
                  location?.buildingFlatNumber ??
                  location?.BuildingFlatNumber ??
                  '-'
                }
              />
              <DetailRow label="Landmark" value={location?.landmark ?? location?.Landmark ?? '-'} />

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
                value={`Rs. ${formatAmount(details?.totalAmount ?? details?.TotalAmount)}`}
              />
              <DetailRow
                label="Discount"
                value={`Rs. ${formatAmount(taxInfo?.discountAmounnt ?? taxInfo?.DiscountAmounnt)}(${formatPercent(
                  taxInfo?.discount ?? taxInfo?.Discount,
                )}%)`}
              />
              <DetailRow
                label="Tax"
                value={`Rs. ${formatAmount(taxInfo?.taxAmount ?? taxInfo?.TaxAmount)}(${formatPercent(
                  taxInfo?.tax ?? taxInfo?.Tax,
                )}%)`}
              />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabelBold}>Grand Total Amount</Text>
                <Text style={styles.grandTotalValue}>
                  Rs. {formatAmount(details?.grandTotalAmount ?? details?.GrandTotalAmount)}
                </Text>
              </View>

              <Text style={styles.sectionTitle}>Terms & Conditions</Text>
              <Text style={styles.termsText}>
                {String(details?.termCondition ?? details?.TermCondition ?? '').trim() || '-'}
              </Text>
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
    color: STATUS_BLUE,
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
  termsText: {
    fontSize: 12,
    color: '#8a8f98',
  },
});

export default QuotationDetailsScreen;
