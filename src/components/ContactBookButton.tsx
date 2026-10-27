import React from 'react';
import {Pressable, type StyleProp, type ViewStyle} from 'react-native';
import {ContactBookIcon} from './FabIcons';
import {ms} from '../utils/responsive';

type Props = {onPress: () => void; style?: StyleProp<ViewStyle>};

const ContactBookButton = ({onPress, style}: Props) => (
  <Pressable
    onPress={onPress}
    hitSlop={10}
    accessibilityRole="button"
    accessibilityLabel="Pick from contacts"
    style={style}>
    <ContactBookIcon size={ms(25)} />
  </Pressable>
);

export default ContactBookButton;