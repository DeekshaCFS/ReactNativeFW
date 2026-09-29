// src/screens/technician/drawer/LeadsScreen.tsx
//
// Technician's own leads list (Java: LeadsFragmentForTechnician). Reuses the
// admin LeadListScreen -- list, search, status filter and detail view are
// identical for both roles -- with `technician` so its own Add Lead form
// submits through the technician endpoint (postExternalLeadFormByTech).

import React from 'react';
import LeadListScreen from '../../admin/LeadListScreen';
import { getCurrentUserId } from '../../../state/session';

export default function LeadsScreen() {
  return <LeadListScreen userId={getCurrentUserId()} technician />;
}
