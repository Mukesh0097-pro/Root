import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDashboard, useAnalytics } from '../hooks/useAdmin';
import { MetricsCards } from '../components/admin/MetricsCards';
import { ActivityFeed } from '../components/admin/ActivityFeed';
import { Loader, Upload, UserPlus, BarChart3 } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { metrics, isLoading } = useDashboard(user?.department_id || '');
  const { data: analytics } = useAnalytics(user?.department_id || '', '30d');

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size={24} className="text-root-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-root-muted text-sm mt-1">
          Welcome back, {user?.first_name}. Here's your department overview.
        </p>
      </div>

      <MetricsCards metrics={metrics} />

      {/* Quick Actions */}
      <div className="mt-6 bg-root-card border border-white/10 rounded-xl p-5">
        <h2 className="text-sm font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/app/admin/documents')}
            className="flex items-center gap-3 px-4 py-3 bg-root-bg/50 border border-white/10 rounded-lg hover:border-root-accent/30 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Upload size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Upload Document</p>
              <p className="text-xs text-root-muted">Add to knowledge base</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/app/admin/users')}
            className="flex items-center gap-3 px-4 py-3 bg-root-bg/50 border border-white/10 rounded-lg hover:border-root-accent/30 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <UserPlus size={18} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Invite User</p>
              <p className="text-xs text-root-muted">Add team members</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/app/admin/analytics')}
            className="flex items-center gap-3 px-4 py-3 bg-root-bg/50 border border-white/10 rounded-lg hover:border-root-accent/30 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <BarChart3 size={18} className="text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">View Analytics</p>
              <p className="text-xs text-root-muted">Department insights</p>
            </div>
          </button>
        </div>
      </div>

      {/* Top Queries */}
      {analytics && analytics.top_queries.length > 0 && (
        <div className="mt-6 bg-root-card border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-bold text-white mb-4">Top Queries (Last 30 Days)</h2>
          <div className="flex flex-col">
            {analytics.top_queries.slice(0, 5).map((q, i) => (
              <div key={i} className="flex items-center gap-4 py-2.5 border-b border-white/5 last:border-0">
                <span className="text-sm font-bold text-root-muted w-6">{i + 1}</span>
                <span className="flex-1 text-sm text-root-text truncate">{q.query}</span>
                <span className="text-sm text-root-muted">{q.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 bg-root-card border border-white/10 rounded-xl p-5">
        <h2 className="text-sm font-bold text-white mb-4">Recent Activity</h2>
        <ActivityFeed activities={metrics.recent_activity} />
      </div>
    </div>
  );
}
