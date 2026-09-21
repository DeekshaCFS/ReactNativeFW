// src/utils/responsive.ts
import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (design reference: 390x844 — iPhone 14)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Tablets (iPad, Android tablets) report window widths/heights well past
// any phone -- e.g. ~768-834pt portrait / ~1024-1194pt landscape for iPads,
// similarly large for Android tablets. Scaling font size, padding, and radii
// linearly against BASE_WIDTH (as this file used to) blows those values up
// 2x+ on a tablet: a 16pt font could render at 30pt+. Clamp the ratio so
// phones scale exactly as before (typical phone widths stay under the max),
// while tablets get a modest, capped increase instead of a linear one.
const MIN_SCALE_RATIO = 0.85;
const MAX_SCALE_RATIO = 1.2;
const widthRatio = Math.min(
  Math.max(SCREEN_WIDTH / BASE_WIDTH, MIN_SCALE_RATIO),
  MAX_SCALE_RATIO,
);
const heightRatio = Math.min(
  Math.max(SCREEN_HEIGHT / BASE_HEIGHT, MIN_SCALE_RATIO),
  MAX_SCALE_RATIO,
);

/** Width percentage */
export const wp = (percent: number): number =>
  Math.round((SCREEN_WIDTH * percent) / 100);

/** Height percentage */
export const hp = (percent: number): number =>
  Math.round((SCREEN_HEIGHT * percent) / 100);

/** Scale a size relative to base width (clamped -- see widthRatio above, so
 *  this no longer grows without bound on tablets). */
export const scale = (size: number): number =>
  Math.round(widthRatio * size);

/** Vertical scale relative to base height (clamped -- see heightRatio above). */
export const vs = (size: number): number =>
  Math.round(heightRatio * size);

/** Moderate scale — less aggressive scaling for fonts/padding */
export const ms = (size: number, factor = 0.5): number =>
  Math.round(size + (scale(size) - size) * factor);

/** Scalable font size that respects user font size preferences */
export const sp = (size: number): number => {
  const scaled = ms(size);
  return Math.round(scaled / PixelRatio.getFontScale());
};

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

/** True on large-screen devices (tablets/iPads). Standard heuristic: shorter
 *  side >= 600dp (matches Android's own "sw600dp" tablet breakpoint). Useful
 *  for screens that want an actual layout change (columns, side-by-side
 *  panels) rather than just scaled-up phone spacing. */
export const isTablet = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) >= 600;

/** Safe status bar height across platforms */
export const STATUS_BAR_HEIGHT = Platform.select({
  ios: 44,
  android: StatusBar.currentHeight ?? 24,
  default: 0,
});

/** Standard top padding for screens that sit under the status bar */
export const HEADER_TOP_PADDING = STATUS_BAR_HEIGHT;

export { SCREEN_WIDTH, SCREEN_HEIGHT };