// src/components/SettingsScreenBase.tsx
//
// Shared presentational shell for the Settings screen, used by both
// AdminSettingScreen.tsx and technician/drawer/SettingScreen.tsx. Layout,
// styling and the footer contact accordion are identical between roles --
// only the row contents (topCards/listItems) differ, so those are passed
// in as props rather than duplicating this file twice.

import {useState} from 'react';
import {View, StyleSheet, Text, ScrollView, Pressable} from 'react-native';
import {useTranslation} from 'react-i18next';
import {COLORS} from '../theme/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ms, sp, scale} from '../utils/responsive';

export type SettingsRow = {
  icon: string;
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
            {topCards.map(({icon, title, onPress}) => (
              <Pressable
                key={title}
                onPress={onPress}
                style={({pressed}) => [styles.topCard, pressed && styles.pressed]}
              >
                <Ionicons name={icon} size={scale(28)} color={COLORS.primary} />
                <Text style={styles.topCardText}>{title}</Text>
              </Pressable>
            ))}
          </View>

          {/* List items */}
          {listItems.map(({icon, title, route, onPress}) => (
            <Pressable
              key={title}
              onPress={() => (onPress ? onPress() : route && navigation.navigate(route))}
              style={({pressed}) => [styles.listItem, pressed && styles.pressed]}
            >
              <Ionicons name={icon} size={scale(26)} color={COLORS.primary} />
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
                <Text style={styles.expandValue}>info@fieldweb.co.in</Text>
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
  root: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  redBg: {
    backgroundColor: COLORS.primary,
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(28),
    borderTopRightRadius: ms(28),
  },
  content: {
    padding: ms(16),
  },

  /* Top cards */
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ms(16),
    gap: ms(8),
  },
  topCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: ms(14),
    paddingVertical: ms(18),
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
  },
  topCardText: {
    marginTop: ms(8),
    fontSize: sp(13),
    fontWeight: '400',
    color: '#000',
    textAlign: 'center',
  },

  /* List items */
  listItem: {
    backgroundColor: '#fff',
    borderRadius: ms(12),
    paddingVertical: ms(16),
    paddingHorizontal: ms(14),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
    gap: ms(14),
  },
  listText: {
    fontSize: sp(16),
    color: '#000',
    fontWeight: '400',
    flex: 1,
  },
  pressed: {
    backgroundColor: '#FFE5EA',
  },

  /* Footer accordion */
  footer: {
    marginTop: ms(24),
    paddingVertical: ms(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: sp(18),
    fontWeight: '500',
    color: '#505050',
    flex: 1,
    marginRight: ms(12),
  },
  chevronBox: {
    width: ms(36),
    height: ms(24),
    borderRadius: ms(4),
    backgroundColor: '#d3d3d3',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Expanded section */
  expandSection: {
    paddingHorizontal: ms(4),
    paddingBottom: ms(12),
  },
  expandLabel: {
    fontSize: sp(14),
    color: '#505050',
    marginBottom: ms(4),
    marginTop: ms(12),
  },
  expandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expandValue: {
    fontSize: sp(16),
    color: '#000',
    flex: 1,
    marginRight: ms(12),
    lineHeight: sp(22),
  },
});
