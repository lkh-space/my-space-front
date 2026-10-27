import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentCardItem } from './DocumentCardItem';
import { DocumentSummary } from '../../../entities/markdown';

describe('DocumentCardItem Component', () => {
  const baseDoc: DocumentSummary = {
    id: 'doc-1',
    title: '테스트 문서',
    folderId: null,
    folderName: null,
    tags: ['react', 'vite'],
    currentVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('태그가 등록된 문서인 경우 태그 목록을 뱃지로 렌더링한다', () => {
    render(
      <DocumentCardItem
        doc={baseDoc}
        isSelected={false}
        snippet="미리보기 스니펫"
        wordCountLabel="120 words"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('#react')).toBeTruthy();
    expect(screen.getByText('#vite')).toBeTruthy();
    expect(screen.queryByText('미등록')).toBeNull();
  });

  it('태그가 없는 문서인 경우 #general 대신 "미등록" 뱃지를 렌더링한다', () => {
    const untaggedDoc: DocumentSummary = {
      ...baseDoc,
      id: 'doc-untagged',
      tags: [],
    };

    render(
      <DocumentCardItem
        doc={untaggedDoc}
        isSelected={false}
        snippet="태그 없는 문서 스니펫"
        wordCountLabel="80 words"
        onSelect={vi.fn()}
      />,
    );

    // #general은 렌더링되지 않아야 함
    expect(screen.queryByText('#general')).toBeNull();
    // '미등록' 뱃지가 렌더링되어야 함
    expect(screen.getByText('미등록')).toBeTruthy();
  });
});
