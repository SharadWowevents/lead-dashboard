import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Tag,
  Loader2 // <-- Added for loading states
} from 'lucide-react';
import { Project, ProjectTypeItem } from '../../types/projects.ts';
import { getTypeBadgeStyle } from '../../utils/projectsHelpers.ts';

interface ManageTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  types: ProjectTypeItem[];
  projects: Project[];
  // Updated to support async operations for backend calls
  onAddType: (name: string, color?: string) => Promise<void> | void;
  onDeleteType: (typeId: string, typeName: string) => Promise<void> | void;
}

export const ManageTypesModal: React.FC<ManageTypesModalProps> = ({
  isOpen,
  onClose,
  types,
  projects,
  onAddType,
  onDeleteType,
}) => {
  const [newTypeName, setNewTypeName] = useState('');
  const [error, setError] = useState('');
  
  // Backend request states
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTypeName.trim();
    if (!trimmed) {
      setError('Please enter a type name');
      return;
    }

    if (types.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`Type "${trimmed}" already exists`);
      return;
    }

    setIsAdding(true);
    setError('');

    try {
      await onAddType(trimmed);
      setNewTypeName('');
    } catch (err: any) {
      setError(err.message || 'Server error: Failed to add type');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteClick = async (typeId: string, typeName: string) => {
    setDeletingId(typeId);
    setError('');
    try {
      await onDeleteType(typeId, typeName);
    } catch (err: any) {
      setError(err.message || `Server error: Failed to delete "${typeName}"`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center">
              <Tag className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Project Types
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Manage Project Types
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isAdding || deletingId !== null}
            className="p-1 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          
          {/* Add New Type Section */}
          <form onSubmit={handleAddType} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Plus className="w-3 h-3 text-slate-900" />
              Add New Type
            </h3>
            
            {error && (
              <div className="text-rose-700 text-xs font-semibold bg-rose-50 p-1.5 border border-rose-200 rounded-xl">
                Error: {error}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => {
                  setNewTypeName(e.target.value);
                  if (error) setError('');
                }}
                disabled={isAdding}
                placeholder="Type name (e.g. AI Tool, Game, Micro-SaaS)..."
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl text-xs text-slate-900 outline-none disabled:bg-gray-100 disabled:text-gray-500"
              />
              <button
                type="submit"
                disabled={isAdding}
                className="px-3.5 py-1.5 flex items-center justify-center gap-1.5 w-20 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-900 transition-colors cursor-pointer shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add'}
              </button>
            </div>
          </form>

          {/* Existing Types List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Project Types ({types.length})
              </span>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-slate-50">
              {types.map((typeItem) => {
                const badgeStyle = getTypeBadgeStyle(typeItem.name);
                const count = projects.filter((p) => p.type === typeItem.name).length;
                const isDefault = Boolean(typeItem.isDefault);
                const isDeletingThis = deletingId === typeItem.id;

                return (
                  <div 
                    key={typeItem.id}
                    className={`px-3 py-2 bg-white hover:bg-white/30 flex items-center justify-between transition-colors text-xs ${isDeletingThis ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${badgeStyle.dot}`} />
                      <span className="font-semibold text-slate-900">
                        {typeItem.name}
                      </span>
                      {isDefault && (
                        <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1 py-0.2 rounded-xl">
                          Default
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500">
                        {count.toString().padStart(2, '0')} {count === 1 ? 'proj' : 'projs'}
                      </span>
                      
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(typeItem.id, typeItem.name)}
                          disabled={isDeletingThis}
                          title={`Delete type "${typeItem.name}"`}
                          className="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isDeletingThis ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-slate-200 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isAdding || deletingId !== null}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};