import { useRef, useCallback } from 'react';
import { BackHandler, Platform, ToastAndroid } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

// `onBack` runs first; return true if it consumed the press (e.g. stepping
// back from a sub-section to the dashboard) so the exit prompt is skipped.
export const useDoubleBackExit = (onBack?: () => boolean) => {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const lastPress = useRef(0);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const onBackPress = () => {
        if (onBackRef.current?.()) {
          return true;
        }

        // If not on Home screen, allow normal navigation
        if (!navigation.isFocused()) {
          return false;
        }

        const now = Date.now();

        if (now - lastPress.current < 2000) {
          BackHandler.exitApp();
          return true;
        }

        lastPress.current = now;

        ToastAndroid.show(
          'Press back again to exit',
          ToastAndroid.SHORT
        );

        return true;
      };

      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => sub.remove();
    }, [navigation])
  );
};