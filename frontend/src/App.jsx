import { Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import PageShell from './components/layout/PageShell';
import Dashboard from './pages/Dashboard';
import ProjectWizard from './pages/ProjectWizard';

export default function App() {
  return (
    <ProjectProvider>
      <Routes>
        <Route element={<PageShell />}>
          <Route index element={<Dashboard />} />
          <Route path="projects/new" element={<ProjectWizard />} />
          <Route path="materials" element={<Placeholder title="Materials Calculator" />} />
          <Route path="compliance" element={<Placeholder title="Compliance Checklist" />} />
          <Route path="ecological" element={<Placeholder title="Ecological Scoring" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ProjectProvider>
  );
}

function Placeholder({ title }) {
  return (
    <div className="flex items-center justify-center h-64 text-gray-500">
      <p className="text-lg">{title} — coming soon</p>
    </div>
  );
}
