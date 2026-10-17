import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SqlPreviewModal } from './SqlPreviewModal';

describe('SqlPreviewModal Component (P2)', () => {
  const sampleSql = `CREATE TABLE "users" (\n  "id" INTEGER PRIMARY KEY\n);`;
  let onCloseMock: () => void;

  beforeEach(() => {
    onCloseMock = vi.fn();

    // Clipboard Mock
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    // URL Mock
    if (typeof URL.createObjectURL === 'undefined') {
      URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      URL.revokeObjectURL = vi.fn();
    }

    if (typeof Range !== 'undefined') {
      Range.prototype.getClientRects = () =>
        ({
          item: () => null,
          length: 0,
          [Symbol.iterator]: () => [][Symbol.iterator](),
        } as unknown as DOMRectList);
      Range.prototype.getBoundingClientRect = () =>
        ({
          x: 0,
          y: 0,
          bottom: 0,
          height: 0,
          left: 0,
          right: 0,
          top: 0,
          width: 0,
          toJSON: () => ({ x: 0, y: 0 }),
        } as DOMRect);
    }
  });

  it('isOpen이 false이면 아무것도 렌더링하지 않아야 한다', () => {
    const { container } = render(
      <SqlPreviewModal
        isOpen={false}
        onClose={onCloseMock}
        sqlContent={sampleSql}
        dialect="postgres"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('isOpen이 true이면 다이얼렉트 타이틀, 글자 수, 라인 수가 렌더링되어야 한다', () => {
    render(
      <SqlPreviewModal
        isOpen={true}
        onClose={onCloseMock}
        sqlContent={sampleSql}
        dialect="postgres"
      />
    );

    expect(screen.getByText(/Generated SQL DDL \(POSTGRES\)/i)).toBeTruthy();
    expect(screen.getByText(/3 lines/i)).toBeTruthy();
    expect(screen.getByText('Copy SQL')).toBeTruthy();
    expect(screen.getByText('Download .sql')).toBeTruthy();
  });

  it('fromFallback이 true이면 Local Engine 뱃지가 표시되어야 한다', () => {
    render(
      <SqlPreviewModal
        isOpen={true}
        onClose={onCloseMock}
        sqlContent={sampleSql}
        dialect="mysql"
        fromFallback={true}
      />
    );

    expect(screen.getByText('Local Engine')).toBeTruthy();
  });

  it('닫기 버튼 클릭 시 onClose 콜백이 호출되어야 한다', () => {
    render(
      <SqlPreviewModal
        isOpen={true}
        onClose={onCloseMock}
        sqlContent={sampleSql}
        dialect="postgres"
      />
    );

    const closeBtn = screen.getByRole('button', { name: 'close' });
    fireEvent.click(closeBtn);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('Copy SQL 클릭 시 클립보드에 복사되고 Copied! 문구로 변경되어야 한다', async () => {
    render(
      <SqlPreviewModal
        isOpen={true}
        onClose={onCloseMock}
        sqlContent={sampleSql}
        dialect="postgres"
      />
    );

    const copyBtn = screen.getByRole('button', { name: /Copy SQL/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(sampleSql);
      expect(screen.getByText('Copied!')).toBeTruthy();
    });
  });

  it('Download .sql 클릭 시 브라우저 다운로드가 트리거되어야 한다', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    render(
      <SqlPreviewModal
        isOpen={true}
        onClose={onCloseMock}
        sqlContent={sampleSql}
        dialect="sqlite"
      />
    );

    const downloadBtn = screen.getByRole('button', { name: /Download \.sql/i });
    fireEvent.click(downloadBtn);

    expect(clickSpy).toHaveBeenCalled();
  });
});
