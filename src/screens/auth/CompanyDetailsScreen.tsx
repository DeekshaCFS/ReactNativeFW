// src/screens/auth/CompanyDetailsScreen.tsx
import {
  View, TextInput, Text, Image, ImageBackground, Alert,
  KeyboardAvoidingView, ScrollView, Platform, StatusBar, StyleSheet,
} from 'react-native';
import Slider from '@react-native-community/slider'; // matches legacy SeekBar 0–100
import { useState } from 'react';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppButton from '../../components/AppButton';
import { COLORS } from '../../theme/theme';
import { GlobalStyles } from '../../styles/globalStyles';
import { getRegister } from '../../api/signUp/signUpService';
import { authEvents, AUTH_CHANGED } from '../../utils/authEvents';
import { getAndroidId } from '../../utils/deviceId';
import { sp, dp } from '../../utils/responsive';
import { AuthBackButton } from '../../components/AuthExtras';

type AuthStackParamList = {
  CompanyDetails: {
    emailOrContactNo: string;   // mobile or email captured at signup
    touchlessSignupId: number;
    countryDetailsId: number;
  };
};

const MIN_WORKERS = 1;
const MAX_WORKERS = 100;

// Java wraps these in a ConstraintLayout that centres the content vertically.
const CENTER_CONTENT = { justifyContent: 'center' as const };

