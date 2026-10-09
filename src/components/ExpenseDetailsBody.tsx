// src/components/ExpenseDetailsBody.tsx
// Java expense_details_* body: summary card (credited / opening / earned / expense / return,
// divider, remaining), the "Expense List" title (optionally with a + action) and the
// expense_list_new rows with a tap-to-enlarge photo. Shared by the technician Expenditure
// screen and the admin technician-expense details.

import React, {useState} from 'react';
import {ActivityIndicator, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Modal from './AppModal';
import {COLORS} from '../theme/theme';
import {ms, scale, sp, vs} from '../utils/responsive';
import {formatAmount} from '../utils/decimal';
import type {
  ExpenseDetailsExpenseList,
  ExpenseDetailsResultData,
} from '../api/expenditure/expenditure.types';

export const EXPENSE_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Java: mDate = year + "-" + (month + 1) + "-" + day (no zero padding).
export const toExpenseApiDate = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
export const toExpenseLabel = (d: Date) => `${d.getDate()} ${EXPENSE_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
// Java DatePickerDialog bounds: today minus two months through today.
export const minExpenseDate = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 2);
  return d;
};

type Props = {
  details: ExpenseDetailsResultData | null;
  loading: boolean;
  /** Shows the + next to "Expense List" (technician only). */
  onAdd?: () => void;
  /** Admin view prefixes amounts with ₹ (Java ExpenseDetailsFragment); technician view doesn't. */
  showCurrency?: boolean;
};

const ExpenseDetailsBody = ({details, loading, onAdd, showCurrency = false}: Props) => {
  const money = (v?: number) => (showCurrency ? '₹ ' : '') + formatAmount(v);
  const [fullScreenPhoto, setFullScreenPhoto] = useState<string | null>(null);

  const rows = [
    {label: 'Credited Amount :', value: details?.CreditedAmonut},
    {label: 'Opening Amount :', value: details?.OpeningBalance},
    {label: 'Earned Amount :', value: details?.EarnedAmount},
    {label: 'Total Expense :', value: details?.Expenses},
    {label: 'Return :', value: details?.ReturnAmount},
  ];
  const expenses: ExpenseDetailsExpenseList[] = Array.isArray(details?.ExpenseList)
    ? (details?.ExpenseList as ExpenseDetailsExpenseList[])
    : [];

  if (loading) {
    return <ActivityIndicator style={{marginTop: ms(20)}} color={COLORS.primary} />;
  }

  return (
    <>
      <View style={styles.detailsCard}>
        <View style={styles.detailsBody}>
          {rows.map(({label, value}, i) => (
            <View key={label} style={[styles.rowBetween, i > 0 && {marginTop: vs(10)}]}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{money(value)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.divider} />
        <View style={styles.remainingRow}>
          <Text style={styles.value}>Remaining Amount :</Text>
          <Text style={styles.value}>{money(details?.RemainingBalance)}</Text>
        </View>
      </View>

      <View style={styles.lowerRow}>
        <Text style={styles.lowerTitle}>Expense List</Text>
        {onAdd ? (
          <Pressable onPress={onAdd} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="add" size={scale(30)} color={COLORS.primary} />
          </Pressable>
        ) : null}
      </View>

      {expenses.length === 0 ? (
        <View style={styles.naCard}>
          <Text style={styles.naText}>NA</Text>
        </View>
      ) : (
        expenses.map((item, index) => (
          <View key={index} style={styles.expenseCard}>
            <View style={{flex: 1}}>
              <Text style={styles.expenseName} numberOfLines={1}>
                {item.ExpenseName}
              </Text>
              <Text style={styles.expenseAmount} numberOfLines={1}>
                {money(item.Amount)}
              </Text>
            </View>
            <Pressable
              disabled={!item.ExpensePhoto}
              onPress={() => setFullScreenPhoto(item.ExpensePhoto ?? null)}
              style={styles.expensePhotoBox}>
              {item.ExpensePhoto ? (
                <Image source={{uri: item.ExpensePhoto}} style={styles.expensePhoto} />
              ) : (
                <Ionicons name="image-outline" size={scale(22)} color={COLORS.ink} />
              )}
            </Pressable>
          </View>
        ))
      )}

      <Modal
        visible={!!fullScreenPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setFullScreenPhoto(null)}>
        <Pressable style={styles.fullScreenBackdrop} onPress={() => setFullScreenPhoto(null)}>
          <Pressable style={styles.fullScreenClose} onPress={() => setFullScreenPhoto(null)} hitSlop={10}>
            <Ionicons name="close" size={sp(28)} color="#fff" />
          </Pressable>
          {fullScreenPhoto ? (
            <Image source={{uri: fullScreenPhoto}} style={styles.fullScreenImage} resizeMode="contain" />
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  detailsCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: scale(10),
    marginTop: vs(10),
    borderRadius: scale(12),
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 1},
  },
  detailsBody: {padding: scale(15)},
  rowBetween: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  label: {fontSize: sp(14), color: COLORS.ink},
  value: {fontSize: sp(14), fontWeight: '700', color: COLORS.ink},
  divider: {height: 1, marginTop: vs(10), backgroundColor: COLORS.lightGray},
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: scale(15),
    marginTop: vs(10),
    marginBottom: vs(20),
  },
  lowerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: scale(10),
    marginTop: vs(20),
  },
  lowerTitle: {color: COLORS.primary, fontSize: sp(16)},
  naCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: scale(10),
    marginTop: vs(10),
    borderRadius: scale(8),
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
  },
  naText: {margin: scale(10), fontSize: sp(14), color: COLORS.ink},
  // Java expense_list_new
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: scale(15),
    marginVertical: scale(10),
    padding: scale(20),
    borderRadius: scale(12),
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
  },
  expenseName: {fontSize: sp(16), fontWeight: '700', color: COLORS.ink},
  expenseAmount: {fontSize: sp(12), color: COLORS.textBlack, marginTop: vs(5)},
  expensePhotoBox: {
    width: scale(40),
    height: scale(40),
    padding: 1,
    borderRadius: scale(8),
    borderWidth: 0.7,
    borderColor: COLORS.passbookBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  expensePhoto: {width: '100%', height: '100%', borderRadius: scale(7)},
  fullScreenBackdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center'},
  fullScreenClose: {position: 'absolute', top: ms(40), right: ms(20), zIndex: 1},
  fullScreenImage: {width: '100%', height: '80%'},
});

export default ExpenseDetailsBody;
