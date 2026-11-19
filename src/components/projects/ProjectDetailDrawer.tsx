import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Calendar, 
  Edit3, 
  Trash2, 
  Radio, 
  CopyCheck,
  Loader2 // <-- Added for loading states
} from 'lucide-react';
import { Project } from '../../types/projects.ts';
import { 
  getTypeBadgeStyle, 
  getStatusBadgeStyle, 
  normalizeUrl, 
  formatDeploymentDate, 
  getRelativeTime 
} from '../../utils/projectsHelpers.ts';

interface ProjectDetailDrawerProps {
  project: Project | null;
  onClose: () => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  // Updated to support async operations for backend API calls
  onToggleLive: (project: Project) => Promise<void> | void;
  onDuplicate: (project: Project) => Promise<void> | void;
}

export const ProjectDetailDrawer: React.FC<ProjectDetailDrawerProps> = ({
  project,
  onClose,
  onEdit,
  onDelete,
  onToggleLive,
  onDuplicate,
}) => {
  const [copied, setCopied] = useState(false);
  
  // Backend request states
  const [isTogglingLive, setIsTogglingLive] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  if (!project) return null;

  const typeStyle = getTypeBadgeStyle(project.type);
  const statusStyle = getStatusBadgeStyle(project.status);
  const hasLink = Boolean(project.link && project.link.trim());
  const fullUrl = hasLink ? normalizeUrl(project.link) : '#';

  const handleCopyLink = () => {
    if (!project.link) return;
    navigator.clipboard.writeText(normalizeUrl(project.link));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Wrapper for toggling live status with backend latency
  const handleToggleLive = async () => {
    setIsTogglingLive(true);
    try {
      await onToggleLive(project);
    } finally {
      setIsTogglingLive(false);
    }
  };

  // Wrapper for duplicating project with backend latency
  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      await onDuplicate(project);
      onClose(); // Close drawer after successful duplication
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-200 animate-in slide-in-from-right border-l border-slate-900"
        role="dialog"
      >
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-white">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xl text-xs font-medium border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${typeStyle.dot}`} />
                {project.type}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xl text-xs font-medium border ${statusStyle.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                {project.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 break-words">
              {project.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          {/* Live Deployment Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center border border-slate-200 ${
                project.isLive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500'
              }`}>
                <Radio className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Live Status
                </span>
                <span className="text-xs font-semibold text-slate-900">
                  {project.isLive ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleLive}
              disabled={isTogglingLive}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed ${
                project.isLive 
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isTogglingLive && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {project.isLive ? 'Mark as Offline' : 'Go Live'}
            </button>
          </div>

          {/* Project Link Section */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Project URL
            </span>
            {hasLink ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-900 truncate select-all">
                    {fullUrl}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                      title="Copy URL"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Open URL in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
                >
                  <span>Open Project</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 italic">
                No URL added for this project
              </div>
            )}
          </div>

          {/* Date of Deployment */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Deployment Date
            </span>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-900">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDeploymentDate(project.date)}</span>
              </div>
              {getRelativeTime(project.date) && (
                <span className="text-[10px] text-slate-500">
                  {getRelativeTime(project.date)}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Description
              </span>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 font-sans">
                {project.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Tags
              </span>
              <div className="flex flex-wrap gap-1">
                {project.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-xl"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {project.notes && (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Internal Notes
              </span>
              <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/70 p-3 rounded-xl border border-amber-300 font-sans">
                {project.notes}
              </p>
            </div>
          )}

        </div>

        {/* Drawer Actions Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onEdit(project);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDuplicating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CopyCheck className="w-3 h-3" />
              )}
              <span>Copy</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onDelete(project);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete</span>
          </button>
        </div>

      </div>
    </div>
  );
};