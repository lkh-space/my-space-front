import React from 'react';
import { Link } from 'react-router-dom';
import { InstalledUtility } from '../../../shared/types/dashboard';

const UTILITIES: InstalledUtility[] = [
  {
    id: 'pdf-tools',
    title: 'PDF 처리 엔진',
    titleEn: 'PDF Processing Engine',
    description: 'PDF 문서 병합, 페이지 분할, 메타데이터 제거 및 로컬 최적화 처리',
    icon: 'picture_as_pdf',
    path: '/pdf-tools',
    statusTag: 'ACTIVE',
    lastUsed: '12분 전 사용',
    version: 'v1.2',
  },
  {
    id: 'dbml-tools',
    title: 'DBML 스키마 변환기',
    titleEn: 'DBML Schema Converter',
    description: 'DBML 기반 ERD 시각화 및 PostgreSQL/MySQL DDL 스키마 양방향 코드 생성',
    icon: 'schema',
    path: '/dbml-tools',
    statusTag: 'READY',
    lastUsed: '1시간 전 사용',
    version: 'v0.9',
  },
  {
    id: 'docs',
    title: '마크다운 문서 뷰어',
    titleEn: 'Markdown Docs Viewer',
    description: '로컬 개발 명세(Spec) 및 아키텍처 결정(ADR) 실시간 GFM 렌더링',
    icon: 'description',
    path: '/docs',
    statusTag: 'READY',
    lastUsed: '3시간 전 사용',
    version: 'v1.0',
  },
];

export const InstalledUtilitiesGrid: React.FC = () => {
  return (
    <section aria-label="설치된 로컬 유틸리티 그리드">
      <div className="bento-grid">
        {UTILITIES.map((util) => {
          const iconThemeClass = util.id.startsWith('pdf')
            ? 'pdf'
            : util.id.startsWith('dbml')
            ? 'dbml'
            : 'markdown';

          return (
            <Link
              key={util.id}
              to={util.path}
              className="utility-card"
              aria-label={`${util.title} 열기`}
            >
              <div className="utility-card-top">
                <div className={`utility-icon-box ${iconThemeClass}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    {util.icon}
                  </span>
                </div>
                <span className="utility-badge">{util.version}</span>
              </div>

              <h2 className="utility-title">{util.title}</h2>
              <p className="utility-desc">{util.description}</p>

              <div className="utility-footer">
                <span>{util.lastUsed}</span>
                <span className="utility-action-link">
                  <span>도구 열기</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
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
