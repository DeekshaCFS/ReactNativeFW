// src/tracking/trackingHeadlessTask.ts
//
// Runs for every tick sent by TrackingForegroundService (see index.js). Works with the UI closed.
//   location tick (every 2 min) -> Java GoogleLocationService + AddTravelledPathHistroyAsyncTask,
//                                  and the live-location node the admin map reads
//   device tick   (every 15 min) -> Java GPSBatteryStatus (DeviceStatus/AddOrUpdateGPSBatteryStatus)

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
  timestamp: string; // epoch ms, as a string
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

const postLocation = async (tick: TrackingTick): Promise<void> => {
  let position;
  try {
    position = await getCurrentPosition();
  } catch (error) {
    console.log('[tracking] no fix this tick:', error);
    return;
  }

  const userId = Number(tick.userId);
  const { latitude, longitude } = position;

  // Tray notification: "Location Updated: <time>" with the coordinates.
  trackingNative?.reportLocation(tick.timestamp, latitude, longitude).catch(() => {});

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
    ]).catch((error: unknown) => console.log('[tracking] path history failed:', error)),
    putLiveLocation(userId, latitude, longitude),
  ]);
};

// Java: currentDate + "T" + currentTime + "Z", both in local time (yyyy-MM-dd, HH:mm:ss).
const javaStyleDateTime = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return `${date}T${time}Z`;
};