import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Eye,
  Inbox,
  Mail,
  Phone,
  RefreshCw,
  Search,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { AvatarDossierModal } from './AvatarDossierModal.tsx';

type AvatarUser = {
  id: string;
  name?: string;
  email?: string;
  mobile?: string;
  createdAt?: string;
};

type AvatarRecord = Record<string, unknown> & {
  id: string;
  title?: string;
  user?: string;
  userName?: string;
  userEmail?: string;
  userMobile?: string;
  userInfo?: {
    id: string;
    name?: string;
    email?: string;
    mobile?: string;
  } | null;
  isExample?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Collection = 'avatars' | 'users';

function formatDate(value: unknown): string {
  if (!value) return '—';
  if (typeof value !== 'string' && !(value instanceof Date) && typeof value !== 'number') {
    return String(value);
  }
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
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarRecord | null>(null);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const pageSize = 10;

  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportCsv = () => {
    if (filteredRows.length === 0) return;

    if (activeCollection === 'avatars') {
      const headers = [
        'S.No.',
        'Title',
        'User Name',
        'User Email',
        'User Mobile',
        'User ID',
        'Lifeboat Character',
        'Yacht Character',
        'Bridge Headline',
        'Created At',
        'Updated At',
      ];

      const csvRows = [headers.join(',')];

      (filteredRows as AvatarRecord[]).forEach((row, idx) => {
        const userInfo = resolveUserInfo(row);
        const output = (row.output as any) || {};
        const lifeboatName = output.lifeboat?.characterName || '';
        const yachtName = output.yacht?.characterName || '';
        const bridgeHeadline = output.bridge?.headline || '';

        const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

        csvRows.push(
          [
            idx + 1,
            escapeCsv(row.title || 'Untitled Avatar'),
            escapeCsv(userInfo.name),
            escapeCsv(userInfo.email),
            escapeCsv(userInfo.mobile),
            escapeCsv(userInfo.userId),
            escapeCsv(lifeboatName),
            escapeCsv(yachtName),
            escapeCsv(bridgeHeadline),
            escapeCsv(row.createdAt ? new Date(row.createdAt as any).toLocaleString() : ''),
            escapeCsv(row.updatedAt ? new Date(row.updatedAt as any).toLocaleString() : ''),
          ].join(',')
        );
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `avatar-dossiers-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ['S.No.', 'User ID', 'Name', 'Email', 'Mobile', 'Created At'];
      const csvRows = [headers.join(',')];

      (filteredRows as AvatarUser[]).forEach((user, idx) => {
        const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
        csvRows.push(
          [
            idx + 1,
            escapeCsv(user.id),
            escapeCsv(user.name),
            escapeCsv(user.email),
            escapeCsv(user.mobile),
            escapeCsv(user.createdAt ? new Date(user.createdAt as any).toLocaleString() : ''),
          ].join(',')
        );
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `avatar-users-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

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

  const userMap = useMemo(() => {
    const map = new Map<string, AvatarUser>();
    for (const u of users) {
      if (u.id) map.set(String(u.id), u);
    }
    return map;
  }, [users]);

  const resolveUserInfo = useCallback(
    (row: AvatarRecord) => {
      const rawUser = row.user;
      const userId =
        typeof rawUser === 'object' && rawUser && (rawUser as any)._id
          ? String((rawUser as any)._id)
          : String(rawUser || '');
      const matched = userId ? userMap.get(userId) : undefined;

      const name = row.userName || row.userInfo?.name || matched?.name || '';
      const email = row.userEmail || row.userInfo?.email || matched?.email || '';
      const mobile = row.userMobile || row.userInfo?.mobile || matched?.mobile || '';

      return {
        name,
        email,
        mobile,
        userId: userId || row.userInfo?.id || matched?.id || '',
      };
    },
    [userMap]
  );

  const filteredRows = useMemo(() => {
    let rows = activeCollection === 'avatars' ? (avatars as any[]) : (users as any[]);

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      rows = rows.filter(item => {
        if (!item.createdAt) return false;
        const d = new Date(item.createdAt);
        return !isNaN(d.getTime()) && d.getTime() >= start.getTime();
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      rows = rows.filter(item => {
        if (!item.createdAt) return false;
        const d = new Date(item.createdAt);
        return !isNaN(d.getTime()) && d.getTime() <= end.getTime();
      });
    }

    if (!search.trim()) return rows;
    const query = search.trim().toLowerCase();

    if (activeCollection === 'avatars') {
      return (rows as AvatarRecord[]).filter(row => {
        const info = resolveUserInfo(row);
        const title = String(row.title || '').toLowerCase();
        return (
          title.includes(query) ||
          info.name.toLowerCase().includes(query) ||
          info.email.toLowerCase().includes(query) ||
          info.mobile.toLowerCase().includes(query) ||
          info.userId.toLowerCase().includes(query) ||
          JSON.stringify(row).toLowerCase().includes(query)
        );
      });
    }

    return (rows as AvatarUser[]).filter(user => {
      return (
        String(user.name || '').toLowerCase().includes(query) ||
        String(user.email || '').toLowerCase().includes(query) ||
        String(user.mobile || '').toLowerCase().includes(query) ||
        String(user.id || '').toLowerCase().includes(query)
      );
    });
  }, [avatars, users, activeCollection, startDate, endDate, search, resolveUserInfo]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const selectCollection = (collection: Collection) => {
    setActiveCollection(collection);
    setCurrentPage(1);
    setSearch('');
    setStartDate('');
    setEndDate('');
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
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2">
            {(['avatars', 'users'] as const).map(collection => (
              <button
                type="button"
                key={collection}
                onClick={() => selectCollection(collection)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize cursor-pointer transition ${
                  activeCollection === collection
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {collection}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Date Range Pickers */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
              <input
                type="date"
                value={startDate}
                max={todayStr}
                onChange={e => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
                title="Start Date"
              />
              <span className="text-slate-400 text-xs font-medium">to</span>
              <input
                type="date"
                value={endDate}
                max={todayStr}
                onChange={e => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
                title="End Date"
              />
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setCurrentPage(1);
                  }}
                  className="ml-1 p-0.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                  title="Clear Dates"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={event => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder={
                  activeCollection === 'avatars'
                    ? 'Search by title, user name, email, or ID...'
                    : 'Search users by name, email, mobile...'
                }
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            {/* Download CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredRows.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs shrink-0"
              title={`Export ${activeCollection} to CSV`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono">
                {filteredRows.length}
              </span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeCollection === 'avatars' ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">User Info</th>
                  <th className="px-4 py-3">Time Stamps</th>
                  <th className="px-4 py-3 text-right">Dossier Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                      Loading Avatar App data...
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                      <div className="max-w-xs mx-auto flex flex-col items-center">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                          <Inbox className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800">No avatars found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (pageRows as AvatarRecord[]).map(row => {
                    const userInfo = resolveUserInfo(row);
                    return (
                      <tr key={row.id} className="align-top hover:bg-slate-50/75 transition-colors">
                        {/* Title */}
                        <td className="px-4 py-3 text-slate-800 max-w-xs">
                          <div className="font-semibold text-slate-900 text-sm">
                            {row.title || 'Untitled Avatar Dossier'}
                          </div>
                          {Boolean(row.isExample) && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200">
                              Example
                            </span>
                          )}
                        </td>

                        {/* User Info */}
                        <td className="px-4 py-3 text-slate-700 max-w-sm">
                          <div className="flex flex-col gap-1">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{userInfo.name || 'Unknown User'}</span>
                            </div>
                            {userInfo.email && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 group/copy">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{userInfo.email}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(userInfo.email, `email-${row.id}`)}
                                  className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition opacity-0 group-hover/copy:opacity-100 cursor-pointer"
                                  title="Copy Email"
                                >
                                  {copiedKey === `email-${row.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                            {userInfo.mobile && userInfo.mobile !== 'N/A' && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 group/copy">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{userInfo.mobile}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(userInfo.mobile, `phone-${row.id}`)}
                                  className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition opacity-0 group-hover/copy:opacity-100 cursor-pointer"
                                  title="Copy Mobile"
                                >
                                  {copiedKey === `phone-${row.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                            {userInfo.userId && (
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5 group/copy">
                                <span>ID: {userInfo.userId}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(userInfo.userId, `user-${row.id}`)}
                                  className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition opacity-0 group-hover/copy:opacity-100 cursor-pointer"
                                  title="Copy User ID"
                                >
                                  {copiedKey === `user-${row.id}` ? (
                                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-2.5 h-2.5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Time Stamps */}
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5 text-xs">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1.5">
                                  Created:
                                </span>
                                <span className="font-medium text-slate-800">{formatDate(row.createdAt)}</span>
                              </div>
                            </div>
                            {row.updatedAt && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1.5">
                                    Updated:
                                  </span>
                                  <span className="text-slate-600">{formatDate(row.updatedAt)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Dossier Details */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedAvatar(row)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Dossier</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      Loading users...
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      <div className="max-w-xs mx-auto flex flex-col items-center">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                          <Inbox className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800">No users found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (pageRows as AvatarUser[]).map(user => (
                    <tr key={user.id} className="align-top hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-500 group/copy">
                        <div className="flex items-center gap-1.5">
                          <span>{user.id}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(user.id, `user-id-${user.id}`)}
                            className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition opacity-0 group-hover/copy:opacity-100 cursor-pointer"
                            title="Copy ID"
                          >
                            {copiedKey === `user-id-${user.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{user.name || '—'}</td>
                      <td className="px-4 py-3 text-slate-700 group/copy">
                        <div className="flex items-center gap-1.5">
                          <span>{user.email || '—'}</span>
                          {user.email && (
                            <button
                              type="button"
                              onClick={() => handleCopy(user.email!, `user-email-${user.id}`)}
                              className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition opacity-0 group-hover/copy:opacity-100 cursor-pointer"
                              title="Copy Email"
                            >
                              {copiedKey === `user-email-${user.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 group/copy">
                        <div className="flex items-center gap-1.5">
                          <span>{user.mobile || '—'}</span>
                          {user.mobile && user.mobile !== 'N/A' && (
                            <button
                              type="button"
                              onClick={() => handleCopy(user.mobile!, `user-phone-${user.id}`)}
                              className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition opacity-0 group-hover/copy:opacity-100 cursor-pointer"
                              title="Copy Mobile"
                            >
                              {copiedKey === `user-phone-${user.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDate(user.createdAt)}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
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
              className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40 cursor-pointer hover:bg-slate-100 transition"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-medium text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40 cursor-pointer hover:bg-slate-100 transition"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <AvatarDossierModal
        isOpen={Boolean(selectedAvatar)}
        onClose={() => setSelectedAvatar(null)}
        avatar={selectedAvatar}
        userInfo={selectedAvatar ? resolveUserInfo(selectedAvatar) : undefined}
      />
    </section>
  );
};
