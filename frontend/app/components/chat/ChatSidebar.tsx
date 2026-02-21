import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, MessageSquare, Pencil, Trash2, Check, X } from 'lucide-react';
import type { ConversationGroup } from '../../lib/types';
import { DepartmentSelector } from '../common/DepartmentSelector';

interface ChatSidebarProps {
  groups: ConversationGroup[];
  activeConversationId: string | null;
  departmentId: string;
  onDepartmentChange: (id: string) => void;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ChatSidebar({
  groups,
  activeConversationId,
  departmentId,
  onDepartmentChange,
  onRename,
  onDelete,
}: ChatSidebarProps) {
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const confirmEdit = async () => {
    if (editingId && editTitle.trim()) {
      await onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
    if (activeConversationId === id) {
      navigate('/app/chat');
    }
  };

  return (
    <aside className="hidden lg:flex w-80 bg-root-card/50 border-r border-white/10 flex-col shrink-0">
      {/* New Chat + Department */}
      <div className="p-4 flex flex-col gap-3 border-b border-white/10">
        <button
          onClick={() => navigate('/app/chat')}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-root-accent text-root-bg font-bold text-sm rounded-lg hover:bg-white transition-colors"
        >
          <Plus size={16} />
          New Chat
        </button>
        <DepartmentSelector value={departmentId} onChange={onDepartmentChange} />
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-3" data-lenis-prevent>
        {groups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-root-muted text-sm">No conversations yet</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-4">
              <h3 className="text-xs font-bold text-root-muted uppercase tracking-wider px-2 mb-2">
                {group.label}
              </h3>
              <div className="flex flex-col gap-0.5">
                {group.conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group relative flex items-center rounded-lg cursor-pointer transition-colors ${
                      conv.id === activeConversationId
                        ? 'bg-root-accent/10 border border-root-accent/20'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {editingId === conv.id ? (
                      <div className="flex items-center gap-1 w-full px-2 py-2">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 bg-root-bg border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') setEditingId(null); }}
                        />
                        <button onClick={confirmEdit} className="p-1 text-green-400 hover:bg-white/10 rounded">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-root-muted hover:bg-white/10 rounded">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate(`/app/chat/${conv.id}`)}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-left"
                        >
                          <MessageSquare size={14} className="text-root-muted shrink-0" />
                          <span className="text-sm text-root-text truncate">{conv.title}</span>
                        </button>
                        <div className="hidden group-hover:flex items-center gap-0.5 absolute right-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); startEdit(conv.id, conv.title); }}
                            className="p-1 rounded hover:bg-white/10 text-root-muted hover:text-white"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(conv.id); }}
                            className="p-1 rounded hover:bg-red-500/20 text-root-muted hover:text-red-400"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
