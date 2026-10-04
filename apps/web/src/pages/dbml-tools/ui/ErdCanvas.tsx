import React, { useRef, useState } from 'react';
import { ConnectorPath, LayoutedTable } from '../model/erdLayout';
import { SvgRelations } from './SvgRelations';
import { TableCard } from './TableCard';

interface ErdCanvasProps {
  tables: LayoutedTable[];
  connectors: ConnectorPath[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  layoutType: 'hierarchical' | 'grid';
  onLayoutChange: (type: 'hierarchical' | 'grid') => void;
}

export const ErdCanvas: React.FC<ErdCanvasProps> = ({
  tables,
  connectors,
  searchQuery,
  onSearchChange,
  layoutType,
  onLayoutChange,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.erd-card')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(1.5, Math.round((prev + 0.1) * 10) / 10));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.5, Math.round((prev - 0.1) * 10) / 10));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const totalColumns = tables.reduce((acc, t) => acc + t.fields.length, 0);
  const maxX = Math.max(1200, ...tables.map((t) => t.x + t.width + 100));
  const maxY = Math.max(800, ...tables.map((t) => t.y + t.height + 100));

  return (
    <section className="dbml-canvas-section">
      {/* Canvas Top Toolbar */}
      <div className="dbml-canvas-toolbar">
        {/* Left: Search & Layout Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="dbml-search-input-wrapper">
            <span className="material-symbols-outlined dbml-search-icon">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tables (users, tasks)..."
              className="dbml-search-input"
            />
          </div>

          <div className="dbml-layout-toggle">
            <button
              onClick={() => onLayoutChange('hierarchical')}
              className={`dbml-layout-btn ${layoutType === 'hierarchical' ? 'active' : ''}`}
            >
              Hierarchical
            </button>
            <button
              onClick={() => onLayoutChange('grid')}
              className={`dbml-layout-btn ${layoutType === 'grid' ? 'active' : ''}`}
            >
              Grid
            </button>
          </div>
        </div>

        {/* Right: Zoom & Fit Controls */}
        <div className="dbml-zoom-controls">
          <div className="dbml-zoom-group">
            <button
              onClick={handleZoomOut}
              className="dbml-icon-btn"
              title="Zoom Out"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>remove</span>
            </button>
            <span className="dbml-zoom-val">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="dbml-icon-btn"
              title="Zoom In"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>add</span>
            </button>
          </div>

          <button
            onClick={handleResetView}
            className="dbml-icon-btn"
            title="Reset / Fit View"
            style={{ border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-sm)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>fit_screen</span>
          </button>
        </div>
      </div>

      {/* Interactive Dot-Grid Canvas with Panning & Zoom */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`dbml-canvas-viewport ${isDragging ? 'dragging' : ''}`}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'relative',
            width: maxX,
            height: maxY,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {/* SVG Relation Connectors */}
          <SvgRelations connectors={connectors} width={maxX} height={maxY} />

          {/* Table Cards */}
          {tables.map((table) => {
            const isMatch =
              !searchQuery || table.name.toLowerCase().includes(searchQuery.toLowerCase());
            return (
              <TableCard
                key={table.name}
                table={table}
                isHighlighted={Boolean(searchQuery && isMatch)}
                isDimmed={Boolean(searchQuery && !isMatch)}
              />
            );
          })}
        </div>

        {/* Legend Overlay (Bottom Right) */}
        <div className="erd-legend-box">
          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Legend:</span>
          <div className="erd-legend-item">
            <span className="erd-legend-dot amber" />
            <span>PK</span>
          </div>
          <div className="erd-legend-item">
            <span className="erd-legend-dot green" />
            <span>FK Reference</span>
          </div>
          <div className="erd-legend-item">
            <span className="erd-legend-dot blue" />
            <span>Unique</span>
          </div>
        </div>
      </div>

      {/* Canvas Meta Footer */}
      <div className="dbml-canvas-footer">
        <div>
          <span>
            Objects:{' '}
            <span style={{ color: 'var(--on-surface)' }}>
              {tables.length} Tables, {totalColumns} Columns, {connectors.length} Connectors
            </span>
          </span>
        </div>
        <div>
          <a
            href="https://dbml.dbdocs.io/docs"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--on-surface-variant)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>help_outline</span>
            <span>DBML Syntax Help</span>
          </a>
        </div>
      </div>
    </section>
  );
};
