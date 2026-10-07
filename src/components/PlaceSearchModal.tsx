// src/components/PlaceSearchModal.tsx
//
// RN counterpart of Java's Places SDK Autocomplete.IntentBuilder(FULLSCREEN, ...): a full-screen
// search (back arrow, query box with clear button, suggestion list, "powered by Google") that
// returns the picked place's address + lat/long. Used by the Add Quote/Invoice and Lead forms.
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList, StyleSheet, ActivityIndicator, Keyboard,
} from 'react-native';
import Modal from './AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../theme/theme';
import { ms, sp, scale, vs } from '../utils/responsive';
import { PLACES_API_KEY } from '../config/maps';

export type PickedPlace = { address: string; name: string; latitude: number; longitude: number };

type Prediction = { placeId: string; primary: string; secondary: string; full: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (place: PickedPlace) => void;
};

const MAPS = 'https://maps.googleapis.com/maps/api/place';

export default function PlaceSearchModal({ visible, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(0);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setLoading(false);
    }
  }, [visible]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const search = (text: string) => {
    setQuery(text);
    if (timer.current) clearTimeout(timer.current);
    if (!PLACES_API_KEY || !text.trim()) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const id = ++latest.current;
      setLoading(true);
      try {
        const res = await fetch(
          `${MAPS}/autocomplete/json?input=${encodeURIComponent(text.trim())}&key=${PLACES_API_KEY}`,
        );
        const data = await res.json();
        if (id !== latest.current) return;
        setResults(
          (data?.predictions ?? []).map((p: any) => ({
            placeId: p.place_id,
            primary: p.structured_formatting?.main_text ?? p.description,
            secondary: p.structured_formatting?.secondary_text ?? '',
            full: p.description,
          })),
        );
      } catch {
        if (id === latest.current) setResults([]);
      } finally {
        if (id === latest.current) setLoading(false);
      }
    }, 300);
  };

  const pick = async (p: Prediction) => {
    Keyboard.dismiss();
    setLoading(true);
    try {
      const res = await fetch(
        `${MAPS}/details/json?place_id=${p.placeId}&fields=name,formatted_address,geometry&key=${PLACES_API_KEY}`,
      );
      const data = await res.json();
      const r = data?.result;
      onSelect({
        address: r?.formatted_address ?? p.full,
        name: r?.name ?? p.primary,
        latitude: Number(r?.geometry?.location?.lat) || 0,
        longitude: Number(r?.geometry?.location?.lng) || 0,
      });
    } catch {
      onSelect({ address: p.full, name: p.primary, latitude: 0, longitude: 0 });
    } finally {
      setLoading(false);
    }
  };

  // No key configured: let the person keep what they typed.
  const useTyped = () => {
    const text = query.trim();
    if (!text) return;
    Keyboard.dismiss();
    onSelect({ address: text, name: text, latitude: 0, longitude: 0 });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.bar}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.barBtn}>
            <Ionicons name="arrow-back" size={ms(24)} color={COLORS.white} />
          </Pressable>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={search}
            placeholder="Search"
            placeholderTextColor="rgba(255,255,255,0.6)"
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => { if (!PLACES_API_KEY) useTyped(); }}
          />
          {!!query && (
            <Pressable onPress={() => search('')} hitSlop={10} style={styles.barBtn}>
              <Ionicons name="close" size={ms(24)} color={COLORS.white} />
            </Pressable>
          )}
        </View>

        <FlatList
          data={results}
          keyboardShouldPersistTaps="handled"
          keyExtractor={p => p.placeId}
          ListHeaderComponent={
            <View style={styles.poweredRow}>
              <Text style={styles.powered}>powered by </Text>
              <Text style={styles.googleWord}>
                <Text style={{ color: '#4285F4' }}>G</Text>
                <Text style={{ color: '#EA4335' }}>o</Text>
                <Text style={{ color: '#FBBC05' }}>o</Text>
                <Text style={{ color: '#4285F4' }}>g</Text>
                <Text style={{ color: '#34A853' }}>l</Text>
                <Text style={{ color: '#EA4335' }}>e</Text>
              </Text>
            </View>
          }
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: vs(24) }} />
            ) : !PLACES_API_KEY && query.trim() ? (
              <Pressable style={styles.row} onPress={useTyped}>
                <Ionicons name="location-outline" size={ms(22)} color={COLORS.darkGray} style={styles.pin} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.primary} numberOfLines={2}>{query.trim()}</Text>
                  <Text style={styles.secondary}>Use this address</Text>
                </View>
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => pick(item)}>
              <Ionicons name="location-outline" size={ms(22)} color={COLORS.darkGray} style={styles.pin} />
              <View style={{ flex: 1 }}>
                <Text style={styles.primary} numberOfLines={1}>{item.primary}</Text>
                {!!item.secondary && <Text style={styles.secondary} numberOfLines={1}>{item.secondary}</Text>}
              </View>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.passbookBackdrop },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    height: ms(56),
    paddingHorizontal: scale(8),
    elevation: 4,
  },
  barBtn: { width: ms(40), height: ms(40), alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, fontSize: sp(20), color: COLORS.white, paddingHorizontal: scale(8) },
  poweredRow: { flexDirection: 'row', alignItems: 'center', padding: scale(16) },
  powered: { fontSize: sp(16), color: COLORS.darkGray },
  googleWord: { fontSize: sp(18), fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: vs(12),
    backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  pin: { marginRight: scale(16) },
  primary: { fontSize: sp(16), fontWeight: '700', color: COLORS.textBlack },
  secondary: { fontSize: sp(14), color: COLORS.lightGray, marginTop: 2 },
});
