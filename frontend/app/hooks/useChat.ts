import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '../lib/types';
import { api } from '../lib/api';

interface UseChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (content: string) => Promise<void>;
  abortStream: () => void;
  suggestions: string[];
  loadMessages: (conversationId: string) => Promise<void>;
}

export function useChat(conversationId: string | null, departmentId: string, federated: boolean = false): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const convIdRef = useRef(conversationId);

  useEffect(() => {
    convIdRef.current = conversationId;
  }, [conversationId]);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const msgs = await api.fetch<ChatMessage[]>(`/conversations/${convId}/messages`);
      setMessages(msgs);
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    } else {
      setMessages([]);
    }
    setSuggestions([]);
  }, [conversationId, loadMessages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    // Add user message optimistically
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId || '',
      role: 'user',
      content,
      sources: [],
      confidence: null,
      feedback: null,
      feedback_details: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setSuggestions([]);

    // Add placeholder assistant message
    const assistantMsg: ChatMessage = {
      id: `temp-assistant-${Date.now()}`,
      conversation_id: conversationId || '',
      role: 'assistant',
      content: '',
      sources: [],
      confidence: null,
      feedback: null,
      feedback_details: null,
      created_at: new Date().toISOString(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let fullContent = '';
      let sources: ChatMessage['sources'] = [];
      let confidence: number | null = null;
      let finalMessageId = assistantMsg.id;
      let finalConversationId = conversationId || '';
      let federatedRouting: ChatMessage['federatedRouting'] = undefined;

      for await (const event of api.streamChat(
        '/chat',
        {
          message: content,
          conversation_id: conversationId || undefined,
          department_id: departmentId,
          federated,
        },
        controller.signal
      )) {
        try {
          const parsed = JSON.parse(event.data);

          if (event.event === 'content') {
            fullContent += parsed.text || '';
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                updated[lastIdx] = { ...updated[lastIdx], content: fullContent };
              }
              return updated;
            });
          } else if (event.event === 'sources') {
            sources = parsed;
          } else if (event.event === 'suggestions') {
            setSuggestions(parsed);
          } else if (event.event === 'done') {
            confidence = parsed.confidence ?? null;
          } else if (event.event === 'message_complete') {
            finalMessageId = parsed.message_id || finalMessageId;
            finalConversationId = parsed.conversation_id || finalConversationId;
          } else if (event.event === 'federation_routing') {
            federatedRouting = parsed;
          }
        } catch {
          // Skip malformed events
        }
      }

      // Finalize the assistant message
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
          updated[lastIdx] = {
            ...updated[lastIdx],
            id: finalMessageId,
            conversation_id: finalConversationId,
            content: fullContent,
            sources,
            confidence,
            isStreaming: false,
            federatedRouting,
          };
        }
        return updated;
      });

      // Return the conversation ID for navigation
      if (!conversationId && finalConversationId) {
        window.dispatchEvent(
          new CustomEvent('conversation-created', { detail: { conversationId: finalConversationId } })
        );
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].isStreaming) {
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: updated[lastIdx].content + '\n\n*[Response stopped]*',
              isStreaming: false,
            };
          }
          return updated;
        });
      } else {
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].isStreaming) {
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: 'An error occurred while generating the response. Please try again.',
              isStreaming: false,
            };
          }
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const abortStream = () => {
    abortRef.current?.abort();
  };

  return { messages, isStreaming, sendMessage, abortStream, suggestions, loadMessages };
}
