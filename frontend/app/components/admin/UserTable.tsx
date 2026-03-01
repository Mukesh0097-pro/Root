import React, { useState } from 'react';
import type { User } from '../../lib/types';

interface UserTableProps {
  users: User[];
  onDeactivate: (userId: string, isActive: boolean) => void;
  onChangeRole: (userId: string, role: string) => void;
  onResendInvite?: (userId: string) => Promise<{ temp_password: string }>;
}

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  company_admin: { label: 'Company Admin', color: 'bg-root-accent/20 text-root-accent' },
  dept_admin: { label: 'Dept Admin', color: 'bg-blue-400/20 text-blue-400' },
  employee: { label: 'Employee', color: 'bg-white/10 text-root-muted' },
};

export function UserTable({ users, onDeactivate, onChangeRole, onResendInvite }: UserTableProps) {
  const [resendResult, setResendResult] = useState<{ userId: string; password: string } | null>(null);

  const handleResend = async (userId: string) => {
    if (!onResendInvite) return;
    try {
      const result = await onResendInvite(userId);
      setResendResult({ userId, password: result.temp_password });
    } catch { /* silent */ }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left text-xs font-bold text-root-muted uppercase tracking-wider py-3 px-4">Name</th>
            <th className="text-left text-xs font-bold text-root-muted uppercase tracking-wider py-3 px-4">Email</th>
            <th className="text-left text-xs font-bold text-root-muted uppercase tracking-wider py-3 px-4">Role</th>
            <th className="text-left text-xs font-bold text-root-muted uppercase tracking-wider py-3 px-4">Status</th>
            <th className="text-left text-xs font-bold text-root-muted uppercase tracking-wider py-3 px-4">Last Login</th>
            <th className="text-left text-xs font-bold text-root-muted uppercase tracking-wider py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const badge = ROLE_BADGES[user.role] || ROLE_BADGES.employee;
            return (
              <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-root-accent/20 flex items-center justify-center text-root-accent text-xs font-bold">
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <span className="text-sm text-white font-medium">{user.first_name} {user.last_name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-root-muted">{user.email}</td>
                <td className="py-3 px-4">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${badge.color}`}>
                    {badge.label}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-sm text-root-muted">{user.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-root-muted">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => onChangeRole(user.id, e.target.value)}
                      className="bg-root-bg border border-white/10 rounded px-2 py-1 text-xs text-root-text focus:outline-none"
                    >
                      <option value="employee">Employee</option>
                      <option value="dept_admin">Dept Admin</option>
                      <option value="company_admin">Company Admin</option>
                    </select>
                    <button
                      onClick={() => onDeactivate(user.id, !user.is_active)}
                      className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                        user.is_active
                          ? 'text-red-400 hover:bg-red-500/10'
                          : 'text-green-400 hover:bg-green-500/10'
                      }`}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    {!user.last_login && onResendInvite && (
                      <button
                        onClick={() => handleResend(user.id)}
                        className="px-2 py-1 rounded text-xs font-bold text-blue-400 hover:bg-blue-500/10 transition-colors"
                      >
                        Resend
                      </button>
                    )}
                  </div>
                  {resendResult?.userId === user.id && (
                    <div className="mt-1 px-2 py-1 bg-blue-500/10 rounded text-xs text-blue-300">
                      New password: <code className="font-mono">{resendResult.password}</code>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
