// src/screens/admin/AdminSettingScreen.tsx
//
// Admin/owner's Settings screen. Split from the technician variant
// (../technician/drawer/SettingScreen.tsx) -- Android's SettingsFragment
// shows "Invite Friends" only for Owner-tier roles, so this screen
// includes that row while the technician screen omits it entirely. See
// SettingsScreenBase.tsx for the shared layout/styling.

import {Linking, Platform, Share} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import SettingsScreenBase, {type SettingsRow} from '../../components/SettingsScreenBase';

export default function AdminSettingScreen() {
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

  const handleInviteFriends = () => {
    Share.share({
      message:
        "Namaste 🙏,\nI am using India's #1 field business management app - 💥 FieldWeb \n\n" +
        'Benefits of using FieldWeb: \n\n' +
        '• Revenue increased 📈 by 75% \n' +
        '• Keeps data Safe 🛡 and Secure. \n' +
        "• Tracks fieldworker's 👨‍🔧 activity. \n" +
        '• Assign task/job to fieldworkers 👨‍🔧. \n' +
        '• Sends service reminder to customers 👨‍👨‍👧. \n\n' +
        'Download Now: \n\n https://bit.ly/3MZiwEJ',
    }).catch(() => {});
  };

  const topCards: SettingsRow[] = [
    {icon: 'phone-portrait-outline', title: 'App Tour'},
    {icon: 'star-outline', title: 'Rate Us', onPress: handleRateUs},
    {icon: 'thumbs-up-outline', title: 'Feedback', onPress: handleFeedback},
  ];

  const listItems: SettingsRow[] = [
    {icon: 'people-outline', title: 'Invite Friends', onPress: handleInviteFriends},
    {icon: 'card-outline', title: 'Bank Details & Tax', route: 'BankDetailsTax'},
    {icon: 'language-outline', title: 'Change Language'},
    {icon: 'document-text-outline', title: 'Terms & Condition', route: 'TermsAndConditions'},
    {icon: 'shield-checkmark-outline', title: 'Privacy Policy', route: 'PrivacyPolicy'},
    {icon: 'cash-outline', title: 'Refund Policy', route: 'RefundPolicy'},
    {icon: 'information-circle-outline', title: 'About Fieldweb', route: 'AboutFieldweb'},
  ];

  return <SettingsScreenBase topCards={topCards} listItems={listItems} />;
}
