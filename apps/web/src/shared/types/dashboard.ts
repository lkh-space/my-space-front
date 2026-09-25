export type UtilityType = 'pdf' | 'dbml' | 'markdown' | 'system';

export type TaskStatus = 'COMPLETED' | 'RUNNING' | 'FAILED';

export interface RecentTaskItem {
  id: string;
  title: string;
  type: UtilityType;
  status: TaskStatus;
  timestamp: string;
  detail?: string;
}

export interface RuntimeMetrics {
  engineStatus: 'IDLE' | 'ACTIVE' | 'PROCESSING';
  cacheUsageMB: number;
  cacheMaxMB: number;
  memoryUsageMB: number;
  memoryMaxMB: number;
  socketStatus: 'CONNECTED' | 'DISCONNECTED';
  telemetryMode: string;
}

export interface InstalledUtility {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  icon: string;
  path: string;
  statusTag: string;
  lastUsed: string;
  version: string;
}
