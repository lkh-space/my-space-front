import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractFilenameFromContentDisposition,
  triggerBlobDownload,
} from './download';

describe('download utils', () => {
  describe('extractFilenameFromContentDisposition', () => {
    it('헤더가 없으면 fallback 파일명을 반환해야 한다', () => {
      expect(extractFilenameFromContentDisposition(null, 'default.pdf')).toBe(
        'default.pdf',
      );
      expect(
        extractFilenameFromContentDisposition(undefined, 'default.pdf'),
      ).toBe('default.pdf');
    });

    it('일반 쌍따옴표 filename을 추출해야 한다', () => {
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
  });

  describe('triggerBlobDownload', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('임시 <a> 태그를 생성하여 브라우저 다운로드를 트리거해야 한다', () => {
      const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
      const revokeObjectURLMock = vi.fn();
      window.URL.createObjectURL = createObjectURLMock;
      window.URL.revokeObjectURL = revokeObjectURLMock;

      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      const blob = new Blob(['sample content'], { type: 'application/pdf' });
      triggerBlobDownload(blob, 'downloaded.pdf');

      expect(createObjectURLMock).toHaveBeenCalledWith(blob);
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});
