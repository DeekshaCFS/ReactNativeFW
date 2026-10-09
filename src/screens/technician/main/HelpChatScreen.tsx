// src/screens/technician/main/HelpChatScreen.tsx
//
// Java: HomeActivityNew R.id.help -> addFragment(new ChatFragment()). The Help & Support
// screen is just the tawk.to chat widget in a WebView (fragment_chat.xml), shown under the
// normal toolbar with the bottom bar still visible. Intercom was wired up elsewhere in the
// Java app but never initialises at runtime, so there is no landing page / messages list.

import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '../../../theme/theme';
import { ms, sp, useAppHeaderHeight } from '../../../utils/responsive';

export const HELP_CHAT_URL = 'https://tawk.to/chat/65eada4b8d261e1b5f6a7448/1hoem9egj';

// `underAppHeader`: the admin app draws the shared (absolute) AppHeader above this screen.
export default function HelpChatScreen({ underAppHeader = false }: { underAppHeader?: boolean }) {
  const [loading, setLoading] = useState(true);
  const headerHeight = useAppHeaderHeight();

  return (
    <View style={[styles.container, underAppHeader ? { paddingTop: headerHeight } : null]}>
      <WebView
        source={{ uri: HELP_CHAT_URL }}
        style={styles.web}
        javaScriptEnabled
        onLoadEnd={() => setLoading(false)}
        onError={e => {
          setLoading(false);
          ToastAndroid.show(`Error:${e.nativeEvent.description}`, ToastAndroid.SHORT);
        }}
      />

      {loading && (
        <View style={[styles.overlay, underAppHeader ? { top: headerHeight } : null]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  web: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  loadingText: { marginTop: ms(10), fontSize: sp(14), color: COLORS.textBlack },
});
