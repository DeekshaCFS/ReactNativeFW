// src/screens/technician/main/HelpScreen.tsx
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TechnicianStackParamList } from '../../../navigation/TechStack';
import { ms, sp } from '../../../utils/responsive';

type NavigationProp = NativeStackNavigationProp<
  TechnicianStackParamList,
  'help'
>;

export default function HelpScreen() {

  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Image
          source={{
            uri: 'https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg',
          }}
          style={styles.bannerImage}
        />
        <View style={styles.playIcon}>
          <Ionicons name="logo-youtube" size={sp(50)} color="#cb0000" />
        </View>
      </View>

      <View style={styles.textSection}>
        <Text style={styles.greeting}>
          Hi there <Text style={styles.wave}>👋</Text>
        </Text>
        <Text style={styles.subText}>
          Start a conversation with our product experts.
        </Text>
      </View>

      <Pressable style={styles.card}>
        <View>
          <Text style={styles.cardTitle}>New Conversation</Text>
          <Text style={styles.cardSubtitle}>
            We typically reply in a few minutes
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
        <Text style={styles.footerText}>Powered by tawk.to</Text>
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
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    ...StyleSheet.absoluteFill,
    resizeMode: 'cover',
  },
  playIcon: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    backgroundColor: 'rgba(0,0,0,0.6)',
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