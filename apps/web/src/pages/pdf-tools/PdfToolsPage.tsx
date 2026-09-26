import React, { useState, useCallback } from 'react';
import { PdfOperationMode, SelectedPdfFile } from './types';
import { PdfViewHeader } from './components/PdfViewHeader';
import { PdfOperationTabs } from './components/PdfOperationTabs';
import { PdfDropzone } from './components/PdfDropzone';
import { PdfFileList } from './components/PdfFileList';
import { PdfOperationConfig } from './components/PdfOperationConfig';
import { PdfExecutionSummary } from './components/PdfExecutionSummary';
import { addRecentTask } from '../../shared/utils/storage';
import {
  inspectPdf,
  unlockPdf,
  mergePdf,
  splitPdfRange,
  splitPdfAll,
  triggerBlobDownload,
  ApiError,
} from '../../shared/api';
import './pdf-tools.css';

const MAX_SINGLE_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_TOTAL_FILES_SIZE = 100 * 1024 * 1024; // 100MB

interface BannerAlert {
  type: 'success' | 'error';
  message: string;
}

/**
 * 백엔드 도메인 비즈니스 에러 코드를 친절한 한국어 안내 메시지로 변환합니다.
 */
function getDomainErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'PDF_INVALID_PASSWORD':
        return '비밀번호가 올바르지 않습니다. 암호를 다시 확인해 주세요.';
      case 'PDF_PASSWORD_REQUIRED':
        return '암호화된 PDF 파일입니다. 잠금 해제 비밀번호를 입력해 주세요.';
      case 'PDF_NOT_PASSWORD_PROTECTED':
        return '암호화되지 않은 일반 PDF 파일입니다.';
      case 'PDF_MIN_FILE_COUNT_NOT_MET':
        return '병합 작업을 수행하려면 최소 2개 이상의 PDF 파일이 필요합니다.';
      case 'PDF_MAX_FILE_COUNT_EXCEEDED':
        return '병합 가능한 최대 파일 개수(20개)를 초과했습니다.';
      case 'PDF_INVALID_PAGE_RANGE':
        return '유효하지 않은 페이지 범위입니다. 문서의 총 페이지 수 내에서 올바른 형식(예: 1-3, 5)으로 입력해 주세요.';
      case 'PDF_FILE_SIZE_EXCEEDED':
        return '파일 용량 한도(단일 파일 50MB, 총합 100MB)를 초과했습니다.';
      case 'PDF_FILE_CORRUPTED':
      case 'PDF_CORRUPTED_FILE':
        return '손상되었거나 유효한 PDF 파일 형식(%PDF-)이 아닙니다.';
      default:
        return err.message || '요청 처리 중 오류가 발생했습니다.';
    }
  }

  if (err instanceof Error) {
    return err.message;
  }

  return '서버와 통신하는 중 알 수 없는 오류가 발생했습니다.';
}

