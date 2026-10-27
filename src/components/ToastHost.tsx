// src/components/ToastHost.tsx
//
// Draws the Java-style success / failure banner (custom_toast_success.xml /
// custom_toast_failure.xml, shown by CommonFunction.showSuccessMsg / showFailureMsg):
//   - white card (success) or #f8d7da card (failure), 20dp radius, 8dp elevation
//   - 15dp inner margin; message 16sp (#155724 / #721c24) taking 1.5 of 2 weight, icon 0.5
//   - added 200px from the top and 100px from each side (device pixels, as in Java)
//   - slides down from -100 to 0 over 500ms (accelerate-decelerate), removed after 4s
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PixelRatio, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
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
const PX = 1 / PixelRatio.get();

// drawable/correct_sym.xml
const SuccessIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 117 117">
    <Path
      fill="#17AB13"
      d="M34.5,55.1C32.9,53.5 30.3,53.5 28.7,55.1C27.1,56.7 27.1,59.3 28.7,60.9L47.6,79.8C48.4,80.6 49.4,81 50.5,81C50.6,81 50.6,81 50.7,81C51.8,80.9 52.9,80.4 53.7,79.5L101,22.8C102.4,21.1 102.2,18.5 100.5,17C98.8,15.6 96.2,15.8 94.7,17.5L50.2,70.8L34.5,55.1Z"
    />
    <Path
      fill="#4A4A4A"
      d="M89.1,9.3C66.1,-5.1 36.6,-1.7 17.4,17.5C-5.2,40.1 -5.2,77 17.4,99.6C28.7,110.9 43.6,116.6 58.4,116.6C73.2,116.6 88.1,110.9 99.4,99.6C118.7,80.3 122,50.7 107.5,27.7C106.3,25.8 103.8,25.2 101.9,26.4C100,27.6 99.4,30.1 100.6,32C113.1,51.8 110.2,77.2 93.6,93.8C74.2,113.2 42.5,113.2 23.1,93.8C3.7,74.4 3.7,42.7 23.1,23.3C39.7,6.8 65,3.9 84.8,16.2C86.7,17.4 89.2,16.8 90.4,14.9C91.6,13 91,10.5 89.1,9.3Z"
    />
  </Svg>
);

// drawable/error_icon.xml
const FailureIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Path fill="#D72828" d="M16,16m-16,0a16,16 0,1 1,32 0a16,16 0,1 1,-32 0" />
    <Path fill="#E6E6E6" d="M14.5,25h3v-3h-3V25zM14.5,6v13h3V6H14.5z" />
  </Svg>
);

let hostCounter = 0;

const ToastHost: React.FC = () => {
  const [hostId] = useState(() => ++hostCounter);
  const [isTop, setIsTop] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const slide = useRef(new Animated.Value(-100)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shows a toast on this host for `remainingMs`. The toast itself stays in toast.ts until it
  // expires, so a different host can take it over if this one stops being topmost.
  const show = (next: ToastMessage, remainingMs: number) => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    setToast(next);
    slide.setValue(-100);
    Animated.timing(slide, {
      toValue: 0,
      duration: SLIDE_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
    hideTimer.current = setTimeout(() => setToast(null), remainingMs);
  };

  useEffect(() => {
    const unregister = registerToastHost(hostId);
    const sync = () => setIsTop(isTopToastHost(hostId));
    const unsubscribe = subscribeToastHosts(sync);
    sync();
    return () => {
      unsubscribe();
      unregister();
    };
  }, [hostId]);

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

  if (toast.kind === 'info') {
    // Plain platform-toast look for iOS: dark pill, white text, near the bottom.
    return (
      <View pointerEvents="none" style={styles.infoLayer}>
        <Animated.View style={[styles.infoPill, { opacity: slide.interpolate({ inputRange: [-100, 0], outputRange: [0, 1] }) }]}>
          <Text style={styles.infoText}>{toast.message}</Text>
        </Animated.View>
      </View>
    );
  }

  const isSuccess = toast.kind === 'success';
  return (
    <View pointerEvents="none" style={styles.layer}>
      <Animated.View
        style={[
          styles.card,
          isSuccess ? styles.cardSuccess : styles.cardFailure,
          { transform: [{ translateY: slide }] },
        ]}
      >
        <View style={styles.row}>
          <View style={styles.messageCell}>
            <Text style={[styles.message, { color: isSuccess ? '#155724' : '#721c24' }]}>
              {toast.message}
            </Text>
          </View>
          <View style={styles.iconCell}>
            {isSuccess ? <SuccessIcon size={ms(30)} /> : <FailureIcon size={ms(30)} />}
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default ToastHost;

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
    paddingTop: 200 * PX,
    paddingHorizontal: 100 * PX,
    alignItems: 'stretch',
  },
  card: {
    borderRadius: ms(20),
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardSuccess: { backgroundColor: '#ffffff' },
  cardFailure: { backgroundColor: '#f8d7da' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: ms(15),
  },
  messageCell: { flex: 1.5, justifyContent: 'center' },
  iconCell: { flex: 0.5, alignItems: 'center', justifyContent: 'center' },
  message: { fontSize: sp(16) },
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
