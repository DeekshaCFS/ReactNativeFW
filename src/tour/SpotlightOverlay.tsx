// src/tour/SpotlightOverlay.tsx
//
// RN equivalent of Android's TapTargetView: a dimmed full-screen layer with
// a circular cutout around the active tour step's target, a title +
// description bubble next to it, and tap-to-advance on the circle itself
// (Java's TapTargetSequence with cancelable(false) -- tapping outside the
// spotlighted circle does nothing, matching that here too).
//
// Mounted once at the app root (see App.tsx) so it can float above
// navigation, headers and the tab bar regardless of which screen a step's
// target lives on.

import {useWindowDimensions, View, Text, Pressable, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import Svg, {Mask, Rect, Circle} from 'react-native-svg';
import {COLORS} from '../theme/theme';
import {ms, sp} from '../utils/responsive';
import {useTour} from './TourContext';

export default function SpotlightOverlay() {
  const {activeStep, activeMeasurement, advance} = useTour();
  const {width: screenW, height: screenH} = useWindowDimensions();
  const {t} = useTranslation();

  if (!activeStep || !activeMeasurement) return null;

  const cx = activeMeasurement.x + activeMeasurement.width / 2;
  const cy = activeMeasurement.y + activeMeasurement.height / 2;
  const radius = Math.max(activeMeasurement.width, activeMeasurement.height) / 2 + ms(16);

  const tooltipBelow = cy < screenH / 2;
  const tooltipStyle = tooltipBelow
    ? {top: Math.min(cy + radius + ms(16), screenH - ms(160))}
    : {bottom: Math.min(screenH - (cy - radius) + ms(16), screenH - ms(160))};

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="auto">
      <Svg style={StyleSheet.absoluteFill}>
        <Mask id="spotlight-mask">
          <Rect x={0} y={0} width={screenW} height={screenH} fill="#fff" />
          <Circle cx={cx} cy={cy} r={radius} fill="#000" />
        </Mask>
        <Rect
          x={0}
          y={0}
          width={screenW}
          height={screenH}
          fill="rgba(0, 0, 0, 0.65)"
          mask="url(#spotlight-mask)"
        />
        <Circle cx={cx} cy={cy} r={radius} stroke={'#252525'} strokeWidth={20} fill="none" />
      </Svg>

      {/* Tap the spotlighted circle to advance -- matches Java's cancelable(false) sequence. */}
      <Pressable
        onPress={advance}
        style={{
          position: 'absolute',
          left: cx - radius,
          top: cy - radius,
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
        }}
      />

      <View style={[styles.tooltip, {left: ms(24), right: ms(24)}, tooltipStyle]}>
        <Text style={styles.title}>{t(activeStep.titleKey)}</Text>
        <Text style={styles.description}>{t(activeStep.descriptionKey)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    padding: ms(20),
  },
  title: {
    fontSize: sp(20),
    fontWeight: '700',
    color: '#fff',
    marginBottom: ms(6),
  },
  description: {
    fontSize: sp(17),
    color: '#bbbbbb',
    lineHeight: sp(20),
  },
});
