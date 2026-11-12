// src/components/AppModal.tsx
import React, { useEffect, useRef } from 'react';
import { Modal as RNModal, ModalProps, Platform, View, StyleSheet } from 'react-native';
import { isTablet } from '../utils/responsive';
import { APP_MAX_WIDTH } from './AppContainer';
import ToastHost from './ToastHost';
import { newModalId, setModalOpen, setPortalEntry, useOpenModals, usePortalEntries } from './modalPortal';

// Drop-in replacement for react-native's Modal. A Modal is drawn above the app,
// outside AppContainer, so on tablets it would fill the full screen width.
// Here its content is kept in the same centered, width-capped column as the
// rest of the app; phones render exactly like a plain Modal.
const IS_IOS = Platform.OS === 'ios';

const AppModal: React.FC<ModalProps> = ({ children, visible, ...props }) => {
  const idRef = useRef<number | null>(null);
  if (idRef.current === null) idRef.current = newModalId();
  const id = idRef.current;
  const portalKey = `modal-${id}`;
  const openModals = useOpenModals();
  const portals = usePortalEntries();

  // iPhone cannot present a second native modal while one is already open: the second one
  // silently never appears (dropdowns, photo-source dialog, calendar, nested sheets ...).
  // So a modal that opens while another AppModal is showing is drawn *inside* that modal
  // instead (same trick SearchPickerModal already used for itself). Android is unchanged.
  const hasOtherOpen = openModals.some(m => m !== id);
  const stackedRef = useRef(false);
  const wasVisibleRef = useRef(false);
  let stacked = false;
  if (visible) {
    if (!wasVisibleRef.current) stackedRef.current = IS_IOS && hasOtherOpen;
    // If the modal it was stacked in has since closed, fall back to a real modal.
    stacked = stackedRef.current && hasOtherOpen;
    stackedRef.current = stacked;
  } else {
    stackedRef.current = false;
  }
  wasVisibleRef.current = !!visible;

  // Only real (non-stacked) modals count as hosts for stacked content and toasts.
  useEffect(() => {
    setModalOpen(id, !!visible && !stacked);
  }, [id, visible, stacked]);
  useEffect(() => () => setModalOpen(id, false), [id]);

  // Stacked content: register it with the top real modal.
  const transparent = !!props.transparent;
  useEffect(() => {
    setPortalEntry(
      portalKey,
      stacked ? (
        <View
          style={[StyleSheet.absoluteFill, !transparent && styles.stackedSolid]}
          pointerEvents="box-none"
        >
          {children}
        </View>
      ) : null,
    );
  }, [portalKey, stacked, children, transparent]);
  useEffect(() => () => setPortalEntry(portalKey, null), [portalKey]);

  // A real modal reports onDismiss itself; a stacked one has to do it by hand.
  const wasStackedRef = useRef(false);
  const onDismissRef = useRef(props.onDismiss);
  onDismissRef.current = props.onDismiss;
  useEffect(() => {
    if (wasStackedRef.current && !stacked && !visible) onDismissRef.current?.();
    wasStackedRef.current = stacked;
  }, [stacked, visible]);

  // Only the top-most real modal draws content that was opened from inside modals.
  const isTop = openModals[openModals.length - 1] === id;

  return (
    <RNModal visible={visible && !stacked} {...props}>
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
  stackedSolid: { backgroundColor: '#fff' },
});