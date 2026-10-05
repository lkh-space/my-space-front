import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StickyToc, TocItem } from './StickyToc';

describe('StickyToc Component', () => {
  const mockHeadings: TocItem[] = [
    { id: 'heading-1', text: '1. 서론', level: 1 },
    { id: 'heading-2', text: '2. 아키텍처 설계', level: 2 },
    { id: 'heading-3', text: '2.1 클라이언트 구조', level: 3 },
  ];

  it('헤딩 목록이 주어지면 목차 링크들을 정상 렌더링해야 한다', () => {
    render(<StickyToc headings={mockHeadings} />);

    expect(screen.getByText('On This Page')).toBeTruthy();
    expect(screen.getByText('1. 서론')).toBeTruthy();
    expect(screen.getByText('2. 아키텍처 설계')).toBeTruthy();
    expect(screen.getByText('2.1 클라이언트 구조')).toBeTruthy();
  });

  it('헤딩이 없을 경우 빈 안내 문구를 표출해야 한다', () => {
    render(<StickyToc headings={[]} />);

    expect(screen.getByText('문서에 제목(Heading)이 없습니다.')).toBeTruthy();
  });

  it('목차 항목 클릭 시 onHeadingClick 핸들러가 호출되어야 한다', () => {
    const handleHeadingClick = vi.fn();
    render(<StickyToc headings={mockHeadings} onHeadingClick={handleHeadingClick} />);

    const link = screen.getByText('2. 아키텍처 설계');
    fireEvent.click(link);

    expect(handleHeadingClick).toHaveBeenCalledWith('heading-2');
  });
});
