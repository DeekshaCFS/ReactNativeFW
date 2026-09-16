// src/components/DisclaimerModal.tsx

import { useState } from 'react';
import { Modal, View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../theme/theme';
import { ms, sp, scale } from '../utils/responsive';
import { htmlToText } from '../utils/htmlToText';

type Props = {
  visible: boolean;
  disclaimerHtml: string;
  loading?: boolean;
  onAccept: () => void | Promise<void>;
};

export default function DisclaimerModal({ visible, disclaimerHtml, loading, onAccept }: Props) {
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    if (!agreed) {
      Alert.alert('', 'Please Click on I Agree');
      return;
    }
    onAccept();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>App Disclaimer</Text>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <Text style={styles.bodyText}>{htmlToText(disclaimerHtml)}</Text>
          </ScrollView>

          <View style={styles.footerRow}>
            <Pressable
              style={styles.agreeRow}
              onPress={() => setAgreed(a => !a)}
              hitSlop={8}
            >
              <Ionicons
                name={agreed ? 'checkbox' : 'square-outline'}
                size={scale(22)}
                color={agreed ? COLORS.primary : COLORS.textTertiary}
              />
              <Text style={styles.agreeText}>I Agree</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.continueButton, pressed && styles.continuePressed]}
              onPress={handleContinue}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textOnPrimary} size="small" />
              ) : (
                <Text style={styles.continueText}>Continue</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: ms(30),
    margin: ms(10),
    marginBottom: ms(30),
    maxHeight: '95%',
    padding: ms(16),
  },
  title: {
    fontSize: sp(22),
    fontWeight: '700',
    color: COLORS.primary,
    paddingBottom: ms(10),
  },
  body: {
    marginBottom: ms(12),
  },
  bodyContent: {
    paddingVertical: ms(4),
  },
  bodyText: {
    fontSize: sp(16),
    fontWeight: '400',
    lineHeight: sp(20),
    color: '#332E2E',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ms(4),
  },
  agreeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  agreeText: {
    marginLeft: ms(6),
    fontSize: sp(16),
    color: COLORS.black,
  },
  continueButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: ms(24),
    paddingVertical: ms(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  continuePressed: {
    backgroundColor: COLORS.primaryDark,
  },
  continueText: {
    color: COLORS.textOnPrimary,
    fontSize: sp(20),
    fontWeight: '500',
  },
});