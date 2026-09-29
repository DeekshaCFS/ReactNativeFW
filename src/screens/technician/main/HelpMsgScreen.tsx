// src/screens/technician/main/HelpMsgScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp } from '../../../utils/responsive';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TechnicianStackParamList } from '../../../navigation/TechStack';

type NavigationProp = NativeStackNavigationProp<
  TechnicianStackParamList,
  'helpMessages'
>;

export default function HelpMessagesScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <View style={styles.redBg} />

      <View style={styles.subHeader}>
        <Ionicons
          name="chevron-back"
          size={sp(26)}
          color="#fff"
          onPress={() => navigation.navigate('help')}
        />
        <Text style={styles.subHeaderTitle}>Messages</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.title}>Start a new chat</Text>

        <Pressable
          style={styles.newCard}
          onPress={() => navigation.navigate('helpChat')}
        >
          <View>
            <Text style={styles.newTitle}>New Conversation</Text>
            <Text style={styles.newSubtitle}>
              We typically reply in a few minutes
            </Text>
          </View>

          <Ionicons
            name="paper-plane-outline"
            size={sp(22)}
            color={COLORS.primary}
          />
        </Pressable>

        <Text style={styles.recentTitle}>Recent</Text>
        <Text style={styles.emptyText}>
          Your conversation history opens inside the chat above once you start one.
        </Text>

      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Pressable style={styles.footerItem}
           onPress={() => navigation.navigate('help')}>
            <Ionicons
              name="home-outline"
              size={sp(24)}
              color="#555"
            />
          </Pressable>
          <Pressable style={styles.footerItem}>
            <Ionicons
              name="chatbox-outline"
              size={sp(24)}
              color={COLORS.primary}
            />
          </Pressable>
        </View>
        <Text style={styles.footerText}>Powered by tawk.to</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },

  redBg: {
    height: vs(15),
    backgroundColor: COLORS.primary,
  },

  subHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: vs(12),
    paddingBottom: vs(15),
    paddingHorizontal: scale(15),
    flexDirection: 'row',
    alignItems: 'center',
  },

  subHeaderTitle: {
    color: '#fff',
    fontSize: sp(20),
    marginLeft: scale(15),
    fontWeight: '600',
  },

  content: {
    padding: scale(20),
    paddingBottom: vs(120),
  },

  title: {
    fontSize: sp(24),
    fontWeight: '400',
    marginBottom: vs(20),
  },

  newCard: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: scale(20),
    padding: scale(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(35),
  },

  newTitle: {
    fontSize: sp(18),
    fontWeight: '600',
  },

  newSubtitle: {
    fontSize: sp(14),
    color: '#888',
    marginTop: vs(6),
  },

  recentTitle: {
    fontSize: sp(22),
    marginBottom: vs(15),
  },

  emptyText: {
    fontSize: sp(14),
    color: '#888',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: vs(12),
    backgroundColor: '#fff',
    height: vs(90),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: vs(6),
  },
  footerText: {
    fontSize: sp(12),
    color: '#666',
    paddingTop: vs(8),
  },
});