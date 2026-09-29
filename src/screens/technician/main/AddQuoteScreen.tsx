// src/screens/technician/main/AddQuoteScreen.tsx
//
// Fieldworker "Add Quote" quick action (Java: HomeActivityNew.addQuoteInvFromTech("TQUOTE")
// -> AddUpdateServiceDialog.addQuoteTech). The form is the shared AddQuoteModal in its
// technician mode; this screen just hosts it and returns to the previous screen when the
// modal closes (saved or cancelled).

import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddQuoteModal from '../../admin/AddQuoteModal';
import { COLORS } from '../../../theme/theme';

export default function AddQuoteScreen({ navigation }: any) {
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const left = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem('owner_id').then(v => setOwnerId(Number(v) || 0));
  }, []);

  const close = () => {
    if (left.current) return;
    left.current = true;
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {ownerId !== null && (
        <AddQuoteModal technician visible ownerId={ownerId} onClose={close} />
      )}
    </View>
  );
}
