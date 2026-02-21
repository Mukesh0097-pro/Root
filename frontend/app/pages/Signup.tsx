import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';
import type { Department } from '../lib/types';
import { api } from '../lib/api';

export default function Signup() {
  const { register, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [departmentCode, setDepartmentCode] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeptOpen, setIsDeptOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/app/chat', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    api.fetch<Department[]>('/auth/departments')
      .then(setDepartments)
      .catch(() => {});
  }, []);

  const selectedDept = departments.find((d) => d.code === departmentCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !departmentCode || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        department_code: departmentCode,
      });
      navigate('/app/chat', { replace: true });
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-root-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-root-accent mb-2">FedKnowledge</h1>
          <p className="text-root-muted">Create your account</p>
        </div>

        <div className="bg-root-card border border-white/10 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-root-text mb-1.5">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); clearError(); }}
                  placeholder="John"
                  className="w-full bg-root-bg border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none transition-colors"
                  autoComplete="given-name"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-root-text mb-1.5">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); clearError(); }}
                  placeholder="Doe"
                  className="w-full bg-root-bg border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none transition-colors"
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="signupEmail" className="block text-sm font-medium text-root-text mb-1.5">
                Email
              </label>
              <input
                id="signupEmail"
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
              <label htmlFor="signupPassword" className="block text-sm font-medium text-root-text mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="signupPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  placeholder="Create a password"
                  className="w-full bg-root-bg border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder-white/30 focus:border-root-accent/50 focus:outline-none transition-colors"
                  autoComplete="new-password"
                  required
                  minLength={8}
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

            <div>
              <label className="block text-sm font-medium text-root-text mb-1.5">
                Department
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDeptOpen(!isDeptOpen)}
                  className="flex items-center gap-2 w-full bg-root-bg border border-white/10 rounded-lg px-4 py-3 text-left hover:border-root-accent/30 transition-colors"
                >
                  <span className={`flex-1 truncate ${selectedDept ? 'text-white' : 'text-white/30'}`}>
                    {selectedDept?.name || 'Select your department'}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-root-muted transition-transform ${isDeptOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isDeptOpen && departments.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-root-card border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                    {departments.map((dept) => (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => {
                          setDepartmentCode(dept.code);
                          setIsDeptOpen(false);
                          clearError();
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                          dept.code === departmentCode
                            ? 'bg-root-accent/10 text-root-accent'
                            : 'text-root-text hover:bg-white/5'
                        }`}
                      >
                        {dept.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !firstName || !lastName || !email || !password || !departmentCode}
              className="bg-root-accent text-root-bg font-bold py-3 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-root-muted text-sm">
            Already have an account?{' '}
            <Link to="/app/login" className="text-root-accent hover:underline">
              Sign in
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
