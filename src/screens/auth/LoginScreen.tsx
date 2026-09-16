// src/screens/auth/LoginScreen.tsx
import {
  View, TextInput, Text, Image, ImageBackground,
  Pressable, Alert, Platform, KeyboardAvoidingView,
  ScrollView, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState, useMemo, useEffect } from 'react';
import AppButton from '../../components/AppButton';
import { COLORS } from '../../theme/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { GlobalStyles } from '../../styles/globalStyles';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { ms, scale } from '../../utils/responsive';
import { urlLogin } from '../../api/auth/loginService';
import { getAndroidId } from '../../utils/deviceId';
import LanguageIcon from '../../components/LanguageIcon';

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

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { requestLocationPermission(); }, []);

  const isValidMobile = useMemo(() => {
    const cleaned = mobile.replace(/\D/g, '');
    return cleaned.length >= 7 && cleaned.length <= 15;
  }, [mobile]);

  const SHOW_QA_OTP = true; // mirrors legacy commented-out toast; flip off when QA is done

  // const handleGetOtp = async () => {
  //   const cleanedMobile = mobile.replace(/\D/g, '');
  //   if (!cleanedMobile) { Alert.alert('Error', 'Enter mobile number'); return; }
  //   try {
  //     setLoading(true);
  //     const { exists } = await checkMobileExists(cleanedMobile);
  //     if (!exists) { navigation.navigate('Signup'); return; }

  //     const androidId = await getAndroidId();
  //     const response = await urlLogin({
  //       UserName: cleanedMobile,
  //       Password: '',
  //       AndroidID: androidId,
  //       UserPreferredLanguage: 'en',
  //     });
  //     const result = response?.ResultData;
  //     if (!result || response.Code !== '200') {
  //       Alert.alert('Login Failed', response?.Message || 'Invalid response');
  //       return;
  //     }
  //     if (!result.OTP) { Alert.alert('Login Failed', 'OTP not received'); return; }

  //     if (SHOW_QA_OTP) Alert.alert('QA OTP', `OTP IS: ${result.OTP}`);

  //     navigation.navigate('Otp', {
  //       mobile: cleanedMobile,
  //       serverOtp: Number(result.OTP),
  //       token: result.Token ?? '',
  //       userId: result.UserID ?? 0,
  //       role: result.UserGroupName ?? '',
  //       ownerId: result.OwnerId ?? 0,
  //       flow: 'login',
  //     });
  //   } catch (err: any) {
  //     Alert.alert('Login Failed', err?.message || 'Something went wrong');
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleGetOtp = async () => {
    const cleanedMobile = mobile.replace(/\D/g, '');
    if (!cleanedMobile) { Alert.alert('Error', 'Enter mobile number'); return; }
    try {
      setLoading(true);
      const androidId = await getAndroidId();
      const response = await urlLogin({
        UserName: cleanedMobile,
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
      if (!result.OTP) { Alert.alert('Login Failed', 'OTP not received'); return; }

      if (SHOW_QA_OTP) Alert.alert('QA OTP', `OTP IS: ${result.OTP}`);

      navigation.navigate('Otp', {
        mobile: cleanedMobile,
        serverOtp: Number(result.OTP),
        token: result.Token ?? '',
        userId: result.UserID ?? 0,
        role: result.UserGroupName ?? '',
        ownerId: result.OwnerId ?? 0,
        flow: 'login',
      });
    } catch (err: any) {
      Alert.alert('Login Failed', err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const permission = Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
      const result = await request(permission);
      if (result !== RESULTS.GRANTED) Alert.alert('Permission Required', 'Location permission is required');
    } catch (error) { console.log(error); }
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

          <Text style={GlobalStyles.title}>Welcome</Text>
          <Text style={GlobalStyles.subtitle}>
            Please enter your details{'\n'}to access your account
          </Text>

          <TextInput
            placeholder="Enter Your Mobile No. Or Email"
            keyboardType="phone-pad"
            style={[
              GlobalStyles.input,
              !isValidMobile && mobile.length > 0 && GlobalStyles.inputError,
            ]}
            onChangeText={setMobile}
            value={mobile}
            maxLength={15}
            cursorColor={COLORS.primary}
            returnKeyType="done"
            onSubmitEditing={handleGetOtp}
          />

          {!isValidMobile && mobile.length > 0 && (
            <Text style={GlobalStyles.errorText}>
              Please enter a valid mobile number (7–15 digits)
            </Text>
          )}

          <AppButton title="GET OTP" onPress={handleGetOtp} loading={loading} />

          <View style={GlobalStyles.languageRow}>
            <LanguageIcon />
            <Text style={GlobalStyles.languageText}> Change Language </Text>
          </View>

          <Text style={GlobalStyles.footerText}>
            New to FieldWeb?{'     '}
            <Text style={GlobalStyles.link} onPress={() => navigation.navigate('Signup')}>
              Register Here
            </Text>
          </Text>

          <Text style={GlobalStyles.helpText}>If you are having trouble Logging in</Text>

          <View style={GlobalStyles.helpButtonsRow}>
            <Pressable style={[GlobalStyles.helpButton, GlobalStyles.whatsappButton]}>
              <Ionicons name="logo-whatsapp" size={scale(20)} color="#FFFFFF" />
              <Text style={GlobalStyles.helpButtonText}>WhatsApp</Text>
            </Pressable>
            <Pressable style={[GlobalStyles.helpButton, GlobalStyles.videoButton]}>
              <Ionicons name="play-circle" size={scale(20)} color="#C22032" />
              <Text style={GlobalStyles.helpButtonText}>Video</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}