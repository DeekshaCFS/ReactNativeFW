// src/screens/admin/AddEditServiceModal.tsx
//
// Add/edit form for the leaf "Service" level of the Services hierarchy
// (Category -> Sub-Category -> Service). See ServiceCategoryTabHost.tsx.
//
// Simplified from Android's AddUpdateServiceDialog: one photo instead of up
// to 3, and no SAC-code field (edit-only in Java, no validation/behavior
// tied to it beyond storage).

import { launchCameraWithPermission } from '../../utils/cameraPermission';
import React, {useEffect, useRef, useState} from 'react';
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
import {sanitizeDecimalInput} from '../../utils/decimal';
import {postServiceTypeList, updateServiceTypeList} from '../../api/services/servicesService';
import type {ServiceTypeListDTOResultData} from '../../api/services/services.types';
import { showSuccessMsg, showToast } from '../../utils/toast';
import DecimalInput from '../../components/DecimalInput';

import {useTranslation} from 'react-i18next';
import { showImageSourceDialog } from '../../components/ImageSourceHost';
type Props = {
  visible: boolean;
  ownerId: number;
  subCategoryId: number;
  editing?: ServiceTypeListDTOResultData | null;
  onClose: () => void;
  onSaved: () => void;
};

// Same placeholder the service list card shows when a service has no photo.
const DEFAULT_IMAGE = require('../../../assets/images/ic_camera.png');

// Shows the same image as the list card: the photo's uri, or the default if it's missing or fails to load.
const SlotImage = ({uri, style}: {uri?: string | null; style: any}) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  return (
    <Image
      source={uri && !failed ? {uri} : DEFAULT_IMAGE}
      style={style}
      resizeMode="contain"
      onError={() => setFailed(true)}
    />
  );
};

