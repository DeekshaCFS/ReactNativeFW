// src/tracking/trackingHeadlessTask.ts
//
// Handles one tick from the native side, on both platforms:
//   Android: headless task "FWTrackingTick" (index.js), started by TrackingForegroundService
//   iOS:     "FWTrackingTick" event (trackingEvents.ts), emitted by FWTracking.swift
//
//   location tick (every 2 min) -> Users/AddPathTravelledHistory + live location node
//   device tick   (every 15 min) -> DeviceStatus/AddOrUpdateGPSBatteryStatus

import { Platform } from 'react-native';
import { addTravelledPathHistory } from '../api/travelledPath/travelledPathService';
import { addUpdateDeviceStatus } from '../api/deviceStatus/deviceStatusService';
import { getCurrentPosition } from '../utils/locationPermision';
import { putLiveLocation } from '../utils/firebaseLiveLocation';
import { trackingNative } from './trackingController';

export type TrackingTick = {
  kind: 'location' | 'device';
  userId: string;
  taskId: number;
  batteryPercent: number;
  gpsOn: boolean;
  timestamp: string; // epoch ms as a string
  latitude?: number; // iOS sends the native fix
  longitude?: number;
};

export default async function trackingTick(tick: TrackingTick): Promise<void> {
  if (tick.kind === 'device') {
    await postDeviceStatus(tick);
  } else {
    await postLocation(tick);
  }
}

const postDeviceStatus = async (tick: TrackingTick): Promise<void> => {
  try {
    await addUpdateDeviceStatus({
      Id: 0,
      UserId: Number(tick.userId),
      GPSOnOrOff: tick.gpsOn,
      BatteryPercentage: tick.batteryPercent,
      CreatedBy: 0,
      UpdatedBy: 0,
    });
  } catch (error) {
    console.log('[tracking] device status failed:', error);
  }
};

const currentFix = async (): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const position = await getCurrentPosition();
    return { latitude: position.latitude, longitude: position.longitude };
  } catch (error) {
    console.log('[tracking] no fix this tick:', error);
    return null;
  }
};

const postLocation = async (tick: TrackingTick): Promise<void> => {
  const fix =
    tick.latitude != null && tick.longitude != null
      ? { latitude: tick.latitude, longitude: tick.longitude }
      : await currentFix();
  if (!fix) return;

  const userId = Number(tick.userId);
  const { latitude, longitude } = fix;

  // Android's notification is updated from JS. iOS already updated its own.
  if (Platform.OS === 'android') {
    trackingNative?.reportLocation(tick.timestamp, latitude, longitude).catch(() => {});
  }

  await Promise.all([
    addTravelledPathHistory([
      {
        Latitude: String(latitude),
        Longitude: String(longitude),
        LocAddress: '',
        TaskId: 0, // Java stores path points with TaskId 0
        UserID: userId,
        CreatedBy: userId,
        CreatedDate: javaStyleDateTime(new Date(Number(tick.timestamp))),
        UpdatedBy: userId,
        UpdatedDate: '',
      },
    ]).catch(error => console.log('[tracking] path history failed:', error)),
    putLiveLocation(userId, latitude, longitude),
  ]);
};

// Java: date (yyyy-MM-dd) + "T" + time (HH:mm:ss) + "Z", both in local time.
const javaStyleDateTime = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return `${date}T${time}Z`;
};