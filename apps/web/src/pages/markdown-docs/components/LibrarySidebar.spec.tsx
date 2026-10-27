import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LibrarySidebar } from './LibrarySidebar';
import { TagItem } from '../../../entities/markdown';

describe('LibrarySidebar Component', () => {
  const mockTags: TagItem[] = [
    { id: 't-1', name: 'architecture', documentCount: 3 },
    { id: 't-2', name: 'notes', documentCount: 2 },
  ];

  it('태그 목록에 "미등록" 뱃지 버튼과 미등록 문서 카운트가 표시된다', () => {
    render(
      <LibrarySidebar
        folders={[]}
        tags={mockTags}
        selectedFolderId={null}
        selectedTag={null}
        documentCount={6}
        untaggedCount={1}
        onSelectFolder={vi.fn()}
        onSelectTag={vi.fn()}
        onOpenCreateFolderModal={vi.fn()}
        onOpenEditFolderModal={vi.fn()}
        onDeleteFolder={vi.fn()}
      />,
    );

    // '미등록' 태그 버튼 및 카운트 '1' 노출 확인
    expect(screen.getByText('미등록')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('#architecture')).toBeTruthy();
    expect(screen.getByText('#notes')).toBeTruthy();
  });

  it('"미등록" 뱃지 버튼을 클릭하면 onSelectTag("__untagged__")가 호출된다', () => {
    const onSelectTagSpy = vi.fn();

    render(
      <LibrarySidebar
        folders={[]}
        tags={mockTags}
        selectedFolderId={null}
        selectedTag={null}
        documentCount={6}
        untaggedCount={2}
        onSelectFolder={vi.fn()}
        onSelectTag={onSelectTagSpy}
        onOpenCreateFolderModal={vi.fn()}
        onOpenEditFolderModal={vi.fn()}
        onDeleteFolder={vi.fn()}
      />,
    );

    const untaggedBtn = screen.getByText('미등록').closest('button');
    expect(untaggedBtn).toBeTruthy();
    if (untaggedBtn) {
      fireEvent.click(untaggedBtn);
    }

    expect(onSelectTagSpy).toHaveBeenCalledWith('__untagged__');
  });

  it('이미 "__untagged__"가 선택된 상태에서 다시 클릭하면 선택이 해제(null)된다', () => {
    const onSelectTagSpy = vi.fn();

    render(
      <LibrarySidebar
        folders={[]}
        tags={mockTags}
        selectedFolderId={null}
        selectedTag="__untagged__"
        documentCount={6}
        untaggedCount={2}
        onSelectFolder={vi.fn()}
        onSelectTag={onSelectTagSpy}
        onOpenCreateFolderModal={vi.fn()}
        onOpenEditFolderModal={vi.fn()}
        onDeleteFolder={vi.fn()}
      />,
    );

    const untaggedBtn = screen.getByText('미등록').closest('button');
    expect(untaggedBtn).toBeTruthy();
    if (untaggedBtn) {
      fireEvent.click(untaggedBtn);
    }

    expect(onSelectTagSpy).toHaveBeenCalledWith(null);
  });
});
