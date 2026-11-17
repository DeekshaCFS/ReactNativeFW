// src/utils/userRole.ts
//
// Role helpers shared by login, navigation and the check-in gate.
// Group ids mirror Java Constant.UserGroupId; login stores UserGroupCode under the
// AsyncStorage key `group_id` (see completeLogin.ts) next to the `role` name.
export const USER_GROUP_ID = {
  OWNER: 1,
  FIELDWORKER: 2,
  ZONEHEAD: 3,
  MANAGER: 4,
  SUBADMIN: 7,
} as const;

// "SubAdmin", "Sub Admin", "sub-admin" all normalise to "subadmin".
const normalise = (s?: string | null) => (s ?? '').toLowerCase().replace(/[^a-z]/g, '');

export const isSubAdmin = (role?: string | null, groupId?: number | string | null) =>
  Number(groupId) === USER_GROUP_ID.SUBADMIN || normalise(role) === 'subadmin';

export const isOwnerOrAdmin = (role?: string | null, groupId?: number | string | null) =>
  Number(groupId) === USER_GROUP_ID.OWNER || ['admin', 'owner'].includes(normalise(role));

// Roles that use the admin navigation shell (AdminStack / AdminTabs).
export const usesAdminShell = (role?: string | null, groupId?: number | string | null) =>
  isOwnerOrAdmin(role, groupId) || isSubAdmin(role, groupId);

// Java HomeActivityNew only runs the attendance check / check-out for non-owner roles;
// sub-admin is one of them, owner/admin is not.
export const needsCheckIn = (role?: string | null, groupId?: number | string | null) =>
  isSubAdmin(role, groupId);