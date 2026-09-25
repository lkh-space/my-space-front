/**
 * Content-Disposition 헤더에서 파일명을 추출합니다.
 * RFC 5987 / 6266 규격(filename*=UTF-8''...) 및 일반 filename="..." 규격을 모두 지원합니다.
 */
export function extractFilenameFromContentDisposition(
  header: string | null | undefined,
  fallback: string,
): string {
  if (!header) return fallback;

  // 1. filename*=UTF-8''... (RFC 5987) 인코딩 우선 확인
  const rfc5987Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (rfc5987Match && rfc5987Match[1]) {
    try {
      return decodeURIComponent(rfc5987Match[1].trim());
    } catch {
      // 디코딩 실패 시 다음 매칭으로 이동
    }
  }

  // 2. filename="..." 일반 쌍따옴표 확인
  const quotedMatch = header.match(/filename="([^"]+)"/i);
  if (quotedMatch && quotedMatch[1]) {
    return quotedMatch[1].trim();
  }

  // 3. filename=... 따옴표 없는 경우
  const unquotedMatch = header.match(/filename=([^; ]+)/i);
  if (unquotedMatch && unquotedMatch[1]) {
    return unquotedMatch[1].trim();
  }

  return fallback;
}

/**
 * 브라우저 환경에서 Blob 데이터를 지정된 파일명으로 다운로드합니다.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
