// src/components/OutlinedInput.tsx
//
// Java's TextInputLayoutStyle is a Material outlined box: the hint sits inside the field and
// floats up onto the border once there is text. RN's placeholder just disappears when you
// type, so the floating label is drawn here. Layout keys of the passed style (flex, width,
// margins) go on the wrapper; everything else styles the input.
import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../theme/theme';
import { ms, sp } from '../utils/responsive';

const WRAPPER_KEYS = [
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'width', 'margin', 'marginTop', 'marginBottom',
  'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical',
];

function splitStyle(style: any) {
  const flat: Record<string, any> = StyleSheet.flatten(style) ?? {};
  const wrapper: Record<string, any> = {};
  const rest: Record<string, any> = {};
  Object.keys(flat).forEach(k => {
    if (WRAPPER_KEYS.includes(k)) wrapper[k] = flat[k];
    else rest[k] = flat[k];
  });
  return { wrapper, rest };
}

export function OutlinedInput(props: React.ComponentProps<typeof TextInput>) {
  const { style, placeholder, value, ...rest } = props;
  const { wrapper, rest: input } = splitStyle(style);
  return (
    <View style={wrapper}>
      <TextInput {...rest} style={[input, { marginBottom: 0 }]} placeholder={placeholder} value={value} />
      {!!value && !!placeholder && <Text style={styles.floatLabel}>{placeholder}</Text>}
    </View>
  );
}

type SelectProps = {
  label: string; // hint, also the floating label once a value is chosen
  value?: string;
  onPress: () => void;
  style?: any; // same pill style as the inputs (border, radius, height)
  chevron?: boolean;
};

/** Read-only outlined field that opens a picker (Java's spinner-style TextViews). */
export function OutlinedSelect({ label, value, onPress, style, chevron = false }: SelectProps) {
  const { wrapper, rest: box } = splitStyle(style);
  return (
    <Pressable style={wrapper} onPress={onPress}>
      <View style={[box, styles.selectRow, { marginBottom: 0 }]}>
        <Text style={[styles.selectText, !value && { color: COLORS.lightGray }]} numberOfLines={1}>
          {value || label}
        </Text>
        {chevron && <Ionicons name="chevron-down" size={ms(18)} color={COLORS.ink} />}
      </View>
      {!!value && !chevron && <Text style={styles.floatLabel}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floatLabel: {
    position: 'absolute',
    top: -ms(8),
    left: ms(14),
    paddingHorizontal: ms(4),
    backgroundColor: COLORS.white,
    fontSize: sp(12),
    color: COLORS.lightGray,
  },
  selectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { flex: 1, fontSize: sp(16), color: COLORS.ink },
});

export default OutlinedInput;
