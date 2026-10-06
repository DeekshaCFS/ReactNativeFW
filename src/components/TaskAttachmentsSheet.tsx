// src/components/TaskAttachmentsSheet.tsx
//
// Java: TasksListAdapter.viewAttachmentPopup (dialog_view_attachment.xml + item_file_row.xml):
// a bottom sheet listing a task's posted documents, each with a green Download button.

import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Modal from './AppModal';
import { COLORS } from '../theme/theme';
import { ms, sp } from '../utils/responsive';
import type { GetPostedTaskDocFile } from '../api/taskList/taskList.types';

// FileListAdapter: DocumnetTypeId -> label.
const DOC_TYPE_LABEL: Record<number, string> = {
  0: 'NA',
  1: 'Invoice Copy',
  2: 'Selection Copy',
  3: 'Drawing Image',
  4: 'Product Picture',
};

const isImage = (name: string) => /\.(jpe?g|png)$/i.test(name);

type Props = {
  visible: boolean;
  taskName?: string;
  files: GetPostedTaskDocFile[];
  onClose: () => void;
  onDownload: (url: string) => void;
};

export default function TaskAttachmentsSheet({ visible, taskName, files, onClose, onDownload }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>
        <Pressable style={styles.close} onPress={onClose} hitSlop={8}>
          <Ionicons name="close-circle" size={ms(34)} color={COLORS.primary} />
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>{taskName || 'Files'}</Text>

        <ScrollView style={styles.list} showsVerticalScrollIndicator>
          {files.map((file, index) => {
            const name = file.OriginalFileName ?? '';
            const url = file.FilePath ?? '';
            return (
              <View key={file.FileId ?? index} style={styles.row}>
                <Text style={styles.srNo}>{index + 1}</Text>
                {isImage(name) && url ? (
                  <Image source={{ uri: url }} style={styles.fileIcon} />
                ) : (
                  <Ionicons name="document-attach-outline" size={ms(20)} color={COLORS.textBlack} style={styles.fileIconGlyph} />
                )}
                <Text style={styles.fileName} numberOfLines={1}>{name}</Text>
                <Text style={styles.fileType} numberOfLines={1}>
                  {DOC_TYPE_LABEL[file.DocumnetTypeId ?? 0] ?? ''}
                </Text>
                <Pressable style={styles.download} onPress={() => onDownload(url)}>
                  <Text style={styles.downloadText}>Download</Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  // CardView: 30dp top corners, white.
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: ms(30),
    borderTopRightRadius: ms(30),
    paddingHorizontal: ms(20),
    paddingTop: ms(10),
    paddingBottom: ms(20),
    maxHeight: '70%',
  },
  close: { position: 'absolute', top: ms(8), right: ms(8), zIndex: 2 },
  title: { margin: ms(5), paddingTop: ms(10), fontSize: sp(22), textAlign: 'center', color: COLORS.ink, marginHorizontal: ms(40) },
  list: { marginTop: ms(10) },
  row: { flexDirection: 'row', alignItems: 'center', padding: ms(10), marginBottom: ms(6) },
  srNo: { width: ms(40), textAlign: 'center', fontSize: sp(16), color: COLORS.textBlack },
  fileIcon: { width: ms(20), height: ms(20), marginRight: ms(10) },
  fileIconGlyph: { marginRight: ms(10) },
  fileName: { flex: 0.5, fontSize: sp(14), color: COLORS.textBlack },
  fileType: { flex: 1, textAlign: 'center', fontSize: sp(14), fontWeight: 'bold', color: '#888888' },
  download: {
    width: ms(80),
    height: ms(40),
    borderRadius: ms(34),
    backgroundColor: '#4EB54E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadText: { fontSize: sp(12), color: COLORS.white },
});
