// Shared sheet for the Brand Management dialogs (Java dialog_add_brand / dialog_add_model /
// dialog_add_serial_num_undermodel): white 30dp-top-radius sheet, centred 24sp title, red 18sp
// "Brand Name : ..." line, bold section labels, outlined pill fields, dashed image box, green
// submit button and a red Cancel.
import React from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Modal from './AppModal';
import {COLORS} from '../theme/theme';
import {ms, sp} from '../utils/responsive';

import i18n from 'i18next';
export const GREEN = '#4CAF50';

type SheetProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  submitLabel: string;
  submitting: boolean;
  error?: string | null;
  onSubmit: () => void;
  onClose: () => void;
  cancelLabel: string;
  children: React.ReactNode;
};

export default function BrandDialogSheet({
  visible,
  title,
  subtitle,
  submitLabel,
  submitting,
  error,
  onSubmit,
  onClose,
  cancelLabel,
  children,
}: SheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.body}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              {children}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable style={[styles.submit, submitting && {opacity: 0.6}]} onPress={onSubmit} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>{submitLabel}</Text>
                )}
              </Pressable>
              <Pressable style={styles.cancel} onPress={onClose}>
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const FieldLabel = ({children}: {children: string}) => <Text style={styles.label}>{children}</Text>;

export const PillInput = (props: React.ComponentProps<typeof TextInput>) => (
  <TextInput
    placeholderTextColor={COLORS.lightGray}
    {...props}
    style={[styles.pill, props.style]}
  />
);

export const DescriptionInput = (props: React.ComponentProps<typeof TextInput>) => (
  <TextInput
    placeholderTextColor={COLORS.lightGray}
    multiline
    {...props}
    style={[styles.descBox, props.style]}
  />
);

/** bg_image_upload: dashed box with camera, "Tap to upload image" and "Optional". */
export const ImageUploadBox = ({uri, onPress}: {uri?: string | null; onPress: () => void}) => (
  <Pressable style={styles.uploadBox} onPress={onPress}>
    {uri ? (
      <Image source={{uri}} style={styles.uploadImg} resizeMode="cover" />
    ) : (
      <>
        <Ionicons name="camera-outline" size={ms(60)} color="#9AA0AA" />
        <Text style={styles.uploadHint}>{i18n.t('rn_tap_to_upload_image')}</Text>
        <Text style={styles.uploadOptional}>{i18n.t('rn_optional')}</Text>
      </>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  backdrop: {flex: 1, justifyContent: 'flex-end'},
  backdropPress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    width: '100%',
    maxWidth: ms(560),
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    maxHeight: '94%',
  },
  body: {paddingHorizontal: ms(20), paddingTop: ms(24), paddingBottom: ms(20)},
  title: {textAlign: 'center', fontSize: sp(22), color: '#000', marginBottom: ms(18)},
  subtitle: {fontSize: sp(18), color: COLORS.primary, marginBottom: ms(24)},
  label: {fontSize: sp(14), fontWeight: '700', color: '#333333', marginBottom: ms(12)},
  pill: {
    height: ms(50),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: ms(34),
    paddingHorizontal: ms(18),
    fontSize: sp(16),
    color: COLORS.ink,
    backgroundColor: '#fff',
    marginBottom: ms(22),
  },
  descBox: {
    height: ms(130),
    borderWidth: 1,
    borderColor: '#e3e3e3',
    borderRadius: ms(12),
    padding: ms(14),
    fontSize: sp(16),
    color: COLORS.ink,
    textAlignVertical: 'top',
    marginBottom: ms(22),
  },
  uploadBox: {
    height: ms(175),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#b5b5b5',
    borderRadius: ms(14),
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ms(22),
    overflow: 'hidden',
  },
  uploadImg: {width: '100%', height: '100%'},
  uploadHint: {fontSize: sp(14), color: '#757575', marginTop: ms(6)},
  uploadOptional: {fontSize: sp(12), color: '#999999', marginTop: ms(2)},
  error: {color: '#DC2626', fontSize: sp(13), textAlign: 'center', marginBottom: ms(10)},
  submit: {
    height: ms(52),
    borderRadius: ms(34),
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  submitText: {color: '#fff', fontSize: sp(16), fontWeight: '700'},
  cancel: {alignItems: 'center', marginTop: ms(18), marginBottom: ms(10)},
  cancelText: {color: COLORS.primary, fontSize: sp(18)},
});
