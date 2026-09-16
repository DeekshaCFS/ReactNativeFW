// src/components/DrumPicker.tsx
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../theme/theme';
import { ms, sp } from '../utils/responsive';

interface Props {
  data: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

// itemStyle only works on iOS for the Picker component
const PICKER_ITEM_HEIGHT = ms(44);
const PICKER_HEIGHT = PICKER_ITEM_HEIGHT * 3; // show ~3 items

export default function DrumPicker({ data, selectedIndex, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Picker
        selectedValue={String(selectedIndex)}
        onValueChange={(val) => onSelect(Number(val))}
        style={[
          styles.picker,
          // Android: explicit height needed; iOS: controlled by itemStyle
          Platform.OS === 'android' && { height: PICKER_HEIGHT },
        ]}
        itemStyle={styles.item} // iOS only
        mode={Platform.OS === 'android' ? 'dropdown' : undefined}
      >
        {data.map((label, index) => (
          <Picker.Item
            key={index}
            label={label}
            value={String(index)}
            // color prop on Picker.Item is Android-only; iOS uses itemStyle
            color={
              Platform.OS === 'android'
                ? index === selectedIndex
                  ? COLORS.black
                  : '#aaa'
                : undefined
            }
            style={
              Platform.OS === 'ios'
                ? {
                    fontSize: sp(18),
                    color: index === selectedIndex ? COLORS.black : '#aaa',
                  }
                : undefined
            }
          />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  picker: {
    // On iOS height is driven by itemStyle.height
    height: Platform.OS === 'ios' ? PICKER_HEIGHT : undefined,
    color: COLORS.black,
    width: '100%',
  },
  item: {
    // iOS only — controls row height inside the drum-roll picker
    fontSize: sp(18),
    height: PICKER_ITEM_HEIGHT,
    color: COLORS.black,
  },
});