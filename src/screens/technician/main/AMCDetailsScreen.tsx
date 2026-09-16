// src/screens/technician/main/AMCDetailsScreen.tsx
//
// Maps to Java's AMCDetailsFragment.java (view mode only — Java's fragment
// also handles Edit/Delete, which are owner/admin actions out of scope here).
//
// Data source: GET AMCs/AMCReportDetails (Java: Api.getAMCDetails(OwnerId,
// AMCsId, AMCServiceDetailsId)) — see amcService.ts for a note on the
// response-type mismatch this uncovered in the generated service layer.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { scale, sp, ms } from '../../../utils/responsive';
import { getAmcReportDetails } from '../../../api/amc/amcService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AMCDetailsResultData } from '../../../api/amc/amc.types';

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
  const { amcsId, amcServiceDetailsId } = route.params as {
    amcsId: number;
    amcServiceDetailsId?: number;
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

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }}>
      <Text style={styles.heading}>{details.AMCName}</Text>
      {details.IsUpcomingServiceActive && (
        <View style={styles.upcomingBanner}>
          <Ionicons name="alarm-outline" size={scale(16)} color={COLORS.primary} />
          <Text style={styles.upcomingText}>
            Next service: {details.UpcomingAmcsServiceDate} {details.UpcomingAmcsServiceTime}
          </Text>
        </View>
      )}

      <SectionCard title="Contract" icon="document-text-outline">
        <DetailRow label="Contract Date" value={details.ContractDate} />
        <DetailRow label="Expiry Date" value={details.ExpiryDate} />
        <DetailRow label="Activation Date" value={details.ActivationDate} />
        <DetailRow label="Service Occurrence" value={details.ServiceOccuranceType} />
        <DetailRow label="Total Services" value={details.TotalServices} />
        <DetailRow label="Last Service Date" value={details.LastAMCServiceDate} />
        <DetailRow label="Reminder" value={details.AMCSetReminderType} />
        <DetailRow label="Amount" value={details.AMCAmount != null ? `₹${details.AMCAmount}` : undefined} />
        <DetailRow label="Received" value={details.ReceivedAmt != null ? `₹${details.ReceivedAmt}` : undefined} />
        {!!details.AMCNotes && <DetailRow label="Notes" value={details.AMCNotes} />}
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
