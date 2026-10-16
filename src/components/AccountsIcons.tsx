// ic_tickicon from the Java drawables.
import React from 'react';
import Svg, {Path} from 'react-native-svg';

export const TickIcon = ({size = 20, color = '#000'}: {size?: number; color?: string}) => (
  <Svg width={size} height={size} viewBox="0 0 90 90">
    <Path d="M69.36,69.36c-3.12,3.12 -6.83,5.64 -10.95,7.38S49.76,79.45 45,79.45s-9.29,-0.96 -13.41,-2.71s-7.83,-4.27 -10.95,-7.38S15,62.53 13.26,58.41S10.55,49.76 10.55,45s0.96,-9.29 2.71,-13.41s4.27,-7.83 7.38,-10.95s6.83,-5.64 10.95,-7.38s8.65,-2.71 13.41,-2.71s9.29,0.96 13.41,2.71s7.83,4.27 10.95,7.38" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M74.03,64.98L74.03,64.98c-1.27,0 -2.3,-1.03 -2.3,-2.3V51.85c0,-1.27 1.03,-2.3 2.3,-2.3l0,0c1.27,0 2.3,1.03 2.3,2.3v10.82C76.33,63.94 75.3,64.98 74.03,64.98z" fill={color} />
    <Path d="M66.31,57.26L66.31,57.26c0,-1.27 1.03,-2.3 2.3,-2.3h10.82c1.27,0 2.3,1.03 2.3,2.3v0c0,1.27 -1.03,2.3 -2.3,2.3H68.62C67.35,59.56 66.31,58.53 66.31,57.26z" fill={color} />
    <Path d="M30,45.82l9.45,10.69l40.95,-32.16" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// calender_invoice from the Java drawables (filled calendar, 24dp viewport).
export const CalendarInvoiceIcon = ({size = 24, color = '#000'}: {size?: number; color?: string}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M19,4h-1V2h-2v2H8V2H6v2H5C3.89,4 3.01,4.9 3.01,6L3,20c0,1.1 0.89,2 2,2h14c1.1,0 2,-0.9 2,-2V6C21,4.9 20.1,4 19,4zM19,20H5V10h14V20zM9,14H7v-2h2V14zM13,14h-2v-2h2V14zM17,14h-2v-2h2V14zM9,18H7v-2h2V18zM13,18h-2v-2h2V18zM17,18h-2v-2h2V18z"
      fill={color}
    />
  </Svg>
);
