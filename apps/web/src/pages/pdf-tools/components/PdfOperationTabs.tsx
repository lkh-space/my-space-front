import React from 'react';
import { PdfOperationMode, PDF_OPERATION_METAS } from '../types';

interface PdfOperationTabsProps {
  currentMode: PdfOperationMode;
  onModeChange: (mode: PdfOperationMode) => void;
}

export const PdfOperationTabs: React.FC<PdfOperationTabsProps> = ({
  currentMode,
  onModeChange,
}) => {
  const modes = Object.values(PDF_OPERATION_METAS);

  return (
    <div
      className="pdf-tabs-panel"
      role="tablist"
      aria-label="PDF 작업 모드 선택"
    >
      {modes.map((meta) => {
        const isActive = currentMode === meta.id;
        return (
          <button
            key={meta.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`pdf-tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onModeChange(meta.id)}
          >
            <span className="material-symbols-outlined">{meta.icon}</span>
            <span>{meta.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
};

export default PdfOperationTabs;
