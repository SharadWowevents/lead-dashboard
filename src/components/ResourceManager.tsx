import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Plus, Edit2, Trash2, ExternalLink, Link as LinkIcon, Loader2 } from 'lucide-react';

export const ResourceManager = () => {
  const { token } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', link: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchResources(); }, []);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/resources', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setResources(data.data);
    } catch (err) {
      console.error('Failed to fetch resources', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = editingId ? `/api/resources/${editingId}` : '/api/resources';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        fetchResources();
        closeModal();
      } else {
        alert('Failed to save resource. Ensure the name is unique.');
      }
    } catch (err) {
      console.error('Save error', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchResources();
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const openModal = (resource?: any) => {
    if (resource) {
      setEditingId(resource._id || resource.id);
      setFormData({ name: resource.name, link: resource.link });
    } else {
      setEditingId(null);
      setFormData({ name: '', link: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', link: '' });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2 text-slate-800">
          <LinkIcon className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold">Resource Links Manager</h2>
        </div>
        <button onClick={() => openModal()} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition shadow-sm cursor-pointer">
          <Plus className="w-4 h-4" /> Add New Link
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <span className="text-sm font-medium">Loading resources...</span>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {resources.map((res) => (
            <div key={res._id || res.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 truncate mb-1">{res.name}</h3>
                <a href={res.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-mono truncate max-w-full">
                  <ExternalLink className="w-3 h-3 shrink-0" /> {res.link}
                </a>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openModal(res)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(res._id || res.id, res.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {resources.length === 0 && (
            <div className="p-12 text-center text-slate-500 text-sm">No resources found. Add one above.</div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">{editingId ? 'Edit Resource' : 'Add New Resource'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Resource Name (Exact Match)</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Lead Flow Consistency Tracker" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Google Drive / File URL</label>
                <input required type="url" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://..." />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Save Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};