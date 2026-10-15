// src/components/DecimalInput.tsx
//
// Shared input for every numeric (amount / price / quantity / percentage / reading) field:
//  - decimal keyboard, digits and one '.', at most 3 decimals (Java v4.6.7 "%.3f" amounts);
//  - "0.000" placeholder while empty;
//  - a whole number is padded when the field loses focus (5 -> 5.000, .5 -> 0.500);
//  - already-saved values (e.g. an edit form pre-filled with "5") are shown padded too.
// Not for phone numbers, OTPs, pin codes or other identifiers -- those stay as digit-only text.
//
// `label` is optional: fields whose only caption used to be their placeholder pass it here and
// it is drawn on the border like Java's outlined TextInputLayout hint, so the "0.000" placeholder
// can still be shown inside the box. Layout keys of `style` (flex, width, margins) go on the
// wrapper that holds the label; everything else styles the input.
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../theme/theme';
import { ms, sp } from '../utils/responsive';
import { AMOUNT_DECIMALS, sanitizeDecimalInput } from '../utils/decimal';

export const DECIMAL_PLACEHOLDER = (0).toFixed(AMOUNT_DECIMALS); // "0.000"

/** "5" -> "5.000", ".5" -> "0.500", "5." -> "5.000"; empty / non-numeric stays as typed. */
export const padDecimal = (text: string, decimals: number = AMOUNT_DECIMALS): string => {
  const t = (text ?? '').trim();
  if (!t) return '';
  const n = Number(t);
  return Number.isFinite(n) ? n.toFixed(decimals) : t;
};

const WRAPPER_KEYS = [
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'width', 'minWidth', 'maxWidth', 'margin', 'marginTop',
  'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical', 'alignSelf',
];

type Props = Omit<React.ComponentProps<typeof TextInput>, 'keyboardType' | 'maxLength'> & {
  /** Floating caption on the border (used when the field has no separate label). */
  label?: string;
  /** Background behind the floating caption; match the surface the field sits on. */
  labelBackground?: string;
  /** Digits allowed before the point (default 9). */
  maxIntDigits?: number;
  decimals?: number;
};

export default function DecimalInput({
  label,
  labelBackground = COLORS.white,
  maxIntDigits = 9,
  decimals = AMOUNT_DECIMALS,
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder,
  style,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const raw = value ?? '';
  const shown = focused ? raw : padDecimal(raw, decimals);

  const input = (
    <TextInput
      {...rest}
      style={label ? [omitWrapperKeys(style), { marginBottom: 0 }] : style}
      value={shown}
      keyboardType="decimal-pad"
      placeholder={placeholder ?? padDecimal('0', decimals)}
      placeholderTextColor={rest.placeholderTextColor ?? COLORS.lightGray}
      onFocus={e => {
        setFocused(true);
        onFocus?.(e);
      }}
      onChangeText={t => {
        const clean = sanitizeDecimalInput(t, decimals);
        const [whole, frac] = clean.split('.');
        const capped = whole.length > maxIntDigits ? whole.slice(0, maxIntDigits) : whole;
        onChangeText?.(frac === undefined ? capped : `${capped}.${frac}`);
      }}
      onBlur={e => {
        setFocused(false);
        const padded = padDecimal(raw, decimals);
        if (padded && padded !== raw) onChangeText?.(padded);
        onBlur?.(e);
      }}
    />
  );

  if (!label) return input;
  return (
    <View style={pickWrapperKeys(style)}>
      {input}
      <Text style={[styles.floatLabel, { backgroundColor: labelBackground }]}>{label}</Text>
    </View>
  );
}

function pickWrapperKeys(style: any) {
  const flat: Record<string, any> = StyleSheet.flatten(style) ?? {};
  const out: Record<string, any> = {};
  Object.keys(flat).forEach(k => { if (WRAPPER_KEYS.includes(k)) out[k] = flat[k]; });
  return out;
}

function omitWrapperKeys(style: any) {
  const flat: Record<string, any> = StyleSheet.flatten(style) ?? {};
  const out: Record<string, any> = {};
  Object.keys(flat).forEach(k => { if (!WRAPPER_KEYS.includes(k)) out[k] = flat[k]; });
  return out;
}

const styles = StyleSheet.create({
  floatLabel: {
    position: 'absolute',
    top: -ms(8),
    left: ms(14),
    paddingHorizontal: ms(4),
    fontSize: sp(12),
    color: COLORS.lightGray,
  },
});
