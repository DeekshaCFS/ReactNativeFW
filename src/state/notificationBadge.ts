// src/state/notificationBadge.ts
//
// Unread-notification count for the header bell. Java keeps a local counter bumped by each
// foreground FCM push (Constant.UNREAD_COUNT) and cleared when the notification list opens;
// this app has no push client, so the count comes from the server list instead
// (Notification/NotificationList, entries with IsRead false).

import { useSyncExternalStore } from 'react';
import { getNotificationList } from '../api/notification/notificationService';
import { getCurrentUserId } from './session';

let count = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach(l => l());

export const setUnreadCount = (next: number) => {
  const safe = Math.max(0, Math.trunc(next) || 0);
  if (safe !== count) {
    count = safe;
    emit();
  }
};

export const decrementUnreadCount = () => setUnreadCount(count - 1);

export const countUnread = (items: { IsRead?: boolean }[] | null | undefined) =>
  (items ?? []).filter(i => !i.IsRead).length;

export const refreshUnreadCount = async () => {
  const userId = getCurrentUserId();
  if (!userId) return;
  try {
    const response = await getNotificationList({ UserId: userId });
    if (Array.isArray(response?.ResultData)) {
      setUnreadCount(countUnread(response.ResultData));
    }
  } catch {
    // Keep the last known count; the badge is best-effort.
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useUnreadCount = () => useSyncExternalStore(subscribe, () => count);
