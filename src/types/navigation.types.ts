// src/types/navigation.types.ts
//
// Central re-export point for the per-stack param list types that already
// exist in navigation/TechStack.tsx and navigation/AdminStack.tsx, so screens
// can `import type { TechnicianStackParamList } from '../../types/navigation.types'`
// instead of reaching into the navigation folder directly.
//
// NOTE: navigation/AuthStack.tsx does not currently export a typed param list
// (its Stack.Navigator is untyped) — add one there first if you want an
// AuthStackParamList here too.
//
// NOTE: 9 screens currently type their `{ navigation, route }` props as `any`
// rather than using these param lists (e.g. TaskExecutionScreen.tsx,
// TaskClosureScreen.tsx). Re-typing those is a good follow-up but is a
// behavior-preserving typing change best done screen-by-screen, not bundled
// into this structural move.
export type { TechnicianStackParamList } from '../navigation/TechStack';
export type { AdminStackParamList } from '../navigation/AdminStack';
