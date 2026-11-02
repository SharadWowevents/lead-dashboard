import React, { useState, useEffect } from 'react';
import {
  X,
  Eye,
  Copy,
  Check,
  Compass,
  Anchor,
  FileText,
  Code2,
  Calendar,
  Mail,
  Phone,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers,
  Quote,
} from 'lucide-react';

interface AvatarDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatar: any | null;
  userInfo?: {
    name?: string;
    email?: string;
    mobile?: string;
    userId?: string;
  };
}

export const AvatarDossierModal: React.FC<AvatarDossierModalProps> = ({
  isOpen,
  onClose,
  avatar,
  userInfo,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'lifeboat' | 'yacht' | 'bridge' | 'inputs' | 'raw'>('overview');
  const [copiedJson, setCopiedJson] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !avatar) return null;

  const output = avatar.output || {};
  const lifeboat = output.lifeboat || {};
  const yacht = output.yacht || {};
  const bridge = output.bridge || {};
  const inputs = avatar.inputs || {};

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(avatar, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const formatDate = (val: any) => {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d.getTime()) ? String(val) : d.toLocaleString();
  };

  const renderList = (items: any) => {
    if (!items) return <p className="text-slate-400 italic text-xs">None listed</p>;
    const arr = Array.isArray(items) ? items : [items];
    if (arr.length === 0) return <p className="text-slate-400 italic text-xs">None listed</p>;
    return (
      <ul className="space-y-1.5">
        {arr.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
            <span>{String(item)}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                Avatar Dossier
              </span>
              {Boolean(avatar.isExample) && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-amber-100 text-amber-800">
                  Example
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 truncate">
              {avatar.title || 'Untitled Avatar Dossier'}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
              {userInfo?.name && (
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {userInfo.name}
                </span>
              )}
              {userInfo?.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {userInfo.email}
                </span>
              )}
              {avatar.createdAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Created: {formatDate(avatar.createdAt)}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer shrink-0"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-6 border-b border-slate-200 bg-white overflow-x-auto text-xs font-semibold">
          {[
            { id: 'overview', label: 'Overview', icon: Sparkles },
            { id: 'lifeboat', label: 'Lifeboat Persona', icon: Anchor },
            { id: 'yacht', label: 'Yacht Persona', icon: Compass },
            { id: 'bridge', label: 'Bridge & Offer', icon: Layers },
            { id: 'inputs', label: 'User Inputs', icon: FileText },
            { id: 'raw', label: 'Raw JSON', icon: Code2 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-3 px-3 border-b-2 whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/40 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Headline Banner */}
              {bridge.headline && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-100 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                    Bridge Headline
                  </span>
                  <h3 className="text-base sm:text-lg font-bold mt-1 text-white leading-snug">
                    {bridge.headline}
                  </h3>
                  {bridge.message && (
                    <p className="mt-2 text-xs sm:text-sm text-indigo-100/90 italic">
                      “{bridge.message}”
                    </p>
                  )}
                </div>
              )}

              {/* Side-by-side Persona Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lifeboat Quick Card */}
                <div className="p-5 rounded-2xl bg-white border border-rose-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-rose-50 text-rose-700 border border-rose-200">
                        Current State (Lifeboat)
                      </span>
                      <span className="text-2xl">{lifeboat.emoji || '🆘'}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-2">
                      {lifeboat.characterName || 'Lifeboat Persona'}
                    </h4>
                    {lifeboat.animal && (
                      <p className="text-xs text-slate-500 font-medium">Archetype: {lifeboat.animal}</p>
                    )}
                    {lifeboat.tagline && (
                      <blockquote className="mt-3 p-3 bg-rose-50/50 rounded-xl border-l-4 border-rose-400 text-xs text-rose-900 italic">
                        “{lifeboat.tagline}”
                      </blockquote>
                    )}
                    {lifeboat.currentState && (
                      <div className="mt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Current Situation:
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed">{lifeboat.currentState}</p>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('lifeboat')}
                    className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-rose-700 hover:text-rose-900 cursor-pointer"
                  >
                    <span>View full Lifeboat persona</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Yacht Quick Card */}
                <div className="p-5 rounded-2xl bg-white border border-emerald-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Desired State (Yacht)
                      </span>
                      <span className="text-2xl">{yacht.emoji || '⛵'}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-2">
                      {yacht.characterName || 'Yacht Persona'}
                    </h4>
                    {yacht.animal && (
                      <p className="text-xs text-slate-500 font-medium">Archetype: {yacht.animal}</p>
                    )}
                    {yacht.tagline && (
                      <blockquote className="mt-3 p-3 bg-emerald-50/50 rounded-xl border-l-4 border-emerald-400 text-xs text-emerald-900 italic">
                        “{yacht.tagline}”
                      </blockquote>
                    )}
                    {yacht.desiredState && (
                      <div className="mt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Ideal Outcome:
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed">{yacht.desiredState}</p>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('yacht')}
                    className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    <span>View full Yacht persona</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Offer Summary */}
              {(bridge.lifeboatOffer || bridge.yachtOffer) && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Transformation Offers
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bridge.lifeboatOffer && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[11px] font-bold text-rose-700 uppercase">Emergency Solution (Lifeboat)</span>
                        <p className="text-xs text-slate-800 mt-1 font-medium">{bridge.lifeboatOffer}</p>
                      </div>
                    )}
                    {bridge.yachtOffer && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[11px] font-bold text-emerald-700 uppercase">Ultimate Transformation (Yacht)</span>
                        <p className="text-xs text-slate-800 mt-1 font-medium">{bridge.yachtOffer}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIFEBOAT PERSONA */}
          {activeTab === 'lifeboat' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 rounded-xl bg-rose-50 border border-rose-100">
                    {lifeboat.emoji || '🐙'}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{lifeboat.characterName || 'Lifeboat Persona'}</h3>
                    <p className="text-xs text-rose-700 font-semibold">Animal Archetype: {lifeboat.animal || 'Not specified'}</p>
                  </div>
                </div>

                {lifeboat.tagline && (
                  <blockquote className="mt-4 p-3.5 bg-rose-50/70 rounded-xl border-l-4 border-rose-500 text-sm text-rose-950 font-medium italic">
                    “{lifeboat.tagline}”
                  </blockquote>
                )}

                {lifeboat.whyAnimal && (
                  <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                    <strong className="text-slate-900 font-semibold block mb-1">Why this animal archetype?</strong>
                    {lifeboat.whyAnimal}
                  </div>
                )}
              </div>

              {/* State & Stage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block mb-1.5">
                    Current Frustrations & State
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed">{lifeboat.currentState || '—'}</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Current Journey Stage
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-semibold">{lifeboat.stage || '—'}</p>
                </div>
              </div>

              {/* Pain points & Wants */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5 mb-2.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Key Pain Points
                  </span>
                  {renderList(lifeboat.painPoints)}
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5 mb-2.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Urgent Wants & Needs
                  </span>
                  {renderList(lifeboat.wants)}
                </div>
              </div>

              {/* Buying behaviour & next steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Buying Behaviour
                  </span>
                  {renderList(lifeboat.buyingBehaviour)}
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Next Action Steps
                  </span>
                  {renderList(lifeboat.nextSteps)}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: YACHT PERSONA */}
          {activeTab === 'yacht' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                    {yacht.emoji || '⛵'}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{yacht.characterName || 'Yacht Persona'}</h3>
                    <p className="text-xs text-emerald-700 font-semibold">Animal Archetype: {yacht.animal || 'Not specified'}</p>
                  </div>
                </div>

                {yacht.tagline && (
                  <blockquote className="mt-4 p-3.5 bg-emerald-50/70 rounded-xl border-l-4 border-emerald-500 text-sm text-emerald-950 font-medium italic">
                    “{yacht.tagline}”
                  </blockquote>
                )}

                {yacht.whyAnimal && (
                  <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                    <strong className="text-slate-900 font-semibold block mb-1">Why this animal archetype?</strong>
                    {yacht.whyAnimal}
                  </div>
                )}
              </div>

              {/* Desired State & Stage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1.5">
                    Dream State & Lifestyle
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed">{yacht.desiredState || '—'}</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Aspirational Stage
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-semibold">{yacht.stage || '—'}</p>
                </div>
              </div>

              {/* Wants & Next Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 mb-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Ultimate Desires & Aspirations
                  </span>
                  {renderList(yacht.wants)}
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Future Milestones / Next Steps
                  </span>
                  {renderList(yacht.nextSteps)}
                </div>
              </div>

              {/* Buying behaviour */}
              {yacht.buyingBehaviour && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Transformed Buying Behaviour
                  </span>
                  {renderList(yacht.buyingBehaviour)}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BRIDGE & STRATEGY */}
          {activeTab === 'bridge' && (
            <div className="space-y-4">
              {/* Headline */}
              <div className="p-5 rounded-2xl bg-white border border-indigo-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                  Core Campaign Headline
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {bridge.headline || '—'}
                </h3>
                {bridge.message && (
                  <p className="mt-3 p-3 bg-indigo-50/60 rounded-xl text-xs text-indigo-950 italic">
                    “{bridge.message}”
                  </p>
                )}
              </div>

              {/* Two Offers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-rose-100 shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Anchor className="w-4 h-4 text-rose-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700">Lifeboat Offer</h4>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {bridge.lifeboatOffer || '—'}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-emerald-100 shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Compass className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700">Yacht Offer</h4>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {bridge.yachtOffer || '—'}
                  </p>
                </div>
              </div>

              {/* Journey Roadmap */}
              {Array.isArray(bridge.journey) && bridge.journey.length > 0 && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                    Transformation Journey Roadmap
                  </h4>
                  <div className="space-y-3">
                    {bridge.journey.map((step: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
                      >
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          {step.tag && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700 mb-1">
                              {step.tag}
                            </span>
                          )}
                          <p className="text-xs text-slate-800 leading-relaxed">{step.text || String(step)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: USER INPUTS BRIEF */}
          {activeTab === 'inputs' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900">
                These are the original brief answers submitted by the user to generate this Avatar Dossier.
              </div>

              {[
                { label: 'Introduction (Business Overview)', val: inputs.intro },
                { label: 'Ideal Client Profile (ICP)', val: inputs.icp },
                { label: 'Lifeboat Problem (Urgent Crisis)', val: inputs.life },
                { label: 'Yacht Goal (Ultimate Dream State)', val: inputs.yacht },
                { label: 'How the Solution Bridges Both', val: inputs.both },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block mb-1.5">
                    {item.label}
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {item.val || '—'}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: RAW JSON */}
          {activeTab === 'raw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Raw technical data object for developers:</span>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full JSON</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-auto max-h-[50vh] text-xs font-mono leading-relaxed">
                {JSON.stringify(avatar, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <span>Click anywhere outside or press Esc to close</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

