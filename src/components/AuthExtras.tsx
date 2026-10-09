// src/components/AuthExtras.tsx
//
// Pieces shared by the Login / Signup / OTP / Company Details screens that the
// Java layouts repeat: the WhatsApp + Video help images and the circular back
// arrow (ic_group_527).
import { View, Text, Pressable, Linking } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import { GlobalStyles } from '../styles/globalStyles';
import { dp } from '../utils/responsive';

const WHATSAPP_NUMBER = '+919315228028';
const HELP_VIDEO_URL = 'https://www.youtube.com/watch?v=zju3Ot7udf4';

export function AuthHelp({ topic }: { topic: 'logging in' | 'signing up' }) {
  const openWhatsapp = () => {
    const message = `Hello, I am having trouble ${topic === 'logging in' ? 'logging in to' : 'signing up in'} FieldWeb. Please help`;
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}/?text=${encodeURIComponent(message)}`).catch(() => {});
  };

  return (
    <>
      <Text style={GlobalStyles.helpText}>
        {topic === 'logging in' ? 'If you are having trouble Logging in' : 'If you are having trouble in Signup'}
      </Text>
      <View style={GlobalStyles.helpButtonsRow}>
        <Pressable style={[GlobalStyles.helpButton, GlobalStyles.whatsappButton]} onPress={openWhatsapp}>
          <Ionicons name="logo-whatsapp" size={dp(22)} color="#FFFFFF" />
          <Text style={GlobalStyles.helpButtonText}>WhatsApp</Text>
        </Pressable>
        <Pressable
          style={[GlobalStyles.helpButton, GlobalStyles.videoButton]}
          onPress={() => Linking.openURL(HELP_VIDEO_URL).catch(() => {})}
        >
          <Ionicons name="play-circle" size={dp(22)} color="#C22032" />
          <Text style={GlobalStyles.helpButtonText}>Video</Text>
        </Pressable>
      </View>
    </>
  );
}

export function AuthBackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ alignSelf: 'center', paddingBottom: dp(20) }} hitSlop={10}>
      <Svg width={dp(46)} height={dp(47)} viewBox="0 0 46 47">
        <Path
          d="M23,45.5695C35.1503,45.5695 45,35.7197 45,23.5695C45,11.4192 35.1503,1.5695 23,1.5695C10.8497,1.5695 1,11.4192 1,23.5695C1,35.7197 10.8497,45.5695 23,45.5695Z"
          stroke="#B3B7BF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none"
        />
        <Path
          d="M23.0002,14.7695L14.2002,23.5695L23.0002,32.3695"
          stroke="#B3B7BF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none"
        />
        <Path
          d="M31.8002,23.5695H14.2002"
          stroke="#B3B7BF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none"
        />
      </Svg>
    </Pressable>
  );
}
