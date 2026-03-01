import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';

const BASE = (import.meta as any).env?.VITE_API_URL || '/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword || isSubmitting) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Something went wrong');
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate('/app/login'), 3000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-root-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-xl font-bold text-white mb-4">Invalid Reset Link</h1>
          <p className="text-root-muted text-sm mb-6">
            This password reset link is invalid or has expired.
          </p>
          <Link to="/app/forgot-password" className="text-root-accent hover:underline text-sm">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-root-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-root-accent mb-2">FedKnowledge</h1>
          <p className="text-root-muted">Create a new password</p>
        </div>

        <div className="bg-root-card border border-white/10 rounded-xl p-8">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Password Reset!</h2>
              <p className="text-root-muted text-sm mb-4">
                Your password has been updated. Redirecting to login...
              </p>
              <Link to="/app/login" className="text-root-accent text-sm hover:underline">
                Go to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-root-text mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="At least 8 characters"
                    className="w-full bg-root-bg border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none transition-colors"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-root-muted hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-root-text mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  placeholder="Re-enter your password"
                  className="w-full bg-root-bg border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none transition-colors"
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !password || !confirmPassword}
                className="bg-root-accent text-root-bg font-bold py-3 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>

              <div className="text-center">
                <Link
                  to="/app/login"
                  className="inline-flex items-center gap-2 text-root-accent text-sm hover:underline"
                >
                  <ArrowLeft size={14} />
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
