// src/screens/technician/drawer/LeadsScreen.tsx
//
// Technician's own leads list (Java: LeadsFragmentForTechnician). Reuses the
// admin LeadListScreen -- list, search, status filter and detail view are
// identical for both roles -- with `technician` so its own Add Lead form
// submits through the technician endpoint (postExternalLeadFormByTech).

import React from 'react';
import { View } from 'react-native';
import LeadListScreen from '../../admin/LeadListScreen';
import { getCurrentUserId } from '../../../state/session';
import { COLORS } from '../../../theme/theme';
import { useAppHeaderHeight } from '../../../utils/responsive';

export default function LeadsScreen() {
  const headerHeight = useAppHeaderHeight();
  // The shared AppHeader is drawn over the top of this screen by TechnicianTabs.
  return (
    <View style={{ flex: 1, paddingTop: headerHeight, backgroundColor: COLORS.primary }}>
      <LeadListScreen userId={getCurrentUserId()} technician />
    </View>
  );
}
