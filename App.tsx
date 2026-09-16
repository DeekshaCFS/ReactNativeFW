import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import 'react-native-gesture-handler';

export default function App() {
  useEffect(() => {
    const handler = (error: any) => {
      console.log('UNHANDLED REJECTION:', error?.reason?.message, error?.reason?.stack);
    };
    // @ts-ignore
    global.onunhandledrejection = handler;
  }, []);
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}