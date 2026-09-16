//src/utils/profileCompletion.ts

import { UsersListResultData } from '../api/users/users.types';

export const calculateProfileCompletion = (
  profile: UsersListResultData | null,
) => {
  if (!profile) return 0;

  const fields = [
    profile.FirstName,
    profile.LastName,
    profile.ContactNo,
    profile.Email,
    profile.Address,
    profile.DOB,
    profile.Photo,
  ];

  const filled = fields.filter(
    field =>
      field !== null &&
      field !== undefined &&
      String(field).trim() !== '',
  ).length;

  return Math.round((filled / fields.length) * 100);
};