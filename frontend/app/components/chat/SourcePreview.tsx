import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import type { SourceCitation } from '../../lib/types';

interface SourcePreviewProps {
  sources: SourceCitation[];
}

export function SourcePreview({ sources }: SourcePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources.length) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-root-muted hover:text-root-accent transition-colors"
      >
        <FileText size={14} />
        <span>Sources ({sources.length})</span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isExpanded && (
        <div className="mt-2 flex flex-col gap-2">
          {sources.map((source, i) => (
            <div
              key={i}
              className="bg-root-bg/50 border border-white/5 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-root-text truncate">
                    {source.title}
                  </span>
                  {source.department_name && (
                    <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded bg-root-accent/10 text-root-accent border border-root-accent/20">
                      {source.department_name}
                    </span>
                  )}
                </div>
                {source.page && (
                  <span className="text-xs text-root-muted ml-2 shrink-0">Page {source.page}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 h-1.5 bg-root-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-root-accent rounded-full"
                    style={{ width: `${Math.round(source.score * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-root-muted">{Math.round(source.score * 100)}%</span>
              </div>
              <p className="text-xs text-root-muted line-clamp-2">{source.text_preview}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
