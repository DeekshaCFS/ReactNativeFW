// src/tour/SpotlightOverlay.tsx
//
// RN equivalent of Android's TapTargetView (Java: TapTargetSequence with
// drawShadow/cancelable(false)/transparentTarget(true)/outerCircleColor(transperant_black)):
//   - the page is dimmed lightly,
//   - a large dark "outer circle" centred on the target holds the title/description,
//   - the target itself is a hole (radius 50dp, 30dp for toolbar icons) showing the real UI,
//   - tapping the target advances; tapping elsewhere does nothing.
//
// Mounted once at the app root (see App.tsx) so it floats above navigation, headers and tab bar.

import {useWindowDimensions, View, Text, Pressable, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import Svg, {Mask, Rect, Circle} from 'react-native-svg';
import {ms, sp} from '../utils/responsive';
import {useTour} from './TourContext';

const OUTER_COLOR = '#3d3b3d';
const TEXT_SIDE_MARGIN = 40;

export default function SpotlightOverlay() {
  const {activeStep, activeMeasurement, advance} = useTour();
  const {width: screenW, height: screenH} = useWindowDimensions();
  const {t} = useTranslation();

  if (!activeStep || !activeMeasurement) return null;

  const cx = activeMeasurement.x + activeMeasurement.width / 2;
  const cy = activeMeasurement.y + activeMeasurement.height / 2;
  const hole = ms(activeStep.radius ?? 50);

  // Text sits above the target when the target is in the lower half (Java's rule), else below.
  const above = activeStep.textPosition ? activeStep.textPosition === 'above' : cy > screenH / 2;
  // Targets on the right push the text block in from the left like TapTargetView does.
  const textW = Math.min(ms(285), screenW - ms(2 * TEXT_SIDE_MARGIN));
  const left = cx > screenW * 0.7 ? screenW - textW - ms(26) : ms(TEXT_SIDE_MARGIN);
  const right = screenW - left - textW;
  // Estimate the wrapped text block height (title 20sp / description 16sp) to place it and size the circle.
  const titleLines = Math.ceil((t(activeStep.titleKey).length * sp(22) * 0.58) / textW);
  const descLines = Math.ceil((t(activeStep.descriptionKey).length * sp(17) * 0.5) / textW);
  const textH = titleLines * sp(27) + ms(8) + descLines * sp(24);
  const gap = ms(24);
  const rawTop = above ? cy - hole - gap - textH : cy + hole + gap;
  const textTop = Math.max(rawTop, ms(60));

  // Outer circle: centred on the target, large enough to reach the far corner of the text block.
  const corners = [
    [left, textTop],
    [screenW - right, textTop],
    [left, textTop + textH],
    [screenW - right, textTop + textH],
  ];
  const far = Math.max(...corners.map(([x, y]) => Math.hypot(x - cx, y - cy)));
  const outer = Math.max(far, hole * 3) + ms(50);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="auto">
      <Svg style={StyleSheet.absoluteFill}>
        <Mask id="spotlight-mask">
          <Rect x={0} y={0} width={screenW} height={screenH} fill="#fff" />
          <Circle cx={cx} cy={cy} r={hole} fill="#000" />
        </Mask>
        <Rect x={0} y={0} width={screenW} height={screenH} fill="rgba(0,0,0,0.3)" mask="url(#spotlight-mask)" />
        <Circle cx={cx} cy={cy} r={outer} fill={OUTER_COLOR} fillOpacity={0.98} mask="url(#spotlight-mask)" />
      </Svg>

      {/* Tap the spotlighted target to advance (cancelable(false)). */}
      <Pressable
        onPress={advance}
        style={{
          position: 'absolute',
          left: cx - hole,
          top: cy - hole,
          width: hole * 2,
          height: hole * 2,
          borderRadius: hole,
        }}
      />

      <View
        pointerEvents="none"
        style={[styles.text, {left, right, top: textTop}, above && {justifyContent: 'flex-end', height: textH}]}
      >
        <Text style={styles.title}>{t(activeStep.titleKey)}</Text>
        <Text style={styles.description}>{t(activeStep.descriptionKey)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {position: 'absolute'},
  title: {fontSize: sp(22), fontWeight: '700', color: '#fff', marginBottom: ms(8)},
  description: {fontSize: sp(17), color: '#e6e6e6', lineHeight: sp(24)},
});
