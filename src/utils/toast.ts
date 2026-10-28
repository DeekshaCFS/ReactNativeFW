// src/utils/toast.ts
//
// RN counterpart of Java's CommonFunction.showSuccessMsg / showFailureMsg: the custom card
// banner (custom_toast_success.xml / custom_toast_failure.xml) that slides in from the top and
// removes itself after 4 seconds. The banner itself is drawn by <ToastHost/>.
//
// Java's plain Toast.makeText() is the platform toast -- use `showToast` for those.
//
// Every message passes through sanitizeForUser, so no server address or raw network error is
// ever shown to the user.
import {Platform, ToastAndroid} from 'react-native';
import {sanitizeForUser} from './safeMessage';

export const TOAST_DURATION_MS = 4000;

// 'info' is the plain platform-toast look (dark pill, no icon): used for showToast on iOS, which has
// no native toast.
export type ToastKind = 'success' | 'failure' | 'info';

export type ToastMessage = {id: number; kind: ToastKind; message: string};

type Listener = (toast: ToastMessage) => void;

let nextId = 1;
const listeners = new Set<Listener>();

// The toast currently on screen. It lives here rather than inside a ToastHost, so when the modal
// that was showing it closes, the app-root host can pick up the remaining time.
let active: {toast: ToastMessage; until: number} | null = null;

export const getActiveToast = () => {
  if (!active || active.until <= Date.now()) {
    return null;
  }
  return {toast: active.toast, remainingMs: active.until - Date.now()};
};

// <ToastHost/> is mounted once at the app root and again inside every AppModal (a Modal is a
// separate window drawn above the app, so a root-level banner would be hidden behind it). Only
// the most recently mounted host -- the topmost window -- draws the banner.
const hostStack: number[] = [];
const hostListeners = new Set<() => void>();

export const registerToastHost = (id: number) => {
  hostStack.push(id);
  hostListeners.forEach(l => l());
  return () => {
    const index = hostStack.lastIndexOf(id);
    if (index >= 0) {
      hostStack.splice(index, 1);
    }
    hostListeners.forEach(l => l());
  };
};

export const isTopToastHost = (id: number) => hostStack[hostStack.length - 1] === id;

export const subscribeToastHosts = (listener: () => void) => {
  hostListeners.add(listener);
  return () => {
    hostListeners.delete(listener);
  };
};

export const subscribeToasts = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const emit = (kind: ToastKind, message: unknown) => {
  const raw = String(message ?? '').trim();
  if (!raw) {
    return;
  }
  const toast: ToastMessage = {id: nextId++, kind, message: sanitizeForUser(raw)};
  // Store before notifying, so a host that mounts a moment later can still show it.
  active = {toast, until: Date.now() + TOAST_DURATION_MS};
  listeners.forEach(l => l(toast));
};

/** Java: CommonFunction.showSuccessMsg(message, activity). */
export const showSuccessMsg = (message?: unknown) => emit('success', message);

/** Java: CommonFunction.showFailureMsg(message, activity). */
export const showFailureMsg = (message?: unknown) => emit('failure', message);

/** Java: Toast.makeText(context, message, Toast.LENGTH_SHORT / LONG). */
export const showToast = (message?: unknown, long = false) => {
  const raw = String(message ?? '').trim();
  if (!raw) {
    return;
  }
  const text = sanitizeForUser(raw);
  if (Platform.OS === 'android') {
    ToastAndroid.show(text, long ? ToastAndroid.LONG : ToastAndroid.SHORT);
  } else {
    // iOS has no platform toast; draw the same plain message as an in-app pill.
    emit('info', text);
  }
};