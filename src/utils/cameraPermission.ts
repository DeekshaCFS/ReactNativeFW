import { Alert, Keyboard, Linking, PermissionsAndroid, Platform } from 'react-native';
import {
  launchCamera,
  type CameraOptions,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { showToast } from './toast';

// CAMERA is declared in the manifest, so react-native-image-picker expects the app to
// obtain the runtime permission itself (otherwise launchCamera fails with
// "This library does not require Manifest.permission.CAMERA...").
export async function launchCameraWithPermission(
  options: CameraOptions,
): Promise<ImagePickerResponse> {
  Keyboard.dismiss();
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      showToast('Camera permission is required to take a photo.');
      return { errorCode: 'permission', errorMessage: 'Camera permission denied' };
    }
  }
  const result = await launchCamera(options);
  // iOS asks only once; after a denial the user must enable the camera in Settings.
  if (Platform.OS === 'ios' && result.errorCode === 'permission') {
    Alert.alert(
      'Camera access needed',
      'Enable camera access for FieldWeb in Settings to take photos.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
  }
  return result;
}