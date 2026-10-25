import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../../shared/i18n';
import { SelectedPdfFile } from '../types';
import { PdfFileCard } from './PdfFileCard';

interface PdfFileListProps {
  files: SelectedPdfFile[];
  onRemoveFile: (id: string) => void;
  onClearFiles: () => void;
  onPasswordChange?: (id: string, password: string) => void;
}

export const PdfFileList: React.FC<PdfFileListProps> = ({
  files,
  onRemoveFile,
  onClearFiles,
  onPasswordChange,
}) => {
  const { t } = useTranslation();
  if (files.length === 0) return null;

  return (
    <div className="pdf-file-list-card">
      <div className="pdf-file-list-header">
        <h3>
          <span className="material-symbols-outlined">inventory_2</span>
          <span>
            {t('pdfTools.fileList.selectedCount', { count: files.length })}
          </span>
        </h3>
        <button
          type="button"
          className="header-action-btn"
          onClick={onClearFiles}
          title={t('pdfTools.fileList.clearAllTitle')}
        >
          <span className="material-symbols-outlined">delete_sweep</span>
          <span>{t('pdfTools.fileList.clearAllBtn')}</span>
        </button>
      </div>

      <div className="pdf-files-container">
        {files.map((file) => (
          <PdfFileCard
            key={file.id}
            file={file}
            onRemove={onRemoveFile}
            onPasswordChange={onPasswordChange}
          />
        ))}
      </div>
    </div>
  );
};

export default PdfFileList;
