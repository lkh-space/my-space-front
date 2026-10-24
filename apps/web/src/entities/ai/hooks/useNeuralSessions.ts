import { useState, useCallback, useRef, useEffect } from 'react';
import { NeuralStreamSession } from '../model/types';
import {
  INITIAL_NEURAL_SESSIONS,
  fetchNeuralSessions,
  createNeuralSession,
} from '../api/aiClient';

export function useNeuralSessions(onSessionReset?: () => void) {
  const [sessions, setSessions] = useState<NeuralStreamSession[]>(INITIAL_NEURAL_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const currentSessionIdRef = useRef<string>('');

  // 세션 목록 초기 로드 (세션이 비어있는 경우 백엔드에 초기 세션 자동 생성)
  useEffect(() => {
    let isMounted = true;
    fetchNeuralSessions().then(async (fetched) => {
      if (!isMounted) return;
      if (fetched && fetched.length > 0) {
        setSessions(fetched);
        setActiveSessionId((prev) => {
          const nextId = !fetched.some((s) => s.id === prev) ? fetched[0].id : prev;
          currentSessionIdRef.current = nextId;
          return nextId;
        });
      } else {
        try {
          const created = await createNeuralSession('Neural Stream Diagnostic Session');
          if (isMounted) {
            setSessions([created]);
            setActiveSessionId(created.id);
            currentSessionIdRef.current = created.id;
          }
        } catch (e) {
          console.warn('초기 세션 생성 실패:', e);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const ensureSessionId = useCallback((): string => {
    const targetSessionId =
      activeSessionId || currentSessionIdRef.current || `session-jarvis-${Date.now()}`;
    currentSessionIdRef.current = targetSessionId;
    if (!activeSessionId) {
      setActiveSessionId(targetSessionId);
    }
    return targetSessionId;
  }, [activeSessionId]);

  const createNewSession = useCallback(async () => {
    try {
      const created = await createNeuralSession('New Neural Session');
      setSessions((prev) => [created, ...prev]);
      setActiveSessionId(created.id);
      currentSessionIdRef.current = created.id;
      onSessionReset?.();
    } catch {
      const fallbackId = `session-${Date.now()}`;
      const newSession: NeuralStreamSession = {
        id: fallbackId,
        title: 'New Neural Session',
        status: 'LIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      currentSessionIdRef.current = newSession.id;
      onSessionReset?.();
    }
  }, [onSessionReset]);

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    currentSessionIdRef,
    ensureSessionId,
    createNewSession,
  };
}
