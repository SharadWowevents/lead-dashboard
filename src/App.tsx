import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Login } from './components/Login.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DataTable } from './components/DataTable.tsx';
import { ChangePasswordModal } from './components/ChangePasswordModal.tsx';
import { IngestTesterModal } from './components/IngestTesterModal.tsx';
import { LeadData } from './types/index.ts';
import { Users, Globe2, Sparkles, AlertTriangle, LineChart, FileText } from 'lucide-react';
import { AnalysisTable } from './components/AnalysisTable.tsx';
import { PromptManager } from './components/PromptManager.tsx';
import { ResourceLogsTable } from './components/ResourceLogsTable.tsx';
import { ResourceManager } from './components/ResourceManager.tsx';

function DashboardContent() {
  const { token, logout } = useAuth();
  const [activeView, setActiveView] = useState<'leads' | 'prompts' | 'resources'>('leads');
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  
  const [allLeads, setAllLeads] = useState<LeadData[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]); 
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Modals state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isIngestTesterOpen, setIsIngestTesterOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const fetchLeads = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorNotice(null);

    try {
      const [leadsRes, analysesRes, logsRes] = await Promise.all([
        fetch('/api/data', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/analyses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/logs', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (leadsRes.status === 401 || leadsRes.status === 403) {
        logout();
        return;
      }

      const leadsData = await leadsRes.json();
      if (leadsRes.ok && leadsData.success) {
        setAllLeads(leadsData.data || []);
      }

      if (analysesRes.ok) {
        const aData = await analysesRes.json();
        setAnalyses(aData.data || []);
      }

      if (logsRes.ok) {
        const lData = await logsRes.json();
        setLogs(lData.data || []);
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

  // Metrics and Sidebar Site mapping
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

  // Deduplicate leads by email for the "All Projects" view
  const uniqueLeadsAllProjects = useMemo(() => {
    const emailMap = new Map<string, LeadData>();
    
    // Sort oldest to newest so newest records become the primary visible data
    const sortedLeads = [...allLeads].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    sortedLeads.forEach((lead) => {
      const emailKey = (lead.email || '').toLowerCase().trim();
      if (!emailMap.has(emailKey)) {
        emailMap.set(emailKey, { ...lead });
      } else {
        const existing = emailMap.get(emailKey)!;
        // Append the site name if this user exists in multiple projects
        if (!existing.siteName.includes(lead.siteName)) {
          existing.siteName = `${existing.siteName}, ${lead.siteName}`;
        }
      }
    });

    return Array.from(emailMap.values());
  }, [allLeads]);

  const handleDeleteLead = async (id: string | number) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/data/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
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
      <Sidebar
        sites={uniqueSites}
        selectedSite={selectedSite}
        onSelectSite={setSelectedSite}
        siteCounts={siteCounts}
        totalCount={totalCount}
        activeView={activeView}
        onSetActiveView={setActiveView}
        onOpenIngestTester={() => setIsIngestTesterOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Header
          onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
          onOpenIngestTester={() => setIsIngestTesterOpen(true)}
          selectedSite={
            activeView === 'prompts' 
              ? 'Prompt Manager' 
              : activeView === 'resources' 
              ? 'Resource Manager' 
              : selectedSite
          }
          displayedLeads={allLeads}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {errorNotice && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {activeView === 'prompts' ? (
            <PromptManager /> 
          ) : activeView === 'resources' ? ( 
            <ResourceManager />
          ) : (
            <>
              {/* Quick Metrics Row */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                      Total Records
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

              {/* Data Tables Section */}
              <div className="space-y-10">
                {!selectedSite ? (
                  // ==========================================
                  // ALL PROJECTS VIEW: Master deduplicated table
                  // ==========================================
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Globe2 className="w-5 h-5 text-indigo-500" />
                        All Projects: Unique Leads
                      </h3>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-xs font-semibold text-slate-700">
                        {uniqueLeadsAllProjects.length} unique people
                      </span>
                    </div>

                    <DataTable
                      leads={uniqueLeadsAllProjects}
                      isLoading={isLoading}
                      selectedSite="All Projects"
                      onDeleteLead={handleDeleteLead}
                      onRefresh={fetchLeads}
                    />
                  </div>
                ) : (
                  // ==========================================
                  // INDIVIDUAL PROJECT VIEW: Specific tables
                  // ==========================================
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Globe2 className="w-5 h-5 text-indigo-500" />
                        Project: {selectedSite}
                      </h3>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-xs font-semibold text-slate-700">
                        {allLeads.filter(l => l.siteName === selectedSite).length} records
                      </span>
                    </div>

                    <DataTable
                      leads={allLeads.filter(l => l.siteName === selectedSite)}
                      isLoading={isLoading}
                      selectedSite={selectedSite}
                      onDeleteLead={handleDeleteLead}
                      onRefresh={fetchLeads}
                    />
                    
                    {/* Sub-table: BO Score Analyses */}
                    {selectedSite === 'BO Score' && analyses.length > 0 && (
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

                    {/* Sub-table: Resource Allocator Logs */}
                    {selectedSite === 'Resource Allocator' && logs.length > 0 && (
                      <div className="mt-8 flex flex-col gap-3">
                         <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                              <FileText className="w-5 h-5 text-indigo-500" />
                              Resource Allocator: Download Logs
                            </h3>
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-semibold">
                              {logs.length} records
                            </span>
                         </div>
                         <ResourceLogsTable logs={logs} isLoading={isLoading} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

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