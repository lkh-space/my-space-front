import React from 'react';
import { Link } from 'react-router-dom';

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
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--surface-container-highest)',
          border: '1px solid var(--outline-variant)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
          marginBottom: 16,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
          {icon}
        </span>
      </div>

      <h1
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: 'var(--on-surface)',
          marginBottom: 8,
        }}
      >
        {title}
      </h1>

      <p
        style={{
          fontSize: 13,
          color: 'var(--on-surface-variant)',
          maxWidth: 420,
          lineHeight: 1.5,
          marginBottom: 24,
        }}
      >
        {description}
      </p>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--surface-container-highest)',
          border: '1px solid var(--outline-variant)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--tertiary)',
          marginBottom: 24,
        }}
      >
        <span className="sidebar-status-dot" style={{ backgroundColor: 'var(--tertiary)' }} />
        <span>다음 단계에서 구현 예정 (Under Development)</span>
      </div>

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
          transition: 'background-color 0.12s ease',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          arrow_back
        </span>
        <span>대시보드로 돌아가기</span>
      </Link>
    </div>
  );
};

export default PlaceholderPage;
