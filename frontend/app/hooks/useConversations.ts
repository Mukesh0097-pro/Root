import { useState, useEffect, useCallback } from 'react';
import type { Conversation, ConversationGroup } from '../lib/types';
import { api } from '../lib/api';

interface UseConversationsReturn {
  groups: ConversationGroup[];
  conversations: Conversation[];
  isLoading: boolean;
  createConversation: () => void;
  renameConversation: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  starConversation: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useConversations(departmentId: string): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!departmentId) return;
    try {
      const data = await api.fetch<Conversation[]>(`/conversations?department_id=${departmentId}`);
      setConversations(data);
    } catch {
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createConversation = () => {
    // Just signals to navigate to /app/chat without an ID
    // The actual creation happens when the first message is sent
  };

  const renameConversation = async (id: string, title: string) => {
    await api.fetch(`/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
    await refresh();
  };

  const deleteConversation = async (id: string) => {
    await api.fetch(`/conversations/${id}`, { method: 'DELETE' });
    await refresh();
  };

  const starConversation = async (id: string) => {
    await api.fetch(`/conversations/${id}/star`, { method: 'PATCH' });
    await refresh();
  };

  const groups = groupConversations(conversations);

  return {
    groups,
    conversations,
    isLoading,
    createConversation,
    renameConversation,
    deleteConversation,
    starConversation,
    refresh,
  };
}

function groupConversations(conversations: Conversation[]): ConversationGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeek = new Date(today.getTime() - 7 * 86400000);

  const groups: ConversationGroup[] = [
    { label: 'Starred', conversations: [] },
    { label: 'Today', conversations: [] },
    { label: 'Yesterday', conversations: [] },
    { label: 'Last 7 Days', conversations: [] },
    { label: 'Older', conversations: [] },
  ];

  for (const conv of conversations) {
    if (conv.is_starred) {
      groups[0].conversations.push(conv);
      continue;
    }
    const date = new Date(conv.updated_at);
    if (date >= today) {
      groups[1].conversations.push(conv);
    } else if (date >= yesterday) {
      groups[2].conversations.push(conv);
    } else if (date >= lastWeek) {
      groups[3].conversations.push(conv);
    } else {
      groups[4].conversations.push(conv);
    }
  }

  return groups.filter((g) => g.conversations.length > 0);
}
