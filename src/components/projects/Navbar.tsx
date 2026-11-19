import React, { useState } from 'react';
import { 
  FolderGit2, 
  Plus, 
  Tag, 
  Download, 
  RotateCcw,
  Menu,
  Loader2 // <-- Added for loading state
} from 'lucide-react';
import { ProjectStats } from '../../types/projects.ts';

interface NavbarProps {
  stats: ProjectStats;
  onOpenNewProject: () => void;
  onOpenManageTypes: () => void;
  onOpenImportExport: () => void;
  // Updated to support an async backend call for resetting the database
  onResetData: () => Promise<void> | void;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  onOpenNewProject,
  onOpenManageTypes,
  onOpenImportExport,
  onResetData,
  onToggleMobileMenu,
}) => {
  const [isResetting, setIsResetting] = useState(false);

  // Wrapper function to handle the async backend reset
  const handleResetClick = async () => {
    setIsResetting(true);
    try {
      await onResetData();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="bg-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pt-5">

          {/* Logo & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-xs">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight truncate">
                  Projects Directory
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {stats.total} {stats.total === 1 ? 'project' : 'projects'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                Manage project records, live deployment status and links for all your websites.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Manage Types Button */}
            <button
              id="manage-types-button"
              onClick={onOpenManageTypes}
              disabled={isResetting}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Manage Project Types"
            >
              <Tag className="w-3.5 h-3.5 text-slate-600" />
              Manage Types
            </button>

            {/* Import / Export */}
            <button
              id="import-export-button"
              onClick={onOpenImportExport}
              disabled={isResetting}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs rounded-xl transition-colors shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export as CSV / JSON or import a backup"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              Export / Import
            </button>

            {/* Reset to Sample Data */}
            <button
              id="reset-sample-button"
              onClick={handleResetClick}
              disabled={isResetting}
              type="button"
              className="inline-flex items-center p-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Load sample projects"
            >
              {isResetting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-900" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
            </button>

            {/* New Project Primary CTA */}
            <button
              id="new-project-button"
              onClick={onOpenNewProject}
              disabled={isResetting}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-black rounded-xl border border-slate-900 shadow-xs transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Project</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};