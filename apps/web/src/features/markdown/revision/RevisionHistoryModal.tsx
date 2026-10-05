import React, { useEffect, useState } from 'react';
import * as JsDiff from 'diff';
import {
  compareRevisions,
  fetchRevisions,
  restoreRevision,
  RevisionCompareResponse,
  RevisionSummary,
} from '../../../entities/markdown';

interface RevisionHistoryModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestored?: () => void;
  onRestoreSuccess?: () => void;
}

export const RevisionHistoryModal: React.FC<RevisionHistoryModalProps> = ({
  documentId,
  isOpen,
  onClose,
  onRestored,
  onRestoreSuccess,
}) => {
  const [revisions, setRevisions] = useState<RevisionSummary[]>([]);
  const [selectedV1, setSelectedV1] = useState<number | null>(null);
  const [selectedV2, setSelectedV2] = useState<number | null>(null);
  const [diffData, setDiffData] = useState<RevisionCompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 리비전 목록 조회
  useEffect(() => {
    if (!isOpen || !documentId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchRevisions(documentId)
      .then((data) => {
        if (!isMounted) return;
        setRevisions(data);
        if (data.length >= 2) {
          setSelectedV1(data[1].version);
          setSelectedV2(data[0].version);
        } else if (data.length === 1) {
          setSelectedV1(data[0].version);
          setSelectedV2(data[0].version);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || '리비전 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, documentId]);

  // 두 버전 선택 시 비교 수행
  useEffect(() => {
    if (!isOpen || !documentId || selectedV1 === null || selectedV2 === null)
      return;

    let isMounted = true;
    compareRevisions(documentId, selectedV1, selectedV2)
      .then((res) => {
        if (isMounted) setDiffData(res);
      })
      .catch((err) => {
        if (isMounted)
          setError(err.message || '버전 비교 데이터를 불러오지 못했습니다.');
      });

    return () => {
      isMounted = false;
    };
  }, [documentId, selectedV1, selectedV2, isOpen]);

  // ESC 키 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 과거 버전 복원
  const handleRestore = async (version: number) => {
    const ok = window.confirm(`정말로 v${version} 버전으로 문서를 복원하시겠습니까?`);
    if (!ok) return;

    setIsRestoring(true);
    try {
      await restoreRevision(documentId, version);
      alert(`v${version} 버전으로 복원되었습니다.`);
      if (onRestored) onRestored();
      if (onRestoreSuccess) onRestoreSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '복원에 실패했습니다.';
      alert(msg);
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  // diff 계산
  const diffParts = diffData
    ? JsDiff.diffLines(diffData.v1.content, diffData.v2.content)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="문서 버전 이력 및 비교"
    >
      <div className="w-full max-w-4xl h-[85vh] rounded bg-surface-container-low border border-outline-variant shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-12 px-5 border-b border-outline-variant flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">
              history
            </span>
            <h2 className="text-sm font-semibold text-on-surface">
              Revision History & Diff Viewer
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Revisions Timeline List */}
          <div className="w-64 border-r border-outline-variant bg-surface-container-lowest/60 p-3 overflow-y-auto shrink-0 flex flex-col gap-2">
            <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider px-1">
              Version Timeline ({revisions.length})
            </span>

            {isLoading && (
              <div className="p-4 text-center text-label-sm font-label-sm text-outline">
                로딩 중...
              </div>
            )}

            {error && (
              <div className="p-3 rounded bg-error/10 border border-error/30 text-label-sm text-error">
                {error}
              </div>
            )}

            {!isLoading && revisions.length === 0 && (
              <div className="p-4 text-center text-label-sm font-label-sm text-outline">
                수정 이력이 없습니다.
              </div>
            )}

            <div className="space-y-1">
              {revisions.map((rev) => {
                const isV1 = selectedV1 === rev.version;
                const isV2 = selectedV2 === rev.version;

                return (
                  <div
                    key={rev.id}
                    className={`p-2.5 rounded border transition-colors cursor-pointer text-label-sm font-label-sm ${
                      isV2
                        ? 'bg-surface-container-high border-primary'
                        : isV1
                        ? 'bg-surface-container-high/60 border-tertiary'
                        : 'bg-surface-container border-outline-variant hover:border-outline'
                    }`}
                    onClick={() => {
                      if (selectedV2 !== rev.version) {
                        setSelectedV1(selectedV2);
                        setSelectedV2(rev.version);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-semibold text-on-surface">
                        v{rev.version}
                      </span>
                      <div className="flex items-center gap-1">
                        {isV2 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-primary/20 text-primary border border-primary/40 font-mono">
                            대상
                          </span>
                        )}
                        {isV1 && !isV2 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-tertiary/20 text-tertiary border border-tertiary/40 font-mono">
                            기준
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-outline font-mono">
                      {new Date(rev.createdAt).toLocaleString()}
                    </div>

                    {/* Restore Button */}
                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(rev.version);
                      }}
                      className="mt-2 w-full py-1 rounded bg-surface-container hover:bg-surface-container-highest text-on-surface hover:text-white text-[10px] font-medium transition-colors flex items-center justify-center gap-1 border border-outline-variant"
                    >
                      <span className="material-symbols-outlined text-[12px]">
                        restore
                      </span>
                      <span>이 버전으로 복원</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Diff Viewer */}
          <div className="flex-1 flex flex-col bg-surface-container-lowest min-w-0">
            {/* Diff Header Bar */}
            <div className="h-9 px-4 border-b border-outline-variant bg-surface-container flex items-center justify-between text-label-sm font-label-sm text-outline font-mono">
              <div>
                비교: <span className="text-tertiary">v{selectedV1 ?? '-'}</span> (기준) →{' '}
                <span className="text-primary">v{selectedV2 ?? '-'}</span> (대상)
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-secondary">
                  <span className="inline-block w-2 h-2 rounded-full bg-secondary" />
                  추가된 라인 (+)
                </span>
                <span className="flex items-center gap-1 text-error">
                  <span className="inline-block w-2 h-2 rounded-full bg-error" />
                  삭제된 라인 (-)
                </span>
              </div>
            </div>

            {/* Diff Content Scroller */}
            <div className="flex-1 p-4 overflow-auto font-mono text-code-md leading-relaxed select-text">
              {!diffData && (
                <div className="p-8 text-center text-outline text-label-sm font-label-sm">
                  비교할 두 버전을 좌측 목록에서 선택해 주세요.
                </div>
              )}

              {diffData && diffParts.length === 0 && (
                <div className="p-8 text-center text-outline text-label-sm font-label-sm">
                  두 버전 간 변경 사항이 없습니다.
                </div>
              )}

              {diffData && diffParts.length > 0 && (
                <div className="divide-y divide-outline-variant/30 border border-outline-variant rounded overflow-hidden">
                  {diffParts.map((part, index) => {
                    const isAdded = part.added;
                    const isRemoved = part.removed;

                    let bgClass = 'bg-surface-container-lowest text-on-surface-variant';
                    let prefix = ' ';
                    if (isAdded) {
                      bgClass = 'bg-secondary/10 text-secondary border-l-2 border-secondary';
                      prefix = '+';
                    } else if (isRemoved) {
                      bgClass = 'bg-error/10 text-error border-l-2 border-error line-through';
                      prefix = '-';
                    }

                    return (
                      <div
                        key={index}
                        className={`px-3 py-1 flex items-start gap-2 whitespace-pre-wrap font-mono text-xs ${bgClass}`}
                      >
                        <span className="select-none text-outline w-3 shrink-0">
                          {prefix}
                        </span>
                        <div className="flex-1 break-all">{part.value}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
