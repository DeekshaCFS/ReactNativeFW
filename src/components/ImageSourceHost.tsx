// src/components/ImageSourceHost.tsx
//
// One place for the "Select Image Source" (Camera / Gallery) chooser. Screens call
// showImageSourceDialog(onCamera, onGallery) instead of building their own Alert or sheet, so the
// dialog looks and behaves the same everywhere (the Java AlertDialog list, see ImageSourceDialog).
// <ImageSourceHost /> is mounted once at the app root.

import React, { useEffect, useState } from 'react';
import ImageSourceDialog from './ImageSourceDialog';

type Request = { onCamera: () => void; onGallery: () => void; title?: string };

let open: ((request: Request) => void) | null = null;

export const showImageSourceDialog = (onCamera: () => void, onGallery: () => void, title?: string) => {
  open?.({ onCamera, onGallery, title });
};

export default function ImageSourceHost() {
  const [request, setRequest] = useState<Request | null>(null);

  useEffect(() => {
    open = setRequest;
    return () => {
      open = null;
    };
  }, []);

  const choose = (pick: 'onCamera' | 'onGallery') => {
    const current = request;
    setRequest(null);
    // Let the dialog close before the camera / gallery opens.
    if (current) setTimeout(() => current[pick](), 0);
  };

  return (
    <ImageSourceDialog
      visible={!!request}
      title={request?.title}
      onCamera={() => choose('onCamera')}
      onGallery={() => choose('onGallery')}
      onClose={() => setRequest(null)}
    />
  );
}
