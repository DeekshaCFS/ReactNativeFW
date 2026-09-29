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

type Props = {
  ownerId: number;
};

type ViewState =
  | {level: 'brand'}
  | {level: 'model'; brand: BrandItem}
  | {level: 'serial'; brand: BrandItem; model: ModelItem};

const BrandModelTabHost: React.FC<Props> = ({ownerId}) => {
  const [view, setView] = useState<ViewState>({level: 'brand'});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [serials, setSerials] = useState<SerialNoItem[]>([]);

  const [brandModal, setBrandModal] = useState<{editing: BrandItem | null} | null>(null);
  const [modelModal, setModelModal] = useState<{editing: ModelItem | null} | null>(null);
  const [serialModal, setSerialModal] = useState<{editing: SerialNoItem | null} | null>(null);

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

  const goBack = () => {
    if (view.level === 'serial') {
      setView({level: 'model', brand: view.brand});
    } else if (view.level === 'model') {
      setView({level: 'brand'});
    }
  };

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
            Alert.alert('Delete Brand', e instanceof Error ? e.message : 'Unable to delete brand.');
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
            Alert.alert('Delete Model', e instanceof Error ? e.message : 'Unable to delete model.');
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
            Alert.alert('Delete Serial Number', e instanceof Error ? e.message : 'Unable to delete serial number.');
          }
        },
      },
    ]);
  };

  const renderHeader = () => {
    const title =
      view.level === 'brand' ? 'Brand Management' : view.level === 'model' ? view.brand.BrandName ?? 'Brand' : view.model.ModelName ?? 'Model';

    const onAddPress = () => {
      if (view.level === 'brand') {
        setBrandModal({editing: null});
      } else if (view.level === 'model') {
        setModelModal({editing: null});
      } else {
        setSerialModal({editing: null});
      }
    };

    return (
      <View style={styles.headerRow}>
        {view.level !== 'brand' ? (
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

  if (view.level === 'brand') {
    const filtered = brands.filter(b => String(b.BrandName ?? '').toLowerCase().includes(search.trim().toLowerCase()));
    return (
      <View style={styles.root}>
        {renderHeader()}
        {renderSearch()}
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => `${item.BrandId ?? index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No brands yet.</Text>}
          renderItem={({item}) => (
            <Pressable style={styles.card} onPress={() => goToModelLevel(item)}>
              {item.ImagePath ? (
                <Image source={{uri: item.ImagePath}} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Ionicons name="pricetags-outline" size={sp(20)} color={COLORS.primary} />
                </View>
              )}
              <View style={styles.cardBody}>
                <Text numberOfLines={1} style={styles.cardTitle}>
                  {item.BrandName}
                </Text>
                {item.Description ? (
                  <Text numberOfLines={1} style={styles.cardSubtitle}>
                    {item.Description}
                  </Text>
                ) : null}
              </View>
              <Pressable hitSlop={8} onPress={() => setBrandModal({editing: item})}>
                <Text style={styles.iconText}>✎</Text>
              </Pressable>
              <Pressable hitSlop={8} onPress={() => handleDeleteBrand(item)}>
                <Text style={styles.iconText}>🗑</Text>
              </Pressable>
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
      </View>
    );
  }

  if (view.level === 'model') {
    const filtered = models.filter(m => String(m.ModelName ?? '').toLowerCase().includes(search.trim().toLowerCase()));
    return (
      <View style={styles.root}>
        {renderHeader()}
        {renderSearch()}
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => `${item.ModelId ?? index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No models yet.</Text>}
          renderItem={({item}) => (
            <Pressable style={styles.card} onPress={() => goToSerialLevel(view.brand, item)}>
              {item.ImagePath ? (
                <Image source={{uri: item.ImagePath}} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Ionicons name="cube-outline" size={sp(20)} color={COLORS.primary} />
                </View>
              )}
              <View style={styles.cardBody}>
                <Text numberOfLines={1} style={styles.cardTitle}>
                  {item.ModelName}
                </Text>
                {item.Description ? (
                  <Text numberOfLines={1} style={styles.cardSubtitle}>
                    {item.Description}
                  </Text>
                ) : null}
              </View>
              <Pressable hitSlop={8} onPress={() => setModelModal({editing: item})}>
                <Text style={styles.iconText}>✎</Text>
              </Pressable>
              <Pressable hitSlop={8} onPress={() => handleDeleteModel(item)}>
                <Text style={styles.iconText}>🗑</Text>
              </Pressable>
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
      </View>
    );
  }

  const filteredSerials = serials.filter(s => String(s.SerialNo ?? '').toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <View style={styles.root}>
      {renderHeader()}
      {renderSearch()}
      <FlatList
        data={filteredSerials}
        keyExtractor={(item, index) => `${item.SerialNoId ?? index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No serial numbers yet.</Text>}
        renderItem={({item}) => (
          <View style={styles.card}>
            <View style={[styles.thumb, styles.thumbPlaceholder]}>
              <Ionicons name="barcode-outline" size={sp(20)} color={COLORS.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text numberOfLines={1} style={styles.cardTitle}>
                {item.SerialNo}
              </Text>
            </View>
            <Pressable hitSlop={8} onPress={() => setSerialModal({editing: item})}>
              <Text style={styles.iconText}>✎</Text>
            </Pressable>
            <Pressable hitSlop={8} onPress={() => handleDeleteSerial(item)}>
              <Text style={styles.iconText}>🗑</Text>
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

export default BrandModelTabHost;
