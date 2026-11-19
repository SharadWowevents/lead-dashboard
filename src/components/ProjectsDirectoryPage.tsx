import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Project, ProjectTypeItem, FilterState, ProjectStats, ProjectStatus, SortField } from '../types/projects.ts';
import { INITIAL_PROJECTS, DEFAULT_TYPES } from '../data/projectsInitialData.ts';
import { useAuth } from '../context/AuthContext.tsx';

import { Navbar as ProjectsNavbar } from './projects/Navbar.tsx';
import { StatsBanner } from './projects/StatsBanner.tsx';
import { FilterControls } from './projects/FilterControls.tsx';
import { ProjectTable } from './projects/ProjectTable.tsx';
import { ProjectGrid } from './projects/ProjectGrid.tsx';
// @ts-ignore - ported verbatim from ProjectsList (JSX component)
import { ProjectModal } from './projects/ProjectModal.jsx';
import { ManageTypesModal } from './projects/ManageTypesModal.tsx';
import { ProjectDetailDrawer } from './projects/ProjectDetailDrawer.tsx';
import { ImportExportModal } from './projects/ImportExportModal.tsx';
import { DeleteConfirmModal } from './projects/DeleteConfirmModal.tsx';

// Projects Directory — ported 1:1 (single page, all features) from ProjectsList (MERN).
// Only adaptations: (1) JWT Authorization header (original backend was public),
// (2) import payload now sends { projects, types, replaceExisting } so replace/types work,
// (3) rendering inside lead-dashboard shell instead of a standalone app.
const API_BASE_URL = '/api';

