// src/screens/admin/AddEditSerialNoModal.tsx
//
// Add/edit form for the leaf Serial Number level of Brand -> Model ->
// Serial Number. See BrandModelTabHost.tsx. Simpler than the brand/model
// forms -- Android's serial form is just the number, no image/description.

import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import BrandDialogSheet, {DescriptionInput, FieldLabel, ImageUploadBox, PillInput} from '../../components/BrandDialogSheet';
import {COLORS} from '../../theme/theme';
import {ms, scale, sp, vs} from '../../utils/responsive';
import {ensureSuccess} from '../../utils/apiResponse';
import {addSerialNo, updateSerialNo} from '../../api/brandModel/brandModelService';
import type {SerialNoItem} from '../../api/brandModel/brandModelService';

import {useTranslation} from 'react-i18next';
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
  const {t} = useTranslation();
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
    <BrandDialogSheet
      visible={visible}
      title={isEditing ? 'Edit Serial Number' : 'Add Serial Number'}
      subtitle={brandName || modelName ? `Brand/Model Name : ${brandName ?? ''}/${modelName ?? ''}` : undefined}
      submitLabel={(isEditing ? t('update') : 'Submit').toUpperCase()}
      submitting={submitting}
      error={error}
      cancelLabel={t('cancel')}
      onClose={onClose}
      onSubmit={() => {
        if (!isValid) {
          setError('Please enter the serial number.');
          return;
        }
        handleSubmit();
      }}>
      <FieldLabel>Serial Number *</FieldLabel>
      <PillInput placeholder="Enter Serial Number *" value={serialNo} onChangeText={setSerialNo} autoFocus />
    </BrandDialogSheet>
  );
};

export default AddEditSerialNoModal;
