import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              width?: number;
              type?: string;
              shape?: string;
              text?: string;
              logo_alignment?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function Login() {
  const { login, googleLogin, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate('/app/chat', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    setIsGoogleLoading(true);
    clearError();
    try {
      await googleLogin(response.credential);
      navigate('/app/chat', { replace: true });
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsGoogleLoading(false);
    }
  }, [googleLogin, clearError, navigate]);

  // Initialize native Google Sign-In button (only if client ID is configured)
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(googleButtonRef.current!, {
        theme: 'filled_black',
        size: 'large',
        width: 400,
        type: 'standard',
        shape: 'rectangular',
        text: 'signin_with',
        logo_alignment: 'left',
      });
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initializeGoogle();
        }
      }, 100);
      const timeout = setTimeout(() => clearInterval(interval), 10000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [handleGoogleResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/app/chat', { replace: true });
    } catch {
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom Google button click (used when GOOGLE_CLIENT_ID is not set)
  const handleCustomGoogleClick = () => {
    if (GOOGLE_CLIENT_ID && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      alert('Google Sign-In is not configured yet. Please set VITE_GOOGLE_CLIENT_ID in your .env file.');
    }
  };

  return (
    <div className="min-h-screen bg-root-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-root-accent mb-2">FedKnowledge</h1>
          <p className="text-root-muted">Sign in to your account</p>
        </div>

        <div className="bg-root-card border border-white/10 rounded-xl p-8">
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
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                placeholder="you@company.com"
                className="w-full bg-root-bg border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none transition-colors"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-root-text mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  placeholder="Enter your password"
                  className="w-full bg-root-bg border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none transition-colors"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-root-muted hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="bg-root-accent text-root-bg font-bold py-3 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-root-muted text-xs uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google Sign-In — always visible */}
          <div className="flex justify-center">
            {isGoogleLoading ? (
              <div className="flex items-center gap-2 py-3 text-root-muted text-sm">
                <div className="w-4 h-4 border-2 border-root-accent border-t-transparent rounded-full animate-spin" />
                Signing in with Google...
              </div>
            ) : GOOGLE_CLIENT_ID ? (
              /* Native GSI button rendered here when client ID is configured */
              <div ref={googleButtonRef} />
            ) : (
              /* Custom styled Google button fallback */
              <button
                type="button"
                onClick={handleCustomGoogleClick}
                className="flex items-center gap-3 w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all group"
              >
                {/* Google G logo SVG */}
                <svg width="20" height="20" viewBox="0 0 48 48" className="flex-shrink-0">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">
                  Sign in with Google
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-root-muted text-sm">
            Don't have an account?{' '}
            <Link to="/app/signup" className="text-root-accent hover:underline">
              Sign up
            </Link>
          </p>
          <p className="text-root-muted text-sm">
            <Link to="/app/forgot-password" className="text-root-accent hover:underline">
              Forgot your password?
            </Link>
          </p>
          <p className="text-root-muted text-sm">
            <a href="/" className="text-root-accent hover:underline">Back to website</a>
          </p>
        </div>
      </div>
    </div>
  );
}