export default function ProjectsDirectoryPage({ onToggleMobileMenu }: { onToggleMobileMenu?: () => void } = {}) {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [types, setTypes] = useState<ProjectTypeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', type: 'ALL', status: 'ALL', isLive: 'ALL', sortBy: 'date', sortOrder: 'desc' });
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isManageTypesOpen, setIsManageTypesOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [selectedDrawerProject, setSelectedDrawerProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const authFetch = useCallback((url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  }, [token]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [projectsRes, typesRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/projects`),
          authFetch(`${API_BASE_URL}/types`),
        ]);
        if (projectsRes.ok) setProjects(await projectsRes.json());
        if (typesRes.ok) setTypes(await typesRes.json());
      } catch {
        showToast('Failed to connect to backend server.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [authFetch]);

  // Keyboard shortcuts (original): N = new project, / = focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === '/' && !isNewProjectModalOpen && !isManageTypesOpen) {
        e.preventDefault();
        document.getElementById('search-projects-input')?.focus();
      }
      if ((e.key === 'n' || e.key === 'N') && !isNewProjectModalOpen && !isManageTypesOpen && !editingProject) {
        e.preventDefault();
        setIsNewProjectModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNewProjectModalOpen, isManageTypesOpen, editingProject]);

  const stats: ProjectStats = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    let live = 0, offline = 0, Completed = 0, inProgress = 0, inactive = 0;
    projects.forEach((p) => {
      if (p.isLive) live++; else offline++;
      if (p.status === 'Completed') Completed++;
      else if (p.status === 'In progress') inProgress++;
      else if (p.status === 'Inactive') inactive++;
      if (p.type) typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
    });
    return { total: projects.length, live, offline, Completed, inProgress, inactive, typeCounts };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        if (filters.search.trim()) {
          const q = filters.search.toLowerCase();
          const hit = p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q)
            || (p.link || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
            || (p.tags || []).some((t) => t.toLowerCase().includes(q));
          if (!hit) return false;
        }
        if (filters.type !== 'ALL' && p.type !== filters.type) return false;
        if (filters.status !== 'ALL' && p.status !== filters.status) return false;
        if (filters.isLive === 'LIVE' && !p.isLive) return false;
        if (filters.isLive === 'OFFLINE' && p.isLive) return false;
        return true;
      })
      .sort((a, b) => {
        const order = filters.sortOrder === 'asc' ? 1 : -1;
        if (filters.sortBy === 'name') return a.name.localeCompare(b.name) * order;
        if (filters.sortBy === 'type') return a.type.localeCompare(b.type) * order;
        if (filters.sortBy === 'status') return a.status.localeCompare(b.status) * order;
        if (filters.sortBy === 'isLive') return (Number(a.isLive) - Number(b.isLive)) * order;
        return ((new Date(a.date).getTime() || 0) - (new Date(b.date).getTime() || 0)) * order;
      });
  }, [projects, filters]);

  const handleAddNewType = useCallback(async (newTypeName: string, color = 'indigo') => {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    if (types.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) return;
    const response = await authFetch(`${API_BASE_URL}/types`, { method: 'POST', body: JSON.stringify({ name: trimmed, color, isDefault: false }) });
    if (!response.ok) throw new Error('Failed to save type to server');
    const newTypeItem = await response.json();
    setTypes((prev) => (prev.some((t) => t.id === newTypeItem.id) ? prev : [...prev, newTypeItem]));
    showToast(`Added type "${trimmed}"`);
  }, [types, authFetch]);

  const handleDeleteType = useCallback(async (typeId: string, typeName: string) => {
    const response = await authFetch(`${API_BASE_URL}/types/${typeId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete type from server');
    setTypes((prev) => prev.filter((t) => t.id !== typeId));
    showToast(`Deleted type "${typeName}"`);
  }, [authFetch]);

  const handleSaveProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProject) {
      const response = await authFetch(`${API_BASE_URL}/projects/${editingProject.id}`, { method: 'PUT', body: JSON.stringify(projectData) });
      if (!response.ok) throw new Error('Failed to update project');
      const updatedProject = await response.json();
      setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
      if (selectedDrawerProject?.id === updatedProject.id) setSelectedDrawerProject(updatedProject);
      showToast(`Updated "${updatedProject.name}"`);
    } else {
      const response = await authFetch(`${API_BASE_URL}/projects`, { method: 'POST', body: JSON.stringify(projectData) });
      if (!response.ok) throw new Error('Failed to create project');
      const newProj = await response.json();
      setProjects((prev) => [newProj, ...prev]);
      showToast(`Added "${newProj.name}"`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProject) return;
    const response = await authFetch(`${API_BASE_URL}/projects/${deletingProject.id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete project');
    const name = deletingProject.name;
    setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id));
    if (selectedDrawerProject?.id === deletingProject.id) setSelectedDrawerProject(null);
    setDeletingProject(null);
    showToast(`Deleted "${name}"`, 'info');
  };

  const handleDuplicateProject = async (project: Project) => {
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = project as any;
    const response = await authFetch(`${API_BASE_URL}/projects`, { method: 'POST', body: JSON.stringify({ ...rest, name: `${project.name} (Copy)` }) });
    if (!response.ok) throw new Error('Failed to duplicate project');
    const newProj = await response.json();
    setProjects((prev) => [newProj, ...prev]);
    showToast(`Duplicated "${project.name}"`);
  };

  const handleToggleLive = async (project: Project) => {
    const response = await authFetch(`${API_BASE_URL}/projects/${project.id}`, { method: 'PUT', body: JSON.stringify({ ...project, isLive: !project.isLive }) });
    if (!response.ok) throw new Error('Failed to update live status');
    const updatedProject = await response.json();
    setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
    if (selectedDrawerProject?.id === project.id) setSelectedDrawerProject(updatedProject);
    showToast(`"${project.name}" is now ${updatedProject.isLive ? 'Live' : 'Offline'}`);
  };

  const handleStatusChange = async (project: Project, newStatus: ProjectStatus) => {
    const response = await authFetch(`${API_BASE_URL}/projects/${project.id}`, { method: 'PUT', body: JSON.stringify({ ...project, status: newStatus }) });
    if (!response.ok) throw new Error('Failed to update status');
    const updatedProject = await response.json();
    setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
    if (selectedDrawerProject?.id === project.id) setSelectedDrawerProject(updatedProject);
    showToast(`Status updated to "${newStatus}"`);
  };

  const handleSort = (field: SortField) => {
    if (filters.sortBy === field) setFilters((prev) => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }));
    else setFilters((prev) => ({ ...prev, sortBy: field, sortOrder: field === 'name' ? 'asc' : 'desc' }));
  };

  const refetchAll = async () => {
    const [projectsRes, typesRes] = await Promise.all([authFetch(`${API_BASE_URL}/projects`), authFetch(`${API_BASE_URL}/types`)]);
    if (projectsRes.ok) setProjects(await projectsRes.json());
    if (typesRes.ok) setTypes(await typesRes.json());
  };

  const handleImportData = async (importedProjects: Project[], importedTypes?: ProjectTypeItem[], replaceExisting = false) => {
    const response = await authFetch(`${API_BASE_URL}/projects/import`, {
      method: 'POST',
      body: JSON.stringify({ projects: importedProjects, types: importedTypes, replaceExisting }),
    });
    if (!response.ok) throw new Error('Failed to import data to server');
    await refetchAll();
    showToast('Import completed successfully!');
  };

  // Original behaviour preserved: appends demo data (does not wipe DB despite the "Reset" label)
  const handleResetSampleData = async () => {
    if (window.confirm('Reset dashboard with realistic sample demo projects? This will append demo data to your database.')) {
      try {
        await authFetch(`${API_BASE_URL}/projects/import`, { method: 'POST', body: JSON.stringify(INITIAL_PROJECTS) });
        for (const t of DEFAULT_TYPES) {
          await authFetch(`${API_BASE_URL}/types`, { method: 'POST', body: JSON.stringify(t) });
        }
        await refetchAll();
        setFilters({ search: '', type: 'ALL', status: 'ALL', isLive: 'ALL', sortBy: 'date', sortOrder: 'desc' });
        showToast('Appended demo sample projects!');
      } catch {
        showToast('Failed to reset sample data', 'error');
      }
    }
  };

  const openNew = () => { setEditingProject(null); setIsNewProjectModalOpen(true); };
  const openEdit = (p: Project) => { setEditingProject(p); setIsNewProjectModalOpen(true); };

  return (
    <div className="projects-directory flex-1 flex flex-col w-full min-h-full bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white shadow-xl text-xs border border-slate-900">
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'info' && <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />}
            {toastMessage.type === 'error' && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      <ProjectsNavbar
        onToggleMobileMenu={onToggleMobileMenu}
        stats={stats}
        onOpenNewProject={openNew}
        onOpenManageTypes={() => setIsManageTypesOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onResetData={handleResetSampleData}
      />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <StatsBanner
          isLoading={isLoading}
          stats={stats}
          selectedType={filters.type}
          onSelectType={(typeName: string) => setFilters((prev) => ({ ...prev, type: typeName }))}
          onSelectStatus={(statusVal: any) => setFilters((prev) => ({ ...prev, status: statusVal }))}
          onSelectLive={(liveVal: any) => setFilters((prev) => ({ ...prev, isLive: liveVal }))}
        />

        <FilterControls
          isLoading={isLoading}
          filters={filters}
          onFilterChange={(newPartial: Partial<FilterState>) => setFilters((prev) => ({ ...prev, ...newPartial }))}
          onResetFilters={() => setFilters({ search: '', type: 'ALL', status: 'ALL', isLive: 'ALL', sortBy: 'date', sortOrder: 'desc' })}
          availableTypes={types}
          totalResults={filteredProjects.length}
          totalProjects={projects.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {viewMode === 'table' ? (
          <ProjectTable
            projects={filteredProjects}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSort={handleSort}
            onEditProject={openEdit}
            onDeleteProject={(p: Project) => setDeletingProject(p)}
            onDuplicateProject={handleDuplicateProject}
            onToggleLive={handleToggleLive}
            onStatusChange={handleStatusChange}
            onSelectProject={(p: Project) => setSelectedDrawerProject(p)}
            onFilterByType={(typeName: string) => setFilters((prev) => ({ ...prev, type: typeName }))}
            onOpenNewProject={openNew}
          />
        ) : (
          <ProjectGrid
            projects={filteredProjects}
            onEditProject={openEdit}
            onDeleteProject={(p: Project) => setDeletingProject(p)}
            onDuplicateProject={handleDuplicateProject}
            onToggleLive={handleToggleLive}
            onStatusChange={handleStatusChange}
            onSelectProject={(p: Project) => setSelectedDrawerProject(p)}
            onFilterByType={(typeName: string) => setFilters((prev) => ({ ...prev, type: typeName }))}
            onOpenNewProject={openNew}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-3.5 text-center text-xs text-slate-500">
        <div className="px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Projects Directory &bull; Changes are saved automatically to the database</span>
          <span className="flex items-center gap-1.5">Shortcuts: <kbd className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-semibold text-slate-600 shadow-xs">N</kbd> New project &bull; <kbd className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-semibold text-slate-600 shadow-xs">/</kbd> Search</span>
        </div>
      </footer>

      <ProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => { setIsNewProjectModalOpen(false); setEditingProject(null); }}
        onSave={handleSaveProject}
        projectToEdit={editingProject}
        availableTypes={types}
        onAddNewType={handleAddNewType}
      />

      <ManageTypesModal
        isOpen={isManageTypesOpen}
        onClose={() => setIsManageTypesOpen(false)}
        types={types}
        projects={projects}
        onAddType={handleAddNewType}
        onDeleteType={handleDeleteType}
      />

      <ProjectDetailDrawer
        project={selectedDrawerProject}
        onClose={() => setSelectedDrawerProject(null)}
        onEdit={(p: Project) => { setSelectedDrawerProject(null); openEdit(p); }}
        onDelete={(p: Project) => { setSelectedDrawerProject(null); setDeletingProject(p); }}
        onToggleLive={handleToggleLive}
        onDuplicate={handleDuplicateProject}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        projects={projects}
        types={types}
        onImportData={handleImportData}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleConfirmDelete}
        project={deletingProject}
      />
    </div>
  );
}
