// src/screens/technician/drawer/AMCListScreen.tsx
//
// Technician-side AMC view. Maps to Java's AMCListFragment.java, scoped down:
// Java's fragment is full owner/admin CRUD (add/edit/delete AMC contracts,
// Google Places autocomplete, etc.) — this screen is read-only "view assigned
// AMC service occurrences", matching the technician-side audit's intent.
//
// Data source: GET AMCs/AMCDashboardDetailsWebV2 (Java: Api.getAMCList(OwnerId,
// Date, AMCTypeId)) fetched for the whole company, then filtered client-side to
// occurrences where TaskDetails.TechnicianUserId === the logged-in technician,
// since the endpoint has no server-side technician filter.
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  Pressable, ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../../theme/theme';
import { ms, sp, scale } from '../../../utils/responsive';
import { getAmcServiceMonthList } from '../../../api/amc/amcService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AMCListResultData } from '../../../api/amc/amc.types';

const formatSelectedDate = (date: Date) => {
  // Matches Java's mSelectedDate format: "MM-DD-YYYY" (AMCListFragment.inIt()).
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}-${dd}-${date.getFullYear()}`;
};

const formatMonthLabel = (date: Date) =>
  date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

export default function AMCListScreen() {
  const navigation = useNavigation<any>();

  const [amcList, setAmcList] = useState<AMCListResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [monthCursor, setMonthCursor] = useState(new Date());

  const fetchAmcList = useCallback(async (forDate: Date) => {
    try {
      setLoading(true);
      const uid = await AsyncStorage.getItem('uid');
      const ownerId = await AsyncStorage.getItem('owner_id');
      if (!uid || !ownerId) return;

      const response = await getAmcServiceMonthList({
        OwnerId: Number(ownerId),
        Date: formatSelectedDate(forDate),
        AMCTypeId: 0,
      });

      const all = response?.ResultData ?? [];
      // Client-side technician filter — see file header note.
      const mine = all.filter(
        item => String(item.TaskDetails?.TechnicianUserId ?? '') === String(uid),
      );
      setAmcList(mine);
    } catch (e) {
      console.log('Failed to load AMC list:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAmcList(monthCursor);
    }, [fetchAmcList, monthCursor]),
  );

  const shiftMonth = (delta: number) => {
    setMonthCursor(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, prev.getDate()));
  };

  const filtered = search.trim()
    ? amcList.filter(
        item =>
          item.AMCName?.toLowerCase().includes(search.trim().toLowerCase()) ||
          item.CustomerName?.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : amcList;

  return (
    <View style={styles.root}>
      {/* Month selector */}
      <View style={styles.monthRow}>
        <Pressable hitSlop={8} onPress={() => shiftMonth(-1)}>
          <Ionicons name="chevron-back" size={scale(20)} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.monthLabel}>{formatMonthLabel(monthCursor)}</Text>
        <Pressable hitSlop={8} onPress={() => shiftMonth(1)}>
          <Ionicons name="chevron-forward" size={scale(20)} color={COLORS.primary} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={scale(20)} color="#888" />
        <TextInput
          placeholder="Search by AMC or customer name"
          style={styles.searchInput}
          placeholderTextColor="#888"
          returnKeyType="search"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable hitSlop={8} onPress={() => setSearch('')}>
            <Ionicons name="close" size={scale(20)} color="#888" />
          </Pressable>
        )}
      </View>

      <View style={styles.listWrapper}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: ms(40) }} color={COLORS.primary} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item, idx) => String(item.AMCsId ?? idx)}
            contentContainerStyle={{ paddingBottom: ms(120), paddingHorizontal: ms(16), paddingTop: ms(8) }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No AMC contracts assigned to you this month.</Text>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() =>
                  navigation.navigate('AMCDetails', {
                    amcsId: item.AMCsId,
                    amcServiceDetailsId: item.AMCServiceDetailsId,
                  })
                }
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.amcTitle} numberOfLines={1}>{item.AMCName}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText} numberOfLines={1}>{item.AMCTypeName}</Text>
                  </View>
                </View>
                <Text style={styles.customerName} numberOfLines={1}>{item.CustomerName}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={scale(14)} color="#777" />
                  <Text style={styles.metaText}>{item.AMCServiceDate}</Text>
                  <Ionicons name="repeat-outline" size={scale(14)} color="#777" style={{ marginLeft: ms(12) }} />
                  <Text style={styles.metaText}>{item.ServiceOccuranceType}</Text>
                </View>
                <Text style={styles.serviceCount}>
                  Service {item.ServiceNo ?? '-'} of {item.TotalServices ?? '-'}
                </Text>
              </Pressable>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(12),
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  monthLabel: {
    fontSize: sp(15),
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginHorizontal: ms(16),
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginTop: ms(8),
    marginBottom: ms(8),
    paddingTop: ms(4),
    marginHorizontal: ms(16),
    paddingBottom: ms(4),
  },
  searchInput: {
    flex: 1,
    marginHorizontal: ms(10),
    fontSize: sp(16),
    color: COLORS.textPrimary,
    height: ms(40),
  },
  listWrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: ms(16),
    padding: ms(16),
    marginBottom: ms(14),
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(6),
  },
  amcTitle: {
    fontSize: sp(16),
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: ms(8),
  },
  typeBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: ms(10),
    paddingVertical: ms(3),
    borderRadius: ms(8),
    maxWidth: ms(120),
  },
  typeBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: sp(11),
  },
  customerName: {
    fontSize: sp(14),
    color: '#555',
    marginBottom: ms(6),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(4),
  },
  metaText: {
    fontSize: sp(12),
    color: '#777',
    marginLeft: ms(4),
  },
  serviceCount: {
    fontSize: sp(12),
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: ms(2),
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: sp(14),
    marginTop: ms(40),
  },
});
