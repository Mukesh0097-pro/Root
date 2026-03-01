import React, { useState, useEffect } from 'react';
import { Building2, Users, FileText, MessageSquare, Plus, Loader } from 'lucide-react';
import { api } from '../lib/api';

interface DepartmentInfo {
  id: string;
  name: string;
  code: string;
  user_count: number;
  document_count: number;
}

interface CompanyData {
  total_departments: number;
  total_users: number;
  total_documents: number;
  total_queries: number;
  departments: DepartmentInfo[];
}

export default function CompanyDashboard() {
  const [data, setData] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDept, setShowCreateDept] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchData = async () => {
    try {
      const result = await api.fetch<CompanyData>('/admin/company/dashboard');
      setData(result);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDepartment = async () => {
    if (!deptName.trim() || !deptCode.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      await api.fetch(`/admin/departments?name=${encodeURIComponent(deptName)}&code=${encodeURIComponent(deptCode)}&description=${encodeURIComponent(deptDesc)}`, {
        method: 'POST',
      });
      setShowCreateDept(false);
      setDeptName('');
      setDeptCode('');
      setDeptDesc('');
      await fetchData();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create department');
    } finally {
      setCreating(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size={24} className="text-root-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Company Overview</h1>
          <p className="text-root-muted text-sm mt-1">Organization-wide metrics and departments</p>
        </div>
        <button
          onClick={() => setShowCreateDept(true)}
          className="flex items-center gap-2 bg-root-accent text-root-bg px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-white transition-colors"
        >
          <Plus size={16} />
          Add Department
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-root-card border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Building2 size={18} className="text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{data.total_departments}</p>
          <p className="text-xs text-root-muted">Departments</p>
        </div>
        <div className="bg-root-card border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Users size={18} className="text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{data.total_users}</p>
          <p className="text-xs text-root-muted">Total Users</p>
        </div>
        <div className="bg-root-card border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <FileText size={18} className="text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{data.total_documents}</p>
          <p className="text-xs text-root-muted">Documents</p>
        </div>
        <div className="bg-root-card border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-root-accent/10 flex items-center justify-center">
              <MessageSquare size={18} className="text-root-accent" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{data.total_queries}</p>
          <p className="text-xs text-root-muted">Total Queries</p>
        </div>
      </div>

      {/* Department Cards */}
      <div className="bg-root-card border border-white/10 rounded-xl p-5">
        <h2 className="text-sm font-bold text-white mb-4">Departments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.departments.map((dept) => (
            <div key={dept.id} className="bg-root-bg/50 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={16} className="text-root-accent" />
                <h3 className="text-sm font-bold text-white">{dept.name}</h3>
                <span className="text-xs text-root-muted ml-auto">{dept.code}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Users size={12} className="text-root-muted" />
                  <span className="text-sm text-root-text">{dept.user_count} users</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText size={12} className="text-root-muted" />
                  <span className="text-sm text-root-text">{dept.document_count} docs</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Department Modal */}
      {showCreateDept && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-root-card border border-white/10 rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-bold text-white mb-4">Create Department</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-root-muted mb-1 block">Department Name</label>
                <input
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Engineering"
                  className="w-full bg-root-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-root-muted mb-1 block">Department Code</label>
                <input
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ENG"
                  className="w-full bg-root-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-root-muted mb-1 block">Description (Optional)</label>
                <input
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  placeholder="e.g. Software engineering team"
                  className="w-full bg-root-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none"
                />
              </div>
              {createError && (
                <p className="text-xs text-red-400">{createError}</p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleCreateDepartment}
                  disabled={creating || !deptName.trim() || !deptCode.trim()}
                  className="flex-1 bg-root-accent text-root-bg py-2 rounded-lg font-bold text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Department'}
                </button>
                <button
                  onClick={() => { setShowCreateDept(false); setCreateError(''); }}
                  className="px-4 py-2 text-sm text-root-muted hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
