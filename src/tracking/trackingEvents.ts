// src/tracking/trackingEvents.ts
// iOS: listens for the ticks FWTracking.swift emits and hands them to the same handler Android uses.
// Imported once from index.js. Does nothing on Android (it uses the headless task there).

import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import trackingTick, { TrackingTick } from './trackingHeadlessTask';

if (Platform.OS === 'ios' && NativeModules.FWTracking) {
  const emitter = new NativeEventEmitter(NativeModules.FWTracking);
  emitter.addListener('FWTrackingTick', (tick: TrackingTick) => {
    trackingTick(tick).catch(error => console.log('[tracking] tick failed:', error));
  });
}