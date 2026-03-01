export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'employee' | 'dept_admin' | 'company_admin';
  department_id: string;
  department_name?: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  code: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface Conversation {
  id: string;
  title: string;
  department_id: string;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationGroup {
  label: string;
  conversations: Conversation[];
}

export interface SourceCitation {
  title: string;
  page: number | null;
  score: number;
  text_preview: string;
  department_id?: string;
  department_name?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: SourceCitation[];
  confidence: number | null;
  feedback: 'up' | 'down' | null;
  feedback_details: string | null;
  created_at: string;
  isStreaming?: boolean;
  federatedRouting?: { department_id: string; department_name: string; similarity: number }[];
}

export interface DocumentItem {
  id: string;
  department_id: string;
  uploaded_by: string;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[];
  status: 'processing' | 'ready' | 'error';
  chunk_count: number;
  error_message: string | null;
  is_archived: boolean;
  created_at: string;
}

export interface DashboardMetrics {
  queries_today: number;
  total_documents: number;
  active_users: number;
  satisfaction_pct: number;
  recent_activity: ActivityItem[];
}

export interface ActivityItem {
  action: string;
  user_name: string;
  resource: string;
  timestamp: string;
}

export interface AnalyticsData {
  query_volume: { date: string; count: number }[];
  top_queries: { query: string; count: number }[];
  satisfaction: { up: number; down: number; neutral: number };
  avg_response_time: number;
  documents_by_status: Record<string, number>;
  active_users_trend: { date: string; count: number }[];
}

export interface SSEEvent {
  event: string;
  data: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  department_code: string;
}
