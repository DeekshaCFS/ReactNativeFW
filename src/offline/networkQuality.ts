// src/offline/networkQuality.ts
//
// Java: Network/HybridNetworkSpeedChecker. Accepting/finishing a task only posts straight to
// the server when the link is Excellent / Good / Fair; on a Poor link the work is stored on
// the device and synced later from the Sync screen.
//
// Java reads NetworkCapabilities.getLinkDownstreamBandwidthKbps() of the active network. The
// native module FWNetworkSpeed returns that same value and the same thresholds are applied here.
// If the module is missing (app not rebuilt yet) it falls back to what NetInfo gives: Wi-Fi link
// speed and the cellular generation. The result is cached for 60s, like Java.

import { NativeModules } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

type NativeNetworkInfo = { connected: boolean; transport: 'wifi' | 'cellular' | 'other'; downKbps: number };
const { FWNetworkSpeed } = NativeModules as {
  FWNetworkSpeed?: { getNetworkInfo: () => Promise<NativeNetworkInfo> };
};

export type NetworkQuality = 'Excellent' | 'Good' | 'Fair' | 'Poor';

const CACHE_VALIDITY_MS = 60_000;
let cached: { quality: NetworkQuality; at: number } | null = null;

const cacheAndReturn = (quality: NetworkQuality): NetworkQuality => {
  cached = { quality, at: Date.now() };
  return quality;
};

export const isPostable = (quality: NetworkQuality) => quality !== 'Poor';

export const getNetworkQuality = async (): Promise<NetworkQuality> => {
  if (cached && Date.now() - cached.at < CACHE_VALIDITY_MS) return cached.quality;

  const state = await NetInfo.fetch();
  if (!state.isConnected || state.isInternetReachable === false) return cacheAndReturn('Poor');

  // Exact Java rules, from the same Android value.
  if (FWNetworkSpeed) {
    try {
      const info = await FWNetworkSpeed.getNetworkInfo();
      if (!info.connected) return cacheAndReturn('Poor');
      const kbps = info.downKbps;
      if (info.transport === 'wifi') {
        if (kbps >= 15_000) return cacheAndReturn('Excellent');
        if (kbps >= 5_000) return cacheAndReturn('Good');
        if (kbps >= 2_000) return cacheAndReturn('Fair');
        return cacheAndReturn('Poor');
      }
      if (info.transport === 'cellular') {
        if (kbps >= 15_000) return cacheAndReturn('Excellent');
        if (kbps >= 8_000) return cacheAndReturn('Good');
        if (kbps >= 1_000) return cacheAndReturn('Fair');
        // Java runs a one-off speed test below 1 Mbps; treated as Poor here.
        return cacheAndReturn('Poor');
      }
      // Ethernet / VPN / other transports: Java falls through to its speed test; assume usable.
      return cacheAndReturn('Good');
    } catch {
      // fall back to the NetInfo estimate below
    }
  }

  if (state.type === 'wifi') {
    // Same Wi-Fi bands as Java (>=15 / >=5 / >=2 Mbps). linkSpeed is unknown on some devices;
    // a connected, reachable Wi-Fi network is then treated as Good.
    const mbps = (state.details as any)?.linkSpeed;
    if (typeof mbps !== 'number' || mbps <= 0) return cacheAndReturn('Good');
    if (mbps >= 15) return cacheAndReturn('Excellent');
    if (mbps >= 5) return cacheAndReturn('Good');
    if (mbps >= 2) return cacheAndReturn('Fair');
    return cacheAndReturn('Poor');
  }

  if (state.type === 'cellular') {
    switch ((state.details as any)?.cellularGeneration) {
      case '5g': return cacheAndReturn('Excellent');
      case '4g': return cacheAndReturn('Good');
      case '3g': return cacheAndReturn('Fair');
      case '2g': return cacheAndReturn('Poor');
      default: return cacheAndReturn('Fair');
    }
  }

  // Ethernet / VPN / other transports: assume usable.
  return cacheAndReturn('Good');
};

/** Drop the cached reading, e.g. right after the connection changed. */
export const resetNetworkQualityCache = () => { cached = null; };

/** Java: Connectivity.isNetworkAvailable -- any usable connection, no speed test. */
export const isNetworkAvailable = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return !!state.isConnected && state.isInternetReachable !== false;
};
