import { Alert, PermissionsAndroid, Platform } from 'react-native';
import {
  launchCamera,
  type CameraOptions,
  type ImagePickerResponse,
} from 'react-native-image-picker';

// CAMERA is declared in the manifest, so react-native-image-picker expects the app to
// obtain the runtime permission itself (otherwise launchCamera fails with
// "This library does not require Manifest.permission.CAMERA...").
export async function launchCameraWithPermission(
  options: CameraOptions,
): Promise<ImagePickerResponse> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert('Camera unavailable', 'Camera permission is required to take a photo.');
      return { errorCode: 'permission', errorMessage: 'Camera permission denied' };
    }
  }
  return launchCamera(options);
}
