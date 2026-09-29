// src/screens/admin/ServiceCategoryTabHost.tsx
//
// Owner-facing Services management: Category -> Sub-Category -> Service.
// Mounted into AdminHomeScreen's content area via the `drawerSection`
// mechanism (see AdminHomeScreen.tsx's `isServicesSection`), the same way
// ItemInventoryTabHostScreen/PassbookExpenditureTabHost/AccountsScreen are.
//
// getServiceCategoryList returns the whole tree (category -> subcategories
// -> services) in one call, so browsing is pure local state; only
// add/edit/delete hit the network, followed by a refetch of the tree.

import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../../theme/theme';
import {ms, scale, sp, vs} from '../../utils/responsive';
import {ensureSuccess} from '../../utils/apiResponse';
import {formatAmount} from '../../utils/decimal';
import {
  deleteServiceCategoryList,
  deleteServiceSubCategoryList,
  getDeleteService,
  getServiceCategoryList,
} from '../../api/services/servicesService';
import type {
  ServiceCategoryListDTOLstServiceType,
  ServiceCategoryListDTOLstServiceTypeSubcategories,
  ServiceCategoryListDTOResultData,
} from '../../api/services/services.types';
import AddEditServiceGroupModal, {
  type EditingServiceGroup,
  type ServiceGroupKind,
} from './AddEditServiceGroupModal';
import AddEditServiceModal from './AddEditServiceModal';

type Props = {
  ownerId: number;
};

type ViewState =
  | {level: 'category'}
  | {level: 'subcategory'; category: ServiceCategoryListDTOResultData}
  | {
      level: 'service';
      category: ServiceCategoryListDTOResultData;
      subcategory: ServiceCategoryListDTOLstServiceTypeSubcategories;
    };

