// src/components/NotificationCard.tsx
// Java item_notification_new + fragment_notification: red backdrop with a white
// 30dp-corner sheet, 15dp cards with icon, coloured title, NEW pill, italic time,
// sub-title, AMC due/total row and optional red pill action buttons.
// Shared by the technician and admin Notification screens.

import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {COLORS} from '../theme/theme';
import {ms, sp, vs, useAppHeaderHeight} from '../utils/responsive';
import NotificationIcon, {type NotificationIconName} from './NotificationIcons';

export type NotificationSegment = {text: string; bold?: boolean};

export type NotificationCardAction = {label: string; onPress: () => void};

type CardProps = {
  icon?: NotificationIconName;
  /** For icons outside NotificationIconName (e.g. Java ic_add_tech). */
  iconNode?: React.ReactNode;
  title: string;
  color: string;
  isNew: boolean;
  when: string;
  subtitle: NotificationSegment[];
  amc?: {dueDate: string; service: string};
  actions?: NotificationCardAction[];
  onPress?: () => void;
};

export const NotificationCard = ({
  icon,
  iconNode,
  title,
  color,
  isNew,
  when,
  subtitle,
  amc,
  actions,
  onPress,
}: CardProps) => (
  <Pressable
    style={styles.card}
    android_ripple={{color: '#00000010'}}
    onPress={onPress}
    disabled={!onPress}>
    <View style={styles.cardBody}>
      <View style={styles.iconWrap}>
        {iconNode ?? (icon ? <NotificationIcon name={icon} /> : null)}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <Text style={[styles.title, {color}]} numberOfLines={1}>
              {title}
            </Text>
            {isNew ? <Text style={styles.newFlag}>NEW</Text> : null}
          </View>
          <Text style={styles.time}>{when}</Text>
        </View>

        {subtitle.length > 0 && (
          <Text style={styles.subtitle}>
            {subtitle.map((seg, i) => (
              <Text key={i} style={seg.bold ? styles.bold : undefined}>
                {seg.text}
              </Text>
            ))}
          </Text>
        )}

        {amc && (
          <View style={styles.amcRow}>
            <View style={styles.amcCell}>
              <Text style={[styles.amcText, styles.bold]}>Due Date :</Text>
              <Text style={[styles.amcText, styles.amcValue]} numberOfLines={1}>
                {amc.dueDate}
              </Text>
            </View>
            <View style={styles.amcCell}>
              <Text style={[styles.amcText, styles.bold]}>Total Service :</Text>
              <Text style={[styles.amcText, styles.amcValue]} numberOfLines={1}>
                {amc.service}
              </Text>
            </View>
          </View>
        )}

        {actions && actions.length > 0 && (
          <View style={styles.actionsRow}>
            {actions.map(action => (
              <Pressable key={action.label} style={styles.actionBtn} onPress={action.onPress}>
                <Text style={styles.actionText}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  </Pressable>
);

// fragment_notification.xml backdrop + white CardView with 30dp top corners.
// `underAppHeader`: the screen sits below the absolutely-positioned shared AppHeader.
export const NotificationSheet = ({
  children,
  underAppHeader = false,
}: {
  children: React.ReactNode;
  underAppHeader?: boolean;
}) => {
  const headerHeight = useAppHeaderHeight();
  return (
    <View style={[styles.root, underAppHeader ? {paddingTop: headerHeight} : null]}>
      <View style={styles.redBg} />
      <View style={styles.whiteSheet}>{children}</View>
    </View>
  );
};

export const notificationListStyles = StyleSheet.create({
  loader: {marginTop: vs(40)},
  list: {padding: ms(10), paddingBottom: ms(20), flexGrow: 1},
  empty: {textAlign: 'center', color: COLORS.lightGray, marginTop: vs(40), fontSize: sp(13)},
});

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: COLORS.primary},
  redBg: {height: vs(12), backgroundColor: COLORS.primary},
  whiteSheet: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    overflow: 'hidden',
  },
  // item_notification_new.xml: CardView radius 15dp, elevation 5dp, margin 5dp.
  card: {
    backgroundColor: COLORS.white,
    borderRadius: ms(15),
    margin: ms(5),
    marginBottom: ms(10),
    elevation: 5,
  },
  cardBody: {
    flexDirection: 'row',
    paddingLeft: ms(5),
    paddingRight: ms(5),
    paddingTop: ms(18),
    paddingBottom: ms(10),
  },
  iconWrap: {marginLeft: ms(8), marginTop: ms(5), marginRight: ms(8)},
  content: {flex: 1},
  titleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: ms(5)},
  titleLeft: {flexDirection: 'row', alignItems: 'center', flexShrink: 1},
  title: {fontSize: sp(16), fontWeight: 'bold', paddingLeft: ms(5), flexShrink: 1},
  newFlag: {
    fontSize: sp(9),
    fontWeight: 'bold',
    color: COLORS.white,
    backgroundColor: COLORS.primary,
    marginLeft: ms(10),
    paddingHorizontal: ms(10),
    paddingVertical: ms(2),
    borderRadius: ms(34),
    overflow: 'hidden',
  },
  time: {fontSize: sp(12), fontStyle: 'italic', color: COLORS.lightGray, marginRight: ms(5), marginLeft: ms(8)},
  subtitle: {fontSize: sp(12), color: COLORS.ink, paddingLeft: ms(5)},
  bold: {fontWeight: 'bold'},
  amcRow: {flexDirection: 'row', paddingLeft: ms(5), marginTop: ms(4)},
  amcCell: {flex: 1, flexDirection: 'row'},
  amcText: {fontSize: sp(12), color: COLORS.textBlack},
  amcValue: {marginLeft: ms(5), flexShrink: 1},
  actionsRow: {flexDirection: 'row', flexWrap: 'wrap', marginTop: ms(10), gap: ms(10), paddingLeft: ms(5)},
  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: ms(34),
    paddingHorizontal: ms(14),
    paddingVertical: ms(6),
    minWidth: ms(100),
    alignItems: 'center',
  },
  actionText: {color: COLORS.white, fontSize: sp(12), fontWeight: 'bold', textTransform: 'uppercase'},
});