// Downloads an image and returns its base64 (no data: prefix).
const urlToBase64 = async (uri: string): Promise<string> => {
  const blob = await (await fetch(uri)).blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result ?? '');
      resolve(result.includes(',') ? result.split(',')[1] : '');
    };
    reader.onerror = () => reject(new Error('Unable to read image'));
    reader.readAsDataURL(blob);
  });
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
  const {t} = useTranslation();
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
  // Existing server photo for a slot, or null when the slot is empty ('' / 'NA').
  const existingPhotoUri = (p?: string | null) =>
    p && String(p).trim().toUpperCase() !== 'NA' ? String(p) : null;
  const existingPhotos = [editing?.PhotoPath, editing?.PhotoPath1, editing?.PhotoPath2];

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
      showToast(t('rn_unable_to_read_the_selected_image_please_t'));
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

  const showImagePickerOptions = (slot: number) => {
    pickingSlot.current = slot;
    showImageSourceDialog(() => captureImageFromCamera(), () => pickImageFromGallery());
  };

  // Java requires name, price and description (phone validation is commented out there).
  const isValid =
    name.trim().length > 0 &&
    price.trim().length > 0 &&
    !Number.isNaN(Number(price)) &&
    description.trim().length > 0;

  // Every slot must carry an image: the server decodes each one and throws on null. An empty slot
  // uploads the same image the list card shows: the service's existing photo, or the default.
  const buildImageFields = async () => {
    const defaultUri = Image.resolveAssetSource(DEFAULT_IMAGE).uri;
    const keys = [
      ['ImageFileBase64Str', 'ImageFileName'],
      ['ImageFileBase64Str1', 'ImageFileName1'],
      ['ImageFileBase64Str2', 'ImageFileName2'],
    ] as const;
    const fields: Record<string, string> = {};
    for (let slot = 0; slot < 3; slot++) {
      const picked = images[slot];
      let base64 = picked?.base64 ?? '';
      let fileName = picked?.fileName ?? '';
      if (!base64) {
        const existing = existingPhotoUri(existingPhotos[slot]);
        try {
          base64 = await urlToBase64(existing ?? defaultUri);
        } catch {
          base64 = await urlToBase64(defaultUri);
        }
        fileName = `service_${Date.now()}_${slot}.jpg`;
      }
      fields[keys[slot][0]] = base64;
      fields[keys[slot][1]] = fileName;
    }
    return fields;
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      let response: {Message?: unknown} | undefined;
      if (isEditing) {
        response = await ensureSuccess(
          await updateServiceTypeList({
            Id: editing!.Id,
            ServiceTypeSubCategoryId: subCategoryId,
            ServiceName: name.trim(),
            Price: Number(price),
            Description: description.trim(),
            ContactNo: contactNo.trim() ? Number(contactNo.trim()) : undefined,
            SACCode: sacCode.trim(),
            IsActive: true,
            CreatedBy: ownerId,
            UpdatedBy: ownerId,
          }),
        );
      } else {
        response = await ensureSuccess(
          await postServiceTypeList({
            ServiceTypeSubCategoryId: subCategoryId,
            ServiceName: name.trim(),
            Price: Number(price),
            Description: description.trim(),
            ContactNo: contactNo.trim() ? Number(contactNo.trim()) : undefined,
            SACCode: sacCode.trim(),
            ...(await buildImageFields()),
            UserId: ownerId,
            CreatedBy: ownerId,
            UpdatedBy: ownerId,
          }),
        );
      }
      showSuccessMsg(
        String(response?.Message ?? '').trim() ||
          `Service ${isEditing ? 'updated' : 'added'} successfully.`,
      );
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Add: dialog_add_service_sub_category.xml (dark gradient_addtask header "Add Service", 3 photo boxes).
  // Edit: dialog_add_service.xml (centred 22sp "Edit Service" title with a close cross, no photos).
  const fields = (
    <View style={styles.body}>
      <OutlinedInput
        style={styles.pill}
        placeholder={t('service_name_add_task') + ' *'}
        placeholderTextColor={COLORS.lightGray}
        value={name}
        maxLength={25}
        onChangeText={setName}
      />

      <View style={styles.pairRow}>
        <DecimalInput
          style={[styles.pill, styles.half]}
          label={t('rn_service_price')}
          placeholderTextColor={COLORS.lightGray}
          value={price}
          onChangeText={v => setPrice(sanitizeDecimalInput(v))}
        />
        <OutlinedInput
          style={[styles.pill, styles.half]}
          placeholder={t('rn_sac_code')}
          placeholderTextColor={COLORS.lightGray}
          value={sacCode}
          maxLength={10}
          autoCapitalize="characters"
          onChangeText={setSacCode}
        />
      </View>

      <OutlinedInput
        style={styles.pill}
        placeholder={t('rn_service_contact_number')}
        placeholderTextColor={COLORS.lightGray}
        value={contactNo}
        onChangeText={v => setContactNo(v.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        maxLength={10}
      />

      <View style={styles.photoRow}>
        {images.map((img, slot) => {
          const uri = img ? img.uri : existingPhotoUri(existingPhotos[slot]);
          return (
            <Pressable key={slot} style={styles.photoSlot} onPress={() => showImagePickerOptions(slot)}>
              {uri ? (
                <SlotImage key={uri} uri={uri} style={styles.imagePreview} />
              ) : (
                <Image source={DEFAULT_IMAGE} style={styles.imagePreview} resizeMode="contain" />
              )}
            </Pressable>
          );
        })}
      </View>

      <OutlinedInput
        style={[styles.pill, styles.descPill]}
        placeholder={t('rn_service_description')}
        placeholderTextColor={COLORS.lightGray}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={() => {
          if (!isValid) {
            setError('Please enter the service name, price and description.');
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
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={[styles.sheet, isEditing && {borderTopLeftRadius: ms(30), borderTopRightRadius: ms(30)}]}>
          {isEditing ? (
            <View style={styles.editHeader}>
              <Pressable style={styles.editClose} onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={ms(30)} color={COLORS.primary} />
              </Pressable>
              <Text style={styles.editTitle}>{t('rn_edit_service')}</Text>
            </View>
          ) : (
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{t('rn_add_service')}</Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={ms(30)} color="#fff" />
              </Pressable>
            </View>
          )}
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {fields}
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
    maxHeight: '94%',
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
  editHeader: {height: ms(60), justifyContent: 'center', alignItems: 'center'},
  editClose: {position: 'absolute', right: ms(12), top: ms(8)},
  editTitle: {color: COLORS.ink, fontSize: sp(21), marginTop: ms(6)},
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
    marginBottom: ms(18),
  },
  pairRow: {flexDirection: 'row', gap: ms(10)},
  half: {flex: 1},
  descPill: {height: ms(100), paddingTop: ms(14), textAlignVertical: 'top'},
  photoRow: {flexDirection: 'row', gap: ms(20), marginTop: ms(2), marginBottom: ms(20)},
  photoSlot: {
    flex: 1,
    height: ms(100),
    borderRadius: ms(15),
    borderWidth: 1,
    borderColor: '#9a9faa',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePreview: {width: '100%', height: '100%'},
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

export default AddEditServiceModal;