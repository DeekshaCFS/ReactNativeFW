// src/components/AddQuotePreview.tsx
//
// Java dialog_view_saveadd_quote.xml / dialog_view_saveadd_invoice.xml ("View & Save Quote/Invoice"):
// a white 20dp-radius card with a #353935 title bar, label/value rows, a dark table header with the
// service / item / extra lines, the totals block and Close / Save buttons. The invoice variant adds
// the Amount Received box (beside Grand Total) and the Payment Transaction Type spinner.
import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Modal from './AppModal';
import {FieldErrorDot, FieldErrorTip} from './BottomSheetDialog';
import {COLORS} from '../theme/theme';
import {ms, sp} from '../utils/responsive';

export type PreviewLine = {name: string; qty: number | string; unit: number; total: number};

export type QuotePreviewData = {
  customerName: string;
  mobile: string;
  address: string;
  landmark: string;
  flat: string;
  createdDate: string;
  validityDate: string;
  lines: PreviewLine[];
  subTotal: string;
  discount: string;
  amountAfterDiscount: string;
  taxName: string;
  tax: string;
  grandTotal: string;
  terms: string;
};

type Props = {
  visible: boolean;
  isInvoice: boolean;
  data: QuotePreviewData;
  saving?: boolean;
  onClose: () => void;
  onSave: () => void;
  receivedAmount?: string;
  onReceivedChange?: (value: string) => void;
  receivedError?: string;
  paymentTypeLabel?: string;
  onPickPaymentType?: () => void;
};

const DARK = '#1d2536'; // @color/background_gray
const LIGHT = '#9a9faa'; // @color/light_gray
const BAR = '#353935';

const money = (n: number) => `₹ ${(Number.isFinite(n) ? n : 0).toFixed(3)}`;

const Row = ({label, value, clip = false, first = false}: {label: string; value: string; clip?: boolean; first?: boolean}) => (
  <View style={[styles.row, !first && {marginTop: ms(3)}]}>
    <Text style={styles.label}>{label}</Text>
    {clip ? (
      <View style={styles.clipBox}>
        <Text style={styles.value}>{value}</Text>
      </View>
    ) : (
      <Text style={[styles.value, {flex: 0.6}]} numberOfLines={1}>
        {value}
      </Text>
    )}
  </View>
);

const SumRow = ({
  label,
  value,
  top = 0,
  bottom = 0,
  small = false,
  bold = false,
}: {
  label: string;
  value: string;
  top?: number;
  bottom?: number;
  small?: boolean;
  bold?: boolean;
}) => (
  <View style={[styles.sumRow, {marginTop: ms(top), marginBottom: ms(bottom)}]}>
    <Text style={[styles.label, small && {fontSize: sp(14)}]}>{label}</Text>
    <Text style={[styles.sumValue, bold && {fontWeight: '700'}]}>{value}</Text>
  </View>
);

