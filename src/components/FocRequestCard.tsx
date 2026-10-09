// src/components/FocRequestCard.tsx
// Java foc_list row + the Status Tag / Issue / Refresh List filter row.
// Shared by the technician Requested Items screen and the admin Item
// Inventory > Requested Items tab, so both look like the Java app.

import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {COLORS} from '../theme/theme';
import {ms, sp} from '../utils/responsive';
import {DeleteAccIcon} from './JavaIcons';

// dd-mm-yyyy from an ISO date, '' when unparsable.
export const formatFocDate = (iso?: string | null): string => {
  const d = new Date(String(iso ?? ''));
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
};

// Java drawables: ic_reset, ic_down_arrow_red
export const ResetIcon = ({size}: {size: number}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#C3002F"
      d="M12,4L12,1L8,5l4,4L12,6c3.31,0 6,2.69 6,6 0,1.01 -0.25,1.97 -0.7,2.8l1.46,1.46C19.54,15.03 20,13.57 20,12c0,-4.42 -3.58,-8 -8,-8zM12,18c-3.31,0 -6,-2.69 -6,-6 0,-1.01 0.25,-1.97 0.7,-2.8L5.24,7.74C4.46,8.97 4,10.43 4,12c0,4.42 3.58,8 8,8v3l4,-4 -4,-4v3z"
    />
  </Svg>
);

export const DownArrow = ({size}: {size: number}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill="#c3002f" d="M7.41,8.59L12,13.17l4.59,-4.58L18,10l-6,6 -6,-6 1.41,-1.41z" />
  </Svg>
);

type CardProps = {
  status: string;
  requestId: string | number;
  isIssue: boolean;
  date: string;
  /** Linked task code; empty means a direct request. */
  taskCode?: string | null;
  notes: string;
  onPress: () => void;
  onDelete: () => void;
  deleting?: boolean;
};

export const FocRequestCard = ({
  status,
  requestId,
  isIssue,
  date,
  taskCode,
  notes,
  onPress,
  onDelete,
  deleting = false,
}: CardProps) => (
  <Pressable style={styles.card} onPress={onPress}>
    <View style={styles.headerRow}>
      <Text style={styles.statusBadge} numberOfLines={1}>
        {(status || 'NA').toUpperCase()}
      </Text>
      <Text style={styles.reqText}>#REQ {requestId}</Text>
      <Text style={styles.issueLabel}>Issue: </Text>
      <Text style={styles.issueValue}>{isIssue ? 'Yes' : 'No'}</Text>
      <Text style={styles.dateLabel}>Date</Text>
      <Text style={styles.dateValue}>{date}</Text>
      <View style={styles.flexGrow} />
    </View>

    {taskCode ? (
      <Text style={[styles.taskIdText, {color: COLORS.primary}]}>{taskCode}</Text>
    ) : (
      <Text style={[styles.taskIdText, {color: '#000'}]}>DIRECT</Text>
    )}

    <View style={styles.notesWrap}>
      <View style={styles.notesRow}>
        <Text style={styles.notesLabel} numberOfLines={1}>
          Notes
        </Text>
        <Text style={styles.notesText} numberOfLines={4}>
          {notes}
        </Text>
        <Pressable
          style={styles.deleteIcon}
          disabled={deleting}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          onPress={onDelete}>
          {deleting ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <DeleteAccIcon size={ms(20)} color={COLORS.primary} />
          )}
        </Pressable>
      </View>
    </View>
  </Pressable>
);

type FilterProps = {
  statusLabel: string;
  issueLabel: string;
  onStatusPress: () => void;
  onIssuePress: () => void;
  onRefreshPress: () => void;
  refreshing?: boolean;
};

export const FocFilterRow = ({
  statusLabel,
  issueLabel,
  onStatusPress,
  onIssuePress,
  onRefreshPress,
  refreshing = false,
}: FilterProps) => (
  <View style={styles.filterRow}>
    <Pressable style={[styles.filterItem, {flexGrow: 1.5, flexBasis: ms(40)}]} onPress={onStatusPress}>
      <Text style={styles.filterText} numberOfLines={1}>
        {statusLabel}
      </Text>
      <DownArrow size={ms(24)} />
    </Pressable>
    <Pressable style={[styles.filterItem, {flexGrow: 1, flexBasis: ms(40)}]} onPress={onIssuePress}>
      <Text style={styles.filterText} numberOfLines={1}>
        {issueLabel}
      </Text>
      <DownArrow size={ms(24)} />
    </Pressable>
    <Pressable
      style={styles.refreshItem}
      onPress={onRefreshPress}
      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
      <Text style={styles.refreshText}>Refresh List</Text>
      {refreshing ? (
        <ActivityIndicator
          size="small"
          color={COLORS.primary}
          style={{width: ms(24), height: ms(24), marginLeft: ms(5)}}
        />
      ) : (
        <View style={{marginLeft: ms(5)}}>
          <ResetIcon size={ms(24)} />
        </View>
      )}
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  flexGrow: {flexGrow: 1},
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ms(30),
    marginTop: ms(10),
    marginBottom: ms(10),
    paddingHorizontal: ms(10),
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    marginLeft: ms(10),
    height: ms(24),
    backgroundColor: '#fff',
  },
  filterText: {
    fontSize: sp(14),
    color: '#000',
    flexShrink: 1,
  },
  refreshItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexGrow: 0.5,
    marginRight: ms(5),
  },
  refreshText: {
    fontSize: sp(13),
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: ms(10),
    margin: ms(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexBasis: ms(90),
    flexGrow: 0.5,
    flexShrink: 0,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    color: '#fff',
    fontSize: sp(10),
    fontWeight: 'bold',
    paddingLeft: ms(10),
    paddingRight: ms(15),
    paddingVertical: ms(3),
    borderTopLeftRadius: ms(10),
    borderBottomRightRadius: ms(10),
    overflow: 'hidden',
  },
  reqText: {
    flexGrow: 1,
    marginLeft: ms(10),
    paddingLeft: ms(3),
    textAlign: 'center',
    color: COLORS.linkBlue,
    fontSize: sp(12),
    fontWeight: 'bold',
  },
  issueLabel: {
    flexGrow: 0.5,
    marginLeft: ms(10),
    color: COLORS.ink,
    fontSize: sp(12),
    fontWeight: 'bold',
  },
  issueValue: {
    flexGrow: 1,
    color: COLORS.primary,
    fontSize: sp(12),
    fontWeight: 'bold',
  },
  dateLabel: {
    flexGrow: 1,
    marginLeft: ms(10),
    color: COLORS.ink,
    fontSize: sp(12),
    fontWeight: 'bold',
  },
  dateValue: {
    flexGrow: 1,
    color: COLORS.lightGray,
    fontSize: sp(12),
    fontWeight: 'bold',
  },
  taskIdText: {
    alignSelf: 'flex-end',
    marginTop: ms(8),
    marginRight: ms(15),
    fontSize: sp(14),
    fontWeight: 'bold',
  },
  notesWrap: {
    marginHorizontal: ms(10),
    marginTop: ms(15),
    marginBottom: ms(14),
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ms(5),
  },
  notesLabel: {
    fontSize: sp(12),
    color: COLORS.ink,
  },
  notesText: {
    flexGrow: 2.5,
    flexBasis: 0,
    paddingLeft: ms(10),
    fontSize: sp(12),
    color: COLORS.lightGray,
  },
  deleteIcon: {
    flexGrow: 0.5,
    flexBasis: 0,
    alignItems: 'center',
  },
});
