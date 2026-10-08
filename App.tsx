import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import AppContainer from './src/components/AppContainer';
import { loadStoredLanguage } from './src/i18n';
import { TourProvider } from './src/tour/TourContext';
import SpotlightOverlay from './src/tour/SpotlightOverlay';
import 'react-native-gesture-handler';

export default function App() {
  const [languageReady, setLanguageReady] = useState(false);

  useEffect(() => {
    const handler = (error: any) => {
      console.log('UNHANDLED REJECTION:', error?.reason?.message, error?.reason?.stack);
    };
    // @ts-ignore
    global.onunhandledrejection = handler;
  }, []);

  useEffect(() => {
    loadStoredLanguage().finally(() => setLanguageReady(true));
  }, []);

  if (!languageReady) {
    return null;
  }

  return (
    // SpotlightOverlay is a sibling of AppContainer, not nested inside it,
    // so its absolute positioning lines up with the window coordinates
    // TourTarget's measureInWindow reports (AppContainer's tablet column is
    // narrower than the window and would otherwise offset the math).
    <TourProvider>
      <View style={styles.root}>
        <AppContainer>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AppContainer>
        <SpotlightOverlay />
      </View>
    </TourProvider>
  );
}

const styles = {
  root: {flex: 1} as const,
};