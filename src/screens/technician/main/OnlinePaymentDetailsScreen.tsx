// src/screens/technician/main/OnlinePaymentDetailsScreen.tsx
// Shown after "Make Payment" when Payment Mode = Online (matches Custom_Detail.png).
// Pay Now -> Razorpay Checkout -> log payment -> update task -> DocumentUpload.
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runRazorpayCheckout } from '../../../payments/razorpayCheckout';
import { postOnlinePaymentData } from '../../../api/paymentGateway/paymentGatewayService';
import { updateTaskWithEarnedAmount } from '../../../api/passbook/passbookService';
import { resetToTabsThen } from '../../../navigation/taskFlowNavigation';
import { showFailureMsg, showSuccessMsg } from '../../../utils/toast';
import { COLORS } from '../../../theme/theme';
import { sp, ms, vs } from '../../../utils/responsive';

type Params = {
  task: any;
  paymentBody: Record<string, any>; // same body PaymentReceivedScreen would send, PaymentTransactionType 'RazorPay'
  amount: number;                   // rupees, same value as NewWagePerHours (grandTotal)
  employeeName: string;
  customerName: string;
  customerContact: string;
};

// Content is capped at this width so the layout stays readable on tablets.
const MAX_CONTENT_WIDTH = 560;
// Limits how far the OS font-size setting can enlarge text, so rows don't overflow.
const MAX_FONT_SCALE = 1.4;

const OnlinePaymentDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const { params } = useRoute<any>() as { params: Params };
  const { task, paymentBody, amount, employeeName, customerName, customerContact } = params;

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);

  const [paying, setPaying] = useState(false);
  const payingRef = useRef(false);                  // blocks double taps
  const lastOrderRef = useRef<string | null>(null); // Java lastProcessedOrderId

  const rows: Array<[string, string]> = [
    ['Task Name', task.Name ?? ''],
    ['Task Id', String(task.NewTaskId ?? task.Id ?? '')],
    ['Employee Name', employeeName],
    ['Customer Name', customerName],
    ['Payment Mode', 'Online'],
  ];

  const handlePay = async () => {
    if (payingRef.current) return;
    payingRef.current = true;
    setPaying(true);
    try {
      const uid = await AsyncStorage.getItem('uid');
      const userId = Number(uid);

      const outcome = await runRazorpayCheckout({
        taskId: task.Id as number,
        userId,
        amountRupees: amount,
        description: task.Name ?? '',
        contact: customerContact,
        appName: 'Hansgrohee',
      });

      if (outcome.status === 'cancelled') return;

      if (outcome.status === 'failed') {
        await postOnlinePaymentData({
          TaskId: task.Id, UserId: userId, OrderId: outcome.orderId,
          Amount: amount, IsSuccess: false, Response: outcome.raw,
        });
        showFailureMsg(outcome.message);
        return;
      }

      // Java: ignore a second success for the same order
      if (lastOrderRef.current === outcome.result.orderId) return;
      lastOrderRef.current = outcome.result.orderId;

      // Java onPaymentSuccess: log the payment first, then update the task
      await postOnlinePaymentData({
        TaskId: task.Id, UserId: userId, Amount: amount,
        PaymentId: outcome.result.paymentId, OrderId: outcome.result.orderId,
        Signature: outcome.result.signature, Response: '', IsSuccess: true,
        UserContact: customerContact,
      });

      const res = await updateTaskWithEarnedAmount(paymentBody as any);
      if (res.Code !== '200') {
        showFailureMsg(res.Message || 'Could not update payment.');
        return;
      }

      showSuccessMsg('Payment recorded and the task has been closed.');
      // Same as PaymentReceivedScreen: Tasks tab with Document Upload on top
      resetToTabsThen(navigation, { name: 'DocumentUpload', params: { task } });
    } catch (err: any) {
      showFailureMsg(err?.message || 'Something went wrong.');
    } finally {
      payingRef.current = false;
      setPaying(false);
    }
  };

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + vs(12),
          paddingBottom: insets.bottom + vs(12),
          paddingLeft: insets.left + sp(16),
          paddingRight: insets.right + sp(16),
        },
      ]}
    >
      <Text style={styles.header} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        Hansgrohee
      </Text>

      <View style={[styles.content, { width: contentWidth }]}>
        {/* The card scrolls on very small screens or with large system font sizes. */}
        <ScrollView
          style={styles.cardScroll}
          contentContainerStyle={styles.card}
          showsVerticalScrollIndicator={false}
        >
          {rows.map(([label, value]) => (
            <View key={label} style={styles.row}>
              <Text style={styles.label} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {label}
              </Text>
              <Text
                style={styles.value}
                numberOfLines={2}
                ellipsizeMode="tail"
                maxFontSizeMultiplier={MAX_FONT_SCALE}
              >
                {value}
              </Text>
            </View>
          ))}

          <View style={[styles.row, styles.lastRow]}>
            <Text style={styles.label} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              Amount
            </Text>
            <Text style={styles.amount} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              ₹ {amount.toFixed(3)}
            </Text>
          </View>
        </ScrollView>

        {/* Buttons sit at the bottom of the screen, in the normal layout flow. */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.cancel]}
            onPress={() => navigation.goBack()}
            disabled={paying}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.buttonText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.pay, paying && styles.disabled]}
            onPress={handlePay}
            disabled={paying}
            accessibilityRole="button"
            accessibilityLabel="Pay now"
          >
            {paying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                ₹ Pay Now
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
  },
  header: {
    textAlign: 'center',
    fontSize: ms(18),
    color: '#1F2937',
    marginBottom: vs(12),
  },
  content: {
    flex: 1,
    width: '100%',
  },
  cardScroll: {
    flexShrink: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: sp(14),
    paddingVertical: vs(6),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    gap: sp(12),
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  label: {
    flex: 1,
    color: '#1F2937',
    fontSize: ms(14),
  },
  value: {
    flex: 1.4,
    color: '#6B7280',
    fontSize: ms(14),
    textAlign: 'right',
  },
  amount: {
    flex: 1.4,
    color: '#1F2937',
    fontSize: ms(16),
    fontWeight: '700',
    textAlign: 'right',
  },
  buttons: {
    flexDirection: 'row',
    gap: sp(12),
    marginTop: 'auto',
    paddingTop: vs(10),
    paddingHorizontal: sp(10),
  },
  button: {
    flex: 1,
    minHeight: vs(48),       // touch target of at least 48pt
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sp(8),
  },
  cancel: {
    backgroundColor: COLORS.primary ?? '#C40031',
  },
  pay: {
    backgroundColor: '#4CAF50',
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: ms(18),
    textAlign: 'center',
  },
});

export default OnlinePaymentDetailsScreen;