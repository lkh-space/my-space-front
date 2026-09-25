import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { PdfToolsPage } from './PdfToolsPage';

describe('PdfToolsPage', () => {
  beforeEach(() => {
    localStorage.clear();
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

  it('파일 드롭존을 통해 PDF 파일을 선택하면 파일 목록과 요약 용량이 갱신되어야 한다', () => {
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

    // 2개 파일이 있으므로 병합 모드에서 작업 실행 버튼 활성화
    const executeBtn = screen.getByRole('button', { name: /작업 실행/i });
    expect(executeBtn.hasAttribute('disabled')).toBe(false);
  });

  it('개별 파일 삭제 버튼을 누르면 목록에서 제거되어야 한다', () => {
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

    expect(screen.getByText('delete-me.pdf')).toBeTruthy();

    // 삭제 버튼 클릭
    const deleteBtn = screen.getByRole('button', {
      name: 'delete-me.pdf 파일 제거',
    });
    fireEvent.click(deleteBtn);

    // 목록에서 사라졌는지 확인
    expect(screen.queryByText('delete-me.pdf')).toBeNull();
  });

  it('초기화 버튼을 누르면 모든 파일 목록이 비워져야 한다', () => {
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

    expect(screen.getByText('reset-target.pdf')).toBeTruthy();

    // 초기화 버튼 클릭
    const resetBtn = screen.getByRole('button', { name: '초기화' });
    fireEvent.click(resetBtn);

    expect(screen.queryByText('reset-target.pdf')).toBeNull();
  });
});
