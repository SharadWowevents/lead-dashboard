import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

export const SachinTalwarLogsTable = ({ logs, isLoading }: { logs: any[], isLoading: boolean }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const q = searchTerm.toLowerCase().trim();
    return logs.filter(l => 
      l.name?.toLowerCase().includes(q) || 
      l.email?.toLowerCase().includes(q) ||
      l.tier?.toLowerCase().includes(q)
    );
  }, [logs, searchTerm]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search Sachin Talwar logs by name, email, or tier..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <th className="py-3 px-4 w-16">S.No.</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Score (Yes / Total)</th>
              <th className="py-3 px-4">Percentage & Tier</th>
              <th className="py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
            {isLoading ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-500">Loading submission logs...</td></tr>
            ) : paginatedLogs.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-500">No logs found</td></tr>
            ) : (
              paginatedLogs.map((log, index) => {
                const seq = (currentPage - 1) * pageSize + index + 1;
                return (
                  <tr key={index} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500">{seq}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{log.name}</td>
                    <td className="py-3 px-4 text-slate-700">{log.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        log.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">{log.yesCount} / {log.yesTotal}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{log.percentage}%</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          log.tier === 'green' ? 'bg-emerald-100 text-emerald-800' : log.tier === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.tier}
                        </span>
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
    </div>
  );
};