// src/screens/technician/drawer/IssuedItems.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  Pressable, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { ms, sp, scale, hp } from '../../../utils/responsive';
import { getItemIssueListByUserid } from '../../../api/item/itemService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ItemIssueListResultData } from '../../../api/item/item.types';

export default function IssuedItems() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : insets.top;

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
            contentContainerStyle={{ paddingBottom: ms(120), paddingHorizontal: ms(16), paddingTop: ms(8) }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No issued items found.</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.taskBadge}>
                  <Text style={styles.taskText} numberOfLines={1}>
                    TASK ID: {item.TaskId}
                  </Text>
                </View>
                <Text style={styles.itemTitle}>{item.Name}</Text>
                <Text style={styles.itemSub}>Available: {item.Quantity}</Text>
                <Text style={styles.itemSub}>Note: {item.Description || 'na'}</Text>
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
    backgroundColor: '#f7f7f7',
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
    marginBottom: ms(8),
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
    borderRadius: ms(16),
    padding: ms(16),
    marginBottom: ms(14),
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  taskBadge: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    paddingHorizontal: ms(12),
    paddingVertical: ms(4),
    borderRadius: ms(8),
    marginBottom: ms(8),
  },
  taskText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: sp(12),
  },
  itemTitle: {
    fontSize: sp(16),
    fontWeight: '600',
    marginBottom: ms(4),
    color: COLORS.textPrimary,
  },
  itemSub: {
    fontSize: sp(14),
    color: '#555',
    marginBottom: ms(2),
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: sp(14),
    marginTop: ms(40),
  },
});