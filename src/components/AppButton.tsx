// src/components/AppButton.tsx
//
// Auth-screen button: Java rounded_button.xml (34dp pill, colorPrimaryDark fill),
// 18sp white label, 10dp margin, 48dp minimum height.
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../theme/theme';
import { sp, dp } from '../utils/responsive';

type Props = {
  title: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
};

export default function AppButton({ title, onPress, disabled, loading }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.textOnPrimary} size="small" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: dp(34),
    alignItems: 'center',
    justifyContent: 'center',
    margin: dp(10),
    minHeight: dp(48),
    elevation: 3,
  },
  pressed: {
    backgroundColor: COLORS.primaryDark,
  },
  disabled: {
    backgroundColor: COLORS.disabled,
  },
  text: {
    color: COLORS.textOnPrimary,
    fontSize: sp(18),
  },
});
