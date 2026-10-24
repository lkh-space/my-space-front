import { useCallback, useRef } from 'react';

export function useMediaRecorderPtt() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isListeningActiveRef = useRef<boolean>(false);

  const releaseMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  const cancelRecording = useCallback(() => {
    isListeningActiveRef.current = false;
    releaseMediaStream();
  }, [releaseMediaStream]);

  const startRecording = useCallback(() => {
    isListeningActiveRef.current = true;
    audioChunksRef.current = [];

    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          // 비동기 권한 승인 / 스트림 확보 전 사용자가 이미 스페이스바를 뗐다면 즉시 트랙 종료
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
              }
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
          } catch (e) {
            console.warn('MediaRecorder init failed, fallback to audio simulation:', e);
          }
        })
        .catch((err) => {
          console.warn('Microphone permission denied or unavailable:', err);
        });
    }
  }, []);

  const stopRecording = useCallback(
    (onComplete: (audioBlob?: Blob) => void) => {
      isListeningActiveRef.current = false;
      const recorder = mediaRecorderRef.current;

      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = () => {
          const audioBlob =
            audioChunksRef.current.length > 0
              ? new Blob(audioChunksRef.current, { type: 'audio/webm' })
              : undefined;

          onComplete(audioBlob);
          releaseMediaStream();
        };
        recorder.stop();
      } else {
        releaseMediaStream();
        onComplete(undefined);
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
