import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useAdmin';
import { MetricsCards } from '../components/admin/MetricsCards';
import { ActivityFeed } from '../components/admin/ActivityFeed';
import { Loader } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { metrics, isLoading } = useDashboard(user?.department_id || '');

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

      <div className="mt-6 bg-root-card border border-white/10 rounded-xl p-5">
        <h2 className="text-sm font-bold text-white mb-4">Recent Activity</h2>
        <ActivityFeed activities={metrics.recent_activity} />
      </div>
    </div>
  );
}
