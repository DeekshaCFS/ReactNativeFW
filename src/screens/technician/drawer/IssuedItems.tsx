// src/screens/technician/drawer/IssuedItems.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Image,
  Pressable, ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../../../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { ms, sp, scale } from '../../../utils/responsive';
import { getItemIssueListByUserid } from '../../../api/item/itemService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ItemIssueListResultData } from '../../../api/item/item.types';

// Java's R.drawable.ic_default_item vector
function DefaultItemIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 754 754">
      <Path fill="#c12033" d="m185.9,352.9l-67.1,-2.8c-0.8,-12.4 -0.4,-33.3 0.9,-45.6l-47.6,-20.9 13.3,-65.4 65.6,3.3q8.1,-13 18.2,-24.9l-9.8,-66.5 45.6,-31.6 41,40.4c13.2,-5.9 26.9,-10.4 40.8,-13.4l17,-56 62.8,-0.3 -1.1,53.5 -0.7,31.3v0.3l-2.2,22c-50.5,-9.2 -104.5,5.7 -143.5,44.7 -36.3,36.3 -38.5,84.7 -33.2,131.9z" />
      <Path fill="#c12033" d="m528.4,337.2l53.9,3.5c0.8,12.4 0.6,24.8 -0.7,37l47.4,29.5 -9.4,61 -69.5,1.1q-8.1,13 -18.2,24.9l23.8,68 -56.4,30.2 -44.2,-40.5c-13.2,5.9 -26.9,10.4 -40.8,13.4l-17,56 -62.8,0.3 1.1,-53.6 0.7,-31.2v-0.3l2.3,-22c50.4,9.2 104.4,-5.7 143.4,-44.7 36.3,-36.3 51.7,-85.4 46.4,-132.6z" />
      <Path fill="#363936" d="m273,613.7c-39.1,39.1 -95.6,50.4 -144.7,34l79.8,-79.9c5.3,-5.2 5.3,-13.8 0,-19l-67.9,-68c-5.3,-5.2 -13.8,-5.2 -19.1,0l-80.8,80.8c-17.9,-49.8 -6.9,-107.7 33.1,-147.6 40,-40 98.2,-51 148.2,-32.8l168,-168c-12.4,-47 -0.1,-99.1 36.7,-135.9 39.1,-39.1 95.6,-50.5 144.7,-34l-81.6,81.6c-4.3,4.3 -4.3,11.3 0,15.6l71.5,71.4c4.3,4.3 11.2,4.3 15.5,0l82.6,-82.5c17.9,49.8 6.8,107.6 -33.1,147.6 -40.9,40.9 -100.7,51.4 -151.3,31.6l-165.9,165.9c13.9,47.8 2,101.5 -35.7,139.2z" />
    </Svg>
  );
}

