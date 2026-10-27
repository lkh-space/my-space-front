/**
 * 마크다운 미리보기 영역의 Mermaid 다이어그램 및 KaTeX 수식을 고해상도 PNG 이미지로 캡처하는 유틸리티
 * - 브라우저 Canvas Tainted SecurityError 방지를 위한 순수 SVG text 태그 변환 파이프라인
 * - PDF Export 시 mermaid.ai 감성의 밝은 테마(Light Theme) 및 투명(누끼) 배경 렌더링
 * - 캡처 완료 후 웹 에디터 프리뷰 환경 유지를 위한 다크 테마 자동 복원
 */

import { getMermaid, DARK_MERMAID_CONFIG, mermaidSvgCache } from './MarkdownPreview';

export interface RenderedAsset {
  type: 'mermaid' | 'math';
  code: string;
  imageBase64: string;
  width: number;
  height: number;
}

/**
 * PDF 내보내기 전용 밝은 테마 설정 (mermaid.ai 감성의 슬레이트 & 파스텔)
 */
export const LIGHT_EXPORT_MERMAID_CONFIG = {
  startOnLoad: false,
  theme: 'base' as const,
  themeVariables: {
    darkMode: false,
    background: 'transparent',
    fontFamily:
      "'Geist', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: '13px',

    // 노드 스타일 (mermaid.ai 감성의 밝고 부드러운 슬레이트/스카이 톤)
    primaryColor: '#f1f5f9', // 노드 배경 (slate-100)
    primaryTextColor: '#0f172a', // 노드 텍스트 (slate-900)
    primaryBorderColor: '#94a3b8', // 노드 테두리 (slate-400)

    secondaryColor: '#e0f2fe', // 서브 노드 배경 (sky-100)
    secondaryTextColor: '#0369a1', // 서브 노드 텍스트 (sky-700)
    secondaryBorderColor: '#38bdf8',

    tertiaryColor: '#f3e8ff', // 3차 노드 배경 (purple-100)
    tertiaryTextColor: '#6b21a8',
    tertiaryBorderColor: '#c084fc',

    mainBkg: '#f8fafc',
    nodeBorder: '#94a3b8',
    nodeTextColor: '#0f172a',

    // 선 및 화살표 스타일 (선명한 슬레이트)
    lineColor: '#475569',
    textColor: '#0f172a',
    titleColor: '#0f172a',
    edgeLabelBackground: '#ffffff',
    labelTextColor: '#334155',

    // 시퀀스 다이어그램 액터 및 신호
    actorBkg: '#f1f5f9',
    actorBorder: '#94a3b8',
    actorTextColor: '#0f172a',
    actorLineColor: '#475569',
    signalColor: '#475569',
    signalTextColor: '#0f172a',

    // 클래스/상태 다이어그램
    classText: '#0f172a',
    labelColor: '#0f172a',
  },
  flowchart: {
    wrappingWidth: Number.POSITIVE_INFINITY,
    nodeSpacing: 45,
    rankSpacing: 45,
    curve: 'basis' as const,
    padding: 15,
  },
  securityLevel: 'strict' as const,
};

/**
 * 이미지 로드 시 브라우저 hang 방지를 위한 타임아웃 래퍼
 */
function loadImageWithTimeout(url: string, timeoutMs = 3000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let isSettled = false;

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        reject(new Error(`Image render timeout (${timeoutMs}ms)`));
      }
    }, timeoutMs);

    img.onload = () => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        resolve(img);
      }
    };

    img.onerror = (e) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        reject(e);
      }
    };

    img.src = url;
  });
}

/**
 * Mermaid SVG 내부를 브라우저 Image 렌더링에 안전한 순수 SVG로 변환하고 밝은 테마 및 투명 배경을 적용합니다.
 * - foreignObject를 순수 SVG text 태그로 완벽 치환하여 Tainted Canvas 보안 에러 원천 차단
 * - 밝은 배경 위에서 시인성을 보장하기 위해 #0f172a(slate-900) 색상 및 font-weight 600 부여
 * - 최상위 배경 사각형을 제거하여 완벽한 투명(누끼) 배경 생성
 * - DOM 다크 테마 SVG가 인입되더라도 밝은 슬레이트 노드와 선명한 연결선으로 자동 스타일 변환
 */
