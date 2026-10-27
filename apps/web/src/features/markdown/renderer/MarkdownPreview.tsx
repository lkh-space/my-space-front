import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
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

let mermaidInitialized = false;
let mermaidIdCounter = 0;

/**
 * 렌더링된 다이어그램 SVG 인메모리 캐시 (code -> sanitizedSvg)
 * 동일한 다이어그램을 재계산 없이 즉시 주입하여 깜빡임을 차단합니다.
 */
export const mermaidSvgCache = new Map<string, string>();

export const DARK_MERMAID_CONFIG = {
  startOnLoad: false,
  theme: 'dark' as const,
  themeVariables: {
    darkMode: true,
    // DESIGN.md 기반 표준 타이포그래피를 Mermaid 테마 측정 메트릭에 정확히 일치시킵니다.
    // 불일치 시 Mermaid가 16px 기준으로 너비를 측정하여 박스 오른쪽이 텅 비어버리는 현상을 방지합니다.
    fontFamily:
      "'Geist', 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    fontSize: '13px',
    background: '#09090b',
    primaryColor: '#27272a',
    primaryTextColor: '#f4f4f5',
    primaryBorderColor: '#3f3f46',
    lineColor: '#71717a',
    secondaryColor: '#18181b',
    tertiaryColor: '#12131a',
    mainBkg: '#27272a',
    nodeBorder: '#3f3f46',
    nodeTextColor: '#f4f4f5',
    textColor: '#f4f4f5',
    titleColor: '#f4f4f5',
    edgeLabelBackground: '#18181b',
    actorTextColor: '#f4f4f5',
    actorLineColor: '#71717a',
    signalColor: '#71717a',
    signalTextColor: '#f4f4f5',
    labelTextColor: '#f4f4f5',
  },
  flowchart: {
    // wrappingWidth에 Number.POSITIVE_INFINITY를 설정하면 Mermaid가 텍스트 길이에 맞춰 박스 크기를 100% 동적(Auto-fit)으로 확장합니다.
    // 고정 폭 제한(120px, 360px 등)이 완전히 제거되어 긴 단어나 문장도 임의로 줄바꿈되지 않고 온전히 박스 안에 표시됩니다.
    wrappingWidth: Number.POSITIVE_INFINITY,
    nodeSpacing: 45,
    rankSpacing: 45,
    curve: 'basis' as const,
    padding: 15,
  },
  securityLevel: 'strict' as const,
};

/**
 * 다이어그램 블록이 존재할 때만 Mermaid 엔진을 온디맨드로 지연 로드합니다.
 */
export async function getMermaid() {
  const mermaidModule = await import('mermaid');
  const mermaid = mermaidModule.default;
  if (!mermaidInitialized) {
    mermaid.initialize(DARK_MERMAID_CONFIG);
    mermaidInitialized = true;
  }
  return mermaid;
}

// 브라우저 유휴 시간에 Mermaid 엔진 사전 로드 (첫 다이어그램 렌더링 지연 제거)
if (typeof window !== 'undefined') {
  const preloadMermaid = () => {
    void getMermaid().catch(() => {
      /* ignore background preload error */
    });
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(preloadMermaid);
  } else {
    setTimeout(preloadMermaid, 500);
  }
}

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
        const parsed: unknown = yaml.parse(yamlStr);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
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
 * 본문 내의 ```mermaid 블록 코드들을 순서대로 추출합니다.
 */
function extractMermaidBlocks(body: string): string[] {
  const blocks: string[] = [];
  const regex = /```mermaid[ \t]*\r?\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(body)) !== null) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

/**
 * KaTeX 수식 사전 변환: 코드 블록을 보호한 뒤 $$...$$ (블록) 및 $...$ (인라인) 변환
 */
