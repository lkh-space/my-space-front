export type PdfOperationMode =
  | 'merge'
  | 'split-range'
  | 'split-all'
  | 'unlock';

export interface SelectedPdfFile {
  id: string; // 클라이언트 고유 식별자 (crypto.randomUUID() 등)
  file: File;
  name: string;
  size: number;
  isEncrypted?: boolean;
  isPasswordValid?: boolean;
  pageCount?: number;
  password?: string;
  isInspecting?: boolean;
  error?: string;
}

export interface PdfToolsState {
  mode: PdfOperationMode;
  files: SelectedPdfFile[];
  splitRangeInput: string;
  isProcessing: boolean;
  globalError: string | null;
}

export interface OperationModeMeta {
  id: PdfOperationMode;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  expectedOutput: string;
  minFiles: number;
  maxFiles: number;
}

export const PDF_OPERATION_METAS: Record<PdfOperationMode, OperationModeMeta> = {
  merge: {
    id: 'merge',
    label: '문서 병합 (Merge)',
    shortLabel: '병합',
    icon: 'call_merge',
    description: '여러 PDF 문서를 원하는 순서대로 결합하여 단일 문서로 만듭니다.',
    expectedOutput: 'merged.pdf',
    minFiles: 2,
    maxFiles: 20,
  },
  'split-range': {
    id: 'split-range',
    label: '범위 분할 (Split by Range)',
    shortLabel: '범위 분할',
    icon: 'content_cut',
    description: '원하는 페이지 범위(예: 1-3, 5)를 지정하여 해당 페이지만 추출합니다.',
    expectedOutput: 'extracted.pdf',
    minFiles: 1,
    maxFiles: 1,
  },
  'split-all': {
    id: 'split-all',
    label: '낱장 분할 (Split to Pages)',
    shortLabel: '낱장 분할',
    icon: 'splitscreen',
    description: '모든 페이지를 낱장 PDF로 개별 분할하여 ZIP 아카이브로 다운로드합니다.',
    expectedOutput: 'split_pages.zip',
    minFiles: 1,
    maxFiles: 1,
  },
  unlock: {
    id: 'unlock',
    label: '암호 해제 (Unlock)',
    shortLabel: '암호 해제',
    icon: 'lock_open',
    description: '비밀번호로 보호된 PDF의 암호를 해제하여 보안 제한 없는 PDF로 저장합니다.',
    expectedOutput: 'unlocked.pdf',
    minFiles: 1,
    maxFiles: 1,
  },
};
