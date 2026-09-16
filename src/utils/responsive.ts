// src/utils/responsive.ts
import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (design reference: 390x844 — iPhone 14)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

/** Width percentage */
export const wp = (percent: number): number =>
  Math.round((SCREEN_WIDTH * percent) / 100);

/** Height percentage */
export const hp = (percent: number): number =>
  Math.round((SCREEN_HEIGHT * percent) / 100);

/** Scale a size relative to base width */
export const scale = (size: number): number =>
  Math.round((SCREEN_WIDTH / BASE_WIDTH) * size);

/** Vertical scale relative to base height */
export const vs = (size: number): number =>
  Math.round((SCREEN_HEIGHT / BASE_HEIGHT) * size);

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

/** Safe status bar height across platforms */
export const STATUS_BAR_HEIGHT = Platform.select({
  ios: 44,
  android: StatusBar.currentHeight ?? 24,
  default: 0,
});

/** Standard top padding for screens that sit under the status bar */
export const HEADER_TOP_PADDING = STATUS_BAR_HEIGHT;

export { SCREEN_WIDTH, SCREEN_HEIGHT };