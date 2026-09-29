// src/screens/admin/AddEditServiceGroupModal.tsx
//
// Shared add/edit form for the two "group" levels of the Services hierarchy
// (Category and Sub-Category) — both have the identical Name/Description/
// Image shape in the Java source, just different field prefixes and a
// different parent reference (Sub-Category needs its parent CategoryId).
// See ServiceCategoryTabHost.tsx for the list/drill-down screen this feeds.

import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {launchCamera, launchImageLibrary, type Asset} from 'react-native-image-picker';
import {COLORS} from '../../theme/theme';
import {ms, scale, sp, vs} from '../../utils/responsive';
import {ensureSuccess} from '../../utils/apiResponse';
import {
  postServiceCategoryList,
  postServiceSubCategoryList,
} from '../../api/services/servicesService';

export type ServiceGroupKind = 'category' | 'subcategory';

export type EditingServiceGroup = {
  id: number;
  name: string;
  description: string;
  image?: string | null;
};

type Props = {
  visible: boolean;
  kind: ServiceGroupKind;
  ownerId: number;
  categoryId?: number;
  editing?: EditingServiceGroup | null;
  onClose: () => void;
  onSaved: () => void;
};

type PickedImage = {
  uri: string;
  base64: string;
  fileName: string;
};

const AddEditServiceGroupModal: React.FC<Props> = ({
  visible,
  kind,
  ownerId,
  categoryId,
  editing,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<PickedImage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editing;
  const title = kind === 'category' ? 'Service Category' : 'Service Sub-Category';

  useEffect(() => {
    if (!visible) return;
    setName(editing?.name ?? '');
    setDescription(editing?.description ?? '');
    setImage(null);
    setError(null);
  }, [visible, editing]);

  const applyPickedImage = (asset: Asset) => {
    if (!asset.base64 || !asset.uri) {
      Alert.alert('Photo', 'Unable to read the selected image. Please try again.');
      return;
    }
    setImage({
      uri: asset.uri,
      base64: asset.base64,
      fileName: asset.fileName || `service_${Date.now()}.jpg`,
    });
  };

  const captureImageFromCamera = async () => {
    const result = await launchCamera({mediaType: 'photo', includeBase64: true, quality: 0.6, saveToPhotos: true});
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Camera', result.errorMessage || 'Unable to open camera.');
      return;
    }
    const asset = result.assets?.[0];
    if (asset) applyPickedImage(asset);
  };

  const pickImageFromGallery = async () => {
    const result = await launchImageLibrary({mediaType: 'photo', includeBase64: true, quality: 0.6, selectionLimit: 1});
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Gallery', result.errorMessage || 'Unable to open gallery.');
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

  // Java (addCategory/addSubCategory) requires both name and description.
  const isValid = name.trim().length > 0 && description.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      if (kind === 'category') {
        await ensureSuccess(
          await postServiceCategoryList({
            ServiceTypeCategoryId: editing?.id,
            ServiceTypeCategoryName: name.trim(),
            ServiceTypeCategoryDescription: description.trim(),
            CategoryImageFileBase64Str: image?.base64,
            CategoryImageFileName: image?.fileName,
            UserId: ownerId,
            CreatedBy: ownerId,
            UpdatedBy: ownerId,
          }),
        );
      } else {
        await ensureSuccess(
          await postServiceSubCategoryList({
            ServiceTypeSubCategoryId: editing?.id,
            ServiceTypeCategoryId: categoryId,
            ServiceTypeSubCategoryName: name.trim(),
            ServiceTypeSubCategoryDescription: description.trim(),
            SubCategoryImageFileBase64Str: image?.base64,
            SubCategoryImageName: image?.fileName,
            UserId: ownerId,
            CreatedBy: ownerId,
            UpdatedBy: ownerId,
          } as unknown as Parameters<typeof postServiceSubCategoryList>[0]),
        );
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{isEditing ? `Edit ${title}` : `Add ${title}`}</Text>

            <Text style={styles.label}>{kind === 'category' ? 'Category Name *' : 'SUB Category Name *'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Pressable style={styles.imagePicker} onPress={showImagePickerOptions}>
              {image ? (
                <Image source={{uri: image.uri}} style={styles.imagePreview} />
              ) : editing?.image ? (
                <Image source={{uri: editing.image}} style={styles.imagePreview} />
              ) : (
                <Text style={styles.imagePickerText}>+ Add Photo</Text>
              )}
            </Pressable>

            <Text style={styles.label}>Service Description *</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Description"
              placeholderTextColor={COLORS.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
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
          </ScrollView>
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
    maxHeight: '86%',
  },
  title: {
    color: '#111827',
    fontSize: sp(18),
    fontWeight: '800',
    marginBottom: vs(14),
  },
  imagePicker: {
    width: ms(84),
    height: ms(84),
    borderRadius: ms(12),
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(16),
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePickerText: {
    color: COLORS.primary,
    fontSize: sp(12),
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: scale(6),
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
  multilineInput: {
    minHeight: vs(70),
    textAlignVertical: 'top',
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

export default AddEditServiceGroupModal;
