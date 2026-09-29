// src/screens/technician/main/AMCDetailsScreen.tsx
//
// Maps to Java's AMCDetailsFragment.java (view mode only — Java's fragment
// also handles Edit/Delete, which are owner/admin actions out of scope here).
//
// Data source: GET AMCs/AMCReportDetails (Java: Api.getAMCDetails(OwnerId,
// AMCsId, AMCServiceDetailsId)) — see amcService.ts for a note on the
// response-type mismatch this uncovered in the generated service layer.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { scale, sp, ms } from '../../../utils/responsive';
import { formatAmount } from '../../../utils/decimal';
import { getAmcReportDetails, getAmcRenewalDetails } from '../../../api/amc/amcService';
import { downloadAmcReport } from '../../../api/report/reportService';
import { getCurrentCountryCode, getCurrentUserId } from '../../../state/session';
import SearchPickerModal, { PickerOption } from '../../../components/SearchPickerModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AMCDetailsResultData } from '../../../api/amc/amc.types';

// Java: AMCRenewalDetailsDTO.ResultData (only the fields the screen and history table use).
type Renewal = {
  AMCsId?: number;
  AMCName?: string;
  CreatedDate?: string;
  ActivationDate?: string;
  ActivationTime?: string;
  ExpiryDate?: string;
  ContractDate?: string;
  TotalServices?: number;
  AMCAmount?: number;
  ReceivedAmount?: number;
  IsActive?: boolean;
  ServiceOccuranceId?: number;
  AMCNotes?: string;
};

// Java: AMCDetailsFragment renewal-picker switch on ServiceOccuranceId (unknown ids show blank).
const OCCURRENCE_NAMES: Record<number, string> = {
  1: 'Monthly',
  2: 'Quaterly',
  3: 'Yearly',
  4: 'Half year',
  5: '4 Month',
  6: '15 Days',
  7: 'Weekly',
  8: '2 Months',
  9: '1 Days',
  10: '2 Days',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Java AMCHistoryAdapter/AMCHeaderHistoryAdapter: "yyyy-MM-ddT.." -> "dd-MMM-yyyy".
const formatHistoryDate = (iso?: string) => {
  const [y, m, d] = String(iso ?? '').split('T')[0].split('-');
  const month = MONTHS[Number(m) - 1];
  return y && month && d ? `${d}-${month}-${y}` : '';
};

// Java: "1st Renewal", "2nd Renewal", "11th Renewal" ...
const renewalName = (n: number) => {
  const suffix = n >= 11 && n <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10 > 3 ? 0 : n % 10];
  return `${n}${suffix} Renewal`;
};

