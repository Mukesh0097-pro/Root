import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentList } from '../components/documents/DocumentList';
import { DocumentUploader } from '../components/documents/DocumentUploader';
import { Modal } from '../components/common/Modal';

export default function AdminDocuments() {
  const { user } = useAuth();
  const departmentId = user?.department_id || '';
  const { documents, isLoading, uploadDocument, deleteDocument } = useDocuments(departmentId);
  const [showUploader, setShowUploader] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const filtered = documents.filter((d) => {
    if (statusFilter && d.status !== statusFilter) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleUpload = async (file: File, meta: { title: string; description?: string; category?: string; tags?: string }) => {
    await uploadDocument(file, meta, departmentId);
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-root-muted text-sm mt-1">{documents.length} documents in your department</p>
        </div>
        <button
          onClick={() => setShowUploader(true)}
          className="flex items-center gap-2 bg-root-accent text-root-bg px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-white transition-colors"
        >
          <Upload size={16} />
          Upload Document
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents..."
          className="flex-1 max-w-xs bg-root-bg border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-root-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-root-text focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="ready">Ready</option>
          <option value="processing">Processing</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="bg-root-card border border-white/10 rounded-xl">
        <DocumentList documents={filtered} onDelete={deleteDocument} isLoading={isLoading} />
      </div>

      <Modal isOpen={showUploader} onClose={() => setShowUploader(false)} title="Upload Document" maxWidth="max-w-xl">
        <DocumentUploader
          onUpload={handleUpload}
          onClose={() => setShowUploader(false)}
        />
      </Modal>
    </div>
  );
}
