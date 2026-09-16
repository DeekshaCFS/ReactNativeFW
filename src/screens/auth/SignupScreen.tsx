// src/screens/auth/SignupScreen.tsx
import {
  View, TextInput, Text, Image, Pressable, Modal,
  ImageBackground, FlatList, Alert, StyleSheet,
  KeyboardAvoidingView, ScrollView, Platform, StatusBar,
} from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppButton from '../../components/AppButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { GlobalStyles } from '../../styles/globalStyles';
import { COLORS } from '../../theme/theme';
import { ms, sp, scale } from '../../utils/responsive';
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

export default function SignupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [countries, setCountries] = useState<GetCountryListResultData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<GetCountryListResultData | null>(null);
  const [mobile, setMobile] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(true);

  const isValidMobile = useMemo(() => {
    const cleaned = mobile.replace(/\D/g, '');
    return cleaned.length >= 7 && cleaned.length <= 15;
  }, [mobile]);

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

  const signup = async () => {
    if (loading) return; // guard against double-fire from keyboard submit + button tap
    if (!isValidMobile || !selectedCountry) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid mobile number (7–15 digits).');
      return;
    }
    try {
      setLoading(true);
      console.log('[signup] payload', { EmailId: '', ContactNo: mobile, CountryDetailsId: selectedCountry.CountryDetailsId });
      // legacy sends RAW mobile number + CountryDetailsId separately — no dial-code concatenation
      const response = await getOtpRegister({
        EmailId: '',
        ContactNo: mobile,
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
        mobile,
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
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : ms(20)}
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

          <Text style={GlobalStyles.title}>Sign Up</Text>
          <Text style={GlobalStyles.subtitle}>
            Please enter your details{'\n'}to signup
          </Text>

          <Pressable
            style={[GlobalStyles.dropdownWrapper, styles.dropdownRow]}
            onPress={() => !countriesLoading && setCountryModalVisible(true)}
          >
            {selectedCountry ? (
              <>
                {!!selectedCountry.CountryFlag && (
                  <Image source={{ uri: selectedCountry.CountryFlag }} style={styles.flagIcon} />
                )}
                <Text style={GlobalStyles.dropdownText}>{selectedCountry.CountryName}    [+{selectedCountry.CountryCode}]          </Text>
                <Ionicons name="chevron-down" size={20} color="#3a3a3a" />
              </>
            ) : (
              <Text style={GlobalStyles.dropdownText}>
                {countriesLoading ? 'Loading countries...' : 'Select country'}
              </Text>
            )}
          </Pressable>

          <Modal transparent animationType="fade" visible={countryModalVisible}>
            <Pressable
              style={GlobalStyles.modalOverlay}
              onPress={() => setCountryModalVisible(false)}
            >
              <View style={GlobalStyles.modalContent}>
                <FlatList
                  data={countries}
                  keyExtractor={(item) => String(item.CountryDetailsId)}
                  renderItem={({ item }) => (
                    <Pressable
                      style={[GlobalStyles.modalItem, styles.dropdownRow]}
                      onPress={() => { setSelectedCountry(item); setCountryModalVisible(false); }}
                    >
                      {!!item.CountryFlag && (
                        <Image source={{ uri: item.CountryFlag }} style={styles.flagIconSmall} />
                      )}
                      <Text style={GlobalStyles.modalItemText}>
                        {item.CountryName} (+{item.CountryCode})
                      </Text>
                    </Pressable>
                  )}
                />
              </View>
            </Pressable>
          </Modal>

          <TextInput
            keyboardType="phone-pad"
            placeholder="Enter Your Mobile Number"
            style={[
              GlobalStyles.input,
              !isValidMobile && mobile.length > 0 && GlobalStyles.inputError,
            ]}
            onChangeText={setMobile}
            value={mobile}
            maxLength={15}
            cursorColor={COLORS.primary}
            returnKeyType="done"
            onSubmitEditing={signup}
          />

          {!isValidMobile && mobile.length > 0 && (
            <Text style={GlobalStyles.errorText}>Please enter a valid mobile number</Text>
          )}

          <Text style={{ textAlign: 'center', marginVertical: ms(8), fontSize: sp(14), color: COLORS.textTertiary }}>
            Login with Email (coming soon)
          </Text>

          <AppButton title="GET OTP" onPress={signup} loading={loading} />

          <Text style={GlobalStyles.footerText}>
            Already Registered?{'     '}
            <Text style={GlobalStyles.link} onPress={() => navigation.navigate('Login')}>Login</Text>
          </Text>

          <Text style={GlobalStyles.helpText}>If you are having trouble signing up</Text>

          <View style={GlobalStyles.helpButtonsRow}>
            <Pressable style={[GlobalStyles.helpButton, GlobalStyles.whatsappButton]}>
              <Ionicons name="logo-whatsapp" size={scale(22)} color="#FFFFFF" />
              <Text style={GlobalStyles.helpButtonText}>WhatsApp</Text>
            </Pressable>
            <Pressable style={[GlobalStyles.helpButton, GlobalStyles.videoButton]}>
              <Ionicons name="play-circle" size={scale(22)} color="#C22032" />
              <Text style={GlobalStyles.helpButtonText}>Video</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  dropdownRow:    { flexDirection: 'row', alignItems: 'center', gap: ms(8) },
  flagIcon:       { width: ms(24), height: ms(16), borderRadius: 2 },
  flagIconSmall:  { width: ms(20), height: ms(14), borderRadius: 2 },
});