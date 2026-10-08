// src/screens/technician/drawer/PrivacyPolicyScreen.tsx
import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { ms, sp } from '../../../utils/responsive';

// Java: R.string.policy_url. The same screen also serves Terms & Conditions, which Java
// shows on a different page (TermsAndConditionsFragment) -- pass `url` as a route param.
export const PRIVACY_POLICY_URL = 'https://fieldweb.co.in/privacy-policy';
export const TERMS_AND_CONDITIONS_URL = 'https://www.thefieldweb.com/terms-and-conditions';
// Java: SettingsFragment's Feedback row -> SuggestionFeedbackFragment, a WebView on this URL.
export const FEEDBACK_URL = 'https://www.thefieldweb.com/contact';

export default function PrivacyPolicyScreen({ route }: any) {
  const pageUrl: string = route?.params?.url ?? PRIVACY_POLICY_URL;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: pageUrl }}
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