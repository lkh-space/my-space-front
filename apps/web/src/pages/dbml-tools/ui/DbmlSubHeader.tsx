import React from 'react';

export const DbmlSubHeader: React.FC = () => {
  return (
    <div className="dbml-subheader">
      <div className="dbml-subheader-left">
        <h1 className="dbml-subheader-title">
          DBML Editor & ERD Visualizer
        </h1>
        <div className="dbml-status-pill">
          <span className="dbml-pulse-dot" />
          <span>Live Synced</span>
        </div>
      </div>

      <div className="dbml-subheader-right">
        <span>
          Engine: <span className="dbml-engine-name">dbml-core@3.2</span>
        </span>
        <span className="dbml-divider" />
        <a
          href="https://dbml.dbdocs.io/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="dbml-docs-link"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>menu_book</span>
          <span>Docs</span>
        </a>
      </div>
    </div>
  );
};
