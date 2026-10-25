import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ExportImageModal } from './ExportImageModal';

describe('ExportImageModal Component', () => {
  it('isOpen이 false일 때는 아무것도 렌더링하지 않아야 한다', () => {
    const { container } = render(
      <ExportImageModal
        isOpen={false}
        onClose={vi.fn()}
        onExport={vi.fn()}
        tableCount={3}
        connectorCount={2}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('모달이 열리면 포맷 옵션(SVG, PNG, JPG)과 요약 정보가 표시되어야 한다', () => {
    render(
      <ExportImageModal
        isOpen={true}
        onClose={vi.fn()}
        onExport={vi.fn()}
        tableCount={3}
        connectorCount={2}
      />
    );

    expect(screen.getByText('ERD 다이어그램 이미지 내보내기')).toBeTruthy();
    expect(screen.getByText('SVG')).toBeTruthy();
    expect(screen.getByText('PNG')).toBeTruthy();
    expect(screen.getByText('JPG')).toBeTruthy();
    expect(screen.getByText('3개 테이블, 2개 관계선')).toBeTruthy();
  });

  it('기본으로 SVG가 선택되어 있고 이미지 다운로드 클릭 시 svg 포맷으로 내보내져야 한다', async () => {
    const onExportMock = vi.fn().mockResolvedValue(undefined);
    const onCloseMock = vi.fn();

    render(
      <ExportImageModal
        isOpen={true}
        onClose={onCloseMock}
        onExport={onExportMock}
        tableCount={3}
        connectorCount={2}
      />
    );

    const downloadBtn = screen.getByRole('button', { name: /이미지 다운로드/i });
    fireEvent.click(downloadBtn);

    expect(onExportMock).toHaveBeenCalledWith('svg', 2);
    await waitFor(() => {
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('PNG 선택 시 해상도 배율(1x, 2x, 3x)을 선택하여 내보낼 수 있어야 한다', async () => {
    const onExportMock = vi.fn().mockResolvedValue(undefined);
    const onCloseMock = vi.fn();

    render(
      <ExportImageModal
        isOpen={true}
        onClose={onCloseMock}
        onExport={onExportMock}
        tableCount={3}
        connectorCount={2}
      />
    );

    // PNG 카드 클릭
    const pngCard = screen.getByText('PNG').closest('button');
    expect(pngCard).toBeTruthy();
    if (pngCard) {
      fireEvent.click(pngCard);
    }

    // 3x 해상도 버튼 클릭
    const scale3Btn = screen.getByText('3x').closest('button');
    expect(scale3Btn).toBeTruthy();
    if (scale3Btn) {
      fireEvent.click(scale3Btn);
    }

    // 다운로드 실행
    const downloadBtn = screen.getByRole('button', { name: /이미지 다운로드/i });
    fireEvent.click(downloadBtn);

    expect(onExportMock).toHaveBeenCalledWith('png', 3);
    await waitFor(() => {
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('취소 버튼이나 닫기 버튼 클릭 시 onClose가 호출되어야 한다', () => {
    const onCloseMock = vi.fn();

    render(
      <ExportImageModal
        isOpen={true}
        onClose={onCloseMock}
        onExport={vi.fn()}
        tableCount={3}
        connectorCount={2}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: '취소' });
    fireEvent.click(cancelBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByTitle('닫기');
    fireEvent.click(closeBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(2);
  });
});
