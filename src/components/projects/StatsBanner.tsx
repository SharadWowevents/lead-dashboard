import React from 'react';
import { 
  FolderKanban, 
  Radio, 
  Clock, 
  Layers,
  Activity,
} from 'lucide-react';
import { ProjectStats } from '../../types/projects.ts';
import { getTypeBadgeStyle } from '../../utils/projectsHelpers.ts';

interface StatsBannerProps {
  stats: ProjectStats;
  selectedType: string;
  onSelectType: (type: string) => void;
  onSelectStatus: (status: 'Completed' | 'In progress' | 'Inactive' | 'ALL') => void;
  onSelectLive: (live: 'ALL' | 'LIVE' | 'OFFLINE') => void;
  isLoading?: boolean; // <-- Added to handle initial backend fetch delay
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  stats,
  selectedType,
  onSelectType,
  onSelectStatus,
  onSelectLive,
  isLoading = false, // <-- Default to false
}) => {
  const livePercentage = stats.total > 0 ? Math.round((stats.live / stats.total) * 100) : 0;

  return (
    <div className="space-y-3 mb-5">
      
      {/* Metric Cards Grid - High Density Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        
        {/* Card 1: Total Projects */}
        <div 
          onClick={() => {
            onSelectType('ALL');
            onSelectStatus('ALL');
            onSelectLive('ALL');
          }}
          className="bg-white rounded-xl shadow-xs p-3.5 sm:p-4 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Projects
            </span>
            <div className="w-6 h-6 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors border border-slate-200">
              <FolderKanban className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            {isLoading ? (
              <div className="h-8 w-12 bg-slate-100 animate-pulse rounded-xl" />
            ) : (
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {stats.total.toString().padStart(2, '0')}
              </span>
            )}
            <span className="text-[11px] text-slate-500 font-medium group-hover:text-slate-900">
              View all &rarr;
            </span>
          </div>
        </div>

        {/* Card 2: Live Deployments */}
        <div 
          onClick={() => onSelectLive('LIVE')}
          className="bg-white rounded-xl shadow-xs p-3.5 sm:p-4 border border-slate-200 hover:border-emerald-800 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Live Projects
            </span>
            <div className="w-6 h-6 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-800 group-hover:text-white transition-colors border border-emerald-200">
              <Radio className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              {isLoading ? (
                <div className="h-8 w-12 bg-emerald-900/10 animate-pulse rounded-xl" />
              ) : (
                <>
                  <span className="text-2xl sm:text-3xl font-bold text-emerald-700 tracking-tight">
                    {stats.live.toString().padStart(2, '0')}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xl text-[10px] font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                    {livePercentage}%
                  </span>
                </>
              )}
            </div>
            {isLoading ? (
              <div className="h-3 w-16 bg-slate-100 animate-pulse rounded-xl" />
            ) : (
              <span className="text-[11px] text-emerald-700 font-medium group-hover:underline">
                {stats.offline} OFFLINE
              </span>
            )}
          </div>
        </div>

        {/* Card 3: In Progress Projects */}
        <div 
          onClick={() => onSelectStatus('In progress')}
          className="bg-white rounded-xl shadow-xs p-3.5 sm:p-4 border border-slate-200 hover:border-amber-800 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              In Progress
            </span>
            <div className="w-6 h-6 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 group-hover:bg-amber-800 group-hover:text-white transition-colors border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            {isLoading ? (
              <div className="h-8 w-12 bg-amber-900/10 animate-pulse rounded-xl" />
            ) : (
              <span className="text-2xl sm:text-3xl font-bold text-amber-700 tracking-tight">
                {stats.inProgress.toString().padStart(2, '0')}
              </span>
            )}
            <span className="text-[11px] text-amber-700 font-medium group-hover:underline">
              Currently in progress
            </span>
          </div>
        </div>

        {/* Card 4: Active Projects */}
        <div 
          onClick={() => onSelectStatus('Completed')}
          className="bg-white rounded-xl shadow-xs p-3.5 sm:p-4 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Completed Projects
            </span>
            <div className="w-6 h-6 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700 group-hover:bg-indigo-900 group-hover:text-white transition-colors border border-indigo-200">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            {isLoading ? (
              <div className="h-8 w-12 bg-indigo-950/10 animate-pulse rounded-xl" />
            ) : (
              <span className="text-2xl sm:text-3xl font-bold text-indigo-700 tracking-tight">
                {stats.Completed.toString().padStart(2, '0')}
              </span>
            )}
            {isLoading ? (
              <div className="h-3 w-16 bg-slate-100 animate-pulse rounded-xl" />
            ) : (
              <span className="text-[11px] text-slate-500 font-medium">
                {stats.inactive} INACTIVE
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Category Type Distribution Quick-Bar */}
      {(!isLoading && Object.keys(stats.typeCounts).length > 0) && (
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-wrap items-center gap-1.5 animate-in fade-in duration-300">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mr-1">
            <Layers className="w-3.5 h-3.5" />
            Project Types:
          </span>

          <button
            type="button"
            onClick={() => onSelectType('ALL')}
            className={`px-2.5 py-1 rounded-xl text-xs transition-all cursor-pointer border ${
              selectedType === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                : 'bg-white text-slate-900 border-slate-200 hover:bg-white'
            }`}
          >
            All Types ({stats.total})
          </button>

          {Object.entries(stats.typeCounts).map(([typeName, count]) => {
            const isSelected = selectedType === typeName;
            const style = getTypeBadgeStyle(typeName);

            return (
              <button
                key={typeName}
                type="button"
                onClick={() => onSelectType(typeName)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                    : `${style.bg} ${style.text} ${style.border} hover:bg-white`
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : style.dot}`} />
                <span>{typeName}</span>
                <span className="text-[10px] font-semibold opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Loading state for Quick-bar */}
      {isLoading && (
        <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs flex flex-wrap items-center gap-2">
          <div className="h-4 w-16 bg-slate-100 animate-pulse rounded-xl" />
          <div className="h-6 w-24 bg-slate-100 animate-pulse rounded-xl" />
          <div className="h-6 w-20 bg-slate-100 animate-pulse rounded-xl" />
          <div className="h-6 w-24 bg-slate-100 animate-pulse rounded-xl" />
        </div>
      )}

    </div>
  );
};