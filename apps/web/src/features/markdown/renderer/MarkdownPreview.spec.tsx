import { describe, it, expect, vi } from 'vitest';
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

  describe('보안 및 XSS 살균 검증', () => {
    it('스크립트 태그(<script>) 및 악성 자바스크립트가 완전히 제거되어야 한다', () => {
      const maliciousMd = `
# 제목
<script>alert('xss-attack')</script>
<script src="https://attacker.com/evil.js"></script>
정상 본문
`;
      const { container } = render(<MarkdownPreview content={maliciousMd} />);

      // script 태그가 DOM에 존재하지 않아야 함
      expect(container.querySelectorAll('script').length).toBe(0);
      expect(container.textContent).toContain('정상 본문');
      expect(container.textContent).not.toContain("alert('xss-attack')");
    });

    it('인라인 이벤트 핸들러(onerror, onload, onclick 등)가 살균되어야 한다', () => {
      const maliciousImg = `
![bad-img](x" onerror="alert('xss'))
<img src="invalid.jpg" onerror="alert('pwned')" />
<a href="javascript:alert('danger')">위험한 링크</a>
`;
      const { container } = render(<MarkdownPreview content={maliciousImg} />);

      const images = container.querySelectorAll('img');
      images.forEach((img) => {
        expect(img.getAttribute('onerror')).toBeNull();
      });

      const links = container.querySelectorAll('a');
      links.forEach((a) => {
        const href = a.getAttribute('href');
        if (href) {
          expect(href).not.toMatch(/^javascript:/i);
        } else {
          expect(href).toBeNull();
        }
      });
    });
  });

  describe('KaTeX 수식 렌더링 검증', () => {
    it('인라인 수식($...$) 및 블록 수식($$...$$)이 KaTeX HTML로 정상 변환되어야 한다', () => {
      const mathMd = `
인라인 수식: $E = mc^2$

블록 수식:
$$\\mathcal{H} = -\\sum p(x) \\log p(x)$$
`;
      const { container } = render(<MarkdownPreview content={mathMd} />);

      // KaTeX 클래스 요소 생성 확인
      const katexElements = container.querySelectorAll('.katex');
      expect(katexElements.length).toBeGreaterThanOrEqual(1);

      // 블록 수식 컨테이너 확인
      const displayMath = container.querySelector('.katex-display');
      expect(displayMath).toBeTruthy();
    });
  });

  describe('목차(TOC) 헤딩 추출 콜백 검증', () => {
    it('문서 내 헤딩 태그(h1~h4)를 분석하여 onHeadingsExtracted로 전달해야 한다', () => {
      const onHeadingsExtracted = vi.fn();
      const md = `
# 1. 아키텍처 개요
본문 내용
## 1.1 계층 구조
상세 내용
### 1.1.1 프론트엔드
하위 내용
`;
      render(
        <MarkdownPreview
          content={md}
          onHeadingsExtracted={onHeadingsExtracted}
        />,
      );

      expect(onHeadingsExtracted).toHaveBeenCalled();
      const extractedHeadings = onHeadingsExtracted.mock.calls[0][0];
      expect(extractedHeadings.length).toBe(3);
      expect(extractedHeadings[0]).toMatchObject({
        text: '1. 아키텍처 개요',
        level: 1,
      });
      expect(extractedHeadings[1]).toMatchObject({
        text: '1.1 계층 구조',
        level: 2,
      });
      expect(extractedHeadings[2]).toMatchObject({
        text: '1.1.1 프론트엔드',
        level: 3,
      });
    });
  });
});
