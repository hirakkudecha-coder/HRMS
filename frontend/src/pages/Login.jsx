// Import React hooks, context, and router redirection
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, ShieldAlert, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  // Input form states - Pre-fill Employee role by default
  const [email, setEmail] = useState('employee@apex.com');
  const [password, setPassword] = useState(localStorage.getItem('autofill_password_employee') || 'password123');
  const [activeTab, setActiveTab] = useState('employee');
  
  // UI states
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Switch role tab and autofill credentials
  const handleTabChange = (role) => {
    setActiveTab(role);
    setError('');
    
    // Dynamic pre-fill from localStorage (synchronized upon password change) or default fallback
    const savedPassword = localStorage.getItem(`autofill_password_${role}`) || 'password123';
    
    if (role === 'employee') {
      setEmail('employee@apex.com');
      setPassword(savedPassword);
    } else if (role === 'manager') {
      setEmail('manager@apex.com');
      setPassword(savedPassword);
    } else if (role === 'admin') {
      setEmail('admin@apex.com');
      setPassword(savedPassword);
    }
  };

  // If user is already logged in, immediately redirect them to the dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation checks
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Redirect upon successful login
        navigate('/dashboard', { replace: true });
      } else {
        // Set error message returned from auth context
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-dark px-4 relative overflow-hidden">
      {/* Decorative Glowing Backdrop Orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-500/20 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-violet-500/20 blur-[120px] animate-pulse-slow"></div>

      {/* Back to Home Button — Fixed Top-Left */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-5 left-5 z-50 flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold transition-all duration-300 cursor-pointer active:scale-95 group px-3.5 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 backdrop-blur-sm"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to Home</span>
      </button>

      {/* Main Login Card Wrapper */}
      <div className="w-full max-w-md z-10 flex flex-col gap-4">
        {/* Company Identity Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-accent text-white shadow-xl shadow-brand-accent/30 font-extrabold text-xl mb-4">
            A
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            Apex <span className="text-brand-accent">HRMS</span>
          </h2>
          <p className="text-slate-400 text-sm mt-2">Manage your workplace portal, simplified.</p>
        </div>

        {/* Glassmorphic Login Form */}
        <div className="glass-panel rounded-3xl p-8 bg-slate-900/40 relative">
          <h3 className="text-xl font-bold text-white mb-2 capitalize">
            {activeTab} Sign In
          </h3>
          <p className="text-xs text-slate-400 mb-6">Select your role to pre-fill credentials</p>

          {/* RBAC Role Switcher Tabs */}
          <div className="flex p-1 bg-slate-950/60 rounded-2xl border border-white/5 mb-6 gap-1">
            <button
              type="button"
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold tracking-wider transition-all duration-300 ${
                activeTab === 'employee'
                  ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              onClick={() => handleTabChange('employee')}
            >
              Employee
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold tracking-wider transition-all duration-300 ${
                activeTab === 'manager'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              onClick={() => handleTabChange('manager')}
            >
              Manager
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold tracking-wider transition-all duration-300 ${
                activeTab === 'admin'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              onClick={() => handleTabChange('admin')}
            >
              Admin
            </button>
          </div>

          {/* Visual Error Callout Alert */}
          {error && (
            <div className="flex items-center gap-2.5 p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm animate-shake">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Work Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="glass-input"
                  style={{ paddingLeft: '3rem' }}
                  placeholder="name@apex.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Account Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="glass-input"
                  style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={submitting}
              className="glass-btn w-full mt-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
