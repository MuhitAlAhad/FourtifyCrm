import React, { useState } from 'react';
import { Lock, Mail, ArrowLeft, AlertCircle, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authApi, AuthUser } from '../../services/api';
import logo from '../../assets/35f931b802bf39733103d00f96fb6f9c21293f6e.png';

interface CRMLoginPageProps {
  onLogin: (user: AuthUser, token: string) => void;
  onNavigateToRegister: () => void;
}

export function CRMLoginPage({ onLogin, onNavigateToRegister }: CRMLoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });

      if (response.success && response.token && response.user) {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
        onLogin(response.user, response.token);
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err: unknown) {
      // Parse error message from response
      if (err instanceof Error) {
        setError(err.message.replace('API Error: ', ''));
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1a] via-[#0f1623] to-[#1a2332] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Fourtify CRM" className="h-16" />
          </div>
          <p className="text-gray-400">Admin Portal Access</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#0f1623] border border-[#1a2332] rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-500 text-sm">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">Email Addresssssss</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fourtify.com"
                  className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1a2332] border border-[#2a3442] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg transition-all font-semibold ${loading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-[#0a0f1a] hover:shadow-lg hover:shadow-[#00ff88]/20'
                }`}
            >
              {loading ? 'Signing in...' : 'Access CRM Portal'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 pt-6 border-t border-[#1a2332]">
            <button
              onClick={onNavigateToRegister}
              className="w-full flex items-center justify-center gap-2 py-3 text-gray-400 hover:text-[#00ff88] transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              <span>Request Admin Access</span>
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">DISP Compliant • Defence Grade Security</p>
            <p className="text-xs text-gray-500 mt-2">Internal Use Only - Authorized Personnel</p>
          </div>
        </div>
      </div>
    </div>
  );
}
