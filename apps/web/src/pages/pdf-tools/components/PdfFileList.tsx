import React from 'react';
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
  if (files.length === 0) return null;

  return (
    <div className="pdf-file-list-card">
      <div className="pdf-file-list-header">
        <h3>
          <span className="material-symbols-outlined">inventory_2</span>
          <span>선택된 파일 ({files.length}개)</span>
        </h3>
        <button
          type="button"
          className="header-action-btn"
          onClick={onClearFiles}
          title="선택된 모든 파일 제거"
        >
          <span className="material-symbols-outlined">delete_sweep</span>
          <span>모두 비우기</span>
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
