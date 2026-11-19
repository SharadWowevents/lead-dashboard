import { Project, ProjectStatus, ProjectTypeItem } from '../types/projects.ts';

// Color palette mapping for type badges in lead-dashboard theme
export const TYPE_COLOR_MAP: Record<string, { bg: string; text: string; border: string; dot: string; glow: string }> = {
  Dashboard: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-500',
    glow: 'group-hover:shadow-xs',
  },
  Tracker: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    glow: 'group-hover:shadow-xs',
  },
  Calculator: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    glow: 'group-hover:shadow-xs',
  },
  'AI Tool': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
    glow: 'group-hover:shadow-xs',
  },
  Portfolio: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
    glow: 'group-hover:shadow-xs',
  },
  Utility: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    glow: 'group-hover:shadow-xs',
  },
};

export function getTypeBadgeStyle(typeName: string) {
  if (TYPE_COLOR_MAP[typeName]) {
    return TYPE_COLOR_MAP[typeName];
  }
  // Generate consistent hash-based color for user custom types
  const palette = [
    { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500', glow: 'shadow-xs' },
    { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', glow: 'shadow-xs' },
    { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', dot: 'bg-fuchsia-500', glow: 'shadow-xs' },
    { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', glow: 'shadow-xs' },
    { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500', glow: 'shadow-xs' },
    { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500', glow: 'shadow-xs' },
  ];
  let hash = 0;
  for (let i = 0; i < typeName.length; i++) {
    hash = typeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}

// Status styles in lead-dashboard theme
export function getStatusBadgeStyle(status: ProjectStatus) {
  switch (status) {
    case 'Completed':
      return {
        bg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        dot: 'bg-emerald-600',
        label: 'Completed',
      };
    case 'In progress':
      return {
        bg: 'bg-amber-50 text-amber-900 border-amber-200',
        dot: 'bg-amber-600',
        label: 'In progress',
      };
    case 'Inactive':
      return {
        bg: 'bg-slate-100 text-slate-700/70 border-slate-200',
        dot: 'bg-slate-500/40',
        label: 'Inactive',
      };
    default:
      return {
        bg: 'bg-slate-100 text-slate-700/70 border-slate-200',
        dot: 'bg-slate-500/40',
        label: status,
      };
  }
}

// Normalize URL with https:// if protocol missing
export function normalizeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

// Format display URL (clean domain + path without full protocol)
export function getDisplayUrl(url: string): string {
  if (!url) return 'No link provided';
  try {
    const full = normalizeUrl(url);
    const parsed = new URL(full);
    const path = parsed.pathname === '/' ? '' : parsed.pathname;
    return `${parsed.hostname}${path}`;
  } catch {
    return url.replace(/^https?:\/\//i, '');
  }
}

/**
 * Name matching between Projects Directory entries and lead-dashboard sidebar sites.
 * Tolerant of singular/plural and punctuation differences, e.g.
 * Directory "101 Business Prompt"  <->  Sidebar "101 Business Prompts"
 */
export function normalizeSiteMatchKey(value: string): string {
  return (value || '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((word) => {
      const clean = word.replace(/[^a-z0-9]/g, '');
      return clean.length > 3 && clean.endsWith('s') ? clean.slice(0, -1) : clean;
    })
    .filter(Boolean)
    .join(' ');
}

export function findProjectForSite<T extends { name: string; link?: string }>(
  projects: T[],
  siteName: string | null | undefined,
): T | null {
  if (!siteName) return null;
  const target = normalizeSiteMatchKey(siteName);
  if (!target) return null;
  return (
    projects.find((p) => normalizeSiteMatchKey(p.name) === target) ||
    projects.find((p) => {
      const key = normalizeSiteMatchKey(p.name);
      return key && (key.startsWith(target) || target.startsWith(key));
    }) ||
    null
  );
}

// Date formatter
export function formatDeploymentDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Relative time format
export function getRelativeTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    let target: Date;
    if (parts.length === 3) {
      target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      target = new Date(dateStr);
    }
    if (isNaN(target.getTime())) return '';

    const now = new Date();
    // Normalize both to start of day
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = Math.round((today - targetDay) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays === -1) return 'Tomorrow';
    if (diffDays > 0 && diffDays < 30) return `${diffDays}d ago`;
    if (diffDays > 0 && diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months}mo ago`;
    }
    if (diffDays >= 365) {
      const years = Math.floor(diffDays / 365);
      return `${years}y ago`;
    }
    if (diffDays < 0) {
      return `In ${Math.abs(diffDays)}d`;
    }
    return '';
  } catch {
    return '';
  }
}

// Export projects as CSV
export function exportProjectsToCSV(projects: Project[]): void {
  const headers = ['Name', 'Type', 'Link', 'Live', 'Date of Deployment/Development', 'Status', 'Description', 'Notes', 'Tags'];
  const rows = projects.map(p => [
    `"${(p.name || '').replace(/"/g, '""')}"`,
    `"${(p.type || '').replace(/"/g, '""')}"`,
    `"${(p.link || '').replace(/"/g, '""')}"`,
    p.isLive ? 'Yes' : 'No',
    `"${(p.date || '').replace(/"/g, '""')}"`,
    `"${(p.status || '').replace(/"/g, '""')}"`,
    `"${(p.description || '').replace(/"/g, '""')}"`,
    `"${(p.notes || '').replace(/"/g, '""')}"`,
    `"${(p.tags?.join(', ') || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `projects-export-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export projects as JSON
export function exportProjectsToJSON(projects: Project[], types: ProjectTypeItem[]): void {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    projectCount: projects.length,
    types,
    projects,
  };
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `projects-backup-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
