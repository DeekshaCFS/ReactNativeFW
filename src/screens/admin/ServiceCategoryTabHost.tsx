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
  type ImageStyle,
  type StyleProp,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../../theme/theme';
import {ms, sp, vs} from '../../utils/responsive';
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
import UnderlineSearch from '../../components/UnderlineSearch';
import {DeleteAccIcon, EditProfileIcon, RightArrowIcon} from '../../components/JavaIcons';

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

// Java: Picasso placeholder + error both use R.drawable.servicelist_default.
const ServiceThumb = ({uri, style}: {uri?: string | null; style: StyleProp<ImageStyle>}) => {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      source={uri && !failed ? {uri} : require('../../../assets/images/servicelist_default.jpg')}
      style={style}
      onError={() => setFailed(true)}
    />
  );
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

  const q = search.trim().toLowerCase();

  // Java servicecategory_list_row / servicecategory_first_list_row / servicetype_list_row:
  // 100dp card, 70dp circular default image, bold name + blue [id], edit / delete / arrow.
  const renderRow = ({
    imageUri,
    title,
    id,
    subtitle,
    onPress,
    onEdit,
    onDelete,
    showArrow,
    large,
  }: {
    imageUri?: string | null;
    title: string;
    id?: number | string | null;
    subtitle?: string;
    onPress?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    showArrow?: boolean;
    large?: boolean;
  }) => (
    <Pressable style={[styles.rowCard, large ? styles.rowCardLarge : null]} onPress={onPress}>
      <ServiceThumb uri={imageUri} style={[styles.rowImage, large ? styles.rowImageLarge : null]} />
      <View style={styles.rowBody}>
        <View style={styles.rowTitleLine}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {title}
          </Text>
          {id != null && id !== '' && Number(id) !== 0 ? <Text style={styles.rowId}>[{id}]</Text> : null}
        </View>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onEdit ? (
        <Pressable hitSlop={8} onPress={onEdit} style={styles.rowIcon}>
          <EditProfileIcon size={ms(20)} color={COLORS.textBlack} />
        </Pressable>
      ) : null}
      {onDelete ? (
        <Pressable hitSlop={8} onPress={onDelete} style={styles.rowIcon}>
          <DeleteAccIcon size={ms(20)} color={COLORS.statusRejected} />
        </Pressable>
      ) : null}
      {showArrow ? (
        <View style={styles.rowIcon}>
          <RightArrowIcon size={ms(25)} color={COLORS.textBlack} />
        </View>
      ) : null}
    </Pressable>
  );

  const renderTitleBar = (title: string, addLabel: string, onAdd: () => void) => (
    <View style={styles.titleBar}>
      <Text style={styles.titleText} numberOfLines={1}>
        {title}
      </Text>
      <Pressable style={[styles.addPill, {width: ms(addLabel.length > 10 ? 100 : 80)}]} onPress={onAdd}>
        <Text style={styles.addPillText}>{addLabel}</Text>
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (view.level === 'category') {
    const filtered = tree.filter(c => String(c.ServiceTypeCategoryName ?? '').toLowerCase().includes(q));
    return (
      <View style={styles.root}>
        <View style={styles.sheet}>
          {renderTitleBar('Service Category', '+ Category', () => setGroupModal({kind: 'category', editing: null}))}
          <FlatList
            data={filtered}
            keyExtractor={(item, index) => `${item.ServiceTypeCategoryId ?? index}`}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>No service categories yet.</Text>}
            renderItem={({item, index}) =>
              renderRow({
                imageUri: item.ServiceTypeCategoryImage,
                title: item.ServiceTypeCategoryName ?? '',
                id: item.ServiceTypeCategoryId,
                showArrow: true,
                // Java's first row (Other Category) is the arrow-only layout.
                onEdit:
                  index === 0 && !q
                    ? undefined
                    : () =>
                        setGroupModal({
                          kind: 'category',
                          editing: {
                            id: item.ServiceTypeCategoryId ?? 0,
                            name: item.ServiceTypeCategoryName ?? '',
                            description: item.ServiceTypeCategoryDescription ?? '',
                            image: item.ServiceTypeCategoryImage,
                          },
                        }),
                onDelete: index === 0 && !q ? undefined : () => handleDeleteCategory(item),
                onPress: () => setView({level: 'subcategory', category: item}),
              })
            }
          />
        </View>

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
      String(s.ServiceTypeSubCategoryName ?? '').toLowerCase().includes(q),
    );
    return (
      <View style={styles.root}>
        <View style={styles.sheet}>
          <Pressable hitSlop={10} onPress={goBack} style={styles.categoryNameRow}>
            <Ionicons name="chevron-back" size={sp(20)} color={COLORS.primary} />
            <Text style={styles.categoryName} numberOfLines={1}>
              {view.category.ServiceTypeCategoryName ?? 'Category'}
            </Text>
          </Pressable>
          {renderTitleBar('Service Sub Category', '+ Sub Category', () =>
            setGroupModal({kind: 'subcategory', editing: null}),
          )}
          <FlatList
            data={filtered}
            keyExtractor={(item, index) => `${item.ServiceTypeSubCategoryId ?? index}`}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>No sub-categories yet.</Text>}
            renderItem={({item, index}) =>
              renderRow({
                imageUri: item.ServiceTypeSubCategoryImage,
                title: item.ServiceTypeSubCategoryName ?? '',
                id: item.ServiceTypeSubCategoryId,
                showArrow: true,
                onEdit:
                  index === 0 && !q
                    ? undefined
                    : () =>
                        setGroupModal({
                          kind: 'subcategory',
                          editing: {
                            id: item.ServiceTypeSubCategoryId ?? 0,
                            name: item.ServiceTypeSubCategoryName ?? '',
                            description: item.ServiceTypeSubCategoryDescription ?? '',
                            image: item.ServiceTypeSubCategoryImage,
                          },
                        }),
                onDelete: index === 0 && !q ? undefined : () => handleDeleteSubCategory(view.category, item),
                onPress: () => setView({level: 'service', category: view.category, subcategory: item}),
              })
            }
          />
        </View>

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
  const filteredServices = services.filter(s => String(s.ServiceName ?? '').toLowerCase().includes(q));

  return (
    <View style={styles.root}>
      <View style={styles.sheet}>
        <Pressable hitSlop={10} onPress={goBack} style={styles.categoryNameRow}>
          <Ionicons name="chevron-back" size={sp(20)} color={COLORS.primary} />
          <Text style={styles.categoryName} numberOfLines={1}>
            {view.subcategory.ServiceTypeSubCategoryName ?? 'Sub-Category'}
          </Text>
        </Pressable>
        <View style={styles.searchRow}>
          <UnderlineSearch value={search} onChangeText={setSearch} placeholder="Search" style={styles.searchFlex} />
          <Pressable style={styles.addPill} onPress={() => setServiceModal({editing: null})}>
            <Text style={styles.addPillText}>+ Service</Text>
          </Pressable>
        </View>
        <FlatList
          data={filteredServices}
          keyExtractor={(item, index) => `${item.Id ?? index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No services yet.</Text>}
          renderItem={({item}) =>
            renderRow({
              imageUri: item.ImageFileName ? item.PhotoPath : null,
              title: item.ServiceName ?? '',
              id: item.Id,
              subtitle: `₹ ${formatAmount(item.Price)}`,
              large: true,
              onEdit: () => setServiceModal({editing: item}),
              onDelete: () => handleDeleteService(item),
            })
          }
        />
      </View>

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
    backgroundColor: COLORS.primary,
  },
  sheet: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    padding: ms(10),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: ms(5),
    paddingLeft: ms(10),
    paddingRight: ms(10),
  },
  titleText: {
    flex: 1,
    fontSize: sp(18),
    fontWeight: '700',
    color: COLORS.textBlack,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: ms(10),
    marginBottom: ms(6),
  },
  categoryName: {
    flex: 1,
    marginLeft: ms(4),
    fontSize: sp(16),
    fontWeight: '700',
    color: COLORS.textBlack,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(5),
    gap: ms(10),
  },
  searchFlex: {flex: 1},
  addPill: {
    width: ms(80),
    height: ms(30),
    borderRadius: ms(15),
    backgroundColor: COLORS.textBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPillText: {
    color: COLORS.white,
    fontSize: sp(12),
  },
  listContent: {
    paddingBottom: vs(24),
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: vs(40),
    fontSize: sp(14),
  },
  rowCard: {
    height: ms(100),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: ms(10),
    margin: ms(5),
    paddingRight: ms(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  rowCardLarge: {
    height: ms(120),
  },
  rowImage: {
    width: ms(70),
    height: ms(70),
    borderRadius: ms(35),
    marginHorizontal: ms(10),
  },
  rowImageLarge: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(40),
  },
  rowBody: {
    flex: 1,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTitle: {
    flexShrink: 1,
    fontSize: sp(15),
    fontWeight: '700',
    color: COLORS.ink,
    marginRight: ms(5),
  },
  rowId: {
    fontSize: sp(12),
    fontWeight: '700',
    color: COLORS.linkBlue,
    marginLeft: 'auto',
    marginRight: ms(8),
  },
  rowSubtitle: {
    marginTop: ms(5),
    fontSize: sp(14),
    color: COLORS.lightGray,
  },
  rowIcon: {
    marginLeft: ms(14),
  },
});

export default ServiceCategoryTabHost;
