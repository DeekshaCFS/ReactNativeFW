// src/screens/technician/main/SyncOfflineScreen.tsx
//
// Java: SyncData/SyncOfflineDataFragment (fragment_sync.xml + offline_sync_label_adapter.xml).
// Lists the tasks whose work was stored on the device and lets the technician post each one,
// or discard everything with "Clear All Records".

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../../theme/theme';
import { ms, sp } from '../../../utils/responsive';
import {
  clearPendingTasks,
  getPendingTasks,
  subscribeOffline,
  type PendingTask,
} from '../../../offline/offlineStore';
import { syncPendingTask } from '../../../offline/offlineSync';
import { getNetworkQuality, isPostable, resetNetworkQualityCache } from '../../../offline/networkQuality';

export default function SyncOfflineScreen({ navigation }: any) {
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const reload = useCallback(async () => {
    const uid = Number(await AsyncStorage.getItem('uid'));
    setTasks(await getPendingTasks(uid || undefined));
  }, []);

  useEffect(() => {
    reload();
    return subscribeOffline(reload);
  }, [reload]);

  const handleSync = async (task: PendingTask) => {
    resetNetworkQualityCache();
    if (!isPostable(await getNetworkQuality())) {
      Alert.alert('No Connection', 'Please connect to a stronger network to sync.');
      return;
    }
    setSyncingId(task.taskId);
    const result = await syncPendingTask(task.taskId);
    setSyncingId(null);
    if (result.ok) {
      // Java returns to the dashboard once the last pending task has been posted.
      const remaining = await getPendingTasks(task.userId);
      if (remaining.length === 0) navigation.navigate('Home');
    } else {
      Alert.alert('Sync Failed', result.message);
    }
  };

  const handleClear = async () => {
    const uid = Number(await AsyncStorage.getItem('uid'));
    await clearPendingTasks(uid || undefined);
    navigation.navigate('Home');
  };

  return (
    <View style={styles.root}>
      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerText, styles.colSr]}>Sr. No</Text>
          <Text style={[styles.headerText, styles.colTask]}>Task Id</Text>
          <Text style={[styles.headerText, styles.colStatus]}>Sync Status</Text>
          <Text style={[styles.headerText, styles.colAction]}>Action</Text>
        </View>

        <FlatList
          data={tasks}
          keyExtractor={t => String(t.taskId)}
          style={styles.list}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={[styles.cellSr, styles.colSr]}>{index + 1}.</Text>
              <Text style={[styles.cell, styles.colTask]} numberOfLines={1}>{item.newTaskId}</Text>
              <Text style={[styles.cell, styles.colStatus]}>PENDING</Text>
              <View style={styles.colAction}>
                <Pressable
                  style={styles.syncButton}
                  disabled={syncingId !== null}
                  onPress={() => handleSync(item)}
                >
                  <Text style={styles.syncText}>{syncingId === item.taskId ? '...' : 'Sync'}</Text>
                </Pressable>
              </View>
            </View>
          )}
        />

        <Pressable style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearText}>Clear All Records</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primary },
  // fragment_sync.xml: white CardView, 30dp corners, 20dp gap under the toolbar.
  sheet: {
    flex: 1,
    marginTop: ms(20),
    padding: ms(8),
    backgroundColor: COLORS.white,
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: ms(8), backgroundColor: '#E0E0E0' },
  headerText: { fontSize: sp(16), fontWeight: 'bold', textAlign: 'center', color: COLORS.textBlack },
  list: { margin: ms(10) },
  row: { flexDirection: 'row', alignItems: 'center', padding: ms(8) },
  cell: { fontSize: sp(14), textAlign: 'center', color: COLORS.textBlack },
  cellSr: { fontSize: sp(14), fontWeight: 'bold', textAlign: 'left', color: COLORS.textBlack },
  colSr: { flex: 0.5 },
  colTask: { flex: 1.5 },
  colStatus: { flex: 2 },
  colAction: { flex: 2, alignItems: 'center' },
  syncButton: {
    alignSelf: 'stretch',
    height: ms(30),
    marginHorizontal: ms(4),
    borderRadius: ms(34),
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncText: { fontSize: sp(15), fontWeight: 'bold', color: COLORS.primary },
  clearButton: {
    alignSelf: 'center',
    margin: ms(15),
    paddingHorizontal: ms(16),
    paddingVertical: ms(10),
    borderRadius: ms(4),
    backgroundColor: '#D6D7D7',
  },
  clearText: { fontSize: sp(14), fontWeight: 'bold', color: COLORS.textBlack },
});
