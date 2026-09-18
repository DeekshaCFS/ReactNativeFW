import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
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
import {
  type AssignedItemListItem,
  type AssignedItemListResponse,
  type ItemInventoryListItem,
  type ItemInventoryListResponse,
  type UsedItemListItem,
  type UsedItemListResponse,
} from './adminLegacyApiTypes';
import { getAllLargeItemList, getAllAssignItemlistTechwise, getUsedItemlist } from '../../api/item/itemService';
import FOCScreen from './FOCScreen';

type ItemInventoryTabHostScreenProps = {
  ownerId: number;
  isFieldWorker?: boolean;
};

type InventoryTabKey = 'primary' | 'requested';
type ItemInventoryView = 'list' | 'detail' | 'issued' | 'used';

type InventoryTab = {
  key: InventoryTabKey;
  label: string;
};

type FetchItemPageOptions = {
  nextPage: number;
  replace: boolean;
  refreshing?: boolean;
  searchParam?: string;
};

const PAGE_START = 1;
const ITEM_SEARCH_LIMIT = 25;
const THEME_PRIMARY = '#c3002f';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isItemRecord = (value: unknown): value is ItemInventoryListItem => {
  if (!isRecord(value) || Array.isArray(value)) {
    return false;
  }

  return [
    'id',
    'Id',
    'itemId',
    'ItemId',
    'name',
    'Name',
    'itemName',
    'ItemName',
  ].some(key => value[key] !== undefined && value[key] !== null);
};

const isAssignedItemRecord = (value: unknown): value is AssignedItemListItem =>
  isRecord(value) && !Array.isArray(value);

const isUsedItemRecord = (value: unknown): value is UsedItemListItem =>
  isRecord(value) && !Array.isArray(value);

const getItemResultData = (
  response: ItemInventoryListResponse,
): ItemInventoryListItem[] => {
  const payload = response.resultData ?? response.ResultData;

  if (Array.isArray(payload)) {
    return payload.filter(isItemRecord);
  }

  if (isItemRecord(payload)) {
    return [payload];
  }

  if (isItemRecord(response)) {
    return [response];
  }

  return [];
};

const getAssignedResultData = (
  response: AssignedItemListResponse,
): AssignedItemListItem[] => {
  const payload = response.resultData ?? response.ResultData;

  if (Array.isArray(payload)) {
    return payload.filter(isAssignedItemRecord);
  }

  if (isAssignedItemRecord(payload)) {
    return [payload];
  }

  if (isAssignedItemRecord(response)) {
    return [response];
  }

  return [];
};

const getUsedResultData = (
  response: UsedItemListResponse,
): UsedItemListItem[] => {
  const payload = response.resultData ?? response.ResultData;

  if (Array.isArray(payload)) {
    return payload.filter(isUsedItemRecord);
  }

  if (isUsedItemRecord(payload)) {
    return [payload];
  }

  if (isUsedItemRecord(response)) {
    return [response];
  }

  return [];
};

const getItemCode = (response: ItemInventoryListResponse) =>
  String(response.code ?? response.Code ?? '');

const getItemMessage = (response: ItemInventoryListResponse) =>
  String(response.message ?? response.Message ?? '').trim();

const getAssignedCode = (response: AssignedItemListResponse) =>
  String(response.code ?? response.Code ?? '');

const getAssignedMessage = (response: AssignedItemListResponse) =>
  String(response.message ?? response.Message ?? '').trim();

const getUsedCode = (response: UsedItemListResponse) =>
  String(response.code ?? response.Code ?? '');

const getUsedMessage = (response: UsedItemListResponse) =>
  String(response.message ?? response.Message ?? '').trim();

const getItemString = (
  item: ItemInventoryListItem,
  camelKey: keyof ItemInventoryListItem,
  pascalKey: keyof ItemInventoryListItem,
) => {
  const value = item[camelKey] ?? item[pascalKey];
  return typeof value === 'string' ? value.trim() : '';
};

