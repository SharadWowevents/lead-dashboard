import React, { useState } from 'react';
import { X, Send, Copy, Check, Terminal, Code2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface IngestTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadIngested?: () => void;
}

export const IngestTesterModal: React.FC<IngestTesterModalProps> = ({
  isOpen,
  onClose,
  onLeadIngested,
}) => {
  const [activeTab, setActiveTab] = useState<'tester' | 'snippets'>('tester');
  const [siteName, setSiteName] = useState('Campaign-Launch');
  const [name, setName] = useState('Alex Morgan');
  const [email, setEmail] = useState('alex.morgan@example.com');
  const [mobile, setMobile] = useState('+1 (555) 392-1044');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseLog, setResponseLog] = useState<{ success: boolean; data: any } | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://api.example.com';

  const curlSnippet = `curl -X POST ${currentOrigin}/api/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "siteName": "${siteName || 'My-Website'}",
    "name": "${name || 'Jane Doe'}",
    "email": "${email || 'jane@example.com'}",
    "mobile": "${mobile || '+15550001111'}"
  }'`;

  const jsFetchSnippet = `// In your frontend form submit handler:
async function submitLeadForm(formData) {
  try {
    const response = await fetch('${currentOrigin}/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteName: '${siteName || 'My-Website'}',
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
      }),
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('Lead captured in centralized admin!', result.data);
    }
  } catch (error) {
    console.error('Submission failed:', error);
  }
}`;

  const handleSubmitTestLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResponseLog(null);

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteName, name, email, mobile }),
      });

      const data = await response.json();
      setResponseLog({ success: response.ok && data.success, data });

      if (response.ok && data.success && onLeadIngested) {
        onLeadIngested();
      }
    } catch (err: any) {
      setResponseLog({
        success: false,
        data: { message: err.message || 'Failed to dispatch request' },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <div
      id="ingest-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        id="ingest-modal-card"
        className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Lead Ingest API & Tester</h2>
              <p className="text-xs text-slate-500">
                Endpoint: <code className="font-mono text-indigo-600 font-semibold">POST /api/ingest</code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-100 mt-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('tester')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'tester'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Interactive Ingest Tester
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('snippets')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'snippets'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Integration Code Snippets
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto py-4 space-y-4 flex-1">
          {activeTab === 'tester' ? (
            <div>
              <p className="text-xs text-slate-600 mb-3">
                Simulate an incoming lead sent from any of your other websites or landing pages:
              </p>

              <form onSubmit={handleSubmitTestLead} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Project Identifier (siteName)
                    </label>
                    <input
                      type="text"
                      required
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="e.g. Landing-Page-Beta"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Transmitting Lead...' : 'Submit Lead via POST /api/ingest'}</span>
                  </button>
                </div>
              </form>

              {/* Response Preview */}
              {responseLog && (
                <div className="mt-4 p-3 rounded-xl border bg-slate-900 text-slate-200 text-xs font-mono">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                      {responseLog.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                      )}
                      HTTP Response Status
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        responseLog.success
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {responseLog.success ? '201 CREATED' : 'ERROR'}
                    </span>
                  </div>
                  <pre className="overflow-x-auto text-[11px] text-slate-300">
                    {JSON.stringify(responseLog.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* cURL Snippet */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                    cURL Command
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(curlSnippet, 'curl')}
                    className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSnippet === 'curl' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedSnippet === 'curl' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto">
                  <pre>{curlSnippet}</pre>
                </div>
              </div>

              {/* JavaScript Fetch Snippet */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-slate-500" />
                    Frontend JavaScript (fetch)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(jsFetchSnippet, 'js')}
                    className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSnippet === 'js' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedSnippet === 'js' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto">
                  <pre>{jsFetchSnippet}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