export function sanitizeMermaidSvgForExport(svgElement: SVGElement): SVGElement {
  const clone = svgElement.cloneNode(true) as SVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // 1. 최상위 불투명 배경 rect 제거 또는 투명화 (누끼 효과)
  const allRects = Array.from(clone.querySelectorAll('rect'));
  allRects.forEach((rect) => {
    const isFirstChild =
      (rect.parentNode as Node | null) === clone && clone.firstElementChild === rect;
    const isBgClass = rect.classList.contains('background');
    const fill = rect.getAttribute('fill')?.toLowerCase() || '';
    const widthAttr = rect.getAttribute('width');

    if (
      isBgClass ||
      (isFirstChild &&
        (widthAttr === '100%' ||
          fill === '#000000' ||
          fill === '#09090b' ||
          fill === '#18181b' ||
          fill === '#27272a'))
    ) {
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', 'none');
    }
  });

  // 2. 다크 테마 노드 박스 및 경로를 mermaid.ai 라이트 테마 색상으로 자동 변환
  const shapes = Array.from(clone.querySelectorAll('rect, polygon, circle, ellipse, path'));
  shapes.forEach((shape) => {
    if (shape.classList.contains('background')) return;

    const fill = shape.getAttribute('fill');
    const stroke = shape.getAttribute('stroke');

    // 다크 모드 어두운 노드 배경 -> 밝은 슬레이트(#f1f5f9)
    if (
      fill &&
      (fill.toLowerCase() === '#27272a' ||
        fill.toLowerCase() === '#18181b' ||
        fill.toLowerCase() === '#12131a' ||
        fill.toLowerCase() === '#09090b' ||
        fill.includes('39, 39, 42') ||
        fill.includes('24, 24, 27'))
    ) {
      shape.setAttribute('fill', '#f1f5f9');
    }

    // 다크 모드 테두리 -> 부드러운 슬레이트 테두리(#94a3b8)
    if (
      stroke &&
      (stroke.toLowerCase() === '#3f3f46' ||
        stroke.toLowerCase() === '#27272a' ||
        stroke.includes('63, 63, 70'))
    ) {
      shape.setAttribute('stroke', '#94a3b8');
    }

    // 연결선 및 화살표 -> 선명한 슬레이트(#475569)
    if (
      stroke &&
      (stroke.toLowerCase() === '#71717a' ||
        stroke.toLowerCase() === '#52525b' ||
        stroke.includes('113, 113, 122'))
    ) {
      shape.setAttribute('stroke', '#475569');
    }
    if (
      fill &&
      (fill.toLowerCase() === '#71717a' ||
        fill.toLowerCase() === '#52525b' ||
        fill.includes('113, 113, 122'))
    ) {
      shape.setAttribute('fill', '#475569');
    }
  });

  // 3. foreignObject를 순수 SVG text로 치환 (Tainted Canvas 방지)
  const foreignObjects = Array.from(clone.querySelectorAll('foreignObject, foreignobject'));
  foreignObjects.forEach((fo) => {
    const text = fo.textContent?.trim() || '';
    const foWidth = parseFloat(fo.getAttribute('width') || '0');
    const foHeight = parseFloat(fo.getAttribute('height') || '0');

    const textElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElem.setAttribute('x', String(foWidth > 0 ? foWidth / 2 : 0));
    textElem.setAttribute('y', String(foHeight > 0 ? foHeight / 2 : 0));
    textElem.setAttribute('text-anchor', 'middle');
    textElem.setAttribute('dominant-baseline', 'central');
    textElem.setAttribute('fill', '#0f172a'); // 선명한 다크 텍스트
    textElem.setAttribute(
      'font-family',
      "'Geist', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    );
    textElem.setAttribute('font-size', '13px');
    textElem.setAttribute('font-weight', '600');
    textElem.textContent = text;

    fo.parentNode?.replaceChild(textElem, fo);
  });

  // 4. 기존의 흰색/연회색 텍스트(#f4f4f5, #ffffff, #fff, white)를 선명한 #0f172a로 일괄 보정
  const allTexts = Array.from(clone.querySelectorAll('text, tspan'));
  allTexts.forEach((t) => {
    const fill = t.getAttribute('fill');
    if (
      !fill ||
      fill === '#f4f4f5' ||
      fill === '#ffffff' ||
      fill === '#fff' ||
      fill === 'white' ||
      fill.includes('244, 244, 245')
    ) {
      t.setAttribute('fill', '#0f172a');
    }
    t.setAttribute('font-weight', '600');
  });

  return clone;
}

/**
 * SVG 요소를 고해상도 PNG(Base64) Data URL로 안전하고 신속하게 변환합니다.
 * - 배경 박스를 그리지 않고 투명(누끼) 상태를 그대로 유지합니다.
 */
export async function svgToPngBase64(
  svgElement: SVGElement,
  scale = 2,
): Promise<{ dataUrl: string; width: number; height: number }> {
  // 1. foreignObject를 완벽하게 순수 SVG text로 치환하여 Tainted Canvas 보안 에러 원천 차단
  const safeSvg = sanitizeMermaidSvgForExport(svgElement);

  // 2. viewBox 기반 실제 논리 폭/높이 계산
  let width = 0;
  let height = 0;
  const viewBox = safeSvg.getAttribute('viewBox') || safeSvg.getAttribute('viewbox');
  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      width = parts[2];
      height = parts[3];
    }
  }

  if (!width || !height) {
    const rect =
      typeof svgElement.getBoundingClientRect === 'function'
        ? svgElement.getBoundingClientRect()
        : null;
    width = rect?.width || 500;
    height = rect?.height || 250;
  }

  width = Math.max(Math.round(width), 200);
  height = Math.max(Math.round(height), 80);
  safeSvg.setAttribute('width', String(width));
  safeSvg.setAttribute('height', String(height));

  // 3. 초고속 Data URL 변환 (Blob URL 대신 인메모리 Base64로 즉각 로드)
  const svgXml = new XMLSerializer().serializeToString(safeSvg);
  const dataUrl =
    typeof window !== 'undefined' && typeof window.btoa === 'function'
      ? `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgXml)))}`
      : `data:image/svg+xml;utf8,${encodeURIComponent(svgXml)}`;

  const img = await loadImageWithTimeout(dataUrl, 3000);

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D Context not available');
  }

  if (typeof ctx.scale === 'function') {
    ctx.scale(scale, scale);
  }

  // 누끼 딴 것처럼 완전한 투명 배경 유지 (배경 박스 및 테두리 fill/stroke 일체 배제)
  if (typeof ctx.clearRect === 'function') {
    ctx.clearRect(0, 0, width, height);
  }

  if (typeof ctx.drawImage === 'function') {
    ctx.drawImage(img, 0, 0, width, height);
  }

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width,
    height,
  };
}

