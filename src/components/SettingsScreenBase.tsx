// src/components/SettingsScreenBase.tsx
//
// Shared presentational shell for the Settings screen, used by both
// AdminSettingScreen.tsx and technician/drawer/SettingScreen.tsx. Layout,
// styling and the footer contact accordion are identical between roles --
// only the row contents (topCards/listItems) differ, so those are passed
// in as props rather than duplicating this file twice.

import React, {useState} from 'react';
import {View, StyleSheet, Text, ScrollView, Pressable} from 'react-native';
import {useTranslation} from 'react-i18next';
import {COLORS} from '../theme/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ms, sp, scale} from '../utils/responsive';

export type SettingsRow = {
  icon: React.ComponentType<{size?: number; color?: string}>;
  iconSize?: number;
  title: string;
  route?: string;
  onPress?: () => void;
};

type Props = {
  topCards: SettingsRow[];
  listItems: SettingsRow[];
};

export default function SettingsScreenBase({topCards, listItems}: Props) {
  const navigation = useNavigation<any>();
  const [expanded, setExpanded] = useState(false);
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();

  return (
    <View style={styles.root}>
      <View style={[styles.redBg, {height: ms(5)}]} />

      <View style={styles.whiteSheet}>
        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + ms(24)}]}
          showsVerticalScrollIndicator={false}
        >
          {/* Top cards */}
          <View style={styles.cardRow}>
            {topCards.map(({icon: Icon, iconSize, title, onPress}) => (
              <Pressable
                key={title}
                onPress={onPress}
                style={({pressed}) => [styles.topCard, pressed && styles.pressed]}
              >
                <View style={{marginBottom: ms(10)}}><Icon size={scale(iconSize ?? 30)} color={COLORS.primary} /></View>
                <Text style={styles.topCardText}>{title}</Text>
              </Pressable>
            ))}
          </View>

          {/* List items */}
          {listItems.map(({icon: Icon, iconSize, title, route, onPress}) => (
            <Pressable
              key={title}
              onPress={() => (onPress ? onPress() : route && navigation.navigate(route))}
              style={({pressed}) => [styles.listItem, pressed && styles.pressed]}
            >
              <Icon size={scale(iconSize ?? 30)} color={COLORS.primary} />
              <Text style={styles.listText}>{title}</Text>
            </Pressable>
          ))}

          {/* Footer accordion */}
          <Pressable
            style={styles.footer}
            onPress={() => setExpanded(p => !p)}
            accessibilityRole="button"
          >
            <Text style={styles.footerText}>{t('corefieldTech')}</Text>
            <View style={styles.chevronBox}>
              <Ionicons
                name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                size={scale(20)}
                color="#000"
              />
            </View>
          </Pressable>

          {expanded && (
            <View style={styles.expandSection}>
              {/* Address */}
              <Text style={styles.expandLabel}>{t('address')}</Text>
              <View style={styles.expandRow}>
                <Text style={styles.expandValue}>{t('addressValue')}</Text>
                <Ionicons name="location-outline" size={scale(24)} color={COLORS.primary} />
              </View>

              {/* Phone */}
              <Text style={styles.expandLabel}>{t('phone')}</Text>
              <View style={styles.expandRow}>
                <Text style={styles.expandValue}>+91 9315228028</Text>
                <Ionicons name="call-outline" size={scale(24)} color={COLORS.primary} />
              </View>

              {/* Email */}
              <Text style={styles.expandLabel}>{t('email')}</Text>
              <View style={styles.expandRow}>
                <Text style={styles.expandValue}>{t('info_fieldweb_co_in')}</Text>
                <Ionicons name="mail-outline" size={scale(24)} color={COLORS.primary} />
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: COLORS.primary},
  redBg: {backgroundColor: COLORS.primary},
  // Java: CardView cardCornerRadius 30dp, marginTop 20dp over the red page.
  whiteSheet: {
    flex: 1,
    marginTop: ms(25),
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
  },
  content: {paddingTop: 0},

  /* Top cards: 142dp strip, 20dp padding, 100dp cards, 20dp gaps */
  cardRow: {
    flexDirection: 'row',
    height: ms(120),
    padding: ms(20),
    gap: ms(20),
  },
  topCard: {
    flex: 1,
    height: ms(100),
    backgroundColor: '#fff',
    borderRadius: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 2},
  },
  topCardText: {
    position: 'absolute',
    top: ms(60),
    left: 0,
    right: 0,
    fontSize: sp(16),
    color: COLORS.ink,
    textAlign: 'center',
  },

  /* List items: 50dp high, 20dp side margins, 20dp top, radius 5 */
  listItem: {
    height: ms(50),
    marginHorizontal: ms(20),
    marginTop: ms(20),
    backgroundColor: '#fff',
    borderRadius: ms(5),
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: ms(30),
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
  },
  // Text starts 100dp from the card's left edge (icon sits at 30dp).
  listText: {
    marginLeft: ms(37),
    fontSize: sp(16),
    color: COLORS.ink,
    flex: 1,
  },
  pressed: {backgroundColor: '#FFE5EA'},

  /* Footer accordion: 20sp title + 40x30 arrow, 20dp left margin */
  footer: {
    marginTop: ms(20),
    marginLeft: ms(20),
    marginRight: ms(20),
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: sp(20),
    color: COLORS.ink,
    flex: 1,
  },
  chevronBox: {
    width: ms(40),
    height: ms(30),
    backgroundColor: '#d3d3d3',
    borderRadius: ms(4),
    justifyContent: 'center',
    alignItems: 'center',
  },

  expandSection: {marginHorizontal: ms(20), paddingBottom: ms(12)},
  expandLabel: {fontSize: sp(14), color: COLORS.darkGray, marginTop: ms(10)},
  expandRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  expandValue: {fontSize: sp(16), color: COLORS.ink, flex: 1, marginRight: ms(12)},
});
