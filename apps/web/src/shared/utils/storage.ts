import { RecentTaskItem } from '../types/dashboard';

const STORAGE_KEY = 'my-space:recent-tasks';
const MAX_TASKS = 10;

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
    return JSON.parse(raw) as RecentTaskItem[];
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
  } catch (error) {
    console.error('Failed to clear recent tasks in localStorage:', error);
  }
  return [];
}
