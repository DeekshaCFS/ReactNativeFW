import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import CompanyDetailsScreen from '../screens/auth/CompanyDetailsScreen';
import { withToastHost } from './withToastHost';

const Stack = createNativeStackNavigator();

const LoginWithToast = withToastHost(LoginScreen);
const SignupWithToast = withToastHost(SignupScreen);
const OtpWithToast = withToastHost(OtpScreen);
const CompanyDetailsWithToast = withToastHost(CompanyDetailsScreen);

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginWithToast} />
      <Stack.Screen name="Signup" component={SignupWithToast} />
      <Stack.Screen name="Otp" component={OtpWithToast} />
      <Stack.Screen name="CompanyDetails" component={CompanyDetailsWithToast} />
    </Stack.Navigator>
  );
}