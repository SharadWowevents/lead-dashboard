import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  FileJson, 
  Check, 
  AlertCircle,
  Loader2 // <-- Added for loading state
} from 'lucide-react';
import { Project, ProjectTypeItem } from '../../types/projects.ts';
import { exportProjectsToCSV, exportProjectsToJSON } from '../../utils/projectsHelpers.ts';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  types: ProjectTypeItem[];
  // Updated to support an async backend call
  onImportData: (importedProjects: Project[], importedTypes?: ProjectTypeItem[], replaceExisting?: boolean) => Promise<void> | void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  projects,
  types,
  onImportData,
}) => {
  const [importJsonText, setImportJsonText] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false); // <-- Track backend request state

  if (!isOpen) return null;

  // Exports can remain synchronous since they just format the data already loaded in the frontend
  const handleExportCSV = () => {
    exportProjectsToCSV(projects);
  };

  const handleExportJSON = () => {
    exportProjectsToJSON(projects, types);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setImportJsonText(text);
        setError('');
      } catch (err) {
        setError('Failed to read file.');
      }
    };
    reader.readAsText(file);
  };

  const handleProcessImport = async () => {
    if (!importJsonText.trim()) {
      setError('Please paste JSON data or select a file.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      const parsed = JSON.parse(importJsonText);
      let incomingProjects: Project[] = [];
      let incomingTypes: ProjectTypeItem[] | undefined;

      if (Array.isArray(parsed)) {
        incomingProjects = parsed;
      } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.projects)) {
        incomingProjects = parsed.projects;
        if (Array.isArray(parsed.types)) {
          incomingTypes = parsed.types;
        }
      } else {
        throw new Error('Invalid format. Expected JSON array of projects or backup object with projects array.');
      }

      if (incomingProjects.length === 0) {
        throw new Error('No projects found in the provided JSON.');
      }

      // Await the backend API call from the parent
      await onImportData(incomingProjects, incomingTypes, replaceExisting);
      
      setSuccess(`Successfully imported ${incomingProjects.length} projects!`);
      setTimeout(() => {
        onClose();
        // Reset state after closing
        setTimeout(() => {
          setSuccess('');
          setImportJsonText('');
        }, 200);
      }, 1500);

    } catch (err: any) {
      setError(`Import error: ${err.message || 'Malformed JSON or Server Error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center">
              <Download className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Export & Import
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Export / Import Data
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          
          {/* Export Section */}
          <div className={isProcessing ? 'opacity-50 pointer-events-none' : ''}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Export Data ({projects.length} RECORDS TOTAL)
            </h3>
            
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExportCSV}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-900 hover:bg-white text-left transition-all group flex flex-col justify-between cursor-pointer"
              >
                <div className="w-6 h-6 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center mb-2">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900 uppercase">
                    Export as CSV
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Open in Sheets or Excel
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-900 hover:bg-white text-left transition-all group flex flex-col justify-between cursor-pointer"
              >
                <div className="w-6 h-6 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center mb-2">
                  <FileJson className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900 uppercase">
                    Export as JSON
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Full backup including project types
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="border-t border-slate-200 pt-4 space-y-2.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Import Data
            </h3>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Upload Export as JSON File:
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="block w-full text-xs text-slate-700 file:mr-3 file:py-1 file:px-2.5 file:rounded-xl file:border file:border-slate-300 file:text-[11px] file:file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Or paste the JSON data:
              </label>
              <textarea
                rows={3}
                value={importJsonText}
                disabled={isProcessing}
                onChange={(e) => {
                  setImportJsonText(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Paste projects JSON array or backup payload..."
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-900 disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="replace-existing-checkbox"
                checked={replaceExisting}
                disabled={isProcessing}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="accent-slate-900 disabled:opacity-50"
              />
              <label htmlFor="replace-existing-checkbox" className={`text-xs ${isProcessing ? 'text-slate-400' : 'text-slate-700'}`}>
                Replace all existing projects (leave unchecked to add to existing)
              </label>
            </div>

            <button
              type="button"
              onClick={handleProcessImport}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-900 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Import Data</span>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};