// src/screens/technician/drawer/SettingScreen.tsx
import { useEffect, useState } from 'react';
import {
  View, StyleSheet, Text, ScrollView, Pressable,
  StatusBar, Platform, Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../../theme/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms, sp, scale, hp, vs } from '../../../utils/responsive';

export default function SettingScreen() {
  const navigation = useNavigation<any>();
  const [expanded, setExpanded] = useState(false);
  const insets = useSafeAreaInsets();
  // Java's SettingsFragment: cardView_invite_friends is visible for
  // owner/subadmin only.
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('role').then(role => {
      const normalized = (role ?? '').toLowerCase();
      setIsOwner(normalized === 'admin' || normalized === 'owner' || normalized === 'subadmin');
    });
  }, []);

  const handleInviteFriends = () => {
    Share.share({
      message:
        "Namaste \ud83d\ude4f,\nI am using India's #1 field business management app - \ud83d\udca5 FieldWeb \n\n" +
        'Benefits of using FieldWeb: \n\n' +
        '\u2022 Revenue increased \ud83d\udcc8 by 75% \n' +
        '\u2022 Keeps data Safe \ud83d\udee1 and Secure. \n' +
        "\u2022 Tracks fieldworker's \ud83d\udc68\u200d\ud83d\udd27 activity. \n" +
        '\u2022 Assign task/job to fieldworkers \ud83d\udc68\u200d\ud83d\udd27. \n' +
        '\u2022 Sends service reminder to customers \ud83d\udc68\u200d\ud83d\udc68\u200d\ud83d\udc67. \n\n' +
        'Download Now: \n\n https://bit.ly/3MZiwEJ',
    }).catch(() => {});
  };

  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : insets.top;

  const topCards = [
    { icon: 'phone-portrait-outline', title: 'App Tour' },
    { icon: 'star-outline',           title: 'Rate Us' },
    { icon: 'thumbs-up-outline',      title: 'Feedback' },
  ];

  const listItems: { icon: string; title: string; route?: string; onPress?: () => void }[] = [
    ...(isOwner
      ? [{ icon: 'people-outline', title: 'Invite Friends', onPress: handleInviteFriends }]
      : []),
    { icon: 'language-outline',            title: 'Change Language' },
    { icon: 'trash-outline',               title: 'Delete Account' },
    { icon: 'document-text-outline',       title: 'Terms & Condition' },
    { icon: 'shield-checkmark-outline',    title: 'Privacy Policy',   route: 'PrivacyPolicy' },
    { icon: 'cash-outline',                title: 'Refund Policy',    route: 'RefundPolicy' },
    { icon: 'information-circle-outline',  title: 'About Fieldweb',   route: 'AboutFieldweb' },
  ];

  return (
    <View style={styles.root}>
      <View style={[styles.redBg, { height: vs(5) }]} />

      <View style={styles.whiteSheet}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + ms(24) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Top 3 cards */}
          <View style={styles.cardRow}>
            {topCards.map(({ icon, title }) => (
              <Pressable
                key={title}
                style={({ pressed }) => [styles.topCard, pressed && styles.pressed]}
              >
                <Ionicons name={icon} size={scale(28)} color={COLORS.primary} />
                <Text style={styles.topCardText}>{title}</Text>
              </Pressable>
            ))}
          </View>

          {/* List items */}
          {listItems.map(({ icon, title, route, onPress }) => (
            <Pressable
              key={title}
              onPress={() => (onPress ? onPress() : route && navigation.navigate(route))}
              style={({ pressed }) => [styles.listItem, pressed && styles.pressed]}
            >
              <Ionicons name={icon} size={scale(26)} color={COLORS.primary} />
              <Text style={styles.listText}>{title}</Text>
            </Pressable>
          ))}

          {/* Footer accordion */}
          <Pressable
            style={styles.footer}
            onPress={() => setExpanded((p) => !p)}
            accessibilityRole="button"
          >
            <Text style={styles.footerText}>CoreField Technologies Pvt. Ltd.</Text>
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
              <Text style={styles.expandLabel}>Address</Text>
              <View style={styles.expandRow}>
                <Text style={styles.expandValue}>
                  90b, Delhi - Jaipur Expy, Sector 18,{'\n'}
                  Gurugram, Haryana, India - 122008
                </Text>
                <Ionicons name="location-outline" size={scale(24)} color={COLORS.primary} />
              </View>

              {/* Phone */}
              <Text style={styles.expandLabel}>Phone</Text>
              <View style={styles.expandRow}>
                <Text style={styles.expandValue}>+91 9315228028</Text>
                <Ionicons name="call-outline" size={scale(24)} color={COLORS.primary} />
              </View>

              {/* Email */}
              <Text style={styles.expandLabel}>Email</Text>
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
    shadowOffset: { width: 0, height: 2 },
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
    shadowOffset: { width: 0, height: 1 },
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