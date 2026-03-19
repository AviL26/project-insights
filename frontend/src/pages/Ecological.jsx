import { useState, useEffect, useCallback } from 'react';
import { Leaf, TrendingUp, Plus, Trash2, Calendar, Loader2, ChevronDown, ChevronRight, BarChart3, ClipboardList } from 'lucide-react';
import { ecologicalApi } from '../services/api';
import { useProjects } from '../context/ProjectContext';

const CATEGORY_CONFIG = {
  biodiversity:  { label: 'Biodiversity',   color: '#16a34a', bg: 'bg-green-50',  text: 'text-green-700',  bar: 'bg-green-500' },
  habitat:       { label: 'Habitat',        color: '#0284c7', bg: 'bg-sky-50',    text: 'text-sky-700',    bar: 'bg-sky-500' },
  water_quality: { label: 'Water Quality',  color: '#2563eb', bg: 'bg-blue-50',   text: 'text-blue-700',   bar: 'bg-blue-500' },
  structural:    { label: 'Structural',     color: '#9333ea', bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500' },
  community:     { label: 'Community',      color: '#ea580c', bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500' },
};

function scoreColor(score) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function scoreBg(score) {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

export default function Ecological() {
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedSurveys, setExpandedSurveys] = useState({});

  const activeProjects = projects.filter(p => p.status !== 'archived');

  const loadDashboard = useCallback(async (projectId) => {
    if (!projectId) { setDashboard(null); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await ecologicalApi.dashboard(projectId);
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(selectedProjectId); }, [selectedProjectId, loadDashboard]);

  const handleProjectChange = (e) => {
    setSelectedProjectId(e.target.value);
    setShowForm(false);
  };

  const handleSurveyCreated = () => {
    setShowForm(false);
    loadDashboard(selectedProjectId);
  };

  const handleDeleteSurvey = async (surveyId) => {
    try {
      await ecologicalApi.deleteSurvey(surveyId);
      loadDashboard(selectedProjectId);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleSurvey = (id) => {
    setExpandedSurveys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const hasSurveys = dashboard?.surveys?.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ecological Scoring</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor environmental performance of your projects</p>
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
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">{error}</div>
      )}

      {!selectedProjectId ? (
        <div className="text-center py-16 text-slate-400">
          Select a project above to view its ecological scores.
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="animate-spin text-eco-blue-600" size={24} />
        </div>
      ) : !hasSurveys && !showForm ? (
        <EmptyState onRecord={() => setShowForm(true)} />
      ) : (
        <>
          {/* Dashboard grid */}
          {hasSurveys && (
            <div className="space-y-6 mb-6">
              {/* Top row: Overall Score + Category Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <OverallScoreCard score={dashboard.overallScore} />
                <CategoryBreakdown scores={dashboard.categoryScores} />
              </div>

              {/* Trend chart */}
              {dashboard.trend?.length > 1 && (
                <TrendChart data={dashboard.trend} />
              )}

              {/* Latest readings */}
              {dashboard.latestReadings && (
                <LatestReadings readings={dashboard.latestReadings} />
              )}
            </div>
          )}

          {/* Record new survey */}
          {showForm ? (
            <SurveyForm
              projectId={selectedProjectId}
              metrics={dashboard?.metrics || []}
              onCreated={handleSurveyCreated}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-eco-blue-600 text-white rounded-lg text-sm font-medium hover:bg-eco-blue-700 transition-colors mb-6"
            >
              <Plus size={16} /> Record New Survey
            </button>
          )}

          {/* Survey history */}
          {hasSurveys && (
            <SurveyHistory
              surveys={dashboard.surveys}
              expanded={expandedSurveys}
              onToggle={toggleSurvey}
              onDelete={handleDeleteSurvey}
            />
          )}
        </>
      )}
    </div>
  );
}

/* --- Sub-components --- */

function EmptyState({ onRecord }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <Leaf size={48} className="mx-auto text-slate-300 mb-4" />
      <h3 className="text-lg font-semibold text-slate-700 mb-2">No Ecological Data Yet</h3>
      <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
        Record your first ecological survey to start tracking biodiversity, habitat quality,
        water conditions, and more.
      </p>
      <button
        onClick={onRecord}
        className="inline-flex items-center gap-2 px-4 py-2 bg-eco-green-600 text-white rounded-lg text-sm font-medium hover:bg-eco-green-700 transition-colors"
      >
        <ClipboardList size={16} /> Record First Survey
      </button>
    </div>
  );
}

function OverallScoreCard({ score }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center">
      <h3 className="text-sm font-medium text-slate-500 mb-4">Overall Eco-Score</h3>
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={score >= 80 ? '#16a34a' : score >= 60 ? '#ca8a04' : score >= 40 ? '#ea580c' : '#dc2626'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-3xl font-bold ${scoreColor(score)}`}>{score}</span>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-2">out of 100</p>
    </div>
  );
}

function CategoryBreakdown({ scores }) {
  if (!scores) return null;
  const categories = Object.entries(scores);

  return (
    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-medium text-slate-500 mb-4 flex items-center gap-2">
        <BarChart3 size={16} /> Category Scores
      </h3>
      <div className="space-y-4">
        {categories.map(([cat, score]) => {
          const cfg = CATEGORY_CONFIG[cat] || { label: cat, bar: 'bg-slate-500', text: 'text-slate-700' };
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">{cfg.label}</span>
                <span className={`text-sm font-semibold ${scoreColor(score)}`}>{score}/100</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-700 ${cfg.bar}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrendChart({ data }) {
  const maxScore = 100;
  const chartHeight = 120;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-medium text-slate-500 mb-4 flex items-center gap-2">
        <TrendingUp size={16} /> Score Trend
      </h3>
      <div className="flex items-end gap-2" style={{ height: chartHeight }}>
        {data.map((point, i) => {
          const height = (point.score / maxScore) * chartHeight;
          return (
            <div key={point.survey_id} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-semibold text-slate-600">{point.score}</span>
              <div
                className={`w-full rounded-t-md transition-all duration-500 ${scoreBg(point.score)}`}
                style={{ height: Math.max(4, height) }}
                title={`${point.date}: ${point.score}/100`}
              />
              <span className="text-[10px] text-slate-400 truncate w-full text-center">
                {new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LatestReadings({ readings }) {
  const grouped = readings.reduce((acc, r) => {
    (acc[r.category] = acc[r.category] || []).push(r);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-medium text-slate-500 mb-4">Latest Readings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(grouped).map(([cat, items]) => {
          const cfg = CATEGORY_CONFIG[cat] || { label: cat, bg: 'bg-slate-50', text: 'text-slate-700' };
          return (
            <div key={cat} className={`${cfg.bg} rounded-lg p-3`}>
              <h4 className={`text-xs font-semibold ${cfg.text} uppercase tracking-wider mb-2`}>{cfg.label}</h4>
              <div className="space-y-1.5">
                {items.map(r => (
                  <div key={r.id} className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 truncate mr-2">{r.name}</span>
                    <span className="text-xs font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {r.value} <span className="text-slate-400 font-normal">{r.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SurveyForm({ projectId, metrics, onCreated, onCancel }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [surveyor, setSurveyor] = useState('');
  const [notes, setNotes] = useState('');
  const [readings, setReadings] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const metricsByCategory = metrics.reduce((acc, m) => {
    (acc[m.category] = acc[m.category] || []).push(m);
    return acc;
  }, {});

  const handleReadingChange = (metricId, value) => {
    setReadings(prev => ({ ...prev, [metricId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const readingList = Object.entries(readings)
      .filter(([, val]) => val !== '' && val !== undefined)
      .map(([metricId, value]) => ({
        metric_id: parseInt(metricId),
        value: parseFloat(value),
        notes: '',
      }));

    if (readingList.length === 0) {
      setFormError('Enter at least one metric reading.');
      return;
    }

    setSubmitting(true);
    try {
      await ecologicalApi.createSurvey({
        project_id: parseInt(projectId),
        survey_date: date,
        surveyor,
        notes,
        readings: readingList,
      });
      onCreated();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <ClipboardList size={18} /> Record Ecological Survey
      </h3>

      {formError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">{formError}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Survey Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Surveyor</label>
          <input type="text" value={surveyor} onChange={e => setSurveyor(e.target.value)} placeholder="Name"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500" />
        </div>
      </div>

      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Metric Readings</h4>
      <div className="space-y-4 mb-6">
        {Object.entries(metricsByCategory).map(([cat, catMetrics]) => {
          const cfg = CATEGORY_CONFIG[cat] || { label: cat, bg: 'bg-slate-50', text: 'text-slate-700' };
          return (
            <div key={cat}>
              <h5 className={`text-xs font-semibold ${cfg.text} uppercase tracking-wider mb-2`}>{cfg.label}</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {catMetrics.map(m => (
                  <div key={m.id} className="flex items-center gap-2">
                    <label className="text-xs text-slate-600 flex-1 truncate" title={m.description}>{m.name}</label>
                    <input
                      type="number"
                      step="any"
                      value={readings[m.id] ?? ''}
                      onChange={e => handleReadingChange(m.id, e.target.value)}
                      placeholder={m.unit}
                      className="w-24 px-2 py-1.5 text-xs border border-slate-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-eco-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 w-12 truncate">{m.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-eco-green-600 text-white rounded-lg text-sm font-medium hover:bg-eco-green-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Save Survey
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

function SurveyHistory({ surveys, expanded, onToggle, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Calendar size={16} /> Survey History
        </h3>
      </div>
      {surveys.map(survey => (
        <div key={survey.id} className="border-b border-slate-100 last:border-b-0">
          <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
            <button
              onClick={() => onToggle(survey.id)}
              className="flex items-center gap-3 flex-1 text-left"
            >
              {expanded[survey.id] ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
              <div>
                <span className="text-sm font-medium text-slate-800">
                  {new Date(survey.survey_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                {survey.surveyor && <span className="text-xs text-slate-400 ml-2">by {survey.surveyor}</span>}
              </div>
            </button>
            <button
              onClick={() => onDelete(survey.id)}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
          {expanded[survey.id] && survey.readings && (
            <div className="px-4 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {survey.readings.map(r => (
                  <div key={r.id} className="text-xs bg-slate-50 rounded p-2">
                    <span className="text-slate-500">{r.name}</span>
                    <div className="font-mono font-semibold text-slate-800">{r.value} <span className="text-slate-400 font-normal">{r.unit}</span></div>
                  </div>
                ))}
              </div>
              {survey.notes && <p className="text-xs text-slate-500 mt-2 italic">{survey.notes}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
