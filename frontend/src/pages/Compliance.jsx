import { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, Shield, AlertTriangle, CheckCircle2, Circle, Ban, Loader2, RefreshCw, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';
import { complianceApi } from '../services/api';
import { useProjects } from '../context/ProjectContext';

const STATUS_CONFIG = {
  pending:       { label: 'Pending',       icon: Circle,        color: 'text-slate-400', bg: 'bg-slate-100', ring: 'ring-slate-300' },
  compliant:     { label: 'Compliant',     icon: CheckCircle2,  color: 'text-eco-green-600', bg: 'bg-eco-green-50', ring: 'ring-eco-green-300' },
  non_compliant: { label: 'Non-Compliant', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-300' },
  waived:        { label: 'Waived',        icon: Ban,           color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-300' },
};

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'text-red-700', bg: 'bg-red-100' },
  high:     { label: 'High',     color: 'text-orange-700', bg: 'bg-orange-100' },
  medium:   { label: 'Medium',   color: 'text-yellow-700', bg: 'bg-yellow-100' },
  low:      { label: 'Low',      color: 'text-slate-600', bg: 'bg-slate-100' },
};

const CATEGORY_LABELS = {
  environmental: 'Environmental',
  structural: 'Structural',
  permits: 'Permits & Licensing',
  monitoring: 'Monitoring',
  safety: 'Safety',
};

export default function Compliance() {
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [notesEditId, setNotesEditId] = useState(null);
  const [notesValue, setNotesValue] = useState('');

  const activeProjects = projects.filter(p => p.status !== 'archived');
  const selectedProject = projects.find(p => String(p.id) === String(selectedProjectId));

  const loadChecks = useCallback(async (projectId) => {
    if (!projectId) { setChecks([]); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await complianceApi.listForProject(projectId);
      setChecks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadChecks(selectedProjectId); }, [selectedProjectId, loadChecks]);

  const handleProjectChange = (e) => {
    setSelectedProjectId(e.target.value);
    setNotesEditId(null);
  };

  const handleGenerate = async () => {
    if (!selectedProjectId) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await complianceApi.generate(selectedProjectId);
      setChecks(result.checks);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (checkId, newStatus) => {
    setError(null);
    try {
      const updated = await complianceApi.updateStatus(checkId, { status: newStatus });
      setChecks(prev => prev.map(c => c.id === checkId ? updated : c));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveNotes = async (checkId) => {
    setError(null);
    try {
      const check = checks.find(c => c.id === checkId);
      const updated = await complianceApi.updateStatus(checkId, { status: check.status, notes: notesValue });
      setChecks(prev => prev.map(c => c.id === checkId ? updated : c));
      setNotesEditId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedProjectId) return;
    setGenerating(true);
    setError(null);
    try {
      await complianceApi.resetProject(selectedProjectId);
      const result = await complianceApi.generate(selectedProjectId);
      setChecks(result.checks);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const toggleCategory = (cat) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Group checks by category
  const checksByCategory = checks.reduce((acc, check) => {
    const cat = check.category || 'other';
    (acc[cat] = acc[cat] || []).push(check);
    return acc;
  }, {});

  // Progress stats
  const total = checks.length;
  const compliant = checks.filter(c => c.status === 'compliant').length;
  const nonCompliant = checks.filter(c => c.status === 'non_compliant').length;
  const waived = checks.filter(c => c.status === 'waived').length;
  const pending = checks.filter(c => c.status === 'pending').length;
  const progressPct = total > 0 ? Math.round(((compliant + waived) / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance Checklist</h1>
          <p className="text-slate-500 text-sm mt-1">Track regulatory requirements for your project</p>
        </div>
      </div>

      {/* Project Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-1">Select Project</label>
        <select
          value={selectedProjectId}
          onChange={handleProjectChange}
          className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
        >
          <option value="">Choose a project...</option>
          {activeProjects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {selectedProject && (
          <p className="text-xs text-slate-400 mt-1">
            Jurisdiction: <span className="font-medium text-slate-600">{selectedProject.jurisdiction || 'Not set'}</span>
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">{error}</div>
      )}

      {!selectedProjectId ? (
        <div className="text-center py-16 text-slate-400">
          Select a project above to view its compliance checklist.
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="animate-spin text-eco-blue-600" size={24} />
        </div>
      ) : checks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <ClipboardCheck size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Checklist Generated</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            Generate a compliance checklist based on your project's jurisdiction. Universal rules
            and jurisdiction-specific regulations will be automatically added.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedProject?.jurisdiction}
            className="inline-flex items-center gap-2 px-4 py-2 bg-eco-blue-600 text-white rounded-lg text-sm font-medium hover:bg-eco-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
            Generate Checklist
          </button>
          {!selectedProject?.jurisdiction && (
            <p className="text-xs text-amber-600 mt-3">⚠ Set a jurisdiction on this project first (via Project Wizard).</p>
          )}
        </div>
      ) : (
        <>
          {/* Progress bar + stats */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Shield size={18} /> Compliance Progress
              </h2>
              <button
                onClick={handleRegenerate}
                disabled={generating}
                className="text-xs text-slate-500 hover:text-eco-blue-600 flex items-center gap-1 transition-colors"
                title="Reset and regenerate checklist"
              >
                <RefreshCw size={12} className={generating ? 'animate-spin' : ''} /> Regenerate
              </button>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 mb-3">
              <div
                className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-eco-green-400 to-eco-green-600"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-eco-green-500" /> {compliant} Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> {nonCompliant} Non-Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> {waived} Waived
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> {pending} Pending
              </span>
              <span className="ml-auto font-semibold text-slate-700">{progressPct}% Complete</span>
            </div>
          </div>

          {/* Checklist by category */}
          <div className="space-y-4">
            {Object.entries(checksByCategory).map(([category, items]) => {
              const catCompliant = items.filter(c => c.status === 'compliant' || c.status === 'waived').length;
              const collapsed = collapsedCategories[category];

              return (
                <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {collapsed ? <ChevronRight size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                      <h3 className="font-semibold text-slate-800">{CATEGORY_LABELS[category] || category}</h3>
                      <span className="text-xs text-slate-400">{catCompliant}/{items.length} complete</span>
                    </div>
                  </button>

                  {!collapsed && (
                    <div className="border-t border-slate-100">
                      {items.map(check => {
                        const statusCfg = STATUS_CONFIG[check.status];
                        const priorityCfg = PRIORITY_CONFIG[check.priority];
                        const StatusIcon = statusCfg.icon;

                        return (
                          <div key={check.id} className="flex items-start gap-3 p-4 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50">
                            {/* Status dropdown */}
                            <div className="pt-0.5">
                              <StatusIcon size={20} className={statusCfg.color} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-mono text-slate-400">{check.rule_code}</span>
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${priorityCfg.bg} ${priorityCfg.color}`}>
                                  {priorityCfg.label}
                                </span>
                              </div>
                              <h4 className="text-sm font-medium text-slate-800">{check.rule_name}</h4>
                              {check.rule_description && (
                                <p className="text-xs text-slate-500 mt-0.5">{check.rule_description}</p>
                              )}

                              {/* Notes */}
                              {notesEditId === check.id ? (
                                <div className="mt-2 flex gap-2">
                                  <input
                                    type="text"
                                    value={notesValue}
                                    onChange={(e) => setNotesValue(e.target.value)}
                                    placeholder="Add a note..."
                                    className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-eco-blue-500"
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNotes(check.id); if (e.key === 'Escape') setNotesEditId(null); }}
                                    autoFocus
                                  />
                                  <button onClick={() => handleSaveNotes(check.id)} className="text-xs text-eco-blue-600 hover:underline">Save</button>
                                  <button onClick={() => setNotesEditId(null)} className="text-xs text-slate-400 hover:underline">Cancel</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setNotesEditId(check.id); setNotesValue(check.notes || ''); }}
                                  className="mt-1 flex items-center gap-1 text-xs text-slate-400 hover:text-eco-blue-600 transition-colors"
                                >
                                  <MessageSquare size={10} />
                                  {check.notes || 'Add note'}
                                </button>
                              )}
                            </div>

                            {/* Status selector */}
                            <select
                              value={check.status}
                              onChange={(e) => handleStatusChange(check.id, e.target.value)}
                              className={`text-xs font-medium px-2 py-1 rounded-lg border-0 ring-1 ${statusCfg.ring} ${statusCfg.bg} ${statusCfg.color} cursor-pointer focus:outline-none focus:ring-2 focus:ring-eco-blue-500`}
                            >
                              <option value="pending">Pending</option>
                              <option value="compliant">Compliant</option>
                              <option value="non_compliant">Non-Compliant</option>
                              <option value="waived">Waived</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
