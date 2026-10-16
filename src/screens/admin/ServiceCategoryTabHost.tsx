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
  BackHandler,
  FlatList,
  Image,
  type ImageStyle,
  type StyleProp,
  Pressable,
  ScrollView,
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
  getServiceSubCategoryList,
  getServiceInsideSubCategoryList,
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
import {useNavigation} from '@react-navigation/native';
import {useWindowDimensions} from 'react-native';
import {getCurrentCountryCode} from '../../state/session';
import {DeleteAccIcon, EditProfileIcon, RightArrowIcon} from '../../components/JavaIcons';
import { showFailureMsg } from '../../utils/toast';

type Props = {
  ownerId: number;
};

type ViewState =
  | {level: 'category'}
  | {level: 'subcategory'; category: ServiceCategoryListDTOResultData}
  | {
      level: 'servicedetail';
      category: ServiceCategoryListDTOResultData;
      subcategory: ServiceCategoryListDTOLstServiceTypeSubcategories;
      service: ServiceCategoryListDTOLstServiceType;
    }
  | {
      level: 'service';
      category: ServiceCategoryListDTOResultData;
      subcategory: ServiceCategoryListDTOLstServiceTypeSubcategories;
    };

// Java: Picasso placeholder + error both use R.drawable.servicelist_default.
const ServiceThumb = ({uri, style, fallback}: {uri?: string | null; style: StyleProp<ImageStyle>; fallback?: any}) => {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      source={uri && !failed ? {uri} : fallback ?? require('../../../assets/images/servicelist_default.jpg')}
      style={style}
      onError={() => setFailed(true)}
    />
  );
};

