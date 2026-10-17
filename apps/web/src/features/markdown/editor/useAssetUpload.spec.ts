import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAssetUpload } from './useAssetUpload';
import * as markdownEntity from '../../../entities/markdown';

vi.mock('../../../entities/markdown', () => ({
  uploadAsset: vi.fn(),
}));

describe('useAssetUpload 훅', () => {
  const mockOnInsertMarkdown = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('허용된 이미지 파일(PNG) 업로드 성공 시 마크다운 이미지 문법을 삽입해야 한다', async () => {
    vi.spyOn(markdownEntity, 'uploadAsset').mockResolvedValueOnce({
      key: 'asset-1',
      filename: 'diagram.png',
      url: '/assets/diagram.png',
      size: 1024,
      contentType: 'image/png',
    });

    const { result } = renderHook(() =>
      useAssetUpload({ onInsertMarkdown: mockOnInsertMarkdown }),
    );

    const validFile = new File(['dummy-png-data'], 'diagram.png', {
      type: 'image/png',
    });

    await act(async () => {
      await result.current.processAndUploadFile(validFile);
    });

    expect(markdownEntity.uploadAsset).toHaveBeenCalledWith(validFile);
    expect(mockOnInsertMarkdown).toHaveBeenCalledWith('\n![diagram.png](/assets/diagram.png)\n');
    expect(result.current.uploadError).toBeNull();
    expect(result.current.isUploading).toBe(false);
  });

  it('지원하지 않는 파일 형식(text/plain, application/pdf 등) 업로드 시도시 거부해야 한다', async () => {
    const { result } = renderHook(() =>
      useAssetUpload({ onInsertMarkdown: mockOnInsertMarkdown }),
    );

    const invalidFile = new File(['text content'], 'document.txt', {
      type: 'text/plain',
    });

    await act(async () => {
      await result.current.processAndUploadFile(invalidFile);
    });

    expect(markdownEntity.uploadAsset).not.toHaveBeenCalled();
    expect(mockOnInsertMarkdown).not.toHaveBeenCalled();
    expect(result.current.uploadError).toContain('지원하지 않는 이미지 형식입니다');
  });

  it('파일 크기가 10MB를 초과하는 경우 업로드를 차단해야 한다', async () => {
    const { result } = renderHook(() =>
      useAssetUpload({ onInsertMarkdown: mockOnInsertMarkdown }),
    );

    // 10MB + 1 byte
    const oversizedFile = new File(['dummy'], 'large-image.png', {
      type: 'image/png',
    });
    Object.defineProperty(oversizedFile, 'size', {
      value: 10 * 1024 * 1024 + 1,
    });

    await act(async () => {
      await result.current.processAndUploadFile(oversizedFile);
    });

    expect(markdownEntity.uploadAsset).not.toHaveBeenCalled();
    expect(result.current.uploadError).toContain('이미지 크기는 최대 10MB까지 가능합니다');
  });

  it('업로드 API 호출 실패 시 에러 메시지를 상태에 설정해야 한다', async () => {
    vi.spyOn(markdownEntity, 'uploadAsset').mockRejectedValueOnce(
      new Error('S3 버킷 연결 실패'),
    );

    const { result } = renderHook(() =>
      useAssetUpload({ onInsertMarkdown: mockOnInsertMarkdown }),
    );

    const validFile = new File(['image-data'], 'test.webp', {
      type: 'image/webp',
    });

    await act(async () => {
      await result.current.processAndUploadFile(validFile);
    });

    expect(result.current.uploadError).toBe('S3 버킷 연결 실패');
    expect(result.current.isUploading).toBe(false);
  });

  it('클립보드 붙여넣기(handlePaste) 시 이미지 아이템이 있으면 업로드를 처리해야 한다', async () => {
    vi.spyOn(markdownEntity, 'uploadAsset').mockResolvedValueOnce({
      key: 'asset-pasted',
      filename: 'pasted.png',
      url: '/assets/pasted.png',
      size: 500,
      contentType: 'image/png',
    });

    const { result } = renderHook(() =>
      useAssetUpload({ onInsertMarkdown: mockOnInsertMarkdown }),
    );

    const pastedFile = new File(['pasted-data'], 'image.png', {
      type: 'image/png',
    });

    const mockItem = {
      type: 'image/png',
      getAsFile: () => pastedFile,
    };

    const mockPasteEvent = {
      clipboardData: {
        items: [mockItem],
      },
      preventDefault: vi.fn(),
    } as unknown as React.ClipboardEvent;

    await act(async () => {
      result.current.handlePaste(mockPasteEvent);
    });

    expect(mockPasteEvent.preventDefault).toHaveBeenCalled();
    expect(markdownEntity.uploadAsset).toHaveBeenCalledWith(pastedFile);
  });

  it('드래그 앤 드롭(handleDrop) 시 이미지 파일이 전달되면 업로드를 처리해야 한다', async () => {
    vi.spyOn(markdownEntity, 'uploadAsset').mockResolvedValueOnce({
      key: 'asset-dropped',
      filename: 'dropped.jpg',
      url: '/assets/dropped.jpg',
      size: 1500,
      contentType: 'image/jpeg',
    });

    const { result } = renderHook(() =>
      useAssetUpload({ onInsertMarkdown: mockOnInsertMarkdown }),
    );

    const droppedFile = new File(['dropped-data'], 'dropped.jpg', {
      type: 'image/jpeg',
    });

    const mockDropEvent = {
      dataTransfer: {
        files: [droppedFile],
      },
      preventDefault: vi.fn(),
    } as unknown as React.DragEvent;

    await act(async () => {
      result.current.handleDrop(mockDropEvent);
    });

    expect(mockDropEvent.preventDefault).toHaveBeenCalled();
    expect(markdownEntity.uploadAsset).toHaveBeenCalledWith(droppedFile);
  });
});
