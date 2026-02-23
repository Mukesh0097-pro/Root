import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Settings, Shield, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/app/login');
  };

  const isAdmin = user?.role === 'dept_admin' || user?.role === 'company_admin';

  return (
    <div className="h-screen bg-root-bg flex flex-col">
      {/* Top Bar */}
      <header className="h-14 bg-root-card border-b border-white/10 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-root-muted"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-root-accent">FedKnowledge</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              to="/app/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-wider text-root-accent border border-root-accent/30 rounded-lg hover:bg-root-accent/10 transition-colors uppercase"
            >
              <Shield size={14} />
              Admin
            </Link>
          )}
          <Link
            to="/app/billing"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-root-muted hover:text-root-accent border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
          >
            <CreditCard size={14} />
            <span className="hidden sm:inline">Billing</span>
          </Link>
          <Link to="/app/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-root-accent/20 flex items-center justify-center text-root-accent text-sm font-bold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-white">{user?.first_name} {user?.last_name}</div>
              <div className="text-xs text-root-muted">{user?.department_name}</div>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-white/10 text-root-muted hover:text-white transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      {/* Mobile overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setShowMobileMenu(false)}>
          <div className="w-80 h-full bg-root-card border-r border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-white/10">
              <span className="text-lg font-bold text-root-accent">FedKnowledge</span>
            </div>
            <nav className="p-4 flex flex-col gap-2">
              <Link to="/app/chat" onClick={() => setShowMobileMenu(false)} className="px-3 py-2 rounded-lg text-root-text hover:bg-white/5">Chat</Link>
              <Link to="/app/billing" onClick={() => setShowMobileMenu(false)} className="px-3 py-2 rounded-lg text-root-text hover:bg-white/5">Billing & Plans</Link>
              {isAdmin && (
                <Link to="/app/admin" onClick={() => setShowMobileMenu(false)} className="px-3 py-2 rounded-lg text-root-text hover:bg-white/5">Admin Dashboard</Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
