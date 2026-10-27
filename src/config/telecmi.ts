// src/config/telecmi.ts
//
// TeleCMI "click to call" credentials (Java: TelCMI() in CountdownTechFragmentNew /
// StartTaskTrackingFragmentNew, which hard-codes appid / secret / from per build). Left empty on
// purpose, like the Google keys in maps.ts: fill them in (or wire them from a build-time env
// mechanism) before release. While empty, calls with the TeleCMI module on are not placed.
export const TELECMI_APP_ID = 0;
export const TELECMI_SECRET = '';
// Virtual number the call is bridged from, digits only incl. country code (Java: 917943446491).
export const TELECMI_FROM_NUMBER = '';