function ItemThumb({ uri }: { uri?: string }) {
  const [failed, setFailed] = useState(false);
  const size = ms(70);
  if (!uri || failed) {
    return (
      <View style={[styles.thumb, { width: size, height: size }]}>
        <DefaultItemIcon size={size} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={[styles.thumb, { width: size, height: size }]}
      onError={() => setFailed(true)}
    />
  );
}

export default function IssuedItems() {
  const navigation = useNavigation<any>();

  const [items, setItems] = useState<ItemIssueListResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Maps to Java's TechItemsInventoryFragmentNew, which calls
  // Item/GetAssignedItemsListByUserId(UserId) and filters the adapter by item Name.
  useEffect(() => {
    (async () => {
      try {
        const uid = await AsyncStorage.getItem('uid');
        const userId = Number(uid) || 0;
        const res = await getItemIssueListByUserid({ UserId: userId });
        setItems(res.ResultData ?? []);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = search.trim()
    ? items.filter(it => it.Name?.toLowerCase().includes(search.trim().toLowerCase()))
    : items;

  return (
    <View style={styles.root}>
      {/* Tabs */}
      <View style={styles.tabRow}>
        <Pressable style={styles.activeTab}>
          <Text style={styles.activeTabText}>ISSUED ITEMS</Text>
        </Pressable>
        <Pressable
          style={styles.inactiveTab}
          onPress={() => navigation.navigate('Requested Items')}
        >
          <Text style={styles.inactiveTabText}>REQUESTED ITEMS</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={scale(20)} color="#888" />
        <TextInput
          placeholder="Search here"
          style={styles.searchInput}
          placeholderTextColor="#888"
          returnKeyType="search"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => setSearch('')}>
            <Ionicons name="close" size={scale(20)} color="#888" />
          </Pressable>
        )}
      </View>

      <View style={styles.listWrapper}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: ms(40) }} color={COLORS.primary} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.Id)}
            contentContainerStyle={{ paddingBottom: ms(120), paddingHorizontal: ms(10) }}
            showsVerticalScrollIndicator={false}
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
              <View style={styles.card}>
                <View style={[styles.taskBadge, !item.TaskId && styles.taskBadgeDirect]}>
                  <Text style={styles.taskText} numberOfLines={1}>
                    {item.TaskId ? `TASK ID: ${item.TaskId}` : '     DIRECT   '}
                  </Text>
                </View>
                <View style={[styles.cardBody, !!item.TaskId && { marginTop: ms(26) }]}>
                  <ItemThumb uri={item.ItemImagePath} />
                  <View style={styles.info}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.Name}</Text>
                    <View style={styles.availRow}>
                      <Text style={[styles.itemSub, { flex: 0.3 }]}>Available:</Text>
                      <Text style={[styles.itemSub, { flex: 0.7 }]}>{item.Quantity}</Text>
                    </View>
                    <View style={styles.noteRow}>
                      <Text style={styles.itemSub}>Note :</Text>
                      <Text style={[styles.itemSub, { marginLeft: ms(5), flexShrink: 1 }]} numberOfLines={2}>
                        {item.Description ?? ''}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>
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
    marginBottom: ms(8),
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  activeTab: {
    borderBottomWidth: ms(3),
    borderColor: COLORS.primary,
    backgroundColor: '#f5d7d784',
    paddingVertical: ms(10),
    height: ms(48),
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabText: {
    fontSize: sp(13),
    fontWeight: '600',
    color: COLORS.primary,
  },
  inactiveTab: {
    paddingVertical: ms(10),
    height: ms(48),
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%',
  },
  inactiveTabText: {
    fontSize: sp(13),
    fontWeight: '400',
    color: COLORS.textQuaternary,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: ms(6),
    paddingTop: ms(4),
    marginHorizontal: ms(16),
    paddingBottom: ms(4),
  },
  searchInput: {
    flex: 1,
    marginHorizontal: ms(10),
    fontSize: sp(16),
    color: COLORS.textPrimary,
    height: ms(40),
  },

  listWrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: ms(10),
    padding: ms(5),
    margin: ms(5),
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  taskBadge: {
    position: 'absolute',
    top: ms(5),
    right: ms(5),
    backgroundColor: COLORS.primary,
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    borderRadius: ms(8),
  },
  taskBadgeDirect: {
    backgroundColor: '#000',
  },
  taskText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: sp(12),
  },
  cardBody: {
    flexDirection: 'row',
    marginTop: ms(5),
  },
  thumb: {
    borderRadius: ms(35),
    marginBottom: ms(5),
    overflow: 'hidden',
  },
  info: {
    flex: 1,
  },
  itemTitle: {
    fontSize: sp(14),
    fontWeight: 'bold',
    marginTop: ms(5),
    marginBottom: ms(5),
    marginRight: ms(70),
    color: '#1d2536',
  },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteRow: {
    flexDirection: 'row',
  },
  itemSub: {
    fontSize: sp(14),
    color: '#1d2536',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: ms(60),
  },
  emptyImage: {
    width: scale(180),
    height: scale(180),
  },
});
