import React, {useCallback, useState} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import Pdf from 'react-native-pdf';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Modal from '../components/AppModal';
import {COLORS} from '../theme/theme';
import {showFailureMsg} from '../utils/toast';
import {toUserMessage} from '../utils/userErrorMessage';

const sanitize = (name: string) =>
  name.replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 60) || 'document';

const getExtension = (url: string) => {
  const match = url.split('?')[0].match(/\.([a-zA-Z0-9]{2,5})$/);
  return match ? match[1].toLowerCase() : 'bin';
};

// The server URL may not end in .pdf, so check the file's first bytes instead.
const isPdfFile = async (path: string) => {
  try {
    return (await RNFS.read(path, 4, 0, 'ascii')) === '%PDF';
  } catch {
    return false;
  }
};

const openWithDevice = (path: string, title: string) =>
  FileViewer.open(path, {
    showOpenWithDialog: true,
    showAppsSuggestions: true,
    displayName: title,
  });

export const usePdfDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [viewer, setViewer] = useState<{path: string; title: string} | null>(null);

  // Downloads the file with a progress overlay. PDFs open in the in-app viewer.
  // Any other file opens in the device's own apps (the "Open with" chooser).
  const openFile = useCallback(async (url: string, title = 'Document') => {
    const source = url?.trim();
    if (!source) {
      showFailureMsg('File is not available.');
      return;
    }

    const base = `${RNFS.CachesDirectoryPath}/${sanitize(title)}_${Date.now()}`;
    const tempPath = `${base}.download`;
    setPercent(0);
    setIsDownloading(true);
    try {
      const result = await RNFS.downloadFile({
        fromUrl: source,
        toFile: tempPath,
        progressDivider: 5,
        progress: res =>
          setPercent(
            res.contentLength > 0
              ? Math.round((res.bytesWritten / res.contentLength) * 100)
              : 0,
          ),
      }).promise;

      if (!result.statusCode || result.statusCode < 200 || result.statusCode >= 300) {
        throw new Error('Could not download the file.');
      }

      const isPdf = await isPdfFile(tempPath);
      const finalPath = `${base}.${isPdf ? 'pdf' : getExtension(source)}`;
      await RNFS.moveFile(tempPath, finalPath);

      if (isPdf) {
        setViewer({path: finalPath, title});
      } else {
        await openWithDevice(finalPath, title);
      }
    } catch (error: unknown) {
      showFailureMsg(
        toUserMessage(
          error,
          'Could not open the file. Please check your internet connection and try again.',
        ),
      );
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const modals = (
    <>
      {/* Loading buffer shown while the document downloads. */}
      <Modal visible={isDownloading} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              {percent > 0 ? `Downloading ${percent}%` : 'Downloading...'}
            </Text>
          </View>
        </View>
      </Modal>

      {/* In-app PDF viewer, with a device "Open with" option in the header. */}
      <Modal
        visible={viewer !== null}
        animationType="slide"
        onRequestClose={() => setViewer(null)}>
        {viewer ? (
          <View style={styles.viewerRoot}>
            <View style={styles.viewerHeader}>
              <Pressable onPress={() => setViewer(null)} hitSlop={10}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.viewerTitle} numberOfLines={1}>
                {viewer.title}
              </Text>
              <Pressable
                hitSlop={10}
                onPress={() =>
                  openWithDevice(viewer.path, viewer.title).catch(() =>
                    showFailureMsg('No app on this device can open this file.'),
                  )
                }>
                <Ionicons name="open-outline" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
            <Pdf
              source={{uri: `file://${viewer.path}`, cache: false}}
              style={styles.pdf}
              onError={() => showFailureMsg('Could not display this PDF.')}
            />
          </View>
        ) : null}
      </Modal>
    </>
  );

  return {openFile, isDownloading, modals};
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#222222',
  },
  viewerRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  viewerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  pdf: {
    flex: 1,
  },
});