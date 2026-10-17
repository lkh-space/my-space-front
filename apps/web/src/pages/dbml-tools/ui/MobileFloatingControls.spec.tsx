import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileFloatingControls } from './MobileFloatingControls';

describe('MobileFloatingControls Component (P2)', () => {
  let onTabChangeMock: (tab: 'erd' | 'editor') => void;
  let onExecuteConvertMock: () => void;

  beforeEach(() => {
    onTabChangeMock = vi.fn();
    onExecuteConvertMock = vi.fn();
  });

  it('activeTab이 erd일 때 ERD Canvas 탭이 active 클래스를 가져야 한다', () => {
    render(
      <MobileFloatingControls
        activeTab="erd"
        onTabChange={onTabChangeMock}
        tableCount={3}
        isValid={true}
        onExecuteConvert={onExecuteConvertMock}
      />
    );

    const erdBtn = screen.getByRole('button', { name: 'ERD Canvas' });
    const editorBtn = screen.getByRole('button', { name: 'Code Editor' });

    expect(erdBtn.className).toContain('active');
    expect(editorBtn.className).not.toContain('active');
  });

  it('activeTab이 editor일 때 Code Editor 탭이 active 클래스를 가져야 한다', () => {
    render(
      <MobileFloatingControls
        activeTab="editor"
        onTabChange={onTabChangeMock}
        tableCount={3}
        isValid={true}
        onExecuteConvert={onExecuteConvertMock}
      />
    );

    const erdBtn = screen.getByRole('button', { name: 'ERD Canvas' });
    const editorBtn = screen.getByRole('button', { name: 'Code Editor' });

    expect(editorBtn.className).toContain('active');
    expect(erdBtn.className).not.toContain('active');
  });

  it('탭 클릭 시 onTabChange 콜백이 올바른 탭 키로 호출되어야 한다', () => {
    render(
      <MobileFloatingControls
        activeTab="erd"
        onTabChange={onTabChangeMock}
        tableCount={2}
        isValid={true}
        onExecuteConvert={onExecuteConvertMock}
      />
    );

    const editorBtn = screen.getByRole('button', { name: 'Code Editor' });
    fireEvent.click(editorBtn);
    expect(onTabChangeMock).toHaveBeenCalledWith('editor');

    const erdBtn = screen.getByRole('button', { name: 'ERD Canvas' });
    fireEvent.click(erdBtn);
    expect(onTabChangeMock).toHaveBeenCalledWith('erd');
  });

  it('Convert 버튼 및 Export SQL 버튼 클릭 시 onExecuteConvert가 호출되어야 한다', () => {
    render(
      <MobileFloatingControls
        activeTab="erd"
        onTabChange={onTabChangeMock}
        tableCount={4}
        isValid={true}
        onExecuteConvert={onExecuteConvertMock}
      />
    );

    const convertBtn = screen.getByRole('button', { name: /Convert/i });
    fireEvent.click(convertBtn);
    expect(onExecuteConvertMock).toHaveBeenCalledTimes(1);

    const exportBtn = screen.getByRole('button', { name: /Export SQL/i, hidden: true });
    fireEvent.click(exportBtn);
    expect(onExecuteConvertMock).toHaveBeenCalledTimes(2);
  });

  it('isValid가 true이면 Schema Valid 텍스트와 테이블 수를 표시해야 한다', () => {
    render(
      <MobileFloatingControls
        activeTab="erd"
        onTabChange={onTabChangeMock}
        tableCount={5}
        isValid={true}
        onExecuteConvert={onExecuteConvertMock}
      />
    );

    expect(screen.getByText('Schema Valid')).toBeTruthy();
    expect(screen.getByText('(5 tables)')).toBeTruthy();
  });

  it('isValid가 false이면 Check Syntax 안내 문구를 표시해야 한다', () => {
    render(
      <MobileFloatingControls
        activeTab="erd"
        onTabChange={onTabChangeMock}
        tableCount={0}
        isValid={false}
        onExecuteConvert={onExecuteConvertMock}
      />
    );

    expect(screen.getByText('Check Syntax')).toBeTruthy();
    expect(screen.getByText('(0 tables)')).toBeTruthy();
  });
});
