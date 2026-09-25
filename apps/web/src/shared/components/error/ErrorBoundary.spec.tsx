import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

// 의도적으로 렌더링 에러를 발생시키는 컴포넌트
function ProblematicChild({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('의도적인 렌더링 테스트 에러');
  }
  return <div>정상 자식 컴포넌트 내용</div>;
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // ErrorBoundary의 componentDidCatch 로그가 테스트 콘솔을 오염시키지 않도록 모킹
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('에러가 발생하지 않으면 자식 컴포넌트를 정상적으로 렌더링해야 한다', () => {
    render(
      <ErrorBoundary>
        <ProblematicChild shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('정상 자식 컴포넌트 내용')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('자식 컴포넌트에서 에러 발생 시 기본 Fallback UI를 렌더링해야 한다', () => {
    render(
      <ErrorBoundary>
        <ProblematicChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    // Alert 영역 및 타이틀 확인
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        name: '일시적인 렌더링 오류가 발생했습니다',
      }),
    ).toBeTruthy();

    // 에러 메시지 텍스트 확인
    expect(screen.getByText('의도적인 렌더링 테스트 에러')).toBeTruthy();

    // 버튼 요소들 확인
    expect(screen.getByRole('button', { name: /다시 시도/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /대시보드로 복귀/i })).toBeTruthy();
  });

  it('커스텀 fallback 노드가 주어지면 기본 UI 대신 해당 노드를 렌더링해야 한다', () => {
    render(
      <ErrorBoundary fallback={<div>커스텀 에러 화면</div>}>
        <ProblematicChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('커스텀 에러 화면')).toBeTruthy();
    expect(screen.queryByText('일시적인 렌더링 오류가 발생했습니다')).toBeNull();
  });

  it('커스텀 fallback 렌더 함수가 주어지면 에러 객체와 reset 핸들러를 전달해야 한다', () => {
    render(
      <ErrorBoundary
        fallback={({
          error,
          reset,
        }: {
          error: Error;
          reset: () => void;
        }) => (
          <div>
            <span>오류 발생: {error.message}</span>
            <button onClick={reset}>커스텀 복구</button>
          </div>
        )}
      >
        <ProblematicChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('오류 발생: 의도적인 렌더링 테스트 에러')).toBeTruthy();
    expect(screen.getByRole('button', { name: '커스텀 복구' })).toBeTruthy();
  });

  it('다시 시도 버튼 클릭 시 onReset 콜백이 호출되어야 한다', () => {
    const handleReset = vi.fn();

    render(
      <ErrorBoundary onReset={handleReset}>
        <ProblematicChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    const retryBtn = screen.getByRole('button', { name: /다시 시도/i });
    fireEvent.click(retryBtn);

    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
