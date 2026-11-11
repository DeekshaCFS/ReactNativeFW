// src/components/AppModal.tsx
import React, { useEffect, useRef } from 'react';
import { Modal as RNModal, ModalProps, View, StyleSheet } from 'react-native';
import { isTablet } from '../utils/responsive';
import { APP_MAX_WIDTH } from './AppContainer';
import ToastHost from './ToastHost';
import { newModalId, setModalOpen, useOpenModals, usePortalEntries } from './modalPortal';

// Drop-in replacement for react-native's Modal. A Modal is drawn above the app,
// outside AppContainer, so on tablets it would fill the full screen width.
// Here its content is kept in the same centered, width-capped column as the
// rest of the app; phones render exactly like a plain Modal.
const AppModal: React.FC<ModalProps> = ({ children, visible, ...props }) => {
  const idRef = useRef<number | null>(null);
  if (idRef.current === null) idRef.current = newModalId();
  const id = idRef.current;
  const openModals = useOpenModals();
  const portals = usePortalEntries();

  useEffect(() => {
    setModalOpen(id, !!visible);
  }, [id, visible]);
  useEffect(() => () => setModalOpen(id, false), [id]);

  // Only the top-most open modal draws dropdowns that were opened from inside modals.
  const isTop = openModals[openModals.length - 1] === id;

  return (
    <RNModal visible={visible} {...props}>
      {isTablet ? (
        <View style={[styles.gutter, !props.transparent && styles.gutterSolid]}>
          <View style={styles.column}>{children}</View>
        </View>
      ) : (
        children
      )}
      {isTop && portals.size > 0 ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {Array.from(portals.entries()).map(([key, node]) => (
            <React.Fragment key={key}>{node}</React.Fragment>
          ))}
        </View>
      ) : null}
      {/* A Modal is its own window above the app: draw the success / failure banner in it too. */}
      <ToastHost />
    </RNModal>
  );
};

export default AppModal;

const styles = StyleSheet.create({
  gutter: { flex: 1, alignItems: 'center' },
  gutterSolid: { backgroundColor: '#E5E7EB' },
  column: { flex: 1, width: '100%', maxWidth: APP_MAX_WIDTH },
});