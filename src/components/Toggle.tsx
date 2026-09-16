// src/components/Toggle.tsx
import { Pressable, Animated, StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';
import { COLORS } from '../theme/theme';
import { ms } from '../utils/responsive';

type Props = {
  value: boolean;
  onChange: (val: boolean) => void;
};

const TRACK_WIDTH = ms(44);
const TRACK_HEIGHT = ms(26);
const THUMB_SIZE = ms(18);
const PADDING = ms(4);
const TRAVEL = TRACK_WIDTH - THUMB_SIZE - PADDING * 2;

export default function Toggle({ value, onChange }: Props) {
  const translateX = useRef(new Animated.Value(value ? TRAVEL : 0)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? TRAVEL : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [value]);

  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        styles.container,
        { backgroundColor: value ? COLORS.primary : '#ccc' },
      ]}
    >
      <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: PADDING,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
});