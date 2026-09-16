// src/types/user.types.ts
//
// SCAFFOLD. Session data today is just three separate AsyncStorage string
// keys ('token', 'role', 'uid') read independently in RootNavigator.tsx and
// DrawerNavigator.tsx — there's no single "current user" object yet. This
// type describes what a consolidated session shape could look like if/when
// context/AuthContext.tsx is adopted; the richer profile fields mirror
// RegisterUserResultData in api/auth/login.types.ts.
import type { RegisterUserResultData } from '../api/auth/login.types';

export type UserRole = 'technician' | 'admin' | 'owner';

export interface SessionUser {
  token: string;
  userId: string;
  role: UserRole;
  profile?: Partial<RegisterUserResultData>;
}
