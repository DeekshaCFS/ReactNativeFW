// src/utils/responsive.ts
import { Dimensions, PixelRatio, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const getWindow = () => Dimensions.get('window');

const initial = getWindow();

// Orientation-independent device dimensions. Most styles in this app are built
// once in StyleSheet.create() at import time, so anything they read must not
// change when the device rotates. The short/long side of the window is constant
// across portrait and landscape (unlike width/height), so every scale helper
// below is derived from these rather than from the live width/height.
const SHORT_SIDE = Math.min(initial.width, initial.height);
const LONG_SIDE = Math.max(initial.width, initial.height);

// Base dimensions (design reference: 390x844 — iPhone 14)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Tablets (iPad, Android tablets) have a short side of ~600-834pt and a long
// side of ~960-1366pt. Scaling font size, padding, and radii linearly against
// BASE_WIDTH would blow those values up 2x+ (a 16pt font at 30pt+). Clamp the
// ratio so phones scale as designed while tablets get a modest, capped increase.
const MIN_SCALE_RATIO = 0.85;
const MAX_SCALE_RATIO = 1.2;
const clampRatio = (ratio: number) =>
  Math.min(Math.max(ratio, MIN_SCALE_RATIO), MAX_SCALE_RATIO);

const widthRatio = clampRatio(SHORT_SIDE / BASE_WIDTH);
const heightRatio = clampRatio(LONG_SIDE / BASE_HEIGHT);

/** Width percentage of the *current* window (re-evaluated on every call, so it
 *  is correct in inline styles after rotation/split-screen; for styles built at
 *  import time prefer scale()/ms() or a '%' string). */
export const wp = (percent: number): number =>
  Math.round((getWindow().width * percent) / 100);

/** Percentage of the device's short side (rotation-independent), for widths in
 *  styles built at import time where wp() would go stale. */
export const wps = (percent: number): number =>
  Math.round((SHORT_SIDE * percent) / 100);

/** Height percentage of the *current* window (see wp). */
export const hp = (percent: number): number =>
  Math.round((getWindow().height * percent) / 100);

/** Scale a size relative to the 390pt base width. Uses the device's short side
 *  (rotation-independent) and is clamped, so it does not grow without bound on
 *  tablets. */
export const scale = (size: number): number =>
  Math.round(widthRatio * size);

/** Vertical scale relative to the 844pt base height. Uses the device's long
 *  side (rotation-independent) and is clamped. */
export const vs = (size: number): number =>
  Math.round(heightRatio * size);

/** Moderate scale — less aggressive scaling for fonts/padding */
// Not rounded to whole numbers: RN takes fractional dp, and rounding up turned 14sp into
// 15sp (~7% wider text than the Java app, which uses exact dp/sp).
export const ms = (size: number, factor = 0.5): number =>
  size + (size * widthRatio - size) * factor;

/** Scalable font size that respects user font size preferences */
export const sp = (size: number): number =>
  ms(size) / PixelRatio.getFontScale();

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

/** True on large-screen devices (tablets/iPads). Standard heuristic: shorter
 *  side >= 600dp (matches Android's own "sw600dp" tablet breakpoint). Useful
 *  for screens that want an actual layout change (columns, side-by-side
 *  panels) rather than just scaled-up phone spacing. */
export const isTablet = SHORT_SIDE >= 600;

/** Height of AppHeader's toolbar row (below the status bar inset). */
export const HEADER_BAR_HEIGHT = ms(56);

/** Total height of the absolutely-positioned AppHeader: the live top safe-area
 *  inset plus the toolbar. Screens rendered under it (the tab screens) must
 *  start their content below this. It reads the same useSafeAreaInsets() value
 *  AppHeader pads itself with, so they always agree -- unlike a module-level
 *  constant (initialWindowMetrics / StatusBar.currentHeight), which on Android
 *  includes the status bar even while the window already starts below it. */
export const useAppHeaderHeight = (): number =>
  useSafeAreaInsets().top + HEADER_BAR_HEIGHT;