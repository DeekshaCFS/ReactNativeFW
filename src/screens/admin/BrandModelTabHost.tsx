// src/screens/admin/BrandModelTabHost.tsx
//
// Owner-facing Brand Management: Brand -> Model -> Serial Number.
// Mounted into AdminHomeScreen's content area via the `drawerSection`
// mechanism (see AdminHomeScreen.tsx's `isBrandManagementSection`), same
// as ServiceCategoryTabHost.tsx.
//
// Unlike Services, there's no single "whole tree" endpoint here -- each
// level is fetched separately: brand list once, then a fresh fetch of
// models when drilling into a brand, and of serial numbers when drilling
// into a model. Mutations refetch only the current level.

import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import UnderlineSearch from '../../components/UnderlineSearch';
import {DefaultItemIcon, DeleteAccIcon, EditProfileIcon, ItemOptionIcon} from '../../components/JavaIcons';
import {COLORS} from '../../theme/theme';
import {ms, scale, sp, vs} from '../../utils/responsive';
import {ensureSuccess} from '../../utils/apiResponse';
import {
  deleteBrand,
  deleteModel,
  deleteSerialNo,
  getBrandList,
  getModelList,
  getSerialNoList,
  type BrandItem,
  type ModelItem,
  type SerialNoItem,
} from '../../api/brandModel/brandModelService';
import AddEditBrandModal from './AddEditBrandModal';
import AddEditModelModal from './AddEditModelModal';
import AddEditSerialNoModal from './AddEditSerialNoModal';
import { showFailureMsg } from '../../utils/toast';

type Props = {
  ownerId: number;
};

type ViewState =
  | {level: 'brand'}
  | {level: 'model'; brand: BrandItem}
  | {level: 'serial'; brand: BrandItem; model: ModelItem};

