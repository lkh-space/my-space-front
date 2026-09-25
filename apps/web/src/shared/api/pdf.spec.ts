import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as client from './client';
import {
  inspectPdf,
  unlockPdf,
  mergePdf,
  splitPdfRange,
  splitPdfAll,
} from './pdf';

describe('pdf api module', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const dummyFile = new File(['%PDF-1.4 dummy'], 'sample.pdf', {
    type: 'application/pdf',
  });

  it('inspectPdf 호출 시 FormData에 file과 password를 올바르게 담아 전송해야 한다', async () => {
    const postSpy = vi.spyOn(client, 'postFormData').mockResolvedValue({
      isEncrypted: true,
      pageCount: 10,
    });

    const res = await inspectPdf(dummyFile, 'secret123');

    expect(postSpy).toHaveBeenCalledWith(
      '/api/v1/pdf/inspect',
      expect.any(FormData),
    );
    expect(res).toEqual({ isEncrypted: true, pageCount: 10 });
  });

  it('unlockPdf 호출 시 downloadBlob을 호출해야 한다', async () => {
    const mockBlob = new Blob(['unlocked content']);
    const downloadSpy = vi.spyOn(client, 'downloadBlob').mockResolvedValue({
      blob: mockBlob,
      filename: 'unlocked.pdf',
    });

    const res = await unlockPdf(dummyFile, 'pw');

    expect(downloadSpy).toHaveBeenCalledWith(
      '/api/v1/pdf/unlock',
      expect.any(FormData),
      'unlocked.pdf',
    );
    expect(res.filename).toBe('unlocked.pdf');
  });

  it('mergePdf 호출 시 복수 파일과 JSON 암호 배열을 FormData에 담아야 한다', async () => {
    const file2 = new File(['%PDF-1.4 dummy 2'], 'sample2.pdf', {
      type: 'application/pdf',
    });
    const downloadSpy = vi.spyOn(client, 'downloadBlob').mockResolvedValue({
      blob: new Blob(['merged content']),
      filename: 'merged.pdf',
    });

    await mergePdf([dummyFile, file2], ['pw1', '']);

    expect(downloadSpy).toHaveBeenCalledWith(
      '/api/v1/pdf/merge',
      expect.any(FormData),
      'merged.pdf',
    );
  });

  it('splitPdfRange 호출 시 페이지 범위와 비밀번호를 FormData에 담아야 한다', async () => {
    const downloadSpy = vi.spyOn(client, 'downloadBlob').mockResolvedValue({
      blob: new Blob(['split range content']),
      filename: 'extracted.pdf',
    });

    await splitPdfRange(dummyFile, '1-3, 5', 'pw');

    expect(downloadSpy).toHaveBeenCalledWith(
      '/api/v1/pdf/split/range',
      expect.any(FormData),
      'extracted.pdf',
    );
  });

  it('splitPdfAll 호출 시 split/all 엔드포인트로 downloadBlob을 호출해야 한다', async () => {
    const downloadSpy = vi.spyOn(client, 'downloadBlob').mockResolvedValue({
      blob: new Blob(['zip content']),
      filename: 'split-pages.zip',
    });

    await splitPdfAll(dummyFile, 'pw');

    expect(downloadSpy).toHaveBeenCalledWith(
      '/api/v1/pdf/split/all',
      expect.any(FormData),
      'split-pages.zip',
    );
  });
});
