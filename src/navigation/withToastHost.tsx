// src/navigation/withToastHost.tsx
//
// Native-stack screens are drawn in their own native view layer on iOS, which sits above the
// app-root ToastHost. So each native-stack screen gets its own ToastHost, drawn above that screen.
// Only the topmost host draws (see utils/toast.ts), so this does not double up.
import React from 'react';
import ToastHost from '../components/ToastHost';

export function withToastHost<P extends object>(
  Screen: React.ComponentType<P>,
): React.ComponentType<P> {
  function WithToastHost(props: P) {
    return (
      <>
        <Screen {...props} />
        <ToastHost />
      </>
    );
  }
  WithToastHost.displayName = `WithToastHost(${Screen.displayName || Screen.name || 'Screen'})`;
  return WithToastHost;
}