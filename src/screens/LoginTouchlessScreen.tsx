import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {getTouchlessApiConfig, HARDCODED_USER_ID, touchlessApi} from '../api/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {setCurrentUserId} from '../state/session';
import type {RootStackParamList} from './VerifyOTPScreen';


type LoginTouchlessScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Login'
>;

const WHATSAPP_NUMBER = '919315228028';
const WHATSAPP_MESSAGE =
  'Hello, I am having trouble logging in to FieldWeb. Please help';

const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

const LoginTouchlessScreen = ({navigation}: LoginTouchlessScreenProps) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Hindi'>(
    'English',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedMobile = useMemo(() => mobileNumber.trim(), [mobileNumber]);
  const isApiConfigured = useMemo(() => {
    const {baseUrl} = getTouchlessApiConfig();
    return !baseUrl.includes('example.com');
  }, []);

  const validateLogin = () => {
    if (!trimmedMobile) {
      setError('Enter your mobile number');
      return false;
    }

    if (!PHONE_REGEX.test(trimmedMobile)) {
      setError('Please enter a valid number');
      return false;
    }

    setError('');
    return true;
  };

  const handleLogin = async () => {
    if (!validateLogin()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isApiConfigured) {
        const response = await touchlessApi.doTouchlessLogin<{
          otp?: string | number;
          OTP?: string | number;
          userOtp?: string | number;
          UserOtp?: string | number;
          userId?: string | number;
          UserId?: string | number;
          id?: string | number;
          Id?: string | number;
          countryName?: string;
          CountryName?: string;
          resultData?: Record<string, unknown>;
          ResultData?: Record<string, unknown>;
        }>({
          userName: trimmedMobile,
          password: '',
          preferredLanguage: selectedLanguage,
        });

        const resultData = response?.resultData ?? response?.ResultData ?? {};
        const userOtpRaw =
          response?.otp ??
          response?.OTP ??
          response?.userOtp ??
          response?.UserOtp ??
          resultData.otp ??
          resultData.OTP ??
          resultData.userOtp ??
          resultData.UserOtp;
        const apiUserIdRaw =
          response?.userId ??
          response?.UserId ??
          response?.id ??
          response?.Id ??
          resultData.userId ??
          resultData.UserId ??
          resultData.id ??
          resultData.Id;
        const countryNameRaw =
          response?.countryName ??
          response?.CountryName ??
          resultData.countryName ??
          resultData.CountryName;

        const parsedOtp =
          userOtpRaw !== undefined && userOtpRaw !== null
            ? String(userOtpRaw).trim()
            : '';
        const tokenRaw =
          response?.token ??
          response?.Token ??
          resultData.token ??
          resultData.Token ??
          null;
        const parsedApiUserId = Number(apiUserIdRaw);
        const resolvedUserId = Number.isFinite(parsedApiUserId)
          ? parsedApiUserId
          : HARDCODED_USER_ID;

        if (!parsedOtp) {
          throw new Error('OTP was not returned by login API.');
        }

        // Persist token if provided by login response so subsequent API calls
        // include Authorization header.
        try {
          if (tokenRaw !== null && tokenRaw !== undefined) {
            await AsyncStorage.setItem('userToken', String(tokenRaw));
          }
        } catch {
          // ignore storage errors, proceed to OTP flow
        }

        setCurrentUserId(resolvedUserId);
        navigation.navigate('VerifyOTP', {
          userId: trimmedMobile,
          userOtp: parsedOtp,
          apiUserId: resolvedUserId,
          fromWhere: 'FromLogin',
          countryName:
            countryNameRaw !== undefined && countryNameRaw !== null
              ? String(countryNameRaw)
              : undefined,
        });
        return;
      }

      Alert.alert(
        'Login request ready',
        'QA base URL is configured. If login still falls back here, verify your API config import order.',
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Unable to complete login right now.';
      Alert.alert('Login failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeLanguage = () => {
    const nextLanguage = selectedLanguage === 'English' ? 'Hindi' : 'English';
    setSelectedLanguage(nextLanguage);
    Alert.alert('Language changed', `Selected language: ${nextLanguage}`);
  };

  const handleSignup = () => {
    navigation.navigate('Signup', {
      loginMobNumber: trimmedMobile,
    });
  };

  const handleWhatsapp = async () => {
    try {
      const url = `https://wa.me/${WHATSAPP_NUMBER}/?text=${encodeURIComponent(
        WHATSAPP_MESSAGE,
      )}`;
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert('Unable to open WhatsApp', 'Please try again on a device.');
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open WhatsApp', 'Please try again later.');
    }
  };

  const handleVideo = () => {
    Alert.alert(
      'Video support',
      'Connect this button to your React Native video or YouTube help screen.',
    );
  };

  return (
    <ImageBackground
      source={require('./assets/ic_splash_background.png')}
      style={styles.background}
      resizeMode="cover">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Image
            source={require('./assets/ic_fieldweb_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.welcomeTitle}>Welcome</Text>
          <Text style={styles.subtitle}>
            Please login to gain touchless access to your account
          </Text>

          <View style={styles.formContainer}>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="Enter your mobile number"
              placeholderTextColor="#9E9E9E"
              value={mobileNumber}
              onChangeText={value => {
                setMobileNumber(value);
                if (error) {
                  setError('');
                }
              }}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              disabled={isSubmitting}
              android_ripple={{color: '#800000'}}
              style={({pressed}) => [
                styles.otpButton,
                isSubmitting ? styles.otpButtonDisabled : null,
                pressed ? styles.otpButtonPressed : null,
              ]}
              onPress={handleLogin}>
              <ImageBackground
                source={require('./assets/rounded_button.png')}
                style={styles.otpButtonBackground}
                imageStyle={styles.otpButtonBackgroundImage}
                resizeMode="stretch">
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.otpButtonText}>REQUEST OTP</Text>
                )}
              </ImageBackground>
            </Pressable>
          </View>

          <TouchableOpacity
            style={styles.languageRow}
            onPress={handleChangeLanguage}>
            <Image
              source={require('./assets/ic_language.png')}
              style={styles.languageIcon}
              resizeMode="contain"
            />
            <Text style={styles.languageText}>
              Change Language ({selectedLanguage})
            </Text>
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerLabel}>New to FieldWeb?</Text>
            <TouchableOpacity onPress={handleSignup}>
              <Text style={styles.registerLink}>Register Here</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.troubleText}>
            If you are having trouble Logging in
          </Text>

          <View style={styles.supportRow}>
            <TouchableOpacity
              onPress={handleWhatsapp}
              style={styles.supportIconWrapper}>
              <Image
                source={require('./assets/whatsapp.png')}
                style={styles.supportIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleVideo}
              style={styles.supportIconWrapper}>
              <Image
                source={require('./assets/video.png')}
                style={styles.supportIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 30,
  },
  logo: {
    width: 200,
    height: 70,
    marginTop: 50,
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 24,
    color: '#000000',
    textAlign: 'center',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 30,
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 30,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#424242',
    marginTop: 10,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#D32F2F',
  },
  errorText: {
    fontSize: 13,
    color: '#D32F2F',
    marginTop: 6,
  },
  otpButton: {
    borderRadius: 34,
    marginTop: 14,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  otpButtonPressed: {
    opacity: 0.9,
  },
  otpButtonDisabled: {
    opacity: 0.75,
  },
  otpButtonBackground: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  otpButtonBackgroundImage: {
    borderRadius: 34,
  },
  otpButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  languageIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
    tintColor: '#424242',
  },
  languageText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  registerLabel: {
    fontSize: 16,
    color: '#9E9E9E',
    paddingHorizontal: 5,
  },
  registerLink: {
    fontSize: 16,
    color: '#1976D2',
    marginLeft: 10,
    paddingHorizontal: 5,
    fontWeight: '600',
  },
  troubleText: {
    fontSize: 16,
    color: '#616161',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  supportRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  supportIconWrapper: {
    marginHorizontal: 10,
  },
  supportIcon: {
    width: 72,
    height: 72,
  },
});

export default LoginTouchlessScreen;
