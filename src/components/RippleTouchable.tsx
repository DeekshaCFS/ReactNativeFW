// src/components/RippleTouchable.tsx
// Drop-in replacement for Pressable. On press, a red ripple spreads
// outward from the touch point and is clipped to the button's own shape
// (including its corner radii). onPress fires immediately; the ripple is
// purely visual and never delays navigation.

import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { COLORS } from '../theme/theme';

let rippleIdCounter = 0;

// Java colorAccent (#B71625), the colour the app's own ripples use (colorControlHighlight).
const DEFAULT_RIPPLE_COLOR = '#B71625';

const RADIUS_KEYS = [
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
] as const;

export type RippleTouchableProps = Omit<PressableProps, 'style' | 'children'> & {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Ripple colour. Defaults to the app's colorAccent (#B71625). */
  rippleColor?: string;
  /** Ripple animation length in ms. */
  rippleDuration?: number;
  /** Peak strength of the ripple centre, 0..1. */
  rippleIntensity?: number;
  /**
   * 'bounded' (default): spreads from the touch point and follows the button's shape.
   * 'circle': a round ripple that starts at the centre of the button (or at rippleCenterY)
   * and is not clipped to the button, like Material's borderless ripple.
   */
  rippleShape?: 'bounded' | 'circle';
  /** For 'circle': vertical position of the ripple centre in px from the top of the button. */
  rippleCenterY?: number;
};

const RippleTouchable = ({
  children,
  style,
  onPressIn,
  rippleColor = DEFAULT_RIPPLE_COLOR,
  rippleDuration = 800,
  rippleIntensity = 0.35,
  rippleShape = 'bounded',
  rippleCenterY,
  disabled,
  ...rest
}: RippleTouchableProps) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const progress = useRef(new Animated.Value(0)).current;
  const gradientId = useRef(`ripple-grad-${++rippleIdCounter}`).current;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  }, []);

  const handlePressIn = (e: GestureResponderEvent) => {
    if (rippleShape === 'circle') {
      setOrigin({ x: size.width / 2, y: rippleCenterY ?? size.height / 2 });
    } else {
      const { locationX, locationY } = e.nativeEvent;
      setOrigin({ x: locationX ?? 0, y: locationY ?? 0 });
    }
    progress.stopAnimation();
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: rippleDuration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    onPressIn?.(e);
  };

  // Radius reaches the farthest corner so the wave always covers the whole button.
  const isCircle = rippleShape === 'circle';
  const farX = Math.max(origin.x, size.width - origin.x);
  const farY = Math.max(origin.y, size.height - origin.y);
  const radius = isCircle
    ? Math.max(size.width, size.height) * 0.5
    : Math.hypot(farX, farY);
  const diameter = radius * 2;

  // Hold strong while spreading, then fade out near the end.
  const opacity = progress.interpolate({
    inputRange: [0, 0.1, 0.6, 1],
    outputRange: [0, 1, 0.9, 0],
  });
  // Starts small at the touch point and grows outward.
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 1],
  });

  const flat = StyleSheet.flatten(style) ?? {};
  // Carry the button's corner radii onto the ripple layer so it matches the shape.
  const shapeStyle: ViewStyle = {};
  if (!isCircle) {
    for (const key of RADIUS_KEYS) {
      if (flat[key] !== undefined) (shapeStyle as Record<string, unknown>)[key] = flat[key];
    }
  }

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onLayout={onLayout}
      style={[flat, isCircle ? null : styles.clip]}
    >
      {children}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, isCircle ? null : styles.clip, shapeStyle]}
      >
        <Animated.View
          style={[
            styles.overlay,
            {
              left: origin.x - radius,
              top: origin.y - radius,
              width: diameter,
              height: diameter,
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <Svg width={diameter} height={diameter}>
            <Defs>
              <RadialGradient id={gradientId} cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0" stopColor={rippleColor} stopOpacity={rippleIntensity} />
                <Stop offset="0.6" stopColor={rippleColor} stopOpacity={rippleIntensity * 0.75} />
                <Stop offset="1" stopColor={rippleColor} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={radius} cy={radius} r={radius} fill={`url(#${gradientId})`} />
          </Svg>
        </Animated.View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
  },
});

export default RippleTouchable;