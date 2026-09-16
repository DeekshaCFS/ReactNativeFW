// src/screens/admin/AdminDrawerContent.tsx
//
// Split out of HomeActivityNewScreen. That screen closed its own drawer
// Modal (setIsDrawerOpen(false)) and then immediately called Alert.alert()
// for the logout confirmation. On Android, a native Alert opened in the same
// tick as another RN <Modal> closing can get torn down along with it (they
// share the same underlying Window/Dialog layer) — so the confirmation
// either never appeared or its buttons never fired, and logout silently did
// nothing. CustomDrawerContent (technician side) never had this bug because
// its confirmation is its own persistent <Modal>, not Alert.alert — that's
// the pattern this file follows too.
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Modal, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authEvents, AUTH_CHANGED } from '../../utils/authEvents';
import { logoutAndClearSession } from '../../state/session';

const THEME_PRIMARY = '#c3002f';
const DEFAULT_PROFILE_ICON = require('../../../assets/images/image.png');

export type AdminDrawerItem = {
  key: string;
  label: string;
};

interface AdminDrawerContentProps {
  visible: boolean;
  onClose: () => void;
  fullName: string;
  primaryContact: string;
  profileImageUri: string;
  onAvatarError: () => void;
  drawerItems: AdminDrawerItem[];
  onDrawerItemPress: (item: AdminDrawerItem) => void;
}

export default function AdminDrawerContent({
  visible,
  onClose,
  fullName,
  primaryContact,
  profileImageUri,
  onAvatarError,
  drawerItems,
  onDrawerItemPress,
}: AdminDrawerContentProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutAndClearSession();
      await AsyncStorage.multiRemove(['token', 'uid', 'owner_id', 'name', 'username', 'role']);
      // RootNavigator listens for this and re-reads 'token' from storage,
      // swapping its Stack.Navigator (via its `key` prop) from the MainApp
      // tree over to AuthStack — landing on LoginTouchlessScreen.
      authEvents.emit(AUTH_CHANGED);
    } catch (err) {
      console.log('Logout error:', err);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable style={styles.drawerBackdrop} onPress={onClose}>
          <Pressable style={styles.drawerPanel}>
            <View style={styles.drawerHeader}>
              <Image
                source={profileImageUri ? { uri: profileImageUri } : DEFAULT_PROFILE_ICON}
                style={styles.drawerAvatar}
                onError={onAvatarError}
              />
              <Text numberOfLines={1} style={styles.drawerName}>
                {fullName}
              </Text>
              <Text numberOfLines={1} style={styles.drawerContact}>
                {primaryContact}
              </Text>
              <Text style={styles.drawerTitle}>Menu</Text>
            </View>
            {drawerItems.map(item => (
              <TouchableOpacity
                key={item.key}
                style={styles.drawerItem}
                onPress={() => onDrawerItemPress(item)}
              >
                <Text style={styles.drawerItemLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.logoutButton}
              // Only open the confirmation Modal here — don't also close
              // this drawer Modal in the same tick, so the two never race.
              onPress={() => setShowLogoutModal(true)}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Logout confirmation — a plain Modal instead of Alert.alert so it
          can't be dismissed by the drawer Modal's own close transition. */}
      <Modal transparent visible={showLogoutModal} animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmSheet}>
            <Text style={styles.confirmTitle}>Logout</Text>
            <Text style={styles.confirmMessage}>Are you sure you want to logout?</Text>
            <TouchableOpacity
              style={styles.confirmLogoutBtn}
              onPress={async () => {
                setShowLogoutModal(false);
                onClose();
                await handleLogout();
              }}
            >
              <Text style={styles.confirmLogoutText}>LOGOUT</Text>
            </TouchableOpacity>
            <Pressable onPress={() => setShowLogoutModal(false)}>
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    flexDirection: 'row',
  },
  drawerPanel: {
    width: '78%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingBottom: 24,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 6,
    alignItems: 'center',
  },
  drawerAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F3F4F6',
  },
  drawerName: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  drawerContact: {
    marginTop: 4,
    fontSize: 13,
    color: '#4B5563',
  },
  drawerTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    alignSelf: 'flex-start',
  },
  drawerItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  drawerItemLabel: {
    fontSize: 15,
    color: '#1F2937',
  },
  logoutButton: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#C62828',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmSheet: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  confirmMessage: {
    marginTop: 8,
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
  confirmLogoutBtn: {
    marginTop: 18,
    width: '100%',
    backgroundColor: THEME_PRIMARY,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmLogoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmCancelText: {
    marginTop: 14,
    fontSize: 14,
    color: '#8e8b8b',
    fontWeight: '500',
  },
});