// src/components/BiometricEnableDialog.tsx
// Java dialog_biometric_login.xml: "Enable Biometric Login?" with Enable / Not Now.
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppModal from './AppModal';
import { COLORS } from '../theme/theme';
import { dp, sp } from '../utils/responsive';

import { useTranslation } from 'react-i18next';
type Props = { visible: boolean; onEnable: () => void; onNotNow: () => void };

export default function BiometricEnableDialog({ visible, onEnable, onNotNow }: Props) {
  const { t } = useTranslation();
  return (
    <AppModal transparent visible={visible} animationType="fade" onRequestClose={onNotNow}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.icon}>
            <Ionicons name="finger-print" size={dp(44)} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>{t('rn_enable_biometric_login')}</Text>
          <Text style={styles.text}>{t('rn_use_fingerprint_face_id_for_faster_login_n')}</Text>
          <Pressable style={styles.enableBtn} onPress={onEnable}>
            <Text style={styles.enableText}>{t('rn_enable')}</Text>
          </Pressable>
          <Pressable style={styles.notNowBtn} onPress={onNotNow}>
            <Text style={styles.notNowText}>{t('rn_not_now')}</Text>
          </Pressable>
        </View>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', paddingHorizontal: dp(20) },
  dialog:     { backgroundColor: '#fff', borderRadius: dp(20), padding: dp(20), alignItems: 'center' },
  icon:       {
    width: dp(80), height: dp(80), borderRadius: dp(40), backgroundColor: '#FFEFF1',
    alignItems: 'center', justifyContent: 'center', marginBottom: dp(16),
  },
  title:      { fontSize: sp(20), fontWeight: '700', color: '#1B2340', textAlign: 'center' },
  text:       { fontSize: sp(15), color: '#6B7280', textAlign: 'center', marginTop: dp(10), marginBottom: dp(20) },
  enableBtn:  {
    alignSelf: 'stretch', backgroundColor: '#E4002B', borderRadius: dp(34),
    minHeight: dp(54), alignItems: 'center', justifyContent: 'center',
  },
  enableText: { color: '#fff', fontSize: sp(18), fontWeight: '700' },
  notNowBtn:  {
    alignSelf: 'stretch', borderWidth: 1.5, borderColor: '#9CA3AF', borderRadius: dp(34),
    minHeight: dp(54), alignItems: 'center', justifyContent: 'center', marginTop: dp(14),
  },
  notNowText: { color: '#1B2340', fontSize: sp(18), fontWeight: '700' },
});
