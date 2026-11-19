import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  ExternalLink, 
  Globe, 
  ChevronDown,
  Loader2
} from 'lucide-react';
import { normalizeUrl } from '../../utils/projectsHelpers.ts';

export const ProjectModal = ({
  isOpen,
  onClose,
  onSave,
  projectToEdit,
  availableTypes,
  onAddNewType,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('Dashboard');
  const [isCreatingNewType, setIsCreatingNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [link, setLink] = useState('');
  const [isLive, setIsLive] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('Completed');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  
  // Backend request state
  const [isSaving, setIsSaving] = useState(false);

  // Reset or populate fields on modal open
  useEffect(() => {
    if (isOpen) {
      if (projectToEdit) {
        setName(projectToEdit.name || '');
        setType(projectToEdit.type || 'Dashboard');
        setLink(projectToEdit.link || '');
        setIsLive(projectToEdit.isLive ?? true);
        setDate(projectToEdit.date || new Date().toISOString().slice(0, 10));
        setStatus(projectToEdit.status || 'Completed');
        setDescription(projectToEdit.description || '');
        setTagsInput(projectToEdit.tags ? projectToEdit.tags.join(', ') : '');
        setNotes(projectToEdit.notes || '');
      } else {
        setName('');
        setType(availableTypes[0]?.name || 'Dashboard');
        setLink('');
        setIsLive(true);
        setDate(new Date().toISOString().slice(0, 10));
        setStatus('Completed');
        setDescription('');
        setTagsInput('');
        setNotes('');
      }
      setIsCreatingNewType(false);
      setNewTypeName('');
      setError('');
      setIsSaving(false);
    }
  }, [isOpen, projectToEdit, availableTypes]);

  if (!isOpen) return null;

  // Wrapper for saving a new inline type with backend latency
  const handleSaveNewTypeInline = async () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      await onAddNewType(trimmed);
      setType(trimmed);
      setIsCreatingNewType(false);
    } catch (err) {
      setError(err.message || 'Server error: Failed to add new type');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      let finalType = type;
      if (isCreatingNewType) {
        if (!newTypeName.trim()) {
          setError('Please enter a name for the new type');
          setIsSaving(false);
          return;
        }
        finalType = newTypeName.trim();
        await onAddNewType(finalType); // Await backend creation
      }

      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await onSave({
        name: name.trim(),
        type: finalType,
        link: link.trim(),
        isLive,
        date: date || new Date().toISOString().slice(0, 10),
        status,
        description: description.trim(),
        tags: parsedTags,
        notes: notes.trim(),
      });

      onClose();
    } catch (err) {
      setError(err.message || 'Server error: Failed to save project modifications');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetToday = () => {
    setDate(new Date().toISOString().slice(0, 10));
  };

  const handleTestLink = () => {
    if (link.trim()) {
      window.open(normalizeUrl(link), '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Project Details
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {projectToEdit ? 'Edit Project' : 'Add New Project'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-400 text-rose-900 text-xs font-semibold">
              Error: {error}
            </div>
          )}

          {/* 1. Project Name (Required) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Project Name <span className="text-rose-600">*</span>
            </label>
            <input
              id="project-name-input"
              type="text"
              required
              disabled={isSaving}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Sales Metrics Dashboard, Habit Tracker..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl text-xs text-slate-900 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* 2. Type (Dashboard, Tracker, Calculator, or (Add New Type)) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Project Type <span className="text-rose-600">*</span>
              </label>
              {!isCreatingNewType && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    setIsCreatingNewType(true);
                    setNewTypeName('');
                  }}
                  className="text-[11px] font-bold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3 h-3"/>
                  <span>+ Add new type</span>
                </button>
              )}
            </div>

            {isCreatingNewType ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  disabled={isSaving}
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="Enter custom type (e.g. Utility, Game...)"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-900 rounded-xl text-xs text-slate-900 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveNewTypeInline}
                  className="px-3 py-2 flex items-center justify-center gap-1.5 w-24 bg-slate-900 text-white text-xs font-bold uppercase rounded-xl hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : 'Save'}
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsCreatingNewType(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-900 text-xs font-medium rounded-xl hover:bg-slate-900/15 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="relative">
                <select
                  id="project-type-select"
                  value={type}
                  disabled={isSaving}
                  onChange={(e) => {
                    if (e.target.value === '__ADD_NEW__') {
                      setIsCreatingNewType(true);
                      setNewTypeName('');
                    } else {
                      setType(e.target.value);
                    }
                  }}
                  className="appearance-none w-full px-3 py-2 pr-8 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl text-xs text-slate-900 transition-all outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {availableTypes.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                  <option value="__ADD_NEW__" className="font-bold text-slate-900">
                    + Add new type...
                  </option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60"/>
              </div>
            )}
          </div>

          {/* 3. Link of the project */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Project Link (URL)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Globe className="w-3.5 h-3.5"/>
                </div>
                <input
                  id="project-link-input"
                  type="text"
                  disabled={isSaving}
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="e.g. https://myproject.web.app or github.io/repo"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl text-xs text-slate-900 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              {link.trim() && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleTestLink}
                  className="px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Test open URL in new tab"
                >
                  <ExternalLink className="w-3 h-3"/>
                  <span>TEST</span>
                </button>
              )}
            </div>
          </div>

          {/* Row: 4. Live or not & 5. Date of Deployment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Live or Not Toggle */}
            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Live Status
                </span>
                <span className="text-[11px] text-slate-500">
                  {isLive ? 'Online & public' : 'Offline / local'}
                </span>
              </div>
              <button
                type="button"
                id="modal-live-toggle"
                disabled={isSaving}
                onClick={() => setIsLive(!isLive)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border border-slate-900 transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-60 disabled:cursor-not-allowed ${
                  isLive ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                    isLive ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Date of Deployment/Development */}
            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Deployment Date
                </label>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSetToday}
                  className="text-[10px] font-bold text-slate-900 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Today
                </button>
              </div>
              <input
                id="project-date-input"
                type="date"
                disabled={isSaving}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2 py-1 bg-transparent border-0 text-xs text-slate-900 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

          </div>

          {/* 6. Status (Active, In progress, Inactive) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Status <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Completed', 'In progress', 'Inactive'].map((st) => {
                const isSelected = status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    disabled={isSaving}
                    onClick={() => setStatus(st)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold uppercase border transition-all text-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Description (Optional) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Description <span className="text-slate-500 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              id="project-description-input"
              rows={2}
              disabled={isSaving}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this project do? Key highlights or features..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl text-xs text-slate-900 transition-all outline-none resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* 8. Tags (Optional) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Tags <span className="text-slate-500 font-normal lowercase">(comma-separated)</span>
            </label>
            <input
              type="text"
              disabled={isSaving}
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="React, TypeScript, Tailwind, Node, D3"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl text-xs text-slate-900 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
          
          {/* 9. Notes (Optional) */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Internal Notes <span className="text-slate-500 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              id="project-notes-input"
              rows={2}
              disabled={isSaving}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any private deployment notes or reminders..."
              className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl text-xs text-slate-900 transition-all outline-none resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3.5 py-1.5 text-xs font-bold uppercase text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              id="save-project-submit-btn"
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-bold uppercase text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-900 shadow-xs transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin"/>}
              {projectToEdit ? 'Save changes' : 'Add Project'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};