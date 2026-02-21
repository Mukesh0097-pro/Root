import React from 'react';
import type { ActivityItem } from '../../lib/types';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const ACTION_LABELS: Record<string, string> = {
  login: 'logged in',
  register: 'registered',
  chat_query: 'asked a question',
  document_upload: 'uploaded a document',
  document_delete: 'deleted a document',
  user_invite: 'invited a user',
  user_update: 'updated a user',
  feedback: 'submitted feedback',
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (!activities.length) {
    return (
      <div className="text-center py-8 text-root-muted text-sm">
        No recent activity
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {activities.map((activity, i) => (
        <div
          key={i}
          className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0"
        >
          <div className="w-2 h-2 rounded-full bg-root-accent mt-2 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-root-text">
              <span className="font-medium text-white">{activity.user_name}</span>
              {' '}
              {ACTION_LABELS[activity.action] || activity.action}
            </p>
            <p className="text-xs text-root-muted mt-0.5">
              {new Date(activity.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
