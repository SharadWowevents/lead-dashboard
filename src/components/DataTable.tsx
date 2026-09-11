import React, { useState, useMemo } from 'react';
import { LeadData, SortConfig, SortKey } from '../types/index.ts';
import { exportLeadsToCsv } from '../utils/exportCsv.ts';
import {
  Download,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Trash2,
  Calendar,
  Mail,
  Phone,
  Tag,
  Inbox,
  RefreshCw,
  X,
} from 'lucide-react';

interface ExtendedLeadData extends LeadData {
  [key: string]: any;
}

interface DataTableProps {
  leads: ExtendedLeadData[];
  isLoading: boolean;
  selectedSite: string | null;
  onDeleteLead?: (id: string | number) => Promise<void>;
  onRefresh?: () => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  leads,
  isLoading,
  selectedSite,
  onDeleteLead,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  
  // Date Range State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Get today's local date formatted as YYYY-MM-DD to use as the max allowed date
  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Dynamic Column Detection: Only display Mobile if data exists in this table
  const hasMobile = useMemo(() => {
    return leads.some(
      (lead) => lead.mobile && lead.mobile !== 'N/A' && lead.mobile.trim() !== ''
    );
  }, [leads]);

  const colSpanCount = 4 + (onDeleteLead ? 1 : 0) + (hasMobile ? 1 : 0);

  // Sorting handler
  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  // Clipboard copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(`${label}:${text}`);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  // Filter and sort
  const filteredAndSortedLeads = useMemo(() => {
    let result = [...leads];

    // 1. Search Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (lead) =>
          lead.name?.toLowerCase().includes(q) ||
          lead.email?.toLowerCase().includes(q) ||
          (lead.mobile && lead.mobile.toLowerCase().includes(q)) ||
          lead.siteName?.toLowerCase().includes(q)
      );
    }

