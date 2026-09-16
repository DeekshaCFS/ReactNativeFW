// src/components/AppButton.tsx
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../theme/theme';
import { sp, ms } from '../utils/responsive';

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
    paddingVertical: ms(14),
    borderRadius: ms(30),
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: ms(6),
    width: '100%',
    minHeight: ms(48),   // accessible tap target
  },
  pressed: {
    backgroundColor: COLORS.primaryDark,
  },
  disabled: {
    backgroundColor: COLORS.disabled,
  },
  text: {
    color: COLORS.textOnPrimary,
    fontSize: sp(16),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});