import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Paperclip, X, Network } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  onAbort: () => void;
  disabled?: boolean;
  federated: boolean;
  onFederatedChange: (federated: boolean) => void;
}

export function ChatInput({ onSend, isStreaming, onAbort, disabled, federated, onFederatedChange }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CHARS = 2000;
  const MAX_FILES = 3;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 192) + 'px'; // max 6 rows ~192px
    }
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim() || isStreaming || disabled) return;
    onSend(value.trim());
    setValue('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.size <= MAX_FILE_SIZE);
    setAttachments((prev) => [...prev, ...valid].slice(0, MAX_FILES));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-white/10 bg-root-card/50 p-4">
      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((file, i) => (
            <div key={i} className="flex items-center gap-2 bg-root-bg border border-white/10 rounded-lg px-3 py-1.5 text-sm">
              <span className="text-root-text truncate max-w-[150px]">{file.name}</span>
              <button onClick={() => removeAttachment(i)} className="text-root-muted hover:text-white">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={attachments.length >= MAX_FILES || isStreaming}
          className="p-2.5 rounded-lg text-root-muted hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30"
          aria-label="Attach file"
        >
          <Paperclip size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept=".pdf,.docx,.txt,.xlsx,.csv,.md,.png,.jpg,.jpeg"
          multiple
          className="hidden"
        />

        {/* Federated Search Toggle */}
        <button
          onClick={() => onFederatedChange(!federated)}
          disabled={isStreaming}
          className={`p-2.5 rounded-lg transition-all duration-200 relative group ${federated
              ? 'bg-root-accent/15 text-root-accent border border-root-accent/30'
              : 'text-root-muted hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          aria-label="Toggle federated search"
          title={federated ? 'Federated search: ON — searching across departments' : 'Federated search: OFF — searching your department only'}
        >
          <Network size={18} />
          {federated && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-root-accent rounded-full animate-pulse" />
          )}
          {/* Tooltip */}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-root-card border border-white/10 rounded-lg text-xs text-root-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
            {federated ? '🔗 Federated: searching all departments' : '🔒 Local: searching your department only'}
          </span>
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Upload documents to start chatting...' : federated ? 'Ask across all departments...' : 'Ask a question about your documents...'}
            disabled={disabled || isStreaming}
            rows={1}
            className="w-full bg-root-bg border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none resize-none disabled:opacity-50 transition-colors"
          />
          <span className="absolute bottom-1.5 right-3 text-xs text-root-muted">
            {value.length}/{MAX_CHARS}
          </span>
        </div>

        {isStreaming ? (
          <button
            onClick={onAbort}
            className="p-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors shrink-0"
            aria-label="Stop generating"
          >
            <Square size={18} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            className="p-2.5 rounded-xl bg-root-accent text-root-bg hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
