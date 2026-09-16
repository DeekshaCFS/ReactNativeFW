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
import { ms, sp, scale } from '../../utils/responsive';

type AuthStackParamList = {
  CompanyDetails: {
    emailOrContactNo: string;   // mobile or email captured at signup
    touchlessSignupId: number;
    countryDetailsId: number;
  };
};

const MIN_WORKERS = 1;
const MAX_WORKERS = 100;

export default function CompanyDetailsScreen() {
  const route = useRoute<RouteProp<AuthStackParamList, 'CompanyDetails'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { emailOrContactNo, touchlessSignupId, countryDetailsId } = route.params;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [noOfFieldWorkers, setNoOfFieldWorkers] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // keep the text input and slider in sync, same behaviour as the legacy
  // SeekBar <-> EditText pairing (clamped 0–100, only digits)
  const handleWorkersTextChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setNoOfFieldWorkers(cleaned);
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
            <Image source={require('../../../assets/images/logo.png')} style={GlobalStyles.logo} resizeMode="contain" />
          </View>

          <Text style={GlobalStyles.title}>Glad To Meet You!</Text>
          <Text style={GlobalStyles.subtitle}>Please Enter Your Details</Text>

          <TextInput
            placeholder="First Name"
            style={GlobalStyles.input}
            value={firstName}
            onChangeText={setFirstName}
            cursorColor={COLORS.primary}
            returnKeyType="next"
          />
          {errors.firstName && <Text style={GlobalStyles.errorText}>{errors.firstName}</Text>}

          <TextInput
            placeholder="Last Name"
            style={GlobalStyles.input}
            value={lastName}
            onChangeText={setLastName}
            cursorColor={COLORS.primary}
            returnKeyType="next"
          />
          {errors.lastName && <Text style={GlobalStyles.errorText}>{errors.lastName}</Text>}

          <TextInput
            placeholder="Company Name"
            style={GlobalStyles.input}
            value={companyName}
            onChangeText={setCompanyName}
            cursorColor={COLORS.primary}
            returnKeyType="next"
          />
          {errors.companyName && <Text style={GlobalStyles.errorText}>{errors.companyName}</Text>}

          {/* Slider now lives as a sibling inside this box, not nested inside
              the TextInput (TextInput can't render child views). */}
          <View style={styles.workersBox}>
            <Text style={styles.workersLabel}>Select No. of Field Workers (1-100)</Text>

            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={MAX_WORKERS}
              step={1}
              value={Number(noOfFieldWorkers) || 0}
              onValueChange={handleSliderChange}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor="#d0d0d0"
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
          {errors.noOfFieldWorkers && <Text style={GlobalStyles.errorText}>{errors.noOfFieldWorkers}</Text>}

          <AppButton title="PROCEED" onPress={registerOwner} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  workersBox: {
    marginTop: ms(8),
    marginBottom: ms(4),
    padding: ms(16),
    borderWidth: 1,
    borderColor: '#3e3e3e',
    borderRadius: 20,
    alignItems: 'center',
  },
  workersLabel: {
    fontSize: sp(18),
    color: COLORS.textTertiary,
    alignSelf: 'flex-start',
    marginBottom: ms(4),
  },
  slider: {
    width: '100%',
    height: ms(40),
  },
  workersValueInput: {
    width: scale(90),
    height: ms(44),
    borderWidth: 1,
    borderColor: '#3e3e3e',
    borderRadius: 22,
    marginTop: ms(8),
    fontSize: sp(16),
    color: COLORS.textPrimary,
  },
});