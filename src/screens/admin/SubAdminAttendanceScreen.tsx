// src/screens/admin/SubAdminAttendanceScreen.tsx
//
// Sub-admin drawer "Attendance" (Java HomeActivityNew R.id.attendance -> PersonalLeaveTabHost):
// the user's own monthly attendance, with a "Leaves" tab next to it. Reuses the technician
// screens; their tab pills switch between the two here instead of navigating the technician
// tab navigator.
import { useState } from 'react';
import AttendanceScreen from '../technician/main/AttendanceScreen';
import LeaveScreen from '../technician/main/LeaveScreen';

export default function SubAdminAttendanceScreen() {
  const [tab, setTab] = useState<'attendance' | 'leave'>('attendance');

  if (tab === 'leave') {
    return <LeaveScreen onSwitchTab={() => setTab('attendance')} />;
  }
  return <AttendanceScreen onSwitchTab={() => setTab('leave')} />;
}