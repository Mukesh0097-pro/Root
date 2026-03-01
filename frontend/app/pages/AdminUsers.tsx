import React, { useState, useRef } from 'react';
import { UserPlus, Upload } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAdminUsers } from '../hooks/useAdmin';
import { UserTable } from '../components/admin/UserTable';
import { InviteUserModal } from '../components/admin/InviteUserModal';

export default function AdminUsers() {
  const { user } = useAuth();
  const departmentId = user?.department_id || '';
  const { users, isLoading, inviteUser, updateUser, resendInvite, importUsersCSV } = useAdminUsers(departmentId);
  const [showInvite, setShowInvite] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: { row: number; error: string; email: string }[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importUsersCSV(file);
      setImportResult({ imported: result.imported, errors: result.errors });
    } catch {
      setImportResult({ imported: 0, errors: [{ row: 0, error: 'Upload failed', email: '' }] });
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-root-muted text-sm mt-1">{users.length} users in your department</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 bg-root-card border border-white/10 text-root-text px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-white/5 transition-colors"
          >
            <Upload size={16} />
            Import CSV
          </button>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 bg-root-accent text-root-bg px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-white transition-colors"
          >
            <UserPlus size={16} />
            Invite User
          </button>
        </div>
      </div>

      {importResult && (
        <div className="mb-4 bg-root-card border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-white font-bold">Import Results</p>
            <button onClick={() => setImportResult(null)} className="text-xs text-root-muted hover:text-white">Dismiss</button>
          </div>
          <p className="text-sm text-green-400">{importResult.imported} users imported successfully</p>
          {importResult.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-red-400">{importResult.errors.length} errors:</p>
              {importResult.errors.slice(0, 5).map((err, i) => (
                <p key={i} className="text-xs text-root-muted">Row {err.row}: {err.error} {err.email && `(${err.email})`}</p>
              ))}
            </div>
          )}
        </div>
      )}

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
            onResendInvite={resendInvite}
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
