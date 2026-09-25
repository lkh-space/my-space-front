import React from 'react';
import { Link } from 'react-router-dom';
import { INSTALLED_UTILITIES } from '../../../shared/constants/navigation';

export const InstalledUtilitiesGrid: React.FC = () => {
  return (
    <section aria-label="설치된 로컬 유틸리티 그리드">
      <div className="bento-grid">
        {INSTALLED_UTILITIES.map((util) => {
          const iconThemeClass = util.id.startsWith('pdf')
            ? 'pdf'
            : util.id.startsWith('dbml')
            ? 'dbml'
            : 'markdown';

          const cardTitle = util.utilityTitle ?? util.title;

          return (
            <Link
              key={util.id}
              to={util.path}
              className="utility-card"
              aria-label={`${cardTitle} 열기`}
            >
              <div className="utility-card-top">
                <div className={`utility-icon-box ${iconThemeClass}`}>
                  <span className="material-symbols-outlined">
                    {util.icon}
                  </span>
                </div>
                {util.badge && <span className="utility-badge">{util.badge}</span>}
              </div>

              <h2 className="utility-title">{cardTitle}</h2>
              {util.description && <p className="utility-desc">{util.description}</p>}

              <div className="utility-footer">
                <span>{util.lastUsed}</span>
                <span className="utility-action-link">
                  <span>도구 열기</span>
                  <span className="material-symbols-outlined">
                    arrow_forward
                  </span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
