import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../../shared/i18n';

export const RuntimeEnvironmentCard: React.FC = () => {
  const { t } = useTranslation();

  // 로컬 런타임 상태 메트릭 (초기 정적/시뮬레이션 값)
  const cacheUsed = 128;
  const cacheMax = 512;
  const cachePercent = Math.round((cacheUsed / cacheMax) * 100);

  const memoryUsed = 412;
  const memoryMax = 2048;
  const memoryPercent = Math.round((memoryUsed / memoryMax) * 100);

  return (
    <div
      className="monitoring-card"
      aria-label={t('dashboard.runtime.panelAria')}
    >
      <div className="monitoring-card-header">
        <h2>
          <span className="material-symbols-outlined">
            memory
          </span>
          <span>{t('dashboard.runtime.title')}</span>
        </h2>
        <span className="runtime-status-tag">
          <span className="sidebar-status-dot runtime-status-dot" />
          ACTIVE
        </span>
      </div>

      <div className="runtime-content">
        {/* Metric 1: Cache */}
        <div className="metric-group">
          <div className="metric-header">
            <span className="metric-label">
              {t('dashboard.runtime.cacheLabel')}
            </span>
            <span className="metric-value">
              {cacheUsed} MB / {cacheMax} MB ({cachePercent}%)
            </span>
          </div>
          <div className="progress-track" role="progressbar" aria-valuenow={cachePercent} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-fill" style={{ width: `${cachePercent}%` }} />
          </div>
        </div>

        {/* Metric 2: Memory */}
        <div className="metric-group">
          <div className="metric-header">
            <span className="metric-label">
              {t('dashboard.runtime.heapLabel')}
            </span>
            <span className="metric-value">
              {memoryUsed} MB / {memoryMax} MB ({memoryPercent}%)
            </span>
          </div>
          <div className="progress-track" role="progressbar" aria-valuenow={memoryPercent} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-fill secondary" style={{ width: `${memoryPercent}%` }} />
          </div>
        </div>

        {/* Security & Isolation Box */}
        <div className="runtime-security-box">
          <div className="security-box-row">
            <span className="label">
              {t('dashboard.runtime.isolationLabel')}
            </span>
            <span className="val">Wasm & Native Sandbox</span>
          </div>
          <div className="security-box-row">
            <span className="label">{t('dashboard.runtime.ipcLabel')}</span>
            <span className="val green">127.0.0.1:4200 (Connected)</span>
          </div>
          <div className="security-box-row">
            <span className="label">
              {t('dashboard.runtime.telemetryLabel')}
            </span>
            <span className="val green">
              {t('dashboard.runtime.telemetryValue')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
