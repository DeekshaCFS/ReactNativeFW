// src/components/AppDateTimePicker.tsx
//
// The one date / time picker used across the app. It is the same custom UI as the Add AMC form:
//   mode="date" -> calendar dialog (month grid, selected day, OK / Cancel)
//   mode="time" -> clock dialog (hour and minute faces, AM / PM, OK / Cancel)
// It is drawn entirely in JavaScript, so it looks and behaves the same on iOS and Android and
// does not use the native pickers. Drawn with AppModal, so it also works from inside another sheet.
import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Modal from './AppModal';
import {ms, sp} from '../utils/responsive';
import {useTranslation} from 'react-i18next';

type Props = {
  visible: boolean;
  mode: 'date' | 'time';
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// 0 = empty cell before the 1st of the month.
const buildCalendarDays = (month: number, year: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({length: firstDay}, () => 0),
    ...Array.from({length: totalDays}, (_, index) => index + 1),
  ];
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const AppDateTimePicker: React.FC<Props> = ({
  visible,
  mode,
  value,
  minimumDate,
  maximumDate,
  onConfirm,
  onCancel,
}) => {
  const {t} = useTranslation();
  // The chosen date (date mode) or time (time mode), applied only on OK.
  const [selected, setSelected] = useState<Date>(value);
  // Month shown in the calendar.
  const [viewDate, setViewDate] = useState<Date>(value);
  // Clock: which face is showing.
  const [clockMode, setClockMode] = useState<'hour' | 'minute'>('hour');

  // Each time the dialog opens, start from the field's current value.
  useEffect(() => {
    if (visible) {
      setSelected(value);
      setViewDate(value);
      setClockMode('hour');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ─── Calendar ───────────────────────────────────────────────────────────────
  const renderCalendar = () => {
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const days = buildCalendarDays(month, year);
    const minDay = minimumDate ? startOfDay(minimumDate) : null;
    const maxDay = maximumDate ? startOfDay(maximumDate) : null;
    const isDisabled = (day: number) => {
      const d = new Date(year, month, day);
      return (minDay !== null && d < minDay) || (maxDay !== null && d > maxDay);
    };

    return (
      <View style={styles.dateDialog}>
        <View style={styles.dateDialogHeader}>
          <Text style={styles.dateDialogYear}>{year}</Text>
          <Text style={styles.dateDialogTitle}>
            {selected.toLocaleDateString('en-GB', {weekday: 'short', day: 'numeric', month: 'short'})}
          </Text>
        </View>
        <View style={styles.calendarBody}>
          <View style={styles.calendarMonthRow}>
            <Pressable hitSlop={10} onPress={() => setViewDate(new Date(year, month - 1, 1))}>
              <Text style={styles.calendarNav}>‹</Text>
            </Pressable>
            <Text style={styles.calendarMonthText}>
              {MONTH_LABELS[month]} {year}
            </Text>
            <Pressable hitSlop={10} onPress={() => setViewDate(new Date(year, month + 1, 1))}>
              <Text style={styles.calendarNav}>›</Text>
            </Pressable>
          </View>

          <View style={styles.calendarGrid}>
            {DAY_NAMES.map((dayName, index) => (
              <Text key={`${dayName}-${index}`} style={styles.weekdayText}>
                {dayName}
              </Text>
            ))}
            {days.map((day, index) => {
              const isSelected =
                day > 0 &&
                selected.getDate() === day &&
                selected.getMonth() === month &&
                selected.getFullYear() === year;
              const disabled = day > 0 && isDisabled(day);
              return (
                <Pressable
                  key={`${day}-${index}`}
                  disabled={!day || disabled}
                  style={[styles.calendarDay, disabled ? {opacity: 0.35} : null]}
                  onPress={() => setSelected(new Date(year, month, day))}>
                  <View style={[styles.calendarDayInner, isSelected ? styles.calendarDaySelected : null]}>
                    <Text
                      style={[styles.calendarDayText, isSelected ? styles.calendarDayTextSelected : null]}>
                      {day || ''}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.dialogActionRow}>
            <Pressable onPress={onCancel}>
              <Text style={styles.dialogActionText}>{t('cancel').toUpperCase()}</Text>
            </Pressable>
            <Pressable onPress={() => onConfirm(startOfDay(selected))}>
              <Text style={styles.dialogActionText}>{t('qr_code_positive_button_know')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  // ─── Clock ──────────────────────────────────────────────────────────────────
  const setClockHour = (hour: number) => {
    const next = new Date(selected);
    const isPM = next.getHours() >= 12;
    next.setHours((hour % 12) + (isPM ? 12 : 0));
    setSelected(next);
  };

  const setClockMinute = (minute: number) => {
    const next = new Date(selected);
    next.setMinutes(minute);
    setSelected(next);
  };

  // Like the Android clock: picking an hour moves on to picking minutes.
  const selectClockHour = (hour: number) => {
    setClockHour(hour);
    setClockMode('minute');
  };

  const toggleClockPeriod = (period: 'AM' | 'PM') => {
    const next = new Date(selected);
    const hour = next.getHours();
    if (period === 'AM' && hour >= 12) {
      next.setHours(hour - 12);
    } else if (period === 'PM' && hour < 12) {
      next.setHours(hour + 12);
    }
    setSelected(next);
  };

  const renderClock = () => {
    const clockSize = ms(256);
    const clockRadius = ms(104);
    const center = clockSize / 2;
    const bubbleSize = ms(40);
    const isHourMode = clockMode === 'hour';
    const hour12 = selected.getHours() % 12 || 12;
    const minute = selected.getMinutes();
    const minuteStep = (Math.round(minute / 5) * 5) % 60;
    const period = selected.getHours() >= 12 ? 'PM' : 'AM';
    const faceValues = isHourMode
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    const selectedValue = isHourMode ? hour12 : minuteStep;

    // Hour 12 and minute 0 both sit at the top of the face.
    const angleFor = (value: number) => {
      const fraction = isHourMode ? (value % 12) / 12 : value / 60;
      return fraction * Math.PI * 2 - Math.PI / 2;
    };
    const pointFor = (angle: number, radius: number) => ({
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    });
    const selectedAngle = angleFor(selectedValue);
    // Solid hand from the centre to the selected number (a bar rotated about its middle).
    const handLength = clockRadius;
    const handMid = pointFor(selectedAngle, handLength / 2);
    const handAngleDeg = (selectedAngle * 180) / Math.PI;

    return (
      <View style={styles.timeDialog}>
        <View style={styles.timeDialogHeader}>
          <View style={styles.timeDisplayRow}>
            <Pressable hitSlop={8} onPress={() => setClockMode('hour')}>
              <Text style={[styles.timeDisplay, !isHourMode ? styles.timeDisplayInactive : null]}>
                {hour12}
              </Text>
            </Pressable>
            <Text style={[styles.timeDisplay, styles.timeDisplayColon]}>:</Text>
            <Pressable hitSlop={8} onPress={() => setClockMode('minute')}>
              <Text style={[styles.timeDisplay, isHourMode ? styles.timeDisplayInactive : null]}>
                {String(minute).padStart(2, '0')}
              </Text>
            </Pressable>
          </View>
          <View style={styles.periodColumn}>
            <Pressable hitSlop={6} onPress={() => toggleClockPeriod('AM')}>
              <Text style={[styles.periodText, period === 'AM' ? styles.periodTextActive : null]}>
                {t('am')}
              </Text>
            </Pressable>
            <Pressable hitSlop={6} onPress={() => toggleClockPeriod('PM')}>
              <Text style={[styles.periodText, period === 'PM' ? styles.periodTextActive : null]}>
                {t('pm')}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.clockBody}>
          <View style={[styles.clockFace, {width: clockSize, height: clockSize, borderRadius: clockSize / 2}]}>
            <View
              style={[
                styles.clockHand,
                {
                  width: handLength,
                  left: handMid.x - handLength / 2,
                  top: handMid.y - ms(1),
                  transform: [{rotate: `${handAngleDeg}deg`}],
                },
              ]}
            />
            <View style={[styles.clockCenterDot, {left: center - ms(4), top: center - ms(4)}]} />
            {faceValues.map(value => {
              const point = pointFor(angleFor(value), clockRadius);
              const isSelected = value === selectedValue;
              return (
                <Pressable
                  key={`${clockMode}-${value}`}
                  onPress={() => (isHourMode ? selectClockHour(value) : setClockMinute(value))}
                  style={[
                    styles.clockNumber,
                    {
                      left: point.x - bubbleSize / 2,
                      top: point.y - bubbleSize / 2,
                      width: bubbleSize,
                      height: bubbleSize,
                      borderRadius: bubbleSize / 2,
                    },
                    isSelected ? styles.clockNumberSelected : null,
                  ]}>
                  <Text style={[styles.clockNumberText, isSelected ? styles.clockNumberTextSelected : null]}>
                    {isHourMode ? value : String(value).padStart(2, '0')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.timeActionRow}>
            <View style={styles.timeActionButtons}>
              <Pressable onPress={onCancel}>
                <Text style={styles.dialogActionText}>{t('cancel').toUpperCase()}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  // Like the Add AMC form: the picked time is stored with ":00" seconds.
                  const picked = new Date(selected);
                  picked.setSeconds(0, 0);
                  onConfirm(picked);
                }}>
                <Text style={styles.dialogActionText}>{t('qr_code_positive_button_know')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.pickerOverlay}>{mode === 'date' ? renderCalendar() : renderClock()}</View>
    </Modal>
  );
};

const styles = StyleSheet.create({

  pickerOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: ms(24),
  },

  dateDialog: {
    backgroundColor: '#FFFFFF',
    elevation: 8,
    maxWidth: ms(420),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    width: '100%',
  },

  dateDialogHeader: {
    backgroundColor: '#C8142E',
    paddingHorizontal: ms(24),
    paddingVertical: ms(18),
  },

  dateDialogYear: {
    color: '#F5B3BC',
    fontSize: sp(16),
    fontWeight: '800',
  },

  dateDialogTitle: {
    color: '#FFFFFF',
    fontSize: sp(31),
    fontWeight: '800',
    marginTop: ms(4),
  },

  calendarBody: {
    paddingHorizontal: ms(28),
    paddingTop: ms(22),
  },

  calendarMonthRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ms(22),
  },

  calendarNav: {
    color: '#222222',
    fontSize: sp(36),
    fontWeight: '300',
    lineHeight: sp(38),
  },

  calendarMonthText: {
    color: '#222222',
    fontSize: sp(16),
    fontWeight: '800',
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  weekdayText: {
    color: '#888888',
    fontSize: sp(14),
    fontWeight: '700',
    marginBottom: ms(18),
    textAlign: 'center',
    width: `${100 / 7}%`,
  },

  calendarDay: {
    alignItems: 'center',
    height: ms(42),
    justifyContent: 'center',
    marginBottom: ms(2),
    width: `${100 / 7}%`,
  },

  calendarDayInner: {
    alignItems: 'center',
    height: ms(42),
    justifyContent: 'center',
    width: ms(42),
  },

  calendarDaySelected: {
    backgroundColor: '#C8142E',
    borderRadius: ms(21),
  },

  calendarDayText: {
    color: '#444444',
    fontSize: sp(16),
  },

  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  dialogActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: ms(34),
    justifyContent: 'flex-end',
    paddingBottom: ms(24),
    paddingTop: ms(22),
  },

  dialogActionText: {
    color: '#C8142E',
    fontSize: sp(15),
    fontWeight: '800',
  },

  timeDialog: {
    backgroundColor: '#FFFFFF',
    elevation: 8,
    maxWidth: ms(520),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    width: '100%',
  },

  timeDialogHeader: {
    alignItems: 'center',
    backgroundColor: '#C8142E',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: ms(118),
    paddingHorizontal: ms(20),
  },

  timeDisplayRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },

  timeDisplay: {
    color: '#FFFFFF',
    fontSize: sp(54),
    fontWeight: '300',
  },

  timeDisplayInactive: {
    color: 'rgba(255, 255, 255, 0.55)',
  },

  timeDisplayColon: {
    marginHorizontal: ms(4),
  },

  periodColumn: {
    marginLeft: ms(18),
  },

  periodText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: sp(18),
    fontWeight: '800',
    lineHeight: sp(28),
  },

  periodTextActive: {
    color: '#FFFFFF',
  },

  clockBody: {
    paddingBottom: ms(18),
    paddingHorizontal: ms(24),
    paddingTop: ms(22),
  },

  clockFace: {
    alignSelf: 'center',
    backgroundColor: '#EEEEEE',
    marginBottom: ms(10),
    position: 'relative',
  },

  clockHand: {
    backgroundColor: '#C8142E',
    height: ms(2),
    position: 'absolute',
  },

  clockCenterDot: {
    backgroundColor: '#C8142E',
    borderRadius: ms(4),
    height: ms(8),
    position: 'absolute',
    width: ms(8),
  },

  clockNumber: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },

  clockNumberSelected: {
    backgroundColor: '#C8142E',
  },

  clockNumberText: {
    color: '#333333',
    fontSize: sp(16),
  },

  clockNumberTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  timeActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  timeActionButtons: {
    flexDirection: 'row',
    gap: ms(34),
  },
});

export default AppDateTimePicker;