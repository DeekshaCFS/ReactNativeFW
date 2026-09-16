// src/screens/technician/drawer/RequestedItems.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ms, sp, scale, hp } from '../../../utils/responsive';
import { getFocList } from '../../../api/focItemRequest/focItemRequestService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GetFOCListResultData } from '../../../api/focItemRequest/focItemRequest.types';

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
};

export default function RequestedItems() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : insets.top;

  const [requests, setRequests] = useState<GetFOCListResultData[]>([]);
  const [loading, setLoading] = useState(true);

  // Maps to Java's FOC_Item_Request/GET_FOC_List, scoped to this technician's OwnerId.
  const loadRequests = useCallback(async () => {
    try {
      const ownerId = Number(await AsyncStorage.getItem('owner_id')) || 0;
      const res = await getFocList({
        Pageindex: 1,
        Pagesize: 50,
        ZoneId: 0,
        OwnerId: ownerId,
        IssueTypeID: 0,
        FOCStatusTagID: 0,
        SearchParam: '',
      });
      setRequests(res.ResultData ?? []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);
  // Refresh whenever we come back from submitting a new request.
  useFocusEffect(useCallback(() => { loadRequests(); }, [loadRequests]));

  return (
    <View style={styles.root}>
      {/* Tabs */}
      <View style={styles.tabRow}>
        <Pressable
          style={styles.inactiveTab}
          onPress={() => navigation.navigate('Issued Items')}
        >
          <Text style={styles.inactiveTabText}>ISSUED ITEMS</Text>
        </Pressable>
        <Pressable style={styles.activeTab}>
          <Text style={styles.activeTabText}>REQUESTED ITEMS</Text>
        </Pressable>
      </View>

      {/* Request Button */}
      <View style={styles.requestRow}>
        <Pressable 
          style={styles.requestButton}
          onPress={() => navigation.navigate('ItemRequest')}
        >
          <Ionicons name="add" size={scale(16)} color="#fff" />
          <Text style={styles.requestText}>Request</Text>
        </Pressable>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        <Pressable style={styles.filterItem}>
          <Text style={styles.filterText}>Status Tag</Text>
          <Ionicons name="chevron-down" size={scale(16)} color={COLORS.primary} />
        </Pressable>
        <Pressable style={styles.filterItem}>
          <Text style={styles.filterText}>Issue</Text>
          <Ionicons name="chevron-down" size={scale(16)} color={COLORS.primary} />
        </Pressable>
        <Pressable style={styles.filterItem} onPress={loadRequests}>
          <Text style={styles.refreshText}>Refresh List</Text>
          <Ionicons name="refresh" size={scale(16)} color={COLORS.primary} />
        </Pressable>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: ms(40) }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.FocRequestId)}
          contentContainerStyle={{ paddingBottom: ms(120), paddingHorizontal: ms(16) }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No item requests found.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Status Badge */}
              <View style={styles.naBadge}>
                <Text style={styles.naText}>{item.FOCStatusName || 'NA'}</Text>
              </View>

              <View style={styles.cardContent}>
                <View style={{ flex: 1, marginTop: ms(14) }}>
                  <View style={styles.topRow}>
                    <Text style={styles.reqText}>#REQ {item.FocRequestId}</Text>
                    <Text style={styles.issueText}>
                      Issue: <Text style={{ color: COLORS.primary }}>{item.IsAnyIssue ? 'Yes' : 'No'}</Text>
                    </Text>
                    <Text style={styles.dateText}>Date {formatDate(item.CreatedDate)}</Text>
                  </View>
                  <Text style={styles.codeText}>{item.NewTaskID}</Text>
                  <Text style={styles.notesText}>{item.Notes || 'Notes'}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },

  tabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  activeTab: {
    flex: 1,
    borderBottomWidth: ms(3),
    borderColor: COLORS.primary,
    backgroundColor: '#f5d7d784',
    justifyContent: 'center',
    alignItems: 'center',
    height: ms(48),
  },
  inactiveTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: ms(48),
  },
  activeTabText: {
    fontSize: sp(13),
    fontWeight: '600',
    color: COLORS.primary,
  },
  inactiveTabText: {
    fontSize: sp(13),
    color: '#777',
  },

  requestRow: {
    alignItems: 'flex-end',
    paddingHorizontal: ms(16),
    marginVertical: ms(10),
  },
  requestButton: {
    flexDirection: 'row',
    backgroundColor: '#000',
    paddingHorizontal: ms(16),
    paddingVertical: ms(8),
    borderRadius: ms(20),
    alignItems: 'center',
    gap: ms(6),
    minHeight: ms(36),
  },
  requestText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: sp(14),
  },

  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: ms(16),
    marginBottom: ms(12),
    flexWrap: 'wrap',
    gap: ms(8),
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
  },
  filterText: {
    fontSize: sp(14),
    color: COLORS.textPrimary,
  },
  refreshText: {
    fontSize: sp(14),
    color: COLORS.primary,
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: ms(12),
    padding: ms(14),
    marginBottom: ms(14),
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },
  naBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: COLORS.primary,
    paddingHorizontal: ms(14),
    paddingVertical: ms(3),
    borderTopLeftRadius: ms(12),
    borderBottomRightRadius: ms(10),
  },
  naText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: sp(12),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  topRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ms(8),
    marginBottom: ms(6),
    alignItems: 'center',
  },
  reqText: {
    color: '#2a7be4',
    fontWeight: '600',
    fontSize: sp(14),
  },
  issueText: {
    fontWeight: '500',
    fontSize: sp(13),
    color: COLORS.textPrimary,
  },
  dateText: {
    color: '#999',
    fontSize: sp(13),
  },
  codeText: {
    fontSize: sp(16),
    fontWeight: '700',
    color: COLORS.primary,
    marginVertical: ms(4),
  },
  notesText: {
    color: '#555',
    fontSize: sp(13),
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: sp(14),
    marginTop: ms(40),
  },
});