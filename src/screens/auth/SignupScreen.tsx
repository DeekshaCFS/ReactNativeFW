// src/screens/auth/SignupScreen.tsx
// Java: TouchLessSignupActivity / touchless_signup_activity.xml
import {
  View, TextInput, Text, Image, Pressable,
  ImageBackground, FlatList, Alert, StyleSheet,
  KeyboardAvoidingView, ScrollView, Platform, StatusBar,
} from 'react-native';
import Modal from '../../components/AppModal';
import { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppButton from '../../components/AppButton';
import { AuthHelp } from '../../components/AuthExtras';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { GlobalStyles } from '../../styles/globalStyles';
import { COLORS } from '../../theme/theme';
import { sp, dp } from '../../utils/responsive';
import { getCountryList } from '../../api/countryDetails/countryDetailsService';
import { getOtpRegister } from '../../api/signUp/signUpService';
import type { GetCountryListResultData } from '../../api/countryDetails/countryDetails.types';

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

// Java wraps these in a ConstraintLayout that centres the content vertically.
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

  const SHOW_QA_OTP = true;

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

  const signup = async () => {
    if (loading) return; // guard against double-fire from keyboard submit + button tap
    const problem = validate();
    setError(problem ?? '');
    if (problem) return;
    if (!selectedCountry) {
      Alert.alert('Select Country', 'Please select your country.');
      return;
    }
    const contact = useEmail ? email.trim() : mobile;
    try {
      setLoading(true);
      // legacy sends RAW mobile number + CountryDetailsId separately — no dial-code concatenation
      const response = await getOtpRegister({
        EmailId: useEmail ? contact : '',
        ContactNo: useEmail ? '' : contact,
        CountryDetailsId: selectedCountry.CountryDetailsId ?? 0,
      });
      if (response.Code === '404') {
        Alert.alert('Error', response.Message || 'Something went wrong. Please try again.');
        if (response.Message?.toLowerCase().includes('already exist')) {
          navigation.navigate('Login');
        }
        return;
      }
      const result = response?.ResultData;
      if (response.Code !== '200' || !result?.OTP) {
        Alert.alert('Error', 'Failed to get OTP. Please try again.');
        return;
      }

      if (SHOW_QA_OTP) Alert.alert('QA OTP', `OTP IS: ${result.OTP}`);

      navigation.navigate('Otp', {
        mobile: contact,
        countryCode: selectedCountry.CountryCode ?? '',
        countryDetailsId: selectedCountry.CountryDetailsId,
        touchlessSignupId: result.TouchlessSignupId,
        serverOtp: result.OTP,
        token: '', userId: 0, role: '',
        flow: 'signup',
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Something went wrong');
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
                onSubmitEditing={signup}
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
                onSubmitEditing={signup}
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

            <AppButton title="GET OTP" onPress={signup} loading={loading} />
          </View>

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

const styles = StyleSheet.create({
  flagIcon:      { width: dp(30), height: dp(30), margin: dp(10), marginLeft: 0, resizeMode: 'contain' },
  flagIconSmall: { width: dp(25), height: dp(25), margin: dp(8), resizeMode: 'contain' },
  countryRow:    { flexDirection: 'row', alignItems: 'center' },
  searchInput:   { margin: dp(5), fontSize: sp(16), color: COLORS.textBlack },
  toggle:        { alignSelf: 'center', padding: dp(8) },
  toggleText:    { color: '#0040FF', fontSize: sp(15), fontWeight: 'bold' },
});