const getItemStringFromKeys = (
  item: ItemInventoryListItem,
  keys: Array<keyof ItemInventoryListItem>,
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

const getAssignedString = (
  item: AssignedItemListItem,
  keys: Array<keyof AssignedItemListItem>,
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

const getUsedString = (
  item: UsedItemListItem,
  keys: Array<keyof UsedItemListItem>,
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

const getItemNumber = (
  item: ItemInventoryListItem,
  keys: Array<keyof ItemInventoryListItem>,
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

const getAssignedNumber = (
  item: AssignedItemListItem,
  keys: Array<keyof AssignedItemListItem>,
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

const getUsedNumber = (
  item: UsedItemListItem,
  keys: Array<keyof UsedItemListItem>,
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

const getItemId = (item: ItemInventoryListItem) =>
  getItemNumber(item, ['id', 'Id', 'itemId', 'ItemId']);

const getItemName = (item: ItemInventoryListItem) =>
  getItemString(item, 'name', 'Name') ||
  getItemString(item, 'itemName', 'ItemName') ||
  `Item #${getItemId(item) || '-'}`;

const getItemDescription = (item: ItemInventoryListItem) =>
  getItemString(item, 'description', 'Description') ||
  getItemString(item, 'note', 'Note') ||
  'No description';

const getItemUnit = (item: ItemInventoryListItem) =>
  getItemString(item, 'unitName', 'UnitName') ||
  getItemString(item, 'itemUnitName', 'ItemUnitName') ||
  getItemString(item, 'itemUnitTypeName', 'ItemUnitTypeName') ||
  getItemString(item, 'itemUnit', 'ItemUnit') ||
  getItemString(item, 'unit', 'Unit') ||
  'piece';

const getAvailableQuantity = (item: ItemInventoryListItem) =>
  getItemNumber(item, [
    'unAssignedQuantity',
    'UnAssignedQuantity',
    'availableQuantity',
    'AvailableQuantity',
    'availableQty',
    'AvailableQty',
    'quantity',
    'Quantity',
  ]);

const getIssuedQuantity = (item: ItemInventoryListItem) =>
  getItemNumber(item, [
    'issuedQuantity',
    'IssuedQuantity',
    'issuedQty',
    'IssuedQty',
    'assignedQuantity',
    'AssignedQuantity',
  ]);

const getUsedQuantity = (item: ItemInventoryListItem) =>
  getItemNumber(item, ['usedQuantity', 'UsedQuantity', 'usedQty', 'UsedQty']) ||
  Number(
    item.usedItemDetailsDtoObj?.usedQty ??
      item.usedItemDetailsDtoObj?.UsedQty ??
      item.UsedItemDetailsDtoObj?.usedQty ??
      item.UsedItemDetailsDtoObj?.UsedQty ??
      0,
  ) ||
  0;

const getImageUri = (item: ItemInventoryListItem) =>
  getItemString(item, 'itemImagePath', 'ItemImagePath') ||
  getItemString(item, 'imageUrl', 'ImageUrl') ||
  getItemString(item, 'itemImageUrl', 'ItemImageUrl') ||
  getItemString(item, 'itemImage', 'ItemImage') ||
  getItemString(item, 'image', 'Image');

const getSafeImageUri = (item: ItemInventoryListItem) => {
  const imageUri = getImageUri(item);
  if (
    imageUri &&
    /^(https?:\/\/|file:\/\/|content:\/\/|data:image\/)/i.test(imageUri)
  ) {
    return imageUri;
  }

  return '';
};

const getItemCodeValue = (item: ItemInventoryListItem) =>
  getItemString(item, 'serialNumber', 'SerialNumber') ||
  getItemStringFromKeys(item, ['itemId', 'ItemId']) ||
  'NA';

const getItemHsnCode = (item: ItemInventoryListItem) =>
  getItemString(item, 'hsnCode', 'HSNCode') || 'NA';

const getItemGroupName = (item: ItemInventoryListItem) =>
  getItemString(item, 'itemGroupName', 'ItemGroupName') || 'NA';

const getPurchasePrice = (item: ItemInventoryListItem) =>
  getItemNumber(item, ['purchasePrice', 'PurchasePrice']);

const getSalesPrice = (item: ItemInventoryListItem) =>
  getItemNumber(item, ['salesPrice', 'SalesPrice']);

const formatCurrency = (value: number) => `Rs. ${value}`;

const getAssignedTaskId = (item: AssignedItemListItem) =>
  getAssignedString(item, ['newTaskID', 'NewTaskID', 'taskId', 'TaskId']) ||
  '-';

const getAssignedQuantity = (item: AssignedItemListItem) =>
  getAssignedNumber(item, [
    'quantity',
    'Quantity',
    'issuedQuantity',
    'IssuedQuantity',
    'assignedQuantity',
    'AssignedQuantity',
  ]);

const getUsedItemName = (item: UsedItemListItem) =>
  getUsedString(item, ['itemName', 'ItemName', 'name', 'Name']);

const getUsedDetailQuantity = (item: UsedItemListItem) =>
  getUsedNumber(item, [
    'usedQty',
    'UsedQty',
    'usedQuantity',
    'UsedQuantity',
    'quantity',
    'Quantity',
  ]);

const getUsedTaskId = (item: UsedItemListItem) =>
  getUsedString(item, ['newTaskID', 'NewTaskID', 'taskId', 'TaskId']) || '-';

const getAssignedFieldWorkerName = (item: AssignedItemListItem) => {
  const fullName = `${getAssignedString(item, ['firstName', 'FirstName'])} ${getAssignedString(
    item,
    ['lastName', 'LastName'],
  )}`.trim();

  return (
    getAssignedString(item, [
      'fieldWorkerName',
      'FieldWorkerName',
      'employeeName',
      'EmployeeName',
      'userName',
      'UserName',
      'name',
      'Name',
    ]) ||
    fullName ||
    'Fieldworker'
  );
};

const getUsedFieldWorkerName = (item: UsedItemListItem) => {
  const fullName = `${getUsedString(item, ['firstName', 'FirstName'])} ${getUsedString(
    item,
    ['lastName', 'LastName'],
  )}`.trim();

  return (
    getUsedString(item, [
      'fieldWorkerName',
      'FieldWorkerName',
      'employeeName',
      'EmployeeName',
      'userName',
      'UserName',
      'name',
      'Name',
    ]) ||
    fullName ||
    'Fieldworker'
  );
};

const formatItemDate = (item: ItemInventoryListItem) => {
  const displayDate = getItemString(item, 'updatedBy', 'UpdatedBy');
  if (displayDate && !displayDate.includes('0001-01-01')) {
    return displayDate;
  }

  const rawDate = getItemString(item, 'createdDate', 'CreatedDate');
  const parsedDate = new Date(rawDate);
  if (!rawDate || Number.isNaN(parsedDate.getTime())) {
    return rawDate || 'NA';
  }

  return parsedDate.toLocaleDateString('en-GB');
};

const isItemSuccessOrNoData = (response: ItemInventoryListResponse) => {
  const code = getItemCode(response);
  return code === '200' || code === '500' || code === '';
};

const isAssignedSuccessOrNoData = (response: AssignedItemListResponse) => {
  const code = getAssignedCode(response);
  return code === '200' || code === '500' || code === '';
};

const isUsedSuccessOrNoData = (response: UsedItemListResponse) => {
  const code = getUsedCode(response);
  return code === '200' || code === '500' || code === '';
};

const EditIcon = ({color = THEME_PRIMARY}: {color?: string}) => (
  <View style={styles.iconFrame}>
    <View style={[styles.editBox, {borderColor: color}]} />
    <View style={[styles.editPencil, {backgroundColor: color}]} />
    <View style={[styles.editPencilTip, {borderLeftColor: color}]} />
  </View>
);

const ItemOptionIcon = ({color = THEME_PRIMARY}: {color?: string}) => (
  <View style={styles.iconFrame}>
    <View style={[styles.optionBox, {borderColor: color}]} />
    <View style={[styles.optionLid, {backgroundColor: color}]} />
    <View style={[styles.optionCheckStem, {backgroundColor: color}]} />
    <View style={[styles.optionCheckArm, {backgroundColor: color}]} />
  </View>
);

const DeleteIcon = ({color = THEME_PRIMARY}: {color?: string}) => (
  <View style={styles.iconFrame}>
    <View style={[styles.deleteLid, {backgroundColor: color}]} />
    <View style={[styles.deleteBin, {borderColor: color}]}>
      <View style={[styles.deleteLine, {backgroundColor: color}]} />
      <View style={[styles.deleteLine, {backgroundColor: color}]} />
    </View>
  </View>
);

const DefaultItemIcon = ({color = THEME_PRIMARY}: {color?: string}) => (
  <View style={styles.defaultItemIcon}>
    <View style={[styles.defaultItemBoxTop, {backgroundColor: color}]} />
    <View style={[styles.defaultItemBoxFace, {borderColor: color}]} />
    <View style={[styles.defaultItemBoxSide, {backgroundColor: color}]} />
  </View>
);

const ItemInventoryTabHostScreen = ({
  ownerId,
  isFieldWorker = false,
}: ItemInventoryTabHostScreenProps) => {
  const [activeTab, setActiveTab] = useState<InventoryTabKey>('primary');
  const [items, setItems] = useState<ItemInventoryListItem[]>([]);
  const [itemSearchText, setItemSearchText] = useState('');
  const [submittedItemSearch, setSubmittedItemSearch] = useState('');
  const [itemPageIndex, setItemPageIndex] = useState(PAGE_START);
  const [isItemInitialLoading, setIsItemInitialLoading] = useState(false);
  const [isItemRefreshing, setIsItemRefreshing] = useState(false);
  const [isItemLoadingMore, setIsItemLoadingMore] = useState(false);
  const [isItemLastPage, setIsItemLastPage] = useState(false);
  const [itemErrorMessage, setItemErrorMessage] = useState('');
  const [inventoryView, setInventoryView] = useState<ItemInventoryView>('list');
  const [selectedItem, setSelectedItem] = useState<ItemInventoryListItem | null>(
    null,
  );
  const [isItemDetailLoading, setIsItemDetailLoading] = useState(false);
  const [itemDetailErrorMessage, setItemDetailErrorMessage] = useState('');
  const [assignedItems, setAssignedItems] = useState<AssignedItemListItem[]>([]);
  const [assignedSearchText, setAssignedSearchText] = useState('');
  const [isAssignedLoading, setIsAssignedLoading] = useState(false);
  const [assignedErrorMessage, setAssignedErrorMessage] = useState('');
  const [usedItems, setUsedItems] = useState<UsedItemListItem[]>([]);
  const [usedSearchText, setUsedSearchText] = useState('');
  const [isUsedLoading, setIsUsedLoading] = useState(false);
  const [usedErrorMessage, setUsedErrorMessage] = useState('');
  const latestItemRequestId = useRef(0);
  const latestItemDetailRequestId = useRef(0);
  const latestAssignedRequestId = useRef(0);
  const latestUsedRequestId = useRef(0);

  const closeItemDetail = useCallback(() => {
    latestItemDetailRequestId.current += 1;
    latestAssignedRequestId.current += 1;
    latestUsedRequestId.current += 1;
    setSelectedItem(null);
    setInventoryView('list');
    setItemDetailErrorMessage('');
    setIsItemDetailLoading(false);
    setAssignedItems([]);
    setAssignedSearchText('');
    setAssignedErrorMessage('');
    setIsAssignedLoading(false);
    setUsedItems([]);
    setUsedSearchText('');
    setUsedErrorMessage('');
    setIsUsedLoading(false);
  }, []);

  const closeIssuedDetails = useCallback(() => {
    latestAssignedRequestId.current += 1;
    setInventoryView('detail');
    setAssignedSearchText('');
    setAssignedErrorMessage('');
    setIsAssignedLoading(false);
  }, []);

  const closeUsedDetails = useCallback(() => {
    latestUsedRequestId.current += 1;
    setInventoryView('detail');
    setUsedSearchText('');
    setUsedErrorMessage('');
    setIsUsedLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedItem || inventoryView === 'list') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (inventoryView === 'issued') {
        closeIssuedDetails();
      } else if (inventoryView === 'used') {
        closeUsedDetails();
      } else {
        closeItemDetail();
      }
      return true;
    });

    return () => subscription.remove();
  }, [
    closeIssuedDetails,
    closeItemDetail,
    closeUsedDetails,
    inventoryView,
    selectedItem,
  ]);

  const tabs = useMemo<InventoryTab[]>(
    () => [
      {
        key: 'primary',
        label: isFieldWorker ? 'Issued Items' : 'Item List',
      },
      {
        key: 'requested',
        label: 'Requested Items',
      },
    ],
    [isFieldWorker],
  );

  const fetchItemPage = useCallback(
    async ({
      nextPage,
      replace,
      refreshing = false,
      searchParam = submittedItemSearch,
    }: FetchItemPageOptions) => {
      if (replace && !refreshing) {
        setIsItemInitialLoading(true);
      } else if (refreshing) {
        setIsItemRefreshing(true);
      } else {
        setIsItemLoadingMore(true);
      }

      setItemErrorMessage('');
      const requestId = latestItemRequestId.current + 1;
      latestItemRequestId.current = requestId;

      try {
        const response = (await getAllLargeItemList({
          OwnerId: ownerId,
          SearchParam: searchParam,
          pageIndex: nextPage,
        })) as ItemInventoryListResponse;

        if (requestId !== latestItemRequestId.current) {
          return;
        }

        if (!isItemSuccessOrNoData(response)) {
          throw new Error(getItemMessage(response) || 'Unable to load item list.');
        }

        const nextItems = getItemResultData(response);
        setItems(previous => (replace ? nextItems : [...previous, ...nextItems]));
        setItemPageIndex(nextPage);
        setIsItemLastPage(nextItems.length === 0);
      } catch (error) {
        if (requestId !== latestItemRequestId.current) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load item list right now.';
        setItemErrorMessage(message);
        if (replace) {
          setItems([]);
          setIsItemLastPage(true);
        }
      } finally {
        if (requestId === latestItemRequestId.current) {
          setIsItemInitialLoading(false);
          setIsItemRefreshing(false);
          setIsItemLoadingMore(false);
        }
      }
    },
    [ownerId, submittedItemSearch],
  );

  const loadFirstItemPage = useCallback(
    (refreshing = false, searchParam = submittedItemSearch) => {
      fetchItemPage({
        nextPage: PAGE_START,
        replace: true,
        refreshing,
        searchParam,
      });
    },
    [fetchItemPage, submittedItemSearch],
  );

  useEffect(() => {
    if (activeTab === 'primary' && !isFieldWorker) {
      loadFirstItemPage();
    }
  }, [activeTab, isFieldWorker, loadFirstItemPage]);

  const submitItemSearch = () => {
    setSubmittedItemSearch(itemSearchText.trim());
  };

  const clearItemSearch = () => {
    setItemSearchText('');
    if (submittedItemSearch) {
      setSubmittedItemSearch('');
    }
  };

  const handleItemActionPress = (label: string, item: ItemInventoryListItem) => {
    Alert.alert(
      label,
      `${getItemName(item)}\nItem ID: ${getItemId(item) || '-'}`,
    );
  };

  const handleItemPress = (item: ItemInventoryListItem) => {
    latestItemDetailRequestId.current += 1;
    setSelectedItem(item);
    setInventoryView('detail');
    setItemDetailErrorMessage('');
    setIsItemDetailLoading(false);
  };

  const handleIssuedDetailsPress = async () => {
    if (!selectedItem) {
      return;
    }

    const itemId = getItemId(selectedItem);
    setInventoryView('issued');
    setAssignedItems([]);
    setAssignedSearchText('');
    setAssignedErrorMessage('');

    if (!itemId) {
      setAssignedErrorMessage('Unable to load issued details without item id.');
      return;
    }

    setIsAssignedLoading(true);
    const requestId = latestAssignedRequestId.current + 1;
    latestAssignedRequestId.current = requestId;

    try {
      const response = (await getAllAssignItemlistTechwise({
        itemId,
        OwnerId: ownerId,
      })) as AssignedItemListResponse;

      if (requestId !== latestAssignedRequestId.current) {
        return;
      }

      if (!isAssignedSuccessOrNoData(response)) {
        throw new Error(
          getAssignedMessage(response) || 'Unable to load issued details.',
        );
      }

      setAssignedItems(getAssignedResultData(response));
    } catch (error) {
      if (requestId !== latestAssignedRequestId.current) {
        return;
      }

      setAssignedErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load issued details right now.',
      );
    } finally {
      if (requestId === latestAssignedRequestId.current) {
        setIsAssignedLoading(false);
      }
    }
  };

  const handleUsedDetailsPress = async () => {
    if (!selectedItem) {
      return;
    }

    const itemId = getItemId(selectedItem);
    setInventoryView('used');
    setUsedItems([]);
    setUsedSearchText('');
    setUsedErrorMessage('');

    if (!itemId) {
      setUsedErrorMessage('Unable to load used details without item id.');
      return;
    }

    setIsUsedLoading(true);
    const requestId = latestUsedRequestId.current + 1;
    latestUsedRequestId.current = requestId;

    try {
      const response = (await getUsedItemlist({
        itemId,
        OwnerId: ownerId,
      })) as UsedItemListResponse;

      if (requestId !== latestUsedRequestId.current) {
        return;
      }

      if (!isUsedSuccessOrNoData(response)) {
        throw new Error(getUsedMessage(response) || 'Unable to load used details.');
      }

      setUsedItems(getUsedResultData(response));
    } catch (error) {
      if (requestId !== latestUsedRequestId.current) {
        return;
      }

      setUsedErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load used details right now.',
      );
    } finally {
      if (requestId === latestUsedRequestId.current) {
        setIsUsedLoading(false);
      }
    }
  };

  const renderItemInventoryRow = ({item}: {item: ItemInventoryListItem}) => {
    const itemId = getItemId(item);
    const imageUri = getSafeImageUri(item);
    const itemName = getItemName(item);

    return (
      <TouchableOpacity
        activeOpacity={0.78}
        style={styles.itemCard}
        onPress={() => handleItemPress(item)}>
        <View style={styles.unitBadge}>
          <Text numberOfLines={1} style={styles.unitText}>
            {getItemUnit(item)}
          </Text>
        </View>

        <View style={styles.itemImageWrap}>
          {imageUri ? (
            <Image source={{uri: imageUri}} style={styles.itemImage} />
          ) : (
            <DefaultItemIcon />
          )}
        </View>

        <View style={styles.itemBody}>
          <View style={styles.itemTitleRow}>
            <Text numberOfLines={1} style={styles.itemName}>
              {itemName}
            </Text>
            <Text numberOfLines={1} style={styles.itemIdText}>
              [{itemId || '-'}]
            </Text>
          </View>

          <Text numberOfLines={1} style={styles.itemDescription}>
            {getItemDescription(item)}
          </Text>

          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Available:</Text>
            <Text style={styles.quantityValue}>{getAvailableQuantity(item)}</Text>
            <Text style={styles.quantityLabel}>Issued:</Text>
            <Text style={styles.quantityValue}>{getIssuedQuantity(item)}</Text>
            <Text style={styles.quantityLabel}>Used:</Text>
            <Text style={styles.quantityValue}>{getUsedQuantity(item)}</Text>
          </View>
        </View>

        <View style={styles.actionColumn}>
          <Pressable
            hitSlop={10}
            style={styles.actionButton}
            onPress={() => handleItemActionPress('Update item', item)}>
            <EditIcon />
          </Pressable>
          <Pressable
            hitSlop={10}
            style={styles.actionButton}
            onPress={() => handleItemActionPress('Item options', item)}>
            <ItemOptionIcon />
          </Pressable>
          <Pressable
            hitSlop={10}
            style={styles.actionButton}
            onPress={() => handleItemActionPress('Delete item', item)}>
            <DeleteIcon />
          </Pressable>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItemListTab = () => (
    <View style={styles.card}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>Search</Text>
          <TextInput
            value={itemSearchText}
            onChangeText={value => {
              const nextValue = value.slice(0, ITEM_SEARCH_LIMIT);
              setItemSearchText(nextValue);
              if (!nextValue.trim() && submittedItemSearch) {
                setSubmittedItemSearch('');
              }
            }}
            onSubmitEditing={submitItemSearch}
            placeholder="Search by item name..."
            placeholderTextColor="#8C8C8C"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {itemSearchText ? (
            <Pressable hitSlop={10} onPress={clearItemSearch}>
              <Text style={styles.clearText}>x</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {isItemInitialLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={THEME_PRIMARY} />
          <Text style={styles.loadingText}>Loading items...</Text>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item, index) => `${getItemId(item) || index}-${index}`}
        renderItem={renderItemInventoryRow}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isItemRefreshing}
            colors={[THEME_PRIMARY]}
            tintColor={THEME_PRIMARY}
            onRefresh={() => loadFirstItemPage(true)}
          />
        }
        ListEmptyComponent={
          isItemInitialLoading ? null : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {itemErrorMessage ? 'Unable to Load Items' : 'No Result Found'}
              </Text>
              <Text style={styles.emptyText}>
                {itemErrorMessage ||
                  'Try another search term or refresh the item list.'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isItemLoadingMore ? (
            <View style={styles.listFooter}>
              <ActivityIndicator color={THEME_PRIMARY} size="small" />
            </View>
          ) : null
        }
        onEndReachedThreshold={0.35}
        onEndReached={() => {
          if (!isItemInitialLoading && !isItemLoadingMore && !isItemLastPage) {
            fetchItemPage({nextPage: itemPageIndex + 1, replace: false});
          }
        }}
      />
    </View>
  );

  const renderDetailRow = (
    label: string,
    value: string | number,
    valueStyle?: object,
  ) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
    </View>
  );

  const renderItemDetail = () => {
    if (!selectedItem) {
      return null;
    }

    const selectedItemName = getItemName(selectedItem);
    const selectedItemId = getItemId(selectedItem);
    const imageUri = getSafeImageUri(selectedItem);
    const purchasePrice = getPurchasePrice(selectedItem);
    const salesPrice = getSalesPrice(selectedItem);
    const availableQuantity = getAvailableQuantity(selectedItem);
    const issuedQuantity = getIssuedQuantity(selectedItem);
    const usedQuantity = getUsedQuantity(selectedItem);

    return (
      <View style={styles.detailCard}>
        <View style={styles.detailContent}>
          <Pressable style={styles.detailBackButton} onPress={closeItemDetail}>
            <Text style={styles.detailBackText}>{'< Back'}</Text>
          </Pressable>

          <View style={styles.detailImageWrap}>
            {imageUri ? (
              <Image source={{uri: imageUri}} style={styles.detailImage} />
            ) : (
              <View style={styles.noImageBox}>
                <DefaultItemIcon color="#B8B8B8" />
              </View>
            )}
          </View>

          <View style={styles.detailActionRow}>
            <Pressable
              style={[styles.detailPill, styles.detailPillDark]}
              onPress={handleIssuedDetailsPress}>
              <DefaultItemIcon color="#FFFFFF" />
              <Text style={styles.detailPillText}>Issued details</Text>
            </Pressable>
            <Pressable
              style={[styles.detailPill, styles.detailPillPrimary]}
              onPress={handleUsedDetailsPress}>
              <ItemOptionIcon color="#FFFFFF" />
              <Text style={styles.detailPillText}>Used details</Text>
            </Pressable>
          </View>

          {isItemDetailLoading ? (
            <View style={styles.detailStatusRow}>
              <ActivityIndicator color={THEME_PRIMARY} size="small" />
              <Text style={styles.detailStatusText}>Refreshing item details...</Text>
            </View>
          ) : null}

          {itemDetailErrorMessage ? (
            <Text style={styles.detailErrorText}>{itemDetailErrorMessage}</Text>
          ) : null}

          <View style={styles.detailTitleRow}>
            <Text numberOfLines={2} style={styles.detailTitle}>
              {selectedItemName}
            </Text>
            <Text style={styles.detailId}>[{selectedItemId || '-'}]</Text>
          </View>

          <Text style={styles.detailSectionTitle}>Item Details</Text>
          {renderDetailRow('Create Date', formatItemDate(selectedItem))}
          {renderDetailRow('Item Code', getItemCodeValue(selectedItem))}
          {renderDetailRow('HSN Code', getItemHsnCode(selectedItem))}
          {renderDetailRow('Group Name', getItemGroupName(selectedItem))}
          {renderDetailRow(
            'Purchase Price',
            formatCurrency(purchasePrice),
            styles.priceGreen,
          )}
          {renderDetailRow(
            'Sales Price',
            formatCurrency(salesPrice),
            styles.priceGreen,
          )}
          {renderDetailRow('Unit', getItemUnit(selectedItem))}
          {renderDetailRow('Description', getItemDescription(selectedItem))}

          <Text style={styles.detailSectionTitle}>QTY. Details</Text>
          {renderDetailRow('Available', availableQuantity)}
          {renderDetailRow('Issued', issuedQuantity)}
          {renderDetailRow('Used', usedQuantity)}
          {renderDetailRow(
            'Available Qty. Price',
            formatCurrency(availableQuantity * purchasePrice),
            styles.priceBlue,
          )}
          {renderDetailRow(
            'Issued Qty. Price',
            formatCurrency(issuedQuantity * purchasePrice),
            styles.priceOrange,
          )}
          {renderDetailRow(
            'Used Qty. Price',
            formatCurrency(usedQuantity * purchasePrice),
            styles.pricePrimary,
          )}
        </View>
      </View>
    );
  };

  const renderAssignedItemRow = ({item}: {item: AssignedItemListItem}) => (
    <View style={styles.assignedCard}>
      <View style={styles.assignedCardTopRow}>
        <Text style={styles.assignedLabel}>Task ID :</Text>
        <Text numberOfLines={1} style={styles.assignedTaskValue}>
          {getAssignedTaskId(item)}
        </Text>
        <Text style={styles.assignedLabel}>Issued Qty :</Text>
        <Text numberOfLines={1} style={styles.assignedQtyValue}>
          {getAssignedQuantity(item)}
        </Text>
        <Pressable
          hitSlop={10}
          style={styles.assignedReturnButton}
          onPress={() => Alert.alert('Return item', 'Return item is not migrated yet.')}>
          <Text style={styles.assignedReturnText}>R</Text>
        </Pressable>
      </View>
      <Text numberOfLines={1} style={styles.assignedWorkerName}>
        {getAssignedFieldWorkerName(item)}
      </Text>
    </View>
  );

  const renderUsedItemRow = ({item}: {item: UsedItemListItem}) => (
    <View style={styles.assignedCard}>
      <View style={styles.assignedCardTopRow}>
        <Text style={styles.assignedLabel}>Task ID :</Text>
        <Text numberOfLines={1} style={styles.assignedTaskValue}>
          {getUsedTaskId(item)}
        </Text>
        <Text style={styles.assignedLabel}>Used Qty :</Text>
        <Text numberOfLines={1} style={styles.assignedQtyValue}>
          {getUsedDetailQuantity(item)}
        </Text>
      </View>
      <Text numberOfLines={1} style={styles.assignedWorkerName}>
        {getUsedFieldWorkerName(item)}
      </Text>
    </View>
  );

  const renderIssuedDetails = () => {
    if (!selectedItem) {
      return null;
    }

    const purchasePrice = getPurchasePrice(selectedItem);
    const normalizedSearch = assignedSearchText.trim().toLowerCase();
    const filteredAssignedItems = normalizedSearch
      ? assignedItems.filter(item =>
          getAssignedFieldWorkerName(item).toLowerCase().includes(normalizedSearch),
        )
      : assignedItems;
    const totalIssuedQuantity = assignedItems.reduce(
      (sum, item) => sum + getAssignedQuantity(item),
      0,
    );
    const totalIssuedPrice =
      purchasePrice > 0 ? String(totalIssuedQuantity * purchasePrice) : '-NA-';

    return (
      <View style={styles.issuedCard}>
        <View style={styles.issuedHeaderRow}>
          <Text numberOfLines={1} style={styles.issuedItemName}>
            {getItemName(selectedItem)}
          </Text>
          <Text style={styles.issuedTotalLabel}>Total Issued Qty:</Text>
          <Text style={styles.issuedTotalValue}>{totalIssuedQuantity}</Text>
        </View>

        <Text style={styles.issuedPriceText}>
          Total Issued Item Price : {totalIssuedPrice}
        </Text>

        <View style={styles.issuedSearchRow}>
          <Text style={styles.issuedSearchIcon}>Search</Text>
          <TextInput
            value={assignedSearchText}
            onChangeText={setAssignedSearchText}
            placeholder="Search by Fieldworker name..."
            placeholderTextColor="#8C8C8C"
            style={styles.issuedSearchInput}
          />
          {assignedSearchText ? (
            <Pressable hitSlop={10} onPress={() => setAssignedSearchText('')}>
              <Text style={styles.issuedSearchClear}>x</Text>
            </Pressable>
          ) : null}
        </View>

        {isAssignedLoading ? (
          <View style={styles.issuedStatusBlock}>
            <ActivityIndicator color={THEME_PRIMARY} />
            <Text style={styles.issuedStatusText}>Loading issued details...</Text>
          </View>
        ) : null}

        {assignedErrorMessage ? (
          <Text style={styles.issuedErrorText}>{assignedErrorMessage}</Text>
        ) : null}

        <FlatList
          data={filteredAssignedItems}
          keyExtractor={(item, index) =>
            `${getAssignedTaskId(item)}-${getAssignedQuantity(item)}-${index}`
          }
          renderItem={renderAssignedItemRow}
          contentContainerStyle={styles.assignedListContent}
          ListEmptyComponent={
            isAssignedLoading ? null : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>
                  {assignedErrorMessage ? 'Unable to Load Issued Items' : 'No Result Found'}
                </Text>
                <Text style={styles.emptyText}>
                  {assignedErrorMessage ||
                    'Try another search term or go back to item details.'}
                </Text>
              </View>
            )
          }
        />
      </View>
    );
  };

  const renderUsedDetails = () => {
    if (!selectedItem) {
      return null;
    }

    const purchasePrice = getPurchasePrice(selectedItem);
    const normalizedSearch = usedSearchText.trim().toLowerCase();
    const filteredUsedItems = normalizedSearch
      ? usedItems.filter(item =>
          getUsedFieldWorkerName(item).toLowerCase().includes(normalizedSearch),
        )
      : usedItems;
    const totalUsedQuantity = usedItems.reduce(
      (sum, item) => sum + getUsedDetailQuantity(item),
      0,
    );
    const responseItemName = usedItems.map(getUsedItemName).find(Boolean);
    const totalUsedPrice =
      purchasePrice > 0 ? String(totalUsedQuantity * purchasePrice) : '-NA-';

    return (
      <View style={styles.issuedCard}>
        <View style={styles.issuedHeaderRow}>
          <Text numberOfLines={1} style={styles.issuedItemName}>
            {responseItemName || getItemName(selectedItem)}
          </Text>
          <Text style={styles.issuedTotalLabel}>Total Used Qty:</Text>
          <Text style={styles.issuedTotalValue}>{totalUsedQuantity}</Text>
        </View>

        <Text style={styles.issuedPriceText}>
          Total Used Item Price : {totalUsedPrice}
        </Text>

        <View style={styles.issuedSearchRow}>
          <Text style={styles.issuedSearchIcon}>Search</Text>
          <TextInput
            value={usedSearchText}
            onChangeText={setUsedSearchText}
            placeholder="Search by Fieldworker name..."
            placeholderTextColor="#8C8C8C"
            style={styles.issuedSearchInput}
          />
          {usedSearchText ? (
            <Pressable hitSlop={10} onPress={() => setUsedSearchText('')}>
              <Text style={styles.issuedSearchClear}>x</Text>
            </Pressable>
          ) : null}
        </View>

        {isUsedLoading ? (
          <View style={styles.issuedStatusBlock}>
            <ActivityIndicator color={THEME_PRIMARY} />
            <Text style={styles.issuedStatusText}>Loading used details...</Text>
          </View>
        ) : null}

        {usedErrorMessage ? (
          <Text style={styles.issuedErrorText}>{usedErrorMessage}</Text>
        ) : null}

        <FlatList
          data={filteredUsedItems}
          keyExtractor={(item, index) =>
            `${getUsedTaskId(item)}-${getUsedDetailQuantity(item)}-${index}`
          }
          renderItem={renderUsedItemRow}
          contentContainerStyle={styles.assignedListContent}
          ListEmptyComponent={
            isUsedLoading ? null : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>
                  {usedErrorMessage ? 'Unable to Load Used Items' : 'No Result Found'}
                </Text>
                <Text style={styles.emptyText}>
                  {usedErrorMessage ||
                    'Try another search term or go back to item details.'}
                </Text>
              </View>
            )
          }
        />
      </View>
    );
  };

  const renderPlaceholderTab = () => (
    <View style={styles.card}>
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No Issued Items</Text>
        <Text style={styles.emptyText}>
          TechItemsInventoryFragmentNew is not migrated yet.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.shell}>
      {selectedItem && inventoryView === 'issued' ? (
        renderIssuedDetails()
      ) : selectedItem && inventoryView === 'used' ? (
        renderUsedDetails()
      ) : selectedItem && inventoryView === 'detail' ? (
        renderItemDetail()
      ) : (
        <>
          <View style={styles.tabBar}>
            {tabs.map(tab => {
              const selected = tab.key === activeTab;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[
                    styles.tabButton,
                    selected ? styles.tabButtonActive : null,
                  ]}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.tabText,
                      selected ? styles.tabTextActive : null,
                    ]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {activeTab === 'requested'
            ? <FOCScreen ownerId={ownerId} isFieldWorker={isFieldWorker} />
            : isFieldWorker
              ? renderPlaceholderTab()
              : renderItemListTab()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabBar: {
    height: 50,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: 'transparent',
    paddingHorizontal: 8,
  },
  tabButtonActive: {
    borderBottomColor: THEME_PRIMARY,
    backgroundColor: 'rgba(195,0,47,0.06)',
  },
  tabText: {
    color: '#555555',
    fontSize: 14,
    fontWeight: '700',
  },
  tabTextActive: {
    color: THEME_PRIMARY,
  },
  card: {
    flex: 1,
    marginTop: 8,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: -2},
    overflow: 'hidden',
  },
  detailCard: {
    flex: 1,
    marginTop: 45,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#FFFFFF',
    paddingBottom: 100,
  },
  detailTopBar: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  detailContent: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 12,
    paddingBottom: 20,
  },
  detailBackButton: {
    alignSelf: 'flex-start',
    minHeight: 32,
    justifyContent: 'center',
    marginBottom: 8,
  },
  detailBackText: {
    color: THEME_PRIMARY,
    fontSize: 14,
    fontWeight: '800',
  },
  detailTopTitle: {
    flex: 1,
    color: '#111111',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  detailTopSpacer: {
    width: 82,
  },
  detailImageWrap: {
    alignItems: 'center',
  },
  detailImage: {
    width: 150,
    height: 150,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    resizeMode: 'contain',
    backgroundColor: '#F2F4F7',
  },
  noImageBox: {
    width: 150,
    height: 150,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  noImageText: {
    marginTop: 8,
    color: '#B8B8B8',
    fontSize: 13,
    fontWeight: '700',
  },
  detailActionRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailPill: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 2},
  },
  detailPillDark: {
    backgroundColor: '#303530',
    marginRight: 9,
  },
  detailPillPrimary: {
    backgroundColor: THEME_PRIMARY,
    marginLeft: 9,
  },
  detailPillText: {
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  detailStatusRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailStatusText: {
    marginLeft: 8,
    color: '#4B5563',
    fontSize: 13,
  },
  detailErrorText: {
    marginTop: 14,
    color: '#B42318',
    fontSize: 13,
    fontWeight: '700',
  },
  detailTitleRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  detailTitle: {
    flex: 1,
    color: '#111111',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },
  detailId: {
    color: '#1976D2',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '900',
  },
  detailSectionTitle: {
    marginTop: 20,
    marginBottom: 15,
    color: '#111111',
    fontSize: 16,
    fontWeight: '900',
  },
  detailRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  detailLabel: {
    flex: 1,
    marginRight: 18,
    color: '#111111',
    fontSize: 16,
    lineHeight: 22,
  },
  detailValue: {
    flex: 1,
    color: '#111111',
    fontSize: 16,
    lineHeight: 22,
  },
  priceGreen: {
    color: '#00C96A',
  },
  priceBlue: {
    color: '#2467CF',
  },
  priceOrange: {
    color: '#FFB21A',
  },
  pricePrimary: {
    color: THEME_PRIMARY,
  },
  issuedCard: {
    flex: 1,
    marginTop: 45,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 104,
  },
  issuedHeaderRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  issuedItemName: {
    flex: 1,
    marginRight: 12,
    color: '#111111',
    fontSize: 16,
    fontWeight: '900',
  },
  issuedTotalLabel: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '900',
  },
  issuedTotalValue: {
    marginLeft: 6,
    color: THEME_PRIMARY,
    fontSize: 16,
    fontWeight: '900',
  },
  issuedPriceText: {
    marginTop: 28,
    color: '#777777',
    fontSize: 14,
    fontWeight: '900',
  },
  issuedSearchRow: {
    minHeight: 44,
    marginTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#D7D7D7',
    flexDirection: 'row',
    alignItems: 'center',
  },
  issuedSearchIcon: {
    width: 30,
    color: '#B5B5B5',
    fontSize: 24,
  },
  issuedSearchInput: {
    flex: 1,
    minHeight: 42,
    paddingVertical: 0,
    color: '#111111',
    fontSize: 18,
  },
  issuedSearchClear: {
    color: '#B5B5B5',
    fontSize: 28,
    lineHeight: 30,
  },
  issuedStatusBlock: {
    marginTop: 22,
    alignItems: 'center',
  },
  issuedStatusText: {
    marginTop: 8,
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '700',
  },
  issuedErrorText: {
    marginTop: 14,
    color: '#B42318',
    fontSize: 13,
    fontWeight: '700',
  },
  assignedListContent: {
    flexGrow: 1,
    paddingTop: 14,
    paddingBottom: 20,
  },
  assignedCard: {
    minHeight: 86,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 2},
  },
  assignedCardTopRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedLabel: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '900',
  },
  assignedTaskValue: {
    width: 140,
    marginLeft: 12,
    marginRight: 12,
    color: THEME_PRIMARY,
    fontSize: 15,
  },
  assignedQtyValue: {
    width: 70,
    marginLeft: 12,
    color: THEME_PRIMARY,
    fontSize: 15,
  },
  assignedReturnButton: {
    marginLeft: 'auto',
    minWidth: 36,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignedReturnText: {
    color: '#111111',
    fontSize: 28,
    lineHeight: 30,
  },
  assignedWorkerName: {
    marginTop: 12,
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '900',
  },
  searchRow: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  searchBox: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E2E2',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  searchIcon: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    minHeight: 42,
    paddingVertical: 0,
    color: '#1F2937',
    fontSize: 15,
  },
  clearText: {
    color: '#777777',
    fontSize: 20,
    fontWeight: '700',
  },
  loadingOverlay: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#4B5563',
    fontSize: 13,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 112,
  },
  itemCard: {
    minHeight: 150,
    marginHorizontal: 4,
    marginTop: 5,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    elevation: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 1},
    overflow: 'hidden',
  },
  unitBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    minWidth: 55,
    maxWidth: 86,
    backgroundColor: THEME_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    zIndex: 2,
  },
  unitText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  itemImageWrap: {
    position: 'absolute',
    left: 10,
    top: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemImage: {
    width: 60,
    height: 60,
  },
  defaultItemIcon: {
    width: 38,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultItemBoxTop: {
    position: 'absolute',
    top: 4,
    width: 28,
    height: 8,
    borderRadius: 2,
    opacity: 0.85,
    transform: [{skewX: '-18deg'}],
  },
  defaultItemBoxFace: {
    position: 'absolute',
    bottom: 2,
    width: 30,
    height: 22,
    borderWidth: 2,
    borderRadius: 4,
  },
  defaultItemBoxSide: {
    position: 'absolute',
    right: 3,
    bottom: 7,
    width: 7,
    height: 18,
    borderRadius: 2,
    opacity: 0.22,
  },
  itemBody: {
    flex: 1,
    paddingLeft: 100,
    paddingRight: 48,
    paddingTop: 30,
    paddingBottom: 16,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
  },
  itemName: {
    flexShrink: 1,
    maxWidth: 170,
    color: '#3B3B3B',
    fontSize: 16,
    fontWeight: '800',
  },
  itemIdText: {
    marginLeft: 5,
    color: THEME_PRIMARY,
    fontSize: 12,
    fontWeight: '800',
  },
  itemDescription: {
    marginTop: 20,
    maxWidth: 250,
    color: '#9CA3AF',
    fontSize: 14,
  },
  quantityRow: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  quantityLabel: {
    marginLeft: 10,
    color: '#3B3B3B',
    fontSize: 13,
  },
  quantityValue: {
    marginLeft: 3,
    color: THEME_PRIMARY,
    fontSize: 13,
    fontWeight: '800',
  },
  actionColumn: {
    position: 'absolute',
    top: 26,
    right: 10,
    width: 36,
    alignItems: 'flex-end',
  },
  actionButton: {
    minWidth: 34,
    minHeight: 24,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 13,
  },
  iconFrame: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBox: {
    position: 'absolute',
    left: 2,
    bottom: 2,
    width: 15,
    height: 15,
    borderWidth: 2,
    borderRadius: 3,
  },
  editPencil: {
    position: 'absolute',
    right: 1,
    top: 3,
    width: 14,
    height: 4,
    borderRadius: 2,
    transform: [{rotate: '-45deg'}],
  },
  editPencilTip: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 0,
    height: 0,
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderLeftWidth: 5,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{rotate: '-45deg'}],
  },
  optionBox: {
    position: 'absolute',
    left: 3,
    top: 5,
    width: 15,
    height: 13,
    borderWidth: 2,
    borderRadius: 3,
  },
  optionLid: {
    position: 'absolute',
    left: 6,
    top: 2,
    width: 10,
    height: 4,
    borderRadius: 2,
  },
  optionCheckStem: {
    position: 'absolute',
    right: 6,
    bottom: 5,
    width: 3,
    height: 8,
    borderRadius: 2,
    transform: [{rotate: '45deg'}],
  },
  optionCheckArm: {
    position: 'absolute',
    right: 11,
    bottom: 6,
    width: 3,
    height: 5,
    borderRadius: 2,
    transform: [{rotate: '-45deg'}],
  },
  deleteLid: {
    position: 'absolute',
    top: 3,
    width: 16,
    height: 3,
    borderRadius: 2,
  },
  deleteBin: {
    position: 'absolute',
    top: 7,
    width: 14,
    height: 13,
    borderWidth: 2,
    borderTopWidth: 0,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 3,
  },
  deleteLine: {
    width: 2,
    height: 8,
    borderRadius: 1,
  },
  focRequestRow: {
    minHeight: 54,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  focSearchBox: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E2E2',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  requestButton: {
    width: 96,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: THEME_PRIMARY,
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  focFilterRow: {
    minHeight: 42,
    paddingHorizontal: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  focFilter: {
    flex: 1,
    minWidth: 0,
    minHeight: 32,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#D7D7D7',
    marginRight: 10,
  },
  focFilterText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshListButton: {
    minWidth: 112,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  refreshListText: {
    color: THEME_PRIMARY,
    fontSize: 13,
    fontWeight: '800',
  },
  refreshListIcon: {
    marginLeft: 5,
    color: THEME_PRIMARY,
    fontSize: 18,
    fontWeight: '800',
  },
  focListContent: {
    flexGrow: 1,
    paddingHorizontal: 8,
    paddingBottom: 112,
  },
  focCard: {
    margin: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 1},
    overflow: 'hidden',
  },
  focTopRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
  },
  focStatusBadge: {
    width: 90,
    alignSelf: 'stretch',
    justifyContent: 'center',
    backgroundColor: THEME_PRIMARY,
    paddingHorizontal: 10,
  },
  focStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  focRequestNo: {
    flex: 1,
    minWidth: 54,
    marginLeft: 10,
    color: THEME_PRIMARY,
    fontSize: 12,
    fontWeight: '800',
  },
  focLabel: {
    marginLeft: 8,
    color: '#3B3B3B',
    fontSize: 12,
    fontWeight: '800',
  },
  focIssue: {
    minWidth: 28,
    marginLeft: 4,
    color: THEME_PRIMARY,
    fontSize: 12,
    fontWeight: '800',
  },
  focDate: {
    width: 78,
    marginLeft: 4,
    marginRight: 8,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  focTaskCode: {
    marginTop: 8,
    marginRight: 18,
    alignSelf: 'flex-end',
    color: THEME_PRIMARY,
    fontSize: 12,
    fontWeight: '800',
  },
  focNotesRow: {
    marginHorizontal: 10,
    marginTop: 15,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  focNotesLabel: {
    color: '#3B3B3B',
    fontSize: 13,
  },
  focNotes: {
    flex: 1,
    marginLeft: 10,
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
  },
  focDeleteButton: {
    width: 44,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listFooter: {
    paddingVertical: 18,
  },
  emptyState: {
    flex: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  modalPanel: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '76%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
  },
  modalTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  modalItem: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalItemText: {
    color: '#1F2937',
    fontSize: 15,
  },
  modalHint: {
    color: '#667085',
    fontSize: 13,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

export default ItemInventoryTabHostScreen;