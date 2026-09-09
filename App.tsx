import React, {useEffect, useState} from 'react';
import {ActivityIndicator, View} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginTouchlessScreen from './src/screens/LoginTouchlessScreen';
import SignupScreen from './src/screens/SignupScreen';
import VerifyOTPScreen, {RootStackParamList} from './src/screens/VerifyOTPScreen';
import HomeActivityNewScreen from './src/screens/HomeActivityNewScreen';
import AMCDetailsScreen from './src/screens/AMCDetailsScreen';
import {restoreSavedSession} from './src/state/session';
import './src/config/touchlessApiConfig';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [initialRouteName, setInitialRouteName] =
    useState<keyof RootStackParamList>('Login');
  const [initialUserId, setInitialUserId] = useState<number | undefined>();

  useEffect(() => {
    (async () => {
      const restored = await restoreSavedSession();
      if (restored) {
        setInitialRouteName('Home');
        setInitialUserId(restored.userId);
      }
      setIsRestoringSession(false);
    })();
  }, []);

  if (isRestoringSession) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName={initialRouteName}
      >
        <Stack.Screen name="Login" component={LoginTouchlessScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
        <Stack.Screen
          name="Home"
          component={HomeActivityNewScreen}
          initialParams={
            initialUserId ? {userId: initialUserId} : undefined
          }
        />
        <Stack.Screen name="AMCDetails" component={AMCDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
