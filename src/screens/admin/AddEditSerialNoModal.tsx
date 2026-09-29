// src/screens/admin/AddEditSerialNoModal.tsx
//
// Add/edit form for the leaf Serial Number level of Brand -> Model ->
// Serial Number. See BrandModelTabHost.tsx. Simpler than the brand/model
// forms -- Android's serial form is just the number, no image/description.

import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {COLORS} from '../../theme/theme';
import {ms, scale, sp, vs} from '../../utils/responsive';
import {ensureSuccess} from '../../utils/apiResponse';
import {addSerialNo, updateSerialNo} from '../../api/brandModel/brandModelService';
import type {SerialNoItem} from '../../api/brandModel/brandModelService';

type Props = {
  visible: boolean;
  ownerId: number;
  brandId: number;
  modelId: number;
  /** Shown under the title like Java's txtlbldBrandModelName. */
  brandName?: string;
  modelName?: string;
  editing?: SerialNoItem | null;
  onClose: () => void;
  onSaved: () => void;
};

const AddEditSerialNoModal: React.FC<Props> = ({visible, ownerId, brandId, modelId, brandName, modelName, editing, onClose, onSaved}) => {
  const [serialNo, setSerialNo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editing;

  useEffect(() => {
    if (!visible) return;
    setSerialNo(editing?.SerialNo ?? '');
    setError(null);
  }, [visible, editing]);

  const isValid = serialNo.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        SerialNoId: editing?.SerialNoId,
        SerialNo: serialNo.trim(),
        BrandId: brandId,
        ModelId: modelId,
        OwnerId: ownerId,
        UserID: ownerId,
        CreatedBy: ownerId,
        UpdatedBy: ownerId,
      };
      await ensureSuccess(isEditing ? await updateSerialNo(payload) : await addSerialNo(payload));
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{isEditing ? 'Edit Serial Number' : 'Add Serial Number'}</Text>
          {brandName || modelName ? (
            <Text style={styles.subtitle}>{`${brandName ?? ''}/${modelName ?? ''}`}</Text>
          ) : null}

          <Text style={styles.label}>Serial Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Serial Number"
            placeholderTextColor={COLORS.textMuted}
            value={serialNo}
            onChangeText={setSerialNo}
            autoFocus
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.submitButton, (!isValid || submitting) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!isValid || submitting}>
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>Save</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.36)',
  },
  sheet: {
    width: '100%',
    maxWidth: ms(560),
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: ms(16),
    borderTopRightRadius: ms(16),
    paddingHorizontal: ms(22),
    paddingTop: ms(20),
    paddingBottom: ms(28),
  },
  subtitle: {
    color: '#6b7280',
    fontSize: sp(13),
    marginTop: -vs(8),
    marginBottom: vs(14),
  },
  title: {
    color: '#111827',
    fontSize: sp(18),
    fontWeight: '800',
    marginBottom: vs(14),
  },
  label: {
    color: '#6b7280',
    fontSize: sp(13),
    marginBottom: vs(6),
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: scale(10),
    paddingHorizontal: scale(14),
    paddingVertical: vs(10),
    fontSize: sp(15),
    color: '#111827',
    marginBottom: vs(14),
  },
  errorText: {
    color: '#DC2626',
    fontSize: sp(13),
    marginBottom: vs(10),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: scale(12),
    marginTop: vs(6),
  },
  cancelButton: {
    paddingHorizontal: scale(18),
    paddingVertical: vs(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: sp(15),
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: scale(10),
    paddingHorizontal: scale(24),
    paddingVertical: vs(10),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: ms(90),
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: sp(15),
    fontWeight: '700',
  },
});

export default AddEditSerialNoModal;