const money = (v?: number) =>
  Number(v ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>{String(value)}</Text>
    </View>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon as any} size={scale(18)} color={COLORS.primary} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function AMCDetailsScreen({ route }: any) {
  const { amcsId, amcServiceDetailsId, rootAmcsId } = route.params as {
    amcsId: number;
    amcServiceDetailsId?: number;
    /** RootAMCsId from the AMC list; non-zero means the contract has a renewal chain. */
    rootAmcsId?: number;
  };

  const [details, setDetails] = useState<AMCDetailsResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const ownerId = await AsyncStorage.getItem('owner_id');
        const response = await getAmcReportDetails({
          OwnerId: Number(ownerId),
          AMCsId: amcsId,
          AMCServiceDetailsId: amcServiceDetailsId ?? 0,
        });
        setDetails(response?.ResultData ?? null);
      } catch (e) {
        console.log('Failed to load AMC details:', e);
        setError('Could not load AMC details. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [amcsId, amcServiceDetailsId]);

  // Renewal history (Java: getAMCRenewalDetails(UserId, AmcsId = root), only when RootAMCsId != 0).
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [selectedRenewal, setSelectedRenewal] = useState<Renewal | null>(null);
  const [renewalPickerOpen, setRenewalPickerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!rootAmcsId) return;
    getAmcRenewalDetails({ UserId: getCurrentUserId(), AmcsId: rootAmcsId })
      .then(response => {
        if (response?.Code === '200' && response.Message === 'Success Request') {
          setRenewals(Array.isArray(response.ResultData) ? (response.ResultData as Renewal[]) : []);
        }
      })
      .catch(() => setRenewals([]));
  }, [rootAmcsId]);

  const renewalLabel = (r: Renewal) => `AMC${r.AMCsId} (${r.AMCName})`;
  const renewalOptions: PickerOption[] = [
    { id: 0, label: 'Select' },
    ...renewals.map((r, i) => ({ id: i + 1, label: renewalLabel(r) })),
  ];

  const contactNumber = () => {
    const mobile = String(details?.ProductDetail?.CustomerDetailInfoDto?.MobileNumber ?? '').trim();
    if (!mobile) return '';
    const code = String(getCurrentCountryCode() ?? '').replace(/\D/g, '');
    return `${code}${mobile.replace(/\D/g, '')}`;
  };

  // Java: dial "+<country code> <mobile>"; toast when there is no number.
  const handleCall = () => {
    const number = contactNumber();
    if (!number) {
      Alert.alert('Call', 'Contact no is not available');
      return;
    }
    Linking.openURL(`tel:+${number}`).catch(() => Alert.alert('Call', 'Unable to open the dialer.'));
  };

  // Java opens wa.me/<number>; digits only here (Java passed the spaced "+91 98.." string).
  const handleMessage = () => {
    const number = contactNumber();
    if (!number) {
      Alert.alert('Message', 'Contact no is not available');
      return;
    }
    Linking.openURL(`https://wa.me/${number}`).catch(() =>
      Alert.alert('Message', 'Unable to open message app'),
    );
  };

  // Java: Report/AMCReportPDF(AmcsId, UserId); 200 -> open the PDF URL in Message, else show Message.
  const handleDownload = async () => {
    if (!amcsId) return;
    try {
      const response = await downloadAmcReport({ AmcsId: amcsId, UserId: getCurrentUserId() });
      if (response?.Code === '200' && response.Message) {
        await Linking.openURL(response.Message);
      } else {
        Alert.alert('Download Report', response?.Message || 'Could not generate the AMC report.');
      }
    } catch (e) {
      Alert.alert('Download Report', e instanceof Error ? e.message : 'Could not download the report.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (error || !details) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'AMC contract not found.'}</Text>
      </View>
    );
  }

  const product = details.ProductDetail;
  const customer = product?.CustomerDetailInfoDto;
  const location = product?.CustomerLocationInfoDto;
  const history = details.AMCServiceDetailDto ?? [];

  // Picking a renewal swaps these fields (Java: the renewal spinner's item-click handler).
  const sel = selectedRenewal;
  const shownName = sel?.AMCName ?? details.AMCName;
  const shownContract = sel?.ContractDate ?? details.ContractDate;
  const shownExpiry = sel?.ExpiryDate ?? details.ExpiryDate;
  const shownActivation = sel?.ActivationDate ?? details.ActivationDate;
  const shownOccurrence = sel ? OCCURRENCE_NAMES[Number(sel.ServiceOccuranceId)] ?? '' : details.ServiceOccuranceType;
  const shownNotes = sel ? sel.AMCNotes : details.AMCNotes;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }}>
      <Text style={styles.heading}>{shownName}</Text>

      <View style={styles.actionRow}>
        <Pressable style={styles.actionBtn} onPress={handleCall}>
          <Ionicons name="call-outline" size={scale(20)} color={COLORS.primary} />
          <Text style={styles.actionText}>Call</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={handleMessage}>
          <Ionicons name="logo-whatsapp" size={scale(20)} color={COLORS.primary} />
          <Text style={styles.actionText}>Message</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={handleDownload}>
          <Ionicons name="download-outline" size={scale(20)} color={COLORS.primary} />
          <Text style={styles.actionText}>Report</Text>
        </Pressable>
        {renewals.length > 0 && (
          <Pressable style={styles.actionBtn} onPress={() => setHistoryOpen(true)}>
            <Ionicons name="time-outline" size={scale(20)} color={COLORS.primary} />
            <Text style={styles.actionText}>History</Text>
          </Pressable>
        )}
      </View>

      {renewals.length > 0 && (
        <Pressable style={styles.renewalSelect} onPress={() => setRenewalPickerOpen(true)}>
          <Text style={styles.renewalSelectText} numberOfLines={1}>
            {sel ? renewalLabel(sel) : 'Select'}
          </Text>
          <Ionicons name="chevron-down" size={scale(18)} color={COLORS.icon} />
        </Pressable>
      )}

      {sel && sel.IsActive === false && (
        <Text style={styles.deactiveText}>DeActive</Text>
      )}

      {details.IsUpcomingServiceActive && (
        <View style={styles.upcomingBanner}>
          <Ionicons name="alarm-outline" size={scale(16)} color={COLORS.primary} />
          <Text style={styles.upcomingText}>
            Next service: {details.UpcomingAmcsServiceDate} {details.UpcomingAmcsServiceTime}
          </Text>
        </View>
      )}

      <SectionCard title="Contract" icon="document-text-outline">
        <DetailRow label="Contract Date" value={shownContract} />
        <DetailRow label="Expiry Date" value={shownExpiry} />
        <DetailRow label="Activation Date" value={shownActivation} />
        <DetailRow label="Service Occurrence" value={shownOccurrence} />
        <DetailRow label="Total Services" value={details.TotalServices} />
        <DetailRow label="Last Service Date" value={details.LastAMCServiceDate} />
        <DetailRow label="Reminder" value={details.AMCSetReminderType} />
        <DetailRow label="Amount" value={details.AMCAmount != null ? `₹${formatAmount(details.AMCAmount)}` : undefined} />
        <DetailRow label="Received" value={details.ReceivedAmt != null ? `₹${formatAmount(details.ReceivedAmt)}` : undefined} />
        {!!shownNotes && <DetailRow label="Notes" value={shownNotes} />}
      </SectionCard>

      {product && (
        <SectionCard title="Product" icon="cube-outline">
          <DetailRow label="Product Name" value={product.ProductName} />
          <DetailRow label="Brand" value={product.ProductBrand} />
          <DetailRow label="Serial No" value={product.ProductSerialNo} />
          <DetailRow label="Under Warranty" value={product.UnderWarranty ? 'Yes' : 'No'} />
        </SectionCard>
      )}

      {(customer || location) && (
        <SectionCard title="Customer" icon="person-outline">
          <DetailRow label="Name" value={customer?.CustomerName} />
          <DetailRow label="Mobile" value={customer?.MobileNumber} />
          <DetailRow label="Email" value={customer?.EmailId} />
          <DetailRow label="Address" value={location?.Address ?? customer?.Address} />
        </SectionCard>
      )}

      {history.length > 0 && (
        <SectionCard title="Service History" icon="time-outline">
          {history.map((occurrence, idx) => (
            <View key={idx} style={styles.historyRow}>
              <View style={styles.historyDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.historyTitle}>
                  Service {occurrence.ServiceNo ?? idx + 1} of {occurrence.TotalServices ?? '-'}
                </Text>
                <Text style={styles.historyMeta}>{occurrence.ActualAMCSeriveDate ?? occurrence.AMCServiceDate ?? '—'}</Text>
                {!!occurrence.TaskDetails?.TaskName && (
                  <Text style={styles.historyMeta}>Task: {occurrence.TaskDetails.TaskName}</Text>
                )}
              </View>
            </View>
          ))}
        </SectionCard>
      )}

      <SearchPickerModal
        visible={renewalPickerOpen}
        title="Select AMC"
        options={renewalOptions}
        onSelect={o => {
          setSelectedRenewal(o.id === 0 ? null : renewals[o.id - 1] ?? null);
          setRenewalPickerOpen(false);
        }}
        onClose={() => setRenewalPickerOpen(false)}
      />

      <Modal visible={historyOpen} animationType="slide" transparent onRequestClose={() => setHistoryOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {renewals[0]?.AMCName ?? 'AMC History'}
              </Text>
              <Pressable onPress={() => setHistoryOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={scale(22)} color={COLORS.textPrimary} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: ms(12) }}>
              {renewals.map((r, i) => (
                <View key={`${r.AMCsId}-${i}`} style={styles.historyCard}>
                  <View style={styles.historyCardTop}>
                    <Text style={styles.historyCardTitle}>{renewalName(i + 1)}</Text>
                    <Text style={[styles.historyStatus, r.IsActive === false && { color: '#B00020' }]}>
                      {r.IsActive === false ? 'Expired' : 'Active'}
                    </Text>
                  </View>
                  <Text style={styles.historyMeta}>
                    AMC{r.AMCsId} · {r.AMCName}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {formatHistoryDate(r.ActivationDate)} -&gt; {formatHistoryDate(r.ExpiryDate)}
                  </Text>
                  <Text style={styles.historyMeta}>Created: {formatHistoryDate(r.CreatedDate)}</Text>
                  <Text style={styles.historyMeta}>Services: {r.TotalServices ?? 0}</Text>
                  <Text style={styles.historyMeta}>
                    Amount: Rs.{money(r.AMCAmount)} · Received: Rs.{money(r.ReceivedAmount)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#888',
    fontSize: sp(14),
  },
  heading: {
    fontSize: sp(20),
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: ms(8),
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: ms(12),
    paddingVertical: ms(10),
    marginBottom: ms(12),
    elevation: 2,
  },
  actionBtn: { alignItems: 'center', minWidth: ms(64) },
  actionText: { fontSize: sp(11), color: COLORS.textPrimary, marginTop: ms(3), fontWeight: '600' },
  renewalSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: ms(10),
    paddingHorizontal: ms(12),
    paddingVertical: ms(10),
    marginBottom: ms(12),
  },
  renewalSelectText: { flex: 1, fontSize: sp(13), color: COLORS.textPrimary },
  deactiveText: { color: '#000', fontWeight: '700', fontSize: sp(12), marginBottom: ms(8) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(16),
    borderTopRightRadius: ms(16),
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: ms(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  modalTitle: { flex: 1, fontSize: sp(15), fontWeight: '700', color: COLORS.textPrimary },
  historyCard: {
    backgroundColor: '#f7f7f7',
    borderRadius: ms(10),
    padding: ms(12),
    marginBottom: ms(10),
  },
  historyCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: ms(4) },
  historyCardTitle: { fontSize: sp(13), fontWeight: '700', color: COLORS.textPrimary },
  historyStatus: { fontSize: sp(12), fontWeight: '700', color: '#2E7D32' },
  upcomingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBEAEC',
    borderRadius: ms(10),
    padding: ms(10),
    marginBottom: ms(14),
  },
  upcomingText: {
    marginLeft: ms(8),
    fontSize: sp(13),
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: ms(14),
    padding: ms(14),
    marginBottom: ms(14),
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(10),
  },
  cardTitle: {
    fontSize: sp(14),
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: ms(6),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: ms(6),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  rowLabel: {
    fontSize: sp(13),
    color: '#777',
    flex: 1,
  },
  rowValue: {
    fontSize: sp(13),
    color: COLORS.textPrimary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  historyRow: {
    flexDirection: 'row',
    marginBottom: ms(12),
  },
  historyDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: COLORS.primary,
    marginTop: ms(6),
    marginRight: ms(10),
  },
  historyTitle: {
    fontSize: sp(13),
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  historyMeta: {
    fontSize: sp(12),
    color: '#888',
    marginTop: ms(2),
  },
});
