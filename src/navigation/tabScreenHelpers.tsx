// src/navigation/tabScreenHelpers.tsx
//
// Helpers for screens that are registered inside a tab navigator (hidden from
// the tab bar) so the shared BottomTabBar shows under them.

import React, { useEffect } from 'react';
import { BackHandler, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused, useNavigation, useNavigationState, useRoute } from '@react-navigation/native';
import { HeaderTitle } from '@react-navigation/elements';
import { useTranslation } from 'react-i18next';
import { tr } from '../i18n/tr';
import { COLORS } from '../theme/theme';
import { ms, HEADER_BAR_HEIGHT } from '../utils/responsive';

/** Screens opened from the Settings screen; back returns there instead of Home. */
const SETTINGS_SUBSCREENS = ['TermsAndConditions', 'PrivacyPolicy', 'RefundPolicy', 'AboutFieldweb', 'Feedback', 'BankDetailsTax'];

/**
 * Stack screens unmount when popped; tab screens stay mounted once visited.
 * Rendering nothing while blurred gives these screens the same fresh state on
 * every visit (task timer, forms, route params) as they had in the stack.
 */
export function unmountOnBlur<P extends object>(
  Screen: React.ComponentType<P>,
  /**
   * Sub-screens the user visits and returns from (e.g. Task Closure -> Task
   * Input). While one of these is focused the screen stays mounted (hidden) so
   * what the user already entered is not lost.
   */
  keepMountedWhileOn: string[] = [],
): React.ComponentType<P> {
  const Wrapped = (props: P) => {
    const focused = useIsFocused();
    const navigation = useNavigation<any>();
    const returnTo = useRoute<any>().params?.returnTo as
      | { name: string; params?: any }
      | undefined;
    // Tab back behaviour is "initialRoute", so hardware back would jump to Home.
    // Screens opened from within a flow (e.g. Task Closure -> Task Input) carry
    // `returnTo`; send back there instead.
    useEffect(() => {
      if (!focused || !returnTo) return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        navigation.navigate(returnTo.name, returnTo.params);
        return true;
      });
      return () => sub.remove();
    }, [focused, returnTo, navigation]);
    const routeName = useRoute<any>().name;
    useEffect(() => {
      if (!focused || returnTo || !SETTINGS_SUBSCREENS.includes(routeName)) return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        navigation.navigate('Settings');
        return true;
      });
      return () => sub.remove();
    }, [focused, returnTo, routeName, navigation]);
    const focusedName = useNavigationState(state => state.routes[state.index]?.name);
    const keep = !focused && keepMountedWhileOn.includes(focusedName);
    return focused || keep ? <Screen {...props} /> : null;
  };
  Wrapped.displayName = `UnmountOnBlur(${Screen.displayName || Screen.name || 'Screen'})`;
  return Wrapped;
}

const TranslatedHeaderTitle = ({ text, color }: { text: string; color?: string }) => {
  useTranslation();
  return <HeaderTitle tintColor={color} style={{ fontWeight: '600' }}>{tr(text)}</HeaderTitle>;
};

/** Red back-arrow header matching the native stack header these screens had. */
/**
 * `backTo` is the tab the arrow returns to when the screen was not opened from another screen
 * (`returnTo`); without it the tab navigator's own back behaviour applies (Home).
 */
export const pushedScreenOptions = (title: string, navigation: any, route?: any, backTo?: string, topInset = 0) => ({
  headerShown: true,
  title,
  headerTitle: ({ children, tintColor }: { children: string; tintColor?: string }) => (
    <TranslatedHeaderTitle text={children} color={tintColor} />
  ),
  // The header pads itself by the status-bar inset, so its total height must include it
  // (edge-to-edge phones report a non-zero inset; the emulator often reports 0).
  headerStyle: { backgroundColor: COLORS.primary, height: topInset + HEADER_BAR_HEIGHT },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' as const },
  headerTitleAlign: 'left' as const,
  headerLeft: () => (
    <Pressable
      onPress={() => {
        const returnTo = route?.params?.returnTo;
        if (returnTo) navigation.navigate(returnTo.name, returnTo.params);
        else if (backTo) navigation.navigate(backTo);
        else if (SETTINGS_SUBSCREENS.includes(route?.name)) navigation.navigate('Settings');
        else navigation.goBack();
      }}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={{ paddingHorizontal: ms(16) }}
    >
      <Ionicons name="arrow-back" size={ms(24)} color="#fff" />
    </Pressable>
  ),
});
