import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { useConversations } from '../hooks/useConversations';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatMessages } from '../components/chat/ChatMessages';
import { ChatInput } from '../components/chat/ChatInput';

export default function Chat() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [departmentId, setDepartmentId] = useState(user?.department_id || '');
  const [federated, setFederated] = useState(false);

  useEffect(() => {
    if (user?.department_id && !departmentId) {
      setDepartmentId(user.department_id);
    }
  }, [user, departmentId]);

  const { messages, isStreaming, sendMessage, abortStream, suggestions } = useChat(conversationId || null, departmentId, federated);
  const { groups, renameConversation, deleteConversation, refresh } = useConversations(departmentId);

  // Listen for new conversation creation
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.conversationId) {
        navigate(`/app/chat/${detail.conversationId}`, { replace: true });
        refresh();
      }
    };
    window.addEventListener('conversation-created', handler);
    return () => window.removeEventListener('conversation-created', handler);
  }, [navigate, refresh]);

  // Refresh conversation list after streaming completes
  useEffect(() => {
    if (!isStreaming && messages.length > 0) {
      refresh();
    }
  }, [isStreaming]);

  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content);
    },
    [sendMessage]
  );

  const handleDepartmentChange = (id: string) => {
    setDepartmentId(id);
    navigate('/app/chat');
  };

  return (
    <div className="flex h-full">
      <ChatSidebar
        groups={groups}
        activeConversationId={conversationId || null}
        departmentId={departmentId}
        onDepartmentChange={handleDepartmentChange}
        onRename={renameConversation}
        onDelete={deleteConversation}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <ChatMessages
          messages={messages}
          isStreaming={isStreaming}
          suggestions={suggestions}
          onSuggestionClick={handleSend}
        />
        <ChatInput
          onSend={handleSend}
          isStreaming={isStreaming}
          onAbort={abortStream}
          federated={federated}
          onFederatedChange={setFederated}
        />
      </div>
    </div>
  );
}
