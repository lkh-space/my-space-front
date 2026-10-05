import React, { useEffect, useMemo, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
import mermaid from 'mermaid';
import yaml from 'yaml';
import 'katex/dist/katex.min.css';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface MarkdownPreviewProps {
  content: string;
  frontmatterOverride?: Record<string, unknown>;
  className?: string;
  onHeadingsExtracted?: (headings: TocItem[]) => void;
}

// Mermaid 초기화 (다크 모드 징크 테마에 맞춘 설정)
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#18181b',
    primaryColor: '#27272a',
    primaryTextColor: '#adc6ff',
    primaryBorderColor: '#3f3f46',
    lineColor: '#8c909f',
    secondaryColor: '#1a1b22',
    tertiaryColor: '#12131a',
  },
  securityLevel: 'loose',
});

/**
 * YAML Frontmatter 분리 및 파싱 유틸리티
 */
export function extractFrontmatter(rawContent: string): {
  data: Record<string, unknown>;
  body: string;
} {
  const trimmed = rawContent.trimStart();
  if (trimmed.startsWith('---')) {
    const endMatch = trimmed.indexOf('\n---', 3);
    if (endMatch !== -1) {
      const yamlStr = trimmed.slice(3, endMatch).trim();
      const body = trimmed.slice(endMatch + 4).trimStart();
      try {
        const parsed = yaml.parse(yamlStr);
        if (parsed && typeof parsed === 'object') {
          return { data: parsed as Record<string, unknown>, body };
        }
      } catch {
        // YAML 파싱 실패 시 원본 그대로 반환
      }
    }
  }
  return { data: {}, body: rawContent };
}

/**
 * KaTeX 수식 사전 변환: $$...$$ (블록) 및 $...$ (인라인)
 */
function renderMath(text: string): string {
  // 1. Block math: $$ ... $$
  let replaced = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    try {
      return `<div class="math-block">${katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `$$${math}$$`;
    }
  });

  // 2. Inline math: $ ... $ (단, 줄바꿈 없거나 $ 앞뒤 공백 검사)
  replaced = replaced.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try {
      return `<span class="math-inline">${katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })}</span>`;
    } catch {
      return `$${math}$`;
    }
  });

  return replaced;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  frontmatterOverride,
  className = '',
  onHeadingsExtracted,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Frontmatter와 Body 분리
  const { data: parsedFrontmatter, body } = useMemo(
    () => extractFrontmatter(content),
    [content],
  );

  const manifest = frontmatterOverride ?? parsedFrontmatter;

  // 2. 마크다운 + 수식 파싱
  const sanitizedHtml = useMemo(() => {
    // 수식 변환 먼저 수행
    const withMath = renderMath(body);

    // marked 설정 (GFM 활성화)
    marked.setOptions({
      gfm: true,
      breaks: true,
    });

    const rawHtml = marked.parse(withMath) as string;

    // DOMPurify XSS 필터링 (Math, SVG 태그/속성 허용)
    return DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: [
        'annotation',
        'math',
        'mtext',
        'mrow',
        'semantics',
        'svg',
        'path',
        'rect',
        'text',
        'g',
        'marker',
        'defs',
        'line',
        'polygon',
        'mark',
      ],
      ADD_ATTR: [
        'display',
        'xmlns',
        'viewbox',
        'width',
        'height',
        'fill',
        'stroke',
        'stroke-width',
        'd',
        'rx',
        'x',
        'y',
        'marker-end',
        'text-anchor',
        'font-family',
        'font-size',
        'font-weight',
        'class',
        'style',
      ],
    });
  }, [body]);

  // 3. Mermaid 다이어그램 동적 렌더링
  useEffect(() => {
    if (!containerRef.current) return;

    const mermaidBlocks = containerRef.current.querySelectorAll(
      'pre code.language-mermaid',
    );

    if (mermaidBlocks.length === 0) return;

    let isCancelled = false;

    const renderMermaid = async () => {
      for (let i = 0; i < mermaidBlocks.length; i++) {
        if (isCancelled) break;
        const codeElem = mermaidBlocks[i];
        const preElem = codeElem.parentElement;
        if (!preElem) continue;

        const code = codeElem.textContent || '';
        const id = `mermaid-svg-${Date.now()}-${i}`;

        try {
          const { svg } = await mermaid.render(id, code);
          if (isCancelled) break;

          const wrapper = document.createElement('div');
          wrapper.className = 'mermaid-container my-4 p-4 rounded-xl border border-zinc-800 bg-zinc-950 flex justify-center';
          wrapper.innerHTML = svg;
          preElem.replaceWith(wrapper);
        } catch {
          // 렌더링 실패 시 일반 코드 블록 유지
        }
      }
    };

    renderMermaid();

    return () => {
      isCancelled = true;
    };
  }, [sanitizedHtml]);

  // 4. 헤딩 요소 id 자동 부여 및 목차(TOC) 아이템 추출
  useEffect(() => {
    if (!containerRef.current) return;

    const headingNodes = containerRef.current.querySelectorAll<HTMLHeadingElement>(
      'h1, h2, h3, h4',
    );

    const items: TocItem[] = [];
    headingNodes.forEach((node, index) => {
      const text = node.textContent?.trim() || '';
      if (!text) return;

      let id = node.id;
      if (!id) {
        id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '')}`;
        node.id = id;
      }

      const level = parseInt(node.tagName.substring(1), 10);
      items.push({ id, text, level });
    });

    if (onHeadingsExtracted) {
      onHeadingsExtracted(items);
    }
  }, [sanitizedHtml, onHeadingsExtracted]);

  const hasFrontmatter = Object.keys(manifest).length > 0;
  const author = (manifest['author'] as string) || (manifest['user'] as string);
  const tags = Array.isArray(manifest['tags'])
    ? (manifest['tags'] as string[])
    : [];

  return (
    <div
      ref={containerRef}
      className={`markdown-preview-root select-text ${className}`}
    >
      {/* Frontmatter Manifest Card */}
      {hasFrontmatter && (
        <div className="preview-manifest-card mb-6 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-zinc-500 uppercase tracking-wider font-semibold">
              Document Manifest
            </span>
            {author && (
              <span className="text-zinc-300 font-medium font-mono">{author}</span>
            )}
          </div>
          {tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-sky-300 border border-zinc-700"
                >
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rendered Markdown Body */}
      <div
        className="markdown-rendered-content"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
};
