// src/screens/admin/TechnicianExpenseDetailsModal.tsx
//
// Port of Java's ExpenseDetailsFragment (layout expense_details_old), opened
// from the owner's Expenditure technician list (ExpenseTechnicianListFragment
// row tap). Rendered inline under the shared toolbar/bottom bar (like Java's
// fragment) instead of a full-screen modal: red backdrop with the date picker,
// white 30dp sheet with the technician name, then the shared summary card and
// expense list. The add-expense icon is technician-only in Java.
import React, {useEffect, useState} from 'react';
import {BackHandler, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppDateTimePicker from '../../components/AppDateTimePicker';
import {getExpenditureDetails} from '../../api/expenditure/expenditureService';
import type {ExpenseDetailsResultData} from '../../api/expenditure/expenditure.types';
import ExpenseDetailsBody, {
  minExpenseDate,
  toExpenseApiDate,
  toExpenseLabel,
} from '../../components/ExpenseDetailsBody';
import {COLORS} from '../../theme/theme';
import {ms, sp, vs} from '../../utils/responsive';

type Props = {
  technician: {id: number; name: string} | null;
  onClose: () => void;
};

const TechnicianExpenseDetails: React.FC<Props> = ({technician, onClose}) => {
  const [date, setDate] = useState(() => new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [details, setDetails] = useState<ExpenseDetailsResultData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (technician) {
      setDate(new Date());
    }
  }, [technician]);

  useEffect(() => {
    if (!technician) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [technician, onClose]);

  useEffect(() => {
    if (!technician) {
      return;
    }
    let active = true;
    setLoading(true);
    getExpenditureDetails({UserId: technician.id, ExpsDate: toExpenseApiDate(date)})
      .then(response => active && setDetails(response?.ResultData ?? null))
      .catch(() => active && setDetails(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [technician, date]);

  if (!technician) {
    return null;
  }

  // Java: DatePickerDialog, min = today - 2 months, max = today.
  const openDatePicker = () => setDatePickerOpen(true);

  return (
    <View style={styles.root}>
      <Pressable style={styles.dateRow} onPress={openDatePicker}>
        <Text style={styles.dateText}>{toExpenseLabel(date)}</Text>
        <Ionicons name="chevron-down" size={ms(20)} color={COLORS.white} />
      </Pressable>

      <View style={styles.sheet}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.techName} numberOfLines={1}>
            {details?.FullName || technician.name}
          </Text>
          <ExpenseDetailsBody details={details} loading={loading} showCurrency />
        </ScrollView>
      </View>

      <AppDateTimePicker
        visible={datePickerOpen}
        mode="date"
        value={date}
        minimumDate={minExpenseDate()}
        maximumDate={new Date()}
        onConfirm={selected => {
          setDate(selected);
          setDatePickerOpen(false);
        }}
        onCancel={() => setDatePickerOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: COLORS.primary},
  dateRow: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    gap: ms(4),
    paddingHorizontal: ms(20),
    height: ms(50),
  },
  dateText: {fontSize: sp(16), fontWeight: '700', color: COLORS.white},
  sheet: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    overflow: 'hidden',
  },
  scroll: {padding: ms(10), paddingBottom: ms(140)},
  techName: {
    textAlign: 'center',
    margin: ms(15),
    marginTop: vs(20),
    fontSize: sp(15),
    fontWeight: '700',
    color: COLORS.ink,
  },
});

export default TechnicianExpenseDetails;