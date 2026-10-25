import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../../shared/i18n';

export const PdfViewHeader: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="pdf-header">
      <div className="pdf-title-group">
        <div className="pdf-title-row">
          <h1>{t('pdfTools.header.title')}</h1>
          <span className="pdf-badge">v1.2</span>
          <span className="pdf-badge">LOCAL-ISOLATED</span>
        </div>
        <p className="pdf-title-desc">{t('pdfTools.header.description')}</p>
      </div>

      <div
        className="pdf-telemetry-chip"
        title={t('pdfTools.header.telemetryTitle')}
      >
        <span className="status-dot" />
        <span className="status-code">ZERO-TELEMETRY</span>
      </div>
    </div>
  );
};

export default PdfViewHeader;
