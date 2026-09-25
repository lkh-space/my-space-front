import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        textAlign: 'center',
        backgroundColor: 'var(--surface-container-low)',
        border: '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-xl)',
        marginTop: '24px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '48px',
          fontWeight: 700,
          color: 'var(--primary)',
          letterSpacing: '-0.03em',
          marginBottom: '8px',
        }}
      >
        404
      </div>
      <h1
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--on-surface)',
          marginBottom: 8,
        }}
      >
        요청하신 페이지를 찾을 수 없습니다
      </h1>
      <p
        style={{
          fontSize: 13,
          color: 'var(--on-surface-variant)',
          marginBottom: 24,
        }}
      >
        존재하지 않거나 이동된 경로입니다.
      </p>

      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          backgroundColor: 'var(--on-surface)',
          color: 'var(--surface-dim)',
          borderRadius: 'var(--radius-md)',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          home
        </span>
        <span>대시보드로 이동</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;
