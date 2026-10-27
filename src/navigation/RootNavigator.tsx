// src/navigation/RootNavigator.tsx

import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, View, AppState } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useNavigationContainerRef } from '@react-navigation/native';
import AuthStack from './AuthStack';
import DrawerNavigator from './DrawerNavigator';
import { authEvents, AUTH_CHANGED } from '../utils/authEvents';
import { restoreSavedSession } from '../state/session';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadToken = async () => {
    // Read together instead of a separate round-trip here plus another one
    // in DrawerNavigator — halves the AsyncStorage/spinner chain gating
    // first paint after login.
    const [[, storedToken], [, storedRole]] = await AsyncStorage.multiGet([
      'token',
      'role',
    ]);

    if (storedToken) {
      await restoreSavedSession();
    }

    setToken(storedToken);
    setRole(storedRole);
    setLoading(false);
  };

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    const handler = () => loadToken();
    authEvents.on(AUTH_CHANGED, handler);
    return () => {
      authEvents.off(AUTH_CHANGED, handler);
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') loadToken();
    });
    return () => subscription.remove();
  }, []);

  // Stable identity so the AppState 'active' re-check above (which re-runs
  // loadToken and re-renders RootNavigator on every foreground) doesn't
  // remount the whole drawer/tabs tree underneath — only an actual role
  // change should do that.
  const renderDrawer = useCallback(() => <DrawerNavigator role={role} />, [role]);

  // ── Wait for token check before rendering ──
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      key={token ? 'app' : 'auth'}
    >
      {token ? (
        <Stack.Screen name="MainApp">{renderDrawer}</Stack.Screen>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}