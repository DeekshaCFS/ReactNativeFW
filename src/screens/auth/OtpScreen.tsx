// src/screens/auth/OtpScreen.tsx
import {
  View, TextInput, Text, Image, ImageBackground,
  TouchableOpacity, StyleSheet, Pressable,
  KeyboardAvoidingView, ScrollView, Platform, StatusBar,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../../theme/theme';
import { GlobalStyles } from '../../styles/globalStyles';
import { AuthBackButton } from '../../components/AuthExtras';
import { completeLogin } from '../../utils/completeLogin';
import { isAccountEnabled, isBiometricAvailable, promptBiometric, addBiometricAccount } from '../../utils/biometricAuth';
import BiometricEnableDialog from '../../components/BiometricEnableDialog';
import type { LoginSession } from '../../utils/completeLogin';
import { urlLogin } from '../../api/auth/loginService';
import { getOtpRegister } from '../../api/signUp/signUpService';
import { getAndroidId } from '../../utils/deviceId';
import { sp, dp } from '../../utils/responsive';
import { showFailureMsg, showSuccessMsg, showToast } from '../../utils/toast';
import { SHOW_QA_OTP } from '../../config/qa';

type AuthStackParamList = {
  Otp: {
    mobile: string; serverOtp: number; token: string;
    userId: number; role: string; ownerId: number;
    flow: 'login' | 'signup';
    countryDetailsId?: number;
    touchlessSignupId?: number;
  };
  CompanyDetails: {
    emailOrContactNo: string;
    touchlessSignupId: number;
    countryDetailsId: number;
  };
};

const OTP_LENGTH = 4;
const OTP_EXPIRY_SECONDS = 270;
const RESEND_COOLDOWN = 60;

export default function OtpScreen() {
  const route = useRoute<RouteProp<AuthStackParamList, 'Otp'>>();
  const navigation = useNavigation<any>();
  const {
    mobile, serverOtp, token, userId, role, ownerId,
    flow, countryDetailsId, touchlessSignupId,
  } = route.params;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [expiryTimer, setExpiryTimer] = useState(OTP_EXPIRY_SECONDS);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpExpired, setOtpExpired] = useState(false);
  const [currentOtp, setCurrentOtp] = useState(serverOtp);
  const [loading, setLoading] = useState(false);
  const [pendingSession, setPendingSession] = useState<LoginSession | null>(null);

  // "Enable Biometric Login?" dialog result: Enable / Not Now both finish the login.
  const finishPending = async (enable: boolean) => {
    const sess = pendingSession;
    setPendingSession(null);
    if (!sess) return;
    if (enable && (await promptBiometric('Authenticate to enable biometric login'))) {
      await addBiometricAccount(sess.mobile);
      showSuccessMsg('Biometric Login Enabled');
    }
    await completeLogin(sess);
  };

  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));
  const isOtpComplete = otp.every((d) => d !== '');

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  // Java VerifyOTPActivity: Toast "OTP IS::<otp>" (LENGTH_LONG) when the screen opens.
  useEffect(() => {
    if (SHOW_QA_OTP) showToast(`OTP IS::${serverOtp}`, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (expiryTimer <= 0) { setOtpExpired(true); return; }
    const timer = setInterval(() => setExpiryTimer((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [expiryTimer]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const verifyOtp = async () => {
    if (otpExpired) { showFailureMsg('Please resend OTP.'); return; }
    if (!isOtpComplete) { showFailureMsg('Please enter complete OTP'); return; }
    if (Number(otp.join('')) !== Number(currentOtp)) {
      showFailureMsg('Please enter correct OTP'); return;
    }
    try {
      setLoading(true);

      if (flow === 'signup') {
        // legacy: OTP-verified signup goes to WelcomeActivity (company details) —
        // the account isn't created until RegisterOwner is called there.
        navigation.navigate('CompanyDetails', {
          emailOrContactNo: mobile,
          touchlessSignupId,
          countryDetailsId,
        });
        return;
      }

      // flow === 'login'
      const session = { userId, token, role, ownerId, mobile };
      // First login on this device: offer Fingerprint / Face / MPIN quick login before entering
      // the app. The session is persisted by the setup screen (or its "Maybe later").
      if ((await isBiometricAvailable()) && !(await isAccountEnabled(session.mobile))) {
        setPendingSession(session);
        return;
      }
      await completeLogin(session);
    } catch (err: any) {
      showFailureMsg(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendTimer > 0) return;
    try {
      let newOtp: number | undefined;
      if (flow === 'signup') {
        const response = await getOtpRegister({
          EmailId: mobile.includes('@') ? mobile : '',
          ContactNo: mobile.includes('@') ? '' : mobile,
          CountryDetailsId: countryDetailsId ?? 0,
        });
        newOtp = response?.ResultData?.OTP;
      } else {
        const androidId = await getAndroidId();
        const response = await urlLogin({
          UserName: mobile, Password: '', AndroidID: androidId, UserPreferredLanguage: 'en',
        });
        newOtp = Number(response?.ResultData?.OTP);
      }
      setOtp(Array(OTP_LENGTH).fill(''));
      setExpiryTimer(OTP_EXPIRY_SECONDS);
      setOtpExpired(false);
      setResendTimer(RESEND_COOLDOWN);
      setCurrentOtp(newOtp ?? currentOtp);
      showSuccessMsg('A new OTP has been sent.');
    } catch (err: any) {
      showFailureMsg(err?.message || 'Failed to resend OTP');
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    if (value !== '') {
      updated[index] = value;
      setOtp(updated);
      if (index < OTP_LENGTH - 1) { inputRefs.current[index + 1]?.focus(); setFocusedIndex(index + 1); }
      return;
    }
    updated[index] = '';
    setOtp(updated);
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key !== 'Backspace') return;
    if (otp[index] === '' && index > 0) {
      const updated = [...otp];
      updated[index - 1] = '';
      setOtp(updated);
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/ic_splash_background.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
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

          <Text style={GlobalStyles.title}>Verify</Text>
          <Text style={GlobalStyles.subtitle}>
            You will receive a {OTP_LENGTH} digit OTP{'\n'}for verification
          </Text>

          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                value={digit}
                keyboardType="number-pad"
                maxLength={1}
                onChangeText={(val) => handleOtpChange(val, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key ?? '', index)}
                onFocus={() => setFocusedIndex(index)}
                style={styles.otpInput}
                cursorColor={COLORS.black}
              />
            ))}
          </View>

          {otpExpired && (
            <Text style={styles.expiredText}>OTP expired. Please resend OTP.</Text>
          )}

          <Pressable
            style={[styles.verifyButton, { opacity: isOtpComplete && !otpExpired && !loading ? 1 : 0.6 }]}
            onPress={verifyOtp}
            disabled={!isOtpComplete || otpExpired || loading}
          >
            <Text style={styles.verifyText}>{loading ? 'Verifying...' : 'VERIFY'}</Text>
          </Pressable>

          <View style={styles.resendRow}>
            {!otpExpired && <Text style={styles.timerText}>{formatTime(expiryTimer)}</Text>}
            <Text style={styles.resendText}>Did not get the code?</Text>
            <Pressable onPress={resendOtp} disabled={resendTimer > 0} hitSlop={8}>
              <Text style={[styles.resendLink, resendTimer > 0 && { color: 'gray' }]}>
                {resendTimer > 0 ? `Resend in ${formatTime(resendTimer)}` : 'Resend'}
              </Text>
            </Pressable>
          </View>

          <View>
            <AuthBackButton onPress={() => navigation.goBack()} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <BiometricEnableDialog
        visible={!!pendingSession}
        onEnable={() => finishPending(true)}
        onNotNow={() => finishPending(false)}
      />
    </ImageBackground>
  );
}

// activity_mobile_no_verification_touchless.xml: 4 line-style cells (48dp wide, 2dp
// light_gray underline, 10dp apart), 25dp-margin Verify button, 20dp-margin resend row.
const styles = StyleSheet.create({
  bg:           { flex: 1 },
  container:    { flexGrow: 1, justifyContent: 'center', paddingBottom: dp(20) },
  otpRow:       { flexDirection: 'row', justifyContent: 'center', marginVertical: dp(20), marginTop: dp(25) },
  otpInput:     {
    width: dp(48),
    height: dp(48),
    marginHorizontal: dp(5),
    textAlign: 'center',
    fontSize: sp(18),
    color: '#000',
    padding: 0,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.lightGray,
  },
  expiredText:  { color: COLORS.primary, textAlign: 'center', margin: dp(5), fontSize: sp(14) },
  verifyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: dp(34),
    minHeight: dp(48),
    alignItems: 'center',
    justifyContent: 'center',
    margin: dp(25),
    marginHorizontal: dp(55),
  },
  verifyText:   { color: '#fff', fontSize: sp(18) },
  resendRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: dp(20) },
  timerText:    { color: COLORS.textBlack, fontSize: sp(16), margin: dp(10) },
  resendText:   { color: COLORS.textBlack, fontSize: sp(14), margin: dp(5) },
  resendLink:   { color: COLORS.primary, fontWeight: 'bold', fontSize: sp(16), margin: dp(5) },
});
