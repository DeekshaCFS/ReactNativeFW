// src/screens/technician/drawer/SettingScreen.tsx
//
// Technician's Settings screen. Split from the admin variant
// (../../admin/AdminSettingScreen.tsx) -- Android's SettingsFragment hides
// "Invite Friends" for plain Fieldworkers (only Owner-tier roles see it),
// so this screen omits that row entirely rather than checking role at
// runtime. See SettingsScreenBase.tsx for the shared layout/styling.

import {useState} from 'react';
import {Linking, Platform} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import DeviceInfo from 'react-native-device-info';
import SettingsScreenBase, {type SettingsRow} from '../../../components/SettingsScreenBase';
import LanguagePickerModal from '../../../components/LanguagePickerModal';
import {setAppLanguage, type LanguageCode} from '../../../i18n';
import {useTour} from '../../../tour/TourContext';

// Java OnDemandTechAppTour + HomeActivityNew.OnDemandAppGuideForTech: profile
// completion card, then the Task tab, then the header menu button (which
// holds Issued Items/Expenditure in its drawer).
const TECH_APP_TOUR_STEPS = [
  {key: 'profileCompletion', titleKey: 'tourProfileTitle', descriptionKey: 'tourProfileDesc'},
  {key: 'taskTab', titleKey: 'tourTaskTitle', descriptionKey: 'tourTaskDesc'},
  {key: 'headerMenu', titleKey: 'tourMenuTitle', descriptionKey: 'tourMenuDesc'},
];

export default function SettingScreen() {
  const navigation = useNavigation<any>();
  const {t, i18n} = useTranslation();
  const {startTour} = useTour();
  const [langModalVisible, setLangModalVisible] = useState(false);

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

  // Java: cardView_AppTour navigates to the dashboard, then runs
  // OnDemandTechAppTour -> HomeActivityNew.OnDemandAppGuideForTech, a
  // TapTargetSequence over the profile card, Task tab and header menu.
  const handleAppTour = () => {
    navigation.navigate('Home');
    startTour(TECH_APP_TOUR_STEPS);
  };

  const handleSelectLanguage = (code: LanguageCode) => {
    setAppLanguage(code);
    setLangModalVisible(false);
  };

  const topCards: SettingsRow[] = [
    {icon: 'phone-portrait-outline', title: t('appTour'), onPress: handleAppTour},
    {icon: 'star-outline', title: t('rateUs'), onPress: handleRateUs},
    {icon: 'thumbs-up-outline', title: t('feedback'), onPress: handleFeedback},
  ];

  const listItems: SettingsRow[] = [
    {icon: 'language-outline', title: t('changeLanguage'), onPress: () => setLangModalVisible(true)},
    // Java: cardViewDeleteAccount has a click listener but its onClick case
    // body is empty (commented out) -- the row is a silent dead tap there
    // too, so no onPress here either.
    {icon: 'trash-outline', title: t('deleteAccount')},
    {icon: 'document-text-outline', title: t('termsCondition'), route: 'TermsAndConditions'},
    {icon: 'shield-checkmark-outline', title: t('privacyPolicy'), route: 'PrivacyPolicy'},
    {icon: 'cash-outline', title: t('refundPolicy'), route: 'RefundPolicy'},
    {icon: 'information-circle-outline', title: t('aboutFieldweb'), route: 'AboutFieldweb'},
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
    </>
  );
}
