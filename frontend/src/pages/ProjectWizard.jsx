import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Check, Loader2, X,
  MapPin, LocateFixed,
  Shield, Waves, Fish, Building2, Leaf, Anchor, Mountain, TreePine, CircleDot,
} from 'lucide-react';
import { wizardApi } from '../services/api';
import { useProjects } from '../context/ProjectContext';
import { COUNTRIES } from '../../../packages/shared/constants/countries.js';
import ClimateData from '../components/shared/ClimateData.jsx';

const STEPS = ['Details', 'Location', 'Structure', 'Goals', 'Review'];

const PHASES = [
  { id: 'planning', label: 'Planning' },
  { id: 'design', label: 'Design' },
  { id: 'construction', label: 'Construction' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'completed', label: 'Completed' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'ILS', 'AUD'];

const STRUCTURE_ICONS = {
  seawall: Shield,
  breakwater: Waves,
  artificial_reef: Fish,
  pier: Building2,
  living_shoreline: Leaf,
  jetty: Anchor,
  revetment: Mountain,
  mangrove: TreePine,
};

const RECOMMENDED_FOR = {
  very_exposed: ['breakwater', 'seawall'],
  exposed: ['breakwater', 'seawall', 'revetment'],
  moderate: ['pier', 'artificial_reef', 'living_shoreline'],
  sheltered: ['artificial_reef', 'living_shoreline', 'pier', 'mangrove'],
};

const TARGET_SPECIES_SUGGESTIONS = [
  'Acropora coral', 'Porites coral', 'Stylophora coral', 'Mussels', 'Oysters',
  'Barnacles', 'Coralline algae', 'Kelp', 'Grouper', 'Snapper', 'Damselfish',
  'Parrotfish', 'Wrasse', 'Sea urchins', 'Starfish', 'Sea cucumbers',
  'Lobster', 'Crab', 'Seagrass', 'Mangrove',
];

function calcProgress(form) {
  const checks = [
    form.name.trim(),
    form.country.trim(),
    form.latitude !== '',
    form.longitude !== '',
    form.structure_type,
    form.primary_goal,
    form.description.trim(),
    form.region.trim(),
    form.jurisdiction,
    form.ecological_goals.length > 0,
    form.target_species.length > 0,
    form.phase,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function ProjectWizard() {
  const navigate = useNavigate();
  const { createProject } = useProjects();
  const [step, setStep] = useState(0);
  const [maxVisitedStep, setMaxVisitedStep] = useState(0);
  const [lookups, setLookups] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [jurisdictionAutoSet, setJurisdictionAutoSet] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    phase: '',
    client: '',
    start_date: '',
    end_date: '',
    tags: [],
    budget: '',
    budget_currency: 'USD',
    country: '',
    region: '',
    latitude: '',
    longitude: '',
    structure_type: '',
    wave_exposure: 'moderate',
    seabed_type: 'rock',
    depth_min: 0,
    depth_max: 10,
    surface_area: '',
    surface_area_unit: 'm2',
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
    if (field === 'jurisdiction') setJurisdictionAutoSet(false);
  }, []);

  const toggleArrayItem = useCallback((field, item) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));
  }, []);

  const validateStep = (s) => {
    const errors = {};
    switch (s) {
      case 0:
        if (!form.name.trim()) errors.name = 'Project name is required';
        break;
      case 1:
        if (!form.country.trim()) errors.country = 'Country is required';
        if (form.latitude === '') errors.latitude = 'Latitude is required';
        if (form.longitude === '') errors.longitude = 'Longitude is required';
        break;
      case 2:
        if (!form.structure_type) errors.structure_type = 'Please select a structure type';
        break;
      case 3:
        if (!form.primary_goal) errors.primary_goal = 'Please select a primary goal';
        break;
      default: break;
    }
    return errors;
  };

  const handleNext = () => {
    const errors = validateStep(step);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});
    const next = step + 1;
    setStep(next);
    setMaxVisitedStep(prev => Math.max(prev, next));
  };

  const goToStep = (i) => {
    if (i > maxVisitedStep) return;
    setValidationErrors({});
    setStep(i);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createProject({
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        depth_range: `${form.depth_min}m-${form.depth_max}m`,
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

  const progress = calcProgress(form);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Clickable step indicator */}
      <div className="flex items-center mb-4">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <button
              onClick={() => goToStep(i)}
              disabled={i > maxVisitedStep}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shrink-0 transition-colors ${
                i < step
                  ? 'bg-eco-green-500 text-white hover:bg-eco-green-600 cursor-pointer'
                  : i === step
                  ? 'bg-eco-blue-600 text-white cursor-default'
                  : i <= maxVisitedStep
                  ? 'bg-slate-300 text-slate-600 hover:bg-slate-400 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {i < step ? <Check size={16} /> : i + 1}
            </button>
            <span className={`ml-2 text-sm hidden sm:inline ${
              i === step ? 'font-semibold text-slate-900' : i < step ? 'text-slate-600' : 'text-slate-400'
            }`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-slate-200 mx-3" />}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Progress</span>
          <span>{progress}% complete</span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-eco-green-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        {step === 0 && <StepDetails form={form} update={update} errors={validationErrors} />}
        {step === 1 && (
          <StepLocation
            form={form}
            update={update}
            lookups={lookups}
            errors={validationErrors}
            onJurisdictionAutoSet={() => setJurisdictionAutoSet(true)}
          />
        )}
        {step === 2 && <StepStructure form={form} update={update} lookups={lookups} errors={validationErrors} />}
        {step === 3 && (
          <StepGoals
            form={form}
            update={update}
            toggleArrayItem={toggleArrayItem}
            lookups={lookups}
            errors={validationErrors}
            jurisdictionAutoSet={jurisdictionAutoSet}
          />
        )}
        {step === 4 && <StepReview form={form} lookups={lookups} navigate={navigate} />}
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
            onClick={handleNext}
            className="flex items-center gap-2 bg-eco-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-eco-blue-700"
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

/* --- Shared helper --- */

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

/* ─────────────────────────────────────────────
   Step 0: Details
───────────────────────────────────────────── */

function StepDetails({ form, update, errors }) {
  const [tagInput, setTagInput] = useState('');

  const commitTags = (input) => {
    const newTags = input
      .split(',')
      .map(t => t.trim())
      .filter(t => t && !form.tags.includes(t));
    if (newTags.length) update('tags', [...form.tags, ...newTags]);
    setTagInput('');
  };

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-slate-900">Project Details</h3>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Project Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => update('name', e.target.value)}
          placeholder="e.g., Miami Beach Seawall Enhancement"
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500 ${
            errors.name ? 'border-red-400' : 'border-slate-300'
          }`}
        />
        <FieldError msg={errors.name} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={e => update('description', e.target.value)}
          placeholder="Brief description of the project..."
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Project Phase</label>
        <div className="flex flex-wrap gap-2">
          {PHASES.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => update('phase', form.phase === p.id ? '' : p.id)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                form.phase === p.id
                  ? 'bg-eco-blue-600 text-white border-eco-blue-600'
                  : 'border-slate-300 text-slate-600 hover:border-eco-blue-400 hover:text-eco-blue-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Client / Organization</label>
        <input
          type="text"
          value={form.client}
          onChange={e => update('client', e.target.value)}
          placeholder="e.g., City of Miami, NOAA"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Project Timeline</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={e => update('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">End Date</label>
            <input
              type="date"
              value={form.end_date}
              min={form.start_date || undefined}
              onChange={e => update('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-eco-green-100 text-eco-green-800 rounded-full text-xs font-medium"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => update('tags', form.tags.filter(t => t !== tag))}
                  className="hover:text-eco-green-600 ml-0.5"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              if (tagInput.trim()) commitTags(tagInput);
            } else if (e.key === 'Backspace' && !tagInput && form.tags.length) {
              update('tags', form.tags.slice(0, -1));
            }
          }}
          onBlur={() => { if (tagInput.trim()) commitTags(tagInput); }}
          placeholder="Add tags — press Enter or comma to confirm"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Budget Estimate</label>
        <div className="flex gap-2">
          <select
            value={form.budget_currency}
            onChange={e => update('budget_currency', e.target.value)}
            className="w-24 px-2 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500 bg-white"
          >
            {CURRENCIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            step="any"
            value={form.budget}
            onChange={e => update('budget', e.target.value)}
            placeholder="0.00"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Step 1: Location
───────────────────────────────────────────── */

function StepLocation({ form, update, lookups, errors, onJurisdictionAutoSet }) {
  const [showManualCoords, setShowManualCoords] = useState(
    form.latitude === '' && form.longitude === ''
  );

  const selectedCountry = COUNTRIES.find(c => c.name === form.country) || null;
  const coordsSet = form.latitude !== '' && form.longitude !== '';

  const handleCountrySelect = (e) => {
    const countryName = e.target.value;
    if (!countryName) {
      update('country', '');
      update('region', '');
      return;
    }
    const country = COUNTRIES.find(c => c.name === countryName);
    if (!country) return;
    update('country', country.name);
    update('region', '');
    update('latitude', String(country.lat));
    update('longitude', String(country.lon));
    setShowManualCoords(false);
    if (country.jurisdictionId && lookups?.jurisdictions) {
      const match = lookups.jurisdictions.find(j => j.id === country.jurisdictionId);
      if (match) {
        update('jurisdiction', match.id);
        onJurisdictionAutoSet();
      }
    }
  };

  const handleCitySelect = (e) => {
    const cityName = e.target.value;
    if (!cityName || !selectedCountry) return;
    const city = selectedCountry.cities.find(c => c.name === cityName);
    if (city) {
      update('region', city.name);
      update('latitude', String(city.lat));
      update('longitude', String(city.lon));
      setShowManualCoords(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Project Location</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Country select */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Country *</label>
          <select
            value={form.country}
            onChange={handleCountrySelect}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500 ${
              errors.country ? 'border-red-400' : 'border-slate-300'
            }`}
          >
            <option value="">Select country…</option>
            {COUNTRIES.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <FieldError msg={errors.country} />
        </div>

        {/* Cascading city/region */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">City / Region</label>
          {selectedCountry ? (
            <select
              value={form.region}
              onChange={handleCitySelect}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
            >
              <option value="">Select city…</option>
              {selectedCountry.cities.map(city => (
                <option key={city.name} value={city.name}>{city.name}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={form.region}
              onChange={e => update('region', e.target.value)}
              placeholder="Select a country first"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
            />
          )}
        </div>
      </div>

      {/* Coordinates: auto-fill pill or manual inputs */}
      {coordsSet && !showManualCoords ? (
        <div className="flex items-center justify-between bg-eco-green-50 border border-eco-green-200 rounded-lg px-3 py-2 text-sm">
          <span className="flex items-center gap-2 text-slate-700">
            <MapPin size={14} className="text-eco-green-600 shrink-0" />
            <span className="font-medium tabular-nums">
              {parseFloat(form.latitude).toFixed(4)}°,&nbsp;{parseFloat(form.longitude).toFixed(4)}°
            </span>
            <span className="text-slate-400 text-xs">auto-filled</span>
          </span>
          <button
            type="button"
            onClick={() => setShowManualCoords(true)}
            className="flex items-center gap-1 text-xs text-eco-blue-600 hover:text-eco-blue-700 font-medium ml-4 shrink-0"
          >
            <LocateFixed size={12} /> Edit
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Coordinates *</span>
            {coordsSet && (
              <button
                type="button"
                onClick={() => setShowManualCoords(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Collapse
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Latitude (−90 to 90)</label>
              <input
                type="number"
                step="any"
                min="-90"
                max="90"
                value={form.latitude}
                onChange={e => update('latitude', e.target.value)}
                placeholder="e.g., 25.7617"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500 ${
                  errors.latitude ? 'border-red-400' : 'border-slate-300'
                }`}
              />
              <FieldError msg={errors.latitude} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Longitude (−180 to 180)</label>
              <input
                type="number"
                step="any"
                min="-180"
                max="180"
                value={form.longitude}
                onChange={e => update('longitude', e.target.value)}
                placeholder="e.g., −80.1918"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500 ${
                  errors.longitude ? 'border-red-400' : 'border-slate-300'
                }`}
              />
              <FieldError msg={errors.longitude} />
            </div>
          </div>
          {!coordsSet && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <MapPin size={11} />
              Select a country and city above to auto-fill, or enter coordinates manually.
            </p>
          )}
        </div>
      )}

      {/* Climate preview */}
      {coordsSet && (
        <ClimateData lat={form.latitude} lon={form.longitude} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Step 2: Structure
───────────────────────────────────────────── */

function StepStructure({ form, update, lookups, errors }) {
  const recommended = RECOMMENDED_FOR[form.wave_exposure] || [];

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-slate-900">Structure Configuration</h3>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Structure Type *</label>
        {recommended.length > 0 && (
          <p className="text-xs text-eco-green-700 bg-eco-green-50 border border-eco-green-200 rounded-lg px-3 py-2 mb-3">
            Recommended for <span className="font-semibold">{form.wave_exposure.replace('_', ' ')}</span> wave exposure:{' '}
            {recommended
              .map(r => lookups.structureTypes.find(s => s.id === r)?.label || r)
              .join(', ')}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {lookups.structureTypes.map(st => {
            const Icon = STRUCTURE_ICONS[st.id] || CircleDot;
            const isRecommended = recommended.includes(st.id);
            const isSelected = form.structure_type === st.id;
            return (
              <button
                key={st.id}
                onClick={() => update('structure_type', st.id)}
                className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                  isSelected
                    ? 'border-eco-blue-500 bg-eco-blue-50 text-eco-blue-700'
                    : isRecommended
                    ? 'border-eco-green-300 bg-eco-green-50/50 hover:border-eco-green-400'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <Icon
                    size={15}
                    className={
                      isSelected ? 'text-eco-blue-600' :
                      isRecommended ? 'text-eco-green-600' :
                      'text-slate-400'
                    }
                  />
                  <span className="font-medium">{st.label}</span>
                  {isRecommended && !isSelected && (
                    <span className="ml-auto text-[10px] font-semibold text-eco-green-700 bg-eco-green-100 px-1.5 py-0.5 rounded-full shrink-0">
                      Recommended
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 pl-5">{st.description}</div>
              </button>
            );
          })}
        </div>
        <FieldError msg={errors.structure_type} />
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

      {/* Depth range dual slider */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-slate-700">Depth Range</label>
          <span className="text-sm font-semibold text-eco-blue-700 bg-eco-blue-50 px-2.5 py-0.5 rounded-full">
            {form.depth_min}m – {form.depth_max}m
          </span>
        </div>
        <div className="space-y-2.5 px-1">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-10 shrink-0">Min</span>
            <input
              type="range"
              min={0}
              max={50}
              value={form.depth_min}
              onChange={e => update('depth_min', Math.min(+e.target.value, form.depth_max - 1))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-eco-blue-600"
            />
            <span className="text-xs font-medium text-slate-700 w-8 text-right shrink-0">{form.depth_min}m</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-10 shrink-0">Max</span>
            <input
              type="range"
              min={0}
              max={50}
              value={form.depth_max}
              onChange={e => update('depth_max', Math.max(+e.target.value, form.depth_min + 1))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-eco-blue-600"
            />
            <span className="text-xs font-medium text-slate-700 w-8 text-right shrink-0">{form.depth_max}m</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1 px-14">
          <span>0m</span>
          <span>50m</span>
        </div>
      </div>

      {/* Surface area */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Surface Area</label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="any"
            value={form.surface_area}
            onChange={e => update('surface_area', e.target.value)}
            placeholder="e.g., 500"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
          />
          <div className="flex rounded-lg border border-slate-300 overflow-hidden text-sm">
            {['m2', 'ft2'].map(unit => (
              <button
                key={unit}
                type="button"
                onClick={() => update('surface_area_unit', unit)}
                className={`px-3 py-2 font-medium transition-colors ${
                  form.surface_area_unit === unit
                    ? 'bg-eco-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {unit === 'm2' ? 'm²' : 'ft²'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Step 3: Goals
───────────────────────────────────────────── */

function SpeciesInput({ selected, onAdd, onRemove }) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  const filtered = TARGET_SPECIES_SUGGESTIONS.filter(
    s => !selected.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addSpecies = (species) => {
    if (species && !selected.includes(species)) onAdd(species);
    setInputValue('');
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(s => (
            <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-eco-blue-100 text-eco-blue-800 rounded-full text-xs font-medium">
              {s}
              <button onClick={() => onRemove(s)} className="hover:text-eco-blue-600">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={inputValue}
        onChange={e => { setInputValue(e.target.value); setShowDropdown(true); }}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={e => {
          if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            addSpecies(inputValue.trim());
          } else if (e.key === 'Escape') {
            setShowDropdown(false);
          }
        }}
        placeholder="Search or type a species..."
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500"
      />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(s => (
            <button
              key={s}
              onMouseDown={e => { e.preventDefault(); addSpecies(s); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StepGoals({ form, update, toggleArrayItem, lookups, errors, jurisdictionAutoSet }) {
  const secondaryGoals = lookups.primaryGoals.filter(g => g.id !== form.primary_goal);

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-slate-900">Ecological Goals</h3>

      {/* Primary goal */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Primary Goal *</label>
        <div className="grid grid-cols-2 gap-2">
          {lookups.primaryGoals.map(g => (
            <button
              key={g.id}
              onClick={() => {
                update('primary_goal', g.id);
                if (form.ecological_goals.includes(g.id)) {
                  toggleArrayItem('ecological_goals', g.id);
                }
              }}
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
        <FieldError msg={errors.primary_goal} />
      </div>

      {/* Secondary goals */}
      {form.primary_goal && secondaryGoals.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Secondary Goals</label>
          <div className="space-y-2">
            {secondaryGoals.map(g => (
              <label key={g.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.ecological_goals.includes(g.id)}
                  onChange={() => toggleArrayItem('ecological_goals', g.id)}
                  className="mt-0.5 accent-eco-green-600"
                />
                <div>
                  <div className="text-sm font-medium text-slate-800">{g.label}</div>
                  {g.description && <div className="text-xs text-slate-500">{g.description}</div>}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Target species autocomplete */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Target Species</label>
        <p className="text-xs text-slate-500 mb-2">Select or type species you aim to attract or support.</p>
        <SpeciesInput
          selected={form.target_species}
          onAdd={species => toggleArrayItem('target_species', species)}
          onRemove={species => toggleArrayItem('target_species', species)}
        />
      </div>

      {/* Jurisdiction */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Jurisdiction</label>
        {jurisdictionAutoSet && (
          <p className="text-xs text-eco-green-700 bg-eco-green-50 border border-eco-green-200 rounded px-2 py-1 mb-1.5">
            Auto-selected based on country
          </p>
        )}
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

/* ─────────────────────────────────────────────
   Step 4: Review
───────────────────────────────────────────── */

function ReviewRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="font-medium text-slate-900 text-right max-w-[60%]">{value || '—'}</span>
    </div>
  );
}

function StepReview({ form, lookups, navigate }) {
  const structureLabel = lookups.structureTypes.find(s => s.id === form.structure_type)?.label || form.structure_type;
  const goalLabel = lookups.primaryGoals.find(g => g.id === form.primary_goal)?.label || form.primary_goal;
  const jurisdictionLabel = lookups.jurisdictions.find(j => j.id === form.jurisdiction)?.label || form.jurisdiction || '—';
  const phaseLabel = PHASES.find(p => p.id === form.phase)?.label || '—';
  const secondaryGoalLabels = form.ecological_goals
    .map(id => lookups.primaryGoals.find(g => g.id === id)?.label || id)
    .join(', ') || '—';

  const timeline = form.start_date || form.end_date
    ? `${form.start_date || '—'}  →  ${form.end_date || '—'}`
    : '—';

  const budgetDisplay = form.budget
    ? `${form.budget_currency} ${Number(form.budget).toLocaleString()}`
    : '—';

  const surfaceAreaDisplay = form.surface_area
    ? `${form.surface_area} ${form.surface_area_unit === 'm2' ? 'm²' : 'ft²'}`
    : '—';

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Review & Create</h3>

      <div>
        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Project</h4>
        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <ReviewRow label="Name" value={form.name} />
          <ReviewRow label="Description" value={form.description} />
          <ReviewRow label="Phase" value={phaseLabel} />
          <ReviewRow label="Client" value={form.client} />
          <ReviewRow label="Timeline" value={timeline} />
          <ReviewRow label="Budget" value={budgetDisplay} />
          {form.tags.length > 0 && <ReviewRow label="Tags" value={form.tags.join(', ')} />}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Location</h4>
        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <ReviewRow label="Country" value={form.country} />
          <ReviewRow label="Region" value={form.region} />
          <ReviewRow label="Coordinates" value={`${form.latitude}, ${form.longitude}`} />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Structure</h4>
        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <ReviewRow label="Type" value={structureLabel} />
          <ReviewRow label="Wave Exposure" value={form.wave_exposure} />
          <ReviewRow label="Seabed" value={form.seabed_type} />
          <ReviewRow label="Depth" value={`${form.depth_min}m – ${form.depth_max}m`} />
          <ReviewRow label="Surface Area" value={surfaceAreaDisplay} />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Goals</h4>
        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <ReviewRow label="Primary Goal" value={goalLabel} />
          <ReviewRow label="Secondary Goals" value={secondaryGoalLabels} />
          <ReviewRow label="Jurisdiction" value={jurisdictionLabel} />
          {form.target_species.length > 0 && (
            <div className="pt-1">
              <span className="text-sm text-slate-500">Target Species</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {form.target_species.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-eco-blue-100 text-eco-blue-800 rounded-full text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={() => navigate('/')}
          className="w-full py-2.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Save as Draft
        </button>
      </div>
    </div>
  );
}