export default function CompanyDetailsScreen() {
  const route = useRoute<RouteProp<AuthStackParamList, 'CompanyDetails'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { emailOrContactNo, touchlessSignupId, countryDetailsId } = route.params;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [noOfFieldWorkers, setNoOfFieldWorkers] = useState('1');
  // The slider keeps its own value: feeding the text back into it on every drag tick
  // (text -> value -> text) made the thumb jitter. Dragging only updates the text.
  const [sliderValue, setSliderValue] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // keep the text input and slider in sync, same behaviour as the legacy
  // SeekBar <-> EditText pairing (clamped 0–100, only digits)
  const handleWorkersTextChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setNoOfFieldWorkers(cleaned);
    setSliderValue(Math.min(Number(cleaned) || 0, MAX_WORKERS));
  };

  const handleSliderChange = (val: number) => {
    setNoOfFieldWorkers(String(Math.round(val)));
  };

  const isValid = () => {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = 'Please enter first name';
    if (!lastName.trim()) next.lastName = 'Please enter last name';
    if (!companyName.trim()) next.companyName = 'Please enter company name';
    const n = Number(noOfFieldWorkers);
    if (!noOfFieldWorkers) {
      next.noOfFieldWorkers = 'Please enter number of field workers';
    } else if (!Number.isInteger(n) || n < MIN_WORKERS || n > MAX_WORKERS) {
      next.noOfFieldWorkers = 'Number of field workers should be between 1 and 100';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const registerOwner = async () => {
    if (!isValid()) return;
    try {
      setLoading(true);
      const androidId = await getAndroidId();
      const isEmail = emailOrContactNo.includes('@');

      const response = await getRegister({
        TouchlessSignupId: touchlessSignupId,
        CountryDetailsId: countryDetailsId,
        EmailId: isEmail ? emailOrContactNo : '',
        ContactNo: isEmail ? '' : emailOrContactNo,
        OTP: 0,
        FirstName: firstName.trim(),
        LastName: lastName.trim(),
        CompanyName: companyName.trim(),
        NoOfUsers: Number(noOfFieldWorkers),
        CreatedBy: 0,
        CreatedDate: '',
        UpdatedBy: 0,
        UpdatedDate: '',
        LgModel: { AndroidID: androidId },
      });

      if (response.Code !== '200' || !response.ResultData?.LoginOutPut) {
        Alert.alert('Error', response.Message || 'Could not create your account');
        return;
      }

      const login = response.ResultData.LoginOutPut;
      await AsyncStorage.multiSet([
        ['uid',      String(login.UserID ?? 0)],
        ['token',    login.Token ?? ''],
        ['role',     login.UserGroupName ?? ''],
        ['username', emailOrContactNo],
        ['owner_id', String(login.UserID ?? 0)], // new owner is their own OwnerId
      ]);
      // RootNavigator remounts via key={token ? 'app' : 'auth'} on this event —
      // no manual navigation.reset() needed (that call was a silent no-op, same
      // reasoning as OtpScreen; LoginScreen relies on the same event flow).
      authEvents.emit(AUTH_CHANGED);
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
          <View style={[GlobalStyles.header, { marginTop: dp(89) }]}>
            <Image source={require('../../../assets/images/logo.png')} style={GlobalStyles.logo} resizeMode="contain" />
          </View>

          <Text style={GlobalStyles.title}>Glad to Meet You!</Text>
          <Text style={styles.subtitle}>Please Enter Your Details</Text>

          <View style={[GlobalStyles.form, { marginTop: dp(10) }]}>
            <TextInput
              placeholder="First Name"
              placeholderTextColor={COLORS.authText}
              style={[styles.input, !!errors.firstName && GlobalStyles.inputError]}
              value={firstName}
              onChangeText={t => setFirstName(t.replace(/[^A-Za-z]/g, ''))}
              maxLength={20}
              autoCapitalize="words"
              cursorColor={COLORS.primary}
              returnKeyType="next"
            />
            {!!errors.firstName && <Text style={GlobalStyles.errorText}>{errors.firstName}</Text>}

            <TextInput
              placeholder="Last Name"
              placeholderTextColor={COLORS.authText}
              style={[styles.input, !!errors.lastName && GlobalStyles.inputError]}
              value={lastName}
              onChangeText={t => setLastName(t.replace(/[^A-Za-z]/g, ''))}
              maxLength={20}
              autoCapitalize="words"
              cursorColor={COLORS.primary}
              returnKeyType="next"
            />
            {!!errors.lastName && <Text style={GlobalStyles.errorText}>{errors.lastName}</Text>}

            <TextInput
              placeholder="Company Name"
              placeholderTextColor={COLORS.authText}
              style={[styles.input, !!errors.companyName && GlobalStyles.inputError]}
              value={companyName}
              onChangeText={setCompanyName}
              maxLength={40}
              autoCapitalize="words"
              cursorColor={COLORS.primary}
              returnKeyType="next"
            />
            {!!errors.companyName && <Text style={GlobalStyles.errorText}>{errors.companyName}</Text>}

            <View style={styles.workersBox}>
              <Text style={styles.workersLabel}>Select No. of Field Workers (1-100)</Text>

              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={MAX_WORKERS}
                step={1}
                value={sliderValue}
                onValueChange={handleSliderChange}
                onSlidingComplete={setSliderValue}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor="#d0d0d0"
                thumbTintColor={COLORS.primary}
              />

              <TextInput
                placeholder="1"
                keyboardType="number-pad"
                style={styles.workersValueInput}
                value={noOfFieldWorkers}
                onChangeText={handleWorkersTextChange}
                maxLength={3}
                cursorColor={COLORS.primary}
                textAlign="center"
                returnKeyType="done"
                onSubmitEditing={registerOwner}
              />
            </View>
            {!!errors.noOfFieldWorkers && <Text style={GlobalStyles.errorText}>{errors.noOfFieldWorkers}</Text>}

            <AppButton title="PROCEED" onPress={registerOwner} loading={loading} />
          </View>

          <View style={{ margin: dp(20) }}>
            <AuthBackButton onPress={() => navigation.goBack()} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

// welcome_activity.xml: inputs/boxes carry a 5dp margin (the shared input style uses 10dp).
const styles = StyleSheet.create({
  subtitle: {
    fontSize: sp(16),
    color: COLORS.authText,
    textAlign: 'center',
    margin: dp(5),
  },
  input: {
    ...GlobalStyles.input,
    margin: dp(5),
  },
  workersBox: {
    margin: dp(5),
    paddingLeft: dp(5),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: dp(20),
  },
  workersLabel: {
    marginTop: dp(5),
    paddingLeft: dp(10),
    fontSize: sp(16),
    color: COLORS.authText,
  },
  slider: {
    marginTop: dp(8),
    marginBottom: dp(12),
    height: dp(24),
  },
  workersValueInput: {
    width: dp(100),
    height: dp(30),
    alignSelf: 'center',
    margin: dp(10),
    padding: 0,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: dp(20),
    fontSize: sp(16),
    color: COLORS.ink,
  },
});
