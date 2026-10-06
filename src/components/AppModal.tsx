// src/components/AppModal.tsx
import React from 'react';
import { Modal as RNModal, ModalProps, View, StyleSheet } from 'react-native';
import { isTablet } from '../utils/responsive';
import { APP_MAX_WIDTH } from './AppContainer';

// Drop-in replacement for react-native's Modal. A Modal is drawn above the app,
// outside AppContainer, so on tablets it would fill the full screen width.
// Here its content is kept in the same centered, width-capped column as the
// rest of the app; phones render exactly like a plain Modal.
const AppModal: React.FC<ModalProps> = ({ children, ...props }) => (
  <RNModal {...props}>
    {isTablet ? (
      <View style={[styles.gutter, !props.transparent && styles.gutterSolid]}>
        <View style={styles.column}>{children}</View>
      </View>
    ) : (
      children
    )}
  </RNModal>
);

export default AppModal;

const styles = StyleSheet.create({
  gutter: { flex: 1, alignItems: 'center' },
  gutterSolid: { backgroundColor: '#E5E7EB' },
  column: { flex: 1, width: '100%', maxWidth: APP_MAX_WIDTH },
});
