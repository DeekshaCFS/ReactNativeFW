// src/screens/admin/TechnicianExpenseDetailsModal.tsx
//
// Port of Java's ExpenseDetailsFragment (layout expense_details_old), opened
// from the owner's Expenditure technician list (ExpenseTechnicianListFragment
// row tap). Loads Expenditure/GetTechnicianExpenditure?UserId=&ExpsDate=
// for one day (Java's date strip; here prev/next day arrows) and shows the
// summary rows + "Expense List" in XML order. The add-expense icon is
// technician-only in Java, so the owner view is read-only.
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {getExpenditureDetails} from '../../api/expenditure/expenditureService';
import type {
  ExpenseDetailsExpenseList,
  ExpenseDetailsResultData,
} from '../../api/expenditure/expenditure.types';
import {formatAmount} from '../../utils/decimal';
import {ms, sp, vs} from '../../utils/responsive';

type Props = {
  technician: {id: number; name: string} | null;
  onClose: () => void;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Java: mDate = year + "-" + (month + 1) + "-" + day (no zero padding).
const toApiDate = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const toLabel = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

const TechnicianExpenseDetailsModal: React.FC<Props> = ({technician, onClose}) => {
  const [date, setDate] = useState(() => new Date());
  const [details, setDetails] = useState<ExpenseDetailsResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullScreenPhoto, setFullScreenPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (technician) {
      setDate(new Date());
    }
  }, [technician]);

  useEffect(() => {
    if (!technician) {
      return;
    }
    let active = true;
    setLoading(true);
    getExpenditureDetails({UserId: technician.id, ExpsDate: toApiDate(date)})
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

  const shiftDay = (delta: number) =>
    setDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + delta));
  const money = (v?: number) => (details ? `Rs. ${formatAmount(v)}` : '0');
  const rows: [string, string][] = [
    ['Credited Amount :', money(details?.CreditedAmonut)],
    ['Opening Amount :', money(details?.OpeningBalance)],
    ['Earned Amount :', money(details?.EarnedAmount)],
    ['Total Expense :', money(details?.Expenses)],
    ['Return :', money(details?.ReturnAmount)],
    ['Remaining Amount :', money(details?.RemainingBalance)],
  ];
  const expenses: ExpenseDetailsExpenseList[] = Array.isArray(details?.ExpenseList)
    ? (details?.ExpenseList as ExpenseDetailsExpenseList[])
    : [];

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="arrow-back" size={sp(22)} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {details?.FullName || technician.name}
          </Text>
        </View>
        <View style={styles.dateRow}>
          <Pressable onPress={() => shiftDay(-1)} hitSlop={10}>
            <Ionicons name="chevron-back" size={sp(20)} color="#c3002f" />
          </Pressable>
          <Text style={styles.dateText}>{toLabel(date)}</Text>
          <Pressable onPress={() => shiftDay(1)} hitSlop={10}>
            <Ionicons name="chevron-forward" size={sp(20)} color="#c3002f" />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} color="#c3002f" size="large" />
        ) : (
          <FlatList
            data={expenses}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.content}
            ListHeaderComponent={
              <View>
                <View style={styles.summary}>
                  {rows.map(([label, value]) => (
                    <View key={label} style={styles.row}>
                      <Text style={styles.label}>{label}</Text>
                      <Text style={styles.value}>{value}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.listTitle}>Expense List</Text>
              </View>
            }
            renderItem={({item}) => (
              <View style={styles.expenseRow}>
                {item.ExpensePhoto ? (
                  <Pressable onPress={() => setFullScreenPhoto(item.ExpensePhoto ?? null)}>
                    <Image source={{uri: item.ExpensePhoto}} style={styles.expensePhoto} />
                  </Pressable>
                ) : (
                  <View style={[styles.expensePhoto, styles.photoPlaceholder]}>
                    <Ionicons name="image-outline" size={sp(20)} color="#9aa0a6" />
                  </View>
                )}
                <Text style={styles.expenseName} numberOfLines={1}>
                  {item.ExpenseName}
                </Text>
                <Text style={styles.expenseAmount}>Rs. {formatAmount(item.Amount)}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>NA</Text>}
          />
        )}
      </View>

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
            <Image
              source={{uri: fullScreenPhoto}}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          ) : null}
        </Pressable>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f5f6f8'},
  header: {flexDirection: 'row', alignItems: 'center', gap: ms(12), backgroundColor: '#c3002f', padding: ms(14)},
  headerTitle: {flex: 1, color: '#fff', fontSize: sp(16), fontWeight: '700'},
  dateRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ms(12), backgroundColor: '#fff'},
  dateText: {fontSize: sp(14), fontWeight: '700', color: '#20283A'},
  loader: {marginTop: vs(40)},
  content: {padding: ms(12)},
  summary: {backgroundColor: '#fff', borderRadius: ms(10), padding: ms(12)},
  row: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: vs(5)},
  label: {fontSize: sp(13), color: '#5f6368'},
  value: {fontSize: sp(13), color: '#20283A', fontWeight: '700'},
  listTitle: {fontSize: sp(14), fontWeight: '700', color: '#20283A', marginTop: vs(16), marginBottom: vs(8)},
  expenseRow: {flexDirection: 'row', alignItems: 'center', gap: ms(10), backgroundColor: '#fff', borderRadius: ms(10), padding: ms(10), marginBottom: vs(8)},
  expensePhoto: {width: ms(44), height: ms(44), borderRadius: ms(8)},
  photoPlaceholder: {backgroundColor: '#f1f3f4', alignItems: 'center', justifyContent: 'center'},
  expenseName: {flex: 1, fontSize: sp(13), color: '#20283A'},
  expenseAmount: {fontSize: sp(13), fontWeight: '700', color: '#20283A'},
  empty: {textAlign: 'center', color: '#80868b', marginTop: vs(20)},
  fullScreenBackdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center'},
  fullScreenClose: {position: 'absolute', top: vs(40), right: ms(20), zIndex: 1},
  fullScreenImage: {width: '100%', height: '80%'},
});

export default TechnicianExpenseDetailsModal;
