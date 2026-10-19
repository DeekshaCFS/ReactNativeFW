// src/screens/admin/InvoiceDetailsScreen.tsx

import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {type DateTimePickerChangeEvent} from '@react-native-community/datetimepicker';
import {AccountsDeleteSheet, AccountsFormSheet, sheetPill} from '../../components/AccountsSheets';
import {OutlinedInput, OutlinedSelect} from '../../components/OutlinedInput';
import SearchPickerModal from '../../components/SearchPickerModal';
import {COLORS} from '../../theme/theme';
import {CalendarInvoiceIcon} from '../../components/AccountsIcons';
import {ActionCell, DETAIL_DARK, DETAIL_GREEN, DETAIL_LIGHT, DetailRow, SectionTitle, StatusIconRow} from '../../components/AccountsDetailParts';
import {
  getInvoicedetailsByInvoiceId,
  deleteInvoiceDetails,
  getInvoicePdf,
  saveInvoicePaymmentDetails,
  invoiceFollowUpNotes,
  getInvoicePaymentStatus,
} from '../../api/accountManagement/accountManagementService';
import type {InvoiceDetailsDTOResultData} from '../../api/accountManagement/accountManagement.types';
import {sp, ms} from '../../utils/responsive';
import {ensureSuccess} from '../../utils/apiResponse';
import {formatAmount, sanitizeDecimalInput} from '../../utils/decimal';
import {DeleteAccIcon, EditProfileIcon} from '../../components/JavaIcons';
import {getCurrentCountryCode} from '../../state/session';
import { showFailureMsg, showToast } from '../../utils/toast';
import DecimalInput from '../../components/DecimalInput';

import {useTranslation} from 'react-i18next';
import { tr } from '../../i18n/tr';
const THEME_PRIMARY = '#c3002f';
const HEADER_PRIMARY = '#a80030';
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

// Java String.valueOf(double): 0 -> "0.0", 12.5 -> "12.5".
const javaDouble = (value: unknown) => {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) {
    return '0.0';
  }
  return Number.isInteger(num) ? num.toFixed(1) : String(num);
};

const formatPercent = (value: unknown) => {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) {
    return '0.0';
  }
  return Number.isInteger(num) ? num.toFixed(1) : String(Number(num.toFixed(3)));
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

// Java InvoiceDetailsFragment.setData(): Paid green, Partial Paid orange, UnPaid colorPrimaryDark.
const getStatusColor = (statusLabel: string) => {
  const normalized = statusLabel.trim().toLowerCase().replace(/[\s-]/g, '');
  if (normalized === 'paid') {
    return '#03de73';
  }
  if (normalized === 'partialpaid') {
    return '#ff9b00';
  }
  return THEME_PRIMARY;
};

type InvoiceDetailsScreenProps = {
  ownerId: number;
  invoiceId: number;
  initialStatusLabel?: string;
  initialTaskName?: string;
  onBack: () => void;
  onDeleted?: () => void;
  /** After a payment is recorded Java replaces the screen with the Accounts tab host (list refreshes). */
  onUpdated?: () => void;
};

