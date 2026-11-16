// src/components/ToastHost.tsx
//
// Draws every in-app alert as the dark bottom pill (the look previously used only for showToast
// on iOS): rgba(50,50,50,0.95) background, white text, near the bottom of the screen. Success,
// failure and info messages all share this style, because the top banner did not show on iOS.
// Shown for TOAST_DURATION_MS, then removed.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import {
  HOST_PRIORITY,
  TOAST_DURATION_MS,
  getActiveToast,
  isTopToastHost,
  registerToastHost,
  subscribeToastHosts,
  subscribeToasts,
  type ToastMessage,
} from '../utils/toast';
import { ms, sp } from '../utils/responsive';

const SLIDE_MS = 500;

let hostCounter = 0;

type Props = { priority?: number };

const ToastHost: React.FC<Props> = ({ priority = HOST_PRIORITY.screen }) => {
  const [hostId] = useState(() => ++hostCounter);
  const [isTop, setIsTop] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const slide = useRef(new Animated.Value(-100)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { width, height } = useWindowDimensions();

  // Shows a toast on this host for `remainingMs`. The toast itself stays in toast.ts until it
  // expires, so a different host can take it over if this one stops being topmost.
  const show = (next: ToastMessage, remainingMs: number) => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    setToast(next);
    hideTimer.current = setTimeout(() => setToast(null), remainingMs);
  };

  // Slide in once the card is actually mounted. Starting the animation before the view exists
  // (as show() used to) can leave the card stuck off-screen on iOS.
  useEffect(() => {
    if (!toast || !isTop) {
      return;
    }
    slide.setValue(-100);
    Animated.timing(slide, {
      toValue: 0,
      duration: SLIDE_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.id, isTop]);

  useEffect(() => {
    const unregister = registerToastHost(hostId, priority);
    const sync = () => setIsTop(isTopToastHost(hostId));
    const unsubscribe = subscribeToastHosts(sync);
    sync();
    return () => {
      unsubscribe();
      unregister();
    };
  }, [hostId, priority]);

  // When this host becomes topmost, show any toast that is still active. This covers a toast
  // sent just before the modal hosting it closed.
  useEffect(() => {
    if (!isTop) {
      return;
    }
    const active = getActiveToast();
    if (active) {
      show(active.toast, active.remainingMs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTop]);

  useEffect(
    () =>
      subscribeToasts(next => {
        // Only the topmost window draws the banner.
        if (isTopToastHost(hostId)) {
          show(next, TOAST_DURATION_MS);
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hostId],
  );

  useEffect(
    () => () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    },
    [],
  );

  if (!toast || !isTop) {
    return null;
  }

  // On iOS the banner is drawn in its own overlay window, above native-stack screens and any open
  // Modal, so it can never end up hidden behind them.
  const overlay = (node: React.ReactElement) =>
    Platform.OS === 'ios' ? (
      <FullWindowOverlay>
        <View pointerEvents="none" style={{ width, height }}>
          {node}
        </View>
      </FullWindowOverlay>
    ) : (
      node
    );

  // Every alert uses the same bottom pill, whatever its kind.
  return overlay(
    <View pointerEvents="none" style={styles.infoLayer}>
      <Animated.View style={[styles.infoPill, { opacity: slide.interpolate({ inputRange: [-100, 0], outputRange: [0, 1] }) }]}>
        <Text style={styles.infoText}>{toast.message}</Text>
      </Animated.View>
    </View>
  );
};

export default ToastHost;

const styles = StyleSheet.create({
  infoLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: ms(110),
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: ms(24),
  },
  infoPill: {
    backgroundColor: 'rgba(50,50,50,0.95)',
    borderRadius: ms(24),
    paddingVertical: ms(10),
    paddingHorizontal: ms(20),
  },
  infoText: { color: '#ffffff', fontSize: sp(14), textAlign: 'center' },
});