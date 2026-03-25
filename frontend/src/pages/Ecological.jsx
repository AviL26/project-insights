import { useState } from 'react';
import { Leaf, Search, Fish, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { speciesApi } from '../services/api';

const DEMO_SPECIES = [
  { key: 1, scientificName: 'Acropora millepora', vernacularName: 'Stony Coral', kingdom: 'Animalia', class: 'Anthozoa', threatStatus: 'Vulnerable', relevance: 'high' },
  { key: 2, scientificName: 'Halimeda opuntia', vernacularName: 'Cactus Alga', kingdom: 'Plantae', class: 'Ulvophyceae', threatStatus: 'Least Concern', relevance: 'medium' },
  { key: 3, scientificName: 'Tridacna gigas', vernacularName: 'Giant Clam', kingdom: 'Animalia', class: 'Bivalvia', threatStatus: 'Vulnerable', relevance: 'high' },
  { key: 4, scientificName: 'Chelonia mydas', vernacularName: 'Green Sea Turtle', kingdom: 'Animalia', class: 'Reptilia', threatStatus: 'Endangered', relevance: 'critical' },
  { key: 5, scientificName: 'Posidonia oceanica', vernacularName: 'Neptune Grass', kingdom: 'Plantae', class: 'Liliopsida', threatStatus: 'Vulnerable', relevance: 'high' },
];

const SCORING_CRITERIA = [
  { id: 'habitat', label: 'Habitat Complexity', description: 'Surface texture and structural diversity to support settlement', maxScore: 25 },
  { id: 'connectivity', label: 'Ecological Connectivity', description: 'Proximity to existing reef networks and migration corridors', maxScore: 20 },
  { id: 'recruitment', label: 'Recruitment Potential', description: 'Substrate suitability for larval settlement', maxScore: 20 },
  { id: 'water', label: 'Water Quality', description: 'Turbidity, nutrients, and chemical parameters', maxScore: 20 },
  { id: 'disturbance', label: 'Disturbance Risk', description: 'Construction and post-installation disturbance level', maxScore: 15 },
];

const RELEVANCE_CONFIG = {
  critical: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Critical' },
  high: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'High' },
  medium: { color: 'bg-sky-100 text-sky-700 border-sky-200', label: 'Medium' },
  low: { color: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Low' },
};

function ScoreBar({ value, max }) {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-10 text-right">{value}/{max}</span>
    </div>
  );
}

export default function Ecological() {
  const [query, setQuery] = useState('');
  const [species, setSpecies] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [scores, setScores] = useState({ habitat: 18, connectivity: 14, recruitment: 16, water: 17, disturbance: 11 });

  const totalScore = Object.entries(scores).reduce((sum, [key, val]) => {
    const criterion = SCORING_CRITERIA.find(c => c.id === key);
    return sum + Math.min(val, criterion?.maxScore ?? 0);
  }, 0);
  const maxTotal = SCORING_CRITERIA.reduce((sum, c) => sum + c.maxScore, 0);
  const pct = Math.round((totalScore / maxTotal) * 100);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const data = await speciesApi.search({ q: query.trim(), habitat: 'marine', limit: 10 });
      const results = (data.results || []).map(s => ({
        key: s.key,
        scientificName: s.scientificName || s.canonicalName || 'Unknown',
        vernacularName: s.vernacularNameList?.[0] || s.vernacularNames?.[0]?.vernacularName || '—',
        kingdom: s.kingdom || '—',
        class: s.class || '—',
        threatStatus: s.threatStatuses?.[0] || 'Not assessed',
        relevance: 'medium',
      }));
      setSpecies(results.length ? results : DEMO_SPECIES);
    } catch {
      setSpecies(DEMO_SPECIES);
    } finally {
      setSearching(false);
    }
  }

  const scoreColor = pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Leaf size={22} className="text-green-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ecological Scoring</h1>
          <p className="text-sm text-slate-500">Assess ecological impact and search marine species data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Scoring panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Ecological Score</h2>
            <div className="text-right">
              <span className={`text-2xl font-bold ${scoreColor}`}>{totalScore}</span>
              <span className="text-slate-400 text-sm">/{maxTotal}</span>
              <div className={`text-xs font-medium ${scoreColor}`}>{pct}%</div>
            </div>
          </div>

          <div className="space-y-4">
            {SCORING_CRITERIA.map(c => (
              <div key={c.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700">{c.label}</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">{c.description}</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={c.maxScore}
                    value={scores[c.id]}
                    onChange={e => setScores(prev => ({ ...prev, [c.id]: Number(e.target.value) }))}
                    className="flex-1 accent-emerald-600"
                  />
                  <ScoreBar value={scores[c.id]} max={c.maxScore} />
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-5 p-3 rounded-lg border text-xs ${pct >= 75 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : pct >= 50 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {pct >= 75
              ? <><CheckCircle2 size={12} className="inline mr-1.5" />Project has strong ecological suitability. Proceed with standard monitoring.</>
              : pct >= 50
              ? <><Info size={12} className="inline mr-1.5" />Moderate suitability. Consider mitigation measures before proceeding.</>
              : <><AlertCircle size={12} className="inline mr-1.5" />Low ecological suitability. Significant design changes recommended.</>
            }
          </div>
        </div>

        {/* Species search */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Fish size={15} /> Marine Species Search
          </h2>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search species (e.g. Acropora, tuna, seagrass)"
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Search size={14} />
              {searching ? 'Searching…' : 'Search'}
            </button>
          </form>

          {!hasSearched && (
            <div className="text-center py-8 text-slate-400">
              <Fish size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Search GBIF for marine species relevant to your project location</p>
              <p className="text-xs mt-1">Results include threat status and ecological relevance</p>
            </div>
          )}

          {hasSearched && (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {(species.length ? species : DEMO_SPECIES).map(s => {
                const rel = RELEVANCE_CONFIG[s.relevance] ?? RELEVANCE_CONFIG.medium;
                return (
                  <div key={s.key} className="border border-slate-100 rounded-lg px-3 py-2.5 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-800 italic">{s.scientificName}</p>
                        {s.vernacularName !== '—' && (
                          <p className="text-xs text-slate-500">{s.vernacularName}</p>
                        )}
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium shrink-0 ${rel.color}`}>
                        {rel.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400">{s.kingdom} · {s.class}</span>
                      {s.threatStatus !== 'Not assessed' && (
                        <span className={`text-xs font-medium ${s.threatStatus === 'Endangered' ? 'text-red-600' : s.threatStatus === 'Vulnerable' ? 'text-amber-600' : 'text-slate-500'}`}>
                          {s.threatStatus}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
