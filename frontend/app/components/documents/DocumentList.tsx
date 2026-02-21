import React from 'react';
import { FileText, Trash2, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import type { DocumentItem } from '../../lib/types';

interface DocumentListProps {
  documents: DocumentItem[];
  onDelete: (id: string) => void;
  isLoading: boolean;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  processing: { icon: <Loader size={14} className="animate-spin" />, label: 'Processing', color: 'text-yellow-400 bg-yellow-400/10' },
  ready: { icon: <CheckCircle size={14} />, label: 'Ready', color: 'text-green-400 bg-green-400/10' },
  error: { icon: <AlertCircle size={14} />, label: 'Error', color: 'text-red-400 bg-red-400/10' },
};

export function DocumentList({ documents, onDelete, isLoading }: DocumentListProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={24} className="text-root-accent animate-spin" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText size={32} className="mx-auto mb-3 text-root-muted" />
        <p className="text-root-muted text-sm">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left text-xs font-bold text-root-muted uppercase tracking-wider py-3 px-4">Document</th>
            <th className="text-left text-xs font-bold text-root-muted uppercase tracking-wider py-3 px-4">Type</th>
            <th className="text-left text-xs font-bold text-root-muted uppercase tracking-wider py-3 px-4">Size</th>
            <th className="text-left text-xs font-bold text-root-muted uppercase tracking-wider py-3 px-4">Category</th>
            <th className="text-left text-xs font-bold text-root-muted uppercase tracking-wider py-3 px-4">Status</th>
            <th className="text-left text-xs font-bold text-root-muted uppercase tracking-wider py-3 px-4">Chunks</th>
            <th className="text-left text-xs font-bold text-root-muted uppercase tracking-wider py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => {
            const status = STATUS_CONFIG[doc.status] || STATUS_CONFIG.error;
            return (
              <tr key={doc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-4">
                  <div>
                    <p className="text-sm text-white font-medium truncate max-w-[200px]">{doc.title}</p>
                    <p className="text-xs text-root-muted truncate max-w-[200px]">{doc.original_name}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs font-mono text-root-muted uppercase">{doc.file_type}</span>
                </td>
                <td className="py-3 px-4 text-sm text-root-muted">{formatSize(doc.file_size)}</td>
                <td className="py-3 px-4 text-sm text-root-muted">{doc.category || '—'}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold ${status.color}`}>
                    {status.icon}
                    {status.label}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-root-muted">{doc.chunk_count || '—'}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onDelete(doc.id)}
                    className="p-1.5 rounded-lg text-root-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label="Delete document"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
