import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAdminUsers } from '../hooks/useAdmin';
import { UserTable } from '../components/admin/UserTable';
import { InviteUserModal } from '../components/admin/InviteUserModal';

export default function AdminUsers() {
  const { user } = useAuth();
  const departmentId = user?.department_id || '';
  const { users, isLoading, inviteUser, updateUser } = useAdminUsers(departmentId);
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-root-muted text-sm mt-1">{users.length} users in your department</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 bg-root-accent text-root-bg px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-white transition-colors"
        >
          <UserPlus size={16} />
          Invite User
        </button>
      </div>

      <div className="bg-root-card border border-white/10 rounded-xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-root-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <UserTable
            users={users}
            onDeactivate={(userId, isActive) => updateUser(userId, { is_active: isActive })}
            onChangeRole={(userId, role) => updateUser(userId, { role })}
          />
        )}
      </div>

      <InviteUserModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        departmentId={departmentId}
        onInvite={inviteUser}
      />
    </div>
  );
}
