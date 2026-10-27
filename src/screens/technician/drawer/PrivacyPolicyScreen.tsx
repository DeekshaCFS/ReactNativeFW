// src/screens/technician/drawer/PrivacyPolicyScreen.tsx
import React from 'react';
import WebPageFrame from '../../../components/WebPageFrame';

// Java: R.string.policy_url. The same screen also serves Terms & Conditions and Feedback; pass `url` as a route param.
export const PRIVACY_POLICY_URL = 'https://fieldweb.co.in/privacy-policy';
export const TERMS_AND_CONDITIONS_URL = 'https://www.thefieldweb.com/terms-and-conditions';
// Java: SettingsFragment's Feedback row -> SuggestionFeedbackFragment.
export const FEEDBACK_URL = 'https://www.thefieldweb.com/contact';

export default function PrivacyPolicyScreen({ route }: any) {
  return <WebPageFrame uri={route?.params?.url ?? PRIVACY_POLICY_URL} />;
}
