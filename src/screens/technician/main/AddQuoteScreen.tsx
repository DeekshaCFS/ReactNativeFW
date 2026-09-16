// src/screens/technician/main/AddQuoteScreen.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { COLORS } from '../../../theme/theme';
import { scale, vs, sp, HEADER_TOP_PADDING } from '../../../utils/responsive';

export default function AddQuoteScreen() {

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: vs(140) }}
      >
        <View style={styles.tabRow}>
          <Pressable style={styles.activeTab}>
            <Text style={styles.activeTabText}>EXPENDITURE</Text>
          </Pressable>
          <Pressable style={styles.inactiveTab}>
            <Text style={styles.inactiveTabText}>PASSBOOK</Text>
          </Pressable>
        </View>

        <View style={styles.whiteSheet}>
          <View style={styles.rowBetween}>
            <Text style={styles.mutedText}>
              Estimated Earnings <Text style={styles.bold}>Rs. 0</Text>
            </Text>
            <Text style={styles.percentText}>80%</Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={[styles.bold, { fontSize: sp(22) }]}>Credit Given</Text>
            <Text style={[styles.bold, { fontSize: sp(22) }]}>Rs. 0</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <Text style={styles.rowText}>Expenses</Text>
            <Text style={styles.bold}>Rs. 0</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <Text style={styles.rowText}>Received</Text>
            <Text style={styles.bold}>Rs. 0</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <Text style={styles.rowText}>Remaining Amount</Text>
            <Text style={styles.bold}>Rs. 0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: scale(28),
    borderTopRightRadius: scale(28),
    paddingTop: vs(16),
    marginTop: vs(18),
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(12),
    height: vs(100),
    paddingTop: HEADER_TOP_PADDING,
  },
  activeTab: {
    borderBottomWidth: scale(3),
    borderColor: COLORS.primary,
    backgroundColor: '#f5d7d784',
    paddingVertical: vs(5),
    height: vs(40),
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabText: {
    fontSize: sp(16),
    fontWeight: '600',
    color: COLORS.primary,
  },
  inactiveTab: {
    paddingVertical: vs(5),
    height: vs(40),
    alignItems: 'center',
    justifyContent: 'center',
    width: '50%',
  },
  inactiveTabText: {
    fontSize: sp(16),
    fontWeight: '400',
    color: COLORS.textQuaternary,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: vs(10),
    paddingHorizontal: scale(18),
  },
  divider: {
    height: 1,
    width: '95%',
    backgroundColor: '#f8eeee',
    marginVertical: vs(6),
    alignSelf: 'center',
  },
  bold: {
    fontWeight: '600',
    fontSize: sp(17),
  },
  mutedText: {
    color: '#374151',
    fontSize: sp(14),
  },
  percentText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: sp(14),
  },
  rowText: {
    fontSize: sp(15),
    color: COLORS.textPrimary,
  },
});