// src/components/TaskListCard.tsx
//
// Java res/layout/tasklist_new.xml + TasksListAdapter (fieldworker variant): used by the
// Home task list and the Task tab so both look identical.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/theme';
import { ms, sp } from '../utils/responsive';
import { getCurrentCurrencySymbol } from '../state/session';
import type { TasksListResultData as Task } from '../api/task/task.types';

// drawable/*_background.xml + strings: ribbon colour and label per TaskStatus.
const STATUS_RIBBON: Record<string, { label: string; color: string }> = {
  InActive:  { label: 'InActive',  color: COLORS.statusInactive },
  Completed: { label: 'Completed', color: COLORS.statusCompleted },
  Rejected:  { label: 'Rejected',  color: COLORS.statusRejected },
  Ongoing:   { label: 'Ongoing',   color: COLORS.statusOngoing },
  OnHold:    { label: 'OnHold',    color: COLORS.statusOnHold },
};

const p2 = (n: number) => String(n).padStart(2, '0');

/** Java: "dd-MM-yyyy hh:mm aa" from TaskDate + TaskTime. */
export const formatTaskDateTime = (item: Task) => {
  const raw = item.TaskDate || item.CreatedDate;
  if (!raw) return '';
  const d = new Date(String(raw).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(raw);
  const dateLabel = `${p2(d.getDate())}-${p2(d.getMonth() + 1)}-${d.getFullYear()}`;
  const time = String(item.TaskTime ?? '').split('.')[0];
  if (!time) return dateLabel;
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return dateLabel;
  return `${dateLabel} ${p2(h % 12 || 12)}:${p2(m)} ${h >= 12 ? 'PM' : 'AM'}`;
};

/** Java: "₹ 100.000" for Rs, otherwise "<symbol> 100.000"; blank when wages <= 0. */
const formatWages = (wages?: number) => {
  const value = Number(wages ?? 0);
  if (!(value > 0)) return '';
  const symbol = getCurrentCurrencySymbol();
  return `${!symbol || symbol === 'Rs' ? '₹' : symbol} ${value.toFixed(3)}`;
};

type Props = {
  task: Task;
  onPress: () => void;
  /** Right-hand icons next to the amount (download / attachment), supplied by the screen. */
  actions?: React.ReactNode;
};

export default function TaskListCard({ task, onPress, actions }: Props) {
  const ribbon = STATUS_RIBBON[task.TaskStatus ?? ''];
  const tag = task.Task_TagName && task.Task_TagName.toUpperCase() !== 'NA' ? task.Task_TagName : null;
  const fsr = task.FSRName && task.FSRName.toUpperCase() !== 'NA' ? task.FSRName : '';
  const wages = formatWages(task.WagesPerHours);

  return (
    <Pressable style={styles.card} android_ripple={{ color: '#00000010' }} onPress={onPress}>
      <View style={styles.ribbonRow}>
        <Text
          style={[styles.ribbon, { backgroundColor: ribbon?.color ?? COLORS.statusInactive }]}
        >
          {(ribbon?.label ?? task.TaskType ?? '').toUpperCase()}
        </Text>
        {tag ? (
          <Text style={styles.tag} numberOfLines={1}>{tag.toUpperCase()}</Text>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.left}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>{task.Name}</Text>
            <Text style={styles.taskId} numberOfLines={1}>[{task.NewTaskId ?? task.Id}]</Text>
          </View>
          <Text style={styles.address} numberOfLines={2}>{task.FullAddress ?? task.LocationName}</Text>
          <Text style={styles.customer} numberOfLines={1}>{task.CustomerName}</Text>
        </View>

        <View style={styles.right}>
          <Text style={styles.date} numberOfLines={2}>{formatTaskDateTime(task)}</Text>
          {fsr ? <Text style={styles.fsr} numberOfLines={2}>{fsr}</Text> : null}
          <View style={styles.bottomRow}>
            {actions}
            <Text style={styles.amount}>{wages}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // CardView: margin 8dp, radius 10dp, elevation 2dp.
  card: {
    margin: ms(8),
    borderRadius: ms(10),
    backgroundColor: COLORS.white,
    elevation: 2,
    overflow: 'hidden',
  },
  ribbonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ribbon: {
    fontSize: sp(9),
    color: COLORS.white,
    paddingHorizontal: ms(15),
    paddingVertical: ms(3),
    borderBottomRightRadius: ms(10),
    overflow: 'hidden',
  },
  tag: {
    width: ms(100),
    height: ms(20),
    fontSize: sp(9),
    fontWeight: 'bold',
    color: COLORS.white,
    backgroundColor: COLORS.tagBlue,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingHorizontal: ms(5),
    borderBottomLeftRadius: ms(10),
    overflow: 'hidden',
  },
  body: { flexDirection: 'row', marginHorizontal: ms(10) },
  // Java: weights 0.65 / 0.35 with the right column's 50dp width as its base, so only the
  // free space is shared out.
  left: { flexGrow: 0.65, flexBasis: 0, flexShrink: 1, marginBottom: ms(14) },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: ms(5) },
  name: { flexShrink: 1, paddingLeft: ms(5), fontSize: sp(16), fontWeight: 'bold', color: COLORS.ink },
  taskId: { paddingLeft: ms(5), fontSize: sp(12), fontWeight: 'bold', color: COLORS.linkBlue },
  address: { marginTop: ms(5), paddingLeft: ms(5), fontSize: sp(12), color: COLORS.lightGray },
  customer: { marginTop: ms(5), paddingLeft: ms(5), fontSize: sp(12), color: COLORS.ink },
  right: { flexGrow: 0.35, flexBasis: ms(50), flexShrink: 1, marginTop: ms(5), marginRight: ms(2), marginBottom: ms(9), alignItems: 'flex-end' },
  date: { marginTop: ms(5), fontSize: sp(11), textAlign: 'right', color: COLORS.textBlack },
  fsr: { marginTop: ms(8), fontSize: sp(12), fontWeight: 'bold', textAlign: 'right', color: COLORS.primary },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 'auto' },
  amount: { fontSize: sp(12), fontWeight: 'bold', textAlign: 'right', color: COLORS.primary },
});
