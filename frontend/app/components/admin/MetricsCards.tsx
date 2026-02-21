import React from 'react';
import { MessageSquare, FileText, Users, TrendingUp } from 'lucide-react';
import type { DashboardMetrics } from '../../lib/types';

interface MetricsCardsProps {
  metrics: DashboardMetrics;
}

const CARDS = [
  { key: 'queries_today', label: 'Queries Today', icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { key: 'total_documents', label: 'Total Documents', icon: FileText, color: 'text-green-400', bg: 'bg-green-400/10' },
  { key: 'active_users', label: 'Active Users', icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { key: 'satisfaction_pct', label: 'Satisfaction', icon: TrendingUp, color: 'text-root-accent', bg: 'bg-root-accent/10' },
] as const;

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const values: Record<string, string> = {
    queries_today: String(metrics.queries_today),
    total_documents: String(metrics.total_documents),
    active_users: String(metrics.active_users),
    satisfaction_pct: `${metrics.satisfaction_pct}%`,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map((card) => (
        <div key={card.key} className="bg-root-card border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-root-muted uppercase tracking-wider">{card.label}</span>
            <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center`}>
              <card.icon size={16} className={card.color} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{values[card.key]}</div>
        </div>
      ))}
    </div>
  );
}
