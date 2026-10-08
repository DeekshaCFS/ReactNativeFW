// src/components/RateUsModal.tsx
//
// Matches Java's play_store_ratings.xml + HomeActivityNew.PlayStoreRatingDialog:
// a bottom sheet with the app logo, a title/description, a primary "Rate Now"
// button (opens the Play Store listing) and two text buttons that just
// dismiss ("No, Thanks" / "Remind me later" -- Java only persists a
// SharedPreferences flag for an auto-prompt elsewhere in the app, which
// isn't ported, so both simply close the sheet here).

import {Modal, View, StyleSheet, Text, Pressable, Image, Platform, Linking} from 'react-native';
import {useTranslation} from 'react-i18next';
import DeviceInfo from 'react-native-device-info';
import {COLORS} from '../theme/theme';
import {ms, sp} from '../utils/responsive';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function RateUsModal({visible, onClose}: Props) {
  const {t} = useTranslation();

  const handleRateNow = () => {
    const bundleId = DeviceInfo.getBundleId();
    const url =
      Platform.OS === 'android'
        ? `https://play.google.com/store/apps/details?id=${bundleId}`
        : 'https://apps.apple.com/search?term=fieldweb';
    Linking.openURL(url).catch(() => {});
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>{t('rateAppTitle')}</Text>
          <Text style={styles.description}>{t('rateAppDesc')}</Text>

          <Pressable style={styles.rateButton} onPress={handleRateNow}>
            <Text style={styles.rateButtonText}>{t('rateBtnPos')}</Text>
          </Pressable>

          <View style={styles.row}>
            <Pressable style={styles.textButton} onPress={onClose}>
              <Text style={styles.textButtonLabel}>{t('rateBtnNut')}</Text>
            </Pressable>
            <Pressable style={styles.textButton} onPress={onClose}>
              <Text style={styles.textButtonLabel}>{t('rateBtnNeg')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    paddingHorizontal: ms(20),
    paddingTop: ms(20),
    paddingBottom: ms(20),
    alignItems: 'center',
  },
  logo: {
    width: ms(50),
    height: ms(50),
    marginVertical: ms(5),
  },
  title: {
    fontSize: sp(20),
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    margin: ms(5),
  },
  description: {
    fontSize: sp(16),
    color: '#333',
    textAlign: 'center',
    marginTop: ms(20),
    marginBottom: ms(20),
    lineHeight: sp(22),
  },
  rateButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: ms(24),
    paddingVertical: ms(14),
    marginTop: ms(10),
    marginBottom: ms(20),
    alignItems: 'center',
  },
  rateButtonText: {
    color: '#fff',
    fontSize: sp(18),
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: ms(10),
  },
  textButton: {
    margin: ms(15),
  },
  textButtonLabel: {
    fontSize: sp(16),
    color: '#666',
  },
});
