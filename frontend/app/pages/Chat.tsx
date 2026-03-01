import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { useConversations } from '../hooks/useConversations';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatMessages } from '../components/chat/ChatMessages';
import { ChatInput } from '../components/chat/ChatInput';
import { Bell, Settings, User, LogOut, ChevronDown, KeyRound } from 'lucide-react';

export default function Chat() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [departmentId, setDepartmentId] = useState(user?.department_id || '');
  const [federated, setFederated] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.department_id && !departmentId) {
      setDepartmentId(user.department_id);
    }
  }, [user, departmentId]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setShowSettings(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const { messages, isStreaming, sendMessage, abortStream, suggestions } = useChat(conversationId || null, departmentId, federated);
  const { groups, renameConversation, deleteConversation, starConversation, refresh } = useConversations(departmentId);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      // Cmd/Ctrl+N → new conversation
      if (mod && e.key === 'n') {
        e.preventDefault();
        navigate('/app/chat');
      }
      // Cmd/Ctrl+K → focus sidebar search
      if (mod && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('aside input[placeholder*="Search"]');
        searchInput?.focus();
      }
      // Esc → close all dropdowns
      if (e.key === 'Escape') {
        setShowProfileMenu(false);
        setShowNotifications(false);
        setShowSettings(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

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

  const handleLogout = () => {
    logout();
    navigate('/app/login');
  };

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : '??';

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-root-card/30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-root-accent">FedKnowledge</span>
          <span className="text-xs text-root-muted hidden sm:inline">AI Assistant</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Notifications Bell */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); setShowSettings(false); }}
              className="p-2 rounded-lg text-root-muted hover:text-white hover:bg-white/5 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-root-card border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10">
                  <h3 className="text-sm font-bold text-white">Notifications</h3>
                </div>
                <div className="p-6 text-center">
                  <Bell size={24} className="text-root-muted mx-auto mb-2" />
                  <p className="text-sm text-root-muted">No new notifications</p>
                </div>
              </div>
            )}
          </div>

          {/* Settings Gear */}
          <div ref={settingsRef} className="relative">
            <button
              onClick={() => { setShowSettings(!showSettings); setShowProfileMenu(false); setShowNotifications(false); }}
              className="p-2 rounded-lg text-root-muted hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
            {showSettings && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-root-card border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10">
                  <h3 className="text-sm font-bold text-white">Quick Settings</h3>
                </div>
                <div className="p-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-root-text">Notifications</span>
                    <span className="text-xs text-root-muted">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-root-text">Theme</span>
                    <span className="text-xs text-root-muted">Dark</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-root-text">Language</span>
                    <span className="text-xs text-root-muted">English</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); setShowSettings(false); }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-root-accent/20 flex items-center justify-center">
                <span className="text-xs font-bold text-root-accent">{initials}</span>
              </div>
              <span className="text-sm text-root-text hidden sm:inline max-w-[100px] truncate">
                {user?.first_name}
              </span>
              <ChevronDown size={14} className="text-root-muted hidden sm:inline" />
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-root-card border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-bold text-white">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-root-muted">{user?.email}</p>
                  <p className="text-xs text-root-accent mt-1 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate('/app/billing'); }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-root-text hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <User size={16} className="text-root-muted" />
                    My Account
                  </button>
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate('/app/forgot-password'); }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-root-text hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <KeyRound size={16} className="text-root-muted" />
                    Change Password
                  </button>
                  <div className="my-1 border-t border-white/10" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 min-h-0">
        <ChatSidebar
          groups={groups}
          activeConversationId={conversationId || null}
          departmentId={departmentId}
          onDepartmentChange={handleDepartmentChange}
          onRename={renameConversation}
          onDelete={deleteConversation}
          onStar={starConversation}
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
    </div>
  );
}
