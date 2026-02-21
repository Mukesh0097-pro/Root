import { useState, useEffect, useCallback } from 'react';
import type { DashboardMetrics, AnalyticsData, User } from '../lib/types';
import { api } from '../lib/api';

export function useDashboard(departmentId: string) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!departmentId) {
      setIsLoading(false);
      setMetrics({
        queries_today: 0,
        total_documents: 0,
        active_users: 0,
        satisfaction_pct: 0,
        recent_activity: [],
      });
      return;
    }
    try {
      const data = await api.fetch<DashboardMetrics>(`/admin/dashboard?department_id=${departmentId}`);
      setMetrics(data);
    } catch {
      setMetrics({
        queries_today: 0,
        total_documents: 0,
        active_users: 0,
        satisfaction_pct: 0,
        recent_activity: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, [departmentId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { metrics, isLoading, refresh };
}

export function useAdminUsers(departmentId: string) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!departmentId) return;
    try {
      const data = await api.fetch<User[]>(`/admin/users?department_id=${departmentId}`);
      setUsers(data);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [departmentId]);

  useEffect(() => { refresh(); }, [refresh]);

  const inviteUser = async (data: { email: string; first_name: string; last_name: string; role: string; department_id: string }) => {
    const result = await api.fetch<{ user: User; temp_password: string }>('/admin/users/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await refresh();
    return result;
  };

  const updateUser = async (userId: string, data: { role?: string; is_active?: boolean }) => {
    await api.fetch(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    await refresh();
  };

  return { users, isLoading, refresh, inviteUser, updateUser };
}

export function useAnalytics(departmentId: string, period: string = '30d') {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!departmentId) {
      setIsLoading(false);
      setData({
        query_volume: [],
        top_queries: [],
        satisfaction: { up: 0, down: 0, neutral: 0 },
        avg_response_time: 0,
        documents_by_status: {},
        active_users_trend: [],
      });
      return;
    }
    setIsLoading(true);
    api.fetch<AnalyticsData>(`/admin/analytics?department_id=${departmentId}&period=${period}`)
      .then(setData)
      .catch(() => {
        setData({
          query_volume: [],
          top_queries: [],
          satisfaction: { up: 0, down: 0, neutral: 0 },
          avg_response_time: 0,
          documents_by_status: {},
          active_users_trend: [],
        });
      })
      .finally(() => setIsLoading(false));
  }, [departmentId, period]);

  return { data, isLoading };
}
