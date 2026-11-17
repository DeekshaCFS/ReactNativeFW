// src/utils/photoPicker.ts
//
// One place that launches the camera / gallery for a single photo.
//
// Why this exists (iOS "hangs" when taking or choosing a photo):
//  1. The picker was launched while the "Select Image Source" dialog was still dismissing. iOS
//     refuses to present a view controller during a dismiss, so the picker never appeared and the
//     dismissed modal's window kept swallowing touches -- the app looked frozen. Callers now
//     launch from the dialog's onDismiss (see usePhotoSource) and this helper adds a short settle
//     delay on top.
//  2. Full-resolution photos were sent over the bridge as base64 (a 12 MP photo is ~5-8 MB of
//     text), which blocks the JS thread for seconds. Photos are now capped at 1280 px.
//  3. The default 'pageSheet' presentation can clash with a sheet that is already open. The
//     picker is presented full screen instead.
import { Platform } from 'react-native';
import { launchImageLibrary, type Asset } from 'react-native-image-picker';
import { launchCameraWithPermission } from './cameraPermission';
import { showFailureMsg } from './toast';

export type PhotoSource = 'camera' | 'gallery';

const IOS_SETTLE_MS = 350;
const MAX_SIDE = 1280;

// Waits for the source dialog's close animation to finish before the native picker opens.
// InteractionManager is deprecated, so this uses requestIdleCallback where the runtime provides
// it (it is not a React Native built-in, so a setTimeout fallback is used otherwise).
const scheduleIdle = (cb: () => void) => {
  const ric = (globalThis as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
  if (typeof ric === 'function') {
    ric(cb);
  } else {
    setTimeout(cb, 0);
  }
};

const settle = () =>
  new Promise<void>(resolve => {
    scheduleIdle(() => {
      setTimeout(resolve, Platform.OS === 'ios' ? IOS_SETTLE_MS : 0);
    });
  });

/** Returns the chosen photo, or null if the user cancelled or something went wrong. */
export async function pickPhoto(source: PhotoSource): Promise<Asset | null> {
  await settle();
  try {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: true,
      quality: 0.7 as const,
      maxWidth: MAX_SIDE,
      maxHeight: MAX_SIDE,
      presentationStyle: 'fullScreen' as const,
    };
    const result =
      source === 'camera'
        ? await launchCameraWithPermission({ ...options, saveToPhotos: false })
        : await launchImageLibrary({ ...options, selectionLimit: 1 });

    if (result.didCancel) {
      return null;
    }
    if (result.errorCode) {
      // 'permission' on iOS already showed the "open Settings" alert (cameraPermission.ts).
      if (result.errorCode !== 'permission') {
        showFailureMsg(result.errorMessage || 'Unable to open the camera');
      }
      return null;
    }
    const asset = result.assets?.[0];
    return asset?.uri ? asset : null;
  } catch (e: any) {
    showFailureMsg(e?.message || 'Unable to open the camera');
    return null;
  }
}