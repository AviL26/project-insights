import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Compass, FlaskConical, ShieldCheck, Leaf } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects/new', icon: Compass, label: 'New Project' },
  { to: '/materials', icon: FlaskConical, label: 'Materials' },
  { to: '/compliance', icon: ShieldCheck, label: 'Compliance' },
  { to: '/ecological', icon: Leaf, label: 'Ecological' },
];

export default function PageShell() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-eco-blue-800 text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-eco-blue-700">
          <h1 className="text-xl font-bold tracking-tight">ECOncrete</h1>
          <p className="text-eco-blue-300 text-xs mt-1">Project Insights</p>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-eco-blue-700 text-white'
                    : 'text-eco-blue-200 hover:bg-eco-blue-700/50 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {NAV_ITEMS.find(n => n.to === location.pathname)?.label || 'ECOncrete'}
          </h2>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
