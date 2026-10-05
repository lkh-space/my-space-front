import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownPreview, extractFrontmatter } from './MarkdownPreview';

describe('MarkdownPreview Component', () => {
  it('extractFrontmatter는 YAML 영역과 본문을 올바르게 분리해야 한다', () => {
    const raw = `---
title: Test Title
tags: [architecture, backend]
---
# Actual Heading
Hello world`;

    const { data, body } = extractFrontmatter(raw);
    expect(data.title).toBe('Test Title');
    expect(data.tags).toEqual(['architecture', 'backend']);
    expect(body).toBe('# Actual Heading\nHello world');
  });

  it('기본 마크다운 요소(Heading, List, Code)가 정상 렌더링되어야 한다', () => {
    const md = `# Document Header
* Item 1
* Item 2

\`console.log('test')\`
`;

    const { container } = render(<MarkdownPreview content={md} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Document Header' })).toBeTruthy();
    expect(container.querySelectorAll('li').length).toBe(2);
    expect(container.querySelector('code')).toBeTruthy();
  });

  it('Frontmatter가 있을 때 상단 Manifest 카드가 표출되어야 한다', () => {
    const md = `---
author: dev@my-space.local
tags: [wasm, security]
---
Content here`;

    render(<MarkdownPreview content={md} />);
    expect(screen.getByText('Document Manifest')).toBeTruthy();
    expect(screen.getByText('dev@my-space.local')).toBeTruthy();
    expect(screen.getByText('#wasm')).toBeTruthy();
    expect(screen.getByText('#security')).toBeTruthy();
  });

  it('GFM Task List 체크박스가 정상 렌더링되어야 한다', () => {
    const md = `- [x] Done task
- [ ] Todo task`;

    const { container } = render(<MarkdownPreview content={md} />);
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(2);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
  });
});
