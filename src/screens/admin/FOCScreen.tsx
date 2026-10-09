// src/screens/admin/FOCScreen.tsx
//
// Migrated from FOCFragment.java. Renders the list of FOC (Free of Cost) item
// requests with search, Status Tag filter, Issue (Yes/No) filter, pagination,
// and delete — matching the Java fragment's getFOCList / DeleteFOCReqItem flow.
//
// This was previously embedded inline inside ItemInventoryTabHostScreen.tsx's
// "requested" tab (a stub Alert for delete). It's now a standalone component so
// it can be reused as a tab panel (see ItemInventoryTabHostScreen.tsx) and/or
// pushed as its own stack screen.

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ms, sp} from '../../utils/responsive';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SearchPickerModal from '../../components/SearchPickerModal';
import DeleteFocDialog from '../../components/DeleteFocDialog';
import {FocRequestCard, FocFilterRow, formatFocDate} from '../../components/FocRequestCard';
import {COLORS} from '../../theme/theme';
import {
  type FocRequestListItem,
  type FocRequestListResponse,
  type FocStatusTag,
  type FocStatusTagResponse,
} from './adminLegacyApiTypes';
import {
  getFocList,
  getFocStatusTagList,
  getDeleteFocRequestItem,
} from '../../api/focItemRequest/focItemRequestService';

type FOCScreenProps = {
  ownerId: number;
  isFieldWorker?: boolean;
  // Called when a field worker taps "+ Request" to raise a new FOC request.
  // (Matches Java's plusFocReq -> TaskRequestItems_FW, already migrated on the
  // technician side as ItemRequestScreen.tsx.) Optional so this screen can be
  // dropped in without wiring navigation immediately.
  onRequestNewItem?: () => void;
};

type FetchFocPageOptions = {
  nextPage: number;
  replace: boolean;
  refreshing?: boolean;
  searchParam?: string;
  statusId?: number;
  issueTypeId?: number;
};

type IssueFilter = {
  id: number;
  label: string;
};

const PAGE_START = 1;
const FOC_PAGE_SIZE = 10;
const FOC_SEARCH_LIMIT = 10;
const THEME_PRIMARY = '#c3002f';

const ISSUE_FILTERS: IssueFilter[] = [
  {id: 0, label: 'Issue'},
  {id: 1, label: 'Yes'},
  {id: 2, label: 'No'},
];

const getFocResultData = (response: FocRequestListResponse) =>
  response.resultData ?? response.ResultData ?? [];

const getFocTagResultData = (response: FocStatusTagResponse) =>
  response.resultData ?? response.ResultData ?? [];

const getFocCode = (response: FocRequestListResponse) =>
  String(response.code ?? response.Code ?? '');

const getFocMessage = (response: FocRequestListResponse) =>
  String(response.message ?? response.Message ?? '').trim();

const getFocString = (
  item: FocRequestListItem,
  keys: Array<keyof FocRequestListItem>,
) => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return '';
};

