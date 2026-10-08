// src/components/LanguagePickerModal.tsx
//
// Matches Java's dialog_change_language.xml + language_list_item.xml
// exactly: a bottom sheet with a title, divider, scrollable language list
// (checkmark on the selected row) and a centered Cancel button.

import {Modal, View, StyleSheet, Text, Pressable, ScrollView} from 'react-native';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {COLORS} from '../theme/theme';
import {ms, sp} from '../utils/responsive';
import {LANGUAGES, type LanguageCode} from '../i18n/languages';

type Props = {
  visible: boolean;
  selected: LanguageCode;
  onSelect: (code: LanguageCode) => void;
  onCancel: () => void;
};

export default function LanguagePickerModal({visible, selected, onSelect, onCancel}: Props) {
  const {t} = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('changeLanguage')}</Text>
          <View style={styles.divider} />

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {LANGUAGES.map(lang => (
              <Pressable
                key={lang.code}
                onPress={() => onSelect(lang.code)}
                style={({pressed}) => [styles.row, pressed && styles.rowPressed]}
              >
                <Text style={styles.rowText}>{lang.label}</Text>
                {lang.code === selected && (
                  <Ionicons name="checkmark" size={scale22} color={COLORS.primary} />
                )}
              </Pressable>
            ))}
          </ScrollView>

          <Pressable onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>{t('cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const scale22 = ms(22);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    paddingHorizontal: ms(20),
    paddingTop: ms(20),
    paddingBottom: ms(20),
    maxHeight: '75%',
  },
  title: {
    fontSize: sp(20),
    color: '#000',
    paddingLeft: ms(10),
    paddingTop: ms(5),
    marginBottom: ms(10),
  },
  divider: {
    height: 1,
    backgroundColor: '#BDBDBD',
    marginBottom: ms(10),
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(10),
    paddingVertical: ms(10),
  },
  rowPressed: {
    backgroundColor: '#FFE5EA',
  },
  rowText: {
    fontSize: sp(20),
    color: '#000',
  },
  cancelButton: {
    alignSelf: 'center',
    marginTop: ms(10),
    paddingVertical: ms(6),
    paddingHorizontal: ms(12),
  },
  cancelText: {
    fontSize: sp(18),
    color: COLORS.primary,
  },
});
