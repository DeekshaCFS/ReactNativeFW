// src/components/DialogIcons.tsx
//
// drawable/ic_upload_photo (36dp in the task photo dialogs), generated from the Android vector.
import React from 'react';
import Svg, { Path } from 'react-native-svg';

export const UploadPhotoIcon = ({ size = 36 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 27 27">
    <Path d="M27,13.5C27,20.9558 20.9558,27 13.5,27C6.0442,27 0,20.9558 0,13.5C0,6.0442 6.0442,0 13.5,0C20.9558,0 27,6.0442 27,13.5Z" fill="#C3002F" />
    <Path d="M19,15.3333V17.7778C19,18.1019 18.8712,18.4128 18.642,18.642C18.4128,18.8712 18.1019,19 17.7778,19H9.2222C8.8981,19 8.5872,18.8712 8.358,18.642C8.1288,18.4128 8,18.1019 8,17.7778V15.3333" fill="none" stroke="#ffffff" strokeWidth={1.5} />
    <Path d="M16.5559,11.0556L13.5004,8L10.4448,11.0556" fill="none" stroke="#ffffff" strokeWidth={1.5} />
    <Path d="M13.5,8V15.3333" fill="none" stroke="#ffffff" strokeWidth={1.5} />
  </Svg>
);

// drawable/ic_upload_attachment (Item Request attachment box): white disc, red tray + arrow.
export const UploadAttachmentIcon = ({ size = 27 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 27 27">
    <Path d="M27,13.5C27,20.9558 20.9558,27 13.5,27C6.0442,27 0,20.9558 0,13.5C0,6.0442 6.0442,0 13.5,0C20.9558,0 27,6.0442 27,13.5Z" fill="#ffffff" />
    <Path d="M19,15.3333V17.7778C19,18.1019 18.8712,18.4128 18.642,18.642C18.4128,18.8712 18.1019,19 17.7778,19H9.2222C8.8981,19 8.5872,18.8712 8.358,18.642C8.1288,18.4128 8,18.1019 8,17.7778V15.3333" fill="none" stroke="#C3002F" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16.5559,11.0556L13.5004,8L10.4448,11.0556" fill="none" stroke="#C3002F" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.5,8V15.3333" fill="none" stroke="#C3002F" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// drawable/pencil_edit_icon (Profile avatar edit badge): red circle with a white edit/pencil glyph.
export const PencilEditIcon = ({ size = 40 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 90 90">
    <Path
      fill="#C22032"
      d="M45.1,45.5m-40.6,0a40.6,40.6 0,1 1,81.2 0a40.6,40.6 0,1 1,-81.2 0"
    />
    <Path
      fill="#FFFFFF"
      d="M27.1,71.6c-4.9,0 -8.9,-4 -8.9,-8.9V31.1c0,-5.1 3.8,-8.8 8.9,-8.8h19.6c1.4,0 2.6,1.2 2.6,2.6c0,1.4 -1.2,2.6 -2.6,2.6H27.1c-2.3,0 -3.6,1.4 -3.6,3.7v31.4c0,2.4 1.3,3.7 3.6,3.7h31.3c2.3,0 3.6,-1.4 3.6,-3.7V46.8c0,-1.5 1.2,-2.7 2.7,-2.7c1.5,0 2.7,1.2 2.7,2.7v15.9c0,4.9 -4,8.9 -8.9,8.9H27.1z"
    />
    <Path
      fill="#FFFFFF"
      d="M37.7,53.9c0.1,-0.5 0.2,-1.2 0.3,-1.7c0.2,-0.9 0.2,-1.2 0.2,-1.4c0.2,-1.2 0.5,-2.4 0.8,-3.5c0.3,-1.2 0.6,-2.4 0.8,-3.6c0.5,-2.4 1.5,-4.3 3.5,-6.1c3.6,-3.6 7.4,-7.4 11.2,-11.1l4.6,-4.7c1.5,-1.5 3.4,-2.3 5.4,-2.3c2,0 3.9,0.8 5.3,2.2c3,3 2.9,7.7 -0.1,10.7l-1.8,1.8c-3.4,3.5 -7,7.1 -10.5,10.5c-1.8,1.7 -3.5,3.5 -5.3,5.3c-0.5,0.5 -1.2,0.9 -2.1,1.2l-7.5,1.8L37.7,53.9zM42.7,43.1c-0.4,2 -0.9,4.1 -1.5,6.3l-0.3,1.1l1.1,-0.3c2.2,-0.6 4.3,-1 6.3,-1.5l1.2,-0.3l-0.8,-0.9l-5.7,-5.7L42.7,43.1zM64.5,24c-0.8,0 -1.6,0.3 -2.2,0.9L46.2,41l4.2,4.2L63.5,32c0.2,-0.2 0.5,-0.5 0.7,-0.7c0.5,-0.5 0.9,-0.9 1.4,-1.4c0.1,-0.1 0.2,-0.2 0.3,-0.3c0.8,-0.7 1.8,-1.7 1.6,-3C67.3,25.1 66.1,24 64.5,24z"
    />
  </Svg>
);

// drawable/fw_edit_profile_icon (Contact No / E-Mail edit glyph): plain red document+pencil, no
// background circle, overlaid at the top-right corner of the field it edits.
export const EditFieldIcon = ({ size = 22 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 90 90">
    <Path
      fill="#C22032"
      d="M18.1,83.2C10.9,83.2 5,77.3 5,70.1V24c0,-7.4 5.5,-12.9 13.1,-12.9h28.7c2.1,0 3.8,1.7 3.8,3.8c0,2.1 -1.7,3.8 -3.8,3.8H18.1c-3.3,0 -5.3,2 -5.3,5.5v46c0,3.5 1.9,5.5 5.3,5.5h45.7c3.3,0 5.3,-2 5.3,-5.5V46.9c0,-2.2 1.8,-3.9 3.9,-3.9c2.2,0 3.9,1.8 3.9,3.9v23.2c0,7.2 -5.9,13.1 -13.1,13.1H18.1z"
    />
    <Path
      fill="#C22032"
      d="M33.6,57.3c0.1,-0.8 0.3,-1.7 0.4,-2.4c0.2,-1.3 0.3,-1.8 0.3,-2.1c0.3,-1.7 0.7,-3.5 1.2,-5.2c0.4,-1.8 0.9,-3.6 1.2,-5.3c0.7,-3.5 2.2,-6.3 5.1,-9c5.3,-5.3 10.8,-10.8 16.4,-16.2l6.7,-6.9c2.2,-2.2 5,-3.4 7.9,-3.4c2.9,0 5.7,1.2 7.7,3.2c4.3,4.3 4.2,11.2 -0.2,15.7l-2.6,2.6c-5,5.2 -10.3,10.4 -15.3,15.4c-2.6,2.6 -5.2,5.1 -7.8,7.7C54.1,52 53,52.6 51.7,53l-10.9,2.6L33.6,57.3zM40.9,41.5c-0.6,2.9 -1.3,6 -2.1,9.2l-0.4,1.6l1.6,-0.4c3.2,-0.9 6.2,-1.5 9.2,-2.1l1.7,-0.4l-1.2,-1.2l-8.4,-8.4L40.9,41.5zM72.9,13.6c-1.2,0 -2.4,0.5 -3.2,1.3L46.1,38.4l6.1,6.1l19.2,-19.2c0.4,-0.4 0.7,-0.7 1.1,-1c0.7,-0.7 1.4,-1.3 2,-2c0.1,-0.1 0.3,-0.3 0.5,-0.4c1.1,-1 2.6,-2.5 2.4,-4.4C77,15.1 75.1,13.6 72.9,13.6z"
    />
  </Svg>
);
