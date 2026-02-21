import { useState, useEffect, useCallback } from 'react';
import type { DocumentItem } from '../lib/types';
import { api, ApiError } from '../lib/api';

interface UseDocumentsReturn {
  documents: DocumentItem[];
  isLoading: boolean;
  uploadDocument: (file: File, meta: { title: string; description?: string; category?: string; tags?: string }, departmentId: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  error: string | null;
}

export function useDocuments(departmentId: string): UseDocumentsReturn {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!departmentId) return;
    try {
      const data = await api.fetch<DocumentItem[]>(`/documents?department_id=${departmentId}`);
      setDocuments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll for processing documents
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'processing');
    if (!hasProcessing) return;

    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [documents, refresh]);

  const uploadDocument = async (
    file: File,
    meta: { title: string; description?: string; category?: string; tags?: string },
    deptId: string
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', meta.title);
    formData.append('department_id', deptId);
    if (meta.description) formData.append('description', meta.description);
    if (meta.category) formData.append('category', meta.category);
    if (meta.tags) formData.append('tags', meta.tags);

    await api.uploadFile('/documents/upload', formData);
    await refresh();
  };

  const deleteDocument = async (id: string) => {
    await api.fetch(`/documents/${id}`, { method: 'DELETE' });
    await refresh();
  };

  return { documents, isLoading, uploadDocument, deleteDocument, refresh, error };
}
