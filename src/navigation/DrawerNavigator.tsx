// src/navigation/DrawerNavigator.tsx

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import TechnicianStack from './TechStack';
import CustomDrawerContent from './CustomDrawerContent';
import AdminStack from './AdminStack';

const Drawer = createDrawerNavigator();

// `role` is read once by RootNavigator (alongside `token`) and handed down
// here, instead of this navigator re-reading AsyncStorage and showing its
// own loading spinner on top of RootNavigator's.
export default function DrawerNavigator({ role }: { role: string | null }) {
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