import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAnalytics } from '../hooks/useAdmin';
import { AnalyticsCharts } from '../components/admin/AnalyticsCharts';
import { Loader } from 'lucide-react';

const PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30d');
  const { data, isLoading } = useAnalytics(user?.department_id || '', period);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-root-muted text-sm mt-1">Department activity and performance</p>
        </div>
        <div className="flex items-center gap-1 bg-root-card border border-white/10 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                period === p.value
                  ? 'bg-root-accent text-root-bg'
                  : 'text-root-muted hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader size={24} className="text-root-accent animate-spin" />
        </div>
      ) : (
        <>
          <AnalyticsCharts data={data} />

          {/* Top Queries Table */}
          <div className="mt-6 bg-root-card border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Top Queries</h3>
            {data.top_queries.length > 0 ? (
              <div className="flex flex-col">
                {data.top_queries.map((q, i) => (
                  <div key={i} className="flex items-center gap-4 py-2.5 border-b border-white/5 last:border-0">
                    <span className="text-sm font-bold text-root-muted w-6">{i + 1}</span>
                    <span className="flex-1 text-sm text-root-text truncate">{q.query}</span>
                    <span className="text-sm text-root-muted">{q.count} queries</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-root-muted text-sm text-center py-8">No queries yet</p>
            )}
          </div>

          {/* Response Time + Documents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-root-card border border-white/10 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-2">Avg Response Time</h3>
              <p className="text-3xl font-bold text-root-accent">{data.avg_response_time}s</p>
            </div>
            <div className="bg-root-card border border-white/10 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3">Documents by Status</h3>
              <div className="flex items-center gap-4">
                {Object.entries(data.documents_by_status).map(([status, count]) => (
                  <div key={status} className="text-center">
                    <p className="text-xl font-bold text-white">{count as number}</p>
                    <p className="text-xs text-root-muted capitalize">{status}</p>
                  </div>
                ))}
                {Object.keys(data.documents_by_status).length === 0 && (
                  <p className="text-root-muted text-sm">No documents</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
