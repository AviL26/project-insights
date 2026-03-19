import { Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import PageShell from './components/layout/PageShell';
import Dashboard from './pages/Dashboard';
import ProjectWizard from './pages/ProjectWizard';
import Materials from './pages/Materials';
import Compliance from './pages/Compliance';
import Ecological from './pages/Ecological';

export default function App() {
  return (
    <ProjectProvider>
      <Routes>
        <Route element={<PageShell />}>
          <Route index element={<Dashboard />} />
          <Route path="projects/new" element={<ProjectWizard />} />
          <Route path="materials" element={<Materials />} />
          <Route path="compliance" element={<Compliance />} />
          <Route path="ecological" element={<Ecological />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ProjectProvider>
  );
}
