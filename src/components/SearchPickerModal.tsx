// src/components/SearchPickerModal.tsx
//
// Centered searchable list picker (the RN equivalent of Java's
// dialog_searchable_spinner_* dialogs). Search can be local (filters `options`)
// or remote (`onSearch` fires, debounced, and the parent swaps `options`).

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
  /** Remote search; when set, `options` is shown as-is instead of filtered locally. */
  onSearch?: (text: string) => void;
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
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.box} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="#9aa0a6"
              value={query}
              onChangeText={handleChange}
              autoCorrect={false}
            />
            <Ionicons name="search" size={sp(16)} color="#8a8f98" />
          </View>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={styles.loader} />
          ) : (
            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {shown.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.item}
                  onPress={() => onSelect(option)}
                >
                  <Text style={styles.itemText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
              {shown.length === 0 ? <Text style={styles.empty}>{emptyText}</Text> : null}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: scale(24),
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: scale(12),
    padding: ms(16),
    maxHeight: '70%',
  },
  title: { fontSize: sp(16), fontWeight: '700', color: '#222', marginBottom: vs(10) },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d5d7db',
    borderRadius: scale(20),
    paddingHorizontal: scale(12),
    height: vs(40),
    marginBottom: vs(8),
  },
  searchInput: { flex: 1, fontSize: sp(13), color: '#222', padding: 0 },
  list: { flexGrow: 0 },
  item: { paddingVertical: vs(11), borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemText: { fontSize: sp(14), color: '#222' },
  loader: { marginVertical: vs(18) },
  empty: { textAlign: 'center', color: '#8a8f98', paddingVertical: vs(16), fontSize: sp(13) },
});

export default SearchPickerModal;
