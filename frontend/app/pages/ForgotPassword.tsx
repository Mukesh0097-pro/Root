import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

const BASE = (import.meta as any).env?.VITE_API_URL || '/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Something went wrong');
        return;
      }
      setSubmitted(true);
      // MVP: token returned directly for testing
      if (data.reset_token) {
        setResetToken(data.reset_token);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-root-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-root-accent mb-2">FedKnowledge</h1>
          <p className="text-root-muted">Reset your password</p>
        </div>

        <div className="bg-root-card border border-white/10 rounded-xl p-8">
          {submitted ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Check your email</h2>
              <p className="text-root-muted text-sm mb-6">
                If an account with <span className="text-white">{email}</span> exists, we've sent a password reset link.
              </p>

              {/* MVP: Show reset link directly */}
              {resetToken && (
                <div className="bg-root-bg border border-white/10 rounded-lg p-4 mb-6 text-left">
                  <p className="text-xs text-root-muted mb-2">MVP Mode — Reset Link:</p>
                  <Link
                    to={`/app/reset-password?token=${resetToken}`}
                    className="text-root-accent text-sm hover:underline break-all"
                  >
                    Click here to reset password
                  </Link>
                </div>
              )}

              <Link
                to="/app/login"
                className="inline-flex items-center gap-2 text-root-accent text-sm hover:underline"
              >
                <ArrowLeft size={14} />
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-root-muted text-sm mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-root-text mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full bg-root-bg border border-white/10 rounded-lg px-4 py-3 pl-10 text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none transition-colors"
                      autoComplete="email"
                      required
                    />
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-root-muted" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="bg-root-accent text-root-bg font-bold py-3 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/app/login"
                  className="inline-flex items-center gap-2 text-root-accent text-sm hover:underline"
                >
                  <ArrowLeft size={14} />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