    // 2. Date Range Filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(lead => new Date(lead.createdAt).getTime() >= start.getTime());
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(lead => new Date(lead.createdAt).getTime() <= end.getTime());
    }

    // 3. Sorting
    result.sort((a, b) => {
      const fieldA = a[sortConfig.key];
      const fieldB = b[sortConfig.key];

      if (sortConfig.key === 'createdAt') {
        const timeA = new Date(fieldA).getTime();
        const timeB = new Date(fieldB).getTime();
        return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
      }

      if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        return sortConfig.direction === 'asc' ? fieldA - fieldB : fieldB - fieldA;
      }

      const strA = String(fieldA || '').toLowerCase();
      const strB = String(fieldB || '').toLowerCase();
      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [leads, searchTerm, startDate, endDate, sortConfig]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredAndSortedLeads.length / pageSize) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedLeads.slice(start, start + pageSize);
  }, [filteredAndSortedLeads, currentPage, pageSize]);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const handleExportCsv = () => {
    exportLeadsToCsv(filteredAndSortedLeads, selectedSite);
  };

  const formatDate = (isoString: string): { date: string; time: string } => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return { date: isoString, time: '' };
      return {
        date: d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        time: d.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    } catch {
      return { date: isoString, time: '' };
    }
  };

  const getSiteBadgeStyle = (site: string) => {
    const palettes = [
      'bg-blue-50 text-blue-700 border-blue-200',
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'bg-purple-50 text-purple-700 border-purple-200',
      'bg-amber-50 text-amber-800 border-amber-200',
      'bg-rose-50 text-rose-700 border-rose-200',
      'bg-cyan-50 text-cyan-700 border-cyan-200',
    ];
    let hash = 0;
    for (let i = 0; i < site.length; i++) {
      hash = site.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % palettes.length;
    return palettes[index];
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search within this project..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
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
              max={todayStr} // <--- ADDED HERE
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
              title="Start Date"
            />
            <span className="text-slate-400 text-xs font-medium">to</span>
            <input
              type="date"
              value={endDate}
              max={todayStr} // <--- ADDED HERE
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
              title="End Date"
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

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer shadow-xs"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredAndSortedLeads.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono">
              {filteredAndSortedLeads.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              {/* Sequence Number */}
              <th className="py-3 px-4 select-none w-16">
                <span>S.No.</span>
              </th>

              {/* Source Project */}
              <th
                className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100 transition"
                onClick={() => handleSort('siteName')}
              >
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Project</span>
                  {sortConfig.key === 'siteName' ? (
                    sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-slate-900" /> : <ArrowDown className="w-3.5 h-3.5 text-slate-900" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </th>

              {/* Name */}
              <th
                className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100 transition"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Full Name</span>
                  {sortConfig.key === 'name' ? (
                    sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-slate-900" /> : <ArrowDown className="w-3.5 h-3.5 text-slate-900" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </th>

              {/* Email */}
              <th
                className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100 transition"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email</span>
                  {sortConfig.key === 'email' ? (
                    sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-slate-900" /> : <ArrowDown className="w-3.5 h-3.5 text-slate-900" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </th>

              {/* Conditional Mobile Column */}
              {hasMobile && (
                <th
                  className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100 transition"
                  onClick={() => handleSort('mobile')}
                >
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Mobile</span>
                    {sortConfig.key === 'mobile' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-slate-900" /> : <ArrowDown className="w-3.5 h-3.5 text-slate-900" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </th>
              )}

              {/* Submitted At */}
              <th
                className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100 transition"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Submitted</span>
                  {sortConfig.key === 'createdAt' ? (
                    sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-slate-900" /> : <ArrowDown className="w-3.5 h-3.5 text-slate-900" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </th>

              {onDeleteLead && (
                <th className="py-3 px-4 text-right">
                  <span>Action</span>
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={colSpanCount} className="py-12 text-center text-slate-500">
                  <div className="inline-flex items-center gap-2.5">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                    <span>Loading leads data...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan={colSpanCount} className="py-12 text-center text-slate-500">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">No records found</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead, index) => {
                const formattedDate = formatDate(lead.createdAt);
                const isEmailCopied = copiedText === `email:${lead.email}`;
                const isPhoneCopied = copiedText === `phone:${lead.mobile}`;
                
                // Continuous sequence number calculated per page
                const sequenceNumber = (currentPage - 1) * pageSize + index + 1;

                return (
                  <tr key={lead.id} className="hover:bg-slate-50/75 transition-colors group">
                    {/* Sequence Number */}
                    <td className="py-3 px-4 font-mono text-slate-500 font-medium">
                      {sequenceNumber}
                    </td>

                    {/* Source Site */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getSiteBadgeStyle(lead.siteName)}`}>
                        {lead.siteName}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {lead.name}
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 group/copy">
                        <span className="text-slate-700">{lead.email}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(lead.email, 'email')}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                          title="Copy Email"
                        >
                          {isEmailCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    {/* Mobile */}
                    {hasMobile && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 group/phone">
                          <span className="font-mono text-slate-700">{lead.mobile || '-'}</span>
                          {lead.mobile && lead.mobile !== 'N/A' && (
                            <button
                              type="button"
                              onClick={() => handleCopy(lead.mobile!, 'phone')}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                              title="Copy Mobile"
                            >
                              {isPhoneCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-600">
                      <div>{formattedDate.date}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formattedDate.time}
                      </div>
                    </td>

                    {/* Action */}
                    {onDeleteLead && (
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Delete record for ${lead.name}?`)) {
                              setDeletingId(lead.id);
                              await onDeleteLead(lead.id);
                              setDeletingId(null);
                            }
                          }}
                          disabled={deletingId === lead.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
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
          Showing <strong className="text-slate-900 font-semibold">{filteredAndSortedLeads.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{' '}
          <strong className="text-slate-900 font-semibold">
            {Math.min(currentPage * pageSize, filteredAndSortedLeads.length)}
          </strong>{' '}
          of <strong className="text-slate-900 font-semibold">{filteredAndSortedLeads.length}</strong> records
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer font-medium"
            >
              Prev
            </button>
            <span className="px-2 font-mono text-slate-600">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};