const BrandModelInner: React.FC<Props> = ({ownerId}) => {
  const [view, setView] = useState<ViewState>({level: 'brand'});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [serials, setSerials] = useState<SerialNoItem[]>([]);

  const [brandModal, setBrandModal] = useState<{editing: BrandItem | null} | null>(null);
  const [modelModal, setModelModal] = useState<{editing: ModelItem | null} | null>(null);
  const [serialModal, setSerialModal] = useState<{editing: SerialNoItem | null; model?: ModelItem} | null>(null);
  const [modelFor, setModelFor] = useState<{brand: BrandItem; editing: ModelItem | null} | null>(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getBrandList({ownerId});
      setBrands(Array.isArray(response?.ResultData) ? response.ResultData : []);
    } catch {
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  const fetchModels = useCallback(async (brandId: number) => {
    setLoading(true);
    try {
      const response = await getModelList({BrandId: brandId, ownerId});
      setModels(Array.isArray(response?.ResultData) ? response.ResultData : []);
    } catch {
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  const fetchSerials = useCallback(async (brandId: number, modelId: number) => {
    setLoading(true);
    try {
      const response = await getSerialNoList({BrandId: brandId, ModelId: modelId, ownerId});
      setSerials(Array.isArray(response?.ResultData) ? response.ResultData : []);
    } catch {
      setSerials([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  useEffect(() => {
    setSearch('');
  }, [view.level]);

  // Java toolbar titles: Brand Config / Model Config / Serial Config.
  const navigation = useNavigation<any>();
  useEffect(() => {
    navigation.setParams({
      currentSectionTitle: view.level === 'brand' ? 'Brand Config' : view.level === 'model' ? 'Model Config' : 'Serial Config',
    });
  }, [view.level, navigation]);

  const goBack = () => {
    if (view.level === 'serial') {
      setView({level: 'model', brand: view.brand});
    } else if (view.level === 'model') {
      setView({level: 'brand'});
    }
  };

  // Hardware back walks up one level (serial -> model -> brand), like Java's fragment back stack.
  // An open add/edit dialog handles back itself first (its Modal onRequestClose).
  useEffect(() => {
    if (view.level === 'brand') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const goToModelLevel = (brand: BrandItem) => {
    setView({level: 'model', brand});
    if (brand.BrandId) fetchModels(brand.BrandId);
  };

  const goToSerialLevel = (brand: BrandItem, model: ModelItem) => {
    setView({level: 'serial', brand, model});
    if (brand.BrandId && model.ModelId) fetchSerials(brand.BrandId, model.ModelId);
  };

  const refreshCurrentLevel = () => {
    if (view.level === 'brand') {
      fetchBrands();
    } else if (view.level === 'model') {
      if (view.brand.BrandId) fetchModels(view.brand.BrandId);
    } else {
      if (view.brand.BrandId && view.model.ModelId) fetchSerials(view.brand.BrandId, view.model.ModelId);
    }
  };

  const handleDeleteBrand = (brand: BrandItem) => {
    Alert.alert('Delete Brand', `Delete "${brand.BrandName}"? This also removes its models and serial numbers.`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await ensureSuccess(await deleteBrand({BrandId: brand.BrandId ?? 0, ownerId}));
            fetchBrands();
          } catch (e) {
            showFailureMsg(e instanceof Error ? e.message : 'Unable to delete brand.');
          }
        },
      },
    ]);
  };

  const handleDeleteModel = (model: ModelItem) => {
    Alert.alert('Delete Model', `Delete "${model.ModelName}"? This also removes its serial numbers.`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await ensureSuccess(await deleteModel({ModelId: model.ModelId ?? 0, ownerId}));
            if (view.level === 'model') fetchModels(view.brand.BrandId ?? 0);
          } catch (e) {
            showFailureMsg(e instanceof Error ? e.message : 'Unable to delete model.');
          }
        },
      },
    ]);
  };

  const handleDeleteSerial = (serial: SerialNoItem) => {
    Alert.alert('Delete Serial Number', `Delete "${serial.SerialNo}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await ensureSuccess(await deleteSerialNo({SerialNoId: serial.SerialNoId ?? 0, ownerId}));
            if (view.level === 'serial') fetchSerials(view.brand.BrandId ?? 0, view.model.ModelId ?? 0);
          } catch (e) {
            showFailureMsg(e instanceof Error ? e.message : 'Unable to delete serial number.');
          }
        },
      },
    ]);
  };

  // ---- Java brand_management_fragment / model_management_fragment / brand_list / model_list ----
  const noResult = (
    <View style={styles.noResult}>
      <Image source={require('../../../assets/images/noresultfound.png')} style={styles.noResultImg} resizeMode="contain" />
    </View>
  );

  const avatar = (uri?: string | null) =>
    uri ? (
      <Image source={{uri}} style={styles.avatar} />
    ) : (
      <View style={[styles.avatar, styles.avatarDefault]}>
        <DefaultItemIcon size={ms(75)} color="#3a3d3a" />
      </View>
    );

  const actions = (onEdit: () => void, onBox: (() => void) | null, onDelete: () => void) => (
    <View style={styles.actions}>
      <Pressable hitSlop={8} onPress={onEdit}>
        <EditProfileIcon size={ms(22)} color="#000" />
      </Pressable>
      {onBox ? (
        <Pressable hitSlop={8} onPress={onBox} style={styles.actionGap}>
          <ItemOptionIcon size={ms(22)} color="#000" />
        </Pressable>
      ) : null}
      <Pressable hitSlop={8} onPress={onDelete} style={styles.actionGap}>
        <DeleteAccIcon size={ms(22)} color={COLORS.primary} />
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

  const q = search.trim().toLowerCase();

  if (view.level === 'brand') {
    const filtered = brands.filter(b => String(b.BrandName ?? '').toLowerCase().includes(q));
    return (
      <View style={styles.root}>
        <View style={styles.searchRow}>
          <UnderlineSearch value={search} onChangeText={setSearch} placeholder="Search Brand by Name.." style={styles.searchFlex} />
          <Pressable style={styles.addPill} onPress={() => setBrandModal({editing: null})}>
            <Text style={styles.addPillText}>+ Brand</Text>
          </Pressable>
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => `${item.BrandId ?? index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={noResult}
          renderItem={({item}) => (
            <Pressable style={styles.card} onPress={() => goToModelLevel(item)}>
              {avatar(item.ImagePath)}
              <View style={styles.cardBody}>
                <Text numberOfLines={1} style={styles.cardTitle}>
                  {item.BrandName}
                </Text>
                {item.Description ? (
                  <Text numberOfLines={2} style={styles.cardSubtitle}>
                    {item.Description}
                  </Text>
                ) : null}
              </View>
              {actions(
                () => setBrandModal({editing: item}),
                () => setModelFor({brand: item, editing: null}),
                () => handleDeleteBrand(item),
              )}
            </Pressable>
          )}
        />

        <AddEditBrandModal
          visible={!!brandModal}
          ownerId={ownerId}
          editing={brandModal?.editing ?? null}
          onClose={() => setBrandModal(null)}
          onSaved={() => {
            setBrandModal(null);
            fetchBrands();
          }}
        />
        <AddEditModelModal
          visible={!!modelFor}
          ownerId={ownerId}
          brandId={modelFor?.brand.BrandId ?? 0}
          brandName={modelFor?.brand.BrandName ?? ''}
          editing={null}
          onClose={() => setModelFor(null)}
          onSaved={() => {
            setModelFor(null);
          }}
        />
      </View>
    );
  }

  const brandLine = (name?: string) => (
    <Text style={styles.brandLine}>
      Brand Name : <Text style={styles.brandLineRed}>{name}</Text>
    </Text>
  );

  if (view.level === 'model') {
    const filtered = models.filter(m => String(m.ModelName ?? '').toLowerCase().includes(q));
    return (
      <View style={styles.root}>
        <View style={styles.searchRow}>
          <UnderlineSearch value={search} onChangeText={setSearch} placeholder="Search Model by Name.." style={styles.searchFlex} />
        </View>
        {brandLine(view.brand.BrandName)}
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => `${item.ModelId ?? index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={noResult}
          renderItem={({item, index}) => (
            <Pressable style={styles.card} onPress={() => goToSerialLevel(view.brand, item)}>
              <View style={styles.ribbon}>
                <Text style={styles.ribbonText}>#{index + 1}</Text>
              </View>
              {avatar(item.ImagePath)}
              <View style={styles.cardBody}>
                <Text numberOfLines={1} style={styles.cardTitle}>
                  {item.ModelName}
                </Text>
                {item.Description ? (
                  <Text numberOfLines={2} style={styles.cardSubtitle}>
                    {item.Description}
                  </Text>
                ) : null}
              </View>
              {actions(
                () => setModelModal({editing: item}),
                () => setSerialModal({editing: null, model: item}),
                () => handleDeleteModel(item),
              )}
            </Pressable>
          )}
        />

        <AddEditModelModal
          visible={!!modelModal}
          ownerId={ownerId}
          brandId={view.brand.BrandId ?? 0}
          brandName={view.brand.BrandName ?? ''}
          editing={modelModal?.editing ?? null}
          onClose={() => setModelModal(null)}
          onSaved={() => {
            setModelModal(null);
            fetchModels(view.brand.BrandId ?? 0);
          }}
        />
        <AddEditSerialNoModal
          visible={!!serialModal}
          ownerId={ownerId}
          brandId={view.brand.BrandId ?? 0}
          modelId={serialModal?.model?.ModelId ?? 0}
          brandName={view.brand.BrandName ?? ''}
          modelName={serialModal?.model?.ModelName ?? ''}
          editing={null}
          onClose={() => setSerialModal(null)}
          onSaved={() => setSerialModal(null)}
        />
      </View>
    );
  }

  const filteredSerials = serials.filter(s => String(s.SerialNo ?? '').toLowerCase().includes(q));

  return (
    <View style={styles.root}>
      <View style={styles.searchRow}>
        <UnderlineSearch value={search} onChangeText={setSearch} placeholder="Search Serial Number.." style={styles.searchFlex} />
        <Pressable style={styles.addPill} onPress={() => setSerialModal({editing: null, model: view.model})}>
          <Text style={styles.addPillText}>+ Serial</Text>
        </Pressable>
      </View>
      <Text style={styles.brandLine}> Brand/Model Name : 
        <Text style={styles.brandLineRed}>
          {view.brand.BrandName}/{view.model.ModelName}
        </Text>
      </Text>
      <FlatList
        data={filteredSerials}
        keyExtractor={(item, index) => `${item.SerialNoId ?? index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={noResult}
        renderItem={({item, index}) => (
          <View style={[styles.card, styles.serialCard]}>
            <Text style={styles.serialHash}>#{index + 1}</Text>
            <Text numberOfLines={1} style={[styles.cardTitle, {flex: 1, marginLeft: ms(16)}]}>
              {item.SerialNo}
            </Text>
            <Pressable hitSlop={8} onPress={() => setSerialModal({editing: item, model: view.model})}>
              <EditProfileIcon size={ms(22)} color="#000" />
            </Pressable>
            <Pressable hitSlop={8} onPress={() => handleDeleteSerial(item)} style={{marginLeft: ms(20)}}>
              <DeleteAccIcon size={ms(22)} color={COLORS.primary} />
            </Pressable>
          </View>
        )}
      />

      <AddEditSerialNoModal
        visible={!!serialModal}
        ownerId={ownerId}
        brandId={view.brand.BrandId ?? 0}
        modelId={view.model.ModelId ?? 0}
        brandName={view.brand.BrandName ?? ''}
        modelName={view.model.ModelName ?? ''}
        editing={serialModal?.editing ?? null}
        onClose={() => setSerialModal(null)}
        onSaved={() => {
          setSerialModal(null);
          refreshCurrentLevel();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    marginTop: ms(11),
    backgroundColor: COLORS.white,
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    overflow: 'hidden',
  },
  loadingContainer: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(15),
    paddingTop: ms(10),
    gap: ms(12),
  },
  searchFlex: {flex: 1},
  addPill: {
    width: ms(60),
    height: ms(30),
    borderRadius: ms(15),
    backgroundColor: COLORS.textBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPillText: {color: '#fff', fontSize: sp(12)},
  brandLine: {
    textAlign: 'center',
    fontSize: sp(18),
    fontWeight: '700',
    color: '#000',
    marginTop: ms(8),
    marginBottom: ms(8),
  },
  brandLineRed: {color: COLORS.primary, fontWeight: '400'},
  listContent: {paddingHorizontal: ms(10), paddingTop: ms(8), paddingBottom: ms(110), flexGrow: 1},
  card: {
    minHeight: ms(130),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: ms(10),
    padding: ms(10),
    marginVertical: ms(5),
    marginHorizontal: ms(5),
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 1},
    overflow: 'hidden',
  },
  serialCard: {minHeight: ms(70), paddingHorizontal: ms(16)},
  serialHash: {fontSize: sp(18), color: COLORS.primary},
  avatar: {width: ms(75), height: ms(75), borderRadius: ms(37.5)},
  avatarDefault: {alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff'},
  cardBody: {flex: 1, marginHorizontal: ms(10), justifyContent: 'center'},
  cardTitle: {fontSize: sp(16), fontWeight: '700', color: COLORS.ink},
  cardSubtitle: {fontSize: sp(14), color: COLORS.lightGray, marginTop: ms(6)},
  actions: {width: ms(30), alignItems: 'center', alignSelf: 'flex-start', marginTop: ms(2)},
  actionGap: {marginTop: ms(12)},
  ribbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: ms(20),
    height: ms(25),
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: ms(10),
    zIndex: 2,
  },
  ribbonText: {color: '#fff', fontSize: sp(14)},
  noResult: {alignItems: 'center', justifyContent: 'center', marginTop: ms(60)},
  noResultImg: {width: ms(200), height: ms(200)},
});

// Java: red page with a 30dp-rounded white sheet (CardView) under the toolbar.
const BrandModelTabHost: React.FC<Props> = props => (
  <View style={{flex: 1, backgroundColor: COLORS.primary}}>
    <BrandModelInner {...props} />
  </View>
);

export default BrandModelTabHost;
