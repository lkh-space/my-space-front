/**
 * 대용량 파일 다운로드 안정성을 위한 Blob URL 지연 해제 시간 (ms)
 * 브라우저 다운로드 관리자가 파일 스트림을 열고 쓰기를 시작할 수 있도록 1초의 유예 기간(Grace Period)을 둡니다.
 */
export const BLOB_REVOKE_DELAY_MS = 1000;

/**
 * OS 파일 시스템에서 금지되거나 위험한 문자(경로 조작, 슬래시, 널 바이트 등)를 정제합니다.
 */
export function sanitizeFilename(
  rawFilename: string | null | undefined,
  fallback: string,
): string {
  if (!rawFilename) return fallback;

  // 1. 공백 정리 및 널 바이트 제거
  let cleaned = rawFilename.replace(/\0/g, '').trim();

  // 2. 경로 탐색(Directory Traversal) 방지 (.. / \\ 등 제거)
  cleaned = cleaned.replace(/\.\.+/g, '');

  // 3. 파일 시스템 예약 금지 문자 치환: \ / : * ? " < > | 및 제어 문자
  // eslint-disable-next-line no-control-regex
  cleaned = cleaned.replace(/[\\/:*?"<>|\x00-\x1f\x80-\x9f]/g, '_');

  // 4. 앞뒤 특수문자 및 연속 언더스코어 정리
  cleaned = cleaned.replace(/^_+|_+$/g, '').trim();

  // 정제 후 빈 문자열이거나 마침표만 남은 경우 fallback 반환
  if (!cleaned || cleaned === '.') {
    return fallback;
  }

  return cleaned;
}

/**
 * Content-Disposition 헤더에서 파일명을 추출하고 정제합니다.
 * RFC 5987 / 6266 규격(filename*=UTF-8''...) 및 일반 filename="..." 규격을 모두 지원합니다.
 */
export function extractFilenameFromContentDisposition(
  header: string | null | undefined,
  fallback: string,
): string {
  if (!header) return sanitizeFilename(fallback, 'download.pdf');

  let extractedName: string | null = null;

  // 1. filename*=UTF-8''... (RFC 5987) 인코딩 우선 확인
  const rfc5987Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (rfc5987Match && rfc5987Match[1]) {
    try {
      extractedName = decodeURIComponent(rfc5987Match[1].trim());
    } catch {
      // 디코딩 실패 시 다음 매칭으로 이동
    }
  }

  // 2. filename="..." 일반 쌍따옴표 확인
  if (!extractedName) {
    const quotedMatch = header.match(/filename="([^"]+)"/i);
    if (quotedMatch && quotedMatch[1]) {
      extractedName = quotedMatch[1].trim();
    }
  }

  // 3. filename=... 따옴표 없는 경우
  if (!extractedName) {
    const unquotedMatch = header.match(/filename=([^; ]+)/i);
    if (unquotedMatch && unquotedMatch[1]) {
      extractedName = unquotedMatch[1].trim();
    }
  }

  return sanitizeFilename(extractedName, fallback);
}

/**
 * 브라우저 환경에서 Blob 데이터를 지정된 파일명으로 다운로드합니다.
 * 대용량 파일(50MB~100MB) 다운로드 시 브라우저가 디스크에 쓰기 전에 메모리 참조가 끊어지지 않도록
 * URL.revokeObjectURL을 1초 지연 실행합니다.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const safeFilename = sanitizeFilename(filename, 'download.pdf');
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 대용량 파일 안정성을 위해 비동기 지연 해제 적용
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, BLOB_REVOKE_DELAY_MS);
}
