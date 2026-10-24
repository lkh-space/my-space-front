import { RecentTaskItem } from '../types/dashboard';

const STORAGE_KEY = 'my-space:recent-tasks';
const MAX_TASKS = 10;
export const RECENT_TASKS_UPDATED_EVENT = 'recent-tasks-updated';

export const INITIAL_TASKS: RecentTaskItem[] = [
  {
    id: 'task-1',
    title: 'pdf-merge-specs.pdf',
    type: 'pdf',
    status: 'COMPLETED',
    timestamp: '12분 전',
    detail: '3개 파일 병합 완료 (4.2 MB)',
  },
  {
    id: 'task-2',
    title: 'auth-service.dbml',
    type: 'dbml',
    status: 'COMPLETED',
    timestamp: '1시간 전',
    detail: 'PostgreSQL DDL 스키마 생성 완료',
  },
  {
    id: 'task-3',
    title: 'release-notes-v0.1.md',
    type: 'markdown',
    status: 'COMPLETED',
    timestamp: '3시간 전',
    detail: '마크다운 실시간 렌더링 (240줄)',
  },
  {
    id: 'task-4',
    title: 'architecture-diagram.pdf',
    type: 'pdf',
    status: 'COMPLETED',
    timestamp: '어제',
    detail: 'PDF 페이지 분할 및 최적화 (-35%)',
  },
];

function isValidRecentTaskItem(val: unknown): val is RecentTaskItem {
  if (!val || typeof val !== 'object') return false;
  const record = val as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.title === 'string' &&
    typeof record.type === 'string' &&
    typeof record.status === 'string' &&
    typeof record.timestamp === 'string'
  );
}

export function notifyRecentTasksUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(RECENT_TASKS_UPDATED_EVENT));
  }
}

export function getRecentTasks(): RecentTaskItem[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return INITIAL_TASKS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // 초기 시드 데이터 저장
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.error('Invalid recent tasks format in localStorage (expected array)');
      return INITIAL_TASKS;
    }
    return parsed.filter(isValidRecentTaskItem);
  } catch (error) {
    console.error('Failed to read recent tasks from localStorage:', error);
    return INITIAL_TASKS;
  }
}

export function addRecentTask(item: Omit<RecentTaskItem, 'id' | 'timestamp'>): RecentTaskItem[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  const current = getRecentTasks();
  const newItem: RecentTaskItem = {
    ...item,
    id: `task-${Date.now()}`,
    timestamp: '방금 전',
  };

  const updated = [newItem, ...current].slice(0, MAX_TASKS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyRecentTasksUpdated();
  } catch (error) {
    console.error('Failed to save recent task to localStorage:', error);
  }
  return updated;
}

export function clearRecentTasks(): RecentTaskItem[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    notifyRecentTasksUpdated();
  } catch (error) {
    console.error('Failed to clear recent tasks in localStorage:', error);
  }
  return [];
}
