import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getRecentTasks,
  addRecentTask,
  clearRecentTasks,
  INITIAL_TASKS,
} from './storage';

describe('storage utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getRecentTasks', () => {
    it('localStorage가 비어있을 때 INITIAL_TASKS를 반환하고 시드 데이터를 저장해야 한다', () => {
      const tasks = getRecentTasks();

      expect(tasks).toEqual(INITIAL_TASKS);
      expect(localStorage.getItem('my-space:recent-tasks')).toBe(
        JSON.stringify(INITIAL_TASKS),
      );
    });

    it('localStorage에 저장된 태스크 목록이 있으면 파싱하여 반환해야 한다', () => {
      const customTasks = [
        {
          id: 'custom-1',
          title: 'custom-file.pdf',
          type: 'pdf' as const,
          status: 'COMPLETED' as const,
          timestamp: '방금 전',
          detail: '테스트 상세',
        },
      ];
      localStorage.setItem('my-space:recent-tasks', JSON.stringify(customTasks));

      const tasks = getRecentTasks();
      expect(tasks).toEqual(customTasks);
    });

    it('localStorage 데이터 파싱 중 에러 발생 시 fallback으로 INITIAL_TASKS를 반환해야 한다', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(vi.fn());
      localStorage.setItem('my-space:recent-tasks', 'invalid-json-string');

      const tasks = getRecentTasks();
      expect(tasks).toEqual(INITIAL_TASKS);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('addRecentTask', () => {
    it('새로운 태스크를 목록 최상단에 추가해야 한다', () => {
      const newTask = {
        title: 'new-spec.md',
        type: 'markdown' as const,
        status: 'COMPLETED' as const,
        detail: '새로운 마크다운 파일',
      };

      const result = addRecentTask(newTask);

      expect(result[0].title).toBe('new-spec.md');
      expect(result[0].type).toBe('markdown');
      expect(result[0].timestamp).toBe('방금 전');
      expect(result[0].id).toMatch(/^task-\d+$/);
      // 기존 INITIAL_TASKS가 뒤에 이어져야 함
      expect(result.length).toBe(INITIAL_TASKS.length + 1);
    });

    it('태스크는 최대 10개(MAX_TASKS)까지만 유지되어야 한다', () => {
      // 12개의 태스크를 순차적으로 추가
      for (let i = 1; i <= 12; i++) {
        addRecentTask({
          title: `task-${i}.pdf`,
          type: 'pdf',
          status: 'COMPLETED',
          detail: `상세 ${i}`,
        });
      }

      const tasks = getRecentTasks();
      expect(tasks.length).toBe(10);
      expect(tasks[0].title).toBe('task-12.pdf');
    });
  });

  describe('clearRecentTasks', () => {
    it('최근 작업 이력을 비우고 빈 배열을 반환해야 한다', () => {
      // 데이터가 있는 상태에서 초기화
      getRecentTasks();
      expect(localStorage.getItem('my-space:recent-tasks')).not.toBeNull();

      const cleared = clearRecentTasks();
      expect(cleared).toEqual([]);
      expect(getRecentTasks()).toEqual([]);
    });
  });
});
