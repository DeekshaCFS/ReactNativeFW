// src/screens/auth/SignupScreen.tsx
// Java: TouchLessSignupActivity / touchless_signup_activity.xml
import {
  View, TextInput, Text, Image, Pressable,
  ImageBackground, FlatList, StyleSheet,
  KeyboardAvoidingView, ScrollView, Platform, StatusBar,
} from 'react-native';
import Modal from '../../components/AppModal';
import { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppButton from '../../components/AppButton';
import { AuthHelp } from '../../components/AuthExtras';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GlobalStyles } from '../../styles/globalStyles';
import { COLORS } from '../../theme/theme';
import { sp, dp } from '../../utils/responsive';
import { getCountryList } from '../../api/countryDetails/countryDetailsService';
import { getOtpRegister } from '../../api/signUp/signUpService';
import type { GetCountryListResultData } from '../../api/countryDetails/countryDetails.types';
import { showFailureMsg } from '../../utils/toast';
import { isBiometricAvailable, promptBiometric } from '../../utils/biometricAuth';

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
  CompanyDetails: {
    emailOrContactNo: string;
    touchlessSignupId: number;
    countryDetailsId: number;
    displayName?: string;
  };
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Java wraps these in a ConstraintLayout that centres the content vertically.
// Java requestEmail() only: no ID token / server client id needed.
GoogleSignin.configure({});

const CENTER_CONTENT = { justifyContent: 'center' as const };