/**
 * 마크다운 원본 문자열에서 ```mermaid 블록 목록을 정규식으로 안전하게 추출합니다.
 */
export function extractMermaidCodesFromText(text: string): string[] {
  if (!text) return [];
  const codes: string[] = [];
  const regex = /```mermaid[ \t]*\r?\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[1].trim();
    if (raw) codes.push(raw);
  }
  return codes;
}

/**
 * 주어진 프리뷰 컨테이너 요소 또는 마크다운 본문의 모든 Mermaid 다이어그램 및 KaTeX 수식을 탐색하여
 * 백엔드 PDF 임베드용 자산 배열로 변환합니다.
 * - PDF 내보내기 시 Mermaid를 mermaid.ai 감성의 밝은 테마(Light Theme) + 투명(누끼) 배경으로 렌더링합니다.
 * - 렌더링 완료 후 웹 에디터 프리뷰 환경을 위해 다크 테마를 자동 복원합니다.
 */
export async function captureRenderedAssets(
  container: HTMLElement | null,
  rawMarkdownContent?: string,
): Promise<RenderedAsset[]> {
  const root =
    container ||
    (typeof document !== 'undefined'
      ? document.querySelector<HTMLElement>('.markdown-rendered-content') ||
        document.querySelector<HTMLElement>('.markdown-preview-root') ||
        document.querySelector<HTMLElement>('.markdown-body-wrapper') ||
        document.body
      : null);

  const capturePromise = async (): Promise<RenderedAsset[]> => {
    const assets: RenderedAsset[] = [];

    // 1. 캡처 대상 Mermaid 코드 목록 수집 (마크다운 원본 + DOM 컨테이너)
    const codeList: string[] = [];
    if (rawMarkdownContent) {
      codeList.push(...extractMermaidCodesFromText(rawMarkdownContent));
    }
    if (root) {
      const mermaidContainers = Array.from(
        root.querySelectorAll<HTMLElement>('.mermaid-diagram-container'),
      );
      for (const mc of mermaidContainers) {
        const rawCode = mc.getAttribute('data-mermaid-code')
          ? decodeURIComponent(mc.getAttribute('data-mermaid-code') || '')
          : '';
        if (rawCode && !codeList.includes(rawCode.trim())) {
          codeList.push(rawCode.trim());
        }
      }
    }

    const uniqueCodes = Array.from(new Set(codeList.map((c) => c.trim()))).filter(Boolean);
    const capturedCodes = new Set<string>();

    // 2. PDF Export 전용 라이트 모드 (mermaid.ai 감성) 렌더링 (브라우저 실환경)
    if (uniqueCodes.length > 0) {
      let mermaidInstance: Awaited<ReturnType<typeof getMermaid>> | null = null;
      try {
        mermaidInstance = await getMermaid();
        if (mermaidInstance && typeof mermaidInstance.initialize === 'function') {
          mermaidInstance.initialize(LIGHT_EXPORT_MERMAID_CONFIG);
        }

        for (const code of uniqueCodes) {
          try {
            const uniqueId = `mermaid-export-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const rendered = await mermaidInstance.render(uniqueId, code);
            const svgString = rendered?.svg;

            if (svgString) {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = svgString;
              const fallbackSvg = tempDiv.querySelector('svg');
              if (fallbackSvg) {
                const { dataUrl, width, height } = await svgToPngBase64(fallbackSvg, 2);
                if (dataUrl && dataUrl.startsWith('data:image/png')) {
                  assets.push({
                    type: 'mermaid',
                    code,
                    imageBase64: dataUrl,
                    width,
                    height,
                  });
                  capturedCodes.add(code);
                }
              }
            }
          } catch (err) {
            console.warn(`Mermaid 라이트 다이어그램 렌더링 실패 (DOM 폴백 시도): ${code}`, err);
          }
        }
      } catch (e) {
        console.warn('Mermaid 인스턴스 획득 실패 (DOM 폴백 진행):', e);
      } finally {
        // 웹 에디터 프리뷰 환경 유지를 위해 다크 테마 복원
        if (mermaidInstance && typeof mermaidInstance.initialize === 'function') {
          mermaidInstance.initialize(DARK_MERMAID_CONFIG);
        }
      }
    }

    // 3. Fallback: 라이트 모드 렌더링이 실패했거나 JSDOM 환경에서 DOM에 이미 SVG가 있는 경우
    if (root) {
      const mermaidContainers = Array.from(
        root.querySelectorAll<HTMLElement>('.mermaid-diagram-container'),
      );
      for (const mc of mermaidContainers) {
        const rawCode = mc.getAttribute('data-mermaid-code')
          ? decodeURIComponent(mc.getAttribute('data-mermaid-code') || '')
          : '';
        const trimmed = rawCode.trim();

        if (trimmed && capturedCodes.has(trimmed)) {
          continue; // 이미 라이트 모드로 캡처 완료된 코드는 건너뜀
        }

        let svg = mc.querySelector('svg');
        if (!svg && trimmed && mermaidSvgCache.has(trimmed)) {
          const cachedSvgHtml = mermaidSvgCache.get(trimmed);
          if (cachedSvgHtml) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cachedSvgHtml;
            svg = tempDiv.querySelector('svg');
          }
        }

        if (svg) {
          try {
            const { dataUrl, width, height } = await svgToPngBase64(svg, 2);
            if (dataUrl && dataUrl.startsWith('data:image/png')) {
              assets.push({
                type: 'mermaid',
                code: trimmed,
                imageBase64: dataUrl,
                width,
                height,
              });
              if (trimmed) capturedCodes.add(trimmed);
            }
          } catch (e) {
            console.warn('DOM Mermaid SVG 폴백 캡처 실패:', e);
          }
        }
      }
    }

    // 4. KaTeX 수식 블록 목록 수집 (백엔드 고속 수식 조판용)
    if (root) {
      const mathBlocks = Array.from(root.querySelectorAll<HTMLElement>('.math-block'));
      for (const mb of mathBlocks) {
        const rawCode = mb.getAttribute('data-math-code')
          ? decodeURIComponent(mb.getAttribute('data-math-code') || '')
          : '';
        assets.push({
          type: 'math',
          code: rawCode,
          imageBase64: '',
          width: 0,
          height: 0,
        });
      }
    }

    return assets;
  };

  // 전체 자산 캡처 타임아웃 (10초 보장)
  const timeoutPromise = new Promise<RenderedAsset[]>((resolve) => {
    setTimeout(() => {
      console.warn('자산 캡처 10초 타임아웃 도달: 수집된 자산으로 PDF 생성 단계로 진입합니다.');
      resolve([]);
    }, 10000);
  });

  return Promise.race([capturePromise(), timeoutPromise]);
}
