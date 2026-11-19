import React, { useState } from 'react';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  CopyCheck, 
  Calendar, 
  Layers,
  ChevronDown,
  Loader2 // <-- Added for loading states
} from 'lucide-react';
import { Project, ProjectStatus } from '../../types/projects.ts';
import { 
  getTypeBadgeStyle, 
  getStatusBadgeStyle, 
  getDisplayUrl, 
  normalizeUrl, 
  formatDeploymentDate 
} from '../../utils/projectsHelpers.ts';

interface ProjectGridProps {
  projects: Project[];
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  // Updated to support async operations for backend API calls
  onDuplicateProject: (project: Project) => Promise<void> | void;
  onToggleLive: (project: Project) => Promise<void> | void;
  onStatusChange: (project: Project, newStatus: ProjectStatus) => Promise<void> | void;
  
  onSelectProject: (project: Project) => void;
  onFilterByType: (type: string) => void;
  onOpenNewProject: () => void;
}

// Type to track which specific action on which project is currently processing
type ProcessingAction = 'live' | 'status' | 'duplicate';

export const ProjectGrid: React.FC<ProjectGridProps> = ({
  projects,
  onEditProject,
  onDeleteProject,
  onDuplicateProject,
  onToggleLive,
  onStatusChange,
  onSelectProject,
  onFilterByType,
  onOpenNewProject,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Track backend request states per project ID to prevent freezing the whole grid
  const [processingTasks, setProcessingTasks] = useState<Record<string, ProcessingAction>>({});

  const setProcessing = (id: string, action: ProcessingAction | null) => {
    setProcessingTasks(prev => {
      const next = { ...prev };
      if (action) {
        next[id] = action;
      } else {
        delete next[id];
      }
      return next;
    });
  };

  const handleCopyLink = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    if (!project.link) return;
    navigator.clipboard.writeText(normalizeUrl(project.link));
    setCopiedId(project.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Async wrappers for backend actions
  const handleToggleLiveClick = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProcessing(project.id, 'live');
    try {
      await onToggleLive(project);
    } finally {
      setProcessing(project.id, null);
    }
  };

  const handleStatusChangeClick = async (e: React.ChangeEvent<HTMLSelectElement>, project: Project) => {
    e.stopPropagation();
    const newStatus = e.target.value as ProjectStatus;
    setProcessing(project.id, 'status');
    try {
      await onStatusChange(project, newStatus);
    } finally {
      setProcessing(project.id, null);
    }
  };

  const handleDuplicateClick = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProcessing(project.id, 'duplicate');
    try {
      await onDuplicateProject(project);
    } finally {
      setProcessing(project.id, null);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-900">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-1">No matching projects</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
          No projects matched your filters or search terms.
        </p>
        <button
          type="button"
          onClick={onOpenNewProject}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-900 shadow-xs transition-all cursor-pointer"
        >
          <span>Add new project</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {projects.map((project, idx) => {
        const typeStyle = getTypeBadgeStyle(project.type);
        const statusStyle = getStatusBadgeStyle(project.status);
        const isCopied = copiedId === project.id;
        const hasLink = Boolean(project.link && project.link.trim());
        const fullUrl = hasLink ? normalizeUrl(project.link) : '#';

        // Check loading states for this specific card
        const currentTask = processingTasks[project.id];
        const isTogglingLive = currentTask === 'live';
        const isChangingStatus = currentTask === 'status';
        const isDuplicating = currentTask === 'duplicate';

        return (
          <div
            key={project.id}
            onClick={() => onSelectProject(project)}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-900 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
          >
            {/* Header: Index, Type and Live Badge */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                
                {/* Type Badge with sequence counter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFilterByType(project.type);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-xs font-medium border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${typeStyle.dot}`} />
                    <span>{project.type}</span>
                  </button>
                </div>

                {/* Live or Not Quick Toggle */}
                <button
                  type="button"
                  disabled={isTogglingLive}
                  onClick={(e) => handleToggleLiveClick(e, project)}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xl text-xs font-medium border transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    project.isLive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Click to toggle Live status"
                >
                  {isTogglingLive ? (
                    <Loader2 className="w-3 h-3 animate-spin text-slate-600" />
                  ) : (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        project.isLive ? 'bg-emerald-600 animate-pulse' : 'bg-slate-900/40'
                      }`}
                    />
                  )}
                  <span>{project.isLive ? 'LIVE' : 'OFFLINE'}</span>
                </button>
              </div>

              {/* Title & Description */}
              <h3 className="text-lg font-medium text-slate-900 group-hover:underline transition-colors line-clamp-1 mb-1">
                {project.name}
              </h3>
              <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px] mb-3 leading-relaxed">
                {project.description || 'No description provided.'}
              </p>

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {project.tags.map((tag, tIdx) => (
                    <span 
                      key={tIdx}
                      className="text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-xl"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Meta & Actions */}
            <div className="pt-2.5 border-t border-slate-200 space-y-2 text-xs">
              
              {/* Project Link */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 text-[11px] uppercase font-bold shrink-0">LINK:</span>
                {hasLink ? (
                  <div className="flex items-center gap-1 min-w-0">
                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-900 hover:underline truncate flex items-center gap-1"
                    >
                      <span className="truncate max-w-[150px]">{getDisplayUrl(project.link)}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 text-slate-500" />
                    </a>
                    <button
                      type="button"
                      onClick={(e) => handleCopyLink(e, project)}
                      className="p-1 text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-colors"
                      title="Copy link"
                    >
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-700" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">No link</span>
                )}
              </div>

              {/* Date & Status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-slate-600 text-[11px]">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{formatDeploymentDate(project.date)}</span>
                </div>

                <div className="relative inline-flex items-center">
                  {isChangingStatus && (
                    <Loader2 className="w-3 h-3 animate-spin text-slate-500 absolute left-1 pointer-events-none" />
                  )}
                  <select
                    aria-label="Update project status"
                    value={project.status}
                    disabled={isChangingStatus}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChangeClick(e, project)}
                    className={`appearance-none text-xs font-medium rounded-xl pr-5 py-0.5 border outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isChangingStatus ? 'pl-5' : 'pl-2'
                    } ${statusStyle.bg}`}
                  >
                    <option value="Completed" className="bg-white text-slate-900">Completed</option>
                    <option value="In progress" className="bg-white text-slate-900">In progress</option>
                    <option value="Inactive" className="bg-white text-slate-900">Inactive</option>
                  </select>
                  {!isChangingStatus && (
                    <ChevronDown className="w-3 h-3 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditProject(project);
                  }}
                  className="p-1 text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={isDuplicating}
                  onClick={(e) => handleDuplicateClick(e, project)}
                  className="p-1 text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Duplicate"
                >
                  {isDuplicating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CopyCheck className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(project);
                  }}
                  className="p-1 text-rose-700/60 hover:text-rose-800 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-300 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        );
      })}
    </div>
  );
};