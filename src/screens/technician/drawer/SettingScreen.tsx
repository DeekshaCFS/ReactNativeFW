// src/screens/technician/drawer/SettingScreen.tsx
//
// Technician's Settings screen. Split from the admin variant
// (../../admin/AdminSettingScreen.tsx) -- Android's SettingsFragment hides
// "Invite Friends" for plain Fieldworkers (only Owner-tier roles see it),
// so this screen omits that row entirely rather than checking role at
// runtime. See SettingsScreenBase.tsx for the shared layout/styling.

import {Alert, Linking, Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import SettingsScreenBase, {type SettingsRow} from '../../../components/SettingsScreenBase';

export default function SettingScreen() {
  const handleRateUs = () => {
    const bundleId = DeviceInfo.getBundleId();
    const url =
      Platform.OS === 'android'
        ? `https://play.google.com/store/apps/details?id=${bundleId}`
        : 'https://apps.apple.com/search?term=fieldweb';
    Linking.openURL(url).catch(() => {});
  };

  const handleFeedback = () => {
    Linking.openURL('mailto:info@fieldweb.co.in?subject=FieldWeb%20Feedback').catch(() => {});
  };

  // Java: App Tour (TapTarget overlay) and Change Language (English/Hindi locale switch)
  // are not ported yet. Say so instead of leaving a silent dead tap.
  const notAvailable = (feature: string) => () =>
    Alert.alert(feature, 'This feature is not available in this version yet.');

  const topCards: SettingsRow[] = [
    {icon: 'phone-portrait-outline', title: 'App Tour', onPress: notAvailable('App Tour')},
    {icon: 'star-outline', title: 'Rate Us', onPress: handleRateUs},
    {icon: 'thumbs-up-outline', title: 'Feedback', onPress: handleFeedback},
  ];

  const listItems: SettingsRow[] = [
    {icon: 'language-outline', title: 'Change Language', onPress: notAvailable('Change Language')},
    {icon: 'document-text-outline', title: 'Terms & Condition', route: 'TermsAndConditions'},
    {icon: 'shield-checkmark-outline', title: 'Privacy Policy', route: 'PrivacyPolicy'},
    {icon: 'cash-outline', title: 'Refund Policy', route: 'RefundPolicy'},
    {icon: 'information-circle-outline', title: 'About Fieldweb', route: 'AboutFieldweb'},
  ];

  return <SettingsScreenBase topCards={topCards} listItems={listItems} />;
}
