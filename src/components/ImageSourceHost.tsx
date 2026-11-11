// src/components/ImageSourceHost.tsx
import React, { useEffect, useRef, useState } from 'react';
import ImageSourceDialog from './ImageSourceDialog';

type Request = { onCamera: () => void; onGallery: () => void; title?: string };

let open: ((request: Request) => void) | null = null;

export const showImageSourceDialog = (onCamera: () => void, onGallery: () => void, title?: string) => {
  open?.({ onCamera, onGallery, title });
};

export default function ImageSourceHost() {
  const [request, setRequest] = useState<Request | null>(null);
  const pendingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    open = setRequest;
    return () => {
      open = null;
    };
  }, []);

  const choose = (pick: 'onCamera' | 'onGallery') => {
    if (!request) return;
    pendingRef.current = request[pick];
    setRequest(null); // closes the dialog; the action runs in handleDismiss
  };

  // Fires only after the modal is fully gone, so the native picker / permission alert can present.
  const handleDismiss = () => {
    const action = pendingRef.current;
    pendingRef.current = null;
    action?.();
  };

  return (
    <ImageSourceDialog
      visible={!!request}
      title={request?.title}
      onCamera={() => choose('onCamera')}
      onGallery={() => choose('onGallery')}
      onClose={() => {
        pendingRef.current = null;
        setRequest(null);
      }}
      onDismiss={handleDismiss}
    />
  );
}