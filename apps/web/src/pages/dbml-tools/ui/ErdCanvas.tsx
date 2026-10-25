import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { ConnectorPath, LayoutedTable, calculateConnectors } from '../model/erdLayout';
import { SvgRelations } from './SvgRelations';
import { TableCard } from './TableCard';

interface ErdCanvasProps {
  tables: LayoutedTable[];
  connectors: ConnectorPath[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  layoutType: 'hierarchical' | 'grid';
  onLayoutChange: (type: 'hierarchical' | 'grid') => void;
  onTableMove?: (tableName: string, x: number, y: number) => void;
}

export const ErdCanvas: React.FC<ErdCanvasProps> = ({
  tables,
  connectors,
  searchQuery,
  onSearchChange,
  layoutType,
  onLayoutChange,
  onTableMove,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 사용자가 마우스로 드래그하여 이동시킨 테이블 좌표
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const dragTableRef = useRef<{
    tableName: string;
    startClientX: number;
    startClientY: number;
    startTableX: number;
    startTableY: number;
  } | null>(null);

  // 사용자 수동 위치가 반영된 테이블 목록
  const effectiveTables = useMemo(() => {
    return tables.map((t) => {
      const pos = customPositions[t.name];
      return pos ? { ...t, x: pos.x, y: pos.y } : t;
    });
  }, [tables, customPositions]);

  // 테이블 위치 변경에 따라 실시간으로 재계산되는 관계선
  const effectiveConnectors = useMemo(() => {
    const hasCustom = Object.keys(customPositions).length > 0;
    if (!hasCustom) return connectors;
    return calculateConnectors(effectiveTables, connectors);
  }, [effectiveTables, connectors, customPositions]);

  // 테이블 드래그 시작
  const handleTableMouseDown = useCallback(
    (e: React.MouseEvent, tableName: string) => {
      if (e.button !== 0) return; // 좌클릭만 허용
      e.stopPropagation(); // 캔버스 패닝 이벤트 전파 차단

      const target = effectiveTables.find((t) => t.name === tableName);
      if (!target) return;

      dragTableRef.current = {
        tableName,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startTableX: target.x,
        startTableY: target.y,
      };
      setDraggingTable(tableName);
    },
    [effectiveTables]
  );

  // 캔버스 패닝 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.erd-card')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. 테이블 드래그 처리
    if (dragTableRef.current) {
      const { tableName, startClientX, startClientY, startTableX, startTableY } = dragTableRef.current;
      const dx = (e.clientX - startClientX) / zoom;
      const dy = (e.clientY - startClientY) / zoom;
      const newX = Math.max(0, Math.round(startTableX + dx));
      const newY = Math.max(0, Math.round(startTableY + dy));

      setCustomPositions((prev) => ({
        ...prev,
        [tableName]: { x: newX, y: newY },
      }));
      onTableMove?.(tableName, newX, newY);
      return;
    }

    // 2. 캔버스 배경 패닝 처리
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    if (dragTableRef.current) {
      dragTableRef.current = null;
      setDraggingTable(null);
    }
    setIsDragging(false);
  };

  // 브라우저 뷰포트 바깥으로 마우스가 나갔을 때도 부드럽게 위치 갱신 및 종료
  useEffect(() => {
    if (!draggingTable) return;

    const onWindowMove = (e: MouseEvent) => {
      if (!dragTableRef.current) return;
      const { tableName, startClientX, startClientY, startTableX, startTableY } = dragTableRef.current;
      const dx = (e.clientX - startClientX) / zoom;
      const dy = (e.clientY - startClientY) / zoom;
      const newX = Math.max(0, Math.round(startTableX + dx));
      const newY = Math.max(0, Math.round(startTableY + dy));

      setCustomPositions((prev) => ({
        ...prev,
        [tableName]: { x: newX, y: newY },
      }));
      onTableMove?.(tableName, newX, newY);
    };

    const onWindowUp = () => {
      dragTableRef.current = null;
      setDraggingTable(null);
    };

    window.addEventListener('mousemove', onWindowMove);
    window.addEventListener('mouseup', onWindowUp);

    return () => {
      window.removeEventListener('mousemove', onWindowMove);
      window.removeEventListener('mouseup', onWindowUp);
    };
  }, [draggingTable, zoom, onTableMove]);

  const handleZoomIn = () => setZoom((prev) => Math.min(1.5, Math.round((prev + 0.1) * 10) / 10));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.5, Math.round((prev - 0.1) * 10) / 10));

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCustomPositions({});
  };

  const handleLayoutToggle = (type: 'hierarchical' | 'grid') => {
    setCustomPositions({});
    onLayoutChange(type);
  };

  const totalColumns = effectiveTables.reduce((acc, t) => acc + t.fields.length, 0);
  const maxX = Math.max(1200, ...effectiveTables.map((t) => t.x + t.width + 100));
  const maxY = Math.max(800, ...effectiveTables.map((t) => t.y + t.height + 100));

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
              onClick={() => handleLayoutToggle('hierarchical')}
              className={`dbml-layout-btn ${layoutType === 'hierarchical' ? 'active' : ''}`}
            >
              Hierarchical
            </button>
            <button
              onClick={() => handleLayoutToggle('grid')}
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
            transition: isDragging || draggingTable ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {/* SVG Relation Connectors */}
          <SvgRelations connectors={effectiveConnectors} width={maxX} height={maxY} />

          {/* Table Cards */}
          {effectiveTables.map((table) => {
            const isMatch =
              !searchQuery || table.name.toLowerCase().includes(searchQuery.toLowerCase());
            return (
              <TableCard
                key={table.name}
                table={table}
                isHighlighted={Boolean(searchQuery && isMatch)}
                isDimmed={Boolean(searchQuery && !isMatch)}
                isDragging={draggingTable === table.name}
                onMouseDown={handleTableMouseDown}
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
              {effectiveTables.length} Tables, {totalColumns} Columns, {effectiveConnectors.length} Connectors
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
