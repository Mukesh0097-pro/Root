import React, { useState } from 'react';
import { Modal } from '../common/Modal';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  onInvite: (data: { email: string; first_name: string; last_name: string; role: string; department_id: string }) => Promise<{ user: unknown; temp_password: string }>;
}

export function InviteUserModal({ isOpen, onClose, departmentId, onInvite }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('employee');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ temp_password: string } | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const res = await onInvite({ email, first_name: firstName, last_name: lastName, role, department_id: departmentId });
      setResult({ temp_password: res.temp_password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setRole('employee');
    setResult(null);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite User">
      {result ? (
        <div className="flex flex-col gap-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-400 font-bold mb-2">User invited successfully!</p>
            <p className="text-sm text-root-text mb-2">Share these credentials with the user:</p>
            <div className="bg-root-bg rounded-lg p-3 font-mono text-sm">
              <p className="text-root-muted">Email: <span className="text-white">{email}</span></p>
              <p className="text-root-muted">Password: <span className="text-root-accent">{result.temp_password}</span></p>
            </div>
          </div>
          <button onClick={handleClose} className="bg-root-accent text-root-bg py-2 rounded-lg font-bold hover:bg-white transition-colors">
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-root-text mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-root-bg border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-root-text mb-1">First Name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-root-bg border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-root-text mb-1">Last Name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-root-bg border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-root-text mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-root-bg border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-root-accent/50 focus:outline-none"
            >
              <option value="employee">Employee</option>
              <option value="dept_admin">Department Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-root-accent text-root-bg py-2.5 rounded-lg font-bold hover:bg-white transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Inviting...' : 'Send Invitation'}
          </button>
        </form>
      )}
    </Modal>
  );
}
