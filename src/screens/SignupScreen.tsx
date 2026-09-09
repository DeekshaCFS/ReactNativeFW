import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {getTouchlessApiConfig, HARDCODED_USER_ID, touchlessApi} from '../api/Api';
import type {RootStackParamList} from './VerifyOTPScreen';

type SignupScreenProps = NativeStackScreenProps<RootStackParamList, 'Signup'>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;
const DEMO_SIGNUP_OTP = '1234';

const SignupScreen = ({navigation, route}: SignupScreenProps) => {
  const [emailId, setEmailId] = useState('');
  const [contactNo, setContactNo] = useState(route.params?.loginMobNumber ?? '');
  const [countryDetailsId, setCountryDetailsId] = useState('101');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isApiConfigured = useMemo(() => {
    const {baseUrl} = getTouchlessApiConfig();
    return !baseUrl.includes('example.com');
  }, []);

  const validateForm = () => {
    const trimmedEmail = emailId.trim();
    const trimmedContact = contactNo.trim();
    const trimmedCountryId = countryDetailsId.trim();

    if (!trimmedEmail && !trimmedContact) {
      setError('Enter email or contact number');
      return false;
    }

    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      setError('Enter a valid email id');
      return false;
    }

    if (trimmedContact && !PHONE_REGEX.test(trimmedContact)) {
      setError('Enter a valid contact number');
      return false;
    }

    if (!trimmedCountryId || Number.isNaN(Number(trimmedCountryId))) {
      setError('Enter a valid country details id');
      return false;
    }

    setError('');
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isApiConfigured) {
        await touchlessApi.doTouchlessSignUp({
          emailId: emailId.trim(),
          contactNo: contactNo.trim(),
          countryDetailsId: Number(countryDetailsId.trim()),
        });
      }

      Alert.alert(
        'OTP sent',
        isApiConfigured
          ? 'Proceed to verification.'
          : `Demo OTP: ${DEMO_SIGNUP_OTP}`,
      );

      navigation.navigate('VerifyOTP', {
        userId: emailId.trim() || contactNo.trim(),
        userOtp: DEMO_SIGNUP_OTP,
        apiUserId: HARDCODED_USER_ID,
        fromWhere: 'FromSignup',
      });
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Unable to start signup right now.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>Register Here</Text>
            <Text style={styles.description}>
              Converted from the Android Retrofit contract to a React Native
              form that works on both Android and iOS.
            </Text>

            <TextInput
              style={styles.input}
              value={emailId}
              onChangeText={value => {
                setEmailId(value);
                if (error) {
                  setError('');
                }
              }}
              placeholder="Email id"
              placeholderTextColor="#8A94A6"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              value={contactNo}
              onChangeText={value => {
                setContactNo(value);
                if (error) {
                  setError('');
                }
              }}
              placeholder="Contact number"
              placeholderTextColor="#8A94A6"
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              value={countryDetailsId}
              onChangeText={value => {
                setCountryDetailsId(value);
                if (error) {
                  setError('');
                }
              }}
              placeholder="Country details id"
              placeholderTextColor="#8A94A6"
              keyboardType="number-pad"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              onPress={handleSignUp}
              disabled={isSubmitting}
              style={({pressed}) => [
                styles.button,
                isSubmitting ? styles.buttonDisabled : null,
                pressed ? styles.buttonPressed : null,
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>REQUEST OTP</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#102A43',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: '#486581',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D7DFE9',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    color: '#102A43',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    marginTop: 12,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#0D73C7',
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SignupScreen;
