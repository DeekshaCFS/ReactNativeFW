// src/components/AppContainer.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { isTablet } from '../utils/responsive';

// Phone-designed layouts stretch awkwardly across a tablet/iPad. On large
// screens the whole app is rendered in a centered column of this width; phones
// are untouched. The app is portrait-locked, so this width never needs to
// react to rotation.
export const APP_MAX_WIDTH = 600;

const AppContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isTablet) {
    return <View style={styles.fill}>{children}</View>;
  }
  return (
    <View style={styles.gutter}>
      <View style={styles.column}>{children}</View>
    </View>
  );
};

export default AppContainer;

const styles = StyleSheet.create({
  fill: { flex: 1 },
  gutter: { flex: 1, alignItems: 'center', backgroundColor: '#E5E7EB' },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: APP_MAX_WIDTH,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
});
