import React, { useState } from 'react';
import { ExportImageFormat, ExportImageScale } from '../model/erdImageExporter';

interface ExportImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportImageFormat, scale: ExportImageScale) => void;
  tableCount: number;
  connectorCount: number;
}

export const ExportImageModal: React.FC<ExportImageModalProps> = ({
  isOpen,
  onClose,
  onExport,
  tableCount,
  connectorCount,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportImageFormat>('svg');
  const [selectedScale, setSelectedScale] = useState<ExportImageScale>(2);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsExporting(true);
    try {
      await onExport(selectedFormat, selectedScale);
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="dbml-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-image-modal-title"
    >
      <div
        className="dbml-modal-card export-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="dbml-modal-header">
          <div className="dbml-modal-title-group">
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>
              image
            </span>
            <h3 id="export-image-modal-title" className="dbml-modal-title">
              ERD 다이어그램 이미지 내보내기
            </h3>
          </div>
          <button
            onClick={onClose}
            className="dbml-icon-btn"
            title="닫기"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="dbml-modal-body export-modal-body">
          {/* Format Selection Section */}
          <div className="export-section">
            <label className="export-section-label">1. 파일 포맷 선택</label>
            <div className="export-format-grid">
              {/* SVG Option */}
              <button
                type="button"
                className={`export-format-card ${selectedFormat === 'svg' ? 'active' : ''}`}
                onClick={() => setSelectedFormat('svg')}
              >
                <div className="export-card-top">
                  <span className="export-card-ext">SVG</span>
                  <span className="export-tag recommended">권장</span>
                </div>
                <div className="export-card-desc">
                  벡터 그래픽 · 무한 해상도
                </div>
                <div className="export-card-badge transparent">
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check</span>
                  투명 배경 (누끼)
                </div>
              </button>

              {/* PNG Option */}
              <button
                type="button"
                className={`export-format-card ${selectedFormat === 'png' ? 'active' : ''}`}
                onClick={() => setSelectedFormat('png')}
              >
                <div className="export-card-top">
                  <span className="export-card-ext">PNG</span>
                  <span className="export-tag">고화질</span>
                </div>
                <div className="export-card-desc">
                  무손실 래스터 · 범용 호환
                </div>
                <div className="export-card-badge transparent">
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check</span>
                  투명 배경 (누끼)
                </div>
              </button>

              {/* JPG Option */}
              <button
                type="button"
                className={`export-format-card ${selectedFormat === 'jpg' ? 'active' : ''}`}
                onClick={() => setSelectedFormat('jpg')}
              >
                <div className="export-card-top">
                  <span className="export-card-ext">JPG</span>
                  <span className="export-tag">웹 공유용</span>
                </div>
                <div className="export-card-desc">
                  압축 이미지 · 작은 용량
                </div>
                <div className="export-card-badge opaque">
                  다크 배경 채움
                </div>
              </button>
            </div>
          </div>

          {/* Scale / Resolution Section */}
          <div className="export-section">
            <div className="export-section-header">
              <label className="export-section-label">2. 해상도 배율 선택</label>
              {selectedFormat === 'svg' && (
                <span className="export-hint">SVG는 벡터 포맷으로 해상도 제한 없이 항상 선명합니다.</span>
              )}
            </div>

            <div className={`export-scale-group ${selectedFormat === 'svg' ? 'disabled' : ''}`}>
              <button
                type="button"
                disabled={selectedFormat === 'svg'}
                className={`export-scale-btn ${selectedScale === 1 ? 'active' : ''}`}
                onClick={() => setSelectedScale(1)}
              >
                <span className="scale-val">1x</span>
                <span className="scale-desc">표준 (Standard)</span>
              </button>

              <button
                type="button"
                disabled={selectedFormat === 'svg'}
                className={`export-scale-btn ${selectedScale === 2 ? 'active' : ''}`}
                onClick={() => setSelectedScale(2)}
              >
                <span className="scale-val">2x</span>
                <span className="scale-desc">고해상도 (Retina 2K)</span>
              </button>

              <button
                type="button"
                disabled={selectedFormat === 'svg'}
                className={`export-scale-btn ${selectedScale === 3 ? 'active' : ''}`}
                onClick={() => setSelectedScale(3)}
              >
                <span className="scale-val">3x</span>
                <span className="scale-desc">초고해상도 (4K Print)</span>
              </button>
            </div>
          </div>

          {/* Export Summary Box */}
          <div className="export-summary-box">
            <div className="summary-item">
              <span className="summary-label">내보낼 객체:</span>
              <span className="summary-val">{tableCount}개 테이블, {connectorCount}개 관계선</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">배경 투명도:</span>
              <span className="summary-val highlight">
                {selectedFormat === 'jpg' ? '다크 배경 채움 (JPG 포맷)' : '투명 배경 (누끼)'}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">출력 파일:</span>
              <span className="summary-val">schema-erd.{selectedFormat}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="dbml-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="dbml-btn"
            disabled={isExporting}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="dbml-btn primary"
            disabled={isExporting}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              file_download
            </span>
            <span>{isExporting ? '생성 중...' : '이미지 다운로드'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