function renderMath(text: string): string {
  const codePlaceholders: string[] = [];
  const masked = text.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
    const idx = codePlaceholders.push(match) - 1;
    return `@@CODE_BLOCK_${idx}@@`;
  });

  // 1. Block math: $$ ... $$
  let replaced = masked.replace(/\$\$([\s\S]+?)\$\$/g, (_, math: string) => {
    try {
      const trimmed = math.trim();
      return `<div class="math-block" data-math-code="${encodeURIComponent(trimmed)}">${katex.renderToString(trimmed, { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `$$${math}$$`;
    }
  });

  // 2. Inline math: $ ... $ (단, 줄바꿈 없거나 $ 앞뒤 공백 검사)
  replaced = replaced.replace(/\$([^$\n]+?)\$/g, (_, math: string) => {
    try {
      return `<span class="math-inline">${katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })}</span>`;
    } catch {
      return `$${math}$`;
    }
  });

  return replaced.replace(/@@CODE_BLOCK_(\d+)@@/g, (_, idxStr: string) => {
    return codePlaceholders[Number(idxStr)] ?? '';
  });
}

function normalizeAuthor(manifest: Record<string, unknown>): string | null {
  const raw = manifest['author'] ?? manifest['user'];
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
  return null;
}

function normalizeTags(manifest: Record<string, unknown>): string[] {
  const rawTags = manifest['tags'];
  if (!Array.isArray(rawTags)) return [];
  return rawTags
    .filter((t): t is string | number => typeof t === 'string' || typeof t === 'number')
    .map((t) => String(t).trim())
    .filter(Boolean);
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = React.memo(
  ({ content, frontmatterOverride, className = '', onHeadingsExtracted }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // 1. Frontmatter와 Body 분리
    const { data: parsedFrontmatter, body } = useMemo(
      () => extractFrontmatter(content),
      [content],
    );

    const manifest = frontmatterOverride ?? parsedFrontmatter;

    // 2. 본문 내 Mermaid 블록 목록 및 마지막 유효 SVG 참조
    const mermaidCodes = useMemo(() => extractMermaidBlocks(body), [body]);
    const lastValidSvgsRef = useRef<Map<number, string>>(new Map());
    const [renderTrigger, setRenderTrigger] = useState(0);

    // 3. 백그라운드 Mermaid 비동기 렌더링
    // 사용자가 타이핑하는 동안에도 이전 다이어그램을 유지(Seamless Swap)하여 깜빡임 원천 차단
    useEffect(() => {
      let isCancelled = false;

      const renderPendingBlocks = async () => {
        const needsRender = mermaidCodes.some(
          (code) => code && !mermaidSvgCache.has(code),
        );

        if (!needsRender) {
          // 모든 블록이 캐시에 있으면 인덱스 매핑 갱신
          mermaidCodes.forEach((code, idx) => {
            const cached = mermaidSvgCache.get(code);
            if (cached) lastValidSvgsRef.current.set(idx, cached);
          });
          return;
        }

        let mermaidInstance;
        try {
          mermaidInstance = await getMermaid();
        } catch {
          return;
        }
        if (isCancelled) return;

        let hasNewRender = false;

        for (let i = 0; i < mermaidCodes.length; i++) {
          if (isCancelled) break;
          const code = mermaidCodes[i];
          if (!code) continue;

          if (mermaidSvgCache.has(code)) {
            const cached = mermaidSvgCache.get(code);
            if (cached) lastValidSvgsRef.current.set(i, cached);
            continue;
          }

          const id = `mermaid-svg-${++mermaidIdCounter}-${Date.now()}`;

          try {
            const { svg } = await mermaidInstance.render(id, code);
            if (isCancelled) break;

            // DOMPurify 살균 시 HTML_INTEGRATION_POINTS: { foreignobject: true } 필수!
            // 이 설정이 있어야 foreignObject 내부 div, span, p 텍스트가 삭제되지 않고 온전히 보존됩니다.
            const sanitizedSvg = DOMPurify.sanitize(svg, {
              ADD_TAGS: [
                'foreignobject',
                'foreignObject',
                'style',
                'svg',
                'g',
                'rect',
                'circle',
                'polygon',
                'line',
                'path',
                'text',
                'tspan',
                'defs',
                'marker',
              ],
              ADD_ATTR: [
                'dominant-baseline',
                'text-anchor',
                'alignment-baseline',
                'transform',
                'xmlns',
                'viewBox',
                'viewbox',
                'width',
                'height',
                'x',
                'y',
                'rx',
                'ry',
                'd',
                'fill',
                'stroke',
                'stroke-width',
                'style',
                'class',
                'id',
              ],
              HTML_INTEGRATION_POINTS: { foreignobject: true },
            });

            mermaidSvgCache.set(code, sanitizedSvg);
            lastValidSvgsRef.current.set(i, sanitizedSvg);
            hasNewRender = true;
          } catch {
            // 문법 미완성 상태 등으로 인한 에러 시 Mermaid DOM 잔여물 정리
            const errorElement =
              document.getElementById(id) || document.getElementById(`d${id}`);
            if (errorElement) {
              errorElement.remove();
            }
            // 에러 시 직전 유효 SVG(lastValidSvgsRef)가 유지되므로 화면은 깨지지 않음
          }
        }

        if (hasNewRender && !isCancelled) {
          setRenderTrigger((prev) => prev + 1);
        }
      };

      renderPendingBlocks();

      return () => {
        isCancelled = true;
      };
    }, [mermaidCodes]);

    // 4. 마크다운 + 수식 + 다이어그램(캐시/직전 유효 SVG 인라인 주입) 파싱
    const sanitizedHtml = useMemo(() => {
      // 수식 변환 먼저 수행
      const withMath = renderMath(body);

      let currentBlockIndex = 0;

      // 마크다운 렌더러: Mermaid 블록은 즉시 캐시된 SVG 또는 직전 유효 SVG로 렌더링
      const markdownRenderer = new Marked({
        gfm: true,
        breaks: true,
        renderer: {
          code({ text, lang }) {
            if (lang === 'mermaid') {
              const blockIdx = currentBlockIndex++;
              const code = text.trim();

              // 1순위: 현재 코드의 렌더링된 SVG 캐시
              const cachedSvg = mermaidSvgCache.get(code);
              if (cachedSvg) {
                return `<div class="mermaid-container mermaid-diagram-container" data-mermaid-index="${blockIdx}" data-mermaid-code="${encodeURIComponent(code)}">${cachedSvg}</div>`;
              }

              // 2순위: 직전 유효 SVG (수정 타이핑 중 깜빡임 방지용 Seamless 유지)
              const prevSvg = lastValidSvgsRef.current.get(blockIdx);
              if (prevSvg) {
                return `<div class="mermaid-container mermaid-diagram-container is-updating" data-mermaid-index="${blockIdx}" data-mermaid-code="${encodeURIComponent(code)}">${prevSvg}</div>`;
              }

              // 3순위: 최초 로드 시 (아직 캐시가 없을 때 조용히 빈 컨테이너 유지)
              return `<div class="mermaid-container mermaid-diagram-container is-initial" data-mermaid-index="${blockIdx}" data-mermaid-code="${encodeURIComponent(code)}" style="min-height: 80px;"></div>`;
            }
            return false; // 기본 marked 코드 블록 렌더링 유지
          },
        },
      });

      const rawHtml = markdownRenderer.parse(withMath) as string;

      // DOMPurify XSS 필터링 (Math, SVG, foreignObject 및 텍스트 완벽 허용)
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
          'tspan',
          'circle',
          'polygon',
          'line',
          'g',
          'marker',
          'defs',
          'style',
          'foreignObject',
          'foreignobject',
          'mark',
        ],
        ADD_ATTR: [
          'data-mermaid-index',
          'data-mermaid-code',
          'data-math-code',
          'display',
          'xmlns',
          'viewbox',
          'viewBox',
          'width',
          'height',
          'fill',
          'stroke',
          'stroke-width',
          'd',
          'rx',
          'ry',
          'x',
          'y',
          'dx',
          'dy',
          'marker-end',
          'text-anchor',
          'dominant-baseline',
          'alignment-baseline',
          'transform',
          'font-family',
          'font-size',
          'font-weight',
          'class',
          'style',
          'id',
        ],
        HTML_INTEGRATION_POINTS: { foreignobject: true },
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [body, renderTrigger]);

    // 5. 헤딩 요소 id 자동 부여 및 목차(TOC) 아이템 추출
    useEffect(() => {
      if (!containerRef.current) return;

      const headingNodes =
        containerRef.current.querySelectorAll<HTMLHeadingElement>(
          'h1, h2, h3, h4',
        );

      const items: TocItem[] = [];
      headingNodes.forEach((node, index) => {
        const text = node.textContent?.trim() || '';
        if (!text) return;

        let id = node.id;
        if (!id) {
          id = `heading-${index}-${text
            .toLowerCase()
            .replace(/[^a-z0-9가-힣]+/g, '-')
            .replace(/^-|-$/g, '')}`;
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
    const author = normalizeAuthor(manifest);
    const tags = normalizeTags(manifest);

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
  },
);
