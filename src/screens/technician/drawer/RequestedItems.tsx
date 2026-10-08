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

// Java drawables: ic_delete_acc, ic_reset, ic_down_arrow_red
const DeleteIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Path fill={COLORS.primary} d="M19.45,68.24c0,-9.34 -0.01,-18.68 0,-28.02c0,-2.97 1.6,-4.99 4.25,-5.46c2.92,-0.51 5.66,1.63 5.88,4.61c0.03,0.43 0.02,0.87 0.02,1.31c0,18.25 0,36.49 0,54.74c0,6.07 4.13,10.2 10.21,10.2c13.46,0 26.91,0 40.37,0c6.08,0 10.22,-4.13 10.22,-10.2c0,-18.4 0,-36.81 0,-55.21c0,-2.85 1.53,-4.89 4.02,-5.4c2.87,-0.59 5.53,1.23 6.02,4.13c0.09,0.54 0.11,1.1 0.11,1.65c0.01,18.33 0.01,36.65 0,54.98c0,10.04 -6.72,18.12 -16.59,19.91c-1.16,0.21 -2.36,0.29 -3.54,0.29c-13.61,0.02 -27.23,0.02 -40.84,0.01c-11.31,-0.01 -20.11,-8.8 -20.13,-20.09C19.44,86.52 19.45,77.38 19.45,68.24z" />
    <Path fill={COLORS.primary} d="M80.24,19.45c1.33,0 2.47,0 3.61,0c5.46,0 10.92,-0.03 16.38,0.01c3.7,0.02 6.14,3.17 5.13,6.53c-0.6,1.99 -2.35,3.42 -4.42,3.59c-0.28,0.02 -0.55,0.02 -0.83,0.02c-26.74,0 -53.49,0 -80.23,0c-3.22,0 -5.51,-2.15 -5.48,-5.12c0.02,-2.91 2.29,-5.02 5.47,-5.03c6.09,-0.02 12.19,-0.01 18.28,-0.01c0.47,0 0.94,0 1.61,0c0,-0.5 0,-0.92 0,-1.33c0,-2.85 -0.02,-5.7 0.01,-8.55c0.03,-3.19 2.09,-5.3 5.28,-5.31c9.97,-0.03 19.94,-0.03 29.91,0c3.19,0.01 5.26,2.11 5.29,5.3C80.26,12.79 80.24,16.03 80.24,19.45zM49.92,19.34c6.76,0 13.45,0 20.13,0c0,-1.7 0,-3.29 0,-4.88c-6.76,0 -13.42,0 -20.13,0C49.92,16.13 49.92,17.73 49.92,19.34z" />
    <Path fill={COLORS.primary} d="M44.8,67.48c0,-5.89 -0.02,-11.79 0.01,-17.68c0.01,-2.48 1.75,-4.46 4.17,-4.93c2.19,-0.42 4.56,0.77 5.45,2.87c0.33,0.78 0.5,1.68 0.5,2.53c0.03,11.55 0.03,23.1 0.02,34.65c0,3.23 -2.18,5.5 -5.14,5.47c-2.91,-0.03 -5,-2.3 -5,-5.47C44.79,79.11 44.8,73.3 44.8,67.48z" />
    <Path fill={COLORS.primary} d="M75.2,67.63c0,5.89 0.02,11.79 -0.01,17.68c-0.01,2.39 -1.49,4.27 -3.74,4.9c-2.17,0.6 -4.54,-0.27 -5.61,-2.26c-0.47,-0.87 -0.76,-1.94 -0.76,-2.93c-0.05,-11.63 -0.05,-23.26 -0.02,-34.89c0.01,-3.13 2.23,-5.37 5.16,-5.32c2.87,0.04 4.97,2.3 4.98,5.38C75.21,56 75.2,61.81 75.2,67.63z" />
  </Svg>
);

const ResetIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill="#C3002F" d="M12,4L12,1L8,5l4,4L12,6c3.31,0 6,2.69 6,6 0,1.01 -0.25,1.97 -0.7,2.8l1.46,1.46C19.54,15.03 20,13.57 20,12c0,-4.42 -3.58,-8 -8,-8zM12,18c-3.31,0 -6,-2.69 -6,-6 0,-1.01 0.25,-1.97 0.7,-2.8L5.24,7.74C4.46,8.97 4,10.43 4,12c0,4.42 3.58,8 8,8v3l4,-4 -4,-4v3z" />
  </Svg>
);

