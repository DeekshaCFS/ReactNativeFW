// src/tour/TourTarget.tsx
//
// Wraps a tour-step's real UI element (the profile completion card, the
// Task tab, the header menu button) so SpotlightOverlay can find and
// measure it on screen by key. See TourContext.tsx for the engine.

import {useEffect, useRef} from 'react';
import {View, type ViewProps} from 'react-native';
import {useTour} from './TourContext';

type Props = ViewProps & {
  tourKey: string;
  children: React.ReactNode;
};

export default function TourTarget({tourKey, children, style, ...rest}: Props) {
  const {registerMeasurer, unregisterMeasurer} = useTour();
  const ref = useRef<View>(null);

  useEffect(() => {
    registerMeasurer(tourKey, () => new Promise(resolve => {
      const node = ref.current;
      if (!node) {
        resolve(null);
        return;
      }
      node.measureInWindow((x, y, width, height) => {
        resolve(width > 0 && height > 0 ? {x, y, width, height} : null);
      });
    }));
    return () => unregisterMeasurer(tourKey);
  }, [tourKey, registerMeasurer, unregisterMeasurer]);

  return (
    // collapsable={false}: keeps this View in Android's native tree so
    // measureInWindow has something to measure (otherwise RN can optimize
    // plain wrapper Views away).
    <View ref={ref} collapsable={false} style={style} {...rest}>
      {children}
    </View>
  );
}
