// Shared frame for Java's WebView fragments (Terms, Privacy, Refund, About, Feedback):
// red page, white 30dp-rounded sheet under the toolbar, and a centred "Loading..." dialog
// (Java ProgressDialog) over a dimmed screen.
import React, {useState} from 'react';
import {View, ActivityIndicator, StyleSheet, Text} from 'react-native';
import {WebView} from 'react-native-webview';
import {COLORS} from '../theme/theme';
import {ms, sp} from '../utils/responsive';

import { useTranslation } from 'react-i18next';
export default function WebPageFrame({uri}: {uri: string}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={styles.root}>
      <View style={styles.sheet}>
        <WebView
          source={{uri}}
          style={styles.web}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{t('rn_error_loading_page')}</Text>
          </View>
        )}
      </View>
      {loading && (
        <View style={styles.dim}>
          <View style={styles.dialog}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.dialogText}>{t('rn_loading')}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: COLORS.primary},
  sheet: {
    flex: 1,
    marginTop: ms(10),
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    overflow: 'hidden',
  },
  web: {flex: 1, backgroundColor: '#fff'},
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: '87%',
    height: ms(100),
    backgroundColor: '#fff',
    borderRadius: ms(3),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(20),
    elevation: 12,
  },
  dialogText: {marginLeft: ms(30), fontSize: sp(16), color: '#6b6b6b'},
  errorBox: {...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center'},
  errorText: {fontSize: sp(14), color: '#333'},
});
