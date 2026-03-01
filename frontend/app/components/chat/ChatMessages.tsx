import React, { useRef, useEffect, useState } from 'react';
import type { ChatMessage as ChatMessageType } from '../../lib/types';
import { ChatMessage } from './ChatMessage';
import { MessageSquare, Brain, Search, Sparkles } from 'lucide-react';

interface ChatMessagesProps {
  messages: ChatMessageType[];
  isStreaming: boolean;
  suggestions: string[];
  onSuggestionClick: (text: string) => void;
}

const PROGRESS_STAGES = [
  { label: 'Understanding query...', icon: Brain, delay: 0 },
  { label: 'Searching documents...', icon: Search, delay: 600 },
  { label: 'Generating answer...', icon: Sparkles, delay: 1400 },
];

function QueryProgressIndicator({ hasContent }: { hasContent: boolean }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (hasContent) {
      setStage(2);
      return;
    }
    const timers = PROGRESS_STAGES.slice(1).map((s, i) =>
      setTimeout(() => setStage(i + 1), s.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [hasContent]);

  return (
    <div className="flex justify-start">
      <div className="bg-root-card/60 border border-white/10 rounded-2xl rounded-bl-md px-5 py-4 max-w-[70%]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-root-muted">FedKnowledge AI</span>
        </div>
        <div className="flex flex-col gap-2">
          {PROGRESS_STAGES.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === stage;
            const isDone = i < stage;
            return (
              <div
                key={s.label}
                className={`flex items-center gap-2.5 transition-all duration-300 ${
                  i > stage ? 'opacity-30' : 'opacity-100'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  isDone
                    ? 'bg-green-500/20 text-green-400'
                    : isActive
                    ? 'bg-root-accent/20 text-root-accent'
                    : 'bg-white/5 text-root-muted'
                }`}>
                  <Icon size={12} />
                </div>
                <span className={`text-sm ${
                  isActive ? 'text-root-accent font-medium' : isDone ? 'text-green-400' : 'text-root-muted'
                }`}>
                  {s.label}
                </span>
                {isActive && !hasContent && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-root-accent animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ChatMessages({ messages, isStreaming, suggestions, onSuggestionClick }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center p-8" data-lenis-prevent>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-root-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={32} className="text-root-accent" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Start a Conversation</h2>
          <p className="text-root-muted text-sm mb-6">
            Ask questions about your uploaded documents. FedKnowledge will search through your knowledge base and provide accurate answers with source citations.
          </p>
          <div className="flex flex-col gap-2">
            {[
              'What topics are covered in my documents?',
              'Summarize the key points from the uploaded files',
              'What policies are mentioned in the documentation?',
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => onSuggestionClick(prompt)}
                className="text-left px-4 py-3 bg-root-card/60 border border-white/10 rounded-lg text-sm text-root-text hover:border-root-accent/30 hover:text-root-accent transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const lastMsg = messages[messages.length - 1];
  const showProgress = isStreaming && lastMsg?.role === 'assistant' && lastMsg?.content === '';

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col gap-4" data-lenis-prevent>
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}

      {showProgress && (
        <QueryProgressIndicator hasContent={false} />
      )}

      {/* Follow-up suggestions */}
      {suggestions.length > 0 && !isStreaming && (
        <div className="flex flex-wrap gap-2 mt-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick(s)}
              className="px-3 py-2 bg-root-card/60 border border-white/10 rounded-lg text-sm text-root-text hover:border-root-accent/30 hover:text-root-accent transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
