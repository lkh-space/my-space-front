import React from 'react';
import { Link } from 'react-router-dom';
import './not-found.css';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-card">
      <div className="not-found-code-hero">404</div>
      <h1 className="not-found-title">요청하신 페이지를 찾을 수 없습니다</h1>
      <p className="not-found-desc">존재하지 않거나 이동된 경로입니다.</p>

      <Link to="/" className="not-found-action-link">
        <span className="material-symbols-outlined">home</span>
        <span>대시보드로 이동</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;
