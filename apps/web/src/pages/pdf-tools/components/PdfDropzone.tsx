import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import '../../../shared/i18n';

interface PdfDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  disabled?: boolean;
}

export const PdfDropzone: React.FC<PdfDropzoneProps> = ({
  onFilesSelected,
  multiple = true,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesSelected(droppedFiles);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      onFilesSelected(selectedFiles);
      // 같은 파일 재선택을 위해 value 리셋
      e.target.value = '';
    }
  };

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`pdf-dropzone ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={t('pdfTools.dropzone.ariaLabel')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="pdf-dropzone-input"
        accept="application/pdf,.pdf"
        multiple={multiple}
        onChange={handleFileChange}
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="pdf-dropzone-icon-box">
        <span className="material-symbols-outlined">upload_file</span>
      </div>

      <div className="pdf-dropzone-title">
        <span>{t('pdfTools.dropzone.dragPrompt')}</span>
        <span className="accent-text">
          {t('pdfTools.dropzone.browseFiles')}
        </span>
      </div>

      <p className="pdf-dropzone-desc">{t('pdfTools.dropzone.hint')}</p>
    </div>
  );
};

export default PdfDropzone;
