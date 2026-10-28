import { useCallback, useRef } from 'react';
import {
  startNativeSpeechRecognition,
  SpeechRecognitionController,
  isSpeechRecognitionSupported,
} from '../lib/browserSpeechRecognition';

export interface PttStartOptions {
  timesliceMs?: number;
  onAudioChunk?: (chunk: Blob) => void;
  onInterimText?: (text: string) => void;
  onFinalText?: (text: string) => void;
  onError?: (err: string) => void;
}

export interface PttCompleteResult {
  audioBlob?: Blob;
  recognizedText?: string;
}

export function useMediaRecorderPtt() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isListeningActiveRef = useRef<boolean>(false);
  const speechRecognitionControllerRef = useRef<SpeechRecognitionController | null>(null);
  const recognizedTextAccumulatorRef = useRef<string>('');

  const releaseMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    speechRecognitionControllerRef.current = null;
  }, []);

  const cancelRecording = useCallback(() => {
    isListeningActiveRef.current = false;
    if (speechRecognitionControllerRef.current) {
      speechRecognitionControllerRef.current.abort();
      speechRecognitionControllerRef.current = null;
    }
    releaseMediaStream();
  }, [releaseMediaStream]);

  const startRecording = useCallback((options?: PttStartOptions) => {
    isListeningActiveRef.current = true;
    audioChunksRef.current = [];
    recognizedTextAccumulatorRef.current = '';

    // 1. 브라우저 네이티브 실시간 음성 인식 (STT) 시작
    if (isSpeechRecognitionSupported()) {
      speechRecognitionControllerRef.current = startNativeSpeechRecognition({
        lang: 'ko-KR',
        onInterimText: (interimText) => {
          if (!isListeningActiveRef.current) return;
          recognizedTextAccumulatorRef.current = interimText;
          options?.onInterimText?.(interimText);
        },
        onFinalText: (finalText) => {
          if (!isListeningActiveRef.current) return;
          recognizedTextAccumulatorRef.current = finalText;
          options?.onFinalText?.(finalText);
        },
        onError: (err) => {
          console.warn('[PTT STT]', err);
          options?.onError?.(err);
        },
      });
    }

    // 2. 마이크 오디오 바이너리 스트리밍 (MediaRecorder)
    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          if (!isListeningActiveRef.current) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          mediaStreamRef.current = stream;
          try {
            const mimeType =
              typeof MediaRecorder !== 'undefined' &&
              MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : undefined;
            const recorder = new MediaRecorder(
              stream,
              mimeType ? { mimeType } : undefined
            );

            recorder.ondataavailable = (event) => {
              if (event.data && event.data.size > 0) {
                audioChunksRef.current.push(event.data);
                // 실시간 오디오 청크 콜백 (웹소켓 전송용)
                options?.onAudioChunk?.(event.data);
              }
            };

            const timeslice = options?.timesliceMs ?? 200;
            recorder.start(timeslice);
            mediaRecorderRef.current = recorder;
          } catch (e) {
            console.warn('MediaRecorder init failed:', e);
          }
        })
        .catch((err) => {
          console.warn('Microphone permission denied or unavailable:', err);
          options?.onError?.('마이크 사용 권한이 거부되었거나 지원되지 않습니다.');
        });
    }
  }, []);

  const stopRecording = useCallback(
    (onComplete: (result: PttCompleteResult) => void) => {
      isListeningActiveRef.current = false;

      // 음성 인식 컨트롤러 정상 종료
      if (speechRecognitionControllerRef.current) {
        speechRecognitionControllerRef.current.stop();
        speechRecognitionControllerRef.current = null;
      }

      const recorder = mediaRecorderRef.current;
      const finalRecordedText = recognizedTextAccumulatorRef.current.trim();

      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = () => {
          const audioBlob =
            audioChunksRef.current.length > 0
              ? new Blob(audioChunksRef.current, { type: 'audio/webm' })
              : undefined;

          onComplete({
            audioBlob,
            recognizedText: finalRecordedText || undefined,
          });
          releaseMediaStream();
        };
        recorder.stop();
      } else {
        releaseMediaStream();
        onComplete({
          audioBlob: undefined,
          recognizedText: finalRecordedText || undefined,
        });
      }
    },
    [releaseMediaStream]
  );

  return {
    startRecording,
    stopRecording,
    cancelRecording,
    releaseMediaStream,
  };
}
