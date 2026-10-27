// src/components/BackBar.tsx
//
// Slim back-navigation strip for drill-down screens that render *inside* the
// tab shell (customer/lead/quotation/invoice/task details). The shared
// AppHeader already provides the title/menu/notification toolbar, so these
// screens must not draw their own -- this only offers a way back.

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/theme';
import { ms } from '../utils/responsive';
import { HEADER_CONTENT_HEIGHT } from './AppHeader';

type Props = {
  onBack: () => void;
  /** Push the bar below the absolutely-positioned AppHeader. Needed when the
   *  host screen doesn't already pad for it. */
  underAppHeader?: boolean;
};

const BackBar: React.FC<Props> = ({ onBack, underAppHeader = false }) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        underAppHeader && { marginTop: insets.top + HEADER_CONTENT_HEIGHT },
      ]}
    >
      <Pressable onPress={onBack} hitSlop={10} style={styles.btn} accessibilityRole="button" accessibilityLabel="Back">
        <Ionicons name="arrow-back" size={ms(22)} color="#fff" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: { padding: ms(4) },
});

export default BackBar;
