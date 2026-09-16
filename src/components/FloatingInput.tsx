// src/components/FloatingInput.tsx
import { View, TextInput, Animated, StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';
import { COLORS } from '../theme/theme';
import { ms, sp } from '../utils/responsive';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  secureTextEntry?: boolean;
};

export default function FloatingInput({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  secureTextEntry = false,
}: Props) {
  const animated = useRef(new Animated.Value(value ? 1 : 0)).current;

  const animate = (toValue: number) =>
    Animated.timing(animated, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();

  useEffect(() => {
    animate(value ? 1 : 0);
  }, [value]);

  const labelTop = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [ms(14), -ms(8)],
  });

  const labelFontSize = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [sp(16), sp(11)],
  });

  const labelColor = animated.interpolate({
    inputRange: [0, 1],
    outputRange: ['#6B7280', COLORS.primary],
  });

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.label,
          { top: labelTop, fontSize: labelFontSize, color: labelColor },
        ]}
      >
        {label}
      </Animated.Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        onFocus={() => animate(1)}
        onBlur={() => { if (!value) animate(0); }}
        cursorColor={COLORS.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: ms(24),
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: ms(16),
    backgroundColor: '#fff',
    paddingHorizontal: ms(4),
    zIndex: 1,
  },
  input: {
    height: ms(48),
    borderWidth: 1,
    borderColor: COLORS.textQuaternary,
    borderRadius: ms(24),
    paddingHorizontal: ms(16),
    fontSize: sp(16),
    color: '#000',
  },
});