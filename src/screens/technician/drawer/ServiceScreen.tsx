// src/screens/technician/drawer/ServiceScreen.tsx
import {
  View, StyleSheet, Text, TextInput,
  Pressable, Modal, Platform, StatusBar,
} from 'react-native';
import { COLORS } from '../../../theme/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms, sp, scale, hp, vs, wp, HEADER_TOP_PADDING } from '../../../utils/responsive';

type FilterType = 'Asset' | 'Customer No.';
const FILTER_OPTIONS: FilterType[] = ['Asset', 'Customer No.'];

export default function ServiceScreen() {
  const [filter, setFilter] = useState<FilterType>('Asset');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {/* Red top band — accounts for status bar */}
      <View style={[styles.redBg, { height: vs(10) }]} />

      {/* White content sheet */}
      <View style={styles.whiteSheet}>
        <Text style={styles.titleText}>
          Enter Asset Id/Model No. or Customer Number
        </Text>

        {/* Dropdown trigger */}
        <Pressable
          style={styles.dropdownTrigger}
          onPress={() => setDropdownOpen(true)}
        >
          <Text style={styles.dropdownValue}>{filter}</Text>
          <Ionicons name="chevron-down" size={scale(20)} color="#000" />
        </Pressable>

        {/* Text input */}
        <TextInput
          placeholder="Enter Asset ID/Model No."
          placeholderTextColor="#9ca3af"
          style={styles.input}
          cursorColor={COLORS.primary}
          value={inputValue}
          onChangeText={setInputValue}
          returnKeyType="done"
        />

        {/* Submit */}
        <Pressable style={styles.submitBtn}>
          <Text style={styles.submitText}>SUBMIT</Text>
        </Pressable>
      </View>

      {/* Dropdown Modal */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setDropdownOpen(false)}
        />
        <View style={styles.dropdownBox}>
          {FILTER_OPTIONS.map((item) => (
            <Pressable
              key={item}
              style={({ pressed }) => [
                styles.dropdownItem,
                pressed && { backgroundColor: '#f0f0f0' },
              ]}
              onPress={() => { setFilter(item); setDropdownOpen(false); }}
            >
              <Text style={[
                styles.dropdownText,
                item === filter && { color: COLORS.primary, fontWeight: '600' },
              ]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  );
}

// Was flat wp(76) (~300px on a 390pt phone) with no ceiling -- on a tablet
// (e.g. ~1024pt landscape) that scales to ~780pt, far too wide for a form
// field or dropdown. Cap it so phones are unaffected but tablets get a
// sensible max instead of a linear percentage.
const FIELD_WIDTH = Math.min(wp(76), scale(340));

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  redBg: {
    backgroundColor: COLORS.primary,
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(28),
    borderTopRightRadius: ms(28),
    paddingHorizontal: ms(24),
    paddingTop: ms(24),
    alignItems: 'center',
  },
  titleText: {
    fontSize: sp(16),
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: ms(60),
    marginBottom: ms(40),
    fontWeight: '500',
    lineHeight: sp(24),
  },
  dropdownTrigger: {
    height: ms(50),
    width: FIELD_WIDTH,
    borderRadius: ms(30),
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(20),
    marginBottom: ms(16),
  },
  dropdownValue: {
    fontSize: sp(16),
    color: '#111',
  },
  input: {
    height: ms(50),
    width: FIELD_WIDTH,
    borderRadius: ms(30),
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: ms(20),
    fontSize: sp(15),
    marginBottom: ms(20),
    color: COLORS.textPrimary,
  },
  submitBtn: {
    height: ms(50),
    width: FIELD_WIDTH,
    borderRadius: ms(35),
    backgroundColor: '#2f2f2f',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  submitText: {
    color: '#fff',
    fontSize: sp(17),
    fontWeight: '600',
    letterSpacing: 1,
  },

  // Dropdown popup — centred, no magic absolute top
  dropdownBox: {
    position: 'absolute',
    alignSelf: 'center',
    top: '38%',
    width: FIELD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: ms(12),
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: ms(16),
    paddingHorizontal: ms(20),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  dropdownText: {
    fontSize: sp(17),
    color: COLORS.textQuaternary,
    fontWeight: '400',
  },
});