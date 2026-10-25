import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DBML_STORAGE_KEY, DbmlToolsPage } from './DbmlToolsPage';

describe('DbmlToolsPage', () => {
  beforeEach(() => {
    localStorage.clear();

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
  it('헤더, 서브헤더, 코드 에디터, ERD 테이블 카드가 기본 렌더링되어야 한다', () => {
    render(<DbmlToolsPage />);

    // 헤더 및 서브헤더
    expect(screen.getByText('DBML Editor & ERD Visualizer')).toBeTruthy();
    expect(screen.getByText('Live Synced')).toBeTruthy();
    expect(screen.getByText('Load Example')).toBeTruthy();
    expect(screen.getByText('Execute Task')).toBeTruthy();

    // ERD 캔버스 내 기본 테이블 카드 확인 (users, projects, tasks)
    expect(screen.getAllByText('users').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('projects').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('tasks').length).toBeGreaterThanOrEqual(1);
  });

  it('Execute Task 클릭 시 SQL 모달이 열려야 한다', async () => {
    render(<DbmlToolsPage />);

    const executeBtn = screen.getByText('Execute Task');
    fireEvent.click(executeBtn);

    // 모달 타이틀 확인
    expect(await screen.findByText(/Generated SQL DDL/i)).toBeTruthy();
    expect(screen.getByText('Copy SQL')).toBeTruthy();
    expect(screen.getByText('Download .sql')).toBeTruthy();
  });

  it('테이블 검색어 입력 시 필터링이 동작해야 한다', () => {
    render(<DbmlToolsPage />);

    const searchInput = screen.getByPlaceholderText('Search tables (users, tasks)...');
    fireEvent.change(searchInput, { target: { value: 'users' } });

    expect(screen.getAllByText('users').length).toBeGreaterThanOrEqual(1);
  });

  it('초기 스키마 기반 테이블 엔티티 카드가 정상적으로 마운트되어야 한다', () => {
    const { container } = render(<DbmlToolsPage />);

    // 초기 users 카드의 필드 개수 확인
    const usersCard = container.querySelector('[data-testid="erd-card-users"]') as HTMLElement;
    expect(usersCard).toBeTruthy();
    expect(usersCard.textContent).toContain('email');
    expect(usersCard.textContent).toContain('created_at');
    expect(usersCard.textContent).toContain('3 fields');
  });

  it('Ctrl+S 또는 Cmd+S 단축키 입력 시 기본 웹페이지 저장을 방지하고 schema.dbml 저장을 실행해야 한다', () => {
    render(<DbmlToolsPage />);

    fireEvent.keyDown(window, {
      key: 's',
      ctrlKey: true,
    });

    expect(screen.getByText('schema.dbml이 저장되었습니다.')).toBeTruthy();
    expect(localStorage.getItem(DBML_STORAGE_KEY)).toBeTruthy();
  });

  it('상단 Save (Ctrl+S) 버튼 클릭 시 schema.dbml 저장이 실행되어야 한다', () => {
    render(<DbmlToolsPage />);

    const saveBtn = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);

    expect(screen.getByText('schema.dbml이 저장되었습니다.')).toBeTruthy();
  });

  it('상단 Export DBML 버튼 클릭 시 schema.dbml 파일 다운로드가 시작되어야 한다', () => {
    render(<DbmlToolsPage />);

    const exportBtn = screen.getByRole('button', { name: /Export DBML/i });
    fireEvent.click(exportBtn);

    expect(screen.getByText('schema.dbml 파일 다운로드가 시작되었습니다.')).toBeTruthy();
  });

  it('상단 Export Image 버튼 클릭 시 내보내기 모달이 열리고, 이미지 다운로드 클릭 시 선택된 포맷으로 다운로드가 시작되어야 한다', async () => {
    render(<DbmlToolsPage />);

    const exportImageBtn = screen.getByRole('button', { name: /Export Image/i });
    fireEvent.click(exportImageBtn);

    // 모달이 열려야 함
    expect(screen.getByText('ERD 다이어그램 이미지 내보내기')).toBeTruthy();

    // 이미지 다운로드 클릭
    const downloadBtn = screen.getByRole('button', { name: /이미지 다운로드/i });
    fireEvent.click(downloadBtn);

    expect(await screen.findByText('schema-erd.svg 파일 다운로드가 시작되었습니다.')).toBeTruthy();
  });

  it('상단 Import 버튼 클릭 시 가져오기 모달이 열리고, SQL을 입력하여 가져오면 CREATE DATABASE는 무시되고 ERD에 반영되어야 한다', async () => {
    render(<DbmlToolsPage />);

    const importBtn = screen.getByRole('button', { name: /Import/i });
    fireEvent.click(importBtn);

    // 모달 확인
    expect(screen.getByText('스키마 가져오기 (DBML / SQL)')).toBeTruthy();

    // 텍스트 탭 전환
    const textTabBtn = screen.getByRole('button', { name: /직접 텍스트 붙여넣기/i });
    fireEvent.click(textTabBtn);

    const textarea = screen.getByPlaceholderText(/-- 예: SQL DDL 스크립트/i);
    const sqlText = `
      CREATE DATABASE warehouse_db;
      USE warehouse_db;
      CREATE TABLE warehouse (
        id INT PRIMARY KEY,
        location VARCHAR(100) NOT NULL
      );
    `;
    fireEvent.change(textarea, { target: { value: sqlText } });

    // 스키마 가져오기 확인 클릭
    const confirmImportBtn = screen.getByRole('button', { name: /스키마 가져오기/i });
    expect(confirmImportBtn.hasAttribute('disabled')).toBe(false);
    fireEvent.click(confirmImportBtn);

    // 성공 토스트 및 캔버스에 warehouse 테이블 표출 확인
    expect(await screen.findByText('스키마를 성공적으로 가져왔습니다.')).toBeTruthy();
    expect(screen.getAllByText('warehouse').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('location').length).toBeGreaterThanOrEqual(1);
  });

  it('localStorage에 저장된 이전 스키마가 있다면 새로고침(마운트) 후에도 복원되어야 한다', () => {
    const customDbml = `
      Table inventory {
        id int [pk]
        sku varchar [unique]
      }
    `;
    localStorage.setItem(DBML_STORAGE_KEY, customDbml);

    render(<DbmlToolsPage />);

    // 복원된 inventory 테이블이 렌더링되어야 함
    expect(screen.getAllByText('inventory').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('sku').length).toBeGreaterThanOrEqual(1);
  });
});
