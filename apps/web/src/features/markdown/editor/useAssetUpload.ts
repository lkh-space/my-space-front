import { useState, useCallback } from 'react';
import { uploadAsset } from '../../../entities/markdown';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
  'image/gif',
];

interface UseAssetUploadOptions {
  onInsertMarkdown: (markdownText: string) => void;
}

export function useAssetUpload({ onInsertMarkdown }: UseAssetUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const processAndUploadFile = useCallback(
    async (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError('지원하지 않는 이미지 형식입니다. (PNG, JPG, WebP, SVG, GIF 지원)');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError('이미지 크기는 최대 10MB까지 가능합니다.');
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      try {
        const result = await uploadAsset(file);
        const imageMarkdown = `\n![${result.filename || 'image'}](${result.url})\n`;
        onInsertMarkdown(imageMarkdown);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.';
        setUploadError(msg);
      } finally {
        setIsUploading(false);
      }
    },
    [onInsertMarkdown],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent | ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processAndUploadFile(file);
            break;
          }
        }
      }
    },
    [processAndUploadFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent | DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          e.preventDefault();
          processAndUploadFile(files[i]);
          break;
        }
      }
    },
    [processAndUploadFile],
  );

  return {
    isUploading,
    uploadError,
    handlePaste,
    handleDrop,
    processAndUploadFile,
  };
}
