// src/screens/technician/drawer/RequestedItems.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Image, TextInput, Dimensions,
  Platform, StatusBar, ActivityIndicator, RefreshControl, Alert, ToastAndroid,
} from 'react-native';
import Modal from '../../../components/AppModal';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../../../theme/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ms, sp, scale, hp } from '../../../utils/responsive';
import { getFocList, getFocStatusTagList, getDeleteFocRequestItem } from '../../../api/focItemRequest/focItemRequestService';
import type { GetFOCListResultData, GetFOCStatusTagListResultData } from '../../../api/focItemRequest/focItemRequest.types';
import { getCurrentUserId } from '../../../state/session';
import DeleteFocDialog from '../../../components/DeleteFocDialog';
import { FocRequestCard, FocFilterRow, formatFocDate } from '../../../components/FocRequestCard';

const ISSUE_OPTIONS = [
  { id: 1, label: 'Yes' },
  { id: 2, label: 'No' },
];

// Java: Dialog with dialog_searchable_* layout, window 800x1000px, ArrayAdapter filter.
function SearchablePicker({ visible, title, options, onSelect, onClose }: {
  visible: boolean;
  title: string;
  options: string[];
  onSelect: (label: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  useEffect(() => { if (visible) setQuery(''); }, [visible]);

  // ArrayAdapter's default filter: prefix of the whole value or of any word in it.
  const q = query.trim().toLowerCase();
  const data = q
    ? options.filter(o => {
        const v = o.toLowerCase();
        return v.startsWith(q) || v.split(' ').some(w => w.startsWith(q));
      })
    : options;

  const { width, height } = Dimensions.get('window');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View pointerEvents="box-none" style={[styles.dialogWrap, { height: height * (1000 / 2400) }]}>
        <View style={[styles.dialog, { width: width * (800 / 1080) }]}>
          <Text style={styles.dialogTitle}>{title}</Text>
          <TextInput
            style={styles.dialogSearch}
            placeholder="Search..."
            placeholderTextColor="#757575"
            value={query}
            onChangeText={setQuery}
            numberOfLines={1}
          />
          <FlatList
            style={{ flexGrow: 0 }}
            data={data}
            keyExtractor={(item, i) => item + i}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable style={styles.dialogItem} android_ripple={{ color: '#ddd' }} onPress={() => onSelect(item)}>
                <Text style={styles.dialogItemText}>{item}</Text>
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

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

  // Java's "Refresh List" (reset_list) clears both filters and reloads the screen.
  const resetList = useCallback(() => {
    if (!selectedStatusTag && !selectedIssueType) {
      onRefresh();
      return;
    }
    setSelectedStatusTag(null);
    setSelectedIssueType(null);
  }, [selectedStatusTag, selectedIssueType, onRefresh]);

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
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const confirmDeleteRequest = (focRequestId?: number) => {
    if (!focRequestId) return;
    setPendingDeleteId(focRequestId);
  };

  const deleteRequest = async () => {
    const focRequestId = pendingDeleteId;
    setPendingDeleteId(null);
    if (focRequestId == null) return;
    try {
      const res = await getDeleteFocRequestItem({ id: focRequestId });
      if (res?.Code !== '200') {
        Alert.alert('Failed', res?.Message || 'Could not delete the request.');
        return;
      }
      if (res?.Message) ToastAndroid.show(res.Message, ToastAndroid.SHORT);
      setRequests(prev => prev.filter(r => r.FocRequestId !== focRequestId));
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not delete the request.');
    }
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
          <Text style={styles.requestText}>+ Request</Text>
        </Pressable>
      </View>

      {/* Filters */}
      <FocFilterRow
        statusLabel={selectedStatusTag?.FocStatusName ?? 'Status Tag'}
        issueLabel={selectedIssueType?.label ?? 'Issue'}
        onStatusPress={() => setActiveDropdown('STATUS')}
        onIssuePress={() => setActiveDropdown('ISSUE')}
        onRefreshPress={resetList}
        refreshing={refreshing}
      />

      {/* List */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: ms(40) }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.FocRequestId)}
          contentContainerStyle={{ paddingBottom: ms(120), paddingHorizontal: ms(10) }}
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
            <FocRequestCard
              status={item.FOCStatusName ?? 'NA'}
              requestId={item.FocRequestId ?? ''}
              isIssue={!!item.IsAnyIssue}
              date={formatFocDate(item.CreatedDate)}
              taskCode={item.NewTaskID != null ? String(item.NewTaskID) : ''}
              notes={item.Notes ?? ''}
              onPress={() => navigation.navigate('FOCDetails', { focRequest: item })}
              onDelete={() => confirmDeleteRequest(item.FocRequestId)}
            />
          )}
        />
      )}

      <DeleteFocDialog
        visible={pendingDeleteId != null}
        onConfirm={deleteRequest}
        onCancel={() => setPendingDeleteId(null)}
      />

      <SearchablePicker
        visible={activeDropdown === 'STATUS'}
        title="Select Status Tag"
        options={statusTagList.map(t => t.FocStatusName ?? '')}
        onClose={() => setActiveDropdown(null)}
        onSelect={label => {
          const tag = statusTagList.find(t => t.FocStatusName === label) ?? null;
          setSelectedStatusTag(tag);
          setActiveDropdown(null);
        }}
      />

      <SearchablePicker
        visible={activeDropdown === 'ISSUE'}
        title="Select Issue"
        options={ISSUE_OPTIONS.map(o => o.label)}
        onClose={() => setActiveDropdown(null)}
        onSelect={label => {
          setSelectedIssueType(ISSUE_OPTIONS.find(o => o.label === label) ?? null);
          setActiveDropdown(null);
        }}
      />
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
    marginTop: ms(20),
    marginRight: ms(20),
  },
  requestButton: {
    width: ms(80),
    height: ms(30),
    backgroundColor: '#000',
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestText: {
    color: '#fff',
    fontSize: sp(12),
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
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dialogWrap: {
    // Java: Dialog window is 800x1000px; the layout wraps its content at the top of it
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    top: -ms(15.5),
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dialog: {
    backgroundColor: '#fff',
    padding: ms(16),
  },
  dialogTitle: {
    fontSize: sp(20),
    fontWeight: 'bold',
    color: '#666',
  },
  dialogSearch: {
    marginTop: ms(8),
    marginBottom: ms(8),
    paddingVertical: ms(9.5),
    paddingHorizontal: ms(12),
    borderWidth: 1,
    borderColor: '#ff4a4a',
    borderRadius: ms(10),
    fontSize: sp(17),
    color: '#000',
  },
  dialogItem: {
    minHeight: ms(48),
    justifyContent: 'center',
    paddingHorizontal: ms(16),
  },
  dialogItemText: {
    fontSize: sp(15),
    color: '#000',
  },
});