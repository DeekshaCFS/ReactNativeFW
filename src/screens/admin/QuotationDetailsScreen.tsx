// src/screens/admin/QuotationDetailsScreen.tsx

import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {AccountsDeleteSheet, AccountsFormSheet, sheetPill} from '../../components/AccountsSheets';
import {OutlinedInput, OutlinedSelect} from '../../components/OutlinedInput';
import SearchPickerModal from '../../components/SearchPickerModal';
import AddTaskModal, {type AddTaskInitialValues} from './AddTaskModal';
import AMCDashboardScreen, {type AddAmcPrefill} from './AMCDashboardScreen';
import {COLORS} from '../../theme/theme';
import {
  ActionCell,
  DETAIL_DARK,
  DETAIL_GREEN,
  DETAIL_LIGHT,
  DetailRow,
  SectionTitle,
  StatusIconRow,
} from '../../components/AccountsDetailParts';
import {
  getQuotationdetailsByQuoteId,
  deleteQuotationDetails,
  getQuotationPdf,
  updateQuotationStatus,
} from '../../api/quotation/quotationService';
import type {QuotationDetailsDTOResultData} from '../../api/quotation/quotation.types';
import {sp, ms} from '../../utils/responsive';
import {getCurrentCountryCode} from '../../state/session';
import {ensureSuccess} from '../../utils/apiResponse';
import {formatAmount} from '../../utils/decimal';
import {DeleteAccIcon} from '../../components/JavaIcons';
import {TickIcon} from '../../components/AccountsIcons';
import {AmcIcon} from '../../components/FabIcons';
import {showFailureMsg, showToast} from '../../utils/toast';
import {usePdfDownload} from '../../hooks/usePdfDownload';
import {useTranslation} from 'react-i18next';

const THEME_PRIMARY = '#c3002f';

// Matches Java's Quotation/UpdateQuotationStatus flow: the only status a quotation can be
// moved to from here is "Lost" (StatusId 4).
const LOST_STATUS_ID = 4;

// Java String.valueOf(double): 0 -> "0.0", 12.5 -> "12.5".
const javaDouble = (value: unknown) => {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) {
    return '0.0';
  }
  return Number.isInteger(num) ? num.toFixed(1) : String(num);
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
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) {
    hours = 12;
  }
  return `${datePart}  ${String(hours).padStart(2, '0')}:${minutes} ${meridiem}`;
};

type QuotationDetailsScreenProps = {
  ownerId: number;
  quotationId: number;
  initialStatusLabel?: string;
  onBack: () => void;
  onDeleted?: () => void;
  /** After a status update Java replaces the screen with the Accounts tab host (list refreshes). */
  onUpdated?: () => void;
};

