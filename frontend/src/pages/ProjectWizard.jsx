import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { wizardApi } from '../services/api';
import { useProjects } from '../context/ProjectContext';

const STEPS = ['Details', 'Location', 'Structure', 'Goals', 'Review'];

export default function ProjectWizard() {
  const navigate = useNavigate();
  const { createProject } = useProjects();
  const [step, setStep] = useState(0);
  const [lookups, setLookups] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    country: '',
    region: '',
    latitude: '',
    longitude: '',
    structure_type: '',
    wave_exposure: 'moderate',
    seabed_type: 'rock',
    depth_range: '',
    primary_goal: '',
    ecological_goals: [],
    target_species: [],
    jurisdiction: '',
  });

  useEffect(() => {
    wizardApi.bootstrap().then(setLookups).catch(() => setError('Failed to load wizard data'));
  }, []);

  const update = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleArrayItem = useCallback((field, item) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));
  }, []);

  const canAdvance = () => {
    switch (step) {
      case 0: return form.name.trim().length > 0;
      case 1: return form.country.trim().length > 0 && form.latitude !== '' && form.longitude !== '';
      case 2: return form.structure_type.length > 0;
      case 3: return form.primary_goal.length > 0;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createProject({
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!lookups) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-eco-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shrink-0 ${
              i < step ? 'bg-eco-green-500 text-white' :
              i === step ? 'bg-eco-blue-600 text-white' :
              'bg-slate-200 text-slate-500'
            }`}>
              {i < step ? <Check size={16} /> : i + 1}
            </div>
            <span className={`ml-2 text-sm hidden sm:inline ${i === step ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-slate-200 mx-3" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        {step === 0 && <StepDetails form={form} update={update} />}
        {step === 1 && <StepLocation form={form} update={update} />}
        {step === 2 && <StepStructure form={form} update={update} lookups={lookups} />}
        {step === 3 && <StepGoals form={form} update={update} toggleArrayItem={toggleArrayItem} lookups={lookups} />}
        {step === 4 && <StepReview form={form} lookups={lookups} />}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">{error}</div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => step === 0 ? navigate('/') : setStep(s => s - 1)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft size={16} /> {step === 0 ? 'Cancel' : 'Back'}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canAdvance()}
            className="flex items-center gap-2 bg-eco-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-eco-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 bg-eco-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-eco-green-700 disabled:opacity-40"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Create Project
          </button>
        )}
      </div>
    </div>
  );
}

/* --- Step Components --- */

function StepDetails({ form, update }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Project Details</h3>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Project Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => update('name', e.target.value)}
          placeholder="e.g., Miami Beach Seawall Enhancement"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={e => update('description', e.target.value)}
          placeholder="Brief description of the project..."
          rows={4}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500 resize-none"
        />
      </div>
    </div>
  );
}

function StepLocation({ form, update }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Project Location</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Country *</label>
          <input
            type="text"
            value={form.country}
            onChange={e => update('country', e.target.value)}
            placeholder="e.g., United States"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
          <input
            type="text"
            value={form.region}
            onChange={e => update('region', e.target.value)}
            placeholder="e.g., Florida"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Latitude *</label>
          <input
            type="number"
            step="any"
            value={form.latitude}
            onChange={e => update('latitude', e.target.value)}
            placeholder="e.g., 25.7617"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Longitude *</label>
          <input
            type="number"
            step="any"
            value={form.longitude}
            onChange={e => update('longitude', e.target.value)}
            placeholder="e.g., -80.1918"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

function StepStructure({ form, update, lookups }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Structure Configuration</h3>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Structure Type *</label>
        <div className="grid grid-cols-2 gap-2">
          {lookups.structureTypes.map(st => (
            <button
              key={st.id}
              onClick={() => update('structure_type', st.id)}
              className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                form.structure_type === st.id
                  ? 'border-eco-blue-500 bg-eco-blue-50 text-eco-blue-700'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-medium">{st.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{st.description}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Wave Exposure</label>
          <select
            value={form.wave_exposure}
            onChange={e => update('wave_exposure', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
          >
            {lookups.waveExposure.map(w => (
              <option key={w.id} value={w.id}>{w.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Seabed Type</label>
          <select
            value={form.seabed_type}
            onChange={e => update('seabed_type', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
          >
            {lookups.seabedTypes.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Depth Range</label>
        <input
          type="text"
          value={form.depth_range}
          onChange={e => update('depth_range', e.target.value)}
          placeholder="e.g., 0-5m"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
        />
      </div>
    </div>
  );
}

function StepGoals({ form, update, toggleArrayItem, lookups }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Ecological Goals</h3>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Primary Goal *</label>
        <div className="grid grid-cols-2 gap-2">
          {lookups.primaryGoals.map(g => (
            <button
              key={g.id}
              onClick={() => update('primary_goal', g.id)}
              className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                form.primary_goal === g.id
                  ? 'border-eco-green-500 bg-eco-green-50 text-eco-green-700'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-medium">{g.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{g.description}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Jurisdiction</label>
        <select
          value={form.jurisdiction}
          onChange={e => update('jurisdiction', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
        >
          <option value="">Select jurisdiction...</option>
          {lookups.jurisdictions.map(j => (
            <option key={j.id} value={j.id}>{j.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function StepReview({ form, lookups }) {
  const structureLabel = lookups.structureTypes.find(s => s.id === form.structure_type)?.label || form.structure_type;
  const goalLabel = lookups.primaryGoals.find(g => g.id === form.primary_goal)?.label || form.primary_goal;
  const jurisdictionLabel = lookups.jurisdictions.find(j => j.id === form.jurisdiction)?.label || form.jurisdiction || 'None';

  const sections = [
    { title: 'Project', items: [['Name', form.name], ['Description', form.description || '—']] },
    { title: 'Location', items: [['Country', form.country], ['Region', form.region || '—'], ['Coordinates', `${form.latitude}, ${form.longitude}`]] },
    { title: 'Structure', items: [['Type', structureLabel], ['Wave Exposure', form.wave_exposure], ['Seabed', form.seabed_type], ['Depth', form.depth_range || '—']] },
    { title: 'Goals', items: [['Primary Goal', goalLabel], ['Jurisdiction', jurisdictionLabel]] },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Review & Create</h3>
      {sections.map(s => (
        <div key={s.title}>
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">{s.title}</h4>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            {s.items.map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="font-medium text-slate-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