const getFocNumber = (
  item: FocRequestListItem,
  keys: Array<keyof FocRequestListItem>,
) => {
  for (const key of keys) {
    const value = item[key];
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
};

const getFocId = (item: FocRequestListItem) =>
  getFocNumber(item, [
    'FocRequestId',
    'focRequestId',
    'FOCRequestId',
    'focRequestedID',
    'FOCRequestedID',
    'id',
    'Id',
  ]);

const getFocRequestNo = (item: FocRequestListItem) =>
  getFocString(item, [
    'requestNo',
    'RequestNo',
    'focRequestNo',
    'FOCRequestNo',
    'focReqNo',
    'FOCReqNo',
  ]) || `#REQ${getFocId(item) || '-'}`;

const getFocIssue = (item: FocRequestListItem) => {
  const raw =
    item.issue ??
    item.Issue ??
    item.isIssue ??
    item.IsIssue ??
    item.isAnyIssue ??
    item.IsAnyIssue ??
    item.issueType ??
    item.IssueType;

  if (typeof raw === 'boolean') {
    return raw ? 'Yes' : 'No';
  }
  if (Number(raw) === 1) {
    return 'Yes';
  }
  if (Number(raw) === 2) {
    return 'No';
  }

  const value = String(raw ?? '').trim();
  return value || 'No';
};

const getFocStatus = (item: FocRequestListItem) =>
  getFocString(item, [
    'FOCStatusName',
    'focStatusName',
    'FocStatusName',
    'statusName',
    'StatusName',
  ]) ||
  String(item.FOC_ItemList?.[0]?.ItemRequestStatusTagName ?? '').trim() ||
  'NA';

const getFocDate = (item: FocRequestListItem) => {
  const raw = getFocString(item, [
    'focDate',
    'FOCDate',
    'requestDate',
    'RequestDate',
    'createdDate',
    'CreatedDate',
    'date',
    'Date',
  ]);
  if (!raw) {
    return '-';
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw.split('T')[0] || raw;
  }
  return date.toLocaleDateString('en-GB');
};

const getFocTaskCode = (item: FocRequestListItem) =>
  getFocString(item, ['newTaskID', 'NewTaskID', 'taskId', 'TaskId']);

const getStatusTagId = (tag: FocStatusTag) =>
  Number(tag.focStatusId ?? tag.FocStatusId ?? tag.FOCStatusId ?? 0);

const getStatusTagName = (tag: FocStatusTag) =>
  String(tag.focStatusName ?? tag.FocStatusName ?? tag.FOCStatusName ?? '').trim();

const isFocSuccessOrNoData = (response: FocRequestListResponse) => {
  const code = getFocCode(response);
  return code === '200' || code === '500' || code === '';
};

const FOCScreen: React.FC<FOCScreenProps> = ({
  ownerId,
  isFieldWorker = false,
  onRequestNewItem,
}) => {
  const [focRequests, setFocRequests] = useState<FocRequestListItem[]>([]);
  const [focSearchText, setFocSearchText] = useState('');
  const [submittedFocSearch, setSubmittedFocSearch] = useState('');
  const [focPageIndex, setFocPageIndex] = useState(PAGE_START);
  const [isFocInitialLoading, setIsFocInitialLoading] = useState(false);
  const [isFocRefreshing, setIsFocRefreshing] = useState(false);
  const [isFocLoadingMore, setIsFocLoadingMore] = useState(false);
  const [isFocLastPage, setIsFocLastPage] = useState(false);
  const [focErrorMessage, setFocErrorMessage] = useState('');
  const [statusTags, setStatusTags] = useState<Array<{id: number; name: string}>>([]);
  const [selectedStatusTag, setSelectedStatusTag] = useState({id: 0, name: 'Status Tag'});
  const [selectedIssue, setSelectedIssue] = useState<IssueFilter>(ISSUE_FILTERS[0]);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [deletingFocId, setDeletingFocId] = useState<number | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<FocRequestListItem | null>(null);
  const latestFocRequestId = useRef(0);

  const fetchFocPage = useCallback(
    async ({
      nextPage,
      replace,
      refreshing = false,
      searchParam = submittedFocSearch,
      statusId = selectedStatusTag.id,
      issueTypeId = selectedIssue.id,
    }: FetchFocPageOptions) => {
      if (replace && !refreshing) {
        setIsFocInitialLoading(true);
      } else if (refreshing) {
        setIsFocRefreshing(true);
      } else {
        setIsFocLoadingMore(true);
      }

      setFocErrorMessage('');
      const requestId = latestFocRequestId.current + 1;
      latestFocRequestId.current = requestId;

      try {
        const response = (await getFocList({
          Pageindex: nextPage,
          Pagesize: FOC_PAGE_SIZE,
          ZoneId: 0,
          OwnerId: ownerId,
          IssueTypeID: issueTypeId,
          FOCStatusTagID: statusId,
          SearchParam: searchParam,
        })) as FocRequestListResponse;

        if (requestId !== latestFocRequestId.current) {
          return;
        }

        if (!isFocSuccessOrNoData(response)) {
          throw new Error(getFocMessage(response) || 'Unable to load requests.');
        }

        const nextRequests = getFocResultData(response);
        setFocRequests(previous =>
          replace ? nextRequests : [...previous, ...nextRequests],
        );
        setFocPageIndex(nextPage);
        setIsFocLastPage(nextRequests.length === 0);
      } catch (error) {
        if (requestId !== latestFocRequestId.current) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load requested items right now.';
        setFocErrorMessage(message);
        if (replace) {
          setFocRequests([]);
          setIsFocLastPage(true);
        }
      } finally {
        if (requestId === latestFocRequestId.current) {
          setIsFocInitialLoading(false);
          setIsFocRefreshing(false);
          setIsFocLoadingMore(false);
        }
      }
    },
    [ownerId, selectedIssue.id, selectedStatusTag.id, submittedFocSearch],
  );

  const loadFirstFocPage = useCallback(
    (
      refreshing = false,
      searchParam = submittedFocSearch,
      statusId = selectedStatusTag.id,
      issueTypeId = selectedIssue.id,
    ) => {
      fetchFocPage({
        nextPage: PAGE_START,
        replace: true,
        refreshing,
        searchParam,
        statusId,
        issueTypeId,
      });
    },
    [fetchFocPage, selectedIssue.id, selectedStatusTag.id, submittedFocSearch],
  );

  useEffect(() => {
    loadFirstFocPage();
    // Only run once on mount — filter/search changes reload explicitly via
    // their own handlers below (submitFocSearch, status/issue pickers, reset).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadStatusTags = async () => {
      try {
        const response = (await getFocStatusTagList({userid: ownerId})) as FocStatusTagResponse;
        if (!isMounted) {
          return;
        }
        setStatusTags(
          getFocTagResultData(response)
            .map(tag => ({id: getStatusTagId(tag), name: getStatusTagName(tag)}))
            .filter(tag => tag.id > 0 && tag.name),
        );
      } catch {
        if (isMounted) {
          setStatusTags([]);
        }
      }
    };

    loadStatusTags();
    return () => {
      isMounted = false;
    };
  }, []);

  const submitFocSearch = () => {
    const trimmed = focSearchText.trim();
    setSubmittedFocSearch(trimmed);
    loadFirstFocPage(false, trimmed);
  };

  const clearFocSearch = () => {
    setFocSearchText('');
    if (submittedFocSearch) {
      setSubmittedFocSearch('');
      loadFirstFocPage(false, '');
    }
  };

  const refreshFocList = () => {
    setFocSearchText('');
    setSubmittedFocSearch('');
    setSelectedStatusTag({id: 0, name: 'Status Tag'});
    setSelectedIssue(ISSUE_FILTERS[0]);
    fetchFocPage({
      nextPage: PAGE_START,
      replace: true,
      searchParam: '',
      statusId: 0,
      issueTypeId: 0,
    });
  };

  const selectStatusTag = (tag: {id: number; name: string}) => {
    setSelectedStatusTag(tag);
    setIsStatusModalOpen(false);
    loadFirstFocPage(false, undefined, tag.id, undefined);
  };

  const selectIssueFilter = (issue: IssueFilter) => {
    setSelectedIssue(issue);
    setIsIssueModalOpen(false);
    loadFirstFocPage(false, undefined, undefined, issue.id);
  };

  const handleFocPress = (item: FocRequestListItem) => {
    Alert.alert(
      getFocRequestNo(item),
      [`Status: ${getFocStatus(item)}`, `Issue: ${getFocIssue(item)}`].join('\n'),
    );
  };

  // Deletes the whole FOC request (matches Java's DeleteFOCReqItem, called from
  // the per-row delete button via DeleteUsedItemsDialog's confirm step). Java
  // also has a DeleteFOCReqSubItem call for removing a single line item inside
  // a request's detail/edit view — that edit screen (FOCDetails_UpdateFragmnt)
  // was itself commented out in the Java source and has no RN equivalent yet,
  // so getDeleteFocRequestSubItem isn't wired here.
  const confirmDeleteFocRequest = async (item: FocRequestListItem) => {
    const focRequestId = getFocId(item);
    if (!focRequestId) {
      Alert.alert('Delete request', 'Request id is not available.');
      return;
    }

    setDeletingFocId(focRequestId);
    try {
      const response = await getDeleteFocRequestItem({id: focRequestId});
      if (response.Code === '200') {
        Alert.alert('Deleted', response.Message || 'Request deleted successfully.');
        setFocRequests(previous => previous.filter(row => getFocId(row) !== focRequestId));
      } else {
        Alert.alert('Delete Failed', response.Message || 'Could not delete this request.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete this request.';
      Alert.alert('Error', message);
    } finally {
      setDeletingFocId(null);
    }
  };

  const renderFocRequestRow = ({item}: {item: FocRequestListItem}) => {
    const rowId = getFocId(item);
    return (
      <FocRequestCard
        status={getFocString(item, ['FOCStatusName', 'focStatusName', 'FocStatusName']) || 'NA'}
        requestId={rowId || '-'}
        isIssue={getFocIssue(item) === 'Yes'}
        date={
          formatFocDate(
            getFocString(item, ['createdDate', 'CreatedDate', 'focDate', 'FOCDate', 'requestDate', 'RequestDate']),
          ) || getFocDate(item)
        }
        taskCode={getFocTaskCode(item) === '0' ? '' : getFocTaskCode(item)}
        notes={getFocString(item, ['Notes', 'notes'])}
        deleting={deletingFocId === rowId}
        onPress={() => handleFocPress(item)}
        onDelete={() => setPendingDeleteItem(item)}
      />
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.focRequestRow}>
        {!isFieldWorker ? (
          <View style={styles.focSearchBox}>
            <Ionicons name="search" style={styles.searchIcon} />
            <TextInput
              value={focSearchText}
              onChangeText={value => {
                const nextValue = value.slice(0, FOC_SEARCH_LIMIT);
                setFocSearchText(nextValue);
                if (!nextValue.trim() && submittedFocSearch) {
                  setSubmittedFocSearch('');
                  loadFirstFocPage(false, '');
                }
              }}
              onSubmitEditing={submitFocSearch}
              placeholder="Search Employee Name"
              placeholderTextColor={COLORS.lightGray}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {focSearchText ? (
              <Pressable hitSlop={10} onPress={clearFocSearch}>
                <Ionicons name="close" style={styles.clearText} />
              </Pressable>
            ) : null}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.requestButton}
            onPress={() => {
              if (onRequestNewItem) {
                onRequestNewItem();
              } else {
                Alert.alert('Request item', 'Raise a request from the Items tab.');
              }
            }}>
            <Text style={styles.requestButtonText}>+ Request</Text>
          </TouchableOpacity>
        )}
      </View>

      <FocFilterRow
        statusLabel={selectedStatusTag.name}
        issueLabel={selectedIssue.label}
        onStatusPress={() => setIsStatusModalOpen(true)}
        onIssuePress={() => setIsIssueModalOpen(true)}
        onRefreshPress={refreshFocList}
        refreshing={isFocRefreshing}
      />

      {isFocInitialLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={THEME_PRIMARY} />
          <Text style={styles.loadingText}>Loading requested items...</Text>
        </View>
      ) : null}

      <FlatList
        data={focRequests}
        keyExtractor={(item, index) => `${getFocId(item) || index}-${index}`}
        renderItem={renderFocRequestRow}
        contentContainerStyle={styles.focListContent}
        refreshControl={
          <RefreshControl
            refreshing={isFocRefreshing}
            colors={[THEME_PRIMARY]}
            tintColor={THEME_PRIMARY}
            onRefresh={() => loadFirstFocPage(true)}
          />
        }
        ListEmptyComponent={
          isFocInitialLoading ? null : focErrorMessage ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Unable to Load Requests</Text>
              <Text style={styles.emptyText}>{focErrorMessage}</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Image
                source={require('../../../assets/images/noresultfound.png')}
                style={styles.emptyImage}
                resizeMode="contain"
              />
            </View>
          )
        }
        ListFooterComponent={
          isFocLoadingMore ? (
            <View style={styles.listFooter}>
              <ActivityIndicator color={THEME_PRIMARY} size="small" />
            </View>
          ) : null
        }
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          // focRequests.length: FlatList fires onEndReached on first render, before the
          // initial load starts; a page-2 fetch then invalidates the page-1 response.
          if (focRequests.length > 0 && !isFocInitialLoading && !isFocLoadingMore && !isFocLastPage) {
            fetchFocPage({nextPage: focPageIndex + 1, replace: false});
          }
        }}
      />

      <DeleteFocDialog
        visible={pendingDeleteItem !== null}
        onConfirm={() => {
          const item = pendingDeleteItem;
          setPendingDeleteItem(null);
          if (item) {
            confirmDeleteFocRequest(item);
          }
        }}
        onCancel={() => setPendingDeleteItem(null)}
      />

      <SearchPickerModal
        visible={isStatusModalOpen}
        title="Select Status Tag"
        options={statusTags.map(tag => ({id: tag.id, label: tag.name}))}
        emptyText="No status tags returned."
        onClose={() => setIsStatusModalOpen(false)}
        onSelect={option => selectStatusTag({id: option.id, name: option.label})}
      />

      <SearchPickerModal
        visible={isIssueModalOpen}
        title="Select Issue"
        hideSearch
        options={ISSUE_FILTERS.filter(issue => issue.id > 0).map(issue => ({id: issue.id, label: issue.label}))}
        onClose={() => setIsIssueModalOpen(false)}
        onSelect={option =>
          selectIssueFilter(ISSUE_FILTERS.find(issue => issue.id === option.id) ?? ISSUE_FILTERS[0])
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  focRequestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(16),
    paddingTop: ms(12),
  },
  focSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkGray,
    paddingHorizontal: ms(8),
    height: ms(40),
  },
  searchIcon: {
    fontSize: ms(20),
    color: COLORS.lightGray,
    marginRight: ms(8),
  },
  searchInput: {
    flex: 1,
    fontSize: sp(14),
    color: COLORS.textBlack,
    padding: 0,
  },
  clearText: {
    fontSize: ms(20),
    color: COLORS.textBlack,
    paddingHorizontal: ms(4),
  },
  requestButton: {
    backgroundColor: THEME_PRIMARY,
    borderRadius: ms(10),
    paddingVertical: ms(10),
    paddingHorizontal: ms(16),
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingOverlay: {
    alignItems: 'center',
    paddingVertical: ms(16),
  },
  loadingText: {
    marginTop: ms(8),
    color: '#6B7280',
    fontSize: sp(12),
  },
  focListContent: {
    paddingHorizontal: ms(16),
    paddingBottom: ms(24),
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: ms(48),
  },
  emptyImage: {
    width: ms(220),
    height: ms(220),
  },
  emptyTitle: {
    fontSize: sp(14),
    fontWeight: '600',
    color: '#111827',
    marginBottom: ms(4),
  },
  emptyText: {
    fontSize: sp(12),
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: ms(24),
  },
  listFooter: {
    paddingVertical: ms(16),
  },
});

export default FOCScreen;