export const PdfToolsPage: React.FC = () => {
  const [mode, setMode] = useState<PdfOperationMode>('merge');
  const [files, setFiles] = useState<SelectedPdfFile[]>([]);
  const [splitRangeInput, setSplitRangeInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [alert, setAlert] = useState<BannerAlert | null>(null);

  // 백엔드 사전 검사(inspect) 수행
  const inspectSelectedFile = useCallback(async (fileItem: SelectedPdfFile) => {
    try {
      const inspectRes = await inspectPdf(fileItem.file, fileItem.password);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id
            ? {
                ...f,
                isInspecting: false,
                isEncrypted: inspectRes.isEncrypted,
                isPasswordValid: inspectRes.isPasswordValid,
                pageCount: inspectRes.pageCount,
              }
            : f,
        ),
      );
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === 'PDF_FILE_CORRUPTED' || err.code === 'PDF_CORRUPTED_FILE')
      ) {
        // 손상된 파일인 경우 목록에서 제거하고 에러 알림
        setFiles((prev) => prev.filter((f) => f.id !== fileItem.id));
        setAlert({
          type: 'error',
          message: `'${fileItem.name}' 파일이 손상되었거나 유효한 PDF 형식이 아닙니다.`,
        });
      } else {
        // 기타 검사 실패 시 검사 상태만 해제
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, isInspecting: false } : f,
          ),
        );
      }
    }
  }, []);

  // 파일 추가 핸들러
  const handleFilesSelected = useCallback(
    (newFiles: File[]) => {
      setAlert(null);

      // 용량 및 형식 검증
      const validFiles: SelectedPdfFile[] = [];
      let currentTotalSize = files.reduce((acc, f) => acc + f.size, 0);

      for (const file of newFiles) {
        if (file.size > MAX_SINGLE_FILE_SIZE) {
          setAlert({
            type: 'error',
            message: `'${file.name}' 파일이 단일 파일 최대 용량(50MB)을 초과했습니다.`,
          });
          continue;
        }

        if (currentTotalSize + file.size > MAX_TOTAL_FILES_SIZE) {
          setAlert({
            type: 'error',
            message: '전체 업로드 용량(100MB)을 초과할 수 없습니다.',
          });
          break;
        }

        currentTotalSize += file.size;
        const newFileItem: SelectedPdfFile = {
          id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          name: file.name,
          size: file.size,
          isInspecting: true,
        };

        validFiles.push(newFileItem);
      }

      if (validFiles.length === 0) return;

      if (mode === 'merge') {
        const updated = [...files, ...validFiles].slice(0, 20);
        setFiles(updated);
        // 각 신규 파일 백엔드 검사 실행
        validFiles.forEach((f) => {
          inspectSelectedFile(f);
        });
      } else {
        // 단일 파일 처리 모드인 경우 첫 번째 파일로 대체
        const targetFile = validFiles[0];
        setFiles([targetFile]);
        inspectSelectedFile(targetFile);
      }
    },
    [files, mode, inspectSelectedFile],
  );

  // 개별 파일 삭제
  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // 전체 파일 비우기
  const handleClearFiles = useCallback(() => {
    setFiles([]);
    setAlert(null);
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
    setAlert(null);
  }, []);

  // 모드 전환
  const handleModeChange = useCallback(
    (newMode: PdfOperationMode) => {
      setMode(newMode);
      setAlert(null);
      // 단일 파일 모드로 변경 시 파일이 2개 이상이면 첫 번째 파일만 유지
      if (newMode !== 'merge' && files.length > 1) {
        setFiles([files[0]]);
      }
    },
    [files],
  );

  // 작업 실행 핸들러 (실제 백엔드 API 통신 및 브라우저 다운로드)
  const handleExecute = useCallback(async () => {
    setAlert(null);

    // 1. 모드별 사전 유효성 검사
    if (files.length === 0) {
      setAlert({
        type: 'error',
        message: '작업을 수행할 PDF 파일을 선택해 주세요.',
      });
      return;
    }

    if (mode === 'merge' && files.length < 2) {
      setAlert({
        type: 'error',
        message: '병합 작업을 수행하려면 최소 2개 이상의 PDF 파일이 필요합니다.',
      });
      return;
    }

    if (mode === 'split-range' && !splitRangeInput.trim()) {
      setAlert({
        type: 'error',
        message: '추출할 페이지 범위를 입력해 주세요. (예: 1-3, 5)',
      });
      return;
    }

    if (mode === 'unlock' && !files[0]?.password?.trim()) {
      setAlert({
        type: 'error',
        message: 'PDF 잠금을 해제하기 위한 비밀번호를 입력해 주세요.',
      });
      return;
    }

    setIsProcessing(true);

    try {
      let downloadResult: { blob: Blob; filename: string };
      let taskDetail = '';

      switch (mode) {
        case 'merge': {
          const rawFiles = files.map((f) => f.file);
          const passwords = files.map((f) => f.password || '');
          downloadResult = await mergePdf(rawFiles, passwords);
          taskDetail = `${files.length}개 파일 병합 완료`;
          break;
        }
        case 'split-range': {
          downloadResult = await splitPdfRange(
            files[0].file,
            splitRangeInput.trim(),
            files[0].password,
          );
          taskDetail = `페이지 범위 (${splitRangeInput}) 분할 완료`;
          break;
        }
        case 'split-all': {
          downloadResult = await splitPdfAll(files[0].file, files[0].password);
          taskDetail = '전체 페이지 낱장 ZIP 분할 완료';
          break;
        }
        case 'unlock': {
          downloadResult = await unlockPdf(
            files[0].file,
            files[0].password || '',
          );
          taskDetail = '암호 해제 완료';
          break;
        }
      }

      // 2. 브라우저 자동 다운로드 트리거
      triggerBlobDownload(downloadResult.blob, downloadResult.filename);

      // 3. 최근 작업 이력 등록
      const firstFileName = files[0]?.name || 'document.pdf';
      addRecentTask({
        title: firstFileName,
        type: 'pdf',
        status: 'COMPLETED',
        detail: taskDetail,
      });

      // 4. 윈도우 이벤트 디스패치 (대시보드 동기화)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('recent-tasks-updated'));
      }

      setAlert({
        type: 'success',
        message: `작업이 완료되어 '${downloadResult.filename}' 파일이 다운로드되었습니다.`,
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: getDomainErrorMessage(err),
      });
    } finally {
      setIsProcessing(false);
    }
  }, [files, mode, splitRangeInput]);

  return (
    <div className="pdf-tools-page">
      {/* 1. View Header */}
      <PdfViewHeader />

      {alert && (
        <div
          role="status"
          className={`pdf-alert-banner ${alert.type}`}
          aria-live="polite"
        >
          <span className="material-symbols-outlined">
            {alert.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{alert.message}</span>
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
