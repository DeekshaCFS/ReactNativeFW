// src/screens/technician/drawer/RequestedItems.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Image,
  Platform, StatusBar, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import Modal from '../../../components/AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ms, sp, scale, hp } from '../../../utils/responsive';
import { getFocList, getFocStatusTagList, getDeleteFocRequestItem } from '../../../api/focItemRequest/focItemRequestService';
import type { GetFOCListResultData, GetFOCStatusTagListResultData } from '../../../api/focItemRequest/focItemRequest.types';
import { getCurrentUserId } from '../../../state/session';

const ISSUE_OPTIONS = [
  { id: 1, label: 'Yes' },
  { id: 2, label: 'No' },
];

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
};

export default function RequestedItems() {
  const navigation = useNavigation<any>();

  const [requests, setRequests] = useState<GetFOCListResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recordCount, setRecordCount] = useState(0);

  const [statusTagList, setStatusTagList] = useState<GetFOCStatusTagListResultData[]>([]);
  const [selectedStatusTag, setSelectedStatusTag] = useState<GetFOCStatusTagListResultData | null>(null);
  const [selectedIssueType, setSelectedIssueType] = useState<{ id: number; label: string } | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<'STATUS' | 'ISSUE' | null>(null);

  const PAGE_SIZE = 20;

  // GET FOC_Item_Request/Get_Foc_Status_Tag_List -- Java fetches this once
  // per session (HomeActivityNew.getFOCStatusTagList) and reuses it here.
  useEffect(() => {
    const loadStatusTags = async () => {
      try {
        const userId = getCurrentUserId();
        const res = await getFocStatusTagList({ userid: userId });
        setStatusTagList(res.ResultData ?? []);
      } catch {
        setStatusTagList([]);
      }
    };
    loadStatusTags();
  }, []);

  // Maps to Java's FOC_Item_Request/GET_FOC_List (FOCFragment.getFOCList).
  // Despite the query param's name, Java passes the technician's own
  // SharedPrefManager userId as "OwnerId", not the employer/owner id --
  // sending the employer id instead pulls in every technician's requests.
  const loadRequests = useCallback(async (page = 1, reset = false) => {
    try {
      const userId = getCurrentUserId();
      const res = await getFocList({
        Pageindex: page,
        Pagesize: PAGE_SIZE,
        ZoneId: 0,
        OwnerId: userId,
        IssueTypeID: selectedIssueType?.id ?? 0,
        FOCStatusTagID: selectedStatusTag?.FocStatusId ?? 0,
        SearchParam: '',
      });
      const newRequests = res.ResultData ?? [];
      setRequests(prev => (reset ? newRequests : [...prev, ...newRequests]));
      setRecordCount(res.RecordCount ?? 0);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStatusTag, selectedIssueType]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests(1, true);
  }, [loadRequests]);

  const loadMore = useCallback(() => {
    if (requests.length >= recordCount) return;
    const nextPage = Math.floor(requests.length / PAGE_SIZE) + 1;
    loadRequests(nextPage, false);
  }, [loadRequests, requests.length, recordCount]);

  // Refreshes on initial mount, whenever a filter changes, and whenever we
  // come back into focus (e.g. after submitting a new request).
  useFocusEffect(useCallback(() => { loadRequests(1, true); }, [loadRequests]));

  // Java: FOCListAdapter's deleteReqItem icon -> DeleteUsedItemsDialog (confirm)
  // -> FOCFragment.DeleteFOCReqItem -> GET DeleteFOC_Request_Items_Details?id=.
  const confirmDeleteRequest = (focRequestId?: number) => {
    if (!focRequestId) return;
    Alert.alert('Delete Request', 'Are you sure you want to delete this request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await getDeleteFocRequestItem({ id: focRequestId });
            if (res?.Code !== '200') {
              Alert.alert('Failed', res?.Message || 'Could not delete the request.');
              return;
            }
            setRequests(prev => prev.filter(r => r.FocRequestId !== focRequestId));
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Could not delete the request.');
          }
        },
      },
    ]);
  };

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
        <Pressable style={styles.filterItem} onPress={() => setActiveDropdown('STATUS')}>
          <Text style={styles.filterText}>{selectedStatusTag?.FocStatusName ?? 'Status Tag'}</Text>
          <Ionicons name="chevron-down" size={scale(16)} color={COLORS.primary} />
        </Pressable>
        <Pressable style={styles.filterItem} onPress={() => setActiveDropdown('ISSUE')}>
          <Text style={styles.filterText}>{selectedIssueType?.label ?? 'Issue'}</Text>
          <Ionicons name="chevron-down" size={scale(16)} color={COLORS.primary} />
        </Pressable>
        <Pressable style={styles.filterItem} onPress={onRefresh} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.refreshText}>Refresh List</Text>
          {refreshing ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons name="refresh" size={scale(16)} color={COLORS.primary} />
          )}
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
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Image
                source={require('../../../../assets/images/noresultfound.png')}
                style={styles.emptyImage}
                resizeMode="contain"
              />
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('FOCDetails', { focRequest: item })}
            >
              {/* Status Badge */}
              <View style={styles.naBadge}>
                <Text style={styles.naText}>{item.FOCStatusName || 'NA'}</Text>
              </View>

              <Pressable
                style={styles.deleteIcon}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => confirmDeleteRequest(item.FocRequestId)}
              >
                <Ionicons name="trash-outline" size={scale(18)} color={COLORS.primary} />
              </Pressable>

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
            </Pressable>
          )}
        />
      )}

      {/* STATUS TAG MODAL */}
      <Modal visible={activeDropdown === 'STATUS'} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setActiveDropdown(null)} />
        <View style={styles.centerModal}>
          <Text style={styles.modalTitle}>Select Status Tag</Text>
          <FlatList
            data={statusTagList}
            keyExtractor={(item, index) => String(item.FocStatusId ?? index)}
            ListHeaderComponent={
              <Pressable style={styles.modalItem} onPress={() => { setSelectedStatusTag(null); setActiveDropdown(null); }}>
                <Text style={styles.modalItemText}>All</Text>
              </Pressable>
            }
            renderItem={({ item }) => (
              <Pressable style={styles.modalItem} onPress={() => { setSelectedStatusTag(item); setActiveDropdown(null); }}>
                <Text style={styles.modalItemText}>{item.FocStatusName}</Text>
              </Pressable>
            )}
            style={{ maxHeight: hp(30) }}
            bounces={false}
          />
        </View>
      </Modal>

      {/* ISSUE MODAL */}
      <Modal visible={activeDropdown === 'ISSUE'} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setActiveDropdown(null)} />
        <View style={styles.centerModal}>
          <Text style={styles.modalTitle}>Select Issue</Text>
          <FlatList
            data={ISSUE_OPTIONS}
            keyExtractor={(item) => String(item.id)}
            ListHeaderComponent={
              <Pressable style={styles.modalItem} onPress={() => { setSelectedIssueType(null); setActiveDropdown(null); }}>
                <Text style={styles.modalItemText}>All</Text>
              </Pressable>
            }
            renderItem={({ item }) => (
              <Pressable style={styles.modalItem} onPress={() => { setSelectedIssueType(item); setActiveDropdown(null); }}>
                <Text style={styles.modalItemText}>{item.label}</Text>
              </Pressable>
            )}
            style={{ maxHeight: hp(30) }}
            bounces={false}
          />
        </View>
      </Modal>
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
  deleteIcon: {
    position: 'absolute',
    top: ms(10),
    right: ms(10),
    zIndex: 1,
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
  emptyState: {
    alignItems: 'center',
    marginTop: ms(60),
  },
  emptyImage: {
    width: scale(180),
    height: scale(180),
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  centerModal: {
    position: 'absolute',
    top: '30%',
    left: scale(24),
    right: scale(24),
    backgroundColor: '#fff',
    borderRadius: ms(14),
    paddingVertical: ms(12),
  },
  modalTitle: {
    fontSize: sp(15),
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingHorizontal: ms(16),
    paddingBottom: ms(8),
  },
  modalItem: {
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  modalItemText: {
    fontSize: sp(14),
    color: COLORS.textPrimary,
  },
});