const ServiceCategoryTabHost: React.FC<Props> = ({ownerId}) => {
  const [tree, setTree] = useState<ServiceCategoryListDTOResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>({level: 'category'});
  const [search, setSearch] = useState('');

  const [groupModal, setGroupModal] = useState<{
    kind: ServiceGroupKind;
    editing: EditingServiceGroup | null;
  } | null>(null);
  const [serviceModal, setServiceModal] = useState<{
    editing: ServiceCategoryListDTOLstServiceType | null;
  } | null>(null);

  const fetchTree = useCallback(async () => {
    try {
      const response = await getServiceCategoryList({OwnerId: ownerId});
      setTree(Array.isArray(response?.ResultData) ? response.ResultData : []);
    } catch {
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchTree();
  }, [fetchTree]);

  // Keep the drilled-into category/subcategory in sync with the refetched
  // tree (so edits/deletes made one level down are reflected immediately).
  useEffect(() => {
    if (view.level === 'subcategory') {
      const updated = tree.find(c => c.ServiceTypeCategoryId === view.category.ServiceTypeCategoryId);
      if (updated) setView({level: 'subcategory', category: updated});
    } else if (view.level === 'service') {
      const updatedCategory = tree.find(c => c.ServiceTypeCategoryId === view.category.ServiceTypeCategoryId);
      const updatedSub = updatedCategory?.lstServiceTypeSubcategories?.find(
        s => s.ServiceTypeSubCategoryId === view.subcategory.ServiceTypeSubCategoryId,
      );
      if (updatedCategory && updatedSub) {
        setView({level: 'service', category: updatedCategory, subcategory: updatedSub});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]);

  useEffect(() => {
    setSearch('');
  }, [view.level]);

  const goBack = () => {
    if (view.level === 'service') {
      setView({level: 'subcategory', category: view.category});
    } else if (view.level === 'subcategory') {
      setView({level: 'category'});
    }
  };

  const handleDeleteCategory = (category: ServiceCategoryListDTOResultData) => {
    Alert.alert('Delete Category', `Delete "${category.ServiceTypeCategoryName}"? This also removes its sub-categories and services.`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await ensureSuccess(
              await deleteServiceCategoryList(
                [{UserId: ownerId, Id: category.ServiceTypeCategoryId}] as unknown as Parameters<
                  typeof deleteServiceCategoryList
                >[0],
              ),
            );
            refresh();
          } catch (e) {
            Alert.alert('Delete Category', e instanceof Error ? e.message : 'Unable to delete category.');
          }
        },
      },
    ]);
  };

  const handleDeleteSubCategory = (
    category: ServiceCategoryListDTOResultData,
    subcategory: ServiceCategoryListDTOLstServiceTypeSubcategories,
  ) => {
    Alert.alert(
      'Delete Sub-Category',
      `Delete "${subcategory.ServiceTypeSubCategoryName}"? This also removes its services.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ensureSuccess(
                await deleteServiceSubCategoryList(
                  [{UserId: ownerId, Id: subcategory.ServiceTypeSubCategoryId}] as unknown as Parameters<
                    typeof deleteServiceSubCategoryList
                  >[0],
                ),
              );
              refresh();
            } catch (e) {
              Alert.alert('Delete Sub-Category', e instanceof Error ? e.message : 'Unable to delete sub-category.');
            }
          },
        },
      ],
    );
  };

  const handleDeleteService = (service: ServiceCategoryListDTOLstServiceType) => {
    Alert.alert('Delete Service', `Delete "${service.ServiceName}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await ensureSuccess(await getDeleteService({OwnerId: ownerId, SId: service.Id}));
            refresh();
          } catch (e) {
            Alert.alert('Delete Service', e instanceof Error ? e.message : 'Unable to delete service.');
          }
        },
      },
    ]);
  };

  const renderHeader = () => {
    const title =
      view.level === 'category'
        ? 'Services'
        : view.level === 'subcategory'
        ? view.category.ServiceTypeCategoryName ?? 'Category'
        : view.subcategory.ServiceTypeSubCategoryName ?? 'Sub-Category';

    const onAddPress = () => {
      if (view.level === 'category') {
        setGroupModal({kind: 'category', editing: null});
      } else if (view.level === 'subcategory') {
        setGroupModal({kind: 'subcategory', editing: null});
      } else {
        setServiceModal({editing: null});
      }
    };

    return (
      <View style={styles.headerRow}>
        {view.level !== 'category' ? (
          <Pressable hitSlop={10} onPress={goBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={sp(22)} color={COLORS.primary} />
          </Pressable>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <Text numberOfLines={1} style={styles.headerTitle}>
          {title}
        </Text>
        <Pressable hitSlop={10} onPress={onAddPress} style={styles.addButton}>
          <Ionicons name="add" size={sp(22)} color={COLORS.white} />
        </Pressable>
      </View>
    );
  };

  const renderSearch = () => (
    <TextInput
      style={styles.searchInput}
      placeholder="Search"
      placeholderTextColor={COLORS.textMuted}
      value={search}
      onChangeText={setSearch}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (view.level === 'category') {
    const filtered = tree.filter(c =>
      String(c.ServiceTypeCategoryName ?? '').toLowerCase().includes(search.trim().toLowerCase()),
    );
    return (
      <View style={styles.root}>
        {renderHeader()}
        {renderSearch()}
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => `${item.ServiceTypeCategoryId ?? index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No service categories yet.</Text>}
          renderItem={({item}) => (
            <Pressable style={styles.card} onPress={() => setView({level: 'subcategory', category: item})}>
              {item.ServiceTypeCategoryImage ? (
                <Image source={{uri: item.ServiceTypeCategoryImage}} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Ionicons name="reader-outline" size={sp(20)} color={COLORS.primary} />
                </View>
              )}
              <View style={styles.cardBody}>
                <Text numberOfLines={1} style={styles.cardTitle}>
                  {item.ServiceTypeCategoryName}
                </Text>
                <Text numberOfLines={1} style={styles.cardSubtitle}>
                  {item.lstServiceTypeSubcategories?.length ?? 0} sub-categories
                </Text>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => setGroupModal({kind: 'category', editing: {
                  id: item.ServiceTypeCategoryId ?? 0,
                  name: item.ServiceTypeCategoryName ?? '',
                  description: item.ServiceTypeCategoryDescription ?? '',
                  image: item.ServiceTypeCategoryImage,
                }})}>
                <Text style={styles.iconText}>✎</Text>
              </Pressable>
              <Pressable hitSlop={8} onPress={() => handleDeleteCategory(item)}>
                <Text style={styles.iconText}>🗑</Text>
              </Pressable>
            </Pressable>
          )}
        />

        <AddEditServiceGroupModal
          visible={groupModal?.kind === 'category'}
          kind="category"
          ownerId={ownerId}
          editing={groupModal?.editing ?? null}
          onClose={() => setGroupModal(null)}
          onSaved={() => {
            setGroupModal(null);
            refresh();
          }}
        />
      </View>
    );
  }

  if (view.level === 'subcategory') {
    const subcategories = view.category.lstServiceTypeSubcategories ?? [];
    const filtered = subcategories.filter(s =>
      String(s.ServiceTypeSubCategoryName ?? '').toLowerCase().includes(search.trim().toLowerCase()),
    );
    return (
      <View style={styles.root}>
        {renderHeader()}
        {renderSearch()}
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => `${item.ServiceTypeSubCategoryId ?? index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No sub-categories yet.</Text>}
          renderItem={({item}) => (
            <Pressable
              style={styles.card}
              onPress={() => setView({level: 'service', category: view.category, subcategory: item})}>
              {item.ServiceTypeSubCategoryImage ? (
                <Image source={{uri: item.ServiceTypeSubCategoryImage}} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Ionicons name="albums-outline" size={sp(20)} color={COLORS.primary} />
                </View>
              )}
              <View style={styles.cardBody}>
                <Text numberOfLines={1} style={styles.cardTitle}>
                  {item.ServiceTypeSubCategoryName}
                </Text>
                <Text numberOfLines={1} style={styles.cardSubtitle}>
                  {item.lstServiceType?.length ?? 0} services
                </Text>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => setGroupModal({kind: 'subcategory', editing: {
                  id: item.ServiceTypeSubCategoryId ?? 0,
                  name: item.ServiceTypeSubCategoryName ?? '',
                  description: item.ServiceTypeSubCategoryDescription ?? '',
                  image: item.ServiceTypeSubCategoryImage,
                }})}>
                <Text style={styles.iconText}>✎</Text>
              </Pressable>
              <Pressable hitSlop={8} onPress={() => handleDeleteSubCategory(view.category, item)}>
                <Text style={styles.iconText}>🗑</Text>
              </Pressable>
            </Pressable>
          )}
        />

        <AddEditServiceGroupModal
          visible={groupModal?.kind === 'subcategory'}
          kind="subcategory"
          ownerId={ownerId}
          categoryId={view.category.ServiceTypeCategoryId}
          editing={groupModal?.editing ?? null}
          onClose={() => setGroupModal(null)}
          onSaved={() => {
            setGroupModal(null);
            refresh();
          }}
        />
      </View>
    );
  }

  const services = view.subcategory.lstServiceType ?? [];
  const filteredServices = services.filter(s =>
    String(s.ServiceName ?? '').toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <View style={styles.root}>
      {renderHeader()}
      {renderSearch()}
      <FlatList
        data={filteredServices}
        keyExtractor={(item, index) => `${item.Id ?? index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No services yet.</Text>}
        renderItem={({item}) => (
          <View style={styles.card}>
            {item.ImageFileName ? (
              <Image source={{uri: item.PhotoPath ?? undefined}} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Ionicons name="pricetag-outline" size={sp(20)} color={COLORS.primary} />
              </View>
            )}
            <View style={styles.cardBody}>
              <Text numberOfLines={1} style={styles.cardTitle}>
                {item.ServiceName}
              </Text>
              <Text numberOfLines={1} style={styles.cardSubtitle}>
                {'₹'} {formatAmount(item.Price)}
              </Text>
            </View>
            <Pressable hitSlop={8} onPress={() => setServiceModal({editing: item})}>
              <Text style={styles.iconText}>✎</Text>
            </Pressable>
            <Pressable hitSlop={8} onPress={() => handleDeleteService(item)}>
              <Text style={styles.iconText}>🗑</Text>
            </Pressable>
          </View>
        )}
      />

      <AddEditServiceModal
        visible={!!serviceModal}
        ownerId={ownerId}
        subCategoryId={view.subcategory.ServiceTypeSubCategoryId ?? 0}
        editing={serviceModal?.editing ?? null}
        onClose={() => setServiceModal(null)}
        onSaved={() => {
          setServiceModal(null);
          refresh();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(14),
    paddingVertical: vs(10),
  },
  backButton: {
    width: ms(32),
    height: ms(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: ms(32),
  },
  headerTitle: {
    flex: 1,
    fontSize: sp(17),
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: ms(6),
  },
  addButton: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    marginHorizontal: ms(14),
    marginBottom: vs(8),
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: scale(10),
    paddingHorizontal: scale(14),
    paddingVertical: vs(8),
    fontSize: sp(14),
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: ms(14),
    paddingBottom: vs(24),
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: vs(40),
    fontSize: sp(14),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: scale(12),
    padding: scale(10),
    marginBottom: vs(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    gap: scale(10),
  },
  thumb: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(10),
  },
  thumbPlaceholder: {
    backgroundColor: '#fdecec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: sp(15),
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: sp(12),
    color: COLORS.textMuted,
    marginTop: vs(2),
  },
  iconText: {
    color: COLORS.primary,
    fontSize: sp(16),
    paddingHorizontal: scale(4),
  },
});

export default ServiceCategoryTabHost;
