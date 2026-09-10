import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Menu,
  KeyRound,
  LogOut,
  Download,
  Code2,
  Filter,
  UserCheck,
  Shield,
} from 'lucide-react';
import { exportLeadsToCsv } from '../utils/exportCsv.ts';
import { LeadData } from '../types/index.ts';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenChangePassword: () => void;
  onOpenIngestTester: () => void;
  selectedSite: string | null;
  displayedLeads: LeadData[];
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenChangePassword,
  onOpenIngestTester,
  selectedSite,
  displayedLeads,
}) => {
  const { user, logout } = useAuth();

  const handleExport = () => {
    exportLeadsToCsv(displayedLeads, selectedSite);
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Section: Mobile toggle and Current Context Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="mobile-menu-toggle-btn"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Open Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {selectedSite ? (
                <span className="flex items-center gap-2">
                  <span className="text-slate-400 font-normal">Project:</span>
                  <span className="text-slate-900">{selectedSite}</span>
                </span>
              ) : (
                'Centralized Leads Overview'
              )}
            </h1>

            {selectedSite ? (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Filter className="w-3 h-3" />
                Filtered
              </span>
            ) : (
             <div></div>
            )}
          </div>
        </div>

        {/* Right Section: Ingest Helper, CSV Download, User Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick Ingest Code Tester Button */}
          {/* <button
            type="button"
            id="header-ingest-guide-btn"
            onClick={onOpenIngestTester}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Ingest API Snippet</span>
          </button> */}

          {/* Download CSV */}
          <button
            type="button"
            id="header-download-csv-btn"
            onClick={handleExport}
            disabled={displayedLeads.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition disabled:opacity-50 cursor-pointer shadow-xs"
            title="Download formatted CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Admin User Info & Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-medium">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.username || 'Admin'}</span>
            </div>

            {/* Change Password Button */}
            <button
              type="button"
              id="header-change-password-btn"
              onClick={onOpenChangePassword}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title="Change Password"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            {/* Logout Button */}
            <button
              type="button"
              id="header-logout-btn"
              onClick={logout}
              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
