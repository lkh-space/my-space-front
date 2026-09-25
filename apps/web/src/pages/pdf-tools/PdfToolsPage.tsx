import React, { useState, useCallback } from 'react';
import { PdfOperationMode, SelectedPdfFile } from './types';
import { PdfViewHeader } from './components/PdfViewHeader';
import { PdfOperationTabs } from './components/PdfOperationTabs';
import { PdfDropzone } from './components/PdfDropzone';
import { PdfFileList } from './components/PdfFileList';
import { PdfOperationConfig } from './components/PdfOperationConfig';
import { PdfExecutionSummary } from './components/PdfExecutionSummary';
import { addRecentTask } from '../../shared/utils/storage';
import './pdf-tools.css';

const MAX_SINGLE_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_TOTAL_FILES_SIZE = 100 * 1024 * 1024; // 100MB

export const PdfToolsPage: React.FC = () => {
  const [mode, setMode] = useState<PdfOperationMode>('merge');
  const [files, setFiles] = useState<SelectedPdfFile[]>([]);
  const [splitRangeInput, setSplitRangeInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // 파일 추가 핸들러
  const handleFilesSelected = useCallback(
    (newFiles: File[]) => {
      setAlertMessage(null);

      // 용량 및 형식 검증
      const validFiles: SelectedPdfFile[] = [];
      let currentTotalSize = files.reduce((acc, f) => acc + f.size, 0);

      for (const file of newFiles) {
        if (file.size > MAX_SINGLE_FILE_SIZE) {
          setAlertMessage(
            `'${file.name}' 파일이 단일 파일 최대 용량(50MB)을 초과했습니다.`,
          );
          continue;
        }

        if (currentTotalSize + file.size > MAX_TOTAL_FILES_SIZE) {
          setAlertMessage('전체 업로드 용량(100MB)을 초과할 수 없습니다.');
          break;
        }

        currentTotalSize += file.size;
        validFiles.push({
          id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          name: file.name,
          size: file.size,
          // 파일명에 encrypted, lock 등이 들어가면 데모용 암호화 플래그 설정
          isEncrypted: file.name.toLowerCase().includes('lock') || file.name.toLowerCase().includes('encrypted'),
        });
      }

      if (validFiles.length === 0) return;

      if (mode === 'merge') {
        setFiles((prev) => [...prev, ...validFiles].slice(0, 20));
      } else {
        // 단일 파일 처리 모드인 경우 첫 번째 파일로 대체
        setFiles([validFiles[0]]);
      }
    },
    [files, mode],
  );

  // 개별 파일 삭제
  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // 전체 파일 비우기
  const handleClearFiles = useCallback(() => {
    setFiles([]);
    setAlertMessage(null);
  }, []);

  // 암호화 파일 비밀번호 변경
  const handlePasswordChange = useCallback((id: string, password: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, password } : f)),
    );
  }, []);

  // 전체 초기화
  const handleReset = useCallback(() => {
    setFiles([]);
    setSplitRangeInput('');
    setAlertMessage(null);
  }, []);

  // 모드 전환
  const handleModeChange = useCallback(
    (newMode: PdfOperationMode) => {
      setMode(newMode);
      setAlertMessage(null);
      // 단일 파일 모드로 변경 시 파일이 2개 이상이면 첫 번째 파일만 유지
      if (newMode !== 'merge' && files.length > 1) {
        setFiles([files[0]]);
      }
    },
    [files],
  );

  // 작업 실행 핸들러 (프론트엔드 작업 처리 및 로컬스토리지 작업 이력 저장)
  const handleExecute = useCallback(() => {
    setIsProcessing(true);
    setAlertMessage(null);

    // 모의 처리 시뮬레이션
    setTimeout(() => {
      setIsProcessing(false);

      // 작업 이력 등록
      const firstFileName = files[0]?.name || 'document.pdf';
      let taskDetail = '';

      if (mode === 'merge') {
        taskDetail = `${files.length}개 파일 병합 완료`;
      } else if (mode === 'split-range') {
        taskDetail = `페이지 범위 (${splitRangeInput}) 분할 완료`;
      } else if (mode === 'split-all') {
        taskDetail = `전체 페이지 낱장 ZIP 분할 완료`;
      } else if (mode === 'unlock') {
        taskDetail = `암호 해제 완료`;
      }

      addRecentTask({
        title: firstFileName,
        type: 'pdf',
        status: 'COMPLETED',
        detail: taskDetail,
      });

      // 윈도우 이벤트 디스패치
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('recent-tasks-updated'));
      }

      setAlertMessage('작업이 성공적으로 완료되어 최근 작업 이력에 등록되었습니다.');
    }, 600);
  }, [files, mode, splitRangeInput]);

  return (
    <div className="pdf-tools-page">
      {/* 1. View Header */}
      <PdfViewHeader />

      {alertMessage && (
        <div
          role="status"
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--surface-container-high)',
            border: '1px solid var(--outline-variant)',
            fontSize: '13px',
            color: 'var(--primary)',
          }}
        >
          {alertMessage}
        </div>
      )}

      {/* 2. 4-Zone Workflow Grid */}
      <div className="pdf-workflow-grid">
        {/* Left Column (7열): 입력 및 모드 설정 */}
        <div className="pdf-workflow-left">
          {/* 작업 모드 탭 */}
          <PdfOperationTabs currentMode={mode} onModeChange={handleModeChange} />

          {/* 파일 드롭존 */}
          <PdfDropzone
            onFilesSelected={handleFilesSelected}
            multiple={mode === 'merge'}
            disabled={isProcessing}
          />

          {/* 선택된 파일 목록 */}
          <PdfFileList
            files={files}
            onRemoveFile={handleRemoveFile}
            onClearFiles={handleClearFiles}
            onPasswordChange={handlePasswordChange}
          />

          {/* 모드별 세부 설정 */}
          <PdfOperationConfig
            mode={mode}
            splitRangeInput={splitRangeInput}
            onSplitRangeChange={setSplitRangeInput}
            fileCount={files.length}
          />
        </div>

        {/* Right Column (5열): 실행 요약 및 보안 안내 */}
        <div className="pdf-workflow-right">
          <PdfExecutionSummary
            mode={mode}
            files={files}
            splitRangeInput={splitRangeInput}
            isProcessing={isProcessing}
            onExecute={handleExecute}
            onReset={handleReset}
          />
        </div>
      </div>
    </div>
  );
};

export default PdfToolsPage;
