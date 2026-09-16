// src/screens/admin/AddFirstFWSheet.tsx

import {
  View, Text, StyleSheet, Modal, Pressable, TextInput, Image, ActivityIndicator, Platform,
} from 'react-native';
import { useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../theme/theme';
import { scale, vs, sp, ms, hp, wp } from '../../utils/responsive';

const APP_ICON = ms(50);

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { firstName: string; lastName: string; phoneNumber: string }) => Promise<void>;
}

export default function AddFirstFieldworkerSheet({ visible, onClose, onSubmit }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    /^\d{10}$/.test(phoneNumber);

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
      });
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
            <Icon name="close" size={sp(16)} color={COLORS.white} />
          </Pressable>

          <View style={styles.logoWrapper}>
            <Image
              source={ require('../../../assets/images/fw_logo.png') }
              style={{ width: APP_ICON, height: APP_ICON, borderRadius: APP_ICON / 2, alignSelf: 'center' }}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.message}>
            Add your first Fieldworker to activate all services
          </Text>

          <View style={styles.inputCard}>
            <View style={styles.nameRow}>
              <TextInput
                style={styles.nameInput}
                placeholder="First Name"
                placeholderTextColor={COLORS.textMuted}
                value={firstName}
                onChangeText={(t) => setFirstName(t.replace(/[^a-zA-Z ]/g, ''))}
                maxLength={16}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.nameInput}
                placeholder="Last Name"
                placeholderTextColor={COLORS.textMuted}
                value={lastName}
                onChangeText={(t) => setLastName(t.replace(/[^a-zA-Z ]/g, ''))}
                maxLength={16}
                autoCapitalize="words"
              />
            </View>

            <TextInput
              style={styles.phoneInput}
              placeholder="Phone Number"
              placeholderTextColor={COLORS.textMuted}
              value={phoneNumber}
              onChangeText={(t) => setPhoneNumber(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>

          <Pressable
            style={[styles.submitBtn, (!isValid || submitting) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderRadius: scale(30),
    margin: scale(10),
    padding: scale(10),
    height: '50%',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: scale(26),
    height: scale(26),
    borderRadius: scale(13),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: ms(10),
    overflow: 'hidden',
  },
  message: {
    textAlign: 'center',
    color: COLORS.textPrimary,
    fontSize: sp(20),
  },
  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: scale(25),
    paddingHorizontal: scale(15),
    paddingVertical: scale(20),
    marginBottom: vs(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  nameRow: {
    flexDirection: 'row',
    gap: scale(10),
    paddingVertical: vs(15),
  },
  nameInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: scale(24),
    borderWidth: 1,
    borderColor: COLORS.textMuted,
    paddingHorizontal: scale(16),
    paddingVertical: vs(10),
    fontSize: sp(16),
    color: '#000000',
  },
  phoneInput: {
    backgroundColor: COLORS.white,
    borderRadius: scale(24),
    borderWidth: 1,
    borderColor: COLORS.textMuted,
    paddingHorizontal: scale(16),
    paddingVertical: vs(10),
    fontSize: sp(16),
    color: '#000000',
    marginTop: vs(10),
  },
  errorText: {
    color: '#DC2626',
    fontSize: sp(13),
    textAlign: 'center',
    marginTop: vs(10),
  },
  submitBtn: {
    marginHorizontal: scale(40),
    marginTop: vs(10),
    marginBottom: Platform.OS === 'ios' ? vs(30) : vs(20),
    backgroundColor: COLORS.primary,
    borderRadius: scale(28),
    paddingVertical: vs(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: COLORS.white,
    fontSize: sp(17),
    fontWeight: '700',
  },
});