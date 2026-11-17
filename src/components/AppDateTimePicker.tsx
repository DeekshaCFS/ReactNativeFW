// src/components/AppDateTimePicker.tsx
//
// The one date / time picker used across the app (admin and technician).
//   mode="date" -> calendar
//   mode="time" -> clock
// iOS: a light bottom sheet with Cancel / OK, drawn with AppModal (so it also works
// when opened from inside another sheet). The choice applies only on OK.
// Android: the native calendar dialog (date) or clock dialog (time), same props.
// Light theme is forced on iOS regardless of the system dark mode.
import React, {useEffect, useState} from 'react';
import {Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import DateTimePicker, {type DateTimePickerChangeEvent} from '@react-native-community/datetimepicker';
import Modal from './AppModal';
import {ms, sp} from '../utils/responsive';
import {COLORS} from '../theme/theme';

type Props = {
  visible: boolean;
  mode: 'date' | 'time';
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  // Labels for the iOS sheet buttons; default to Cancel / OK.
  cancelLabel?: string;
  confirmLabel?: string;
};

const AppDateTimePicker: React.FC<Props> = ({
  visible,
  mode,
  value,
  minimumDate,
  maximumDate,
  onConfirm,
  onCancel,
  cancelLabel = 'Cancel',
  confirmLabel = 'OK',
}) => {
  const [pending, setPending] = useState<Date>(value);

  // Each time the picker opens, start from the field's current value.
  useEffect(() => {
    if (visible) setPending(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) {
    return null;
  }

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={value}
        mode={mode}
        display={mode === 'date' ? 'calendar' : 'clock'}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onValueChange={(_event: DateTimePickerChangeEvent, date: Date) => onConfirm(date)}
        onDismiss={onCancel}
      />
    );
  }

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Pressable onPress={onCancel} hitSlop={10}>
            <Text style={styles.cancel}>{cancelLabel}</Text>
          </Pressable>
          <Pressable onPress={() => onConfirm(pending)} hitSlop={10}>
            <Text style={styles.confirm}>{confirmLabel}</Text>
          </Pressable>
        </View>
        <DateTimePicker
          value={pending}
          mode={mode}
          display={mode === 'date' ? 'inline' : 'clock'}
          themeVariant="light"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onValueChange={(_event: DateTimePickerChangeEvent, date: Date) => setPending(date)}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.3)'},
  sheet: {backgroundColor: '#FFFFFF', paddingBottom: ms(24)},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D9D9D9',
  },
  cancel: {color: '#666666', fontSize: sp(16)},
  confirm: {color: COLORS.primary, fontSize: sp(16), fontWeight: '600'},
});

export default AppDateTimePicker;