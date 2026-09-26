import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractFilenameFromContentDisposition,
  triggerBlobDownload,
  sanitizeFilename,
  BLOB_REVOKE_DELAY_MS,
} from './download';

describe('download utils', () => {
  describe('sanitizeFilename', () => {
    it('유효한 일반 파일명은 그대로 유지해야 한다', () => {
      expect(sanitizeFilename('report-2026.pdf', 'fallback.pdf')).toBe(
        'report-2026.pdf',
      );
      expect(sanitizeFilename('한글_문서_v1.0.pdf', 'fallback.pdf')).toBe(
        '한글_문서_v1.0.pdf',
      );
    });

    it('경로 탐색(Directory Traversal) 문자를 안전하게 정제해야 한다', () => {
      expect(sanitizeFilename('../../etc/passwd.pdf', 'fallback.pdf')).toBe(
        'etc_passwd.pdf',
      );
      expect(sanitizeFilename('..\\windows\\system32.pdf', 'fallback.pdf')).toBe(
        'windows_system32.pdf',
      );
    });

    it('OS 파일 시스템 금지 특수문자를 언더스코어로 치환해야 한다', () => {
      expect(sanitizeFilename('my:file*name?test"1<2>3|4.pdf', 'fallback.pdf')).toBe(
        'my_file_name_test_1_2_3_4.pdf',
      );
    });

    it('비어있거나 위험한 문자만 있을 경우 fallback 파일명을 반환해야 한다', () => {
      expect(sanitizeFilename('', 'default.pdf')).toBe('default.pdf');
      expect(sanitizeFilename(null, 'default.pdf')).toBe('default.pdf');
      expect(sanitizeFilename(undefined, 'default.pdf')).toBe('default.pdf');
      expect(sanitizeFilename('...', 'default.pdf')).toBe('default.pdf');
      expect(sanitizeFilename('///', 'default.pdf')).toBe('default.pdf');
    });
  });

  describe('extractFilenameFromContentDisposition', () => {
    it('헤더가 없으면 정제된 fallback 파일명을 반환해야 한다', () => {
      expect(extractFilenameFromContentDisposition(null, 'default.pdf')).toBe(
        'default.pdf',
      );
      expect(
        extractFilenameFromContentDisposition(undefined, 'default.pdf'),
      ).toBe('default.pdf');
    });

    it('일반 쌍따옴표 filename을 추출하고 정제해야 한다', () => {
      const header = 'attachment; filename="report-2026.pdf"';
      expect(extractFilenameFromContentDisposition(header, 'default.pdf')).toBe(
        'report-2026.pdf',
      );
    });

    it('따옴표 없는 filename을 추출해야 한다', () => {
      const header = 'attachment; filename=document.pdf';
      expect(extractFilenameFromContentDisposition(header, 'default.pdf')).toBe(
        'document.pdf',
      );
    });

    it('RFC 5987 UTF-8 인코딩 filename*을 우선 추출해야 한다', () => {
      const encoded = encodeURIComponent('한글문서.pdf');
      const header = `attachment; filename="fallback.pdf"; filename*=UTF-8''${encoded}`;
      expect(extractFilenameFromContentDisposition(header, 'default.pdf')).toBe(
        '한글문서.pdf',
      );
    });

    it('Content-Disposition 내의 악성 파일명을 정제해야 한다', () => {
      const header = 'attachment; filename="../../../etc/shadow.pdf"';
      expect(extractFilenameFromContentDisposition(header, 'default.pdf')).toBe(
        'etc_shadow.pdf',
      );
    });
  });

  describe('triggerBlobDownload', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('대용량 파일 안전을 위해 다운로드 직후 revoke하지 않고 1초 지연 후 메모리를 해제해야 한다', () => {
      const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
      const revokeObjectURLMock = vi.fn();
      window.URL.createObjectURL = createObjectURLMock;
      window.URL.revokeObjectURL = revokeObjectURLMock;

      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      const blob = new Blob(['sample content'], { type: 'application/pdf' });
      triggerBlobDownload(blob, 'downloaded.pdf');

      // 1. DOM 조작 및 클릭은 즉시 발생
      expect(createObjectURLMock).toHaveBeenCalledWith(blob);
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      // 2. 동기적(즉시)으로는 아직 revoke가 호출되지 않아야 함 (대용량 파일 I/O 보호)
      expect(revokeObjectURLMock).not.toHaveBeenCalled();

      // 3. 유예 기간(BLOB_REVOKE_DELAY_MS) 경과 후 안전하게 revoke 호출 확인
      vi.advanceTimersByTime(BLOB_REVOKE_DELAY_MS);
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});
