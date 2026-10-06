// src/navigation/tabScreenHelpers.tsx
//
// Helpers for screens that are registered inside a tab navigator (hidden from
// the tab bar) so the shared BottomTabBar shows under them.

import React from 'react';
import { Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { COLORS } from '../theme/theme';
import { ms, HEADER_BAR_HEIGHT } from '../utils/responsive';

/**
 * Stack screens unmount when popped; tab screens stay mounted once visited.
 * Rendering nothing while blurred gives these screens the same fresh state on
 * every visit (task timer, forms, route params) as they had in the stack.
 */
export function unmountOnBlur<P extends object>(
  Screen: React.ComponentType<P>,
): React.ComponentType<P> {
  const Wrapped = (props: P) => (useIsFocused() ? <Screen {...props} /> : null);
  Wrapped.displayName = `UnmountOnBlur(${Screen.displayName || Screen.name || 'Screen'})`;
  return Wrapped;
}

/** Red back-arrow header matching the native stack header these screens had. */
export const pushedScreenOptions = (title: string, navigation: any) => ({
  headerShown: true,
  title,
  headerStyle: { backgroundColor: COLORS.primary, height: HEADER_BAR_HEIGHT },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' as const },
  headerTitleAlign: 'left' as const,
  headerLeft: () => (
    <Pressable
      onPress={() => navigation.goBack()}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={{ paddingHorizontal: ms(16) }}
    >
      <Ionicons name="arrow-back" size={ms(24)} color="#fff" />
    </Pressable>
  ),
});
