import { describe, it, expect, vi } from 'vitest';
import {
  captureRenderedAssets,
  sanitizeMermaidSvgForExport,
  svgToPngBase64,
} from './pdfAssetCapture';

describe('pdfAssetCapture', () => {
  it('sanitizeMermaidSvgForExport는 배경 rect를 투명화하고 노드/텍스트를 밝은 테마 색상으로 변환해야 한다', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 400 200');

    // 1. 다크 모드 배경 사각형
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.className.baseVal = 'background';
    bgRect.setAttribute('fill', '#09090b');
    svg.appendChild(bgRect);

    // 2. 다크 모드 노드 사각형 (#27272a)
    const nodeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    nodeRect.setAttribute('fill', '#27272a');
    nodeRect.setAttribute('stroke', '#3f3f46');
    svg.appendChild(nodeRect);

    // 3. foreignObject (흰색 글씨)
    const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    fo.setAttribute('width', '100');
    fo.setAttribute('height', '40');
    fo.textContent = '클라이언트 노드';
    svg.appendChild(fo);

    // 4. 일반 텍스트 (#f4f4f5)
    const textNode = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textNode.setAttribute('fill', '#f4f4f5');
    textNode.textContent = '연결선 레이블';
    svg.appendChild(textNode);

    const sanitized = sanitizeMermaidSvgForExport(svg);

    // 검증 1: 배경 rect가 투명 처리되었는지 확인
    const sanitizedBg = sanitized.querySelector('rect.background');
    expect(sanitizedBg?.getAttribute('fill')).toBe('none');
    expect(sanitizedBg?.getAttribute('stroke')).toBe('none');

    // 검증 2: 다크 모드 노드가 밝은 슬레이트(#f1f5f9) 및 테두리(#94a3b8)로 변환되었는지 확인
    const sanitizedNode = sanitized.querySelectorAll('rect')[1];
    expect(sanitizedNode.getAttribute('fill')).toBe('#f1f5f9');
    expect(sanitizedNode.getAttribute('stroke')).toBe('#94a3b8');

    // 검증 3: foreignObject가 순수 text 태그로 치환되고 어두운 텍스트(#0f172a)를 갖는지 확인
    expect(sanitized.querySelector('foreignObject')).toBeNull();
    const convertedText = sanitized.querySelector('text');
    expect(convertedText?.getAttribute('fill')).toBe('#0f172a');
    expect(convertedText?.textContent).toBe('클라이언트 노드');

    // 검증 4: 기존 흰색 텍스트도 #0f172a로 보정되었는지 확인
    const lastText = sanitized.querySelectorAll('text')[1];
    expect(lastText.getAttribute('fill')).toBe('#0f172a');
  });

  it('svgToPngBase64는 배경 사각형을 칠하지 않고 투명 캔버스(clearRect)를 유지해야 한다', async () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 300 150');

    const origImage = global.Image;
    const origCreateElement = document.createElement.bind(document);

    class MockImage {
      onload: (() => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      src = '';
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 5);
      }
    }
    (global as unknown as { Image: unknown }).Image = MockImage;

    const mockCtx = {
      scale: vi.fn(),
      clearRect: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      fillRect: vi.fn(),
      stroke: vi.fn(),
      drawImage: vi.fn(),
    };

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,transparentPng'),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      return origCreateElement(tagName);
    });

    try {
      const result = await svgToPngBase64(svg, 2);
      expect(result.dataUrl).toBe('data:image/png;base64,transparentPng');
      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 300, 150);
      // 배경 박스를 그리지 않아야 함
      expect(mockCtx.fillRect).not.toHaveBeenCalled();
      expect(mockCtx.stroke).not.toHaveBeenCalled();
    } finally {
      global.Image = origImage;
      vi.restoreAllMocks();
    }
  });

  it('컨테이너가 null이면 빈 배열을 반환해야 한다', async () => {
    const assets = await captureRenderedAssets(null);
    expect(assets).toEqual([]);
  });

  it('다이어그램 컨테이너에서 Mermaid SVG를 탐색하고 캡처 자산을 생성해야 한다', async () => {
    const container = document.createElement('div');
    const mermaidBox = document.createElement('div');
    mermaidBox.className = 'mermaid-container mermaid-diagram-container';
    mermaidBox.setAttribute('data-mermaid-code', encodeURIComponent('graph TD\nA-->B'));

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '400');
    svg.setAttribute('height', '150');
    mermaidBox.appendChild(svg);
    container.appendChild(mermaidBox);

    // Mock Image & Canvas for headless JSDOM environment
    const origImage = global.Image;
    const origCreateElement = document.createElement.bind(document);

    class MockImage {
      onload: (() => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      src = '';
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
    }
    (global as unknown as { Image: unknown }).Image = MockImage;

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue({
        scale: vi.fn(),
        clearRect: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        rect: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        drawImage: vi.fn(),
      }),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mockPngBase64'),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      return origCreateElement(tagName);
    });

    try {
      const assets = await captureRenderedAssets(container);
      expect(assets.length).toBe(1);
      expect(assets[0].type).toBe('mermaid');
      expect(assets[0].code).toBe('graph TD\nA-->B');
      expect(assets[0].imageBase64).toBe('data:image/png;base64,mockPngBase64');
    } finally {
      global.Image = origImage;
      vi.restoreAllMocks();
    }
  });

  it('KaTeX 수식 블록에서 수식 코드를 추출하고 캡처 자산을 생성해야 한다', async () => {
    const container = document.createElement('div');
    const mathBox = document.createElement('div');
    mathBox.className = 'math-block';
    mathBox.setAttribute('data-math-code', encodeURIComponent('E = mc^2'));
    mathBox.innerHTML = '<span>E = mc^2</span>';
    container.appendChild(mathBox);

    const origImage = global.Image;
    class MockImage {
      onload: (() => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      src = '';
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
    }
    (global as unknown as { Image: unknown }).Image = MockImage;

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue({
        scale: vi.fn(),
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
      }),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mockMathPng'),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      return document.createElementNS('http://www.w3.org/1999/xhtml', tagName);
    });

    try {
      const assets = await captureRenderedAssets(container);
      expect(assets.length).toBe(1);
      expect(assets[0].type).toBe('math');
      expect(assets[0].code).toBe('E = mc^2');
      expect(typeof assets[0].imageBase64).toBe('string');
    } finally {
      global.Image = origImage;
      vi.restoreAllMocks();
    }
  });
});
