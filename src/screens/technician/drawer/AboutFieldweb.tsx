// src/screens/technician/drawer/AboutFieldweb.tsx
import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { ms, sp } from '../../../utils/responsive';

const ABOUT_URL = 'https://www.thefieldweb.com/about-us'; // Java: AboutUsFragment

export default function AboutFieldwebScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
});