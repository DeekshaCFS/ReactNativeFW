// src/components/PassbookSummary.tsx
// Java home_passbook_fragment_new body: Today/Monthly/Yearly buttons, the
// earnings header with carets, and the pink gradient summary sheet. Shared by
// the technician Passbook tab and the admin Passbook section.

import React from 'react';
import {ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS} from '../theme/theme';
import {ms, scale, sp, vs} from '../utils/responsive';
import {formatAmount} from '../utils/decimal';

export type PassbookPeriod = 'today' | 'monthly' | 'yearly';

export type PassbookFields = {
  estimated: number;
  credit: number;
  expenses: number;
  received: number;
  remaining: number;
  earnings: number;
};

type Props = {
  period: PassbookPeriod;
  onSelectPeriod: (period: PassbookPeriod) => void;
  title: string;
  fields: PassbookFields;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  /** Distance from the top (header + tabs) when the summary draws under an absolute header. */
  topPadding?: number;
};

// Java: "₹ " + String.format("%.3f", value)
const money = (v: number) => `₹ ${formatAmount(v)}`;

const PassbookSummary = ({
  period,
  onSelectPeriod,
  title,
  fields,
  loading = false,
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
}: Props) => (
  <ScrollView
    showsVerticalScrollIndicator={false}
    bounces={false}
    contentContainerStyle={{flexGrow: 1}}>
    {/* Period selector */}
    <View style={styles.periodRow}>
      {(['today', 'monthly', 'yearly'] as PassbookPeriod[]).map(p => (
        <Pressable
          key={p}
          style={[styles.periodBtn, period === p && styles.activePeriod]}
          onPress={() => onSelectPeriod(p)}>
          <Text style={[styles.periodText, period === p && styles.activePeriodText]}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>

    {/* Java curve_card: #f2f2f2 backdrop, white sheet with 50dp top corners */}
    <View style={styles.cardBackdrop}>
      <View style={styles.whiteCard}>
        <Text style={styles.earningTitle}>{title}</Text>

        <View style={styles.earnRow}>
          <Pressable style={styles.caretCell} onPress={onPrev} disabled={prevDisabled}>
            <Image
              source={require('../../assets/images/left_sort.png')}
              style={[styles.caretImg, prevDisabled && {opacity: 0.3}]}
            />
          </Pressable>
          <View style={styles.earnCell}>
            {loading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text style={styles.earningAmount}>{money(fields.earnings)}</Text>
            )}
          </View>
          <Pressable style={styles.caretCell} onPress={onNext} disabled={nextDisabled}>
            <Image
              source={require('../../assets/images/right_sort.png')}
              style={[styles.caretImg, nextDisabled && {opacity: 0.3}]}
            />
          </Pressable>
        </View>

        {/* Java passbook_gradient: #fcb6be -> white, 50dp top corners, runs to the bottom */}
        <LinearGradient
          colors={[COLORS.passbookPink, COLORS.white]}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={styles.gradientSheet}>
          {/* Java: RoundCornerProgressBar is static (rcProgress 8 of 10, never bound to data). */}
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>

          <View style={styles.estRow}>
            <Text style={styles.estLabel}>Estimated Earnings</Text>
            <Text style={styles.estValue}>{money(fields.estimated)}</Text>
            <Text style={styles.percentText}>80%</Text>
          </View>

          <View style={styles.rowsBlock}>
            <View style={styles.rowBetween}>
              <Text style={styles.creditText}>Credit Given</Text>
              <Text style={styles.creditText}>{money(fields.credit)}</Text>
            </View>

            {[
              {label: 'Expenses', value: fields.expenses},
              {label: 'Received', value: fields.received},
              {label: 'Remaining Amount', value: fields.remaining},
            ].map(({label, value}) => (
              <View key={label}>
                <View style={styles.divider} />
                <View style={styles.rowBetween}>
                  <Text style={styles.rowText}>{label}</Text>
                  <Text style={styles.rowValue}>{money(value)}</Text>
                </View>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  // Java: 3 equal 35dp buttons, 5dp margins, 8dp radius, 0.7dp #E3E3E3 stroke, 18sp bold.
  periodRow: {
    flexDirection: 'row',
    marginTop: vs(10),
    marginBottom: vs(20),
    backgroundColor: COLORS.white,
  },
  periodBtn: {
    flex: 1,
    height: vs(35),
    margin: scale(5),
    borderRadius: scale(8),
    borderWidth: 0.7,
    borderColor: COLORS.passbookBorder,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePeriod: {backgroundColor: COLORS.primary},
  periodText: {color: COLORS.textBlack, fontWeight: '700', fontSize: sp(18)},
  activePeriodText: {color: COLORS.white},

  cardBackdrop: {flex: 1, backgroundColor: COLORS.passbookBackdrop},
  whiteCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: scale(50),
    borderTopRightRadius: scale(50),
    overflow: 'hidden',
  },
  earningTitle: {marginTop: vs(8), fontSize: sp(22), textAlign: 'center', color: COLORS.textBlack},
  // Java: three equal cells, top-aligned; a long amount wraps onto a second line while the
  // pink sheet stays at a fixed offset from the top of the white card.
  earnRow: {flexDirection: 'row', alignItems: 'flex-start', marginTop: -vs(2), minHeight: vs(32)},
  caretCell: {flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: vs(4)},
  caretImg: {width: scale(16), height: scale(16), resizeMode: 'contain'},
  earnCell: {flex: 1, alignItems: 'center', justifyContent: 'flex-start'},
  earningAmount: {fontSize: sp(25), fontWeight: '700', textAlign: 'center', color: COLORS.textBlack},

  gradientSheet: {
    position: 'absolute',
    top: vs(102),
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: scale(50),
    borderTopRightRadius: scale(50),
    paddingTop: vs(20),
  },
  progressBarBg: {
    height: vs(5),
    backgroundColor: COLORS.lighterGray,
    borderRadius: 34,
    marginHorizontal: scale(30),
    marginBottom: vs(20),
  },
  progressBarFill: {width: '80%', height: vs(5), backgroundColor: COLORS.primary, borderRadius: 34},

  estRow: {flexDirection: 'row', alignItems: 'center', marginHorizontal: scale(30)},
  estLabel: {fontSize: sp(14), color: COLORS.textBlack},
  estValue: {marginLeft: scale(5), fontSize: sp(18), fontWeight: '700', color: COLORS.textBlack},
  percentText: {
    flex: 1,
    textAlign: 'right',
    paddingRight: scale(10),
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: sp(14),
  },

  rowsBlock: {marginTop: vs(20), marginHorizontal: scale(30)},
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: scale(10),
  },
  divider: {height: 1, backgroundColor: COLORS.lighterGray},
  creditText: {fontSize: sp(20), fontWeight: '700', color: COLORS.textBlack},
  rowText: {fontSize: sp(16), color: COLORS.textBlack},
  rowValue: {fontSize: sp(16), fontWeight: '700', color: COLORS.textBlack},
});

export default PassbookSummary;
