// src/screens/admin/AdminSettingScreen.tsx
//
// Admin/owner's Settings screen. Split from the technician variant
// (../technician/drawer/SettingScreen.tsx) -- Android's SettingsFragment
// shows "Invite Friends" only for Owner-tier roles, so this screen
// includes that row while the technician screen omits it entirely. See
// SettingsScreenBase.tsx for the shared layout/styling.

import {useState} from 'react';
import {Share, DeviceEventEmitter} from 'react-native';
import {useTour, type TourStep} from '../../tour/TourContext';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {AppTourIcon, RateUsIcon, ShareFeedbackIcon, LanguageIcon2, InviteFriendIcon, TermsIcon, PrivacyIcon, RefundIcon, AboutUsIcon, AccountsRowIcon} from '../../components/SettingsIcons';
import {DeleteAccIcon} from '../../components/JavaIcons';
import SettingsScreenBase, {type SettingsRow} from '../../components/SettingsScreenBase';
import LanguagePickerModal from '../../components/LanguagePickerModal';
import RateUsModal from '../../components/RateUsModal';
import {setAppLanguage, type LanguageCode} from '../../i18n';
import { tr } from '../../i18n/tr';

// Java HomeActivityNew.AppGuideForOwner_Skippable + OwnerDashboardFragment.OwnerAppTour_Skippable:
// + button, its first sheet row, Task tab, CRM tab, Employee tab, header menu, help icon, then
// the profile-completion card.
const ADMIN_APP_TOUR_STEPS: TourStep[] = [
  // Java OwnerAppTour: spotlight on +, tapping it opens the options sheet and spotlights its first row.
  {
    key: 'fab',
    titleKey: 'add_tech_create_task',
    descriptionKey: 'add_tech_create_task_desc',
    radius: 62,
    onExit: () => DeviceEventEmitter.emit('openFabSheet'),
  },
  {
    key: 'fabFirstRow',
    titleKey: 'title_add_tech',
    descriptionKey: 'title_add_tech',
    radius: 62,
    delayMs: 450,
    onExit: () => DeviceEventEmitter.emit('closeFabSheet'),
  },
  {key: 'taskTab', titleKey: 'app_tour_manage_task_title_owner', descriptionKey: 'app_tour_manage_task_desc_owner'},
  {key: 'crmTab', titleKey: 'manage_crm', descriptionKey: 'crm_desc'},
  {key: 'employeeTab', titleKey: 'manage_amc', descriptionKey: 'manage_amc_desc'},
  {key: 'headerMenu', titleKey: 'manage_expense_assigned_items', descriptionKey: 'manage_expense_assigned_items_desc'},
  {key: 'headerHelp', titleKey: 'help_and_support_tour', descriptionKey: 'help_and_support_tour', radius: 30},
  {key: 'profileCompletion', titleKey: 'profile', descriptionKey: 'complete_ur_profile', fixed: {x: 0.2, y: 0.158}, textPosition: 'below'},
];

export default function AdminSettingScreen() {
  const {startTour} = useTour();
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

  // Java: cardView_AppTour -> dashboard, then the TapTargetSequence above.
  const handleAppTour = () => {
    navigation.navigate('Home');
    startTour(ADMIN_APP_TOUR_STEPS);
  };

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
    {icon: AppTourIcon, iconSize: 30, title: t('appTour'), onPress: handleAppTour},
    {icon: RateUsIcon, iconSize: 30, title: t('rateUs'), onPress: handleRateUs},
    {icon: ShareFeedbackIcon, iconSize: 40, title: t('feedback'), onPress: handleFeedback},
  ];

  // Order matches Java fragment_settings.xml: change lang, invite friends,
  // delete account, terms, privacy, refund, about, then the bank/accounts
  // row last.
  const listItems: SettingsRow[] = [
    {icon: LanguageIcon2, iconSize: 30, title: t('changeLanguage'), onPress: () => setLangModalVisible(true)},
    {icon: InviteFriendIcon, iconSize: 30, title: t('inviteFriends'), onPress: handleInviteFriends},
    // Java: cardViewDeleteAccount has a click listener but its onClick case
    // body is empty (commented out) -- the row is a silent dead tap there
    // too, so no onPress here either.
    {icon: DeleteAccIcon, iconSize: 30, title: t('deleteAccount')},
    {icon: TermsIcon, iconSize: 30, title: t('termsCondition'), route: 'TermsAndConditions'},
    {icon: PrivacyIcon, iconSize: 30, title: t('privacyPolicy'), route: 'PrivacyPolicy'},
    {icon: RefundIcon, iconSize: 30, title: t('refundPolicy'), route: 'RefundPolicy'},
    {icon: AboutUsIcon, iconSize: 30, title: t('aboutFieldweb'), route: 'AboutFieldweb'},
    // Java: cardView_bank row's label is hardcoded "Accounts" in the layout
    // XML (not a @string resource), so unlike every other row it does NOT
    // change with the selected language -- stays "Accounts" in every
    // locale, matching Java exactly. Icon is ic_miscellaneous_settings (a
    // bank/columns glyph); same BankDetailsAndTaxFragmentTabHost target.
    {icon: AccountsRowIcon, iconSize: 28, title: tr('Accounts'), route: 'BankDetailsTax'},
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
