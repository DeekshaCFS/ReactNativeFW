// src/components/AppHeader.tsx

import React, { useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  AppState,
} from 'react-native';

import { refreshUnreadCount, useUnreadCount } from '../state/notificationBadge';

import Ionicons from 'react-native-vector-icons/Ionicons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DrawerActions,
  NavigationProp,
  ParamListBase,
} from '@react-navigation/native';

import { COLORS } from '../theme/theme';

import {
  sp,
  ms,
  scale,
  HEADER_BAR_HEIGHT,
} from '../utils/responsive';

// Exported so screens rendered underneath this (absolutely-positioned)
// header can pad their own top content by `insets.top + HEADER_CONTENT_HEIGHT`
// instead of drawing their own duplicate toolbar.
export const HEADER_CONTENT_HEIGHT = HEADER_BAR_HEIGHT;

type AppHeaderProps = {
  title: string;
  navigation: NavigationProp<ParamListBase>;
};

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  navigation,
}) => {

  const insets = useSafeAreaInsets();
  const unread = useUnreadCount();

  // Bell badge: refresh on mount, whenever the host screen regains focus (e.g. back from
  // the notification list) and when the app returns to the foreground.
  useEffect(() => {
    refreshUnreadCount();
    const unsubscribeFocus = navigation.addListener('focus', refreshUnreadCount);
    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') refreshUnreadCount();
    });
    return () => {
      unsubscribeFocus();
      appStateSub.remove();
    };
  }, [navigation]);

  // Use safe-area insets on both platforms for consistency across devices
  const topInset = insets.top;

  // Total header height = status bar/notch space + the actual header bar
  const headerHeight = topInset + HEADER_CONTENT_HEIGHT;

  return (
    <View
      style={[
        styles.header,
        {
          height: headerHeight,
          paddingTop: topInset,
        },
      ]}
    >
      <View style={styles.headerRow}>
        {/* LEFT */}
        <Pressable
          onPress={() =>
            navigation.dispatch(DrawerActions.openDrawer())
          }
          hitSlop={10}
          style={styles.sideBtn}
        >
          <Ionicons name="menu-outline" size={ms(26)} color="#fff" />
        </Pressable>

        {/* CENTER */}
        <View style={styles.centerContainer}>
          <Text
            style={styles.headerTitle}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {title}
          </Text>
        </View>

        {/* RIGHT */}
        <View style={styles.headerIcons}>
          <Pressable hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="location-outline" size={ms(22)} color="#fff" />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('help')}
            hitSlop={10}
            style={styles.iconBtn}
          >
            <Ionicons name="headset-outline" size={ms(22)} color="#fff" />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('notification')}
            hitSlop={10}
            style={styles.iconBtn}
          >
            <Ionicons
              name="notifications-outline"
              size={ms(22)}
              color="#fff"
            />
            {unread > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText} allowFontScaling={false}>
                  {unread > 99 ? '99+' : unread}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default AppHeader;

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: COLORS.primary,
    zIndex: 9999,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  headerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
  },

  sideBtn: {
    width: scale(46),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: scale(8),
  },

  headerTitle: {
    color: '#fff',
    fontSize: sp(20),
    fontWeight: '500',
    textAlign: 'center',
  },

  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconBtn: {
    padding: ms(5),
    marginLeft: scale(6),
  },

  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: ms(16),
    height: ms(16),
    borderRadius: ms(8),
    paddingHorizontal: ms(3),
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    color: COLORS.primary,
    fontSize: sp(10),
    fontWeight: '700',
  },
});