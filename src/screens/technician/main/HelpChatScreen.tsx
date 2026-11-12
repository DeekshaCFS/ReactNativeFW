// src/screens/technician/main/HelpChatScreen.tsx
//
// Java: HomeActivityNew R.id.help -> addFragment(new ChatFragment()). The Help & Support
// screen is just the tawk.to chat widget in a WebView (fragment_chat.xml), shown under the
// normal toolbar with the bottom bar still visible. Intercom was wired up elsewhere in the
// Java app but never initialises at runtime, so there is no landing page / messages list.

import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '../../../theme/theme';
import { ms, sp, useAppHeaderHeight } from '../../../utils/responsive';
import { showToast } from '../../../utils/toast';

import { useTranslation } from 'react-i18next';
import { trf } from '../../../i18n/tr';
export const HELP_CHAT_URL = 'https://tawk.to/chat/65eada4b8d261e1b5f6a7448/1hoem9egj';

// `underAppHeader`: the admin app draws the shared (absolute) AppHeader above this screen.
export default function HelpChatScreen({ underAppHeader = false }: { underAppHeader?: boolean }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const headerHeight = useAppHeaderHeight();
  // Changing this key remounts the web view, which reloads the page.
  const [webKey, setWebKey] = useState(0);

  return (
    <View style={[styles.container, underAppHeader ? { paddingTop: headerHeight } : null]}>
      <WebView
        key={webKey}
        source={{ uri: HELP_CHAT_URL }}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        // iPhone: the chat widget's cookies are blocked unless they are shared with the web view.
        sharedCookiesEnabled
        originWhitelist={['*']}
        // tawk.to opens its chat in a pop-up window on some pages; keep it in this web view.
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        startInLoadingState
        // iPhone can shut down the web view's process (background, low memory). When that
        // happens the page goes blank without an error, so reload it.
        onContentProcessDidTerminate={() => setWebKey(k => k + 1)}
        onLoadEnd={() => setLoading(false)}
        onError={e => {
          setLoading(false);
          showToast(trf('Error:{{msg}}', { msg: e.nativeEvent.description }));
        }}
      />

      {loading && (
        <View style={[styles.overlay, underAppHeader ? { top: headerHeight } : null]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('rn_loading')}</Text>
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