const DownArrow = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill="#c3002f" d="M7.41,8.59L12,13.17l4.59,-4.58L18,10l-6,6 -6,-6 1.41,-1.41z" />
  </Svg>
);

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
      <View style={styles.filterRow}>
        <Pressable style={[styles.filterItem, { flexGrow: 1.5, flexBasis: ms(40) }]} onPress={() => setActiveDropdown('STATUS')}>
          <Text style={styles.filterText} numberOfLines={1}>{selectedStatusTag?.FocStatusName ?? 'Status Tag'}</Text>
          <DownArrow size={ms(24)} />
        </Pressable>
        <Pressable style={[styles.filterItem, { flexGrow: 1, flexBasis: ms(40) }]} onPress={() => setActiveDropdown('ISSUE')}>
          <Text style={styles.filterText} numberOfLines={1}>{selectedIssueType?.label ?? 'Issue'}</Text>
          <DownArrow size={ms(24)} />
        </Pressable>
        <Pressable style={styles.refreshItem} onPress={resetList} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.refreshText}>Refresh List</Text>
          {refreshing ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ width: ms(24), height: ms(24), marginLeft: ms(5) }} />
          ) : (
            <View style={{ marginLeft: ms(5) }}><ResetIcon size={ms(24)} /></View>
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
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('FOCDetails', { focRequest: item })}
            >
              <View style={styles.headerRow}>
                <Text style={styles.statusBadge} numberOfLines={1}>{(item.FOCStatusName ?? 'NA').toUpperCase()}</Text>
                <Text style={styles.reqText}>#REQ {item.FocRequestId}</Text>
                <Text style={styles.issueLabel}>Issue: </Text>
                <Text style={styles.issueValue}>{item.IsAnyIssue ? 'Yes' : 'No'}</Text>
                <Text style={styles.dateLabel}>Date</Text>
                <Text style={styles.dateValue}>{formatDate(item.CreatedDate)}</Text>
                <View style={{ flexGrow: 1 }} />
              </View>

              {item.NewTaskID != null ? (
                <Text style={[styles.taskIdText, { color: COLORS.primary }]}>{item.NewTaskID}</Text>
              ) : (
                <Text style={[styles.taskIdText, { color: '#000' }]}>DIRECT</Text>
              )}

              <View style={styles.notesWrap}>
                <View style={styles.notesRow}>
                  <Text style={styles.notesLabel} numberOfLines={1}>Notes</Text>
                  <Text style={styles.notesText} numberOfLines={4}>{item.Notes ?? ''}</Text>
                  <Pressable
                    style={styles.deleteIcon}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => confirmDeleteRequest(item.FocRequestId)}
                  >
                    <DeleteIcon size={ms(20)} />
                  </Pressable>
                </View>
              </View>
            </Pressable>
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

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ms(30),
    marginTop: ms(10),
    marginBottom: ms(10),
    paddingHorizontal: ms(10),
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    marginLeft: ms(10),
    height: ms(24),
    backgroundColor: '#fff',
  },
  filterText: {
    fontSize: sp(14),
    color: '#000',
    flexShrink: 1,
  },
  refreshItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexGrow: 0.5,
    marginRight: ms(5),
  },
  refreshText: {
    fontSize: sp(13),
    color: COLORS.primary,
    fontWeight: 'bold',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: ms(10),
    margin: ms(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexBasis: ms(90),
    flexGrow: 0.5,
    flexShrink: 0,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    color: '#fff',
    fontSize: sp(10),
    fontWeight: 'bold',
    paddingLeft: ms(10),
    paddingRight: ms(15),
    paddingVertical: ms(3),
    borderTopLeftRadius: ms(10),
    borderBottomRightRadius: ms(10),
    overflow: 'hidden',
  },
  reqText: {
    flexGrow: 1,
    marginLeft: ms(10),
    paddingLeft: ms(3),
    textAlign: 'center',
    color: '#1976D2',
    fontSize: sp(12),
    fontWeight: 'bold',
  },
  issueLabel: {
    flexGrow: 0.5,
    marginLeft: ms(10),
    color: '#1d2536',
    fontSize: sp(12),
    fontWeight: 'bold',
  },
  issueValue: {
    flexGrow: 1,
    color: COLORS.primary,
    fontSize: sp(12),
    fontWeight: 'bold',
  },
  dateLabel: {
    flexGrow: 1,
    marginLeft: ms(10),
    color: '#1d2536',
    fontSize: sp(12),
    fontWeight: 'bold',
  },
  dateValue: {
    flexGrow: 1,
    color: '#9a9faa',
    fontSize: sp(12),
    fontWeight: 'bold',
  },
  taskIdText: {
    alignSelf: 'flex-end',
    marginTop: ms(8),
    marginRight: ms(15),
    fontSize: sp(14),
    fontWeight: 'bold',
  },
  notesWrap: {
    marginHorizontal: ms(10),
    marginTop: ms(15),
    marginBottom: ms(14),
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ms(5),
  },
  notesLabel: {
    fontSize: sp(12),
    color: '#1d2536',
  },
  notesText: {
    flexGrow: 2.5,
    flexBasis: 0,
    paddingLeft: ms(10),
    fontSize: sp(12),
    color: '#9a9faa',
  },
  deleteIcon: {
    flexGrow: 0.5,
    flexBasis: 0,
    alignItems: 'center',
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