export default function AddQuotePreview({
  visible,
  isInvoice,
  data,
  saving = false,
  onClose,
  onSave,
  receivedAmount = '',
  onReceivedChange,
  receivedError = '',
  paymentTypeLabel = '',
  onPickPaymentType,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.titleBar}>
            <Text style={styles.title}>{isInvoice ? 'View & Save Invoice ' : 'View & Save Quote '}</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.close}>
              <Ionicons name="close" size={ms(30)} color="#fff" />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingHorizontal: ms(5)}}>
            <View style={{marginTop: ms(12), marginBottom: ms(50), marginHorizontal: ms(5)}}>
              <Row first label="Customer Name" value={data.customerName} />
              <Row label="Customer Mobile" value={data.mobile} />
              <Row clip label="Customer Address" value={data.address} />
              <Row clip label="Landmark" value={data.landmark} />
              <Row clip label="Flat/House No." value={data.flat} />
              <Row label={isInvoice ? 'Invoice Date' : 'Quotation Date'} value={data.createdDate} />
              <Row label="Valid till" value={data.validityDate} />

              <View style={styles.tableHead}>
                <Text style={styles.headCell}>Service/Item Description</Text>
                <Text style={styles.headCell}>Qty</Text>
                <Text style={styles.headCell}>Unit Price</Text>
                <Text style={styles.headCell}>Total</Text>
              </View>
              {data.lines.map((line, index) => (
                <View key={`${line.name}-${index}`} style={styles.line}>
                  <Text style={styles.cell}>{line.name}</Text>
                  <Text style={styles.cell}>{line.qty}</Text>
                  <Text style={styles.cell}>{money(line.unit)}</Text>
                  <Text style={styles.cell}>{money(line.total)}</Text>
                </View>
              ))}

              <View style={styles.inset}>
                <SumRow top={10} label="Sub Total" value={data.subTotal} />
                <SumRow top={3} label="Discount" value={data.discount} />
                <SumRow top={10} label="Amt. After Discount" value={data.amountAfterDiscount} />
                <SumRow top={5} bottom={12} small label={data.taxName} value={data.tax} />
                {isInvoice ? (
                  <View style={[styles.sumRow, {marginTop: ms(15), marginBottom: ms(12), alignItems: 'center'}]}>
                    <Text style={[styles.label, {flex: 0.3, fontSize: sp(14)}]}>Grand Total</Text>
                    <Text style={[styles.sumValue, {flex: 0.3, textAlign: 'left', fontWeight: '700'}]}>
                      {data.grandTotal}
                    </Text>
                    <View style={{flex: 0.4}}>
                      <TextInput
                        style={[styles.receivedInput, !!receivedError && {borderColor: COLORS.primary}]}
                        value={receivedAmount}
                        onChangeText={onReceivedChange}
                        placeholder="Amount Received *"
                        placeholderTextColor={COLORS.lightGray}
                        keyboardType="decimal-pad"
                        maxLength={10}
                      />
                      {!!receivedAmount && (
                        <Text style={styles.floatLabel}>Amount Received *</Text>
                      )}
                      {!!receivedError && <FieldErrorDot />}
                      {!!receivedError && <FieldErrorTip message={receivedError} bottom={ms(44)} />}
                    </View>
                  </View>
                ) : (
                  <SumRow top={10} bottom={12} small bold label="Grand Total" value={data.grandTotal} />
                )}
                {isInvoice ? (
                  <Pressable style={styles.spinner} onPress={onPickPaymentType}>
                    <Text style={[styles.spinnerText, !paymentTypeLabel && {color: COLORS.lightGray}]} numberOfLines={1}>
                      {paymentTypeLabel || 'Payment Transaction Type'}
                    </Text>
                    <Ionicons name="chevron-down" size={ms(18)} color={DARK} />
                  </Pressable>
                ) : null}
                <SumRow top={10} bottom={12} small label="Terms & Conditions" value={data.terms || '-NA-'} />
              </View>
            </View>

            <View style={styles.buttons}>
              <TouchableOpacity style={[styles.button, {backgroundColor: COLORS.lightGray}]} onPress={onClose}>
                <Text style={styles.buttonText}>CLOSE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, {backgroundColor: BAR}]} onPress={onSave} disabled={saving}>
                <Text style={styles.buttonText}>{saving ? 'SAVING...' : 'SAVE'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-start'},
  card: {
    flex: 1,
    marginHorizontal: ms(5),
    marginTop: ms(50),
    marginBottom: ms(10),
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: '#BDBDBD',
    overflow: 'hidden',
  },
  titleBar: {
    height: ms(50),
    backgroundColor: BAR,
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {color: '#fff', fontWeight: '700', fontSize: sp(14), marginLeft: ms(20)},
  close: {width: ms(60), alignItems: 'center'},
  row: {flexDirection: 'row'},
  label: {flex: 0.4, fontSize: sp(15), color: DARK},
  value: {fontSize: sp(15), color: LIGHT},
  clipBox: {flex: 0.57, height: sp(15) * 1.25, overflow: 'hidden'},
  tableHead: {flexDirection: 'row', backgroundColor: BAR, marginTop: ms(5), alignItems: 'center'},
  headCell: {flex: 1, textAlign: 'center', color: '#fff', fontWeight: '700', fontSize: sp(14)},
  line: {flexDirection: 'row', alignItems: 'center', margin: ms(10)},
  cell: {flex: 1, textAlign: 'center', fontSize: sp(13), color: DARK},
  inset: {marginLeft: ms(20), marginRight: ms(38)},
  sumRow: {flexDirection: 'row'},
  sumValue: {flex: 0.6, textAlign: 'right', fontSize: sp(15), color: LIGHT},
  receivedInput: {
    height: ms(41),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: ms(34),
    paddingHorizontal: ms(10),
    textAlign: 'right',
    fontSize: sp(16),
    color: DARK,
    padding: 0,
  },
  floatLabel: {
    position: 'absolute',
    top: -ms(8),
    left: ms(14),
    paddingHorizontal: ms(4),
    backgroundColor: '#fff',
    fontSize: sp(12),
    color: COLORS.lightGray,
  },
  spinner: {
    height: ms(40),
    marginTop: ms(10),
    marginBottom: ms(16),
    marginLeft: ms(-0),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: ms(34),
    paddingHorizontal: ms(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spinnerText: {flex: 1, fontSize: sp(14), color: DARK},
  buttons: {flexDirection: 'row', justifyContent: 'center', alignSelf: 'center'},
  button: {
    height: ms(30),
    minWidth: ms(64),
    paddingHorizontal: ms(16),
    margin: ms(20),
    borderRadius: ms(34),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {color: '#fff', fontSize: sp(16), fontWeight: '500'},
});
