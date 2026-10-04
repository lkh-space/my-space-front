import React, { useMemo, useState } from 'react';
import { DEFAULT_DBML_SCHEMA } from './model/defaultSchema';
import { parseDbml } from './model/dbmlParser';
import { calculateErdLayout } from './model/erdLayout';
import { exportDbmlToSql, formatDbmlCode } from './api/dbmlApi';
import { SqlDialect } from './model/types';
import { DbmlHeader } from './ui/DbmlHeader';
import { DbmlSubHeader } from './ui/DbmlSubHeader';
import { DbmlEditorPanel } from './ui/DbmlEditorPanel';
import { ErdCanvas } from './ui/ErdCanvas';
import { SqlPreviewModal } from './ui/SqlPreviewModal';
import { MobileFloatingControls } from './ui/MobileFloatingControls';
import './dbml-tools.css';

export const DbmlToolsPage: React.FC = () => {
  const [dbmlCode, setDbmlCode] = useState<string>(DEFAULT_DBML_SCHEMA);
  const [dialect, setDialect] = useState<SqlDialect>('postgres');
  const [layoutType, setLayoutType] = useState<'hierarchical' | 'grid'>('hierarchical');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileTab, setMobileTab] = useState<'erd' | 'editor'>('erd');

  // SQL 변환 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedSql, setGeneratedSql] = useState('');
  const [isFromFallback, setIsFromFallback] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // 실시간 클라이언트 파싱 (성능 지연 없이 0~10ms 처리)
  const parsedSchema = useMemo(() => {
    return parseDbml(dbmlCode);
  }, [dbmlCode]);

  // ERD 카드 및 관계선 레이아웃 계산
  const { tables: layoutedTables, connectors } = useMemo(() => {
    return calculateErdLayout(parsedSchema.tables, parsedSchema.relationships, layoutType);
  }, [parsedSchema.tables, parsedSchema.relationships, layoutType]);

  // 핸들러들
  const handleLoadExample = () => {
    setDbmlCode(DEFAULT_DBML_SCHEMA);
  };

  const handleCopySchema = async () => {
    try {
      await navigator.clipboard.writeText(dbmlCode);
      alert('DBML 스키마가 클립보드에 복사되었습니다.');
    } catch {
      // ignore
    }
  };

  const handleFormatCode = async () => {
    const formatted = await formatDbmlCode(dbmlCode);
    setDbmlCode(formatted);
  };

  const handleExecuteConvert = async () => {
    setIsConverting(true);
    try {
      const res = await exportDbmlToSql(dbmlCode, dialect);
      setGeneratedSql(res.sql);
      setIsFromFallback(Boolean(res.fromFallback));
      setIsModalOpen(true);
    } catch {
      alert('SQL 변환 중 오류가 발생했습니다.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleExportSvg = () => {
    const svgEl = document.querySelector('.dbml-canvas-viewport svg');
    if (!svgEl) {
      alert('내보낼 SVG 요소를 찾을 수 없습니다.');
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema-erd.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dbml-tools-page">
      {/* 1. Sub-Toolbar with Breadcrumbs & Actions */}
      <DbmlHeader
        dialect={dialect}
        onDialectChange={setDialect}
        onLoadExample={handleLoadExample}
        onCopySchema={handleCopySchema}
        onExportSvg={handleExportSvg}
        onFormatCode={handleFormatCode}
        onExecuteConvert={handleExecuteConvert}
        isConverting={isConverting}
      />

      {/* 2. Sub-Header with Title & Synced Pill */}
      <DbmlSubHeader />

      {/* 3. Mobile Viewport Switcher */}
      <MobileFloatingControls
        activeTab={mobileTab}
        onTabChange={setMobileTab}
        tableCount={parsedSchema.tables.length}
        isValid={parsedSchema.isValid}
        onExecuteConvert={handleExecuteConvert}
      />

      {/* 4. Split View Area (40% Code Editor : 60% ERD Canvas) */}
      <div className="dbml-split-view">
        {/* Left Column: Code Editor */}
        <DbmlEditorPanel
          value={dbmlCode}
          onChange={setDbmlCode}
          parsedSchema={parsedSchema}
        />

        {/* Right Column: ERD Diagram Canvas */}
        <ErdCanvas
          tables={layoutedTables}
          connectors={connectors}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          layoutType={layoutType}
          onLayoutChange={setLayoutType}
        />
      </div>

      {/* 5. SQL Preview Modal */}
      <SqlPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sqlContent={generatedSql}
        dialect={dialect}
        fromFallback={isFromFallback}
      />
    </div>
  );
};

export default DbmlToolsPage;
