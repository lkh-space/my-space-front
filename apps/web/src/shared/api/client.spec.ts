import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { postFormData, downloadBlob, getJson } from './client';
import { ApiError } from './types';

describe('api client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('postFormData', () => {
    it('성공 시 파싱된 JSON 데이터를 반환해야 한다', () => {
      const mockData = { isEncrypted: false, pageCount: 5 };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as unknown as Response);

      const formData = new FormData();
      formData.append('key', 'value');

      return expect(
        postFormData('/api/v1/pdf/inspect', formData),
      ).resolves.toEqual(mockData);
    });

    it('서버가 JSON 에러 객체를 반환하면 ApiError 인스턴스를 throw해야 한다', async () => {
      const errorPayload = {
        statusCode: 400,
        code: 'PDF_INVALID_PASSWORD',
        message: '비밀번호가 올바르지 않습니다.',
        timestamp: '2026-09-26T00:00:00.000Z',
        path: '/api/v1/pdf/inspect',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => errorPayload,
        text: async () => JSON.stringify(errorPayload),
      } as unknown as Response);

      const formData = new FormData();

      await expect(
        postFormData('/api/v1/pdf/inspect', formData),
      ).rejects.toThrow(ApiError);

      try {
        await postFormData('/api/v1/pdf/inspect', formData);
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiError = err as ApiError;
        expect(apiError.code).toBe('PDF_INVALID_PASSWORD');
        expect(apiError.statusCode).toBe(400);
        expect(apiError.message).toBe('비밀번호가 올바르지 않습니다.');
      }
    });

    it('비-JSON 에러인 경우 기본 Error를 throw해야 한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => '게이트웨이 타임아웃',
      } as unknown as Response);

      const formData = new FormData();

      await expect(
        postFormData('/api/v1/pdf/inspect', formData),
      ).rejects.toThrow('게이트웨이 타임아웃');
    });
  });

  describe('downloadBlob', () => {
    it('성공 시 응답 Blob과 파싱된 파일명을 반환해야 한다', async () => {
      const mockBlob = new Blob(['pdf-data'], { type: 'application/pdf' });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({
          'content-disposition': 'attachment; filename="custom-output.pdf"',
        }),
        blob: async () => mockBlob,
      } as unknown as Response);

      const formData = new FormData();
      const result = await downloadBlob(
        '/api/v1/pdf/unlock',
        formData,
        'fallback.pdf',
      );

      expect(result.blob).toBe(mockBlob);
      expect(result.filename).toBe('custom-output.pdf');
    });

    it('에러 응답 시 JSON ApiErrorResponse를 파싱하여 ApiError를 throw해야 한다', async () => {
      const errorPayload = {
        statusCode: 413,
        code: 'PDF_FILE_SIZE_EXCEEDED',
        message: '파일 크기 한도를 초과했습니다.',
        timestamp: '2026-09-26T00:00:00.000Z',
        path: '/api/v1/pdf/merge',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 413,
        statusText: 'Payload Too Large',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => errorPayload,
        text: async () => JSON.stringify(errorPayload),
      } as unknown as Response);

      const formData = new FormData();
      await expect(
        downloadBlob('/api/v1/pdf/merge', formData, 'fallback.pdf'),
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getJson', () => {
    it('성공 시 파싱된 JSON 데이터를 반환하고 credentials: same-origin을 포함해야 한다', async () => {
      const mockData = {
        username: 'local-admin',
        displayName: 'Local Developer',
        email: 'dev@homelab.local',
        groups: ['admins', 'dev'],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      } as unknown as Response);

      const result = await getJson('/api/v1/auth/me');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/auth/me',
        expect.objectContaining({
          method: 'GET',
          credentials: 'same-origin',
        }),
      );
    });

    it('서버 에러 시 ApiError 또는 일반 Error를 throw해야 한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          statusCode: 401,
          code: 'UNAUTHORIZED',
          message: '인증 정보가 없습니다.',
        }),
      } as unknown as Response);

      await expect(getJson('/api/v1/auth/me')).rejects.toThrow(ApiError);
    });
  });
});

