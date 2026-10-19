// src/screens/admin/AddEditServiceGroupModal.tsx
//
// Shared add/edit form for the two "group" levels of the Services hierarchy
// (Category and Sub-Category) — both have the identical Name/Description/
// Image shape in the Java source, just different field prefixes and a
// different parent reference (Sub-Category needs its parent CategoryId).
// See ServiceCategoryTabHost.tsx for the list/drill-down screen this feeds.

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
import Modal from '../../components/AppModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {OutlinedInput} from '../../components/OutlinedInput';
import {launchImageLibrary, type Asset} from 'react-native-image-picker';
import {COLORS} from '../../theme/theme';
import {ms, scale, sp, vs} from '../../utils/responsive';
import {ensureSuccess} from '../../utils/apiResponse';
import {
  postServiceCategoryList,
  postServiceSubCategoryList,
} from '../../api/services/servicesService';
import { showToast } from '../../utils/toast';

import {useTranslation} from 'react-i18next';
import { showImageSourceDialog } from '../../components/ImageSourceHost';
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
  const {t} = useTranslation();
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
      showToast('Unable to read the selected image. Please try again.');
      return;
    }
    setImage({
      uri: asset.uri,
      base64: asset.base64,
      fileName: asset.fileName || `service_${Date.now()}.jpg`,
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
    showImageSourceDialog(() => captureImageFromCamera(), () => pickImageFromGallery());
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

  // dialog_add_category.xml / dialog_add_sub_category.xml: 25dp-corner card, dark gradient_addtask
  // header (22sp white title + close), outlined name pill, 100dp "Add/Capture Image" box, 100dp
  // description pill, dark Add/Update pill and a red Cancel.
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{kind === 'category' ? 'Service Category' : 'Service Sub Category'}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={ms(30)} color="#fff" />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.body}>
              <OutlinedInput
                style={styles.pill}
                placeholder={kind === 'category' ? 'Category Name *' : 'SUB Category Name *'}
                placeholderTextColor={COLORS.lightGray}
                value={name}
                maxLength={25}
                onChangeText={setName}
              />

              <Pressable style={styles.imageBox} onPress={showImagePickerOptions}>
                {image ? (
                  <Image source={{uri: image.uri}} style={styles.imagePreview} resizeMode="cover" />
                ) : editing?.image ? (
                  <Image source={{uri: editing.image}} style={styles.imagePreview} resizeMode="cover" />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={ms(34)} color={COLORS.lightGray} />
                    <Text style={styles.imageHint}>Add/Capture Image</Text>
                  </>
                )}
              </Pressable>

              <OutlinedInput
                style={[styles.pill, styles.descPill]}
                placeholder="Service Description *"
                placeholderTextColor={COLORS.lightGray}
                value={description}
                maxLength={60}
                onChangeText={setDescription}
                multiline
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={() => {
                  if (!isValid) {
                    setError('Please enter the name and description.');
                    return;
                  }
                  handleSubmit();
                }}
                disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitButtonText}>{(isEditing ? t('update') : t('add')).toUpperCase()}</Text>
                )}
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

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
    backgroundColor: COLORS.white,
    borderTopLeftRadius: ms(25),
    borderTopRightRadius: ms(25),
    overflow: 'hidden',
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.statusOnHold,
    height: ms(60),
    paddingHorizontal: ms(20),
    borderRadius: ms(20),
  },
  headerTitle: {color: '#fff', fontSize: sp(21)},
  body: {paddingHorizontal: ms(20), paddingTop: ms(20)},
  pill: {
    height: ms(50),
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: ms(34),
    paddingHorizontal: ms(18),
    fontSize: sp(16),
    color: COLORS.ink,
    backgroundColor: '#fff',
    marginBottom: ms(20),
  },
  descPill: {height: ms(100), paddingTop: ms(14), textAlignVertical: 'top'},
  imageBox: {
    height: ms(100),
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: '#d0d0d0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: ms(20),
  },
  imagePreview: {width: '100%', height: '100%'},
  imageHint: {color: COLORS.lightGray, fontSize: sp(16), marginTop: ms(2)},
  errorText: {color: '#DC2626', fontSize: sp(13), marginBottom: ms(10), textAlign: 'center'},
  submitButton: {
    height: ms(52),
    backgroundColor: COLORS.statusOnHold,
    borderRadius: ms(34),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ms(10),
    marginBottom: ms(20),
    elevation: 4,
  },
  submitButtonDisabled: {opacity: 0.6},
  submitButtonText: {color: '#fff', fontSize: sp(17)},
  cancelButton: {alignItems: 'center', marginBottom: ms(24)},
  cancelButtonText: {color: COLORS.primary, fontSize: sp(17)},
});

export default AddEditServiceGroupModal;
