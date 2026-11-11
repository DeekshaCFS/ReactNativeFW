// src/components/NumpadDoneBar.tsx
//
// iPhone number and phone keypads have no Return/Done key, so users cannot close them.
// This adds a "Done" bar above those keypads on iOS. Android is unaffected.
import React from 'react';
import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export const NUMPAD_ACCESSORY_ID = 'fwNumpadDone';

const NUMPAD_TYPES = ['number-pad', 'decimal-pad', 'phone-pad', 'numeric'];

/** Returns the accessory id for numeric keypads on iOS, otherwise undefined. */
export const numpadAccessoryId = (keyboardType?: string): string | undefined =>
  Platform.OS === 'ios' && !!keyboardType && NUMPAD_TYPES.includes(keyboardType)
    ? NUMPAD_ACCESSORY_ID
    : undefined;

export default function NumpadDoneBar() {
  if (Platform.OS !== 'ios') {
    return null;
  }
  return (
    <InputAccessoryView nativeID={NUMPAD_ACCESSORY_ID}>
      <View style={styles.bar}>
        <Pressable onPress={() => Keyboard.dismiss()} hitSlop={10}>
          <Text style={styles.done}>Done</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#F2F2F2',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C7C7C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  done: {
    color: '#BD0000',
    fontSize: 17,
    fontWeight: '600',
  },
});