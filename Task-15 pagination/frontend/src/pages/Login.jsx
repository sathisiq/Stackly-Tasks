import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Lock, Mail, AlertCircle, ArrowRight, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fromPath = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail, demoPw) => {
    setEmail(demoEmail);
    setPassword(demoPw);
    setError(null);
    setLoading(true);

    try {
      await login(demoEmail, demoPw);
      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-200">
            <ShoppingBag size={24} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Sign in to access your account, orders, and cart
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                Sign In <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Box */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
            Instant Test Login (Click to Fill & Sign In)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('admin@ecommerce.com', 'admin123')}
              className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Shield size={14} /> Demo Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('customer@ecommerce.com', 'customer123')}
              className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <User size={14} /> Demo Customer
            </button>
          </div>
        </div>

        {/* Sign up link */}
        <p className="text-center text-xs text-slate-500 font-medium">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-indigo-600 hover:underline">
            Create an account
          </Link>
        </p>

      </div>
    </div>
  );
}
