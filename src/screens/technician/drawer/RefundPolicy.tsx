// src/screens/technician/drawer/RefundPolicy.tsx
import React from 'react';
import WebPageFrame from '../../../components/WebPageFrame';

const REFUND_POLICY_URL = 'https://www.thefieldweb.com/refund-policy'; // Java: RefundPolicyFragment

export default function RefundPolicyScreen() {
  return <WebPageFrame uri={REFUND_POLICY_URL} />;
}
