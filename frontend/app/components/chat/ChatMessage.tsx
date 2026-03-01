import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Copy, Check, Network, Share2, AlertTriangle } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../../lib/types';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { SourcePreview } from './SourcePreview';
import { api } from '../../lib/api';

const FEEDBACK_OPTIONS = [
  'Incorrect information',
  'Missing important details',
  'Sources not relevant',
  "Didn't answer my question",
  'Too technical / Too simple',
  'Other',
];

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(message.feedback);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [reported, setReported] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackChecks, setFeedbackChecks] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/app/chat/${message.conversation_id}`;
    await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleReport = async () => {
    if (message.id.startsWith('temp-') || reported) return;
    try {
      await api.fetch(`/chat/messages/${message.id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ feedback: 'down', details: JSON.stringify({ reasons: ['Reported by user'], comment: 'Message reported' }) }),
      });
    } catch { /* silent */ }
    setReported(true);
  };

  const toggleFeedbackCheck = (option: string) => {
    setFeedbackChecks((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
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
    const details = JSON.stringify({
      reasons: feedbackChecks,
      comment: feedbackText,
    });
    try {
      await api.fetch(`/chat/messages/${message.id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ feedback: 'down', details }),
      });
    } catch { /* silent */ }
    setShowFeedbackForm(false);
    setFeedbackSubmitted(true);
    setFeedbackChecks([]);
    setFeedbackText('');
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
              className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors ${feedback === 'up' ? 'bg-green-500/20 text-green-400' : 'text-root-muted hover:text-white hover:bg-white/5'
                }`}
              aria-label="Helpful"
            >
              <ThumbsUp size={14} />
              {feedback === 'up' && (
                <span className="text-xs">Helpful</span>
              )}
            </button>
            <button
              onClick={() => handleFeedback('down')}
              className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors ${feedback === 'down' ? 'bg-red-500/20 text-red-400' : 'text-root-muted hover:text-white hover:bg-white/5'
                }`}
              aria-label="Not helpful"
            >
              <ThumbsDown size={14} />
              {feedback === 'down' && (
                <span className="text-xs">Not helpful</span>
              )}
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-root-muted hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Copy response"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg text-root-muted hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Share conversation"
            >
              {shared ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
            </button>
            <button
              onClick={handleReport}
              className={`p-1.5 rounded-lg transition-colors ${reported ? 'text-orange-400 bg-orange-500/10' : 'text-root-muted hover:text-orange-400 hover:bg-orange-500/10'}`}
              aria-label="Report message"
              disabled={reported}
            >
              <AlertTriangle size={14} />
            </button>
          </div>
        )}

        {/* Detailed feedback form — checklist */}
        {showFeedbackForm && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-xs font-bold text-root-muted mb-3">What was wrong with this response?</p>
            <div className="flex flex-col gap-2 mb-3">
              {FEEDBACK_OPTIONS.map((option) => (
                <label key={option} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={feedbackChecks.includes(option)}
                    onChange={() => toggleFeedbackCheck(option)}
                    className="w-3.5 h-3.5 rounded border-white/20 bg-root-bg text-root-accent focus:ring-root-accent/50 accent-root-accent"
                  />
                  <span className="text-sm text-root-text group-hover:text-white transition-colors">
                    {option}
                  </span>
                </label>
              ))}
            </div>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Additional comments (optional)..."
              className="w-full bg-root-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none resize-none"
              rows={2}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={submitDetailedFeedback}
                disabled={feedbackChecks.length === 0}
                className="px-3 py-1.5 bg-root-accent text-root-bg text-xs font-bold rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Feedback
              </button>
              <button
                onClick={() => { setShowFeedbackForm(false); setFeedbackChecks([]); setFeedbackText(''); }}
                className="px-3 py-1.5 text-xs text-root-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Feedback submitted confirmation */}
        {feedbackSubmitted && !showFeedbackForm && feedback === 'down' && (
          <div className="mt-2 text-xs text-root-muted">
            <Check size={12} className="inline mr-1 text-green-400" />
            Thanks for your feedback
          </div>
        )}
      </div>
    </div>
  );
}
