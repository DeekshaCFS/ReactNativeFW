// src/components/TabStrip.tsx
// Java TabLayout (fixed mode): white bar, selected tab gets @color/tabselector
// background, 4dp primary indicator and primary text. Shared by the tab-host
// screens (CRM, Accounts, ...) so they all look like the Java app.

import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {COLORS} from '../theme/theme';
import {ms, sp} from '../utils/responsive';

export type TabStripItem<K extends string> = {key: K; label: string};

type Props<K extends string> = {
  tabs: TabStripItem<K>[];
  active: K;
  onChange: (key: K) => void;
};

function TabStrip<K extends string>({tabs, active, onChange}: Props<K>) {
  return (
    <View style={styles.row}>
      {tabs.map(tab => {
        const selected = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, selected ? styles.tabActive : null]}
            onPress={() => onChange(tab.key)}>
            <Text style={[styles.text, selected ? styles.textActive : null]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
  },
  tab: {
    flex: 1,
    height: ms(48),
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: ms(4),
    borderBottomColor: 'transparent',
  },
  tabActive: {
    backgroundColor: COLORS.tabSelector,
    borderBottomColor: COLORS.primary,
  },
  text: {
    fontSize: sp(14),
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  textActive: {
    color: COLORS.primary,
  },
});

export default TabStrip;
