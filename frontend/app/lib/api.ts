const BASE = (import.meta as any).env?.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private async refreshToken(): Promise<boolean> {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return false;
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      return true;
    } catch {
      return false;
    }
  }

  async fetch<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    const token = this.getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    let res = await fetch(`${BASE}${url}`, { ...options, headers });

    if (res.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers.set('Authorization', `Bearer ${this.getToken()}`);
        res = await fetch(`${BASE}${url}`, { ...options, headers });
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/app/login';
        throw new ApiError(401, 'Session expired');
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(res.status, error.detail || 'Request failed');
    }
    return res.json();
  }

  async *streamChat(
    url: string,
    body: object,
    signal?: AbortSignal
  ): AsyncGenerator<{ event: string; data: string }> {
    const token = this.getToken();
    const res = await fetch(`${BASE}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      throw new ApiError(res.status, 'Stream failed');
    }
    if (!res.body) throw new Error('No response body');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      let currentEvent = 'message';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          yield { event: currentEvent, data: line.slice(6) };
          currentEvent = 'message';
        }
      }
    }
  }

  async uploadFile(url: string, formData: FormData): Promise<unknown> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${url}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(res.status, error.detail || 'Upload failed');
    }
    return res.json();
  }
}

export const api = new ApiClient();
