import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Login } from './components/Login.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DataTable } from './components/DataTable.tsx';
import { ChangePasswordModal } from './components/ChangePasswordModal.tsx';
import { IngestTesterModal } from './components/IngestTesterModal.tsx';
import { LeadData, LeadsApiResponse } from './types/index.ts';
import { Users, Globe2, Sparkles, AlertTriangle, LineChart } from 'lucide-react';
import { AnalysisTable } from './components/AnalysisTable.tsx';

function DashboardContent() {
  const { token, logout } = useAuth();
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [allLeads, setAllLeads] = useState<LeadData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<any[]>([]); // <-- Add this state

  // Modals state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isIngestTesterOpen, setIsIngestTesterOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);


  // Fetch all leads across databases and external APIs at once
  const fetchLeads = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorNotice(null);

    try {
      // Fetch both APIs simultaneously
      const [leadsRes, analysesRes] = await Promise.all([
        fetch('/api/data', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/analyses', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (leadsRes.status === 401 || leadsRes.status === 403) {
        logout();
        return;
      }

      const leadsData = await leadsRes.json();
      if (leadsRes.ok && leadsData.success) {
        setAllLeads(leadsData.data || []);
      }

      // Set the analysis data
      if (analysesRes.ok) {
        const aData = await analysesRes.json();
        setAnalyses(aData.data || []);
      }
    } catch (err: any) {
      console.error('Fetch leads error:', err);
      setErrorNotice('Network error: Unable to contact backend API');
    } finally {
      setIsLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Compute metrics and unique sites
  const { uniqueSites, siteCounts, totalCount, leadsToday } = useMemo(() => {
    const counts: Record<string, number> = {};
    const sitesSet = new Set<string>();

    const now = new Date();
    const todayYear = now.getUTCFullYear();
    const todayMonth = now.getUTCMonth();
    const todayDate = now.getUTCDate();
    let todayCount = 0;

    allLeads.forEach((lead) => {
      sitesSet.add(lead.siteName);
      counts[lead.siteName] = (counts[lead.siteName] || 0) + 1;

      const d = new Date(lead.createdAt);
      if (
        !isNaN(d.getTime()) &&
        d.getUTCFullYear() === todayYear &&
        d.getUTCMonth() === todayMonth &&
        d.getUTCDate() === todayDate
      ) {
        todayCount++;
      }
    });

    return {
      uniqueSites: Array.from(sitesSet).sort(),
      siteCounts: counts,
      totalCount: allLeads.length,
      leadsToday: todayCount,
    };
  }, [allLeads]);

  // Delete lead (accepts string or number IDs)
  const handleDeleteLead = async (id: string | number) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/data/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setAllLeads((prev) => prev.filter((l) => l.id !== id));
      } else {
        alert('Failed to delete lead');
      }
    } catch (err) {
      console.error('Delete lead error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        sites={uniqueSites}
        selectedSite={selectedSite}
        onSelectSite={setSelectedSite}
        siteCounts={siteCounts}
        totalCount={totalCount}
        onOpenIngestTester={() => setIsIngestTesterOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Header
          onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
          onOpenIngestTester={() => setIsIngestTesterOpen(true)}
          selectedSite={selectedSite}
          displayedLeads={allLeads}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {errorNotice && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* Quick Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                  Total Leads
                </p>
                <p className="text-xl font-bold text-slate-900 font-mono">
                  {totalCount}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Globe2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                  Active Projects
                </p>
                <p className="text-xl font-bold text-slate-900 font-mono">
                  {uniqueSites.length}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                  Today's Leads
                </p>
                <p className="text-xl font-bold text-slate-900 font-mono">
                  {leadsToday}
                </p>
              </div>
            </div>
          </div>

          {/* Active Filter Banner */}
          {/* {selectedSite && (
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs text-indigo-950">
              <div className="flex items-center gap-2">
                <span>Displaying table for:</span>
                <span className="font-semibold px-2 py-0.5 rounded-md bg-white border border-indigo-200 shadow-2xs font-mono">
                  {selectedSite}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSite(null)}
                className="font-semibold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
              >
                Show All Project Tables
              </button>
            </div>
          )} */}

          {/* Grouped Tables: Each project has its own separate DataTable */}
          <div className="space-y-10">
            {(selectedSite ? [selectedSite] : uniqueSites).map((site) => {
              const siteLeads = allLeads.filter((l) => l.siteName === site);

              return (
                <div key={site} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Globe2 className="w-5 h-5 text-indigo-500" />
                      Project: {site}
                    </h3>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-xs font-semibold text-slate-700">
                      {siteLeads.length} records
                    </span>
                  </div>

                  <DataTable
                    leads={siteLeads}
                    isLoading={isLoading}
                    selectedSite={site}
                    onDeleteLead={handleDeleteLead}
                    onRefresh={fetchLeads}
                  />
                {/* === ADD THIS BLOCK: Appears only for BO Score === */}
                  {site === 'BO Score' && analyses.length > 0 && (
                    <div className="mt-8 flex flex-col gap-3">
                       <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <LineChart className="w-5 h-5 text-indigo-500" />
                            BO Score: Completed Analyses
                          </h3>
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-semibold">
                            {analyses.length} records
                          </span>
                       </div>
                       <AnalysisTable analyses={analyses} isLoading={isLoading} />
                    </div>
                  )}
                  {/* ================================================= */}

                </div>
              );
            })}

            {!isLoading && uniqueSites.length === 0 && (
              <DataTable
                leads={[]}
                isLoading={false}
                selectedSite={null}
                onRefresh={fetchLeads}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      <IngestTesterModal
        isOpen={isIngestTesterOpen}
        onClose={() => setIsIngestTesterOpen(false)}
        onLeadIngested={fetchLeads}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  );
}

function AppRoot() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <DashboardContent />;
}