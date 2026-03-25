import { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, XCircle, Clock, AlertTriangle, FileText, Calendar } from 'lucide-react';
import { complianceApi } from '../services/api';

const DEMO_STATS = { total: 12, passed: 8, failed: 2, pending: 2, score: 75 };
const DEMO_CHECKS = [
  { id: 1, name: 'Environmental Impact Assessment', status: 'passed', category: 'environmental' },
  { id: 2, name: 'Marine Protected Area Clearance', status: 'passed', category: 'environmental' },
  { id: 3, name: 'Coastal Construction Permit', status: 'passed', category: 'permits' },
  { id: 4, name: 'Species Disturbance Assessment', status: 'failed', category: 'environmental' },
  { id: 5, name: 'Water Quality Standards', status: 'passed', category: 'quality' },
  { id: 6, name: 'Structural Load Certification', status: 'passed', category: 'structural' },
  { id: 7, name: 'Invasive Species Risk Review', status: 'failed', category: 'environmental' },
  { id: 8, name: 'Sediment Runoff Plan', status: 'passed', category: 'environmental' },
  { id: 9, name: 'Noise Impact Study', status: 'passed', category: 'impact' },
  { id: 10, name: 'Community Consultation', status: 'passed', category: 'social' },
  { id: 11, name: 'Post-Installation Monitoring Plan', status: 'pending', category: 'monitoring' },
  { id: 12, name: 'Annual Reporting Schedule', status: 'pending', category: 'monitoring' },
];
const DEMO_DEADLINES = [
  { id: 1, title: 'Submit quarterly monitoring report', dueDate: '2026-04-15', status: 'upcoming', priority: 'high' },
  { id: 2, title: 'Renew coastal construction permit', dueDate: '2026-06-01', status: 'upcoming', priority: 'medium' },
  { id: 3, title: 'Annual species survey submission', dueDate: '2026-07-31', status: 'upcoming', priority: 'medium' },
  { id: 4, title: 'Water quality lab results', dueDate: '2026-03-31', status: 'overdue', priority: 'high' },
];

const STATUS_CONFIG = {
  passed: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Passed' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 border-red-200', label: 'Failed' },
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', label: 'Pending' },
};

const PRIORITY_COLOR = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
};

function ScoreGauge({ score }) {
  const color = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-500' : 'text-red-500';
  const ring = score >= 80 ? 'stroke-emerald-500' : score >= 60 ? 'stroke-amber-400' : 'stroke-red-400';
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" className="stroke-slate-200" strokeWidth="7" />
        <circle
          cx="40" cy="40" r="36" fill="none"
          className={ring} strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <span className={`text-xl font-bold ${color}`}>{score}</span>
        <span className="text-xs text-slate-400 block -mt-1">/ 100</span>
      </div>
    </div>
  );
}

export default function Compliance() {
  const [stats, setStats] = useState(null);
  const [checks, setChecks] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      complianceApi.stats().catch(() => DEMO_STATS),
      complianceApi.checks().catch(() => DEMO_CHECKS),
      complianceApi.deadlines().catch(() => DEMO_DEADLINES),
    ]).then(([s, c, d]) => {
      setStats(s);
      setChecks(c);
      setDeadlines(d);
    }).finally(() => setLoading(false));
  }, []);

  const filteredChecks = activeFilter === 'all'
    ? checks
    : checks.filter(c => c.status === activeFilter);

  const overdue = deadlines.filter(d => d.status === 'overdue');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-sky-100 rounded-lg">
          <ShieldCheck size={22} className="text-sky-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance Checklist</h1>
          <p className="text-sm text-slate-500">Track regulatory requirements and permit status</p>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Overdue items require attention</p>
            <ul className="mt-1 space-y-0.5">
              {overdue.map(d => (
                <li key={d.id} className="text-xs text-red-600">{d.title} — due {d.dueDate}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Score gauge */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center">
          {loading ? (
            <div className="w-24 h-24 bg-slate-100 rounded-full animate-pulse" />
          ) : (
            <ScoreGauge score={stats?.score ?? 0} />
          )}
          <p className="mt-2 text-sm font-medium text-slate-700">Compliance Score</p>
        </div>

        {/* Stats */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Check Summary</h2>
          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Passed', value: stats?.passed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Failed', value: stats?.failed, color: 'text-red-500', bg: 'bg-red-50' },
                { label: 'Pending', value: stats?.pending, color: 'text-amber-500', bg: 'bg-amber-50' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-slate-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Checks list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <FileText size={15} /> Compliance Checks
            </h2>
            <div className="flex gap-1">
              {['all', 'passed', 'failed', 'pending'].map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors capitalize ${activeFilter === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {loading
              ? [...Array(6)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)
              : filteredChecks.map(check => {
                  const cfg = STATUS_CONFIG[check.status];
                  const Icon = cfg.icon;
                  return (
                    <div key={check.id} className={`flex items-center gap-3 border ${cfg.bg} rounded-xl px-4 py-3`}>
                      <Icon size={16} className={cfg.color} />
                      <span className="text-sm text-slate-800 flex-1">{check.name}</span>
                      <span className="text-xs text-slate-400 capitalize">{check.category}</span>
                    </div>
                  );
                })
            }
          </div>
        </div>

        {/* Deadlines */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <Calendar size={15} /> Upcoming Deadlines
          </h2>
          <div className="space-y-2">
            {loading
              ? [...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)
              : deadlines.map(d => (
                  <div key={d.id} className={`border rounded-xl p-3 ${d.status === 'overdue' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-medium text-slate-800 leading-tight">{d.title}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${PRIORITY_COLOR[d.priority]}`}>
                        {d.priority}
                      </span>
                    </div>
                    <p className={`text-xs ${d.status === 'overdue' ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                      {d.status === 'overdue' ? 'Overdue: ' : 'Due: '}{d.dueDate}
                    </p>
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
