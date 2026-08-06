import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, CheckCircle, AlertTriangle, Eye, EyeOff, Trash2, PackageX, Clock } from 'lucide-react';
import { API_BASE_URL } from './utils/apiBase';
import { getCurrentUser } from './utils/permissions';
import { DEFAULT_ADMIN_AUTH } from './utils/adminConfig';

const Settings = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [recentDeletions, setRecentDeletions] = useState([]);
  const [deletionsLoading, setDeletionsLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    setDeletionsLoading(true);
    fetch(`${API_BASE_URL}/api/paper-stock/deletions`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setRecentDeletions(data);
        setDeletionsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching recent deletions:', err);
        setDeletionsLoading(false);
      });
  }, []);

  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (formData.newPassword !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'New password and confirm password do not match.' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setStatus({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }

    if (currentUser?.email && currentUser.id !== 'local-admin') {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentUser.email,
            oldPassword: formData.oldPassword,
            newPassword: formData.newPassword,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          setStatus({ type: 'error', message: errorData.error || 'Failed to update password.' });
          return;
        }
        setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setStatus({ type: 'success', message: 'Password updated successfully! Next time you log in, use your new password.' });
        return;
      } catch (err) {
        setStatus({ type: 'error', message: 'Unable to update password on server.' });
        return;
      }
    }

    const storedAdmin = JSON.parse(localStorage.getItem('adminAuth') || JSON.stringify(DEFAULT_ADMIN_AUTH));
    if (formData.oldPassword !== storedAdmin.password) {
      setStatus({ type: 'error', message: 'Old password does not match our records.' });
      return;
    }

    const updatedAdmin = { ...storedAdmin, password: formData.newPassword };
    localStorage.setItem('adminAuth', JSON.stringify(updatedAdmin));
    setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setStatus({ type: 'success', message: 'Password updated successfully! Next time you log in, use your new password.' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mx-auto mt-8 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="bg-blue-600 w-1.5 h-6 rounded-full" />
            Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1 font-medium italic">Manage your account and activity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Security Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Account Security</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Keeping your password updated is essential for protecting your business data. We recommend using a strong password that you don't use elsewhere.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <PackageX size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Paper Stock</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              View recently deleted paper stock items below. These records are kept for audit purposes.
            </p>
          </div>

          <div className="bg-indigo-900 p-6 rounded-2xl shadow-xl text-white">
            <h3 className="font-bold mb-2">Need help?</h3>
            <p className="text-xs text-indigo-100/80 leading-relaxed mb-4">
              If you've forgotten your current password, please contact the developer for a manual reset.
            </p>
            <button
              type="button"
              onClick={() => navigate('/contact-support')}
              className="text-xs font-bold uppercase tracking-wider text-white border-b border-indigo-400 pb-0.5 hover:text-indigo-300 transition-colors"
            >
              Contact Developer
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Change Password Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-3">
              <Lock className="text-gray-400" size={20} />
              <h2 className="text-lg font-bold text-gray-800">Change Password</h2>
            </div>

            <div className="p-8">
              {status.message && (
                <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 animate-fade-in ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                  {status.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                  <p className="text-sm font-semibold">{status.message}</p>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-6 max-w-xl">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.old ? "text" : "password"}
                      name="oldPassword"
                      value={formData.oldPassword}
                      onChange={handleInputChange}
                      required
                      placeholder="••••••••"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('old')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPasswords.old ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        required
                        placeholder="••••••••"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        placeholder="••••••••"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-10 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all transform active:scale-95"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Listed Items Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800">Listed Items</h2>
              </div>
              <button
                onClick={() => navigate('/item-list')}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Manage Items →
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500">
                View and manage all items saved in the system — used across invoices, challans and job cards.
              </p>
              <button
                onClick={() => navigate('/item-list')}
                className="mt-4 inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
              >
                Open Item List
              </button>
            </div>
          </div>

          {/* ── Recent Deletions Section ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg text-red-500">
                <Trash2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Recently Deleted Paper Stock</h2>
                <p className="text-xs text-gray-400 mt-0.5">Last 20 deleted items — kept for audit trail</p>
              </div>
            </div>

            <div className="p-6">
              {deletionsLoading ? (
                <div className="flex items-center gap-3 text-gray-400 py-4">
                  <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : recentDeletions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <PackageX size={40} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">Koi bhi item delete nahi hua abhi tak</p>
                  <p className="text-xs mt-1 text-gray-300">Jab bhi koi paper stock item delete hoga, yahan dikhega</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentDeletions.map((txn) => (
                    <div
                      key={txn._id}
                      className="flex items-start justify-between gap-4 p-4 rounded-xl bg-red-50/50 border border-red-100 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="bg-red-100 p-1.5 rounded-lg text-red-400 mt-0.5 shrink-0">
                          <Trash2 size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">{txn.stockName || txn.paperName || 'Unnamed Item'}</p>
                          {txn.partyName && (
                            <p className="text-xs text-gray-500 mt-0.5">Party: {txn.partyName}</p>
                          )}
                          {txn.note && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{txn.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Qty: {txn.quantity || 0}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400 whitespace-nowrap">
                          <Clock size={10} />
                          {formatDate(txn.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
