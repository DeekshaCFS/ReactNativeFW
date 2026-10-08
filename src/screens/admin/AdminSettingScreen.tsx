// src/screens/admin/AdminSettingScreen.tsx
//
// Admin/owner's Settings screen. Split from the technician variant
// (../technician/drawer/SettingScreen.tsx) -- Android's SettingsFragment
// shows "Invite Friends" only for Owner-tier roles, so this screen
// includes that row while the technician screen omits it entirely. See
// SettingsScreenBase.tsx for the shared layout/styling.

import {useState} from 'react';
import {Share} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import SettingsScreenBase, {type SettingsRow} from '../../components/SettingsScreenBase';
import LanguagePickerModal from '../../components/LanguagePickerModal';
import RateUsModal from '../../components/RateUsModal';
import {setAppLanguage, type LanguageCode} from '../../i18n';

export default function AdminSettingScreen() {
  const navigation = useNavigation<any>();
  const {t, i18n} = useTranslation();
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [rateUsVisible, setRateUsVisible] = useState(false);

  // Java: card_RateUs -> HomeActivityNew.PlayStoreRatingDialog, a bottom
  // sheet with Rate Now / No Thanks / Remind Later (not a direct store link).
  const handleRateUs = () => setRateUsVisible(true);

  // Java: card_ShareFeedback -> SuggestionFeedbackFragment, a WebView on
  // thefieldweb.com/contact (not a mailto link).
  const handleFeedback = () => navigation.navigate('Feedback');

  // Java: cardView_AppTour navigates back to the dashboard (and would kick
  // off a TapTarget tour there, which isn't ported). Match the navigation.
  const handleAppTour = () => navigation.navigate('Home');

  const handleSelectLanguage = (code: LanguageCode) => {
    setAppLanguage(code);
    setLangModalVisible(false);
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
    {icon: 'phone-portrait-outline', title: t('appTour'), onPress: handleAppTour},
    {icon: 'star-outline', title: t('rateUs'), onPress: handleRateUs},
    {icon: 'thumbs-up-outline', title: t('feedback'), onPress: handleFeedback},
  ];

  // Order matches Java fragment_settings.xml: change lang, invite friends,
  // delete account, terms, privacy, refund, about, then the bank/accounts
  // row last.
  const listItems: SettingsRow[] = [
    {icon: 'language-outline', title: t('changeLanguage'), onPress: () => setLangModalVisible(true)},
    {icon: 'people-outline', title: t('inviteFriends'), onPress: handleInviteFriends},
    // Java: cardViewDeleteAccount has a click listener but its onClick case
    // body is empty (commented out) -- the row is a silent dead tap there
    // too, so no onPress here either.
    {icon: 'trash-outline', title: t('deleteAccount')},
    {icon: 'document-text-outline', title: t('termsCondition'), route: 'TermsAndConditions'},
    {icon: 'shield-checkmark-outline', title: t('privacyPolicy'), route: 'PrivacyPolicy'},
    {icon: 'cash-outline', title: t('refundPolicy'), route: 'RefundPolicy'},
    {icon: 'information-circle-outline', title: t('aboutFieldweb'), route: 'AboutFieldweb'},
    // Java: cardView_bank row's label is hardcoded "Accounts" in the layout
    // XML (not a @string resource), so unlike every other row it does NOT
    // change with the selected language -- stays "Accounts" in every
    // locale, matching Java exactly. Icon is ic_miscellaneous_settings (a
    // bank/columns glyph); same BankDetailsAndTaxFragmentTabHost target.
    {icon: 'business-outline', title: 'Accounts', route: 'BankDetailsTax'},
  ];

  return (
    <>
      <SettingsScreenBase topCards={topCards} listItems={listItems} />
      <LanguagePickerModal
        visible={langModalVisible}
        selected={i18n.language as LanguageCode}
        onSelect={handleSelectLanguage}
        onCancel={() => setLangModalVisible(false)}
      />
      <RateUsModal visible={rateUsVisible} onClose={() => setRateUsVisible(false)} />
    </>
  );
}
