// src/screens/admin/AddEditBrandModal.tsx
//
// Add/edit form for the Brand level of Brand -> Model -> Serial Number.
// See BrandModelTabHost.tsx. Same shape as AddEditServiceGroupModal.tsx.

import { launchCameraWithPermission } from '../../utils/cameraPermission';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
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
import BrandDialogSheet, {DescriptionInput, FieldLabel, ImageUploadBox, PillInput} from '../../components/BrandDialogSheet';
import {launchImageLibrary, type Asset} from 'react-native-image-picker';
import {COLORS} from '../../theme/theme';
import {ms, scale, sp, vs} from '../../utils/responsive';
import {ensureSuccess} from '../../utils/apiResponse';
import {addBrand, updateBrand} from '../../api/brandModel/brandModelService';
import type {BrandItem} from '../../api/brandModel/brandModelService';
import { showToast } from '../../utils/toast';

import {useTranslation} from 'react-i18next';
type Props = {
  visible: boolean;
  ownerId: number;
  editing?: BrandItem | null;
  onClose: () => void;
  onSaved: () => void;
};

type PickedImage = {
  uri: string;
  base64: string;
  fileName: string;
};

const AddEditBrandModal: React.FC<Props> = ({visible, ownerId, editing, onClose, onSaved}) => {
  const {t} = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<PickedImage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editing;

  useEffect(() => {
    if (!visible) return;
    setName(editing?.BrandName ?? '');
    setDescription(editing?.Description ?? '');
    setImage(null);
    setError(null);
  }, [visible, editing]);

  const applyPickedImage = (asset: Asset) => {
    if (!asset.base64 || !asset.uri) {
      showToast('Unable to read the selected image. Please try again.');
      return;
    }
    setImage({
      uri: asset.uri,
      base64: asset.base64,
      fileName: asset.fileName || `brand_${Date.now()}.jpg`,
    });
  };

  const captureImageFromCamera = async () => {
    const result = await launchCameraWithPermission({mediaType: 'photo', includeBase64: true, quality: 0.6, saveToPhotos: true});
    if (result.didCancel) return;
    if (result.errorCode) {
      showToast(result.errorMessage || 'Unable to open camera.');
      return;
    }
    const asset = result.assets?.[0];
    if (asset) applyPickedImage(asset);
  };

  const pickImageFromGallery = async () => {
    const result = await launchImageLibrary({mediaType: 'photo', includeBase64: true, quality: 0.6, selectionLimit: 1});
    if (result.didCancel) return;
    if (result.errorCode) {
      showToast(result.errorMessage || 'Unable to open gallery.');
      return;
    }
    const asset = result.assets?.[0];
    if (asset) applyPickedImage(asset);
  };

  const showImagePickerOptions = () => {
    Alert.alert('Photo', 'Add a photo', [
      {text: 'Camera', onPress: () => captureImageFromCamera()},
      {text: 'Gallery', onPress: () => pickImageFromGallery()},
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const isValid = name.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        BrandId: editing?.BrandId,
        BrandName: name.trim(),
        Description: description.trim(),
        ImageFileName: image?.fileName,
        ImageFileBase64Str: image?.base64,
        OwnerId: ownerId,
        UserID: ownerId,
        CreatedBy: ownerId,
        UpdatedBy: ownerId,
      };
      await ensureSuccess(isEditing ? await updateBrand(payload) : await addBrand(payload));
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
      title={isEditing ? 'Edit Brand' : 'Create Brand'}
      submitLabel={(isEditing ? t('update') : 'Create Brand').toUpperCase()}
      submitting={submitting}
      error={error}
      cancelLabel={t('cancel')}
      onClose={onClose}
      onSubmit={() => {
        if (!isValid) {
          setError('Please enter the brand name.');
          return;
        }
        handleSubmit();
      }}>
      <FieldLabel>Brand Name *</FieldLabel>
      <PillInput placeholder={t('label_brand_name')} value={name} onChangeText={setName} />

      <FieldLabel>Brand Image</FieldLabel>
      <ImageUploadBox uri={image?.uri ?? editing?.ImagePath} onPress={showImagePickerOptions} />

      <FieldLabel>Brand Description</FieldLabel>
      <DescriptionInput placeholder="Enter Brand Description Here.." value={description} onChangeText={setDescription} />
    </BrandDialogSheet>
  );
};

export default AddEditBrandModal;
