// src/components/AccountsDetailParts.tsx
//
// Shared building blocks for the Java quotation_details_fragment / invoice_details_fragment look:
// 0.4 / 0.6 label-value TableRows (15sp background_gray / light_gray, 3dp apart), 14sp bold section
// titles (10dp above, 12dp below) and the 60%-wide action-icon strip (five equal cells, icon centred).
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View, type StyleProp, type TextStyle} from 'react-native';
import {ms, sp} from '../utils/responsive';

export const DETAIL_DARK = '#1d2536'; // @color/background_gray
export const DETAIL_LIGHT = '#9a9faa'; // @color/light_gray
export const DETAIL_GREEN = '#03de73'; // @color/green

export const DetailRow = ({
  label,
  value,
  first = false,
  clip = false,
  valueStyle,
}: {
  label: string;
  value: React.ReactNode;
  first?: boolean;
  /** Java TextViews without maxLines inside a TableRow only show their first line (second is clipped). */
  clip?: boolean;
  valueStyle?: StyleProp<TextStyle>;
}) => (
  <View style={[styles.row, !first && styles.rowGap]}>
    <Text style={styles.label} numberOfLines={1}>
      {label}
    </Text>
    {clip ? (
      <View style={styles.clipBox}>
        <Text style={[styles.valueText, valueStyle]}>{value}</Text>
      </View>
    ) : (
      <Text style={[styles.value, styles.valueText, valueStyle]} numberOfLines={1}>
        {value}
      </Text>
    )}
  </View>
);

export const SectionTitle = ({children, first = false}: {children: React.ReactNode; first?: boolean}) => (
  <Text style={[styles.sectionTitle, first && {marginTop: 0}]}>{children}</Text>
);

/** One cell of the icon strip; `hidden` = Java View.INVISIBLE (keeps its space). */
export const ActionCell = ({
  hidden = false,
  onPress,
  disabled,
  children,
}: {
  hidden?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <View style={[styles.cell, hidden && {opacity: 0}]} pointerEvents={hidden ? 'none' : 'auto'}>
    <TouchableOpacity onPress={onPress} disabled={disabled} hitSlop={8}>
      {children}
    </TouchableOpacity>
  </View>
);

/** Status text (weight 0.4) on the left, icon strip (weight 0.6) on the right. */
export const StatusIconRow = ({
  status,
  color,
  statusFlex = 0.4,
  bold = true,
  children,
}: {
  status: string;
  color: string;
  statusFlex?: number;
  bold?: boolean;
  children: React.ReactNode;
}) => (
  <View style={styles.topRow}>
    <Text style={[styles.status, {color, flex: statusFlex}, !bold && {fontWeight: '400'}]} numberOfLines={1}>
      {status}
    </Text>
    <View style={[styles.strip, {flex: 1 - statusFlex}]}>
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  topRow: {flexDirection: 'row', alignItems: 'center', marginBottom: ms(10)},
  status: {fontSize: sp(14), fontWeight: '700'},
  strip: {flexDirection: 'row', alignItems: 'center'},
  cell: {flex: 1, alignItems: 'center'},
  row: {flexDirection: 'row'},
  rowGap: {marginTop: ms(3)},
  label: {flex: 0.4, fontSize: sp(15), color: DETAIL_DARK},
  value: {flex: 0.6},
  valueText: {fontSize: sp(15), color: DETAIL_LIGHT},
  clipBox: {flex: 0.6, height: sp(15) * 1.25, overflow: 'hidden'},
  sectionTitle: {
    fontSize: sp(14),
    fontWeight: '700',
    color: DETAIL_DARK,
    marginTop: ms(10),
    marginBottom: ms(12),
  },
});
