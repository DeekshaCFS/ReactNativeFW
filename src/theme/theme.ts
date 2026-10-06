// src/theme/theme.ts
// Single source of truth for design tokens (colors + typography).
// Merged from the former theme/colors.ts and theme/textStyles.ts.

import { sp } from '../utils/responsive';

export const COLORS = {
  primary:       '#C3002F',
  primaryDark:   '#9E1A28',
  primaryLight:  '#E15A68',

  background:    '#FFFFFF',
  white:         '#FFFFFF',
  black:         '#000000',
  icon:          '#494747',

  textPrimary:   '#1A1A1A',
  textSecondary: '#6B1E24',
  textTertiary:  '#A0A0A0',
  textQuaternary:'#494747',
  textOnPrimary: '#FFFFFF',
  textMuted:     '#6B7280',

  disabled:      '#D8A1A7',

  success: '#03de73',
  warning: '#D98C00',
  danger: '#C8102E',

  // Grays
  charcoal: '#2B2B2E',
  slate: '#5F6368',
  midGray: '#8A8D91',
  border: '#E6E6E9',
  surfaceGray: '#F4F4F6',

  // ── Java res/values/colors.xml (task list / status palette) ─────────────
  // Same values the Android app uses so RN screens match it exactly.
  statusOngoing:   '#FF9B00', // @color/orange   (ongoing_background)
  statusCompleted: '#03DE73', // @color/green    (completed_background)
  statusRejected:  '#C3002F', // @color/colorPrimaryDark (rejected_background)
  statusOnHold:    '#353935', // @color/onhold   (onhold_background)
  statusInactive:  '#9A9FAA', // @color/light_gray (inactive_background)
  tagBlue:         '#2776FF', // @color/blue     (crm_list_background, task tag)
  linkBlue:        '#1976D2', // @color/theme_primary_dark (task id text)
  ink:             '#1D2536', // @color/background_gray (task name / customer text)
  lightGray:       '#9A9FAA', // @color/light_gray (address / subtitle text)
  textBlack:       '#0E0E0E', // @color/black    (Java "black" is not pure #000)
  redIcon:         '#C22033', // @color/red_icon
  alertRed:        '#FF4A4A', // @color/red (notification Rejected / AMC titles)
} as const;

export const TEXT = {
  heading: {
    fontSize: sp(22),
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  subText: {
    fontSize: sp(13),
    color: COLORS.textSecondary,
  },
  link: {
    fontSize: sp(14),
    color: COLORS.primary,
    fontWeight: '500' as const,
  },
};
