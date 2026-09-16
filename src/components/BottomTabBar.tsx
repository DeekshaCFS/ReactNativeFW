// src/components/BottomTabBar.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { ms, sp, scale } from '../utils/responsive';

const TAB_ICONS: Record<string, string> = {
  Home: 'home-outline',
  Task: 'document-text-outline',
  Attendance: 'calendar-clear-outline',
  Passbook: 'book-outline',
  CRM: 'people-outline',
  Employee: 'person-outline',
};

export type QuickAction = { route: string; icon: string; label: string };

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { route: 'AddQuote', icon: 'cube-outline', label: 'Add Quote' },
  { route: 'AddInvoice', icon: 'document-text-outline', label: 'Add Invoice' },
  { route: 'AddLead', icon: 'people-outline', label: 'Add Lead' },
];

type Props = BottomTabBarProps & {
  quickActions?: QuickAction[];
};

const BottomTabBar = ({ state, navigation, quickActions = DEFAULT_QUICK_ACTIONS }: Props) => {
  const [fabOpen, setFabOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index].name;

  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? ms(4) : 0);

  const tab = (name: string) => {
    const active = current === name;
    const icon = TAB_ICONS[name] ?? 'ellipse-outline';
    return (
      <Pressable
        key={name}
        onPress={() => {
          setFabOpen(false);
          navigation.navigate(name as never);
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
  };

  const navigateFromFab = (route: string) => {
    setFabOpen(false);
    navigation.navigate(route as never);
  };

  const FAB_SIZE = ms(56);
  const hasFab = quickActions.length > 0;

  const midpoint = Math.ceil(state.routes.length / 2);
  const firstHalf = state.routes.slice(0, midpoint);
  const secondHalf = state.routes.slice(midpoint);

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
            <Ionicons name="close" size={scale(32)} color={COLORS.primary} />
          </Pressable>

          {quickActions.map(({ route, icon, label }) => (
            <Pressable
              key={route}
              style={styles.sheetItem}
              onPress={() => navigateFromFab(route)}
            >
              <Ionicons name={icon} size={scale(28)} color={COLORS.primary} />
              <Text style={styles.sheetText}>{label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Tab Bar */}
      <View style={[styles.container, { paddingBottom: bottomPad }]}>
        {firstHalf.map(route => tab(route.name))}

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

        {secondHalf.map(route => tab(route.name))}
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 5,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(32),
    borderTopRightRadius: ms(32),
    paddingTop: ms(12),
    paddingHorizontal: ms(24),
    elevation: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginBottom: ms(16),
    padding: ms(4),
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(24),
    marginLeft: ms(40),
  },
  sheetText: {
    fontSize: sp(18),
    fontWeight: '600',
    marginLeft: ms(24),
    color: '#1f2937',
  },
});