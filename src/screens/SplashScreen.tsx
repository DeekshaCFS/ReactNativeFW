// src/screens/SplashScreen.tsx
//
// Port of the Java SplashActivity (activity_splash.xml): plays splash_new.mp4
// on a #f1f1f1 background with a "* Powered by AI" label at the bottom.
//
// Java holds the splash for a fixed 3000 ms (Handler.postDelayed) and then
// routes; the video only finishes the activity early if it ends first. The
// routing itself is not duplicated here: RootNavigator already sends the user
// to the auth stack or the main app based on the stored token, so once the
// splash is done we simply render it.

import {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Video from 'react-native-video';
import {sp, ms} from '../utils/responsive';

const SPLASH_DURATION_MS = 3000; // Java: mHandler.postDelayed(..., 3000)

type Props = {onFinish: () => void};

export default function SplashScreen({onFinish}: Props) {
  useEffect(() => {
    const timer = setTimeout(onFinish, SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.root}>
      <Video
        source={require('../../assets/videos/splash_new.mp4')}
        style={styles.video}
        resizeMode="contain"
        repeat={false}
        controls={false}
        // Java videoView.setClickable(false): taps do nothing.
        pointerEvents="none"
      />
      <Text style={styles.poweredBy}>* Powered by AI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F1F1F1', // Java activity_splash.xml android:background
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  poweredBy: {
    position: 'absolute',
    bottom: ms(20), // Java layout_marginBottom 20dp
    alignSelf: 'center',
    color: '#535353', // Java @color/dark_gray
    fontSize: sp(16),
    fontWeight: 'bold',
  },
});