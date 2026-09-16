import React, { useEffect, useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import TechnicianStack from './TechStack';
import CustomDrawerContent from './CustomDrawerContent';
import AdminStack from './AdminStack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRole = async () => {
      const storedRole = await AsyncStorage.getItem('role');
      setRole(storedRole);
      setLoading(false);
    };
    loadRole();
  }, []);

  // ── Wait for role before rendering drawer ──
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isAdmin =
    role?.toLowerCase() === 'admin' ||
    role?.toLowerCase() === 'owner';

  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: false }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      {isAdmin ? (
        <Drawer.Screen name="AdminTabs" component={AdminStack} />
      ) : (
        <Drawer.Screen name="TechnicianTabs" component={TechnicianStack} />
      )}
    </Drawer.Navigator>
  );
}