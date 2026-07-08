import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from './utils/apiBase';
import { saveSession, tryLegacyLogin, getLegacyAdminUser } from './utils/authSession';
import { getDefaultRoute } from './utils/permissions';
import { BRAND_LOGO_URL } from './utils/brandAssets';
import { DEFAULT_ADMIN_AUTH } from './utils/adminConfig';
import BrandTitle from './components/BrandTitle';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Always overwrite in case older adminAuth exists in localStorage.
    localStorage.setItem('adminAuth', JSON.stringify(DEFAULT_ADMIN_AUTH));

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
      setError('Unable to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-[#13204A] via-[#1E2F5F] to-[#0B1F3A] p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-white opacity-5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="w-full max-w-112.5 space-y-8 z-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-4 bg-white px-7 py-4 rounded-2xl shadow-2xl border border-[#19C7BF]/25">
            <img src={BRAND_LOGO_URL} alt="Harihar Printers" className="h-12 w-12 object-contain" />
            <BrandTitle size="md" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-300 transform hover:scale-[1.01]">
          <div className="p-8 sm:p-10">
            <div className="text-center mb-10">
              <h1 className="text-2xl font-bold text-[#1E2F5F] mb-2">Welcome Back !</h1>
              <p className="text-gray-500 text-sm font-medium">
                Sign in to continue to{' '}
                <span className="font-bold text-[#19C7BF]">Harihar Printers</span>
              </p>
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
