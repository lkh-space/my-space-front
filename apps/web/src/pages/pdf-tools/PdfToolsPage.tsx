import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import '../../shared/i18n';
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
 * 백엔드 도메인 비즈니스 에러 코드를 친절한 안내 메시지로 변환합니다.
 */
function getDomainErrorMessage(err: unknown, t: TFunction): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'PDF_INVALID_PASSWORD':
        return t('pdfTools.alerts.errors.invalidPassword');
      case 'PDF_PASSWORD_REQUIRED':
        return t('pdfTools.alerts.errors.passwordRequired');
      case 'PDF_NOT_PASSWORD_PROTECTED':
        return t('pdfTools.alerts.errors.notPasswordProtected');
      case 'PDF_MIN_FILE_COUNT_NOT_MET':
        return t('pdfTools.alerts.errors.minFileCountNotMet');
      case 'PDF_MAX_FILE_COUNT_EXCEEDED':
        return t('pdfTools.alerts.errors.maxFileCountExceeded');
      case 'PDF_INVALID_PAGE_RANGE':
        return t('pdfTools.alerts.errors.invalidPageRange');
      case 'PDF_FILE_SIZE_EXCEEDED':
        return t('pdfTools.alerts.errors.fileSizeExceeded');
      case 'PDF_FILE_CORRUPTED':
      case 'PDF_CORRUPTED_FILE':
        return t('pdfTools.alerts.errors.corruptedFile');
      default:
        return err.message || t('pdfTools.alerts.errors.defaultError');
    }
  }

  if (err instanceof Error) {
    return err.message;
  }

  return t('pdfTools.alerts.errors.networkError');
}

export const PdfToolsPage: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<PdfOperationMode>('merge');
  const [files, setFiles] = useState<SelectedPdfFile[]>([]);
  const [splitRangeInput, setSplitRangeInput] = useState<string>('');
  const [unlockPassword, setUnlockPassword] = useState<string>('');
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
                ...inspectRes,
                isInspecting: false,
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
          message: t('pdfTools.alerts.corruptedFileNamed', {
            name: fileItem.name,
          }),
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
  }, [t]);

  // 파일 추가 핸들러
  const handleFilesSelected = useCallback(
    (newFiles: File[]) => {
      setAlert(null);

      // 용량 및 형식 검증
      const validFiles: SelectedPdfFile[] = [];
      let currentTotalSize = files.reduce((acc, f) => acc + f.size, 0);

      for (const file of newFiles) {
        const isPdf =
          file.type === 'application/pdf' ||
          file.name.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
          setAlert({
            type: 'error',
            message: t('pdfTools.alerts.unsupportedFormat', {
              name: file.name,
            }),
          });
          continue;
        }

        if (file.size > MAX_SINGLE_FILE_SIZE) {
          setAlert({
            type: 'error',
            message: t('pdfTools.alerts.singleSizeExceeded', {
              name: file.name,
            }),
          });
          continue;
        }

        if (currentTotalSize + file.size > MAX_TOTAL_FILES_SIZE) {
          setAlert({
            type: 'error',
            message: t('pdfTools.alerts.totalSizeExceeded'),
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
        const remainingSlots = Math.max(0, 20 - files.length);
        const acceptedNewFiles = validFiles.slice(0, remainingSlots);
        if (acceptedNewFiles.length === 0) return;

        setFiles([...files, ...acceptedNewFiles]);
        // 실제 목록에 추가된 신규 파일에 대해서만 백엔드 검사 실행
        acceptedNewFiles.forEach((f) => {
          inspectSelectedFile(f);
        });
      } else {
        // 단일 파일 처리 모드인 경우 첫 번째 파일로 대체
        const targetFile: SelectedPdfFile = {
          ...validFiles[0],
          password: unlockPassword || validFiles[0].password,
        };
        setFiles([targetFile]);
        inspectSelectedFile(targetFile);
      }
    },
    [files, mode, unlockPassword, inspectSelectedFile, t],
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
      prev.map((f, index) => {
        if (f.id === id) {
          if (index === 0) {
            setUnlockPassword(password);
          }
          return { ...f, password };
        }
        return f;
      }),
    );
  }, []);

  // 암호 해제 모드 설정 패널 비밀번호 변경
  const handleUnlockPasswordChange = useCallback((password: string) => {
    setUnlockPassword(password);
    setFiles((prev) =>
      prev.map((f, index) => (index === 0 ? { ...f, password } : f)),
    );
  }, []);

  // 전체 초기화
  const handleReset = useCallback(() => {
    setFiles([]);
    setSplitRangeInput('');
    setUnlockPassword('');
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
      if (newMode === 'unlock' && files[0]?.password) {
        setUnlockPassword(files[0].password);
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
        message: t('pdfTools.alerts.selectFileFirst'),
      });
      return;
    }

    if (mode === 'merge' && files.length < 2) {
      setAlert({
        type: 'error',
        message: t('pdfTools.alerts.mergeMinFiles'),
      });
      return;
    }

    if (mode === 'split-range' && !splitRangeInput.trim()) {
      setAlert({
        type: 'error',
        message: t('pdfTools.alerts.enterSplitRange'),
      });
      return;
    }

    const effectiveUnlockPassword = (
      files[0]?.password || unlockPassword
    ).trim();

    if (mode === 'unlock' && !effectiveUnlockPassword) {
      setAlert({
        type: 'error',
        message: t('pdfTools.alerts.enterUnlockPassword'),
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
          taskDetail = t('pdfTools.alerts.taskDetailMerge', {
            count: files.length,
          });
          break;
        }
        case 'split-range': {
          downloadResult = await splitPdfRange(
            files[0].file,
            splitRangeInput.trim(),
            files[0].password,
          );
          taskDetail = t('pdfTools.alerts.taskDetailSplitRange', {
            range: splitRangeInput,
          });
          break;
        }
        case 'split-all': {
          downloadResult = await splitPdfAll(files[0].file, files[0].password);
          taskDetail = t('pdfTools.alerts.taskDetailSplitAll');
          break;
        }
        case 'unlock': {
          downloadResult = await unlockPdf(
            files[0].file,
            effectiveUnlockPassword,
          );
          taskDetail = t('pdfTools.alerts.taskDetailUnlock');
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
        message: t('pdfTools.alerts.successDownload', {
          filename: downloadResult.filename,
        }),
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: getDomainErrorMessage(err, t),
      });
    } finally {
      setIsProcessing(false);
    }
  }, [files, mode, splitRangeInput, unlockPassword, t]);

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
            unlockPassword={unlockPassword}
            onUnlockPasswordChange={handleUnlockPasswordChange}
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
