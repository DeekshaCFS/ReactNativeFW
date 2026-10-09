// src/components/MonthYearPickerDialog.tsx
//
// Port of Java's Util/MonthYearPickerDialog (layout dialog_month_year_picker):
// white 16dp-radius card with a bold "Select Month & Year" title, one or two
// NumberPicker-style wheels (3 visible rows, grey neighbours, divider lines
// around the selected row), then grey Cancel and primary OK buttons.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import Modal from './AppModal';
import { COLORS } from '../theme/theme';
import { scale, sp, vs } from '../utils/responsive';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ITEM_H = vs(60);
const WHEEL_W = scale(64);

type WheelProps = {
  labels: string[];
  index: number;
  onChange: (index: number) => void;
};

function Wheel({ labels, index, onChange }: WheelProps) {
  const ref = useRef<ScrollView>(null);
  const [live, setLive] = useState(index);

  useEffect(() => {
    setLive(index);
    // Position on the activated value once laid out.
    const t = setTimeout(() => ref.current?.scrollTo({ y: index * ITEM_H, animated: false }), 0);
    return () => clearTimeout(t);
  }, [index, labels.length]);

  const settle = (y: number) => {
    const i = Math.min(labels.length - 1, Math.max(0, Math.round(y / ITEM_H)));
    setLive(i);
    onChange(i);
  };

  return (
    <View style={styles.wheel}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        nestedScrollEnabled
        scrollEventThrottle={16}
        onScroll={e => {
          const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
          if (i !== live && i >= 0 && i < labels.length) setLive(i);
        }}
        onMomentumScrollEnd={e => settle(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={e => {
          // Android fires no momentum event when a drag ends exactly on a snap point.
          if (Platform.OS === 'android') settle(e.nativeEvent.contentOffset.y);
        }}
        contentContainerStyle={{ paddingVertical: ITEM_H }}
      >
        {labels.map((label, i) => (
          <View key={label + i} style={styles.item}>
            <Text style={[styles.itemText, i === live ? styles.itemTextOn : styles.itemTextOff]}>{label}</Text>
          </View>
        ))}
      </ScrollView>
      <View pointerEvents="none" style={[styles.line, { top: ITEM_H + (ITEM_H - vs(50)) / 2 }]} />
      <View pointerEvents="none" style={[styles.line, { top: ITEM_H + (ITEM_H - vs(50)) / 2 + vs(50) }]} />
    </View>
  );
}

type Props = {
  visible: boolean;
  /** Java showYearOnly(): hides the month wheel. */
  yearOnly?: boolean;
  minYear: number;
  maxYear: number;
  activatedMonth: number; // 0-11
  activatedYear: number;
  title?: string;
  /** 'holo': Android's stock grey month/year dialog (Task tab) instead of the rounded white one. */
  variant?: 'default' | 'holo';
  onConfirm: (month: number, year: number) => void;
  onCancel: () => void;
};

export default function MonthYearPickerDialog({
  visible, yearOnly = false, minYear, maxYear, activatedMonth, activatedYear,
  title = 'Select Month & Year', variant = 'default', onConfirm, onCancel,
}: Props) {
  const holo = variant === 'holo';
  const years: string[] = [];
  for (let y = minYear; y <= maxYear; y++) years.push(String(y));

  const [monthIdx, setMonthIdx] = useState(activatedMonth);
  const [yearIdx, setYearIdx] = useState(Math.max(0, activatedYear - minYear));

  // Re-seed whenever the dialog opens (Java builds a fresh dialog each time).
  useEffect(() => {
    if (visible) {
      setMonthIdx(activatedMonth);
      setYearIdx(Math.min(years.length - 1, Math.max(0, activatedYear - minYear)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        {/* Backdrop is a sibling (not a parent) so it can't steal the wheels' scroll gestures. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={holo ? styles.holoCard : styles.card}>
          {holo ? null : <Text style={styles.title}>{title}</Text>}
          <View style={styles.wheels}>
            {!yearOnly && (
              <View style={{ marginRight: scale(16) }}>
                <Wheel key={`m${visible}`} labels={MONTHS} index={monthIdx} onChange={setMonthIdx} />
              </View>
            )}
            <Wheel key={`y${visible}`} labels={years} index={yearIdx} onChange={setYearIdx} />
          </View>
          {holo ? (
            <View style={styles.holoButtons}>
              <Pressable style={styles.holoBtn} onPress={onCancel}>
                <Text style={styles.holoBtnText}>Cancel</Text>
              </Pressable>
              <View style={styles.holoDivider} />
              <Pressable
                style={styles.holoBtn}
                onPress={() => onConfirm(yearOnly ? 0 : monthIdx, Number(years[yearIdx]))}>
                <Text style={styles.holoBtnText}>OK</Text>
              </Pressable>
            </View>
          ) : (
          <View style={styles.buttons}>
            <Pressable style={[styles.btn, { backgroundColor: COLORS.pickerCancel }]} onPress={onCancel}>
              <Text style={[styles.btnText, { color: COLORS.textBlack }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, { backgroundColor: COLORS.primary }]}
              onPress={() => onConfirm(yearOnly ? 0 : monthIdx, Number(years[yearIdx]))}
            >
              <Text style={[styles.btnText, { color: COLORS.white }]}>OK</Text>
            </Pressable>
          </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  card: {
    width: scale(236),
    backgroundColor: COLORS.white,
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: scale(20),
    alignItems: 'center',
  },
  // Stock Android (holo) month/year dialog: grey card, cyan wheel lines, flat Cancel | OK footer.
  holoCard: {
    width: scale(300),
    backgroundColor: '#F5F5F5',
    elevation: 8,
  },
  holoButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: vs(20),
  },
  holoBtn: { flex: 1, height: vs(50), alignItems: 'center', justifyContent: 'center' },
  holoDivider: { width: 1, backgroundColor: '#E0E0E0' },
  holoBtnText: { fontSize: sp(16), color: COLORS.textBlack },
  title: { fontSize: sp(18), fontWeight: '700', color: COLORS.textBlack, marginBottom: vs(16) },
  wheels: { flexDirection: 'row', justifyContent: 'center', marginBottom: vs(20) },
  wheel: { width: WHEEL_W, height: ITEM_H * 3 },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: sp(16) },
  itemTextOn: { color: COLORS.textBlack },
  itemTextOff: { color: COLORS.midGray },
  line: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: COLORS.midGray },
  buttons: { flexDirection: 'row', justifyContent: 'center' },
  btn: {
    minWidth: scale(88),
    height: vs(40),
    margin: scale(5),
    borderRadius: scale(4),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  btnText: { fontSize: sp(14), fontWeight: '500' },
});
