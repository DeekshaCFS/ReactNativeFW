// src/components/AppHeader.tsx

import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';

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
  hp,
  wp,
} from '../utils/responsive';

// Exported so screens rendered underneath this (absolutely-positioned)
// header can pad their own top content by `insets.top + HEADER_CONTENT_HEIGHT`
// instead of drawing their own duplicate toolbar.
export const HEADER_CONTENT_HEIGHT = ms(56);

type AppHeaderProps = {
  title: string;
  navigation: NavigationProp<ParamListBase>;
};

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  navigation,
}) => {

  const insets = useSafeAreaInsets();

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
    paddingHorizontal: wp(4),
  },

  sideBtn: {
    width: wp(12),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: wp(2),
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
    marginLeft: wp(1.5),
  },
});