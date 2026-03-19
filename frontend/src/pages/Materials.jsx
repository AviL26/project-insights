import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Pencil, Check, X, Leaf, Package, Loader2 } from 'lucide-react';
import { materialsApi } from '../services/api';
import { useProjects } from '../context/ProjectContext';

export default function Materials() {
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [bom, setBom] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ quantity: '', unit: '', notes: '' });

  const activeProjects = projects.filter(p => p.status !== 'archived');

  // Load catalog once
  useEffect(() => {
    materialsApi.catalog().then(setCatalog).catch(() => setError('Failed to load materials catalog'));
  }, []);

  // Load BOM when project changes
  const loadBom = useCallback(async (projectId) => {
    if (!projectId) { setBom([]); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await materialsApi.listForProject(projectId);
      setBom(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBom(selectedProjectId); }, [selectedProjectId, loadBom]);

  const handleProjectChange = (e) => {
    setSelectedProjectId(e.target.value);
    setEditingId(null);
  };

  const handleAdd = async (catalogItem) => {
    if (!selectedProjectId) return;
    setError(null);
    try {
      const material = await materialsApi.add(selectedProjectId, {
        material_id: catalogItem.id,
        quantity: 1,
        unit: catalogItem.unit,
        notes: '',
      });
      setBom(prev => [...prev, material]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ quantity: item.quantity, unit: item.unit, notes: item.notes || '' });
  };

  const handleSaveEdit = async () => {
    setError(null);
    try {
      const updated = await materialsApi.update(editingId, {
        quantity: parseFloat(editForm.quantity),
        unit: editForm.unit,
        notes: editForm.notes,
      });
      setBom(prev => prev.map(m => m.id === editingId ? updated : m));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    setError(null);
    try {
      await materialsApi.remove(id);
      setBom(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const ecoCount = bom.filter(m => m.eco_rating === 'eco_enhanced').length;
  const standardCount = bom.length - ecoCount;

  // Group catalog by category
  const catalogByCategory = catalog.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Materials Calculator</h1>
          <p className="text-slate-500 text-sm mt-1">Build your project bill of materials</p>
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
          Select a project above to manage its materials.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Catalog Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Package size={18} /> Materials Catalog
              </h2>
              <div className="space-y-4">
                {Object.entries(catalogByCategory).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{category}</h3>
                    <div className="space-y-1">
                      {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 group">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-slate-800 truncate">{item.name}</span>
                              {item.eco_rating === 'eco_enhanced' && (
                                <Leaf size={12} className="text-eco-green-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-400">{item.unit}</p>
                          </div>
                          <button
                            onClick={() => handleAdd(item)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-eco-blue-600 hover:bg-eco-blue-50 rounded transition-all"
                            title="Add to project"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOM Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="font-semibold text-slate-900 mb-3">Bill of Materials</h2>

              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="animate-spin text-eco-blue-600" size={24} />
                </div>
              ) : bom.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No materials added yet. Pick from the catalog on the left.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-3 font-medium text-slate-500">Material</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-500">Category</th>
                          <th className="text-right py-2 px-3 font-medium text-slate-500">Qty</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-500">Unit</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-500">Rating</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-500">Notes</th>
                          <th className="py-2 px-3 w-20"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {bom.map(item => (
                          <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                            {editingId === item.id ? (
                              <>
                                <td className="py-2 px-3 font-medium text-slate-800">{item.name}</td>
                                <td className="py-2 px-3 text-slate-500">{item.category}</td>
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    step="any"
                                    value={editForm.quantity}
                                    onChange={e => setEditForm(f => ({ ...f, quantity: e.target.value }))}
                                    className="w-20 px-2 py-1 border border-slate-300 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-eco-blue-500"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={editForm.unit}
                                    onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))}
                                    className="w-16 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-eco-blue-500"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <EcoRatingBadge rating={item.eco_rating} />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={editForm.notes}
                                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="Notes..."
                                    className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-eco-blue-500"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <div className="flex gap-1">
                                    <button onClick={handleSaveEdit} className="p-1 text-eco-green-600 hover:bg-eco-green-50 rounded"><Check size={14} /></button>
                                    <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X size={14} /></button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-2 px-3 font-medium text-slate-800">{item.name}</td>
                                <td className="py-2 px-3 text-slate-500">{item.category}</td>
                                <td className="py-2 px-3 text-right tabular-nums">{item.quantity}</td>
                                <td className="py-2 px-3 text-slate-500">{item.unit}</td>
                                <td className="py-2 px-3"><EcoRatingBadge rating={item.eco_rating} /></td>
                                <td className="py-2 px-3 text-slate-400 truncate max-w-[150px]">{item.notes || '—'}</td>
                                <td className="py-2 px-3">
                                  <div className="flex gap-1">
                                    <button onClick={() => handleStartEdit(item)} className="p-1 text-slate-400 hover:text-eco-blue-600 hover:bg-eco-blue-50 rounded"><Pencil size={14} /></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200 text-sm">
                    <span className="text-slate-500">{bom.length} item{bom.length !== 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1 text-eco-green-600">
                      <Leaf size={14} /> {ecoCount} eco-enhanced
                    </span>
                    <span className="text-slate-400">{standardCount} standard</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EcoRatingBadge({ rating }) {
  if (rating === 'eco_enhanced') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-eco-green-100 text-eco-green-700">
        <Leaf size={10} /> Eco
      </span>
    );
  }
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
      Standard
    </span>
  );
}