export default function SignupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [countries, setCountries] = useState<GetCountryListResultData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<GetCountryListResultData | null>(null);
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [useEmail, setUseEmail] = useState(false);
  const [error, setError] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [bioAvailable, setBioAvailable] = useState(false);

  // Same rule as Login: the biometric option only shows when the device can authenticate.
  useEffect(() => { isBiometricAvailable().then(setBioAvailable); }, []);


  useEffect(() => {
    (async () => {
      try {
        const res = await getCountryList();
        if (res.Code === '200' && res.ResultData) {
          setCountries(res.ResultData);
          const india = res.ResultData.find(c => c.CountryCode === '91');
          setSelectedCountry(india ?? res.ResultData[0] ?? null);
        }
      } finally {
        setCountriesLoading(false);
      }
    })();
  }, []);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    return q ? countries.filter(c => (c.CountryName ?? '').toLowerCase().includes(q)) : countries;
  }, [countries, countrySearch]);

  // Java validateMobileNumber() / validateEmailId()
  const validate = (): string | null => {
    if (useEmail) {
      const value = email.trim();
      if (!value) return 'Enter Your Email Id';
      return EMAIL_REGEX.test(value) ? null : 'Please enter valid Email Id';
    }
    const digits = mobile.replace(/\D/g, '');
    if (!digits) return 'Enter Your Mobile Number';
    return digits.length >= 7 && digits.length <= 15 ? null : 'Please enter valid Mobile Number';
  };

  // Java shows the Google sign-in block only for countries other than India (+91).
  const isIndia = !selectedCountry || selectedCountry.CountryCode === '91';

  const googleSignup = async () => {
    if (loading || !selectedCountry) return;
    try {
      await GoogleSignin.hasPlayServices();
      try { await GoogleSignin.signOut(); } catch {} // always show the account chooser, like Java
      const res: any = await GoogleSignin.signIn();
      const user = res?.data?.user ?? res?.user;
      if (!user?.email) {
        showFailureMsg('Sign in cancel');
        return;
      }
      await signup(user.email, user.name ?? '');
    } catch {
      showFailureMsg('Sign in cancel');
    }
  };

  // Biometric sign-up: validate the typed id, confirm the user with the device's
  // fingerprint / face prompt, then continue to company details without an OTP.
  const biometricSignup = async () => {
    if (loading) return;
    const problem = validate();
    setError(problem ?? '');
    if (problem) return;
    if (!(await promptBiometric('Authenticate to sign up'))) return;
    await signup(undefined, undefined, true);
  };

  const signup = async (googleEmail?: string, googleName?: string, skipOtp = false) => {
    if (loading) return; // guard against double-fire from keyboard submit + button tap
    const fromGoogle = typeof googleEmail === 'string';
    if (!fromGoogle) {
      const problem = validate();
      setError(problem ?? '');
      if (problem) return;
    }
    if (!selectedCountry) {
      showFailureMsg('Please select your country.');
      return;
    }
    const contact = fromGoogle ? googleEmail : useEmail ? email.trim() : mobile;
    const sendEmail = fromGoogle || useEmail;
    try {
      setLoading(true);
      // legacy sends RAW mobile number + CountryDetailsId separately — no dial-code concatenation
      const response = await getOtpRegister({
        EmailId: sendEmail ? contact : '',
        ContactNo: sendEmail ? '' : contact,
        CountryDetailsId: selectedCountry.CountryDetailsId ?? 0,
      });
      if (response.Code === '404') {
        showFailureMsg(response.Message || 'Something went wrong. Please try again.');
        if (response.Message?.toLowerCase().includes('already exist')) {
          navigation.navigate('Login');
        }
        return;
      }
      const result = response?.ResultData;
      if (response.Code !== '200' || !result?.OTP) {
        showFailureMsg('Failed to get OTP. Please try again.');
        return;
      }

      if (fromGoogle || skipOtp) {
        // Java navigateToWelcome(): Google / biometric sign-ups skip OTP verification.
        navigation.navigate('CompanyDetails', {
          emailOrContactNo: contact,
          touchlessSignupId: result.TouchlessSignupId ?? 0,
          countryDetailsId: selectedCountry.CountryDetailsId ?? 0,
          displayName: googleName,
        });
        return;
      }

      navigation.navigate('Otp', {
        mobile: contact,
        countryCode: selectedCountry.CountryCode ?? '',
        countryDetailsId: selectedCountry.CountryDetailsId,
        touchlessSignupId: result.TouchlessSignupId ?? 0,
        serverOtp: result.OTP,
        token: '', userId: 0, role: '',
        flow: 'signup',
      });
    } catch (err: any) {
      showFailureMsg(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
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
          contentContainerStyle={[GlobalStyles.scrollContent, CENTER_CONTENT]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[GlobalStyles.header, { marginTop: dp(24) }]}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={GlobalStyles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={GlobalStyles.title}>Signup</Text>
          <Text style={GlobalStyles.subtitle}>
            Please enter your details{'\n'}to signup
          </Text>

          <View style={[GlobalStyles.form, { marginTop: dp(10) }]}>
            <Pressable
              style={GlobalStyles.dropdownWrapper}
              onPress={() => !countriesLoading && setCountryModalVisible(true)}
            >
              {selectedCountry ? (
                <>
                  {!!selectedCountry.CountryFlag && (
                    <Image source={{ uri: selectedCountry.CountryFlag }} style={styles.flagIcon} />
                  )}
                  <Text style={[GlobalStyles.dropdownText, { paddingRight: dp(8) }]}>
                    {selectedCountry.CountryName}
                  </Text>
                  <Text style={[GlobalStyles.dropdownText, { paddingLeft: dp(8), flex: 1 }]}>
                    [+{selectedCountry.CountryCode}]
                  </Text>
                  <Ionicons name="chevron-down" size={dp(18)} color={COLORS.lightGray} />
                </>
              ) : (
                <Text style={GlobalStyles.dropdownText}>
                  {countriesLoading ? 'Loading countries...' : 'Select country'}
                </Text>
              )}
            </Pressable>

            {useEmail ? (
              <TextInput
                placeholder="Enter Email Id"
                placeholderTextColor={COLORS.authText}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={50}
                style={[GlobalStyles.input, !!error && GlobalStyles.inputError]}
                onChangeText={t => { setEmail(t); if (error) setError(''); }}
                value={email}
                cursorColor={COLORS.primary}
                returnKeyType="done"
                onSubmitEditing={() => signup()}
              />
            ) : (
              <TextInput
                placeholder="Enter Your Mobile Number"
                placeholderTextColor={COLORS.authText}
                keyboardType="number-pad"
                maxLength={15}
                style={[GlobalStyles.input, !!error && GlobalStyles.inputError]}
                onChangeText={t => { setMobile(t); if (error) setError(''); }}
                value={mobile}
                cursorColor={COLORS.primary}
                returnKeyType="done"
                onSubmitEditing={() => signup()}
              />
            )}
            {!!error && <Text style={GlobalStyles.errorText}>{error}</Text>}

            <Pressable
              style={styles.toggle}
              onPress={() => { setUseEmail(v => !v); setError(''); }}
            >
              <Text style={styles.toggleText}>
                {useEmail ? 'Login with Mobile' : 'Login with Email'}
              </Text>
            </Pressable>

            <AppButton title="GET OTP" onPress={() => signup()} loading={loading} />
          </View>

          {bioAvailable && (
            <>
              <View style={styles.bioOrRow}>
                <View style={styles.bioOrLine} />
                <Text style={styles.bioOrText}>OR</Text>
                <View style={styles.bioOrLine} />
              </View>
              <Pressable style={styles.bioButton} onPress={biometricSignup} disabled={loading}>
                <Ionicons name="finger-print" size={dp(28)} color={COLORS.primary} />
                <Text style={styles.bioText}>Signup with Biometric</Text>
              </Pressable>
            </>
          )}

          {!isIndia && (
            <View style={styles.googleWrap}>
              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>or Sign in with Google</Text>
                <View style={styles.orLine} />
              </View>
              <Pressable style={styles.googleBtn} onPress={googleSignup} disabled={loading}>
                <GoogleG size={dp(18)} />
                <Text style={styles.googleBtnText}>Sign In</Text>
              </Pressable>
            </View>
          )}

          <View style={GlobalStyles.footerRow}>
            <Text style={GlobalStyles.footerText}>Already Registered?</Text>
            <Text style={GlobalStyles.link} onPress={() => navigation.navigate('Login')}>Login</Text>
          </View>

          <AuthHelp topic="signing up" />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        transparent
        animationType="fade"
        visible={countryModalVisible}
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <Pressable
          style={GlobalStyles.modalOverlay}
          onPress={() => setCountryModalVisible(false)}
        >
          <Pressable style={GlobalStyles.modalContent} onPress={() => {}}>
            <TextInput
              placeholder="Search Country.."
              value={countrySearch}
              onChangeText={setCountrySearch}
              style={styles.searchInput}
              cursorColor={COLORS.primary}
              underlineColorAndroid={COLORS.primary}
            />
            <FlatList
              data={filteredCountries}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item) => String(item.CountryDetailsId)}
              renderItem={({ item }) => (
                <Pressable
                  style={[GlobalStyles.modalItem, styles.countryRow]}
                  onPress={() => {
                    setSelectedCountry(item);
                    setCountryModalVisible(false);
                    setCountrySearch('');
                  }}
                >
                  {!!item.CountryFlag && (
                    <Image source={{ uri: item.CountryFlag }} style={styles.flagIconSmall} />
                  )}
                  <Text style={GlobalStyles.modalItemText}>{item.CountryName}</Text>
                  <Text style={GlobalStyles.modalItemText}>[+{item.CountryCode}]</Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </ImageBackground>
  );
}

const GoogleG = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </Svg>
);

const styles = StyleSheet.create({
  bioOrRow:      { flexDirection: 'row', alignItems: 'center', marginHorizontal: dp(25), marginVertical: dp(12) },
  bioOrLine:     { flex: 1, height: 2, backgroundColor: '#C4C4C4' },
  bioOrText:     { marginHorizontal: dp(12), fontSize: sp(16), color: COLORS.black },
  bioButton:     {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#E10019', borderRadius: dp(34), backgroundColor: '#fff',
    marginHorizontal: dp(25), marginVertical: dp(10), minHeight: dp(54), elevation: 3,
  },
  bioText:       { color: COLORS.black, fontSize: sp(18), fontWeight: '600', marginLeft: dp(18) },
  googleWrap:    { alignSelf: 'stretch', paddingHorizontal: dp(5) },
  orRow:         { flexDirection: 'row', alignItems: 'center', margin: dp(10) },
  orLine:        { flex: 1, height: dp(1), backgroundColor: '#c0c0c0', marginHorizontal: dp(10) },
  orText:        { color: '#000', fontSize: sp(14) },
  googleBtn:     {
    alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: dp(16), height: dp(40), margin: dp(5), marginBottom: dp(20), borderRadius: dp(2),
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  googleBtnText: { color: '#757575', fontSize: sp(14), fontWeight: '600', marginLeft: dp(12) },
  flagIcon:      { width: dp(30), height: dp(30), margin: dp(10), marginLeft: 0, resizeMode: 'contain' },
  flagIconSmall: { width: dp(25), height: dp(25), margin: dp(8), resizeMode: 'contain' },
  countryRow:    { flexDirection: 'row', alignItems: 'center' },
  searchInput:   { margin: dp(5), fontSize: sp(16), color: COLORS.textBlack },
  toggle:        { alignSelf: 'center', padding: dp(8) },
  toggleText:    { color: '#0040FF', fontSize: sp(15), fontWeight: 'bold' },
});
