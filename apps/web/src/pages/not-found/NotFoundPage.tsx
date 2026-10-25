import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../shared/i18n';
import './not-found.css';

export const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="not-found-card">
      <div className="not-found-code-hero">404</div>
      <h1 className="not-found-title">{t('notFound.title')}</h1>
      <p className="not-found-desc">{t('notFound.description')}</p>

      <Link to="/" className="not-found-action-link">
        <span className="material-symbols-outlined">home</span>
        <span>{t('notFound.backToDashboard')}</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;
