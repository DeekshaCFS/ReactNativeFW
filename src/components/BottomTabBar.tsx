// src/components/BottomTabBar.tsx

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/theme';
import { FabIcon, isFabIcon } from './FabIcons';
import { setPassbookTabOrder } from '../state/passbookTabOrder';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { ms, sp, scale } from '../utils/responsive';
import TourTarget from '../tour/TourTarget';

const TAB_ICONS: Record<string, string> = {
  Home: 'home-outline',
  Task: 'document-text-outline',
  Attendance: 'calendar-clear-outline',
  Passbook: 'book-outline',
  CRM: 'people-outline',
  Employee: 'person-outline',
};

// `route` triggers a plain tab/stack navigation (technician's default use).
// `onPress` lets a caller run custom logic instead (e.g. admin opens a local
// modal or navigates with params) — exactly one of the two is expected.
export type QuickAction = {
  route?: string;
  onPress?: () => void;
  icon: string;
  label: string;
};

type Props = BottomTabBarProps & {
  quickActions?: QuickAction[];
  /** Tabs to list in the bar. The navigator may also hold screens that are
   *  reachable but not tabs (pushed-style screens); those are left out. */
  visibleTabs?: string[];
  /** Highlight another tab while a hidden screen is focused (e.g. Leave -> Attendance). */
  activeAlias?: Record<string, string>;
};

const BottomTabBar = ({ state, navigation, quickActions = [], visibleTabs, activeAlias }: Props) => {
  const [fabOpen, setFabOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const rawCurrent = state.routes[state.index]?.name;
  const current = activeAlias?.[rawCurrent] ?? rawCurrent;

  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? ms(4) : 0);

  const tab = (route: typeof state.routes[number]) => {
    const name = route.name;
    const active = current === name;
    const icon = TAB_ICONS[name] ?? 'ellipse-outline';
    const button = (
      <Pressable
        key={name}
        onPress={() => {
          setFabOpen(false);
          // Mirror React Navigation's default tab button: emit tabPress so a
          // focused screen's own listener (useFocusEffect/addListener) can
          // react to a re-tap, e.g. refresh its data.
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!event.defaultPrevented) {
            if (name === 'Passbook') setPassbookTabOrder('passbookFirst');
            navigation.navigate(name as never);
          }
        }}
        style={styles.item}
        accessibilityRole="button"
        accessibilityLabel={name}
      >
        <Ionicons
          name={icon}
          size={scale(24)}
          color={active ? COLORS.primary : '#484a4e'}
        />
        <Text
          style={[styles.label, { color: active ? COLORS.primary : '#484a4e' }]}
          numberOfLines={1}
        >
          {name}
        </Text>
      </Pressable>
    );
    // Only the technician's on-demand App Tour targets this tab; wrapping it
    // unconditionally is harmless since TourTarget is inert without an
    // active tour.
    return name === 'Task' ? (
      <TourTarget key={name} tourKey="taskTab" style={styles.item}>
        {button}
      </TourTarget>
    ) : (
      button
    );
  };

  const navigateFromFab = (action: QuickAction) => {
    setFabOpen(false);
    if (action.onPress) {
      action.onPress();
    } else if (action.route) {
      navigation.navigate(action.route as never);
    }
  };

  const FAB_SIZE = ms(56);
  const hasFab = quickActions.length > 0;

  const tabRoutes = visibleTabs
    ? state.routes.filter(r => visibleTabs.includes(r.name))
    : state.routes;
  const midpoint = Math.ceil(tabRoutes.length / 2);
  const firstHalf = tabRoutes.slice(0, midpoint);
  const secondHalf = tabRoutes.slice(midpoint);

  return (
    <>
      {/* Overlay */}
      {fabOpen && (
        <Pressable style={styles.overlay} onPress={() => setFabOpen(false)} />
      )}

      {/* Bottom Sheet */}
      {fabOpen && (
        <View style={[styles.bottomSheet, { paddingBottom: bottomPad + ms(16) }]}>
          <Pressable style={styles.closeBtn} onPress={() => setFabOpen(false)}>
            <Ionicons name="close" size={scale(30)} color={COLORS.primary} />
          </Pressable>

          {quickActions.map((action, i) => (
            <Pressable
              key={action.route ?? action.label}
              style={[styles.sheetItem, i === quickActions.length - 1 && { marginBottom: scale(14) }]}
              onPress={() => navigateFromFab(action)}
            >
              {isFabIcon(action.icon) ? (
                <FabIcon name={action.icon} size={scale(30)} />
              ) : (
                <Ionicons name={action.icon} size={scale(28)} color={COLORS.primary} />
              )}
              <Text style={styles.sheetText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Tab Bar */}
      <View style={[styles.container, { paddingBottom: bottomPad }]}>
        {firstHalf.map(route => tab(route))}

        {hasFab && (
          <Pressable
            onPress={() => setFabOpen(!fabOpen)}
            style={styles.center}
            accessibilityRole="button"
            accessibilityLabel="Quick actions"
          >
            <View style={[styles.fab, { width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2 }]}>
              <Ionicons name="add" size={scale(26)} color="#fff" />
            </View>
          </Pressable>
        )}

        {secondHalf.map(route => tab(route))}
      </View>
    </>
  );
};

export default BottomTabBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    paddingTop: ms(10),
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -3 },
    zIndex: 1,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: ms(4),
    minHeight: ms(44), 
  },
  label: {
    fontSize: sp(11),
    marginTop: ms(2),
    fontWeight: '500',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -ms(14),
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.dialogDim,
    zIndex: 5,
  },
  // Java dialog_add_tech_options: white card, 30dp corners, 20dp padding; rows are 10dp
  // padded with the icon at 55dp and the 16sp bold label 30dp after it.
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: scale(30),
    padding: scale(20),
    elevation: 20,
    zIndex: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: scale(8),
    right: scale(4),
    zIndex: 1,
    padding: scale(4),
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(5),
    padding: scale(10),
    paddingLeft: scale(56),
  },
  sheetText: {
    fontSize: sp(16),
    fontWeight: '700',
    marginLeft: scale(30),
    color: COLORS.ink,
  },
});