// src/components/SearchPickerModal.tsx
//
// Centered searchable list picker (the RN equivalent of Java's
// dialog_searchable_spinner_* dialogs). Search can be local (filters `options`)
// or remote (`onSearch` fires, debounced, and the parent swaps `options`).

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Modal from './AppModal';
import { COLORS } from '../theme/theme';
import { ms, scale, sp, vs } from '../utils/responsive';

export type PickerOption = { id: number; label: string };

type Props = {
  visible: boolean;
  title: string;
  options: PickerOption[];
  loading?: boolean;
  emptyText?: string;
  onSelect: (option: PickerOption) => void;
  onClose: () => void;
  /** Placeholder of the search box (Java dialogs use "Search..." or a per-dialog hint). */
  searchHint?: string;
  /** Remote search; when set, `options` is shown as-is instead of filtered locally. */
  onSearch?: (text: string) => void;
  /** Plain spinner-style list without the search box (Java's Spinner dropdowns). */
  hideSearch?: boolean;
  /** Java item/product dialogs list nothing until this many characters are typed. */
  minChars?: number;
  /** Red check next to the title (Java okbtn); `okRight` is its marginEnd in dp. */
  showOk?: boolean;
  okRight?: number;
  /** Dialog dismissed (check, outside tap, back) with text typed but nothing picked. */
  onDismissText?: (text: string) => void;
};

const SearchPickerModal: React.FC<Props> = ({
  visible,
  title,
  options,
  loading = false,
  emptyText = 'No results found.',
  onSelect,
  onClose,
  onSearch,
  searchHint = 'Search...',
  hideSearch = false,
  minChars = 0,
  showOk = false,
  okRight = 80,
  onDismissText,
}) => {
  const [query, setQuery] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery('');
    }
  }, [visible]);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const shown = useMemo(() => {
    if (onSearch) {
      return options;
    }
    const q = query.trim().toLowerCase();
    return q ? options.filter(o => o.label.toLowerCase().includes(q)) : options;
  }, [onSearch, options, query]);

  const dismiss = () => {
    const typed = query.trim();
    if (onDismissText && typed) {
      onDismissText(typed);
    }
    onClose();
  };

  const handleChange = (text: string) => {
    setQuery(text);
    if (onSearch) {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => onSearch(text.trim()), 350);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={dismiss}>
      <Pressable style={styles.overlay} onPress={dismiss}>
        <View style={minChars > 0 ? styles.window : styles.windowAuto}>
        <Pressable
          style={
            minChars > 0
              ? [styles.box, styles.boxInWindow, !loading && shown.length === 0 ? { height: undefined } : { height: '100%' }]
              : [styles.box, hideSearch && styles.boxCompact]
          }
          onPress={() => {}}
        >
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {showOk ? (
              <Pressable style={[styles.ok, { right: ms(okRight) }]} onPress={dismiss} hitSlop={8}>
                <Ionicons name="checkmark-circle" size={ms(24)} color={COLORS.primary} />
              </Pressable>
            ) : null}
          </View>
          {hideSearch ? null : (
            <View style={styles.searchWrap}>
              <TextInput
                style={styles.searchInput}
                placeholder={searchHint}
                placeholderTextColor={COLORS.lightGray}
                value={query}
                onChangeText={handleChange}
                autoCorrect={false}
              />
            </View>
          )}
          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={styles.loader} />
          ) : (
            <ScrollView
              style={hideSearch ? styles.listCompact : styles.list}
              keyboardShouldPersistTaps="handled"
            >
              {shown.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.item}
                  onPress={() => onSelect(option)}
                >
                  <Text style={styles.itemText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
              {shown.length === 0 && query.trim().length >= minChars ? (
                <Text style={styles.empty}>{emptyText}</Text>
              ) : null}
            </ScrollView>
          )}
        </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

// Java dialog_searchable_spinner_*: 800x1000px window (~74% wide, ~315dp tall as rendered), square white
// box with 16dp padding, 20sp bold title, red-bordered 10dp-radius search field, plain list
// rows (simple_list_item_1: 18sp, 48dp tall, no dividers).
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: '100%',
    height: vs(315),
    backgroundColor: COLORS.white,
    padding: scale(16),
  },
  // Java sets these dialogs to a 800x1000px window with the white content pinned to its top: the
  // box is as tall as its content while the list is empty and fills the window once it has rows.
  window: { width: '74%', height: vs(381), justifyContent: 'flex-start' },
  windowAuto: { width: '74%' },
  boxInWindow: { width: '100%', maxHeight: '100%' },
  boxCompact: { height: undefined, maxHeight: vs(315) },
  titleRow: { justifyContent: 'center' },
  title: { fontSize: sp(20), fontWeight: '700', color: COLORS.textBlack },
  ok: { position: 'absolute' },
  searchWrap: {
    marginTop: vs(8),
    marginBottom: vs(8),
    borderWidth: 1,
    borderColor: COLORS.alertRed,
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: vs(10),
  },
  searchInput: { fontSize: sp(18), color: COLORS.textBlack, padding: 0 },
  list: { flex: 1 },
  listCompact: { flexGrow: 0, marginTop: vs(8) },
  item: { minHeight: vs(48), justifyContent: 'center', paddingHorizontal: scale(16) },
  itemText: { fontSize: sp(18), color: COLORS.textBlack },
  loader: { marginVertical: vs(18) },
  empty: { textAlign: 'center', color: COLORS.lightGray, paddingVertical: vs(16), fontSize: sp(14) },
});

export default SearchPickerModal;
