import React from 'react';
import { Link } from 'react-router-dom';
import './placeholder.css';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
  icon,
}) => {
  return (
    <div className="status-page-card">
      <div className="status-icon-box">
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
          {icon}
        </span>
      </div>

      <h1 className="status-page-title">{title}</h1>

      <p className="status-page-desc">{description}</p>

      <div className="status-page-badge">
        <span className="status-dot" />
        <span>다음 단계에서 구현 예정 (Under Development)</span>
      </div>

      <Link to="/" className="status-action-link">
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          arrow_back
        </span>
        <span>대시보드로 돌아가기</span>
      </Link>
    </div>
  );
};

export default PlaceholderPage;
