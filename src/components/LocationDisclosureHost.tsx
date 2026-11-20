// src/components/LocationDisclosureHost.tsx
//
// Full-screen "Use Your Location" disclosure, same content as Java RuntimePermissionActivity
// (activity_runtime_permissions.xml). Shown by showLocationDisclosure() before the system prompt.

import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppModal from './AppModal';
import { COLORS } from '../theme/theme';
import { ms, sp } from '../utils/responsive';
import { resolveLocationDisclosure, setLocationDisclosurePresenter } from '../utils/locationDisclosure';

const ILLUSTRATION = require('../../assets/images/location_disclosure.png');

export default function LocationDisclosureHost() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setLocationDisclosurePresenter(() => setVisible(true));
    return () => setLocationDisclosurePresenter(null);
  }, []);

  const answer = (agreed: boolean) => {
    setVisible(false);
    resolveLocationDisclosure(agreed);
  };

  return (
    <AppModal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={() => answer(false)}>
      <View style={styles.root}>
        <Image source={ILLUSTRATION} style={styles.image} resizeMode="cover" />

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.title}>
            {t('use_your_location', { defaultValue: 'Use Your Location' })}
          </Text>
          <Text style={styles.text}>
            {t('prominent_disclosure_1', {
              defaultValue:
                'FieldWeb will use your location to assigned tasks with the help of google map live location.\n' +
                'You need to allow FieldWeb app to use your location all the time and the collected data about your ' +
                'location will not be used for anything other than plotting routes on google map.',
            })}
          </Text>
          <Text style={styles.text}>
            {t('prominent_disclosure_2', {
              defaultValue:
                'FieldWeb will use location in the background. It will help to show the current location to help you ' +
                'navigate the assigned location for the task. This app collects location data to enable:',
            })}
          </Text>
          <Text style={styles.text}>
            {t('prominent_disclosure_3', {
              defaultValue:
                '1. Your/user attendance tracking.\n' +
                '2. Reach destination by accepting the task by you/user.\n' +
                '3. Track your/user ongoing task.',
            })}
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable onPress={() => answer(false)} hitSlop={12} accessibilityRole="button">
            <Text style={styles.noThanks}>{t('no_thanks', { defaultValue: 'No thanks' })}</Text>
          </Pressable>
          <Pressable
            style={styles.turnOn}
            onPress={() => answer(true)}
            accessibilityRole="button">
            <Text style={styles.turnOnText}>{t('turn_on', { defaultValue: 'TURN ON' })}</Text>
          </Pressable>
        </View>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },
  image: { width: '100%', height: '32%' },
  body: { paddingHorizontal: sp(20), paddingTop: sp(16), paddingBottom: sp(12) },
  title: {
    color: COLORS.primary,
    fontSize: ms(20),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: sp(16),
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: ms(15),
    lineHeight: ms(22),
    textAlign: 'left',
    marginBottom: sp(14),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(20),
    paddingBottom: sp(24),
    paddingTop: sp(8),
  },
  noThanks: { color: COLORS.textMuted, fontSize: ms(15) },
  turnOn: {
    backgroundColor: COLORS.primary,
    borderRadius: sp(24),
    paddingVertical: sp(12),
    paddingHorizontal: sp(44),
  },
  turnOnText: { color: COLORS.white, fontSize: ms(16), fontWeight: '700' },
});