import React, { useState, useRef } from 'react';
import { Upload, FileText, X, ChevronRight, ChevronLeft } from 'lucide-react';

interface DocumentUploaderProps {
  onUpload: (file: File, meta: { title: string; description?: string; category?: string; tags?: string }) => Promise<void>;
  onClose: () => void;
}

const CATEGORIES = ['General', 'Policy', 'Technical', 'Training', 'Benefits', 'Compliance', 'Other'];

export function DocumentUploader({ onUpload, onClose }: DocumentUploaderProps) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    const allowed = ['pdf', 'docx', 'xlsx', 'csv', 'txt', 'md', 'png', 'jpg', 'jpeg'];
    if (!allowed.includes(ext)) {
      setError(`File type .${ext} is not supported`);
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit');
      return;
    }
    setFile(f);
    setTitle(f.name.replace(/\.[^/.]+$/, ''));
    setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsUploading(true);
    setError('');
    try {
      await onUpload(file, { title, description: description || undefined, category: category || undefined, tags: tags || undefined });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              s <= step ? 'bg-root-accent text-root-bg' : 'bg-white/10 text-root-muted'
            }`}>
              {s}
            </div>
            {s < 3 && <div className={`flex-1 h-0.5 ${s < step ? 'bg-root-accent' : 'bg-white/10'}`} />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-sm">{error}</div>
      )}

      {/* Step 1: File Selection */}
      {step === 1 && (
        <div>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-root-accent bg-root-accent/5' : 'border-white/10 hover:border-white/20'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} className="mx-auto mb-3 text-root-muted" />
            <p className="text-sm text-root-text mb-1">Drag & drop a file here, or click to browse</p>
            <p className="text-xs text-root-muted">PDF, DOCX, XLSX, CSV, TXT, MD, PNG, JPG — max 50MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            accept=".pdf,.docx,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg"
            className="hidden"
          />
          {file && (
            <div className="flex items-center gap-3 mt-4 bg-root-bg border border-white/10 rounded-lg p-3">
              <FileText size={20} className="text-root-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{file.name}</p>
                <p className="text-xs text-root-muted">{formatSize(file.size)}</p>
              </div>
              <button onClick={() => setFile(null)} className="text-root-muted hover:text-white">
                <X size={16} />
              </button>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setStep(2)}
              disabled={!file}
              className="flex items-center gap-1 bg-root-accent text-root-bg px-4 py-2 rounded-lg font-bold text-sm hover:bg-white transition-colors disabled:opacity-50"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Metadata */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-root-text mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-root-bg border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-root-accent/50 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-root-text mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-root-bg border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-root-accent/50 focus:outline-none resize-none"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-root-text mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-root-bg border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-root-accent/50 focus:outline-none"
            >
              <option value="">Select category...</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-root-text mb-1">Tags (comma-separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. policy, hr, onboarding"
              className="w-full bg-root-bg border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none"
            />
          </div>
          <div className="flex justify-between mt-2">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-root-muted hover:text-white text-sm">
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!title}
              className="flex items-center gap-1 bg-root-accent text-root-bg px-4 py-2 rounded-lg font-bold text-sm hover:bg-white transition-colors disabled:opacity-50"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="bg-root-bg border border-white/10 rounded-lg p-4">
            <h4 className="text-sm font-bold text-white mb-3">Upload Summary</h4>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-root-muted">File:</span>
                <span className="text-root-text">{file?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-root-muted">Size:</span>
                <span className="text-root-text">{file ? formatSize(file.size) : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-root-muted">Title:</span>
                <span className="text-root-text">{title}</span>
              </div>
              {category && (
                <div className="flex justify-between">
                  <span className="text-root-muted">Category:</span>
                  <span className="text-root-text">{category}</span>
                </div>
              )}
              {tags && (
                <div className="flex justify-between">
                  <span className="text-root-muted">Tags:</span>
                  <span className="text-root-text">{tags}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-root-muted hover:text-white text-sm">
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUploading}
              className="bg-root-accent text-root-bg px-6 py-2 rounded-lg font-bold text-sm hover:bg-white transition-colors disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload & Process'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
