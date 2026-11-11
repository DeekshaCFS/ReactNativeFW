// src/styles/iosElevation.ts
//
// Android draws card shadows from `elevation`, but iPhone (iOS) ignores `elevation`.
// Without iOS shadow props, cards look flat with no border on iPhone.
//
// This file runs once at app start (imported first in index.js). On iOS only, every
// style created with StyleSheet.create that has `elevation` but no shadow props gets
// matching iOS shadow props. Styles that already define shadows are left unchanged,
// and Android is not affected.

import {Platform, StyleSheet} from 'react-native';

if (Platform.OS === 'ios') {
  const originalCreate = StyleSheet.create;

  const withIosShadow = (style: any) => {
    if (!style || typeof style !== 'object' || style.elevation == null) {
      return style;
    }
    // Keep any shadow the screen already defined.
    if (style.shadowColor != null || style.shadowOpacity != null) {
      return style;
    }
    const elevation = Number(style.elevation) || 0;
    if (elevation <= 0) {
      return style;
    }
    return {
      ...style,
      shadowColor: '#000000',
      shadowOpacity: 0.15,
      shadowRadius: elevation / 2,
      shadowOffset: {width: 0, height: elevation / 2},
    };
  };

  (StyleSheet as any).create = (sheet: Record<string, any>) => {
    const converted: Record<string, any> = {};
    for (const key of Object.keys(sheet)) {
      converted[key] = withIosShadow(sheet[key]);
    }
    return originalCreate(converted as any);
  };
}

export {};