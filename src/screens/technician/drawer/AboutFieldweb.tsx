// src/screens/technician/drawer/AboutFieldweb.tsx
import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Pressable, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms, sp, scale } from '../../../utils/responsive';

const ABOUT_URL = 'https://policies.google.com/privacy';
const WHATSAPP_NUMBER = '919315228028';

export default function AboutFieldwebScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const insets = useSafeAreaInsets();

  const openWhatsApp = () => {
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=Hello%20I%20need%20help`);
  };

  const fabBottom = insets.bottom + ms(20);

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: ABOUT_URL }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
      />

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#D90429" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {error && (
        <View style={styles.overlay}>
          <Text style={styles.errorText}>Error loading page</Text>
        </View>
      )}

      <Pressable style={[styles.leftPill, { bottom: fabBottom }]} onPress={openWhatsApp}>
        <FontAwesome name="whatsapp" size={scale(26)} color="#fff" />
        <Text style={styles.pillText}>Chat with us</Text>
      </Pressable>

      <Pressable style={[styles.rightIcon, { bottom: fabBottom }]} onPress={openWhatsApp}>
        <Ionicons name="chatbubble-ellipses" size={scale(26)} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  loadingText: { marginTop: ms(10), fontSize: sp(14) },
  errorText:   { fontSize: sp(14), color: '#333' },
  leftPill: {
    position: 'absolute',
    left: ms(15),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingVertical: ms(12),
    paddingHorizontal: ms(16),
    borderRadius: ms(30),
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  pillText: { color: '#fff', marginLeft: ms(8), fontWeight: '600', fontSize: sp(14) },
  rightIcon: {
    position: 'absolute',
    right: ms(15),
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    backgroundColor: '#E30613',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});