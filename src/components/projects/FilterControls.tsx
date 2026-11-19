import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  LayoutList, 
  LayoutGrid, 
  ArrowUpDown,
  Loader2 // <-- Added for loading state
} from 'lucide-react';
import { FilterState, ProjectStatus, ProjectTypeItem, SortField, SortOrder } from '../../types/projects.ts';

interface FilterControlsProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  availableTypes: ProjectTypeItem[];
  totalResults: number;
  totalProjects: number;
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  isLoading?: boolean; // <-- Added to handle backend network latency
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableTypes,
  totalResults,
  totalProjects,
  viewMode,
  onViewModeChange,
  isLoading = false, // <-- Default to false
}) => {
  // Local state for debouncing the search input to prevent backend API spam
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Sync external filter resets (like clicking the "Reset" button) back to local state
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  // Trigger the actual filter change 300ms after the user stops typing
  useEffect(() => {
    const handler = setTimeout(() => {
      if (filters.search !== localSearch) {
        onFilterChange({ search: localSearch });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, filters.search, onFilterChange]);

  const isFiltered = 
    filters.search !== '' ||
    filters.type !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.isLive !== 'ALL';

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs mb-4 space-y-2.5">
      
      {/* Top row: Search + View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        
        {/* Search input (Debounced) */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            id="search-projects-input"
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search projects by name, type, URL or tag..."
            className="w-full pl-8.5 pr-8 py-1.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 transition-all outline-none"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onFilterChange({ search: '' });
              }}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Toggle & Result Count */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          
          {/* Loading State or Matches Count */}
          <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-900" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                Showing <span className="font-bold text-slate-900">{totalResults.toString().padStart(2, '0')}</span> / {totalProjects.toString().padStart(2, '0')}
              </>
            )}
          </div>

          <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
            <button
              id="view-table-btn"
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table View (Dense column layout)"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              id="view-grid-btn"
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grid View (Visual Cards)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Filter Row: Type, Status, Live, Sort, and Reset */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 text-xs">
        
        {/* Type Filter Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase text-slate-500">Type:</span>
          <select
            id="filter-type-select"
            value={filters.type}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            disabled={isLoading}
            className="bg-white border border-slate-200 hover:border-slate-900 rounded-xl px-2 py-1 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none cursor-pointer disabled:opacity-50"
          >
            <option value="ALL">All Types</option>
            {availableTypes.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase text-slate-500">Status:</span>
          <select
            id="filter-status-select"
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value as ProjectStatus | 'ALL' })}
            disabled={isLoading}
            className="bg-white border border-slate-200 hover:border-slate-900 rounded-xl px-2 py-1 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none cursor-pointer disabled:opacity-50"
          >
            <option value="ALL">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="In progress">In Progress</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Live Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase text-slate-500">Deployment:</span>
          <select
            id="filter-live-select"
            value={filters.isLive}
            onChange={(e) => onFilterChange({ isLive: e.target.value as 'ALL' | 'LIVE' | 'OFFLINE' })}
            disabled={isLoading}
            className="bg-white border border-slate-200 hover:border-slate-900 rounded-xl px-2 py-1 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none cursor-pointer disabled:opacity-50"
          >
            <option value="ALL">All</option>
            <option value="LIVE">Live only</option>
            <option value="OFFLINE">Offline only</option>
          </select>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5 ml-auto">
          <ArrowUpDown className="w-3 h-3 text-slate-500" />
          <span className="text-[11px] font-bold uppercase text-slate-500">Sort:</span>
          <select
            id="sort-select"
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-') as [SortField, SortOrder];
              onFilterChange({ sortBy, sortOrder });
            }}
            disabled={isLoading}
            className="bg-white border border-slate-200 hover:border-slate-900 rounded-xl px-2 py-1 text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none cursor-pointer disabled:opacity-50"
          >
            <option value="date-desc">Date (newest first)</option>
            <option value="date-asc">Date (oldest first)</option>
            <option value="name-asc">Name (A to Z)</option>
            <option value="name-desc">Name (Z to A)</option>
            <option value="status-asc">Status</option>
            <option value="type-asc">Type</option>
            <option value="isLive-desc">Live status</option>
          </select>
        </div>

        {/* Clear filters button */}
        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilters}
            disabled={isLoading}
            className="inline-flex items-center gap-1 text-slate-900 hover:underline font-bold px-2 py-1 rounded-xl bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-3 h-3" />
            Reset
          </button>
        )}

      </div>

    </div>
  );
};