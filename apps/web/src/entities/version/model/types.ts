export interface VersionPayload {
  name: string;
  version: string;
  gitBranch?: string;
  gitCommit?: string;
  buildTime?: string;
  env?: string;
}

export interface ServiceEndpointConfig {
  id: string;
  name: string;
  endpoint: string;
  isCritical?: boolean;
}

export type ServiceStatus = 'online' | 'error' | 'loading';

export interface ServiceVersionInfo extends Partial<VersionPayload> {
  id: string;
  name: string;
  endpoint: string;
  status: ServiceStatus;
  errorMessage?: string;
  isCritical?: boolean;
}

export interface SystemVersionState {
  frontend: ServiceVersionInfo;
  backendServices: ServiceVersionInfo[];
  allOnline: boolean;
  hasError: boolean;
  displayBadgeText: string;
  displayStatus: ServiceStatus;
  refetch: () => Promise<void>;
  isLoading: boolean;
}
