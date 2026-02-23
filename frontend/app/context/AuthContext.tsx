import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, LoginResponse, RegisterRequest } from '../lib/types';
import { api, ApiError } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validateSession = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Try to restore cached user first for instant UI
    const cachedUser = localStorage.getItem('user_data');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch { }
    }

    try {
      const userData = await api.fetch<User>('/auth/me');
      setUser(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
    } catch (err) {
      // Only clear tokens on explicit auth failure (401), not network errors
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        setUser(null);
      }
      // On network errors (Render cold start, timeout), keep the user logged in
      // The cached user data will still be shown
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const data = await api.fetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      setUser(data.user);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  };

  const register = async (data: RegisterRequest) => {
    setError(null);
    try {
      const resp = await api.fetch<LoginResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      localStorage.setItem('access_token', resp.access_token);
      localStorage.setItem('refresh_token', resp.refresh_token);
      localStorage.setItem('user_data', JSON.stringify(resp.user));
      setUser(resp.user);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Registration failed';
      setError(message);
      throw err;
    }
  };

  const googleLogin = async (credential: string) => {
    setError(null);
    try {
      const resp = await api.fetch<LoginResponse>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });
      localStorage.setItem('access_token', resp.access_token);
      localStorage.setItem('refresh_token', resp.refresh_token);
      localStorage.setItem('user_data', JSON.stringify(resp.user));
      setUser(resp.user);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Google sign-in failed';
      setError(message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        googleLogin,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