const ServiceCategoryTabHost: React.FC<Props> = ({ownerId}) => {
  const [tree, setTree] = useState<ServiceCategoryListDTOResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const {width: screenWidth} = useWindowDimensions();
  const [photoIndex, setPhotoIndex] = useState(0);
  const countryCode = getCurrentCountryCode();
  const currencySymbol = '₹';
  const [view, setView] = useState<ViewState>({level: 'category'});
  const [search, setSearch] = useState('');

  const [groupModal, setGroupModal] = useState<{
    kind: ServiceGroupKind;
    editing: EditingServiceGroup | null;
  } | null>(null);
  const [serviceModal, setServiceModal] = useState<{
    editing: ServiceCategoryListDTOLstServiceType | null;
  } | null>(null);

  // Java loads each level from its own endpoint (GetSubCategoryAndServiceListByCategoryId /
  // GetServiceListBySubCategoryId); the category tree alone can omit them. Falls back to the tree.
  const [fetchedSubs, setFetchedSubs] = useState<ServiceCategoryListDTOLstServiceTypeSubcategories[] | null>(null);
  const [fetchedServices, setFetchedServices] = useState<ServiceCategoryListDTOLstServiceType[] | null>(null);

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

  const subCategoryId = view.level === 'subcategory' ? view.category.ServiceTypeCategoryId : view.level === 'service' ? view.category.ServiceTypeCategoryId : null;
  const serviceSubId = view.level === 'service' ? view.subcategory.ServiceTypeSubCategoryId : null;

  useEffect(() => {
    if (view.level !== 'subcategory' || subCategoryId == null) {
      setFetchedSubs(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const all: any[] = [];
        for (let page = 1; page <= 20; page++) {
          const res = await getServiceSubCategoryList({OwnerId: ownerId, CategoryId: subCategoryId, SearchParam: '', pageIndex: page});
          const rows = Array.isArray(res?.ResultData) ? res.ResultData : [];
          all.push(...rows);
          if (!rows.length || all.length >= (res?.RecordCount ?? 0)) break;
        }
        if (!cancelled) setFetchedSubs(all);
      } catch {
        if (!cancelled) setFetchedSubs(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view.level, subCategoryId, ownerId, tree]);

  useEffect(() => {
    if (view.level !== 'service' || serviceSubId == null) {
      setFetchedServices(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const all: any[] = [];
        for (let page = 1; page <= 20; page++) {
          const res = await getServiceInsideSubCategoryList({OwnerId: ownerId, SubCategoryId: serviceSubId, pageIndex: page, searchParam: ''});
          const rows = Array.isArray(res?.ResultData) ? res.ResultData : [];
          all.push(...rows);
          if (!rows.length || all.length >= (res?.RecordCount ?? 0)) break;
        }
        if (!cancelled) setFetchedServices(all);
      } catch {
        if (!cancelled) setFetchedServices(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view.level, serviceSubId, ownerId, tree]);

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

  useEffect(() => {
    if (view.level === 'category') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const goBack = () => {
    if (view.level === 'servicedetail') {
      setView({level: 'service', category: view.category, subcategory: view.subcategory});
    } else if (view.level === 'service') {
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
            showFailureMsg(e instanceof Error ? e.message : 'Unable to delete category.');
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
              showFailureMsg(e instanceof Error ? e.message : 'Unable to delete sub-category.');
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
            showFailureMsg(e instanceof Error ? e.message : 'Unable to delete service.');
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
    prices,
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
    prices?: {strike: string; price: string};
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
        {prices ? (
          <View style={styles.priceRow}>
            <Text style={styles.strikePrice}>{prices.strike}</Text>
            <Text style={styles.priceText}>{prices.price}</Text>
          </View>
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

  // service_sub_category_fragment.xml / service_list_inside_sub_category_fragment.xml: bold 16sp
  // "Category / <name>" line, then a 130dp centred banner (Picasso placeholder = servicelist_default).
  // Java noResultImg: 200dp ic_noresultfound centred in the list area.
  const noResult = (
    <View style={styles.noResult}>
      <Image source={require('../../../assets/images/noresultfound.png')} style={styles.noResultImg} resizeMode="contain" />
    </View>
  );

  const renderBreadcrumb = (label: string, name: string, imageUri?: string | null) => (
    <>
      <Pressable hitSlop={10} onPress={goBack}>
        <Text style={styles.breadcrumb} numberOfLines={1}>
          {label} / {name}
        </Text>
      </Pressable>
      <ServiceThumb uri={imageUri} style={styles.banner} />
    </>
  );

  const renderTitleBar = (title: string, addLabel: string, onAdd: () => void, big = false) => (
    <View style={styles.titleBar}>
      <Text style={[styles.titleText, big && {fontSize: sp(18)}]} numberOfLines={1}>
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
          {renderTitleBar('Service Category', '+ Category', () => setGroupModal({kind: 'category', editing: null}), true)}
          <FlatList
            data={filtered}
            keyExtractor={(item, index) => `${item.ServiceTypeCategoryId ?? index}`}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={noResult}
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
    // Java: the first category ("Other Category") opens the FirstElement variant -- no add/edit/delete.
    const isFirstCategory = tree[0]?.ServiceTypeCategoryId === view.category.ServiceTypeCategoryId;
    const subcategories = fetchedSubs ?? view.category.lstServiceTypeSubcategories ?? [];
    const filtered = subcategories.filter(s =>
      String(s.ServiceTypeSubCategoryName ?? '').toLowerCase().includes(q),
    );
    return (
      <View style={styles.root}>
        <View style={styles.sheet}>
          {renderBreadcrumb('Category', view.category.ServiceTypeCategoryName ?? '', view.category.ServiceTypeCategoryImage)}
          {isFirstCategory ? (
            <View style={styles.titleBar}>
              <Text style={styles.titleText}>Service Sub Category</Text>
            </View>
          ) : (
            renderTitleBar('Service Sub Category', '+ Sub Category', () =>
              setGroupModal({kind: 'subcategory', editing: null}),
            )
          )}
          <FlatList
            data={filtered}
            keyExtractor={(item, index) => `${item.ServiceTypeSubCategoryId ?? index}`}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={noResult}
            renderItem={({item, index}) =>
              renderRow({
                imageUri: item.ServiceTypeSubCategoryImage,
                title: item.ServiceTypeSubCategoryName ?? '',
                id: item.ServiceTypeSubCategoryId,
                showArrow: true,
                onEdit:
                  isFirstCategory
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
                onDelete: isFirstCategory ? undefined : () => handleDeleteSubCategory(view.category, item),
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

  if (view.level === 'servicedetail') {
    const svc: any = view.service;
    const photos = [svc.PhotoPath, svc.PhotoPath1, svc.PhotoPath2];
    const slideW = screenWidth - ms(40) - ms(40);
    return (
      <View style={styles.root}>
        <ScrollView style={styles.detailSheet} contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
          <Pressable hitSlop={10} onPress={goBack}>
            <Text style={styles.detailCrumb} numberOfLines={1}>
              Service / {svc.ServiceName}
            </Text>
          </Pressable>
          <View style={styles.sliderCard}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / slideW))}
            >
              {photos.map((p, i) => (
                <ServiceThumb
                  key={i}
                  uri={p && String(p).trim().toUpperCase() !== 'NA' ? p : null}
                  style={{width: slideW, height: ms(150), resizeMode: 'cover'}}
                  fallback={require('../../../assets/images/service1.png')}
                />
              ))}
            </ScrollView>
          </View>
          <View style={styles.dots}>
            {photos.map((_, i) => (
              <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.detailTitleRow}>
            <Text style={styles.detailSection}>Service Details</Text>
            <Pressable hitSlop={8} onPress={() => setServiceModal({editing: view.service})}>
              <EditProfileIcon size={ms(20)} color={COLORS.textBlack} />
            </Pressable>
            <Pressable hitSlop={8} onPress={() => handleDeleteService(view.service)} style={{marginLeft: ms(30)}}>
              <DeleteAccIcon size={ms(20)} color={COLORS.statusRejected} />
            </Pressable>
          </View>
          {[
            ['Service Name', svc.ServiceName],
            ['Service Price', `${currencySymbol} ${formatAmount(svc.Price)}`],
            ['Service SAC Code', svc.SACCode],
            ['Service Contact', svc.ContactNo ? `+${countryCode} ${svc.ContactNo}` : 'NA'],
          ].map(([label, value]) => (
            <View key={label as string} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{(value as string) || 'NA'}</Text>
            </View>
          ))}
          <Text style={styles.detailDescTitle}>Service Description</Text>
          <Text style={styles.detailDesc}>{svc.Description || 'NA'}</Text>
          <Pressable style={styles.enquiryBtn} onPress={() => navigation.navigate('CRM', {addEnquiryTrigger: Date.now()})}>
            <Text style={styles.enquiryBtnText}>Add Enquiry</Text>
          </Pressable>
        </ScrollView>

        <AddEditServiceModal
          visible={!!serviceModal}
          ownerId={ownerId}
          subCategoryId={view.subcategory.ServiceTypeSubCategoryId ?? 0}
          editing={serviceModal?.editing ?? null}
          onClose={() => setServiceModal(null)}
          onSaved={() => {
            setServiceModal(null);
            setView({level: 'service', category: view.category, subcategory: view.subcategory});
            refresh();
          }}
        />
      </View>
    );
  }

  const services = fetchedServices ?? view.subcategory.lstServiceType ?? [];
  const filteredServices = services.filter(s => String(s.ServiceName ?? '').toLowerCase().includes(q));

  return (
    <View style={styles.root}>
      <View style={styles.sheet}>
        {renderBreadcrumb('Sub Category', view.subcategory.ServiceTypeSubCategoryName ?? '', view.subcategory.ServiceTypeSubCategoryImage)}
        <View style={styles.searchRow}>
          <UnderlineSearch value={search} onChangeText={setSearch} placeholder="Search" style={styles.searchFlex} />
          {tree[0]?.ServiceTypeCategoryId === view.category.ServiceTypeCategoryId ? null : (
            <Pressable style={styles.addPill} onPress={() => setServiceModal({editing: null})}>
              <Text style={styles.addPillText}>+ Service</Text>
            </Pressable>
          )}
        </View>
        <FlatList
          data={filteredServices}
          keyExtractor={(item, index) => `${item.Id ?? index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={noResult}
          renderItem={({item}) =>
renderRow({
              imageUri: item.PhotoPath,
              title: item.ServiceName ?? '',
              id: item.Id,
              subtitle: item.Description ? String(item.Description) : undefined,
              prices: item.Price
                ? {
                    strike: `${currencySymbol} ${formatAmount((item.Price ?? 0) + 200)}`,
                    price: `${currencySymbol} ${formatAmount(item.Price)}`,
                  }
                : undefined,
              large: true,
              onPress: () => setView({level: 'servicedetail', category: view.category, subcategory: view.subcategory, service: item}),
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
    marginTop: ms(11),
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
    height: ms(40),
    marginVertical: ms(5),
    paddingLeft: ms(20),
    paddingRight: ms(10),
  },
  titleText: {
    flex: 1,
    fontSize: sp(16),
    fontWeight: '700',
    color: COLORS.textBlack,
  },
  priceRow: {flexDirection: 'row', alignItems: 'center', marginTop: ms(14)},
  strikePrice: {
    fontSize: sp(15),
    color: COLORS.primary,
    textDecorationLine: 'line-through',
    marginRight: ms(30),
  },
  priceText: {fontSize: sp(15), color: '#4CAF50'},
  detailSheet: {
    flex: 1,
    marginTop: ms(25),
    backgroundColor: COLORS.white,
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
  },
  detailContent: {padding: ms(20), paddingBottom: ms(60)},
  detailCrumb: {marginLeft: ms(20), marginBottom: ms(10), fontSize: sp(16), fontWeight: '700', color: COLORS.textBlack},
  sliderCard: {
    marginTop: ms(10),
    marginBottom: ms(20),
    marginHorizontal: ms(20),
    height: ms(150),
    borderRadius: ms(20),
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 4,
  },
  dots: {flexDirection: 'row', justifyContent: 'center', marginBottom: ms(20)},
  dot: {width: ms(8), height: ms(8), marginHorizontal: ms(4), backgroundColor: '#E9A3B3'},
  dotActive: {backgroundColor: COLORS.primary},
  detailTitleRow: {flexDirection: 'row', alignItems: 'center', marginBottom: ms(20)},
  detailSection: {flex: 1, fontSize: sp(16), fontWeight: '700', color: COLORS.textBlack},
  detailRow: {flexDirection: 'row', marginBottom: ms(20)},
  detailLabel: {flex: 1, fontSize: sp(16), color: COLORS.ink},
  detailValue: {flex: 1, fontSize: sp(16), color: COLORS.lightGray},
  detailDescTitle: {fontSize: sp(18), fontWeight: '700', color: COLORS.textBlack, marginTop: ms(10), marginBottom: ms(20)},
  detailDesc: {fontSize: sp(16), color: COLORS.lightGray, marginBottom: ms(20)},
  enquiryBtn: {
    height: ms(52),
    marginTop: ms(10),
    borderRadius: ms(34),
    backgroundColor: COLORS.statusOnHold,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  enquiryBtnText: {color: '#FFFFFF', fontSize: sp(16)},
  breadcrumb: {
    marginLeft: ms(20),
    marginBottom: ms(10),
    fontSize: sp(16),
    fontWeight: '700',
    color: COLORS.textBlack,
  },
  banner: {
    alignSelf: 'center',
    height: ms(130),
    width: '100%',
    resizeMode: 'contain',
    marginBottom: ms(10),
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
  noResult: {alignItems: 'center', justifyContent: 'center', marginTop: ms(60)},
  noResultImg: {width: ms(200), height: ms(200)},
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: vs(40),
    fontSize: sp(14),
  },
  rowCard: {
    height: ms(90),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: ms(10),
    margin: ms(5),
    paddingRight: ms(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  rowCardLarge: {
    height: ms(110),
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
    marginLeft: ms(24),
  },
});

export default ServiceCategoryTabHost;
