import React, { useState } from 'react';
import { Layers, Filter, Search, Globe, LibraryBig } from 'lucide-react';

interface SidebarProps {
  sites: string[];
  selectedSite: string | null;
  onSelectSite: (site: string | null) => void;
  siteCounts: Record<string, number>;
  totalCount: number;
  onOpenIngestTester: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  activeView: 'leads' | 'prompts';
  onSetActiveView: (view: 'leads' | 'prompts') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sites,
  selectedSite,
  onSelectSite,
  siteCounts,
  totalCount,
  isMobileOpen,
  onCloseMobile,
  activeView,
  onSetActiveView,
}) => {
  const [siteSearch, setSiteSearch] = useState('');

  const filteredSites = sites.filter((s) =>
    s.toLowerCase().includes(siteSearch.toLowerCase())
  );

  const handleSelectProject = (site: string | null) => {
    onSetActiveView('leads');
    onSelectSite(site);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 bg-slate-900 text-slate-200">
      <div className="space-y-6">
        {/* Brand / Header */}
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">Lead Collector</h2>
            <p className="text-[11px] text-slate-400">Multi-project Admin</p>
          </div>
        </div>

        {/* Project Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-400 tracking-wider uppercase">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Projects
            </span>
            <span className="text-[11px] font-mono text-slate-400">{sites.length} sites</span>
          </div>

          {/* Search Sites Input */}
          {sites.length > 4 && (
            <div className="px-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={siteSearch}
                  onChange={(e) => setSiteSearch(e.target.value)}
                  placeholder="Filter projects..."
                  className="w-full pl-8 pr-2 py-1.5 bg-slate-800 border border-slate-700/60 rounded-lg text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            </div>
          )}

          <nav className="space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => handleSelectProject(null)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeView === 'leads' && selectedSite === null
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Globe className={`w-4 h-4 ${activeView === 'leads' && selectedSite === null ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">All Projects</span>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-medium ${
                  activeView === 'leads' && selectedSite === null
                    ? 'bg-indigo-800 text-white'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {totalCount}
              </span>
            </button>

            {filteredSites.map((site) => {
              const isSelected = activeView === 'leads' && selectedSite === site;
              const count = siteCounts[site] || 0;

              return (
                <button
                  key={site}
                  type="button"
                  onClick={() => handleSelectProject(isSelected ? null : site)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isSelected ? 'bg-white' : 'bg-slate-400'
                      }`}
                    />
                    <span className="truncate">{site}</span>
                  </div>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-medium ${
                      isSelected
                        ? 'bg-indigo-800 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Management Section */}
        <div className="space-y-2 pt-4 border-t border-slate-800">
           <div className="flex items-center px-2 text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">
            System Management
          </div>
          <button
            type="button"
            onClick={() => {
              onSetActiveView('prompts');
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeView === 'prompts'
                ? 'bg-amber-500/20 text-amber-400 shadow-sm font-semibold border border-amber-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
            }`}
          >
             <LibraryBig className={`w-4 h-4 ${activeView === 'prompts' ? 'text-amber-400' : 'text-slate-400'}`} />
             <span>Manage 101 Prompts</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 shadow-md">
        {sidebarContent}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};