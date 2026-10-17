import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchNeuralSessions,
  createNeuralSession,
  streamJarvisVoice,
  interruptSpeech,
  searchAiDocuments,
} from './aiClient';

function createMockSseResponse(chunks: string[], status = 200) {
  const encoder = new TextEncoder();
  let index = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index++]));
      } else {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

describe('aiClient Module', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchNeuralSessions', () => {
    it('성공 시 서버 세션 목록을 반환해야 한다', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          title: 'Test Session',
          status: 'LIVE' as const,
          createdAt: '2026-10-11T00:00:00Z',
          updatedAt: '2026-10-11T00:00:00Z',
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockSessions), { status: 200 })
      );

      const result = await fetchNeuralSessions();
      expect(result).toEqual(mockSessions);
    });

    it('네트워크 실패 시 빈 세션 배열로 폴백해야 한다', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchNeuralSessions();
      expect(result).toEqual([]);
    });
  });

  describe('createNeuralSession', () => {
    it('성공 시 생성된 세션 객체를 반환해야 한다', async () => {
      const created = {
        id: 'session-new-123',
        title: 'Custom Title',
        status: 'LIVE' as const,
        createdAt: '2026-10-11T01:00:00Z',
        updatedAt: '2026-10-11T01:00:00Z',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(created), { status: 201 })
      );

      const result = await createNeuralSession('Custom Title');
      expect(result).toEqual(created);
    });

    it('서버 실패 시 로컬 임시 세션 객체로 폴백해야 한다', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('500 Internal Error'));

      const result = await createNeuralSession('Fallback Title');
      expect(result.id).toMatch(/^session-jarvis-/);
      expect(result.title).toBe('Fallback Title');
    });
  });

  describe('streamJarvisVoice', () => {
    it('텍스트 쿼리 요청 시 application/json으로 전송하고 SSE 이벤트를 올바르게 디코딩해야 한다', async () => {
      const sseChunks = [
        'event: transcription\ndata: {"text":"전사 완료"}\n\n',
        'event: benchmark\ndata: {"workerName":"local-worker","opfsStream":"1ms","remoteSse":"5ms"}\n\n',
        'event: context_ref\ndata: {"contexts":[{"id":"c1","title":"doc.md","filename":"doc.md","type":"doc"}]}\n\n',
        'event: token\ndata: {"delta":"헬로 "}\n\n',
        'event: token\ndata: {"delta":"월드"}\n\n',
        'event: audio_complete\ndata: {"audioUrl":"/api/v1/ai/audio/test.wav","duration":"0:10"}\n\n',
        'event: done\ndata: {"finished":true,"tokensUsed":50}\n\n',
      ];

      let requestedBody: BodyInit | null | undefined;
      let requestedHeaders: HeadersInit | undefined;

      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
        requestedBody = init?.body;
        requestedHeaders = init?.headers;
        return createMockSseResponse(sseChunks);
      });

      const onTranscription = vi.fn();
      const onBenchmark = vi.fn();
      const onContextRef = vi.fn();
      const onToken = vi.fn();
      const onAudioComplete = vi.fn();
      const onDone = vi.fn();

      await streamJarvisVoice({
        sessionId: 'session-123',
        textQuery: '안녕하세요',
        handlers: {
          onTranscription,
          onBenchmark,
          onContextRef,
          onToken,
          onAudioComplete,
          onDone,
        },
      });

      expect((requestedHeaders as Record<string, string>)['Content-Type']).toBe('application/json');
      expect(JSON.parse(requestedBody as string)).toMatchObject({
        sessionId: 'session-123',
        textQuery: '안녕하세요',
        enableTools: true,
      });

      expect(onTranscription).toHaveBeenCalledWith('전사 완료');
      expect(onBenchmark).toHaveBeenCalledWith({
        workerName: 'local-worker',
        opfsStream: '1ms',
        remoteSse: '5ms',
      });
      expect(onContextRef).toHaveBeenCalledWith([
        { id: 'c1', title: 'doc.md', filename: 'doc.md', type: 'doc' },
      ]);
      expect(onToken).toHaveBeenCalledTimes(2);
      expect(onToken).toHaveBeenNthCalledWith(1, '헬로 ');
      expect(onToken).toHaveBeenNthCalledWith(2, '월드');
      expect(onAudioComplete).toHaveBeenCalledWith({
        audioUrl: '/api/v1/ai/audio/test.wav',
        duration: '0:10',
      });
      expect(onDone).toHaveBeenCalledWith({
        finished: true,
        tokensUsed: 50,
      });
    });

    it('오디오 Blob 전달 시 multipart/form-data로 전송해야 한다', async () => {
      let requestedBody: BodyInit | null | undefined;
      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
        requestedBody = init?.body;
        return createMockSseResponse(['event: done\ndata: {"finished":true}\n\n']);
      });

      const fakeBlob = new Blob(['dummy audio content'], { type: 'audio/webm' });
      const onDone = vi.fn();

      await streamJarvisVoice({
        sessionId: 'session-audio',
        audioBlob: fakeBlob,
        textQuery: '선택적 텍스트',
        handlers: { onDone },
      });

      expect(requestedBody).toBeInstanceOf(FormData);
      expect((requestedBody as FormData).get('sessionId')).toBe('session-audio');
      expect((requestedBody as FormData).get('audio')).toBeInstanceOf(Blob);
      expect((requestedBody as FormData).get('textQuery')).toBe('선택적 텍스트');
      expect(onDone).toHaveBeenCalled();
    });

    it('HTTP 에러 발생 시 onError 핸들러를 호출하고 예외를 던져야 한다', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Internal Server Error', { status: 500, statusText: 'Server Error' })
      );

      const onError = vi.fn();
      await expect(
        streamJarvisVoice({
          sessionId: 'session-err',
          textQuery: '에러 테스트',
          handlers: { onError },
        })
      ).rejects.toThrow();

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('interruptSpeech', () => {
    it('중단 성공 시 true를 반환해야 한다', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 'ok', interrupted: true }), { status: 200 })
      );

      const result = await interruptSpeech('session-123');
      expect(result).toBe(true);
    });

    it('요청 실패 시 false를 반환해야 한다', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const result = await interruptSpeech('session-123');
      expect(result).toBe(false);
    });
  });

  describe('searchAiDocuments', () => {
    it('Qdrant 검색 결과를 반환해야 한다', async () => {
      const mockResult = {
        results: [
          {
            documentId: 'doc-1',
            title: '테스트 문서',
            content: '검색된 내용',
            score: 0.95,
          },
        ],
        total: 1,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockResult), { status: 200 })
      );

      const result = await searchAiDocuments({ query: '테스트' });
      expect(result).toEqual(mockResult);
    });
  });
});