const QuotationDetailsScreen = ({
  ownerId,
  quotationId,
  initialStatusLabel,
  onBack,
  onDeleted,
  onUpdated,
}: QuotationDetailsScreenProps) => {
  const {t} = useTranslation();
  const pdf = usePdfDownload();
  const [details, setDetails] = useState<QuotationDetailsDTOResultData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [addTaskValues, setAddTaskValues] = useState<AddTaskInitialValues | null>(null);
  const [amcTrigger, setAmcTrigger] = useState(0);

  const loadDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getQuotationdetailsByQuoteId({
        Id: quotationId,
        UserId: ownerId,
      });
      setDetails(response.ResultData ?? null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load quotation details.';
      showFailureMsg(message || 'Quotation details error');
    } finally {
      setIsLoading(false);
    }
  }, [ownerId, quotationId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  // Java deleteQuotationDetailsDialog: confirm sheet, then DeleteQuote and back to the Accounts list.
  const confirmDelete = async () => {
    setIsDeleteOpen(false);
    setIsDeleting(true);
    try {
      const response = ensureSuccess(
        await deleteQuotationDetails({Id: quotationId, UserId: ownerId}),
      );
      showToast((response as {Message?: string})?.Message);
      if (onDeleted) {
        onDeleted();
      } else {
        onBack();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to delete quotation.';
      showFailureMsg(message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetches the quotation PDF link, then downloads it with the loading overlay and opens it
  // in the in-app viewer (or the device's apps for non-PDF files).
  const handleDownload = async () => {
    try {
      const response = await getQuotationPdf({Id: quotationId, UserId: ownerId});
      const pdfUrl = String(response.ResultData?.QuotationPdfPath ?? '').trim();
      if (!pdfUrl) {
        showToast(t('rn_pdf_is_not_available_for_this_quotation'));
        return;
      }
      await pdf.openFile(pdfUrl, `Quotation_${quotationId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to download PDF.';
      showFailureMsg(message || 'Download failed');
    }
  };

  const openStatusSheet = () => {
    setSelectedStatus('');
    setStatusNote('');
    setIsStatusModalOpen(true);
  };

  // Java UpdateQuotationStatus(): spinner {Select Status, Lost}; "Select Status!" toast when unchosen.
  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      showToast(t('select_status'));
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const response = ensureSuccess(
        await updateQuotationStatus({
          QuotationId: quotationId,
          UserId: ownerId,
          StatusId: LOST_STATUS_ID,
          Notes: statusNote.trim(),
        }),
      );
      setIsStatusModalOpen(false);
      showToast((response as {Message?: string})?.Message);
      if (onUpdated) {
        onUpdated();
      } else {
        onBack();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update quotation status.';
      showFailureMsg(message || 'Update failed');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Java AMCDialog.addAMCFromQuoteDialog: Add AMC form pre-filled from this quote.
  const amcPrefill: AddAmcPrefill | undefined = details
    ? {
        name: String(details.QuoteName ?? ''),
        customerName: String(details.Customer?.CustomerName ?? ''),
        customerNumber: String(details.Customer?.MobileNumber ?? ''),
        address: String(details.Customer?.LocationList?.Address ?? ''),
        landmark: String(details.Customer?.LocationList?.Description ?? ''),
        latitude: String((details.Customer?.LocationList as any)?.latitude ?? ''),
        longitude: String((details.Customer?.LocationList as any)?.Longitude ?? ''),
        amount: Number(details.GrandTotalAmount) || 0,
        createdDate: String(details.CreatedDate ?? ''),
        customerId: Number((details.Customer as any)?.CustomerDetailsid) || undefined,
      }
    : undefined;

  // Java TaskDialogNew.addTaskFromQuoteDialog: customer, address, landmark and title come from the quote.
  const openAddTask = () => {
    const c = details?.Customer;
    const loc = (c?.LocationList ?? {}) as Record<string, any>;
    setAddTaskValues({
      title: String(details?.QuoteName ?? ''),
      address: String(loc.Address ?? ''),
      state: String(loc.State ?? ''),
      city: String(loc.City ?? ''),
      pinCode: String(loc.PinCode ?? ''),
      landmark: String(loc.Description ?? ''),
      customerName: String(c?.CustomerName ?? ''),
      customerNumber: String(c?.MobileNumber ?? ''),
      taskTagId: 0,
      taskTagName: '',
      customerId: Number((c as any)?.CustomerDetailsid) || Number(details?.CustomerId) || undefined,
      // Java: opens on Out of Warranty with the quote's grand total as the rate.
      paymentModeId: 2,
      wagesPerHour: Number(details?.GrandTotalAmount) || undefined,
      latitude: String(loc.latitude ?? loc.Latitude ?? ''),
      longitude: String(loc.Longitude ?? loc.longitude ?? ''),
    });
  };

  const status = details?.Status;
  const statusName = String(status?.StatusName ?? '').trim();
  // Java setData(): task_ongoing_dark / completed / colorPrimaryDark / green.
  const statusColor =
    statusName === 'Assigned'
      ? '#FBC02D'
      : statusName === 'Not Assigned'
        ? '#6e41bf'
        : statusName === 'Lost'
          ? THEME_PRIMARY
          : statusName === 'Task Completed'
            ? '#03de73'
            : '#6e41bf';
  const statusLabel = statusName || initialStatusLabel || 'Not Assigned';
  // Java hides update / delete / add-task / add-AMC (INVISIBLE, space kept) once Assigned or Task Completed.
  const actionsHidden = statusName === 'Assigned' || statusName === 'Task Completed';

  const customer = details?.Customer;
  const location = customer?.LocationList;

  const itemList = details?.QuoteItemList ?? [];
  const serviceList = details?.QuoteServiceList ?? [];
  const taxList = details?.QuoteTaxList ?? [];
  const taxInfo = taxList?.[0];

  // Java: taxname TextView shows TaxName as-is (blank when ""), "Tax" only when null / "null".
  const taxNameRaw = (taxInfo as any)?.TaxName;
  const taxLabel =
    taxNameRaw === null ||
    taxNameRaw === undefined ||
    String(taxNameRaw).toLowerCase() === 'null'
      ? 'Tax'
      : String(taxNameRaw);
  const extraItem = String(details?.ExtraItem ?? '').trim();
  const extraAmount = details?.ExtraAmount ?? 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={THEME_PRIMARY} size="large" />
            </View>
          ) : (
            <>
              <StatusIconRow status={statusLabel} color={statusColor}>
                <ActionCell
                  hidden={actionsHidden}
                  onPress={() => setIsDeleteOpen(true)}
                  disabled={isDeleting}>
                  <DeleteAccIcon size={ms(20)} color={THEME_PRIMARY} />
                </ActionCell>
                <ActionCell hidden={actionsHidden} onPress={openStatusSheet}>
                  <Image
                    source={require('../../../assets/images/ic_calendar.png')}
                    style={styles.pngIcon}
                  />
                </ActionCell>
                <ActionCell hidden={actionsHidden} onPress={openAddTask}>
                  <TickIcon size={ms(20)} color="#000" />
                </ActionCell>
                <ActionCell hidden={actionsHidden} onPress={() => setAmcTrigger(n => n + 1)}>
                  <AmcIcon size={ms(20)} color="#000" />
                </ActionCell>
                <ActionCell onPress={handleDownload} disabled={pdf.isDownloading}>
                  <Image
                    source={require('../../../assets/images/ic_download.png')}
                    style={styles.pngIcon}
                  />
                </ActionCell>
              </StatusIconRow>

              <SectionTitle first>{t('rn_quote_details')}</SectionTitle>
              <DetailRow first label={t('rn_quote_name')} value={details?.QuoteName ?? ''} />
              <DetailRow label={t('rn_quote_id')} value={details?.QuoteCode ?? ''} />
              <DetailRow label={t('rn_created_date')} value={formatDateTime(details?.CreatedDate)} />
              <DetailRow label={t('rn_validity_date_2')} value={formatDateTime(details?.ValidityDate)} />

              <SectionTitle>{t('customer_details')}</SectionTitle>
              <DetailRow first label={t('customer_name')} value={customer?.CustomerName ?? ''} />
              <DetailRow
                label={t('customer_number')}
                value={'+' + getCurrentCountryCode() + ' ' + (customer?.MobileNumber ?? '')}
              />
              <DetailRow clip label={t('address')} value={location?.Address ?? ''} />
              <DetailRow label={t('rn_flat_building_parcel')} value={location?.BuildingNumber ?? ''} />
              <DetailRow label={t('landmark')} value={location?.Description ?? ''} />

              <View style={[styles.tableHeaderRow, {marginTop: ms(5)}]}>
                <Text style={[styles.tableHeaderCell, styles.eq, {textAlign: 'left'}]}>
                  {t('item_details')}
                </Text>
                <Text style={[styles.tableHeaderCell, styles.eq]}>{t('rn_qty')}</Text>
                <Text style={[styles.tableHeaderCell, styles.eq]}>{t('rn_unit_price')}</Text>
                <Text style={[styles.tableHeaderCell, styles.eq]}>{t('rn_total_price')}</Text>
              </View>
              {itemList.map((line, index) => (
                <View key={`item-${index}`} style={styles.listRow}>
                  <Text style={[styles.rowCell, styles.eq, {textAlign: 'left'}]}>
                    {line.ItemName ?? ''}
                  </Text>
                  <Text style={[styles.rowCell, styles.eq]}>{line.Quantity ?? 0}</Text>
                  <Text style={[styles.rowCell, styles.eq]}>₹ {formatAmount(line.UnitPrice)}</Text>
                  <Text style={[styles.rowCell, styles.eq]}>₹ {formatAmount(line.TotalPrice)}</Text>
                </View>
              ))}

              <View style={[styles.tableHeaderRow, {marginTop: ms(10)}]}>
                <Text style={[styles.tableHeaderCell, {flex: 0.4}]}>
                  {t('service_name_add_task')}
                </Text>
                <Text style={[styles.tableHeaderCell, {flex: 0.3}]}>{t('rn_qty')}</Text>
                <Text style={[styles.tableHeaderCell, {flex: 0.3}]}>{t('rn_service_price_2')}</Text>
              </View>
              {serviceList.map((line, index) => (
                <View key={`service-${index}`} style={styles.listRow}>
                  <Text style={[styles.rowCell, {flex: 0.42, textAlign: 'left'}]}>
                    {line.ServiceName ?? ''}
                  </Text>
                  <Text style={[styles.rowCell, {flex: 0.3, textAlign: 'left'}]}>
                    {line.Quantity ?? 0}
                  </Text>
                  <Text style={[styles.rowCell, {flex: 0.28}]}>₹ {formatAmount(line.Price)}</Text>
                </View>
              ))}

              <View style={[styles.tableHeaderRow, {marginTop: ms(10), marginBottom: ms(12)}]}>
                <Text style={[styles.tableHeaderCell, {flex: 0.6}]}>{t('rn_extra_name')}</Text>
                <Text style={[styles.tableHeaderCell, {flex: 0.4}]}>{t('rn_extra_price')}</Text>
              </View>
              <View style={[styles.tableHeaderRow, {marginLeft: ms(10), marginTop: 0, marginBottom: 0}]}>
                <Text style={[styles.rowCell, {flex: 0.6, textAlign: 'left'}]}>{extraItem}</Text>
                <Text
                  style={[styles.rowCell, {flex: 0.4, textAlign: 'left', color: DETAIL_LIGHT}]}
                  numberOfLines={1}>
                  ₹ {formatAmount(extraAmount)}
                </Text>
              </View>

              <SectionTitle>{t('rn_tax_discounts_quote_amount')}</SectionTitle>
              <DetailRow first label={t('rn_total_amount')} value={`₹ ${formatAmount(details?.TotalAmount)}`} />
              <DetailRow
                label={t('discount')}
                value={`₹ ${javaDouble(taxInfo?.DiscountAmounnt)}(${javaDouble(taxInfo?.Discount)}%)`}
              />
              <DetailRow
                label={taxLabel}
                value={`₹ ${javaDouble(taxInfo?.TaxAmount)}(${javaDouble(taxInfo?.Tax)}%)`}
              />
              <View style={[styles.rowPlain, {marginTop: ms(10), marginBottom: ms(12)}]}>
                <Text style={{flex: 0.4, fontSize: sp(14), color: DETAIL_DARK}}>
                  {t('rn_grand_total_amount')}
                </Text>
                <Text style={{flex: 0.6, fontSize: sp(14), color: DETAIL_GREEN, fontWeight: '700'}}>
                  ₹ {formatAmount(details?.GrandTotalAmount)}
                </Text>
              </View>

              <SectionTitle>{t('rn_terms_conditions')}</SectionTitle>
              <Text style={styles.termsText} numberOfLines={1}>
                {String(details?.TermCondition ?? '')}
              </Text>
            </>
          )}
        </View>
      </ScrollView>

      <AccountsDeleteSheet
        visible={isDeleteOpen}
        message={t('rn_do_you_want_to_delete_this_quote_it_will_d')}
        onNo={() => setIsDeleteOpen(false)}
        onYes={confirmDelete}
      />

      {/* Java update_quote_status.xml */}
      <AccountsFormSheet
        visible={isStatusModalOpen}
        title={t('rn_update_quote_status')}
        onClose={() => setIsStatusModalOpen(false)}
        actionLabel={t('update')}
        actionIcon
        loading={isUpdatingStatus}
        onAction={handleUpdateStatus}
        cancelLabel={t('cancel')}>
        <OutlinedSelect
          style={sheetPill}
          label={t('select_status')}
          value={selectedStatus || 'Select Status'}
          chevron
          onPress={() => setIsStatusPickerOpen(true)}
        />
        <OutlinedInput
          style={styles.notesPill}
          placeholder={t('notes')}
          placeholderTextColor={COLORS.lightGray}
          multiline
          maxLength={60}
          value={statusNote}
          onChangeText={v => setStatusNote(v.replace(/[^A-Za-z0-9 .,]/g, ''))}
        />
      </AccountsFormSheet>

      <SearchPickerModal
        visible={isStatusPickerOpen}
        title={t('select_status')}
        hideSearch
        options={[
          {id: 0, label: 'Select Status'},
          {id: LOST_STATUS_ID, label: 'Lost'},
        ]}
        onSelect={o => {
          setSelectedStatus(o.id === 0 ? '' : o.label);
          setIsStatusPickerOpen(false);
        }}
        onClose={() => setIsStatusPickerOpen(false)}
      />

      <AMCDashboardScreen
        modalOnly
        ownerId={ownerId}
        openAddAmcTrigger={amcTrigger}
        addAmcPrefill={amcPrefill}
      />

      <AddTaskModal
        visible={addTaskValues !== null}
        onClose={() => setAddTaskValues(null)}
        ownerId={ownerId}
        initialValues={addTaskValues}
      />

      {/* In-app PDF download overlay and viewer. */}
      {pdf.modals}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME_PRIMARY,
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
  pngIcon: {
    width: ms(20),
    height: ms(20),
    resizeMode: 'contain',
    tintColor: '#000',
  },
  tableHeaderRow: {
    flexDirection: 'row',
  },
  tableHeaderCell: {
    fontSize: sp(14),
    fontWeight: '700',
    color: DETAIL_DARK,
    textAlign: 'left',
  },
  eq: {
    flex: 1,
    textAlign: 'center',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: ms(10),
  },
  rowCell: {
    fontSize: sp(13),
    color: DETAIL_DARK,
    textAlign: 'center',
  },
  rowPlain: {
    flexDirection: 'row',
  },
  termsText: {
    flex: 0.6,
    fontSize: sp(15),
    color: DETAIL_LIGHT,
  },
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

export default QuotationDetailsScreen;