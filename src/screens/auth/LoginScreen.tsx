// src/screens/auth/LoginScreen.tsx
// Java: LoginTouchlessActivity / activity_login_touchless.xml
import {
  View, TextInput, Text, Image, ImageBackground,
  Pressable, Platform, KeyboardAvoidingView,
  ScrollView, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { isBiometricAvailable, isAccountEnabled, promptBiometric, addBiometricAccount } from '../../utils/biometricAuth';
import { completeLogin, fetchBiometricSession } from '../../utils/completeLogin';
import BiometricEnableDialog from '../../components/BiometricEnableDialog';
import AppButton from '../../components/AppButton';
import { AuthHelp } from '../../components/AuthExtras';
import LanguagePickerModal from '../../components/LanguagePickerModal';
import { COLORS } from '../../theme/theme';
import { GlobalStyles } from '../../styles/globalStyles';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { dp, sp } from '../../utils/responsive';
import { urlLogin } from '../../api/auth/loginService';
import { getAndroidId } from '../../utils/deviceId';
import LanguageIcon from '../../components/LanguageIcon';
import { setAppLanguage, type LanguageCode } from '../../i18n';
import i18n from 'i18next';
import { showFailureMsg, showSuccessMsg, showToast } from '../../utils/toast';
import { SHOW_QA_OTP } from '../../config/qa';

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  Otp: {
    mobile: string;
    countryCode?: string;
    serverOtp: number;
    token: string;
    userId: number;
    role: string;
    ownerId?: number;
    flow: 'login' | 'signup';
    countryDetailsId?: number;
    touchlessSignupId?: number;
  };
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);

  const [bioAvailable, setBioAvailable] = useState(false);
  const [enableDialog, setEnableDialog] = useState(false);

  useEffect(() => { requestLocationPermission(); }, []);

  // Java: the biometric button is only shown when the device can authenticate.
  useEffect(() => { isBiometricAvailable().then(setBioAvailable); }, []);


  // Java validateMobileNumorEmailId(): anything with '@' must be a valid email,
  // otherwise it is treated as a mobile number.
  const validate = (): string | null => {
    const value = input.trim();
    if (!value) return 'Enter Your Mobile No. Or Email';
    if (value.includes('@')) {
      return EMAIL_REGEX.test(value) ? null : 'Please enter valid Email Id';
    }
    const digits = value.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15 ? null : 'Please enter valid Mobile Number';
  };

  const handleGetOtp = async () => {
    const problem = validate();
    setError(problem ?? '');
    if (problem) return;
    const value = input.trim();
    const userName = value.includes('@') ? value : value.replace(/\D/g, '');
    try {
      setLoading(true);
      const androidId = await getAndroidId();
      const response = await urlLogin({
        UserName: userName,
        Password: '',
        AndroidID: androidId,
        UserPreferredLanguage: 'en',
      });
      const result = response?.ResultData;

      if (response?.Code !== '200' || !result) {
        // legacy: any non-success response here means "not registered" -> go to Signup
        navigation.navigate('Signup');
        return;
      }
      if (!result.OTP) { showFailureMsg('OTP not received'); return; }

      // Java LoginTouchlessActivity: Toast "OTP IS::<otp>" (LENGTH_SHORT).
      if (SHOW_QA_OTP) showToast(`OTP IS::${result.OTP}`);

      navigation.navigate('Otp', {
        mobile: userName,
        serverOtp: Number(result.OTP),
        token: result.Token ?? '',
        userId: result.UserID ?? 0,
        role: result.UserGroupName ?? '',
        ownerId: result.OwnerId ?? 0,
        flow: 'login',
      });
    } catch (err: any) {
      showFailureMsg(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Java btnBiometricLogin: validate the typed id; if this device already enabled biometric for it,
  // authenticate straight away, otherwise offer "Enable Biometric Login?". No OTP either way.
  const bioLoginId = () => {
    const value = input.trim();
    return value.includes('@') ? value : value.replace(/\D/g, '');
  };

  // Java userBioMetricAuth(): login call after the prompt succeeds; unknown account -> Signup.
  const biometricLogin = async (enable: boolean) => {
    const reason = enable ? 'Authenticate to enable biometric login' : 'Authenticate to login';
    if (!(await promptBiometric(reason))) return;
    const loginId = bioLoginId();
    try {
      setLoading(true);
      const session = await fetchBiometricSession(loginId);
      if (!session) { navigation.navigate('Signup'); return; }
      if (enable) { await addBiometricAccount(loginId); showSuccessMsg('Biometric Login Enabled'); }
      await completeLogin(session);
    } catch (err: any) {
      showFailureMsg(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    const problem = validate();
    setError(problem ?? '');
    if (problem) return;
    if (await isAccountEnabled(bioLoginId())) await biometricLogin(false);
    else setEnableDialog(true);
  };

  const requestLocationPermission = async () => {
    try {
      const permission = Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
      const result = await request(permission);
      if (result !== RESULTS.GRANTED) showToast('Location permission is required');
    } catch (e) { console.log(e); }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/ic_splash_background.png')}
      style={GlobalStyles.container}
      resizeMode="cover"
    >
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={GlobalStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={GlobalStyles.header}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={GlobalStyles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={GlobalStyles.title}>Welcome</Text>
          <Text style={GlobalStyles.subtitle}>
            Please enter your details{'\n'}to access your account
          </Text>

          <View style={GlobalStyles.form}>
            <TextInput
              placeholder="Enter Your Mobile No. Or Email"
              placeholderTextColor={COLORS.authText}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[GlobalStyles.input, !!error && GlobalStyles.inputError]}
              onChangeText={t => { setInput(t); if (error) setError(''); }}
              value={input}
              cursorColor={COLORS.primary}
              returnKeyType="done"
              onSubmitEditing={handleGetOtp}
            />
            {!!error && <Text style={GlobalStyles.errorText}>{error}</Text>}

            <AppButton title="GET OTP" onPress={handleGetOtp} loading={loading} />

            {bioAvailable && (<>
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            <Pressable
              style={styles.bioButton}
              onPress={handleBiometric}
            >
              <Ionicons name="finger-print" size={dp(28)} color={COLORS.primary} />
              <Text style={styles.bioText}>Login with Biometric</Text>
            </Pressable>
            </>)}
          </View>

          <Pressable style={GlobalStyles.languageRow} onPress={() => setLangModalVisible(true)}>
            <LanguageIcon width={dp(24)} height={dp(24)} />
            <Text style={GlobalStyles.languageText}>Change Language</Text>
          </Pressable>

          <View style={GlobalStyles.footerRow}>
            <Text style={GlobalStyles.footerText}>New to FieldWeb?</Text>
            <Text style={GlobalStyles.link} onPress={() => navigation.navigate('Signup')}>
              Register Here
            </Text>
          </View>

          <AuthHelp topic="logging in" />
        </ScrollView>
      </KeyboardAvoidingView>

      <BiometricEnableDialog
        visible={enableDialog}
        onEnable={() => { setEnableDialog(false); biometricLogin(true); }}
        onNotNow={() => setEnableDialog(false)}
      />

      <LanguagePickerModal
        visible={langModalVisible}
        selected={i18n.language as LanguageCode}
        onSelect={code => { setAppLanguage(code); setLangModalVisible(false); }}
        onCancel={() => setLangModalVisible(false)}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  orRow:     { flexDirection: 'row', alignItems: 'center', marginHorizontal: dp(25), marginVertical: dp(12) },
  orLine:    { flex: 1, height: 2, backgroundColor: '#C4C4C4' },
  orText:    { marginHorizontal: dp(12), fontSize: sp(16), color: COLORS.black },
  bioButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#E10019', borderRadius: dp(34), backgroundColor: '#fff',
    marginHorizontal: dp(25), marginVertical: dp(10), minHeight: dp(54), elevation: 3,
  },
  bioText:   { color: COLORS.black, fontSize: sp(18), fontWeight: '600', marginLeft: dp(18) },
});
