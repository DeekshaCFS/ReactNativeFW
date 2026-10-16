// src/screens/admin/AddEditModelModal.tsx
//
// Add/edit form for the Model level of Brand -> Model -> Serial Number.
// See BrandModelTabHost.tsx. Same shape as AddEditBrandModal.tsx, scoped
// to a parent brandId.

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
import {addModel, updateModel} from '../../api/brandModel/brandModelService';
import type {ModelItem} from '../../api/brandModel/brandModelService';
import { showToast } from '../../utils/toast';

import {useTranslation} from 'react-i18next';
type Props = {
  visible: boolean;
  ownerId: number;
  brandId: number;
  /** Shown under the title like Java's txtAddedBrandName ("Brand Name/"). */
  brandName?: string;
  editing?: ModelItem | null;
  onClose: () => void;
  onSaved: () => void;
};

type PickedImage = {
  uri: string;
  base64: string;
  fileName: string;
};

const AddEditModelModal: React.FC<Props> = ({visible, ownerId, brandId, brandName, editing, onClose, onSaved}) => {
  const {t} = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<PickedImage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editing;

  useEffect(() => {
    if (!visible) return;
    setName(editing?.ModelName ?? '');
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
      fileName: asset.fileName || `model_${Date.now()}.jpg`,
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
        ModelId: editing?.ModelId,
        ModelName: name.trim(),
        BrandId: brandId,
        Description: description.trim(),
        ImageFileName: image?.fileName,
        ImageFileBase64Str: image?.base64,
        OwnerId: ownerId,
        UserID: ownerId,
        CreatedBy: ownerId,
        UpdatedBy: ownerId,
      };
      await ensureSuccess(isEditing ? await updateModel(payload) : await addModel(payload));
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
      title={isEditing ? 'Edit Model' : 'Add Model'}
      subtitle={brandName ? `Brand Name : ${brandName}` : undefined}
      submitLabel={(isEditing ? t('update') : 'Create Model').toUpperCase()}
      submitting={submitting}
      error={error}
      cancelLabel={t('cancel')}
      onClose={onClose}
      onSubmit={() => {
        if (!isValid) {
          setError('Please enter the model name.');
          return;
        }
        handleSubmit();
      }}>
      <FieldLabel>Model Name *</FieldLabel>
      <PillInput placeholder="Enter Model Name *" value={name} onChangeText={setName} />

      <FieldLabel>Model Image</FieldLabel>
      <ImageUploadBox uri={image?.uri ?? editing?.ImagePath} onPress={showImagePickerOptions} />

      <FieldLabel>Model Description</FieldLabel>
      <DescriptionInput placeholder="Enter Model Description Here.." value={description} onChangeText={setDescription} />
    </BrandDialogSheet>
  );
};

export default AddEditModelModal;
