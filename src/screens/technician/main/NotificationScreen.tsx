// src/screens/technician/main/NotificationScreen.tsx
import { View, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../../../theme/theme';
import { HEADER_TOP_PADDING, vs } from '../../../utils/responsive';

const { height } = Dimensions.get('window');

export default function NotificationScreen() {
  return (
    <View style={styles.root}>
      <View style={styles.redBg} />
      <View style={styles.whiteSheet} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  redBg: {
    top: 0,
    height: HEADER_TOP_PADDING + vs(15),
    backgroundColor: COLORS.primary,
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 10,
  },
});
