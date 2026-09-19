import React, { useState, useMemo } from 'react';
import { 
  Search, Download, X, ArrowUpDown, ArrowUp, ArrowDown, 
  Calendar, Mail, User, Phone, Inbox, Copy, Check, MessageSquare, AlignLeft 
} from 'lucide-react';

export const PromptLogsTable = ({ logs, isLoading }: { logs: any[], isLoading: boolean }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc',
  });

  const todayStr = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }, []);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(`${label}:${text}`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const filteredAndSortedLogs = useMemo(() => {
    let result = [...logs];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(l => 
        l.userName?.toLowerCase().includes(q) || 
        l.userEmail?.toLowerCase().includes(q) ||
        l.userMobile?.toLowerCase().includes(q) ||
        l.promptTitle?.toLowerCase().includes(q) ||
        l.finalFilledPrompt?.toLowerCase().includes(q)
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(l => new Date(l.createdAt).getTime() >= start.getTime());
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(l => new Date(l.createdAt).getTime() <= end.getTime());
    }

    result.sort((a, b) => {
      if (sortConfig.key === 'createdAt') {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
      }
      const strA = String(a[sortConfig.key] || '').toLowerCase();
      const strB = String(b[sortConfig.key] || '').toLowerCase();
      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [logs, searchTerm, startDate, endDate, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedLogs.slice(start, start + pageSize);
  }, [filteredAndSortedLogs, currentPage, pageSize]);

  if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);

  const handleExportCsv = () => {
    if (filteredAndSortedLogs.length === 0) return;
    const headers = ['S.No.', 'Full Name', 'Email', 'Phone', 'Prompt Title', 'Generated Prompt', 'Date'];
    const csvRows = [headers.join(',')];
    
    filteredAndSortedLogs.forEach((l, index) => {
      csvRows.push([
        index + 1,
        `"${(l.userName || '').replace(/"/g, '""')}"`,
        `"${(l.userEmail || '').replace(/"/g, '""')}"`,
        `"${(l.userMobile || '').replace(/"/g, '""')}"`,
        `"${(l.promptTitle || '').replace(/"/g, '""')}"`,
        `"${(l.finalFilledPrompt || '').replace(/"/g, '""')}"`,
        `"${new Date(l.createdAt).toLocaleString().replace(/"/g, '""')}"`
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prompt-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search logs by name, email, or prompt content..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600">Clear</button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <input type="date" value={startDate} max={todayStr} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer" />
            <span className="text-slate-400 text-xs font-medium">to</span>
            <input type="date" value={endDate} max={todayStr} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer" />
            {(startDate || endDate) && (
              <button type="button" onClick={() => { setStartDate(''); setEndDate(''); setCurrentPage(1); }} className="ml-1 p-0.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button type="button" onClick={handleExportCsv} disabled={filteredAndSortedLogs.length === 0} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition cursor-pointer disabled:opacity-50 shadow-xs">
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono">{filteredAndSortedLogs.length}</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <th className="py-3 px-4 w-16">S.No.</th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none" onClick={() => handleSort('userName')}>
                <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /><span>Name</span></div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none" onClick={() => handleSort('userEmail')}>
                <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /><span>Email</span></div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none" onClick={() => handleSort('promptTitle')}>
                <div className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-slate-400" /><span>Prompt Used</span></div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none" onClick={() => handleSort('finalFilledPrompt')}>
                <div className="flex items-center gap-1.5"><AlignLeft className="w-3.5 h-3.5 text-slate-400" /><span>Final Output</span></div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none" onClick={() => handleSort('createdAt')}>
                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /><span>Date</span></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
            {isLoading ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500">Loading prompt logs...</td></tr>
            ) : paginatedLogs.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500"><Inbox className="w-6 h-6 mx-auto mb-2 text-slate-300" />No logs found</td></tr>
            ) : (
              paginatedLogs.map((log, index) => {
                const sequenceNumber = (currentPage - 1) * pageSize + index + 1;
                return (
                  <tr key={log.id} className="hover:bg-slate-50/75 transition-colors group">
                    <td className="py-3 px-4 font-mono text-slate-500">{sequenceNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{log.userName}</td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5 group/copy">
                        <span>{log.userEmail}</span>
                        <button onClick={() => handleCopy(log.userEmail, `email-${log.id}`)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded transition"><Copy className="w-3 h-3" /></button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium text-[11px] whitespace-nowrap">{log.promptTitle}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="flex items-center gap-2 group/prompt">
                        <div className="max-w-[200px] truncate text-[11px] text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                          {log.finalFilledPrompt}
                        </div>
                        <button onClick={() => handleCopy(log.finalFilledPrompt, `prompt-${log.id}`)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition" title="Copy full prompt">
                          {copiedText === `prompt-${log.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{new Date(log.createdAt).toLocaleTimeString()}</div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer Pagination */}
      <div className="p-3.5 sm:px-5 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div>Showing <strong className="text-slate-900">{filteredAndSortedLogs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to <strong className="text-slate-900">{Math.min(currentPage * pageSize, filteredAndSortedLogs.length)}</strong> of <strong className="text-slate-900">{filteredAndSortedLogs.length}</strong> records</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>Rows:</span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40">Prev</button>
            <span className="px-2 font-mono">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};