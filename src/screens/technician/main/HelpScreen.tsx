// src/screens/technician/main/HelpScreen.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { ms, sp } from '../../../utils/responsive';
import { HELP_CHAT_URL } from './HelpChatScreen';

import { useTranslation } from 'react-i18next';
// Only the admin stack still uses this screen (technician Help is HelpChatScreen).
type NavigationProp = any;

// Java: HomeActivityNew's R.id.help handler -> addFragment(new ChatFragment()),
// which loads this same tawk.to widget in a WebView. Intercom was wired up
// elsewhere in the Java app but never successfully initialized at runtime
// (missing string resources meant Intercom.initialize() always threw and was
// silently swallowed) — tawk.to is what technicians actually see today.
export { HELP_CHAT_URL };

export default function HelpScreen() {
  const { t } = useTranslation();

  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Ionicons name="chatbubbles-outline" size={sp(64)} color="#fff" />
      </View>

      <View style={styles.textSection}>
        <Text style={styles.greeting}>
          {t('rn_hi_there')} <Text style={styles.wave}>👋</Text>
        </Text>
        <Text style={styles.subText}>
          {t('rn_start_a_conversation_with_our_product_expe')}
        </Text>
      </View>

      <Pressable style={styles.card} onPress={() => navigation.navigate('helpChat')}>
        <View>
          <Text style={styles.cardTitle}>{t('rn_new_conversation')}</Text>
          <Text style={styles.cardSubtitle}>
            {t('rn_we_typically_reply_in_a_few_minutes')}
          </Text>
        </View>
        <Ionicons name="send" size={sp(22)} color={COLORS.primary} />
      </Pressable>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Pressable style={styles.footerItem}>
            <Ionicons
              name="home-outline"
              size={sp(24)}
              color={COLORS.primary}
            />
          </Pressable>
          <Pressable style={styles.footerItem} onPress={()=>navigation.navigate('helpMessages')}>
            <Ionicons
              name="chatbox-outline"
              size={sp(24)}
              color="#555"
            />
          </Pressable>
        </View>
        <Text style={styles.footerText}>{t('rn_powered_by_tawk_to')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c22025',
    paddingHorizontal: ms(16),
  },
  banner: {
    marginTop: ms(100),
    borderRadius: ms(12),
    overflow: 'hidden',
    height: ms(200),
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textSection: {
    marginTop: ms(32),
  },
  greeting: {
    fontSize: sp(30),
    fontWeight: '700',
    color: '#fff',
  },
  wave: {
    fontSize: sp(30),
  },
  subText: {
    marginTop: ms(8),
    fontSize: sp(17),
    color: '#f1f1f1',
  },
  card: {
    marginTop: ms(24),
    backgroundColor: '#fff',
    borderRadius: ms(12),
    padding: ms(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 6,
    height: ms(100),
  },
  cardTitle: {
    fontSize: sp(18),
    fontWeight: '600',
    color: '#111',
  },
  cardSubtitle: {
    marginTop: ms(4),
    fontSize: sp(15),
    color: '#666',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: ms(20),
    backgroundColor: '#fff',
    height: ms(100),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerItem: {
    flex: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: sp(13),
    color: '#666',
    paddingTop: ms(15),
  },
});