const InvoiceDetailsScreen = ({
  ownerId,
  invoiceId,
  initialStatusLabel,
  initialTaskName,
  onBack,
  onDeleted,
  onUpdated,
}: InvoiceDetailsScreenProps) => {
  const {t} = useTranslation();
  const [details, setDetails] = useState<InvoiceDetailsDTOResultData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  // Java (InvoiceDetailsFragment.getInvoicePaymentStatus) refreshes Total /
  // Received / Remaining from GetPaymentStatusByInvoiceId when the dialog opens.
  const [paymentStatus, setPaymentStatus] = useState<{
    total?: number;
    received?: number;
    remaining?: number;
  } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<string>('');
  const [isPaymentTypeOpen, setIsPaymentTypeOpen] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);
  const [isFollowUpDatePickerOpen, setIsFollowUpDatePickerOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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
      showFailureMsg(message || 'Invoice details error');
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId, ownerId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  // Java deleteInvoiceDetailsDialog: confirm sheet, then DeleteInvoice.
  const confirmDelete = async () => {
    setIsDeleteOpen(false);
    setIsDeleting(true);
    try {
      const response = ensureSuccess(await deleteInvoiceDetails({Id: invoiceId, UserId: ownerId}));
      showToast((response as {Message?: string})?.Message);
      if (onDeleted) {
        onDeleted();
      } else {
        onBack();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to delete invoice.';
      showFailureMsg(message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await getInvoicePdf({UserId: ownerId, invoiceId: invoiceId});
      const pdfUrl = String(response.ResultData?.InvoicePdfPath ?? '').trim();
      if (!pdfUrl) {
        showToast(t('rn_pdf_is_not_available_for_this_invoice'));
        return;
      }
      await Linking.openURL(pdfUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to download PDF.';
      showFailureMsg(message || 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const openPaymentModal = () => {
    setPaymentAmount('');
    setPaymentType('');
    setIsPaymentTypeOpen(false);
    setIsPaymentModalOpen(true);
    setPaymentStatus(null);
    getInvoicePaymentStatus({Id: invoiceId, UserId: ownerId})
      .then(response => {
        const row = Array.isArray(response?.ResultData) ? response.ResultData[0] : undefined;
        if (row) {
          setPaymentStatus({
            total: row.TotalAmount,
            received: row.RecievedAmount,
            remaining: row.RemainingAmount,
          });
        }
      })
      .catch(() => {});
  };

  // Java UpdatePaymentStatus() validation chain.
  const handleSavePayment = async () => {
    const amount = Number(paymentAmount);
    if (!paymentAmount.trim() || paymentAmount.trim() === '0' || !Number.isFinite(amount) || amount === 0) {
      showFailureMsg(t('please_enter_amount'));
      return;
    }
    if (!paymentType) {
      showToast(t('rn_please_select_a_payment_type'));
      return;
    }
    const remaining = Number(paymentStatus?.remaining ?? details?.RemainingAmount ?? 0);
    if (amount > remaining) {
      showToast(t('rn_entered_amount_is_greater_than_remaining_a'));
      return;
    }

    setIsSavingPayment(true);
    try {
      // Java's UpdatePaymentStatus() sends Id == InvoiceId for this endpoint
      // (see InvoiceDetailsFragment.java#updatePayment) — mirrored here.
      const saved = ensureSuccess(await saveInvoicePaymmentDetails({
        Id: invoiceId,
        InvoiceId: invoiceId,
        Amount: amount,
        CreatedBy: ownerId,
        UserId: ownerId,
        PaymentTransactionType: paymentType,
        IsActive: true,
      }));
      setIsPaymentModalOpen(false);
      showToast((saved as {Message?: string})?.Message);
      if (onUpdated) {
        onUpdated();
      } else {
        await loadDetails();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to record payment.';
      showFailureMsg(message || 'Payment failed');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const openFollowUpModal = () => {
    setFollowUpDate('');
    setFollowUpNote('');
    setIsFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = async () => {
    if (!followUpDate.trim()) {
      showToast(t('please_enter_date'));
      return;
    }
    setIsSavingFollowUp(true);
    try {
      const followed = ensureSuccess(await invoiceFollowUpNotes({
        InvoiceId: invoiceId,
        // Java hardcodes this to 1 with the comment "need to pass final value
        // once Details API is ready" — it's a known placeholder in the
        // original app itself, not something we're guessing at here.
        StatuiId: 1,
        UserId: ownerId,
        FolowUpDate: `${followUpDate.trim()}T00:00:00`,
        Notes: followUpNote.trim(),
      }));
      setIsFollowUpModalOpen(false);
      showToast((followed as {Message?: string})?.Message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save follow-up.';
      showFailureMsg(message || 'Follow up failed');
    } finally {
      setIsSavingFollowUp(false);
    }
  };

  const statusLabel = initialStatusLabel || 'Pending';
  // Java's InvoiceDetailsFragment hides edit/delete/follow-up once an invoice
  // is fully Paid (only the download icon stays), and hides download while
  // Partial Paid / UnPaid — see setInvoiceStatusUI() in the Java source.
  const normalizedStatus = statusLabel.trim().toLowerCase().replace(/[\s-]/g, '');
  const isPaid = normalizedStatus === 'paid';
  const rawTaxName = details?.TaxName;
  const taxLabel = rawTaxName === null || rawTaxName === undefined || String(rawTaxName).toLowerCase() === 'null' ? 'Tax' : String(rawTaxName);
  const taskDiscountAmount = Number((details as any)?.TaskDiscountedAmount ?? 0);
  const itemList = details?.ItemList ?? [];
  const serviceList = details?.ServiceList ?? [];
  const paymentList = details?.PaymentList ?? [];

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={THEME_PRIMARY} size="large" />
            </View>
          ) : (
            <>
              <StatusIconRow status={statusLabel} color={getStatusColor(statusLabel)} statusFlex={0.5} bold={false}>
                <ActionCell hidden={isPaid} onPress={openPaymentModal}>
                  <EditProfileIcon size={ms(20)} color="#000" />
                </ActionCell>
                <ActionCell hidden={isPaid} onPress={() => setIsDeleteOpen(true)} disabled={isDeleting}>
                  <DeleteAccIcon size={ms(20)} color={RED} />
                </ActionCell>
                <ActionCell hidden={isPaid} onPress={openFollowUpModal}>
                  <Image source={require('../../../assets/images/ic_calendar.png')} style={styles.pngIcon} />
                </ActionCell>
                <ActionCell hidden={!isPaid} onPress={handleDownload} disabled={isDownloading}>
                  <Image source={require('../../../assets/images/ic_download.png')} style={styles.pngIcon} />
                </ActionCell>
              </StatusIconRow>

              <SectionTitle first>{t('invoice_details')}</SectionTitle>
              <DetailRow first label={t('task_name')} value={details?.QuotationCode ?? initialTaskName ?? ''} />
              <DetailRow label={t('rn_invoice_date')} value={formatDateOnly(details?.InvoiceDateTime)} />
              <DetailRow label={t('rn_invoice_id')} value={details?.InvoiceCode ?? ''} />

              <SectionTitle>{t('customer_details')}</SectionTitle>
              <DetailRow first label={t('customer_name')} value={details?.CustomerName ?? ''} />
              <DetailRow
                label={t('customer_number')}
                value={'+' + getCurrentCountryCode() + ' ' + (details?.MobileNumber ?? '')}
              />
              <DetailRow clip label={t('address')} value={details?.CustAddress ?? ''} />
              <DetailRow label={t('rn_flat_building_parcel')} value={details?.BuildingNumber ?? ''} />
              <DetailRow label={t('landmark')} value={details?.Landmark ?? ''} />

              <View style={[styles.tableHeaderRow, {marginTop: ms(5)}]}>
                <Text style={[styles.tableHeaderCell, styles.eq, {textAlign: 'left'}]}>{t('item_details')}</Text>
                <Text style={[styles.tableHeaderCell, styles.eq]}>{t('rn_qty')}</Text>
                <Text style={[styles.tableHeaderCell, styles.eq]}>{t('rn_unit_price')}</Text>
                <Text style={[styles.tableHeaderCell, styles.eq]}>{t('rn_total_price')}</Text>
              </View>
              {itemList.map((line, index) => (
                <View key={`item-${index}`} style={styles.listRow}>
                  <Text style={[styles.rowCell, styles.eq, {textAlign: 'left'}]}>{line.ItemName ?? ''}</Text>
                  <Text style={[styles.rowCell, styles.eq]}>{line.Quantity ?? 0}</Text>
                  <Text style={[styles.rowCell, styles.eq]}>₹ {formatAmount(line.UnitPrice)}</Text>
                  <Text style={[styles.rowCell, styles.eq]}>₹ {formatAmount(line.TotalPrice)}</Text>
                </View>
              ))}

              <View style={[styles.tableHeaderRow, {marginTop: ms(10)}]}>
                <Text style={[styles.tableHeaderCell, {flex: 0.4}]}>{t('service_name_add_task')}</Text>
                <Text style={[styles.tableHeaderCell, {flex: 0.3}]}>{t('rn_qty')}</Text>
                <Text style={[styles.tableHeaderCell, {flex: 0.3}]}>{t('rn_service_price_2')}</Text>
              </View>
              {serviceList.map((line, index) => (
                <View key={`service-${index}`} style={styles.listRow}>
                  <Text style={[styles.rowCell, {flex: 0.42, textAlign: 'left'}]}>{line.ServiceName ?? ''}</Text>
                  <Text style={[styles.rowCell, {flex: 0.3, textAlign: 'left'}]}>{line.Quantity ?? 0}</Text>
                  <Text style={[styles.rowCell, {flex: 0.28}]}>₹ {formatAmount(line.Price)}</Text>
                </View>
              ))}

              <SectionTitle>{t('rn_tax_discounts_quote_amount')}</SectionTitle>
              <DetailRow first label={t('rn_total_amount')} value={`₹ ${formatAmount(details?.InvoiceAmount ?? details?.SubTotalAmount)}`} />
              <DetailRow
                label={t('discount')}
                value={`₹ ${javaDouble(details?.DiscountAmounnt)}(${javaDouble(details?.Discount)}%)`}
              />
              <DetailRow
                label={taxLabel}
                value={`₹ ${javaDouble(details?.TaxAmount)}(${javaDouble(details?.Tax)}%)`}
              />
              {taskDiscountAmount !== 0 ? (
                <View style={[styles.rowPlain, {marginTop: ms(10), marginBottom: ms(12)}]}>
                  <Text style={{flex: 0.4, fontSize: sp(14), color: DETAIL_DARK}}>{t('rn_task_discount_amount')}</Text>
                  <Text style={{flex: 0.6, fontSize: sp(14), color: DETAIL_GREEN, fontWeight: '700'}}>
                    ₹ {formatAmount(taskDiscountAmount)}
                  </Text>
                </View>
              ) : null}
              <View style={[styles.rowPlain, {marginTop: ms(10), marginBottom: ms(12)}]}>
                <Text style={{flex: 0.4, fontSize: sp(14), color: DETAIL_DARK}}>{t('rn_grand_total_amount')}</Text>
                <Text style={{flex: 0.6, fontSize: sp(14), color: DETAIL_GREEN, fontWeight: '700'}}>
                  ₹ {formatAmount(details?.GrandTotalAmount)}
                </Text>
              </View>

              <SectionTitle>{t('rn_payment_history')}</SectionTitle>
              <View style={[styles.tableHeaderRow, {marginTop: ms(5)}]}>
                <Text style={[styles.tableHeaderCell, styles.eq, {textAlign: 'left'}]}>{t('date')}</Text>
                <Text style={[styles.tableHeaderCell, styles.eq, {textAlign: 'left'}]}>{t('rn_payment_type')}</Text>
                <Text style={[styles.tableHeaderCell, styles.eq]}>{t('received_amount')}</Text>
              </View>
              {paymentList.map((payment, index) => (
                <View key={`payment-${index}`} style={styles.listRow}>
                  <Text style={[styles.rowCell, {flex: 0.8, textAlign: 'left'}]}>{formatDateOnly(payment.PaymentDate)}</Text>
                  <Text style={[styles.rowCell, {flex: 1.2}]}>{payment.PaymentTransactionType ?? ''}</Text>
                  <Text style={[styles.rowCell, {flex: 1}]}>₹ {formatAmount(payment.Amount)}</Text>
                </View>
              ))}

              {isPaid ? null : (
                <View style={[styles.rowPlain, {marginTop: ms(10), marginBottom: ms(12)}]}>
                  <Text style={{flex: 0.4, fontSize: sp(14), fontWeight: '700', color: DETAIL_DARK}}>{t('rn_pending_amount')}</Text>
                  <Text style={{flex: 0.6, fontSize: sp(14), fontWeight: '700', color: THEME_PRIMARY}}>
                    ₹ {formatAmount(details?.RemainingAmount)}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <AccountsDeleteSheet
        visible={isDeleteOpen}
        message={t('rn_do_you_want_to_delete_this_invoice_it_will')}
        onNo={() => setIsDeleteOpen(false)}
        onYes={confirmDelete}
      />

      {/* Java dialog_update_payment_status.xml */}
      <AccountsFormSheet
        visible={isPaymentModalOpen}
        title={t('rn_update_payment_status')}
        onClose={() => setIsPaymentModalOpen(false)}
        actionLabel={t('add').toUpperCase()}
        bodyPaddingTop={0}
        loading={isSavingPayment}
        onAction={handleSavePayment}
        cancelLabel={t('cancel')}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>{t('rn_total_amount')}</Text>
          <Text style={styles.amountValue}>
            ₹ {formatAmount(paymentStatus?.total ?? details?.GrandTotalAmount)}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>{t('received_amount')}</Text>
          <Text style={styles.amountValue}>
            ₹ {formatAmount(paymentStatus?.received ?? details?.ReceivedAmount)}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>{t('remaining_amt')}</Text>
          <Text style={styles.amountValue}>
            ₹ {formatAmount(paymentStatus?.remaining ?? details?.RemainingAmount)}
          </Text>
        </View>
        <OutlinedInput
          style={[sheetPill, {marginTop: ms(25), marginBottom: ms(21)}]}
          placeholder={t('enter_amount')}
          placeholderTextColor={COLORS.lightGray}
          keyboardType="decimal-pad"
          maxLength={10}
          value={paymentAmount}
          onChangeText={v => setPaymentAmount(sanitizeDecimalInput(v))}
        />
        <OutlinedSelect
          style={[sheetPill, {height: ms(35), marginHorizontal: -ms(2), marginBottom: 0, color: COLORS.ink}]}
          label={t('rn_select_payment_type')}
          value={paymentType || 'Select Payment Type'}
          chevron
          onPress={() => setIsPaymentTypeOpen(true)}
        />
      </AccountsFormSheet>

      <SearchPickerModal
        visible={isPaymentTypeOpen}
        title={t('rn_select_payment_type')}
        hideSearch
        options={PAYMENT_TYPES.map((label, id) => ({id: id + 1, label}))}
        onSelect={o => {
          setPaymentType(o.label);
          setIsPaymentTypeOpen(false);
        }}
        onClose={() => setIsPaymentTypeOpen(false)}
      />

      {/* Java dialog_invoice_follow_up.xml */}
      <AccountsFormSheet
        visible={isFollowUpModalOpen}
        title={t('rn_invoice_follow_up_date')}
        onClose={() => setIsFollowUpModalOpen(false)}
        actionLabel={t('submit').toUpperCase()}
        loading={isSavingFollowUp}
        onAction={handleSaveFollowUp}
        cancelLabel={t('cancel')}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setIsFollowUpDatePickerOpen(true)}>
          <View pointerEvents="none">
            <OutlinedInput
              style={[sheetPill, {marginTop: ms(6), marginBottom: ms(21), height: ms(42)}]}
              placeholder={t('star_date')}
              placeholderTextColor={COLORS.lightGray}
              value={followUpDate}
              editable={false}
            />
            <View style={styles.dateIcon}>
              <CalendarInvoiceIcon size={ms(24)} color="#000" />
            </View>
          </View>
        </TouchableOpacity>
        <OutlinedInput
          style={styles.notesPill}
          placeholder={t('rn_follow_up_notes')}
          placeholderTextColor={COLORS.lightGray}
          multiline
          maxLength={60}
          value={followUpNote}
          onChangeText={v => setFollowUpNote(v.replace(/[^A-Za-z0-9 .,]/g, ''))}
        />
      </AccountsFormSheet>

      {isFollowUpDatePickerOpen ? (
        <DateTimePicker
          value={followUpDate ? new Date(followUpDate) : new Date()}
          mode="date"
          display="default"
          onValueChange={(_: DateTimePickerChangeEvent, date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            setFollowUpDate(`${y}-${m}-${d}`);
            setIsFollowUpDatePickerOpen(false);
          }}
          onDismiss={() => setIsFollowUpDatePickerOpen(false)}
          positiveButton={{label: t('qr_code_positive_button_know'), textColor: COLORS.primary}}
          negativeButton={{label: tr('CANCEL'), textColor: COLORS.primary}}
        />
      ) : null}
    </View>
  );
};

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
    marginTop: ms(11),
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
  },
  bodyContent: {
    paddingBottom: ms(110),
  },
  card: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: ms(20),
    paddingTop: ms(20),
  },
  centerBox: {
    paddingVertical: ms(60),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pngIcon: {width: ms(20), height: ms(20), resizeMode: 'contain', tintColor: '#000'},
  tableHeaderRow: {flexDirection: 'row'},
  tableHeaderCell: {
    fontSize: sp(14),
    fontWeight: '700',
    color: DETAIL_DARK,
    textAlign: 'left',
  },
  eq: {flex: 1, textAlign: 'center'},
  listRow: {flexDirection: 'row', alignItems: 'center', margin: ms(10)},
  rowCell: {fontSize: sp(13), color: DETAIL_DARK, textAlign: 'center'},
  rowPlain: {flexDirection: 'row'},
  invisible: {opacity: 0},
  amountRow: {flexDirection: 'row', marginTop: ms(20)},
  amountLabel: {flex: 0.5, fontSize: sp(14), color: '#808080'},
  amountValue: {flex: 0.5, fontSize: sp(14), color: '#808080'},
  dateIcon: {position: 'absolute', right: ms(14), top: ms(15)},
  notesPill: {
    height: ms(100),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: ms(34),
    paddingHorizontal: ms(18),
    paddingTop: ms(14),
    fontSize: sp(16),
    color: COLORS.ink,
    textAlignVertical: 'top',
    marginTop: ms(6),
    marginBottom: ms(21),
    backgroundColor: '#fff',
  },
});

export default InvoiceDetailsScreen;