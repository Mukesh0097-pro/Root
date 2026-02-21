import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Copy, Check, Network } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../../lib/types';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { SourcePreview } from './SourcePreview';
import { api } from '../../lib/api';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(message.feedback);
  const [copied, setCopied] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackDetails, setFeedbackDetails] = useState('');

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (type: 'up' | 'down') => {
    if (message.id.startsWith('temp-')) return;
    setFeedback(type);
    if (type === 'down') {
      setShowFeedbackForm(true);
      return;
    }
    try {
      await api.fetch(`/chat/messages/${message.id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ feedback: type }),
      });
    } catch { /* silent */ }
  };

  const submitDetailedFeedback = async () => {
    if (message.id.startsWith('temp-')) return;
    try {
      await api.fetch(`/chat/messages/${message.id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ feedback: 'down', details: feedbackDetails }),
      });
    } catch { /* silent */ }
    setShowFeedbackForm(false);
    setFeedbackDetails('');
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] lg:max-w-[70%] rounded-2xl px-5 py-4 ${isUser
            ? 'bg-root-accent/10 border border-root-accent/20 rounded-br-md'
            : 'bg-root-card/60 border border-white/10 rounded-bl-md'
          }`}
      >
        {/* Label */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-bold ${isUser ? 'text-root-accent' : 'text-root-muted'}`}>
            {isUser ? 'You' : 'FedKnowledge AI'}
          </span>
          <span className="text-xs text-root-muted">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Federated Routing Info */}
        {!isUser && message.federatedRouting && message.federatedRouting.length > 0 && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Network size={12} className="text-root-accent shrink-0" />
            <span className="text-xs text-root-muted">Searched:</span>
            {message.federatedRouting.map((route, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-root-accent/10 text-root-accent border border-root-accent/20"
              >
                {route.department_name}
                <span className="text-root-muted">{Math.round(route.similarity * 100)}%</span>
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className={`text-sm leading-relaxed ${isUser ? 'text-root-text' : 'text-root-text'}`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        {/* Streaming cursor */}
        {message.isStreaming && (
          <span className="inline-block w-2 h-4 bg-root-accent animate-pulse ml-0.5" />
        )}

        {/* Sources */}
        {!isUser && message.sources.length > 0 && (
          <SourcePreview sources={message.sources} />
        )}

        {/* Confidence */}
        {!isUser && message.confidence !== null && message.confidence > 0 && !message.isStreaming && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
            <span className="text-xs text-root-muted">Confidence:</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((dot) => (
                <span
                  key={dot}
                  className={`w-1.5 h-1.5 rounded-full ${dot <= Math.round((message.confidence || 0) / 20)
                      ? 'bg-root-accent'
                      : 'bg-white/20'
                    }`}
                />
              ))}
            </div>
            <span className="text-xs text-root-muted">{Math.round(message.confidence || 0)}%</span>
          </div>
        )}

        {/* Actions */}
        {!isUser && !message.isStreaming && message.content && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
            <button
              onClick={() => handleFeedback('up')}
              className={`p-1.5 rounded-lg transition-colors ${feedback === 'up' ? 'bg-green-500/20 text-green-400' : 'text-root-muted hover:text-white hover:bg-white/5'
                }`}
              aria-label="Helpful"
            >
              <ThumbsUp size={14} />
            </button>
            <button
              onClick={() => handleFeedback('down')}
              className={`p-1.5 rounded-lg transition-colors ${feedback === 'down' ? 'bg-red-500/20 text-red-400' : 'text-root-muted hover:text-white hover:bg-white/5'
                }`}
              aria-label="Not helpful"
            >
              <ThumbsDown size={14} />
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-root-muted hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Copy response"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
        )}

        {/* Detailed feedback form */}
        {showFeedbackForm && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-xs text-root-muted mb-2">What was wrong with this response?</p>
            <textarea
              value={feedbackDetails}
              onChange={(e) => setFeedbackDetails(e.target.value)}
              placeholder="Tell us what could be improved..."
              className="w-full bg-root-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none resize-none"
              rows={2}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={submitDetailedFeedback}
                className="px-3 py-1.5 bg-root-accent text-root-bg text-xs font-bold rounded-lg hover:bg-white transition-colors"
              >
                Submit
              </button>
              <button
                onClick={() => setShowFeedbackForm(false)}
                className="px-3 py-1.5 text-xs text-root-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
