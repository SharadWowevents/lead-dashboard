import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  X, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Calendar, 
  Mail, 
  User, 
  Award,
  Inbox
} from 'lucide-react';

// Fallback pillars to calculate the score perfectly out of 850
const PILLARS = [
  { id: 'biz', weight: 170, kpis: [1, 2, 3, 4, 5] },
  { id: 'ppl', weight: 170, kpis: [1, 2, 3, 4, 5] },
  { id: 'cli', weight: 170, kpis: [1, 2, 3, 4, 5] },
  { id: 'ven', weight: 170, kpis: [1, 2, 3, 4, 5] },
  { id: 'gov', weight: 170, kpis: [1, 2, 3, 4, 5] },
];

const getRating = (t: number) => {
  if (t >= 750) return { label: 'Excellent', color: '#22C55E' };
  if (t >= 600) return { label: 'Strong', color: '#3B82F6' };
  if (t >= 450) return { label: 'Average', color: '#F97316' };
  if (t >= 300) return { label: 'Needs Work', color: '#EF4444' };
  if (t > 0) return { label: 'Critical', color: '#9B1C1C' };
  return { label: 'No Score', color: '#94a3b8' };
};

const calculateRecordTotal = (recordScores: any) => {
  if (!recordScores) return 0;
  return PILLARS.reduce((sum, p) => {
    const raw = p.kpis.reduce((s, _, i) => s + (recordScores[`${p.id}_${i}`] || 0), 0);
    const max = p.kpis.length * 5;
    const weighted = max ? Math.round((raw / max) * p.weight) : 0;
    return sum + weighted;
  }, 0);
};

export const AnalysisTable = ({ analyses, isLoading }: { analyses: any[], isLoading: boolean }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc',
  });

  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Filter & Sort Logic
  const filteredAndSortedAnalyses = useMemo(() => {
    let result = [...analyses];

    // 1. Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(a => 
        a.name.toLowerCase().includes(q) || 
        a.email.toLowerCase().includes(q) ||
        a.analysisName.toLowerCase().includes(q)
      );
    }

    // 2. Date Filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(a => new Date(a.createdAt).getTime() >= start.getTime());
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(a => new Date(a.createdAt).getTime() <= end.getTime());
    }

    // 3. Sort
    result.sort((a, b) => {
      if (sortConfig.key === 'createdAt') {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
      }
      
      if (sortConfig.key === 'score') {
        const scoreA = calculateRecordTotal(a.scores);
        const scoreB = calculateRecordTotal(b.scores);
        return sortConfig.direction === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      }

      const strA = String(a[sortConfig.key] || '').toLowerCase();
      const strB = String(b[sortConfig.key] || '').toLowerCase();
      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [analyses, searchTerm, startDate, endDate, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedAnalyses.length / pageSize) || 1;
  const paginatedAnalyses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedAnalyses.slice(start, start + pageSize);
  }, [filteredAndSortedAnalyses, currentPage, pageSize]);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  // Self-contained CSV Export
  const handleExportCsv = () => {
    if (filteredAndSortedAnalyses.length === 0) return;
    
    const headers = ['S.No.', 'Full Name', 'Email', 'Total Score', 'Rating', 'Analysis Date'];
    const csvRows = [headers.join(',')];
    
    filteredAndSortedAnalyses.forEach((a, index) => {
      const total = calculateRecordTotal(a.scores);
      const rating = getRating(total).label;
      const values = [
        index + 1,
        `"${a.name.replace(/"/g, '""')}"`,
        `"${a.email.replace(/"/g, '""')}"`,
        total,
        `"${rating}"`,
        `"${a.analysisName.replace(/"/g, '""')}"`
      ];
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bo-score-analyses-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search analyses by name or email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600">
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
          {/* Date Range Pickers */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <input
              type="date"
              value={startDate}
              max={todayStr}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
            />
            <span className="text-slate-400 text-xs font-medium">to</span>
            <input
              type="date"
              value={endDate}
              max={todayStr}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => { setStartDate(''); setEndDate(''); setCurrentPage(1); }}
                className="ml-1 p-0.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                title="Clear Dates"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredAndSortedAnalyses.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono">
              {filteredAndSortedAnalyses.length}
            </span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <th className="py-3 px-4 w-16">S.No.</th>
              
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Name</span>
                  {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>) : <ArrowUpDown className="w-3 h-3 text-slate-400"/>}
                </div>
              </th>

              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none" onClick={() => handleSort('email')}>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email</span>
                  {sortConfig.key === 'email' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>) : <ArrowUpDown className="w-3 h-3 text-slate-400"/>}
                </div>
              </th>

              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none" onClick={() => handleSort('score')}>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  <span>Total Score</span>
                  {sortConfig.key === 'score' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>) : <ArrowUpDown className="w-3 h-3 text-slate-400"/>}
                </div>
              </th>

              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none" onClick={() => handleSort('createdAt')}>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Analysis Date</span>
                  {sortConfig.key === 'createdAt' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>) : <ArrowUpDown className="w-3 h-3 text-slate-400"/>}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="inline-flex items-center gap-2.5">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                    <span>Loading analysis data...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedAnalyses.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">No analyses found</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedAnalyses.map((analysis, index) => {
                const total = calculateRecordTotal(analysis.scores);
                const rating = getRating(total);
                const sequenceNumber = (currentPage - 1) * pageSize + index + 1;

                return (
                  <tr key={analysis.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500">{sequenceNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{analysis.name}</td>
                    <td className="py-3 px-4 text-slate-700">{analysis.email}</td>
                    <td className="py-3 px-4">
                      <span 
                        className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-sm inline-flex items-center gap-1.5"
                        style={{ backgroundColor: rating.color }}
                      >
                        {total} - {rating.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{analysis.analysisName}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 sm:px-5 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          Showing <strong className="text-slate-900 font-semibold">{filteredAndSortedAnalyses.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{' '}
          <strong className="text-slate-900 font-semibold">
            {Math.min(currentPage * pageSize, filteredAndSortedAnalyses.length)}
          </strong>{' '}
          of <strong className="text-slate-900 font-semibold">{filteredAndSortedAnalyses.length}</strong> records
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer font-medium"
            >
              Prev
            </button>
            <span className="px-2 font-mono text-slate-600">{currentPage} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};