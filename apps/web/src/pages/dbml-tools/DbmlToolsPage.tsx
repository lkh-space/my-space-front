import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { triggerBlobDownload } from '../../shared/api/download';
import { DEFAULT_DBML_SCHEMA } from './model/defaultSchema';
import { parseDbml } from './model/dbmlParser';
import { calculateConnectors, calculateErdLayout } from './model/erdLayout';
import { exportErdImage, ExportImageFormat, ExportImageScale } from './model/erdImageExporter';
import { exportDbmlToSql, formatDbmlCode } from './api/dbmlApi';
import { SqlDialect } from './model/types';
import { DbmlHeader } from './ui/DbmlHeader';
import { DbmlSubHeader } from './ui/DbmlSubHeader';
import { DbmlEditorPanel } from './ui/DbmlEditorPanel';
import { ErdCanvas } from './ui/ErdCanvas';
import { SqlPreviewModal } from './ui/SqlPreviewModal';
import { ExportImageModal } from './ui/ExportImageModal';
import { ImportSchemaModal } from './ui/ImportSchemaModal';
import { MobileFloatingControls } from './ui/MobileFloatingControls';
import './dbml-tools.css';

export const DBML_STORAGE_KEY = 'my-space:dbml-schema';

export const DbmlToolsPage: React.FC = () => {
  // 새로고침이나 페이지 전환 후에도 작업 내용이 유지되도록 localStorage에서 초기 로드
  const [dbmlCode, setDbmlCode] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(DBML_STORAGE_KEY);
        if (saved !== null) {
          return saved;
        }
      } catch {
        // localStorage 접근 실패 시 기본 스키마 반환
      }
    }
    return DEFAULT_DBML_SCHEMA;
  });

  const [dialect, setDialect] = useState<SqlDialect>('postgres');
  const [layoutType, setLayoutType] = useState<'hierarchical' | 'grid'>('hierarchical');
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileTab, setMobileTab] = useState<'erd' | 'editor'>('erd');

  // 변경된 DBML 코드를 localStorage에 자동 보관 (Auto-save)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(DBML_STORAGE_KEY, dbmlCode);
      } catch {
        // quota exceeded 등 예외 무시
      }
    }
  }, [dbmlCode]);

  // SQL 변환 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedSql, setGeneratedSql] = useState('');
  const [isFromFallback, setIsFromFallback] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Toast 알림 상태 (브라우저 블로킹 alert 대체)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

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
    setCustomPositions({});
    showToast('success', '기본 예제 스키마를 불러왔습니다.');
  };

  const handleImportSchema = useCallback((importedDbml: string, filename?: string) => {
    setDbmlCode(importedDbml);
    setCustomPositions({});
    const sourceLabel = filename ? `'${filename}'` : '스키마';
    showToast('success', `${sourceLabel}를 성공적으로 가져왔습니다.`);
  }, [showToast]);

  const handleTableMove = useCallback((tableName: string, x: number, y: number) => {
    setCustomPositions((prev) => ({
      ...prev,
      [tableName]: { x, y },
    }));
  }, []);

  const handleLayoutChange = useCallback((type: 'hierarchical' | 'grid') => {
    setCustomPositions({});
    setLayoutType(type);
  }, []);

  const handleCopySchema = async () => {
    try {
      await navigator.clipboard.writeText(dbmlCode);
      showToast('success', 'DBML 스키마가 클립보드에 복사되었습니다.');
    } catch {
      showToast('error', '클립보드 복사에 실패했습니다.');
    }
  };

  // Ctrl+S / Cmd+S 단축키 핸들러:
  // 파일 다운로드 창을 매번 띄우지 않고, 웹 애플리케이션 작업 공간(localStorage)에 즉시 저장
  const handleSaveDbml = useCallback(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(DBML_STORAGE_KEY, dbmlCode);
      } catch {
        showToast('error', '스키마 저장에 실패했습니다.');
        return;
      }
    }
    showToast('success', 'schema.dbml이 저장되었습니다.');
  }, [dbmlCode, showToast]);

  // 물리적인 .dbml 파일 다운로드가 필요할 때 명시적 실행
  const handleDownloadDbmlFile = useCallback(() => {
    const blob = new Blob([dbmlCode], { type: 'text/plain;charset=utf-8' });
    triggerBlobDownload(blob, 'schema.dbml');
    showToast('success', 'schema.dbml 파일 다운로드가 시작되었습니다.');
  }, [dbmlCode, showToast]);

  // Ctrl+S / Cmd+S 단축키로 작업 내용 로컬 저장
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveDbml();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSaveDbml]);

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
      showToast('error', 'SQL 변환 중 오류가 발생했습니다.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleOpenExportModal = useCallback(() => {
    if (layoutedTables.length === 0) {
      showToast('error', '내보낼 테이블이 스키마에 존재하지 않습니다.');
      return;
    }
    setIsExportModalOpen(true);
  }, [layoutedTables.length, showToast]);

  const handleExportImageConfirm = useCallback(
    async (format: ExportImageFormat, scale: ExportImageScale) => {
      if (layoutedTables.length === 0) {
        showToast('error', '내보낼 테이블이 스키마에 존재하지 않습니다.');
        return;
      }

      // 사용자 수동 위치 및 최신 커넥터 반영
      const effectiveTables = layoutedTables.map((t) => {
        const pos = customPositions[t.name];
        return pos ? { ...t, x: pos.x, y: pos.y } : t;
      });

      const effectiveConnectors =
        Object.keys(customPositions).length > 0
          ? calculateConnectors(effectiveTables, connectors)
          : connectors;

      try {
        const result = await exportErdImage({
          tables: effectiveTables,
          connectors: effectiveConnectors,
          format,
          scale,
        });
        showToast('success', `${result.filename} 파일 다운로드가 시작되었습니다.`);
      } catch {
        showToast('error', '이미지 내보내기 중 오류가 발생했습니다.');
      }
    },
    [layoutedTables, connectors, customPositions, showToast]
  );

  return (
    <div className="dbml-tools-page">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`dbml-toast-banner ${toast.type}`}
          aria-live="polite"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
      {/* 1. Sub-Toolbar with Breadcrumbs & Actions */}
      <DbmlHeader
        dialect={dialect}
        onDialectChange={setDialect}
        onLoadExample={handleLoadExample}
        onImportSchema={() => setIsImportModalOpen(true)}
        onCopySchema={handleCopySchema}
        onSaveDbml={handleSaveDbml}
        onExportDbml={handleDownloadDbmlFile}
        onExportImage={handleOpenExportModal}
        onExportSvg={handleOpenExportModal}
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
          onSave={handleSaveDbml}
        />

        {/* Right Column: ERD Diagram Canvas */}
        <ErdCanvas
          tables={layoutedTables}
          connectors={connectors}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          layoutType={layoutType}
          onLayoutChange={handleLayoutChange}
          onTableMove={handleTableMove}
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

      {/* 6. Export Diagram Image Modal (SVG, PNG, JPG with Scale & Transparent Nu-ggi) */}
      <ExportImageModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportImageConfirm}
        tableCount={layoutedTables.length}
        connectorCount={connectors.length}
      />

      {/* 7. Import Schema Modal (DBML / SQL) */}
      <ImportSchemaModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportSchema}
      />
    </div>
  );
};

export default DbmlToolsPage;
