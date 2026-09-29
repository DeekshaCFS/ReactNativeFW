// src/screens/admin/AddEditServiceModal.tsx
//
// Add/edit form for the leaf "Service" level of the Services hierarchy
// (Category -> Sub-Category -> Service). See ServiceCategoryTabHost.tsx.
//
// Simplified from Android's AddUpdateServiceDialog: one photo instead of up
// to 3, and no SAC-code field (edit-only in Java, no validation/behavior
// tied to it beyond storage).

import React, {useEffect, useRef, useState} from 'react';
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
import {sanitizeDecimalInput} from '../../utils/decimal';
import {postServiceTypeList, updateServiceTypeList} from '../../api/services/servicesService';
import type {ServiceTypeListDTOResultData} from '../../api/services/services.types';

type Props = {
  visible: boolean;
  ownerId: number;
  subCategoryId: number;
  editing?: ServiceTypeListDTOResultData | null;
  onClose: () => void;
  onSaved: () => void;
};

type PickedImage = {
  uri: string;
  base64: string;
  fileName: string;
};

const AddEditServiceModal: React.FC<Props> = ({
  visible,
  ownerId,
  subCategoryId,
  editing,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [sacCode, setSacCode] = useState('');
  // Three photo slots (imageview_photo1..3), sent as ImageFileBase64Str /
  // ImageFileBase64Str1 / ImageFileBase64Str2. Java only shows them when adding
  // (dialog_add_service_sub_category); EditService uses dialog_add_service,
  // where they're 'gone' and no images are sent.
  const [images, setImages] = useState<(PickedImage | null)[]>([null, null, null]);
  const pickingSlot = useRef(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editing;

  useEffect(() => {
    if (!visible) return;
    setName(editing?.ServiceName ?? '');
    setPrice(editing?.Price != null ? String(editing.Price) : '');
    setDescription(editing?.Description ?? '');
    setContactNo(editing?.ContactNo != null ? String(editing.ContactNo) : '');
    setSacCode(editing?.SACCode ?? '');
    setImages([null, null, null]);
    setError(null);
  }, [visible, editing]);

  const applyPickedImage = (asset: Asset) => {
    if (!asset.base64 || !asset.uri) {
      Alert.alert('Photo', 'Unable to read the selected image. Please try again.');
      return;
    }
    const picked = {
      uri: asset.uri,
      base64: asset.base64,
      fileName: asset.fileName || `service_item_${Date.now()}.jpg`,
    };
    setImages(prev => prev.map((img, i) => (i === pickingSlot.current ? picked : img)));
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

  const showImagePickerOptions = (slot: number) => {
    pickingSlot.current = slot;
    Alert.alert('Photo', 'Add a photo', [
      {text: 'Camera', onPress: () => captureImageFromCamera()},
      {text: 'Gallery', onPress: () => pickImageFromGallery()},
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  // Java requires name, price and description (phone validation is commented out there).
  const isValid =
    name.trim().length > 0 &&
    price.trim().length > 0 &&
    !Number.isNaN(Number(price)) &&
    description.trim().length > 0;

  const imageFields = {
    ImageFileBase64Str: images[0]?.base64,
    ImageFileName: images[0]?.fileName,
    ImageFileBase64Str1: images[1]?.base64,
    ImageFileName1: images[1]?.fileName,
    ImageFileBase64Str2: images[2]?.base64,
    ImageFileName2: images[2]?.fileName,
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      if (isEditing) {
        await ensureSuccess(
          await updateServiceTypeList({
            Id: editing!.Id,
            ServiceTypeSubCategoryId: subCategoryId,
            ServiceName: name.trim(),
            Price: Number(price),
            Description: description.trim(),
            ContactNo: contactNo.trim() ? Number(contactNo.trim()) : undefined,
            SACCode: sacCode.trim(),
            CreatedBy: ownerId,
            UpdatedBy: ownerId,
          }),
        );
      } else {
        await ensureSuccess(
          await postServiceTypeList({
            ServiceTypeSubCategoryId: subCategoryId,
            ServiceName: name.trim(),
            Price: Number(price),
            Description: description.trim(),
            ContactNo: contactNo.trim() ? Number(contactNo.trim()) : undefined,
            SACCode: sacCode.trim(),
            ...imageFields,
            UserId: ownerId,
            CreatedBy: ownerId,
            UpdatedBy: ownerId,
          }),
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
            <Text style={styles.title}>{isEditing ? 'Edit Service' : 'Add Service'}</Text>

            <Text style={styles.label}>Service Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Service Name"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Service Price *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={COLORS.textMuted}
              value={price}
              onChangeText={t => setPrice(sanitizeDecimalInput(t))}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>SAC Code</Text>
            <TextInput
              style={styles.input}
              placeholder="SAC Code"
              placeholderTextColor={COLORS.textMuted}
              value={sacCode}
              onChangeText={setSacCode}
            />

            <Text style={styles.label}>Service Contact Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Service Contact Number"
              placeholderTextColor={COLORS.textMuted}
              value={contactNo}
              onChangeText={t => setContactNo(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={10}
            />

            {isEditing ? null : (
            <View style={styles.photoRow}>
              {images.map((img, slot) => (
                <Pressable
                  key={slot}
                  style={[styles.imagePicker, styles.photoSlot]}
                  onPress={() => showImagePickerOptions(slot)}>
                  {img ? (
                    <Image source={{uri: img.uri}} style={styles.imagePreview} />
                  ) : (
                    <Text style={styles.imagePickerText}>+ Photo</Text>
                  )}
                </Pressable>
              ))}
            </View>
            )}

            <Text style={styles.label}>Service Description *</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Service Description"
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
  photoRow: {
    flexDirection: 'row',
    gap: ms(10),
  },
  photoSlot: {
    width: ms(76),
    height: ms(76),
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

export default AddEditServiceModal;
