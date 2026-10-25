import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as downloadModule from '../../../shared/api/download';
import { ConnectorPath, LayoutedTable } from './erdLayout';
import { exportErdImage } from './erdImageExporter';

describe('erdImageExporter', () => {
  const sampleTables: LayoutedTable[] = [
    {
      name: 'users',
      x: 40,
      y: 40,
      width: 256,
      height: 152,
      fields: [{ name: 'id', type: 'integer', pk: true }],
    },
  ];

  const sampleConnectors: ConnectorPath[] = [];

  let triggerBlobDownloadSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    triggerBlobDownloadSpy = vi
      .spyOn(downloadModule, 'triggerBlobDownload')
      .mockImplementation(() => undefined);
  });

  it('format이 svg일 때 투명 SVG Blob을 생성하여 schema-erd.svg로 다운로드해야 한다', async () => {
    const result = await exportErdImage({
      tables: sampleTables,
      connectors: sampleConnectors,
      format: 'svg',
    });

    expect(result.filename).toBe('schema-erd.svg');
    expect(result.format).toBe('svg');
    expect(triggerBlobDownloadSpy).toHaveBeenCalledTimes(1);

    const [blob, filename] = triggerBlobDownloadSpy.mock.calls[0];
    expect(filename).toBe('schema-erd.svg');
    expect(blob.type).toContain('image/svg+xml');
  });

  it('format이 png일 때 래스터화된 PNG Blob을 schema-erd.png로 다운로드해야 한다', async () => {
    const dummyBlob = new Blob(['png-content'], { type: 'image/png' });
    const mockRasterizer = vi.fn().mockResolvedValue(dummyBlob);

    const result = await exportErdImage(
      {
        tables: sampleTables,
        connectors: sampleConnectors,
        format: 'png',
        scale: 2,
      },
      mockRasterizer
    );

    expect(result.filename).toBe('schema-erd.png');
    expect(result.format).toBe('png');
    expect(mockRasterizer).toHaveBeenCalledWith(expect.any(String), {
      format: 'png',
      scale: 2,
    });
    expect(triggerBlobDownloadSpy).toHaveBeenCalledWith(dummyBlob, 'schema-erd.png');
  });

  it('format이 jpg일 때 래스터화된 JPG Blob을 schema-erd.jpg로 다운로드해야 한다', async () => {
    const dummyBlob = new Blob(['jpg-content'], { type: 'image/jpeg' });
    const mockRasterizer = vi.fn().mockResolvedValue(dummyBlob);

    const result = await exportErdImage(
      {
        tables: sampleTables,
        connectors: sampleConnectors,
        format: 'jpg',
        scale: 3,
      },
      mockRasterizer
    );

    expect(result.filename).toBe('schema-erd.jpg');
    expect(result.format).toBe('jpg');
    expect(mockRasterizer).toHaveBeenCalledWith(expect.any(String), {
      format: 'jpg',
      scale: 3,
    });
    expect(triggerBlobDownloadSpy).toHaveBeenCalledWith(dummyBlob, 'schema-erd.jpg');
  });
});
