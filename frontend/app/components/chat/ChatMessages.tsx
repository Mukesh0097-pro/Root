import React, { useRef, useEffect } from 'react';
import type { ChatMessage as ChatMessageType } from '../../lib/types';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { MessageSquare } from 'lucide-react';

interface ChatMessagesProps {
  messages: ChatMessageType[];
  isStreaming: boolean;
  suggestions: string[];
  onSuggestionClick: (text: string) => void;
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

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col gap-4" data-lenis-prevent>
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}

      {isStreaming && messages[messages.length - 1]?.content === '' && (
        <TypingIndicator />
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
