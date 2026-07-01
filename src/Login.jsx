import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from './utils/apiBase';
import { saveSession, tryLegacyLogin, getLegacyAdminUser } from './utils/authSession';
import { getDefaultRoute } from './utils/permissions';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const admin = localStorage.getItem('adminAuth');
    if (!admin) {
      localStorage.setItem('adminAuth', JSON.stringify({
        email: 'admin@gmail.com',
        password: '123456',
      }));
    }

    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      if (!localStorage.getItem('currentUser')) {
        saveSession(getLegacyAdminUser());
      }
      navigate(getDefaultRoute());
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (response.ok) {
        const data = await response.json();
        saveSession(data.user);
        navigate(getDefaultRoute());
        window.location.reload();
        return;
      }

      const legacyUser = tryLegacyLogin(email.trim(), password);
      if (legacyUser) {
        navigate(getDefaultRoute());
        window.location.reload();
        return;
      }

      const errorData = await response.json().catch(() => ({}));
      setError(errorData.error || 'Invalid email or password. Please try again.');
    } catch (err) {
      const legacyUser = tryLegacyLogin(email.trim(), password);
      if (legacyUser) {
        navigate(getDefaultRoute());
        window.location.reload();
        return;
      }
      setError('Unable to connect to server. Try again or use admin@gmail.com / 123456');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-blue-600 via-indigo-700 to-purple-800 p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-white opacity-5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="w-full max-w-112.5 space-y-8 z-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-xl shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white">
              <Building size={24} />
            </div>
            <div className="text-left leading-tight">
              <div className="text-xl font-bold text-gray-900 tracking-tight">HARIHAR</div>
              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">PRINTERS</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-300 transform hover:scale-[1.01]">
          <div className="p-8 sm:p-10">
            <div className="text-center mb-10">
              <h1 className="text-2xl font-bold text-blue-900 mb-2">Welcome Back !</h1>
              <p className="text-gray-400 text-sm font-medium">Sign in to continue to Harihar Printers</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 animate-slide-up">
                <AlertCircle className="text-red-500" size={20} />
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-widest ml-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email address"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800 placeholder:text-gray-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-widest ml-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800 placeholder:text-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#1bc5a3] hover:bg-[#19b493] disabled:opacity-70 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-[#1bc5a350] transition-all transform active:scale-95"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <p className="text-center text-white/50 text-xs font-medium tracking-wide">
          &copy; {new Date().getFullYear()} Harihar Printers. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
