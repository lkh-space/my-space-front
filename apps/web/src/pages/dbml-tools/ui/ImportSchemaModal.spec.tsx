import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ImportSchemaModal } from './ImportSchemaModal';

describe('ImportSchemaModal Component', () => {
  it('isOpen이 false일 때는 아무것도 렌더링하지 않아야 한다', () => {
    const { container } = render(
      <ImportSchemaModal isOpen={false} onClose={vi.fn()} onImport={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('모달이 열리면 파일 업로드 및 텍스트 붙여넣기 탭이 표출되어야 한다', () => {
    render(
      <ImportSchemaModal isOpen={true} onClose={vi.fn()} onImport={vi.fn()} />
    );

    expect(screen.getByText('스키마 가져오기 (DBML / SQL)')).toBeTruthy();
    expect(screen.getByText('파일 업로드 (.dbml, .sql)')).toBeTruthy();
    expect(screen.getByText('직접 텍스트 붙여넣기')).toBeTruthy();
  });

  it('직접 텍스트 탭에서 SQL DDL을 입력하면 CREATE DATABASE는 무시되고 CREATE TABLE이 감지되어야 한다', () => {
    const onImportMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <ImportSchemaModal
        isOpen={true}
        onClose={onCloseMock}
        onImport={onImportMock}
      />
    );

    // 텍스트 탭 전환
    const textTabBtn = screen.getByRole('button', { name: /직접 텍스트 붙여넣기/i });
    fireEvent.click(textTabBtn);

    const textarea = screen.getByPlaceholderText(/-- 예: SQL DDL 스크립트/i);
    const sqlText = `
      CREATE DATABASE shopping_mall;
      USE shopping_mall;
      CREATE TABLE products (
        id INT PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      );
    `;

    fireEvent.change(textarea, { target: { value: sqlText } });

    // 감지된 포맷 및 요약 정보 확인
    expect(screen.getByText(/SQL DDL \(순수 CREATE TABLE 자동 변환\)/i)).toBeTruthy();
    expect(screen.getByText('1개 테이블')).toBeTruthy();
    expect(screen.getByText(/CREATE DATABASE.*안전하게 필터링되었습니다/i)).toBeTruthy();

    // 가져오기 버튼 클릭
    const importBtn = screen.getByRole('button', { name: /스키마 가져오기/i });
    fireEvent.click(importBtn);

    expect(onImportMock).toHaveBeenCalledTimes(1);
    const [importedDbml] = onImportMock.mock.calls[0];
    expect(importedDbml).toContain('Table products {');
    expect(importedDbml).toContain('id int [pk]');
    expect(importedDbml).not.toContain('shopping_mall');
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('직접 텍스트 탭에서 DBML을 입력하면 DBML 스키마로 감지되어 가져와져야 한다', () => {
    const onImportMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <ImportSchemaModal
        isOpen={true}
        onClose={onCloseMock}
        onImport={onImportMock}
      />
    );

    // 텍스트 탭 전환
    const textTabBtn = screen.getByRole('button', { name: /직접 텍스트 붙여넣기/i });
    fireEvent.click(textTabBtn);

    const textarea = screen.getByPlaceholderText(/-- 예: SQL DDL 스크립트/i);
    const dbmlText = `
      Table members {
        id int [pk]
        name varchar
      }
    `;

    fireEvent.change(textarea, { target: { value: dbmlText } });

    expect(screen.getByText('DBML 스키마')).toBeTruthy();
    expect(screen.getByText('1개 테이블')).toBeTruthy();

    const importBtn = screen.getByRole('button', { name: /스키마 가져오기/i });
    fireEvent.click(importBtn);

    expect(onImportMock).toHaveBeenCalledWith(dbmlText.trim(), undefined);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('취소 버튼 클릭 시 onClose가 호출되어야 한다', () => {
    const onCloseMock = vi.fn();
    render(
      <ImportSchemaModal
        isOpen={true}
        onClose={onCloseMock}
        onImport={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: '취소' });
    fireEvent.click(cancelBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
