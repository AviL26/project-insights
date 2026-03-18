import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Archive, Trash2, RotateCcw } from 'lucide-react';
import { useProjects } from '../context/ProjectContext';

export default function Dashboard() {
  const { projects, loading, error, archiveProject, restoreProject, deleteProject } = useProjects();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('active');

  const filtered = useMemo(() => {
    const statusFilter = tab === 'active' ? ['draft', 'active', 'completed'] : ['archived'];
    return projects
      .filter(p => statusFilter.includes(p.status))
      .filter(p =>
        !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase())
      );
  }, [projects, search, tab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Failed to load projects: {error}
      </div>
    );
  }

  const activeCount = projects.filter(p => p.status !== 'archived').length;
  const archivedCount = projects.filter(p => p.status === 'archived').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your marine infrastructure projects</p>
        </div>
        <Link
          to="/projects/new"
          className="flex items-center gap-2 bg-eco-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-eco-blue-700 transition-colors font-medium text-sm"
        >
          <Plus size={18} />
          New Project
        </Link>
      </div>

      {/* Tabs & Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setTab('active')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setTab('archived')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === 'archived' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Archived ({archivedCount})
          </button>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-eco-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Project Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          {search ? 'No projects match your search.' : tab === 'archived' ? 'No archived projects.' : 'No projects yet. Create one to get started!'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onArchive={archiveProject}
              onRestore={restoreProject}
              onDelete={deleteProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, onArchive, onRestore, onDelete }) {
  const statusColors = {
    draft: 'bg-slate-100 text-slate-600',
    active: 'bg-eco-green-100 text-eco-green-700',
    completed: 'bg-eco-blue-100 text-eco-blue-700',
    archived: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-900 truncate flex-1">{project.name}</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-2 ${statusColors[project.status] || statusColors.draft}`}>
          {project.status}
        </span>
      </div>

      {project.description && (
        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{project.description}</p>
      )}

      <div className="text-xs text-slate-400 space-y-1 mb-4">
        {project.country && <p>{project.country}{project.region ? `, ${project.region}` : ''}</p>}
        {project.structure_type && <p>Structure: {project.structure_type}</p>}
        {project.primary_goal && <p>Goal: {project.primary_goal}</p>}
      </div>

      <div className="flex gap-2 pt-3 border-t border-slate-100">
        {project.status === 'archived' ? (
          <button onClick={() => onRestore(project.id)} className="flex items-center gap-1 text-xs text-eco-blue-600 hover:text-eco-blue-800">
            <RotateCcw size={14} /> Restore
          </button>
        ) : (
          <button onClick={() => onArchive(project.id)} className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800">
            <Archive size={14} /> Archive
          </button>
        )}
        <button onClick={() => onDelete(project.id)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 ml-auto">
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}
