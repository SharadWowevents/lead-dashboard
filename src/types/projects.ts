// Ported from ProjectsList frontend/src/types.ts
// FIXED: original declared ProjectStatus 'Active' and ProjectStats.active, but every
// component/backend actually uses 'Completed' — corrected here so TypeScript matches reality.
export type ProjectStatus = 'Completed' | 'Inactive' | 'In progress';

export interface ProjectTypeItem {
  id: string;
  name: string;
  color?: string;
  isDefault?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  type: string;
  link: string;
  isLive: boolean;
  date: string; // YYYY-MM-DD
  status: ProjectStatus;
  tags?: string[];
  techStack?: string[];
  githubUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SortField = 'date' | 'name' | 'status' | 'isLive' | 'type';
export type SortOrder = 'asc' | 'desc';

export interface FilterState {
  search: string;
  type: string;
  status: ProjectStatus | 'ALL';
  isLive: 'ALL' | 'LIVE' | 'OFFLINE';
  sortBy: SortField;
  sortOrder: SortOrder;
}

export interface ProjectStats {
  total: number;
  live: number;
  offline: number;
  Completed: number;
  inProgress: number;
  inactive: number;
  typeCounts: Record<string, number>;
}
