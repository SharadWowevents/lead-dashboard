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
  FileSpreadsheet,
  AlertCircle,
  Inbox,
  RefreshCw,
} from 'lucide-react';

interface DataTableProps {
  leads: LeadData[];
  isLoading: boolean;
  selectedSite: string | null;
  onDeleteLead?: (id: number) => Promise<void>;
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
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  // Clipboard copy helper with feedback
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(`${label}:${text}`);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  // Filtered and Sorted Leads calculation
  const filteredAndSortedLeads = useMemo(() => {
    let result = [...leads];

    // Filter by search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (lead) =>
          lead.name.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q) ||
          lead.mobile.toLowerCase().includes(q) ||
          lead.siteName.toLowerCase().includes(q) ||
          String(lead.id).includes(q)
      );
    }

    // Sort by key
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

      const strA = String(fieldA).toLowerCase();
      const strB = String(fieldB).toLowerCase();
      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [leads, searchTerm, sortConfig]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredAndSortedLeads.length / pageSize) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedLeads.slice(start, start + pageSize);
  }, [filteredAndSortedLeads, currentPage, pageSize]);

  // Adjust page if out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  // Handle CSV Download of currently displayed / filtered data
  const handleExportCsv = () => {
    exportLeadsToCsv(filteredAndSortedLeads, selectedSite);
  };

  // Formatting date
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

  // Generate consistent site badge color
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
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            id="table-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, email, phone, or project..."
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

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {onRefresh && (
            <button
              type="button"
              id="refresh-table-btn"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          )}

          {/* Export CSV Button */}
          <button
            type="button"
            id="download-csv-btn"
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
        <table id="leads-data-table" className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              {/* ID */}
              <th
                className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100 transition"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-1.5">
                  <span>ID</span>
                  {sortConfig.key === 'id' ? (
                    sortConfig.direction === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-slate-900" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-slate-900" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </th>

              {/* Source Project */}
              <th
                className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100 transition"
                onClick={() => handleSort('siteName')}
              >
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Source Project</span>
                  {sortConfig.key === 'siteName' ? (
                    sortConfig.direction === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-slate-900" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-slate-900" />
                    )
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
                    sortConfig.direction === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-slate-900" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-slate-900" />
                    )
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
                    sortConfig.direction === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-slate-900" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-slate-900" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </th>

              {/* Mobile */}
              <th
                className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100 transition"
                onClick={() => handleSort('mobile')}
              >
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mobile</span>
                  {sortConfig.key === 'mobile' ? (
                    sortConfig.direction === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-slate-900" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-slate-900" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </th>

              {/* Submitted At */}
              <th
                className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100 transition"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Submitted</span>
                  {sortConfig.key === 'createdAt' ? (
                    sortConfig.direction === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-slate-900" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-slate-900" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </th>

              {/* Action column */}
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
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="inline-flex items-center gap-2.5">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                    <span>Loading leads data...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-500">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">No leads found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchTerm
                        ? 'Try changing your search term or clearing filters.'
                        : 'External frontend projects can ingest leads via POST /api/ingest.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead) => {
                const formattedDate = formatDate(lead.createdAt);
                const isEmailCopied = copiedText === `email:${lead.email}`;
                const isPhoneCopied = copiedText === `phone:${lead.mobile}`;

                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50/75 transition-colors group"
                  >
                    {/* ID */}
                    <td className="py-3 px-4 font-mono text-slate-500 font-medium">
                      #{lead.id}
                    </td>

                    {/* Source Site */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getSiteBadgeStyle(
                          lead.siteName
                        )}`}
                      >
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
                          {isEmailCopied ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Mobile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 group/phone">
                        <span className="font-mono text-slate-700">{lead.mobile}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(lead.mobile, 'phone')}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                          title="Copy Mobile"
                        >
                          {isPhoneCopied ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

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
                            if (window.confirm(`Delete lead #${lead.id} (${lead.name})?`)) {
                              setDeletingId(lead.id);
                              await onDeleteLead(lead.id);
                              setDeletingId(null);
                            }
                          }}
                          disabled={deletingId === lead.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Delete Lead"
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

      {/* Pagination & Summary Footer */}
      <div className="p-3.5 sm:px-5 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-slate-900 font-semibold">{filteredAndSortedLeads.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{' '}
            <strong className="text-slate-900 font-semibold">
              {Math.min(currentPage * pageSize, filteredAndSortedLeads.length)}
            </strong>{' '}
            of <strong className="text-slate-900 font-semibold">{filteredAndSortedLeads.length}</strong> records
          </span>
          {searchTerm && (
            <span className="text-slate-400 font-normal">
              (filtered from {leads.length} total)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Rows per page selector */}
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
            </select>
          </div>

          {/* Page buttons */}
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
