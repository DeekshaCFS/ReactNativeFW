// src/screens/technician/main/TodayTasksMapScreen.tsx
//
// Java TechnTaskRouteMapFragment (tech_task_route_map.xml), opened from the toolbar's "Track
// Task" pin: a 370dp map on top with a numbered pin on every task of today (title = task name,
// snippet = "<customer> - <km> KM - Time : <h>Hrs <m>min") and a line from the technician to
// each one, then the list of today's tasks (tech_task_route_map_row) underneath.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../../theme/theme';
import { ms, sp } from '../../../utils/responsive';
import { getTodayTaskList } from '../../../api/task/taskService';
import type { TasksListResultData as Task } from '../../../api/task/task.types';
import { requestLocationPermission, getCurrentPosition, Coordinates } from '../../../utils/locationPermision';
import { FIELDWEB_MAP_STYLE } from '../../../config/mapStyle';
import TaskListCard from '../../../components/TaskListCard';
import { showFailureMsg } from '../../../utils/toast';

const MAP_HEIGHT = ms(370);
const SPEED_KMPH = 60; // Java: fixed 60 km/h for the time estimate

/** Java SphericalUtil.computeDistanceBetween, in metres. */
const distanceMetres = (a: Coordinates, b: Coordinates) => {
  const R = 6371009;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const isToday = (taskDate?: string) => {
  if (!taskDate) return false;
  const d = new Date(taskDate.replace(' ', 'T'));
  return !Number.isNaN(d.getTime()) && d.toDateString() === new Date().toDateString();
};

export default function TodayTasksMapScreen({ navigation }: any) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Coordinates | null>(null);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    (async () => {
      const uid = Number(await AsyncStorage.getItem('uid'));
      try {
        const res = await getTodayTaskList({ UserId: uid, pageIndex: 1, AllData: false });
        const todays = (res?.ResultData ?? []).filter(t => isToday(t.TaskDate));
        if (todays.length === 0) {
          // Java: the pin only opens the screen when there is something to show.
          showFailureMsg('There is no Task assigned for you today!');
          navigation.navigate('Home');
          return;
        }
        setTasks(todays);
      } catch {
        showFailureMsg("Unable to load today's tasks.");
      } finally {
        setLoading(false);
      }
    })();
    (async () => {
      if (!(await requestLocationPermission())) return;
      try {
        setMe(await getCurrentPosition());
      } catch {
        // map still shows the task pins
      }
    })();
  }, [navigation]);

  const pins = tasks
    .map((task, i) => {
      const latitude = parseFloat(task.Latitude ?? '');
      const longitude = parseFloat(task.Longitude ?? '');
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) {
        return null;
      }
      const coord = { latitude, longitude };
      let snippet = task.CustomerName ?? '';
      if (me) {
        // Java (TechnTaskRouteMapFragment.onMapReady) calls no distance API: straight-line
        // SphericalUtil distance from the technician's last location to the task's
        // Latitude/Longitude, rounded to whole km (a double, so it prints as "123.0"), and the
        // time is that rounded km at a fixed 60 km/h.
        const km = Math.round(distanceMetres(me, coord) / 1000);
        const hours = km / SPEED_KMPH;
        const h = Math.floor(hours);
        const m = Math.floor((hours - h) * 60);
        snippet = `${snippet} - ${km.toFixed(1)} KM - Time : ${h}Hrs ${m}min`;
      }
      return { task, coord, snippet, number: i + 1 };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const fitAll = useCallback(() => {
    if (pins.length === 0) return;
    // Java fits the camera to the task pins (padding 150); a lone pin would zoom to the
    // maximum level, so it gets a street-level region instead.
    if (pins.length === 1) {
      mapRef.current?.animateToRegion({ ...pins[0].coord, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 0);
      return;
    }
    mapRef.current?.fitToCoordinates(pins.map(p => p.coord), {
      edgePadding: { top: 150, right: 150, bottom: 150, left: 150 },
      animated: false,
    });
  }, [pins]);

  useEffect(() => {
    fitAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={FIELDWEB_MAP_STYLE}
          showsUserLocation
          showsMyLocationButton={false}
          zoomControlEnabled
          onMapReady={fitAll}
        >
          {me && pins.map(p => (
            <Polyline
              key={`line-${p.task.Id}`}
              coordinates={[me, p.coord]}
              strokeColor="#000"
              strokeWidth={2}
            />
          ))}
          {pins.map(p => (
            <Marker
              key={`pin-${p.task.Id}`}
              coordinate={p.coord}
              title={p.task.Name}
              description={p.snippet}
              tracksViewChanges
            >
              <View style={styles.numberPin}>
                <Text style={styles.numberText}>#{p.number}</Text>
              </View>
            </Marker>
          ))}
        </MapView>

        <FlatList
          data={tasks}
          keyExtractor={t => String(t.Id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <TaskListCard task={item} onPress={() => {}} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primary },
  center: { alignItems: 'center', justifyContent: 'center' },
  card: { flex: 1, backgroundColor: COLORS.white },
  map: { width: '100%', height: MAP_HEIGHT },
  list: { paddingTop: ms(12), paddingHorizontal: ms(10), paddingBottom: ms(20) },
  // layout/marker_layout.xml + drawable/marker_background.xml
  numberPin: {
    minWidth: ms(30),
    padding: ms(4),
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: '#fff',
  },
  numberText: { color: '#fff', fontSize: sp(14), fontWeight: 'bold' },
});
