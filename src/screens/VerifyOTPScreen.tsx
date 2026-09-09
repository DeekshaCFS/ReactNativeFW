import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {getTouchlessApiConfig, HARDCODED_USER_ID, touchlessApi} from '../api/Api';
import {persistLoggedInUserId, setCurrentUserId} from '../state/session';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type RootStackParamList = {
  Login: undefined;
  Signup: {loginMobNumber?: string} | undefined;
  Home: {userId?: number} | undefined;
  VerifyOTP: {
    userId: string;
    userOtp: string;
    apiUserId?: number;
    fromWhere?: string;
    countryName?: string;
  };
  AMCDetails: {
    amcItem: Record<string, unknown>;
    amcServiceDetailsId?: number;
    amcsId?: number;
    ownerId?: number;
  } | undefined;
};

type VerifyOTPScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'VerifyOTP'
>;

const OTP_LENGTH = 4;
const OTP_EXPIRY_SECONDS = 270;
const RESEND_COOLDOWN_SECONDS = 60;

const VerifyOTPScreen = ({navigation, route}: VerifyOTPScreenProps) => {
  const {userId, userOtp, fromWhere = 'FromLogin'} = route.params;
  const apiUserId = route.params.apiUserId ?? HARDCODED_USER_ID;
  const [otpValue, setOtpValue] = useState('');
  const [expectedOtp, setExpectedOtp] = useState(userOtp);
  const [otpExpired, setOtpExpired] = useState(false);
  const [expirySecondsLeft, setExpirySecondsLeft] = useState(OTP_EXPIRY_SECONDS);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const isApiConfigured = useMemo(() => {
    const {baseUrl} = getTouchlessApiConfig();
    return !baseUrl.includes('example.com');
  }, []);

  useEffect(() => {
    setOtpExpired(false);
    setExpirySecondsLeft(OTP_EXPIRY_SECONDS);

    const timer = setInterval(() => {
      setExpirySecondsLeft(previous => {
        if (previous <= 1) {
          clearInterval(timer);
          setOtpExpired(true);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [expectedOtp]);

  useEffect(() => {
    if (resendSecondsLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendSecondsLeft(previous => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendSecondsLeft]);

  const maskedDestination = useMemo(() => {
    if (userId.includes('@')) {
      const [name, domain] = userId.split('@');
      const safeName =
        name.length <= 2 ? `${name[0] ?? ''}*` : `${name.slice(0, 2)}***`;
      return `${safeName}@${domain}`;
    }

    if (userId.length <= 4) {
      return userId;
    }

    return `${'*'.repeat(Math.max(0, userId.length - 4))}${userId.slice(-4)}`;
  }, [userId]);

  const resendTimerLabel = useMemo(() => {
    if (resendSecondsLeft <= 0) {
      return '';
    }

    const minutes = Math.floor(resendSecondsLeft / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (resendSecondsLeft % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [resendSecondsLeft]);

  const handleOtpChange = (value: string) => {
    const nextValue = value.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    setOtpValue(nextValue);

    if (error) {
      setError('');
    }

    if (otpExpired) {
      setOtpExpired(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpExpired || expirySecondsLeft === 0) {
      setError('OTP expired');
      return;
    }

    if (otpValue.length !== OTP_LENGTH) {
      setError('Please enter the 4 digit OTP');
      return;
    }

    if (otpValue !== expectedOtp) {
      setError('Invalid OTP');
      return;
    }

    setIsVerifying(true);

    try {
      if (isApiConfigured) {
        if (userId.includes('@')) {
          await touchlessApi.getEmailOTPVerified({
            emailId: userId,
            userId: apiUserId,
          });
        } else {
          await touchlessApi.getMobileOTPVerified({
            mobileNo: userId,
            userId: apiUserId,
          });
        }
      }

      Alert.alert(
        'OTP verified',
        fromWhere === 'FromLogin'
          ? 'Login flow verified successfully.'
          : 'Signup flow verified successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              setCurrentUserId(apiUserId);
              void persistLoggedInUserId(apiUserId);
              navigation.reset({
                index: 0,
                routes: [{name: 'Home', params: {userId: apiUserId}}],
              });
            },
          },
        ],
      );
    } catch (verifyError) {
      const message =
        verifyError instanceof Error
          ? verifyError.message
          : 'Unable to verify OTP right now.';
      setError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendSecondsLeft > 0 || isResending) {
      return;
    }

    setIsResending(true);

    try {
      let nextOtp = `${Math.floor(1000 + Math.random() * 9000)}`;

      if (isApiConfigured) {
        if (fromWhere === 'FromLogin' && !userId.includes('@')) {
          const response = await touchlessApi.doTouchlessLogin<{
            otp?: string | number;
            OTP?: string | number;
            userOtp?: string | number;
            UserOtp?: string | number;
            resultData?: Record<string, unknown>;
            ResultData?: Record<string, unknown>;
          }>({
            userName: userId,
            password: '',
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

          if (userOtpRaw !== undefined && userOtpRaw !== null) {
            nextOtp = String(userOtpRaw).trim();
          }
          // persist token if returned during resend login
          try {
            const tokenRaw =
              response?.token ?? response?.Token ?? response?.resultData?.token ?? response?.ResultData?.token ?? null;
            if (tokenRaw !== null && tokenRaw !== undefined) {
              await AsyncStorage.setItem('userToken', String(tokenRaw));
            }
          } catch {
            // ignore storage failures
          }
        } else if (userId.includes('@')) {
          await touchlessApi.getEmailOTPVerified({
            emailId: userId,
            userId: apiUserId,
          });
        } else {
          await touchlessApi.getMobileOTPVerified({
            mobileNo: userId,
            userId: apiUserId,
          });
        }
      }

      if (!nextOtp) {
        throw new Error('OTP was not returned by API.');
      }

      setExpectedOtp(nextOtp);
      setOtpValue('');
      setError('');
      setOtpExpired(false);
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
      inputRef.current?.focus();

      Alert.alert(
        'OTP resent',
        isApiConfigured ? 'A new OTP has been requested.' : `Demo OTP: ${nextOtp}`,
      );
    } catch (resendError) {
      const message =
        resendError instanceof Error
          ? resendError.message
          : 'Unable to resend OTP right now.';
      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    navigation.navigate('Login');
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

          <Text style={styles.title}>Verify</Text>
          <Text style={styles.subtitle}>OTP sent to {maskedDestination}</Text>

          <View style={styles.formContainer}>
            <Pressable onPress={() => inputRef.current?.focus()}>
              <TextInput
                ref={inputRef}
                style={[
                  styles.otpInput,
                  error ? styles.otpInputError : null,
                  otpExpired ? styles.otpInputExpired : null,
                ]}
                placeholder="Enter 4 digit OTP"
                placeholderTextColor="#9E9E9E"
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                value={otpValue}
                onChangeText={handleOtpChange}
                textAlign="center"
                multiline={false}
                numberOfLines={1}
                textAlignVertical="center"
              />
            </Pressable>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {otpExpired ? (
              <Text style={styles.expiredText}>OTP expired</Text>
            ) : null}

            <Pressable
              disabled={isVerifying}
              android_ripple={{color: '#800000'}}
              style={({pressed}) => [
                styles.verifyButton,
                isVerifying ? styles.verifyButtonDisabled : null,
                pressed ? styles.verifyButtonPressed : null,
              ]}
              onPress={handleVerifyOtp}>
              <ImageBackground
                source={require('./assets/rounded_button.png')}
                style={styles.verifyButtonBackground}
                imageStyle={styles.verifyButtonBackgroundImage}
                resizeMode="stretch">
                {isVerifying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.verifyButtonText}>VERIFY OTP</Text>
                )}
              </ImageBackground>
            </Pressable>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.timerText}>{resendTimerLabel}</Text>
            <Text style={styles.helperText}>Please enter 4 digit OTP</Text>
            <Pressable
              onPress={handleResendOtp}
              disabled={resendSecondsLeft > 0 || isResending}
              style={styles.resendLinkWrapper}>
              <Text
                style={[
                  styles.resendLink,
                  resendSecondsLeft > 0 || isResending
                    ? styles.resendLinkDisabled
                    : null,
                ]}>
                {isResending ? 'Resending...' : 'Resend OTP'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Pressable onPress={handleBack} hitSlop={12}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
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
    marginTop: 70,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    color: '#000000',
    textAlign: 'center',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    color: '#8B8B8B',
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
  otpInput: {
    borderWidth: 1,
    borderColor: '#C8C8C8',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    color: '#1F1F1F',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 8,
    height: 72,
    paddingHorizontal: 24,
    paddingVertical: 0,
    marginTop: 10,
    includeFontPadding: false,
  },
  otpInputError: {
    borderColor: '#D32F2F',
  },
  otpInputExpired: {
    borderColor: '#A63D40',
  },
  errorText: {
    fontSize: 13,
    color: '#D32F2F',
    marginTop: 8,
    textAlign: 'center',
  },
  expiredText: {
    fontSize: 14,
    color: '#A63D40',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  verifyButton: {
    borderRadius: 34,
    marginTop: 25,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  verifyButtonPressed: {
    opacity: 0.9,
  },
  verifyButtonDisabled: {
    opacity: 0.75,
  },
  verifyButtonBackground: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  verifyButtonBackgroundImage: {
    borderRadius: 34,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  infoRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  timerText: {
    color: '#000000',
    fontSize: 16,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  helperText: {
    color: '#404040',
    fontSize: 14,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  resendLinkWrapper: {
    marginHorizontal: 8,
    marginVertical: 4,
  },
  resendLink: {
    color: '#0D73C7',
    fontSize: 16,
    fontWeight: '700',
  },
  resendLinkDisabled: {
    color: '#9E9E9E',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 24,
    marginTop: 40,
  },
  backText: {
    color: '#0D73C7',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default VerifyOTPScreen;
