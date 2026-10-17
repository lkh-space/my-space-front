import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PdfToolsPage } from './PdfToolsPage';
import * as api from '../../shared/api';
import { getRecentTasks } from '../../shared/utils/storage';

describe('PdfToolsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    // 기본 inspectPdf 모의 구현 (일반 암호화 안 된 파일)
    vi.spyOn(api, 'inspectPdf').mockResolvedValue({
      isEncrypted: false,
      pageCount: 5,
    });
  });

  it('헤더, 드롭존, 4대 모드 탭, 작업 실행 요약 패널이 기본 렌더링되어야 한다', () => {
    render(<PdfToolsPage />);

    // 헤더 확인
    expect(
      screen.getByRole('heading', { name: 'PDF 처리 엔진' }),
    ).toBeTruthy();
    expect(screen.getByText('v1.2')).toBeTruthy();
    expect(screen.getByText('ZERO-TELEMETRY')).toBeTruthy();

    // 4대 작업 모드 탭 확인
    expect(screen.getByRole('tab', { name: /병합/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /범위 분할/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /낱장 분할/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /암호 해제/ })).toBeTruthy();

    // 파일 드롭존 확인
    expect(screen.getByText(/문서를 드래그하여 놓거나/)).toBeTruthy();

    // 실행 요약 패널 확인
    expect(
      screen.getByRole('heading', { name: /작업 실행 요약/ }),
    ).toBeTruthy();
    expect(screen.getByText('0 B')).toBeTruthy();

    // 초기 파일 없음 상태에서는 작업 실행 버튼 비활성화
    const executeBtn = screen.getByRole('button', { name: /작업 실행/i });
    expect(executeBtn.hasAttribute('disabled')).toBe(true);
  });

  it('작업 모드 탭을 클릭하면 활성 모드가 변경되고 설정 폼이 전환되어야 한다', () => {
    render(<PdfToolsPage />);

    // 초기에는 범위 분할 입력 인풋이 없어야 함
    expect(screen.queryByLabelText(/추출할 페이지 범위/i)).toBeNull();

    // '범위 분할' 탭 클릭
    const splitRangeTab = screen.getByRole('tab', { name: /범위 분할/ });
    fireEvent.click(splitRangeTab);

    // 범위 분할 입력 인풋이 나타나야 함
    const rangeInput = screen.getByLabelText(/추출할 페이지 범위/i);
    expect(rangeInput).toBeTruthy();

    // 산출물 파일명이 extracted.pdf로 갱신되어야 함
    expect(screen.getByText('extracted.pdf')).toBeTruthy();

    // '낱장 분할' 탭 클릭
    const splitAllTab = screen.getByRole('tab', { name: /낱장 분할/ });
    fireEvent.click(splitAllTab);
    expect(screen.getByText('split_pages.zip')).toBeTruthy();

    // '암호 해제' 탭 클릭
    const unlockTab = screen.getByRole('tab', { name: /암호 해제/ });
    fireEvent.click(unlockTab);
    expect(screen.getByText('unlocked.pdf')).toBeTruthy();
  });

  it('파일 드롭존을 통해 PDF 파일을 선택하면 파일 목록과 요약 용량이 갱신되고 백엔드 inspect가 반영되어야 한다', async () => {
    vi.spyOn(api, 'inspectPdf').mockResolvedValue({
      isEncrypted: true,
      pageCount: 12,
    });

    const { container } = render(<PdfToolsPage />);

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    const sampleFile1 = new File(['%PDF-1.4 dummy content 1'], 'spec-1.pdf', {
      type: 'application/pdf',
    });
    const sampleFile2 = new File(['%PDF-1.4 dummy content 2'], 'spec-2.pdf', {
      type: 'application/pdf',
    });

    // 파일 선택 이벤트 발생
    fireEvent.change(fileInput, {
      target: { files: [sampleFile1, sampleFile2] },
    });

    // 파일 목록 헤더 및 파일 카드 확인
    expect(screen.getByText('선택된 파일 (2개)')).toBeTruthy();
    expect(screen.getByText('spec-1.pdf')).toBeTruthy();
    expect(screen.getByText('spec-2.pdf')).toBeTruthy();

    // inspect 완료 후 페이지 수 및 암호화 여부 갱신 확인
    await waitFor(() => {
      expect(screen.getAllByText(/12 페이지/).length).toBe(2);
      expect(screen.getAllByText(/암호화됨/).length).toBe(2);
    });

    // 2개 파일이 있으므로 병합 모드에서 작업 실행 버튼 활성화
    const executeBtn = screen.getByRole('button', { name: /작업 실행/i });
    expect(executeBtn.hasAttribute('disabled')).toBe(false);
  });

  it('개별 파일 삭제 버튼을 누르면 목록에서 제거되어야 한다', async () => {
    const { container } = render(<PdfToolsPage />);

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const sampleFile = new File(['%PDF-1.4 sample'], 'delete-me.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, {
      target: { files: [sampleFile] },
    });

    await waitFor(() => {
      expect(screen.getByText('delete-me.pdf')).toBeTruthy();
    });

    // 삭제 버튼 클릭
    const deleteBtn = screen.getByRole('button', {
      name: 'delete-me.pdf 파일 제거',
    });
    fireEvent.click(deleteBtn);

    // 목록에서 사라졌는지 확인
    await waitFor(() => {
      expect(screen.queryByText('delete-me.pdf')).toBeNull();
    });
  });

  it('초기화 버튼을 누르면 모든 파일 목록이 비워져야 한다', async () => {
    const { container } = render(<PdfToolsPage />);

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const sampleFile = new File(['%PDF-1.4 sample'], 'reset-target.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, {
      target: { files: [sampleFile] },
    });

    await waitFor(() => {
      expect(screen.getByText('reset-target.pdf')).toBeTruthy();
    });

    // 초기화 버튼 클릭
    const resetBtn = screen.getByRole('button', { name: '초기화' });
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(screen.queryByText('reset-target.pdf')).toBeNull();
    });
  });

  it('병합 작업 실행 시 백엔드 mergePdf를 호출하고 파일 다운로드 및 최근 작업 등록이 이루어져야 한다', async () => {
    const mergeSpy = vi.spyOn(api, 'mergePdf').mockResolvedValue({
      blob: new Blob(['merged pdf']),
      filename: 'merged.pdf',
    });
    const downloadSpy = vi
      .spyOn(api, 'triggerBlobDownload')
      .mockImplementation(() => {
        // 다운로드 시뮬레이션
      });

    const { container } = render(<PdfToolsPage />);
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file1 = new File(['%PDF-1'], 'doc1.pdf', { type: 'application/pdf' });
    const file2 = new File(['%PDF-2'], 'doc2.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    await waitFor(() => {
      expect(screen.getByText('doc1.pdf')).toBeTruthy();
      expect(screen.getByText('doc2.pdf')).toBeTruthy();
    });

    const executeBtn = screen.getByRole('button', { name: /작업 실행/i });
    fireEvent.click(executeBtn);

    await waitFor(() => {
      expect(mergeSpy).toHaveBeenCalledTimes(1);
      expect(downloadSpy).toHaveBeenCalledWith(expect.any(Blob), 'merged.pdf');
      expect(
        screen.getByText(/작업이 완료되어 'merged.pdf' 파일이 다운로드되었습니다/),
      ).toBeTruthy();
    });

    // 최근 작업 이력에 등록되었는지 로컬스토리지 확인
    const recentTasks = getRecentTasks();
    expect(recentTasks[0].title).toBe('doc1.pdf');
    expect(recentTasks[0].detail).toBe('2개 파일 병합 완료');
  });

  it('백엔드에서 도메인 비즈니스 에러 반환 시 친절한 한국어 에러 메시지를 표시해야 한다', async () => {
    vi.spyOn(api, 'mergePdf').mockRejectedValue(
      new api.ApiError({
        statusCode: 400,
        code: 'PDF_INVALID_PASSWORD',
        message: 'Password mismatch',
        timestamp: '2026-09-26T00:00:00.000Z',
        path: '/api/v1/pdf/merge',
      }),
    );

    const { container } = render(<PdfToolsPage />);
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file1 = new File(['%PDF-1'], 'f1.pdf', { type: 'application/pdf' });
    const file2 = new File(['%PDF-2'], 'f2.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    const executeBtn = screen.getByRole('button', { name: /작업 실행/i });
    fireEvent.click(executeBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          '비밀번호가 올바르지 않습니다. 암호를 다시 확인해 주세요.',
        ),
      ).toBeTruthy();
    });
  });

  describe('클라이언트 파일 검증 및 예외 처리 (P0)', () => {
    it('확장자나 MIME 타입이 PDF가 아닌 파일을 선택하면 에러 알림을 띄우고 목록에 추가하지 않아야 한다', () => {
      const { container } = render(<PdfToolsPage />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      const nonPdfFile = new File(['fake content'], 'test.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [nonPdfFile] } });

      expect(
        screen.getByText("'test.png' 파일은 지원되지 않는 형식입니다. PDF 파일만 업로드할 수 있습니다."),
      ).toBeTruthy();
      expect(screen.queryByText('test.png')).toBeNull();
    });

    it('단일 파일 크기가 50MB를 초과하면 거부하고 에러 알림을 띄워야 한다', () => {
      const { container } = render(<PdfToolsPage />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      const oversizedFile = new File([''], 'oversized.pdf', { type: 'application/pdf' });
      Object.defineProperty(oversizedFile, 'size', {
        value: 51 * 1024 * 1024,
        configurable: true,
      });

      fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

      expect(
        screen.getByText("'oversized.pdf' 파일이 단일 파일 최대 용량(50MB)을 초과했습니다."),
      ).toBeTruthy();
      expect(screen.queryByText('oversized.pdf')).toBeNull();
    });

    it('전체 파일 크기가 100MB를 초과하면 추가 파일을 거부하고 안내 메시지를 표시해야 한다', async () => {
      const { container } = render(<PdfToolsPage />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      // 60MB 파일 1개
      const file1 = new File([''], 'doc1.pdf', { type: 'application/pdf' });
      Object.defineProperty(file1, 'size', {
        value: 45 * 1024 * 1024,
        configurable: true,
      });

      // 60MB 파일 2개째 (합계 105MB)
      const file2 = new File([''], 'doc2.pdf', { type: 'application/pdf' });
      Object.defineProperty(file2, 'size', {
        value: 45 * 1024 * 1024,
        configurable: true,
      });

      const file3 = new File([''], 'doc3.pdf', { type: 'application/pdf' });
      Object.defineProperty(file3, 'size', {
        value: 20 * 1024 * 1024,
        configurable: true,
      });

      fireEvent.change(fileInput, { target: { files: [file1, file2, file3] } });

      await waitFor(() => {
        expect(
          screen.getByText('전체 업로드 용량(100MB)을 초과할 수 없습니다.'),
        ).toBeTruthy();
      });
    });

    it('파일 사전검사(inspect) 중 PDF_FILE_CORRUPTED 에러 반환 시 목록에서 자동 제거하고 에러를 표시해야 한다', async () => {
      vi.spyOn(api, 'inspectPdf').mockRejectedValueOnce(
        new api.ApiError({
          statusCode: 400,
          code: 'PDF_FILE_CORRUPTED',
          message: 'Corrupted stream',
          timestamp: '2026-09-26T00:00:00.000Z',
          path: '/api/v1/pdf/inspect',
        }),
      );

      const { container } = render(<PdfToolsPage />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

      const corruptFile = new File(['corrupt data'], 'corrupt.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [corruptFile] } });

      await waitFor(() => {
        expect(
          screen.getByText("'corrupt.pdf' 파일이 손상되었거나 유효한 PDF 형식이 아닙니다."),
        ).toBeTruthy();
        expect(screen.queryByText('corrupt.pdf')).toBeNull();
      });
    });
  });

  describe('모드별 작업 실행 및 폼 유효성 검사 (P2)', () => {
    it('split-range 모드에서 페이지 범위를 입력하지 않으면 실행 버튼이 비활성화되고 안내 문구를 표시해야 한다', async () => {
      const { container } = render(<PdfToolsPage />);

      // 범위 분할 탭으로 전환
      const splitRangeTab = screen.getByRole('tab', { name: /범위 분할/ });
      fireEvent.click(splitRangeTab);

      // 파일 1개 등록
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['%PDF-1.4 test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeTruthy();
      });

      // 범위 미입력 시 안내 문구 및 버튼 비활성화 확인
      expect(
        screen.getByText(/페이지 범위를 입력해주세요/i),
      ).toBeTruthy();

      const executeBtn = screen.getByRole('button', { name: /작업 실행/i });
      expect(executeBtn.hasAttribute('disabled')).toBe(true);
    });

    it('split-range 모드에서 유효한 페이지 범위 입력 후 실행 시 splitPdfRange를 호출해야 한다', async () => {
      const splitRangeSpy = vi.spyOn(api, 'splitPdfRange').mockResolvedValueOnce({
        blob: new Blob(['dummy split']),
        filename: 'extracted.pdf',
      });
      vi.spyOn(api, 'triggerBlobDownload').mockImplementation(() => undefined);

      const { container } = render(<PdfToolsPage />);

      const splitRangeTab = screen.getByRole('tab', { name: /범위 분할/ });
      fireEvent.click(splitRangeTab);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['%PDF-1.4 test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeTruthy();
      });

      // 페이지 범위 입력
      const rangeInput = screen.getByLabelText(/추출할 페이지 범위/i);
      fireEvent.change(rangeInput, { target: { value: '1-3, 5' } });

      const executeBtn = screen.getByRole('button', { name: /작업 실행/i });
      fireEvent.click(executeBtn);

      await waitFor(() => {
        expect(splitRangeSpy).toHaveBeenCalledWith(file, '1-3, 5', undefined);
        expect(api.triggerBlobDownload).toHaveBeenCalledWith(expect.any(Blob), 'extracted.pdf');
      });
    });

    it('split-all 모드에서 실행 시 splitPdfAll을 호출하고 ZIP 파일을 다운로드해야 한다', async () => {
      const splitAllSpy = vi.spyOn(api, 'splitPdfAll').mockResolvedValueOnce({
        blob: new Blob(['dummy zip']),
        filename: 'split_pages.zip',
      });
      vi.spyOn(api, 'triggerBlobDownload').mockImplementation(() => undefined);

      const { container } = render(<PdfToolsPage />);

      const splitAllTab = screen.getByRole('tab', { name: /낱장 분할/ });
      fireEvent.click(splitAllTab);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['%PDF-1.4 test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeTruthy();
      });

      const executeBtn = screen.getByRole('button', { name: /작업 실행/i });
      fireEvent.click(executeBtn);

      await waitFor(() => {
        expect(splitAllSpy).toHaveBeenCalledWith(file, undefined);
        expect(api.triggerBlobDownload).toHaveBeenCalledWith(expect.any(Blob), 'split_pages.zip');
      });
    });

    it('unlock 모드에서 비밀번호 없이 실행하면 경고 배너를 띄워야 한다', async () => {
      const { container } = render(<PdfToolsPage />);

      const unlockTab = screen.getByRole('tab', { name: /암호 해제/ });
      fireEvent.click(unlockTab);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['%PDF-1.4 test'], 'locked.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('locked.pdf')).toBeTruthy();
      });

      const executeBtn = screen.getByRole('button', { name: /작업 실행/i });
      fireEvent.click(executeBtn);

      expect(
        screen.getByText('PDF 잠금을 해제하기 위한 비밀번호를 입력해 주세요.'),
      ).toBeTruthy();
    });

    it('unlock 모드에서 비밀번호 입력 후 실행 시 unlockPdf를 호출해야 한다', async () => {
      vi.spyOn(api, 'inspectPdf').mockResolvedValue({
        isEncrypted: true,
        pageCount: 5,
      });

      const unlockSpy = vi.spyOn(api, 'unlockPdf').mockResolvedValueOnce({
        blob: new Blob(['dummy unlocked']),
        filename: 'unlocked.pdf',
      });
      vi.spyOn(api, 'triggerBlobDownload').mockImplementation(() => undefined);

      const { container } = render(<PdfToolsPage />);

      const unlockTab = screen.getByRole('tab', { name: /암호 해제/ });
      fireEvent.click(unlockTab);

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['%PDF-1.4 test'], 'locked.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('locked.pdf')).toBeTruthy();
      });

      // 암호 입력
      const passwordInput = screen.getByPlaceholderText(/암호화된 PDF 비밀번호 입력/i);
      fireEvent.change(passwordInput, { target: { value: 'secret123' } });

      const executeBtn = screen.getByRole('button', { name: /작업 실행/i });
      fireEvent.click(executeBtn);

      await waitFor(() => {
        expect(unlockSpy).toHaveBeenCalledWith(file, 'secret123');
        expect(api.triggerBlobDownload).toHaveBeenCalledWith(expect.any(Blob), 'unlocked.pdf');
      });
    });
  });
});


