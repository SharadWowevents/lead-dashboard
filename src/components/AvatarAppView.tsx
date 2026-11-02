import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, Search, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

type AvatarRecord = Record<string, unknown> & { id: string };
type AvatarUser = {
  id: string;
  name?: string;
  email?: string;
  mobile?: string;
  createdAt?: string;
};
type Collection = 'avatars' | 'users';

const avatarColumns = [
  { key: 'title', label: 'Title' },
  { key: 'user', label: 'User' },
  { key: 'inputs.intro', label: 'Intro' },
  { key: 'inputs.icp', label: 'ICP' },
  { key: 'inputs.life', label: 'Life' },
  { key: 'inputs.yacht', label: 'Yacht' },
  { key: 'inputs.both', label: 'Both' },
  { key: 'output.bridge.headline', label: 'Bridge Headline' },
  { key: 'isExample', label: 'Example' },
  { key: 'createdAt', label: 'Created' },
];

const userColumns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'createdAt', label: 'Created' },
];

function getValue(record: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object') {
      return (value as Record<string, unknown>)[key];
    }
    return undefined;
  }, record);
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatDate(value: unknown): string {
  if (typeof value !== 'string' && !(value instanceof Date)) return formatValue(value);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

interface AvatarAppViewProps {
  onAvatarCountChange: (count: number) => void;
}

export const AvatarAppView: React.FC<AvatarAppViewProps> = ({ onAvatarCountChange }) => {
  const { token, logout } = useAuth();
  const [avatars, setAvatars] = useState<AvatarRecord[]>([]);
  const [users, setUsers] = useState<AvatarUser[]>([]);
  const [activeCollection, setActiveCollection] = useState<Collection>('avatars');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/avatar-app', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load Avatar App data');
      }

      const avatarRecords = Array.isArray(result.data?.avatars) ? result.data.avatars : [];
      setAvatars(avatarRecords);
      setUsers(Array.isArray(result.data?.users) ? result.data.users : []);
      onAvatarCountChange(avatarRecords.length);
    } catch (fetchError) {
      console.error('Fetch Avatar App data error:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to load Avatar App data');
    } finally {
      setIsLoading(false);
    }
  }, [token, logout, onAvatarCountChange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rows = activeCollection === 'avatars' ? avatars : users;
  const columns = activeCollection === 'avatars' ? avatarColumns : userColumns;
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const query = search.trim().toLowerCase();
    return rows.filter(row => JSON.stringify(row).toLowerCase().includes(query));
  }, [rows, search]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const selectCollection = (collection: Collection) => {
    setActiveCollection(collection);
    setCurrentPage(1);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Avatar App</h2>
          <p className="text-sm text-slate-500">Data from the avatar-app database</p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <Users className="h-5 w-5 text-indigo-600" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avatars</p>
            <p className="text-lg font-bold text-slate-900">{avatars.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <Users className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Users</p>
            <p className="text-lg font-bold text-slate-900">{users.length}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {(['avatars', 'users'] as const).map(collection => (
              <button
                type="button"
                key={collection}
                onClick={() => selectCollection(collection)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${
                  activeCollection === collection
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {collection}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={event => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder={`Search ${activeCollection}...`}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                {columns.map(column => (
                  <th key={column.key} className="px-4 py-3 font-bold">{column.label}</th>
                ))}
                {activeCollection === 'avatars' && <th className="px-4 py-3 font-bold">Schema Data</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + (activeCollection === 'avatars' ? 1 : 0)} className="px-4 py-12 text-center text-slate-500">
                    Loading Avatar App data...
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (activeCollection === 'avatars' ? 1 : 0)} className="px-4 py-12 text-center text-slate-500">
                    No records found.
                  </td>
                </tr>
              ) : (
                pageRows.map(row => (
                  <tr key={row.id} className="align-top hover:bg-slate-50">
                    {columns.map(column => {
                      const value = getValue(row, column.key);
                      return (
                        <td key={column.key} className="max-w-xs px-4 py-3 text-slate-700">
                          {column.key === 'createdAt' ? formatDate(value) : formatValue(value)}
                        </td>
                      );
                    })}
                    {activeCollection === 'avatars' && (
                      <td className="px-4 py-3">
                        <details>
                          <summary className="cursor-pointer font-semibold text-indigo-700">View fields</summary>
                          <pre className="mt-2 max-h-72 max-w-xl overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-[10px] text-slate-700">
                            {JSON.stringify(row, null, 2)}
                          </pre>
                        </details>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-600">
          <span>
            Showing {filteredRows.length ? (currentPage - 1) * pageSize + 1 : 0}
            {' '}to {Math.min(currentPage * pageSize, filteredRows.length)}
            {' '}of {filteredRows.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>{currentPage} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
