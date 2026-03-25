import { useState, useEffect } from 'react';
import { Package, Filter, Star, CheckCircle, XCircle, Layers } from 'lucide-react';
import { materialsApi } from '../services/api';

const DEMO_CATEGORIES = [
  { id: 'reef-base', name: 'Reef Base Structures', count: 3 },
  { id: 'substrate', name: 'Substrate & Coatings', count: 2 },
  { id: 'monitoring', name: 'Monitoring Equipment', count: 2 },
  { id: 'anchoring', name: 'Anchoring Systems', count: 2 },
];

const DEMO_MATERIALS = [
  { id: 1, name: 'ECOncrete Tide Pool Panel', category: 'reef-base', description: 'Textured concrete panel designed to mimic natural tide pool habitats.', ecoScore: 92, durabilityYears: 50, costPerUnit: 420, unit: 'm²', certifications: ['ISO 14001', 'Marine Tested'], inStock: true },
  { id: 2, name: 'Bio-Enhanced Reef Block', category: 'reef-base', description: 'Modular reef block with integrated biological substrate for coral recruitment.', ecoScore: 88, durabilityYears: 40, costPerUnit: 680, unit: 'block', certifications: ['CE Mark', 'Marine Tested'], inStock: true },
  { id: 3, name: 'Seawall Enhancement Panel', category: 'reef-base', description: 'Retrofittable panel for existing seawalls to increase biodiversity.', ecoScore: 85, durabilityYears: 30, costPerUnit: 310, unit: 'm²', certifications: ['ISO 14001'], inStock: true },
  { id: 4, name: 'Living Shoreline Mix', category: 'substrate', description: 'Specially formulated substrate blend to support native macroalgae.', ecoScore: 95, durabilityYears: 10, costPerUnit: 85, unit: 'kg', certifications: ['Organic Certified'], inStock: true },
  { id: 5, name: 'Anti-Invasive Coating', category: 'substrate', description: 'Non-toxic surface coating that inhibits invasive barnacle species.', ecoScore: 78, durabilityYears: 5, costPerUnit: 140, unit: 'L', certifications: ['EPA Approved'], inStock: false },
  { id: 6, name: 'Underwater Sensor Array', category: 'monitoring', description: 'Multi-parameter sensor array for continuous water quality monitoring.', ecoScore: 70, durabilityYears: 7, costPerUnit: 3200, unit: 'unit', certifications: ['IP68', 'CE Mark'], inStock: true },
  { id: 7, name: 'Acoustic Monitoring Buoy', category: 'monitoring', description: 'Solar-powered buoy with hydrophone array for marine biodiversity acoustics.', ecoScore: 72, durabilityYears: 10, costPerUnit: 7500, unit: 'unit', certifications: ['CE Mark', 'FCC'], inStock: true },
  { id: 8, name: 'Helical Screw Anchor', category: 'anchoring', description: 'Low-disturbance helical anchor for soft sediment environments.', ecoScore: 80, durabilityYears: 25, costPerUnit: 550, unit: 'unit', certifications: ['ISO 9001'], inStock: true },
  { id: 9, name: 'Rock-Socket Anchor', category: 'anchoring', description: 'High-load anchor system for rocky substrates.', ecoScore: 75, durabilityYears: 30, costPerUnit: 890, unit: 'unit', certifications: ['ISO 9001', 'CE Mark'], inStock: true },
];

function ecoScoreColor(score) {
  if (score >= 90) return 'text-emerald-600 bg-emerald-50';
  if (score >= 80) return 'text-green-600 bg-green-50';
  if (score >= 70) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minScore, setMinScore] = useState(0);

  useEffect(() => {
    Promise.all([
      materialsApi.list().catch(() => DEMO_MATERIALS),
      materialsApi.categories().catch(() => DEMO_CATEGORIES),
    ]).then(([mats, cats]) => {
      setMaterials(mats);
      setCategories(cats);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = materials.filter(m => {
    if (activeCategory !== 'all' && m.category !== activeCategory) return false;
    if (inStockOnly && !m.inStock) return false;
    if (m.ecoScore < minScore) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <Package size={22} className="text-emerald-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Materials Calculator</h1>
          <p className="text-sm text-slate-500">Browse and compare eco-certified marine construction materials</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center">
        <Filter size={16} className="text-slate-400 shrink-0" />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${activeCategory === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${activeCategory === cat.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={e => setInStockOnly(e.target.checked)}
              className="rounded"
            />
            In stock only
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Min eco score:
            <select
              value={minScore}
              onChange={e => setMinScore(Number(e.target.value))}
              className="border border-slate-200 rounded-md px-2 py-1 text-sm"
            >
              <option value={0}>Any</option>
              <option value={70}>70+</option>
              <option value={80}>80+</option>
              <option value={90}>90+</option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-full mb-2" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Layers size={36} className="mx-auto mb-3 opacity-40" />
          <p>No materials match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => (
            <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-900 text-sm leading-tight pr-2">{m.name}</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${ecoScoreColor(m.ecoScore)}`}>
                  {m.ecoScore}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">{m.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-slate-400 mb-0.5">Cost / {m.unit}</div>
                  <div className="font-semibold text-slate-800">${m.costPerUnit.toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-slate-400 mb-0.5">Durability</div>
                  <div className="font-semibold text-slate-800">{m.durabilityYears} years</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1 flex-wrap">
                  {m.certifications.map(cert => (
                    <span key={cert} className="text-xs bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded">{cert}</span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs shrink-0 ml-2">
                  {m.inStock
                    ? <><CheckCircle size={12} className="text-emerald-500" /><span className="text-emerald-600">In stock</span></>
                    : <><XCircle size={12} className="text-red-400" /><span className="text-red-500">Out of stock</span></>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 mt-6 text-center">
        {filtered.length} material{filtered.length !== 1 ? 's' : ''} shown
        {filtered.length !== materials.length ? ` (filtered from ${materials.length})` : ''}
      </p>
    </div>
  );
}
