import { downloadBlob, postFormData } from './client';
import { DownloadResult, InspectPdfResponse } from './types';

const BASE_PATH = '/api/v1/pdf';

/**
 * PDF 정보 및 암호화 여부 사전 검사 (POST /api/v1/pdf/inspect)
 */
export async function inspectPdf(
  file: File,
  password?: string,
): Promise<InspectPdfResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (password) {
    formData.append('password', password);
  }

  return postFormData<InspectPdfResponse>(`${BASE_PATH}/inspect`, formData);
}

/**
 * PDF 암호 해제 (POST /api/v1/pdf/unlock)
 */
export async function unlockPdf(
  file: File,
  password: string,
): Promise<DownloadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', password);

  return downloadBlob(`${BASE_PATH}/unlock`, formData, 'unlocked.pdf');
}

/**
 * PDF 다중 파일 병합 (POST /api/v1/pdf/merge)
 * @param files 병합할 PDF 파일 목록 (2~20개)
 * @param passwords 각 파일 인덱스별 비밀번호 배열 (암호 없으면 빈 문자열)
 */
export async function mergePdf(
  files: File[],
  passwords?: string[],
): Promise<DownloadResult> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  if (passwords && passwords.length > 0) {
    formData.append('passwords', JSON.stringify(passwords));
  }

  return downloadBlob(`${BASE_PATH}/merge`, formData, 'merged.pdf');
}

/**
 * PDF 특정 페이지 범위 추출/분할 (POST /api/v1/pdf/split/range)
 * @param file 대상 PDF 파일
 * @param ranges 추출할 페이지 범위 (예: "1-3, 5")
 * @param password 암호화된 파일인 경우 비밀번호
 */
export async function splitPdfRange(
  file: File,
  ranges: string,
  password?: string,
): Promise<DownloadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('ranges', ranges);
  if (password) {
    formData.append('password', password);
  }

  return downloadBlob(`${BASE_PATH}/split/range`, formData, 'extracted.pdf');
}

/**
 * PDF 전체 페이지 낱장 분할 (ZIP 압축) (POST /api/v1/pdf/split/all)
 * @param file 대상 PDF 파일
 * @param password 암호화된 파일인 경우 비밀번호
 */
export async function splitPdfAll(
  file: File,
  password?: string,
): Promise<DownloadResult> {
  const formData = new FormData();
  formData.append('file', file);
  if (password) {
    formData.append('password', password);
  }

  return downloadBlob(`${BASE_PATH}/split/all`, formData, 'split-pages.zip');
}
