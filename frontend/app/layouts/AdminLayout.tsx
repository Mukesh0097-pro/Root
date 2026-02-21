import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, BarChart3, ArrowLeft } from 'lucide-react';

const ADMIN_NAV = [
  { label: 'Dashboard', href: '/app/admin', icon: LayoutDashboard, end: true },
  { label: 'Documents', href: '/app/admin/documents', icon: FileText },
  { label: 'Users', href: '/app/admin/users', icon: Users },
  { label: 'Analytics', href: '/app/admin/analytics', icon: BarChart3 },
];

export function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full">
      {/* Admin Sidebar */}
      <aside className="hidden lg:flex w-56 bg-root-card/50 border-r border-white/10 flex-col shrink-0">
        <div className="p-4 border-b border-white/10">
          <button
            onClick={() => navigate('/app/chat')}
            className="flex items-center gap-2 text-sm text-root-muted hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Chat
          </button>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {ADMIN_NAV.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-root-accent/10 text-root-accent'
                    : 'text-root-muted hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Admin Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}
