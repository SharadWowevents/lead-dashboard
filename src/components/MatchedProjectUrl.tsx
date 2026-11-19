import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Globe } from 'lucide-react';
import { Project } from '../types/projects.ts';
import { getDisplayUrl, normalizeUrl } from '../utils/projectsHelpers.ts';

/**
 * Shows a Projects Directory entry's URL (matched by name to a sidebar site)
 * on the right side of a project page heading, with copy + redirect actions.
 */
export const MatchedProjectUrl: React.FC<{ project: Project }> = ({ project }) => {
  const [copied, setCopied] = useState(false);
  if (!project.link?.trim()) return null;

  const fullUrl = normalizeUrl(project.link);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
    } catch {
      // Clipboard API unavailable (e.g. non-secure context) — still show feedback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="inline-flex items-center gap-1 max-w-full px-2 py-1 rounded-lg bg-white border border-slate-300 shadow-xs"
      title={`Live URL for ${project.name} (from Projects Directory)`}
    >
      <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${project.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-mono font-medium text-slate-800 hover:text-indigo-700 hover:underline truncate max-w-[180px] sm:max-w-[260px]"
        title={fullUrl}
      >
        {getDisplayUrl(project.link)}
      </a>
      {/* Redirect / open URL */}
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1 rounded-md text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition shrink-0"
        title={`Open ${fullUrl} in a new tab`}
        aria-label={`Open ${project.name} URL in a new tab`}
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
      {/* Copy URL */}
      <button
        type="button"
        onClick={handleCopy}
        className="p-1 rounded-md text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition shrink-0 cursor-pointer"
        title="Copy URL"
        aria-label={`Copy ${project.name} URL`}
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      {copied && <span className="text-[10px] font-semibold text-emerald-700 pr-1">Copied</span>}
    </div>
  );
};
