// src/hooks/usePhotoSource.ts
//
// Drives the "Select Image Source" dialog (ImageSourceDialog) and then the camera / gallery.
// The picker is launched only after the dialog has fully closed (its onDismiss), never in the same
// tick as the tap -- see utils/photoPicker.ts for why that matters on iOS.
//
//   const photoSource = usePhotoSource<MyContext>((asset, ctx) => { ... });
//   photoSource.open(ctx);                       // show the dialog
//   <ImageSourceDialog {...photoSource.dialogProps} />
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import type { Asset } from 'react-native-image-picker';
import { pickPhoto, type PhotoSource } from '../utils/photoPicker';

// RN's Modal only reports onDismiss on iOS; Android launches after this short delay instead.
const FALLBACK_MS = Platform.OS === 'ios' ? 1200 : 450;

export function usePhotoSource<T>(onPicked: (asset: Asset, ctx: T) => void) {
  const [visible, setVisible] = useState(false);
  const ctxRef = useRef<T | null>(null);
  const sourceRef = useRef<PhotoSource | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPickedRef = useRef(onPicked);
  onPickedRef.current = onPicked;

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Whichever of onDismiss / the fallback timer fires first consumes the request; the other is a no-op.
  const run = useCallback(async () => {
    clearTimer();
    const source = sourceRef.current;
    const ctx = ctxRef.current;
    sourceRef.current = null;
    ctxRef.current = null;
    if (!source || ctx === null) {
      return;
    }
    const asset = await pickPhoto(source);
    if (asset) {
      onPickedRef.current(asset, ctx);
    }
  }, []);

  useEffect(() => clearTimer, []);

  const open = useCallback((ctx: T) => {
    Keyboard.dismiss();
    ctxRef.current = ctx;
    sourceRef.current = null;
    setVisible(true);
  }, []);

  const choose = (source: PhotoSource) => {
    sourceRef.current = source;
    setVisible(false);
    clearTimer();
    timerRef.current = setTimeout(run, FALLBACK_MS);
  };

  const close = () => {
    clearTimer();
    sourceRef.current = null;
    ctxRef.current = null;
    setVisible(false);
  };

  return {
    open,
    dialogProps: {
      visible,
      onCamera: () => choose('camera'),
      onGallery: () => choose('gallery'),
      onClose: close,
      onDismiss: run,
    },
  };
}