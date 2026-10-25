import { triggerBlobDownload } from '../../../shared/api/download';
import { ConnectorPath, LayoutedTable } from './erdLayout';
import { generateErdSvg } from './erdSvgGenerator';

export type ExportImageFormat = 'svg' | 'png' | 'jpg';
export type ExportImageScale = 1 | 2 | 3;

export interface ExportErdImageOptions {
  tables: LayoutedTable[];
  connectors: ConnectorPath[];
  format: ExportImageFormat;
  scale?: ExportImageScale;
  filename?: string;
}

/**
 * SVG 문자열을 브라우저 캔버스를 통해 고해상도 PNG 또는 JPG Blob으로 래스터화 변환합니다.
 * - PNG: 배경 없이 완전한 투명 누끼(Transparent)로 렌더링
 * - JPG: 포맷 특성상 투명도가 지원되지 않으므로 다크 테마 배경(#0b0f17)으로 채움
 */
export function rasterizeSvgToBlob(
  svgString: string,
  options: { format: 'png' | 'jpg'; scale: number }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('브라우저 환경에서만 이미지 변환이 가능합니다.'));
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) {
      reject(new Error('유효하지 않은 SVG 데이터입니다.'));
      return;
    }

    const width = parseFloat(svgEl.getAttribute('width') || '800');
    const height = parseFloat(svgEl.getAttribute('height') || '600');
    const scale = options.scale || 1;

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(blobUrl);
          reject(new Error('Canvas 2D 컨텍스트를 생성할 수 없습니다.'));
          return;
        }

        // 고화질 보정 설정
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 배경 처리
        if (options.format === 'png') {
          // 투명 누끼: 아무것도 칠하지 않고 투명 유지
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
          // JPG: 알파 채널 미지원으로 다크 배경 채움
          ctx.fillStyle = '#0b0f17';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 캔버스에 SVG 이미지 스케일 드로잉
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(blobUrl);

        const mimeType = options.format === 'png' ? 'image/png' : 'image/jpeg';
        const quality = options.format === 'jpg' ? 0.95 : undefined;

        canvas.toBlob(
          (resultBlob) => {
            if (resultBlob) {
              resolve(resultBlob);
            } else {
              reject(new Error('Canvas Blob 변환에 실패했습니다.'));
            }
          },
          mimeType,
          quality
        );
      } catch (err) {
        URL.revokeObjectURL(blobUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('SVG 이미지 파싱 및 로드에 실패했습니다.'));
    };

    img.src = blobUrl;
  });
}

/**
 * ERD 테이블과 관계선 데이터를 사용자가 선택한 포맷(SVG, PNG, JPG)과 해상도 배율(1x, 2x, 3x)로
 * 브라우저에서 직접 내보내고 다운로드를 트리거합니다.
 */
export async function exportErdImage(
  options: ExportErdImageOptions,
  rasterizer: (svg: string, opt: { format: 'png' | 'jpg'; scale: number }) => Promise<Blob> = rasterizeSvgToBlob
): Promise<{
  filename: string;
  format: ExportImageFormat;
}> {
  const { tables, connectors, format, scale = 1, filename } = options;

  // 1. 순수 투명 벡터 SVG 생성
  const svgString = generateErdSvg(tables, connectors);

  const baseFilename = filename || 'schema-erd';
  const finalFilename = `${baseFilename}.${format === 'jpg' ? 'jpg' : format}`;

  if (format === 'svg') {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    triggerBlobDownload(blob, finalFilename);
    return { filename: finalFilename, format };
  }

  // 2. PNG 또는 JPG 래스터 변환 (고해상도 배율 지원)
  const rasterBlob = await rasterizer(svgString, {
    format,
    scale,
  });

  triggerBlobDownload(rasterBlob, finalFilename);
  return { filename: finalFilename, format };
}
