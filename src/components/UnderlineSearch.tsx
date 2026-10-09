// src/components/UnderlineSearch.tsx
// Java SearchView look: search glyph, underline, clear (X) button.

import React from 'react';
import {Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../theme/theme';
import {ms, sp} from '../utils/responsive';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmitEditing?: () => void;
  style?: StyleProp<ViewStyle>;
};

const UnderlineSearch = ({value, onChangeText, placeholder = 'Search', onSubmitEditing, style}: Props) => (
  <View style={[styles.box, style]}>
    <Ionicons name="search" style={styles.icon} />
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmitEditing}
      placeholder={placeholder}
      placeholderTextColor={COLORS.lightGray}
      style={styles.input}
      returnKeyType="search"
    />
    {value ? (
      <Pressable hitSlop={10} onPress={() => onChangeText('')}>
        <Ionicons name="close" style={styles.clear} />
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ms(40),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkGray,
    paddingHorizontal: ms(8),
  },
  icon: {fontSize: ms(20), color: COLORS.lightGray, marginRight: ms(8)},
  input: {flex: 1, paddingVertical: 0, color: COLORS.textBlack, fontSize: sp(14)},
  clear: {fontSize: ms(20), color: COLORS.textBlack},
});

export default UnderlineSearch;
